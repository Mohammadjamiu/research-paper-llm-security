# Admin Dashboard API

This is a comprehensive admin dashboard backend with role-based access control (RBAC) built with Node.js, Express, and SQLite.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env if needed (default values work for development)
```

### 3. Initialize Database & Seed Data

```bash
npm run seed
```

This creates:
- 14 permissions (users:*, roles:*, permissions:*, system:*, audit:*, content:*)
- 4 default roles (Super Admin, Admin, Editor, Viewer)
- 4 default users with different permission levels

### 4. Start Server

```bash
npm run dev
```

The server will start on http://localhost:3000

### 5. Run Demo

```bash
node scripts/demo.js
```

## Default Credentials

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| superadmin@example.com | SuperAdmin123! | Super Admin | Full system access |
| admin@example.com | Admin123! | Admin | User and role management |
| editor@example.com | Editor123! | Editor | Content management |
| viewer@example.com | Viewer123! | Viewer | Read-only access |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/logout-all` - Logout from all devices
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users (requires users:read)
- `GET /api/users/stats` - Get user statistics (requires users:read)
- `GET /api/users/:id` - Get user by ID (requires users:read)
- `POST /api/users` - Create user (requires users:write)
- `PUT /api/users/:id` - Update user (requires users:write)
- `DELETE /api/users/:id` - Delete user (requires users:delete)
- `PUT /api/users/:id/roles` - Assign roles (requires roles:write)

### Roles
- `GET /api/roles` - List all roles (requires roles:read)
- `GET /api/roles/stats` - Get role statistics (requires roles:read)
- `GET /api/roles/:id` - Get role by ID (requires roles:read)
- `POST /api/roles` - Create role (requires roles:write)
- `PUT /api/roles/:id` - Update role (requires roles:write)
- `DELETE /api/roles/:id` - Delete role (requires roles:delete)
- `PUT /api/roles/:id/permissions` - Assign permissions (requires roles:write)

### Permissions
- `GET /api/permissions` - List all permissions (requires permissions:read)
- `GET /api/permissions/resources` - List permission resources (requires permissions:read)
- `GET /api/permissions/resource/:resource` - Get permissions by resource (requires permissions:read)

### Admin
- `GET /api/admin/stats` - Dashboard statistics (requires system:admin)
- `GET /api/admin/health` - System health check (requires system:admin)
- `GET /api/admin/audit-logs` - Get audit logs (requires system:admin)
- `GET /api/admin/audit-stats` - Get audit statistics (requires system:admin)

## RBAC System

### Permission Format
Permissions follow the format `resource:action`:

| Permission | Description |
|------------|-------------|
| users:read | Read user data |
| users:write | Create/update users |
| users:delete | Delete users |
| roles:read | Read roles |
| roles:write | Create/update roles |
| roles:delete | Delete roles |
| permissions:read | Read permissions |
| system:admin | Full system access |
| audit:read | Read audit logs |
| content:read | Read content |
| content:write | Create/update content |
| content:delete | Delete content |
| content:publish | Publish content |

### Default Role Permissions

| Role | Permissions |
|------|-------------|
| Super Admin | All permissions |
| Admin | users:*, roles:*, permissions:read, system:settings:*, audit:read, content:* |
| Editor | users:read, content:* |
| Viewer | users:read, roles:read, permissions:read, content:read |

## Testing with curl

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

### Get Users (with token)
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"email":"newuser@example.com","password":"NewUser123!","firstName":"New","lastName":"User"}'
```

## Project Structure

```
src/
├── config/         # Configuration files
│   ├── index.js    # Main config
│   └── permissions.js # Permission definitions
├── controllers/    # Route controllers
├── database/       # Database setup
│   ├── connection.js
│   └── seed.js
├── middleware/     # Express middleware
│   ├── auth.js     # Authentication
│   ├── rbac.js     # Role-based access control
│   ├── audit.js    # Audit logging
│   └── errorHandler.js
├── models/         # Data models
│   ├── User.js
│   ├── Role.js
│   ├── Permission.js
│   └── AuditLog.js
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
│   ├── helpers.js
│   └── validation.js
└── server.js       # Application entry point
```

## License

MIT
