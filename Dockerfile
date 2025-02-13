FROM node:20.17.0-slim

ENV DOCKER_GROUP_ID 999

RUN apt-get update && \
  apt-get install -y curl && \
  curl -fsSL https://get.docker.com -o get-docker.sh && \
  sh ./get-docker.sh

## create group if not exists
RUN groupadd -g ${DOCKER_GROUP_ID} docker-host-group; exit 0
RUN usermod -aG ${DOCKER_GROUP_ID} node

RUN npm install -g @nestjs/cli@10.4.4

WORKDIR /home/node/app

USER node

CMD [ "tail", "-f", "/dev/null" ]
