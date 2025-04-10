import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Movie } from '../types/movie';
import { COLORS, SPACING, FONT_SIZE } from '../theme';

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onFavoritePress: () => void;
  favoriteLabel: string;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isFavorite,
  onFavoritePress,
  favoriteLabel,
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('MovieDetails', { movieId: movie.id });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Image
        source={{
          uri: `https://image.tmdb.org/t/p/w342${movie.poster_path}`,
        }}
        style={styles.poster}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
        </Text>
        <Text style={styles.overview} numberOfLines={3}>
          {movie.overview}
        </Text>
        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={onFavoritePress}
        >
          <Text style={styles.favoriteButtonText}>{favoriteLabel}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: SPACING.medium,
    padding: SPACING.small,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 4,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.medium,
  },
  title: {
    fontSize: FONT_SIZE.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.small,
  },
  overview: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text,
    marginBottom: SPACING.small,
  },
  favoriteButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.small,
    borderRadius: 4,
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: COLORS.error,
  },
  favoriteButtonText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.small,
    fontWeight: 'bold',
  },
});

export default MovieCard; 