# create-fde-app

Create production-ready apps with built-in cloud deployment configurations.

## Features

- 🚀 **Latest Framework Versions** - Uses official create commands (create-next-app, nuxi, create-remix)
- ☁️ **Multi-Cloud Support** - AWS App Runner, Vercel, Google Cloud Run
- 🐳 **Docker Ready** - Optimized Dockerfiles for production
- 🔄 **CI/CD Built-in** - GitHub Actions workflows configured
- 🏗️ **Infrastructure as Code** - Terraform configurations included
- 🔒 **Security Best Practices** - Environment variables, health checks, and more

## Quick Start

```bash
npx create-fde-app@latest my-app
```

Or with options:

```bash
npx create-fde-app@latest my-app --framework nextjs --deploy aws-apprunner
```

## Supported Frameworks

- **Next.js** - Full-stack React framework
- **Nuxt.js** - Full-stack Vue framework
- **Remix** - Full-stack web framework

## Deployment Targets

- **AWS App Runner** - Fully managed container service
- **Vercel** - Frontend cloud platform
- **Google Cloud Run** - Serverless container platform

## Usage

### Interactive Mode

Simply run the command and follow the prompts:

```bash
npx create-fde-app@latest
```

### Command Line Options

```bash
create-fde-app [project-name] [options]

Options:
  -f, --framework <framework>  Framework to use (nextjs, nuxtjs, remix)
  -d, --deploy <target>        Deployment target (aws-apprunner, vercel, gcp-cloudrun)
  --skip-git                   Skip git initialization
  --skip-install               Skip installing dependencies
  -h, --help                   Display help
  -V, --version                Display version
```

## Project Structure

After creation, your project will have:

```
my-app/
├── src/                    # Application source code
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions deployment workflow
├── docker/
│   ├── Dockerfile          # Production-ready Dockerfile
│   └── .dockerignore       # Docker ignore file
├── terraform/              # Infrastructure as Code (if applicable)
│   └── main.tf            # Terraform configuration
├── .env.example           # Environment variables template
└── README.md              # Project documentation
```

## Deployment

### AWS App Runner

1. Set up AWS credentials in GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. Initialize infrastructure (optional):
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

3. Push to GitHub:
   ```bash
   git push origin main
   ```

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link project:
   ```bash
   vercel link
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### Google Cloud Run

1. Set up GCP credentials in GitHub Secrets:
   - `GCP_SA_KEY`
   - `GCP_PROJECT_ID`

2. Push to GitHub:
   ```bash
   git push origin main
   ```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © FDE Team