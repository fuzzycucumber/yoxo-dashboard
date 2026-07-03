# Static hosting for local/authoritative runs (Docker-first).
# Production is any free static host (GitHub Pages / Cloudflare Pages).
FROM nginx:1.27-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY data.sample.json /usr/share/nginx/html/data.sample.json
# Optional: mount a real data.json at runtime:
#   docker run --rm -p 8080:80 -v "$PWD/data.json:/usr/share/nginx/html/data.json" maconso
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
