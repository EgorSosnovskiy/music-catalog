import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { uploadImageToCloudinary, deleteImageFromCloudinary, isCloudinaryImage } from './CloudinaryService';

const firebaseConfig = {
  apiKey: "AIzaSyDPFZq2shneQP-wgbYkNvZKx353DO2TlXQ",
  authDomain: "music-catalog-d097b.firebaseapp.com",
  projectId: "music-catalog-d097b",
  storageBucket: "music-catalog-d097b.firebasestorage.app",
  messagingSenderId: "462418347697",
  appId: "1:462418347697:web:e74f2ffd4a2747d0358490"
};

let app;
let db;
let storage;
let isInitialized = false;

export const initializeFirebase = async () => {
  if (isInitialized) return true;
  
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    isInitialized = true;
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

export const isFirebaseReady = () => isInitialized;

export const uploadAlbumToFirestore = async (userId, album) => {
  if (!db) {
    console.error('Firestore not initialized');
    return null;
  }

  try {
    if (!album.id) {
      console.error('Album missing ID:', album);
      return null;
    }
    const docRef = doc(db, `users/${userId}/albums`, album.id.toString());
    await setDoc(docRef, {
      ...album,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      synced: true,
    });
    console.log('Album uploaded with ID:', album.id);
    return album.id;
  } catch (error) {
    console.error('Error uploading album to Firestore:', error);
    return null;
  }
};

export const uploadTrackToFirestore = async (userId, track) => {
  if (!db) {
    console.error('Firestore not initialized');
    return null;
  }

  try {
    if (!track.id) {
      console.error('Track missing ID:', track);
      return null;
    }
    const docRef = doc(db, `users/${userId}/tracks`, track.id.toString());
    await setDoc(docRef, {
      ...track,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      synced: true,
    });
    console.log('Track uploaded with ID:', track.id);
    return track.id;
  } catch (error) {
    console.error('Error uploading track to Firestore:', error);
    return null;
  }
};

export const getAlbumsFromFirestore = async (userId) => {
  if (!db) return [];

  try {
    const q = query(collection(db, `users/${userId}/albums`), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting albums from Firestore:', error);
    return [];
  }
};

export const getTracksFromFirestore = async (userId) => {
  if (!db) return [];

  try {
    const q = query(collection(db, `users/${userId}/tracks`), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting tracks from Firestore:', error);
    return [];
  }
};

export const deleteAlbumFromFirestore = async (userId, albumId) => {
  if (!db) return false;

  try {
    const docId = albumId?.toString();
    if (!docId) {
      console.error('Invalid album ID:', albumId);
      return false;
    }
    
    const albumDoc = await getDoc(doc(db, `users/${userId}/albums`, docId));
    if (albumDoc.exists() && albumDoc.data()?.coverUri) {
      const coverUri = albumDoc.data().coverUri;
      if (isCloudinaryImage(coverUri)) {
        await deleteImageFromCloudinary(coverUri);
      }
    }
    
    await deleteDoc(doc(db, `users/${userId}/albums`, docId));
    return true;
  } catch (error) {
    console.error('Error deleting album from Firestore:', error);
    return false;
  }
};

export const deleteTrackFromFirestore = async (userId, trackId) => {
  if (!db) return false;

  try {
    const docId = trackId?.toString();
    if (!docId) {
      console.error('Invalid track ID:', trackId);
      return false;
    }
    await deleteDoc(doc(db, `users/${userId}/tracks`, docId));
    return true;
  } catch (error) {
    console.error('Error deleting track from Firestore:', error);
    return false;
  }
};

export const uploadImageToStorage = async (userId, localUri, type = 'album') => {
  if (!storage) {
    console.error('Storage not initialized');
    return null;
  }

  try {
    const filename = `${type}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `users/${userId}/images/${filename}`);
    
    const response = await fetch(localUri);
    const blob = await response.blob();
    
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    
    console.log('Image uploaded, URL:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image to Storage:', error);
    return null;
  }
};

export const deleteImageFromStorage = async (imageUrl) => {
  if (!storage) return false;

  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image from Storage:', error);
    return false;
  }
};

export const syncAllData = async (userId, localAlbums, localTracks) => {
  if (!db) return { success: false, error: 'Firebase not initialized' };

  const results = { syncedAlbums: 0, syncedTracks: 0, deletedAlbums: 0, deletedTracks: 0, errors: [] };

  try {
    const safeAlbums = localAlbums || [];
    const safeTracks = localTracks || [];
    
    const localAlbumIds = new Set(safeAlbums.map(a => a.id?.toString()).filter(Boolean));
    const localTrackIds = new Set(safeTracks.map(t => t.id?.toString()).filter(Boolean));

    const cloudAlbums = await getAlbumsFromFirestore(userId);
    for (const album of cloudAlbums) {
      const albumId = album.id?.toString();
      if (albumId && !localAlbumIds.has(albumId)) {
        await deleteAlbumFromFirestore(userId, albumId);
        results.deletedAlbums++;
      }
    }

    const cloudTracks = await getTracksFromFirestore(userId);
    for (const track of cloudTracks) {
      const trackId = track.id?.toString();
      if (trackId && !localTrackIds.has(trackId)) {
        await deleteTrackFromFirestore(userId, trackId);
        results.deletedTracks++;
      }
    }

    for (const album of safeAlbums) {
      let albumToSync = { ...album };
      
      if (album.coverUri && !isCloudinaryImage(album.coverUri) && album.coverUri.startsWith('http')) {
        const cloudinaryUrl = await uploadImageToCloudinary(album.coverUri);
        if (cloudinaryUrl) {
          albumToSync.coverUri = cloudinaryUrl;
        }
      }
      
      const id = await uploadAlbumToFirestore(userId, albumToSync);
      if (id) results.syncedAlbums++;
      else results.errors.push(`Failed to sync album: ${album.title}`);
    }

    for (const track of safeTracks) {
      const id = await uploadTrackToFirestore(userId, track);
      if (id) results.syncedTracks++;
      else results.errors.push(`Failed to sync track: ${track.title}`);
    }

    console.log('Sync completed:', results);
    return { success: true, ...results };
  } catch (error) {
    console.error('Error syncing data:', error);
    return { success: false, error: error.message, ...results };
  }
};

export default {
  initializeFirebase,
  isFirebaseReady,
  uploadAlbumToFirestore,
  uploadTrackToFirestore,
  getAlbumsFromFirestore,
  getTracksFromFirestore,
  deleteAlbumFromFirestore,
  deleteTrackFromFirestore,
  uploadImageToStorage,
  deleteImageFromStorage,
  syncAllData,
};