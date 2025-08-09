import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';
import { DatabaseService } from '@/utils/database';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded, fontError] = useFonts({
    'Cairo-Regular': Cairo_400Regular,
    'Cairo-Medium': Cairo_500Medium,
    'Cairo-SemiBold': Cairo_600SemiBold,
    'Cairo-Bold': Cairo_700Bold,
  });

  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize database
        await DatabaseService.initializeDatabase();
        
        // Hide splash screen once fonts are loaded
        if (fontsLoaded || fontError) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        await SplashScreen.hideAsync();
      }
    }

    initializeApp();
  }, [fontsLoaded, fontError]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="salary-setup" />
        <Stack.Screen name="expenses-list" />
        <Stack.Screen name="expense-details" />
        <Stack.Screen name="budget-planner" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="backup-restore" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
