import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getAlbums, 
  getAlbumById, 
  getAlbumByTitleAndArtist, 
  insertAlbum, 
  updateAlbum, 
  deleteAlbum 
} from '../database';
import { syncAlbumAdded, syncAlbumDeleted } from '../services/SyncService';
import { uploadImageToCloudinary, deleteImageFromCloudinary, isCloudinaryImage } from '../services/CloudinaryService';
import networkService from '../services/NetworkService';
import { getCurrentUserId } from '../services/AuthService';
import { subscribeToAlbums } from '../services/FirebaseService';
import firebaseService from '../services/FirebaseService';

export const useAlbumsViewModel = () => {
  const [albums, setAlbums] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);
  const unsubscribeRef = useRef(null);

  /**
   * Возвращает ключ альбома (title+artist) для сравнения
   */
  const getAlbumKey = (album) => {
    return `${(album.title || '').toLowerCase().trim()}_${(album.artist || '').toLowerCase().trim()}`;
  };

  /**
   * Получает timestamp из Firestore объекта
   */
  const getTimestamp = (value) => {
    if (!value) return 0;
    if (value.toDate) return value.toDate().getTime();
    if (typeof value === 'string') return new Date(value).getTime();
    if (typeof value === 'number') return value;
    return 0;
  };

  /**
   * Синхронизирует альбомы из Firestore в SQLite
   * Выполняет полный sync: upsert новых/изменённых, delete отсутствующих
   */
  const syncAlbumsFromFirestore = useCallback(async (firestoreAlbums) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      // Получаем локальные альбомы
      const localAlbums = await getAlbums();
      const localByKey = new Map();
      for (const a of localAlbums) {
        localByKey.set(getAlbumKey(a), a);
      }

      const firestoreKeys = new Set();

      // Upsert альбомов из Firestore
      for (const fa of firestoreAlbums) {
        const key = getAlbumKey(fa);
        firestoreKeys.add(key);
        const existing = localByKey.get(key);
        
        // Извлекаем createdAt как timestamp
        let createdAt = getTimestamp(fa.createdAt);
        if (createdAt === 0) {
          // Fallback: используем текущее время
          createdAt = Date.now();
        }
        
        if (existing) {
          await updateAlbum(
            existing.id,
            fa.title,
            fa.artist,
            fa.releaseYear,
            fa.coverUri,
            fa.description,
            fa.playcount
          );
          // Можно обновить created_at если нужно, но обычно не меняется
        } else {
          await insertAlbum(
            fa.title,
            fa.artist,
            fa.releaseYear,
            fa.coverUri,
            fa.description,
            fa.playcount,
            createdAt
          );
        }
      }

      // Удаляем локальные альбомы, отсутствующие в Firestore
      for (const [key, local] of localByKey) {
        if (!firestoreKeys.has(key)) {
          await deleteAlbum(local.id);
        }
      }

    } catch (err) {
      console.error('Error syncing albums from Firestore:', err);
    }
  }, []);

  /**
   * Real-time listener
   */
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

    const unsubscribe = subscribeToAlbums(userId, (firestoreAlbums) => {
      // Синхронизируем локальную БД
      syncAlbumsFromFirestore(firestoreAlbums);
      
      // Сортируем по createdAt DESC и обновляем UI
      const sorted = [...firestoreAlbums].sort((a, b) => {
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      });
      setAlbums(sorted);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setIsRealtimeEnabled(false);
    };
  }, [syncAlbumsFromFirestore]);

  /**
   * Загрузить альбомы из локальной БД (fallback)
   */
  const loadAlbums = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const data = await getAlbums();
      setAlbums(data);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки альбомов');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  /**
   * Загрузить альбом по ID
   */
  const loadAlbumById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const album = await getAlbumById(id);
      setCurrentAlbum(album);
      return album;
    } catch (err) {
      setError(err.message || 'Ошибка загрузки альбома');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

   /**
    * Создать новый альбом
    * Обложка загружается в фоне после добавления в БД
    */
   const createAlbum = useCallback(async (title, artist, releaseYear, coverUri, description, playcount) => {
     setLoading(true);
     setError(null);
     
     try {
       const existing = await getAlbumByTitleAndArtist(title, artist);
       if (existing) {
         setError('Альбом уже существует в каталоге');
         throw new Error('Альбом уже существует в каталоге');
       }
       
       // Insert album immediately with original coverUri (no waiting for Cloudinary)
       const id = await insertAlbum(title, artist, releaseYear, coverUri, description, playcount);
       const albumData = { id, title, artist, releaseYear, coverUri, description, playcount };
       
       // Enqueue for sync (offline support)
       syncAlbumAdded(albumData);
       
       // Immediate Firestore upload if online (with original coverUri for now)
       if (networkService.getConnectionState()) {
         try {
           const userId = getCurrentUserId();
           if (userId) {
             await firebaseService.uploadAlbumToFirestore(userId, albumData);
           }
         } catch (err) {
           console.log('Immediate Firestore upload failed, queued for later:', err.message);
         }
       }
       
       // Background Cloudinary upload - doesn't block UI
       if (coverUri && coverUri.startsWith('http') && networkService.getConnectionState()) {
         // Fire and forget - don't await, don't show errors to user
         uploadImageToCloudinary(coverUri).then((uploadedUrl) => {
           if (uploadedUrl) {
             // Update album with Cloudinary URL in background
             updateAlbum(id, title, artist, releaseYear, uploadedUrl, description, playcount)
               .then(() => {
                 // Optionally update Firestore with the new URL
                 if (networkService.getConnectionState()) {
                   try {
                     const userId = getCurrentUserId();
                     if (userId) {
                       firebaseService.uploadAlbumToFirestore(userId, {
                         id,
                         title,
                         artist,
                         releaseYear,
                         coverUri: uploadedUrl,
                         description,
                         playcount
                       });
                     }
                   } catch (firestoreErr) {
                     console.log('Background Firestore update failed:', firestoreErr.message);
                   }
                 }
               })
               .catch((updateErr) => {
                 console.log('Background album update failed:', updateErr.message);
               });
           }
         }).catch((uploadErr) => {
           console.log('Background Cloudinary upload failed:', uploadErr.message);
           // Keep original URL, no action needed
         });
       }
       
       await loadAlbums(false);
       return id;
     } catch (err) {
       setError(err.message || 'Ошибка создания альбома');
       throw err;
     } finally {
       setLoading(false);
     }
   }, [loadAlbums]);

   /**
    * Обновить альбом
    * Обложка загружается в фоне после обновления в БД
    */
   const editAlbum = useCallback(async (id, title, artist, releaseYear, coverUri, description) => {
     setLoading(true);
     setError(null);
     
     try {
       const existingAlbum = await getAlbumById(id);
       // Update album immediately with original coverUri (no waiting for Cloudinary)
       await updateAlbum(id, title, artist, releaseYear, coverUri, description);
       
       // Immediate Firestore update if online (with original coverUri for now)
       if (networkService.getConnectionState()) {
         try {
           const userId = getCurrentUserId();
           if (userId) {
             await firebaseService.uploadAlbumToFirestore(userId, {
               id,
               title,
               artist,
               releaseYear,
               coverUri: coverUri,
               description,
               playcount: existingAlbum?.playcount || '',
             });
           }
         } catch (err) {
           console.log('Immediate Firestore update failed, queued for later:', err.message);
         }
       }
       
       // Background Cloudinary upload - doesn't block UI
       if (coverUri && coverUri.startsWith('http') && networkService.getConnectionState()) {
         // Fire and forget - don't await, don't show errors to user
         uploadImageToCloudinary(coverUri).then((uploadedUrl) => {
           if (uploadedUrl) {
             // Update album with Cloudinary URL in background
             updateAlbum(id, title, artist, releaseYear, uploadedUrl, description)
               .then(() => {
                 // Delete old image from Cloudinary if it was a Cloudinary URL
                 if (existingAlbum?.coverUri && isCloudinaryImage(existingAlbum.coverUri)) {
                   deleteImageFromCloudinary(existingAlbum.coverUri);
                 }
                 
                 // Optionally update Firestore with the new URL
                 if (networkService.getConnectionState()) {
                   try {
                     const userId = getCurrentUserId();
                     if (userId) {
                       firebaseService.uploadAlbumToFirestore(userId, {
                         id,
                         title,
                         artist,
                         releaseYear,
                         coverUri: uploadedUrl,
                         description,
                         playcount: existingAlbum?.playcount || '',
                       });
                     }
                   } catch (firestoreErr) {
                     console.log('Background Firestore update failed:', firestoreErr.message);
                   }
                 }
               })
               .catch((updateErr) => {
                 console.log('Background album update failed:', updateErr.message);
               });
           }
         }).catch((uploadErr) => {
           console.log('Background Cloudinary upload failed:', uploadErr.message);
           // Keep original URL, no action needed
         });
       }
       
       await loadAlbums(false);
     } catch (err) {
       setError(err.message || 'Ошибка обновления альбома');
       throw err;
     } finally {
       setLoading(false);
     }
   }, [loadAlbums]);

   /**
    * Удалить альбом
    * Удаление из Cloudinary выполняется в фоне
    */
   const removeAlbum = useCallback(async (id) => {
     setLoading(true);
     setError(null);
     
     try {
       const album = await getAlbumById(id);
       // Delete from local DB immediately
       await deleteAlbum(id);
       syncAlbumDeleted(id);
       
       // Background Cloudinary deletion - doesn't block UI
       if (album?.coverUri && isCloudinaryImage(album.coverUri)) {
         // Fire and forget - don't await, don't show errors to user
         deleteImageFromCloudinary(album.coverUri).catch((deleteErr) => {
           console.log('Background Cloudinary deletion failed:', deleteErr.message);
           // Not critical - image will remain in Cloudinary but that's OK
         });
       }
       
       // Immediate Firestore delete if online
       if (networkService.getConnectionState()) {
         try {
           const userId = getCurrentUserId();
           if (userId) {
             await firebaseService.deleteAlbumFromFirestore(userId, id);
           }
         } catch (err) {
           console.log('Immediate Firestore delete failed, queued for later:', err.message);
         }
       }
       
       await loadAlbums(false);
     } catch (err) {
       setError(err.message || 'Ошибка удаления альбома');
       throw err;
     } finally {
       setLoading(false);
     }
   }, [loadAlbums]);

  /**
   * Очистить текущий альбом
   */
  const clearCurrentAlbum = useCallback(() => {
    setCurrentAlbum(null);
  }, []);

  return {
    albums,
    currentAlbum,
    loading,
    error,
    isRealtimeEnabled,
    
    loadAlbums,
    loadAlbumById,
    createAlbum,
    editAlbum,
    removeAlbum,
    clearCurrentAlbum,
  };
};

export default useAlbumsViewModel;
