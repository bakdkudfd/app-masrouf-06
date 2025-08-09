import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { DatabaseService, Expense } from '@/utils/database';
import { AnalyticsService } from '@/utils/analytics';
import { ArrowLeft, Calendar, TrendingUp, PieChart, BarChart3, Download, Share2 } from 'lucide-react-native';
import { LineChart, BarChart, PieChart as RNPieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);

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
  };

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const allExpenses = await DatabaseService.getExpenses();
      
      // Filter by selected period
      const filteredExpenses = filterExpensesByPeriod(allExpenses, selectedPeriod);
      setExpenses(filteredExpenses);
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات التقرير');
    } finally {
      setLoading(false);
    }
  };

  const filterExpensesByPeriod = (expenses: Expense[], period: string): Expense[] => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return expenses.filter(expense => new Date(expense.date) >= startDate);
  };

  const getCategoryData = () => {
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

    const categoryColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FF8A65', '#BA68C8', '#FFB74D', '#FFEAA7'
    ];

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: categoryNames[category] || category,
      amount,
      color: categoryColors[index % categoryColors.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    })).sort((a, b) => b.amount - a.amount);
  };

  const getDailySpendingData = () => {
    const dailyTotals: Record<string, number> = {};
    const days = selectedPeriod === 'week' ? 7 : 30;

    // Initialize with zeros
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyTotals[dateKey] = 0;
    }

    // Fill with actual data
    expenses.forEach(expense => {
      const dateKey = expense.date.split('T')[0];
      if (dailyTotals.hasOwnProperty(dateKey)) {
        dailyTotals[dateKey] += expense.amount;
      }
    });

    return Object.entries(dailyTotals).map(([date, amount]) => ({
      date,
      amount,
      label: new Date(date).toLocaleDateString('ar', { 
        weekday: selectedPeriod === 'week' ? 'short' : undefined,
        day: 'numeric',
        month: selectedPeriod === 'month' ? 'short' : undefined,
      }),
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

    const totalAmount = Object.values(moodTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(moodTotals).map(([mood, amount]) => ({
      mood: moodNames[mood] || mood,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }));
  };

  const getKeyMetrics = () => {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageDaily = expenses.length > 0 ? totalAmount / getDaysInPeriod() : 0;
    const transactionCount = expenses.length;
    const averageTransaction = expenses.length > 0 ? totalAmount / expenses.length : 0;

    return {
      totalAmount,
      averageDaily,
      transactionCount,
      averageTransaction,
    };
  };

  const getDaysInPeriod = () => {
    switch (selectedPeriod) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        period: selectedPeriod,
        expenses,
        metrics: getKeyMetrics(),
        categoryData: getCategoryData(),
        moodAnalysis: getMoodAnalysis(),
        generatedAt: new Date().toISOString(),
      };

      // In a real app, this would generate a PDF or CSV
      Alert.alert(
        'تصدير التقرير',
        `تم إنشاء تقرير ${selectedPeriod === 'week' ? 'أسبوعي' : selectedPeriod === 'month' ? 'شهري' : selectedPeriod === 'quarter' ? 'ربع سنوي' : 'سنوي'} يحتوي على ${expenses.length} مصروف`,
        [{ text: 'حسناً' }]
      );
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير التقرير');
    }
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 11, fontFamily: 'Cairo-Regular' },
  };

  const categoryData = getCategoryData();
  const dailyData = getDailySpendingData();
  const moodAnalysis = getMoodAnalysis();
  const metrics = getKeyMetrics();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>التقارير المفصلة</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            جاري تحميل التقارير...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>التقارير المفصلة</Text>
        <TouchableOpacity onPress={handleExportReport}>
          <Download size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Selection */}
      <View style={[styles.periodSelector, { backgroundColor: colors.card }]}>
        {[
          { key: 'week', label: 'أسبوع' },
          { key: 'month', label: 'شهر' },
          { key: 'quarter', label: '3 أشهر' },
          { key: 'year', label: 'سنة' },
        ].map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period.key ? colors.primary : colors.inputBg,
                borderColor: selectedPeriod === period.key ? colors.primary : colors.border,
              }
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === period.key ? 'white' : colors.text }
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Key Metrics */}
        <View style={[styles.metricsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>المؤشرات الرئيسية</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {metrics.totalAmount.toLocaleString()}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                إجمالي الإنفاق (د.ج)
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.secondary }]}>
                {metrics.averageDaily.toFixed(0)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                متوسط يومي (د.ج)
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.accent }]}>
                {metrics.transactionCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                عدد المعاملات
              </Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.warning }]}>
                {metrics.averageTransaction.toFixed(0)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                متوسط المعاملة (د.ج)
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Spending Trend */}
        {dailyData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              اتجاه الإنفاق {selectedPeriod === 'week' ? 'الأسبوعي' : 'الشهري'}
            </Text>
            <LineChart
              data={{
                labels: dailyData.map(item => item.label),
                datasets: [{
                  data: dailyData.map(item => item.amount),
                  color: (opacity = 1) => colors.primary,
                  strokeWidth: 3,
                }],
              }}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
              withDots={true}
              withInnerLines={false}
              withOuterLines={false}
            />
          </View>
        )}

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>توزيع الإنفاق حسب الفئة</Text>
            <RNPieChart
              data={categoryData}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
            
            {/* Category Details */}
            <View style={styles.categoryDetails}>
              {categoryData.slice(0, 5).map((category, index) => (
                <View key={index} style={styles.categoryDetailItem}>
                  <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                  <Text style={[styles.categoryDetailName, { color: colors.text }]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.categoryDetailAmount, { color: colors.textSecondary }]}>
                    {category.amount.toLocaleString()} د.ج
                  </Text>
                  <Text style={[styles.categoryDetailPercentage, { color: colors.primary }]}>
                    {((category.amount / metrics.totalAmount) * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mood Analysis */}
        {moodAnalysis.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>تحليل الحالة المزاجية</Text>
            
            {moodAnalysis.map((mood, index) => {
              const moodColors = {
                'سعيد': colors.success,
                'عادي': colors.accent,
                'متوتر': colors.danger,
              };
              
              const moodEmojis = {
                'سعيد': '😊',
                'عادي': '😐',
                'متوتر': '😰',
              };

              return (
                <View key={index} style={styles.moodAnalysisItem}>
                  <View style={styles.moodHeader}>
                    <Text style={styles.moodEmoji}>{moodEmojis[mood.mood as keyof typeof moodEmojis]}</Text>
                    <Text style={[styles.moodName, { color: colors.text }]}>{mood.mood}</Text>
                    <Text style={[styles.moodPercentage, { color: moodColors[mood.mood as keyof typeof moodColors] }]}>
                      {mood.percentage.toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={styles.moodProgressBar}>
                    <View 
                      style={[
                        styles.moodProgressFill,
                        { 
                          width: `${mood.percentage}%`,
                          backgroundColor: moodColors[mood.mood as keyof typeof moodColors],
                        }
                      ]} 
                    />
                  </View>
                  
                  <Text style={[styles.moodAmount, { color: colors.textSecondary }]}>
                    {mood.amount.toLocaleString()} د.ج
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Spending Insights */}
        <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>رؤى ذكية</Text>
          
          {categoryData.length > 0 && (
            <View style={styles.insightItem}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={[styles.insightText, { color: colors.text }]}>
                أكثر فئة إنفاقاً: {categoryData[0].name} بنسبة {((categoryData[0].amount / metrics.totalAmount) * 100).toFixed(1)}%
              </Text>
            </View>
          )}

          <View style={styles.insightItem}>
            <Calendar size={20} color={colors.secondary} />
            <Text style={[styles.insightText, { color: colors.text }]}>
              متوسط الإنفاق اليومي: {metrics.averageDaily.toFixed(0)} د.ج
            </Text>
          </View>

          <View style={styles.insightItem}>
            <BarChart3 size={20} color={colors.accent} />
            <Text style={[styles.insightText, { color: colors.text }]}>
              متوسط قيمة المعاملة: {metrics.averageTransaction.toFixed(0)} د.ج
            </Text>
          </View>

          {moodAnalysis.length > 0 && (
            <View style={styles.insightItem}>
              <PieChart size={20} color={colors.warning} />
              <Text style={[styles.insightText, { color: colors.text }]}>
                أكثر حالة مزاجية إنفاقاً: {moodAnalysis[0].mood}
              </Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        <View style={[styles.recommendationsCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.recommendationsTitle}>💡 توصيات لتحسين الإنفاق</Text>
          
          {categoryData.length > 0 && categoryData[0].amount > metrics.totalAmount * 0.4 && (
            <Text style={styles.recommendationText}>
              • تركز إنفاقك على {categoryData[0].name}، حاول تنويع مصاريفك أكثر
            </Text>
          )}
          
          {metrics.averageDaily > 1000 && (
            <Text style={styles.recommendationText}>
              • متوسط إنفاقك اليومي مرتفع، حاول وضع حد أقصى يومي
            </Text>
          )}
          
          {moodAnalysis.find(m => m.mood === 'متوتر')?.percentage > 30 && (
            <Text style={styles.recommendationText}>
              • تنفق أكثر عندما تكون متوتراً، جرب تقنيات الاسترخاء قبل الشراء
            </Text>
          )}
          
          <Text style={styles.recommendationText}>
            • ضع ميزانية أسبوعية قدرها {(metrics.averageDaily * 7).toFixed(0)} د.ج للتحكم في الإنفاق
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  periodButton: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  scrollView: {
    flex: 1,
  },
  metricsContainer: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Cairo-Bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Cairo-Bold',
  },
  metricLabel: {
    fontSize: 12,
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
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Cairo-Bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryDetails: {
    width: '100%',
    marginTop: 15,
  },
  categoryDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryDetailName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
  },
  categoryDetailAmount: {
    fontSize: 12,
    marginRight: 10,
    fontFamily: 'Cairo-Regular',
  },
  categoryDetailPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  moodAnalysisItem: {
    marginBottom: 15,
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  moodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  moodPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  moodProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 5,
    overflow: 'hidden',
  },
  moodProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  moodAmount: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
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
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
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
    fontSize: 13,
    color: 'white',
    marginBottom: 8,
    lineHeight: 18,
    fontFamily: 'Cairo-Regular',
  },
});