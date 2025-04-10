# Favorite Movies Application

A full-stack mobile application for managing your favorite movies, built with React Native (Expo) for the frontend and Node.js/Express for the backend.

## Screenshots
### 1. Login Page
   ![image](https://github.com/user-attachments/assets/4578d6f8-d3f0-41ca-a7aa-d8e2a1f04009)
   
### 2. Home Page
   ![image](https://github.com/user-attachments/assets/a2d94db5-96fb-4377-bdf4-1a8a8a3c1618)
   
### 3. Movie Selection
   ![image](https://github.com/user-attachments/assets/565ef710-1b8c-4c8e-9b20-a432454a48b4)
   
### 4. Favorites Page
   ![image](https://github.com/user-attachments/assets/0809ae99-6b68-4b2c-a629-d83fc516a003)
   
### 5. Configuration Page
   ![image](https://github.com/user-attachments/assets/bb667dcd-6a9c-4e85-a79e-9819e88f5205)


## Features

- User authentication (Login/Sign-up)
- Browse popular movies from TMDb
- View detailed movie information
- Save and manage favorite movies
- Language switching (English/Portuguese)

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Expo CLI (`npm install -g expo-cli`)
- TMDb API Key (get it from [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))

## Project Structure

```
favorite-movies/
├── mobile/           # React Native (Expo) frontend
└── server/           # Node.js/Express backend
```

## Setup Instructions

### 1. Database Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE favorite_movies;
   ```

### 2. Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/favorite_movies
   JWT_SECRET=your-jwt-secret-key
   PORT=3000
   ```

4. Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the mobile directory:
   ```
   API_URL=http://localhost:3000
   TMDB_API_KEY=your-tmdb-api-key
   ```

4. Start the Expo development server:
   ```bash
   npm start
   ```

5. Use the Expo Go app on your mobile device to scan the QR code, or press 'a' to open in an Android emulator or 'i' for iOS simulator.

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

### Movies Endpoints

- `GET /api/movies/favorites` - Get user's favorite movies
- `POST /api/movies/favorites` - Add movie to favorites
  ```json
  {
    "movieId": "number",
    "title": "string",
    "posterPath": "string",
    "overview": "string"
  }
  ```
- `DELETE /api/movies/favorites/:movieId` - Remove movie from favorites

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/favorite_movies
JWT_SECRET=your-jwt-secret-key
PORT=3000
```

### Frontend (.env)
```
API_URL=http://localhost:3000
TMDB_API_KEY=your-tmdb-api-key
```

## Development

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd mobile
npm test
```

### Code Style
The project uses ESLint and Prettier for code formatting. Run the following commands to check and fix code style:

```bash
# Backend
cd server
npm run lint
npm run format

# Frontend
cd mobile
npm run lint
npm run format
```

## Troubleshooting

1. If you can't connect to the backend from the mobile app, make sure:
   - The backend server is running
   - The API_URL in the mobile .env file points to your local IP address instead of localhost
   - Your mobile device is on the same network as your development machine

2. If you get database connection errors:
   - Check if PostgreSQL is running
   - Verify your database credentials in the .env file
   - Make sure the database exists

3. For authentication issues:
   - Check if the JWT_SECRET is properly set
   - Verify that the token is being sent in the Authorization header
   - Make sure the token hasn't expired

## License

MIT 
