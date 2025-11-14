// Style Templates - Same as frontend but for backend use
export const STYLE_TEMPLATES: { [key: string]: any } = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn Professional',
    background: 'Professional gray gradient or modern office setting',
    outfit: 'Business suit, blazer, or professional attire',
    platformSpecs: {
      aspectRatio: '1:1',
      dimensions: '1024x1024',
      optimizedFor: 'LinkedIn profile photo',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Preserve exact facial features, bone structure, eye shape, nose structure, mouth characteristics, and skin texture.

STYLE MODIFICATIONS ONLY:
- Background: Clean professional gray gradient or blurred modern office with depth
- Attire: Business formal - suit jacket, blazer, or professional dress (change clothing only, not body)
- Lighting: Soft studio lighting from 45° angle, evenly lit face, fill light to eliminate harsh shadows
- Expression: Confident and approachable professional smile (maintain natural smile characteristics from reference)
- Framing: Head and shoulders, centered, direct eye contact with camera
- Pose: Shoulders squared to camera, slight forward lean for engagement

TECHNICAL SPECIFICATIONS:
- Crop: Square format 1:1 (1024x1024) optimized for LinkedIn profile display
- Focus: Sharp focus on eyes and face, slight depth of field on background
- Color: Natural skin tones from reference, neutral color palette, sRGB color space
- Quality: Studio-quality professional headshot, high-resolution suitable for business networking

PROHIBITED CHANGES:
- Do not alter facial structure, features, or proportions from reference photos
- Do not change skin texture beyond professional color correction
- Do not modify eye color, shape, or position
- Do not adjust nose, mouth, or facial geometry
- Maintain exact facial identity from reference images`,
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Website',
    background: 'Clean solid backdrop or professional office environment',
    outfit: 'Full business attire, coordinated professional wear',
    platformSpecs: {
      aspectRatio: '4:5',
      dimensions: '1080x1350',
      optimizedFor: 'Company website team pages',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Preserve exact facial features, bone structure, and identity.

STYLE MODIFICATIONS ONLY:
- Background: Solid neutral color (white, gray, or subtle brand color)
- Attire: Full business formal - complete suit or professional business wear
- Lighting: Professional even lighting, consistent with team photos, no shadows
- Expression: Trustworthy, professional, approachable smile (maintain natural expression)
- Framing: Portrait orientation 4:5, head and upper torso, centered
- Pose: Professional stance, squared shoulders, direct camera engagement

TECHNICAL SPECIFICATIONS:
- Crop: 4:5 portrait format (1080x1350) for team directory consistency
- Focus: Sharp focus throughout, consistent with team photo standards
- Color: Professional color correction, neutral tones, brand-appropriate
- Quality: Team-consistent, website-ready, professional corporate style

PROHIBITED CHANGES:
- Maintain exact facial identity and features from reference photos
- Do not alter skin texture beyond professional color correction
- Keep natural facial proportions and characteristics`,
  },
  creative: {
    id: 'creative',
    name: 'Creative Portfolio',
    background: 'Textured wall, urban setting, or artistic backdrop',
    outfit: 'Smart casual with personal style, creative professional',
    platformSpecs: {
      aspectRatio: '3:4',
      dimensions: '1080x1440',
      optimizedFor: 'Portfolio websites and creative platforms',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Preserve exact facial identity and features.

STYLE MODIFICATIONS ONLY:
- Background: Textured wall, urban setting, or artistic backdrop with visual interest
- Attire: Smart casual or business casual with personal style elements
- Lighting: Natural light or artistic lighting with depth and dimension
- Expression: Authentic personality, warm and engaging (maintain natural smile)
- Framing: 3:4 portrait, creative composition with slight variety in pose
- Pose: Relaxed professional stance with personality

TECHNICAL SPECIFICATIONS:
- Crop: 3:4 portrait format (1080x1440) for portfolio display
- Focus: Sharp focus on face with artistic depth of field
- Color: Rich colors with slightly cinematic color grading
- Quality: Portfolio-ready, creative professional standard

PROHIBITED CHANGES:
- Maintain exact facial features and identity from reference photos
- Do not alter natural facial characteristics or bone structure`,
  },
  resume: {
    id: 'resume',
    name: 'Resume / CV',
    background: 'Solid white or light gray backdrop',
    outfit: 'Conservative professional attire',
    platformSpecs: {
      aspectRatio: '2:3',
      dimensions: '800x1200',
      optimizedFor: 'Resume and CV applications',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Maintain exact facial identity.

STYLE MODIFICATIONS ONLY:
- Background: Solid neutral color (white, light gray, or light blue)
- Attire: Conservative professional business attire
- Lighting: Flat even lighting, no dramatic shadows or highlights
- Expression: Professional neutral or subtle professional smile (maintain natural expression)
- Framing: Traditional passport-style, head and shoulders centered
- Pose: Straight-on, formal professional stance

TECHNICAL SPECIFICATIONS:
- Crop: 2:3 portrait format (800x1200) suitable for resume printing
- Focus: Sharp focus throughout, traditional headshot standard
- Color: Natural well-balanced colors, print-ready sRGB
- Quality: High-resolution suitable for print and digital resumes

PROHIBITED CHANGES:
- Maintain exact facial features and proportions from reference photos
- Do not alter facial identity or natural characteristics`,
  },
  social: {
    id: 'social',
    name: 'Social Media',
    background: 'Soft blur, lifestyle setting, or warm backdrop',
    outfit: 'Business casual to smart casual',
    platformSpecs: {
      aspectRatio: '1:1',
      dimensions: '1080x1080',
      optimizedFor: 'Instagram, Twitter, Facebook profile',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Preserve exact facial identity.

STYLE MODIFICATIONS ONLY:
- Background: Soft bokeh blur or casual lifestyle setting
- Attire: Business casual to smart casual, approachable style
- Lighting: Natural warm lighting, flattering and soft
- Expression: Warm genuine smile, friendly and approachable (maintain natural smile)
- Framing: Square 1:1 format, head and shoulders
- Pose: Relaxed friendly stance with authentic personality

TECHNICAL SPECIFICATIONS:
- Crop: 1:1 square format (1080x1080) for social media profile display
- Focus: Sharp focus on face with soft background blur
- Color: Warm color tones, Instagram-ready color grading
- Quality: Social media optimized for Instagram, Twitter, Facebook

PROHIBITED CHANGES:
- Maintain exact facial features and identity from reference photos
- Keep natural facial characteristics and skin texture`,
  },
  executive: {
    id: 'executive',
    name: 'Executive Leadership',
    background: 'Luxury office, dark sophisticated backdrop, or premium setting',
    outfit: 'Premium tailored suit, executive attire',
    platformSpecs: {
      aspectRatio: '2:3',
      dimensions: '1080x1620',
      optimizedFor: 'Executive bios and leadership pages',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Preserve exact facial identity.

STYLE MODIFICATIONS ONLY:
- Background: Luxury office setting, dark sophisticated backdrop, or premium environment
- Attire: Premium tailored suit, high-end executive business attire
- Lighting: Dramatic cinematic lighting, sculpted and sophisticated
- Expression: Authoritative confidence, commanding executive presence (maintain natural expression)
- Framing: 2:3 editorial portrait with powerful composition
- Pose: Commanding executive stance with authority

TECHNICAL SPECIFICATIONS:
- Crop: 2:3 portrait format (1080x1620) for executive bios
- Focus: Sharp focus with cinematic depth
- Color: Rich sophisticated color palette with cinematic grading
- Quality: Premium executive standard, editorial-level photography

PROHIBITED CHANGES:
- Maintain exact facial features and identity from reference photos
- Keep natural facial characteristics and authority`,
  },
  casual: {
    id: 'casual',
    name: 'Approachable Professional',
    background: 'Cafe, outdoor natural, or soft indoor setting',
    outfit: 'Smart casual, no tie, relaxed professional',
    platformSpecs: {
      aspectRatio: '4:5',
      dimensions: '1080x1350',
      optimizedFor: 'Team pages and casual professional contexts',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Preserve exact facial identity.

STYLE MODIFICATIONS ONLY:
- Background: Casual professional setting - cafe, soft indoor, or natural outdoor
- Attire: Smart casual, open collar, relaxed professional style
- Lighting: Natural soft lighting, warm and flattering
- Expression: Genuine relaxed smile, friendly and approachable (maintain natural smile)
- Framing: 4:5 portrait with natural casual composition
- Pose: Relaxed approachable professional stance

TECHNICAL SPECIFICATIONS:
- Crop: 4:5 portrait format (1080x1350) for team pages
- Focus: Natural sharp focus with soft background
- Color: Natural warm tones with approachable aesthetic
- Quality: Professional but approachable, modern team photo standard

PROHIBITED CHANGES:
- Maintain exact facial features and identity from reference photos
- Keep natural friendly characteristics`,
  },
  speaker: {
    id: 'speaker',
    name: 'Conference Speaker',
    background: 'Stage backdrop, presentation setting, or dynamic backdrop',
    outfit: 'Speaking attire, presentation-appropriate',
    platformSpecs: {
      aspectRatio: '1:1',
      dimensions: '1200x1200',
      optimizedFor: 'Conference websites and speaker promotion',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Preserve exact facial identity.

STYLE MODIFICATIONS ONLY:
- Background: Stage or presentation backdrop, professional event setting
- Attire: Presentation attire, speaker-appropriate professional wear
- Lighting: Dynamic engaging lighting with spotlight-style illumination
- Expression: Confident engaging smile with keynote speaker presence (maintain natural confidence)
- Framing: Square 1:1 format for versatility across materials
- Pose: Dynamic speaker stance with engaging presence

TECHNICAL SPECIFICATIONS:
- Crop: 1:1 square format (1200x1200) for conference promotion
- Focus: Sharp high-resolution focus suitable for large prints
- Color: Vibrant professional colors, stage-appropriate grading
- Quality: High-resolution (300dpi equivalent) for print and digital

PROHIBITED CHANGES:
- Maintain exact facial features and identity from reference photos
- Keep natural speaker presence and characteristics`,
  },
  visa: {
    id: 'visa',
    name: 'Visa & Passport',
    background: 'Plain white or light grey backdrop (no patterns, no shadows)',
    outfit: 'Formal or smart casual attire',
    platformSpecs: {
      aspectRatio: '35:45',
      dimensions: '1050x1350',
      optimizedFor: 'US, Schengen, UK, Canada visa applications',
    },
    geminiPrompt: `FACIAL PRESERVATION: Keep 100% facial accuracy from reference photos. Preserve exact facial identity - CRITICAL for biometric compliance.

BIOMETRIC REQUIREMENTS (STRICT COMPLIANCE):
- Background: Plain white or light grey, absolutely no patterns or shadows
- Attire: Formal or smart casual, solid colors preferred
- Lighting: Even front-facing illumination with no shadows on face
- Expression: Neutral expression, mouth closed, NO smile, eyes open looking directly at camera
- Framing: Full frontal face view, head centered, face occupies 70-80% of frame
- Head Position: Straight-on, no tilt, chin to crown between 31-36mm of image height
- Eyes: Both eyes clearly visible, no red-eye, no glasses glare
- Hair: Away from face, ears visible if possible, no shadows from hair

TECHNICAL SPECIFICATIONS:
- Crop: 35:45mm biometric standard (1050x1350 pixels)
- Focus: Sharp focus throughout entire face
- Color: Natural skin tones, accurate color representation
- Quality: High-resolution biometric standard, print-ready at 300dpi
- Style: Official government ID photo, strictly compliant with visa regulations

PROHIBITED CHANGES:
- Maintain EXACT facial features and identity from reference photos (required for biometric matching)
- Do not alter any facial characteristics or proportions
- CRITICAL: No smile, neutral expression only, plain background, no shadows`,
  },
};
