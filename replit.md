# Replit.md

## Overview
This is a full-stack web application designed as a metal construction traceability system. Its main purpose is to provide digital tracking of metal construction elements from production through storage to deployment. Key capabilities include role-based access control and real-time status updates for elements. The project aims to deliver a reliable, easy-to-use industrial tracking system with comprehensive audit trails for regulatory compliance, suitable for manufacturing environments.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)
- Customer interface redesigned: removed "Панель управления" tab for customer operators
- Added new customer dashboard with "Заказ" and "Заказы" tabs structure
- "Заказ" tab shows simple order names/titles with "Заказ" button for creating new orders  
- "Заказы" tab shows comprehensive order data table with full order details
- Customer operators now default to orders page instead of dashboard on login
- Fixed factory operator dashboard: added missing GET /api/factories/:id endpoint for factory name display
- Created customer test account: customer@customer.io / PassWord123

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in Single Page Application (SPA) mode
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui component library, using Radix UI primitives with custom styling.
- **Design System**: Industrial-themed color palette, responsive design (mobile to desktop), and touch-friendly controls.
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **Authentication**: Custom JWT-based with bcrypt password hashing (Replit Auth integration with OpenID Connect was removed).
- **Session Management**: Express sessions with PostgreSQL storage (note: currently using SQLite for session storage).
- **Database ORM**: Drizzle ORM with type-safe queries

### Key Components

#### Authentication System
- Authentication is currently a custom JWT-based system with bcrypt hashing.
- Role-based access control is integrated, with roles including Administrator, Оператор заказчика, Оператор производства, Оператор логистики, and Оператор стройки.

#### Factory Operator Dashboard
- Simplified interface showing only "Заказы завода" (Factory Orders) section
- Removed "Производство" (Production) functionality from factory operator navigation
- Factory-specific order filtering: operators see only orders assigned to their factory
- Factory name and location displayed in dashboard header for context
- Order management with workflow: Принят → В производстве → Готов к маркировке → Упакован → Отгружен
- Filtering by priority (срочность), construction type, and status (Новый/В работе)
- Marking system support: Data Matrix for products, GS-128 (SSCC) for logistics units
- Printer integration: Zebra ZT410, Honeywell PM43, Cognex
- Marking reports with electronic signatures (ФЗ №63 compliance)
- Shipment management with cargo formation and notifications

#### Database Schema (SQLite)
- Stores information for Users, Products, Cart Items, Orders, Order Items, and Factories.
- Utilizes integer timestamps for all time-related fields.

#### UI/UX Design
- Features an industrial theme with a blue primary color and status-specific color coding.
- Responsive design adapting from mobile (5") to desktop (24") screens.
- Touch-friendly controls optimized for industrial environments.
- Side menu navigation unified across all user roles, with role-based filtering for displayed sections.
- Supports dark and light themes with persistence.

### Data Flow
- **Element Tracking**: Involves QR/barcode scanning, element lookup, status updates, and movement logging.
- **Real-time Updates**: Client queries update automatically via React Query invalidation.
- **Status Management**: Elements progress through defined states (e.g., production, ready_to_ship, in_transit, in_storage, in_assembly, in_operation).

## External Dependencies

### Production Dependencies
- **Database**: SQLite with `better-sqlite3` driver (local file-based storage).
- **Authentication**: Custom JWT-based authentication with `bcrypt`.
- **UI Framework**: Radix UI component primitives.
- **State Management**: TanStack Query.
- **Form Handling**: React Hook Form with Zod validation.
- **Styling**: Tailwind CSS with PostCSS.

### Development Tools
- **TypeScript**: For full type safety.
- **Vite**: For development server and production builds.
- **Drizzle Kit**: For database migrations and schema management.
- **ESBuild**: For backend bundling.