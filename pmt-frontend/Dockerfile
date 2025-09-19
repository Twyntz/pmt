# Étape 1 : build Angular
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# build prod
RUN npm run build -- --configuration=production

# Étape 2 : Nginx
FROM nginx:alpine

# Fallback SPA + proxy (si tu veux) via ce fichier conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie le bon dossier "browser" quel que soit le nom du projet
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /tmp/dist
RUN set -ex; \
    browser_dir="$(find /tmp/dist -type d -name browser | head -n 1)"; \
    echo "Using browser dir: $browser_dir"; \
    cp -r "$browser_dir"/* /usr/share/nginx/html/; \
    rm -rf /tmp/dist

EXPOSE 80
