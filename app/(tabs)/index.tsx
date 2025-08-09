import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { DatabaseService, Expense, UserSettings } from '@/utils/database';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Target, ChartBar as BarChart3, Wallet, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, ArrowRight } from 'lucide-react-native';
import { StatCard } from '@/components/StatCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatDateArabic, formatDateShort, isToday } from '@/utils/dateHelpers';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colors = {
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FF9800',
    danger: '#F44336',
    warning: '#FFC107',
    success: '#8BC34A',
    background: isDark ? '#1A1A1A' : '#F8F9FA',
    card: isDark ? '#2D2D2D' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#333333',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    border: isDark ? '#404040' : '#E0E0E0',
    gradient1: isDark ? '#2D2D2D' : '#FFFFFF',
    gradient2: isDark ? '#1A1A1A' : '#F8F9FA',
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      await DatabaseService.initializeDatabase();
      const [settings, monthlyExpenses] = await Promise.all([
        DatabaseService.getUserSettings(),
        DatabaseService.getExpensesByMonth(new Date().toISOString().slice(0, 7)),
      ]);
      
      setUserSettings(settings);
      setExpenses(monthlyExpenses);
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const getMonthlyStats = () => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const transactionCount = expenses.length;
    const averageDaily = expenses.length > 0 ? totalExpenses / new Date().getDate() : 0;
    const remainingBudget = (userSettings?.salary || 0) - totalExpenses;
    const budgetPercentage = userSettings?.salary ? (totalExpenses / userSettings.salary) * 100 : 0;

    return {
      totalExpenses,
      transactionCount,
      averageDaily,
      remainingBudget,
      budgetPercentage,
    };
  };

  const getRecentExpenses = () => {
    return expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const getCategoryBreakdown = () => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryNames: Record<string, string> = {
      food: 'طعام',
      transport: 'نقل',
      bills: 'فواتير',
      entertainment: 'ترفيه',
      health: 'صحة',
      shopping: 'تسوق',
      education: 'تعليم',
      other: 'أخرى',
    };

    const categoryEmojis: Record<string, string> = {
      food: '🍔',
      transport: '🚌',
      bills: '💡',
      entertainment: '🎬',
      health: '💊',
      shopping: '🛍️',
      education: '📚',
      other: '📦',
    };

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        name: categoryNames[category] || category,
        emoji: categoryEmojis[category] || '📦',
        amount,
        percentage: expenses.length > 0 ? (amount / getMonthlyStats().totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  };

  const getBudgetStatus = () => {
    const stats = getMonthlyStats();
    
    if (!userSettings?.salary || userSettings.salary === 0) {
      return {
        status: 'setup',
        message: 'قم بإعداد راتبك الشهري',
        color: colors.accent,
        icon: <Wallet size={20} color={colors.accent} />,
      };
    }

    if (stats.budgetPercentage >= 100) {
      return {
        status: 'danger',
        message: 'تجاوزت ميزانيتك الشهرية',
        color: colors.danger,
        icon: <AlertTriangle size={20} color={colors.danger} />,
      };
    }

    if (stats.budgetPercentage >= 80) {
      return {
        status: 'warning',
        message: 'اقتربت من حد الميزانية',
        color: colors.warning,
        icon: <Clock size={20} color={colors.warning} />,
      };
    }

    return {
      status: 'healthy',
      message: 'ميزانيتك في حالة جيدة',
      color: colors.success,
      icon: <CheckCircle size={20} color={colors.success} />,
    };
  };

  const getTodayExpenses = () => {
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter(expense => expense.date.startsWith(today));
  };

  if (loading) {
    return <LoadingSpinner message="جاري تحميل البيانات..." />;
  }

  const stats = getMonthlyStats();
  const recentExpenses = getRecentExpenses();
  const categoryBreakdown = getCategoryBreakdown();
  const budgetStatus = getBudgetStatus();
  const todayExpenses = getTodayExpenses();
  const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            أهلاً بك في
          </Text>
          <Text style={[styles.appName, { color: colors.text }]}>
            مصروفي 💰
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDateArabic(new Date())}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/add-expense')}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* Budget Status Alert */}
        <TouchableOpacity 
          style={[styles.budgetAlert, { backgroundColor: budgetStatus.color + '20', borderColor: budgetStatus.color }]}
          onPress={() => budgetStatus.status === 'setup' ? router.push('/salary-setup') : router.push('/analytics')}
        >
          <View style={styles.budgetAlertContent}>
            {budgetStatus.icon}
            <Text style={[styles.budgetAlertText, { color: budgetStatus.color }]}>
              {budgetStatus.message}
            </Text>
          </View>
          <ArrowRight size={16} color={budgetStatus.color} />
        </TouchableOpacity>

        {/* Today's Summary */}
        <View style={[styles.todayCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>اليوم</Text>
          <View style={styles.todayContent}>
            <View style={styles.todayStats}>
              <Text style={[styles.todayAmount, { color: colors.danger }]}>
                {todayTotal.toLocaleString()} د.ج
              </Text>
              <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>
                {todayExpenses.length} معاملة
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.todayButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/add-expense')}
            >
              <Plus size={20} color="white" />
              <Text style={styles.todayButtonText}>إضافة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>نظرة عامة - الشهر الحالي</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon={<DollarSign size={24} color={colors.danger} />}
              title="إجمالي المصاريف"
              value={`${stats.totalExpenses.toLocaleString()} د.ج`}
              color={colors.danger}
              onPress={() => router.push('/expenses-list')}
            />
            
            <StatCard
              icon={<Calendar size={24} color={colors.secondary} />}
              title="متوسط يومي"
              value={`${stats.averageDaily.toFixed(0)} د.ج`}
              color={colors.secondary}
            />
            
            <StatCard
              icon={<Wallet size={24} color={stats.remainingBudget >= 0 ? colors.success : colors.danger} />}
              title="المتبقي من الراتب"
              value={`${stats.remainingBudget.toLocaleString()} د.ج`}
              color={stats.remainingBudget >= 0 ? colors.success : colors.danger}
              onPress={() => router.push('/budget-planner')}
            />
            
            <StatCard
              icon={<BarChart3 size={24} color={colors.accent} />}
              title="عدد المعاملات"
              value={stats.transactionCount.toString()}
              color={colors.accent}
              onPress={() => router.push('/analytics')}
            />
          </View>

          {/* Budget Progress */}
          {userSettings?.salary && userSettings.salary > 0 && (
            <View style={styles.budgetProgress}>
              <View style={styles.budgetHeader}>
                <Text style={[styles.budgetTitle, { color: colors.text }]}>تقدم الميزانية</Text>
                <Text style={[styles.budgetPercentage, { 
                  color: stats.budgetPercentage >= 100 ? colors.danger : 
                        stats.budgetPercentage >= 80 ? colors.warning : colors.primary 
                }]}>
                  {stats.budgetPercentage.toFixed(1)}%
                </Text>
              </View>
              
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min(stats.budgetPercentage, 100)}%`,
                      backgroundColor: stats.budgetPercentage >= 100 ? colors.danger : 
                                    stats.budgetPercentage >= 80 ? colors.warning : colors.primary,
                    }
                  ]} 
                />
              </View>
              
              <View style={styles.budgetDetails}>
                <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
                  {stats.totalExpenses.toLocaleString()} من {userSettings.salary.toLocaleString()} د.ج
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Top Categories */}
        {categoryBreakdown.length > 0 && (
          <View style={[styles.categoriesCard, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>أكثر الفئات إنفاقاً</Text>
              <TouchableOpacity onPress={() => router.push('/analytics')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            
            {categoryBreakdown.map((category, index) => (
              <View key={category.category} style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {category.name}
                  </Text>
                </View>
                
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryAmount, { color: colors.danger }]}>
                    {category.amount.toLocaleString()} د.ج
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: colors.textSecondary }]}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Expenses */}
        <View style={[styles.recentCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>المصاريف الأخيرة</Text>
            <TouchableOpacity onPress={() => router.push('/expenses-list')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          
          {recentExpenses.length === 0 ? (
            <View style={styles.emptyExpenses}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا توجد مصاريف مسجلة بعد
              </Text>
              <TouchableOpacity
                style={[styles.addFirstExpenseButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/add-expense')}
              >
                <Plus size={16} color="white" />
                <Text style={styles.addFirstExpenseText}>إضافة أول مصروف</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentExpenses.map((expense) => {
              const categoryEmojis: Record<string, string> = {
                food: '🍔', transport: '🚌', bills: '💡', entertainment: '🎬',
                health: '💊', shopping: '🛍️', education: '📚', other: '📦',
              };
              
              const moodEmojis: Record<string, string> = {
                happy: '😊', neutral: '😐', stressed: '😰',
              };

              return (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.expenseItem}
                  onPress={() => router.push(`/expense-details?expenseId=${expense.id}`)}
                >
                  <View style={styles.expenseLeft}>
                    <Text style={styles.expenseEmoji}>
                      {categoryEmojis[expense.category] || '📦'}
                    </Text>
                    <View style={styles.expenseDetails}>
                      <Text style={[styles.expenseCategory, { color: colors.text }]}>
                        {getCategoryName(expense.category)}
                      </Text>
                      <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                        {isToday(new Date(expense.date)) ? 'اليوم' : formatDateShort(new Date(expense.date))}
                      </Text>
                      {expense.note && (
                        <Text style={[styles.expenseNote, { color: colors.textSecondary }]} numberOfLines={1}>
                          {expense.note}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.expenseRight}>
                    <Text style={[styles.expenseAmount, { color: colors.danger }]}>
                      -{expense.amount.toLocaleString()} د.ج
                    </Text>
                    <Text style={styles.expenseMood}>
                      {moodEmojis[expense.mood] || '😐'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>إجراءات سريعة</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => router.push('/add-expense')}
            >
              <Plus size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>إضافة مصروف</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]}
              onPress={() => router.push('/analytics')}
            >
              <BarChart3 size={24} color={colors.secondary} />
              <Text style={[styles.actionText, { color: colors.secondary }]}>التقارير</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent + '20' }]}
              onPress={() => router.push('/goals')}
            >
              <Target size={24} color={colors.accent} />
              <Text style={[styles.actionText, { color: colors.accent }]}>الأهداف</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
              onPress={() => router.push('/budget-planner')}
            >
              <Wallet size={24} color={colors.warning} />
              <Text style={[styles.actionText, { color: colors.warning }]}>الميزانية</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.tipsTitle}>💡 نصيحة اليوم</Text>
          <Text style={styles.tipText}>
            {getTodayTip(stats.budgetPercentage, categoryBreakdown)}
          </Text>
        </View>

      </ScrollView>
    </View>
  );

  function getCategoryName(categoryId: string): string {
    const categoryNames: Record<string, string> = {
      food: 'طعام',
      transport: 'نقل', 
      bills: 'فواتير',
      entertainment: 'ترفيه',
      health: 'صحة',
      shopping: 'تسوق',
      education: 'تعليم',
      other: 'أخرى',
    };
    return categoryNames[categoryId] || categoryId;
  }

  function getTodayTip(budgetPercentage: number, categories: any[]): string {
    if (budgetPercentage >= 90) {
      return 'أنت قريب من حد ميزانيتك الشهرية. حاول تقليل المصاريف غير الضرورية.';
    }
    
    if (categories.length > 0 && categories[0].percentage > 50) {
      return `أكثر من نصف إنفاقك على ${categories[0].name}. فكر في تنويع مصاريفك.`;
    }
    
    if (budgetPercentage < 30) {
      return 'أحسنت! إنفاقك منضبط هذا الشهر. فكر في ادخار الفائض.';
    }
    
    return 'سجل مصاريفك يومياً للحصول على صورة واضحة عن أنماط إنفاقك.';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
    marginVertical: 2,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  budgetAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  budgetAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetAlertText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  todayCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Cairo-Bold',
  },
  todayContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayStats: {
    flex: 1,
  },
  todayAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  todayLabel: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Cairo-Regular',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  todayButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: 'Cairo-Bold',
  },
  overviewCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  budgetProgress: {
    marginTop: 10,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  budgetPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetDetails: {
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
  },
  categoriesCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  categoryPercentage: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Cairo-Regular',
  },
  recentCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyExpenses: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 15,
    fontFamily: 'Cairo-Regular',
  },
  addFirstExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFirstExpenseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: 'Cairo-Bold',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'Cairo-Bold',
  },
  expenseDate: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: 'Cairo-Regular',
  },
  expenseNote: {
    fontSize: 10,
    fontFamily: 'Cairo-Regular',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Cairo-Bold',
  },
  expenseMood: {
    fontSize: 14,
  },
  actionsCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: 'Cairo-Bold',
  },
  tipsCard: {
    margin: 15,
    marginBottom: 30,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  tipText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    fontFamily: 'Cairo-Regular',
  },
});