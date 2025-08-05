# NextAuth.js Integration

This augmentation adds authentication to your Next.js application using NextAuth.js.

## What's Included

- NextAuth.js configuration with multiple providers
- GitHub, Google, and Credentials providers pre-configured
- Protected routes with middleware
- Session management
- TypeScript support
- Example sign-in page and protected dashboard
- Database adapter support (if Prisma is installed)

## Setup

1. **Generate a secret key:**
   ```bash
   openssl rand -base64 32
   ```
   Add this to your `.env` file as `NEXTAUTH_SECRET`

2. **Configure OAuth providers:**

   ### GitHub OAuth
   1. Go to GitHub Settings > Developer settings > OAuth Apps
   2. Create a new OAuth App
   3. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
   4. Add the Client ID and Client Secret to `.env`:
      ```env
      GITHUB_ID=your_client_id
      GITHUB_SECRET=your_client_secret
      ```

   ### Google OAuth
   1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   2. Create a new project or select existing
   3. Enable Google+ API
   4. Create credentials (OAuth 2.0 Client ID)
   5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   6. Add credentials to `.env`:
      ```env
      GOOGLE_CLIENT_ID=your_client_id
      GOOGLE_CLIENT_SECRET=your_client_secret
      ```

3. **Wrap your app with SessionProvider:**
   
   Update your `app/layout.tsx`:
   ```tsx
   import { Providers } from './providers';

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="en">
         <body>
           <Providers>{children}</Providers>
         </body>
       </html>
     );
   }
   ```

## Usage

### Server Components

```typescript
import { getCurrentUser, requireAuth } from '@/lib/auth/utils';

// Get current user (can be null)
export default async function Page() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Please sign in</div>;
  }
  
  return <div>Welcome {user.name}!</div>;
}

// Require authentication (redirects if not authenticated)
export default async function ProtectedPage() {
  const user = await requireAuth();
  return <div>This is protected content for {user.name}</div>;
}
```

### Client Components

```typescript
'use client';

import { useAuth } from '@/lib/auth/hooks';
import { signIn, signOut } from 'next-auth/react';

export default function Component() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <button onClick={() => signIn()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome {user?.name}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Protected API Routes

```typescript
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({ data: 'Protected data' });
}
```

## Middleware Configuration

The middleware protects routes based on authentication status. Configure protected routes in `middleware.ts`:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',    // Requires authentication
    '/admin/:path*',        // Requires admin role
    '/api/protected/:path*', // Protected API routes
  ],
};
```

## Database Integration

If you have Prisma installed, NextAuth.js will automatically use the Prisma adapter. You'll need to add the NextAuth schema to your `schema.prisma`:

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

Then run:
```bash
npm run db:migrate
```

## Customization

### Custom Sign-in Page

The sign-in page is located at `app/auth/signin/page.tsx`. Customize the UI and add your branding.

### Additional Providers

Add more providers in `lib/auth/options.ts`:

```typescript
import EmailProvider from 'next-auth/providers/email';

providers: [
  EmailProvider({
    server: process.env.EMAIL_SERVER,
    from: process.env.EMAIL_FROM,
  }),
  // ... other providers
]
```

### Role-based Access

Extend the JWT callback to include roles:

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.role = user.role; // Assume user.role exists
    }
    return token;
  },
}
```

## Production Checklist

- [ ] Set `NEXTAUTH_URL` to your production URL
- [ ] Generate a strong `NEXTAUTH_SECRET`
- [ ] Configure OAuth callback URLs for production
- [ ] Enable HTTPS (required for OAuth)
- [ ] Configure email provider for passwordless auth
- [ ] Set up proper session expiry times
- [ ] Enable CSRF protection

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Providers](https://next-auth.js.org/providers/)
- [Adapters](https://next-auth.js.org/adapters/)
- [Security Best Practices](https://next-auth.js.org/getting-started/security)