FROM node:20-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl git && \
    rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /home/user

# Pre-install Next.js and dependencies
# This creates a base Next.js project that will be overwritten with user code
RUN npx --yes create-next-app@14.2.5 app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

WORKDIR /home/user/app

# Install shadcn
RUN npx --yes shadcn@latest init -y -d

# Expose Next.js dev server port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
