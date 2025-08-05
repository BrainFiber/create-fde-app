# Getting Started with create-fde-app

This guide will walk you through creating your first application with `create-fde-app`.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** 
- **Git** (optional, but recommended)

## Installation

You don't need to install `create-fde-app` globally. You can use it directly with `npx`:

```bash
npx create-fde-app@latest my-app
```

## Your First App

### Step 1: Run the Command

Open your terminal and run:

```bash
npx create-fde-app@latest my-first-app
```

### Step 2: Choose Your Framework

You'll be prompted to select a framework:

```
? Which framework would you like to use? (Use arrow keys)
❯ Next.js - React framework with server-side rendering
  Nuxt.js - Vue.js framework with server-side rendering
  Remix - Full-stack web framework focused on web standards
```

For this example, let's choose **Next.js**.

### Step 3: Select Deployment Target

Next, choose where you want to deploy:

```
? Where would you like to deploy? (Use arrow keys)
❯ AWS App Runner
  Vercel
  Google Cloud Run
```

Let's select **Vercel** for easy deployment.

### Step 4: Configure Features

Select the features you want to include:

```
? Select features to include: (Press <space> to select, <a> to toggle all)
❯◉ Docker containerization
 ◉ GitHub Actions CI/CD
```

Press space to select/deselect, then Enter to continue.

### Step 5: Advanced Features (Optional)

If you're not deploying to Vercel, you'll see advanced features:

```
? Select advanced features (optional): (Press <space> to select)
 --- Database ---
 ◯ PostgreSQL with Prisma
 ◯ MySQL with Prisma
 ◯ MongoDB with Mongoose
 --- Authentication ---
 ◯ NextAuth.js (Next.js only)
 ◯ Auth0 Integration
 ◯ AWS Cognito
 --- Monitoring ---
 ◯ Datadog APM & RUM
 --- Utilities ---
 ◯ Sentry Error Tracking
 ◯ Winston Logging
 ◯ Rate Limiting
 ◯ CORS Configuration
```

### Step 6: Git and Dependencies

Finally, you'll be asked about Git and dependencies:

```
? Initialize git repository? (Y/n) Y
? Install dependencies? (Y/n) Y
```

## What Happens Next

After you make your selections, `create-fde-app` will:

1. **Create your project** using the official framework CLI
2. **Add deployment configurations** based on your selections
3. **Set up Docker** if selected
4. **Configure GitHub Actions** for CI/CD
5. **Add any advanced features** you selected
6. **Initialize Git** and make an initial commit
7. **Install dependencies**

## Project Structure

Your new project will have this structure:

```
my-first-app/
├── app/                    # Next.js app directory (or pages/)
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── Dockerfile             # Docker configuration
├── .dockerignore         
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions workflow
├── vercel.json           # Vercel configuration
└── README.md             # Project documentation
```

## Running Your App

### Development Mode

Navigate to your project and start the development server:

```bash
cd my-first-app
npm run dev
```

Your app will be available at `http://localhost:3000`.

### Building for Production

Build your application:

```bash
npm run build
```

### Running with Docker

If you selected Docker, you can build and run your container:

```bash
# Build the image
docker build -t my-first-app .

# Run the container
docker run -p 3000:3000 my-first-app
```

## Deploying Your App

### To Vercel

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to link your project.

### Using GitHub Actions

1. Create a GitHub repository:
   ```bash
   git remote add origin https://github.com/yourusername/my-first-app.git
   ```

2. Push your code:
   ```bash
   git push -u origin main
   ```

3. Set up required secrets in GitHub repository settings.

## Next Steps

- **Customize your app**: Start building your features
- **Configure environment variables**: Copy `.env.example` to `.env.local`
- **Add more features**: Run the CLI again in a new directory to explore other options
- **Read framework docs**: 
  - [Next.js Documentation](https://nextjs.org/docs)
  - [Nuxt.js Documentation](https://nuxtjs.org/docs)
  - [Remix Documentation](https://remix.run/docs)

## Common Commands

Here are some useful commands for your project:

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Testing (if configured)
npm test            # Run tests
npm run lint        # Run linter

# Database (if using Prisma)
npx prisma studio   # Open Prisma Studio
npx prisma migrate dev  # Run migrations

# Deployment
vercel              # Deploy to Vercel
git push origin main    # Trigger GitHub Actions
```

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](../README.md#troubleshooting) section
2. Search [existing issues](https://github.com/fde/create-fde-app/issues)
3. Ask in [Discussions](https://github.com/fde/create-fde-app/discussions)
4. Create a [new issue](https://github.com/fde/create-fde-app/issues/new)

Happy coding! 🚀