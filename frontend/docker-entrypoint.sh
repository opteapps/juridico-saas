#!/bin/sh

# Substitui a variável BACKEND_URL no nginx.conf
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Inicia o nginx
nginx -g 'daemon off;'