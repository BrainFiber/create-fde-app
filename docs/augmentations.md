# Augmentations Guide

Augmentations are optional features that enhance your application with databases, authentication, monitoring, and utilities.

## Table of Contents

- [Overview](#overview)
- [Database Integrations](#database-integrations)
  - [PostgreSQL](#postgresql)
  - [MySQL](#mysql)
  - [MongoDB](#mongodb)
- [Authentication Systems](#authentication-systems)
  - [NextAuth.js](#nextauthjs)
  - [Auth0](#auth0)
  - [AWS Cognito](#aws-cognito)
- [Monitoring Solutions](#monitoring-solutions)
  - [Datadog](#datadog)
- [Utilities](#utilities)
  - [Sentry Error Tracking](#sentry-error-tracking)
  - [Winston Logging](#winston-logging)
  - [Rate Limiting](#rate-limiting)
  - [CORS Configuration](#cors-configuration)
- [Combining Augmentations](#combining-augmentations)

## Overview

Augmentations are production-ready integrations that can be added during project creation. They include:
- Pre-configured setup files
- Environment variable templates
- Integration with your chosen framework
- Documentation and examples

## Database Integrations

All database augmentations use **Prisma ORM** (for SQL databases) or **Mongoose ODM** (for MongoDB).

### PostgreSQL

#### What's Included
- Prisma schema with example models
- Database connection utilities
- Migration setup
- Type-safe database client
- Connection pooling configuration

#### Setup
1. **Environment Variables**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/myapp?schema=public"
   ```

2. **Initial Migration**:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Generate Client**:
   ```bash
   npx prisma generate
   ```

#### Usage Example
```javascript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe'
  }
})

// Query users
const users = await prisma.user.findMany()
```

#### Prisma Studio
```bash
npx prisma studio  # Visual database browser
```

### MySQL

#### What's Included
- Prisma schema configured for MySQL
- Connection utilities
- Migration setup
- Type definitions

#### Setup
1. **Environment Variables**:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/myapp"
   ```

2. **Run Migrations**:
   ```bash
   npx prisma migrate dev
   ```

#### MySQL-Specific Features
- JSON column support
- Full-text search
- Spatial data types (with extensions)

#### Connection Pooling
```javascript
// lib/db.js includes connection pooling
import { prisma } from './lib/db'

// Connections are automatically pooled
```

### MongoDB

#### What's Included
- Mongoose schemas
- Connection management
- Model definitions
- Validation setup

#### Setup
1. **Environment Variables**:
   ```env
   MONGODB_URI="mongodb://localhost:27017/myapp"
   # or
   MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/myapp"
   ```

2. **No migrations needed** - MongoDB is schemaless

#### Usage Example
```javascript
import mongoose from 'mongoose'
import { User } from './models/User'

// Create user
const user = await User.create({
  email: 'user@example.com',
  name: 'John Doe'
})

// Query with Mongoose
const users = await User.find({ active: true })
```

#### Schema Example
```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  createdAt: { type: Date, default: Date.now }
})
```

## Authentication Systems

### NextAuth.js

**Note**: Only available for Next.js projects.

#### What's Included
- Multiple provider configurations
- Session management
- Protected API routes
- Login/logout pages
- User profile page

#### Providers Configured
- GitHub OAuth
- Google OAuth  
- Email/Password (Credentials)

#### Setup
1. **Environment Variables**:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-here
   
   GITHUB_ID=your-github-oauth-id
   GITHUB_SECRET=your-github-oauth-secret
   
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

2. **Generate Secret**:
   ```bash
   openssl rand -base64 32
   ```

#### Usage
```javascript
// Protect API routes
import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth/[...nextauth]"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }
  
  return Response.json({ user: session.user })
}
```

#### Client-Side
```javascript
import { useSession, signIn, signOut } from "next-auth/react"

function Component() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Loading...</p>
  
  if (session) {
    return (
      <>
        Signed in as {session.user.email}
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  
  return <button onClick={() => signIn()}>Sign in</button>
}
```

### Auth0

#### What's Included
- Auth0 SDK integration
- Middleware configuration
- Protected routes
- User management

#### Setup
1. **Create Auth0 Application**:
   - Sign up at [auth0.com](https://auth0.com)
   - Create a new application
   - Note domain and client ID

2. **Environment Variables**:
   ```env
   AUTH0_SECRET='use-openssl-to-generate'
   AUTH0_BASE_URL='http://localhost:3000'
   AUTH0_ISSUER_BASE_URL='https://YOUR_DOMAIN.auth0.com'
   AUTH0_CLIENT_ID='your-client-id'
   AUTH0_CLIENT_SECRET='your-client-secret'
   ```

#### Usage
```javascript
// Middleware protection
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired()

// API route protection
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'

export default withApiAuthRequired(async (req, res) => {
  const session = await getSession(req, res)
  res.json({ user: session.user })
})
```

### AWS Cognito

#### What's Included
- AWS Amplify integration
- User pool configuration
- Authentication flows
- MFA support ready

#### Setup
1. **Install AWS Amplify CLI**:
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Initialize Amplify**:
   ```bash
   amplify init
   amplify add auth
   amplify push
   ```

3. **Environment Variables**:
   ```env
   NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxx
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxx
   NEXT_PUBLIC_IDENTITY_POOL_ID=us-east-1:xxxxx
   ```

#### Usage
```javascript
import { Auth } from 'aws-amplify'

// Sign up
await Auth.signUp({
  username,
  password,
  attributes: { email }
})

// Sign in
const user = await Auth.signIn(username, password)

// Sign out
await Auth.signOut()

// Get current user
const user = await Auth.currentAuthenticatedUser()
```

## Monitoring Solutions

### Datadog

#### What's Included
- APM (Application Performance Monitoring)
- RUM (Real User Monitoring)
- Custom metrics
- Error tracking
- Distributed tracing

#### Setup
1. **Get Datadog API Key**:
   - Sign up at [datadoghq.com](https://www.datadoghq.com)
   - Navigate to API Keys
   - Create new API key

2. **Environment Variables**:
   ```env
   DD_API_KEY=your-api-key
   DD_APP_KEY=your-app-key
   DD_SITE=datadoghq.com  # or datadoghq.eu
   DD_ENV=production
   DD_SERVICE=my-app
   DD_VERSION=1.0.0
   ```

#### APM Usage
```javascript
// Automatic instrumentation
import './lib/datadog'  // Initialize at app start

// Custom spans
import { tracer } from 'dd-trace'

const span = tracer.startSpan('custom.operation')
try {
  // Your code here
  span.setTag('user.id', userId)
} finally {
  span.finish()
}
```

#### RUM Usage
```javascript
// Browser monitoring
import { datadogRum } from '@datadog/browser-rum'

datadogRum.init({
  applicationId: 'YOUR_APP_ID',
  clientToken: 'YOUR_CLIENT_TOKEN',
  site: 'datadoghq.com',
  service: 'my-app',
  env: 'production',
  trackInteractions: true,
  trackResources: true,
  trackLongTasks: true,
})
```

## Utilities

### Sentry Error Tracking

#### What's Included
- Error capture
- Performance monitoring
- Session replay
- Release tracking

#### Setup
1. **Get Sentry DSN**:
   - Create account at [sentry.io](https://sentry.io)
   - Create new project
   - Copy DSN

2. **Environment Variables**:
   ```env
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-project
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

#### Usage
```javascript
// Capture errors
import * as Sentry from '@sentry/node'

try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error)
}

// Custom context
Sentry.setUser({ id: userId, email: userEmail })
Sentry.setTag('feature', 'checkout')
Sentry.addBreadcrumb({
  message: 'User clicked checkout',
  level: 'info'
})
```

### Winston Logging

#### What's Included
- Structured logging
- Multiple transports
- Log rotation
- Different log levels

#### Configuration
```javascript
// lib/logger.js configured with:
- Console output (development)
- File output (production)
- Daily rotation
- Error file separation
```

#### Usage
```javascript
import { logger } from './lib/logger'

// Different levels
logger.error('Error message', { error: err })
logger.warn('Warning message')
logger.info('Info message', { userId: user.id })
logger.debug('Debug message')

// With metadata
logger.info('User action', {
  action: 'checkout',
  userId: user.id,
  amount: 99.99
})
```

### Rate Limiting

#### What's Included
- Express-rate-limit configuration
- Redis-backed store (optional)
- Multiple limit strategies
- Custom error messages

#### Configuration
```javascript
// Default limits:
- 100 requests per 15 minutes (general)
- 5 requests per hour (auth endpoints)
- Customizable per route
```

#### Usage
```javascript
import { rateLimiter } from './lib/rate-limit'

// Apply to all routes
app.use(rateLimiter)

// Custom limit for specific route
const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5 // 5 requests
})

app.post('/api/sensitive', strictLimiter, handler)
```

### CORS Configuration

#### What's Included
- Pre-configured CORS middleware
- Environment-based origins
- Credentials support
- Preflight handling

#### Configuration
```env
# .env
CORS_ORIGINS=http://localhost:3000,https://myapp.com
```

#### Usage
```javascript
import { corsMiddleware } from './lib/cors'

// Apply to all routes
app.use(corsMiddleware)

// Custom configuration
const customCors = cors({
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})
```

## Combining Augmentations

Augmentations work well together. Common combinations:

### Full-Stack Setup
- PostgreSQL + NextAuth.js + Sentry
- MongoDB + Auth0 + Datadog
- MySQL + AWS Cognito + Winston

### Example: E-commerce Stack
```bash
# Select during creation:
✓ PostgreSQL with Prisma
✓ NextAuth.js 
✓ Sentry Error Tracking
✓ Rate Limiting
✓ Winston Logging
```

This gives you:
- User authentication
- Product database
- Error monitoring
- API protection
- Detailed logging

### Integration Example
```javascript
// Protected API with logging and rate limiting
import { getServerSession } from "next-auth/next"
import { prisma } from "./lib/db"
import { logger } from "./lib/logger"
import { rateLimiter } from "./lib/rate-limit"

export async function POST(request) {
  // Rate limiting applied via middleware
  
  // Check authentication
  const session = await getServerSession()
  if (!session) {
    logger.warn('Unauthorized access attempt')
    return new Response("Unauthorized", { status: 401 })
  }
  
  try {
    // Database operation
    const order = await prisma.order.create({
      data: { userId: session.user.id, ...orderData }
    })
    
    logger.info('Order created', { 
      orderId: order.id, 
      userId: session.user.id 
    })
    
    return Response.json(order)
  } catch (error) {
    logger.error('Order creation failed', { error })
    Sentry.captureException(error)
    return new Response("Server Error", { status: 500 })
  }
}
```

## Best Practices

1. **Environment Variables**:
   - Use `.env.example` as template
   - Never commit `.env` files
   - Use different values per environment

2. **Database Connections**:
   - Use connection pooling
   - Close connections properly
   - Handle connection errors

3. **Authentication**:
   - Always use HTTPS in production
   - Implement proper session management
   - Add rate limiting to auth endpoints

4. **Monitoring**:
   - Set up alerts for errors
   - Monitor performance metrics
   - Track user behavior

5. **Error Handling**:
   - Log errors with context
   - Don't expose sensitive info
   - Provide user-friendly messages

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull  # For Prisma
node -e "require('./lib/db').connect()"  # For MongoDB
```

### Authentication Problems
- Verify callback URLs match
- Check secret generation
- Ensure providers are configured

### Missing Environment Variables
- Check `.env.example` for required vars
- Verify variable names match
- Ensure no trailing spaces

## Next Steps

After adding augmentations:

1. **Configure services**: Set up external accounts
2. **Test integrations**: Verify everything works
3. **Secure credentials**: Use secret managers
4. **Monitor usage**: Set up dashboards
5. **Scale accordingly**: Adjust limits and resources