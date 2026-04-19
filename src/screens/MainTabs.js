import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import AlbumsList from './AlbumsList';
import TracksList from './TracksList';
import Settings from './Settings';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Albums') {
            iconName = focused ? 'albums' : 'albums-outline';
          } else if (route.name === 'Tracks') {
            iconName = focused ? 'musical-notes' : 'musical-notes-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
      })}
    >
      <Tab.Screen 
        name="Albums" 
        component={AlbumsList} 
        options={{ title: t('albums') }}
      />
      <Tab.Screen 
        name="Tracks" 
        component={TracksList} 
        options={{ title: t('tracks') }}
      />
      <Tab.Screen 
        name="Settings" 
        component={Settings} 
        options={{ title: t('settings') }}
      />
    </Tab.Navigator>
  );
}