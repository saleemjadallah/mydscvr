# MYDSCVR Headshot Hub - Gamma.app Inspired Redesign

## 🎯 Design Mission
Transform MYDSCVR Headshot Hub into a visually stunning, modern SaaS platform inspired by **Gamma.app's exceptional design language**. Create a professional AI headshot generator that feels premium, delightful, and effortless to use.

---

## 🎨 Gamma.app Design DNA to Replicate

### Visual Characteristics
- **Gradients Everywhere**: Subtle, sophisticated gradients (not garish)
- **Generous White Space**: Breathing room around every element
- **Soft Shadows**: Elevated cards with subtle depth
- **Rounded Corners**: 12px-24px border radius on everything
- **Glass Morphism**: Frosted glass effects on overlays
- **Micro-interactions**: Smooth hover states, transitions
- **Premium Typography**: Large, bold headlines with perfect hierarchy
- **Minimal Color Palette**: 2-3 brand colors + neutrals
- **Floating Elements**: Cards that appear to hover above the page
- **Gradient Mesh Backgrounds**: Soft, blurred gradient orbs

### Interaction Patterns
- **Butter-smooth animations**: 300-400ms ease-out transitions
- **Hover lift effects**: Cards rise on hover
- **Progressive disclosure**: Show complexity only when needed
- **Delightful empty states**: Beautiful illustrations, not boring text
- **Inline validation**: Real-time feedback as you type/upload
- **Optimistic UI**: Show results before server confirms
- **Toast notifications**: Non-intrusive success/error messages

### Layout Philosophy
- **Center-aligned hero sections**
- **Asymmetric content blocks** (not boring grids)
- **Diagonal sections** with SVG dividers
- **Sticky navigation** that fades in/out
- **Full-bleed imagery** with overlays
- **Floating CTAs** that follow scroll

---

## 🌈 MYDSCVR Brand Identity (Gamma-ified)

### Color Palette
```css
/* Primary: Discovery Purple-to-Blue Gradient */
--primary-start: #6366F1;    /* Indigo */
--primary-end: #8B5CF6;      /* Violet */
--primary-gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);

/* Secondary: Professional Blue */
--secondary-start: #3B82F6;  /* Blue */
--secondary-end: #2563EB;    /* Blue-600 */
--secondary-gradient: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);

/* Accent: Success Green */
--accent-start: #10B981;     /* Emerald */
--accent-end: #059669;       /* Emerald-600 */
--accent-gradient: linear-gradient(135deg, #10B981 0%, #059669 100%);

/* Neutrals: Clean & Modern */
--neutral-50: #F8FAFC;       /* Almost white */
--neutral-100: #F1F5F9;      /* Light gray */
--neutral-200: #E2E8F0;      /* Gray */
--neutral-300: #CBD5E1;      /* Gray-300 */
--neutral-400: #94A3B8;      /* Gray-400 */
--neutral-500: #64748B;      /* Gray-500 */
--neutral-600: #475569;      /* Gray-600 */
--neutral-700: #334155;      /* Gray-700 */
--neutral-800: #1E293B;      /* Dark gray */
--neutral-900: #0F172A;      /* Almost black */

/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #F8FAFC;
--bg-tertiary: #F1F5F9;

/* Gradient Mesh (Gamma-style background) */
--mesh-gradient: 
  radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
  radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
  radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
  radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.05) 0px, transparent 50%);
```

### Typography System
```css
/* Font Stack */
--font-display: 'Cal Sans', 'Inter', -apple-system, sans-serif;  /* For headlines */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Type Scale (Gamma uses LARGE type) */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */
--text-7xl: 4.5rem;      /* 72px */
--text-8xl: 6rem;        /* 96px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-tight: 1.2;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Spacing System
```css
/* Gamma uses GENEROUS spacing */
--space-xs: 0.5rem;      /* 8px */
--space-sm: 0.75rem;     /* 12px */
--space-md: 1rem;        /* 16px */
--space-lg: 1.5rem;      /* 24px */
--space-xl: 2rem;        /* 32px */
--space-2xl: 3rem;       /* 48px */
--space-3xl: 4rem;       /* 64px */
--space-4xl: 6rem;       /* 96px */
--space-5xl: 8rem;       /* 128px */
--space-6xl: 12rem;      /* 192px */
```

### Border Radius
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-2xl: 32px;
--radius-full: 9999px;
```

### Shadows (Gamma's signature soft shadows)
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.15);

/* Colored shadows (Gamma-style) */
--shadow-primary: 0 10px 30px -5px rgba(99, 102, 241, 0.3);
--shadow-secondary: 0 10px 30px -5px rgba(59, 130, 246, 0.3);
--shadow-accent: 0 10px 30px -5px rgba(16, 185, 129, 0.3);
```

---

## 📱 Page-by-Page Redesign

### 🏠 1. Homepage (`/`)

#### Hero Section
```tsx
<Hero className="relative min-h-screen flex items-center justify-center overflow-hidden">
  {/* Animated gradient mesh background */}
  <GradientMesh className="absolute inset-0 z-0" />
  
  {/* Floating gradient orbs (Gamma-style) */}
  <FloatingOrb 
    color="primary" 
    size="600px" 
    position="top-left"
    blur="120px"
    opacity={0.4}
    animate
  />
  <FloatingOrb 
    color="secondary" 
    size="500px" 
    position="top-right"
    blur="100px"
    opacity={0.3}
    animate
    delay={2}
  />
  
  {/* Content */}
  <Container className="relative z-10 text-center max-w-5xl mx-auto px-6">
    
    {/* Eyebrow badge */}
    <Badge 
      variant="gradient" 
      size="lg"
      className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full 
                 bg-white/10 backdrop-blur-lg border border-white/20
                 shadow-lg shadow-primary/20"
    >
      <Sparkles className="w-4 h-4" />
      <span className="bg-gradient-to-r from-primary-start to-primary-end 
                       bg-clip-text text-transparent font-semibold">
        Powered by AI
      </span>
    </Badge>
    
    {/* Main headline - HUGE like Gamma */}
    <h1 className="text-7xl md:text-8xl font-extrabold mb-6 
                   bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-600
                   bg-clip-text text-transparent
                   leading-tight tracking-tight">
      Professional Headshots
      <br />
      <span className="bg-gradient-to-r from-primary-start via-secondary-start to-accent-start
                       bg-clip-text text-transparent">
        In Minutes, Not Weeks
      </span>
    </h1>
    
    {/* Subheadline */}
    <p className="text-2xl md:text-3xl text-neutral-600 mb-12 max-w-3xl mx-auto
                  font-medium leading-relaxed">
      Upload your selfies. Get 40-200 studio-quality headshots 
      optimized for LinkedIn, resumes, and every platform you need.
    </p>
    
    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
      <Button 
        size="xl"
        variant="gradient"
        className="px-8 py-4 text-lg rounded-2xl
                   bg-gradient-to-r from-primary-start to-primary-end
                   text-white font-semibold shadow-2xl shadow-primary/50
                   hover:shadow-primary/70 hover:scale-105
                   transition-all duration-300 ease-out
                   group"
      >
        Create Your Headshots
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>
      
      <Button 
        size="xl"
        variant="ghost"
        className="px-8 py-4 text-lg rounded-2xl
                   bg-white/80 backdrop-blur-sm
                   text-neutral-900 font-semibold
                   border-2 border-neutral-200
                   hover:bg-white hover:border-neutral-300
                   hover:scale-105
                   transition-all duration-300 ease-out"
      >
        View Examples
      </Button>
    </div>
    
    {/* Social proof */}
    <div className="flex items-center justify-center gap-8 text-neutral-600">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[1,2,3,4,5].map(i => (
            <Avatar key={i} className="border-2 border-white w-10 h-10" />
          ))}
        </div>
        <span className="text-sm font-medium">
          Trusted by <strong className="text-neutral-900">100,000+</strong> professionals
        </span>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
        <span className="text-sm font-medium">
          <strong className="text-neutral-900">4.9/5</strong> rating
        </span>
      </div>
    </div>
    
  </Container>
  
  {/* Scroll indicator */}
  <ScrollIndicator className="absolute bottom-8 left-1/2 -translate-x-1/2" />
</Hero>
```

#### Sample Headshots Showcase
```tsx
<Section className="py-24 bg-gradient-to-b from-white to-neutral-50">
  <Container className="max-w-7xl mx-auto px-6">
    
    {/* Section header */}
    <SectionHeader className="text-center mb-16">
      <Badge variant="outline" className="mb-4">
        Real Results
      </Badge>
      <h2 className="text-5xl md:text-6xl font-bold mb-6 text-neutral-900">
        See the{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          transformation
        </span>
      </h2>
      <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
        From casual selfies to professional headshots in minutes
      </p>
    </SectionHeader>
    
    {/* Before/After Grid - Gamma style asymmetric layout */}
    <BeforeAfterGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      
      {/* Each card is a before/after with slider */}
      <BeforeAfterCard
        className="group relative overflow-hidden rounded-3xl
                   bg-white shadow-xl hover:shadow-2xl
                   transition-all duration-500 ease-out
                   hover:-translate-y-2"
      >
        <ComparisonSlider
          before="/assets/samples/before-1.jpg"
          after="/assets/samples/after-linkedin-1.jpg"
          label="LinkedIn Professional"
        />
        
        {/* Template badge overlay */}
        <TemplateBadge className="absolute top-4 left-4 z-10">
          <Linkedin className="w-4 h-4" />
          <span>LinkedIn</span>
        </TemplateBadge>
      </BeforeAfterCard>
      
      {/* Generate 6-8 more cards with different templates */}
      <BeforeAfterCard template="corporate" />
      <BeforeAfterCard template="creative" />
      <BeforeAfterCard template="executive" />
      <BeforeAfterCard template="social" />
      <BeforeAfterCard template="casual" />
      
    </BeforeAfterGrid>
    
    {/* Generate sample button using Gemini */}
    <div className="mt-12 text-center">
      <Button 
        variant="outline" 
        size="lg"
        onClick={generateSampleHeadshots}
        className="rounded-2xl"
      >
        <Sparkles className="mr-2 w-5 h-5" />
        Generate New Samples with AI
      </Button>
    </div>
    
  </Container>
</Section>
```

#### Style Templates Showcase (Key Feature!)
```tsx
<Section className="py-24 bg-neutral-50 relative overflow-hidden">
  
  {/* Decorative background elements */}
  <BackgroundPattern />
  
  <Container className="max-w-7xl mx-auto px-6 relative z-10">
    
    <SectionHeader className="text-center mb-20">
      <Badge variant="gradient" className="mb-4">
        <Zap className="w-4 h-4 mr-2" />
        Platform-Optimized
      </Badge>
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        One Click.{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          Eight Platforms.
        </span>
      </h2>
      <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
        Each style template is specifically designed for where you'll use it.
        See exactly how your headshot will look on LinkedIn, your resume, and more.
      </p>
    </SectionHeader>
    
    {/* Template Cards - Bento Grid Layout (Gamma-style) */}
    <BentoGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* LinkedIn Template - Large featured card */}
      <TemplateCard 
        span="col-span-2 row-span-2"
        template="linkedin"
        featured
        className="group relative overflow-hidden rounded-3xl
                   bg-gradient-to-br from-white to-blue-50
                   border-2 border-blue-100
                   shadow-xl hover:shadow-2xl hover:shadow-primary/20
                   transition-all duration-500 ease-out
                   hover:-translate-y-2"
      >
        {/* Preview mockup */}
        <LinkedInMockup 
          headshot="/assets/templates/linkedin-sample.jpg"
          className="p-8"
        />
        
        {/* Template info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-8
                        bg-gradient-to-t from-white/95 via-white/90 to-transparent
                        backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Linkedin className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-neutral-900">
                  LinkedIn Professional
                </h3>
              </div>
              <p className="text-neutral-600 mb-4">
                Business formal, neutral background, direct gaze
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Most Popular
            </Badge>
          </div>
          
          {/* Platform specs */}
          <div className="flex flex-wrap gap-2">
            <SpecBadge>1:1 Square</SpecBadge>
            <SpecBadge>1024×1024</SpecBadge>
            <SpecBadge>Studio Lighting</SpecBadge>
          </div>
        </div>
        
        {/* Hover state - Preview more examples */}
        <div className="absolute inset-0 bg-neutral-900/95 backdrop-blur-sm
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-300
                        flex items-center justify-center p-8">
          <div className="text-center">
            <h4 className="text-white text-xl font-bold mb-4">
              Sample Variations
            </h4>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <img src="/assets/variations/linkedin-1.jpg" className="rounded-lg" />
              <img src="/assets/variations/linkedin-2.jpg" className="rounded-lg" />
              <img src="/assets/variations/linkedin-3.jpg" className="rounded-lg" />
            </div>
            <Button variant="white" size="sm" className="rounded-full">
              View All Samples
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </TemplateCard>
      
      {/* Corporate Template */}
      <TemplateCard 
        template="corporate"
        className="rounded-3xl bg-white shadow-lg hover:shadow-xl
                   transition-all duration-300 hover:-translate-y-1"
      >
        <WebsiteMockup headshot="/assets/templates/corporate-sample.jpg" />
        <TemplateInfo
          icon={<Building2 />}
          title="Corporate Website"
          description="Formal, trustworthy, team consistency"
          specs={["4:5 Portrait", "1080×1350", "Even Lighting"]}
        />
      </TemplateCard>
      
      {/* Creative Template */}
      <TemplateCard 
        template="creative"
        className="rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50
                   shadow-lg hover:shadow-xl
                   transition-all duration-300 hover:-translate-y-1"
      >
        <PortfolioMockup headshot="/assets/templates/creative-sample.jpg" />
        <TemplateInfo
          icon={<Palette />}
          title="Creative Portfolio"
          description="Modern, approachable, personality-forward"
          specs={["3:4 Portrait", "1080×1440", "Natural Light"]}
        />
      </TemplateCard>
      
      {/* Resume Template */}
      <TemplateCard template="resume" />
      
      {/* Social Media Template */}
      <TemplateCard template="social" />
      
      {/* Executive Template - Large featured */}
      <TemplateCard 
        span="col-span-2"
        template="executive"
        className="rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800
                   text-white shadow-2xl hover:shadow-3xl
                   transition-all duration-300 hover:-translate-y-1"
      >
        <ExecutiveMockup headshot="/assets/templates/executive-sample.jpg" />
        <TemplateInfo
          icon={<Briefcase />}
          title="Executive Leadership"
          description="Authoritative, premium, high-end"
          specs={["2:3 Editorial", "1080×1620", "Cinematic"]}
          dark
        />
      </TemplateCard>
      
      {/* Casual & Speaker templates */}
      <TemplateCard template="casual" />
      <TemplateCard template="speaker" />
      
    </BentoGrid>
    
    {/* View all templates CTA */}
    <div className="mt-16 text-center">
      <Button 
        size="xl" 
        variant="gradient"
        className="rounded-2xl shadow-xl shadow-primary/30"
      >
        Explore All 8 Templates
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
    
  </Container>
</Section>
```

#### How It Works Section
```tsx
<Section className="py-24 bg-white">
  <Container className="max-w-7xl mx-auto px-6">
    
    <SectionHeader className="text-center mb-20">
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        Simple as{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          1-2-3
        </span>
      </h2>
      <p className="text-xl text-neutral-600">
        Professional headshots in three easy steps
      </p>
    </SectionHeader>
    
    {/* Steps - Horizontal timeline with connected line */}
    <StepsTimeline className="relative max-w-5xl mx-auto">
      
      {/* Connecting line */}
      <div className="absolute top-1/2 left-0 right-0 h-1 
                      bg-gradient-to-r from-primary-start via-secondary-start to-accent-start
                      opacity-20 -translate-y-1/2 hidden lg:block"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
        
        {/* Step 1: Upload */}
        <StepCard 
          number="01"
          className="group relative"
        >
          {/* Animated illustration container */}
          <IllustrationContainer className="mb-6 relative h-64 rounded-2xl
                                           bg-gradient-to-br from-blue-50 to-indigo-50
                                           overflow-hidden">
            {/* Generate with Gemini: Upload animation */}
            <UploadAnimation />
            
            {/* Floating elements */}
            <FloatingElement delay={0}>
              <PhotoIcon />
            </FloatingElement>
            <FloatingElement delay={0.5}>
              <PhotoIcon />
            </FloatingElement>
            <FloatingElement delay={1}>
              <PhotoIcon />
            </FloatingElement>
          </IllustrationContainer>
          
          <div className="flex items-center gap-3 mb-4">
            <NumberBadge className="w-12 h-12 rounded-full 
                                   bg-gradient-to-br from-primary-start to-primary-end
                                   text-white font-bold text-xl
                                   flex items-center justify-center
                                   shadow-lg shadow-primary/30">
              1
            </NumberBadge>
            <h3 className="text-2xl font-bold text-neutral-900">
              Upload Photos
            </h3>
          </div>
          
          <p className="text-neutral-600 text-lg leading-relaxed mb-4">
            Upload 12-20 selfies with different angles, expressions, and lighting
          </p>
          
          <ul className="space-y-2 text-neutral-600">
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Clear, front-facing photos</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Good lighting, no sunglasses</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Mix of expressions & angles</span>
            </li>
          </ul>
        </StepCard>
        
        {/* Step 2: Choose Templates */}
        <StepCard number="02">
          <IllustrationContainer className="mb-6 h-64 rounded-2xl
                                           bg-gradient-to-br from-purple-50 to-pink-50">
            {/* Generate with Gemini: Template selection animation */}
            <TemplateSelectionAnimation />
          </IllustrationContainer>
          
          <div className="flex items-center gap-3 mb-4">
            <NumberBadge className="bg-gradient-to-br from-secondary-start to-secondary-end
                                   shadow-lg shadow-secondary/30">
              2
            </NumberBadge>
            <h3 className="text-2xl font-bold text-neutral-900">
              Choose Templates
            </h3>
          </div>
          
          <p className="text-neutral-600 text-lg leading-relaxed mb-4">
            Select from 8 platform-optimized templates and pick your plan
          </p>
          
          <ul className="space-y-2 text-neutral-600">
            <li className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>LinkedIn, Corporate, Creative</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>Resume, Social, Executive</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>40-200 headshots per plan</span>
            </li>
          </ul>
        </StepCard>
        
        {/* Step 3: Download */}
        <StepCard number="03">
          <IllustrationContainer className="mb-6 h-64 rounded-2xl
                                           bg-gradient-to-br from-green-50 to-emerald-50">
            {/* Generate with Gemini: Download/results animation */}
            <ResultsAnimation />
          </IllustrationContainer>
          
          <div className="flex items-center gap-3 mb-4">
            <NumberBadge className="bg-gradient-to-br from-accent-start to-accent-end
                                   shadow-lg shadow-accent/30">
              3
            </NumberBadge>
            <h3 className="text-2xl font-bold text-neutral-900">
              Download & Use
            </h3>
          </div>
          
          <p className="text-neutral-600 text-lg leading-relaxed mb-4">
            Get your headshots in 1-3 hours, optimized for every platform
          </p>
          
          <ul className="space-y-2 text-neutral-600">
            <li className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Lightning-fast delivery</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>High-resolution downloads</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Full commercial rights</span>
            </li>
          </ul>
        </StepCard>
        
      </div>
    </StepsTimeline>
    
  </Container>
</Section>
```

#### Features Grid (Gamma's Bento-style)
```tsx
<Section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
  <Container className="max-w-7xl mx-auto px-6">
    
    <SectionHeader className="text-center mb-20">
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        Everything you need.{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          Nothing you don't.
        </span>
      </h2>
    </SectionHeader>
    
    {/* Bento Grid - Asymmetric feature cards */}
    <BentoGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* Large feature - Platform Previews */}
      <FeatureCard 
        span="lg:col-span-2 lg:row-span-2"
        className="bg-gradient-to-br from-blue-500 to-purple-600 text-white
                   rounded-3xl p-12 shadow-2xl overflow-hidden relative
                   group hover:scale-[1.02] transition-transform duration-500"
      >
        <div className="relative z-10">
          <Badge variant="white" className="mb-6">
            <Eye className="w-4 h-4 mr-2" />
            See Before You Use
          </Badge>
          <h3 className="text-4xl font-bold mb-4">
            Platform Previews
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-xl">
            See exactly how your headshot will look on LinkedIn, your resume,
            Instagram, and more before you download.
          </p>
        </div>
        
        {/* Mockup preview */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <MockupPreview platform="linkedin" />
          <MockupPreview platform="resume" />
          <MockupPreview platform="website" />
          <MockupPreview platform="instagram" />
        </div>
        
        {/* Decorative gradient orb */}
        <FloatingOrb 
          className="absolute -bottom-20 -right-20 w-96 h-96
                     bg-gradient-radial from-white/20 to-transparent
                     blur-3xl"
        />
      </FeatureCard>
      
      {/* Lightning Fast */}
      <FeatureCard className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500
                        flex items-center justify-center mb-6 shadow-lg shadow-amber/30">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-neutral-900">
          Lightning Fast
        </h3>
        <p className="text-neutral-600 text-lg">
          Get your headshots in 1-3 hours, not days or weeks
        </p>
      </FeatureCard>
      
      {/* Affordable */}
      <FeatureCard className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500
                        flex items-center justify-center mb-6 shadow-lg shadow-green/30">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-neutral-900">
          Save 90%
        </h3>
        <p className="text-neutral-600 text-lg">
          $29-59 vs $300+ for traditional photography
        </p>
      </FeatureCard>
      
      {/* AI Powered */}
      <FeatureCard 
        span="lg:col-span-2"
        className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white
                   rounded-3xl p-12 shadow-2xl relative overflow-hidden
                   group hover:scale-[1.02] transition-transform duration-500"
      >
        <div className="relative z-10">
          <Badge variant="white" className="mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by AI
          </Badge>
          <h3 className="text-4xl font-bold mb-4">
            Studio-Quality Results
          </h3>
          <p className="text-neutral-300 text-lg mb-8 max-w-2xl">
            Advanced AI trained on professional photography to deliver
            headshots indistinguishable from a $500 studio session.
          </p>
          
          {/* Quality indicators */}
          <div className="flex flex-wrap gap-3">
            <QualityBadge>4K Resolution</QualityBadge>
            <QualityBadge>Professional Lighting</QualityBadge>
            <QualityBadge>Natural Retouching</QualityBadge>
            <QualityBadge>Color Corrected</QualityBadge>
          </div>
        </div>
        
        {/* Background pattern */}
        <GridPattern className="absolute inset-0 opacity-10" />
      </FeatureCard>
      
      {/* Edit Credits */}
      <FeatureCard className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500
                        flex items-center justify-center mb-6 shadow-lg shadow-purple/30">
          <Edit className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-neutral-900">
          Edit Credits
        </h3>
        <p className="text-neutral-600 text-lg">
          Tweak backgrounds, outfits, or regenerate until perfect
        </p>
      </FeatureCard>
      
      {/* Team Features */}
      <FeatureCard className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500
                        flex items-center justify-center mb-6 shadow-lg shadow-blue/30">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-neutral-900">
          Team Ready
        </h3>
        <p className="text-neutral-600 text-lg">
          Bulk discounts & consistent styling for entire teams
        </p>
      </FeatureCard>
      
      {/* Commercial Rights */}
      <FeatureCard className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500
                        flex items-center justify-center mb-6 shadow-lg shadow-indigo/30">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-neutral-900">
          Full Rights
        </h3>
        <p className="text-neutral-600 text-lg">
          Use your headshots anywhere - full commercial license included
        </p>
      </FeatureCard>
      
    </BentoGrid>
    
  </Container>
</Section>
```

#### Pricing Section
```tsx
<Section className="py-24 bg-white relative overflow-hidden">
  
  {/* Background decoration */}
  <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-white" />
  <FloatingOrb color="primary" position="top-left" blur="150px" opacity={0.1} />
  <FloatingOrb color="accent" position="bottom-right" blur="150px" opacity={0.1} />
  
  <Container className="max-w-7xl mx-auto px-6 relative z-10">
    
    <SectionHeader className="text-center mb-20">
      <Badge variant="gradient" className="mb-4">
        <Sparkles className="w-4 h-4 mr-2" />
        Simple, Transparent Pricing
      </Badge>
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        Choose your{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          perfect plan
        </span>
      </h2>
      <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
        One-time payment. No subscriptions. Full commercial rights included.
      </p>
    </SectionHeader>
    
    {/* Pricing Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      
      {/* Basic Plan */}
      <PricingCard 
        className="bg-white rounded-3xl p-8 shadow-lg
                   border-2 border-neutral-200
                   hover:shadow-2xl hover:-translate-y-2
                   transition-all duration-500"
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
            Basic
          </h3>
          <p className="text-neutral-600 mb-6">
            Perfect for updating your LinkedIn
          </p>
          
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-bold text-neutral-900">$29</span>
            <span className="text-neutral-500">one-time</span>
          </div>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full rounded-2xl text-lg font-semibold
                       border-2 hover:bg-neutral-50"
          >
            Get Started
          </Button>
        </div>
        
        <Separator className="my-8" />
        
        <FeatureList>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">40</span> professional headshots
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">4</span> unique backgrounds
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">4</span> outfit styles
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">4</span> edit credits
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">3-hour</span> turnaround
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            High-resolution downloads
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            Full commercial rights
          </Feature>
        </FeatureList>
      </PricingCard>
      
      {/* Professional Plan - FEATURED */}
      <PricingCard 
        featured
        className="bg-gradient-to-br from-primary-start to-primary-end
                   rounded-3xl p-8 text-white
                   shadow-2xl shadow-primary/50
                   scale-105 hover:scale-110
                   transition-all duration-500
                   relative overflow-hidden"
      >
        {/* Popular badge */}
        <Badge 
          variant="white"
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-lg
                     border border-white/30 text-white font-bold"
        >
          <Star className="w-4 h-4 mr-1 fill-current" />
          Most Popular
        </Badge>
        
        <div className="mb-8 relative z-10">
          <h3 className="text-2xl font-bold mb-2">
            Professional
          </h3>
          <p className="text-blue-100 mb-6">
            Best for job seekers & professionals
          </p>
          
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-bold">$39</span>
            <span className="text-blue-100">one-time</span>
          </div>
          
          <Button 
            variant="white"
            size="lg" 
            className="w-full rounded-2xl text-lg font-semibold
                       bg-white text-primary-start
                       hover:bg-blue-50 shadow-xl"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
        
        <Separator className="my-8 bg-white/20" />
        
        <FeatureList className="text-white">
          <Feature>
            <Check className="w-5 h-5" />
            <span className="font-semibold">100</span> professional headshots
          </Feature>
          <Feature>
            <Check className="w-5 h-5" />
            <span className="font-semibold">10</span> unique backgrounds
          </Feature>
          <Feature>
            <Check className="w-5 h-5" />
            <span className="font-semibold">10</span> outfit styles
          </Feature>
          <Feature>
            <Check className="w-5 h-5" />
            <span className="font-semibold">10</span> edit credits
          </Feature>
          <Feature>
            <Check className="w-5 h-5" />
            <span className="font-semibold">2-hour</span> turnaround
          </Feature>
          <Feature>
            <Check className="w-5 h-5" />
            High-resolution downloads
          </Feature>
          <Feature>
            <Check className="w-5 h-5" />
            Full commercial rights
          </Feature>
          <Feature>
            <Check className="w-5 h-5" />
            <span className="font-semibold">Priority</span> support
          </Feature>
        </FeatureList>
        
        {/* Background decoration */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64
                        bg-gradient-radial from-white/20 to-transparent
                        blur-3xl" />
      </PricingCard>
      
      {/* Executive Plan */}
      <PricingCard 
        className="bg-white rounded-3xl p-8 shadow-lg
                   border-2 border-neutral-200
                   hover:shadow-2xl hover:-translate-y-2
                   transition-all duration-500"
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
            Executive
          </h3>
          <p className="text-neutral-600 mb-6">
            Premium variety for executives
          </p>
          
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-bold text-neutral-900">$59</span>
            <span className="text-neutral-500">one-time</span>
          </div>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full rounded-2xl text-lg font-semibold
                       border-2 hover:bg-neutral-50"
          >
            Get Started
          </Button>
        </div>
        
        <Separator className="my-8" />
        
        <FeatureList>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">200</span> professional headshots
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">20</span> unique backgrounds
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">20</span> outfit styles
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">20</span> edit credits
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">1-hour</span> turnaround
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            High-resolution downloads
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            Full commercial rights
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">Priority</span> support
          </Feature>
          <Feature>
            <Check className="w-5 h-5 text-green-500" />
            <span className="font-semibold">Satisfaction</span> guarantee
          </Feature>
        </FeatureList>
      </PricingCard>
      
    </div>
    
    {/* Comparison table link */}
    <div className="mt-12 text-center">
      <Button variant="ghost" size="lg" className="rounded-2xl">
        Compare All Features
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
    
    {/* Trust badges */}
    <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-neutral-500">
      <TrustBadge>
        <Shield className="w-5 h-5 mr-2" />
        Secure Payment
      </TrustBadge>
      <TrustBadge>
        <Lock className="w-5 h-5 mr-2" />
        Data Protected
      </TrustBadge>
      <TrustBadge>
        <CheckCircle className="w-5 h-5 mr-2" />
        Money-back Guarantee
      </TrustBadge>
    </div>
    
  </Container>
</Section>
```

#### Social Proof & Testimonials
```tsx
<Section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
  <Container className="max-w-7xl mx-auto px-6">
    
    <SectionHeader className="text-center mb-20">
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        Trusted by{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          100,000+ professionals
        </span>
      </h2>
      <p className="text-xl text-neutral-600">
        See what our customers are saying
      </p>
    </SectionHeader>
    
    {/* Testimonials Marquee (Gamma-style infinite scroll) */}
    <MarqueeContainer className="mb-12">
      <Marquee speed={30}>
        <TestimonialCard>
          <Stars rating={5} />
          <Quote>
            "Got 100 amazing headshots for less than the cost of one photographer session!"
          </Quote>
          <Author>
            <Avatar src="/testimonials/sarah.jpg" />
            <div>
              <Name>Sarah Martinez</Name>
              <Title>Marketing Manager</Title>
            </div>
          </Author>
        </TestimonialCard>
        
        <TestimonialCard>
          <Stars rating={5} />
          <Quote>
            "My LinkedIn profile views increased 3x after updating with my AI headshot."
          </Quote>
          <Author>
            <Avatar src="/testimonials/james.jpg" />
            <div>
              <Name>James Kim</Name>
              <Title>Software Engineer</Title>
            </div>
          </Author>
        </TestimonialCard>
        
        {/* Generate 8-10 more testimonials */}
        <TestimonialCard />
        <TestimonialCard />
        <TestimonialCard />
        
      </Marquee>
    </MarqueeContainer>
    
    {/* Stats Grid */}
    <StatsGrid className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
      <StatCard>
        <StatNumber className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                               bg-clip-text text-transparent">
          100K+
        </StatNumber>
        <StatLabel className="text-neutral-600 text-lg">
          Headshots Generated
        </StatLabel>
      </StatCard>
      
      <StatCard>
        <StatNumber className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                               bg-clip-text text-transparent">
          4.9/5
        </StatNumber>
        <StatLabel className="text-neutral-600 text-lg">
          Average Rating
        </StatLabel>
      </StatCard>
      
      <StatCard>
        <StatNumber className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                               bg-clip-text text-transparent">
          2 hrs
        </StatNumber>
        <StatLabel className="text-neutral-600 text-lg">
          Avg. Turnaround
        </StatLabel>
      </StatCard>
      
      <StatCard>
        <StatNumber className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                               bg-clip-text text-transparent">
          90%
        </StatNumber>
        <StatLabel className="text-neutral-600 text-lg">
          Cost Savings
        </StatLabel>
      </StatCard>
    </StatsGrid>
    
  </Container>
</Section>
```

#### Final CTA Section
```tsx
<Section className="py-32 bg-gradient-to-br from-primary-start via-secondary-start to-accent-start
                    text-white relative overflow-hidden">
  
  {/* Animated background */}
  <AnimatedGradient />
  <GridPattern className="absolute inset-0 opacity-10" />
  
  <Container className="max-w-4xl mx-auto px-6 text-center relative z-10">
    
    <Badge variant="white" className="mb-6 inline-flex bg-white/20 backdrop-blur-lg
                                       border border-white/30">
      <Sparkles className="w-4 h-4 mr-2" />
      Ready in Minutes
    </Badge>
    
    <h2 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
      Get Your Professional
      <br />
      Headshots Today
    </h2>
    
    <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
      Join 100,000+ professionals who upgraded their online presence
      with AI-powered headshots
    </p>
    
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Button 
        size="xl"
        variant="white"
        className="px-10 py-5 text-xl rounded-2xl
                   bg-white text-primary-start font-bold
                   shadow-2xl hover:shadow-3xl
                   hover:scale-105 transition-all duration-300
                   group"
      >
        Start Creating
        <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </Button>
      
      <Button 
        size="xl"
        variant="outline"
        className="px-10 py-5 text-xl rounded-2xl
                   bg-transparent text-white font-semibold
                   border-2 border-white/30 backdrop-blur-sm
                   hover:bg-white/10 hover:border-white
                   hover:scale-105 transition-all duration-300"
      >
        View Examples
      </Button>
    </div>
    
    {/* Trust indicators */}
    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-blue-100">
      <TrustIndicator>
        <CheckCircle className="w-5 h-5 mr-2" />
        No credit card required
      </TrustIndicator>
      <Separator orientation="vertical" className="h-6 bg-white/20" />
      <TrustIndicator>
        <Shield className="w-5 h-5 mr-2" />
        100% secure
      </TrustIndicator>
      <Separator orientation="vertical" className="h-6 bg-white/20" />
      <TrustIndicator>
        <Zap className="w-5 h-5 mr-2" />
        Instant access
      </TrustIndicator>
    </div>
    
  </Container>
  
  {/* Decorative elements */}
  <FloatingOrb 
    className="absolute -bottom-32 -left-32 w-96 h-96
               bg-gradient-radial from-white/20 to-transparent
               blur-3xl animate-pulse"
  />
  <FloatingOrb 
    className="absolute -top-32 -right-32 w-96 h-96
               bg-gradient-radial from-white/20 to-transparent
               blur-3xl animate-pulse"
    delay={1}
  />
</Section>
```

---

### 🎯 2. Upload Page (`/upload`)

```tsx
<UploadPage className="min-h-screen bg-gradient-to-b from-white to-neutral-50 py-12">
  
  {/* Progress indicator at top */}
  <Container className="max-w-4xl mx-auto px-6 mb-8">
    <ProgressSteps 
      currentStep={1}
      steps={[
        { number: 1, label: 'Upload Photos', status: 'current' },
        { number: 2, label: 'Choose Plan', status: 'upcoming' },
        { number: 3, label: 'Select Templates', status: 'upcoming' },
        { number: 4, label: 'Checkout', status: 'upcoming' },
      ]}
    />
  </Container>
  
  <Container className="max-w-6xl mx-auto px-6">
    
    {/* Header */}
    <div className="text-center mb-12">
      <h1 className="text-5xl md:text-6xl font-bold mb-4">
        Upload Your{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          Best Photos
        </span>
      </h1>
      <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
        Upload 12-20 clear, front-facing photos for best results
      </p>
    </div>
    
    {/* Main upload area */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Upload zone - Takes 2 columns */}
      <div className="lg:col-span-2">
        <Card className="rounded-3xl border-2 border-dashed border-neutral-300
                         bg-white shadow-lg overflow-hidden
                         hover:border-primary-start hover:shadow-xl
                         transition-all duration-300">
          
          <DropZone 
            onDrop={handlePhotoDrop}
            className="p-12 text-center min-h-[400px] flex flex-col items-center justify-center"
          >
            {uploadedPhotos.length === 0 ? (
              <>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-start to-primary-end
                               flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
                  <Upload className="w-12 h-12 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                  Drop your photos here
                </h3>
                <p className="text-neutral-600 mb-6">
                  or click to browse your computer
                </p>
                
                <Button 
                  variant="gradient"
                  size="lg"
                  className="rounded-2xl shadow-lg shadow-primary/30"
                >
                  <Upload className="mr-2 w-5 h-5" />
                  Choose Photos
                </Button>
                
                <p className="mt-6 text-sm text-neutral-500">
                  Supports: JPG, PNG • Max 10MB per photo
                </p>
              </>
            ) : (
              <>
                {/* Photo grid */}
                <PhotoGrid className="grid grid-cols-4 gap-4 w-full mb-6">
                  {uploadedPhotos.map((photo, index) => (
                    <PhotoPreview 
                      key={index}
                      src={photo.preview}
                      onRemove={() => removePhoto(index)}
                      className="relative aspect-square rounded-2xl overflow-hidden
                                 shadow-md hover:shadow-xl
                                 group cursor-pointer
                                 transition-all duration-300"
                    >
                      <img 
                        src={photo.preview} 
                        className="w-full h-full object-cover
                                   group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full
                                   bg-red-500 text-white
                                   opacity-0 group-hover:opacity-100
                                   transition-opacity duration-200
                                   flex items-center justify-center
                                   hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {/* Quality indicator */}
                      <QualityBadge 
                        quality={photo.quality}
                        className="absolute bottom-2 left-2"
                      />
                    </PhotoPreview>
                  ))}
                  
                  {/* Add more photos card */}
                  {uploadedPhotos.length < 20 && (
                    <AddPhotoCard 
                      onClick={openFilePicker}
                      className="aspect-square rounded-2xl
                                 border-2 border-dashed border-neutral-300
                                 flex items-center justify-center
                                 hover:border-primary-start hover:bg-primary-50
                                 transition-colors duration-300
                                 cursor-pointer"
                    >
                      <Plus className="w-8 h-8 text-neutral-400" />
                    </AddPhotoCard>
                  )}
                </PhotoGrid>
                
                {/* Photo count */}
                <div className="text-center mb-6">
                  <p className="text-lg font-semibold text-neutral-900">
                    {uploadedPhotos.length} / 20 photos uploaded
                  </p>
                  <p className="text-sm text-neutral-600">
                    {uploadedPhotos.length < 12 && `Upload ${12 - uploadedPhotos.length} more for minimum`}
                    {uploadedPhotos.length >= 12 && uploadedPhotos.length < 20 && "Looking good! Upload more for better variety"}
                    {uploadedPhotos.length === 20 && "Perfect! Maximum photos reached"}
                  </p>
                </div>
                
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={openFilePicker}
                  className="rounded-2xl"
                >
                  <Plus className="mr-2 w-5 h-5" />
                  Add More Photos
                </Button>
              </>
            )}
          </DropZone>
          
        </Card>
      </div>
      
      {/* Guidelines sidebar */}
      <div className="lg:col-span-1">
        <Card className="rounded-3xl bg-white shadow-lg p-8 sticky top-24">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600
                           flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">
              Photo Guidelines
            </h3>
          </div>
          
          <GuidelineList className="space-y-4">
            <GuidelineItem>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-neutral-900">Clear & Front-Facing</h4>
                <p className="text-sm text-neutral-600">Face clearly visible, looking at camera</p>
              </div>
            </GuidelineItem>
            
            <GuidelineItem>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-neutral-900">Good Lighting</h4>
                <p className="text-sm text-neutral-600">Well-lit, avoid harsh shadows</p>
              </div>
            </GuidelineItem>
            
            <GuidelineItem>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-neutral-900">No Accessories</h4>
                <p className="text-sm text-neutral-600">Remove sunglasses, hats, masks</p>
              </div>
            </GuidelineItem>
            
            <GuidelineItem>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-neutral-900">Variety is Key</h4>
                <p className="text-sm text-neutral-600">Different angles, expressions, backgrounds</p>
              </div>
            </GuidelineItem>
            
            <GuidelineItem>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-neutral-900">Recent Photos</h4>
                <p className="text-sm text-neutral-600">Taken within the last year</p>
              </div>
            </GuidelineItem>
          </GuidelineList>
          
          <Separator className="my-6" />
          
          {/* Example photos */}
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-900 text-sm">Good Examples</h4>
            <div className="grid grid-cols-3 gap-2">
              <img src="/assets/examples/good-1.jpg" className="rounded-lg aspect-square object-cover" />
              <img src="/assets/examples/good-2.jpg" className="rounded-lg aspect-square object-cover" />
              <img src="/assets/examples/good-3.jpg" className="rounded-lg aspect-square object-cover" />
            </div>
          </div>
          
        </Card>
      </div>
      
    </div>
    
    {/* Continue button */}
    <div className="mt-12 flex justify-center">
      <Button 
        size="xl"
        variant="gradient"
        disabled={uploadedPhotos.length < 12}
        onClick={goToNextStep}
        className="px-12 py-5 text-xl rounded-2xl
                   shadow-2xl shadow-primary/30
                   disabled:opacity-50 disabled:cursor-not-allowed
                   group"
      >
        Continue to Plan Selection
        <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
    
  </Container>
  
</UploadPage>
```

---

### 📦 3. Plan Selection (Step 2)

```tsx
<PlanSelectionStep className="py-12 bg-gradient-to-b from-white to-neutral-50">
  
  <Container className="max-w-6xl mx-auto px-6">
    
    {/* Header */}
    <div className="text-center mb-12">
      <Badge variant="outline" className="mb-4">
        Step 2 of 4
      </Badge>
      <h2 className="text-5xl font-bold mb-4">
        Choose Your{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          Perfect Plan
        </span>
      </h2>
      <p className="text-xl text-neutral-600">
        All plans include high-resolution downloads and full commercial rights
      </p>
    </div>
    
    {/* Pricing cards - Same as homepage but with selection state */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      
      <PricingCard 
        selected={selectedPlan === 'basic'}
        onClick={() => setSelectedPlan('basic')}
        className={cn(
          "cursor-pointer transition-all duration-300",
          selectedPlan === 'basic' && "ring-4 ring-primary-start scale-105"
        )}
      >
        {/* Same pricing card content as homepage */}
      </PricingCard>
      
      <PricingCard 
        selected={selectedPlan === 'professional'}
        onClick={() => setSelectedPlan('professional')}
        featured
        className={cn(
          "cursor-pointer transition-all duration-300",
          selectedPlan === 'professional' && "ring-4 ring-white scale-110"
        )}
      >
        {/* Featured professional plan */}
      </PricingCard>
      
      <PricingCard 
        selected={selectedPlan === 'executive'}
        onClick={() => setSelectedPlan('executive')}
        className={cn(
          "cursor-pointer transition-all duration-300",
          selectedPlan === 'executive' && "ring-4 ring-primary-start scale-105"
        )}
      >
        {/* Executive plan */}
      </PricingCard>
      
    </div>
    
    {/* Comparison table toggle */}
    <div className="text-center mb-12">
      <Button 
        variant="ghost"
        onClick={() => setShowComparison(!showComparison)}
        className="rounded-2xl"
      >
        {showComparison ? 'Hide' : 'Show'} Detailed Comparison
        <ChevronDown className={cn(
          "ml-2 w-5 h-5 transition-transform",
          showComparison && "rotate-180"
        )} />
      </Button>
    </div>
    
    {/* Comparison table */}
    {showComparison && (
      <ComparisonTable className="mb-12 rounded-3xl bg-white shadow-xl overflow-hidden">
        {/* Full feature comparison */}
      </ComparisonTable>
    )}
    
    {/* Continue buttons */}
    <div className="flex items-center justify-between">
      <Button 
        variant="ghost"
        size="lg"
        onClick={goToPreviousStep}
        className="rounded-2xl"
      >
        <ArrowLeft className="mr-2 w-5 h-5" />
        Back to Photos
      </Button>
      
      <Button 
        size="xl"
        variant="gradient"
        disabled={!selectedPlan}
        onClick={goToNextStep}
        className="px-12 py-5 text-xl rounded-2xl shadow-2xl shadow-primary/30"
      >
        Continue to Templates
        <ArrowRight className="ml-2 w-6 h-6" />
      </Button>
    </div>
    
  </Container>
  
</PlanSelectionStep>
```

---

### 🎨 4. Template Selection (Step 3) - KEY DIFFERENTIATOR

```tsx
<TemplateSelectionStep className="py-12 bg-gradient-to-b from-neutral-50 to-white">
  
  <Container className="max-w-7xl mx-auto px-6">
    
    {/* Header */}
    <div className="text-center mb-12">
      <Badge variant="outline" className="mb-4">
        Step 3 of 4
      </Badge>
      <h2 className="text-5xl font-bold mb-4">
        Choose Your{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          Style Templates
        </span>
      </h2>
      <p className="text-xl text-neutral-600 mb-2">
        Select templates optimized for different platforms
      </p>
      <p className="text-lg text-neutral-500">
        You'll receive ~{Math.floor(selectedPlanConfig.headshots / selectedTemplates.length)} variations per template
      </p>
    </div>
    
    {/* Template grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      
      {Object.entries(STYLE_TEMPLATES).map(([id, template]) => (
        <TemplateSelectionCard
          key={id}
          template={template}
          selected={selectedTemplates.includes(id)}
          onToggle={() => toggleTemplate(id)}
          className={cn(
            "group relative overflow-hidden rounded-3xl",
            "bg-white shadow-lg cursor-pointer",
            "transition-all duration-500 ease-out",
            "hover:-translate-y-2 hover:shadow-2xl",
            selectedTemplates.includes(id) && [
              "ring-4 ring-primary-start scale-105",
              "shadow-xl shadow-primary/20"
            ]
          )}
        >
          {/* Preview image */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <img 
              src={template.preview}
              alt={template.name}
              className="w-full h-full object-cover
                         group-hover:scale-110 transition-transform duration-700"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Selection checkmark */}
            <div className={cn(
              "absolute top-4 right-4 w-10 h-10 rounded-full",
              "flex items-center justify-center",
              "transition-all duration-300",
              selectedTemplates.includes(id) 
                ? "bg-primary-start scale-100 opacity-100" 
                : "bg-white/30 backdrop-blur-sm scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100"
            )}>
              <Check className="w-6 h-6 text-white" />
            </div>
            
            {/* Popular badge */}
            {template.popular && (
              <Badge 
                variant="white"
                className="absolute top-4 left-4 bg-white/20 backdrop-blur-lg
                           border border-white/30 text-white font-bold"
              >
                <Star className="w-4 h-4 mr-1 fill-current" />
                Popular
              </Badge>
            )}
          </div>
          
          {/* Template info */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              {template.icon && <template.icon className="w-5 h-5 text-primary-start" />}
              <h3 className="text-xl font-bold text-neutral-900">
                {template.name}
              </h3>
            </div>
            
            <p className="text-neutral-600 text-sm mb-4">
              {template.description}
            </p>
            
            {/* Platform specs */}
            <div className="flex flex-wrap gap-2">
              <SpecBadge size="sm">
                {template.platformSpecs.aspectRatio}
              </SpecBadge>
              <SpecBadge size="sm">
                {template.platformSpecs.dimensions}
              </SpecBadge>
            </div>
            
            {/* Preview button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openTemplatePreview(template);
              }}
              className="w-full mt-4 rounded-xl
                         opacity-0 group-hover:opacity-100
                         transition-opacity duration-300"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Samples
            </Button>
          </div>
        </TemplateSelectionCard>
      ))}
      
    </div>
    
    {/* Selected summary */}
    <Card className="rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 p-8 mb-12">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
            {selectedTemplates.length} {selectedTemplates.length === 1 ? 'Template' : 'Templates'} Selected
          </h3>
          <p className="text-neutral-600 text-lg">
            You'll receive approximately{' '}
            <span className="font-bold text-primary-start">
              {Math.floor(selectedPlanConfig.headshots / selectedTemplates.length)}
            </span>
            {' '}headshot variations per template
          </p>
        </div>
        
        {selectedTemplates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTemplates.map(templateId => {
              const template = STYLE_TEMPLATES[templateId];
              return (
                <Badge 
                  key={templateId}
                  variant="white"
                  className="bg-white/80 backdrop-blur-sm px-4 py-2 text-sm"
                >
                  {template.icon && <template.icon className="w-4 h-4 mr-2" />}
                  {template.name}
                  <button
                    onClick={() => toggleTemplate(templateId)}
                    className="ml-2 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </Card>
    
    {/* Continue buttons */}
    <div className="flex items-center justify-between">
      <Button 
        variant="ghost"
        size="lg"
        onClick={goToPreviousStep}
        className="rounded-2xl"
      >
        <ArrowLeft className="mr-2 w-5 h-5" />
        Back to Plans
      </Button>
      
      <Button 
        size="xl"
        variant="gradient"
        disabled={selectedTemplates.length === 0}
        onClick={goToCheckout}
        className="px-12 py-5 text-xl rounded-2xl shadow-2xl shadow-primary/30
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Checkout
        <ArrowRight className="ml-2 w-6 h-6" />
      </Button>
    </div>
    
  </Container>
  
  {/* Template Preview Modal */}
  <TemplatePreviewModal
    isOpen={previewModalOpen}
    onClose={() => setPreviewModalOpen(false)}
    template={selectedTemplateForPreview}
  >
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {selectedTemplateForPreview?.icon && (
            <selectedTemplateForPreview.icon className="w-8 h-8 text-primary-start" />
          )}
          <h2 className="text-4xl font-bold text-neutral-900">
            {selectedTemplateForPreview?.name}
          </h2>
        </div>
        <p className="text-xl text-neutral-600">
          {selectedTemplateForPreview?.description}
        </p>
      </div>
      
      {/* Before/After comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Before</h3>
          <img 
            src="/assets/samples/before-generic.jpg"
            className="rounded-2xl shadow-xl"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">After</h3>
          <img 
            src={selectedTemplateForPreview?.preview}
            className="rounded-2xl shadow-xl"
          />
        </div>
      </div>
      
      {/* Sample variations */}
      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-6">
          Sample Variations
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <img
              key={i}
              src={`/assets/variations/${selectedTemplateForPreview?.id}-${i}.jpg`}
              className="rounded-xl shadow-lg aspect-square object-cover
                         hover:scale-105 transition-transform duration-300"
            />
          ))}
        </div>
      </div>
    </div>
  </TemplatePreviewModal>
  
</TemplateSelectionStep>
```

---

I've created a comprehensive redesign prompt that transforms your MYDSCVR Headshot Hub with Gamma.app's stunning design language! 

**Key highlights of this redesign:**

1. **🎨 Gamma-Inspired Aesthetics:**
   - Generous white space & breathing room
   - Soft, sophisticated gradients everywhere
   - Floating cards with elevation
   - Glass morphism effects
   - Butter-smooth animations (300-400ms)
   - Large, bold typography
   - Gradient mesh backgrounds

2. **🌟 Brand Identity:**
   - Purple-to-blue primary gradient (#6366F1 → #8B5CF6)
   - Professional blue secondary
   - Emerald green accents
   - Clean neutral palette
   - Inter + Cal Sans typography

3. **📱 Page Redesigns:**
   - **Homepage**: Massive hero, before/after showcases, Bento grid features, platform templates, pricing with gradients
   - **Upload Page**: Drag & drop with photo guidelines, quality indicators, smooth progress
   - **Plan Selection**: Interactive pricing cards with selection states
   - **Template Selection**: THE KEY DIFFERENTIATOR - 8 platform-optimized templates with previews

4. **✨ Unique Features:**
   - Platform preview mockups (LinkedIn, Resume, Corporate, etc.)
   - Before/after sliders on every template
   - Bento-style feature grids
   - Infinite scroll testimonials (marquee)
   - Floating gradient orbs
   - Micro-interactions everywhere

The prompt is ready to paste into Claude Code. It includes:
- Complete component structures
- Design system with CSS variables
- Detailed layouts for every page
- Gamma-style spacing, shadows, and animations
- Instructions to use Gemini API for sample image generation

Would you like me to:
1. Create additional pages (Dashboard, Batch View, Processing)?
2. Add more specific component implementations?
3. Create the actual React components with Tailwind?
4. Generate sample images using Gemini for the mockups?