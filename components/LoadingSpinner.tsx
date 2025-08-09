import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'جاري التحميل...', 
  size = 'large' 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    primary: '#4CAF50',
    text: isDark ? '#FFFFFF' : '#333333',
    textSecondary: isDark ? '#B0B0B0' : '#666666',
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
  },
});