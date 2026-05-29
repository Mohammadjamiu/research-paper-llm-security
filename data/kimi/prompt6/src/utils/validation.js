const { z } = require('zod');

/**
 * Common validation schemas
 */
const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  boolean: z.boolean().or(z.string().transform(val => val === 'true')),
  pagination: z.object({
    page: z.string().or(z.number()).optional().transform(val => parseInt(val, 10) || 1),
    limit: z.string().or(z.number()).optional().transform(val => parseInt(val, 10) || 20),
    search: z.string().optional()
  })
};

/**
 * Authentication schemas
 */
const authSchemas = {
  login: z.object({
    body: z.object({
      email: commonSchemas.email,
      password: z.string()
    })
  }),

  register: z.object({
    body: z.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional()
    })
  }),

  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string()
    })
  }),

  changePassword: z.object({
    body: z.object({
      currentPassword: z.string(),
      newPassword: commonSchemas.password
    })
  })
};

/**
 * User schemas
 */
const userSchemas = {
  list: z.object({
    query: commonSchemas.pagination.extend({
      isActive: commonSchemas.boolean.optional()
    })
  }),

  create: z.object({
    body: z.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      isActive: z.boolean().optional().default(true),
      roleIds: z.array(commonSchemas.uuid).optional()
    })
  }),

  update: z.object({
    params: z.object({
      id: commonSchemas.uuid
    }),
    body: z.object({
      email: commonSchemas.email.optional(),
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      isActive: z.boolean().optional(),
      roleIds: z.array(commonSchemas.uuid).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided'
    })
  }),

  assignRoles: z.object({
    params: z.object({
      id: commonSchemas.uuid
    }),
    body: z.object({
      roleIds: z.array(commonSchemas.uuid)
    })
  })
};

/**
 * Role schemas
 */
const roleSchemas = {
  list: z.object({
    query: commonSchemas.pagination
  }),

  create: z.object({
    body: z.object({
      name: commonSchemas.name,
      description: commonSchemas.description,
      permissionIds: z.array(commonSchemas.uuid).optional()
    })
  }),

  update: z.object({
    params: z.object({
      id: commonSchemas.uuid
    }),
    body: z.object({
      name: commonSchemas.name.optional(),
      description: commonSchemas.description,
      permissionIds: z.array(commonSchemas.uuid).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided'
    })
  })
};

/**
 * Audit log schemas
 */
const auditLogSchemas = {
  list: z.object({
    query: commonSchemas.pagination.extend({
      userId: commonSchemas.uuid.optional(),
      action: z.string().optional(),
      resource: z.string().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional()
    })
  })
};

module.exports = {
  commonSchemas,
  authSchemas,
  userSchemas,
  roleSchemas,
  auditLogSchemas
};
