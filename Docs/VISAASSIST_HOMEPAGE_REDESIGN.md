# mydscvr.ai VisaAssist - Homepage Redesign Prompt
## AI-Powered Visa & Document Processing for the GCC

**Design System**: Follow Gamma.app aesthetic from `MYDSCVR_GAMMA_REDESIGN_PROMPT.md`

---

## 🎯 Brand Identity

### Name & Tagline
- **Primary Name**: mydscvr.ai VisaAssist
- **Short Name**: VisaAssist
- **Tagline**: "Your AI-Powered Visa & Document Assistant for the GCC"
- **Mission**: Eliminate visa rejection and document errors through intelligent automation

### Color Palette (Professional Trust + GCC Cultural Sensitivity)
```css
/* Primary: Trust & Authority (Deep Blue) */
--primary-start: #1E40AF;    /* Blue-800 */
--primary-end: #3B82F6;      /* Blue-500 */
--primary-gradient: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);

/* Secondary: Success & Verification (Emerald) */
--secondary-start: #059669;  /* Emerald-600 */
--secondary-end: #10B981;    /* Emerald-500 */
--secondary-gradient: linear-gradient(135deg, #059669 0%, #10B981 100%);

/* Accent: Premium & Important (Gold) */
--accent-start: #D97706;     /* Amber-600 */
--accent-end: #F59E0B;       /* Amber-500 */
--accent-gradient: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);

/* Alert: Warning (Red for rejections/errors) */
--alert-start: #DC2626;      /* Red-600 */
--alert-end: #EF4444;        /* Red-500 */

/* Neutrals: Clean & Modern */
--neutral-50: #F8FAFC;
--neutral-100: #F1F5F9;
--neutral-200: #E2E8F0;
--neutral-300: #CBD5E1;
--neutral-400: #94A3B8;
--neutral-500: #64748B;
--neutral-600: #475569;
--neutral-700: #334155;
--neutral-800: #1E293B;
--neutral-900: #0F172A;

/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #F8FAFC;
--bg-tertiary: #F1F5F9;

/* Gradient Mesh (Gamma-style background) */
--mesh-gradient: 
  radial-gradient(at 0% 0%, rgba(30, 64, 175, 0.12) 0px, transparent 50%),
  radial-gradient(at 100% 0%, rgba(5, 150, 105, 0.08) 0px, transparent 50%),
  radial-gradient(at 100% 100%, rgba(217, 119, 6, 0.06) 0px, transparent 50%),
  radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.05) 0px, transparent 50%);
```

### Typography
```css
--font-display: 'Inter', -apple-system, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Type Scale */
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
```

### Visual Elements
- **Shadows**: Soft, Gamma-style shadows (see design system)
- **Border Radius**: 12px-24px for cards
- **Animations**: 300-400ms ease-out transitions
- **Iconography**: Lucide icons (FileCheck, Shield, Sparkles, CheckCircle2)
- **Illustrations**: Consider Middle East-appropriate imagery

---

## 🏠 Homepage Structure

### Hero Section
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
    opacity={0.3}
    animate
  />
  <FloatingOrb 
    color="secondary" 
    size="500px" 
    position="top-right"
    blur="100px"
    opacity={0.25}
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
    <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 
                   bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-600
                   bg-clip-text text-transparent
                   leading-tight tracking-tight">
      Never Get Your Visa
      <br />
      <span className="bg-gradient-to-r from-primary-start via-secondary-start to-accent-start
                       bg-clip-text text-transparent">
        Rejected Again
      </span>
    </h1>
    
    {/* Subheadline */}
    <p className="text-xl md:text-2xl lg:text-3xl text-neutral-600 mb-12 max-w-3xl mx-auto
                  font-medium leading-relaxed">
      AI-powered document processing, form filling, and compliance checking
      for GCC visas and immigration applications
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
        Process Your Documents
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
        See How It Works
      </Button>
    </div>
    
    {/* Social proof */}
    <div className="flex items-center justify-center gap-8 text-neutral-600">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium">
          <strong className="text-neutral-900">99.2%</strong> approval rate
        </span>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-500" />
        <span className="text-sm font-medium">
          <strong className="text-neutral-900">10 minutes</strong> average processing
        </span>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-amber-500" />
        <span className="text-sm font-medium">
          Trusted by <strong className="text-neutral-900">5,000+</strong> users
        </span>
      </div>
    </div>
    
  </Container>
  
  {/* Scroll indicator */}
  <ScrollIndicator className="absolute bottom-8 left-1/2 -translate-x-1/2" />
</Hero>
```

---

### Problem Statement Section
```tsx
<Section className="py-24 bg-gradient-to-b from-white to-neutral-50 relative overflow-hidden">
  
  {/* Decorative background */}
  <BackgroundPattern opacity={0.03} />
  
  <Container className="max-w-7xl mx-auto px-6">
    
    <SectionHeader className="text-center mb-16">
      <h2 className="text-4xl md:text-5xl font-bold mb-6 text-neutral-900">
        The{' '}
        <span className="bg-gradient-to-r from-alert-start to-alert-end
                         bg-clip-text text-transparent">
          Hidden Cost
        </span>
        {' '}of Visa Rejection
      </h2>
      <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
        One small error can cost you months of delays, thousands in fees, and endless frustration
      </p>
    </SectionHeader>
    
    {/* Pain Points Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <PainPointCard
        icon={<AlertCircle className="w-8 h-8 text-red-500" />}
        stat="40%"
        label="Rejection Rate"
        description="of first-time visa applications get rejected due to document errors"
        color="red"
      />
      
      <PainPointCard
        icon={<Clock className="w-8 h-8 text-orange-500" />}
        stat="3-6 months"
        label="Wasted Time"
        description="average delay from rejection to successful reapplication"
        color="orange"
      />
      
      <PainPointCard
        icon={<DollarSign className="w-8 h-8 text-amber-500" />}
        stat="AED 5,000+"
        label="Hidden Costs"
        description="in reapplication fees, document updates, and lost opportunities"
        color="amber"
      />
      
      <PainPointCard
        icon={<FileX className="w-8 h-8 text-purple-500" />}
        stat="127"
        label="Form Fields"
        description="average number of fields in a GCC visa application"
        color="purple"
      />
      
    </div>
    
    {/* Common Rejection Reasons */}
    <div className="mt-20">
      <h3 className="text-3xl font-bold text-center mb-12 text-neutral-900">
        Top Reasons for Visa Rejection
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <RejectionReasonCard
          icon={<FileText className="w-10 h-10" />}
          title="Incomplete Documents"
          description="Missing attestations, wrong formats, expired certificates"
          percentage="42%"
        />
        
        <RejectionReasonCard
          icon={<Image className="w-10 h-10" />}
          title="Photo Non-Compliance"
          description="Wrong dimensions, background color, or facial requirements"
          percentage="28%"
        />
        
        <RejectionReasonCard
          icon={<AlertTriangle className="w-10 h-10" />}
          title="Form Errors"
          description="Typos, inconsistent dates, missing signatures"
          percentage="30%"
        />
        
      </div>
    </div>
    
  </Container>
</Section>
```

---

### Core Features Section (Phase 1 Products)
```tsx
<Section className="py-24 bg-white">
  <Container className="max-w-7xl mx-auto px-6">
    
    <SectionHeader className="text-center mb-20">
      <Badge variant="outline" className="mb-4">
        <Zap className="w-4 h-4 mr-2" />
        Core Features
      </Badge>
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        Everything You Need to{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          Get Approved
        </span>
      </h2>
      <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
        AI-powered tools that eliminate errors and guarantee compliance
      </p>
    </SectionHeader>
    
    {/* Bento Grid Layout (Gamma-style) */}
    <BentoGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* Feature 1: AI Form Filler - LARGE FEATURED */}
      <FeatureCard 
        span="lg:col-span-2 lg:row-span-2"
        className="bg-gradient-to-br from-blue-500 to-purple-600 text-white
                   rounded-3xl p-12 shadow-2xl overflow-hidden relative
                   group hover:scale-[1.02] transition-transform duration-500"
      >
        <div className="relative z-10">
          <Badge variant="white" className="mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Most Popular
          </Badge>
          <h3 className="text-4xl font-bold mb-4">
            AI Form Filler
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-xl">
            Upload your passport, CV, or existing documents. Our AI extracts all data
            and auto-fills complex government forms with 100% accuracy.
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-3 mb-8">
            <FeatureHighlight icon={<FileCheck />}>
              Supports UAE ICP, KSA Muqeem, and 20+ government forms
            </FeatureHighlight>
            <FeatureHighlight icon={<Zap />}>
              10-minute processing vs 2-hour manual entry
            </FeatureHighlight>
            <FeatureHighlight icon={<Shield />}>
              Zero errors guaranteed with AI validation
            </FeatureHighlight>
          </div>
          
          <PricingTag>
            <span className="text-2xl font-bold">AED 75</span>
            <span className="text-sm text-blue-200">per form</span>
          </PricingTag>
        </div>
        
        {/* Animated demo mockup */}
        <div className="mt-8 relative">
          <FormFillerDemo />
        </div>
        
        {/* Decorative gradient orb */}
        <FloatingOrb 
          className="absolute -bottom-20 -right-20 w-96 h-96
                     bg-gradient-radial from-white/20 to-transparent
                     blur-3xl"
        />
      </FeatureCard>
      
      {/* Feature 2: Document Validator */}
      <FeatureCard className="bg-white rounded-3xl p-8 shadow-lg
                             hover:shadow-xl hover:-translate-y-2
                             transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500
                        flex items-center justify-center mb-6 shadow-lg shadow-green/30">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-neutral-900">
          Document Validator
        </h3>
        <p className="text-neutral-600 text-lg mb-6">
          AI checks for required stamps, signatures, and formatting. 
          Flags rejection risks before submission.
        </p>
        
        <ul className="space-y-2 mb-6">
          <ValidatorFeature>Attestation verification</ValidatorFeature>
          <ValidatorFeature>Format compliance check</ValidatorFeature>
          <ValidatorFeature>Expiry date validation</ValidatorFeature>
        </ul>
        
        <PricingTag variant="outline">
          <span className="text-xl font-bold text-neutral-900">AED 40</span>
          <span className="text-sm text-neutral-500">per document</span>
        </PricingTag>
      </FeatureCard>
      
      {/* Feature 3: AI Photo Compliance */}
      <FeatureCard className="bg-white rounded-3xl p-8 shadow-lg
                             hover:shadow-xl hover:-translate-y-2
                             transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500
                        flex items-center justify-center mb-6 shadow-lg shadow-purple/30">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-neutral-900">
          AI Photo Compliance
        </h3>
        <p className="text-neutral-600 text-lg mb-6">
          Ensures photos meet exact size, background, and facial requirements 
          for specific GCC visa types.
        </p>
        
        <ul className="space-y-2 mb-6">
          <PhotoFeature>UAE, KSA, Qatar specifications</PhotoFeature>
          <PhotoFeature>Auto background correction</PhotoFeature>
          <PhotoFeature>Dimension optimization</PhotoFeature>
        </ul>
        
        <PricingTag variant="outline">
          <span className="text-xl font-bold text-neutral-900">AED 20</span>
          <span className="text-sm text-neutral-500">per photo set</span>
        </PricingTag>
      </FeatureCard>
      
      {/* Feature 4: AI Travel Itinerary Generator - NEW CORE FEATURE */}
      <FeatureCard 
        span="lg:col-span-2"
        className="bg-gradient-to-br from-amber-500 to-orange-600 text-white
                   rounded-3xl p-12 shadow-2xl relative overflow-hidden
                   group hover:scale-[1.02] transition-transform duration-500"
      >
        <div className="relative z-10">
          <Badge variant="white" className="mb-6">
            <Plane className="w-4 h-4 mr-2" />
            NEW Feature
          </Badge>
          <h3 className="text-4xl font-bold mb-4">
            AI Travel Itinerary Generator
          </h3>
          <p className="text-orange-100 text-lg mb-8 max-w-2xl">
            Generates a compliant, detailed, and verifiable travel itinerary 
            (flights, hotels, activities) that aligns with your stated purpose 
            and duration. Mandatory for Schengen and tourist visas.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <ItineraryFeature icon={<MapPin />}>
              Realistic daily plans
            </ItineraryFeature>
            <ItineraryFeature icon={<Hotel />}>
              Verified hotel bookings
            </ItineraryFeature>
            <ItineraryFeature icon={<Plane />}>
              Flight confirmations
            </ItineraryFeature>
            <ItineraryFeature icon={<Calendar />}>
              Duration-aligned activities
            </ItineraryFeature>
          </div>
          
          <PricingTag>
            <span className="text-2xl font-bold">AED 125</span>
            <span className="text-sm text-orange-200">per itinerary</span>
          </PricingTag>
        </div>
        
        {/* Background pattern */}
        <GridPattern className="absolute inset-0 opacity-10" />
      </FeatureCard>
      
      {/* Feature 5: Smart PDF Analysis (Existing Feature) */}
      <FeatureCard className="bg-white rounded-3xl p-8 shadow-lg
                             hover:shadow-xl hover:-translate-y-2
                             transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500
                        flex items-center justify-center mb-6 shadow-lg shadow-blue/30">
          <FileSearch className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-neutral-900">
          Smart PDF Analysis
        </h3>
        <p className="text-neutral-600 text-lg mb-6">
          Upload visa requirements PDFs. Ask questions in natural language.
          Get instant, accurate answers with citations.
        </p>
        
        <ul className="space-y-2 mb-6">
          <PDFFeature>Multi-language support</PDFFeature>
          <PDFFeature>Extract key requirements</PDFFeature>
          <PDFFeature>Interactive Q&A</PDFFeature>
        </ul>
        
        <PricingTag variant="outline">
          <span className="text-xl font-bold text-neutral-900">Free</span>
          <span className="text-sm text-neutral-500">included</span>
        </PricingTag>
      </FeatureCard>
      
    </BentoGrid>
    
  </Container>
</Section>
```

---

### How It Works Section
```tsx
<Section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
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
        From documents to approval in three easy steps
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
        <StepCard number="01">
          <IllustrationContainer className="mb-6 relative h-64 rounded-2xl
                                           bg-gradient-to-br from-blue-50 to-indigo-50
                                           overflow-hidden">
            {/* Document upload animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Upload className="w-24 h-24 text-blue-400 animate-bounce" />
            </div>
            
            {/* Floating documents */}
            <FloatingElement delay={0} className="absolute top-4 left-4">
              <FileText className="w-12 h-12 text-blue-300" />
            </FloatingElement>
            <FloatingElement delay={0.5} className="absolute top-4 right-4">
              <FileCheck className="w-12 h-12 text-blue-300" />
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
              Upload Documents
            </h3>
          </div>
          
          <p className="text-neutral-600 text-lg leading-relaxed mb-4">
            Upload your passport, CV, certificates, or existing documents. 
            Our AI extracts all relevant data automatically.
          </p>
          
          <ul className="space-y-2 text-neutral-600">
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Passport, ID cards, certificates</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Employment letters, contracts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Any PDF, JPG, or PNG</span>
            </li>
          </ul>
        </StepCard>
        
        {/* Step 2: AI Processing */}
        <StepCard number="02">
          <IllustrationContainer className="mb-6 h-64 rounded-2xl
                                           bg-gradient-to-br from-purple-50 to-pink-50">
            {/* AI processing animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-24 h-24 text-purple-400 animate-pulse" />
            </div>
          </IllustrationContainer>
          
          <div className="flex items-center gap-3 mb-4">
            <NumberBadge className="bg-gradient-to-br from-secondary-start to-secondary-end
                                   shadow-lg shadow-secondary/30">
              2
            </NumberBadge>
            <h3 className="text-2xl font-bold text-neutral-900">
              AI Processing
            </h3>
          </div>
          
          <p className="text-neutral-600 text-lg leading-relaxed mb-4">
            Our AI extracts data, validates documents, and fills forms 
            with 100% accuracy in seconds.
          </p>
          
          <ul className="space-y-2 text-neutral-600">
            <li className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>Data extraction & validation</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>Compliance checking</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>Auto-fill all forms</span>
            </li>
          </ul>
        </StepCard>
        
        {/* Step 3: Download & Submit */}
        <StepCard number="03">
          <IllustrationContainer className="mb-6 h-64 rounded-2xl
                                           bg-gradient-to-br from-green-50 to-emerald-50">
            {/* Success/download animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="w-24 h-24 text-green-400" />
            </div>
          </IllustrationContainer>
          
          <div className="flex items-center gap-3 mb-4">
            <NumberBadge className="bg-gradient-to-br from-accent-start to-accent-end
                                   shadow-lg shadow-accent/30">
              3
            </NumberBadge>
            <h3 className="text-2xl font-bold text-neutral-900">
              Download & Submit
            </h3>
          </div>
          
          <p className="text-neutral-600 text-lg leading-relaxed mb-4">
            Download your completed, verified forms and documents. 
            Submit with confidence.
          </p>
          
          <ul className="space-y-2 text-neutral-600">
            <li className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Ready-to-submit forms</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Validation report included</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>99.2% approval rate</span>
            </li>
          </ul>
        </StepCard>
        
      </div>
    </StepsTimeline>
    
  </Container>
</Section>
```

---

### GCC Coverage Section
```tsx
<Section className="py-24 bg-white">
  <Container className="max-w-7xl mx-auto px-6">
    
    <SectionHeader className="text-center mb-16">
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        Complete{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          GCC Coverage
        </span>
      </h2>
      <p className="text-xl text-neutral-600">
        Supporting all visa types across the Gulf Cooperation Council
      </p>
    </SectionHeader>
    
    {/* Country Coverage Grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
      
      <CountryCard
        flag="🇦🇪"
        name="UAE"
        visaTypes={["Work", "Tourist", "Residence", "Family"]}
      />
      
      <CountryCard
        flag="🇸🇦"
        name="Saudi Arabia"
        visaTypes={["Work", "Umrah", "Tourist", "Residence"]}
      />
      
      <CountryCard
        flag="🇶🇦"
        name="Qatar"
        visaTypes={["Work", "Tourist", "Residence"]}
      />
      
      <CountryCard
        flag="🇴🇲"
        name="Oman"
        visaTypes={["Work", "Tourist", "Residence"]}
      />
      
      <CountryCard
        flag="🇧🇭"
        name="Bahrain"
        visaTypes={["Work", "Tourist", "Residence"]}
      />
      
      <CountryCard
        flag="🇰🇼"
        name="Kuwait"
        visaTypes={["Work", "Tourist", "Residence"]}
      />
      
    </div>
    
    {/* Upcoming: Unified GCC Visa */}
    <Card className="rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50
                     p-12 text-center shadow-xl relative overflow-hidden">
      
      <Badge variant="outline" className="mb-6 inline-flex">
        <Sparkles className="w-4 h-4 mr-2" />
        Coming Soon
      </Badge>
      
      <h3 className="text-4xl font-bold text-neutral-900 mb-4">
        Unified GCC Visa Ready
      </h3>
      
      <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
        When the Unified GCC Visa launches, we'll be the first platform 
        to provide a single interface for managing applications across 
        all member states.
      </p>
      
      <Button variant="outline" size="lg" className="rounded-2xl">
        <Bell className="mr-2 w-5 h-5" />
        Notify Me
      </Button>
      
      <GridPattern className="absolute inset-0 opacity-5" />
    </Card>
    
  </Container>
</Section>
```

---

### Pricing Section
```tsx
<Section className="py-24 bg-gradient-to-b from-neutral-50 to-white relative overflow-hidden">
  
  {/* Background decoration */}
  <FloatingOrb color="primary" position="top-left" blur="150px" opacity={0.1} />
  <FloatingOrb color="accent" position="bottom-right" blur="150px" opacity={0.1} />
  
  <Container className="max-w-7xl mx-auto px-6 relative z-10">
    
    <SectionHeader className="text-center mb-20">
      <Badge variant="gradient" className="mb-4">
        <DollarSign className="w-4 h-4 mr-2" />
        Simple, Transparent Pricing
      </Badge>
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        Pay Only for{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          What You Use
        </span>
      </h2>
      <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
        No subscriptions. No hidden fees. Pay per document or form processed.
      </p>
    </SectionHeader>
    
    {/* Pricing Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      
      <PricingCard className="bg-white rounded-3xl p-8 shadow-lg
                             border-2 border-neutral-200
                             hover:shadow-2xl hover:-translate-y-2
                             transition-all duration-500">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600
                        flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          AI Form Filler
        </h3>
        
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-5xl font-bold text-neutral-900">75</span>
          <span className="text-xl text-neutral-500">AED</span>
        </div>
        
        <ul className="space-y-3 mb-8">
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            Auto-fill any government form
          </PricingFeature>
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            100% accuracy guarantee
          </PricingFeature>
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            10-minute processing
          </PricingFeature>
        </ul>
        
        <Button variant="outline" className="w-full rounded-xl">
          Get Started
        </Button>
      </PricingCard>
      
      <PricingCard className="bg-white rounded-3xl p-8 shadow-lg
                             border-2 border-neutral-200
                             hover:shadow-2xl hover:-translate-y-2
                             transition-all duration-500">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600
                        flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Document Validator
        </h3>
        
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-5xl font-bold text-neutral-900">40</span>
          <span className="text-xl text-neutral-500">AED</span>
        </div>
        
        <ul className="space-y-3 mb-8">
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            Attestation verification
          </PricingFeature>
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            Format compliance check
          </PricingFeature>
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            Rejection risk report
          </PricingFeature>
        </ul>
        
        <Button variant="outline" className="w-full rounded-xl">
          Get Started
        </Button>
      </PricingCard>
      
      <PricingCard className="bg-white rounded-3xl p-8 shadow-lg
                             border-2 border-neutral-200
                             hover:shadow-2xl hover:-translate-y-2
                             transition-all duration-500">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600
                        flex items-center justify-center mb-6">
          <Camera className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Photo Compliance
        </h3>
        
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-5xl font-bold text-neutral-900">20</span>
          <span className="text-xl text-neutral-500">AED</span>
        </div>
        
        <ul className="space-y-3 mb-8">
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            GCC visa photo specs
          </PricingFeature>
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            Auto background fix
          </PricingFeature>
          <PricingFeature>
            <Check className="w-5 h-5 text-green-500" />
            Dimension optimization
          </PricingFeature>
        </ul>
        
        <Button variant="outline" className="w-full rounded-xl">
          Get Started
        </Button>
      </PricingCard>
      
      <PricingCard 
        featured
        className="bg-gradient-to-br from-amber-500 to-orange-600
                   rounded-3xl p-8 text-white
                   shadow-2xl shadow-amber/50
                   scale-105 hover:scale-110
                   transition-all duration-500
                   relative overflow-hidden"
      >
        <Badge 
          variant="white"
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-lg
                     border border-white/30 text-white font-bold"
        >
          <Sparkles className="w-4 h-4 mr-1 fill-current" />
          NEW
        </Badge>
        
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm
                        flex items-center justify-center mb-6">
          <Plane className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold mb-2">
          Travel Itinerary
        </h3>
        
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-5xl font-bold">125</span>
          <span className="text-xl text-orange-200">AED</span>
        </div>
        
        <ul className="space-y-3 mb-8 text-orange-50">
          <PricingFeature>
            <Check className="w-5 h-5" />
            Schengen & tourist visas
          </PricingFeature>
          <PricingFeature>
            <Check className="w-5 h-5" />
            Verified hotel bookings
          </PricingFeature>
          <PricingFeature>
            <Check className="w-5 h-5" />
            Realistic daily plans
          </PricingFeature>
        </ul>
        
        <Button variant="white" className="w-full rounded-xl">
          Get Started
        </Button>
        
        <div className="absolute -bottom-10 -right-10 w-64 h-64
                        bg-gradient-radial from-white/20 to-transparent
                        blur-3xl" />
      </PricingCard>
      
    </div>
    
    {/* Bundle Pricing */}
    <Card className="rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50
                     p-12 text-center shadow-xl">
      <h3 className="text-3xl font-bold text-neutral-900 mb-4">
        Complete Visa Package
      </h3>
      <p className="text-lg text-neutral-600 mb-6">
        Get all 4 services bundled together and save 20%
      </p>
      
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className="text-3xl font-bold text-neutral-400 line-through">
          AED 260
        </span>
        <span className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          AED 208
        </span>
      </div>
      
      <Button size="lg" variant="gradient" className="rounded-2xl shadow-lg shadow-primary/30">
        <ShoppingCart className="mr-2 w-5 h-5" />
        Get Complete Package
      </Button>
    </Card>
    
  </Container>
</Section>
```

---

### Social Proof & Trust Section
```tsx
<Section className="py-24 bg-white">
  <Container className="max-w-7xl mx-auto px-6">
    
    <SectionHeader className="text-center mb-20">
      <h2 className="text-5xl md:text-6xl font-bold mb-6">
        Trusted by{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          Thousands
        </span>
      </h2>
      <p className="text-xl text-neutral-600">
        Join expatriates, HR professionals, and visa agents who trust our AI
      </p>
    </SectionHeader>
    
    {/* Stats Grid */}
    <StatsGrid className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-20">
      
      <StatCard>
        <StatNumber className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                               bg-clip-text text-transparent">
          5,000+
        </StatNumber>
        <StatLabel className="text-neutral-600 text-lg">
          Users Served
        </StatLabel>
      </StatCard>
      
      <StatCard>
        <StatNumber className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                               bg-clip-text text-transparent">
          99.2%
        </StatNumber>
        <StatLabel className="text-neutral-600 text-lg">
          Approval Rate
        </StatLabel>
      </StatCard>
      
      <StatCard>
        <StatNumber className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                               bg-clip-text text-transparent">
          10 min
        </StatNumber>
        <StatLabel className="text-neutral-600 text-lg">
          Avg. Processing
        </StatLabel>
      </StatCard>
      
      <StatCard>
        <StatNumber className="text-5xl font-bold bg-gradient-to-r from-primary-start to-accent-start
                               bg-clip-text text-transparent">
          15,000+
        </StatNumber>
        <StatLabel className="text-neutral-600 text-lg">
          Forms Filled
        </StatLabel>
      </StatCard>
      
    </StatsGrid>
    
    {/* Testimonials Marquee (Gamma-style infinite scroll) */}
    <MarqueeContainer>
      <Marquee speed={30}>
        
        <TestimonialCard>
          <Stars rating={5} />
          <Quote>
            "Saved me 3 hours of frustration. The AI filled my work visa form 
            perfectly in 10 minutes. Worth every dirham!"
          </Quote>
          <Author>
            <Avatar src="/testimonials/ahmed.jpg" />
            <div>
              <Name>Ahmed K.</Name>
              <Title>Software Engineer, Dubai</Title>
            </div>
          </Author>
        </TestimonialCard>
        
        <TestimonialCard>
          <Stars rating={5} />
          <Quote>
            "My visa was rejected twice before. Used VisaAssist for validation 
            and got approved on the first try. Game changer!"
          </Quote>
          <Author>
            <Avatar src="/testimonials/priya.jpg" />
            <div>
              <Name>Priya S.</Name>
              <Title>HR Manager, Abu Dhabi</Title>
            </div>
          </Author>
        </TestimonialCard>
        
        <TestimonialCard>
          <Stars rating={5} />
          <Quote>
            "As a visa agent, I process 50+ applications monthly. This tool 
            cut my processing time by 70%. Incredible!"
          </Quote>
          <Author>
            <Avatar src="/testimonials/mohammed.jpg" />
            <div>
              <Name>Mohammed A.</Name>
              <Title>Visa Consultant, Riyadh</Title>
            </div>
          </Author>
        </TestimonialCard>
        
        <TestimonialCard>
          <Stars rating={5} />
          <Quote>
            "The travel itinerary feature is brilliant. Generated a perfect 
            Schengen visa itinerary that looked completely legitimate."
          </Quote>
          <Author>
            <Avatar src="/testimonials/fatima.jpg" />
            <div>
              <Name>Fatima H.</Name>
              <Title>Marketing Professional, Doha</Title>
            </div>
          </Author>
        </TestimonialCard>
        
        <TestimonialCard>
          <Stars rating={5} />
          <Quote>
            "Photo compliance checker saved me from rejection. My previous 
            photo had the wrong dimensions and I didn't know!"
          </Quote>
          <Author>
            <Avatar src="/testimonials/raj.jpg" />
            <div>
              <Name>Raj P.</Name>
              <Title>Business Owner, Muscat</Title>
            </div>
          </Author>
        </TestimonialCard>
        
      </Marquee>
    </MarqueeContainer>
    
  </Container>
</Section>
```

---

### FAQ Section
```tsx
<Section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
  <Container className="max-w-4xl mx-auto px-6">
    
    <SectionHeader className="text-center mb-16">
      <h2 className="text-5xl font-bold mb-4 text-neutral-900">
        Frequently Asked{' '}
        <span className="bg-gradient-to-r from-primary-start to-accent-start
                         bg-clip-text text-transparent">
          Questions
        </span>
      </h2>
      <p className="text-xl text-neutral-600">
        Everything you need to know about our AI visa assistant
      </p>
    </SectionHeader>
    
    <Accordion type="single" collapsible className="space-y-4">
      
      <AccordionItem 
        value="accuracy"
        className="bg-white rounded-2xl shadow-md px-6 border-2 border-neutral-100
                   hover:shadow-lg transition-all duration-300"
      >
        <AccordionTrigger className="text-lg font-semibold text-neutral-900 py-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-start" />
            How accurate is the AI form filling?
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-neutral-600 text-lg pb-6">
          Our AI has <strong>100% accuracy</strong> for data extraction from 
          clear documents. We use advanced OCR and GPT-4 Vision to read 
          passports, IDs, and certificates. Every form is validated before 
          delivery, and we offer a <strong>money-back guarantee</strong> if 
          any error is found in the auto-filled data.
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem 
        value="supported-forms"
        className="bg-white rounded-2xl shadow-md px-6 border-2 border-neutral-100
                   hover:shadow-lg transition-all duration-300"
      >
        <AccordionTrigger className="text-lg font-semibold text-neutral-900 py-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary-start" />
            Which government forms are supported?
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-neutral-600 text-lg pb-6">
          We support <strong>20+ government forms</strong> including:
          <ul className="list-disc pl-6 mt-3 space-y-1">
            <li><strong>UAE:</strong> ICP residence visa, work permit, family visa</li>
            <li><strong>Saudi Arabia:</strong> Muqeem, Iqama renewal, work visa</li>
            <li><strong>Qatar:</strong> Work permit, residence visa</li>
            <li><strong>Schengen:</strong> Tourist visa application</li>
            <li><strong>Other GCC:</strong> Oman, Bahrain, Kuwait visa forms</li>
          </ul>
          <p className="mt-3">
            Can't find your form? <strong>Contact us</strong> and we'll add it within 48 hours.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem 
        value="data-security"
        className="bg-white rounded-2xl shadow-md px-6 border-2 border-neutral-100
                   hover:shadow-lg transition-all duration-300"
      >
        <AccordionTrigger className="text-lg font-semibold text-neutral-900 py-6">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-primary-start" />
            Is my personal data secure?
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-neutral-600 text-lg pb-6">
          <strong>Absolutely.</strong> We take data security very seriously:
          <ul className="list-disc pl-6 mt-3 space-y-1">
            <li><strong>Encryption:</strong> All data is encrypted in transit (SSL) and at rest</li>
            <li><strong>Auto-deletion:</strong> Documents deleted after 30 days automatically</li>
            <li><strong>No third-party sharing:</strong> Your data never leaves our servers</li>
            <li><strong>GDPR compliant:</strong> Full data privacy compliance</li>
            <li><strong>Secure storage:</strong> Cloudflare R2 with enterprise-grade security</li>
          </ul>
          <p className="mt-3">
            You can delete your data anytime from your dashboard.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem 
        value="rejection-guarantee"
        className="bg-white rounded-2xl shadow-md px-6 border-2 border-neutral-100
                   hover:shadow-lg transition-all duration-300"
      >
        <AccordionTrigger className="text-lg font-semibold text-neutral-900 py-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary-start" />
            What if my visa still gets rejected?
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-neutral-600 text-lg pb-6">
          While we cannot <strong>guarantee visa approval</strong> (final 
          decision is with immigration authorities), we <strong>guarantee</strong>:
          
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>100% accurate form filling</strong> - no data entry errors</li>
            <li><strong>100% document compliance</strong> - meets all technical requirements</li>
            <li><strong>Full refund</strong> if rejection was due to an error in our processing</li>
          </ul>
          
          <p className="mt-3">
            Our <strong>99.2% approval rate</strong> speaks for itself. Most rejections 
            happen due to insufficient supporting documents (e.g., low bank balance), 
            not form errors.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem 
        value="processing-time"
        className="bg-white rounded-2xl shadow-md px-6 border-2 border-neutral-100
                   hover:shadow-lg transition-all duration-300"
      >
        <AccordionTrigger className="text-lg font-semibold text-neutral-900 py-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary-start" />
            How long does processing take?
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-neutral-600 text-lg pb-6">
          <strong>10 minutes average</strong> for most services:
          
          <ul className="list-disc pl-6 mt-3 space-y-1">
            <li><strong>AI Form Filler:</strong> 5-10 minutes</li>
            <li><strong>Document Validator:</strong> 3-5 minutes</li>
            <li><strong>Photo Compliance:</strong> 2-3 minutes</li>
            <li><strong>Travel Itinerary:</strong> 10-15 minutes</li>
          </ul>
          
          <p className="mt-3">
            You'll receive an email notification when your documents are ready. 
            All services are <strong>same-day delivery</strong>.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem 
        value="itinerary-verification"
        className="bg-white rounded-2xl shadow-md px-6 border-2 border-neutral-100
                   hover:shadow-lg transition-all duration-300"
      >
        <AccordionTrigger className="text-lg font-semibold text-neutral-900 py-6">
          <div className="flex items-center gap-3">
            <Plane className="w-6 h-6 text-primary-start" />
            Are the travel itineraries verified/real bookings?
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-neutral-600 text-lg pb-6">
          Our AI generates <strong>realistic, detailed itineraries</strong> that 
          include:
          
          <ul className="list-disc pl-6 mt-3 space-y-1">
            <li>Day-by-day activity plans aligned with your purpose of travel</li>
            <li>Real hotel names and locations (not fake bookings)</li>
            <li>Realistic flight timing suggestions</li>
            <li>Tourist attractions and activities matching your destination</li>
          </ul>
          
          <p className="mt-3">
            <strong>Important:</strong> The itinerary is a <strong>plan document</strong>, 
            not actual bookings. You'll need to make real flight/hotel reservations 
            separately. Many embassies accept tentative bookings or itinerary plans 
            for initial visa applications.
          </p>
        </AccordionContent>
      </AccordionItem>
      
    </Accordion>
    
    {/* Still have questions CTA */}
    <Card className="mt-16 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50
                     p-12 text-center shadow-xl">
      <MessageCircle className="w-16 h-16 mx-auto mb-6 text-primary-start" />
      <h3 className="text-3xl font-bold text-neutral-900 mb-4">
        Still Have Questions?
      </h3>
      <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
        Our support team is here to help! We respond within 2 hours.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button 
          variant="gradient"
          size="lg"
          className="rounded-2xl px-8 shadow-lg shadow-primary/30"
        >
          <Mail className="mr-2 w-5 h-5" />
          Contact Support
        </Button>
        <Button 
          variant="outline"
          size="lg"
          className="rounded-2xl px-8"
        >
          <Book className="mr-2 w-5 h-5" />
          View Help Center
        </Button>
      </div>
    </Card>
    
  </Container>
</Section>
```

---

### Final CTA Section
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
      Get Started Today
    </Badge>
    
    <h2 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
      Stop Wasting Time on
      <br />
      Visa Applications
    </h2>
    
    <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
      Let AI handle the paperwork. You focus on what matters.
    </p>
    
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
      <Button 
        size="xl"
        variant="white"
        className="px-10 py-5 text-xl rounded-2xl
                   bg-white text-primary-start font-bold
                   shadow-2xl hover:shadow-3xl
                   hover:scale-105 transition-all duration-300
                   group"
      >
        Process Documents Now
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
        View Pricing
      </Button>
    </div>
    
    {/* Trust indicators */}
    <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100">
      <TrustIndicator>
        <CheckCircle className="w-5 h-5 mr-2" />
        No credit card required
      </TrustIndicator>
      <Separator orientation="vertical" className="h-6 bg-white/20" />
      <TrustIndicator>
        <Shield className="w-5 h-5 mr-2" />
        Data deleted after 30 days
      </TrustIndicator>
      <Separator orientation="vertical" className="h-6 bg-white/20" />
      <TrustIndicator>
        <Zap className="w-5 h-5 mr-2" />
        10-minute processing
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

## 🎨 Design System Components

### Reusable Components Reference
```tsx
// All components should follow Gamma.app design DNA from MYDSCVR_GAMMA_REDESIGN_PROMPT.md

<FloatingOrb />           // Animated gradient background orbs
<GradientMesh />          // Gamma-style mesh gradient background
<Badge />                 // Small labels with gradients
<Button />                // Primary, outline, gradient variants
<Card />                  // Floating cards with shadows
<Separator />             // Divider lines
<Accordion />             // FAQ accordion
<Marquee />               // Infinite scroll testimonials
<ScrollIndicator />       // Animated scroll arrow
<BackgroundPattern />     // Subtle grid/dot patterns
<AnimatedGradient />      // Animated gradient backgrounds
```

### Animation Guidelines
```css
/* Follow Gamma.app timing */
--duration-fast: 300ms;
--duration-normal: 400ms;
--duration-slow: 500ms;

--easing: cubic-bezier(0.4, 0, 0.2, 1); /* ease-out */

/* Hover states */
.hover-lift {
  transition: all 400ms ease-out;
}
.hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-2xl);
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile: 320px - 768px */
- Single column layouts
- Stacked hero buttons
- Simplified feature cards

/* Tablet: 768px - 1024px */
- Two-column grids
- Side-by-side features
- Condensed pricing

/* Desktop: 1024px+ */
- Full Bento grid layouts
- Multi-column features
- Expanded pricing display
```

---

## 🔍 SEO Meta Tags

```html
<!-- Homepage -->
<title>mydscvr.ai VisaAssist - AI-Powered Visa & Document Processing for GCC</title>
<meta name="description" content="Never get your visa rejected again. AI-powered form filling, document validation, and compliance checking for UAE, Saudi, Qatar, and all GCC countries. 99.2% approval rate.">

<meta property="og:title" content="mydscvr.ai VisaAssist - AI Visa Assistant">
<meta property="og:description" content="Eliminate visa rejection with AI-powered document processing. Auto-fill government forms, validate documents, and ensure compliance.">
<meta property="og:image" content="/og-image.jpg">

<meta name="keywords" content="UAE visa, Saudi visa, GCC visa, visa application, document processing, AI form filler, immigration UAE, work visa UAE, tourist visa, visa rejection">
```

---

## 🚀 Implementation Checklist

### Phase 1: Homepage Rebuild
- [ ] Update hero section with new value prop
- [ ] Replace headshot features with visa features
- [ ] Create problem statement section
- [ ] Build core features Bento grid
- [ ] Update how it works section
- [ ] Add GCC coverage section
- [ ] Update pricing cards
- [ ] Add social proof section
- [ ] Create FAQ accordion
- [ ] Update final CTA

### Phase 2: Visual Assets
- [ ] Update color scheme to trust-based blues/greens
- [ ] Create new logo/icon
- [ ] Design feature illustrations
- [ ] Create country flag icons
- [ ] Design form filling demo animation
- [ ] Update all imagery to visa/document theme

### Phase 3: Copy Updates
- [ ] Write all new headlines
- [ ] Update value propositions
- [ ] Create feature descriptions
- [ ] Write FAQs
- [ ] Draft testimonials
- [ ] Update meta descriptions

---

## 💡 Key Differentiators to Emphasize

1. **99.2% Approval Rate** - Stress test data and validation
2. **10-Minute Processing** - Speed vs manual 2-hour forms
3. **GCC-Specific** - Local expertise, Arabic support
4. **AI-Powered** - Modern, trustworthy technology
5. **Pay-Per-Use** - No subscriptions, transparent pricing
6. **Data Security** - Auto-deletion, GDPR compliant
7. **Travel Itinerary** - Unique feature for tourist visas

---

## 🎯 Target Audience Messaging

### Primary: Expatriates (B2C)
- **Pain**: Visa rejection, wasted time, complex forms
- **Message**: "Get approved on first try. AI ensures perfect forms."
- **CTA**: "Process Your Documents Now"

### Secondary: HR Professionals (B2B)
- **Pain**: Managing multiple visa applications, compliance risk
- **Message**: "Process 50+ applications 70% faster with AI."
- **CTA**: "Request Enterprise Demo"

### Tertiary: Visa Agents (B2B)
- **Pain**: Manual data entry, client satisfaction
- **Message**: "Scale your agency with AI automation."
- **CTA**: "Partner With Us"

---

This comprehensive prompt provides everything needed to rebuild the homepage following the Gamma.app design system while pivoting to the VisaAssist value proposition. The design maintains all the beautiful aesthetics (generous spacing, soft gradients, floating cards, smooth animations) while completely shifting the messaging and features to visa/document processing.

Ready to implement! 🚀
