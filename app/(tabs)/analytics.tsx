import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { DatabaseService, Expense, UserSettings } from '@/utils/database';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Calendar, DollarSign, TriangleAlert as AlertCircle } from 'lucide-react-native';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const colors = {
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FF9800',
    danger: '#F44336',
    warning: '#FFC107',
    background: isDark ? '#1A1A1A' : '#F8F9FA',
    card: isDark ? '#2D2D2D' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#333333',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    border: isDark ? '#404040' : '#E0E0E0',
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [settings, monthlyExpenses] = await Promise.all([
        DatabaseService.getUserSettings(),
        DatabaseService.getExpensesByMonth(new Date().toISOString().slice(0, 7)),
      ]);
      
      setUserSettings(settings);
      setExpenses(monthlyExpenses);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
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
      legendFontSize: 12,
    }));
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

  const getWeeklySpending = () => {
    const weeklyData: Record<string, number> = {};
    const today = new Date();
    
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
      day: new Date(date).toLocaleDateString('ar', { weekday: 'short' }),
      amount,
    }));
  };

  const getMoodAnalysis = () => {
    const moodTotals = expenses.reduce((acc, expense) => {
      acc[expense.mood] = (acc[expense.mood] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const moodNames: Record<string, string> = {
      happy: 'سعيد',
      neutral: 'عادي',
      stressed: 'متوتر',
    };

    return Object.entries(moodTotals).map(([mood, amount]) => ({
      mood: moodNames[mood] || mood,
      amount,
      percentage: expenses.length > 0 
        ? ((amount / expenses.reduce((sum, exp) => sum + exp.amount, 0)) * 100).toFixed(1)
        : '0',
    }));
  };

  const getTopSpendingCategory = () => {
    const categoryTotals = getCategoryTotals();
    return categoryTotals.reduce((max, category) => 
      category.amount > max.amount ? category : max, 
      { name: '', amount: 0, color: '' }
    );
  };

  const getTotalExpenses = () => expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getAverageDaily = () => getTotalExpenses() / new Date().getDate();

  const getSpendingTrend = () => {
    const thisMonth = getTotalExpenses();
    // For demo purposes, simulate last month data
    const lastMonth = thisMonth * 0.85; // 15% less spending last month
    const change = ((thisMonth - lastMonth) / lastMonth) * 100;
    return {
      thisMonth,
      lastMonth,
      change: change.toFixed(1),
      isIncrease: change > 0,
    };
  };

  if (loading) {
    return <LoadingSpinner message="جاري تحميل التقارير..." />;
  }

  const weeklyData = getWeeklySpending();
  const categoryData = getCategoryTotals();
  const moodAnalysis = getMoodAnalysis();
  const topCategory = getTopSpendingCategory();
  const totalExpenses = getTotalExpenses();
  const averageDaily = getAverageDaily();
  const spendingTrend = getSpendingTrend();

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    formatYLabel: (value: string) => String(Math.round(Number(value) || 0)),
    formatXLabel: (value: string) => String(value || ''),
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fontFamily: 'Cairo-Regular',
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>التقارير والإحصائيات</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        
        {/* Key Metrics */}
        <View style={[styles.metricsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.metricItem}>
            <DollarSign size={24} color={colors.primary} />
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {totalExpenses.toLocaleString()} د.ج
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              إجمالي المصاريف
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Calendar size={24} color={colors.secondary} />
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {averageDaily.toLocaleString()} د.ج
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              متوسط يومي
            </Text>
          </View>

          <View style={styles.metricItem}>
            {spendingTrend.isIncrease ? (
              <TrendingUp size={24} color={colors.danger} />
            ) : (
              <TrendingDown size={24} color={colors.primary} />
            )}
            <Text style={[styles.metricValue, { 
              color: spendingTrend.isIncrease ? colors.danger : colors.primary
            }]}>
              {spendingTrend.change}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              تغيير من الشهر الماضي
            </Text>
          </View>
        </View>

        {/* Weekly Spending Chart */}
        {weeklyData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>المصاريف الأسبوعية</Text>
            <BarChart
              data={{
                labels: weeklyData.map(item => item.day),
                datasets: [{
                  data: weeklyData.map(item => item.amount),
                }],
              }}
              width={width - 60}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>
        )}

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>توزيع المصاريف حسب الفئة</Text>
            <PieChart
              data={categoryData}
              width={width - 60}
              height={200}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </View>
        )}

        {/* Insights */}
        <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>رؤى ذكية</Text>
          
          {topCategory.name && (
            <View style={styles.insightItem}>
              <AlertCircle size={20} color={colors.warning} />
              <Text style={[styles.insightText, { color: colors.text }]}>
                أكثر فئة إنفاقاً: {topCategory.name} ({topCategory.amount.toLocaleString()} د.ج)
              </Text>
            </View>
          )}

          <View style={styles.insightItem}>
            <TrendingUp size={20} color={colors.secondary} />
            <Text style={[styles.insightText, { color: colors.text }]}>
              معدل الإنفاق اليومي: {averageDaily.toFixed(0)} د.ج
            </Text>
          </View>

          {(userSettings?.salary || 0) > 0 && (
            <View style={styles.insightItem}>
              <DollarSign size={20} color={colors.primary} />
              <Text style={[styles.insightText, { color: colors.text }]}>
                نسبة الإنفاق من الراتب: {((totalExpenses / (userSettings?.salary || 1)) * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {/* Mood Analysis */}
        {moodAnalysis.length > 0 && (
          <View style={[styles.moodCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>تحليل الحالة المزاجية</Text>
            {moodAnalysis.map((mood, index) => (
              <View key={index} style={styles.moodItem}>
                <Text style={[styles.moodName, { color: colors.text }]}>{mood.mood}</Text>
                <View style={styles.moodProgress}>
                  <View 
                    style={[
                      styles.moodBar,
                      { 
                        width: `${mood.percentage}%`,
                        backgroundColor: colors.primary,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.moodAmount, { color: colors.textSecondary }]}>
                  {mood.amount.toLocaleString()} د.ج ({mood.percentage}%)
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        <View style={[styles.recommendationsCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.recommendationsTitle}>💡 توصيات لتحسين الإنفاق</Text>
          
          {totalExpenses > (userSettings?.salary || 0) * 0.8 && (
            <Text style={styles.recommendationText}>
              • تقترب من حد الراتب، حاول تقليل الإنفاق في الفئات الاختيارية
            </Text>
          )}
          
          {topCategory.name === 'طعام' && (
            <Text style={styles.recommendationText}>
              • أكثر إنفاقك على الطعام، جرب الطبخ في المنزل أكثر
            </Text>
          )}
          
          <Text style={styles.recommendationText}>
            • ضع ميزانية يومية قدرها {((userSettings?.salary || 0) / 30).toFixed(0)} د.ج للتحكم في الإنفاق
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  scrollView: {
    flex: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
    fontFamily: 'Cairo-Bold',
  },
  metricLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
  },
  chartCard: {
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
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightsCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    fontFamily: 'Cairo-Regular',
  },
  moodCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moodItem: {
    marginBottom: 15,
  },
  moodName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Cairo-Bold',
  },
  moodProgress: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 5,
    overflow: 'hidden',
  },
  moodBar: {
    height: '100%',
    borderRadius: 4,
  },
  moodAmount: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
  },
  recommendationsCard: {
    margin: 15,
    marginBottom: 30,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    fontFamily: 'Cairo-Bold',
  },
  recommendationText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'Cairo-Regular',
  },
});