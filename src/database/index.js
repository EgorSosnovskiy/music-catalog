import * as SQLite from 'expo-sqlite';
import { getCurrentUserId } from '../services/AuthService';

let db;

      // Инициализация БД (создание таблиц)
      export const initDB = async () => {
        try {
          // Удаляем старую БД для чистой установки (для разработки)
          // await SQLite.deleteDatabaseAsync('music.db');
          
          db = await SQLite.openDatabaseAsync('music.db');
    
    // Создаем таблицы с userId и created_at
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        releaseYear TEXT,
        coverUri TEXT,
        description TEXT,
        playcount TEXT,
        created_at INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        duration TEXT,
        coverUri TEXT,
        playcount TEXT,
        created_at INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        tableName TEXT,
        recordId INTEGER,
        synced INTEGER DEFAULT 0,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
     // Добавляем столбец userId если его нет (миграция схемы)
     try {
       await db.execAsync(`ALTER TABLE albums ADD COLUMN userId TEXT`);
       console.log('Added userId column to albums (schema migration)');
     } catch (e) {
       // Column already exists, ignore
       if (process.env.EXPO_DEBUG) console.log('userId column already exists in albums');
     }
     
     try {
       await db.execAsync(`ALTER TABLE tracks ADD COLUMN userId TEXT`);
       console.log('Added userId column to tracks (schema migration)');
     } catch (e) {
       // Column already exists, ignore
       if (process.env.EXPO_DEBUG) console.log('userId column already exists in tracks');
     }
     
     // Добавляем столбец created_at если его нет (миграция схемы)
     try {
       await db.execAsync(`ALTER TABLE albums ADD COLUMN created_at INTEGER DEFAULT 0`);
       console.log('Added created_at column to albums (schema migration)');
     } catch (e) {
       // Check if error is about duplicate column
       if (e.message && e.message.includes('duplicate column name')) {
         if (process.env.EXPO_DEBUG) console.log('created_at column already exists in albums');
       } else {
         console.error('Error adding created_at column to albums:', e);
         // Re-throw if it's not a duplicate column error
         throw e;
       }
     }
     
     try {
       await db.execAsync(`ALTER TABLE tracks ADD COLUMN created_at INTEGER DEFAULT 0`);
       console.log('Added created_at column to tracks (schema migration)');
     } catch (e) {
       // Check if error is about duplicate column
       if (e.message && e.message.includes('duplicate column name')) {
         if (process.env.EXPO_DEBUG) console.log('created_at column already exists in tracks');
       } else {
         console.error('Error adding created_at column to tracks:', e);
         // Re-throw if it's not a duplicate column error
         throw e;
       }
     }
    
    try {
      await db.execAsync(`ALTER TABLE sync_status ADD COLUMN userId TEXT`);
      console.log('Added userId column to sync_status (schema migration)');
    } catch (e) {
      // Column already exists, ignore
    }
    
    // Очищаем legacy записи (без userId) — они не будут видны никакому пользователю
    try {
      const albumsResult = await db.runAsync("DELETE FROM albums WHERE userId IS NULL OR userId = ''");
      if (albumsResult.changes > 0) {
        console.log('Cleaned', albumsResult.changes, 'orphaned album records');
      }
    } catch (e) {
      console.log('No orphaned albums to clean');
    }
    
    try {
      const tracksResult = await db.runAsync("DELETE FROM tracks WHERE userId IS NULL OR userId = ''");
      if (tracksResult.changes > 0) {
        console.log('Cleaned', tracksResult.changes, 'orphaned track records');
      }
    } catch (e) {
      console.log('No orphaned tracks to clean');
    }
    
    try {
      const syncResult = await db.runAsync("DELETE FROM sync_status WHERE userId IS NULL OR userId = ''");
      if (syncResult.changes > 0) {
        console.log('Cleaned', syncResult.changes, 'orphaned sync_status records');
      }
    } catch (e) {
      console.log('No orphaned sync_status to clean');
    }
    
    console.log('Database initialized');
  } catch (error) {
    console.error('Database init error:', error);
    throw error;
  }
};

const getCurrentUserIdSafe = () => {
  return getCurrentUserId();
};

// ---------- Альбомы ----------
export const getAlbums = async () => {
  try {
    const userId = getCurrentUserIdSafe();
    return await db.getAllAsync('SELECT * FROM albums WHERE userId = ? ORDER BY created_at DESC, id DESC', userId);
  } catch (error) {
    console.error('getAlbums error:', error);
    return [];
  }
};

export const getAlbumById = async (id) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) return null;
    return await db.getFirstAsync('SELECT * FROM albums WHERE id = ? AND userId = ?', id, userId);
  } catch (error) {
    console.error('getAlbumById error:', error);
    return null;
  }
};

export const getAlbumByTitleAndArtist = async (title, artist) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) return null;
    return await db.getFirstAsync(
      'SELECT * FROM albums WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?) AND userId = ?',
      title,
      artist,
      userId
    );
  } catch (error) {
    console.error('getAlbumByTitleAndArtist error:', error);
    return null;
  }
};

export const insertAlbum = async (title, artist, releaseYear, coverUri, description, playcount, createdAt = null) => {
  try {
    const userId = getCurrentUserIdSafe();
    const ts = createdAt || Date.now();
    const result = await db.runAsync(
      'INSERT INTO albums (userId, title, artist, releaseYear, coverUri, description, playcount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      userId,
      title,
      artist,
      releaseYear,
      coverUri || '',
      description || '',
      playcount || '',
      ts
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('insertAlbum error:', error);
    throw error;
  }
};

export const updateAlbum = async (id, title, artist, releaseYear, coverUri, description, playcount) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) throw new Error('No authenticated user');
    await db.runAsync(
      'UPDATE albums SET title = ?, artist = ?, releaseYear = ?, coverUri = ?, description = ?, playcount = ? WHERE id = ? AND userId = ?',
      title,
      artist,
      releaseYear,
      coverUri || '',
      description || '',
      playcount || '',
      id,
      userId
    );
  } catch (error) {
    console.error('updateAlbum error:', error);
    throw error;
  }
};

export const deleteAlbum = async (id) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) throw new Error('No authenticated user');
    await db.runAsync('DELETE FROM albums WHERE id = ? AND userId = ?', id, userId);
  } catch (error) {
    console.error('deleteAlbum error:', error);
    throw error;
  }
};

// ---------- Треки ----------
export const getTracks = async () => {
  try {
    const userId = getCurrentUserIdSafe();
    return await db.getAllAsync('SELECT * FROM tracks WHERE userId = ? ORDER BY created_at DESC, id DESC', userId);
  } catch (error) {
    console.error('getTracks error:', error);
    return [];
  }
};

export const getTrackById = async (id) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) return null;
    return await db.getFirstAsync('SELECT * FROM tracks WHERE id = ? AND userId = ?', id, userId);
  } catch (error) {
    console.error('getTrackById error:', error);
    return null;
  }
};

export const getTrackByTitleAndArtist = async (title, artist) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) return null;
    return await db.getFirstAsync(
      'SELECT * FROM tracks WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?) AND userId = ?',
      title,
      artist,
      userId
    );
  } catch (error) {
    console.error('getTrackByTitleAndArtist error:', error);
    return null;
  }
};

export const insertTrack = async (title, artist, duration, coverUri, playcount, createdAt = null) => {
  try {
    const userId = getCurrentUserIdSafe();
    const ts = createdAt || Date.now();
    const result = await db.runAsync(
      'INSERT INTO tracks (userId, title, artist, duration, coverUri, playcount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      userId,
      title,
      artist,
      duration || '',
      coverUri || '',
      playcount || '',
      ts
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('insertTrack error:', error);
    throw error;
  }
};

export const updateTrack = async (id, title, artist, duration, coverUri, playcount) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) throw new Error('No authenticated user');
    await db.runAsync(
      'UPDATE tracks SET title = ?, artist = ?, duration = ?, coverUri = ?, playcount = ? WHERE id = ? AND userId = ?',
      title,
      artist,
      duration || '',
      coverUri || '',
      playcount || '',
      id,
      userId
    );
  } catch (error) {
    console.error('updateTrack error:', error);
    throw error;
  }
};

export const deleteTrack = async (id) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) throw new Error('No authenticated user');
    await db.runAsync('DELETE FROM tracks WHERE id = ? AND userId = ?', id, userId);
  } catch (error) {
    console.error('deleteTrack error:', error);
    throw error;
  }
};

// ---------- Поиск, фильтрация, сортировка ----------
export const getAlbumsFiltered = async ({ search = '', sortBy = 'title_asc', artist = null, yearFrom = null, yearTo = null, hasCover = null }) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) return [];
    let query = 'SELECT * FROM albums WHERE userId = ?';
    const params = [userId];

    if (search.trim()) {
      query += ' AND (title LIKE ? OR artist LIKE ?)';
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    if (artist) {
      query += ' AND artist LIKE ?';
      params.push(`%${artist}%`);
    }

    if (yearFrom) {
      query += ' AND releaseYear >= ?';
      params.push(yearFrom);
    }

    if (yearTo) {
      query += ' AND releaseYear <= ?';
      params.push(yearTo);
    }

    if (hasCover === true) {
      query += ' AND coverUri IS NOT NULL AND coverUri != ""';
    } else if (hasCover === false) {
      query += ' AND (coverUri IS NULL OR coverUri = "")';
    }

    switch (sortBy) {
      case 'title_asc':
        query += ' ORDER BY title ASC';
        break;
      case 'title_desc':
        query += ' ORDER BY title DESC';
        break;
      case 'year_desc':
        query += ' ORDER BY releaseYear DESC';
        break;
      case 'year_asc':
        query += ' ORDER BY releaseYear ASC';
        break;
      case 'playcount_desc':
        query += ' ORDER BY CAST(playcount AS INTEGER) DESC';
        break;
      case 'playcount_asc':
        query += ' ORDER BY CAST(playcount AS INTEGER) ASC';
        break;
      default:
        query += ' ORDER BY title ASC';
    }

    return await db.getAllAsync(query, params);
  } catch (error) {
    console.error('getAlbumsFiltered error:', error);
    return [];
  }
};

export const getTracksFiltered = async ({ search = '', sortBy = 'title_asc', artist = null, hasCover = null }) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) return [];
    let query = 'SELECT * FROM tracks WHERE userId = ?';
    const params = [userId];

    if (search.trim()) {
      query += ' AND (title LIKE ? OR artist LIKE ?)';
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    if (artist) {
      query += ' AND artist LIKE ?';
      params.push(`%${artist}%`);
    }

    if (hasCover === true) {
      query += ' AND coverUri IS NOT NULL AND coverUri != ""';
    } else if (hasCover === false) {
      query += ' AND (coverUri IS NULL OR coverUri = "")';
    }

    switch (sortBy) {
      case 'title_asc':
        query += ' ORDER BY title ASC';
        break;
      case 'title_desc':
        query += ' ORDER BY title DESC';
        break;
      case 'playcount_desc':
        query += ' ORDER BY CAST(playcount AS INTEGER) DESC';
        break;
      case 'playcount_asc':
        query += ' ORDER BY CAST(playcount AS INTEGER) ASC';
        break;
      default:
        query += ' ORDER BY title ASC';
    }

    return await db.getAllAsync(query, params);
  } catch (error) {
    console.error('getTracksFiltered error:', error);
    return [];
  }
};

// ---------- Статус синхронизации ----------
export const addSyncStatus = async (tableName, recordId, synced = false) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      console.warn('No user for sync status');
      return;
    }
    await db.runAsync(
      `CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        tableName TEXT,
        recordId INTEGER,
        synced INTEGER DEFAULT 0,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    );
    await db.runAsync(
      'INSERT INTO sync_status (userId, tableName, recordId, synced) VALUES (?, ?, ?, ?)',
      userId,
      tableName,
      recordId,
      synced ? 1 : 0
    );
  } catch (error) {
    console.error('addSyncStatus error:', error);
  }
};

export const getUnsyncedRecords = async (tableName) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) return [];
    const result = await db.getAllAsync(
      'SELECT * FROM sync_status WHERE userId = ? AND tableName = ? AND synced = 0',
      userId,
      tableName
    );
    return result;
  } catch (error) {
    console.error('getUnsyncedRecords error:', error);
    return [];
  }
};

export const markAsSynced = async (tableName, recordId) => {
  try {
    const userId = getCurrentUserIdSafe();
    if (!userId) {
      console.warn('No user for marking synced');
      return;
    }
    await db.runAsync(
      'UPDATE sync_status SET synced = 1, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND tableName = ? AND recordId = ?',
      userId,
      tableName,
      recordId
    );
  } catch (error) {
    console.error('markAsSynced error:', error);
  }
};

export default {
  initDB,
  getAlbums,
  getAlbumById,
  getAlbumByTitleAndArtist,
  insertAlbum,
  updateAlbum,
  deleteAlbum,
  getTracks,
  getTrackById,
  getTrackByTitleAndArtist,
  insertTrack,
  updateTrack,
  deleteTrack,
  getAlbumsFiltered,
  getTracksFiltered,
  addSyncStatus,
  getUnsyncedRecords,
  markAsSynced,
};