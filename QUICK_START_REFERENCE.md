# HeadShotHub Brand Guidelines - Quick Start Reference

## PROJECT AT A GLANCE

```
HeadShotHub Frontend
├── React 19 + TypeScript + Tailwind CSS 4.0
├── Vite build tool
├── Radix UI components
├── Lucide React icons
└── Fully responsive, dark mode ready
```

---

## FILE STRUCTURE QUICK MAP

```
frontend/src/
├── pages/               ← Page components (8 pages to style)
├── components/          ← Layout, UI components
│   └── ui/             ← New component library (to create)
├── lib/
│   ├── api.ts          ← Backend communication
│   ├── utils.ts        ← Helper: cn() function for classes
│   ├── plans.ts        ← Pricing data
│   └── templates.ts    ← Template definitions
├── types/index.ts      ← TypeScript interfaces
├── App.tsx             ← Main router
├── main.tsx            ← Entry point
└── index.css           ← Global styles & CSS vars

frontend/
├── tailwind.config.ts  ← Color palette & theme
├── vite.config.ts      ← Build config
├── tsconfig.json       ← TypeScript config
└── postcss.config.js   ← PostCSS config
```

---

## CRITICAL: COLOR UPDATE NEEDED

### Change These Files
1. **`/frontend/tailwind.config.ts` (line 39-50)**
   ```typescript
   secondary: {
     // CHANGE FROM #4F46E5 TO:
     DEFAULT: '#8B5CF6',     // Vivid Violet
     50: '#F3E8FF',
     100: '#E9D5FF',
     200: '#D8B4FE',
     300: '#C084FC',
     400: '#A855F7',
     500: '#8B5CF6',         ← Current: #4F46E5
     600: '#7C3AED',
     700: '#6D28D9',
     800: '#5B21B6',
     900: '#4C1D95',
   }
   ```

2. **`/frontend/src/index.css` (line 14 & line 37)**
   - Update `--secondary` CSS variable values in both light and dark modes
   - Update hex references for secondary colors

---

## CURRENT STATUS

### Complete
- [x] HomePage.tsx - Fully styled with patterns to follow
- [x] Layout.tsx - Header & footer
- [x] Routing setup - All 8 pages connected
- [x] Project foundation - React, Tailwind, TypeScript

### Scaffolded (Empty)
- [ ] PricingPage.tsx
- [ ] LoginPage.tsx
- [ ] RegisterPage.tsx
- [ ] UploadPage.tsx
- [ ] DashboardPage.tsx
- [ ] ProcessingPage.tsx
- [ ] BatchViewPage.tsx

### Missing
- [ ] UI component library
- [ ] Form validation
- [ ] Animations
- [ ] Secondary color update (URGENT)

---

## STYLING EXAMPLES FROM HOMEPAGE

### Button (Copy this pattern)
```tsx
<button className="px-8 py-4 text-lg font-semibold text-white 
  bg-gradient-to-r from-primary-500 to-primary-600 
  rounded-xl hover:from-primary-600 hover:to-primary-700 
  shadow-lg hover:shadow-xl transition-all duration-200">
  Create Your Headshots
</button>
```

### Card
```tsx
<div className="bg-white p-6 rounded-2xl border border-gray-200 
  hover:border-primary-300 hover:shadow-xl transition-all duration-300">
  {/* Content */}
</div>
```

### Grid Section
```tsx
<div className="container mx-auto px-4 py-20">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {/* Cards */}
  </div>
</div>
```

### Hero Gradient
```tsx
<div className="bg-gradient-to-b from-white to-gray-50">
  {/* Hero content */}
</div>
```

---

## BRAND COLORS CHEAT SHEET

```
PRIMARY:        #2563EB (Royal Blue)
PRIMARY DARK:   #1E40AF (Deep Blue) - hover states
PRIMARY LIGHT:  #60A5FA (Sky Blue) - backgrounds

SECONDARY:      #8B5CF6 (Vivid Violet) ← CHANGE FROM #4F46E5
ACCENT:         #10B981 (Emerald) - success states

NEUTRAL 900:    #0F172A (Headings)
NEUTRAL 700:    #334155 (Body text)
NEUTRAL 500:    #64748B (Secondary text)
NEUTRAL 300:    #CBD5E1 (Borders)
NEUTRAL 100:    #F1F5F9 (Subtle BG)
NEUTRAL 50:     #F8FAFC (Page BG)

ERROR:          #EF4444
WARNING:        #F59E0B
INFO:           #3B82F6
```

### Usage
```
- Primary CTA buttons: primary-500 to primary-600 gradient
- Secondary actions: secondary-500 (UPDATE COLOR)
- Success states: accent/green-500
- Text: neutral-700 for body, neutral-900 for headings
- Backgrounds: white for cards, neutral-50 for sections
- Borders: neutral-300
```

---

## TYPOGRAPHY

### Font
- **Family:** Inter (Google Fonts)
- **Weights:** 300, 400, 500, 600, 700, 800, 900
- **All text:** Uses Inter via `fontFamily: ['Inter', ...]` in tailwind config

### Sizes
- **H1:** text-5xl md:text-7xl (hero)
- **H2:** text-4xl md:text-5xl (section headers)
- **H3:** text-2xl (subsection headers)
- **Body:** text-base (default) or text-lg (large)
- **Small:** text-sm or text-xs

---

## RESPONSIVE PATTERNS

All pages should follow this pattern:

```tsx
export default function MyPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      {/* Mobile: 1 column, Tablet: 2 cols, Desktop: 3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Items */}
      </div>
    </div>
  );
}
```

**Breakpoints:**
- Mobile-first (320px default)
- `md:` at 768px (tablets)
- `lg:` at 1024px (desktops)
- `xl:` at 1280px (large desktops)

---

## HOW TO CREATE A NEW PAGE

1. **Create file:** `src/pages/MyNewPage.tsx`

2. **Use this template:**
```tsx
export default function MyNewPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Section 1 */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Page Title
          </h1>
        </div>
      </section>
      
      {/* Section 2 */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Content */}
        </div>
      </section>
    </div>
  );
}
```

3. **Add route:** In `App.tsx`, add:
```tsx
<Route path="/my-page" element={<Layout user={user}><MyNewPage /></Layout>} />
```

---

## HOW TO CREATE A UI COMPONENT

1. **Create file:** `src/components/ui/Button.tsx`

2. **Use cn() utility:**
```tsx
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold rounded-xl transition-all duration-200',
        variant === 'primary' && 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg',
        variant === 'secondary' && 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 shadow-lg',
        variant === 'outline' && 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50',
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-2.5 text-base',
        size === 'lg' && 'px-8 py-4 text-lg',
        className
      )}
      {...props}
    />
  );
}
```

3. **Usage:**
```tsx
<Button variant="primary" size="lg">Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
```

---

## PRIORITY IMPLEMENTATION ORDER

### Phase 1: Core (Most Important)
1. **Update colors** - tailwind.config.ts + index.css (30 min)
2. **LoginPage & RegisterPage** - Auth flow (2 hours)
3. **Button component** - Needed everywhere (45 min)

### Phase 2: User Flow
4. **UploadPage** - Upload & plan selection (90 min)
5. **Card component** - Reusable cards (30 min)
6. **ProcessingPage** - Progress display (45 min)
7. **BatchViewPage** - Results gallery (120 min)

### Phase 3: Admin & Dashboard
8. **DashboardPage** - Batch list (90 min)
9. **Input component** - Forms (45 min)

### Phase 4: Monetization
10. **PricingPage** - Pricing plans (120 min)

### Phase 5: Polish
11. **Component library** - 10+ UI components (6 hours)
12. **Animations** - Micro-interactions (2 hours)

---

## COMMON COMMANDS

```bash
# Development
cd frontend
npm run dev              # Start dev server (localhost:5173)

# Build
npm run build            # Build for production

# Linting
npm run lint             # Check code quality
```

---

## TESTING CHECKLIST (BEFORE SHIP)

### Per Page
- [ ] Loads without errors
- [ ] Responsive at: 320px, 768px, 1024px, 1280px
- [ ] All links work
- [ ] Forms validate correctly
- [ ] Buttons trigger actions
- [ ] Colors match brand (#2563EB, #8B5CF6, #10B981, etc.)
- [ ] Hover states visible
- [ ] Focus states visible
- [ ] Text is readable (color contrast WCAG AA)

### Cross-Browser
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## KEY STATISTICS

| Metric | Value |
|--------|-------|
| React Version | 19.0.0 |
| Tailwind Version | 4.0.0 |
| TypeScript | 5.3.3 |
| Number of Pages | 8 |
| Number of Components | 1 (Layout) → Need 14+ |
| Primary Color | #2563EB |
| Secondary Color | #8B5CF6 (NEEDS UPDATE) |
| Font | Inter (Google Fonts) |
| Build Tool | Vite |
| Dev Port | 5173 |
| API Backend | localhost:3000 |

---

## QUICK WINS (FIRST 2 HOURS)

1. Update secondary color (30 min) ← DO THIS FIRST
2. Create Button.tsx component (45 min)
3. Create Card.tsx component (30 min)
4. Start LoginPage.tsx (15 min)

**Result:** Core foundation for all future pages

---

## RESOURCES IN PROJECT

| File | Purpose |
|------|---------|
| `HomePage.tsx` | Reference for styling patterns |
| `Layout.tsx` | Header + footer template |
| `utils.ts` | cn() function for class merging |
| `tailwind.config.ts` | Color palette source of truth |
| `index.css` | CSS variables & global styles |
| `types/index.ts` | All TypeScript interfaces |
| `brandguidelines.md` | Complete brand specifications |

---

## NEED HELP?

### Common Questions
- **How do I add a new color?** Edit `tailwind.config.ts` extend colors section
- **How do I make a component responsive?** Use `md:` and `lg:` Tailwind prefixes
- **How do I style a button?** See Button.tsx component example above
- **How do I use form validation?** See Input.tsx component & utils functions
- **How do I add animations?** Use `transition-all duration-200` or custom @keyframes

### Reference Files
- **Colors:** tailwind.config.ts (line 20-72) + index.css (line 4-48)
- **Typography:** tailwind.config.ts (line 78-81) + index.css (line 2, 58)
- **Spacing:** Tailwind default (4px base, 8px scale)
- **Examples:** HomePage.tsx (full implementation)

---

## SUCCESS METRICS

When complete, you should have:
- [x] All colors matching brand guidelines
- [x] 8 fully functional pages
- [x] 14+ reusable UI components
- [x] Responsive at all breakpoints
- [x] WCAG AA accessibility compliance
- [x] Smooth animations
- [x] Dark mode support
- [x] Form validation
- [x] Clean, maintainable TypeScript code
- [x] Ready for production

---

**Next Step:** Open `tailwind.config.ts` and update the secondary color from #4F46E5 to #8B5CF6!
