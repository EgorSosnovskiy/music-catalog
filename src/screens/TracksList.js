import React, { useCallback, useContext, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { useTracksViewModel } from '../viewmodels/TracksViewModel';
import Fuse from 'fuse.js';

export default function TracksList({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const { tracks, loading, loadTracks, removeTrack } = useTracksViewModel();
  const isFirstLoad = useRef(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showArtistFilter, setShowArtistFilter] = useState(false);

  const fuse = useMemo(() => new Fuse(tracks, {
    keys: ['title', 'artist'],
    threshold: 0.3,
    includeScore: true,
  }), [tracks]);

  const uniqueArtists = useMemo(() => {
    const artists = new Set();
    tracks.forEach(track => {
      if (track.artist) artists.add(track.artist);
    });
    return Array.from(artists).sort();
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    let result = tracks;

    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery.trim());
      result = searchResults.map(r => r.item);
    }

    if (selectedArtist) {
      result = result.filter(track => track.artist === selectedArtist);
    }

    return result;
  }, [tracks, searchQuery, selectedArtist, fuse]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        loadTracks(true);
        isFirstLoad.current = false;
      } else {
        loadTracks(false);
      }
    }, [loadTracks])
  );

  const handleDelete = (id) => {
    Alert.alert(
      t('deleteTrackTitle'),
      t('deleteTrackConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await removeTrack(id);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {item.coverUri ? (
        <Image source={{ uri: item.coverUri }} style={styles.cover} />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: theme.colors.background }]}>
          <Ionicons name="musical-note" size={24} color={theme.colors.textSecondary} />
        </View>
      )}

      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate('TrackDetails', { id: item.id })}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.artist, { color: theme.colors.textSecondary }]}>{item.artist}</Text>
        {item.duration ? (
          <Text style={[styles.duration, { color: theme.colors.textSecondary }]}>
            {item.duration}
          </Text>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.background }]}>
          <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: selectedArtist ? theme.colors.accent : theme.colors.background }]}
          onPress={() => setShowArtistFilter(!showArtistFilter)}
        >
          <Ionicons name="people" size={18} color={selectedArtist ? 'white' : theme.colors.text} />
        </TouchableOpacity>
      </View>

      {showArtistFilter && (
        <Modal
          visible={showArtistFilter}
          transparent
          animationType="fade"
          onRequestClose={() => setShowArtistFilter(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowArtistFilter(false)}>
            <View style={[styles.artistDropdown, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.artistDropdownHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.artistDropdownTitle, { color: theme.colors.text }]}>
                  {t('filterByArtist')}
                </Text>
                <TouchableOpacity onPress={() => setShowArtistFilter(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              {uniqueArtists.length > 0 ? (
                <ScrollView style={styles.artistDropdownList}>
                  <TouchableOpacity
                    style={[styles.artistDropdownItem, !selectedArtist && { backgroundColor: theme.colors.accent + '20' }]}
                    onPress={() => {
                      setSelectedArtist(null);
                      setShowArtistFilter(false);
                    }}
                  >
                    <Text style={[styles.artistDropdownText, { color: theme.colors.text }]}>
                      {t('allArtists')}
                    </Text>
                    {!selectedArtist && <Ionicons name="checkmark" size={20} color={theme.colors.accent} />}
                  </TouchableOpacity>
                  {uniqueArtists.map(artist => (
                    <TouchableOpacity
                      key={artist}
                      style={[styles.artistDropdownItem, selectedArtist === artist && { backgroundColor: theme.colors.accent + '20' }]}
                      onPress={() => {
                        setSelectedArtist(artist);
                        setShowArtistFilter(false);
                      }}
                    >
                      <Text style={[styles.artistDropdownText, { color: theme.colors.text }]} numberOfLines={1}>
                        {artist}
                      </Text>
                      {selectedArtist === artist && <Ionicons name="checkmark" size={20} color={theme.colors.accent} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noArtistsContainer}>
                  <Text style={[styles.noArtistsText, { color: theme.colors.textSecondary }]}>
                    {t('noResults')}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </Modal>
      )}

      {filteredTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {tracks.length === 0 ? t('noTracks') : t('noResults')}
          </Text>
          {tracks.length > 0 && (
            <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>
              {t('addFirst')}
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredTracks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.accent }]}
        onPress={() => navigation.navigate('SearchScreen', { mode: 'tracks' })}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, height: 40 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  filterButton: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  artistDropdown: { width: '80%', maxHeight: '60%', borderRadius: 12, overflow: 'hidden' },
  artistDropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  artistDropdownTitle: { fontSize: 18, fontWeight: 'bold' },
  artistDropdownList: { maxHeight: 300 },
  artistDropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  artistDropdownText: { fontSize: 16, flex: 1 },
  noArtistsContainer: { padding: 20, alignItems: 'center' },
  noArtistsText: { fontSize: 16 },
  artistFilterContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingTop: 0 },
  artistChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  artistChipText: { fontSize: 12 },
  list: { padding: 16 },
  card: { flexDirection: 'row', borderRadius: 8, marginBottom: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, alignItems: 'center' },
  cover: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  coverPlaceholder: { width: 60, height: 60, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  artist: { fontSize: 14, marginTop: 4 },
  duration: { fontSize: 12, marginTop: 4 },
  deleteButton: { paddingHorizontal: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 20, fontWeight: 'bold' },
  emptySubText: { fontSize: 14, marginTop: 8 },
});