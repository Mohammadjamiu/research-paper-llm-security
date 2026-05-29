# Secure File Upload API

A production-ready, security-focused file upload API built with Flask for handling user profile images.

## Features

### Security
- **Authentication**: Token-based API authentication with Bearer token support
- **File Validation**: Multi-layer validation (extension, MIME type, content)
- **Virus Scanning**: Optional ClamAV integration for malware detection
- **Rate Limiting**: Configurable per-endpoint rate limiting
- **Directory Traversal Protection**: Path sanitization and validation
- **Filename Sanitization**: UUID-based filenames to prevent conflicts and attacks
- **Image Processing**: Automatic resizing and EXIF data stripping
- **Size Limits**: Configurable file size and image dimension limits

### Functionality
- Supported formats: PNG, JPG, JPEG, GIF, WebP
- Automatic image optimization and format conversion
- SHA-256 hash computation for file integrity
- Comprehensive error handling and logging
- Health check endpoint
- File serving with security headers

## Quick Start

### 1. Installation

```bash
# Clone or navigate to the project directory
cd secure-file-upload-api

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Important: Change the API_TOKEN and SECRET_KEY in production!
```

### 3. Run the API

```bash
# Development
python app.py

# Production (using gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Upload File
```bash
POST /upload
Headers:
  Authorization: Bearer <your-api-token>

Form Data:
  file: <image file>
  user_id: <optional user identifier>
```

**Example:**
```bash
curl -X POST http://localhost:5000/upload \
  -H "Authorization: Bearer your-api-token" \
  -F "file=@profile.jpg" \
  -F "user_id=user123"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "20240115_120000_a1b2c3d4e5f6_processed.jpg",
    "file_url": "/uploads/20240115_120000_a1b2c3d4e5f6_processed.jpg",
    "file_hash": "sha256-hash-of-file",
    "uploaded_at": "2024-01-15T12:00:00",
    "user_id": "user123"
  }
}
```

### Download File
```bash
GET /uploads/<filename>
```

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | `dev-secret-key-change-in-production` |
| `API_TOKEN` | API authentication token | `your-secure-api-token-here` |
| `REQUIRE_AUTH` | Enable/disable authentication | `true` |
| `UPLOAD_FOLDER` | Upload directory path | `uploads/profile_images` |
| `MAX_CONTENT_LENGTH` | Maximum file size (bytes) | `5242880` (5MB) |
| `ENABLE_VIRUS_SCAN` | Enable ClamAV scanning | `false` |
| `MAX_IMAGE_WIDTH` | Maximum image width | `2048` |
| `MAX_IMAGE_HEIGHT` | Maximum image height | `2048` |
| `RATELIMIT_STORAGE_URI` | Rate limiter backend | `memory://` |

## Security Measures

### 1. File Extension Validation
Only allows whitelisted extensions: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`

### 2. MIME Type Validation
Uses `python-magic` (libmagic) to verify actual file content, not just extension

### 3. Image Content Verification
Opens images with PIL to verify they're valid images, not disguised scripts

### 4. Filename Sanitization
- Generates UUID-based filenames
- Prevents directory traversal attacks
- Adds timestamps for organization

### 5. Image Processing
- Converts all images to RGB JPEG
- Strips all EXIF metadata
- Resizes to maximum dimensions
- Optimizes file size

### 6. Rate Limiting
- Upload: 5 requests per minute
- Download: 30 requests per minute
- Configurable per endpoint

### 7. Authentication
- Token-based API authentication
- Supports Bearer token format
- Can be disabled for testing

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Test specific module
pytest tests/test_app.py::test_upload_valid_image -v
```

## Client Example

```python
import requests

# Upload a file
url = "http://localhost:5000/upload"
headers = {"Authorization": "Bearer your-api-token"}

with open("profile.jpg", "rb") as f:
    files = {"file": ("profile.jpg", f)}
    response = requests.post(url, headers=headers, files=files)

print(response.json())
```

See `examples/client_example.py` for more examples.

## Production Deployment

### 1. Environment Variables

```bash
export FLASK_ENV=production
export SECRET_KEY=$(openssl rand -hex 32)
export API_TOKEN=$(openssl rand -hex 32)
export UPLOAD_FOLDER=/var/www/uploads
export RATELIMIT_STORAGE_URI=redis://localhost:6379/0
```

### 2. Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads/profile_images

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### 3. Using Nginx as Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Submit a pull request

## Security Disclosure

If you discover a security vulnerability, please report it responsibly by emailing security@example.com.