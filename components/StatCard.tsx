import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    primary: '#4CAF50',
    card: isDark ? '#2D2D2D' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#333333',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
    border: isDark ? '#404040' : '#E0E0E0',
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.value, { color: color || colors.primary }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    margin: 5,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Cairo-Regular',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: 'Cairo-Bold',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
  },
});