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

### Twilio Integration Status
- **Status**: Deferred - User dismissed Twilio connector setup
- **Note**: Phone notification infrastructure is in place (routes `/api/call-request`, `/api/call-webhook`, `/api/call-response`)
- **To Activate**: Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` environment variables
- **Alternative**: System currently uses in-app notifications (provider dashboard + customer bookings page)

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

**Security Considerations**
- Password hashing implementation expected (currently shows placeholder "hashed_password")
- Secure session configuration for production deployment
- HTTPS enforcement expected in production environment

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