import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Plus, CreditCard as Edit3, Trash2, Save, Target, DollarSign, Calendar } from 'lucide-react-native';
import { CircularProgress } from '@/components/CircularProgress';

interface BudgetCategory {
  id: string;
  name: string;
  emoji: string;
  budgetAmount: number;
  spentAmount: number;
  color: string;
}

interface MonthlyBudget {
  totalBudget: number;
  categories: BudgetCategory[];
  createdAt: string;
  month: string;
}

export default function BudgetPlannerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    budgetAmount: '',
    emoji: '💰',
  });

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
    modalBackground: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
    inputBg: isDark ? '#404040' : '#F5F5F5',
  };

  const defaultCategories = [
    { id: 'food', name: 'طعام', emoji: '🍔', color: '#FF6B6B' },
    { id: 'transport', name: 'نقل', emoji: '🚌', color: '#4ECDC4' },
    { id: 'bills', name: 'فواتير', emoji: '💡', color: '#45B7D1' },
    { id: 'entertainment', name: 'ترفيه', emoji: '🎬', color: '#96CEB4' },
    { id: 'health', name: 'صحة', emoji: '💊', color: '#FF8A65' },
    { id: 'shopping', name: 'تسوق', emoji: '🛍️', color: '#BA68C8' },
  ];

  useEffect(() => {
    loadBudget();
    loadActualSpending();
  }, []);

  const loadBudget = async () => {
    try {
      const savedBudget = await AsyncStorage.getItem('monthlyBudget');
      if (savedBudget) {
        setBudget(JSON.parse(savedBudget));
      } else {
        // Create default budget
        const defaultBudget: MonthlyBudget = {
          totalBudget: 0,
          categories: defaultCategories.map(cat => ({
            ...cat,
            budgetAmount: 0,
            spentAmount: 0,
          })),
          createdAt: new Date().toISOString(),
          month: new Date().toISOString().slice(0, 7),
        };
        setBudget(defaultBudget);
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    }
  };

  const loadActualSpending = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData && budget) {
        const parsedData = JSON.parse(userData);
        const expenses = parsedData.monthlyExpenses || [];
        
        // Calculate actual spending per category
        const categorySpending = expenses.reduce((acc: Record<string, number>, expense: any) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {});

        // Update budget with actual spending
        const updatedBudget = {
          ...budget,
          categories: budget.categories.map(cat => ({
            ...cat,
            spentAmount: categorySpending[cat.id] || 0,
          })),
        };

        setBudget(updatedBudget);
      }
    } catch (error) {
      console.error('Error loading actual spending:', error);
    }
  };

  const saveBudget = async (updatedBudget: MonthlyBudget) => {
    try {
      await AsyncStorage.setItem('monthlyBudget', JSON.stringify(updatedBudget));
      setBudget(updatedBudget);
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الميزانية');
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.budgetAmount) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    const amount = parseFloat(newCategory.budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    const newBudgetCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: newCategory.name,
      emoji: newCategory.emoji,
      budgetAmount: amount,
      spentAmount: 0,
      color: defaultCategories[Math.floor(Math.random() * defaultCategories.length)].color,
    };

    const updatedBudget = {
      ...budget!,
      categories: [...budget!.categories, newBudgetCategory],
      totalBudget: budget!.totalBudget + amount,
    };

    saveBudget(updatedBudget);
    setNewCategory({ name: '', budgetAmount: '', emoji: '💰' });
    setShowAddModal(false);
  };

  const handleUpdateCategoryBudget = (categoryId: string, newAmount: number) => {
    if (!budget) return;

    const updatedCategories = budget.categories.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, budgetAmount: newAmount };
      }
      return cat;
    });

    const newTotalBudget = updatedCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0);

    const updatedBudget = {
      ...budget,
      categories: updatedCategories,
      totalBudget: newTotalBudget,
    };

    saveBudget(updatedBudget);
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return colors.danger;
    if (percentage >= 80) return colors.warning;
    return colors.primary;
  };

  if (!budget) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري التحميل...</Text>
      </View>
    );
  }

  const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  const totalBudgetProgress = getProgressPercentage(totalSpent, budget.totalBudget);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>مخطط الميزانية</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Overall Budget Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>ملخص الميزانية الشهرية</Text>
          
          <View style={styles.summaryContent}>
            <CircularProgress
              size={120}
              width={8}
              fill={totalBudgetProgress}
              tintColor={getProgressColor(totalBudgetProgress)}
              backgroundColor={colors.border}
            >
              {() => (
                <View style={styles.progressCenter}>
                  <Text style={[styles.progressPercentage, { color: colors.text }]}>
                    {totalBudgetProgress.toFixed(0)}%
                  </Text>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                    مُستخدم
                  </Text>
                </View>
              )}
            </CircularProgress>

            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>الميزانية الكلية:</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {budget.totalBudget.toLocaleString()} د.ج
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>المُنفق:</Text>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>
                  {totalSpent.toLocaleString()} د.ج
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>المتبقي:</Text>
                <Text style={[styles.summaryValue, { 
                  color: (budget.totalBudget - totalSpent) >= 0 ? colors.primary : colors.danger 
                }]}>
                  {(budget.totalBudget - totalSpent).toLocaleString()} د.ج
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Category Budgets */}
        <View style={[styles.categoriesContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ميزانية الفئات</Text>
          
          {budget.categories.map((category) => {
            const progress = getProgressPercentage(category.spentAmount, category.budgetAmount);
            const progressColor = getProgressColor(progress);
            
            return (
              <View key={category.id} style={[styles.categoryCard, { backgroundColor: colors.inputBg }]}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category.name}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.editCategoryButton, { backgroundColor: colors.secondary }]}
                    onPress={() => {
                      Alert.prompt(
                        'تعديل الميزانية',
                        `أدخل الميزانية الجديدة لفئة ${category.name}:`,
                        [
                          { text: 'إلغاء', style: 'cancel' },
                          {
                            text: 'حفظ',
                            onPress: (value) => {
                              const newAmount = parseFloat(value || '0');
                              if (!isNaN(newAmount) && newAmount >= 0) {
                                handleUpdateCategoryBudget(category.id, newAmount);
                              }
                            },
                          },
                        ],
                        'plain-text',
                        category.budgetAmount.toString(),
                        'numeric'
                      );
                    }}
                  >
                    <Edit3 size={16} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.categoryProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: progressColor,
                        }
                      ]} 
                    />
                  </View>
                  
                  <View style={styles.categoryAmounts}>
                    <Text style={[styles.spentAmount, { color: colors.danger }]}>
                      {category.spentAmount.toLocaleString()} د.ج
                    </Text>
                    <Text style={[styles.budgetAmount, { color: colors.textSecondary }]}>
                      من {category.budgetAmount.toLocaleString()} د.ج
                    </Text>
                  </View>

                  <Text style={[styles.progressText, { color: progressColor }]}>
                    {progress.toFixed(0)}%
                  </Text>
                </View>

                {progress >= 100 && (
                  <View style={[styles.warningBadge, { backgroundColor: colors.danger + '20' }]}>
                    <Text style={[styles.warningText, { color: colors.danger }]}>
                      ⚠️ تم تجاوز الميزانية المحددة
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Budget Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.tipsTitle}>💡 نصائح لإدارة الميزانية</Text>
          <Text style={styles.tipText}>• ضع ميزانية واقعية لكل فئة بناءً على إنفاقك السابق</Text>
          <Text style={styles.tipText}>• راجع ميزانيتك أسبوعياً وعدّلها حسب الحاجة</Text>
          <Text style={styles.tipText}>• احتفظ بـ 20% من راتبك كاحتياطي للطوارئ</Text>
          <Text style={styles.tipText}>• استخدم قاعدة 50/30/20: 50% للضروريات، 30% للرغبات، 20% للادخار</Text>
        </View>

      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة فئة ميزانية</Text>

            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={newCategory.name}
              onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
              placeholder="اسم الفئة"
              placeholderTextColor={colors.textSecondary}
            />

            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={newCategory.budgetAmount}
              onChangeText={(text) => setNewCategory({ ...newCategory, budgetAmount: text })}
              placeholder="الميزانية المخصصة (د.ج)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddCategory}
              >
                <Text style={styles.modalButtonText}>إضافة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  scrollView: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    fontFamily: 'Cairo-Regular',
  },
  summaryCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Cairo-Bold',
  },
  summaryContent: {
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
  summaryDetails: {
    flex: 1,
    marginLeft: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  categoriesContainer: {
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
  categoryCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  editCategoryButton: {
    padding: 8,
    borderRadius: 8,
  },
  categoryProgress: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  spentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  budgetAmount: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  warningBadge: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
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
    marginBottom: 15,
    fontFamily: 'Cairo-Bold',
  },
  tipText: {
    fontSize: 13,
    color: 'white',
    marginBottom: 8,
    lineHeight: 18,
    fontFamily: 'Cairo-Regular',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 25,
    borderRadius: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Cairo-Bold',
  },
  modalInput: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
});