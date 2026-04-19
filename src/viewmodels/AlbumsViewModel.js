import { useState, useCallback } from 'react';
import { getAlbums, getAlbumById, getAlbumByTitleAndArtist, insertAlbum, updateAlbum, deleteAlbum } from '../database';
import { syncAlbumAdded, syncAlbumDeleted } from '../services/SyncService';
import { uploadImageToCloudinary, deleteImageFromCloudinary, isCloudinaryImage } from '../services/CloudinaryService';
import networkService from '../services/NetworkService';

/**
 * ViewModel для управления альбомами
 * Реализует паттерн MVVM - инкапсулирует бизнес-логику
 */
export const useAlbumsViewModel = () => {
  const [albums, setAlbums] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Загрузить все альбомы
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
      
      let finalCoverUri = coverUri;
      
      if (coverUri && coverUri.startsWith('http') && networkService.getConnectionState()) {
        try {
          const uploadedUrl = await uploadImageToCloudinary(coverUri);
          if (uploadedUrl) {
            finalCoverUri = uploadedUrl;
          }
        } catch (cloudinaryError) {
          console.log('Cloudinary upload skipped:', cloudinaryError.message);
        }
      }
      
      const id = await insertAlbum(title, artist, releaseYear, finalCoverUri, description, playcount);
      await loadAlbums(false);
      
      const newAlbum = { id, title, artist, releaseYear, coverUri: finalCoverUri, description, playcount };
      syncAlbumAdded(newAlbum);
      
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
   */
  const editAlbum = useCallback(async (id, title, artist, releaseYear, coverUri, description) => {
    setLoading(true);
    setError(null);
    
    try {
      const existingAlbum = await getAlbumById(id);
      let finalCoverUri = coverUri;
      
      if (coverUri && coverUri.startsWith('http')) {
        const uploadedUrl = await uploadImageToCloudinary(coverUri);
        if (uploadedUrl) {
          finalCoverUri = uploadedUrl;
          if (existingAlbum?.coverUri && isCloudinaryImage(existingAlbum.coverUri)) {
            await deleteImageFromCloudinary(existingAlbum.coverUri);
          }
        }
      }
      
      await updateAlbum(id, title, artist, releaseYear, finalCoverUri, description);
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
   */
  const removeAlbum = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const album = await getAlbumById(id);
      if (album?.coverUri && isCloudinaryImage(album.coverUri)) {
        await deleteImageFromCloudinary(album.coverUri);
      }
      
      await deleteAlbum(id);
      await loadAlbums(false);
      syncAlbumDeleted(id);
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
    // Состояние
    albums,
    currentAlbum,
    loading,
    error,
    
    // Методы
    loadAlbums,
    loadAlbumById,
    createAlbum,
    editAlbum,
    removeAlbum,
    clearCurrentAlbum,
  };
};

export default useAlbumsViewModel;
