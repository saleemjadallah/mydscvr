# Face-Swapping Microservice

High-quality face-swapping service using InsightFace for 100% facial accuracy in AI-generated headshots.

## Features

- **Automatic Best Photo Selection**: Analyzes and selects optimal reference photo from uploads
- **High-Quality Face Swapping**: Uses InsightFace for seamless face replacement
- **Photo Quality Analysis**: Scores photos 0-100 based on face detection, angle, sharpness, lighting
- **Robust Error Handling**: Automatic fallbacks and graceful degradation

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "face-swap-service",
  "models_loaded": true
}
```

### `POST /analyze-photo`
Analyze photo quality for face-swapping.

**Request:**
```json
{
  "image_url": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 87.5,
    "face_detected": true,
    "confidence": 0.998,
    "front_facing": true,
    "resolution": "1024x1024",
    "sharpness": 0.85,
    "brightness": 128.5
  }
}
```

### `POST /select-best-photo`
Select best reference photo from multiple candidates.

**Request:**
```json
{
  "image_urls": ["https://...", "https://..."]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "primary": "https://...",
    "fallbacks": ["https://...", "https://..."],
    "scores": [...]
  }
}
```

### `POST /swap-face`
Swap face from source onto target image.

**Request:**
```json
{
  "target_url": "https://...",
  "source_url": "https://..."
}
```

**Response:**
Binary JPEG image data

## Local Development

### Prerequisites
- Python 3.10+
- pip

### Setup
```bash
cd face-swap-service
pip install -r requirements.txt
python app.py
```

Service will start on `http://localhost:5000`

### First Run
On first run, the service will download InsightFace models (~500MB). This is a one-time download.

## Docker Deployment

### Build
```bash
docker build -t face-swap-service .
```

### Run
```bash
docker run -p 5000:5000 face-swap-service
```

## Railway Deployment

### Option 1: Separate Service (Recommended)
1. Create new Railway project for face-swap service
2. Connect this directory
3. Railway will auto-detect Dockerfile
4. Set environment variables:
   - `PORT=5000` (auto-set by Railway)
5. Deploy!

### Option 2: Monorepo with Backend
Add to root nixpacks.toml or use Docker compose.

## Environment Variables

- `PORT`: Server port (default: 5000)
- No API keys needed - service is self-contained

## Performance

- **CPU Mode**: 5-10 seconds per face swap
- **GPU Mode**: 0.5-1 second per face swap (if GPU available)
- **Memory**: ~2GB RAM with models loaded

## Architecture

```
User Upload Photos → Backend (Node.js)
                    ↓
              Gemini Generates
              Professional Photo
                    ↓
              Upload to R2 (temp)
                    ↓
            Face-Swap Service (Python)
            - Download images
            - Detect faces
            - Swap faces
            - Return swapped image
                    ↓
              Backend receives
              Swapped image
                    ↓
              Upload final to R2
                    ↓
              User sees perfect
              professional headshot!
```

## Tech Stack

- **Framework**: Flask
- **Face Detection**: InsightFace (RetinaFace)
- **Face Swapping**: InsightFace inswapper_128
- **Image Processing**: OpenCV, NumPy, Pillow
- **Server**: Gunicorn (production)

## Scoring Algorithm

Photos are scored 0-100 based on:
- Face detection confidence (30 pts)
- Face angle - front-facing preferred (25 pts)
- Image sharpness (15 pts)
- Lighting quality (15 pts)
- Image resolution (10 pts)
- Face size in frame (5 pts)

## Error Handling

- Graceful fallback if face detection fails
- Automatic retry with fallback reference photos
- Returns original Gemini image if all swaps fail
- Comprehensive logging for debugging

## License

MIT
