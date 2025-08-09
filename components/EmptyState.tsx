import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    primary: '#4CAF50',
    card: isDark ? '#2D2D2D' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#333333',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      
      {actionText && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onAction}
        >
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Cairo-Regular',
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
});