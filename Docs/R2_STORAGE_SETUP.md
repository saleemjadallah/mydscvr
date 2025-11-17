# Cloudflare R2 Storage Configuration

This document describes the complete R2 storage setup for HeadShotHub's image handling.

## Environment Variables

Required environment variables in both `.env` files:

```bash
# Backend (.env)
R2_ENDPOINT=https://ea65397ee7d18c57f0b3c0120f32e517.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=e02119d18e7ce85e5be2ebad25e8c320
R2_SECRET_ACCESS_KEY=2ec78038ad40d9b95d3d87814804acc8dcb2165e4b78a0b36ba017ee299b9bdc
R2_BUCKET_NAME=mydscvr-food-images
R2_PUBLIC_URL=https://images.mydscvr.ai
```

## Bucket Structure

```
mydscvr-food-images/
├── uploads/{userId}/{sessionId}/
│   └── {0-19}.jpg                    # User uploaded photos (optimized, max 2048x2048, 95% quality)
│
├── generated/{userId}/{batchId}/
│   └── {template}-{index}.jpg        # AI-generated headshots (full resolution, 92% quality)
│
├── thumbnails/{userId}/{batchId}/
│   └── {template}-{index}.jpg        # Gallery thumbnails (400x400, 85% quality)
│
└── previews/{userId}/{batchId}/
    └── {template}-{index}.jpg        # Web previews (800x800, 88% quality)
```

## Image Processing Pipeline

### 1. Upload Flow
```
User Upload → Multer → Sharp Optimization → R2 Upload → Return URL
```

**Optimization Settings:**
- Max dimensions: 2048x2048px (maintains aspect ratio)
- Format: JPEG
- Quality: 95%
- Auto-rotation: EXIF-based
- Progressive: Yes
- Optimize scans: Yes

### 2. Generation Flow
```
Gemini API → Base64 Image → Buffer → Sharp Optimization → R2 Upload (3 variants)
```

**Variants Created:**
1. **Full Resolution**: Original AI-generated image (92% quality)
2. **Thumbnail**: 400x400px for gallery grids (85% quality)
3. **Preview**: 800x800px for web display (88% quality)

### 3. Download Flow
```
User Request → Auth Check → Fetch from R2 → Stream to Client
```

## API Endpoints

### Upload Photos
```http
POST /api/batches/upload
Content-Type: multipart/form-data
Authorization: Required (Session)

Body:
  photos: File[] (max 20 files, 15MB each)

Response:
{
  "success": true,
  "data": [
    "https://images.mydscvr.ai/uploads/{userId}/{sessionId}/0.jpg",
    "https://images.mydscvr.ai/uploads/{userId}/{sessionId}/1.jpg",
    ...
  ]
}
```

### Download Single Headshot
```http
GET /api/batches/:batchId/download/:headshotId
Authorization: Required (Session)

Response: image/jpeg (binary)
Headers:
  Content-Type: image/jpeg
  Content-Disposition: attachment; filename="headshot-{id}.jpg"
  Content-Length: {size}
```

### Download All as ZIP
```http
GET /api/batches/:batchId/download-all
Authorization: Required (Session)

Response: application/zip (binary)
Headers:
  Content-Type: application/zip
  Content-Disposition: attachment; filename="headshots-batch-{id}.zip"
```

## Storage Functions

### Available Functions

**Upload Functions:**
- `uploadBuffer(buffer, key, contentType)` - Upload any buffer
- `uploadBase64Image(base64, filename)` - Upload base64 image
- `uploadUserPhoto(userId, batchId, buffer, index)` - Upload user photo
- `uploadGeneratedHeadshot(userId, batchId, buffer, metadata)` - Upload AI headshot with thumbnails

**Download Functions:**
- `downloadFile(key)` - Download by R2 key
- `downloadFileByUrl(url)` - Download by public URL
- `getSignedDownloadUrl(key, expiresIn)` - Generate temporary signed URL
- `listBatchFiles(userId, batchId)` - List all files in a batch

**Processing Functions:**
- `optimizeUploadedImage(buffer)` - Optimize user uploads
- `optimizeGeneratedHeadshot(buffer)` - Optimize AI-generated images
- `generateThumbnail(buffer, width, height)` - Create thumbnails
- `generatePreview(buffer)` - Create web previews

**Management Functions:**
- `deleteFile(key)` - Delete single file
- `deleteBatchFiles(userId, batchId)` - Delete entire batch
- `deleteImages(urls[])` - Delete multiple files by URL
- `fileExists(key)` - Check if file exists
- `getFileMetadata(key)` - Get file info

## Performance Optimization

### Upload Optimization
1. **Client-side validation** before upload (file type, size)
2. **Progressive JPEG** for faster perceived loading
3. **Auto-rotation** based on EXIF data
4. **Intelligent resizing** (maintains aspect ratio, no enlargement)

### Download Optimization
1. **CDN-backed URLs** via Cloudflare R2 public URL
2. **Lazy loading** of thumbnails in gallery
3. **Progressive enhancement** (thumbnail → preview → full)
4. **ZIP streaming** for batch downloads (no temp files)

### Storage Optimization
1. **MozJPEG compression** for best quality/size ratio
2. **Progressive JPEG** for incremental display
3. **Optimized scan patterns** for faster decoding
4. **Cache headers** (1 year for immutable images)

## Best Practices

### Security
- ✅ Authentication required for all upload/download operations
- ✅ User ID verification in file paths
- ✅ File type validation (images only)
- ✅ Size limits enforced (15MB per file, 20 files max)
- ✅ Signed URLs for temporary access when needed

### Error Handling
- Upload failures: Return error, don't save partial data
- Download failures: Log error, continue with other files (ZIP)
- Missing files: Return 404 with clear error message
- Network timeouts: 30-second timeout for large uploads

### Monitoring
- Log all upload/download operations
- Track file counts per batch
- Monitor R2 API errors
- Alert on unusual storage patterns

## Troubleshooting

### Common Issues

**Upload fails with 404:**
- Check backend is running
- Verify VITE_API_URL in frontend/.env
- Ensure authentication session is valid

**Images not displaying:**
- Verify R2_PUBLIC_URL is correct
- Check CORS settings on R2 bucket
- Confirm files exist in bucket

**Download fails:**
- Check R2 credentials are valid
- Verify bucket name matches configuration
- Ensure files weren't deleted

**Slow uploads:**
- Images optimized before upload (should be fast)
- Check network connection
- Consider concurrent upload limits

## R2 Bucket Configuration

### Required Settings

1. **Public Access:**
   - Enable public read access for the bucket
   - Configure custom domain: `images.mydscvr.ai`

2. **CORS Policy:**
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://yourdomain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

3. **Lifecycle Rules (Optional):**
   - Delete uploaded photos after 90 days if batch is deleted
   - Archive old batches to cheaper storage after 1 year

## Cost Optimization

### Storage Costs
- **Class A operations** (write): ~$4.50/million
- **Class B operations** (read): ~$0.36/million
- **Storage**: ~$0.015/GB/month

### Optimization Strategies
1. Delete unused upload sessions after 24 hours
2. Generate thumbnails once, serve many times
3. Use CDN caching (Cloudflare automatic)
4. Compress images before storage

## Future Enhancements

### Planned Features
- [ ] WebP format support (better compression)
- [ ] AVIF format for next-gen browsers
- [ ] Multiple thumbnail sizes (responsive images)
- [ ] Image watermarking for previews
- [ ] Automatic backup to secondary storage
- [ ] Analytics on download patterns

## Testing

### Local Testing
```bash
# 1. Ensure backend is running
cd backend && npm run dev

# 2. Test upload endpoint
curl -X POST http://localhost:3000/api/batches/upload \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -F "photos=@test-image.jpg"

# 3. Test download endpoint
curl http://localhost:3000/api/batches/1/download-all \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -o headshots.zip
```

### Production Testing
- Use Stripe test mode for payment testing
- Monitor R2 dashboard for upload activity
- Check CDN hit rates on Cloudflare dashboard
- Verify image quality across different devices

## Support

For issues related to:
- **R2 configuration**: Check Cloudflare R2 documentation
- **Image processing**: Review Sharp.js documentation
- **Upload errors**: Check backend logs (console)
- **Download errors**: Verify authentication and batch ownership
