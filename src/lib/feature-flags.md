# Feature Flag System Documentation

## Overview

The feature flag system provides a centralized way to control application features and layouts through environment variables. This enables safe deployment, A/B testing, and gradual feature rollouts.

## Environment Variables

### Layout Configuration

- **`NEXT_PUBLIC_LAYOUT`**: Controls the homepage layout
  - Values: `'magazine'` | `'classic'`
  - Default: `'classic'`
  - Effect: Immediate (no restart required)

### Development Features

- **`NEXT_PUBLIC_ENABLE_DEV_OVERLAYS`**: Controls development debug overlays
  - Values: `'0'` | `'1'` | `'false'` | `'true'`
  - Default: `'0'` (disabled)
  - Effect: Immediate (no restart required)
  - Only active in development environment

## Usage Examples

### Server Components

```typescript
import { getLayoutMode, isDevOverlaysEnabled } from '@/lib/feature-flags';

export default function MyPage() {
  const layoutMode = getLayoutMode();
  const showDebug = isDevOverlaysEnabled();
  
  if (layoutMode === 'magazine') {
    return <MagazineLayout />;
  }
  
  return <ClassicLayout />;
}
```

### Client Components

```typescript
'use client';
import { useFeatureFlags } from '@/lib/hooks/useFeatureFlags';

export default function MyComponent() {
  const { isMagazineLayout, isDevOverlaysEnabled } = useFeatureFlags();
  
  return (
    <div>
      {isMagazineLayout && <MagazineFeature />}
      {isDevOverlaysEnabled && <DebugInfo />}
    </div>
  );
}
```

### Configuration-based Approach

```typescript
import { getFeatureFlagConfig, isFeatureEnabled } from '@/lib/config/feature-flags';

const config = getFeatureFlagConfig();
const isMagazineEnabled = isFeatureEnabled('layout.enableMagazineLayout');
```

## Available Layouts

### Magazine Layout
- Modern, content-focused design
- Features: Top Header, Ticker, Hero Mosaic, Latest Rail, Categories
- Optimized for content discovery and engagement
- Enable with: `NEXT_PUBLIC_LAYOUT=magazine`

### Classic Layout
- Traditional blog-style layout
- Simple hero section with latest articles grid
- Lightweight and fast-loading
- Enable with: `NEXT_PUBLIC_LAYOUT=classic` (default)

## Development Features

### Debug Overlays
When `NEXT_PUBLIC_ENABLE_DEV_OVERLAYS=1` in development:
- Layout mode indicator in top-right corner
- Data loading error messages
- Feature flag logging to console
- Performance debugging information

### Layout Switching
- Changes take effect immediately without restart
- Safe fallback to classic layout for invalid values
- Automatic validation of environment variables

## Best Practices

### Environment Setup
```bash
# Development
NEXT_PUBLIC_LAYOUT=magazine
NEXT_PUBLIC_ENABLE_DEV_OVERLAYS=1

# Production
NEXT_PUBLIC_LAYOUT=classic
NEXT_PUBLIC_ENABLE_DEV_OVERLAYS=0
```

### Code Guidelines
1. Always use the feature flag utilities instead of direct env access
2. Provide fallbacks for all feature flags
3. Test both enabled and disabled states
4. Use TypeScript types for flag values
5. Document new feature flags in this file

### Testing
```typescript
// Mock feature flags in tests
jest.mock('@/lib/feature-flags', () => ({
  getLayoutMode: () => 'magazine',
  isDevOverlaysEnabled: () => false,
}));
```

## Deployment Strategy

### Gradual Rollout
1. Deploy with feature disabled (`NEXT_PUBLIC_LAYOUT=classic`)
2. Test in staging environment
3. Enable for percentage of users
4. Monitor metrics and performance
5. Full rollout or rollback based on results

### Emergency Rollback
If issues occur with magazine layout:
```bash
# Immediate rollback
NEXT_PUBLIC_LAYOUT=classic
```
Changes take effect immediately without code deployment.

## Future Enhancements

### Planned Features
- User-specific feature flags
- A/B testing integration
- Feature flag analytics
- Admin dashboard for flag management
- Time-based feature activation

### Additional Flags
- `NEXT_PUBLIC_ENABLE_DARK_MODE`
- `NEXT_PUBLIC_ENABLE_ANALYTICS`
- `NEXT_PUBLIC_ENABLE_COMMENTS`
- `NEXT_PUBLIC_ENABLE_NEWSLETTER`

## Troubleshooting

### Common Issues

1. **Feature flag not taking effect**
   - Check environment variable spelling
   - Verify value is correct (`'magazine'` not `'Magazine'`)
   - Clear browser cache and restart dev server

2. **Debug overlays not showing**
   - Ensure `NODE_ENV=development`
   - Set `NEXT_PUBLIC_ENABLE_DEV_OVERLAYS=1`
   - Check browser console for errors

3. **Layout switching not working**
   - Verify `NEXT_PUBLIC_LAYOUT` is set correctly
   - Check for TypeScript errors
   - Ensure components are properly imported

### Debug Commands
```bash
# Check current environment variables
npm run env:check

# Test feature flag values
npm run dev:flags

# Validate configuration
npm run validate:config
```