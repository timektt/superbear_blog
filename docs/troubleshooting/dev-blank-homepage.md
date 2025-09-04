# Troubleshooting: Blank Homepage in Development

## Issue
The homepage appears blank when running `npm run dev` and visiting http://localhost:3000, even though the dev server starts successfully and returns 200 status.

## Root Cause
The `ThemeProvider` component was using a `theme-loading` CSS class that sets `visibility: hidden` on the entire page content until the component mounts on the client side. This caused the page to appear blank during the initial render.

## Solution
Removed the `theme-loading` wrapper from the unmounted state in `src/components/providers/ThemeProvider.tsx`. The component now renders content immediately while still preventing theme flash.

### Files Changed
- `src/components/providers/ThemeProvider.tsx` - Removed theme-loading wrapper
- `src/tests/smoke/homepage-render.test.ts` - Added smoke test to prevent regression
- `src/app/api/__health/route.ts` - Added health check endpoint

## Prevention
- The smoke test `homepage-render.test.ts` will catch this issue in CI
- The health check endpoint can be used for monitoring

## Alternative Troubleshooting Steps
If the issue persists, check:

1. **Browser Extensions**: Disable all extensions or use Incognito mode
2. **Port Conflicts**: Kill any processes on port 3000 with `npx kill-port 3000`
3. **Cache Issues**: Clear browser cache and disable service worker
4. **Network Tab**: Check for failed requests or infinite redirects
5. **Console Errors**: Look for JavaScript errors in browser console

## Testing the Fix
```bash
# Start dev server
npm run dev

# Visit http://localhost:3000 - should show content immediately
# Run smoke test
npm run test:e2e -- homepage-render.test.ts
```