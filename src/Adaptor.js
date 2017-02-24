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
      createClient,
      connect,
      ...operations,
      disconnect,
      cleanupState
    )({ ...initialState, ...state })
  };

}

function createClient(state) {
  const { host, port, database, password, user } = state.configuration;

  // setup client config
  var config = { host, port, database, user, password, ssl: true };

  // instantiate a new client
  var client = new pg.Client(config);

  return { ...state, client: client }
}

function connect(state) {
  let { client } = state;
  client.connect()
  return { ...state, client: client }
}

function disconnect(state) {
  let { client } = state;
  client.end()
  return state
}

function cleanupState(state) {
  delete state.client;
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
export function sql(sqlQuery) {

  return state => {

    let { client } = state;

    try {

      const body = sqlQuery(state);
      console.log("Executing SQL statement: " + body)

      return new Promise((resolve, reject) => {
        // execute a query on our database
        client.query(body, function(err, result) {
          if (err) {
            reject(err);
            // Disconnect if there's an error.
            client.end();
          } else {
            console.log(result)
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
      client.end()

    }

  }
}

export {
  field, fields, sourceValue, fields, alterState, arrayToString, each, combine,
  merge, dataPath, dataValue, lastReferenceValue
} from 'language-common';
