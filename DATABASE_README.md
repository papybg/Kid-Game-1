# Database Setup

## Overview

The application uses PostgreSQL with Drizzle ORM for data persistence. The database stores:

- **Portals**: Game worlds/themes
- **Game Items**: Animals, vehicles, and other game objects
- **Game Layouts**: Level configurations and backgrounds
- **User Progress**: Player achievements and scores
- **Game Settings**: User preferences

## Database Schema

The schema is defined in `shared/schema.ts` using Drizzle ORM with the following tables:

### Tables

1. **portals** - Game worlds
2. **game_items** - Game objects (animals, vehicles)
3. **game_layouts** - Level configurations
4. **user_progress** - Player progress tracking
5. **game_settings** - User preferences

## Setup Instructions

### 1. Database Connection

The app uses Neon (serverless PostgreSQL). Set the `DATABASE_URL` environment variable:

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
```

For local development, you can use a local PostgreSQL instance or Neon.

### 2. Run Migrations

After setting up the database connection:

```bash
# Generate migrations (if schema changes)
npx drizzle-kit generate

# Push migrations to database
npx drizzle-kit push
```

### 3. Environment Variables

Add to your `.env` file:
```
DATABASE_URL="your-postgresql-connection-string"
```

## Storage Implementation

The app uses a hybrid storage approach:

- **Production**: Uses PostgreSQL via Drizzle ORM (`DbStorage`)
- **Development**: Falls back to in-memory storage (`MemStorage`) if no DATABASE_URL

The storage is automatically selected based on the presence of `DATABASE_URL`.

## Default Data

When using `MemStorage` (no database), the app includes default data:
- 1 portal: "Зелена долина" (Green Valley)
- 8 game items: cats, dogs, chickens, trains, buses, crows, cows, airplanes
- 1 game layout with 6 slots
- Default game settings

## API Endpoints

The database is accessed through the following API endpoints:

- `GET /api/portals` - Get all portals
- `GET /api/game-items` - Get all game items
- `GET /api/layouts/:id` - Get specific layout

## Migration Files

Database migrations are stored in the `migrations/` directory and are automatically generated from the schema using Drizzle Kit.

## Development vs Production

- **Development**: Uses `MemStorage` for quick testing without database setup
- **Production**: Uses `DbStorage` with PostgreSQL for persistent data

To switch between modes, simply set/unset the `DATABASE_URL` environment variable.