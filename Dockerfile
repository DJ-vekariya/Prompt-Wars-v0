# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# We need to build the app with Vite. Ensure no error crashes it.
RUN npm run build:dev

# Production Stage
FROM nginx:alpine
# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html
# Cloud Run needs port 8080 by default
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
