import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { getTrackById, deleteTrack } from '../database';

export default function TrackDetails({ route, navigation }) {
  const { id } = route.params;
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('trackDetails'),
    });
  }, [navigation, t]);

  useEffect(() => {
    loadTrack();
  }, []);

  const loadTrack = async () => {
    setLoading(true);
    const data = await getTrackById(id);
    setTrack(data);
    setLoading(false);
  };

  const handleEdit = () => {
    navigation.navigate('AddEditTrack', { track });
  };

  const handleDelete = () => {
    Alert.alert(
      t('deleteTrackTitle'),
      t('deleteTrackConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTrack(id);
            navigation.goBack();
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!track) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>{t('trackNotFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{track.title}</Text>
        <Text style={[styles.artist, { color: theme.colors.textSecondary }]}>{track.artist}</Text>

        {track.duration ? (
          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.rowText, { color: theme.colors.textSecondary }]}>
              {t('duration')}: {track.duration}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.accent }]}
          onPress={handleEdit}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.buttonText}>{t('edit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.buttonText}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artist: {
    fontSize: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowText: {
    fontSize: 16,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  editButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.45,
    justifyContent: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.45,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});