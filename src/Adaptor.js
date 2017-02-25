import { execute as commonExecute, expandReferences } from 'language-common';
import { resolve as resolveUrl } from 'url';
import mysql from 'mysql';
var jsonSql = require('json-sql')();

/** @module Adaptor */

/**
 * Execute a sequence of operations.
 * Wraps `language-common/execute`, and prepends initial state for mysql.
 * @example
 * execute(
 *   create('foo'),
 *   delete('bar')
 * )(state)
 * @constructor
 * @param {Operations} operations - Operations to be performed.
 * @returns {Operation}
 */
export function execute(...operations) {
  const initialState = {
    references: [],
    data: null
  }

  return state => {
    return commonExecute(
      connect,
      ...operations,
      disconnect,
      cleanupState
    )({ ...initialState, ...state })
  };

}

function connect(state) {

  const { host, port, database, password, user } = state.configuration;

  var connection = mysql.createConnection({
    host     : host,
    user     : user,
    password : password,
    database : database,
    port     : port
  });

  connection.connect();
  console.log(`Successfully connected to ${database}...`)
  return { ...state, connection: connection }

}

function disconnect(state) {
  state.connection.end()
  return state
};

function cleanupState(state) {
  delete state.connection;
  return state;
}

/**
 * Execute an SQL statement
 * @example
 * execute(
 *   sql(sqlQuery)
 * )(state)
 * @constructor
 * @param {object} sqlQuery - Payload data for the message
 * @returns {Operation}
 */
export function insert(table, fields) {

  return state => {

    let { connection } = state;

    const valuesObj = expandReferences(fields)(state);
    console.log(valuesObj)

    var sql = jsonSql.build({
        type: 'insert',
        table: table,
        values: valuesObj
    });

    console.log("Executing MySQL statement: " + sql.query)

    return new Promise((resolve, reject) => {
      // execute a query on our database
      connection.query(sql.query, function(err, results, fields) {
        if (err) {
          reject(err);
          // Disconnect if there's an error.
          console.log("That's an error. Disconnecting from database.")
          connection.end();
        } else {
          console.log("Success...")
          console.log(results)
          console.log(fields)
          resolve(results)
        }
      })
    })
    .then((data) => {
      const nextState = { ...state, response: { body: data } };
      return nextState;
    })

  }
}


/**
 * Execute an SQL statement
 * @example
 * execute(
 *   sql(sqlQuery)
 * )(state)
 * @constructor
 * @param {object} sqlQuery - Payload data for the message
 * @returns {Operation}
 */
export function sqlString(fun) {

  return state => {

    let { connection } = state;

    const body = fun(state);

    console.log("Executing MySQL statement: " + body)

    return new Promise((resolve, reject) => {
      // execute a query on our database
      connection.query(body, function(err, results, fields) {
        if (err) {
          reject(err);
          // Disconnect if there's an error.
          console.log("That's an error. Disconnecting from database.")
          connection.end();
        } else {
          console.log("Success...")
          console.log(results)
          console.log(fields)
          resolve(results)
        }
      })
    })
    .then((data) => {
      const nextState = { ...state, response: { body: data } };
      return nextState;
    })

  }
}

export {
  field, fields, sourceValue, alterState, arrayToString, each, combine,
  merge, dataPath, dataValue, lastReferenceValue
} from 'language-common';
