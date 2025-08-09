import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Share,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { DatabaseService } from '@/utils/database';
import { ArrowLeft, Download, Upload, Share2, Database, Shield, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function BackupRestoreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Export all data from database
      const allData = await DatabaseService.exportAllData();
      
      // Create backup file content
      const backupContent = JSON.stringify(allData, null, 2);
      const fileName = `mesrof_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // For web platform, use Share API
        await Share.share({
          message: backupContent,
          title: 'نسخة احتياطية من مصروفي',
        });
      } else {
        // For mobile platforms, save to file system and share
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, backupContent);
        
        await Share.share({
          url: fileUri,
          title: 'نسخة احتياطية من مصروفي',
        });
      }

      Alert.alert(
        'تم التصدير بنجاح',
        `تم إنشاء نسخة احتياطية تحتوي على:\n• ${allData.expenses?.length || 0} مصروف\n• ${allData.financial_goals?.length || 0} هدف مالي\n• إعدادات التطبيق\n• فئات الميزانية`,
        [{ text: 'ممتاز' }]
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير البيانات');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);

      Alert.alert(
        'استيراد البيانات',
        'سيتم استبدال جميع البيانات الحالية بالبيانات المستوردة. هل أنت متأكد؟',
        [
          { text: 'إلغاء', style: 'cancel', onPress: () => setIsImporting(false) },
          {
            text: 'متابعة',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: 'application/json',
                  copyToCacheDirectory: true,
                });

                if (!result.canceled && result.assets[0]) {
                  const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
                  const importedData = JSON.parse(fileContent);
                  
                  // Validate data structure
                  if (!importedData.expenses && !importedData.financial_goals && !importedData.user_settings) {
                    throw new Error('ملف النسخة الاحتياطية غير صحيح');
                  }

                  // Import data to database
                  await DatabaseService.importData(importedData);

                  Alert.alert(
                    'تم الاستيراد بنجاح',
                    `تم استيراد:\n• ${importedData.expenses?.length || 0} مصروف\n• ${importedData.financial_goals?.length || 0} هدف مالي\n• الإعدادات والفئات`,
                    [
                      {
                        text: 'إعادة تشغيل التطبيق',
                        onPress: () => {
                          // In a real app, you might restart or refresh the app state
                          router.replace('/(tabs)');
                        }
                      }
                    ]
                  );
                }
              } catch (error) {
                console.error('Error importing data:', error);
                Alert.alert('خطأ', 'حدث خطأ أثناء استيراد البيانات. تأكد من صحة ملف النسخة الاحتياطية.');
              } finally {
                setIsImporting(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in import process:', error);
      setIsImporting(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'مسح جميع البيانات',
      'هل أنت متأكد من حذف جميع البيانات نهائياً؟\n\nسيتم حذف:\n• جميع المصاريف\n• الأهداف المالية\n• إعدادات الراتب\n• فئات الميزانية\n\nلا يمكن التراجع عن هذا الإجراء!',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.clearAllData();
              Alert.alert(
                'تم الحذف',
                'تم حذف جميع البيانات بنجاح',
                [
                  {
                    text: 'إعادة البدء',
                    onPress: () => router.replace('/salary-setup'),
                  }
                ]
              );
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف البيانات');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>النسخ الاحتياطي</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Backup Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Database size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>النسخ الاحتياطي</Text>
          </View>
          
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            احفظ نسخة احتياطية من جميع بياناتك لضمان عدم فقدانها
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleExportData}
            disabled={isExporting}
          >
            <Download size={24} color="white" />
            <Text style={styles.actionButtonText}>
              {isExporting ? 'جاري التصدير...' : 'تصدير البيانات'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              سيتم تصدير جميع المصاريف والأهداف والإعدادات في ملف JSON آمن
            </Text>
          </View>
        </View>

        {/* Restore Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Upload size={24} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>استعادة البيانات</Text>
          </View>
          
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            استعد بياناتك من نسخة احتياطية سابقة
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={handleImportData}
            disabled={isImporting}
          >
            <Upload size={24} color="white" />
            <Text style={styles.actionButtonText}>
              {isImporting ? 'جاري الاستيراد...' : 'استيراد من ملف'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.warningBox, { backgroundColor: colors.warning + '20' }]}>
            <Shield size={16} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              تحذير: سيتم استبدال جميع البيانات الحالية
            </Text>
          </View>
        </View>

        {/* Auto Backup Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>النسخ التلقائي</Text>
          </View>
          
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            جميع بياناتك محفوظة محلياً على جهازك بشكل آمن ولا تحتاج إنترنت
          </Text>

          <View style={[styles.featuresList, { backgroundColor: colors.background }]}>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                حفظ تلقائي لجميع المصاريف
              </Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                قاعدة بيانات محلية سريعة
              </Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                يعمل بدون إنترنت 100%
              </Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                حماية كاملة للخصوصية
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.dangerSection, { backgroundColor: colors.card, borderColor: colors.danger }]}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color={colors.danger} />
            <Text style={[styles.dangerTitle, { color: colors.danger }]}>منطقة الخطر</Text>
          </View>
          
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            إجراءات لا يمكن التراجع عنها
          </Text>

          <TouchableOpacity
            style={[styles.dangerButton, { backgroundColor: colors.danger }]}
            onPress={handleClearAllData}
          >
            <Database size={24} color="white" />
            <Text style={styles.dangerButtonText}>مسح جميع البيانات نهائياً</Text>
          </TouchableOpacity>

          <View style={[styles.warningBox, { backgroundColor: colors.danger + '20' }]}>
            <Shield size={16} color={colors.danger} />
            <Text style={[styles.warningText, { color: colors.danger }]}>
              تحذير: لا يمكن التراجع عن هذا الإجراء
            </Text>
          </View>
        </View>

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
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dangerSection: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Cairo-Regular',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Cairo-Bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontFamily: 'Cairo-Regular',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    fontWeight: 'bold',
    fontFamily: 'Cairo-Bold',
  },
  featuresList: {
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'Cairo-Regular',
  },
});