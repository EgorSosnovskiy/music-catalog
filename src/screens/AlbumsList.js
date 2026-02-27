import React, { useState, useCallback, useContext, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { getAlbums, deleteAlbum } from '../database';

export default function AlbumsList({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true); // флаг первого запуска

  const loadAlbums = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const data = await getAlbums();
    setAlbums(data);
    if (showLoader) setLoading(false);
  };

    // При первом фокусе загружаем с индикатором
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        loadAlbums(true);
        isFirstLoad.current = false;
      } else {
        // При последующих фокусах загружаем без индикатора
        loadAlbums(false);
      }
    }, [])
  );

  const handleDelete = (id) => {
    Alert.alert(
      t('confirmDelete'),
      t('deleteConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteAlbum(id);
            loadAlbums();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Нажатие на карточку ведёт на детали */}
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate('AlbumDetails', { id: item.id })}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.artist, { color: theme.colors.textSecondary }]}>{item.artist}</Text>
        {item.releaseYear ? (
          <Text style={[styles.year, { color: theme.colors.textSecondary }]}>
            {item.releaseYear}
          </Text>
        ) : null}
      </TouchableOpacity>

      {/* Кнопка редактирования (карандаш) */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddEditAlbum', { album: item })}
        style={styles.editButton}
      >
        <Ionicons name="pencil" size={24} color={theme.colors.accent} />
      </TouchableOpacity>

      {/* Кнопка удаления (корзина) */}
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

if (loading) {
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }
    ]}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
    </View>
  );
}

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {albums.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {t('noAlbums')}
          </Text>
          <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>
            {t('addFirst')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Плавающая кнопка добавления нового альбома */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.accent }]}
        onPress={() => navigation.navigate('AddEditAlbum')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// Стили, зависящие от темы, мы уже применили через style={[...]},
// но для статичных стилей (отступы, размеры) оставляем обычный StyleSheet.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 14,
    marginTop: 4,
  },
  year: {
    fontSize: 12,
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 8,
  },
  deleteButton: {
    paddingHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
  },
});