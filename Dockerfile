# stage 0 - build image
FROM node:18.12.1-bullseye-slim AS builder
WORKDIR /app
ENV TZ=America/Argentina/Buenos_Aires
RUN apt-get update
RUN apt-get install -yq tzdata && \
  ln -fs /usr/share/zoneinfo/America/Argentina/Buenos_Aires /etc/localtime && \
  dpkg-reconfigure -f noninteractive tzdata
RUN apt-get install -y openssl tzdata
COPY package.json package-lock.json tsconfig.build.json tsconfig.json nest-cli.json /app/
RUN npm ci && npm cache clean --force
RUN npm install -g npm@9.2.0
COPY src /app/src
COPY prisma/basapp/schema.prisma /app/prisma/basapp/schema.prisma
COPY prisma/girovision/schema.prisma /app/prisma/girovision/schema.prisma
COPY prisma/basapp/seeders /app/prisma/basapp/seeders
RUN npm run prisma:generate
RUN npm run build

# stage 1 - create production ready container based on stage 0
FROM node:18.12.1-bullseye-slim
WORKDIR /app
ENV TZ=America/Argentina/Buenos_Aires
RUN apt-get update
RUN apt-get install -y openssl tzdata
RUN apt-get install -yq tzdata && \
  ln -fs /usr/share/zoneinfo/America/Argentina/Buenos_Aires /etc/localtime && \
  dpkg-reconfigure -f noninteractive tzdata
COPY package.json package-lock.json nest-cli.json /app/
RUN apt-get update
RUN npm ci --only=production --ignore-scripts && npm cache clean --force
COPY --from=builder /app/prisma/basapp/schema.prisma /app/prisma/basapp/schema.prisma
COPY --from=builder /app/prisma/girovision/schema.prisma /app/prisma/girovision/schema.prisma
COPY --from=builder /app/prisma/basapp/seeders /app/prisma/basapp/seeders
COPY --from=builder /app/node_modules/bcryptjs /app/node_modules/bcryptjs
COPY --from=builder /app/node_modules/sharp /app/node_modules/sharp
COPY --from=builder /app/node_modules/.prisma/client /app/node_modules/.prisma/client
COPY --from=builder /app/node_modules/.prisma/girovision-client /app/node_modules/.prisma/girovision-client
COPY --from=builder /app/dist/src /app/dist
COPY --from=builder /app/dist/prisma/basapp/seeders /app/seeders
RUN rm -rf /app/seeders/model/*.ts
RUN rm -rf /app/seeders/model/*.map
USER node
CMD [ "npm", "run", "start:prod" ]