'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lastReferenceValue = exports.dataValue = exports.dataPath = exports.merge = exports.combine = exports.each = exports.arrayToString = exports.alterState = exports.sourceValue = exports.fields = exports.field = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.execute = execute;
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
 *   sql(sqlQuery)
 * )(state)
 * @constructor
 * @param {object} sqlQuery - Payload data for the message
 * @returns {Operation}
 */
function sqlString(queryString) {

  return function (state) {
    var connection = state.connection;


    try {
      var _ret = function () {

        var body = queryString(state);

        console.log("Executing MySQL statement: " + body);

        connection.query(body, function (error, results, fields) {
          if (error) throw error;
          console.log('The solution is: ', results[0].solution);
        });

        return {
          v: new Promise(function (resolve, reject) {
            // execute a query on our database
            connection.query(body, function (err, results, fields) {
              if (err) {
                reject(err);
                // Disconnect if there's an error.
                connection.end();
              } else {
                console.log(results);
                console.log(fields);
                resolve(results);
              }
            });
          }).then(function (data) {
            var nextState = _extends({}, state, { response: { body: data } });
            return nextState;
          })
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    } catch (e) {

      console.log(e);
    }

    connection.end();
  };
}
