import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { DatabaseService } from '@/utils/database';
import { useRouter } from 'expo-router';
import { Save, DollarSign, Calendar, ArrowLeft } from 'lucide-react-native';

export default function SalarySetupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [salary, setSalary] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);

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

  useEffect(() => {
    checkExistingSalary();
  }, []);

  const checkExistingSalary = async () => {
    try {
      const settings = await DatabaseService.getUserSettings();
      if (settings && settings.salary > 0) {
        setSalary(settings.salary.toString());
      } else {
        setIsFirstTime(true);
      }
    } catch (error) {
      console.error('Error checking existing salary:', error);
      setIsFirstTime(true);
    }
  };

  const handleSaveSalary = async () => {
    const salaryAmount = parseFloat(salary);
    
    if (!salary || isNaN(salaryAmount) || salaryAmount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال راتب صحيح');
      return;
    }

    try {
      await DatabaseService.updateUserSettings({
        salary: salaryAmount,
        salary_date: new Date().toISOString(),
      });
      
      if (isFirstTime) {
        Alert.alert(
          'أهلاً بك في مصروفي! 🎉',
          'تم حفظ راتبك بنجاح. يمكنك الآن البدء في تسجيل مصاريفك اليومية.',
          [
            {
              text: 'ابدأ الآن',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        Alert.alert(
          'تم التحديث',
          'تم حفظ راتبك الجديد بنجاح',
          [
            {
              text: 'العودة',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الراتب');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        {!isFirstTime && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isFirstTime ? 'مرحباً بك في مصروفي' : 'تعديل الراتب'}
        </Text>
      </View>

      <View style={styles.content}>
        
        <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
          <DollarSign size={64} color={colors.primary} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            {isFirstTime ? 'لنبدأ بإعداد راتبك' : 'تحديث راتبك الشهري'}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            {isFirstTime 
              ? 'أدخل راتبك الشهري لنتمكن من مساعدتك في إدارة مصاريفك بشكل أفضل'
              : 'أدخل راتبك الشهري الجديد'
            }
          </Text>
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>الراتب الشهري</Text>
          <View style={styles.salaryInputContainer}>
            <TextInput
              style={[styles.salaryInput, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={salary}
              onChangeText={setSalary}
              placeholder="أدخل راتبك الشهري"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSaveSalary}
            />
            <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>د.ج</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <Calendar size={16} color={colors.secondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              سيتم إعادة ضبط الحسابات في بداية كل شهر
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveSalary}
        >
          <Save size={24} color="white" />
          <Text style={styles.saveButtonText}>
            {isFirstTime ? 'حفظ والمتابعة' : 'تحديث الراتب'}
          </Text>
        </TouchableOpacity>

        {isFirstTime && (
          <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 نصائح للبداية</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • سجل مصاريفك يومياً للحصول على صورة دقيقة عن إنفاقك
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • استخدم الفئات لتنظيم مصاريفك بشكل أفضل
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • راجع التقارير أسبوعياً لتتبع تقدمك
            </Text>
          </View>
        )}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
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
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    marginBottom: 30,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
    fontFamily: 'Cairo-Bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Cairo-Regular',
  },
  inputCard: {
    padding: 25,
    borderRadius: 20,
    marginBottom: 30,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  salaryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  salaryInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  currencyLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    fontFamily: 'Cairo-Bold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Cairo-Regular',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  tipsCard: {
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Cairo-Bold',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Cairo-Regular',
  },
});