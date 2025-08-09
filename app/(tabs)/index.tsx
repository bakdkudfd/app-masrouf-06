import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { CreditCard as Edit3, TrendingUp, TrendingDown, DollarSign, Calendar, Plus, ChartBar as BarChart3, Target, Eye, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Wallet, PiggyBank, Activity } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { DatabaseService, UserSettings } from '@/utils/database';
import { MigrationService } from '@/utils/migrationService';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { CircularProgress } from '@/components/CircularProgress';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { StatCard } from '@/components/StatCard';

const { width } = Dimensions.get('window');

import { Expense } from '@/utils/database';

interface DailySpending {
  date: string;
  amount: number;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [financialTip, setFinancialTip] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isFirstTime, setIsFirstTime] = useState(false);

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

  const financialTips = [
    'قلل من شراء القهوة اليومية واشرب في البيت - توفر حتى 3000 د.ج شهرياً',
    'خطط لمصاريفك قبل بداية كل أسبوع لتجنب الإنفاق العشوائي',
    'احتفظ بـ 20% من راتبك كادخار شهري لبناء صندوق الطوارئ',
    'تسوق بقائمة محددة لتجنب الشراء العشوائي وتوفير 15% من مصاريف التسوق',
    'قارن الأسعار قبل شراء أي شيء مكلف - استخدم تطبيقات المقارنة',
    'استخدم التطبيقات المجانية بدلاً من المدفوعة كلما أمكن',
    'اطبخ في البيت 4 أيام في الأسبوع لتوفير 40% من مصاريف الطعام',
    'استخدم وسائل النقل العامة بدلاً من التاكسي لتوفير 60% من مصاريف النقل',
    'اشترِ الأشياء المستعملة بحالة جيدة لتوفير حتى 50% من السعر الأصلي',
    'تجنب التسوق عندما تكون متوتراً أو حزيناً - 70% من القرارات المالية السيئة تحدث في هذه الأوقات',
  ];

  // استخدام useFocusEffect لتحديث البيانات عند العودة للصفحة
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    initializeApp();
    setRandomTip();
  }, []);

  const initializeApp = async () => {
    try {
      // Run migration from AsyncStorage to SQLite
      await MigrationService.migrateFromAsyncStorage();
      
      const settings = await DatabaseService.getUserSettings();
      if (!settings || settings.salary === 0) {
        setIsFirstTime(true);
      } else {
        setIsFirstTime(false);
      }
      await loadData();
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsFirstTime(true);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [settings, monthlyExpenses] = await Promise.all([
        DatabaseService.getUserSettings(),
        DatabaseService.getExpensesByMonth(new Date().toISOString().slice(0, 7)),
      ]);
      
      setUserSettings(settings);
      setExpenses(monthlyExpenses);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRandomTip();
    
    // إضافة تأثير بصري للتحديث
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    
    setRefreshing(false);
  }, [fadeAnim]);

  const setRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * financialTips.length);
    setFinancialTip(financialTips[randomIndex]);
  };

  // حسابات مالية متقدمة
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingBalance = (userSettings?.salary || 0) - totalExpenses;
  const spendingPercentage = (userSettings?.salary || 0) > 0 ? (totalExpenses / (userSettings?.salary || 1)) * 100 : 0;
  
  // حساب متوسط الإنفاق اليومي
  const today = new Date();
  const daysPassed = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - daysPassed;
  const dailyAverage = daysPassed > 0 ? totalExpenses / daysPassed : 0;
  const projectedMonthlySpend = dailyAverage * daysInMonth;
  
  // حساب معدل الادخار
  const savingsRate = (userSettings?.salary || 0) > 0 ? (((userSettings?.salary || 0) - totalExpenses) / (userSettings?.salary || 1)) * 100 : 0;
  
  // تحليل الإنفاق الأسبوعي
  const getWeeklySpending = (): DailySpending[] => {
    const weeklyData: Record<string, number> = {};
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toISOString().split('T')[0];
      weeklyData[dayKey] = 0;
    }

    expenses.forEach(expense => {
      const expenseDate = expense.date.split('T')[0];
      if (weeklyData.hasOwnProperty(expenseDate)) {
        weeklyData[expenseDate] += expense.amount;
      }
    });

    return Object.entries(weeklyData).map(([date, amount]) => ({
      date,
      amount,
    }));
  };

  const getCategoryTotals = () => {
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([category, amount]) => ({
      name: getCategoryArabicName(category),
      amount,
      color: getCategoryColor(category),
      legendFontColor: colors.text,
      legendFontSize: 11,
    })).sort((a, b) => b.amount - a.amount);
  };

  const getCategoryArabicName = (category: string) => {
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
    return categoryNames[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      food: '#FF6B6B',
      transport: '#4ECDC4',
      bills: '#45B7D1',
      entertainment: '#96CEB4',
      health: '#FF8A65',
      shopping: '#BA68C8',
      education: '#FFB74D',
      other: '#FFEAA7',
    };
    return categoryColors[category] || '#DDD';
  };

  const getFinancialStatus = () => {
    if (spendingPercentage >= 100) return { status: 'danger', message: 'تجاوزت ميزانيتك!', icon: AlertTriangle };
    if (spendingPercentage >= 80) return { status: 'warning', message: 'اقتربت من حد الميزانية', icon: Clock };
    if (spendingPercentage >= 60) return { status: 'caution', message: 'إنفاق متوسط', icon: Activity };
    return { status: 'good', message: 'إنفاق صحي', icon: CheckCircle };
  };

  const getTopSpendingCategory = () => {
    const categoryTotals = getCategoryTotals();
    return categoryTotals.length > 0 ? categoryTotals[0] : null;
  };

  const handleEditSalary = () => {
    router.push('/salary-setup');
  };

  const handleViewAllExpenses = () => {
    router.push('/expenses-list');
  };

  const handleBudgetPlanner = () => {
    router.push('/budget-planner');
  };

  const handleAddExpense = () => {
    router.push('/add-expense');
  };

  // عرض شاشة التحميل
  if (loading) {
    return <LoadingSpinner message="جاري تحميل البيانات..." />;
  }

  const chartData = getCategoryTotals();
  const weeklyData = getWeeklySpending();
  const financialStatus = getFinancialStatus();
  const topCategory = getTopSpendingCategory();

  // إذا كانت المرة الأولى، عرض شاشة الترحيب
  if (isFirstTime) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <View style={styles.welcomeContainer}>
          <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
            <Wallet size={80} color={colors.primary} />
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              أهلاً بك في مصروفي! 🎉
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              تطبيقك الذكي لإدارة المصاريف الشخصية
            </Text>
            <Text style={[styles.welcomeDescription, { color: colors.textSecondary }]}>
              ابدأ بإعداد راتبك الشهري لنتمكن من مساعدتك في تتبع مصاريفك وتحقيق أهدافك المالية
            </Text>
            
            <TouchableOpacity
              style={[styles.setupButton, { backgroundColor: colors.primary }]}
              onPress={handleEditSalary}
            >
              <DollarSign size={24} color="white" />
              <Text style={styles.setupButtonText}>إعداد الراتب الشهري</Text>
            </TouchableOpacity>

            <View style={[styles.featuresContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.featuresTitle, { color: colors.text }]}>ما يمكنك فعله:</Text>
              <View style={styles.featureItem}>
                <Plus size={16} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  تسجيل المصاريف اليومية بسهولة
                </Text>
              </View>
              <View style={styles.featureItem}>
                <BarChart3 size={16} color={colors.secondary} />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  مراجعة تقارير مفصلة عن إنفاقك
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Target size={16} color={colors.accent} />
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                  وضع أهداف مالية وتتبع تقدمك
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 10 },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { backgroundColor: colors.card, opacity: fadeAnim }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.appTitle, { color: colors.text }]}>مصروفي</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {new Date().toLocaleDateString('ar-DZ', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={handleEditSalary}
            >
              <Edit3 size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Financial Status Card */}
        <Animated.View style={[styles.statusCard, { backgroundColor: colors.card, opacity: fadeAnim }]}>
          <View style={styles.statusHeader}>
            <financialStatus.icon size={24} color={
              financialStatus.status === 'danger' ? colors.danger :
              financialStatus.status === 'warning' ? colors.warning :
              financialStatus.status === 'caution' ? colors.accent : colors.success
            } />
            <Text style={[styles.statusMessage, { 
              color: financialStatus.status === 'danger' ? colors.danger :
                     financialStatus.status === 'warning' ? colors.warning :
                     financialStatus.status === 'caution' ? colors.accent : colors.success
            }]}>
              {financialStatus.message}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <CircularProgress
              size={100}
              width={8}
              fill={Math.min(spendingPercentage, 100)}
              tintColor={
                spendingPercentage >= 100 ? colors.danger :
                spendingPercentage >= 80 ? colors.warning :
                spendingPercentage >= 60 ? colors.accent : colors.primary
              }
              backgroundColor={colors.border}
            >
              {() => (
                <View style={styles.progressCenter}>
                  <Text style={[styles.progressPercentage, { color: colors.text }]}>
                    {spendingPercentage.toFixed(0)}%
                  </Text>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                    مُستخدم
                  </Text>
                </View>
              )}
            </CircularProgress>

            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>الراتب الشهري:</Text>
                <Text style={[styles.statusValue, { color: colors.primary }]}>
                  {(userSettings?.salary || 0).toLocaleString()} د.ج
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>المُنفق:</Text>
                <Text style={[styles.statusValue, { color: colors.danger }]}>
                  {totalExpenses.toLocaleString()} د.ج
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>المتبقي:</Text>
                <Text style={[styles.statusValue, { 
                  color: remainingBalance >= 0 ? colors.success : colors.danger 
                }]}>
                  {remainingBalance.toLocaleString()} د.ج
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View style={[styles.quickStatsContainer, { opacity: fadeAnim }]}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Calendar size={20} color={colors.secondary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {dailyAverage.toFixed(0)} د.ج
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              متوسط يومي
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <PiggyBank size={20} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {savingsRate.toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              معدل الادخار
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Clock size={20} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {daysRemaining}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              يوم متبقي
            </Text>
          </View>
        </Animated.View>

        {/* Weekly Spending Trend */}
        {weeklyData.length > 0 && weeklyData.some(day => day.amount > 0) && (
          <Animated.View style={[styles.chartCard, { backgroundColor: colors.card, opacity: fadeAnim }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>اتجاه الإنفاق الأسبوعي</Text>
            <LineChart
              data={{
                labels: weeklyData.map((_, index) => {
                  const date = new Date(today.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
                  return date.toLocaleDateString('ar', { weekday: 'short' });
                }),
                datasets: [{
                  data: weeklyData.map(item => item.amount),
                  color: (opacity = 1) => colors.primary,
                  strokeWidth: 3,
                }],
              }}
              width={width - 60}
              height={180}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
              withDots={true}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
            />
          </Animated.View>
        )}

        {/* Category Breakdown */}
        {chartData.length > 0 && (
          <Animated.View style={[styles.chartCard, { backgroundColor: colors.card, opacity: fadeAnim }]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>توزيع المصاريف</Text>
              <TouchableOpacity onPress={() => router.push('/analytics')}>
                <Text style={[styles.viewMoreText, { color: colors.primary }]}>عرض التفاصيل</Text>
              </TouchableOpacity>
            </View>
            
            <PieChart
              data={chartData.slice(0, 5)} // عرض أهم 5 فئات فقط
              width={width - 60}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />

            {topCategory && (
              <View style={[styles.topCategoryBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.topCategoryText, { color: colors.primary }]}>
                  أكثر فئة إنفاقاً: {topCategory.name} ({((topCategory.amount / totalExpenses) * 100).toFixed(0)}%)
                راتب شهري: {(userSettings?.salary || 0).toLocaleString()} د.ج
              </View>
            )}
          </Animated.View>
        )}

        {/* Financial Insights */}
        <Animated.View style={[styles.insightsCard, { backgroundColor: colors.card, opacity: fadeAnim }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>رؤى مالية ذكية</Text>
          
          <View style={styles.insightItem}>
            <Activity size={18} color={colors.secondary} />
            <Text style={[styles.insightText, { color: colors.text }]}>
              بمعدل إنفاقك الحالي، ستنفق {projectedMonthlySpend.toFixed(0)} د.ج هذا الشهر
            </Text>
          </View>

          {projectedMonthlySpend > (userSettings?.salary || 0) && (
            <View style={styles.insightItem}>
              <AlertTriangle size={18} color={colors.danger} />
              <Text style={[styles.insightText, { color: colors.danger }]}>
                تحذير: قد تتجاوز راتبك بـ {(projectedMonthlySpend - (userSettings?.salary || 0)).toFixed(0)} د.ج
              </Text>
            </View>
          )}

          <View style={styles.insightItem}>
            <PiggyBank size={18} color={colors.success} />
            <Text style={[styles.insightText, { color: colors.text }]}>
              يمكنك ادخار {(remainingBalance / daysRemaining).toFixed(0)} د.ج يومياً من المبلغ المتبقي
            </Text>
          </View>

          {expenses.length >= 5 && (
            <View style={styles.insightItem}>
              <CheckCircle size={18} color={colors.primary} />
              <Text style={[styles.insightText, { color: colors.text }]}>
                ممتاز! لديك {expenses.length} مصروف مسجل هذا الشهر
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Financial Tip */}
        <Animated.View style={[styles.tipCard, { backgroundColor: colors.primary, opacity: fadeAnim }]}>
          <Text style={styles.tipTitle}>💡 نصيحة مالية ذكية</Text>
          <Text style={styles.tipText}>{financialTip}</Text>
          <TouchableOpacity onPress={setRandomTip} style={styles.refreshTip}>
            <Text style={styles.refreshTipText}>نصيحة جديدة</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.actionsCard, { backgroundColor: colors.card, opacity: fadeAnim }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>إجراءات سريعة</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleAddExpense}
            >
              <Plus size={24} color="white" />
              <Text style={styles.actionButtonText}>إضافة مصروف</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={handleViewAllExpenses}
            >
              <Eye size={24} color="white" />
              <Text style={styles.actionButtonText}>عرض المصاريف</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/goals')}
            >
              <Target size={24} color="white" />
              <Text style={styles.actionButtonText}>الأهداف المالية</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={() => router.push('/analytics')}
            >
              <BarChart3 size={24} color="white" />
              <Text style={styles.actionButtonText}>التقارير التفصيلية</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Recent Expenses Preview */}
        {expenses.length > 0 && (
          <Animated.View style={[styles.recentExpensesCard, { backgroundColor: colors.card, opacity: fadeAnim }]}>
            <View style={styles.recentHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>آخر المصاريف</Text>
              <TouchableOpacity onPress={handleViewAllExpenses}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>عرض الكل</Text>
              </TouchableOpacity>
            </View>

            {expenses.slice(-3).reverse().map((expense) => {
              const categoryInfo = {
                food: { name: 'طعام', emoji: '🍔' },
                transport: { name: 'نقل', emoji: '🚌' },
                bills: { name: 'فواتير', emoji: '💡' },
                entertainment: { name: 'ترفيه', emoji: '🎬' },
                health: { name: 'صحة', emoji: '💊' },
                shopping: { name: 'تسوق', emoji: '🛍️' },
                education: { name: 'تعليم', emoji: '📚' },
                other: { name: 'أخرى', emoji: '📦' },
              }[expense.category] || { name: 'أخرى', emoji: '📦' };

              const moodEmoji = {
                happy: '😊',
                neutral: '😐',
                stressed: '😰',
              }[expense.mood] || '😐';

              return (
                <View key={expense.id} style={[styles.recentExpenseItem, { borderColor: colors.border }]}>
                  <View style={styles.recentExpenseLeft}>
                    <Text style={styles.recentExpenseEmoji}>{categoryInfo.emoji}</Text>
                    <View style={styles.recentExpenseInfo}>
                      <Text style={[styles.recentExpenseCategory, { color: colors.text }]}>
                        {categoryInfo.name}
                      </Text>
                      <Text style={[styles.recentExpenseDate, { color: colors.textSecondary }]}>
                        {new Date(expense.date).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recentExpenseRight}>
                    <Text style={[styles.recentExpenseAmount, { color: colors.danger }]}>
                      -{expense.amount.toLocaleString()} د.ج
                    </Text>
                    <Text style={styles.recentExpenseMood}>{moodEmoji}</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Monthly Projection */}
        <Animated.View style={[styles.projectionCard, { 
          backgroundColor: projectedMonthlySpend > (userSettings?.salary || 0) ? colors.danger : colors.success,
          opacity: fadeAnim 
        }]}>
          <Text style={styles.projectionTitle}>📊 توقعات نهاية الشهر</Text>
          <Text style={styles.projectionText}>
            بناءً على إنفاقك الحالي، من المتوقع أن تنفق {projectedMonthlySpend.toFixed(0)} د.ج هذا الشهر
          </Text>
          {projectedMonthlySpend > (userSettings?.salary || 0) ? (
            <Text style={styles.projectionWarning}>
              ⚠️ هذا يتجاوز راتبك بـ {(projectedMonthlySpend - (userSettings?.salary || 0)).toFixed(0)} د.ج
            </Text>
          ) : (
            <Text style={styles.projectionSuccess}>
              ✅ ستوفر {((userSettings?.salary || 0) - projectedMonthlySpend).toFixed(0)} د.ج تقريباً
            </Text>
          )}
        </Animated.View>

      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleAddExpense}
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Cairo-Medium',
  },
  welcomeDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    fontFamily: 'Cairo-Regular',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    marginBottom: 20,
  },
  setupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  featuresContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 10,
    fontFamily: 'Cairo-Regular',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    marginBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 5,
    fontFamily: 'Cairo-Regular',
  },
  editButton: {
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  statusCard: {
    margin: 15,
    padding: 25,
    borderRadius: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCenter: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
  },
  statusDetails: {
    flex: 1,
    marginLeft: 25,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Cairo-Bold',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
  },
  chartCard: {
    margin: 15,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  viewMoreText: {
    fontSize: 14,
    fontFamily: 'Cairo-Medium',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  topCategoryBadge: {
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
  },
  topCategoryText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  insightsCard: {
    margin: 15,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Cairo-Regular',
  },
  tipCard: {
    margin: 15,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  tipText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 22,
    marginBottom: 15,
    fontFamily: 'Cairo-Regular',
  },
  refreshTip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshTipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  actionsCard: {
    margin: 15,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  recentExpensesCard: {
    margin: 15,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Cairo-Medium',
  },
  recentExpenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentExpenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentExpenseEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  recentExpenseInfo: {
    flex: 1,
  },
  recentExpenseCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  recentExpenseDate: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Cairo-Regular',
  },
  recentExpenseRight: {
    alignItems: 'flex-end',
  },
  recentExpenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  recentExpenseMood: {
    fontSize: 14,
    marginTop: 2,
  },
  projectionCard: {
    margin: 15,
    marginBottom: 100, // مساحة للزر العائم
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  projectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  projectionText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Cairo-Regular',
  },
  projectionWarning: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  projectionSuccess: {
    fontSize: 13,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});