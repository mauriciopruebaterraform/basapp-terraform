# BASAPP API

## Description

This repository contains a Node.js API code for the BASAPP project. It's written on top of [Nest](https://github.com/nestjs/nest) framework.

## Node Version

Node v16.x is required.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests. Make sure you have docker daemon installed first.
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## CRUD generation

```bash
# generate a new resource
$ nest g resource <resource-name>
```

## Database migrations

https://www.prisma.io/docs/concepts/components/prisma-migrate

```bash
# Generate and apply a new migration
$ npx prisma migrate dev --name init

# To only generate without applying a new migration, add the --create-only flag
$ npx prisma migrate dev --name init --create-only

#add a new model to the database
$ npx prisma migrate dev --name ${table name}

# Apply the migration
$ npx prisma migrate dev

# Reset the development database and execute seeders
$ npx prisma migrate reset

# Regenerate the client
$ npx prisma generate

# Seed the development database
$ npx prisma db seed
```

## Roles and Policies

Roles decorator runs a static check. It looks for the user role (present in JWT payload) to be contained in the allowed roles list. **OR strategy is used.**

Policies decorator runs a dynamic check. It looks for the permission list to match all the allowed permissions into the database. All of them must be present. **AND strategy is used.**

_**You can combine both or use only one of them.**_

Example of roles and policies decorators usage:

```js
  // check if the user is: user or monitoring or statesman
  @Roles(Role.user, Role.monitoring, Role.statesman)
  // check if the user has all permissions: attend-alert and list-alert
  @Policies('attend-alert', 'list-alert')
  listAlert(@Request() req): Alert[] {
    return [];
  }
```

## API Query Parameters

- Find one:
  - `include`: prisma include
  - `select`: prisma select
- List:
  - `include`: prisma include
  - `select`: prisma select
  - `orderBy`: prisma orderBy
  - `where`: prisma where
  - `skip`: number of items to skip
  - `take`: number of items to take
  - `includeCount`: include count in the response

## Swagger support

To inspect api endpoints documentation use http://localhost:3000/docs
It's restricted to DEVELOPMENT mode.

## Firebase

in order to configure the project, we will need to enter firebase.
click on this link and generate a new private key.

[service accounts SDK admin](https://console.firebase.google.com/u/0/project/pruebabasap/settings/serviceaccounts/adminsdk)

this will give you a json file.

then you need to set environment variable on your computer. `export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"`.

i leave you the link for more information.
[set environment variable](https://firebase.google.com/docs/admin/setup)

the idea of configuring the environment variables is so that we do not have problems when deploying the project to the cloud.
