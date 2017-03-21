'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.combine = exports.each = exports.arrayToString = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.execute = execute;
exports.insert = insert;
exports.upsert = upsert;
exports.sqlString = sqlString;

var _languageCommon = require('language-common');

Object.defineProperty(exports, 'field', {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, 'fields', {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, 'sourceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});
Object.defineProperty(exports, 'alterState', {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, 'arrayToString', {
  enumerable: true,
  get: function get() {
    return _languageCommon.arrayToString;
  }
});
Object.defineProperty(exports, 'each', {
  enumerable: true,
  get: function get() {
    return _languageCommon.each;
  }
});
Object.defineProperty(exports, 'combine', {
  enumerable: true,
  get: function get() {
    return _languageCommon.combine;
  }
});
Object.defineProperty(exports, 'merge', {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, 'dataPath', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, 'dataValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, 'lastReferenceValue', {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});

var _url = require('url');

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _squel = require('squel');

var _squel2 = _interopRequireDefault(_squel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function execute() {
  for (var _len = arguments.length, operations = Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  var initialState = {
    references: [],
    data: null
  };

  return function (state) {
    return _languageCommon.execute.apply(undefined, [connect].concat(operations, [disconnect, cleanupState]))(_extends({}, initialState, state));
  };
}

function connect(state) {
  var _state$configuration = state.configuration,
      host = _state$configuration.host,
      port = _state$configuration.port,
      database = _state$configuration.database,
      password = _state$configuration.password,
      user = _state$configuration.user;


  var connection = _mysql2.default.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    port: port
  });

  connection.connect();
  console.log('Preparing to query "' + database + '"...');
  return _extends({}, state, { connection: connection });
}

function disconnect(state) {
  state.connection.end();
  return state;
};

function cleanupState(state) {
  delete state.connection;
  return state;
}

/**
 * Execute an SQL statement
 * @example
 * execute(
 *   insert(table, fields)
 * )(state)
 * @constructor
 * @param {string} table - the table
 * @param {object} fields - a fields object
 * @returns {Operation}
 */
function insert(table, fields) {

  return function (state) {
    var connection = state.connection;


    var valuesObj = (0, _languageCommon.expandReferences)(fields)(state);

    var squelMysql = _squel2.default.useFlavour('mysql');

    var sqlParams = squelMysql.insert({
      autoQuoteFieldNames: true
    }).into(table).setFields(valuesObj).toParam();

    var sql = sqlParams.text;
    var inserts = sqlParams.values;
    exports.sqlString = sqlString = _mysql2.default.format(sql, inserts);

    console.log("Executing MySQL query: " + sqlString);

    return new Promise(function (resolve, reject) {
      // execute a query on our database


      // TODO: figure out how to escape the string.

      connection.query(sqlString, function (err, results, fields) {
        if (err) {
          reject(err);
          // Disconnect if there's an error.
          console.log("That's an error. Disconnecting from database.");
          connection.end();
        } else {
          console.log("Success...");
          console.log(results);
          console.log(fields);
          resolve(results);
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      return nextState;
    });
  };
}

/**
 * Execute an SQL INSERT ... ON DUPLICATE KEY UPDATE statement
 * @example
 * execute(
 *   upsert(table, fields)
 * )(state)
 * @constructor
 * @param {object} sqlQuery - Payload data for the message
 * @returns {Operation}
 */
function upsert(table, fields) {

  return function (state) {
    var connection = state.connection;


    var valuesObj = (0, _languageCommon.expandReferences)(fields)(state);

    var squelMysql = _squel2.default.useFlavour('mysql');

    var insertParams = squelMysql.insert({
      autoQuoteFieldNames: true
    }).into(table).setFields(valuesObj).toParam();

    var sql = insertParams.text;
    var inserts = insertParams.values;
    var insertString = _mysql2.default.format(sql, inserts);

    var updateParams = squelMysql.update({
      autoQuoteFieldNames: true
    }).table('').setFields(valuesObj).toParam();

    var sql = updateParams.text;
    var inserts = updateParams.values;
    var updateString = _mysql2.default.format(sql, inserts);

    var upsertString = insertString + ' ON DUPLICATE KEY UPDATE ' + updateString.slice(10);

    console.log("Executing MySQL query: " + upsertString);

    return new Promise(function (resolve, reject) {
      // execute a query on our database


      // TODO: figure out how to escape the string.

      connection.query(upsertString, function (err, results, fields) {
        if (err) {
          reject(err);
          // Disconnect if there's an error.
          console.log("That's an error. Disconnecting from database.");
          connection.end();
        } else {
          console.log("Success...");
          console.log(results);
          console.log(fields);
          resolve(results);
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      return nextState;
    });
  };
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
function sqlString(fun) {

  return function (state) {
    var connection = state.connection;


    var body = fun(state);

    console.log("Executing MySQL statement: " + body);

    return new Promise(function (resolve, reject) {
      // execute a query on our database
      connection.query(body, function (err, results, fields) {
        if (err) {
          reject(err);
          // Disconnect if there's an error.
          console.log("That's an error. Disconnecting from database.");
          connection.end();
        } else {
          console.log("Success...");
          console.log(results);
          console.log(fields);
          resolve(results);
        }
      });
    }).then(function (data) {
      var nextState = _extends({}, state, { response: { body: data } });
      return nextState;
    });
  };
}
