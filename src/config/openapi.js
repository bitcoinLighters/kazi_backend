export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Kazi&#9889; Backend API',
    version: '0.1.0',
    description:
      'Node.js/Express + Mongoose backend for Kazi, a Bitcoin Lightning-powered micro-earnings platform connecting Rwandan youth workers with clients. All monetary values are integer satoshis.'
  },
  servers: [{ url: 'http://localhost:5000/api', description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['youth', 'client'] },
          skills: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          clientId: { type: 'string' },
          title: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          rewardSats: { type: 'integer', minimum: 1 },
          deadline: { type: 'string', format: 'date-time' },
          requiredSkills: { type: 'array', items: { type: 'string' } },
          status: {
            type: 'string',
            enum: ['open', 'in_progress', 'reviewing', 'changes_requested', 'paid']
          },
          assignedYouthId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Submission: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          taskId: { type: 'string' },
          youthId: { type: 'string' },
          text: { type: 'string' },
          fileUrl: { type: 'string' },
          status: { type: 'string', enum: ['submitted', 'changes_requested', 'approved'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Payment: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          taskId: { type: 'string' },
          submissionId: { type: 'string' },
          clientId: { type: 'string' },
          youthId: { type: 'string' },
          rewardSats: { type: 'integer' },
          platformFeeSats: { type: 'integer' },
          netPayoutSats: { type: 'integer' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'failed'] },
          lightningInvoice: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Wallet: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          balanceSats: { type: 'integer' },
          totalEarnedSats: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Create an account with a role',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string', enum: ['youth', 'client'] },
                  skills: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Required when role is youth'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        security: [],
        summary: 'Authenticate and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List open tasks (youth)',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', default: 'open' } }
        ],
        responses: {
          200: { description: 'List of tasks', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } } } } }
        }
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task (client)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'category', 'description', 'rewardSats', 'deadline'],
                properties: {
                  title: { type: 'string' },
                  category: { type: 'string' },
                  description: { type: 'string' },
                  rewardSats: { type: 'integer', minimum: 1 },
                  deadline: { type: 'string', format: 'date-time' },
                  requiredSkills: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Task created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, task: { $ref: '#/components/schemas/Task' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/tasks/recommended': {
      get: {
        tags: ['Tasks'],
        summary: 'Recommended tasks matching the youth\'s skills',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', default: 'open' } }
        ],
        responses: {
          200: { description: 'Recommended tasks', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } } } } }
        }
      }
    },
    '/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Task details (youth or task client)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Task details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, task: { $ref: '#/components/schemas/Task' } } } } } },
          404: { description: 'Task not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/tasks/{id}/accept': {
      post: {
        tags: ['Tasks'],
        summary: 'Atomically accept a task (youth)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Task accepted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, task: { $ref: '#/components/schemas/Task' } } } } } },
          409: { description: 'Already accepted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/tasks/{id}/submissions': {
      post: {
        tags: ['Submissions'],
        summary: 'Submit work for an accepted task (assigned youth)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  fileUrl: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Submission created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, submission: { $ref: '#/components/schemas/Submission' } } } } } },
          403: { description: 'Not the assigned youth', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/submissions/{id}': {
      get: {
        tags: ['Submissions'],
        summary: 'View a submission (task client or submitting youth)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Submission details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, submission: { $ref: '#/components/schemas/Submission' } } } } } }
        }
      }
    },
    '/submissions/{id}/request-changes': {
      post: {
        tags: ['Submissions'],
        summary: 'Request changes (client, sends task back to in_progress)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Changes requested', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, submission: { $ref: '#/components/schemas/Submission' }, task: { $ref: '#/components/schemas/Task' } } } } } }
        }
      }
    },
    '/submissions/{id}/approve': {
      post: {
        tags: ['Submissions'],
        summary: 'Approve submission and trigger payment (client)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Approved and paid', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, payment: { $ref: '#/components/schemas/Payment' }, task: { $ref: '#/components/schemas/Task' } } } } } }
        }
      }
    },
    '/payments/{id}': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment status (involved client or youth)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Payment details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, payment: { $ref: '#/components/schemas/Payment' } } } } } }
        }
      }
    },
    '/wallet': {
      get: {
        tags: ['Wallet'],
        summary: 'Get current youth wallet balance',
        responses: {
          200: { description: 'Wallet', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, wallet: { $ref: '#/components/schemas/Wallet' } } } } } }
        }
      }
    },
    '/wallet/earnings': {
      get: {
        tags: ['Wallet'],
        summary: 'Earnings history from confirmed payments',
        responses: {
          200: { description: 'Earnings list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, earnings: { type: 'array', items: { $ref: '#/components/schemas/Payment' } } } } } } }
        }
      }
    },
    '/wallet/withdraw': {
      post: {
        tags: ['Wallet'],
        summary: 'Withdraw sats to mobile money (stretch, not implemented)',
        responses: {
          501: { description: 'Not implemented' }
        }
      }
    },
    '/tasks/client/mine': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks posted by the current client',
        responses: {
          200: { description: 'Client task list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } } } } }
        }
      }
    },
    '/tasks/youth/mine': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks accepted by the current youth',
        responses: {
          200: { description: 'Youth task list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } } } } }
        }
      }
    },
    '/submissions': {
      get: {
        tags: ['Submissions'],
        summary: 'List submissions visible to the current user',
        responses: {
          200: { description: 'Submission list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, submissions: { type: 'array', items: { $ref: '#/components/schemas/Submission' } } } } } } }
        }
      }
    }
  }
};
