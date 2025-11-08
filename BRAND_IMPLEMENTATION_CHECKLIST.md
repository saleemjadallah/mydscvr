# HeadShotHub Brand Guidelines Implementation Checklist

## IMMEDIATE ACTION ITEMS

### 1. Update Color Configuration (HIGHEST PRIORITY)
**Files:** 
- [ ] `/frontend/tailwind.config.ts` - Update secondary color palette
- [ ] `/frontend/src/index.css` - Update CSS variables

**Changes:**
```
CURRENT (Indigo):     #4F46E5
BRAND GUIDELINE:      #8B5CF6 (Vivid Violet)

Shade Mapping:
50:   #F3E8FF → Update
100:  #E9D5FF → Update
200:  #D8B4FE → Update
300:  #C084FC → Update
400:  #A855F7 → Update
500:  #8B5CF6 → Update (currently #4F46E5)
600:  #7C3AED → Update
700:  #6D28D9 → Update
800:  #5B21B6 → Update
900:  #4C1D95 → Update
```

---

## PAGES TO IMPLEMENT

### Phase 1: Authentication Flow (Days 1-2)
Priority: HIGH - Blocks user acquisition

#### [ ] LoginPage.tsx (60 minutes)
- [ ] Email input field
- [ ] Password input field
- [ ] "Remember me" checkbox
- [ ] "Forgot password" link
- [ ] Primary button: "Sign In"
- [ ] Link to register page
- [ ] Error message display
- [ ] Loading state

#### [ ] RegisterPage.tsx (60 minutes)
- [ ] Name input field
- [ ] Email input field
- [ ] Password input field
- [ ] Confirm password input
- [ ] Terms & privacy checkbox
- [ ] Primary button: "Create Account"
- [ ] Link to login page
- [ ] Error message display
- [ ] Loading state

### Phase 2: Upload & Processing Flow (Days 2-3)
Priority: HIGH - Core user workflow

#### [ ] UploadPage.tsx (90 minutes)
- [ ] Drag-and-drop file upload zone
- [ ] File browser button
- [ ] Uploaded photos preview
- [ ] Photo count display
- [ ] Plan selection cards (Basic/Pro/Executive)
- [ ] Template selection (8 templates)
- [ ] Background options
- [ ] Outfit options
- [ ] "Continue to Payment" button
- [ ] Progress indicator

#### [ ] ProcessingPage.tsx (45 minutes)
- [ ] Processing spinner animation
- [ ] Status text ("Generating your headshots...")
- [ ] Estimated time remaining
- [ ] Progress bar (if available from backend)
- [ ] "Check back in XX minutes" message
- [ ] Email notification message

#### [ ] BatchViewPage.tsx (120 minutes)
- [ ] Headshot gallery grid (3-4 columns)
- [ ] Template filter tabs/buttons
- [ ] Before/after comparison slider
- [ ] Download buttons (per image)
- [ ] Download all button
- [ ] Share/copy link buttons
- [ ] Image details (template, background, outfit)
- [ ] Regenerate/edit buttons
- [ ] Mobile-responsive gallery

### Phase 3: User Dashboard (Days 3-4)
Priority: MEDIUM - User retention

#### [ ] DashboardPage.tsx (90 minutes)
- [ ] Welcome message with user name
- [ ] Batch history grid/list
- [ ] Batch cards showing:
  - [ ] Thumbnail/preview image
  - [ ] Number of headshots
  - [ ] Creation date
  - [ ] Status badge (processing, completed, failed)
  - [ ] Action buttons (view, download, delete)
- [ ] Sort options (newest, oldest, most popular)
- [ ] Search/filter by date range
- [ ] Pagination or infinite scroll
- [ ] "Create New Headshots" CTA button
- [ ] Usage stats (uploads used, headshots created)

### Phase 4: Pricing & Features (Days 4-5)
Priority: MEDIUM - Revenue-critical

#### [ ] PricingPage.tsx (120 minutes)
- [ ] Page header with value proposition
- [ ] Annual/Monthly toggle switch
- [ ] Three pricing cards:
  - [ ] Basic Plan
  - [ ] Professional Plan
  - [ ] Executive Plan (with "Most Popular" badge)
- [ ] Features comparison table:
  - [ ] Number of headshots
  - [ ] Background options
  - [ ] Outfit options
  - [ ] Edit credits
  - [ ] Turnaround time
  - [ ] Commercial rights
- [ ] Each card includes:
  - [ ] Plan name & price
  - [ ] Feature checklist
  - [ ] Primary "Choose Plan" button
  - [ ] Hover effects
- [ ] FAQ section (accordion)
- [ ] Final CTA section
- [ ] Mobile-responsive layout

---

## COMPONENT LIBRARY TO CREATE

### Create: `/frontend/src/components/ui/`

#### [ ] Button.tsx (45 minutes)
Variants needed:
- [ ] Primary (blue gradient)
- [ ] Secondary (violet gradient)
- [ ] Outline (border with hover fill)
- [ ] Success (green)
- [ ] Destructive (red)
- [ ] Ghost (text only)
- [ ] Loading state
- [ ] Disabled state
- [ ] Sizes: sm, md, lg
- [ ] Full width option

#### [ ] Card.tsx (30 minutes)
- [ ] Default card with shadow
- [ ] Hover effect (lift + shadow)
- [ ] Pricing card variant (gradient border)
- [ ] Disabled/inactive state

#### [ ] Input.tsx (45 minutes)
- [ ] Text input with label
- [ ] Email input
- [ ] Password input
- [ ] Error state (red border + message)
- [ ] Success state (green border)
- [ ] Focus state (blue ring)
- [ ] Placeholder text
- [ ] Icon support (left/right)

#### [ ] Badge.tsx (30 minutes)
- [ ] Popular badge (violet gradient, "Most Popular")
- [ ] Status badges:
  - [ ] Processing (amber background)
  - [ ] Completed (green background)
  - [ ] Failed (red background)
- [ ] AI badge (blue-violet gradient)
- [ ] Success badge (green)

#### [ ] Modal.tsx (30 minutes)
- [ ] Overlay with backdrop blur
- [ ] Close button (X icon)
- [ ] Header, body, footer sections
- [ ] Smooth fade-in animation

#### [ ] FormField.tsx (30 minutes)
- [ ] Label with optional indicator
- [ ] Input wrapper
- [ ] Error message display
- [ ] Helper text support
- [ ] Required field marker

#### [ ] Skeleton.tsx (20 minutes)
- [ ] Loading skeleton with pulse animation
- [ ] Various shapes (rect, circle)
- [ ] Configurable width/height

#### [ ] Toast/Notification.tsx (30 minutes)
- [ ] Success toast (green)
- [ ] Error toast (red)
- [ ] Info toast (blue)
- [ ] Warning toast (amber)
- [ ] Auto-dismiss option
- [ ] Close button

#### [ ] Tabs.tsx (30 minutes)
- [ ] Tab list with active indicator
- [ ] Tab content panels
- [ ] Keyboard navigation
- [ ] Smooth transitions

#### [ ] Accordion.tsx (30 minutes)
- [ ] Expandable sections
- [ ] Smooth expand/collapse animation
- [ ] Single/multiple open support
- [ ] Icon rotation on open

#### [ ] Spinner.tsx (20 minutes)
- [ ] Rotating circle with gradient
- [ ] Various sizes
- [ ] Configurable color

#### [ ] Progress.tsx (20 minutes)
- [ ] Linear progress bar
- [ ] Percentage display
- [ ] Colored (blue for processing, green for complete)
- [ ] Animated fill

---

## STYLING PATTERNS TO APPLY

### Button Styling Pattern
```tsx
// Primary Button
className="px-8 py-4 text-lg font-semibold text-white 
  bg-gradient-to-r from-primary-500 to-primary-600 
  rounded-xl hover:from-primary-600 hover:to-primary-700 
  shadow-lg hover:shadow-xl transition-all duration-200"

// Secondary Button (UPDATE: Use #8B5CF6)
className="px-8 py-4 text-lg font-semibold text-white 
  bg-gradient-to-r from-secondary-500 to-secondary-600 
  rounded-xl hover:from-secondary-600 hover:to-secondary-700 
  shadow-lg hover:shadow-xl transition-all duration-200"

// Outline Button
className="px-8 py-4 text-lg font-semibold text-primary-600 
  border-2 border-primary-500 rounded-xl 
  hover:bg-primary-50 transition-all duration-200"
```

### Card Styling Pattern
```tsx
className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 
  hover:border-primary-300 hover:shadow-xl transition-all duration-300"
```

### Form Input Styling Pattern
```tsx
className="w-full px-4 py-3 border-1.5 border-gray-300 rounded-lg
  focus:outline-none focus:border-primary-500 
  focus:ring-3 focus:ring-primary-100
  transition-all duration-200"
```

---

## ANIMATIONS TO IMPLEMENT

### Micro-interactions
- [ ] Button hover: slight translate-y(-2px) + shadow increase
- [ ] Card hover: translate-y(-4px) + shadow increase
- [ ] Link hover: color change to primary-dark
- [ ] Checkbox: scale animation on check
- [ ] Success icon: scale-in + checkmark draw

### Loading States
- [ ] Skeleton screen pulse (gradient shimmer)
- [ ] Spinner: rotating circle with gradient
- [ ] Progress bar: smooth fill animation
- [ ] Button loading: spinner + disabled state

### Page Transitions
- [ ] Fade in on load
- [ ] Fade out on navigation
- [ ] Slide in from right (modals)
- [ ] Smooth scroll

### Interactive Elements
- [ ] Accordion open/close: smooth height transition
- [ ] Tab switch: fade + color change
- [ ] Toast: slide in from bottom + fade out
- [ ] Dropdown: fade in + scale from top

---

## RESPONSIVE DESIGN BREAKPOINTS

All pages must be responsive:
- [ ] Mobile: 320px (base)
- [ ] Tablet: 768px (md)
- [ ] Desktop: 1024px (lg)
- [ ] Large: 1280px (xl)

**Patterns:**
- [ ] Single column on mobile
- [ ] 2-3 columns on tablet
- [ ] 3-4 columns on desktop
- [ ] Hidden/shown elements per breakpoint
- [ ] Font size adjustments

---

## ACCESSIBILITY REQUIREMENTS

- [ ] Color contrast: WCAG AA (4.5:1 for normal text)
- [ ] Focus visible: 3px outline, 2px offset
- [ ] Alt text: All images have descriptive alt
- [ ] Form labels: Properly associated with inputs
- [ ] Error messages: Linked to form fields with aria-describedby
- [ ] Loading states: aria-live regions for dynamic updates
- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] Mobile touch: 44x44px minimum touch targets

---

## TESTING CHECKLIST

### Functional Testing
- [ ] Form submission without errors
- [ ] Form validation shows errors correctly
- [ ] Links navigate to correct pages
- [ ] Buttons trigger expected actions
- [ ] Responsive layout at all breakpoints
- [ ] Dark mode toggle works (if implemented)

### Visual Testing
- [ ] Colors match brand guidelines
- [ ] Typography hierarchy is clear
- [ ] Spacing is consistent (8px grid)
- [ ] Buttons/inputs are properly styled
- [ ] Hover/focus states are visible
- [ ] Animations are smooth

### Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

## ESTIMATED TIMELINE

| Phase | Task | Duration |
|-------|------|----------|
| **Phase 0** | Update colors (tailwind + CSS vars) | 30 min |
| **Phase 1** | Auth pages (Login, Register) | 2 hours |
| **Phase 2** | Upload & Processing | 3.5 hours |
| **Phase 3** | Dashboard page | 1.5 hours |
| **Phase 4** | Pricing page | 2 hours |
| **Phase 5** | Component library (14 components) | 6 hours |
| **Phase 6** | Animations & polish | 2 hours |
| **Phase 7** | Testing & refinement | 2 hours |
| | **TOTAL** | **19-20 hours** |

---

## DONE CHECKLIST (Reference)

### Already Complete
- [x] Project setup (React 19 + Tailwind + TypeScript)
- [x] Routing (React Router with 8 pages)
- [x] Layout component (Header + Footer)
- [x] HomePage fully styled (reference for patterns)
- [x] API client setup (Axios)
- [x] Type definitions
- [x] Dark mode support (configured)
- [x] Mobile responsiveness base

### To Complete
- [ ] Update secondary color from #4F46E5 to #8B5CF6
- [ ] Create 5 remaining pages (Login, Register, Upload, Dashboard, Processing, Batch View, Pricing)
- [ ] Build 14+ UI components
- [ ] Implement animations
- [ ] Add form validation
- [ ] Test across devices
- [ ] Optimize for SEO
- [ ] Set up analytics

---

## QUICK REFERENCE

### Key Files
- Colors: `/frontend/tailwind.config.ts` + `/frontend/src/index.css`
- Pages: `/frontend/src/pages/`
- Components: `/frontend/src/components/`
- Utilities: `/frontend/src/lib/utils.ts` (cn() function)
- Types: `/frontend/src/types/index.ts`

### Brand Colors (Updated)
- Primary Blue: #2563EB
- Secondary Violet: #8B5CF6 (CHANGE FROM #4F46E5)
- Accent Emerald: #10B981
- Neutral 900: #0F172A (headings)
- Neutral 700: #334155 (body text)

### Font
- Family: Inter
- Weights: 400, 500, 600, 700
- Display: Poppins (optional for H1)

### Spacing
- Base: 4px (Tailwind default)
- Grid: 8px scale preferred
- Section padding: 64px (desktop), 48px (mobile)
- Card padding: 24px

---

## SUCCESS CRITERIA

✓ All pages match brand guidelines  
✓ Secondary color is #8B5CF6 throughout  
✓ All buttons have primary/secondary/outline variants  
✓ Forms are fully functional with validation  
✓ Mobile responsive at all breakpoints  
✓ Accessibility standards met (WCAG AA)  
✓ Smooth animations on interactive elements  
✓ Consistent spacing (8px grid)  
✓ Dark mode functional  
✓ All images have alt text  

