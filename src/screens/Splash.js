import React, { useContext } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

export default function Splash() {
  const context = useContext(ThemeContext);
  const { theme, isDark } = context || {};
  
  // Fallback theme if context is not available
  const safeTheme = theme || { colors: { background: '#f5f5f5' } };
  const safeIsDark = isDark || false;

  const iconSource = safeIsDark
    ? require('../../assets/skull-icon-white.png')
    : require('../../assets/skull-icon-black.png');

  return (
    <View style={[styles.container, { backgroundColor: safeTheme.colors.background }]}>
      <Image source={iconSource} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
});
