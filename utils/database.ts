import * as SQLite from 'expo-sqlite';

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
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  emoji: string;
  created_at: string;
  updated_at: string;
  is_completed: boolean;
}

export interface UserSettings {
  id: string;
  salary: number;
  salary_date: string;
  dark_mode: boolean;
  notifications_enabled: boolean;
  daily_reminder: boolean;
  reminder_time: string;
  month_start_date: number;
  budget_warnings: boolean;
  currency: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  emoji: string;
  budget_amount: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyBudget {
  id: string;
  month: string;
  total_budget: number;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  static async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mesrof.db');
      await this.createTables();
      await this.insertDefaultData();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create expenses table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        mood TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create financial_goals table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS financial_goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0,
        deadline TEXT NOT NULL,
        category TEXT NOT NULL,
        emoji TEXT NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_settings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY DEFAULT 'main',
        salary REAL NOT NULL DEFAULT 0,
        salary_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        dark_mode BOOLEAN NOT NULL DEFAULT 0,
        notifications_enabled BOOLEAN NOT NULL DEFAULT 1,
        daily_reminder BOOLEAN NOT NULL DEFAULT 1,
        reminder_time TEXT NOT NULL DEFAULT '20:00',
        month_start_date INTEGER NOT NULL DEFAULT 1,
        budget_warnings BOOLEAN NOT NULL DEFAULT 1,
        currency TEXT NOT NULL DEFAULT 'DZD',
        language TEXT NOT NULL DEFAULT 'ar',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create budget_categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS budget_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        emoji TEXT NOT NULL,
        budget_amount REAL NOT NULL DEFAULT 0,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create monthly_budgets table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS monthly_budgets (
        id TEXT PRIMARY KEY,
        month TEXT NOT NULL,
        total_budget REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
      CREATE INDEX IF NOT EXISTS idx_expenses_mood ON expenses(mood);
      CREATE INDEX IF NOT EXISTS idx_goals_deadline ON financial_goals(deadline);
      CREATE INDEX IF NOT EXISTS idx_goals_category ON financial_goals(category);
    `);
  }

  private static async insertDefaultData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Insert default user settings if not exists
    const existingSettings = await this.db.getFirstAsync(
      'SELECT id FROM user_settings WHERE id = ?',
      ['main']
    );

    if (!existingSettings) {
      await this.db.runAsync(`
        INSERT INTO user_settings (id) VALUES ('main');
      `);
    }

    // Insert default budget categories if not exists
    const existingCategories = await this.db.getFirstAsync(
      'SELECT id FROM budget_categories LIMIT 1'
    );

    if (!existingCategories) {
      const defaultCategories = [
        { id: 'food', name: 'طعام', emoji: '🍔', color: '#FF6B6B' },
        { id: 'transport', name: 'نقل', emoji: '🚌', color: '#4ECDC4' },
        { id: 'bills', name: 'فواتير', emoji: '💡', color: '#45B7D1' },
        { id: 'entertainment', name: 'ترفيه', emoji: '🎬', color: '#96CEB4' },
        { id: 'health', name: 'صحة', emoji: '💊', color: '#FF8A65' },
        { id: 'shopping', name: 'تسوق', emoji: '🛍️', color: '#BA68C8' },
        { id: 'education', name: 'تعليم', emoji: '📚', color: '#FFB74D' },
        { id: 'other', name: 'أخرى', emoji: '📦', color: '#FFEAA7' },
      ];

      for (const category of defaultCategories) {
        await this.db.runAsync(`
          INSERT INTO budget_categories (id, name, emoji, color)
          VALUES (?, ?, ?, ?);
        `, [category.id, category.name, category.emoji, category.color]);
      }
    }
  }

  // Expense operations
  static async addExpense(expense: Omit<Expense, 'created_at' | 'updated_at'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(`
      INSERT INTO expenses (id, amount, category, date, mood, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `, [expense.id, expense.amount, expense.category, expense.date, expense.mood, expense.note || null, now, now]);
  }

  static async getExpenses(limit?: number): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = limit 
      ? 'SELECT * FROM expenses ORDER BY date DESC LIMIT ?'
      : 'SELECT * FROM expenses ORDER BY date DESC';
    
    const params = limit ? [limit] : [];
    const result = await this.db.getAllAsync(query, params);
    return result as Expense[];
  }

  static async getExpensesByMonth(month: string): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT * FROM expenses 
      WHERE date LIKE ? 
      ORDER BY date DESC
    `, [`${month}%`]);
    
    return result as Expense[];
  }

  static async getExpensesByCategory(category: string): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT * FROM expenses 
      WHERE category = ? 
      ORDER BY date DESC
    `, [category]);
    
    return result as Expense[];
  }

  static async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`);
    const values = Object.values(updates).filter((_, index) => Object.keys(updates)[index] !== 'id');
    
    if (fields.length === 0) return;

    const query = `
      UPDATE expenses 
      SET ${fields.join(', ')}, updated_at = ? 
      WHERE id = ?
    `;
    
    await this.db.runAsync(query, [...values, new Date().toISOString(), id]);
  }

  static async deleteExpense(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  }

  // Financial Goals operations
  static async addFinancialGoal(goal: Omit<FinancialGoal, 'created_at' | 'updated_at' | 'is_completed'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(`
      INSERT INTO financial_goals (id, title, target_amount, current_amount, deadline, category, emoji, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [goal.id, goal.title, goal.target_amount, goal.current_amount, goal.deadline, goal.category, goal.emoji, now, now]);
  }

  static async getFinancialGoals(): Promise<FinancialGoal[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT * FROM financial_goals 
      ORDER BY deadline ASC
    `);
    
    return result as FinancialGoal[];
  }

  static async updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`);
    const values = Object.values(updates).filter((_, index) => Object.keys(updates)[index] !== 'id');
    
    if (fields.length === 0) return;

    const query = `
      UPDATE financial_goals 
      SET ${fields.join(', ')}, updated_at = ? 
      WHERE id = ?
    `;
    
    await this.db.runAsync(query, [...values, new Date().toISOString(), id]);
  }

  static async deleteFinancialGoal(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM financial_goals WHERE id = ?', [id]);
  }

  // User Settings operations
  static async getUserSettings(): Promise<UserSettings | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`
      SELECT * FROM user_settings WHERE id = 'main'
    `);
    
    return result as UserSettings | null;
  }

  static async updateUserSettings(updates: Partial<UserSettings>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`);
    const values = Object.values(updates).filter((_, index) => Object.keys(updates)[index] !== 'id');
    
    if (fields.length === 0) return;

    const query = `
      UPDATE user_settings 
      SET ${fields.join(', ')}, updated_at = ? 
      WHERE id = 'main'
    `;
    
    await this.db.runAsync(query, [...values, new Date().toISOString()]);
  }

  // Budget operations
  static async getBudgetCategories(): Promise<BudgetCategory[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT * FROM budget_categories 
      ORDER BY name ASC
    `);
    
    return result as BudgetCategory[];
  }

  static async updateBudgetCategory(id: string, budgetAmount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      UPDATE budget_categories 
      SET budget_amount = ?, updated_at = ? 
      WHERE id = ?
    `, [budgetAmount, new Date().toISOString(), id]);
  }

  // Analytics operations
  static async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT * FROM expenses 
      WHERE date BETWEEN ? AND ? 
      ORDER BY date DESC
    `, [startDate, endDate]);
    
    return result as Expense[];
  }

  static async getCategoryTotals(month?: string): Promise<Array<{category: string, total: number, count: number}>> {
    if (!this.db) throw new Error('Database not initialized');

    const query = month 
      ? `SELECT category, SUM(amount) as total, COUNT(*) as count 
         FROM expenses 
         WHERE date LIKE ? 
         GROUP BY category 
         ORDER BY total DESC`
      : `SELECT category, SUM(amount) as total, COUNT(*) as count 
         FROM expenses 
         GROUP BY category 
         ORDER BY total DESC`;
    
    const params = month ? [`${month}%`] : [];
    const result = await this.db.getAllAsync(query, params);
    
    return result as Array<{category: string, total: number, count: number}>;
  }

  static async getMoodTotals(month?: string): Promise<Array<{mood: string, total: number, count: number}>> {
    if (!this.db) throw new Error('Database not initialized');

    const query = month 
      ? `SELECT mood, SUM(amount) as total, COUNT(*) as count 
         FROM expenses 
         WHERE date LIKE ? 
         GROUP BY mood 
         ORDER BY total DESC`
      : `SELECT mood, SUM(amount) as total, COUNT(*) as count 
         FROM expenses 
         GROUP BY mood 
         ORDER BY total DESC`;
    
    const params = month ? [`${month}%`] : [];
    const result = await this.db.getAllAsync(query, params);
    
    return result as Array<{mood: string, total: number, count: number}>;
  }

  static async getDailyTotals(month: string): Promise<Array<{date: string, total: number}>> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT DATE(date) as date, SUM(amount) as total 
      FROM expenses 
      WHERE date LIKE ? 
      GROUP BY DATE(date) 
      ORDER BY date ASC
    `, [`${month}%`]);
    
    return result as Array<{date: string, total: number}>;
  }

  // Backup and restore operations
  static async exportAllData(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const [expenses, goals, settings, budgetCategories] = await Promise.all([
      this.getExpenses(),
      this.getFinancialGoals(),
      this.getUserSettings(),
      this.getBudgetCategories(),
    ]);

    return {
      expenses,
      financial_goals: goals,
      user_settings: settings,
      budget_categories: budgetCategories,
      export_date: new Date().toISOString(),
      app_version: '1.0.0',
    };
  }

  static async importData(data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Clear existing data
      await this.db.execAsync('DELETE FROM expenses');
      await this.db.execAsync('DELETE FROM financial_goals');
      await this.db.execAsync('DELETE FROM budget_categories');

      // Import expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const expense of data.expenses) {
          await this.addExpense(expense);
        }
      }

      // Import financial goals
      if (data.financial_goals && Array.isArray(data.financial_goals)) {
        for (const goal of data.financial_goals) {
          await this.addFinancialGoal(goal);
        }
      }

      // Import user settings
      if (data.user_settings) {
        await this.updateUserSettings(data.user_settings);
      }

      // Import budget categories
      if (data.budget_categories && Array.isArray(data.budget_categories)) {
        for (const category of data.budget_categories) {
          await this.db!.runAsync(`
            INSERT INTO budget_categories (id, name, emoji, budget_amount, color, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);
          `, [
            category.id,
            category.name,
            category.emoji,
            category.budget_amount || 0,
            category.color,
            category.created_at || new Date().toISOString(),
            category.updated_at || new Date().toISOString(),
          ]);
        }
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM expenses;
      DELETE FROM financial_goals;
      UPDATE user_settings SET 
        salary = 0, 
        salary_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = 'main';
      UPDATE budget_categories SET 
        budget_amount = 0,
        updated_at = CURRENT_TIMESTAMP;
    `);
  }

  static async getExpenseById(id: string): Promise<Expense | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM expenses WHERE id = ?',
      [id]
    );
    
    return result as Expense | null;
  }

  static async searchExpenses(query: string): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT * FROM expenses 
      WHERE note LIKE ? OR category LIKE ?
      ORDER BY date DESC
    `, [`%${query}%`, `%${query}%`]);
    
    return result as Expense[];
  }

  // Statistics operations
  static async getMonthlyStats(month: string): Promise<{
    totalExpenses: number;
    totalAmount: number;
    averageDaily: number;
    topCategory: string;
    topMood: string;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const [totalResult, categoryResult, moodResult] = await Promise.all([
      this.db.getFirstAsync(`
        SELECT COUNT(*) as count, SUM(amount) as total 
        FROM expenses 
        WHERE date LIKE ?
      `, [`${month}%`]),
      this.db.getFirstAsync(`
        SELECT category, SUM(amount) as total 
        FROM expenses 
        WHERE date LIKE ? 
        GROUP BY category 
        ORDER BY total DESC 
        LIMIT 1
      `, [`${month}%`]),
      this.db.getFirstAsync(`
        SELECT mood, COUNT(*) as count 
        FROM expenses 
        WHERE date LIKE ? 
        GROUP BY mood 
        ORDER BY count DESC 
        LIMIT 1
      `, [`${month}%`]),
    ]);

    const total = totalResult as any;
    const category = categoryResult as any;
    const mood = moodResult as any;

    const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
    
    return {
      totalExpenses: total?.count || 0,
      totalAmount: total?.total || 0,
      averageDaily: total?.total ? (total.total / daysInMonth) : 0,
      topCategory: category?.category || '',
      topMood: mood?.mood || '',
    };
  }
}