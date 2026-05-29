# Admin Dashboard Backend

A comprehensive admin dashboard backend with role-based access control (RBAC) built with Node.js, Express, and SQLite.

## Features

- **Authentication**: JWT-based authentication with access and refresh tokens
- **Role-Based Access Control (RBAC)**: Flexible permission system with users, roles, and permissions
- **Security**: Helmet, CORS, rate limiting, bcrypt password hashing
- **API**: RESTful API design with proper error handling
- **Validation**: Request validation with Zod
- **Logging**: HTTP request logging with Morgan

## Architecture

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── database/       # Database setup and migrations
├── middleware/     # Express middleware
├── models/         # Data models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── server.js       # Application entry point
```

## RBAC System

### Entities

1. **Users**: System users with credentials and assigned roles
2. **Roles**: Collections of permissions (e.g., Admin, Editor, Viewer)
3. **Permissions**: Granular access rights (e.g., users:read, users:write)

### Permission Format

Permissions follow the format `resource:action`:
- `users:read` - Read user data
- `users:write` - Create/update users
- `users:delete` - Delete users
- `roles:read` - Read roles
- `roles:write` - Manage roles
- `permissions:read` - Read permissions
- `system:admin` - Full system access

### Default Roles

- **Super Admin**: Full system access
- **Admin**: User and role management
- **Editor**: Content management
- **Viewer**: Read-only access

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Initialize Database & Seed Data

```bash
npm run seed
```

### 4. Start Server

```bash
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/users` | List all users | users:read |
| GET | `/api/users/:id` | Get user by ID | users:read |
| POST | `/api/users` | Create user | users:write |
| PUT | `/api/users/:id` | Update user | users:write |
| DELETE | `/api/users/:id` | Delete user | users:delete |
| PUT | `/api/users/:id/roles` | Assign roles to user | roles:write |

### Roles

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/roles` | List all roles | roles:read |
| GET | `/api/roles/:id` | Get role by ID | roles:read |
| POST | `/api/roles` | Create role | roles:write |
| PUT | `/api/roles/:id` | Update role | roles:write |
| DELETE | `/api/roles/:id` | Delete role | roles:write |
| PUT | `/api/roles/:id/permissions` | Assign permissions | roles:write |

### Permissions

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/permissions` | List all permissions | permissions:read |
| GET | `/api/permissions/:id` | Get permission by ID | permissions:read |

### Admin Dashboard

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/admin/stats` | Get dashboard stats | system:admin |
| GET | `/api/admin/audit-logs` | Get audit logs | system:admin |

## Default Credentials

After seeding, the following accounts are available:

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | SuperAdmin123! | Super Admin |
| admin@example.com | Admin123! | Admin |
| editor@example.com | Editor123! | Editor |
| viewer@example.com | Viewer123! | Viewer |

## Permission Middleware Usage

```javascript
const { authenticate, requirePermission, requireRole } = require('./middleware/auth');

// Require specific permission
router.get('/users', authenticate, requirePermission('users:read'), userController.list);

// Require any of multiple permissions
router.post('/users', authenticate, requirePermission(['users:write', 'system:admin']), userController.create);

// Require specific role
router.get('/admin', authenticate, requireRole('Super Admin'), adminController.dashboard);

// Require all permissions
router.delete('/users/:id', authenticate, requirePermission(['users:delete', 'system:admin']), userController.delete);
```

## Development

### Running Tests

```bash
npm test
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User-Role junction table
CREATE TABLE user_roles (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Role-Permission junction table
CREATE TABLE role_permissions (
    role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## License

MIT
