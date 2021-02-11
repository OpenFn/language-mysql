# Language MySQL [![Build Status](https://travis-ci.org/OpenFn/language-mysql.svg?branch=master)](https://travis-ci.org/OpenFn/language-mysql)

Language Pack for building expressions and operations to run MySQL queries.

**See [`src/Adaptor.js`](https://github.com/OpenFn/language-mysql/blob/master/src/Adaptor.js) for the full list of available helper functions including `upsert(...)`.**

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

## query(options)

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

## DEPRECATED: `sqlString(query)`

DEPRECATED: Execute an sql query.

#### sample usage with string interpolation

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

#### sample usage with `insert`

```js
insert('some_table', fields(field('name', dataValue('form.patient_name'))));
```

## Development

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
