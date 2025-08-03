# Design Document

## Overview

The CMS-based tech news platform (superbear_blog) is a Next.js application that provides a secure admin interface for content management and a public-facing website for reading tech news articles. The system focuses on delivering filtered, in-depth content for developers, AI builders, and tech entrepreneurs.

## Architecture

### High-Level Architecture
- **Frontend**: Next.js 13+ with App Router for both admin and public interfaces
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL hosted on Render
- **Authentication**: NextAuth for admin-only access
- **Media Storage**: Cloudinary for image uploads and optimization
- **Rich Text Editor**: Tiptap for content creation

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Public Site   │    │   Admin Panel   │    │   API Routes    │
│   (/news/*)     │    │   (/admin/*)    │    │   (/api/*)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │   PostgreSQL    │    │   Cloudinary    │    │   NextAuth      │
         │   (Database)    │    │   (Images)      │    │   (Auth)        │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components and Interfaces

### Database Schema (Prisma)
```prisma
model Article {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  summary     String?
  content     Json     // Tiptap JSON content
  image       String?  // Cloudinary URL
  status      Status   @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  author      Author   @relation(fields: [authorId], references: [id])
  authorId    String
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  String
  tags        Tag[]
}

model Author {
  id       String    @id @default(cuid())
  name     String
  bio      String?
  avatar   String?   // Cloudinary URL
  articles Article[]
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  articles Article[]
}

model Tag {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  articles Article[]
}

model AdminUser {
  id       String @id @default(cuid())
  email    String @unique
  name     String
  password String // Hashed
}

enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### API Endpoints
- `GET /api/articles` - Public article listing with filtering
- `GET /api/articles/[slug]` - Public article detail
- `POST /api/admin/articles` - Create article (admin only)
- `PATCH /api/admin/articles/[id]` - Update article (admin only)
- `DELETE /api/admin/articles/[id]` - Delete article (admin only)
- `POST /api/upload-image` - Image upload to Cloudinary (admin only)
- `GET /api/search` - Full-text search

### Component Structure
```
components/
├── admin/
│   ├── ArticleForm.tsx      # Create/edit article form
│   ├── ArticleTable.tsx     # Admin dashboard table
│   ├── Editor.tsx           # Tiptap rich text editor
│   └── ImageUploader.tsx    # Cloudinary upload component
├── ui/
│   ├── ArticleCard.tsx      # Article preview card
│   ├── ArticleGrid.tsx      # Grid layout for articles
│   ├── SearchBar.tsx        # Search input component
│   └── TagList.tsx          # Tag display component
└── layout/
    ├── AdminLayout.tsx      # Admin panel layout
    ├── PublicLayout.tsx     # Public site layout
    └── Navigation.tsx       # Site navigation
```

## Data Models

### Article Lifecycle
1. **Draft**: Article created but not published
2. **Published**: Article visible on public site
3. **Archived**: Article hidden but preserved

### Content Structure
- **Title**: SEO-optimized headline
- **Slug**: URL-friendly identifier
- **Summary**: Brief description for cards/SEO
- **Content**: Rich text stored as Tiptap JSON
- **Image**: Cover image from Cloudinary
- **Tags**: Many-to-many relationship for filtering
- **Category**: Single category per article
- **Author**: Article attribution

## Error Handling

### Client-Side Error Handling
- Form validation with Zod schemas
- Loading states for async operations
- User-friendly error messages
- Retry mechanisms for failed uploads

### Server-Side Error Handling
- API route error responses with proper HTTP status codes
- Database connection error handling
- Authentication/authorization checks
- Input validation and sanitization

### Error Boundaries
- React Error Boundaries for component failures
- Fallback UI for broken states
- Error logging for debugging

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- API route testing with Jest
- Database model testing
- Utility function testing

### Integration Testing
- Admin workflow testing (create/edit/delete articles)
- Authentication flow testing
- Image upload testing
- Search functionality testing

### End-to-End Testing
- Complete user journeys (admin and public)
- Cross-browser compatibility
- Mobile responsiveness
- Performance testing

## Security Considerations

### Authentication & Authorization
- NextAuth with secure session management
- Admin-only routes protected by middleware
- CSRF protection for forms
- Secure password hashing

### Data Protection
- Input sanitization and validation
- SQL injection prevention via Prisma
- XSS protection in content rendering
- Secure image upload validation

### Infrastructure Security
- Environment variable protection
- HTTPS enforcement
- Database connection security
- API rate limiting

## Performance Optimization

### Frontend Performance
- Server-side rendering for SEO
- Image optimization via Cloudinary
- Code splitting and lazy loading
- Caching strategies

### Database Performance
- Proper indexing on frequently queried fields
- Query optimization
- Connection pooling
- Database migrations

### CDN and Caching
- Cloudinary CDN for images
- Next.js static generation where possible
- Browser caching headers
- API response caching