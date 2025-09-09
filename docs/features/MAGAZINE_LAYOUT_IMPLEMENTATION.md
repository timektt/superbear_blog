# Magazine Layout Implementation Guide

## Overview

The Magazine Layout is a TechCrunch-inspired homepage design that provides a modern, professional news site experience. This guide covers the implementation, configuration, and maintenance of the magazine layout system.

## Architecture

### Feature Flag System

The magazine layout is controlled by the `NEXT_PUBLIC_LAYOUT` environment variable:

```bash
# Enable magazine layout
NEXT_PUBLIC_LAYOUT=magazine

# Use classic layout (default)
NEXT_PUBLIC_LAYOUT=classic
# or omit the variable entirely
```

### Component Structure

```
Magazine Layout Components:
├── TopHeader.tsx          # Brand hero with red gradient
├── HighlightTicker.tsx    # Auto-scrolling news ticker
├── HeroMosaic.tsx         # Container for newsletter + featured
│   ├── NewsletterPanel.tsx    # Email subscription form
│   └── FeaturedArticles.tsx   # Featured article display
│       ├── FeaturedLarge.tsx      # Rank 1 article (large)
│       └── FeaturedSmall.tsx      # Rank 2+ articles (small)
├── LatestNewsRail.tsx     # Horizontal scrolling latest news
└── CategoryExploration.tsx # Category cards with counts
```

### Data Flow

```mermaid
graph TD
    A[Homepage Load] --> B[Check NEXT_PUBLIC_LAYOUT]
    B -->|magazine| C[Load Magazine Components]
    B -->|classic| D[Load Classic Layout]
    
    C --> E[Fetch API Data]
    E --> F[/api/articles/ticker]
    E --> G[/api/articles/featured]
    E --> H[/api/articles/latest]
    E --> I[/api/categories/with-count]
    
    F --> J[HighlightTicker]
    G --> K[FeaturedArticles]
    H --> L[LatestNewsRail]
    I --> M[CategoryExploration]
```

## API Endpoints

### Ticker Articles
```typescript
GET /api/articles/ticker
Response: { id: string, title: string, slug: string }[]
```

### Featured Articles
```typescript
GET /api/articles/featured
Response: Article[] // Sorted by featureRank (1, 2, 3, etc.)
```

### Latest Articles
```typescript
GET /api/articles/latest?take=12
Response: Article[] // Latest articles with full metadata
```

### Categories with Counts
```typescript
GET /api/categories/with-count
Response: { id: string, name: string, slug: string, _count: { articles: number } }[]
```

## Component Implementation

### TopHeader Component

**Purpose**: Brand hero section with call-to-action
**Location**: `src/components/sections/TopHeader.tsx`

```typescript
interface TopHeaderProps {
  title?: string
  tagline?: string
  ctaText?: string
  ctaLink?: string
}
```

**Key Features**:
- Red gradient background (`bg-gradient-to-r from-red-600 to-red-700`)
- Responsive typography (4xl md:6xl for title, xl md:2xl for tagline)
- Accessibility-compliant contrast ratios
- Mobile-optimized spacing and layout

### HighlightTicker Component

**Purpose**: Auto-scrolling news ticker for breaking news
**Location**: `src/components/sections/HighlightTicker.tsx`

```typescript
interface TickerArticle {
  id: string
  title: string
  slug: string
}
```

**Key Features**:
- Automatic horizontal scrolling with CSS animations
- Pause on hover and focus for accessibility
- Smooth transitions and performance optimization
- Fallback content when no ticker articles available

**CSS Implementation**:
```css
@keyframes scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.ticker-content {
  animation: scroll 30s linear infinite;
}

.ticker-content:hover {
  animation-play-state: paused;
}
```

### HeroMosaic Component

**Purpose**: Container for newsletter signup and featured articles
**Location**: `src/components/sections/HeroMosaic.tsx`

**Layout Structure**:
- Desktop: 40% newsletter panel, 60% featured articles
- Mobile: Stacked layout (newsletter on top, featured below)
- Responsive breakpoints at 768px (md)

### FeaturedArticles System

**Components**:
- `FeaturedArticles.tsx`: Container and layout logic
- `FeaturedLarge.tsx`: Rank 1 article (large display)
- `FeaturedSmall.tsx`: Rank 2+ articles (smaller display)

**Ranking System**:
```typescript
// Articles are sorted by featureRank field
// Rank 1: Large featured article (left side)
// Rank 2+: Small featured articles (right side, stacked)
```

**Image Specifications**:
- Aspect ratio: 16:9 with min-height constraints
- Overlay: 70% black gradient from bottom for text readability
- Optimization: next/image with priority loading for rank 1
- Fallback: Placeholder images for missing coverUrl

### LatestNewsRail Component

**Purpose**: Horizontal scrolling rail of latest articles
**Location**: `src/components/sections/LatestNewsRail.tsx`

**Features**:
- Horizontal scroll with snap behavior
- Previous/Next navigation buttons
- Keyboard accessibility (arrow keys, tab navigation)
- Touch-friendly on mobile devices

**Card Content**:
- Thumbnail image (optimized with next/image)
- Category badge with color coding
- Article title (line-clamp 2)
- Author and publication date
- Reading time estimation

### CategoryExploration Component

**Purpose**: Display categories with article counts
**Location**: `src/components/sections/CategoryExploration.tsx`

**Layout**:
- Responsive grid: 2 cols mobile, 3 tablet, 4 desktop
- Real article counts from database
- Hover effects and smooth transitions
- Navigation to category pages

## Performance Optimization

### Image Optimization

```typescript
// next/image configuration for magazine layout
const imageConfig = {
  priority: true, // For above-the-fold images
  sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality: 85,
  placeholder: "blur" as const,
  blurDataURL: "data:image/jpeg;base64,..." // Low-quality placeholder
}
```

### Caching Strategy

```typescript
// API response caching
const cacheConfig = {
  ticker: { revalidate: 300 }, // 5 minutes
  featured: { revalidate: 600 }, // 10 minutes
  latest: { revalidate: 180 }, // 3 minutes
  categories: { revalidate: 3600 } // 1 hour
}
```

### Bundle Optimization

- Dynamic imports for below-the-fold components
- Code splitting by route and feature
- Tree shaking for unused utilities
- CSS optimization with Tailwind purging

## Accessibility Implementation

### Keyboard Navigation

```typescript
// LatestNewsRail keyboard support
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowLeft':
      scrollToPrevious()
      break
    case 'ArrowRight':
      scrollToNext()
      break
    case 'Home':
      scrollToStart()
      break
    case 'End':
      scrollToEnd()
      break
  }
}
```

### Screen Reader Support

```jsx
// Proper ARIA labels and semantic HTML
<section aria-label="Latest News" role="region">
  <h2 id="latest-news-heading">Latest News</h2>
  <div 
    role="group" 
    aria-labelledby="latest-news-heading"
    aria-live="polite"
  >
    {articles.map(article => (
      <article key={article.id} aria-label={article.title}>
        {/* Article content */}
      </article>
    ))}
  </div>
</section>
```

### Color Contrast Compliance

All text meets WCAG 2.1 AA standards:
- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum
- Interactive elements: Clear focus indicators

## SEO Optimization

### Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SuperBear Blog",
  "url": "https://superbear.blog",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://superbear.blog/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Meta Tags

```jsx
// Homepage meta tags for magazine layout
<Head>
  <title>SuperBear Blog - Tech News & Insights</title>
  <meta name="description" content="Latest tech news, AI insights, and developer tools coverage" />
  <meta property="og:title" content="SuperBear Blog - Tech News & Insights" />
  <meta property="og:description" content="Latest tech news, AI insights, and developer tools coverage" />
  <meta property="og:image" content="/og-magazine-layout.jpg" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</Head>
```

## Testing Strategy

### Unit Tests

```typescript
// Component testing example
describe('FeaturedArticles', () => {
  it('displays large article for rank 1', () => {
    const articles = [
      { id: '1', featureRank: 1, title: 'Featured Article' },
      { id: '2', featureRank: 2, title: 'Secondary Article' }
    ]
    
    render(<FeaturedArticles articles={articles} />)
    
    expect(screen.getByTestId('featured-large')).toBeInTheDocument()
    expect(screen.getAllByTestId('featured-small')).toHaveLength(1)
  })
})
```

### Integration Tests

```typescript
// API integration testing
describe('Magazine Layout APIs', () => {
  it('fetches all required data for magazine layout', async () => {
    const [ticker, featured, latest, categories] = await Promise.all([
      fetch('/api/articles/ticker'),
      fetch('/api/articles/featured'),
      fetch('/api/articles/latest?take=12'),
      fetch('/api/categories/with-count')
    ])
    
    expect(ticker.ok).toBe(true)
    expect(featured.ok).toBe(true)
    expect(latest.ok).toBe(true)
    expect(categories.ok).toBe(true)
  })
})
```

### E2E Tests

```typescript
// Playwright E2E testing
test('magazine layout displays correctly', async ({ page }) => {
  await page.goto('/?layout=magazine')
  
  // Check all sections are present
  await expect(page.locator('[data-testid="top-header"]')).toBeVisible()
  await expect(page.locator('[data-testid="highlight-ticker"]')).toBeVisible()
  await expect(page.locator('[data-testid="hero-mosaic"]')).toBeVisible()
  await expect(page.locator('[data-testid="latest-news-rail"]')).toBeVisible()
  await expect(page.locator('[data-testid="category-exploration"]')).toBeVisible()
  
  // Test responsive behavior
  await page.setViewportSize({ width: 375, height: 667 }) // Mobile
  await expect(page.locator('[data-testid="hero-mosaic"]')).toHaveClass(/flex-col/)
})
```

## Troubleshooting

### Common Issues

**1. Feature Flag Not Working**
```bash
# Check environment variable
echo $NEXT_PUBLIC_LAYOUT

# Restart development server after changing
npm run dev
```

**2. API Data Not Loading**
```typescript
// Check API responses in browser dev tools
// Verify database connection and article data
// Check for CORS issues in production
```

**3. Images Not Displaying**
```typescript
// Verify next.config.ts image domains
module.exports = {
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com']
  }
}
```

**4. Performance Issues**
```bash
# Run Lighthouse audit
npm run build:analyze

# Check Core Web Vitals
# LCP should be < 2.5s
# FID should be < 100ms
# CLS should be < 0.1
```

### Debug Mode

Enable debug mode for development:

```bash
# Add to .env.local
NEXT_PUBLIC_DEBUG_LAYOUT=true
```

This enables:
- Component boundary indicators
- Performance timing logs
- API response debugging
- Accessibility warnings

## Deployment Considerations

### Environment Variables

```bash
# Production environment
NEXT_PUBLIC_LAYOUT=magazine
NEXT_PUBLIC_DEBUG_LAYOUT=false

# Staging environment
NEXT_PUBLIC_LAYOUT=magazine
NEXT_PUBLIC_DEBUG_LAYOUT=true
```

### Build Optimization

```bash
# Verify bundle size
npm run build:analyze

# Check for unused code
npm run build -- --analyze

# Optimize images
# Ensure all images use next/image component
# Configure proper sizes and quality settings
```

### Monitoring

Set up monitoring for:
- Core Web Vitals performance
- API response times
- Error rates and user experience
- Mobile vs desktop usage patterns

## Future Enhancements

### Planned Improvements

1. **Dynamic Content Personalization**
   - User behavior-based article recommendations
   - Personalized category ordering
   - A/B testing for layout variations

2. **Advanced Interactions**
   - Infinite scroll for latest news rail
   - Real-time content updates
   - Social sharing integration

3. **Performance Optimizations**
   - Service worker for offline support
   - Advanced caching strategies
   - Progressive image loading

4. **Accessibility Enhancements**
   - Voice navigation support
   - High contrast mode
   - Reduced motion preferences

---

*Last updated: January 2025*  
*For technical support: Contact development team*  
*For feature requests: Create GitHub issue with 'magazine-layout' label*