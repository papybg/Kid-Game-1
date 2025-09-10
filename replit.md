# Overview

This is a Bulgarian children's educational game called "Къде да ме откриеш?" (Where to Find Me?). The application is a React-based web game that helps children learn by identifying where different items belong within interactive environments. Players select items from a choice pool and place them in correct slots on themed game boards, with visual feedback and scoring systems to encourage learning.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and dark/light theme support
- **State Management**: React hooks with custom game state management via `useGameState`
- **Data Fetching**: TanStack Query for server state management and caching
- **Routing**: Single-page application with component-based screen navigation

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API server
- **Database ORM**: Drizzle ORM with PostgreSQL schema definitions
- **Development Storage**: In-memory storage implementation for rapid prototyping
- **API Design**: RESTful endpoints for portals, game items, layouts, progress, and settings
- **Static Assets**: Vite development server integration with Express for unified serving

## Game Logic Architecture
- **Game Flow**: Welcome → Portal Selection → Game Play → Win Screen progression
- **Game State**: Centralized state management for active slots, choices, scoring, and progress
- **Audio System**: Web Audio API integration with Tone.js for interactive sound effects
- **Responsive Design**: Mobile-first approach with adaptive layouts for different screen sizes

## Data Storage Solutions
- **Development**: In-memory storage with default data seeding for quick iteration
- **Production Ready**: Drizzle ORM schema configured for PostgreSQL deployment
- **Schema Design**: Normalized tables for portals, game items, layouts, user progress, and settings
- **Migration Support**: Drizzle Kit configuration for database schema management

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service via `@neondatabase/serverless`
- **Connection Pool**: PostgreSQL session management through `connect-pg-simple`

## UI and Component Libraries
- **Radix UI**: Comprehensive accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide Icons**: Modern icon library for consistent visual elements
- **Embla Carousel**: Touch-friendly carousel components for image galleries

## Audio and Media
- **Tone.js**: Web Audio API wrapper for game sound effects and music
- **Unsplash**: External image service for game assets and backgrounds

## Development Tools
- **TypeScript**: Static type checking across client, server, and shared code
- **Zod**: Runtime schema validation with Drizzle integration
- **React Hook Form**: Form state management with validation resolvers
- **Date-fns**: Date manipulation utilities for time tracking and formatting

## Build and Development
- **Vite**: Module bundler with React plugin and development server
- **ESBuild**: Fast JavaScript bundler for production server builds
- **PostCSS**: CSS processing with Autoprefixer for browser compatibility