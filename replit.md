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
- **Status**: Removed per user request for simplified access
- **Current Setup**: Mock user authentication for development
- **Note**: System designed with role-based access structure but authentication disabled
- **User Roles** (for future reference):
  - Administrator (full system access)
  - Оператор заказчика
  - Оператор производства
  - Оператор логистики
  - Оператор стройки

#### Database Schema (SQLite)
- **Users Table**: Stores user profiles and role assignments with integer timestamps
- **Elements Table**: Metal construction items with unique codes, specifications, and status tracking
- **Movements Table**: Historical log of element location changes with Unix timestamps
- **Control Points Table**: Physical locations in the tracking system
- **Sessions Table**: Session storage using text for JSON data and integer timestamps

#### UI/UX Design
- **Responsive Design**: Adaptive layout from mobile (5") to desktop (24") screens
- **Industrial Theme**: Blue primary color with status-specific color coding
- **Accessibility**: Touch-friendly controls for industrial environments
- **Offline Support**: Designed for eventual offline capability with sync

## Data Flow

1. **Authentication Flow**: Disabled - direct access with mock user for development
2. **Element Tracking**: QR/barcode scanning → element lookup → status updates → movement logging
3. **Real-time Updates**: Client queries update automatically via React Query invalidation
4. **Status Management**: Elements progress through defined states (production → ready_to_ship → in_transit → in_storage → in_assembly → in_operation)

## Recent Changes

### January 18, 2025

- **Обновлены роли пользователей и интерфейс навигации**: Упрощены названия ролей и навигация
  - Оператор заказчика
  - Оператор производства
  - Оператор логистики (ранее warehouse_keeper)
  - Оператор стройки
  - Удалена роль "Аудитор" из системы
  - Убраны описания в скобках для упрощения интерфейса
  - Обновлена схема валидации и константы ролей
  - Боковое меню применено для всех ролей вместо верхней навигации
  - Удален компонент TopNavigation, все пользователи используют Sidebar

### January 18, 2025
- **Расширенный каталог продукции**: Добавлен детализированный каталог металлоконструкций
  - 19 видов продукции: балки, колонны, фермы, соединения, плиты перекрытий
  - Реальные характеристики по ГОСТ стандартам
  - Техпараметры: размеры, вес, марки стали, класс прочности
  - Категории: балки и профили, колонны, фермы и связи, соединения и крепеж, плиты перекрытий
  - Добавлено поле specifications для технических характеристик
- **База данных SQLite**: Успешная миграция и инициализация с тестовыми данными
  - Тестовые аккаунты для всех ролей операторов
  - API для продуктов, корзины и заказов полностью функционален
  - Система авторизации JWT работает корректно

### Административная панель управления каталогом (январь 18, 2025)
- **Полноценный CRUD для продуктов**: Администраторы теперь могут управлять каталогом
  - ✅ Создание товаров: полная форма с валидацией всех полей
  - ✅ Редактирование: всплывающие окна с предзаполненными данными
  - ✅ Удаление: мягкое удаление с установкой isActive = false
  - ✅ Просмотр: доступ к каталогу для всех ролей
- **Ролевая безопасность**: Функции управления доступны только администраторам
- **API endpoints**: /api/products (GET, POST, PATCH, DELETE) с авторизацией
- **Пользовательский интерфейс**: Кнопки управления отображаются только для администраторов
- **Рабочие аккаунты**: 
  - customer@example.com / operator123 (клиент - просмотр и покупки)
  - admin@example.com / admin123 (админ - полное управление)

### Адаптивное боковое меню для всех ролей (январь 18, 2025)
- **Унифицированный адаптивный дизайн**: Заменена верхняя навигация на боковое меню для всех ролей
  - ✅ Боковая панель слева с логотипом и навигацией для всех пользователей
  - ✅ Иконки для каждого раздела (Lucide React)
  - ✅ Ролевая фильтрация меню - каждая роль видит только доступные разделы
  - ✅ Информация о пользователе и роли внизу панели
  - ✅ Кнопка выхода в боковой панели
  - ✅ Переключатель темы в боковой панели
  - ✅ Адаптивная верстка: на десктопе - боковое меню, на мобильных - выдвижное меню
  - ✅ Мобильная кнопка меню с анимацией появления/скрытия
  - ✅ CSS Grid layout для точного контроля размеров
- **Ролевая адаптация**: Меню автоматически скрывает недоступные разделы для каждой роли
- **Улучшенная эргономика**: Единый интерфейс навигации оптимизированный для всех устройств

### Диагностика системы аутентификации (январь 18, 2025)
- **Статус**: Полностью решена - все роли работают корректно
- **Рабочие роли**: administrator, customer_operator, factory_operator, warehouse_keeper, site_master, auditor
- **Регистрация пользователей**: Исправлены роли в форме регистрации
- **Система ролей**: Синхронизированы схемы валидации с константами UserRoles

### January 31, 2025
- **Dark Theme Implementation**: Added complete dark/light theme support
  - Created ThemeProvider with localStorage persistence
  - Added theme toggle button in top navigation (sun/moon icons)
  - Configured dark mode CSS variables for all components
  - Theme switches between light and dark modes smoothly
- **Button Text Alignment**: Fixed critical centering issues across all components
  - Applied nuclear CSS rules to force perfect text centering
  - Removed all margin/padding conflicts that caused text shifts
  - Special fixes for logout button and all form buttons
  - Used absolute positioning and flex centering for consistent alignment

### January 30, 2025
- **Database Migration to SQLite**: Successfully migrated from PostgreSQL to SQLite for improved portability
  - Updated schema from pg-core to sqlite-core types (pgTable → sqliteTable)
  - Changed timestamp fields to integer Unix timestamps for SQLite compatibility
  - Modified decimal/numeric fields to real type for SQLite
  - Installed better-sqlite3 driver package
  - Updated storage layer for SQLite-specific SQL syntax
  - Created database initialization with sample data and admin user
- **Authentication System**: Full JWT-based authentication with bcrypt password hashing
- **User Registration**: Complete registration system with role-based access control
- **Company Logo**: CTS logo integrated into navigation header
- **Security**: All API routes protected with authentication middleware
- **User Roles**: Administrator, Factory Operator, Warehouse Keeper, Site Master, Auditor
- **Test Credentials**: admin@example.com / admin123 (SQLite database)
- **Navigation Improvements**: Logo positioned in upper left corner as independent element
- **GitHub Repository**: https://github.com/gnavasardyan/cts-solutions-ui.git (требует настройки)

## External Dependencies

### Production Dependencies
- **Database**: SQLite with better-sqlite3 driver (local file-based)
- **Authentication**: Custom JWT-based authentication with bcrypt
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
- `JWT_SECRET`: Secret key for JWT token encryption
- `DATABASE_FILE`: SQLite database file path (defaults to ./database.sqlite)
- `NODE_ENV`: Environment mode (development/production)

### Production Considerations
- **Database**: SQLite file-based storage for easy deployment and portability
- **Authentication**: JWT tokens with secure bcrypt password hashing
- **Static Assets**: Frontend assets served by Express in production
- **Error Handling**: Comprehensive error boundaries and API error responses
- **Security**: Secure JWT tokens, bcrypt password protection, input validation

### Mobile Support
- **Progressive Web App**: Configured for mobile installation
- **Touch Optimization**: Large touch targets (minimum 48px) for industrial use
- **Scanner Integration**: Camera-based QR/barcode scanning with manual fallback
- **Offline Capability**: Architecture supports future offline-first features

The application is designed as a production-ready industrial tracking system with emphasis on reliability, ease of use in manufacturing environments, and comprehensive audit trails for regulatory compliance.