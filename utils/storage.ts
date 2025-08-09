import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  mood: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  emoji: string;
  created_at: string;
  updated_at: string;
  isCompleted: boolean;
}

export interface UserData {
  salary: number;
  salaryDate: string;
  monthlyExpenses: Expense[];
  settings: {
    darkMode: boolean;
    notifications: boolean;
    currency: string;
    language: string;
  };
}

export class StorageService {
  private static readonly USER_DATA_KEY = 'userData';
  private static readonly FINANCIAL_GOALS_KEY = 'financialGoals';
  private static readonly APP_SETTINGS_KEY = 'appSettings';

  // User Data Operations
  static async getUserData(): Promise<UserData | null> {
    try {
      const data = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  static async saveUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  static async updateUserData(updates: Partial<UserData>): Promise<void> {
    try {
      const existingData = await this.getUserData();
      const updatedData = { ...existingData, ...updates };
      await this.saveUserData(updatedData as UserData);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  // Expense Operations
  static async addExpense(expense: Expense): Promise<void> {
    try {
      const userData = await this.getUserData();
      if (userData) {
        userData.monthlyExpenses = userData.monthlyExpenses || [];
        userData.monthlyExpenses.push(expense);
        await this.saveUserData(userData);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  static async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      const userData = await this.getUserData();
      if (userData && userData.monthlyExpenses) {
        const expenseIndex = userData.monthlyExpenses.findIndex(exp => exp.id === expenseId);
        if (expenseIndex !== -1) {
          userData.monthlyExpenses[expenseIndex] = {
            ...userData.monthlyExpenses[expenseIndex],
            ...updates,
            updated_at: new Date().toISOString(),
          };
          await this.saveUserData(userData);
        }
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      const userData = await this.getUserData();
      if (userData && userData.monthlyExpenses) {
        userData.monthlyExpenses = userData.monthlyExpenses.filter(exp => exp.id !== expenseId);
        await this.saveUserData(userData);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  static async getExpenses(): Promise<Expense[]> {
    try {
      const userData = await this.getUserData();
      return userData?.monthlyExpenses || [];
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  // Financial Goals Operations
  static async getFinancialGoals(): Promise<FinancialGoal[]> {
    try {
      const data = await AsyncStorage.getItem(this.FINANCIAL_GOALS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting financial goals:', error);
      return [];
    }
  }

  static async saveFinancialGoals(goals: FinancialGoal[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FINANCIAL_GOALS_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving financial goals:', error);
      throw error;
    }
  }

  static async addFinancialGoal(goal: FinancialGoal): Promise<void> {
    try {
      const goals = await this.getFinancialGoals();
      goals.push(goal);
      await this.saveFinancialGoals(goals);
    } catch (error) {
      console.error('Error adding financial goal:', error);
      throw error;
    }
  }

  static async updateFinancialGoal(goalId: string, updates: Partial<FinancialGoal>): Promise<void> {
    try {
      const goals = await this.getFinancialGoals();
      const goalIndex = goals.findIndex(goal => goal.id === goalId);
      if (goalIndex !== -1) {
        goals[goalIndex] = {
          ...goals[goalIndex],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        await this.saveFinancialGoals(goals);
      }
    } catch (error) {
      console.error('Error updating financial goal:', error);
      throw error;
    }
  }

  static async deleteFinancialGoal(goalId: string): Promise<void> {
    try {
      const goals = await this.getFinancialGoals();
      const filteredGoals = goals.filter(goal => goal.id !== goalId);
      await this.saveFinancialGoals(filteredGoals);
    } catch (error) {
      console.error('Error deleting financial goal:', error);
      throw error;
    }
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.USER_DATA_KEY,
        this.FINANCIAL_GOALS_KEY,
        this.APP_SETTINGS_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Export/Import Operations
  static async exportAllData(): Promise<any> {
    try {
      const [userData, goals, settings] = await Promise.all([
        this.getUserData(),
        this.getFinancialGoals(),
        AsyncStorage.getItem(this.APP_SETTINGS_KEY),
      ]);

      return {
        userData,
        financialGoals: goals,
        appSettings: settings ? JSON.parse(settings) : null,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async importData(data: any): Promise<void> {
    try {
      if (data.userData) {
        await this.saveUserData(data.userData);
      }
      
      if (data.financialGoals) {
        await this.saveFinancialGoals(data.financialGoals);
      }
      
      if (data.appSettings) {
        await AsyncStorage.setItem(this.APP_SETTINGS_KEY, JSON.stringify(data.appSettings));
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}