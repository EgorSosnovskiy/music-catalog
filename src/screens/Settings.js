import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Platform, Alert, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { 
  enableNotifications, 
  loadNotificationSettings, 
  cancelAllNotifications 
} from '../services/NotificationService';
import { logoutUser } from '../services/AuthService';
import { Accelerometer } from 'expo-sensors';

const NOTIF_ENABLED_KEY = 'notifications_enabled';
const NOTIF_HOUR_KEY = 'notifications_hour';
const NOTIF_MINUTE_KEY = 'notifications_minute';
const NOTIF_REPEAT_KEY = 'notifications_repeat';

export default function Settings({ navigation }) {
  const { t, i18n } = useTranslation();
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(12);
  const [notifMinute, setNotifMinute] = useState(0);
  const [notifRepeat, setNotifRepeat] = useState('daily');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [expandHeight] = useState(new Animated.Value(0));

  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
  const [accelEnabled, setAccelEnabled] = useState(false);
  const accelSubscription = React.useRef(null);

  useEffect(() => {
    return () => {
      if (accelSubscription.current) {
        accelSubscription.current.remove();
      }
    };
  }, []);

  const toggleAccelerometer = () => {
    if (accelEnabled) {
      if (accelSubscription.current) {
        accelSubscription.current.remove();
        accelSubscription.current = null;
      }
      Accelerometer.setUpdateInterval(1000);
      setAccelEnabled(false);
    } else {
      Accelerometer.setUpdateInterval(500);
      accelSubscription.current = Accelerometer.addListener(data => {
        setAccelData(data);
      });
      setAccelEnabled(true);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
      const hour = await AsyncStorage.getItem(NOTIF_HOUR_KEY);
      const minute = await AsyncStorage.getItem(NOTIF_MINUTE_KEY);
      const repeat = await AsyncStorage.getItem(NOTIF_REPEAT_KEY);

      setNotificationsEnabled(enabled === 'true');
      setNotifHour(hour ? parseInt(hour) : 12);
      setNotifMinute(minute ? parseInt(minute) : 0);
      setNotifRepeat(repeat || 'daily');
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const changeLanguage = async (lang) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Failed to save language', error);
    }
  };

  const handleNotificationToggle = async (value) => {
    if (value) {
      const result = await enableNotifications(true, notifHour, notifMinute, notifRepeat);
      if (result.success) {
        setNotificationsEnabled(true);
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
      } else {
        Alert.alert(t('error'), 'Не удалось включить уведомления');
      }
    } else {
      await cancelAllNotifications();
      setNotificationsEnabled(false);
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
    }
  };

  const handleTimeChange = async (event, selectedDate) => {
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
      toggleTimePickerSection();
    }
    
    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      setNotifHour(hour);
      setNotifMinute(minute);
      
      await AsyncStorage.setItem(NOTIF_HOUR_KEY, hour.toString());
      await AsyncStorage.setItem(NOTIF_MINUTE_KEY, minute.toString());

      if (notificationsEnabled) {
        await enableNotifications(true, hour, minute, notifRepeat);
      }
    }
  };

  const toggleTimePickerSection = () => {
    if (showTimePicker) {
      Animated.timing(expandHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowTimePicker(false));
    } else {
      setShowTimePicker(true);
      Animated.timing(expandHeight, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleRepeatChange = async (repeatType) => {
    setNotifRepeat(repeatType);
    await AsyncStorage.setItem(NOTIF_REPEAT_KEY, repeatType);
    
    if (notificationsEnabled) {
      await enableNotifications(true, notifHour, notifMinute, repeatType);
    }
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    Alert.alert(
      t('confirmDelete') || 'Confirm',
      t('logoutConfirm') || 'Are you sure you want to logout?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('logout') || 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logoutUser();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('language')}</Text>
        <TouchableOpacity
          style={styles.option}
          onPress={() => changeLanguage('ru')}
        >
          <Text style={[styles.optionText, { color: theme.colors.text }]}>Русский</Text>
          {selectedLanguage === 'ru' && (
            <View style={[styles.check, { backgroundColor: theme.colors.accent }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={() => changeLanguage('en')}
        >
          <Text style={[styles.optionText, { color: theme.colors.text }]}>English</Text>
          {selectedLanguage === 'en' && (
            <View style={[styles.check, { backgroundColor: theme.colors.accent }]} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('theme')}</Text>
        <View style={styles.row}>
          <Text style={[styles.optionText, { color: theme.colors.text }]}>
            {isDark ? t('darkTheme') : t('lightTheme')}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.colors.accent }}
            thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('notifications')}</Text>
        
        <View style={styles.row}>
          <Text style={[styles.optionText, { color: theme.colors.text }]}>{t('enableNotifications')}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#767577', true: theme.colors.accent }}
            thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>

        {notificationsEnabled && (
          <>
            <TouchableOpacity
              style={styles.option}
              onPress={toggleTimePickerSection}
            >
              <Text style={[styles.optionText, { color: theme.colors.text }]}>{t('notificationTime')}</Text>
              <View style={styles.timeRow}>
                <Text style={[styles.optionText, { color: theme.colors.accent }]}>
                  {formatTime(notifHour, notifMinute)}
                </Text>
                <Ionicons 
                  name={showTimePicker ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.accent} 
                  style={styles.chevron}
                />
              </View>
            </TouchableOpacity>

            {showTimePicker && (
              <Animated.View style={[styles.timePickerContainer]}>
                <DateTimePicker
                  value={new Date(2024, 0, 1, notifHour, notifMinute)}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  style={styles.timePicker}
                />
              </Animated.View>
            )}

            <Text style={[styles.optionLabel, { color: theme.colors.textSecondary }]}>{t('repeat')}</Text>
            <TouchableOpacity
              style={[
                styles.repeatOption, 
                { backgroundColor: theme.colors.background },
                notifRepeat === 'daily' && styles.repeatOptionActive
              ]}
              onPress={() => handleRepeatChange('daily')}
            >
              <Text style={[styles.repeatText, { color: notifRepeat === 'daily' ? 'white' : theme.colors.text }]}>
                {t('daily')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.repeatOption, 
                { backgroundColor: theme.colors.background },
                notifRepeat === 'weekly' && styles.repeatOptionActive
              ]}
              onPress={() => handleRepeatChange('weekly')}
            >
              <Text style={[styles.repeatText, { color: notifRepeat === 'weekly' ? 'white' : theme.colors.text }]}>
                {t('weekly')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('cloudSync')}</Text>
        
        <TouchableOpacity
          style={styles.syncButton}
          onPress={() => navigation.navigate('SyncScreen')}
        >
          <Ionicons name="sync" size={20} color={theme.colors.accent} />
          <Text style={[styles.syncButtonText, { color: theme.colors.text }]}>{t('syncNow')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('accelerometer')}</Text>
        <View style={styles.row}>
          <Text style={[styles.optionText, { color: theme.colors.text }]}>{t('enableAccelerometer')}</Text>
          <Switch
            value={accelEnabled}
            onValueChange={toggleAccelerometer}
            trackColor={{ false: '#767577', true: theme.colors.accent }}
            thumbColor={'#f4f3f4'}
          />
        </View>
        {accelEnabled && (
          <View style={styles.accelContainer}>
            <Text style={[styles.accelText, { color: theme.colors.textSecondary }]}>
              X: {accelData.x.toFixed(3)}
            </Text>
            <Text style={[styles.accelText, { color: theme.colors.textSecondary }]}>
              Y: {accelData.y.toFixed(3)}
            </Text>
            <Text style={[styles.accelText, { color: theme.colors.textSecondary }]}>
              Z: {accelData.z.toFixed(3)}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface, marginTop: 20, borderColor: theme.colors.error || '#ff4444', borderWidth: 1 }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: theme.colors.error || '#ff4444' }]}>
            {t('logout') || 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 4,
  },
  timePickerContainer: {
    overflow: 'hidden',
  },
  timePicker: {
    alignSelf: 'center',
  },
  optionLabel: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repeatOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  repeatOptionActive: {
    backgroundColor: '#6200ee',
  },
  repeatText: {
    fontSize: 14,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  syncButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  logoutButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  accelContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  accelText: {
    fontSize: 16,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
