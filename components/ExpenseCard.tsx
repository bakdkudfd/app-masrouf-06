import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { Expense } from '@/utils/storage';
import { formatDateShort } from '@/utils/dateHelpers';
import { Edit3, Trash2 } from 'lucide-react-native';

interface ExpenseCardProps {
  expense: Expense;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showActions?: boolean;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    primary: '#4CAF50',
    secondary: '#2196F3',
    danger: '#F44336',
    card: isDark ? '#2D2D2D' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#333333',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    border: isDark ? '#404040' : '#E0E0E0',
  };

  const categories = {
    food: { name: 'طعام', emoji: '🍔', color: '#FF6B6B' },
    transport: { name: 'نقل', emoji: '🚌', color: '#4ECDC4' },
    bills: { name: 'فواتير', emoji: '💡', color: '#45B7D1' },
    entertainment: { name: 'ترفيه', emoji: '🎬', color: '#96CEB4' },
    health: { name: 'صحة', emoji: '💊', color: '#FF8A65' },
    shopping: { name: 'تسوق', emoji: '🛍️', color: '#BA68C8' },
    education: { name: 'تعليم', emoji: '📚', color: '#FFB74D' },
    other: { name: 'أخرى', emoji: '📦', color: '#FFEAA7' },
  };

  const moods = {
    happy: { emoji: '😊', color: '#4CAF50' },
    neutral: { emoji: '😐', color: '#FF9800' },
    stressed: { emoji: '😰', color: '#F44336' },
  };

  const categoryInfo = categories[expense.category as keyof typeof categories] || categories.other;
  const moodInfo = moods[expense.mood as keyof typeof moods] || moods.neutral;
  const expenseDate = new Date(expense.date);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.categorySection}>
          <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {categoryInfo.name}
            </Text>
            <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
              {formatDateShort(expenseDate)}
            </Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: colors.danger }]}>
            -{expense.amount.toLocaleString()} د.ج
          </Text>
          <Text style={styles.moodEmoji}>{moodInfo.emoji}</Text>
        </View>
      </View>

      {expense.note && (
        <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={2}>
          {expense.note}
        </Text>
      )}

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]}
            onPress={onEdit}
          >
            <Edit3 size={16} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
            onPress={onDelete}
          >
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    marginVertical: 5,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'Cairo-Bold',
  },
  expenseDate: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Cairo-Bold',
  },
  moodEmoji: {
    fontSize: 16,
  },
  note: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
    fontFamily: 'Cairo-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
});