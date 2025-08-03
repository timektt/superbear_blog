# Database Setup

This project uses PostgreSQL with Prisma ORM.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   - Copy `.env.local.template` to `.env.local`
   - Fill in your PostgreSQL connection string and other required variables

3. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

4. **Push Schema to Database** (for development)
   ```bash
   npm run db:push
   ```

   OR **Run Migrations** (for production)
   ```bash
   npm run db:migrate
   ```

5. **Open Prisma Studio** (optional - database GUI)
   ```bash
   npm run db:studio
   ```

## Database Schema

The schema includes the following models:

- **Article**: Main content model with title, slug, content (JSON), status, etc.
- **Author**: Article authors with name, bio, and avatar
- **Category**: Article categories (one-to-many with articles)
- **Tag**: Article tags (many-to-many with articles)
- **AdminUser**: Admin users for authentication
- **Status**: Enum for article lifecycle (DRAFT, PUBLISHED, ARCHIVED)

## Key Relationships

- Article → Author (many-to-one)
- Article → Category (many-to-one)
- Article ↔ Tag (many-to-many)

## Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:migrate` - Create and run migrations
- `npm run db:reset` - Reset database and run all migrations