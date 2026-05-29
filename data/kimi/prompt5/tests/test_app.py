"""
Comprehensive tests for the Secure File Upload API
"""

import os
import io
import hashlib
import tempfile
from pathlib import Path

import pytest
from PIL import Image

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, Config, sanitize_filename, validate_file_extension, compute_file_hash


@pytest.fixture
def client():
    """Create a test client"""
    app.config['TESTING'] = True
    app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
    app.config['REQUIRE_AUTH'] = True
    app.config['API_TOKEN'] = 'test-token-123'
    
    with app.test_client() as client:
        yield client
    
    # Cleanup
    import shutil
    shutil.rmtree(app.config['UPLOAD_FOLDER'], ignore_errors=True)


@pytest.fixture
def auth_headers():
    """Return authentication headers"""
    return {'Authorization': 'Bearer test-token-123'}


@pytest.fixture
def sample_image():
    """Create a sample valid image"""
    img = Image.new('RGB', (200, 200), color='red')
    img_io = io.BytesIO()
    img.save(img_io, 'JPEG', quality=95)
    img_io.seek(0)
    return img_io


# ============================================================================
# HEALTH CHECK TESTS
# ============================================================================

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert 'timestamp' in data


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

def test_upload_without_auth(client):
    """Test upload without authentication"""
    response = client.post('/upload')
    assert response.status_code == 401
    data = response.get_json()
    assert data['success'] is False
    assert 'Authentication required' in data['error']


def test_upload_with_invalid_auth(client):
    """Test upload with invalid token"""
    headers = {'Authorization': 'Bearer invalid-token'}
    response = client.post('/upload', headers=headers)
    assert response.status_code == 401
    data = response.get_json()
    assert data['success'] is False
    assert 'Invalid API token' in data['message']


def test_upload_with_bearer_token(client, auth_headers, sample_image):
    """Test upload with valid Bearer token"""
    data = {
        'file': (sample_image, 'test.jpg')
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    # Should not get 401 with valid auth
    assert response.status_code != 401


# ============================================================================
# FILE UPLOAD TESTS
# ============================================================================

def test_upload_no_file(client, auth_headers):
    """Test upload without file"""
    response = client.post('/upload', headers=auth_headers)
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'No file provided' in data['error']


def test_upload_empty_filename(client, auth_headers):
    """Test upload with empty filename"""
    data = {'file': (io.BytesIO(b''), '')}
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'No file selected' in data['error']


def test_upload_valid_image(client, auth_headers, sample_image):
    """Test upload of valid image"""
    data = {
        'file': (sample_image, 'profile.jpg')
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert 'filename' in data['data']
    assert 'file_hash' in data['data']
    assert 'file_url' in data['data']


def test_upload_with_user_id(client, auth_headers, sample_image):
    """Test upload with user_id parameter"""
    data = {
        'file': (sample_image, 'profile.jpg'),
        'user_id': 'user123'
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 201
    data = response.get_json()
    assert data['data']['user_id'] == 'user123'


# ============================================================================
# FILE VALIDATION TESTS
# ============================================================================

def test_upload_invalid_extension(client, auth_headers):
    """Test upload with invalid file extension"""
    data = {
        'file': (io.BytesIO(b'malicious content'), 'malware.exe')
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'Invalid file type' in data['error']


def test_upload_fake_image_extension(client, auth_headers):
    """Test upload of non-image file with image extension"""
    # Create a text file pretending to be an image
    fake_image = io.BytesIO(b'This is not an image')
    data = {
        'file': (fake_image, 'fake.jpg')
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False


def test_upload_script_with_image_extension(client, auth_headers):
    """Test upload of script file with image extension"""
    script_content = b'<?php system($_GET["cmd"]); ?>'
    fake_image = io.BytesIO(script_content)
    data = {
        'file': (fake_image, 'malicious.php.jpg')
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    # Should be rejected due to invalid image content
    assert response.status_code == 400


def test_upload_too_large_image(client, auth_headers):
    """Test upload of image exceeding size limits"""
    # Create a very large image
    img = Image.new('RGB', (5000, 5000), color='blue')
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    data = {
        'file': (img_io, 'huge.png')
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'too large' in data['message'].lower()


def test_upload_too_small_image(client, auth_headers):
    """Test upload of image below minimum size"""
    img = Image.new('RGB', (10, 10), color='green')
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    data = {
        'file': (img_io, 'tiny.png')
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'too small' in data['message'].lower()


# ============================================================================
# UTILITY FUNCTION TESTS
# ============================================================================

def test_validate_file_extension():
    """Test file extension validation"""
    assert validate_file_extension('image.jpg') is True
    assert validate_file_extension('image.png') is True
    assert validate_file_extension('image.jpeg') is True
    assert validate_file_extension('image.gif') is True
    assert validate_file_extension('image.webp') is True
    assert validate_file_extension('file.exe') is False
    assert validate_file_extension('file.php') is False
    assert validate_file_extension('file') is False
    assert validate_file_extension('') is False


def test_sanitize_filename():
    """Test filename sanitization"""
    # Should generate unique names
    name1 = sanitize_filename('image.jpg')
    name2 = sanitize_filename('image.jpg')
    assert name1 != name2
    
    # Should preserve extension
    assert name1.endswith('.jpg')
    
    # Should handle various inputs
    name3 = sanitize_filename('../../../etc/passwd.jpg')
    assert '..' not in name3
    assert name3.endswith('.jpg')
    
    # Should handle files without extension
    name4 = sanitize_filename('noextension')
    assert name4.endswith('.bin')


def test_compute_file_hash(tmp_path):
    """Test file hash computation"""
    test_file = tmp_path / 'test.txt'
    test_file.write_text('Hello, World!')
    
    expected_hash = hashlib.sha256(b'Hello, World!').hexdigest()
    actual_hash = compute_file_hash(str(test_file))
    
    assert actual_hash == expected_hash


# ============================================================================
# SECURITY TESTS
# ============================================================================

def test_directory_traversal_attempt(client, auth_headers):
    """Test protection against directory traversal"""
    # Attempt to access file outside upload directory
    response = client.get('/uploads/../../../etc/passwd')
    assert response.status_code == 400


def test_directory_traversal_with_valid_chars(client, auth_headers):
    """Test filename validation prevents directory traversal"""
    response = client.get('/uploads/..\..\..\etc\passwd')
    assert response.status_code == 400


def test_filename_with_special_chars(client, auth_headers, sample_image):
    """Test upload with special characters in filename"""
    data = {
        'file': (sample_image, '../../../etc/passwd.jpg')
    }
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    # Should succeed but with sanitized filename
    assert response.status_code == 201
    data = response.get_json()
    filename = data['data']['filename']
    assert '..' not in filename


# ============================================================================
# CONTENT TYPE TESTS
# ============================================================================

def test_upload_png(client, auth_headers):
    """Test PNG upload"""
    img = Image.new('RGB', (200, 200), color='blue')
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    data = {'file': (img_io, 'test.png')}
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 201


def test_upload_gif(client, auth_headers):
    """Test GIF upload"""
    img = Image.new('RGB', (200, 200), color='red')
    img_io = io.BytesIO()
    img.save(img_io, 'GIF')
    img_io.seek(0)
    
    data = {'file': (img_io, 'test.gif')}
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 201


def test_upload_webp(client, auth_headers):
    """Test WebP upload"""
    img = Image.new('RGB', (200, 200), color='green')
    img_io = io.BytesIO()
    img.save(img_io, 'WEBP')
    img_io.seek(0)
    
    data = {'file': (img_io, 'test.webp')}
    response = client.post('/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert response.status_code == 201


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == '__main__':
    pytest.main([__file__, '-v'])