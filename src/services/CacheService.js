import * as SQLite from 'expo-sqlite';
import { LASTFM_API_CONFIG } from '../config/api';

let db;

/**
 * Инициализация таблицы кэша
 */
export const initCache = async () => {
  try {
    db = await SQLite.openDatabaseAsync('music.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS api_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        params TEXT NOT NULL,
        response TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );
    `);
    console.log('Cache table initialized');
  } catch (error) {
    console.error('Cache init error:', error);
    throw error;
  }
};

/**
 * Сервис кэширования API ответов
 */
class CacheServiceClass {
  /**
   * Сохранить данные в кэш
   */
  async set(endpoint, params, data) {
    if (!db) await initCache();
    
    try {
      const cachedAt = Date.now();
      const paramsJson = JSON.stringify(params);
      const responseJson = JSON.stringify(data);

      await db.runAsync(
        'INSERT OR REPLACE INTO api_cache (endpoint, params, response, cached_at) VALUES (?, ?, ?, ?)',
        endpoint,
        paramsJson,
        responseJson,
        cachedAt
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Получить данные из кэша
   */
  async get(endpoint, params) {
    if (!db) await initCache();

    try {
      const paramsJson = JSON.stringify(params);
      const result = await db.getFirstAsync(
        'SELECT * FROM api_cache WHERE endpoint = ? AND params = ?',
        endpoint,
        paramsJson
      );

      if (!result) {
        return null;
      }

      // Проверить, не истёк ли кэш
      const now = Date.now();
      const cacheAge = now - result.cached_at;

      if (cacheAge > LASTFM_API_CONFIG.CACHE_DURATION) {
        // Кэш истёк, удалить запись
        await this.remove(endpoint, params);
        return null;
      }

      return JSON.parse(result.response);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Удалить конкретную запись из кэша
   */
  async remove(endpoint, params) {
    if (!db) await initCache();

    try {
      const paramsJson = JSON.stringify(params);
      await db.runAsync(
        'DELETE FROM api_cache WHERE endpoint = ? AND params = ?',
        endpoint,
        paramsJson
      );
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Очистить весь кэш
   */
  async clear() {
    if (!db) await initCache();

    try {
      await db.runAsync('DELETE FROM api_cache');
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Получить данные - сначала из кэша, потом выполнить запрос
   */
  async getOrFetch(endpoint, params, fetchFn) {
    // Попробовать получить из кэша
    const cachedData = await this.get(endpoint, params);
    
    if (cachedData) {
      console.log(`Cache hit for ${endpoint}`);
      return { data: cachedData, fromCache: true };
    }

    // Кэш пуст, выполнить запрос
    console.log(`Cache miss for ${endpoint}`);
    const data = await fetchFn();

    // Сохранить в кэш
    if (data) {
      await this.set(endpoint, params, data);
    }

    return { data, fromCache: false };
  }
}

export const cacheService = new CacheServiceClass();
export default cacheService;
