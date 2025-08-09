import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './database';

export class MigrationService {
  static async migrateFromAsyncStorage(): Promise<boolean> {
    try {
      // Check if migration has already been done
      const migrationDone = await AsyncStorage.getItem('migration_completed');
      if (migrationDone === 'true') {
        return true;
      }

      console.log('Starting migration from AsyncStorage to SQLite...');

      // Get existing data from AsyncStorage
      const [userData, financialGoals, appSettings] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('financialGoals'),
        AsyncStorage.getItem('appSettings'),
      ]);

      // Migrate user data and expenses
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        
        // Migrate user settings
        if (parsedUserData.salary) {
          await DatabaseService.updateUserSettings({
            salary: parsedUserData.salary,
            salary_date: parsedUserData.salaryDate || new Date().toISOString(),
          });
        }

        // Migrate expenses
        if (parsedUserData.monthlyExpenses && Array.isArray(parsedUserData.monthlyExpenses)) {
          for (const expense of parsedUserData.monthlyExpenses) {
            await DatabaseService.addExpense({
              id: expense.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              amount: expense.amount,
              category: expense.category,
              date: expense.date,
              mood: expense.mood,
              note: expense.note,
            });
          }
        }
      }

      // Migrate financial goals
      if (financialGoals) {
        const parsedGoals = JSON.parse(financialGoals);
        if (Array.isArray(parsedGoals)) {
          for (const goal of parsedGoals) {
            await DatabaseService.addFinancialGoal({
              id: goal.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              title: goal.title,
              target_amount: goal.targetAmount,
              current_amount: goal.currentAmount || 0,
              deadline: goal.deadline,
              category: goal.category,
              emoji: goal.emoji,
            });
          }
        }
      }

      // Migrate app settings
      if (appSettings) {
        const parsedSettings = JSON.parse(appSettings);
        await DatabaseService.updateUserSettings({
          dark_mode: parsedSettings.darkMode || false,
          notifications_enabled: parsedSettings.notifications !== false,
          daily_reminder: parsedSettings.dailyReminder !== false,
          reminder_time: parsedSettings.reminderTime || '20:00',
          month_start_date: parsedSettings.monthStartDate || 1,
          budget_warnings: parsedSettings.budgetWarnings !== false,
        });
      }

      // Mark migration as completed
      await AsyncStorage.setItem('migration_completed', 'true');
      
      console.log('Migration completed successfully');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }

  static async clearAsyncStorageData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'userData',
        'financialGoals',
        'appSettings',
        'monthlyBudget',
      ]);
      console.log('AsyncStorage data cleared after migration');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  }
}