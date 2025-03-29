
# SmartStockTracker - Inventory Management System

A modern inventory tracking and automated replenishment system built with React, Express, and PostgreSQL.

## Features

- Real-time inventory tracking
- Automated replenishment suggestions
- Purchase order management
- Low stock alerts
- Inventory analytics and reporting
- User authentication and authorization

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express.js + TypeScript
- Database: PostgreSQL with Drizzle ORM
- UI Components: Shadcn/ui + Tailwind CSS
- Routing: Wouter
- Form Handling: React Hook Form + Zod
- Charts: Recharts

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL database

## Environment Setup

1. Create a new project on Replit and select "Node.js" as your template
2. Import the project from GitHub or clone the repository
3. Set up your environment variables in Replit Secrets:
   - `DATABASE_URL`: Your PostgreSQL connection string

## Installation

The project uses npm for package management. Install dependencies:

```bash
npm install
```

## Database Setup

The application will automatically:
1. Create database tables using Drizzle ORM
2. Seed initial data for testing

If you need to manually push schema changes:

```bash
npm run db:push
```

## Development

To start the development server:

```bash
npm run dev
```

This will:
- Start the Vite dev server for the frontend
- Start the Express backend server
- Enable hot module replacement

The application will be available at port 5000.

## Build

To create a production build:

```bash
npm run build
```

This command:
- Builds the React frontend using Vite
- Bundles the Express backend using esbuild

## Production

To start the production server:

```bash
npm run start
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run start`: Start production server
- `npm run check`: Run TypeScript type checking
- `npm run db:push`: Push database schema changes

## Project Structure

```
├── client/            # Frontend React application
├── server/            # Backend Express application
├── shared/            # Shared types and schemas
├── scripts/          # Utility scripts
└── attached_assets/  # Project assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License
