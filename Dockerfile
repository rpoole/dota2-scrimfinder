FROM node:8.10

RUN npm install -g serverless && npm install -g sass

RUN mkdir /web
WORKDIR /web

COPY ./web/package.json ./web/package-lock.json ./

RUN npm install

RUN mkdir docker_scripts
ADD docker_scripts /docker_scripts/

COPY web/serverless.yml ./
ENTRYPOINT /docker_scripts/entry-point.sh
