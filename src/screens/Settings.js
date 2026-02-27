import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const changeLanguage = async (lang) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Failed to save language', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Language selection */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('language')}</Text>
        <TouchableOpacity
          style={styles.option}
          onPress={() => changeLanguage('ru')}
        >
          <Text style={[styles.optionText, { color: theme.colors.text }]}>Русский</Text>
          {selectedLanguage === 'ru' && (
            <View style={[styles.check, { backgroundColor: theme.colors.accent }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={() => changeLanguage('en')}
        >
          <Text style={[styles.optionText, { color: theme.colors.text }]}>English</Text>
          {selectedLanguage === 'en' && (
            <View style={[styles.check, { backgroundColor: theme.colors.accent }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Theme toggle */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('theme')}</Text>
        <View style={styles.row}>
          <Text style={[styles.optionText, { color: theme.colors.text }]}>
            {isDark ? t('darkTheme') : t('lightTheme')}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.colors.accent }}
            thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});