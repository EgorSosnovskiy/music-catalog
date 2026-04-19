import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from './NetworkService';
import firebaseService from './FirebaseService';

const SYNC_QUEUE_KEY = 'sync_queue';
const USER_ID = 'default-user';
const SYNC_DELAY = 2000;

let syncTimeout = null;
let isSyncing = false;

export const initializeSyncService = async () => {
  await firebaseService.initializeFirebase();
  networkService.addListener('connectionChange', handleNetworkChange);
};

const handleNetworkChange = (isConnected) => {
  if (isConnected) {
    console.log('Network connected, processing sync queue...');
    processSyncQueue();
  }
};

export const addToSyncQueue = async (operation) => {
  try {
    const queue = await getSyncQueue();
    queue.push({
      ...operation,
      timestamp: Date.now(),
    });
    await saveSyncQueue(queue);
    console.log('Added to sync queue:', operation.type);
    
    scheduleSync();
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

export const getSyncQueue = async () => {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

const saveSyncQueue = async (queue) => {
  try {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving sync queue:', error);
  }
};

const scheduleSync = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(() => {
    processSyncQueue();
  }, SYNC_DELAY);
};

export const processSyncQueue = async () => {
  if (isSyncing) {
    console.log('Already syncing, skipping...');
    return;
  }
  
  if (!networkService.getConnectionState()) {
    console.log('No network connection, skipping sync');
    return;
  }
  
  if (!firebaseService.isFirebaseReady()) {
    console.log('Firebase not ready, skipping sync');
    return;
  }
  
  const queue = await getSyncQueue();
  
  if (queue.length === 0) {
    console.log('Sync queue is empty');
    return;
  }
  
  isSyncing = true;
  console.log('Processing sync queue, items:', queue.length);
  
  const results = { success: 0, failed: 0 };
  
  for (const operation of queue) {
    try {
      switch (operation.type) {
        case 'create_album':
          await firebaseService.uploadAlbumToFirestore(USER_ID, operation.data);
          results.success++;
          break;
        case 'create_track':
          await firebaseService.uploadTrackToFirestore(USER_ID, operation.data);
          results.success++;
          break;
        case 'delete_album':
          await firebaseService.deleteAlbumFromFirestore(USER_ID, operation.data.id);
          results.success++;
          break;
        case 'delete_track':
          await firebaseService.deleteTrackFromFirestore(USER_ID, operation.data.id);
          results.success++;
          break;
        default:
          console.log('Unknown operation type:', operation.type);
      }
    } catch (error) {
      console.error('Error processing sync operation:', error);
      results.failed++;
    }
  }
  
  if (results.failed === 0) {
    await saveSyncQueue([]);
    console.log('Sync completed successfully:', results);
  } else {
    const failedOps = queue.slice(-results.failed);
    await saveSyncQueue(failedOps);
    console.log('Sync completed with errors:', results);
  }
  
  isSyncing = false;
};

export const syncAlbumAdded = (album) => {
  addToSyncQueue({
    type: 'create_album',
    data: album,
  });
};

export const syncTrackAdded = (track) => {
  addToSyncQueue({
    type: 'create_track',
    data: track,
  });
};

export const syncAlbumDeleted = (albumId) => {
  addToSyncQueue({
    type: 'delete_album',
    data: { id: albumId },
  });
};

export const syncTrackDeleted = (trackId) => {
  addToSyncQueue({
    type: 'delete_track',
    data: { id: trackId },
  });
};

export default {
  initializeSyncService,
  processSyncQueue,
  syncAlbumAdded,
  syncTrackAdded,
  syncAlbumDeleted,
  syncTrackDeleted,
};