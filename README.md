## Requirements

- Docker
- Node js 20.0

## Project setup

### With docker compose

```bash
#run 
docker compose -f "docker-compose.yml" up -d --build
```
After running the command, the api will be available on port 3000

### With Node js

```bash
#install dependencies, remember to use a node version of 20.0 or greater
npm install

#(optional) Create only the redis and db services on docker, you can config your postgres if you don't want to use docker
docker compose -f "docker-compose.yml" up -d --build

#Run the project
npm run start:dev
```
After this the api will be running on port 3000

## Run tests

```bash
npm run test
```

## Endpoint to test the xml.

The endpoint is /graphql. If you navigate to http://localhost:3000/graphql in your browser, you'll access the NestJS GraphQL Playground, which provides an easy-to-use UI for testing the query.

## Stay in touch

- Author - [Glauber Cruz](https://www.linkedin.com/in/glauber-bispo-963845218/)