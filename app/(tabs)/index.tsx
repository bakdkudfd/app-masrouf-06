import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { CreditCard as Edit3, TrendingUp, TrendingDown, DollarSign, Calendar, Plus,
  BarChart3 } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  mood: string;
  note?: string;
}

interface UserData {
  salary: number;
  monthlyExpenses: Expense[];
  salaryDate: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [userData, setUserData] = useState<UserData>({
    salary: 0,
    monthlyExpenses: [],
    salaryDate: new Date().toISOString(),
  });

  const [financialTip, setFinancialTip] = useState('');

  const colors = {
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FF9800',
    danger: '#F44336',
    background: isDark ? '#1A1A1A' : '#F8F9FA',
    card: isDark ? '#2D2D2D' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#333333',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    border: isDark ? '#404040' : '#E0E0E0',
  };

  const financialTips = [
    'قلل من شراء القهوة اليومية واشرب في البيت',
    'خطط لمصاريفك قبل بداية كل أسبوع',
    'احتفظ بـ 10% من راتبك كادخار شهري',
    'تسوق بقائمة محددة لتجنب الشراء العشوائي',
    'قارن الأسعار قبل شراء أي شيء مكلف',
    'استخدم التطبيقات المجانية بدلاً من المدفوعة',
  ];

  useEffect(() => {
    loadUserData();
    setRandomTip();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const setRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * financialTips.length);
    setFinancialTip(financialTips[randomIndex]);
  };

  const totalExpenses = userData.monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingBalance = userData.salary - totalExpenses;
  const spendingPercentage = userData.salary > 0 ? (totalExpenses / userData.salary) * 100 : 0;

  const getCategoryTotals = () => {
    const categories = userData.monthlyExpenses.reduce((acc, expense) => {
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
      other: '#FFEAA7',
    };
    return categoryColors[category] || '#DDD';
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

  const chartData = getCategoryTotals();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.appTitle, { color: colors.text }]}>مصروفي</Text>
          <TouchableOpacity onPress={handleEditSalary}>
            <Edit3 size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Financial Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>راتبك الحالي</Text>
              <Text style={[styles.overviewAmount, { color: colors.primary }]}>
                {userData.salary.toLocaleString()} د.ج
              </Text>
            </View>
            <DollarSign size={32} color={colors.primary} />
          </View>
          
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>إجمالي المصاريف الشهرية</Text>
              <Text style={[styles.overviewAmount, { color: colors.danger }]}>
                {totalExpenses.toLocaleString()} د.ج
              </Text>
            </View>
            <TrendingUp size={32} color={colors.danger} />
          </View>

          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>المبلغ المتبقي</Text>
              <Text style={[styles.overviewAmount, { 
                color: remainingBalance >= 0 ? colors.primary : colors.danger 
              }]}>
                {remainingBalance.toLocaleString()} د.ج
              </Text>
            </View>
            {remainingBalance >= 0 ? 
              <TrendingUp size={32} color={colors.primary} /> : 
              <TrendingDown size={32} color={colors.danger} />
            }
          </View>
        </View>

        {/* Spending Chart */}
        {chartData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>توزيع المصاريف</Text>
            <PieChart
              data={chartData}
              width={width - 60}
              height={200}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </View>
        )}

        {/* Financial Tip */}
        <View style={[styles.tipCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.tipTitle}>💡 نصيحة مالية</Text>
          <Text style={styles.tipText}>{financialTip}</Text>
          <TouchableOpacity onPress={setRandomTip} style={styles.refreshTip}>
            <Text style={styles.refreshTipText}>نصيحة جديدة</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>إجراءات سريعة</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/add-expense')}
            >
              <Plus size={24} color="white" />
              <Text style={styles.actionButtonText}>إضافة مصروف</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={handleViewAllExpenses}
            >
              <BarChart3 size={24} color="white" />
              <Text style={styles.actionButtonText}>قائمة المصاريف</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.actionsRow, { marginTop: 10 }]}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={handleBudgetPlanner}
            >
              <Target size={24} color="white" />
              <Text style={styles.actionButtonText}>مخطط الميزانية</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={() => router.push('/analytics')}
            >
              <BarChart3 size={24} color="white" />
              <Text style={styles.actionButtonText}>التقارير</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget Status */}
        <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>حالة الميزانية</Text>
          <View style={styles.budgetProgress}>
            <View 
              style={[
                styles.budgetBar, 
                { 
                  width: `${Math.min(spendingPercentage, 100)}%`,
                  backgroundColor: spendingPercentage > 80 ? colors.danger : colors.primary
                }
              ]} 
            />
          </View>
          <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
            لقد أنفقت {spendingPercentage.toFixed(1)}% من راتبك هذا الشهر
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
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
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  overviewItem: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Cairo-Regular',
  },
  overviewAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  tipCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
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
    marginBottom: 10,
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
    fontFamily: 'Cairo-Medium',
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  budgetCard: {
    margin: 15,
    marginBottom: 30,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  budgetProgress: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  budgetBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
  },
});