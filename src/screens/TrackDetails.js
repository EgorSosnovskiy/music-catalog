import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Share,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { getTrackById } from '../database';

const { width: screenWidth } = Dimensions.get('window');

export default function TrackDetails({ route, navigation }) {
  const { id } = route.params;
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  const handleShare = async () => {
    if (!track) return;
    const lines = [
      `🎵 ${track.title}`,
      track.artist ? `👤 ${track.artist}` : null,
      track.duration ? `⏱ ${track.duration}` : null,
    ].filter(Boolean);
    await Share.share({ message: lines.join('\n') });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('trackDetails'),
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: 16 }}>
          <Ionicons name="share-outline" size={24} color="#6200ee" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t, track]);

  useEffect(() => {
    loadTrack();
  }, []);

  const loadTrack = async () => {
    setLoading(true);
    const data = await getTrackById(id);
    setTrack(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!track) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>{t('trackNotFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Обложка */}
      <View style={[styles.coverContainer, { backgroundColor: theme.colors.background }]}>
        {track.coverUri ? (
          <Image
            source={{ uri: track.coverUri }}
            style={styles.cover}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="musical-notes" size={80} color={theme.colors.accent} />
          </View>
        )}
      </View>

      {/* Информация */}
      <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{track.title}</Text>
        <Text style={[styles.artist, { color: theme.colors.textSecondary }]}>{track.artist}</Text>

        {track.duration ? (
          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.rowText, { color: theme.colors.textSecondary }]}>
              {t('duration')}: {track.duration}
            </Text>
          </View>
        ) : null}

        {track.playcount ? (
          <View style={styles.row}>
            <Ionicons name="play-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.rowText, { color: theme.colors.textSecondary }]}>
              {t('playcount') || 'Plays'}: {track.playcount}
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
  placeholderCover: {
    width: screenWidth - 32,
    height: screenWidth - 32,
    borderRadius: 8,
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
});
