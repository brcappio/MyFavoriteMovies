import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get user's favorite movies
router.get('/favorites', protect, async (req, res, next) => {
  try {
    const favorites = await prisma.userMovie.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      status: 'success',
      data: {
        favorites,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Add movie to favorites
router.post('/favorites', protect, async (req, res, next) => {
  try {
    const { movieId, title, posterPath, overview } = req.body;

    const favorite = await prisma.userMovie.create({
      data: {
        userId: req.user!.id,
        movieId,
        title,
        posterPath,
        overview,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        favorite,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      next(new AppError('Movie already in favorites', 400));
    } else {
      next(error);
    }
  }
});

// Remove movie from favorites
router.delete('/favorites/:movieId', protect, async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId);

    const favorite = await prisma.userMovie.findFirst({
      where: {
        userId: req.user!.id,
        movieId,
      },
    });

    if (!favorite) {
      throw new AppError('Movie not found in favorites', 404);
    }

    await prisma.userMovie.delete({
      where: {
        id: favorite.id,
      },
    });

    res.json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

// Get movie details
router.get('/:movieId', protect, async (req, res, next) => {
  try {
    const movieId = req.params.movieId;
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=${req.query.language || 'en-US'}`
    );

    res.json({
      status: 'success',
      data: response.data,
    });
  } catch (error) {
    next(error);
  }
});

// Check if movie is in favorites
router.get('/favorites/:movieId', protect, async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const favorite = await prisma.userMovie.findFirst({
      where: {
        userId: req.user!.id,
        movieId,
      },
    });

    res.json({
      status: 'success',
      data: {
        isFavorite: !!favorite,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 