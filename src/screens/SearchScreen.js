import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import lastFmApiService from '../services/LastFmApiService';
import networkService from '../services/NetworkService';
import cacheService from '../services/CacheService';
import { useNetworkStatus } from '../services/NetworkService';
import { useAlbumsViewModel } from '../viewmodels/AlbumsViewModel';
import { useTracksViewModel } from '../viewmodels/TracksViewModel';
import { 
  normalizeAlbumSearchResults, 
  normalizeTrackSearchResults,
  getImageUrl
} from '../models/ApiModels';

const SORT_OPTIONS = [
  { key: 'relevance', labelRu: 'Релевантность', labelEn: 'Relevance' },
  { key: 'title_asc', labelRu: 'Название (А-Я)', labelEn: 'Title (A-Z)' },
  { key: 'title_desc', labelRu: 'Название (Я-А)', labelEn: 'Title (Z-A)' },
];

export default function SearchScreen({ navigation, route }) {
  const { mode = 'albums' } = route.params || {};
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isConnected = useNetworkStatus();
  const albumsViewModel = useAlbumsViewModel();
  const tracksViewModel = useTracksViewModel();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [originalResults, setOriginalResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({ 
      title: mode === 'albums' ? t('searchAlbums') : t('searchTracks') 
    });
  }, [navigation, mode, t]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setOriginalResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!networkService.getConnectionState()) {
        const endpoint = mode === 'albums' ? 'album.search' : 'track.search';
        const cachedParams = { 
          [mode === 'albums' ? 'album' : 'track']: query, 
          limit: '20', 
          page: '1' 
        };
        const cachedData = await cacheService.get(endpoint, cachedParams);
        
        if (cachedData) {
          let searchResults = [];
          if (mode === 'albums') {
            const normalized = normalizeAlbumSearchResults(cachedData);
            searchResults = normalized.albums;
          } else {
            const normalized = normalizeTrackSearchResults(cachedData);
            searchResults = normalized.tracks;
          }
          
          setOriginalResults(searchResults);
          if (searchResults.length > 0) {
            searchResults = sortResults(searchResults, sortBy);
          }
          setResults(searchResults);
          setFromCache(true);
          setLoading(false);
          return;
        }
        
        setError(t('noConnection'));
        setLoading(false);
        return;
      }

      let searchResults = [];
      let cached = false;

      if (mode === 'albums') {
        const result = await lastFmApiService.searchAlbums(query);
        const normalized = normalizeAlbumSearchResults(result.data);
        searchResults = normalized.albums;
        cached = result.fromCache;
      } else {
        const result = await lastFmApiService.searchTracks(query);
        const normalized = normalizeTrackSearchResults(result.data);
        searchResults = normalized.tracks;
        cached = result.fromCache;
      }

      setOriginalResults(searchResults);
      
      if (searchResults.length > 0) {
        searchResults = sortResults(searchResults, sortBy);
      }

      setResults(searchResults);
      setFromCache(cached);
    } catch (err) {
      setError(err.message || 'Ошибка поиска');
    } finally {
      setLoading(false);
    }
  }, [query, mode, t]);

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    if (originalResults.length > 0) {
      setResults(sortResults([...originalResults], newSortBy));
    }
  };

  const sortResults = (items, sortKey) => {
    const sorted = [...items];
    switch (sortKey) {
      case 'relevance':
        return sorted;
      case 'title_asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'title_desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      default:
        return sorted;
    }
  };

  const handleSelectAlbum = async (album) => {
    Alert.alert(
      t('confirmAdd'),
      `${album.name}\n${album.artist}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: async () => {
            try {
              await albumsViewModel.createAlbum(
                album.name,
                album.artist,
                '',
                getImageUrl(album.image, 'extralarge') || '',
                '',
                album.playcount || ''
              );
              Alert.alert(t('success'), t('albumAdded'));
            } catch (err) {
              Alert.alert(t('error'), err.message || t('addFailed'));
            }
          },
        },
      ]
    );
  };

  const handleSelectTrack = async (track) => {
    const artistName = track.artist?.name || track.artist || '';
    const coverUri = getImageUrl(track.image, 'extralarge') || '';
    
    Alert.alert(
      t('confirmAdd'),
      `${track.name}\n${artistName}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('save'),
          onPress: async () => {
            try {
              let duration = '';
              if (track.duration) {
                const minutes = Math.floor(track.duration / 60);
                const seconds = track.duration % 60;
                duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              }
              
              await tracksViewModel.createTrack(
                track.name,
                artistName,
                duration,
                coverUri,
                track.playcount || ''
              );
              Alert.alert(t('success'), t('trackAdded'));
            } catch (err) {
              Alert.alert(t('error'), err.message || t('addFailed'));
            }
          },
        },
      ]
    );
  };

  const renderAlbumItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleSelectAlbum(item)}
    >
      <Image
        source={getImageUrl(item.image, 'extralarge') ? { uri: getImageUrl(item.image, 'extralarge') } : require('../../assets/icon.png')}
        style={styles.albumImage}
      />
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>{item.artist}</Text>
      </View>
      <Ionicons name="add-circle" size={28} color={theme.colors.accent} />
    </TouchableOpacity>
  );

  const renderTrackItem = ({ item }) => {
    const artistName = typeof item.artist === 'string' ? item.artist : item.artist?.name || '';
    const coverUri = getImageUrl(item.image, 'extralarge');
    
    return (
      <TouchableOpacity
        style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleSelectTrack(item)}
      >
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={styles.albumImage}
          />
        ) : (
          <View style={[styles.trackIcon, { backgroundColor: theme.colors.background }]}>
            <Ionicons name="musical-notes" size={24} color={theme.colors.accent} />
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>{artistName}</Text>
        </View>
        <Ionicons name="add-circle" size={28} color={theme.colors.accent} />
      </TouchableOpacity>
    );
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortBy);
  const sortLabel = currentSortLabel 
    ? (i18n.language === 'ru' ? currentSortLabel.labelRu : currentSortLabel.labelEn)
    : t('sortBy');

  const renderResults = () => {
    if (!query.trim()) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
          <Ionicons name="search" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {mode === 'albums' ? t('searchAlbumsPrompt') : t('searchTracksPrompt')}
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>{t('searching')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <Ionicons name="musical-note" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('noResults')}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item, index) => `${item.mbid || item.name}-${index}`}
        renderItem={mode === 'albums' ? renderAlbumItem : renderTrackItem}
        contentContainerStyle={styles.list}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!isConnected && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.colors.error }]}>
          <Ionicons name="cloud-offline" size={16} color="white" />
          <Text style={styles.offlineText}>{t('offlineMode')}</Text>
        </View>
      )}

      {fromCache && isConnected && (
        <View style={[styles.cacheBanner, { backgroundColor: '#e8f5e9' }]}>
          <Ionicons name="cloud-done" size={16} color="#4caf50" />
          <Text style={[styles.cacheText, { color: '#4caf50' }]}>{t('fromCache')}</Text>
        </View>
      )}

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.textSecondary,
            color: theme.colors.text
          }]}
          placeholder={mode === 'albums' ? t('searchAlbumsPlaceholder') : t('searchTracksPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: theme.colors.accent }]} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.filterBar, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.colors.background }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={16} color={theme.colors.text} />
          <Text style={[styles.filterButtonText, { color: theme.colors.text }]}>
            {sortLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {renderResults()}

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('sortBy')}</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.modalOption, sortBy === option.key && { backgroundColor: theme.colors.accent }]}
                onPress={() => {
                  handleSortChange(option.key);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: sortBy === option.key ? 'white' : theme.colors.text }]}>
                  {i18n.language === 'ru' ? option.labelRu : option.labelEn}
                </Text>
                {sortBy === option.key && <Ionicons name="checkmark" size={20} color="white" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.colors.error }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  offlineBanner: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  offlineText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  cacheBanner: {
    backgroundColor: '#e8f5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cacheText: {
    color: '#4caf50',
    marginLeft: 4,
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: '#6200ee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  list: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  albumImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  trackIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ede7f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});