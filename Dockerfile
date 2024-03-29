FROM node:16-alpine as node-environment

ENV TZ=UTC
ENV LOG_LEVEL=info

ADD --chown=1000:1000 package.json package.json
RUN npm i --no-optional --no-fund --production
ADD --chown=1000:1000 src src
CMD ["node", "src/app.js"]
