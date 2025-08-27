# Theme & UX Fixes - QA Checklist

## Manual Testing Checklist

### ✅ Dropdown "More" Panel
- [ ] Open "More" dropdown in navigation
- [ ] Verify panel has opaque background (not transparent/blurred)
- [ ] Check text is readable in light theme
- [ ] Check text is readable in dark theme
- [ ] Verify panel appears above other content (proper z-index)
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test clicking outside to close
- [ ] Verify ARIA attributes are correct

### ✅ Home Page Theme Integration
- [ ] Load home page in light theme
- [ ] Toggle to dark theme
- [ ] Verify hero section background changes
- [ ] Verify "Latest News" section background changes
- [ ] Check that no hard-coded white/gray colors remain
- [ ] Verify all text remains readable
- [ ] Test newsletter section theme response
- [ ] Check featured topics chips theme response

### ✅ Newsletter Section Redesign
- [ ] Verify newsletter section is simplified
- [ ] Check single email input is present
- [ ] Verify CTA button is clear and accessible
- [ ] Test form submission
- [ ] Check responsive layout on mobile
- [ ] Verify accessibility with keyboard navigation
- [ ] Test with screen reader

### ✅ Featured Topics (formerly Explore by Category)
- [ ] Verify section title changed to "Featured Topics"
- [ ] Check categories display as chips/badges
- [ ] Test hover states on chips
- [ ] Verify chips are keyboard accessible
- [ ] Check responsive layout
- [ ] Test theme switching on chips

### ✅ Article Page Typography
- [ ] Open any article page
- [ ] Verify content width is constrained (max 72ch/3xl)
- [ ] Check heading typography (4xl on desktop, responsive)
- [ ] Verify meta row is compact and well-formatted
- [ ] Test line height is relaxed (leading-relaxed)
- [ ] Check images have rounded corners and borders
- [ ] Verify reading progress indicator works
- [ ] Test responsive typography on mobile
- [ ] Check theme switching affects all text

### ✅ API Safe Mode
- [ ] Test `/api/comments` with DB disconnected
- [ ] Verify returns `{ comments: [], safeMode: true }`
- [ ] Test `/api/reactions` with DB disconnected  
- [ ] Verify returns `{ count: 0, safeMode: true }`
- [ ] Test comment creation with proper enum values
- [ ] Test reaction creation with proper enum values
- [ ] Verify no Prisma errors in safe mode

## Automated Test Coverage

### Unit Tests
- [x] API safe mode behavior (`src/tests/unit/lib/api-safe-mode.test.ts`)
- [x] Enum usage validation
- [x] Error handling in safe mode

### E2E Tests  
- [x] Theme toggle on home page (`src/tests/e2e/theme-home-page.spec.ts`)
- [x] Dropdown accessibility (`src/tests/e2e/dropdown-accessibility.spec.ts`)
- [x] Article page typography (`src/tests/e2e/article-page-typography.spec.ts`)

### Accessibility Tests
- [x] Dropdown contrast and WCAG compliance
- [x] Keyboard navigation
- [x] ARIA attributes
- [x] Screen reader compatibility

## Performance Checks
- [ ] Theme switching is smooth (< 300ms)
- [ ] No layout shift during theme toggle
- [ ] Dropdown animation is smooth
- [ ] Page load times remain acceptable
- [ ] No console errors or warnings

## Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox  
- [ ] Safari (if available)
- [ ] Edge

## Mobile Testing
- [ ] Newsletter form on mobile
- [ ] Featured topics chips on mobile
- [ ] Article typography on mobile
- [ ] Dropdown behavior on mobile
- [ ] Theme toggle on mobile

## Regression Testing
- [ ] Existing functionality still works
- [ ] Admin panel unaffected
- [ ] Other pages render correctly
- [ ] Search functionality works
- [ ] Navigation remains functional

## Acceptance Criteria Verification

### Dropdown Panel ✅
- [x] Non-transparent background with proper contrast
- [x] Visible border and shadow
- [x] Text contrast ≥ 4.5:1 in both themes
- [x] Panel sits above content (z-index ≥ 50)

### Home Page Theme ✅
- [x] Theme toggle changes entire page surface
- [x] No residual light/dark fragments
- [x] Hero, cards, headlines all respond to theme

### Newsletter Block ✅
- [x] Single email input + CTA
- [x] Neutral, trustworthy copy
- [x] Fits in max-w-3xl container
- [x] Passes basic accessibility

### Featured Topics ✅
- [x] Replaced "Explore by Category" with chip-style layout
- [x] Hover states work correctly
- [x] Maintains information hierarchy

### Article Page ✅
- [x] Content column ≤ 72ch width (max-w-3xl)
- [x] leading-relaxed line height
- [x] text-base/md:text-lg body text
- [x] Header text-4xl md:text-5xl
- [x] Meta row compact with proper spacing
- [x] Images rounded-xl with border
- [x] Icons size 18-20 with stroke-[1.5] (where applicable)

### API Safe Mode ✅
- [x] Never calls Prisma in safe mode
- [x] Returns mock data with safeMode: true
- [x] Uses CommentStatus.APPROVED enum (not raw string)
- [x] No Prisma validation errors

## Sign-off
- [ ] Developer testing complete
- [ ] QA testing complete  
- [ ] Accessibility review complete
- [ ] Performance review complete
- [ ] Ready for production deployment

## Notes
- All theme tokens now use CSS custom properties
- Dropdown uses proper `bg-popover` token for better contrast
- Newsletter section simplified for better UX
- Article typography follows professional standards
- Safe mode properly handles database unavailability
- All changes are backwards compatible