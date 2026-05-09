import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from './NetworkService';
import firebaseService from './FirebaseService';
import { getCurrentUserId } from './AuthService';

const SYNC_QUEUE_KEY = 'sync_queue';
const SYNC_DELAY = 2000;

let syncTimeout = null;
let isSyncing = false;
let syncStatusListeners = [];

const notifyStatusChange = (status) => {
  syncStatusListeners.forEach(listener => listener(status));
};

export const addSyncStatusListener = (listener) => {
  syncStatusListeners.push(listener);
  return () => {
    syncStatusListeners = syncStatusListeners.filter(l => l !== listener);
  };
};

export const getSyncStatus = async () => {
  const queue = await getSyncQueue();
  return {
    queueLength: queue.length,
    isSyncing,
  };
};

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

const getUserId = () => {
  const uid = getCurrentUserId();
  return uid;
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
    
    notifyStatusChange({ queueLength: queue.length + 1, isSyncing });
    
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
  
  const userId = getUserId();
  if (!userId) {
    console.log('No authenticated user, skipping sync');
    return;
  }
  
  const queue = await getSyncQueue();
  
  if (queue.length === 0) {
    notifyStatusChange({ queueLength: 0, isSyncing: false });
    return;
  }
  
  isSyncing = true;
  notifyStatusChange({ queueLength: queue.length, isSyncing: true });
  console.log('Processing sync queue, items:', queue.length);
  
  const results = { success: 0, failed: 0 };
  
  for (const operation of queue) {
    try {
      switch (operation.type) {
        case 'create_album':
          await firebaseService.uploadAlbumToFirestore(userId, operation.data);
          results.success++;
          break;
        case 'create_track':
          await firebaseService.uploadTrackToFirestore(userId, operation.data);
          results.success++;
          break;
        case 'delete_album':
          await firebaseService.deleteAlbumFromFirestore(userId, operation.data.id);
          results.success++;
          break;
        case 'delete_track':
          await firebaseService.deleteTrackFromFirestore(userId, operation.data.id);
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
    notifyStatusChange({ queueLength: 0, isSyncing: false });
  } else {
    const failedOps = queue.slice(-results.failed);
    await saveSyncQueue(failedOps);
    console.log('Sync completed with errors:', results);
    notifyStatusChange({ queueLength: results.failed, isSyncing: false });
  }
  
  isSyncing = false;
  notifyStatusChange({ queueLength: results.failed, isSyncing: false });
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
