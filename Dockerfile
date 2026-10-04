# Futodama : page statique servie par nginx, sur futodama.aelworks.fr.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html moteur.js intention.js aelworks-logo.png futodama-icon.png favicon.png /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
