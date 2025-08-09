import { Expense, UserData, FinancialGoal } from './storage';
import { isThisMonth, getWeekStart, getMonthStart } from './dateHelpers';

export interface SpendingPattern {
  category: string;
  amount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MoodSpendingAnalysis {
  mood: string;
  totalAmount: number;
  averageAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface WeeklyTrend {
  week: string;
  amount: number;
  change: number;
}

export interface BudgetHealth {
  status: 'healthy' | 'warning' | 'danger';
  percentage: number;
  daysRemaining: number;
  projectedOverspend: number;
}

export class AnalyticsService {
  static analyzeSpendingPatterns(expenses: Expense[]): SpendingPattern[] {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalSpent) * 100,
      trend: 'stable' as const, // Would need historical data for real trend analysis
    })).sort((a, b) => b.amount - a.amount);
  }

  static analyzeMoodSpending(expenses: Expense[]): MoodSpendingAnalysis[] {
    const moodData = expenses.reduce((acc, expense) => {
      if (!acc[expense.mood]) {
        acc[expense.mood] = { total: 0, count: 0 };
      }
      acc[expense.mood].total += expense.amount;
      acc[expense.mood].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const totalSpent = Object.values(moodData).reduce((sum, data) => sum + data.total, 0);

    return Object.entries(moodData).map(([mood, data]) => ({
      mood,
      totalAmount: data.total,
      averageAmount: data.total / data.count,
      transactionCount: data.count,
      percentage: (data.total / totalSpent) * 100,
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  static getWeeklyTrends(expenses: Expense[]): WeeklyTrend[] {
    const weeklyData: Record<string, number> = {};
    const today = new Date();

    // Get last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekKey = weekStart.toISOString().slice(0, 10);
      weeklyData[weekKey] = 0;
    }

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const weekStart = getWeekStart(expenseDate);
      const weekKey = weekStart.toISOString().slice(0, 10);
      
      if (weeklyData.hasOwnProperty(weekKey)) {
        weeklyData[weekKey] += expense.amount;
      }
    });

    const weeks = Object.entries(weeklyData).map(([week, amount], index, array) => {
      const previousAmount = index > 0 ? array[index - 1][1] : amount;
      const change = previousAmount > 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;
      
      return {
        week: new Date(week).toLocaleDateString('ar', { month: 'short', day: 'numeric' }),
        amount,
        change,
      };
    });

    return weeks;
  }

  static calculateBudgetHealth(userData: UserData): BudgetHealth {
    const totalSpent = userData.monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const percentage = userData.salary > 0 ? (totalSpent / userData.salary) * 100 : 0;
    
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysPassed = today.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    
    const dailyAverage = totalSpent / daysPassed;
    const projectedMonthlySpend = dailyAverage * daysInMonth;
    const projectedOverspend = Math.max(0, projectedMonthlySpend - userData.salary);

    let status: 'healthy' | 'warning' | 'danger' = 'healthy';
    if (percentage >= 100) status = 'danger';
    else if (percentage >= 80) status = 'warning';

    return {
      status,
      percentage,
      daysRemaining,
      projectedOverspend,
    };
  }

  static getTopSpendingDays(expenses: Expense[]): Array<{ date: string; amount: number; dayName: string }> {
    const dailyTotals = expenses.reduce((acc, expense) => {
      const date = expense.date.split('T')[0];
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date,
        amount,
        dayName: new Date(date).toLocaleDateString('ar', { weekday: 'long' }),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  static generatePersonalizedInsights(userData: UserData): string[] {
    const insights: string[] = [];
    const expenses = userData.monthlyExpenses;
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Budget insights
    const budgetPercentage = userData.salary > 0 ? (totalSpent / userData.salary) * 100 : 0;
    if (budgetPercentage > 90) {
      insights.push('⚠️ لقد أنفقت أكثر من 90% من راتبك هذا الشهر');
    } else if (budgetPercentage < 50) {
      insights.push('🎉 أحسنت! لقد أنفقت أقل من نصف راتبك');
    }

    // Category insights
    const patterns = this.analyzeSpendingPatterns(expenses);
    if (patterns.length > 0) {
      const topCategory = patterns[0];
      if (topCategory.percentage > 40) {
        insights.push(`💡 ${topCategory.percentage.toFixed(0)}% من إنفاقك على ${topCategory.category}`);
      }
    }

    // Mood insights
    const moodAnalysis = this.analyzeMoodSpending(expenses);
    const stressedSpending = moodAnalysis.find(m => m.mood === 'stressed');
    if (stressedSpending && stressedSpending.percentage > 30) {
      insights.push('😰 تنفق أكثر عندما تكون متوتراً، جرب تقنيات الاسترخاء');
    }

    // Daily insights
    const topDays = this.getTopSpendingDays(expenses);
    if (topDays.length > 0) {
      insights.push(`📅 أكثر أيامك إنفاقاً: ${topDays[0].dayName}`);
    }

    return insights.slice(0, 3); // Return top 3 insights
  }

  static calculateSavingsRate(userData: UserData): number {
    const totalSpent = userData.monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const savings = userData.salary - totalSpent;
    return userData.salary > 0 ? (savings / userData.salary) * 100 : 0;
  }

  static predictMonthlySpending(expenses: Expense[]): number {
    if (expenses.length === 0) return 0;
    
    const today = new Date();
    const daysPassed = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const dailyAverage = totalSpent / daysPassed;
    
    return dailyAverage * daysInMonth;
  }

  static getSpendingVelocity(expenses: Expense[]): 'slow' | 'normal' | 'fast' {
    const prediction = this.predictMonthlySpending(expenses);
    const currentSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const today = new Date();
    const daysPassed = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const expectedSpentPercentage = (daysPassed / daysInMonth) * 100;
    
    // Compare actual vs expected spending pace
    if (prediction > currentSpent * 1.2) return 'fast';
    if (prediction < currentSpent * 0.8) return 'slow';
    return 'normal';
  }
}