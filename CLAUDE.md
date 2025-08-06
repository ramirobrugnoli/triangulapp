# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Triangulapp is a Next.js application for managing soccer triangular tournaments. It features real-time game management, player statistics, team building, and comprehensive tournament tracking using PostgreSQL with Prisma ORM.

## Common Development Commands

### Development Server
```bash
npm run dev
```
Starts development server on localhost:3000 using custom server.js

### Database Management
```bash
npx prisma generate    # Generate Prisma client after schema changes
npx prisma db push     # Push schema changes to database
npx prisma studio      # Open database admin GUI
```

### Build and Production
```bash
npm run build         # Build application (includes Prisma generate)
npm start            # Start production server
npm run lint         # Run ESLint
```

### Testing Commands
```bash
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npm run test:coverage:watch # Run tests with coverage in watch mode
npm run test:ci             # Run tests for CI (no watch, with coverage)
npm run test:unit           # Run unit tests only
npm run test:integration    # Run integration tests only
npm run test:components     # Run component tests only
npm run test:api           # Run API tests only
npm run test:services      # Run service tests only
npm run test:stores        # Run store tests only
npm run test:hooks         # Run hook tests only
npm run test:clear-cache    # Clear Jest cache
```

## Architecture Overview

### Core State Management
- **Zustand Store (`src/store/gameStore.ts`)**: Central game state with persistent storage
  - Game timer with whistle sounds
  - Team rotations and scoring logic
  - Match history and daily scoreboard
  - Player goal tracking

### Database Schema (Prisma)
- **Player**: Core player information and cumulative stats
- **Season**: Tournament seasons with date ranges and management
- **Triangular**: Tournament records with teams and results (linked to seasons)
- **PlayerTriangular**: Player performance per tournament
- **TeamResult**: Team standings per tournament

### Key Components Structure
```
src/components/
├── game/           # Match management (timer, scoreboard, modals)
├── navigation/     # App navigation
├── players/        # Player creation and selection
├── stats/          # Statistics and charts (ApexCharts)
├── teamsbuilder/   # Team balancing and formation
└── ui/             # Reusable UI components and icons
```

### API Routes
```
src/app/api/
├── players/        # Player CRUD and statistics
├── seasons/        # Season management and filtering
├── triangular/     # Tournament management and history
└── timer/          # Real-time timer endpoints (legacy)
```

### Page Structure
```
src/app/
├── anotador/       # Game scorer interface
├── armador/        # Team builder
├── estadisticas/   # Statistics dashboard
├── graficos/       # Charts and visual statistics
├── historial/      # Match history
└── jugadores/      # Player management
```

## Development Guidelines

### State Management
- Game state persists to localStorage via Zustand
- Timer state includes interval management and whistle audio
- Match history tracks detailed game records for editing
- Season filtering state managed via Zustand with localStorage persistence

### Component Patterns
- UI components use Tailwind CSS with responsive design
- Mobile-optimized with touch-friendly interfaces
- Error boundaries and loading states throughout

### Testing Setup
- Jest with jsdom for component testing
- Comprehensive mocks for Next.js APIs, localStorage, and Web APIs
- Coverage thresholds at 50% minimum
- Separate test categories by functionality

### Database Operations
- All database operations through Prisma client
- Player statistics recalculated via dedicated API endpoint
- Tournament results stored with team positions and player goals

### Custom Server
- Uses custom Node.js server (server.js) instead of Next.js default
- Required for production deployment configuration

## Season Management System

### Overview
The application includes a comprehensive season filtering system that allows filtering all data by specific seasons or viewing all historical data.

### Key Features
- **Season Creation**: Create new seasons with custom names and date ranges
- **Automatic Season Assignment**: New triangulars are automatically assigned to the active season
- **Season Filtering**: Filter statistics, history, and player data by season
- **Admin Management**: Move triangulars between seasons and manage season lifecycle

### Season Structure
- Each season has a name, start date (`initSeasonDate`), and optional end date (`finishSeasonDate`)
- Active season: Has no `finishSeasonDate` (null value)
- When a new season is created, the previous active season is automatically closed
- All existing triangulars are assigned to "Season 1" by default during migration

### Season Filtering Implementation
- **API Level**: All endpoints accept `seasonId` and `allSeasons` query parameters
- **Store Level**: Season state managed via `useSeasonStore` with persistence
- **Component Level**: `SeasonSelector` component provides consistent filtering UI
- **Statistics**: Player and triangular statistics can be filtered by season
- **History**: Triangular history supports season-based filtering

### Available Season Endpoints
- `GET /api/seasons` - Get all seasons with triangular counts
- `POST /api/seasons` - Create new season (closes previous active season)
- `PUT /api/seasons/[id]/triangulars/[triangularId]` - Move triangular to season

### Season Selector Usage
The `SeasonSelector` component can be used across the application:
```jsx
import { SeasonSelector } from "@/components/season/SeasonSelector";

<SeasonSelector 
  onSeasonChange={(seasonId, allSeasons) => {
    // Handle season change
  }} 
  className="max-w-md" 
/>
```

### Database Migration
- Added `Season` model with foreign key relationship to `Triangular`
- Migration safely handles existing data by creating "Season 1" and assigning all triangulars
- Maintains data integrity with proper indexing on `seasonId`

## Key Technical Details

### Scoring System
- **Normal Wins**: Worth 2 points (historical system)
- **Victory Points**: Championship wins worth 3 points (new system from recent update)
- **Draws**: Worth 1 point each
- Separate tracking for `wins` (total wins) vs `normalWins` (non-championship wins)

### Database Seeding
```bash
npx prisma db seed    # Seed database with initial data using prisma/seed.ts
```

### Production Deployment
- Uses custom Node.js server (`server.js`) instead of Next.js standalone
- Environment variable `NODE_ENV=production` triggers production mode
- PostgreSQL database connection via `DATABASE_URL` environment variable