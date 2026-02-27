import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeContext } from '../context/ThemeContext';
import AddEditAlbum from '../screens/AddEditAlbum';
import AddEditTrack from '../screens/AddEditTrack';
import AlbumDetails from '../screens/AlbumDetails';
import TrackDetails from '../screens/TrackDetails';
import Settings from '../screens/Settings';
import MainTabs from '../screens/MainTabs';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { theme } = useContext(ThemeContext);

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AlbumDetails"
        component={AlbumDetails}
        options={{ title: 'Детали альбома' }}
      />
      <Stack.Screen 
        name="TrackDetails" 
        component={TrackDetails} 
        options={{ title: 'Детали трека' }}
      />
      <Stack.Screen
        name="AddEditAlbum"
        component={AddEditAlbum}
      />
      <Stack.Screen
        name="AddEditTrack"
        component={AddEditTrack}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
      />
    </Stack.Navigator>
  );
}