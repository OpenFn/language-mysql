import { execute as commonExecute, expandReferences } from 'language-common';
import { resolve as resolveUrl } from 'url';
import mysql from 'mysql';

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
export function sqlString(queryString) {

  return state => {

    let { connection } = state;

    try {

      const body = sqlQuery(queryString);
      console.log("Executing MySQL statement: " + body)

      connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results[0].solution);
      });

      return new Promise((resolve, reject) => {
        // execute a query on our database
        connection.query(body, function(err, results, fields) {
          if (err) {
            reject(err);
            // Disconnect if there's an error.
            connection.end();
          } else {
            console.log(result)
            console.log(fields)
            resolve(result)
          }
        })
      })
      .then((data) => {
        const nextState = { ...state, response: { body: data } };
        return nextState;
      })

    } catch (e) {

      console.log(e)
      connection.end()

    }

  }
}

export {
  field, fields, sourceValue, alterState, arrayToString, each, combine,
  merge, dataPath, dataValue, lastReferenceValue
} from 'language-common';
