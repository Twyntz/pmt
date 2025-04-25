# Étape 1 : build l'app Angular
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# Étape 2 : serve avec Nginx
FROM nginx:alpine

# 💡 On copie le bon dossier de build
COPY --from=build /app/dist/pmt-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
