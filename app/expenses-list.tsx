import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { StorageService, Expense } from '@/utils/storage';
import { ArrowLeft, Search, Filter, Calendar, DollarSign, Trash2 } from 'lucide-react-native';
import { formatDateArabic, formatDateShort } from '@/utils/dateHelpers';

export default function ExpensesListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');

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
    { id: 'all', name: 'الكل', emoji: '📋' },
    { id: 'food', name: 'طعام', emoji: '🍔' },
    { id: 'transport', name: 'نقل', emoji: '🚌' },
    { id: 'bills', name: 'فواتير', emoji: '💡' },
    { id: 'entertainment', name: 'ترفيه', emoji: '🎬' },
    { id: 'health', name: 'صحة', emoji: '💊' },
    { id: 'shopping', name: 'تسوق', emoji: '🛍️' },
    { id: 'education', name: 'تعليم', emoji: '📚' },
    { id: 'other', name: 'أخرى', emoji: '📦' },
  ];

  const moods = {
    happy: { name: 'سعيد', emoji: '😊', color: '#4CAF50' },
    neutral: { name: 'عادي', emoji: '😐', color: '#FF9800' },
    stressed: { name: 'متوتر', emoji: '😰', color: '#F44336' },
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    filterAndSortExpenses();
  }, [expenses, searchQuery, selectedCategory, sortBy]);

  const loadExpenses = async () => {
    try {
      const userData = await StorageService.getUserData();
      if (userData) {
        setExpenses(userData.monthlyExpenses || []);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const filterAndSortExpenses = () => {
    let filtered = [...expenses];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(expense => 
        expense.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryName(expense.category).includes(searchQuery)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Sort expenses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredExpenses(filtered);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const getCategoryEmoji = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.emoji || '📦';
  };

  const handleExpensePress = (expense: Expense) => {
    router.push(`/expense-details?expenseId=${expense.id}`);
  };

  const handleDeleteExpense = async (expenseId: string) => {
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
              await StorageService.deleteExpense(expenseId);
              loadExpenses();
              Alert.alert('تم الحذف', 'تم حذف المصروف بنجاح');
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المصروف');
            }
          },
        },
      ]
    );
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>قائمة المصاريف</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search and Filter */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="البحث في المصاريف..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesFilter}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryFilterButton,
                { 
                  backgroundColor: selectedCategory === category.id 
                    ? colors.primary + '20' 
                    : colors.inputBg,
                  borderColor: selectedCategory === category.id 
                    ? colors.primary 
                    : colors.border,
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryFilterEmoji}>{category.emoji}</Text>
              <Text style={[styles.categoryFilterName, { color: colors.text }]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {filteredExpenses.length} مصروف • إجمالي: {getTotalAmount().toLocaleString()} د.ج
        </Text>
      </View>

      {/* Expenses List */}
      <ScrollView style={styles.expensesList} showsVerticalScrollIndicator={false}>
        {filteredExpenses.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Search size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery || selectedCategory !== 'all' ? 'لا توجد نتائج' : 'لا توجد مصاريف'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'جرب تغيير معايير البحث أو الفلترة'
                : 'ابدأ بإضافة مصروف جديد'
              }
            </Text>
          </View>
        ) : (
          filteredExpenses.map((expense) => {
            const moodInfo = moods[expense.mood as keyof typeof moods];
            const expenseDate = new Date(expense.date);
            
            return (
              <TouchableOpacity
                key={expense.id}
                style={[styles.expenseItem, { backgroundColor: colors.card }]}
                onPress={() => handleExpensePress(expense)}
              >
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseEmoji}>{getCategoryEmoji(expense.category)}</Text>
                  <View style={styles.expenseDetails}>
                    <Text style={[styles.expenseCategory, { color: colors.text }]}>
                      {getCategoryName(expense.category)}
                    </Text>
                    <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                      {formatDateShort(expenseDate)}
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
                  <View style={styles.expenseMood}>
                    <Text style={styles.expenseMoodEmoji}>{moodInfo?.emoji}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.danger + '20' }]}
                  onPress={() => handleDeleteExpense(expense.id)}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
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
  searchContainer: {
    padding: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    fontFamily: 'Cairo-Regular',
  },
  categoriesFilter: {
    marginBottom: 5,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  categoryFilterEmoji: {
    fontSize: 16,
    marginRight: 5,
  },
  categoryFilterName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  summaryContainer: {
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
  },
  expensesList: {
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    marginVertical: 5,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'Cairo-Bold',
  },
  expenseDate: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'Cairo-Regular',
  },
  expenseNote: {
    fontSize: 11,
    fontFamily: 'Cairo-Regular',
  },
  expenseRight: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Cairo-Bold',
  },
  expenseMood: {
    alignItems: 'center',
  },
  expenseMoodEmoji: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
});