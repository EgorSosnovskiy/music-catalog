import Fuse from 'fuse.js';
import { getAlbums, getTracks } from '../database';

const fuseOptions = {
  includeScore: true,
  threshold: 0.3,
  keys: ['title', 'artist', 'releaseYear'],
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export const fuzzySearchAlbums = async (query, options = {}) => {
  try {
    const albums = await getAlbums();
    
    if (!query.trim()) {
      return albums;
    }

    const fuse = new Fuse(albums, {
      ...fuseOptions,
      ...options,
      keys: ['title', 'artist'],
    });

    const results = fuse.search(query);
    return results.map(result => result.item);
  } catch (error) {
    console.error('fuzzySearchAlbums error:', error);
    return [];
  }
};

export const fuzzySearchTracks = async (query, options = {}) => {
  try {
    const tracks = await getTracks();
    
    if (!query.trim()) {
      return tracks;
    }

    const fuse = new Fuse(tracks, {
      ...fuseOptions,
      ...options,
      keys: ['title', 'artist'],
    });

    const results = fuse.search(query);
    return results.map(result => result.item);
  } catch (error) {
    console.error('fuzzySearchTracks error:', error);
    return [];
  }
};

export const fuzzySearchAll = async (query, options = {}) => {
  try {
    const albums = await fuzzySearchAlbums(query, options);
    const tracks = await fuzzySearchTracks(query, options);
    
    return { albums, tracks };
  } catch (error) {
    console.error('fuzzySearchAll error:', error);
    return { albums: [], tracks: [] };
  }
};

export default {
  fuzzySearchAlbums,
  fuzzySearchTracks,
  fuzzySearchAll,
};