import { useColorScheme } from 'react-native';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBg: string;
  modalBackground: string;
  gradient1: string;
  gradient2: string;
}

export const useTheme = (isDarkMode?: boolean): ThemeColors => {
  const systemColorScheme = useColorScheme();
  const isDark = isDarkMode ?? (systemColorScheme === 'dark');

  return {
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
    inputBg: isDark ? '#404040' : '#F5F5F5',
    modalBackground: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
    gradient1: isDark ? '#2D2D2D' : '#FFFFFF',
    gradient2: isDark ? '#1A1A1A' : '#F8F9FA',
  };
};

export const lightTheme: ThemeColors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  accent: '#FF9800',
  danger: '#F44336',
  warning: '#FFC107',
  success: '#8BC34A',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  inputBg: '#F5F5F5',
  modalBackground: 'rgba(0,0,0,0.5)',
  gradient1: '#FFFFFF',
  gradient2: '#F8F9FA',
};

export const darkTheme: ThemeColors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  accent: '#FF9800',
  danger: '#F44336',
  warning: '#FFC107',
  success: '#8BC34A',
  background: '#1A1A1A',
  card: '#2D2D2D',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#404040',
  inputBg: '#404040',
  modalBackground: 'rgba(0,0,0,0.8)',
  gradient1: '#2D2D2D',
  gradient2: '#1A1A1A',
};