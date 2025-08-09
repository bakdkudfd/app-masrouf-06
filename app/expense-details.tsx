import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StorageService, Expense } from '@/utils/storage';
import { ArrowLeft, CreditCard as Edit3, Trash2, Save, Calendar, MessageSquare, Hash } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ExpenseDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { expenseId } = useLocalSearchParams();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedExpense, setEditedExpense] = useState<Partial<Expense>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    inputBg: isDark ? '#404040' : '#F5F5F5',
  };

  const categories = [
    { id: 'food', name: 'طعام', emoji: '🍔', color: '#FF6B6B' },
    { id: 'transport', name: 'نقل', emoji: '🚌', color: '#4ECDC4' },
    { id: 'bills', name: 'فواتير', emoji: '💡', color: '#45B7D1' },
    { id: 'entertainment', name: 'ترفيه', emoji: '🎬', color: '#96CEB4' },
    { id: 'health', name: 'صحة', emoji: '💊', color: '#FF8A65' },
    { id: 'shopping', name: 'تسوق', emoji: '🛍️', color: '#BA68C8' },
    { id: 'education', name: 'تعليم', emoji: '📚', color: '#FFB74D' },
    { id: 'other', name: 'أخرى', emoji: '📦', color: '#FFEAA7' },
  ];

  const moods = [
    { id: 'happy', name: 'سعيد', emoji: '😊', color: '#4CAF50' },
    { id: 'neutral', name: 'عادي', emoji: '😐', color: '#FF9800' },
    { id: 'stressed', name: 'متوتر', emoji: '😰', color: '#F44336' },
  ];

  useEffect(() => {
    loadExpenseDetails();
  }, [expenseId]);

  const loadExpenseDetails = async () => {
    try {
      const userData = await StorageService.getUserData();
      if (userData && expenseId) {
        const foundExpense = userData.monthlyExpenses.find(exp => exp.id === expenseId);
        if (foundExpense) {
          setExpense(foundExpense);
          setEditedExpense(foundExpense);
        }
      }
    } catch (error) {
      console.error('Error loading expense details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل تفاصيل المصروف');
    }
  };

  const handleSaveChanges = async () => {
    if (!editedExpense.amount || !editedExpense.category || !editedExpense.mood) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const amount = parseFloat(editedExpense.amount.toString());
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    try {
      await StorageService.updateExpense(expense!.id, {
        ...editedExpense,
        amount,
      });
      
      setExpense({ ...expense!, ...editedExpense, amount });
      setIsEditing(false);
      Alert.alert('تم الحفظ', 'تم تحديث المصروف بنجاح');
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث المصروف');
    }
  };

  const handleDeleteExpense = () => {
    Alert.alert(
      'حذف المصروف',
      'هل أنت متأكد من حذف هذا المصروف؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteExpense(expense!.id);
              Alert.alert('تم الحذف', 'تم حذف المصروف بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المصروف');
            }
          },
        },
      ]
    );
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
  };

  const getMoodInfo = (moodId: string) => {
    return moods.find(mood => mood.id === moodId) || moods[1];
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && isEditing) {
      setEditedExpense({ ...editedExpense, date: selectedDate.toISOString() });
    }
  };

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>تفاصيل المصروف</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            جاري التحميل...
          </Text>
        </View>
      </View>
    );
  }

  const categoryInfo = getCategoryInfo(isEditing ? editedExpense.category! : expense.category);
  const moodInfo = getMoodInfo(isEditing ? editedExpense.mood! : expense.mood);
  const displayDate = new Date(isEditing ? editedExpense.date! : expense.date);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>تفاصيل المصروف</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Edit3 size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Amount Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.amountHeader}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>المبلغ</Text>
            {isEditing && (
              <Text style={[styles.editingIndicator, { color: colors.accent }]}>جاري التعديل</Text>
            )}
          </View>
          
          {isEditing ? (
            <View style={styles.amountEditContainer}>
              <TextInput
                style={[styles.amountEditInput, { 
                  backgroundColor: colors.inputBg, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={editedExpense.amount?.toString() || ''}
                onChangeText={(text) => setEditedExpense({ ...editedExpense, amount: parseFloat(text) || 0 })}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.currencyText, { color: colors.textSecondary }]}>د.ج</Text>
            </View>
          ) : (
            <Text style={[styles.amountValue, { color: colors.primary }]}>
              {expense.amount.toLocaleString()} د.ج
            </Text>
          )}
        </View>

        {/* Category Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>التصنيف</Text>
          
          {isEditing ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    { 
                      backgroundColor: editedExpense.category === category.id 
                        ? category.color + '20' 
                        : colors.inputBg,
                      borderColor: editedExpense.category === category.id 
                        ? category.color 
                        : colors.border,
                    }
                  ]}
                  onPress={() => setEditedExpense({ ...editedExpense, category: category.id })}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.categoryDisplay}>
              <Text style={styles.categoryDisplayEmoji}>{categoryInfo.emoji}</Text>
              <Text style={[styles.categoryDisplayName, { color: colors.text }]}>
                {categoryInfo.name}
              </Text>
            </View>
          )}
        </View>

        {/* Date Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>التاريخ</Text>
          
          {isEditing ? (
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {displayDate.toLocaleDateString('ar')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.dateDisplay}>
              <Calendar size={24} color={colors.secondary} />
              <Text style={[styles.dateDisplayText, { color: colors.text }]}>
                {displayDate.toLocaleDateString('ar', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Mood Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>الحالة المزاجية</Text>
          
          {isEditing ? (
            <View style={styles.moodsContainer}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodOption,
                    { 
                      backgroundColor: editedExpense.mood === mood.id 
                        ? mood.color + '20' 
                        : colors.inputBg,
                      borderColor: editedExpense.mood === mood.id 
                        ? mood.color 
                        : colors.border,
                    }
                  ]}
                  onPress={() => setEditedExpense({ ...editedExpense, mood: mood.id })}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodName, { color: colors.text }]}>{mood.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.moodDisplay}>
              <Text style={styles.moodDisplayEmoji}>{moodInfo.emoji}</Text>
              <Text style={[styles.moodDisplayName, { color: colors.text }]}>
                {moodInfo.name}
              </Text>
            </View>
          )}
        </View>

        {/* Note Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>الملاحظة</Text>
          
          {isEditing ? (
            <TextInput
              style={[styles.noteInput, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={editedExpense.note || ''}
              onChangeText={(text) => setEditedExpense({ ...editedExpense, note: text })}
              placeholder="أضف ملاحظة..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          ) : (
            <View style={styles.noteDisplay}>
              <MessageSquare size={20} color={colors.secondary} />
              <Text style={[styles.noteText, { color: colors.text }]}>
                {expense.note || 'لا توجد ملاحظة'}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => {
                  setIsEditing(false);
                  setEditedExpense(expense);
                }}
              >
                <Text style={styles.actionButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveChanges}
              >
                <Save size={20} color="white" />
                <Text style={styles.actionButtonText}>حفظ التغييرات</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.danger }]}
              onPress={handleDeleteExpense}
            >
              <Trash2 size={20} color="white" />
              <Text style={styles.deleteButtonText}>حذف المصروف</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(editedExpense.date || expense.date)}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
  },
  card: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Cairo-Bold',
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
  },
  editingIndicator: {
    fontSize: 12,
    fontFamily: 'Cairo-Medium',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  amountEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountEditInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  currencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDisplayEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  categoryDisplayName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  categoriesScroll: {
    marginBottom: 10,
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
    fontSize: 20,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Cairo-SemiBold',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplayText: {
    fontSize: 16,
    marginLeft: 10,
    fontFamily: 'Cairo-Regular',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
    fontFamily: 'Cairo-Regular',
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodDisplayEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  moodDisplayName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  moodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  moodEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  moodName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  noteDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    lineHeight: 24,
    fontFamily: 'Cairo-Regular',
  },
  noteInput: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'Cairo-Regular',
  },
  actionsContainer: {
    margin: 15,
    marginBottom: 30,
  },
  editActions: {
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
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'Cairo-Bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'Cairo-Bold',
  },
});