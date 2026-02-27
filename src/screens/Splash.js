import React, { useContext } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

export default function Splash() {
  const { theme, isDark } = useContext(ThemeContext);

  const iconSource = isDark
    ? require('../../assets/skull-icon-white.png')   // иконка для тёмной темы
    : require('../../assets/skull-icon-black.png');       // иконка для светлой темы

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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