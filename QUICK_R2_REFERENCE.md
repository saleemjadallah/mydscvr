# R2 Storage Quick Reference

## 🚀 Quick Start

### Local Development
```bash
# 1. Backend is already running ✅
cd backend && npm run dev

# 2. Start frontend with new .env
cd frontend && npm run dev

# 3. Test upload at http://localhost:5173/upload
```

## 📁 Bucket Structure

```
mydscvr-food-images/
├── uploads/{userId}/{sessionId}/0.jpg         # User uploads
├── generated/{userId}/{batchId}/linkedin-0.jpg # AI headshots
└── thumbnails/{userId}/{batchId}/linkedin-0.jpg # Thumbnails
```

## 🔧 Image Settings

| Type | Size | Quality | Format |
|------|------|---------|--------|
| Uploads | ≤2048x2048 | 95% | JPEG |
| Generated | Original | 92% | JPEG |
| Thumbnails | 400x400 | 85% | JPEG |

## 🌐 API Endpoints

```bash
# Upload photos
POST /api/batches/upload
Form-data: photos (max 20 files)

# Download single
GET /api/batches/:batchId/download/:headshotId

# Download all as ZIP
GET /api/batches/:batchId/download-all
```

## 🔑 Environment Variables

### Backend (.env) - Already Configured ✅
```bash
R2_ENDPOINT=https://ea65397ee7d18c57f0b3c0120f32e517.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=e02119d18e7ce85e5be2ebad25e8c320
R2_SECRET_ACCESS_KEY=***
R2_BUCKET_NAME=mydscvr-food-images
R2_PUBLIC_URL=https://images.mydscvr.ai
```

### Frontend (.env) - Created ✅
```bash
VITE_API_URL=http://localhost:3000
```

## ⚡ Key Functions (backend/src/lib/storage.ts)

```typescript
// Upload
uploadBuffer(buffer, key, contentType)
optimizeUploadedImage(buffer)
uploadGeneratedHeadshot(userId, batchId, buffer, metadata)

// Download
downloadFile(key)
downloadFileByUrl(url)

// Process
optimizeGeneratedHeadshot(buffer)
generateThumbnail(buffer, width, height)

// Manage
deleteBatchFiles(userId, batchId)
listBatchFiles(userId, batchId)
```

## ✅ What's Working

- [x] Backend running on localhost:3000
- [x] R2 credentials configured
- [x] Upload endpoint with optimization
- [x] Download endpoints (single + ZIP)
- [x] Image processing pipeline
- [x] Error handling
- [x] Authentication on all routes

## 📝 Testing Checklist

- [ ] Restart frontend (`cd frontend && npm run dev`)
- [ ] Upload test photos
- [ ] Verify images in R2 bucket
- [ ] Test single headshot download
- [ ] Test ZIP batch download
- [ ] Check image quality
- [ ] Verify CDN URLs work

## 🐛 Common Issues

**Upload 404?**
→ Restart frontend to pick up new VITE_API_URL

**Images not showing?**
→ Check R2_PUBLIC_URL and bucket CORS

**Download fails?**
→ Verify authentication and batch ownership

## 📊 Next Steps

1. Test upload flow in browser
2. Configure R2 bucket CORS (if needed)
3. Deploy to production (Railway + Cloudflare Pages)
4. Monitor R2 usage in Cloudflare dashboard

## 📚 Full Documentation

- **R2_STORAGE_SETUP.md** - Complete technical reference
- **R2_INTEGRATION_SUMMARY.md** - Implementation overview
