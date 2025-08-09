import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { 
  Moon, 
  Sun, 
  Bell, 
  Download, 
  Share2, 
  Trash2, 
  DollarSign, 
  Wallet, 
  Info, 
  HelpCircle, 
  ChevronRight,
  Calendar,
  RefreshCw,
  Database,
  Shield,
  Smartphone
} from 'lucide-react-native';
import { DatabaseService } from '@/utils/database';

interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  currency: string;
  language: string;
  monthStartDate: number;
  budgetWarnings: boolean;
  autoBackup: boolean;
}

interface UserData {
  salary: number;
  monthlyExpenses: any[];
  salaryDate: string;
}

export default function SettingsScreen() {
  const systemColorScheme = useColorScheme();
  const router = useRouter();
  
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: systemColorScheme === 'dark',
    notifications: true,
    dailyReminder: true,
    reminderTime: '20:00',
    currency: 'DZD',
    language: 'ar',
    monthStartDate: 1,
    budgetWarnings: true,
    autoBackup: false,
  });

  const [userData, setUserData] = useState<UserData | null>(null);
  const [showMonthStartModal, setShowMonthStartModal] = useState(false);
  const [showReminderTimeModal, setShowReminderTimeModal] = useState(false);
  const [tempMonthStart, setTempMonthStart] = useState('1');
  const [tempReminderTime, setTempReminderTime] = useState('20:00');

  const isDark = settings.darkMode;

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

  useEffect(() => {
    loadSettings();
    loadUserData();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleToggleSetting = (key: keyof AppSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleExportData = async () => {
    try {
      const exportData = await DatabaseService.exportAllData();

      const dataString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: `بيانات تطبيق مصروفي - تم التصدير في ${new Date().toLocaleDateString('ar')}\n\n${dataString}`,
        title: 'تصدير بيانات مصروفي',
      });

      Alert.alert('تم التصدير', 'تم تصدير بياناتك بنجاح');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير البيانات');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'مسح جميع البيانات',
      'هل أنت متأكد من حذف جميع بياناتك؟ سيتم حذف:\n\n• جميع المصاريف المسجلة\n• الأهداف المالية\n• إعدادات الراتب\n\nلا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userData', 'financialGoals']);
              Alert.alert('تم الحذف', 'تم حذف جميع البيانات بنجاح. سيتم إعادة تشغيل التطبيق.');
              // Reset to initial state
              setUserData(null);
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف البيانات');
            }
          },
        },
      ]
    );
  };

  const handleResetMonth = () => {
    Alert.alert(
      'إعادة ضبط الشهر',
      'هل تريد إعادة ضبط بيانات الشهر الحالي؟ سيتم:\n\n• مسح جميع مصاريف الشهر الحالي\n• الاحتفاظ بالراتب والأهداف\n• بدء شهر مالي جديد',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة ضبط',
          style: 'destructive',
          onPress: async () => {
            try {
              if (userData) {
                const resetData = {
                  ...userData,
                  monthlyExpenses: [],
                  salaryDate: new Date().toISOString(),
                };
                await AsyncStorage.setItem('userData', JSON.stringify(resetData));
                setUserData(resetData);
                Alert.alert('تم الإعادة', 'تم إعادة ضبط الشهر المالي بنجاح');
              }
            } catch (error) {
              console.error('Error resetting month:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء إعادة ضبط الشهر');
            }
          },
        },
      ]
    );
  };

  const handleEditSalary = () => {
    router.push('/salary-setup');
  };

  const handleMonthStartSave = () => {
    const day = parseInt(tempMonthStart);
    if (day >= 1 && day <= 28) {
      const newSettings = { ...settings, monthStartDate: day };
      saveSettings(newSettings);
      setShowMonthStartModal(false);
      Alert.alert('تم الحفظ', `سيبدأ الشهر المالي في اليوم ${day} من كل شهر`);
    } else {
      Alert.alert('خطأ', 'يرجى إدخال يوم صحيح (1-28)');
    }
  };

  const handleReminderTimeSave = () => {
    const newSettings = { ...settings, reminderTime: tempReminderTime };
    saveSettings(newSettings);
    setShowReminderTimeModal(false);
    Alert.alert('تم الحفظ', `سيتم إرسال التذكير يومياً في ${tempReminderTime}`);
  };

  const showAbout = () => {
    Alert.alert(
      'حول مصروفي',
      'مصروفي - تطبيق إدارة المصاريف الشخصية\nالإصدار: 1.0.0\n\nتطبيق مصمم خصيصاً للمستخدمين العرب لتتبع وإدارة مصاريفهم الشخصية بطريقة بسيطة وفعالة.\n\n✨ الميزات:\n• يعمل بدون إنترنت\n• تتبع المصاريف والأهداف\n• تقارير ذكية ونصائح مالية\n• واجهة عربية بالكامل\n\nجميع بياناتك محفوظة محلياً على جهازك.',
      [{ text: 'حسناً' }]
    );
  };

  const showHelp = () => {
    Alert.alert(
      'المساعدة والدعم',
      'كيفية استخدام التطبيق:\n\n📱 البداية:\n• أدخل راتبك الشهري من الإعدادات\n• حدد تاريخ بداية الشهر المالي\n\n💰 تسجيل المصاريف:\n• اضغط على "إضافة مصروف"\n• أدخل المبلغ واختر الفئة\n• أضف حالتك المزاجية للتحليل الذكي\n\n📊 التقارير:\n• راجع تقاريرك في قسم "التقارير"\n• تابع أنماط إنفاقك الشهرية\n\n🎯 الأهداف:\n• ضع أهدافاً مالية وتتبع تقدمك\n• احصل على تحفيز لتحقيق أحلامك\n\n⚙️ الإعدادات:\n• خصص التطبيق حسب احتياجاتك\n• صدّر بياناتك للنسخ الاحتياطي',
      [{ text: 'فهمت' }]
    );
  };

  const getDataSummary = () => {
    if (!userData) return 'لا توجد بيانات';
    
    const expensesCount = userData.monthlyExpenses?.length || 0;
    const totalAmount = userData.monthlyExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    
    return `${expensesCount} مصروف • ${totalAmount.toLocaleString()} د.ج`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>الإعدادات</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        
        {/* User Profile Summary */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
              <Wallet size={32} color="white" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>مستخدم مصروفي</Text>
              <Text style={[styles.profileData, { color: colors.textSecondary }]}>
                {getDataSummary()}
              </Text>
              {userData?.salary && (
                <Text style={[styles.profileSalary, { color: colors.primary }]}>
                  راتب شهري: {userData.salary.toLocaleString()} د.ج
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Appearance Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>المظهر والعرض</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              {isDark ? <Moon size={24} color={colors.primary} /> : <Sun size={24} color={colors.accent} />}
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>الوضع الداكن</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  يوفر الطاقة ويريح العينين
                </Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => handleToggleSetting('darkMode', value)}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={settings.darkMode ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Financial Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>الإعدادات المالية</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleEditSalary}>
            <View style={styles.settingLeft}>
              <DollarSign size={24} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>تعديل الراتب الشهري</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {userData?.salary ? `${userData.salary.toLocaleString()} د.ج` : 'لم يتم تحديد الراتب'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => {
              setTempMonthStart(settings.monthStartDate.toString());
              setShowMonthStartModal(true);
            }}
          >
            <View style={styles.settingLeft}>
              <Calendar size={24} color={colors.secondary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>بداية الشهر المالي</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  اليوم {settings.monthStartDate} من كل شهر
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Shield size={24} color={colors.warning} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>تحذيرات الميزانية</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  تنبيه عند تجاوز 80% من الراتب
                </Text>
              </View>
            </View>
            <Switch
              value={settings.budgetWarnings}
              onValueChange={(value) => handleToggleSetting('budgetWarnings', value)}
              trackColor={{ false: colors.border, true: colors.warning + '50' }}
              thumbColor={settings.budgetWarnings ? colors.warning : colors.textSecondary}
            />
          </View>
        </View>

        {/* Notifications Settings */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>الإشعارات والتذكيرات</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={24} color={colors.secondary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>تفعيل الإشعارات</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  إشعارات عامة للتطبيق
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => handleToggleSetting('notifications', value)}
              trackColor={{ false: colors.border, true: colors.secondary + '50' }}
              thumbColor={settings.notifications ? colors.secondary : colors.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Smartphone size={24} color={colors.accent} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>تذكير يومي</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  تذكير لتسجيل المصاريف في {settings.reminderTime}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.dailyReminder}
              onValueChange={(value) => handleToggleSetting('dailyReminder', value)}
              trackColor={{ false: colors.border, true: colors.accent + '50' }}
              thumbColor={settings.dailyReminder ? colors.accent : colors.textSecondary}
              disabled={!settings.notifications}
            />
          </View>

          {settings.notifications && settings.dailyReminder && (
            <TouchableOpacity 
              style={[styles.settingItem, styles.subSetting]}
              onPress={() => {
                setTempReminderTime(settings.reminderTime);
                setShowReminderTimeModal(true);
              }}
            >
              <View style={styles.settingLeft}>
                <View style={styles.indentedIcon} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>وقت التذكير</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                  {settings.reminderTime}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>إدارة البيانات</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <View style={styles.settingLeft}>
              <Download size={24} color={colors.secondary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>تصدير البيانات</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  حفظ نسخة احتياطية من بياناتك
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/backup-restore')}
          >
            <View style={styles.settingLeft}>
              <Database size={24} color={colors.accent} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>النسخ الاحتياطي المتقدم</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  إدارة شاملة للنسخ الاحتياطي
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => router.push('/reports')}
          >
            <View style={styles.settingLeft}>
              <BarChart3 size={24} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>التقارير المفصلة</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  تحليلات متقدمة للإنفاق
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleResetMonth}>
            <View style={styles.settingLeft}>
              <RefreshCw size={24} color={colors.warning} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>إعادة ضبط الشهر</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  بدء شهر مالي جديد
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <Trash2 size={24} color={colors.danger} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.danger }]}>مسح جميع البيانات</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  حذف نهائي لجميع البيانات
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About & Help */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>المساعدة والدعم</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={showHelp}>
            <View style={styles.settingLeft}>
              <HelpCircle size={24} color={colors.accent} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>كيفية الاستخدام</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  دليل شامل لاستخدام التطبيق
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={showAbout}>
            <View style={styles.settingLeft}>
              <Info size={24} color={colors.secondary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>حول التطبيق</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  معلومات الإصدار والمطور
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={[styles.appInfo, { backgroundColor: colors.card }]}>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            مصروفي - إدارة المصاريف الشخصية
          </Text>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            الإصدار 1.0.0 • صُنع بـ ❤️ للمستخدمين العرب
          </Text>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            جميع البيانات محفوظة محلياً على جهازك 🔒
          </Text>
        </View>

      </ScrollView>

      {/* Month Start Modal */}
      <Modal
        visible={showMonthStartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthStartModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>تحديد بداية الشهر المالي</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              اختر اليوم الذي يبدأ فيه شهرك المالي (عادة يوم استلام الراتب)
            </Text>

            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={tempMonthStart}
              onChangeText={setTempMonthStart}
              placeholder="1"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={2}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => setShowMonthStartModal(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleMonthStartSave}
              >
                <Text style={styles.modalButtonText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reminder Time Modal */}
      <Modal
        visible={showReminderTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderTimeModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>تحديد وقت التذكير</Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              اختر الوقت المناسب لتذكيرك بتسجيل مصاريفك اليومية
            </Text>

            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.inputBg, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={tempReminderTime}
              onChangeText={setTempReminderTime}
              placeholder="20:00"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => setShowReminderTimeModal(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleReminderTimeSave}
              >
                <Text style={styles.modalButtonText}>حفظ</Text>
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
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 15,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Cairo-Bold',
  },
  profileData: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Cairo-Regular',
  },
  profileSalary: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Cairo-SemiBold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  subSetting: {
    paddingLeft: 35,
    backgroundColor: 'rgba(128,128,128,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    lineHeight: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'Cairo-Regular',
  },
  indentedIcon: {
    width: 24,
    height: 24,
  },
  appInfo: {
    margin: 15,
    marginBottom: 30,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appInfoText: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
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
    marginBottom: 10,
    fontFamily: 'Cairo-Bold',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: 'Cairo-Regular',
  },
  modalInput: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
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