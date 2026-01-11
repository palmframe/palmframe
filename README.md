<div align="center">
  <img src="palmframe.png" alt="Palmframe" width="400" />
</div>

# Palmframe

Put your AI agents to work while you sip a mojito on the beach.

Palmframe is an open-source platform that gives AI agents compute capability. Built for nerds who want to build with AI.

Join **The Palmframe Computer Club** - our community of builders.

## Features

- **Next.js 16** (App Router, Server Actions, React 19) with shadcn/ui and TailwindCSS
- **Mistral AI** - Uses Devstral for code generation
- **Flexible Sandbox Providers** - Choose between E2B or Daytona for secure code execution
  - **E2B SDK** - Production-ready sandboxed environments
  - **Daytona** - Alternative sandbox provider with simple configuration
- **PostgreSQL + Drizzle ORM** - Local-first database with type-safe queries
- **Better Auth** - Modern authentication
- **Docker Compose** - Easy local development setup
- Streaming UI responses
- Install and use any package from npm, pip
- Supported stacks:
  - Python interpreter
  - Next.js
  - Vue.js
  - Streamlit
  - Gradio

## Prerequisites

- [git](https://git-scm.com)
- [Node.js](https://nodejs.org) (recent version) and npm
- [Docker](https://www.docker.com/) and Docker Compose
- **Sandbox Provider** (choose one):
  - [E2B API Key](https://e2b.dev) (default, recommended)
  - [Daytona API Key](https://daytona.io) (alternative)
- [Mistral API Key](https://console.mistral.ai/)

## Get Started

You can run Palmframe in two ways: **with Docker** (recommended) or **without Docker** (for more control).

### Option 1: Run with Docker (Recommended)

The easiest way to get started is using Docker Compose, which runs both the database and application in containers.

#### 1. Clone the repository

```bash
git clone https://github.com/palmframe/palmframe.git
cd palmframe
```

#### 2. Set up environment variables

Copy the `.env.template` file to `.env` and add your API keys:

```bash
cp .env.template .env
```

Edit `.env` and add your API keys:

```sh
# Sandbox Provider - Choose "e2b" (default) or "daytona"
SANDBOX_PROVIDER=e2b
NEXT_PUBLIC_SANDBOX_PROVIDER=e2b

# E2B Configuration (if using E2B)
E2B_API_KEY=your-e2b-api-key

# Daytona Configuration (if using Daytona instead)
# DAYTONA_API_KEY=your-daytona-api-key
# DAYTONA_API_URL=https://app.daytona.io/api
# DAYTONA_TARGET=us

# Mistral API Key - https://console.mistral.ai/
MISTRAL_API_KEY=your-mistral-api-key

# Optional env vars
NEXT_PUBLIC_SITE_URL=
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW=60
```

**Note:** When using Docker, you don't need to set `DATABASE_URL` as it's configured automatically in `docker-compose.yml`.

#### 3. Start everything with Docker Compose

```bash
docker-compose up
```

Or run in detached mode:

```bash
docker-compose up -d
```

#### 4. Initialize the database

In a new terminal, run the migrations:

```bash
# If running detached, execute inside the container
docker-compose exec app npm run db:push

# Or if you have npm installed locally
npm run db:push
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

#### Docker Commands

```bash
# Stop all services
docker-compose down

# Rebuild containers after code changes
docker-compose up --build

# View logs
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# Execute commands in the app container
docker-compose exec app npm run db:studio

# Clean up everything (including volumes)
docker-compose down -v
```

---

### Option 2: Run without Docker (Local Development)

If you prefer to run the application directly on your machine:

#### 1. Clone the repository

```bash
git clone https://github.com/palmframe/palmframe.git
cd palmframe
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Start PostgreSQL

You can use Docker just for the database:

```bash
docker-compose up postgres -d
```

Or install PostgreSQL locally and create a database named `palmframe`.

#### 4. Set up environment variables

```bash
cp .env.template .env
```

Edit `.env` and add your API keys:

```sh
# Sandbox Provider - Choose "e2b" (default) or "daytona"
SANDBOX_PROVIDER=e2b
NEXT_PUBLIC_SANDBOX_PROVIDER=e2b

# E2B Configuration (if using E2B)
E2B_API_KEY=your-e2b-api-key

# Daytona Configuration (if using Daytona instead)
# DAYTONA_API_KEY=your-daytona-api-key
# DAYTONA_API_URL=https://app.daytona.io/api
# DAYTONA_TARGET=us

# Mistral API Key - https://console.mistral.ai/
MISTRAL_API_KEY=your-mistral-api-key

# PostgreSQL Database (for local development without Docker)
DATABASE_URL=postgresql://palmframe:palmframe_dev_password@localhost:5432/palmframe

# Optional env vars
NEXT_PUBLIC_SITE_URL=
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW=60
```

#### 5. Initialize the database

```bash
npm run db:push
```

#### 6. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Database Management

```bash
# Generate migrations from schema changes
npm run db:generate

# Push schema changes to database (for development)
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Production Deployment

Use the production docker-compose file:

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
docker-compose -f docker-compose.prod.yml exec app npm run db:push
```

Make sure to set secure environment variables in `.env.production`:

```sh
POSTGRES_PASSWORD=your-secure-password
E2B_API_KEY=your-key
MISTRAL_API_KEY=your-key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

## Contributing

Palmframe is open source and we welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, we'd love your help.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## The Palmframe Computer Club

Join our community of builders:
- **GitHub**: [github.com/palmframe/palmframe](https://github.com/palmframe/palmframe)
- **Discord**: [discord.gg/palmframe](https://discord.gg/palmframe)
- **X/Twitter**: [@palmframe](https://x.com/palmframe)

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Palmframe is built on top of [E2B Fragments](https://github.com/e2b-dev/fragments) and powered by the [E2B SDK](https://github.com/e2b-dev/code-interpreter). Thank you to the E2B team for creating the amazing infrastructure that makes secure sandboxed code execution possible!
