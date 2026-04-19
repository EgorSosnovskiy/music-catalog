import React, { useState, useCallback, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import networkService from '../services/NetworkService';
import { useNetworkStatus } from '../services/NetworkService';
import { getAlbums, getTracks } from '../database';
import firebaseService from '../services/FirebaseService';

const USER_ID = 'default-user';

export default function SyncScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isConnected = useNetworkStatus();
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    initFirebase();
  }, []);

  const initFirebase = async () => {
    const result = await firebaseService.initializeFirebase();
    setFirebaseReady(result);
  };

  const handleSync = useCallback(async () => {
    if (!isConnected) {
      Alert.alert(t('error'), t('noConnection'));
      return;
    }

    if (!firebaseReady) {
      Alert.alert(t('error'), 'Firebase not initialized');
      return;
    }

    setLoading(true);
    setStatus('syncing');

    try {
      const albums = await getAlbums();
      const tracks = await getTracks();

      const result = await firebaseService.syncAllData(USER_ID, albums, tracks);
      
      if (result.success) {
        setStatus('complete');
        Alert.alert(
          t('success'), 
          `${t('syncComplete')}\nАльбомов: ${result.syncedAlbums}\nТреков: ${result.syncedTracks}`
        );
      } else {
        setStatus('failed');
        Alert.alert(t('error'), result.error || t('syncFailed'));
      }
    } catch (error) {
      setStatus('failed');
      Alert.alert(t('error'), t('syncFailed'));
    } finally {
      setLoading(false);
    }
  }, [isConnected, firebaseReady, t]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="sync" size={64} color={theme.colors.accent} />
        
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('cloudSync')}</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>{t('syncing')}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: theme.colors.accent, opacity: isConnected && firebaseReady ? 1 : 0.5 }]}
            onPress={handleSync}
            disabled={!isConnected || !firebaseReady}
          >
            <Ionicons name="sync" size={24} color="white" />
            <Text style={styles.syncButtonText}>{t('syncNow')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statusTitle, { color: theme.colors.text }]}>Статус</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons name="albums" size={20} color={theme.colors.accent} />
            <Text style={[styles.statusItemText, { color: theme.colors.text }]}>SQLite</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons 
              name={isConnected ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={isConnected ? "#4caf50" : "#ff9800"} 
            />
            <Text style={[styles.statusItemText, { color: theme.colors.text }]}>
              Cloudinary
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons 
              name={firebaseReady ? "checkmark-circle" : "cloud-offline"} 
              size={20} 
              color={firebaseReady ? "#4caf50" : "#ff9800"} 
            />
            <Text style={[styles.statusItemText, { color: theme.colors.text }]}>
              Firebase
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    borderRadius: 16,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusItemText: {
    marginTop: 4,
    fontSize: 14,
  },
});