import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import Splash from './src/screens/Splash';
import { initDB, getAlbums, getTracks } from './src/database';
import { ThemeProvider } from './src/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadSavedLanguage } from './src/i18n';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Сначала инициализируем БД (создаём db)
        await initDB();

        // 2. Теперь БД готова – параллельно загружаем язык и предзагружаем данные
        await Promise.all([
          loadSavedLanguage(),
          getAlbums(), // эти функции теперь используют существующее соединение
          getTracks(),
        ]);

        // 3. Держим сплеш минимум 2 секунды (можно убрать, если не нужно)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        {!isReady ? <Splash /> : <NavigationContainer><AppNavigator /></NavigationContainer>}
      </ThemeProvider>
    </I18nextProvider>
  );
}