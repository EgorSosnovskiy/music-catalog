import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getTracks, 
  getTrackById, 
  getTrackByTitleAndArtist, 
  insertTrack, 
  updateTrack, 
  deleteTrack 
} from '../database';
import { syncTrackAdded, syncTrackDeleted } from '../services/SyncService';
import { getCurrentUserId } from '../services/AuthService';
import { subscribeToTracks } from '../services/FirebaseService';
import firebaseService from '../services/FirebaseService';

export const useTracksViewModel = () => {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);
  const unsubscribeRef = useRef(null);

  const getTrackKey = (track) => {
    return `${(track.title || '').toLowerCase().trim()}_${(track.artist || '').toLowerCase().trim()}`;
  };

  const getTimestamp = (value) => {
    if (!value) return 0;
    if (value.toDate) return value.toDate().getTime();
    if (typeof value === 'string') return new Date(value).getTime();
    if (typeof value === 'number') return value;
    return 0;
  };

  const syncTracksFromFirestore = useCallback(async (firestoreTracks) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const localTracks = await getTracks();
      const localByKey = new Map();
      for (const t of localTracks) {
        localByKey.set(getTrackKey(t), t);
      }

      const firestoreKeys = new Set();

      for (const ft of firestoreTracks) {
        const key = getTrackKey(ft);
        firestoreKeys.add(key);
        const existing = localByKey.get(key);
        
        let createdAt = getTimestamp(ft.createdAt);
        if (createdAt === 0) createdAt = Date.now();
        
        if (existing) {
          await updateTrack(
            existing.id,
            ft.title,
            ft.artist,
            ft.duration,
            ft.coverUri,
            ft.playcount
          );
        } else {
          await insertTrack(
            ft.title,
            ft.artist,
            ft.duration,
            ft.coverUri,
            ft.playcount,
            createdAt
          );
        }
      }

      // Delete missing
      for (const [key, local] of localByKey) {
        if (!firestoreKeys.has(key)) {
          await deleteTrack(local.id);
        }
      }

    } catch (err) {
      console.error('Error syncing tracks from Firestore:', err);
    }
  }, []);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    setIsRealtimeEnabled(true);

    const unsubscribe = subscribeToTracks(userId, (firestoreTracks) => {
      syncTracksFromFirestore(firestoreTracks);
      
      const sorted = [...firestoreTracks].sort((a, b) => {
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      });
      setTracks(sorted);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setIsRealtimeEnabled(false);
    };
  }, [syncTracksFromFirestore]);

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
      
      syncTrackAdded({
        id,
        title,
        artist,
        duration,
        coverUri,
        playcount,
      });
      
      await loadTracks(false);
      
      return id;
    } catch (err) {
      setError(err.message || 'Ошибка создания трека');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTracks]);

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

  const removeTrack = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteTrack(id);
      syncTrackDeleted(id);
      await loadTracks(false);
    } catch (err) {
      setError(err.message || 'Ошибка удаления трека');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTracks]);

  const clearCurrentTrack = useCallback(() => {
    setCurrentTrack(null);
  }, []);

  return {
    tracks,
    currentTrack,
    loading,
    error,
    isRealtimeEnabled,
    
    loadTracks,
    loadTrackById,
    createTrack,
    editTrack,
    removeTrack,
    clearCurrentTrack,
  };
};

export default useTracksViewModel;
