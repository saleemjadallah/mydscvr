"""
Face-Swapping Microservice
Provides high-quality face-swapping using InsightFace for perfect facial accuracy.
"""

import os
import io
import time
import logging
from typing import Optional, Tuple, Dict, Any
from pathlib import Path

import cv2
import numpy as np
import requests
from PIL import Image
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import insightface
from insightface.app import FaceAnalysis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global face analysis model (loaded once at startup)
face_analyzer: Optional[FaceAnalysis] = None
face_swapper = None

# Model directory for InsightFace models
MODEL_DIR = Path('./models')
MODEL_DIR.mkdir(exist_ok=True)


def initialize_models():
    """Initialize InsightFace models at startup."""
    global face_analyzer, face_swapper

    try:
        logger.info("Initializing InsightFace models...")

        # Initialize face analysis (detection + recognition)
        face_analyzer = FaceAnalysis(
            name='buffalo_l',
            root=str(MODEL_DIR),
            providers=['CPUExecutionProvider']  # Use CPU (GPU if available: 'CUDAExecutionProvider')
        )
        face_analyzer.prepare(ctx_id=0, det_size=(640, 640))

        # Initialize face swapper
        model_path = MODEL_DIR / 'inswapper_128.onnx'

        # Download inswapper model if not exists
        if not model_path.exists():
            logger.info("Downloading face swapper model...")
            # Try multiple mirror URLs for the inswapper model (November 2025 working mirrors)
            download_urls = [
                "https://github.com/facefusion/facefusion-assets/releases/download/models/inswapper_128.onnx",
                "https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx",
                "https://huggingface.co/CountFloyd/deepfake/resolve/main/inswapper_128.onnx",
            ]

            downloaded = False
            for download_url in download_urls:
                try:
                    logger.info(f"Trying: {download_url}")
                    response = requests.get(download_url, stream=True, timeout=300)
                    response.raise_for_status()

                    with open(model_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    logger.info("Face swapper model downloaded successfully")
                    downloaded = True
                    break
                except Exception as e:
                    logger.warning(f"Failed to download from {download_url}: {e}")
                    continue

            if not downloaded:
                raise Exception("Failed to download inswapper model from all mirrors")

        # Load swapper model
        from insightface.model_zoo import get_model
        face_swapper = get_model(str(model_path), providers=['CPUExecutionProvider'])

        logger.info("✓ InsightFace models initialized successfully")
        return True

    except Exception as e:
        logger.error(f"Failed to initialize models: {e}")
        return False


def download_image(url: str) -> Optional[np.ndarray]:
    """Download image from URL and convert to OpenCV format."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        # Convert to numpy array
        image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            logger.error(f"Failed to decode image from URL: {url}")
            return None

        return image

    except Exception as e:
        logger.error(f"Error downloading image from {url}: {e}")
        return None


def analyze_face_quality(image: np.ndarray) -> Dict[str, Any]:
    """
    Analyze photo quality for face-swapping suitability.
    Returns score 0-100 and detailed metrics.
    """
    try:
        # Detect face
        faces = face_analyzer.get(image)

        if not faces:
            return {
                'score': 0,
                'face_detected': False,
                'error': 'No face detected'
            }

        face = faces[0]  # Use first detected face
        bbox = face.bbox.astype(int)

        # Calculate quality metrics
        score = 0

        # 1. Face detection confidence (30 points)
        confidence = float(face.det_score)
        score += confidence * 30

        # 2. Face angle - prefer front-facing (25 points)
        # Check pose (yaw, pitch, roll)
        pose = face.pose if hasattr(face, 'pose') else [0, 0, 0]
        yaw = abs(pose[0]) if len(pose) > 0 else 0

        if yaw < 15:
            score += 25
        elif yaw < 30:
            score += 15
        else:
            score += 5

        # 3. Image resolution (10 points)
        height, width = image.shape[:2]
        resolution = min(width, height)

        if resolution >= 1024:
            score += 10
        elif resolution >= 800:
            score += 7
        else:
            score += 3

        # 4. Face size in image (10 points)
        face_width = bbox[2] - bbox[0]
        face_height = bbox[3] - bbox[1]
        face_area = face_width * face_height
        image_area = width * height
        face_ratio = face_area / image_area

        if face_ratio > 0.15:  # Face is >15% of image
            score += 10
        elif face_ratio > 0.08:
            score += 6
        else:
            score += 2

        # 5. Image sharpness (15 points)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        sharpness = min(laplacian_var / 500, 1.0)  # Normalize
        score += sharpness * 15

        # 6. Lighting quality (10 points)
        # Calculate mean brightness
        brightness = np.mean(gray)
        if 80 < brightness < 180:  # Good range
            score += 10
        elif 60 < brightness < 200:
            score += 6
        else:
            score += 2

        return {
            'score': round(score, 1),
            'face_detected': True,
            'confidence': round(confidence, 3),
            'yaw_angle': round(float(yaw), 1),
            'front_facing': yaw < 15,
            'resolution': f"{width}x{height}",
            'face_size_ratio': round(face_ratio, 3),
            'sharpness': round(sharpness, 3),
            'brightness': round(float(brightness), 1),
            'num_faces': len(faces)
        }

    except Exception as e:
        logger.error(f"Error analyzing face quality: {e}")
        return {
            'score': 0,
            'face_detected': False,
            'error': str(e)
        }


def swap_face(target_image: np.ndarray, source_image: np.ndarray) -> Optional[np.ndarray]:
    """
    Swap face from source image onto target image.

    Args:
        target_image: Image to receive the swapped face (professional headshot from Gemini)
        source_image: Image with the face to extract (user's reference photo)

    Returns:
        Image with swapped face, or None if failed
    """
    try:
        # Detect faces in both images
        target_faces = face_analyzer.get(target_image)
        source_faces = face_analyzer.get(source_image)

        if not target_faces:
            logger.error("No face detected in target image")
            return None

        if not source_faces:
            logger.error("No face detected in source image")
            return None

        # Use first face from each image
        target_face = target_faces[0]
        source_face = source_faces[0]

        # Perform face swap
        result = face_swapper.get(target_image, target_face, source_face, paste_back=True)

        logger.info("Face swap completed successfully")
        return result

    except Exception as e:
        logger.error(f"Error during face swap: {e}")
        return None


# ============================================================================
# INITIALIZE MODELS ON IMPORT (for Gunicorn)
# ============================================================================

# Initialize models when module is imported by Gunicorn
# This ensures models are loaded even when using WSGI servers
logger.info("=" * 60)
logger.info("Face-Swapping Microservice Starting")
logger.info("=" * 60)

if not initialize_models():
    logger.error("WARNING: Models failed to initialize. Service will report unhealthy.")
else:
    logger.info("✓ Models loaded and ready for requests")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'face-swap-service',
        'models_loaded': face_analyzer is not None and face_swapper is not None
    })


@app.route('/analyze-photo', methods=['POST'])
def analyze_photo_endpoint():
    """
    Analyze photo quality for face-swapping.

    Request body:
        {
            "image_url": "https://..."
        }

    Response:
        {
            "success": true,
            "data": {
                "score": 87.5,
                "face_detected": true,
                "confidence": 0.998,
                "front_facing": true,
                ...
            }
        }
    """
    try:
        data = request.get_json()

        if not data or 'image_url' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image_url in request body'
            }), 400

        image_url = data['image_url']
        logger.info(f"Analyzing photo: {image_url}")

        # Download image
        image = download_image(image_url)
        if image is None:
            return jsonify({
                'success': False,
                'error': 'Failed to download or decode image'
            }), 400

        # Analyze quality
        analysis = analyze_face_quality(image)

        return jsonify({
            'success': True,
            'data': analysis
        })

    except Exception as e:
        logger.error(f"Error in analyze_photo endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/swap-face', methods=['POST'])
def swap_face_endpoint():
    """
    Swap face from source image onto target image.

    Request body:
        {
            "target_url": "https://...",  # Gemini generated image
            "source_url": "https://..."   # User's reference photo
        }

    Response:
        Binary image data (JPEG)
    """
    try:
        data = request.get_json()

        if not data or 'target_url' not in data or 'source_url' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing target_url or source_url in request body'
            }), 400

        target_url = data['target_url']
        source_url = data['source_url']

        logger.info(f"Face swap request:")
        logger.info(f"  Target: {target_url}")
        logger.info(f"  Source: {source_url}")

        start_time = time.time()

        # Download images
        target_image = download_image(target_url)
        source_image = download_image(source_url)

        if target_image is None or source_image is None:
            return jsonify({
                'success': False,
                'error': 'Failed to download images'
            }), 400

        # Perform face swap
        result_image = swap_face(target_image, source_image)

        if result_image is None:
            return jsonify({
                'success': False,
                'error': 'Face swap failed - no faces detected or swap error'
            }), 500

        # Convert to JPEG
        success, buffer = cv2.imencode('.jpg', result_image, [cv2.IMWRITE_JPEG_QUALITY, 95])

        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to encode result image'
            }), 500

        elapsed_time = time.time() - start_time
        logger.info(f"Face swap completed in {elapsed_time:.2f}s")

        # Return image as binary
        return send_file(
            io.BytesIO(buffer.tobytes()),
            mimetype='image/jpeg',
            as_attachment=False
        )

    except Exception as e:
        logger.error(f"Error in swap_face endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/select-best-photo', methods=['POST'])
def select_best_photo_endpoint():
    """
    Analyze multiple photos and select the best one for face-swapping.

    Request body:
        {
            "image_urls": ["https://...", "https://...", ...]
        }

    Response:
        {
            "success": true,
            "data": {
                "primary": "https://...",
                "fallbacks": ["https://...", "https://..."],
                "scores": [
                    {"url": "https://...", "score": 87.5, ...},
                    ...
                ]
            }
        }
    """
    try:
        data = request.get_json()

        if not data or 'image_urls' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image_urls in request body'
            }), 400

        image_urls = data['image_urls']

        if not isinstance(image_urls, list) or len(image_urls) == 0:
            return jsonify({
                'success': False,
                'error': 'image_urls must be a non-empty array'
            }), 400

        logger.info(f"Selecting best photo from {len(image_urls)} candidates")

        # Analyze all photos
        results = []
        for url in image_urls:
            image = download_image(url)
            if image is not None:
                analysis = analyze_face_quality(image)
                analysis['url'] = url
                results.append(analysis)

        if not results:
            return jsonify({
                'success': False,
                'error': 'No valid images found'
            }), 400

        # Sort by score
        results.sort(key=lambda x: x['score'], reverse=True)

        # Select top 3
        primary = results[0]['url']
        fallbacks = [r['url'] for r in results[1:3]] if len(results) > 1 else []

        logger.info(f"Best photo selected: {primary} (score: {results[0]['score']})")

        return jsonify({
            'success': True,
            'data': {
                'primary': primary,
                'fallbacks': fallbacks,
                'scores': results
            }
        })

    except Exception as e:
        logger.error(f"Error in select_best_photo endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# STARTUP
# ============================================================================

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Starting Face-Swapping Microservice")
    logger.info("=" * 60)

    # Initialize models at startup
    if not initialize_models():
        logger.error("Failed to initialize models. Exiting.")
        exit(1)

    # Start Flask server
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Server starting on port {port}")

    app.run(
        host='0.0.0.0',
        port=port,
        debug=False
    )
