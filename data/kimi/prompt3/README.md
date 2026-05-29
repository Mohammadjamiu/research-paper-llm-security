# Student Records API

A RESTful API for managing student records built with Node.js, Express, and MongoDB.

## Features

- Complete CRUD operations for student records
- **Interactive Web Interface** for easy API testing
- Pagination, sorting, and filtering support
- Search functionality
- Error handling and validation
- MongoDB with Mongoose ODM
- Environment configuration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/student-records
NODE_ENV=development
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Web Interface

The application includes a beautiful, interactive web interface for testing the API:

### Features:
- **Create Student**: Form to add new students with validation
- **Read & Search**: 
  - Search by name or email
  - Filter by grade (A, B, C, D, F)
  - Filter by active status
  - Pagination support
  - Click any student to auto-fill update/delete forms
- **Update Student**: Pre-filled form when selecting a student
- **Delete Student**: Confirmation dialog before deletion
- **Get by ID**: Retrieve specific student details
- **Response History**: Shows last 10 API responses with full details

### How to Use:
1. Visit `http://localhost:3000`
2. Use the Create form to add students
3. Click "Search & Refresh" to load students
4. Click on any student card to select it
5. The Update and Delete forms will auto-fill with the selected student's data
6. View API responses at the bottom of the page

## API Endpoints

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students` | Create a new student |
| GET | `/api/students` | Get all students (with pagination) |
| GET | `/api/students/:id` | Get a student by ID |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |
| GET | `/api/students/grade/:grade` | Get students by grade |

### Query Parameters

For `GET /api/students`:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field (default: -createdAt)
- `search` - Search by name or email
- `isActive` - Filter by active status (true/false)
- `grade` - Filter by grade

### Request/Response Examples

#### Create Student
```json
POST /api/students
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "age": 20,
  "grade": "A",
  "courses": ["Math", "Science"]
}
```

#### Get All Students with Pagination
```json
GET /api/students?page=1&limit=5&search=john&grade=A
```

#### Update Student
```json
PUT /api/students/65a1b2c3d4e5f6g7h8i9j0k1
{
  "age": 21,
  "grade": "A+"
}
```

## Student Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | String | Yes | Student's first name |
| lastName | String | Yes | Student's last name |
| email | String | Yes | Unique email address |
| age | Number | Yes | Student's age (0-120) |
| grade | String | Yes | Academic grade |
| enrollmentDate | Date | No | Auto-generated |
| courses | Array | No | List of courses |
| isActive | Boolean | No | Status flag |

## Project Structure

```
.
├── public/
│   └── index.html          # Interactive web interface
├── src/
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── app.js             # Express app configuration
│   └── index.js           # Server entry point
├── .env                   # Environment variables
├── package.json
└── README.md
```

## Testing with cURL

```bash
# Create a student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","age":20,"grade":"A"}'

# Get all students with pagination
curl "http://localhost:3000/api/students?page=1&limit=5&search=john"

# Update a student
curl -X PUT http://localhost:3000/api/students/<id> \
  -H "Content-Type: application/json" \
  -d '{"grade":"A+"}'

# Delete a student
curl -X DELETE http://localhost:3000/api/students/<id>
```
