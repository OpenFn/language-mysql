# Language MySQL [![Build Status](https://travis-ci.org/OpenFn/language-mysql.svg?branch=master)](https://travis-ci.org/OpenFn/language-mysql)

Language Pack for building expressions and operations to run MySQL queries.

**See
[`src/Adaptor.js`](https://github.com/OpenFn/language-mysql/blob/master/src/Adaptor.js)
for the full list of available helper functions including `upsert(...)`.**

## Documentation

## sample configuration

```json
{
  "host": "some-host-url.compute-1.amazonaws.com",
  "port": "3306",
  "database": "wouldntyouliketoknow",
  "user": "me",
  "password": "noway"
}
```

## Execute a query
Execute an sql query with the node mysql package.

```js
query({
  sql: state => {
    return `select * from ${state.data.table} where id = ?;`;
  },
  timeout: 4000,
  values: ['007'],
});
```

## Execute a sql query
This function takes either a `string` or a `function` that takes states and returns a string.

```js
sqlString(state => {
  return (
    `INSERT INTO untitled_table (name, the_geom) VALUES ('` +
    state.data.version +
    `', ` +
    dataValue('form.Choix_tache')(state) +
    `)`
  );
});
```

## Insert a single record

This function is used to insert a single record in a MySQL database.

```js
insert(
  'some_table',
  fields(
    field('firstname', dataValue('form.patient_firstname')),
    field('lastname', dataValue('form.patient_lastname'))
  )
);
```

## Insert or update a single record

This function is used to insert a single record in a MySQL database or update it
if there is a match.

```js
upsert(
  'some_table',
  fields(
    field('firstname', dataValue('form.patient_firstname')),
    field('lastname', dataValue('form.patient_lastname'))
  )
);
```

## Development

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.

To build the docs for this repo, run
`./node_modules/.bin/jsdoc --readme ./README.md ./lib -d docs`.
