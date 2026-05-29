"""
Example client implementations for the Secure File Upload API
"""

import requests
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:5000"
API_TOKEN = "your-secure-api-token-here"


def upload_file_python_requests(file_path, user_id=None):
    """
    Upload a file using Python requests library
    
    Args:
        file_path: Path to the image file
        user_id: Optional user identifier
    
    Returns:
        Response JSON or None if error
    """
    url = f"{API_BASE_URL}/upload"
    
    headers = {
        'Authorization': f'Bearer {API_TOKEN}'
    }
    
    data = {}
    if user_id:
        data['user_id'] = user_id
    
    with open(file_path, 'rb') as f:
        files = {'file': (Path(file_path).name, f)}
        response = requests.post(url, headers=headers, files=files, data=data)
    
    if response.status_code == 201:
        result = response.json()
        print(f"Upload successful!")
        print(f"  File URL: {API_BASE_URL}{result['data']['file_url']}")
        print(f"  File Hash: {result['data']['file_hash']}")
        return result
    else:
        print(f"Upload failed: {response.status_code}")
        print(f"Response: {response.json()}")
        return None


def upload_file_curl_command(file_path, user_id=None):
    """
    Generate curl command for file upload
    
    Args:
        file_path: Path to the image file
        user_id: Optional user identifier
    
    Returns:
        curl command string
    """
    cmd = f'curl -X POST {API_BASE_URL}/upload \\\n'
    cmd += f'  -H "Authorization: Bearer {API_TOKEN}" \\\n'
    cmd += f'  -F "file=@{file_path}" \\\n'
    if user_id:
        cmd += f'  -F "user_id={user_id}" \\\n'
    cmd += '  -v'
    
    return cmd


def check_health():
    """Check API health status"""
    response = requests.get(f"{API_BASE_URL}/health")
    if response.status_code == 200:
        print(f"API is healthy: {response.json()}")
        return True
    else:
        print(f"API health check failed: {response.status_code}")
        return False


def download_file(filename, output_path=None):
    """
    Download a file from the API
    
    Args:
        filename: Name of the file to download
        output_path: Where to save the file (optional)
    
    Returns:
        Path to downloaded file or None
    """
    url = f"{API_BASE_URL}/uploads/{filename}"
    response = requests.get(url)
    
    if response.status_code == 200:
        if output_path is None:
            output_path = f"downloaded_{filename}"
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        print(f"File downloaded to: {output_path}")
        return output_path
    else:
        print(f"Download failed: {response.status_code}")
        return None


# Example usage
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print(f"  python {sys.argv[0]} upload <file_path> [user_id]")
        print(f"  python {sys.argv[0]} health")
        print(f"  python {sys.argv[0]} curl <file_path> [user_id]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'upload' and len(sys.argv) >= 3:
        file_path = sys.argv[2]
        user_id = sys.argv[3] if len(sys.argv) > 3 else None
        upload_file_python_requests(file_path, user_id)
    
    elif command == 'health':
        check_health()
    
    elif command == 'curl' and len(sys.argv) >= 3:
        file_path = sys.argv[2]
        user_id = sys.argv[3] if len(sys.argv) > 3 else None
        print(upload_file_curl_command(file_path, user_id))
    
    else:
        print("Invalid command or missing arguments")