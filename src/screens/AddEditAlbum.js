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
import { insertAlbum, updateAlbum } from '../database';

export default function AddEditAlbum() {
  const navigation = useNavigation();
  const route = useRoute();
  const album = route.params?.album;
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  // Динамический заголовок с переводом
  useLayoutEffect(() => {
    navigation.setOptions({
      title: album ? t('editAlbum') : t('addAlbum'),
    });
  }, [navigation, album, t]);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (album) {
      setTitle(album.title || '');
      setArtist(album.artist || '');
      setReleaseYear(album.releaseYear || '');
      setCoverUri(album.coverUri || '');
      setDescription(album.description || '');
    }
  }, [album]);

  const handleSave = async () => {
    if (!title.trim() || !artist.trim()) {
      Alert.alert(t('error'), t('fillRequired'));
      return;
    }

    try {
      if (album?.id) {
        await updateAlbum(
          album.id,
          title.trim(),
          artist.trim(),
          releaseYear.trim(),
          coverUri.trim(),
          description.trim()
        );
      } else {
        await insertAlbum(
          title.trim(),
          artist.trim(),
          releaseYear.trim(),
          coverUri.trim(),
          description.trim()
        );
      }
      navigation.goBack();
    } catch (error) {
      console.error('Save album error:', error);
      Alert.alert(t('error'), t('saveFailed'));
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
        placeholder={t('enterTitle')}
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
        placeholder={t('enterArtist')}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>{t('year')}</Text>
      <TextInput
        style={[styles.input, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.text 
        }]}
        value={releaseYear}
        onChangeText={setReleaseYear}
        placeholder={t('enterYear')}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="numeric"
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>{t('coverUrl')}</Text>
      <TextInput
        style={[styles.input, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.text 
        }]}
        value={coverUri}
        onChangeText={setCoverUri}
        placeholder={t('enterCoverUrl')}
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="none"
        keyboardType="url"
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>{t('description')}</Text>
      <TextInput
        style={[styles.input, styles.textArea, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.text 
        }]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('enterDescription')}
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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