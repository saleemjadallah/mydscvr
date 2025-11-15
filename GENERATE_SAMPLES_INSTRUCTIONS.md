# 📸 How to Generate Sample Images with Gemini API

## Overview

The homepage redesign uses before/after comparison sliders to showcase the AI headshot transformation. Currently, these use placeholder images. This guide shows you how to generate real sample images using the Gemini API.

## Prerequisites

1. **Gemini API Key** - Ensure you have `GEMINI_API_KEY` set in your backend `.env` file
2. **Backend Dependencies** - All required packages should already be installed

## Quick Start

```bash
# Navigate to backend directory
cd backend

# Run the sample generator script
npx tsx scripts/generateSampleImages.ts
```

## What This Does

The script will:

1. **Generate 6 "Before" Images** (Casual selfies)
   - Uses Gemini 2.0 Flash to create realistic casual selfie photos
   - Simulates smartphone camera quality
   - Various professional personas (different ages, genders, backgrounds)
   - Saved as: `before-1.jpg` through `before-6.jpg`

2. **Generate 6 "After" Images** (Professional headshots)
   - Transforms each before image using template-specific prompts
   - Maintains facial identity while applying professional styling
   - Uses different templates: LinkedIn, Corporate, Creative, Executive, Resume, Social
   - Saved as: `after-[template]-1.jpg` through `after-[template]-6.jpg`

3. **Save to Assets Directory**
   - All images saved to: `frontend/public/assets/samples/`
   - Ready to be referenced in the homepage

## Expected Output

```
frontend/public/assets/samples/
├── before-1.jpg          # Casual selfie 1
├── before-2.jpg          # Casual selfie 2
├── before-3.jpg          # Casual selfie 3
├── before-4.jpg          # Casual selfie 4
├── before-5.jpg          # Casual selfie 5
├── before-6.jpg          # Casual selfie 6
├── after-linkedin-1.jpg  # LinkedIn professional headshot 1
├── after-corporate-2.jpg # Corporate headshot 2
├── after-creative-3.jpg  # Creative headshot 3
├── after-executive-4.jpg # Executive headshot 4
├── after-resume-5.jpg    # Resume headshot 5
└── after-social-6.jpg    # Social media headshot 6
```

## Updating the Homepage

Once images are generated, update `frontend/src/pages/HomePageNew.tsx`:

### Find This Section:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
  {[1, 2, 3, 4, 5, 6].map((i) => (
    <BeforeAfterSlider
      key={i}
      beforeImage={`https://via.placeholder.com/400x500/e5e7eb/6b7280?text=Before+${i}`}
      afterImage={`https://via.placeholder.com/400x500/6366f1/ffffff?text=After+${i}`}
      label={i === 1 ? 'LinkedIn Professional' : `Style ${i}`}
    />
  ))}
</div>
```

### Replace With:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
  {[
    { template: 'linkedin', label: 'LinkedIn Professional' },
    { template: 'corporate', label: 'Corporate Website' },
    { template: 'creative', label: 'Creative Portfolio' },
    { template: 'executive', label: 'Executive Leadership' },
    { template: 'resume', label: 'Resume & CV' },
    { template: 'social', label: 'Social Media' },
  ].map((item, i) => (
    <BeforeAfterSlider
      key={i}
      beforeImage={`/assets/samples/before-${i + 1}.jpg`}
      afterImage={`/assets/samples/after-${item.template}-${i + 1}.jpg`}
      label={item.label}
    />
  ))}
</div>
```

## Customization Options

### Generate More Variations

Edit `backend/scripts/generateSampleImages.ts` and increase `numSamples`:

```typescript
// Generate 12 before/after pairs instead of 6
const numSamples = 12;
```

### Change Templates

Modify the `templates` array to use different template combinations:

```typescript
const templates = [
  'linkedin',     // Professional business
  'linkedin',     // Use same template twice for variety
  'corporate',    // Company website
  'creative',     // Portfolio
  'executive',    // Leadership
  'resume',       // CV/Resume
  'social',       // Instagram/Twitter
  'casual',       // Approachable
  'speaker',      // Conference/Events
];
```

### Customize Prompts

Edit the `beforePrompts` array to generate specific types of selfies:

```typescript
const beforePrompts = [
  'A casual selfie of a young professional woman...',
  'A casual selfie of a middle-aged professional man...',
  // Add your custom prompts
];
```

## Rate Limiting & Performance

**Important Notes:**
- The script includes a 2-second delay between generations to avoid rate limiting
- Generating 6 pairs takes approximately **2-3 minutes**
- Each image generation uses Gemini 2.0 Flash (cost-effective model)
- Images are automatically resized and optimized with Sharp

**Cost Estimate:**
- Gemini 2.0 Flash: ~$0.01 per image generation
- 12 total images (6 before + 6 after): ~$0.12 total

## Troubleshooting

### Error: "GEMINI_API_KEY not found"
```bash
# Add to backend/.env
echo "GEMINI_API_KEY=your_api_key_here" >> backend/.env
```

### Error: "No image generated"
- Check your Gemini API quota
- Verify API key is valid
- Try running with fewer samples first

### Images Look Wrong
- Gemini can be unpredictable - regenerate if needed
- Adjust prompts for more specific results
- Use temperature parameter to control creativity

### Script Hangs
- Check internet connection
- Verify Gemini API is accessible
- Try reducing `numSamples` to 3 for testing

## Advanced: Using Different AI Models

### Use Gemini 2.5 Flash Image (Better Quality)
Edit `generateSampleImages.ts`:

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-image',  // Higher quality native image generation
});
```

### Use Imagen 3 (Best Quality, Higher Cost)
```typescript
// Requires different API setup - see Vertex AI documentation
```

## Manual Alternative

If the script doesn't work or you want more control:

1. **Use Stock Photos** for "before" images
   - Download from Unsplash, Pexels (ensure commercial license)
   - Place in `frontend/public/assets/samples/`
   - Name as `before-1.jpg` through `before-6.jpg`

2. **Generate "After" Images Manually**
   - Use your actual app (once backend is running)
   - Upload the before images
   - Download the generated headshots
   - Rename and place in samples directory

3. **Use AI Art Tools**
   - Midjourney, DALL-E, Stable Diffusion
   - Generate professional headshots
   - Process with same naming convention

## Verification

After generation, verify:

```bash
# Check images were created
ls -lh frontend/public/assets/samples/

# Should see 12 files (6 before + 6 after)
# Each should be ~50-200 KB
```

**Expected Output:**
```
-rw-r--r--  1 user  staff   85K  before-1.jpg
-rw-r--r--  1 user  staff   92K  before-2.jpg
-rw-r--r--  1 user  staff  145K  after-linkedin-1.jpg
-rw-r--r--  1 user  staff  158K  after-corporate-2.jpg
...
```

## Next Steps

Once images are generated:

1. ✅ Update homepage component with real image paths
2. ✅ Test comparison sliders work smoothly
3. ✅ Optimize images if needed (WebP conversion)
4. ✅ Add loading states/skeletons
5. ✅ Test on mobile devices

## Support

If you encounter issues:
1. Check backend logs for Gemini API errors
2. Verify API key permissions
3. Try generating 1 sample first for testing
4. Review Gemini API documentation: https://ai.google.dev/

---

**Pro Tip:** Generate multiple sets of samples and pick the best ones. The AI can be inconsistent, so having options helps ensure quality.
