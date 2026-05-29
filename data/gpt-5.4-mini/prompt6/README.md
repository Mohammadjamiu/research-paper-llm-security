# Admin Dashboard Backend with RBAC

Self-contained Node.js backend for an admin dashboard with:

- JWT authentication
- Role-based access control
- User, role, and permission management
- Audit logging
- JSON file persistence

## Run

```bash
npm start
```

## Seed credentials

- `admin@local.test` / `Admin123!`
- `manager@local.test` / `Manager123!`
- `viewer@local.test` / `Viewer123!`

## Main endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `GET /admin/stats`
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`
- `GET /admin/roles`
- `POST /admin/roles`
- `PATCH /admin/roles/:id`
- `DELETE /admin/roles/:id`
- `PUT /admin/roles/:id/permissions`
- `GET /admin/permissions`
- `POST /admin/permissions`
- `PATCH /admin/permissions/:id`
- `DELETE /admin/permissions/:id`
- `GET /admin/audit-logs`

## Notes

- Public registration creates a `viewer` account.
- The `super_admin` role has implicit access to all permissions.
- Data is stored in `data/db.json` and created automatically on first run.
