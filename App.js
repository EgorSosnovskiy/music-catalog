import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import Splash from './src/screens/Splash';
import { initDB, getAlbums, getTracks } from './src/database';
import { ThemeProvider } from './src/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadSavedLanguage } from './src/i18n';
import { networkService } from './src/services/NetworkService';
import { initCache } from './src/services/CacheService';
import { initializeSyncService } from './src/services/SyncService';
import { initializeAuthService, onAuthStateChangedListener } from './src/services/AuthService';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
        
        const { initializeFirebase } = await import('./src/services/FirebaseService');
        await initializeFirebase();
        
        await initializeAuthService();
        await initCache();
        await networkService.init();
        await initializeSyncService();
        
        await Promise.all([
          loadSavedLanguage(),
          getAlbums(),
          getTracks(),
        ]);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };
    
    initializeApp();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const unsubscribe = onAuthStateChangedListener((user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isReady]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        {!isReady || !authChecked ? (
          <Splash />
        ) : (
          isAuthenticated ? (
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          ) : (
            <AuthScreen />
          )
        )}
      </ThemeProvider>
    </I18nextProvider>
  );
}
