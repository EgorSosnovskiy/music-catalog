import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  ru: {
    translation: {
      albums: 'Альбомы',
      tracks: 'Треки',
      settings: 'Настройки',
      addAlbum: 'Добавить альбом',
      addTrack: 'Добавить трек',
      editAlbum: 'Изменить альбом',
      editTrack: 'Изменить трек',
      delete: 'Удалить',
      cancel: 'Отмена',
      confirmDelete: 'Подтверждение',
      deleteConfirmation: 'Вы уверены, что хотите удалить?',
      language: 'Язык',
      theme: 'Тема',
      darkTheme: 'Тёмная тема',
      lightTheme: 'Светлая тема',
      russian: 'Русский',
      english: 'English',
      save: 'Сохранить',
      title: 'Название',
      artist: 'Исполнитель',
      year: 'Год выпуска',
      duration: 'Длительность',
      coverUrl: 'Ссылка на обложку',
      description: 'Описание',
      noAlbums: 'Нет альбомов',
      noTracks: 'Нет треков',
      addFirst: 'Нажмите +, чтобы добавить',
      error: 'Ошибка',
      fillRequired: 'Заполните обязательные поля',
      albumDetails: "Детали альбома",
      deleteAlbumTitle: "Удаление альбома",
      deleteAlbumConfirmation: "Вы уверены, что хотите удалить этот альбом?",
      albumNotFound: "Альбом не найден",
      releaseYear: "Год выпуска",
      description: "Описание",
      edit: "Изменить",
      trackDetails: "Детали трека",
      deleteTrackTitle: "Удаление трека",
      deleteTrackConfirmation: "Вы уверены, что хотите удалить этот трек?",
      trackNotFound: "Трек не найден",
      enterTitle: "Введите название альбома",
      enterArtist: "Введите имя исполнителя",
      enterYear: "например, 2024",
      enterCoverUrl: "https://example.com/cover.jpg",
      enterDescription: "Введите описание альбома",
      save: "Сохранить",
      fillRequired: "Заполните обязательные поля",
      saveFailed: "Не удалось сохранить альбом",
      enterTrackTitle: "Введите название трека",
      enterTrackArtist: "Введите имя исполнителя",
      enterTrackDuration: "например, 3:45",
      saveFailedTrack: "Не удалось сохранить трек",
    },
  },
  en: {
    translation: {
      albums: 'Albums',
      tracks: 'Tracks',
      settings: 'Settings',
      addAlbum: 'Add Album',
      addTrack: 'Add Track',
      editAlbum: 'Edit Album',
      editTrack: 'Edit Track',
      delete: 'Delete',
      cancel: 'Cancel',
      confirmDelete: 'Confirm',
      deleteConfirmation: 'Are you sure you want to delete?',
      language: 'Language',
      theme: 'Theme',
      darkTheme: 'Dark theme',
      lightTheme: 'Light theme',
      russian: 'Russian',
      english: 'English',
      save: 'Save',
      title: 'Title',
      artist: 'Artist',
      year: 'Release year',
      duration: 'Duration',
      coverUrl: 'Cover URL',
      description: 'Description',
      noAlbums: 'No albums',
      noTracks: 'No tracks',
      addFirst: 'Press + to add',
      error: 'Error',
      fillRequired: 'Please fill required fields',
      albumDetails: "Album Details",
      deleteAlbumTitle: "Delete Album",
      deleteAlbumConfirmation: "Are you sure you want to delete this album?",
      albumNotFound: "Album not found",
      releaseYear: "Release year",
      description: "Description",
      edit: "Edit",
      trackDetails: "Track Details",
      deleteTrackTitle: "Delete Track",
      deleteTrackConfirmation: "Are you sure you want to delete this track?",
      trackNotFound: "Track not found",
      enterTitle: "Enter album title",
      enterArtist: "Enter artist name",
      enterYear: "e.g., 2024",
      enterCoverUrl: "https://example.com/cover.jpg",
      enterDescription: "Enter album description",
      save: "Save",
      fillRequired: "Please fill required fields",
      saveFailed: "Failed to save album",
      enterTrackTitle: "Enter track title",
      enterTrackArtist: "Enter artist name",
      enterTrackDuration: "e.g., 3:45",
      saveFailedTrack: "Failed to save track",
    },
  },
};

// Инициализируем без указания языка, потом установим через changeLanguage
i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Функция для загрузки сохранённого языка и применения
export const loadSavedLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem('language');
    if (savedLang) {
      await i18n.changeLanguage(savedLang);
    } else {
      // Если нет сохранённого, используем системный
      const systemLang = getLocales()[0]?.languageCode ?? 'en';
      await i18n.changeLanguage(systemLang === 'ru' ? 'ru' : 'en');
    }
  } catch (error) {
    console.error('Failed to load language', error);
  }
};

export default i18n;