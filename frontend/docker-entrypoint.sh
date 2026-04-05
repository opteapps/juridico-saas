#!/bin/sh

# Substitui a variável BACKEND_URL no nginx.conf
sed -i "s|BACKEND_URL|${BACKEND_URL}|g" /etc/nginx/nginx.conf

# Inicia o nginx
nginx -g 'daemon off;'