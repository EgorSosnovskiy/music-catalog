import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme', error);
    }
  };

  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    try {
      await AsyncStorage.setItem('theme', newValue ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  const theme = {
    isDark,
    colors: isDark
      ? {
          background: '#121212',
          surface: '#1e1e1e',
          text: '#ffffff',
          textSecondary: '#aaaaaa',
          accent: '#bb86fc',
          error: '#cf6679',
          border: '#333333',
        }
      : {
          background: '#f5f5f5',
          surface: '#ffffff',
          text: '#000000',
          textSecondary: '#666666',
          accent: '#007AFF',
          error: '#ff4444',
          border: '#dddddd',
        },
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};