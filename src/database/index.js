import * as SQLite from 'expo-sqlite';

let db;

// Инициализация БД (создание таблиц)
export const initDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('music.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        releaseYear TEXT,
        coverUri TEXT,
        description TEXT
      );
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        duration TEXT
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

export const insertAlbum = async (title, artist, releaseYear, coverUri, description) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO albums (title, artist, releaseYear, coverUri, description) VALUES (?, ?, ?, ?, ?)',
      title,
      artist,
      releaseYear,
      coverUri || '',
      description || ''
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('insertAlbum error:', error);
    throw error;
  }
};

export const updateAlbum = async (id, title, artist, releaseYear, coverUri, description) => {
  try {
    await db.runAsync(
      'UPDATE albums SET title = ?, artist = ?, releaseYear = ?, coverUri = ?, description = ? WHERE id = ?',
      title,
      artist,
      releaseYear,
      coverUri || '',
      description || '',
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

export const insertTrack = async (title, artist, duration) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO tracks (title, artist, duration) VALUES (?, ?, ?)',
      title,
      artist,
      duration || ''
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('insertTrack error:', error);
    throw error;
  }
};

export const updateTrack = async (id, title, artist, duration) => {
  try {
    await db.runAsync(
      'UPDATE tracks SET title = ?, artist = ?, duration = ? WHERE id = ?',
      title,
      artist,
      duration || '',
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