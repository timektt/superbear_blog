# 🐻 SuperBear Blog

> **A Modern Tech News Platform with Advanced CMS and Newsletter System**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

SuperBear Blog is a comprehensive tech news platform featuring a modern CMS, advanced newsletter system, and production-ready email templates. Built with Next.js 15, TypeScript, and Prisma, it delivers a seamless experience for both content creators and readers.

## ✨ Features

### 🎯 **Core Platform**
- **Modern Tech News Interface** - TechCrunch-inspired design with responsive layout
- **Advanced Content Management** - Full-featured CMS with rich text editor
- **Multi-Category Support** - AI, DevTools, Open Source, Startups, and more
- **Search & Filtering** - Powerful search with category and tag filtering
- **SEO Optimized** - Built-in SEO with meta tags, sitemap, and structured data

### 📧 **Newsletter System**
- **Email Subscription Management** - Complete subscription workflow with verification
- **Advanced Email Templates** - Production-ready templates with bulletproof design
- **A/B Testing Framework** - Built-in A/B testing for conversion optimization
- **Analytics Integration** - Comprehensive event tracking and performance metrics
- **Email Client Compatibility** - Optimized for Gmail, Outlook, Apple Mail, and more

### 🛠️ **Admin Dashboard**
- **Content Management** - Create, edit, and publish articles with rich editor
- **Newsletter Management** - Subscriber management with analytics dashboard
- **Email Template Editor** - Visual editor with live preview and optimization
- **User Management** - Role-based access control with secure authentication
- **Analytics Dashboard** - Real-time statistics and performance insights

### 🔒 **Security & Performance**
- **Production-Ready Security** - CSRF protection, rate limiting, input validation
- **Email Authentication** - DKIM/SPF/DMARC ready with compliance features
- **Performance Optimized** - Image optimization, caching, and lazy loading
- **Error Monitoring** - Sentry integration with comprehensive error tracking
- **Testing Suite** - Unit, integration, and E2E tests with CI/CD pipeline

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.18.2 or higher
- **npm** 9.9.4 or higher
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/superbear-blog.git
   cd superbear-blog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Database
   DATABASE_URL="file:./prisma/dev.db"
   
   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Email Configuration (Development)
   SMTP_HOST="smtp.ethereal.email"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-ethereal-user"
   SMTP_PASSWORD="your-ethereal-password"
   SMTP_FROM="SuperBear Blog <your-email@ethereal.email>"
   
   # Optional: Sentry (Error Monitoring)
   SENTRY_DSN="your-sentry-dsn"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Admin Dashboard**: http://localhost:3000/admin
   - **API Documentation**: http://localhost:3000/api

## 📁 Project Structure

```
superbear-blog/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 (admin)/           # Admin dashboard routes
│   │   ├── 📁 (public)/          # Public-facing routes
│   │   ├── 📁 api/               # API routes
│   │   └── 📄 layout.tsx         # Root layout
│   ├── 📁 components/            # React components
│   │   ├── 📁 admin/             # Admin-specific components
│   │   ├── 📁 newsletter/        # Newsletter components
│   │   ├── 📁 sections/          # Page sections
│   │   └── 📁 ui/                # Reusable UI components
│   ├── 📁 lib/                   # Utility libraries
│   │   ├── 📄 auth.ts            # Authentication logic
│   │   ├── 📄 email-templates.ts # Email template engine
│   │   ├── 📄 newsletter.ts      # Newsletter functionality
│   │   └── 📄 prisma.ts          # Database client
│   ├── 📁 locales/               # Internationalization
│   ├── 📁 tests/                 # Test suites
│   └── 📁 types/                 # TypeScript definitions
├── 📁 prisma/                    # Database schema and migrations
├── 📁 scripts/                   # Utility scripts
├── 📁 public/                    # Static assets
└── 📄 package.json              # Dependencies and scripts
```

## 🎨 Tech Stack

### **Frontend**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Headless UI](https://headlessui.com/)** - Accessible UI components

### **Backend**
- **[Prisma](https://www.prisma.io/)** - Type-safe database ORM
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication solution
- **[Zod](https://zod.dev/)** - Schema validation
- **[Nodemailer](https://nodemailer.com/)** - Email sending

### **Database**
- **SQLite** (Development) - Lightweight local database
- **PostgreSQL** (Production) - Scalable production database

### **Email & Templates**
- **[Handlebars](https://handlebarsjs.com/)** - Template engine
- **[Juice](https://github.com/Automattic/juice)** - CSS inlining for emails
- **Ethereal Email** (Development) - Email testing service

### **Testing & Quality**
- **[Jest](https://jestjs.io/)** - Unit testing framework
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting

### **Monitoring & Analytics**
- **[Sentry](https://sentry.io/)** - Error monitoring
- **Custom Analytics** - Event tracking system
- **Performance Monitoring** - Built-in performance metrics

## 📧 Email System

### **Newsletter Features**
- ✅ **Email Subscription** - Complete workflow with verification
- ✅ **Template Management** - Visual editor with live preview
- ✅ **A/B Testing** - Built-in testing framework
- ✅ **Analytics Tracking** - Comprehensive event monitoring
- ✅ **Email Optimization** - Size monitoring and CSS inlining
- ✅ **Compliance Ready** - GDPR, CAN-SPAM compliant

### **Email Templates**
- **Weekly Tech Digest** - Professional newsletter template
- **Breaking News Alert** - Urgent news notification template
- **Welcome Email** - New subscriber onboarding template
- **Custom Templates** - Create your own with visual editor

### **Email Client Compatibility**
- ✅ Gmail (Desktop & Mobile)
- ✅ Outlook (2016+, Office 365, Web)
- ✅ Apple Mail (macOS & iOS)
- ✅ Yahoo Mail
- ✅ Thunderbird
- ✅ Mobile clients (iOS Mail, Android Gmail)

## 🛠️ Development

### **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:watch   # Run tests in watch mode

# Email Testing
node scripts/test-email.js        # Test email configuration
node scripts/debug-newsletter.js  # Debug newsletter system
```

### **Environment Setup**

#### **Development Email (Ethereal)**
```bash
# Generate test email credentials
node scripts/test-email.js
```

#### **Production Email (SendGrid/Mailgun)**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

### **Database Management**

#### **Schema Changes**
```bash
# After modifying prisma/schema.prisma
npx prisma db push
npx prisma generate
```

#### **Seeding Data**
```bash
# Seed articles and categories
npm run seed

# Seed email templates
node scripts/seed-email-templates.js
```

## 🚀 Deployment

### **Vercel (Recommended)**

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Configure Environment Variables**
   - Add all `.env` variables in Vercel dashboard
   - Set `DATABASE_URL` to your production database
   - Configure email service credentials

3. **Deploy**
   ```bash
   vercel --prod
   ```

### **Docker Deployment**

```bash
# Build and run with Docker
docker-compose -f docker-compose.production.yml up -d
```

### **Manual Deployment**

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### **Email Configuration**

#### **Development (Ethereal)**
```env
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="generated-user@ethereal.email"
SMTP_PASSWORD="generated-password"
```

#### **Production (SendGrid)**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="SG.your-api-key"
```

### **Database Configuration**

#### **Development (SQLite)**
```env
DATABASE_URL="file:./prisma/dev.db"
```

#### **Production (PostgreSQL)**
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### **Authentication Configuration**

```env
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
```

## 📊 Analytics & Monitoring

### **Built-in Analytics**
- Newsletter subscription events
- Article view tracking
- User engagement metrics
- Email campaign performance

### **Error Monitoring (Sentry)**
```env
SENTRY_DSN="https://your-sentry-dsn"
```

### **Performance Monitoring**
- API response times
- Database query performance
- Email delivery metrics
- User experience tracking

## 🧪 Testing

### **Unit Tests**
```bash
npm run test
```

### **Integration Tests**
```bash
npm run test:integration
```

### **E2E Tests**
```bash
npm run test:e2e
```

### **Email Testing**
```bash
# Test email configuration
node scripts/test-email.js

# Test newsletter API
node scripts/debug-newsletter.js
```

## 🔒 Security

### **Security Features**
- ✅ CSRF Protection
- ✅ Rate Limiting
- ✅ Input Validation & Sanitization
- ✅ SQL Injection Prevention
- ✅ XSS Protection
- ✅ Secure Headers
- ✅ Authentication & Authorization

### **Email Security**
- ✅ DKIM/SPF/DMARC Ready
- ✅ Bounce & Complaint Handling
- ✅ Unsubscribe Compliance
- ✅ Email Content Validation

## 📚 API Documentation

### **Public APIs**
- `GET /api/articles` - Get articles with pagination
- `GET /api/articles/[slug]` - Get single article
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `GET /api/newsletter/verify` - Verify email subscription

### **Admin APIs**
- `POST /api/admin/articles` - Create article
- `PUT /api/admin/articles/[id]` - Update article
- `GET /api/admin/newsletter` - Newsletter management
- `POST /api/admin/email-templates` - Create email template

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure code passes linting and type checks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For the deployment platform
- **Prisma Team** - For the excellent ORM
- **TailwindCSS** - For the utility-first CSS framework
- **Open Source Community** - For the incredible tools and libraries

## 📞 Support

- **Documentation**: [Project Wiki](https://github.com/yourusername/superbear-blog/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/superbear-blog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/superbear-blog/discussions)

---

<div align="center">
  <p><strong>Built with ❤️ by the SuperBear Team</strong></p>
  <p>
    <a href="https://github.com/yourusername/superbear-blog">⭐ Star this project</a> |
    <a href="https://github.com/yourusername/superbear-blog/issues">🐛 Report Bug</a> |
    <a href="https://github.com/yourusername/superbear-blog/issues">💡 Request Feature</a>
  </p>
</div>