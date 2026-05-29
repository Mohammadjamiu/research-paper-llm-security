"""
Secure File Upload API for User Profile Images
Built with Flask, featuring comprehensive security measures
"""

import os
import uuid
import hashlib
import mimetypes
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, request, jsonify, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from PIL import Image
import magic

# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    """Application configuration with security-focused defaults"""
    
    # Upload settings
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max file size
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads/profile_images')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ALLOWED_MIME_TYPES = {'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'}
    
    # Security settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    REQUIRE_AUTH = os.environ.get('REQUIRE_AUTH', 'true').lower() == 'true'
    API_TOKEN = os.environ.get('API_TOKEN', 'your-secure-api-token-here')
    
    # Rate limiting
    RATELIMIT_STORAGE_URI = os.environ.get('RATELIMIT_STORAGE_URI', 'memory://')
    DEFAULT_RATE_LIMIT = "10 per minute"
    
    # Image processing
    MAX_IMAGE_WIDTH = 2048
    MAX_IMAGE_HEIGHT = 2048
    MIN_IMAGE_WIDTH = 50
    MIN_IMAGE_HEIGHT = 50
    
    # Virus scanning (optional - requires clamav)
    ENABLE_VIRUS_SCAN = os.environ.get('ENABLE_VIRUS_SCAN', 'false').lower() == 'true'


# ============================================================================
# APP INITIALIZATION
# ============================================================================

app = Flask(__name__)
app.config.from_object(Config)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri=app.config['RATELIMIT_STORAGE_URI'],
    default_limits=[app.config['DEFAULT_RATE_LIMIT']]
)

# Ensure upload directory exists
Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)


# ============================================================================
# SECURITY UTILITIES
# ============================================================================

def verify_api_token(f):
    """Decorator to verify API token authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not app.config['REQUIRE_AUTH']:
            return f(*args, **kwargs)
        
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'Authentication required',
                'message': 'Authorization header is missing'
            }), 401
        
        # Support "Bearer <token>" format
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        else:
            token = auth_header
        
        if token != app.config['API_TOKEN']:
            return jsonify({
                'success': False,
                'error': 'Authentication failed',
                'message': 'Invalid API token'
            }), 401
        
        return f(*args, **kwargs)
    return decorated_function


def validate_file_extension(filename):
    """
    Validate file extension against whitelist.
    Returns True if valid, False otherwise.
    """
    if not filename or '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in app.config['ALLOWED_EXTENSIONS']


def validate_mime_type(file_path):
    """
    Validate MIME type using python-magic (libmagic).
    This validates the actual file content, not just the extension.
    """
    try:
        mime = magic.from_file(file_path, mime=True)
        return mime in app.config['ALLOWED_MIME_TYPES']
    except Exception as e:
        app.logger.error(f"MIME validation error: {e}")
        return False


def validate_image_content(file_path):
    """
    Validate that the file is a valid image by attempting to open it with PIL.
    This prevents malicious files with fake extensions.
    """
    try:
        with Image.open(file_path) as img:
            # Verify the image by loading it
            img.verify()
        
        # Re-open to check dimensions (verify() closes the file)
        with Image.open(file_path) as img:
            width, height = img.size
            
            # Check minimum dimensions
            if width < app.config['MIN_IMAGE_WIDTH'] or height < app.config['MIN_IMAGE_HEIGHT']:
                return False, f"Image too small. Minimum size: {app.config['MIN_IMAGE_WIDTH']}x{app.config['MIN_IMAGE_HEIGHT']}"
            
            # Check maximum dimensions
            if width > app.config['MAX_IMAGE_WIDTH'] or height > app.config['MAX_IMAGE_HEIGHT']:
                return False, f"Image too large. Maximum size: {app.config['MAX_IMAGE_WIDTH']}x{app.config['MAX_IMAGE_HEIGHT']}"
        
        return True, None
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"


def scan_for_viruses(file_path):
    """
    Scan file for viruses using ClamAV (if enabled).
    Returns (is_clean, message) tuple.
    """
    if not app.config['ENABLE_VIRUS_SCAN']:
        return True, None
    
    try:
        import clamd
        cd = clamd.ClamdUnixSocket()
        result = cd.scan(file_path)
        
        if result and file_path in result:
            status, virus_name = result[file_path]
            if status == 'FOUND':
                return False, f"Virus detected: {virus_name}"
        
        return True, None
    except ImportError:
        app.logger.warning("ClamAV not installed, skipping virus scan")
        return True, None
    except Exception as e:
        app.logger.error(f"Virus scan error: {e}")
        # Fail secure - if scan fails, reject the file
        return False, "Virus scan failed"


def sanitize_filename(filename):
    """
    Generate a secure, unique filename while preserving the extension.
    Uses UUID to prevent directory traversal and filename collisions.
    """
    # Get the extension (if any)
    if '.' in filename:
        ext = filename.rsplit('.', 1)[1].lower()
    else:
        ext = 'bin'
    
    # Generate UUID-based filename
    unique_id = uuid.uuid4().hex
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    
    return f"{timestamp}_{unique_id}.{ext}"


def compute_file_hash(file_path):
    """Compute SHA-256 hash of file for deduplication and integrity"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def process_image(file_path, max_size=(1024, 1024)):
    """
    Process uploaded image: resize if needed, strip metadata, convert to safe format.
    Returns the path to the processed image.
    """
    try:
        with Image.open(file_path) as img:
            # Convert to RGB if necessary (handles RGBA, P mode, etc.)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if larger than max_size
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Strip all EXIF data by creating a new image
            data = list(img.getdata())
            clean_img = Image.new(img.mode, img.size)
            clean_img.putdata(data)
            
            # Save as JPEG with quality optimization
            processed_path = file_path.rsplit('.', 1)[0] + '_processed.jpg'
            clean_img.save(processed_path, 'JPEG', quality=85, optimize=True)
            
            return processed_path
    except Exception as e:
        app.logger.error(f"Image processing error: {e}")
        return None


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'error': 'File too large',
        'message': f'Maximum file size is {app.config["MAX_CONTENT_LENGTH"] // (1024*1024)}MB'
    }), 413


@app.errorhandler(429)
def ratelimit_handler(error):
    """Handle rate limit exceeded"""
    return jsonify({
        'success': False,
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.'
    }), 429


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors"""
    app.logger.error(f"Internal error: {error}")
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred. Please try again.'
    }), 500


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })


@app.route('/upload', methods=['POST'])
@verify_api_token
@limiter.limit("5 per minute")
def upload_file():
    """
    Secure file upload endpoint for profile images.
    
    Headers required:
        - Authorization: Bearer <token>
    
    Form data:
        - file: The image file to upload
        - user_id (optional): User identifier for organization
    
    Returns:
        - success: Boolean indicating upload status
        - file_url: URL to access the uploaded file
        - file_hash: SHA-256 hash of the file
    """
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file provided',
            'message': 'Request must include a file in the "file" field'
        }), 400
    
    file = request.files['file']
    
    # Check if user selected a file
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected',
            'message': 'Please select a file to upload'
        }), 400
    
    # Validate file extension
    if not validate_file_extension(file.filename):
        return jsonify({
            'success': False,
            'error': 'Invalid file type',
            'message': f'Allowed types: {", ".join(app.config["ALLOWED_EXTENSIONS"])}'
        }), 400
    
    # Generate secure filename
    secure_name = sanitize_filename(file.filename)
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{secure_name}")
    
    try:
        # Save file temporarily for validation
        file.save(temp_path)
        
        # Validate MIME type (content-based, not extension-based)
        if not validate_mime_type(temp_path):
            os.remove(temp_path)
            return jsonify({
                'success': False,
                'error': 'Invalid file content',
                'message': 'File content does not match allowed image types'
            }), 400
        
        # Validate image content
        is_valid, error_msg = validate_image_content(temp_path)
        if not is_valid:
            os.remove(temp_path)
            return jsonify({
                'success': False,
                'error': 'Image validation failed',
                'message': error_msg
            }), 400
        
        # Virus scan (if enabled)
        is_clean, virus_msg = scan_for_viruses(temp_path)
        if not is_clean:
            os.remove(temp_path)
            return jsonify({
                'success': False,
                'error': 'Security violation',
                'message': virus_msg
            }), 400
        
        # Compute file hash for deduplication/integrity
        file_hash = compute_file_hash(temp_path)
        
        # Process image (resize, strip metadata)
        processed_path = process_image(temp_path)
        if processed_path:
            # Replace original with processed version
            os.remove(temp_path)
            temp_path = processed_path
            final_filename = secure_name.rsplit('.', 1)[0] + '_processed.jpg'
        else:
            final_filename = secure_name
        
        # Move to final location
        final_path = os.path.join(app.config['UPLOAD_FOLDER'], final_filename)
        os.rename(temp_path, final_path)
        
        # Get user_id if provided (for organization)
        user_id = request.form.get('user_id', 'anonymous')
        
        # Log upload for audit trail
        app.logger.info(f"File uploaded: {final_filename} by user: {user_id}, hash: {file_hash}")
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'data': {
                'filename': final_filename,
                'file_url': f"/uploads/{final_filename}",
                'file_hash': file_hash,
                'uploaded_at': datetime.utcnow().isoformat(),
                'user_id': user_id
            }
        }), 201
        
    except Exception as e:
        # Clean up temp file if it exists
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        app.logger.error(f"Upload error: {e}")
        return jsonify({
            'success': False,
            'error': 'Upload failed',
            'message': 'An error occurred during file processing'
        }), 500


@app.route('/uploads/<filename>', methods=['GET'])
@limiter.limit("30 per minute")
def serve_file(filename):
    """
    Serve uploaded files securely.
    Validates filename to prevent directory traversal attacks.
    """
    # Validate filename - only allow alphanumeric, dash, underscore, and dot
    import re
    if not re.match(r'^[a-zA-Z0-9_.-]+$', filename):
        return jsonify({
            'success': False,
            'error': 'Invalid filename'
        }), 400
    
    # Check for directory traversal attempts
    if '..' in filename or filename.startswith('/'):
        return jsonify({
            'success': False,
            'error': 'Invalid filename'
        }), 400
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    # Ensure file exists and is within upload directory
    if not os.path.exists(file_path):
        return jsonify({
            'success': False,
            'error': 'File not found'
        }), 404
    
    # Security check: ensure the resolved path is within upload folder
    real_path = os.path.realpath(file_path)
    real_upload_dir = os.path.realpath(app.config['UPLOAD_FOLDER'])
    if not real_path.startswith(real_upload_dir):
        return jsonify({
            'success': False,
            'error': 'Access denied'
        }), 403
    
    # Serve file with appropriate headers
    mime_type, _ = mimetypes.guess_type(file_path)
    response = app.send_static_file(file_path)
    response.headers['Content-Type'] = mime_type or 'application/octet-stream'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Disposition'] = 'inline'
    
    return response


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    # In production, use a proper WSGI server like gunicorn
    # gunicorn -w 4 -b 0.0.0.0:5000 app:app
    app.run(debug=False, host='0.0.0.0', port=5000)