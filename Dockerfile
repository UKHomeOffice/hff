FROM node:24.18.0-alpine3.24@sha256:4ba75f835bb8802193e4c114572113d4b26f95f6f094f4b5229d2a77773e0afc
USER root

# Switch to UK Alpine mirrors, update package index and upgrade all installed packages
RUN echo "http://uk.alpinelinux.org/alpine/v3.24/main" > /etc/apk/repositories ; \
    echo "http://uk.alpinelinux.org/alpine/v3.24/community" >> /etc/apk/repositories ; \
    apk upgrade --no-cache

RUN npm install -g npm@12.0.1 && \
    \
    # --- Patch brace-expansion ---
    npm pack brace-expansion@5.0.8 --pack-destination /tmp && \
    rm -rf "$(npm root -g)/npm/node_modules/brace-expansion" && \
    mkdir -p "$(npm root -g)/npm/node_modules/brace-expansion" && \
    tar -xzf /tmp/brace-expansion-5.0.8.tgz -C "$(npm root -g)/npm/node_modules/brace-expansion" --strip-components=1 && \
    rm /tmp/brace-expansion-5.0.8.tgz && \
    \
    # --- Patch js-yaml ---
    npm pack js-yaml@4.3.0 --pack-destination /tmp && \
    rm -rf "$(npm root -g)/npm/node_modules/js-yaml" && \
    mkdir -p "$(npm root -g)/npm/node_modules/js-yaml" && \
    tar -xzf /tmp/js-yaml-4.3.0.tgz -C "$(npm root -g)/npm/node_modules/js-yaml" --strip-components=1 && \
    rm /tmp/js-yaml-4.3.0.tgz && \
    \
    # --- Verification ---
    npm --version && \
    echo "brace-expansion version:" && \
    node -p "require('$(npm root -g)/npm/node_modules/brace-expansion/package.json').version" && \
    echo "js-yaml version:" && \
    node -p "require('$(npm root -g)/npm/node_modules/js-yaml/package.json').version"
    

# Upgrade bundled npm deps so Trivy does not report vulnerable undici from base image toolchain
RUN npm install -g npm@12.0.0 && npm --version
    
# Setup nodejs group & nodejs user
RUN addgroup --system nodejs --gid 998 && \
    adduser --system nodejs --uid 999 --home /app/ && \
    chown -R 999:998 /app/

USER 999

WORKDIR /app

COPY --chown=999:998 . /app

RUN yarn install --frozen-lockfile --production && \
    yarn run postinstall

HEALTHCHECK --interval=5m --timeout=3s \
 CMD curl --fail http://localhost:8080 || exit 1

CMD ["sh", "/app/run.sh"]

EXPOSE 8080
