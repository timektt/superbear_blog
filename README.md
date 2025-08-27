# SuperBear Blog - Enterprise CMS Platform

<div align="center">
  <img src="public/og-default.svg" alt="SuperBear Blog" width="200" height="200">
  
  **🚀 Modern Tech News & Content Management System**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2d3748?logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Development](#development)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Performance](#performance)
- [Security](#security)
- [Contributing](#contributing)

## 🌟 Overview

SuperBear Blog is a comprehensive, enterprise-grade Content Management System built for modern tech news and content publishing. Designed with scalability, performance, and developer experience in mind, it provides a complete solution for content creators, editors, and administrators.

### 🎯 Target Audience
- **Tech News Publishers** - Curated content for developers and tech enthusiasts
- **Content Creators** - Rich editing experience with modern tools
- **Enterprise Teams** - Scalable CMS with advanced features
- **Developers** - Open-source platform with extensive customization

## ✨ Features

### 🎨 **Frontend Experience**
- **Modern UI/UX** - Clean, responsive design with dark/light theme support
- **TechCrunch-inspired Layout** - Professional news site aesthetics
- **Mobile-First Design** - Optimized for all device sizes
- **Progressive Web App** - Offline support with service worker
- **Accessibility** - WCAG 2.1 AA compliant with skip links

### 📝 **Content Management**
- **Rich Text Editor** - TipTap-based WYSIWYG editor with image upload
- **Media Management** - Cloudinary integration for images and assets
- **SEO Optimization** - Built-in meta tags, JSON-LD, and sitemap generation
- **Content Scheduling** - Publish articles at specific times
- **Draft System** - Save and preview before publishing
- **Tag & Category Management** - Organize content efficiently
- **Slug Generation** - SEO-friendly URL generation

### 👥 **User Management & Authentication**
- **NextAuth.js Integration** - Secure authentication system
- **Role-Based Access Control (RBAC)** - Admin, Editor, Author roles
- **Session Management** - Secure user sessions with JWT
- **Admin Dashboard** - Comprehensive management interface
- **CSRF Protection** - Cross-site request forgery prevention

### 📧 **Email & Newsletter System**
- **Newsletter Management** - Create and send newsletters
- **Email Templates** - Rich HTML email templates with Handlebars
- **Campaign System** - Advanced email marketing with scheduling
- **Subscriber Management** - GDPR-compliant user data handling
- **Email Analytics** - Track opens, clicks, and engagement
- **Automated Campaigns** - Scheduled and triggered emails
- **Suppression Lists** - Manage unsubscribes and bounces
- **Dead Letter Queue** - Handle failed email deliveries

### 🎙️ **Podcast & Media**
- **Podcast Management** - Upload and manage podcast episodes
- **Audio Player** - Built-in audio player with controls
- **Newsletter Issues** - Create newsletter issues with rich content
- **Media Library** - Centralized asset management

### 📊 **Analytics & Performance**
- **Real-time Analytics** - Track page views, user engagement
- **Performance Monitoring** - Core Web Vitals tracking
- **A/B Testing** - Built-in experimentation framework
- **SEO Analytics** - Search engine optimization metrics
- **Custom Events** - Track user interactions
- **Memory Optimization** - Advanced memory management and monitoring
- **Database Performance** - Query optimization and monitoring

### 🔧 **Developer Features**
- **TypeScript** - Full type safety throughout the application
- **API-First Design** - RESTful APIs for all functionality
- **Database Safe Mode** - Graceful fallback when DB unavailable
- **Bundle Analysis** - Optimize application size with webpack-bundle-analyzer
- **Hot Reloading** - Fast development experience
- **Comprehensive Testing** - Unit, integration, and E2E tests
- **Error Handling** - Comprehensive error boundaries and logging

### 🚀 **Performance & Scalability**
- **Redis Caching** - Multi-layer caching strategy
- **Database Optimization** - Query optimization and indexing
- **CDN Integration** - Global content delivery
- **Memory Management** - Efficient resource utilization
- **Compression** - Gzip and Brotli compression
- **Image Optimization** - Next.js Image component with Cloudinary
- **Cache Warming** - Proactive cache population
- **Circuit Breaker** - Fault tolerance patterns

### 🔒 **Security & Compliance**
- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - API abuse prevention with Redis
- **Input Validation** - Comprehensive data validation with Zod
- **GDPR Compliance** - Data privacy and user rights
- **Security Headers** - Comprehensive security headers
- **Audit Logging** - Track administrative actions
- **Template Safety** - Secure template rendering
- **Environment Validation** - Runtime environment checks

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15.4.5 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom component library with Radix UI
- **State Management**: React Context + Custom hooks
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Editor**: TipTap with extensions

### **Backend**
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.13.0
- **Caching**: Redis 7.0 with ioredis
- **Authentication**: NextAuth.js 4.24.11
- **File Storage**: Cloudinary
- **Email**: Nodemailer with SMTP

### **Infrastructure**
- **Deployment**: Vercel / Docker
- **Database Hosting**: Supabase / Railway
- **CDN**: Cloudinary / Vercel Edge Network
- **Monitoring**: Sentry 10.5.0
- **Analytics**: Custom implementation

### **Development Tools**
- **Package Manager**: npm
- **Linting**: ESLint 9 + Prettier 3.6.2
- **Testing**: Jest 30.0.5 + Playwright 1.54.2
- **Type Checking**: TypeScript 5
- **Build Tools**: Next.js + Webpack Bundle Analyzer
- **CI/CD**: GitHub Actions

## 🏗️ Architecture

### **Project Structure**
```
superbear_blog/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 (admin)/           # Admin routes group
│   │   ├── 📁 (public)/          # Public routes group
│   │   ├── � api/    t           # API routes
│   │   └── layout.tsx            # Root layout
│   ├── 📁 components/            # React components
│   │   ├── 📁 admin/             # Admin components
│   │   ├── 📁 ui/                # UI components
│   │   ├── 📁 layout/            # Layout components
│   │   └── 📁 sections/          # Page sections
│   ├── 📁 lib/                   # Utility libraries
│   │   ├── 📁 cache/             # Caching utilities
│   │   ├── � daatabase/          # Database utilities
│   │   └── �  hooks/             # Custom React hooks
│   └── 📁 types/                 # TypeScript definitions
├── 📁 prisma/                    # Database schema
├── 📁 public/                    # Static assets
├── 📁 scripts/                   # Build and utility scripts
├── 📁 docs/                      # Documentation
└── 📁 tests/                     # Test files
```

### **Database Schema**
```mermaid
erDiagram
    User ||--o{ Article : creates
    User ||--o{ Comment : writes
    Article ||--o{ Comment : has
    Article }o--|| Category : belongs_to
    Article }o--o{ Tag : has
    User ||--o{ Newsletter : subscribes
    Campaign ||--o{ Email : sends
```

### **API Architecture**
- **RESTful Design** - Standard HTTP methods and status codes
- **Route Groups** - Organized by functionality (/api/admin, /api/public)
- **Middleware** - Authentication, rate limiting, CORS
- **Error Handling** - Consistent error responses
- **Validation** - Input validation with Zod schemas

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 16+
- Redis 7.0+ (optional, for caching)
- Git

### **1. Clone Repository**
```bash
git clone https://github.com/your-username/superbear-blog.git
cd superbear-blog
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/superbear_blog"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### **4. Database Setup**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### **5. Start Development Server**
```bash
npm run dev
```

🎉 **Your application is now running at http://localhost:3000**

### **6. Access Admin Panel**
- Visit: http://localhost:3000/admin/login
- Default credentials: `admin@superbear.com` / `password123`

## 📜 Available Scripts

### **Development**
```bash
npm run dev              # Start development server
npm run dev:clean        # Clean .next and start dev server
npm run build            # Build for production
npm run build:prod       # Build with production environment
npm run build:standalone # Build standalone with DB generation
npm run start            # Start production server
npm run start:prod       # Start production with bash script
npm run start:prod:windows # Start production with PowerShell
```

### **Database**
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:migrate       # Run database migrations
npm run db:migrate:deploy # Deploy migrations (production)
npm run db:migrate:prod  # Deploy migrations + generate client
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (destructive)
npm run db:seed          # Seed database with sample data
npm run db:init          # Initialize database
```

### **Testing**
```bash
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:unit        # Run unit tests with coverage
npm run test:integration # Run integration tests
npm run test:security    # Run security tests
npm run test:performance # Run performance tests
npm run test:accessibility # Run accessibility tests
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed mode
npm run test:e2e:production # Run production E2E tests
npm run test:smoke       # Run smoke tests
npm run test:all         # Run all tests
npm run test:ci          # Run tests for CI
npm run test:podcast-newsletter # Run podcast/newsletter tests
npm run test:layout      # Test layout components
```

### **Code Quality**
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # TypeScript type checking
```

### **Analysis & Optimization**
```bash
npm run build:analyze    # Analyze bundle size
```

### **Deployment**
```bash
npm run deploy:vercel    # Deploy to Vercel
npm run deploy:check     # Pre-deployment validation
npm run deploy:validate  # Run deployment validation script
npm run deploy:docker    # Deploy with Docker Compose
npm run deploy:docker:build # Build and deploy with Docker
```

### **Health & Monitoring**
```bash
npm run health:check     # Check application health
npm run logs:prod        # View production logs
npm run monitor:metrics  # Monitor application metrics
```

### **Campaign Management**
```bash
npm run campaigns:test   # Test campaign functionality
npm run campaigns:scheduler # Run campaign scheduler
npm run campaigns:cron   # Run campaign cron job
npm run campaigns:queue  # Check campaign queue
npm run campaigns:process-queue # Process campaign queue
npm run suppressions:stats # View suppression statistics
npm run suppressions:export # Export suppression list
```

## 💻 Development

### **Development Workflow**

1. **Feature Development**
   ```bash
   git checkout -b feature/your-feature-name
   npm run dev
   # Make your changes
   npm run test
   npm run lint
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

2. **Database Changes**
   ```bash
   # Edit prisma/schema.prisma
   npm run db:migrate
   npm run db:generate
   ```

3. **Adding New Components**
   ```bash
   # Create component
   touch src/components/ui/YourComponent.tsx
   
   # Add tests
   touch src/tests/unit/components/YourComponent.test.tsx
   ```

### **Code Style Guidelines**

- **TypeScript**: Strict mode enabled, full type coverage
- **Components**: Functional components with TypeScript interfaces
- **Naming**: PascalCase for components, camelCase for functions
- **File Structure**: Group by feature, not by file type
- **Imports**: Absolute imports using `@/` alias

### **Safe Mode Development**

The application includes a "Safe Mode" for development without database:

```bash
# Enable safe mode
export SAFE_MODE=true
npm run dev
```

In Safe Mode:
- ✅ UI components work with mock data
- ✅ Theme switching and navigation functional
- ✅ No database connection required
- ✅ Perfect for frontend development

## 🧪 Testing

### **Test Structure**
```
tests/
├── unit/                 # Unit tests
│   ├── components/       # Component tests
│   ├── lib/             # Utility tests
│   └── hooks/           # Hook tests
├── integration/         # Integration tests
│   └── api/            # API endpoint tests
├── e2e/                # End-to-end tests
│   ├── admin/          # Admin workflow tests
│   └── public/         # Public site tests
├── security/           # Security tests
├── performance/        # Performance tests
├── accessibility/      # Accessibility tests
└── smoke/              # Smoke tests
```

### **Running Tests**

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Specific test file
npm run test -- ArticleForm.test.tsx

# Coverage report
npm run test:coverage

# All tests
npm run test:all
```

### **Test Examples**

```typescript
// Component test
import { render, screen } from '@testing-library/react';
import { ArticleCard } from '@/components/ui/ArticleCard';

test('renders article card with title', () => {
  const article = {
    title: 'Test Article',
    slug: 'test-article',
    excerpt: 'Test excerpt'
  };
  
  render(<ArticleCard article={article} />);
  expect(screen.getByText('Test Article')).toBeInTheDocument();
});

// API test
import { GET } from '@/app/api/articles/route';

test('GET /api/articles returns articles', async () => {
  const request = new Request('http://localhost:3000/api/articles');
  const response = await GET(request);
  const data = await response.json();
  
  expect(response.status).toBe(200);
  expect(data.articles).toBeDefined();
});
```

## 🚀 Production Deployment

### **Vercel Deployment (Recommended)**

1. **Connect Repository**
   - Import project to Vercel
   - Connect GitHub repository

2. **Environment Variables**
   ```bash
   # Add in Vercel dashboard
   DATABASE_URL=your-production-db-url
   NEXTAUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://your-domain.com
   ```

3. **Deploy**
   ```bash
   git push origin main  # Auto-deploys to Vercel
   ```

### **Docker Deployment**

```bash
# Build Docker image
docker build -t superbear-blog .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  superbear-blog
```

### **Production Checklist**

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] CDN configured
- [ ] Monitoring setup (Sentry)
- [ ] Backup strategy implemented
- [ ] Performance testing completed
- [ ] Security audit passed

## 📚 API Documentation

### **Authentication**
```typescript
// Login
POST /api/auth/signin
{
  "email": "user@example.com",
  "password": "password123"
}

// Get session
GET /api/auth/session
```

### **Articles**
```typescript
// Get articles
GET /api/articles?page=1&limit=10&category=tech

// Create article (Admin only)
POST /api/admin/articles
{
  "title": "Article Title",
  "content": "Article content...",
  "categoryId": "category-id",
  "status": "PUBLISHED"
}

// Update article
PUT /api/admin/articles/[id]

// Delete article
DELETE /api/admin/articles/[id]
```

### **Newsletter**
```typescript
// Subscribe
POST /api/newsletter/subscribe
{
  "email": "user@example.com",
  "name": "User Name"
}

// Unsubscribe
POST /api/newsletter/unsubscribe
{
  "token": "unsubscribe-token"
}
```

### **Analytics**
```typescript
// Track page view
POST /api/analytics/track
{
  "event": "page_view",
  "page": "/article/slug",
  "properties": {}
}

// Get analytics (Admin only)
GET /api/admin/analytics/dashboard
```

## ⚡ Performance

### **Performance Metrics**
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **Core Web Vitals**: All metrics in "Good" range
- **Bundle Size**: < 300KB initial load
- **Time to Interactive**: < 3 seconds
- **First Contentful Paint**: < 1.5 seconds

### **Optimization Techniques**

1. **Code Splitting**
   ```typescript
   // Dynamic imports for heavy components
   const AdminDashboard = dynamic(() => import('@/components/admin/Dashboard'));
   ```

2. **Image Optimization**
   ```typescript
   // Next.js Image component with Cloudinary
   <Image
     src={imageUrl}
     alt="Article image"
     width={800}
     height={400}
     priority={isAboveFold}
   />
   ```

3. **Caching Strategy**
   ```typescript
   // Multi-layer caching
   - Browser cache (static assets)
   - CDN cache (Vercel Edge)
   - Redis cache (API responses)
   - Database query optimization
   ```

4. **Bundle Analysis**
   ```bash
   npm run build:analyze
   # Opens bundle analyzer in browser
   ```

### **Performance Monitoring**

```typescript
// Real User Monitoring (RUM)
import { trackWebVitals } from '@/lib/analytics';

export function reportWebVitals(metric) {
  trackWebVitals(metric);
}
```

## 🔒 Security

### **Security Features**

1. **Authentication & Authorization**
   - NextAuth.js with secure session management
   - Role-based access control (RBAC)
   - JWT tokens with secure httpOnly cookies

2. **Input Validation**
   ```typescript
   // Zod schema validation
   const articleSchema = z.object({
     title: z.string().min(1).max(200),
     content: z.string().min(1),
     status: z.enum(['DRAFT', 'PUBLISHED'])
   });
   ```

3. **CSRF Protection**
   ```typescript
   // Built-in CSRF tokens
   import { csrf } from '@/lib/csrf';
   
   export async function POST(request: Request) {
     await csrf.verify(request);
     // Handle request
   }
   ```

4. **Rate Limiting**
   ```typescript
   // API rate limiting
   import { rateLimit } from '@/lib/rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   ```

5. **Security Headers**
   ```typescript
   // next.config.ts
   headers: [
     {
       source: '/(.*)',
       headers: [
         { key: 'X-Frame-Options', value: 'DENY' },
         { key: 'X-Content-Type-Options', value: 'nosniff' },
         { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
       ]
     }
   ]
   ```

### **Security Checklist**

- [x] Input validation on all forms
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS protection (React escaping + CSP)
- [x] CSRF protection on state-changing operations
- [x] Rate limiting on API endpoints
- [x] Secure authentication flow
- [x] HTTPS enforcement in production
- [x] Security headers configured
- [x] Dependency vulnerability scanning
- [x] Regular security audits

## 🤝 Contributing

### **How to Contribute**

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/superbear-blog.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

4. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

5. **Submit Pull Request**
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes

### **Development Guidelines**

- **Code Style**: Follow ESLint and Prettier configurations
- **Commits**: Use conventional commit messages
- **Testing**: Maintain test coverage above 80%
- **Documentation**: Update README and inline docs
- **Performance**: Consider performance impact of changes

### **Issue Reporting**

When reporting issues, please include:
- **Environment**: OS, Node.js version, browser
- **Steps to Reproduce**: Clear reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment platform
- **Prisma Team** - For the excellent database toolkit
- **Tailwind CSS** - For the utility-first CSS framework
- **Open Source Community** - For all the amazing libraries and tools

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/superbear-blog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/superbear-blog/discussions)
- **Email**: support@superbear.com

---

<div align="center">
  <p>Made with ❤️ by the SuperBear Team</p>
  <p>
    <a href="https://github.com/your-username/superbear-blog">⭐ Star us on GitHub</a> |
    <a href="https://twitter.com/superbear_blog">🐦 Follow on Twitter</a> |
    <a href="https://superbear.com">🌐 Visit Website</a>
  </p>
</div>