import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { getAlbumById } from '../database';

const { width: screenWidth } = Dimensions.get('window');

export default function AlbumDetails({ route, navigation }) {
  const { id } = route.params;
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('albumDetails'),
    });
  }, [navigation, t]);

  useEffect(() => {
    loadAlbum();
  }, []);

  const loadAlbum = async () => {
    setLoading(true);
    const data = await getAlbumById(id);
    setAlbum(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!album) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>{t('albumNotFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.coverContainer, { backgroundColor: theme.colors.background }]}>
        <Image
          source={album.coverUri ? { uri: album.coverUri } : require('../../assets/icon.png')}
          style={styles.cover}
          resizeMode="contain"
        />
      </View>

      {/* Информация */}
      <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{album.title}</Text>
        <Text style={[styles.artist, { color: theme.colors.textSecondary }]}>{album.artist}</Text>

        {album.releaseYear ? (
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.rowText, { color: theme.colors.textSecondary }]}>
              {t('releaseYear')}: {album.releaseYear}
            </Text>
          </View>
        ) : null}

        {album.playcount ? (
          <View style={styles.row}>
            <Ionicons name="play-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.rowText, { color: theme.colors.textSecondary }]}>
              {t('playcount') || 'Plays'}: {album.playcount}
            </Text>
          </View>
        ) : null}

        {album.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionLabel, { color: theme.colors.text }]}>
              {t('description')}:
            </Text>
            <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
              {album.description}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContainer: {
    width: '100%',
    height: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: {
    width: screenWidth - 32,
    height: screenWidth - 32,
    borderRadius: 8,
  },
  infoContainer: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowText: {
    fontSize: 16,
    marginLeft: 8,
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
