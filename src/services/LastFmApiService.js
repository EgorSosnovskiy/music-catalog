import { LASTFM_API_CONFIG, LASTFM_METHODS } from '../config/api';
import { networkService } from './NetworkService';
import { cacheService } from './CacheService';

/**
 * Сервис для работы с Last.fm API
 */
class LastFmApiServiceClass {
  /**
   * Выполнить запрос к Last.fm API
   */
  async fetch(method, params = {}) {
    // Проверить соединение
    if (!networkService.getConnectionState()) {
      throw new Error('Нет подключения к интернету');
    }

    // Собрать параметры запроса
    const queryParams = new URLSearchParams({
      method,
      api_key: LASTFM_API_CONFIG.API_KEY,
      format: LASTFM_API_CONFIG.FORMAT,
      ...params,
    });

    const url = `${LASTFM_API_CONFIG.BASE_URL}?${queryParams.toString()}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Проверить на ошибки API
      if (data.error) {
        throw new Error(data.message || 'Ошибка API');
      }

      return data;
    } catch (error) {
      console.error('Last.fm API error:', error);
      throw error;
    }
  }

  /**
   * Получить данные с автоматическим кэшированием
   */
  async fetchWithCache(method, params = {}) {
    const endpoint = method;
    const cacheKey = params;

    // Используем getOrFetch из CacheService
    return await cacheService.getOrFetch(endpoint, cacheKey, () => 
      this.fetch(method, params)
    );
  }

  /**
   * Поиск альбомов
   */
  async searchAlbums(albumName, limit = 20, page = 1) {
    const result = await this.fetchWithCache(
      LASTFM_METHODS.ALBUM_SEARCH,
      { album: albumName, limit: limit.toString(), page: page.toString() }
    );
    return result;
  }

  /**
   * Получить информацию об альбоме
   */
  async getAlbumInfo(artistName, albumName) {
    const result = await this.fetchWithCache(
      LASTFM_METHODS.ALBUM_GET_INFO,
      { artist: artistName, album: albumName }
    );
    return result;
  }

  /**
   * Поиск треков
   */
  async searchTracks(trackName, limit = 20, page = 1) {
    const result = await this.fetchWithCache(
      LASTFM_METHODS.TRACK_SEARCH,
      { track: trackName, limit: limit.toString(), page: page.toString() }
    );
    return result;
  }

  /**
   * Получить информацию о треке
   */
  async getTrackInfo(artistName, trackName) {
    const result = await this.fetchWithCache(
      LASTFM_METHODS.TRACK_GET_INFO,
      { artist: artistName, track: trackName }
    );
    return result;
  }

  /**
   * Поиск исполнителей
   */
  async searchArtists(artistName, limit = 10, page = 1) {
    const result = await this.fetchWithCache(
      LASTFM_METHODS.ARTIST_SEARCH,
      { artist: artistName, limit: limit.toString(), page: page.toString() }
    );
    return result;
  }
}

export const lastFmApiService = new LastFmApiServiceClass();
export default lastFmApiService;
