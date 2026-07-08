# Stage 1: Build Vite React App
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve the production build using vite preview
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production

EXPOSE 3000

# Run preview bound to 0.0.0.0 so host access works
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
