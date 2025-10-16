# ServiceHub - Multi-Service Marketplace Platform

## Overview

ServiceHub is a comprehensive multi-service marketplace platform that connects customers with local service providers across eight different categories: Electrician, Plumber, Beauty Parlor, Cake Shop, Grocery (GMart), Rental Properties, Street Food, and Restaurants. The platform operates on a hybrid model - offering free listings for service providers with optional paid features, while charging customers a 1-10% platform fee depending on the service category.

The application is built as a modern full-stack web application with a React-based frontend and Express.js backend, designed to facilitate service discovery, booking, and transactions in a user-friendly marketplace environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### Electrician Booking System (Added: 2025-10-16)
- **Problem Categories**: Updated with 6 device categories (AC, Refrigerator, TV, Water Heater, Washing Machine, Microwave) and 40+ specific problems
- **Search & Filter**: Electrician listing page with search bar and appliance/problem filters
- **Provider Profiles**: Detailed electrician pages showing all problems they can fix
- **Slot Booking**: Complete booking system with date/time slot selection
- **Notification System**: Provider dashboard for accepting/declining bookings, customer booking status page
- **Routes Added**: `/electrician/:id`, `/provider-dashboard`, `/my-bookings`

### Twilio SMS Notification System (Added: 2025-10-16)
- **Status**: Active - Twilio connection configured successfully
- **Implementation**: SMS notifications sent automatically when providers accept/decline bookings
- **Features**: 
  - Provider accepts booking → Customer receives SMS with confirmation and scheduled date
  - Provider declines booking → Customer receives SMS suggesting to find another provider
  - Phone number validation with country code requirement in booking form
- **Technical**: Custom `server/twilio-client.ts` utility using Replit Twilio connection
- **Fallback**: In-app notifications available on provider dashboard and customer bookings page

### Authentication System (Added: 2025-10-16)
- **Session-Based Authentication**: Implemented with Express sessions and PostgreSQL session store
- **User Management**: 
  - Login and signup flows with email/username/password
  - Bcrypt password hashing for security
  - Role-based access control (customer/provider/admin)
- **Provider Onboarding**: Two-step registration process
  - Step 1: Create user account with role selection
  - Step 2: Complete business profile (for providers only)
- **Auth Context**: React context (`useAuth` hook) provides global auth state
  - User info available throughout the app
  - Automatic redirect to login for unauthenticated users
  - Role-based UI rendering (provider dashboard, customer bookings)
- **Header Integration**: Dynamic user menu with login/signup or user dropdown
  - Dropdown shows username, role-specific links (Provider Dashboard, My Bookings)
  - Logout functionality clears session and redirects
- **Protected Routes**: All booking and dashboard features use real authenticated user IDs
  - Booking form uses `user.id` instead of mock IDs
  - Provider dashboard fetches bookings by provider profile ID
  - Customer bookings page shows user-specific bookings
- **Routes**: `/login`, `/signup`, `/provider-onboarding`

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management with configured stale-time and refetch policies

**UI Component System**
- Radix UI primitives for accessible, unstyled component foundations
- Shadcn/ui component library with "new-york" style variant
- Tailwind CSS for utility-first styling with CSS variables for theming
- Custom design system based on marketplace aesthetics (Airbnb-inspired cards, Swiggy-like service differentiation)

**State Management Strategy**
- Zustand for client-side cart state with persistence middleware
- React Query for all server-state (service providers, products, bookings)
- React Context for global authentication state (`AuthProvider` + `useAuth` hook)
- Custom hooks for geolocation (`useLocation`) and responsive design (`useIsMobile`)

**Key Design Patterns**
- Component composition using Radix Slot pattern
- Shared UI components in `/components/ui` following atomic design principles
- Service-specific pages with dedicated filtering and booking flows
- Responsive-first mobile design with conditional desktop layouts

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for API routes
- ESM module system for modern JavaScript features
- Development mode uses tsx for hot-reloading, production uses compiled bundles via esbuild

**API Design**
- RESTful endpoints organized by resource type
- Middleware for request logging with response time tracking
- JSON body parsing with raw body capture for webhook verification
- CORS and security headers configured for cross-origin requests

**Route Organization**
- Service categories: `/api/service-categories`
- Service providers: `/api/service-providers` (with location-based filtering)
- Bookings: `/api/bookings` (for electrician/plumber/beauty services)
- E-commerce: `/api/grocery-products`, `/api/grocery-orders`
- Real estate: `/api/rental-properties`
- Restaurants: `/api/table-bookings`, `/api/restaurant-menu-items`
- Street food: `/api/street-food-items`

**Business Logic Layer**
- Storage abstraction layer (`server/storage.ts`) provides interface for data operations
- Separation of concerns between route handlers and data access
- Location-based search using latitude/longitude with configurable radius

### Database Architecture

**ORM & Schema Design**
- Drizzle ORM for type-safe database queries with PostgreSQL dialect
- Schema defined in `/shared/schema.ts` for sharing between frontend and backend
- Zod schema generation for runtime validation using `drizzle-zod`

**Data Models**
- **Users**: Authentication, roles (customer/provider/admin), Stripe integration fields
- **Service Categories**: Eight main categories with slug-based routing
- **Service Providers**: Business profiles linked to users and categories, with geolocation data
- **Service Problems**: Hierarchical problem categorization for electrician/plumber services
- **Specialized Models**: Beauty services, cake products, grocery products, rental properties, restaurant menus, street food items
- **Transactional Models**: Bookings, grocery orders, table bookings, reviews

**Database Patterns**
- UUID primary keys using `gen_random_uuid()`
- Foreign key relationships with cascading constraints
- JSONB columns for flexible data (specializations, problem details)
- Timestamp tracking for created/updated records
- Decimal precision for ratings (3,2) and geolocation (10,8 for lat, 11,8 for lng)

### Authentication & Authorization

**Session Management**
- Express session with PostgreSQL store (`connect-pg-simple`)
- Session-based authentication (cookie credentials included in fetch requests)
- Role-based access control (customer, provider, admin roles)
- Session secret stored securely in environment variables

**Security Implementation**
- Bcrypt password hashing with salt rounds (10)
- Secure session configuration with httpOnly cookies
- HTTPS enforcement expected in production environment
- Auth middleware validates session on protected routes

**Auth Flow**
- `/api/auth/signup` - Creates new user with hashed password
- `/api/auth/login` - Validates credentials and creates session
- `/api/auth/logout` - Destroys session and clears cookies
- `/api/auth/me` - Returns current user info if authenticated
- `/api/provider/profile` - Returns provider profile for authenticated providers

### Payment Processing

**Stripe Integration**
- Stripe.js SDK for frontend payment elements
- Stripe React components for checkout flows
- Backend Stripe SDK for payment intent creation and webhook handling
- Customer and subscription ID tracking in user records
- Raw body parsing for webhook signature verification

**Payment Flow**
- Platform fee calculation: 1-10% based on service category
- Delivery fee for grocery orders calculated by distance (₹7/km)
- Payment confirmation with return URL handling
- Subscription support for premium provider features

### Communication Services

**Twilio Integration (Optional)**
- Call routing for connecting customers with providers
- Configured only when environment variables are present
- Used for "Request Call" functionality in electrician/plumber services

## External Dependencies

### Third-Party Services

**Payment Gateway**
- Stripe (v5.x for React, v8.x for JS SDK) - Payment processing and subscription management
- Requires: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`

**Database**
- Neon Serverless PostgreSQL with WebSocket support
- Requires: `DATABASE_URL`
- Connection pooling via `@neondatabase/serverless`

**Communication (Optional)**
- Twilio for voice call routing
- Requires: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

### Development & Build Tools

**Core Dependencies**
- React Query for data fetching and caching
- React Hook Form with Zod resolvers for form validation
- Date-fns for date manipulation
- Nanoid for unique ID generation

**Development Tools**
- Replit-specific plugins (cartographer, dev banner, runtime error overlay)
- Vite plugins for development experience
- TypeScript for type safety across the stack
- ESBuild for production bundling

### UI & Styling Libraries

**Component Libraries**
- @radix-ui/* - 20+ accessible component primitives
- cmdk - Command palette component
- embla-carousel-react - Carousel functionality
- vaul - Drawer component
- recharts - Chart components for analytics

**Styling**
- Tailwind CSS with PostCSS
- class-variance-authority for variant-based styling
- clsx and tailwind-merge for className management

### Font Loading
- Google Fonts: Inter (primary), Roboto, Outfit (headings)
- Preconnect optimization for faster font loading
- CSS font-display configuration for performance

### Asset Management
- Custom Vite alias for attached assets: `@assets`
- Image optimization expected for production deployment
- External image URLs used for mock data (Unsplash)