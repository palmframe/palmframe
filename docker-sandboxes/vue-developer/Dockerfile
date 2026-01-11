FROM node:20-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl git && \
    rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /home/user

# Pre-install Nuxt.js project
RUN npx --yes nuxi@latest init app --packageManager=npm --gitInit=false --force

WORKDIR /home/user/app

# Install Tailwind CSS
RUN npm install --save-dev --legacy-peer-deps @nuxtjs/tailwindcss tailwindcss postcss autoprefixer

# Add Tailwind to nuxt.config
RUN echo "export default defineNuxtConfig({" > nuxt.config.ts && \
    echo "  modules: ['@nuxtjs/tailwindcss']," >> nuxt.config.ts && \
    echo "  compatibilityDate: '2024-11-01'," >> nuxt.config.ts && \
    echo "  devtools: { enabled: false }" >> nuxt.config.ts && \
    echo "})" >> nuxt.config.ts

# Expose Nuxt dev server port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
