# Project Structure & Organization

## Expected Directory Structure
```
superbear_blog/
├── app/                    # Next.js 13+ app directory
│   ├── admin/             # Admin dashboard routes
│   ├── news/              # Public news article routes
│   │   └── [slug]/        # Dynamic article pages
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   ├── ui/               # Generic UI components
│   └── editor/           # Rich text editor components
├── lib/                  # Utility functions and configurations
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # NextAuth configuration
│   └── cloudinary.ts     # Image upload utilities
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migration files
├── public/               # Static assets
├── types/                # TypeScript type definitions
└── .env.local           # Environment variables
```

## Naming Conventions
- **Components**: PascalCase (e.g., `ArticleEditor.tsx`)
- **Files**: kebab-case for pages, camelCase for utilities
- **Database**: snake_case for table/column names
- **API Routes**: kebab-case following REST conventions

## Content Organization
- **Articles**: Stored in database with slug-based URLs
- **Images**: Managed through Cloudinary with optimized delivery
- **Categories/Tags**: Normalized database relationships
- **Admin Interface**: Separate component tree under `/admin`

## Key Patterns
- Server components for data fetching
- Client components for interactivity
- API routes for CRUD operations
- Middleware for authentication checks
- Custom hooks for data management

## File Responsibilities
- `app/layout.tsx`: Global layout and providers
- `app/admin/`: Protected admin routes and components
- `lib/`: Shared utilities and configurations
- `components/`: Reusable UI and business logic components

## Environment Management

All secrets and config variables are defined in `.env.local`

Required Keys:
- `DATABASE_URL` – Prisma PostgreSQL connection
- `NEXTAUTH_SECRET` – For secure JWT sessions
- `NEXTAUTH_URL` – Auth base URL
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` – For image upload

Tip:
- Use `.env.example` for sharing config without secrets


## Deployment Targets

| Service    | Purpose               |
|------------|------------------------|
| Vercel     | Frontend + Next.js SSR |
| Render     | PostgreSQL DB          |
| Cloudinary | Media Storage          |

## CI/CD Plan
- GitHub → Vercel auto-deploy on `main` push
- Run `prisma migrate deploy` during build
- Keep `DATABASE_URL` synced across envs

## Event Trigger Mapping (future automation)

| Trigger Event               | Action                         |
|----------------------------|--------------------------------|
| Push to `main`             | Vercel build & deploy          |
| Schema updated (Prisma)    | Run `prisma migrate deploy`    |
| Admin uploads image        | Upload to Cloudinary → store DB |
| Publish article            | Rebuild sitemap                |
