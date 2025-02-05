FROM node:20.17.0-slim

RUN apt-get update -y && apt-get upgrade -y

RUN npm install -g @nestjs/cli@10.4.4

WORKDIR /home/node/app

USER node

CMD [ "tail", "-f", "/dev/null" ]
