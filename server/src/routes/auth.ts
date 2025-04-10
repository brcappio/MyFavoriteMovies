import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update profile photo
router.post('/update-photo', upload.single('photo'), async (req, res, next) => {
  try {
    console.log('Auth - Received photo upload request');
    console.log('Auth - Request headers:', req.headers);
    console.log('Auth - Request body:', req.body);
    console.log('Auth - Request file:', req.file);

    if (!req.file) {
      console.log('Auth - No file received in request');
      throw new AppError('No photo uploaded', 400);
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('Auth - No token provided');
      throw new AppError('No token provided', 401);
    }

    console.log('Auth - Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const userId = decoded.id;
    console.log('Auth - Token verified, user ID:', userId);

    const photoUrl = `${process.env.API_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
    console.log('Auth - Generated photo URL:', photoUrl);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { photoUrl },
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
      },
    });

    console.log('Auth - User updated successfully:', updatedUser);

    res.json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Auth - Error updating photo:', error);
    next(error);
  }
});

export default router; 