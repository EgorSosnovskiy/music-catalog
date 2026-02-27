import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { getAlbumById, deleteAlbum } from '../database';

// Заглушка для обложки
const placeholderImage = 'https://via.placeholder.com/300x300?text=No+Cover';

export default function AlbumDetails({ route, navigation }) {
  const { id } = route.params;
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  // Динамический заголовок экрана
  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('albumDetails'), // ключ перевода
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

  const handleEdit = () => {
    navigation.navigate('AddEditAlbum', { album });
  };

  const handleDelete = () => {
    Alert.alert(
      t('deleteAlbumTitle'),      // "Удаление альбома"
      t('deleteAlbumConfirmation'), // "Вы уверены, что хотите удалить этот альбом?"
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteAlbum(id);
            navigation.goBack();
          },
        },
      ],
      { cancelable: true }
    );
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
      {/* Обложка */}
      <Image
        source={{ uri: album.coverUri || placeholderImage }}
        style={styles.cover}
        resizeMode="cover"
      />

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

      {/* Кнопки действий */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.accent }]}
          onPress={handleEdit}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.buttonText}>{t('edit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.buttonText}>{t('delete')}</Text>
        </TouchableOpacity>
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
  cover: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0', // можно оставить или заменить на theme, но это фон под картинкой
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artist: {
    fontSize: 20,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  editButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.45,
    justifyContent: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.45,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});