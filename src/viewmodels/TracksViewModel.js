import { useState, useCallback } from 'react';
import { getTracks, getTrackById, getTrackByTitleAndArtist, insertTrack, updateTrack, deleteTrack } from '../database';
import { syncTrackAdded, syncTrackDeleted } from '../services/SyncService';

/**
 * ViewModel для управления треками
 * Реализует паттерн MVVM - инкапсулирует бизнес-логику
 */
export const useTracksViewModel = () => {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Загрузить все треки
   */
  const loadTracks = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const data = await getTracks();
      setTracks(data);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки треков');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  /**
   * Загрузить трек по ID
   */
  const loadTrackById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const track = await getTrackById(id);
      setCurrentTrack(track);
      return track;
    } catch (err) {
      setError(err.message || 'Ошибка загрузки трека');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Создать новый трек
   */
  const createTrack = useCallback(async (title, artist, duration, coverUri, playcount) => {
    setLoading(true);
    setError(null);
    
    try {
      const existing = await getTrackByTitleAndArtist(title, artist);
      if (existing) {
        setError('Трек уже существует в каталоге');
        throw new Error('Трек уже существует в каталоге');
      }
      
      const id = await insertTrack(title, artist, duration, coverUri, playcount);
      await loadTracks(false);
      
      const newTrack = { id, title, artist, duration, coverUri, playcount };
      syncTrackAdded(newTrack);
      
      return id;
    } catch (err) {
      setError(err.message || 'Ошибка создания трека');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTracks]);

  /**
   * Обновить трек
   */
  const editTrack = useCallback(async (id, title, artist, duration, coverUri) => {
    setLoading(true);
    setError(null);
    
    try {
      await updateTrack(id, title, artist, duration, coverUri);
      await loadTracks(false);
    } catch (err) {
      setError(err.message || 'Ошибка обновления трека');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTracks]);

  /**
   * Удалить трек
   */
  const removeTrack = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteTrack(id);
      await loadTracks(false);
      syncTrackDeleted(id);
    } catch (err) {
      setError(err.message || 'Ошибка удаления трека');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTracks]);

  /**
   * Очистить текущий трек
   */
  const clearCurrentTrack = useCallback(() => {
    setCurrentTrack(null);
  }, []);

  return {
    // Состояние
    tracks,
    currentTrack,
    loading,
    error,
    
    // Методы
    loadTracks,
    loadTrackById,
    createTrack,
    editTrack,
    removeTrack,
    clearCurrentTrack,
  };
};

export default useTracksViewModel;
