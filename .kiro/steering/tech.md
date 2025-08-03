# Tech Stack & Development

## Core Technologies
- **Framework**: Next.js (React-based full-stack framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth for admin access
- **Image Management**: Cloudinary for uploads and optimization
- **Rich Text Editor**: Tiptap for content creation
- **Styling**: Modern CSS/component approach

## Architecture Patterns
- Server-side rendering with Next.js
- API routes for backend functionality
- Database-first approach with Prisma schema
- Component-based UI architecture
- Admin-only authentication model

## Development Workflow
- Database schema managed through Prisma migrations
- Image assets handled via Cloudinary integration
- Admin interface at `/admin` route
- Public content served at `/news/[slug]` pattern

## Key Commands
```bash
# Database operations
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes
npx prisma studio      # Open database GUI

# Development
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
```

## Performance Considerations
- Server-side rendering for SEO
- Image optimization through Cloudinary
- Database indexing for search and filtering
- Caching strategies for content delivery

## Environment Variables (.env.local)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_SECRET` | JWT signing key |
| `NEXTAUTH_URL` | Full URL to your site |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary config |
| `CLOUDINARY_API_KEY` | Cloudinary config |
| `CLOUDINARY_API_SECRET` | Cloudinary config |

## Tooling & Code Quality
- ESLint with Next.js preset
- Prettier for consistent formatting
- Husky + Lint-Staged (optional) for commit checks
- TypeScript strict mode enabled

## Deployment Targets
- Frontend Hosting: Vercel
- DB Hosting: Render PostgreSQL
- CDN: Cloudinary (media)

## CI/CD Suggestion
- GitHub → Vercel auto-deploy on push to `main`
- Use `prisma migrate deploy` during build step

### Access Model
- Admin: Full CMS control via /admin
- Guest: Read-only access via public routes
- Future-proofing: Add roles in `User.role` field (e.g., `author`, `editor`, `admin`)

### Testing Tools
- Unit Testing: Jest + Testing Library
- Integration Testing: Supertest (API)
- E2E Testing: Playwright (optional)

> Tests stored under `/tests` directory, split by scope

### Next.js Performance Optimizations
- Use `next/image` with Cloudinary loader
- Enable ISR (Incremental Static Regeneration) for articles
- Enable cache headers via middleware/headers config

### Monitoring & Logs
- Vercel Analytics (default)
- Optional: Sentry for error tracking
- Optional: Logtail / LogRocket for session recording

## Version Compatibility
- Next.js: ^13.5+
- Prisma: ^5.0+
- Node.js: >=18
- PostgreSQL: >=14
- Tiptap: ^2.x

# In package.json scripts
"lint": "next lint",
"format": "prettier --write .",
"test": "jest"
