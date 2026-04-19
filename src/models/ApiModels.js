/**
 * Модели данных для API ответов Last.fm
 */


/**
 * Нормализация данных альбома из API
 */
export const normalizeAlbum = (album) => {
  if (!album) return null;

  return {
    mbid: album.mbid || '',
    name: album.name || '',
    artist: album.artist || '',
    url: album.url || '',
    image: album.image || [],
  };
};

/**
 * Нормализация данных трека из API
 */
export const normalizeTrack = (track) => {
  if (!track) return null;

  const artistName = typeof track.artist === 'string' ? track.artist : track.artist?.name || '';
  const artistImage = track.artist?.image || [];

  return {
    mbid: track.mbid || '',
    name: track.name || '',
    artist: artistName,
    artistImage: artistImage,
    url: track.url || '',
    image: track.image || [],
    duration: parseInt(track.duration || '0', 10),
  };
};

/**
 * Нормализация результатов поиска альбомов
 */
export const normalizeAlbumSearchResults = (data) => {
  if (!data?.results?.albummatches?.album) {
    return {
      albums: [],
      totalResults: 0,
      totalPages: 0,
    };
  }

  const albums = Array.isArray(data.results.albummatches.album)
    ? data.results.albummatches.album
    : [data.results.albummatches.album];

  return {
    albums: albums.map(normalizeAlbum),
    totalResults: parseInt(data.results['opensearch:totalResults'] || '0', 10),
    totalPages: parseInt(data.results['opensearch:totalPages'] || '0', 10),
  };
};

/**
 * Нормализация результатов поиска треков
 */
export const normalizeTrackSearchResults = (data) => {
  if (!data?.results?.trackmatches?.track) {
    return {
      tracks: [],
      totalResults: 0,
      totalPages: 0,
    };
  }

  const tracks = Array.isArray(data.results.trackmatches.track)
    ? data.results.trackmatches.track
    : [data.results.trackmatches.track];

  return {
    tracks: tracks.map(normalizeTrack),
    totalResults: parseInt(data.results['opensearch:totalResults'] || '0', 10),
    totalPages: parseInt(data.results['opensearch:totalPages'] || '0', 10),
  };
};

/**
 * Получить URL изображения нужного размера
 */
export const getImageUrl = (images, size = 'medium') => {
  if (!images || !Array.isArray(images)) return null;
  
  const sizeMap = {
    small: 'small',
    medium: 'medium',
    large: 'large',
    extralarge: 'extralarge',
    mega: 'mega',
  };

  const targetSize = sizeMap[size] || 'medium';
  const image = images.find(img => img.size === targetSize);
  
  return image?.['#text'] || images[0]?.['#text'] || null;
};

/**
 * Нормализация результатов поиска исполнителей
 */
export const normalizeArtistSearchResults = (data) => {
  if (!data?.results?.artistmatches?.artist) {
    return {
      artists: [],
      totalResults: 0,
      totalPages: 0,
    };
  }

  const artists = Array.isArray(data.results.artistmatches.artist)
    ? data.results.artistmatches.artist
    : [data.results.artistmatches.artist];

  return {
    artists: artists.map(normalizeArtist),
    totalResults: parseInt(data.results['opensearch:totalResults'] || '0', 10),
    totalPages: parseInt(data.results['opensearch:totalPages'] || '0', 10),
  };
};

/**
 * Нормализация данных исполнителя из API
 */
export const normalizeArtist = (artist) => {
  if (!artist) return null;

  return {
    mbid: artist.mbid || '',
    name: artist.name || '',
    url: artist.url || '',
    image: artist.image || [],
    listeners: artist.listeners || '',
  };
};

export default {
  normalizeAlbum,
  normalizeTrack,
  normalizeAlbumSearchResults,
  normalizeTrackSearchResults,
  getImageUrl,
};
