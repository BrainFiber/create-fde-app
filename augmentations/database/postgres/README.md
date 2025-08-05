# PostgreSQL Integration with Prisma

This augmentation adds PostgreSQL database support to your project using Prisma ORM.

## What's Included

- Prisma ORM setup with PostgreSQL driver
- Database connection utilities
- Example User and Post models
- Migration scripts
- Database health check endpoint
- Framework-specific integrations

## Setup

1. **Install PostgreSQL locally or use a cloud provider:**
   - Local: [PostgreSQL Downloads](https://www.postgresql.org/download/)
   - Cloud: [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or [PlanetScale](https://planetscale.com/)

2. **Update your DATABASE_URL in `.env`:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
   ```

3. **Run initial migration:**
   ```bash
   yarn db:migrate
   ```

4. **Generate Prisma Client:**
   ```bash
   yarn db:generate
   ```

## Available Scripts

- `yarn db:generate` - Generate Prisma Client
- `yarn db:migrate` - Create and apply migrations
- `yarn db:push` - Push schema changes without migrations (development)
- `yarn db:studio` - Open Prisma Studio GUI
- `yarn db:seed` - Seed the database (if configured)

## Usage

### Import Prisma Client

```typescript
import { prisma } from '@/lib/db/prisma';
```

### Example Queries

```typescript
// Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// Find all posts
const posts = await prisma.post.findMany({
  include: {
    author: true,
  },
});

// Update a post
const updatedPost = await prisma.post.update({
  where: { id: postId },
  data: { published: true },
});
```

## Error Handling

Use the provided error handler for better error messages:

```typescript
import { handleDatabaseError } from '@/lib/db/helpers';

try {
  // Database operation
} catch (error) {
  const { error: errorMessage } = handleDatabaseError(error);
  // Handle error appropriately
}
```

## Production Considerations

1. **Connection Pooling**: Prisma handles connection pooling automatically
2. **Migrations**: Run migrations as part of your deployment process
3. **SSL**: Enable SSL for production databases:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&sslmode=require"
   ```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma with Next.js](https://www.prisma.io/docs/guides/database/using-prisma-with-nextjs)