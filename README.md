# Superbear Blog

A CMS-based tech news platform built with Next.js, focusing on delivering filtered, in-depth content for developers, AI builders, and tech entrepreneurs.

## Features

- **Admin CMS**: Secure admin interface for content management
- **Rich Text Editor**: Tiptap-powered editor with image uploads and code blocks
- **Image Management**: Cloudinary integration for optimized image delivery
- **Responsive Design**: Mobile-first design with optimized performance
- **SEO Optimized**: Built-in SEO features and social media sharing

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Cloudinary account (for image uploads)

### Environment Setup

1. Copy the environment template:
```bash
cp .env.local.template .env.local
```

2. Fill in your environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: A secure random string for JWT signing
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key  
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### Installation & Development

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
npm run db:seed
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

5. Access the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

## Image Upload & Management

This project uses Cloudinary for image storage and optimization:

### Features
- **Drag & Drop Upload**: Easy image uploading in the admin interface
- **Automatic Optimization**: Images are automatically optimized for web delivery
- **Responsive Images**: Multiple sizes generated for different screen sizes
- **Format Conversion**: Automatic format selection (WebP, AVIF) for better performance
- **Security**: File type and size validation on upload

### Configuration
Make sure to set up your Cloudinary credentials in `.env.local`:
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Usage
- Images uploaded through the admin interface are automatically stored in Cloudinary
- The system generates optimized URLs for different screen sizes
- Images are organized in folders (e.g., `articles/` for article cover images)

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Run database migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed the database with initial data
npm run db:seed

# Reset database (careful - this deletes all data!)
npm run db:reset
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
