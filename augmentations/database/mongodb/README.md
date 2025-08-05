# MongoDB Integration with Prisma

This augmentation adds MongoDB database support to your project using Prisma ORM.

## What's Included

- Prisma ORM setup with MongoDB driver
- Database connection utilities
- Example User and Post models with MongoDB-specific features
- Database scripts (no migrations needed for MongoDB)
- Framework-specific integrations

## Setup

1. **Install MongoDB locally or use a cloud provider:**
   - Local: [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/atlas/database) (recommended)

2. **Update your DATABASE_URL in `.env`:**
   
   For local MongoDB:
   ```env
   DATABASE_URL="mongodb://localhost:27017/mydb?directConnection=true"
   ```
   
   For MongoDB Atlas:
   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority"
   ```

3. **Generate Prisma Client:**
   ```bash
   yarn db:generate
   ```

4. **Push schema to database:**
   ```bash
   yarn db:push
   ```

## Available Scripts

- `yarn db:generate` - Generate Prisma Client
- `yarn db:push` - Push schema changes to MongoDB
- `yarn db:studio` - Open Prisma Studio GUI
- `yarn db:seed` - Seed the database (if configured)

## MongoDB-Specific Features

### ObjectId Fields

MongoDB uses ObjectId for document IDs:

```typescript
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  // ... other fields
}
```

### Embedded Documents

Use `Json` type for embedded documents:

```typescript
model Post {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  metadata Json?
}
```

### Arrays

MongoDB natively supports arrays:

```typescript
model Post {
  tags String[]
}
```

## Usage Examples

### Create a document with embedded data

```typescript
const post = await prisma.post.create({
  data: {
    title: 'MongoDB with Prisma',
    tags: ['mongodb', 'prisma', 'database'],
    metadata: {
      views: 0,
      likes: 0,
      featured: false
    },
    author: {
      connect: { id: userId }
    }
  }
});
```

### Query with array operations

```typescript
// Find posts with specific tags
const posts = await prisma.post.findMany({
  where: {
    tags: {
      has: 'mongodb'
    }
  }
});

// Find posts with any of the specified tags
const posts = await prisma.post.findMany({
  where: {
    tags: {
      hasSome: ['mongodb', 'database']
    }
  }
});
```

### Working with embedded documents

```typescript
// Query based on embedded document fields
const featuredPosts = await prisma.post.findMany({
  where: {
    metadata: {
      path: ['featured'],
      equals: true
    }
  }
});
```

## Production Considerations

1. **Connection String**: Use MongoDB Atlas for production with proper authentication
2. **Indexes**: Define indexes in your Prisma schema for better query performance
3. **Replica Sets**: Use replica sets for high availability
4. **Connection Pooling**: Prisma handles connection pooling automatically

## Differences from SQL Databases

1. **No Migrations**: MongoDB doesn't require migrations - use `db:push` to sync schema
2. **Flexible Schema**: MongoDB allows more flexibility, but Prisma enforces schema
3. **No Joins**: Use embedded documents or separate queries instead of joins
4. **ObjectId**: Use MongoDB's ObjectId type for document identifiers

## Resources

- [Prisma MongoDB Documentation](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas/database)