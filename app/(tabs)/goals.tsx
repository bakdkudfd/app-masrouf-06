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
import { DatabaseService, FinancialGoal } from '@/utils/database';
import { Plus, Target, Calendar, DollarSign, Trophy, Edit3, Trash2 } from 'lucide-react-native';
import { CircularProgress } from 'react-native-circular-progress';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';


export default function GoalsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    category: '',
    emoji: '🎯',
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
  };

  const goalCategories = [
    { id: 'electronics', name: 'إلكترونيات', emoji: '📱' },
    { id: 'travel', name: 'سفر', emoji: '✈️' },
    { id: 'education', name: 'تعليم', emoji: '📚' },
    { id: 'health', name: 'صحة', emoji: '🏥' },
    { id: 'home', name: 'منزل', emoji: '🏠' },
    { id: 'car', name: 'سيارة', emoji: '🚗' },
    { id: 'clothing', name: 'ملابس', emoji: '👕' },
    { id: 'emergency', name: 'طوارئ', emoji: '🆘' },
    { id: 'investment', name: 'استثمار', emoji: '💼' },
    { id: 'other', name: 'أخرى', emoji: '🎯' },
  ];

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const goalsData = await DatabaseService.getFinancialGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async (updatedGoals: FinancialGoal[]) => {
    try {
      // This method is no longer needed as we save directly to database
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline || !newGoal.category) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const amount = parseFloat(newGoal.targetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    const categoryData = goalCategories.find(cat => cat.id === newGoal.category);
    const goal: FinancialGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      target_amount: amount,
      current_amount: 0,
      deadline: newGoal.deadline,
      category: newGoal.category,
      emoji: categoryData?.emoji || '🎯',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_completed: false,
    };

    await DatabaseService.addFinancialGoal(goal);
    await loadGoals();
    
    setNewGoal({ title: '', targetAmount: '', deadline: '', category: '', emoji: '🎯' });
    setShowAddModal(false);
    Alert.alert('تم الحفظ', 'تم إضافة الهدف المالي بنجاح');
  };

  const handleUpdateProgress = (goalId: string, amount: number) => {
    Alert.prompt(
      'تحديث التقدم',
      'أدخل المبلغ المحفوظ:',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حفظ',
          onPress: async (inputAmount) => {
            const amountToAdd = parseFloat(inputAmount || '0');
            if (isNaN(amountToAdd) || amountToAdd < 0) {
              Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
              return;
            }

            const updatedGoals = goals.map(goal => {
              if (goal.id === goalId) {
                return {
                  ...goal,
                  current_amount: Math.min(goal.current_amount + amountToAdd, goal.target_amount),
                };
              }
              return goal;
            });

            // Update in database
            const goalToUpdate = goals.find(g => g.id === goalId);
            if (goalToUpdate) {
              const newAmount = Math.min(goalToUpdate.current_amount + amountToAdd, goalToUpdate.target_amount);
              await DatabaseService.updateFinancialGoal(goalId, { 
                current_amount: newAmount,
                is_completed: newAmount >= goalToUpdate.target_amount,
              });
              await loadGoals();
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      'حذف الهدف',
      'هل أنت متأكد من حذف هذا الهدف؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => {
            DatabaseService.deleteFinancialGoal(goalId).then(() => {
              loadGoals();
            });
          }
        },
      ]
    );
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return <LoadingSpinner message="جاري تحميل الأهداف..." />;
  }

  const getDaysRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryName = (categoryId: string) => {
    const category = goalCategories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>الأهداف المالية</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        
        {goals.length === 0 ? (
          <EmptyState
            icon={<Target size={64} color={colors.textSecondary} />}
            title="لا توجد أهداف مالية"
            subtitle="ابدأ بإضافة هدف مالي لتتبع تقدمك نحو أحلامك"
            actionText="إضافة هدف جديد"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          goals.map((goal) => {
            const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isCompleted = progress >= 100;
            const isOverdue = daysRemaining < 0;

            return (
              <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card }]}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleContainer}>
                    <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                    <View style={styles.goalTextContainer}>
                      <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                      <Text style={[styles.goalCategory, { color: colors.textSecondary }]}>
                        {getCategoryName(goal.category)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleUpdateProgress(goal.id, goal.targetAmount)}
                    >
                      <Plus size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.danger }]}
                      onPress={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <CircularProgress
                    size={80}
                    width={6}
                    fill={progress}
                    tintColor={isCompleted ? colors.success : isOverdue ? colors.danger : colors.primary}
                    backgroundColor={colors.border}
                    rotation={0}
                  >
                    {() => (
                      <Text style={[styles.progressText, { color: colors.text }]}>
                        {progress.toFixed(0)}%
                      </Text>
                    )}
                  </CircularProgress>

                  <View style={styles.progressDetails}>
                    <View style={styles.amountRow}>
                      <Text style={[styles.currentAmount, { color: colors.primary }]}>
                        {goal.current_amount.toLocaleString()} د.ج
                      </Text>
                      <Text style={[styles.targetAmount, { color: colors.textSecondary }]}>
                        من {goal.target_amount.toLocaleString()} د.ج
                      </Text>
                    </View>

                    <View style={styles.deadlineContainer}>
                      <Calendar size={16} color={isOverdue ? colors.danger : colors.textSecondary} />
                      <Text style={[styles.deadlineText, { 
                        color: isOverdue ? colors.danger : colors.textSecondary 
                      }]}>
                        {isOverdue 
                          ? `متأخر بـ ${Math.abs(daysRemaining)} يوم`
                          : isCompleted
                            ? 'مكتمل! 🎉'
                            : `${daysRemaining} يوم متبقي`
                        }
                      </Text>
                    </View>

                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Trophy size={16} color={colors.success} />
                        <Text style={[styles.completedText, { color: colors.success }]}>
                          تم تحقيق الهدف!
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة هدف مالي جديد</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="عنوان الهدف (مثل: شراء هاتف جديد)"
              placeholderTextColor={colors.textSecondary}
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="المبلغ المطلوب (د.ج)"
              placeholderTextColor={colors.textSecondary}
              value={newGoal.targetAmount}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="تاريخ الهدف (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              value={newGoal.deadline}
              onChangeText={(text) => setNewGoal({ ...newGoal, deadline: text })}
            />

            {/* Category Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>اختر فئة الهدف:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {goalCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    { 
                      backgroundColor: newGoal.category === category.id 
                        ? colors.primary + '20' 
                        : colors.background,
                      borderColor: newGoal.category === category.id 
                        ? colors.primary 
                        : colors.border,
                    }
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, category: category.id, emoji: category.emoji })}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddGoal}
              >
                <Text style={styles.modalButtonText}>حفظ الهدف</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    margin: 15,
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: 'Cairo-Regular',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  goalCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Cairo-Bold',
  },
  goalCategory: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  progressDetails: {
    flex: 1,
    marginLeft: 20,
  },
  amountRow: {
    marginBottom: 8,
  },
  currentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  targetAmount: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deadlineText: {
    fontSize: 12,
    marginLeft: 5,
    fontFamily: 'Cairo-Regular',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
    fontFamily: 'Cairo-Bold',
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
    padding: 20,
    borderRadius: 15,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Cairo-Bold',
  },
  input: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoryOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 10,
    minWidth: 80,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Cairo-SemiBold',
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