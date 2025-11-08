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
    geminiPrompt: `Create a professional LinkedIn headshot in the following style:
      - Background: Clean professional gray gradient or blurred modern office
      - Attire: Business formal - suit jacket, blazer, or professional dress
      - Lighting: Soft studio lighting, evenly lit face, no harsh shadows
      - Expression: Confident and approachable, slight professional smile
      - Framing: Head and shoulders, centered, looking directly at camera
      - Crop: Square format 1:1 optimized for LinkedIn
      - Style: Professional corporate photography, high-resolution, sharp focus
      - Color: Natural skin tones, neutral color palette
      - Quality: Studio-quality, professional headshot suitable for business networking`,
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
    geminiPrompt: `Create a formal corporate team headshot:
      - Background: Solid neutral color (white, gray, or company brand color)
      - Attire: Full business formal - complete suit or professional business wear
      - Lighting: Professional even lighting, consistent with team photos
      - Expression: Trustworthy, professional, approachable smile
      - Framing: Portrait orientation 4:5, head and upper torso
      - Crop: Consistent framing for team directory
      - Style: Corporate photography standard, high consistency
      - Color: Professional color correction, brand-appropriate
      - Quality: Team-consistent, website-ready, professional corporate style`,
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
    geminiPrompt: `Create a creative professional headshot with personality:
      - Background: Textured, urban, or artistic backdrop with visual interest
      - Attire: Smart casual, business casual with personal style elements
      - Lighting: Natural light or artistic lighting with depth and dimension
      - Expression: Authentic personality, warm and engaging
      - Framing: 3:4 portrait, creative composition, slight variety in pose
      - Crop: Portrait-style with room for personality
      - Style: Modern editorial photography, personality-forward
      - Color: Rich colors, slightly cinematic color grading
      - Quality: Portfolio-ready, creative professional standard`,
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
    geminiPrompt: `Create a traditional professional headshot for resume/CV:
      - Background: Solid neutral color (white, light gray, or light blue)
      - Attire: Conservative professional business attire
      - Lighting: Flat, even lighting, no dramatic shadows or highlights
      - Expression: Professional neutral expression or subtle professional smile
      - Framing: Traditional passport-style, head and shoulders centered
      - Crop: 2:3 portrait suitable for resume printing
      - Style: Conservative professional photography, traditional headshot
      - Color: Natural, well-balanced, print-ready colors
      - Quality: High-resolution, suitable for print and digital resumes`,
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
    geminiPrompt: `Create a friendly social media profile photo:
      - Background: Soft bokeh blur or casual lifestyle setting
      - Attire: Business casual to smart casual, approachable style
      - Lighting: Natural warm lighting, flattering and soft
      - Expression: Warm, genuine smile, friendly and approachable
      - Framing: Square 1:1 format, head and shoulders
      - Crop: Social media optimized, profile picture safe zone
      - Style: Personal branding photography, warm and inviting
      - Color: Warm color tones, Instagram-ready color grading
      - Quality: Social media optimized, personal brand standard`,
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
    geminiPrompt: `Create a premium executive leadership headshot:
      - Background: Luxury office setting, dark sophisticated backdrop, or premium environment
      - Attire: Premium tailored suit, high-end executive business attire
      - Lighting: Dramatic cinematic lighting, sculpted and sophisticated
      - Expression: Authoritative confidence, commanding executive presence
      - Framing: 2:3 editorial portrait, powerful composition
      - Crop: Executive portrait style, prominent positioning
      - Style: High-end editorial photography, luxury business portrait
      - Color: Rich sophisticated color palette, cinematic grading
      - Quality: Premium executive standard, editorial-level photography`,
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
    geminiPrompt: `Create a relaxed approachable professional headshot:
      - Background: Casual professional setting - cafe, soft indoor, or natural outdoor
      - Attire: Smart casual, open collar, relaxed professional style
      - Lighting: Natural soft lighting, warm and flattering
      - Expression: Genuine relaxed smile, friendly and approachable
      - Framing: 4:5 portrait, natural casual composition
      - Crop: Relaxed framing, team-friendly
      - Style: Lifestyle professional photography, authentic and warm
      - Color: Natural warm tones, approachable aesthetic
      - Quality: Professional but approachable, modern team photo standard`,
  },
  speaker: {
    id: 'speaker',
    name: 'Conference Speaker',
    background: 'Stage backdrop, presentation setting, or dynamic backdrop',
    outfit: 'Speaking attire, presentation-appropriate',
    platformSpecs: {
      aspectRatio: '16:9',
      dimensions: '1920x1080',
      optimizedFor: 'Conference websites and speaker promotion',
    },
    geminiPrompt: `Create a confident conference speaker headshot:
      - Background: Stage or presentation backdrop, professional event setting
      - Attire: Presentation attire, speaker-appropriate professional wear
      - Lighting: Dynamic engaging lighting, spotlight-style illumination
      - Expression: Confident engaging smile, keynote speaker presence
      - Framing: 16:9 landscape option or dynamic portrait
      - Crop: Speaker promo optimized, stage-ready composition
      - Style: Conference promotion photography, dynamic and engaging
      - Color: Vibrant professional colors, stage-appropriate
      - Quality: Speaker portfolio standard, promotional-ready`,
  },
};
