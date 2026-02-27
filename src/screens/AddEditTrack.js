import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { insertTrack, updateTrack } from '../database';

export default function AddEditTrack() {
  const navigation = useNavigation();
  const route = useRoute();
  const track = route.params?.track;
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: track ? t('editTrack') : t('addTrack'),
    });
  }, [navigation, track, t]);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (track) {
      setTitle(track.title || '');
      setArtist(track.artist || '');
      setDuration(track.duration || '');
    }
  }, [track]);

  const handleSave = async () => {
    if (!title.trim() || !artist.trim()) {
      Alert.alert(t('error'), t('fillRequired'));
      return;
    }

    try {
      if (track?.id) {
        await updateTrack(
          track.id,
          title.trim(),
          artist.trim(),
          duration.trim()
        );
      } else {
        await insertTrack(
          title.trim(),
          artist.trim(),
          duration.trim()
        );
      }
      navigation.goBack();
    } catch (error) {
      console.error('Save track error:', error);
      Alert.alert(t('error'), t('saveFailedTrack'));
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{t('title')} *</Text>
      <TextInput
        style={[styles.input, {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.text
        }]}
        value={title}
        onChangeText={setTitle}
        placeholder={t('enterTrackTitle')}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>{t('artist')} *</Text>
      <TextInput
        style={[styles.input, {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.text
        }]}
        value={artist}
        onChangeText={setArtist}
        placeholder={t('enterTrackArtist')}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>{t('duration')}</Text>
      <TextInput
        style={[styles.input, {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.text
        }]}
        value={duration}
        onChangeText={setDuration}
        placeholder={t('enterTrackDuration')}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.colors.accent }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>{t('save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});