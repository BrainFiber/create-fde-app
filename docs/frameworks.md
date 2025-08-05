# Framework Guide

This guide provides detailed information about each supported framework and their specific configurations.

## Next.js

### Overview
Next.js is a React framework that enables server-side rendering, static site generation, and modern web application development.

### Default Configuration
- **TypeScript**: Enabled by default
- **Tailwind CSS**: Included for styling
- **App Router**: Uses the modern app directory structure
- **Source Directory**: Code organized in `src/` folder

### Project Structure
```
my-nextjs-app/
├── app/                  # App router pages and layouts
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── api/             # API routes
├── public/              # Static assets
├── src/                 # Source code (if src-dir enabled)
├── next.config.js       # Next.js configuration
└── tailwind.config.js   # Tailwind configuration
```

### Special Features
- **API Routes**: Built-in API support at `/api/*`
- **Image Optimization**: Automatic image optimization
- **Font Optimization**: Automatic font loading
- **Middleware**: Edge runtime middleware support

### Augmentation Compatibility
- ✅ All databases (PostgreSQL, MySQL, MongoDB)
- ✅ NextAuth.js (designed for Next.js)
- ✅ All monitoring solutions
- ✅ All utilities

### Deployment Notes
- **Vercel**: Zero-configuration deployment
- **AWS App Runner**: Requires Node.js adapter
- **Google Cloud Run**: Works with containerization

### Useful Commands
```bash
npm run dev         # Development server (port 3000)
npm run build       # Production build
npm start          # Production server
npm run lint       # Run ESLint
```

## Nuxt.js

### Overview
Nuxt.js is a Vue.js framework that provides server-side rendering, static site generation, and a powerful module ecosystem.

### Default Configuration
- **TypeScript**: Optional (prompted during creation)
- **Auto-imports**: Components and composables
- **Nitro Server**: Built-in server engine
- **Vue 3**: Latest Vue.js version

### Project Structure
```
my-nuxtjs-app/
├── app.vue              # Main app component
├── pages/               # File-based routing
│   └── index.vue       # Home page
├── server/              # Server routes and middleware
│   └── api/            # API endpoints
├── components/          # Vue components
├── composables/         # Composition API utilities
├── public/              # Static assets
└── nuxt.config.ts       # Nuxt configuration
```

### Special Features
- **Auto-imports**: No import statements needed
- **File-based Routing**: Automatic route generation
- **Server Routes**: Full-stack capabilities
- **Modules**: Rich ecosystem of modules

### Augmentation Compatibility
- ✅ All databases (PostgreSQL, MySQL, MongoDB)
- ❌ NextAuth.js (use Auth0 or Cognito instead)
- ✅ All monitoring solutions
- ✅ All utilities

### Deployment Notes
- **Vercel**: Requires Nuxt.js preset
- **AWS App Runner**: Node.js server deployment
- **Google Cloud Run**: Excellent container support

### Useful Commands
```bash
npm run dev         # Development server (port 3000)
npm run build       # Production build
npm run preview     # Preview production build
npm run generate    # Static site generation
```

## Remix

### Overview
Remix is a full-stack web framework that focuses on web standards, progressive enhancement, and optimal user experiences.

### Default Configuration
- **TypeScript**: Enabled by default
- **Tailwind CSS**: Optional (prompted)
- **Server**: Express.js by default
- **Data Loading**: Server-side by design

### Project Structure
```
my-remix-app/
├── app/                 # Application code
│   ├── root.tsx        # Root component
│   ├── routes/         # Route modules
│   │   └── _index.tsx  # Home route
│   └── entry.server.tsx # Server entry
├── public/              # Static assets
├── build/               # Build output
├── remix.config.js      # Remix configuration
└── server.js           # Express server
```

### Special Features
- **Nested Routes**: Powerful routing system
- **Data Loading**: Loader functions for SSR
- **Actions**: Form handling on the server
- **Error Boundaries**: Built-in error handling

### Augmentation Compatibility
- ✅ All databases (PostgreSQL, MySQL, MongoDB)
- ❌ NextAuth.js (use Auth0 or Cognito)
- ✅ All monitoring solutions
- ✅ All utilities

### Deployment Notes
- **Vercel**: Requires Remix adapter
- **AWS App Runner**: Express.js deployment
- **Google Cloud Run**: Excellent support

### Useful Commands
```bash
npm run dev         # Development server
npm run build       # Production build
npm start          # Production server
npm run typecheck   # TypeScript checking
```

## Framework Selection Guide

### Choose Next.js if you:
- Want the most popular React framework
- Need static site generation + SSR
- Want built-in API routes
- Prefer extensive ecosystem
- Plan to deploy to Vercel

### Choose Nuxt.js if you:
- Prefer Vue.js over React
- Want auto-imports everywhere
- Like convention over configuration
- Need a full-stack Vue solution
- Want excellent DX out of the box

### Choose Remix if you:
- Want to embrace web standards
- Prefer server-side rendering
- Like progressive enhancement
- Want optimal performance
- Need nested routing

## Framework-Specific Tips

### Next.js Tips
1. Use the `app/` directory for new projects
2. Leverage Server Components for performance
3. Use `next/image` for optimized images
4. Implement API routes for backend logic
5. Use middleware for authentication

### Nuxt.js Tips
1. Embrace auto-imports to reduce boilerplate
2. Use `server/api/` for backend routes
3. Leverage Nuxt modules for functionality
4. Use `useFetch` for data fetching
5. Configure rendering modes per route

### Remix Tips
1. Think in terms of routes, not pages
2. Use loaders for data fetching
3. Implement actions for mutations
4. Leverage error boundaries
5. Optimize with HTTP caching

## Migration Between Frameworks

While `create-fde-app` doesn't provide direct migration tools, here are general guidelines:

### React (Next.js) ↔ Vue (Nuxt.js)
- Component logic needs rewriting
- Routing concepts are similar
- API routes translate well
- State management differs

### Next.js → Remix
- Routes need restructuring
- API routes → Route actions
- Components largely compatible
- Data fetching patterns differ

### Nuxt.js → Remix
- Complete rewrite needed
- Similar SSR concepts
- Different component systems
- Server routes translate partially

## Performance Considerations

### Next.js
- Use static generation when possible
- Implement ISR for dynamic content
- Optimize images and fonts
- Use React Server Components

### Nuxt.js
- Configure nitro presets
- Use `nuxt generate` for static sites
- Implement proper caching
- Optimize payloads

### Remix
- Leverage HTTP caching
- Use resource routes
- Implement proper headers
- Optimize data loading

## Debugging Framework Issues

### Common Next.js Issues
- **Hydration mismatches**: Ensure server/client consistency
- **Build errors**: Check for dynamic imports
- **API route 404s**: Verify file locations

### Common Nuxt.js Issues
- **Auto-import conflicts**: Check naming collisions
- **Build failures**: Verify module compatibility
- **SSR errors**: Check for browser-only code

### Common Remix Issues
- **Route conflicts**: Check file naming
- **Loader errors**: Verify data returns
- **Build issues**: Check dependencies

## Resources

### Next.js
- [Official Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [GitHub Discussions](https://github.com/vercel/next.js/discussions)

### Nuxt.js
- [Official Documentation](https://nuxt.com/docs)
- [Nuxt Modules](https://nuxt.com/modules)
- [Community Discord](https://discord.com/invite/ps2h6QT)

### Remix
- [Official Documentation](https://remix.run/docs)
- [Remix Stacks](https://remix.run/stacks)
- [Community Discord](https://discord.gg/remix)