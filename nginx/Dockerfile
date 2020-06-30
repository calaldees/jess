FROM nginx:alpine

EXPOSE 80
VOLUME /logs

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY jess/ /app/www/
