Language MySQL [![Build Status](https://travis-ci.org/OpenFn/language-mysql.svg?branch=master)](https://travis-ci.org/OpenFn/language-mysql)
==============

Language Pack for building expressions and operations to run MySQL queries.

Documentation
-------------

## sample configuration
```json
{
  "host": "some-host-url.compute-1.amazonaws.com",
  "port": "5432",
  "database": "wouldntyouliketoknow",
  "user": "me",
  "password": "noway",
  "ssl": true
}
```

## `sql(query)`
Execute an sql query.

#### sample usage with string interpolation
```js
sqlString(
  function(state) {
    return (
      `INSERT INTO untitled_table (name, the_geom) VALUES ('`
      + dataValue("form.first_name")(state)
      + `', ST_SetSRID(ST_Point(`
        + dataValue("lat")(state) + `, `
        + dataValue("long")(state) + `),4326))`
    )
  }
)
```

<!-- #### sample usage with JSON query body
```js
sqlJSON(operation, columns, values)
``` -->


Development
-----------

Clone the repo, run `npm install`.

Run tests using `npm run test` or `npm run test:watch`

Build the project using `make`.
