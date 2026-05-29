# Student Records API

CRUD REST API for managing student records using Node.js, Express, and MongoDB.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and update the MongoDB URI if needed.
3. Start the API:
   ```bash
   npm start
   ```

## Endpoints

- `GET /api/students`
- `GET /api/students/:id`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`

## Browser Tester

Open `http://localhost:3000/` to use the built-in page for creating, updating, deleting, and refreshing students.

## Student Fields

- `name` string, required
- `email` string, required, unique
- `age` number, optional
- `grade` string, optional
- `major` string, optional
- `enrolled` boolean, optional
