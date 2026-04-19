import { useState, useCallback } from 'react';
import lastFmApiService from '../services/LastFmApiService';
import networkService from '../services/NetworkService';
import {
  normalizeArtistSearchResults,
  normalizeAlbumSearchResults,
  normalizeTrackSearchResults,
} from '../models/ApiModels';

/**
 * ViewModel для поиска (Search)
 * Реализует паттерн MVVM - инкапсулирует бизнес-логику
 */
export const useSearchViewModel = () => {
  const [searchResults, setSearchResults] = useState({
    artists: [],
    albums: [],
    tracks: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState('all'); // 'all', 'artists', 'albums', 'tracks'
  const [fromCache, setFromCache] = useState(false);


  /**
   * Поиск альбомов
   */
  const searchAlbums = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, albums: [] }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isConnected = networkService.getConnectionState();
      
      if (!isConnected) {
        setError('Нет подключения к интернету. Попробуйте позже.');
        setLoading(false);
        return;
      }

      const result = await lastFmApiService.searchAlbums(query);
      const normalized = normalizeAlbumSearchResults(result.data);
      
      setSearchResults(prev => ({ ...prev, albums: normalized.albums }));
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err.message || 'Ошибка при поиске альбомов');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Поиск треков
   */
  const searchTracks = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, tracks: [] }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isConnected = networkService.getConnectionState();
      
      if (!isConnected) {
        setError('Нет подключения к интернету. Попробуйте позже.');
        setLoading(false);
        return;
      }

      const result = await lastFmApiService.searchTracks(query);
      const normalized = normalizeTrackSearchResults(result.data);
      
      setSearchResults(prev => ({ ...prev, tracks: normalized.tracks }));
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err.message || 'Ошибка при поиске треков');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Универсальный поиск
   */
  const search = useCallback(async (query, type = 'all') => {
    setSearchType(type);

    if (!query.trim()) {
      setSearchResults({ artists: [], albums: [], tracks: [] });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isConnected = networkService.getConnectionState();
      
      if (!isConnected) {
        setError('Нет подключения к интернету. Данные могут быть устаревшими.');
        setLoading(false);
        return;
      }

      const promises = [];

      if (type === 'all' || type === 'artists') {
        promises.push(lastFmApiService.searchArtists(query).then(r => ({ type: 'artists', data: r })));
      }
      if (type === 'all' || type === 'albums') {
        promises.push(lastFmApiService.searchAlbums(query).then(r => ({ type: 'albums', data: r })));
      }
      if (type === 'all' || type === 'tracks') {
        promises.push(lastFmApiService.searchTracks(query).then(r => ({ type: 'tracks', data: r })));
      }

      const results = await Promise.all(promises);

      const newResults = { artists: [], albums: [], tracks: [] };
      let cacheUsed = false;

      results.forEach(({ type: resultType, data }) => {
        if (resultType === 'artists') {
          newResults.artists = normalizeArtistSearchResults(data.data).artists;
        } else if (resultType === 'albums') {
          newResults.albums = normalizeAlbumSearchResults(data.data).albums;
        } else if (resultType === 'tracks') {
          newResults.tracks = normalizeTrackSearchResults(data.data).tracks;
        }
        if (data.fromCache) cacheUsed = true;
      });

      setSearchResults(newResults);
      setFromCache(cacheUsed);
    } catch (err) {
      setError(err.message || 'Ошибка при поиске');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Очистить результаты поиска
   */
  const clearResults = useCallback(() => {
    setSearchResults({ artists: [], albums: [], tracks: [] });
    setError(null);
    setFromCache(false);
  }, []);

  return {
    // Состояние
    searchResults,
    loading,
    error,
    searchType,
    fromCache,
    isConnected: networkService.getConnectionState(),
    
    // Методы
    search,
    searchArtists,
    searchAlbums,
    searchTracks,
    clearResults,
    setSearchType,
  };
};

export default useSearchViewModel;
