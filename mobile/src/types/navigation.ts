import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';

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

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type NavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<RootStackParamList, T>;
export type ScreenRouteProp<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 