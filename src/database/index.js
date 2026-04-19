import * as SQLite from 'expo-sqlite';

let db;

// Инициализация БД (создание таблиц)
export const initDB = async () => {
  try {

    // Удаляем старую БД для чистой установки (для разработки)
    //await SQLite.deleteDatabaseAsync('music.db');
    
    db = await SQLite.openDatabaseAsync('music.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        releaseYear TEXT,
        coverUri TEXT,
        description TEXT,
        playcount TEXT
      );
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        duration TEXT,
        coverUri TEXT,
        playcount TEXT
      );
    `);
    
    
    console.log('Database initialized');
  } catch (error) {
    console.error('Database init error:', error);
    throw error;
  }
};

// ---------- Альбомы ----------
export const getAlbums = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM albums ORDER BY id DESC');
  } catch (error) {
    console.error('getAlbums error:', error);
    return [];
  }
};

export const getAlbumById = async (id) => {
  try {
    return await db.getFirstAsync('SELECT * FROM albums WHERE id = ?', id);
  } catch (error) {
    console.error('getAlbumById error:', error);
    return null;
  }
};

export const getAlbumByTitleAndArtist = async (title, artist) => {
  try {
    return await db.getFirstAsync(
      'SELECT * FROM albums WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)',
      title,
      artist
    );
  } catch (error) {
    console.error('getAlbumByTitleAndArtist error:', error);
    return null;
  }
};

export const insertAlbum = async (title, artist, releaseYear, coverUri, description, playcount) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO albums (title, artist, releaseYear, coverUri, description, playcount) VALUES (?, ?, ?, ?, ?, ?)',
      title,
      artist,
      releaseYear,
      coverUri || '',
      description || '',
      playcount || ''
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('insertAlbum error:', error);
    throw error;
  }
};

export const updateAlbum = async (id, title, artist, releaseYear, coverUri, description, playcount) => {
  try {
    await db.runAsync(
      'UPDATE albums SET title = ?, artist = ?, releaseYear = ?, coverUri = ?, description = ?, playcount = ? WHERE id = ?',
      title,
      artist,
      releaseYear,
      coverUri || '',
      description || '',
      playcount || '',
      id
    );
  } catch (error) {
    console.error('updateAlbum error:', error);
    throw error;
  }
};

export const deleteAlbum = async (id) => {
  try {
    await db.runAsync('DELETE FROM albums WHERE id = ?', id);
  } catch (error) {
    console.error('deleteAlbum error:', error);
    throw error;
  }
};

// ---------- Треки ----------
export const getTracks = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM tracks ORDER BY id DESC');
  } catch (error) {
    console.error('getTracks error:', error);
    return [];
  }
};

export const getTrackById = async (id) => {
  try {
    return await db.getFirstAsync('SELECT * FROM tracks WHERE id = ?', id);
  } catch (error) {
    console.error('getTrackById error:', error);
    return null;
  }
};

export const getTrackByTitleAndArtist = async (title, artist) => {
  try {
    return await db.getFirstAsync(
      'SELECT * FROM tracks WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)',
      title,
      artist
    );
  } catch (error) {
    console.error('getTrackByTitleAndArtist error:', error);
    return null;
  }
};

export const insertTrack = async (title, artist, duration, coverUri, playcount) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO tracks (title, artist, duration, coverUri, playcount) VALUES (?, ?, ?, ?, ?)',
      title,
      artist,
      duration || '',
      coverUri || '',
      playcount || ''
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('insertTrack error:', error);
    throw error;
  }
};

export const updateTrack = async (id, title, artist, duration, coverUri, playcount) => {
  try {
    await db.runAsync(
      'UPDATE tracks SET title = ?, artist = ?, duration = ?, coverUri = ?, playcount = ? WHERE id = ?',
      title,
      artist,
      duration || '',
      coverUri || '',
      playcount || '',
      id
    );
  } catch (error) {
    console.error('updateTrack error:', error);
    throw error;
  }
};

export const deleteTrack = async (id) => {
  try {
    await db.runAsync('DELETE FROM tracks WHERE id = ?', id);
  } catch (error) {
    console.error('deleteTrack error:', error);
    throw error;
  }
};

// ---------- Поиск, фильтрация, сортировка ----------

// Типы сортировки: 'title_asc', 'title_desc', 'year_desc', 'year_asc', 'playcount_desc', 'playcount_asc'
export const getAlbumsFiltered = async ({ search = '', sortBy = 'title_asc', artist = null, yearFrom = null, yearTo = null, hasCover = null }) => {
  try {
    let query = 'SELECT * FROM albums WHERE 1=1';
    const params = [];

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
    let query = 'SELECT * FROM tracks WHERE 1=1';
    const params = [];

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
    await db.runAsync(
      `CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tableName TEXT,
        recordId INTEGER,
        synced INTEGER DEFAULT 0,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    );
    await db.runAsync(
      'INSERT INTO sync_status (tableName, recordId, synced) VALUES (?, ?, ?)',
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
    const result = await db.getAllAsync(
      'SELECT * FROM sync_status WHERE tableName = ? AND synced = 0',
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
    await db.runAsync(
      'UPDATE sync_status SET synced = 1, updatedAt = CURRENT_TIMESTAMP WHERE tableName = ? AND recordId = ?',
      tableName,
      recordId
    );
  } catch (error) {
    console.error('markAsSynced error:', error);
  }
};