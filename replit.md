# Replit.md

## Overview

This is a full-stack web application for metal construction traceability system built with React (TypeScript), Express.js, and PostgreSQL. The system provides digital tracking of metal construction elements from production through storage to deployment, with role-based access control and real-time status updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in Single Page Application (SPA) mode
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom styling
- **Design System**: Industrial-themed color palette suitable for manufacturing environments

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Database ORM**: Drizzle ORM with type-safe queries

### Key Components

#### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Role-based access control with 5 user roles:
  - Administrator (full system access)
  - Factory Operator (marking and production)
  - Warehouse Keeper (storage management)
  - Site Master (deployment tracking)
  - Auditor (read-only access)

#### Database Schema
- **Users Table**: Stores user profiles and role assignments
- **Elements Table**: Metal construction items with unique codes, specifications, and status tracking
- **Movements Table**: Historical log of element location changes
- **Control Points Table**: Physical locations in the tracking system
- **Sessions Table**: Persistent session storage for authentication

#### UI/UX Design
- **Responsive Design**: Adaptive layout from mobile (5") to desktop (24") screens
- **Industrial Theme**: Blue primary color with status-specific color coding
- **Accessibility**: Touch-friendly controls for industrial environments
- **Offline Support**: Designed for eventual offline capability with sync

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth → sessions stored in PostgreSQL → role-based route protection
2. **Element Tracking**: QR/barcode scanning → element lookup → status updates → movement logging
3. **Real-time Updates**: Client queries update automatically via React Query invalidation
4. **Status Management**: Elements progress through defined states (production → ready_to_ship → in_transit → in_storage → in_assembly → in_operation)

## External Dependencies

### Production Dependencies
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit Auth service
- **UI Framework**: Radix UI component primitives
- **State Management**: TanStack Query for API state
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with PostCSS

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Development server with HMR and production builds
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Backend bundling for production deployment

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `npm run db:push`

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `REPL_ID`: Replit environment identifier
- `SESSION_SECRET`: Session encryption key
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)

### Production Considerations
- **Session Persistence**: PostgreSQL-backed sessions survive server restarts
- **Database Migrations**: Schema changes managed through Drizzle migrations
- **Static Assets**: Frontend assets served by Express in production
- **Error Handling**: Comprehensive error boundaries and API error responses
- **Security**: HTTPS-only cookies, CSRF protection via session-based auth

### Mobile Support
- **Progressive Web App**: Configured for mobile installation
- **Touch Optimization**: Large touch targets (minimum 48px) for industrial use
- **Scanner Integration**: Camera-based QR/barcode scanning with manual fallback
- **Offline Capability**: Architecture supports future offline-first features

The application is designed as a production-ready industrial tracking system with emphasis on reliability, ease of use in manufacturing environments, and comprehensive audit trails for regulatory compliance.