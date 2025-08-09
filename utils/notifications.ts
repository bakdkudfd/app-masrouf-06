import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  budgetWarnings: boolean;
  goalReminders: boolean;
}

export class NotificationService {
  private static readonly STORAGE_KEY = 'notificationSettings';

  static async getSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem(this.STORAGE_KEY);
      return settings ? JSON.parse(settings) : {
        enabled: true,
        dailyReminder: true,
        reminderTime: '20:00',
        budgetWarnings: true,
        goalReminders: true,
      };
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return {
        enabled: true,
        dailyReminder: true,
        reminderTime: '20:00',
        budgetWarnings: true,
        goalReminders: true,
      };
    }
  }

  static async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw error;
    }
  }

  static async scheduleDaily reminder(time: string): Promise<void> {
    // In a real app, this would use expo-notifications
    // For now, we'll just store the preference
    console.log(`Daily reminder scheduled for ${time}`);
  }

  static async showBudgetWarning(category: string, percentage: number): Promise<void> {
    // In a real app, this would show a local notification
    console.log(`Budget warning: ${category} at ${percentage}%`);
  }

  static async showGoalAchievement(goalTitle: string): Promise<void> {
    // In a real app, this would show a celebration notification
    console.log(`Goal achieved: ${goalTitle}`);
  }

  static generateDailyTip(): string {
    const tips = [
      'قلل من شراء القهوة اليومية واشرب في البيت',
      'خطط لمصاريفك قبل بداية كل أسبوع',
      'احتفظ بـ 10% من راتبك كادخار شهري',
      'تسوق بقائمة محددة لتجنب الشراء العشوائي',
      'قارن الأسعار قبل شراء أي شيء مكلف',
      'استخدم التطبيقات المجانية بدلاً من المدفوعة',
      'اطبخ في البيت أكثر من الطلب من المطاعم',
      'استخدم وسائل النقل العامة بدلاً من التاكسي',
      'اشترِ الأشياء المستعملة عندما تكون بحالة جيدة',
      'تجنب التسوق عندما تكون متوتراً أو حزيناً',
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  static generateSmartInsight(expenses: any[], mood: string): string {
    const insights = {
      happy: [
        'تنفق أكثر عندما تكون سعيداً، حاول وضع حد أقصى للإنفاق',
        'السعادة لا تحتاج لإنفاق كثير، استمتع بالأشياء البسيطة',
      ],
      stressed: [
        'التوتر يؤثر على قراراتك المالية، خذ نفساً عميقاً قبل الشراء',
        'عندما تكون متوتراً، تجنب اتخاذ قرارات مالية كبيرة',
      ],
      neutral: [
        'حالتك المزاجية متوازنة، وقت مثالي لمراجعة ميزانيتك',
        'استغل هدوءك الحالي في التخطيط المالي للأسبوع القادم',
      ],
    };

    const moodInsights = insights[mood as keyof typeof insights] || insights.neutral;
    return moodInsights[Math.floor(Math.random() * moodInsights.length)];
  }
}