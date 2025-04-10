/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import PopularMoviesScreen from '@/screens/PopularMoviesScreen';
import MovieDetailsScreen from '@/screens/MovieDetailsScreen';
import FavoriteMoviesScreen from '@/screens/FavoriteMoviesScreen';
import SettingsScreen from '@/screens/SettingsScreen';

// Define the navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  MovieDetails: { movieId: number };
};

export type MainTabParamList = {
  Popular: undefined;
  Favorites: undefined;
  Settings: undefined;
};

export type MovieStackParamList = {
  Popular: undefined;
  MovieDetails: { movieId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const MovieStack = createNativeStackNavigator<MovieStackParamList>();

const MovieStackScreen: React.FC = () => (
  <MovieStack.Navigator>
    <MovieStack.Screen 
      name="Popular" 
      component={PopularMoviesScreen}
      options={{ headerShown: false }}
    />
    <MovieStack.Screen 
      name="MovieDetails" 
      component={MovieDetailsScreen}
      options={{ headerShown: false }}
    />
  </MovieStack.Navigator>
);

const MainTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
        tabBarActiveTintColor: '#f39c12',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Popular"
        component={MovieStackScreen}
        options={{
          tabBarLabel: t('navigation.movies'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="film" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoriteMoviesScreen}
        options={{
          tabBarLabel: t('navigation.favorites'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('navigation.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    // Ensure i18n is initialized with the correct language
    const initializeI18n = async () => {
      try {
        await i18nInstance.changeLanguage(i18nInstance.language);
      } catch (error) {
        console.error('Error initializing i18n:', error);
      }
    };
    initializeI18n();
  }, [i18nInstance]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <GestureHandlerRootView style={styles.container}>
            <SafeAreaProvider>
              <NavigationContainer>
                <FavoritesProvider>
                  <Navigation />
                </FavoritesProvider>
              </NavigationContainer>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </LanguageProvider>
      </I18nextProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
