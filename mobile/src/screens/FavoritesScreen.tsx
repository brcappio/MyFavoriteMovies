import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../context/FavoritesContext';
import MovieCard from '../components/MovieCard';
import { COLORS, SPACING } from '../theme';
import { Movie } from '../types/movie';

const FavoritesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { favorites, removeFavorite } = useFavorites();

  const renderMovieItem = ({ item }: { item: Movie }) => {
    const handleFavoritePress = () => {
      removeFavorite(item);
    };

    return (
      <MovieCard
        movie={item}
        isFavorite={true}
        onFavoritePress={handleFavoritePress}
        favoriteLabel={t('remove')}
      />
    );
  };

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  listContent: {
    padding: SPACING.medium,
  },
});

export default FavoritesScreen; 