# ------------------------------------------------------------------
# RUN STITCHCODE — two-step recipe:
#   1. bake the studio (Node)
#   2. serve it fast and small (nginx)
# ------------------------------------------------------------------

# Step 1 — the oven
FROM node:24-alpine AS bake
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Relative paths so the image works behind any sub-path.
RUN npm run build -- --base=./

# Step 2 — the shop window
FROM nginx:1.31-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=bake /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
