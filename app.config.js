export default {
  expo: {
    name: 'مصروفي - إدارة المصاريف',
    slug: 'mesrof-expense-tracker',
    version: '1.0.0',
    description: 'تطبيق إدارة المصاريف الشخصية باللغة العربية',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mesrof',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    primaryColor: '#4CAF50',
    backgroundColor: '#F8F9FA',
    
    splash: {
      image: './assets/images/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#4CAF50'
    },
    
    assetBundlePatterns: [
      '**/*'
    ],
    
    locales: {
      ar: './locales/ar.json'
    },
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mesrof.expensetracker',
      buildNumber: '1.0.0',
      infoPlist: {
        CFBundleDisplayName: 'مصروفي',
        NSCameraUsageDescription: 'يحتاج التطبيق للكاميرا لتصوير الإيصالات',
        NSPhotoLibraryUsageDescription: 'يحتاج التطبيق للوصول للصور لحفظ الإيصالات',
        NSUserNotificationUsageDescription: 'يحتاج التطبيق للإشعارات لتذكيرك بتسجيل المصاريف'
      }
    },
    
    android: {
      package: 'com.mesrof.expensetracker',
      versionCode: 1,
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      buildToolsVersion: '34.0.0',
      
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#4CAF50'
      },
      
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.VIBRATE',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.POST_NOTIFICATIONS'
      ],
      
      blockedPermissions: [
        'android.permission.RECORD_AUDIO'
      ]
    },
    
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png'
    },
    
    plugins: [
      'expo-router',
      'expo-font', 
      'expo-web-browser',
      'expo-sqlite',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#4CAF50',
          defaultChannel: 'default'
        }
      ],
      [
        'expo-document-picker',
        {
          iCloudContainerEnvironment: 'Production'
        }
      ]
    ],
    
    experiments: {
      typedRoutes: true
    },
    
    extra: {
      eas: {
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id-here'
      }
    }
  }
};