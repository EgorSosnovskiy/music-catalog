/**
 * Конфигурация Last.fm API
 * API Key: 3729c7c626a3f83b1f5b8071ef727313
 */
export const LASTFM_API_CONFIG = {
  BASE_URL: 'https://ws.audioscrobbler.com/2.0/',
  API_KEY: '3729c7c626a3f83b1f5b8071ef727313',
  FORMAT: 'json',
  // Время кэширования в миллисекундах (1 час)
  CACHE_DURATION: 60 * 60 * 1000,
};

/**
 * Методы Last.fm API
 */
export const LASTFM_METHODS = {
  ALBUM_SEARCH: 'album.search',
  ALBUM_GET_INFO: 'album.getInfo',
  TRACK_SEARCH: 'track.search',
  TRACK_GET_INFO: 'track.getInfo',
  ARTIST_SEARCH: 'artist.search',
};
