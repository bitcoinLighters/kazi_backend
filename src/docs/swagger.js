export const swaggerSpec = {
  openapi: '3.0.3',
  info: { title: 'Kazi⚡ API', version: '0.1.0', description: 'Backend API for youth micro-tasks and client review. Lightning payment execution is intentionally deferred.' },
  servers: [{ url: 'http://localhost:5000', description: 'Local development' }],
  tags: [{ name: 'Auth' }, { name: 'Tasks' }, { name: 'Submissions' }, { name: 'Wallet' }, { name: 'Payments' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } } },
      Task: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, category: { type: 'string' }, description: { type: 'string' }, rewardSats: { type: 'integer', minimum: 1 }, deadline: { type: 'string', format: 'date-time' }, status: { type: 'string', enum: ['open', 'in_progress', 'reviewing', 'paid'] } } },
      Submission: { type: 'object', properties: { id: { type: 'string' }, taskId: { type: 'string' }, description: { type: 'string' }, fileUrl: { type: 'string', nullable: true }, status: { type: 'string' } } }
    }
  },
  paths: {
    '/api/health': { get: { tags: ['Auth'], summary: 'Service health', responses: { 200: { description: 'Healthy response' } } } },
    '/api/auth/signup': { post: { tags: ['Auth'], summary: 'Create a youth or client account', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password', 'role'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' }, role: { type: 'string', enum: ['youth', 'client'] } } } } } }, responses: { 201: { description: 'Created' }, 400: { $ref: '#/components/responses/BadRequest' } } } },
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Sign in', responses: { 200: { description: 'JWT returned' }, 401: { description: 'Invalid credentials' } } } },
    '/api/tasks': { get: { tags: ['Tasks'], summary: 'Browse tasks', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Task list' } } }, post: { tags: ['Tasks'], summary: 'Post a task (client)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } }, responses: { 201: { description: 'Task created' } } } },
    '/api/tasks/{id}': { get: { tags: ['Tasks'], summary: 'View task details', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 200: { description: 'Task details' }, 404: { description: 'Not found' } } } },
    '/api/tasks/{id}/accept': { post: { tags: ['Tasks'], summary: 'Accept an open task (youth)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 200: { description: 'Task accepted' }, 409: { description: 'Already claimed' } } } },
    '/api/tasks/{id}/submissions': { post: { tags: ['Submissions'], summary: 'Submit completed work (youth)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 201: { description: 'Submission recorded' } } } },
    '/api/submissions': { get: { tags: ['Submissions'], summary: 'List submissions visible to current user', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Submission list' } } } },
    '/api/submissions/{id}': { get: { tags: ['Submissions'], summary: 'View a submission', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 200: { description: 'Submission details' } } } },
    '/api/submissions/{id}/request-changes': { post: { tags: ['Submissions'], summary: 'Request changes (client)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 200: { description: 'Changes requested' } } } },
    '/api/wallet': { get: { tags: ['Wallet'], summary: 'View youth balance', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Wallet summary' } } } },
    '/api/wallet/earnings': { get: { tags: ['Wallet'], summary: 'View earnings history', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Earnings list' } } } },
    '/api/wallet/withdraw': { post: { tags: ['Wallet'], summary: 'Mobile money withdrawal (stretch)', security: [{ bearerAuth: [] }], responses: { 501: { description: 'Not implemented' } } } },
    '/api/payments/submissions/{id}/approve': { post: { tags: ['Payments'], summary: 'Approve and pay a submission (deferred)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 501: { description: 'Lightning integration deferred' } } } },
    '/api/payments/{id}': { get: { tags: ['Payments'], summary: 'Get payment status (deferred)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { 501: { description: 'Lightning integration deferred' } } } }
  }
};

swaggerSpec.components.responses = { BadRequest: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } };
swaggerSpec.components.parameters = { id: { name: 'id', in: 'path', required: true, schema: { type: 'string' } } };

