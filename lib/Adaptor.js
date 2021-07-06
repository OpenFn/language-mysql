"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;
exports.insert = insert;
exports.upsert = upsert;
exports.upsertMany = upsertMany;
exports.query = query;
exports.sqlString = sqlString;
Object.defineProperty(exports, "field", {
  enumerable: true,
  get: function get() {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, "fields", {
  enumerable: true,
  get: function get() {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, "sourceValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.sourceValue;
  }
});
Object.defineProperty(exports, "alterState", {
  enumerable: true,
  get: function get() {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, "fn", {
  enumerable: true,
  get: function get() {
    return _languageCommon.fn;
  }
});
Object.defineProperty(exports, "arrayToString", {
  enumerable: true,
  get: function get() {
    return _languageCommon.arrayToString;
  }
});
Object.defineProperty(exports, "each", {
  enumerable: true,
  get: function get() {
    return _languageCommon.each;
  }
});
Object.defineProperty(exports, "combine", {
  enumerable: true,
  get: function get() {
    return _languageCommon.combine;
  }
});
Object.defineProperty(exports, "merge", {
  enumerable: true,
  get: function get() {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, "dataPath", {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, "dataValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, "lastReferenceValue", {
  enumerable: true,
  get: function get() {
    return _languageCommon.lastReferenceValue;
  }
});
Object.defineProperty(exports, "http", {
  enumerable: true,
  get: function get() {
    return _languageCommon.http;
  }
});

var _languageCommon = require("@openfn/language-common");

var _url = require("url");

var _mysql = _interopRequireDefault(require("mysql"));

var _squel = _interopRequireDefault(require("squel"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
  for (var _len = arguments.length, operations = new Array(_len), _key = 0; _key < _len; _key++) {
    operations[_key] = arguments[_key];
  }

  var initialState = {
    references: [],
    data: null
  };
  return function (state) {
    return _languageCommon.execute.apply(void 0, [connect].concat(operations, [disconnect, cleanupState]))(_objectSpread(_objectSpread({}, initialState), state));
  };
}

function connect(state) {
  var _state$configuration = state.configuration,
      host = _state$configuration.host,
      port = _state$configuration.port,
      database = _state$configuration.database,
      password = _state$configuration.password,
      user = _state$configuration.user;

  var connection = _mysql["default"].createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    port: port
  });

  connection.connect();
  console.log("Preparing to query \"" + database + "\"...");
  return _objectSpread(_objectSpread({}, state), {}, {
    connection: connection
  });
}

function disconnect(state) {
  state.connection.end();
  return state;
}

function cleanupState(state) {
  delete state.connection;
  return state;
}
/**
 * Insert a record
 * @example
 * execute(
 *   insert('table', fields(
 *      field('name', dataValue('name'))
 *   ))
 * )(state)
 * @constructor
 * @param {string} table - The target table
 * @param {object} fields - A fields object
 * @returns {Operation}
 */


function insert(table, fields) {
  return function (state) {
    var connection = state.connection;
    var valuesObj = (0, _languageCommon.expandReferences)(fields)(state);

    var squelMysql = _squel["default"].useFlavour('mysql');

    var sqlParams = squelMysql.insert({
      autoQuoteFieldNames: true
    }).into(table).setFields(valuesObj).toParam();
    var sql = sqlParams.text;
    var inserts = sqlParams.values;
    exports.sqlString = sqlString = _mysql["default"].format(sql, inserts);
    console.log("Executing MySQL query: ".concat(sqlString));
    return new Promise(function (resolve, reject) {
      // execute a query on our database
      // TODO: figure out how to escape the string.
      connection.query(sqlString, function (err, results, fields) {
        if (err) {
          reject(err); // Disconnect if there's an error.

          console.log('There is an error. Disconnecting from database.');
          connection.end();
        } else {
          console.log('Success...');
          console.log(results);
          console.log(fields);
          resolve(results);
        }
      });
    }).then(function (data) {
      var nextState = _objectSpread(_objectSpread({}, state), {}, {
        response: {
          body: data
        }
      });

      return nextState;
    });
  };
}
/**
 * Insert or Update a record if matched
 * @example
 * execute(
 *   upsert('table', fields(
 *      field('name', dataValue('name'))
 *   ))
 * )(state)
 * @constructor
 * @param {string} table - The target table
 * @param {object} fields - A fields object
 * @returns {Operation}
 */


function upsert(table, fields) {
  return function (state) {
    var connection = state.connection;
    var valuesObj = (0, _languageCommon.expandReferences)(fields)(state);

    var squelMysql = _squel["default"].useFlavour('mysql');

    var insertParams = squelMysql.insert({
      autoQuoteFieldNames: true
    }).into(table).setFields(valuesObj).toParam();
    var sql = insertParams.text;
    var inserts = insertParams.values;

    var insertString = _mysql["default"].format(sql, inserts);

    var updateParams = squelMysql.update({
      autoQuoteFieldNames: true
    }).table('').setFields(valuesObj).toParam();
    var sql = updateParams.text;
    var inserts = updateParams.values;

    var updateString = _mysql["default"].format(sql, inserts);

    var upsertString = insertString + " ON DUPLICATE KEY UPDATE " + updateString.slice(10);
    console.log('Executing MySQL query: ' + upsertString);
    return new Promise(function (resolve, reject) {
      // execute a query on our database
      // TODO: figure out how to escape the string.
      connection.query(upsertString, function (err, results, fields) {
        if (err) {
          reject(err); // Disconnect if there's an error.

          console.log("That's an error. Disconnecting from database.");
          connection.end();
        } else {
          console.log('Success...');
          console.log(results);
          console.log(fields);
          resolve(results);
        }
      });
    }).then(function (data) {
      var nextState = _objectSpread(_objectSpread({}, state), {}, {
        response: {
          body: data
        }
      });

      return nextState;
    });
  };
}
/**
 * Insert or update multiple records using ON DUPLICATE KEY
 * @public
 * @example
 * upsertMany(
 *   'users', // the DB table
 *   [
 *     { name: 'one', email: 'one@openfn.org' },
 *     { name: 'two', email: 'two@openfn.org' },
 *   ]
 * )
 * @constructor
 * @param {string} table - The target table
 * @param {array} data - An array of objects or a function that returns an array
 * @returns {Operation}
 */


function upsertMany(table, data) {
  return function (state) {
    return new Promise(function (resolve, reject) {
      var rows = (0, _languageCommon.expandReferences)(data)(state);

      if (!rows || rows.length === 0) {
        console.log('No records provided; skipping upsert.');
        resolve(state);
      }

      var squelMysql = _squel["default"].useFlavour('mysql');

      var columns = Object.keys(rows[0]);
      var upsertSql = squelMysql.insert().into(table).setFieldsRows(rows);
      columns.map(function (c) {
        upsertSql = upsertSql.onDupUpdate("".concat(c, "=values(").concat(c, ")"));
      });
      var upsertString = upsertSql.toString();
      console.log(upsertString);
      var connection = state.connection;
      connection.query(upsertString, function (err, results, fields) {
        if (err) {
          reject(err); // Disconnect if there's an error.

          console.log("That's an error. Disconnecting from database.");
          connection.end();
        } else {
          console.log('Success...');
          console.log(results);
          console.log(fields);
          resolve(results);
        }
      });
    }).then(function (data) {
      var nextState = _objectSpread(_objectSpread({}, state), {}, {
        response: {
          body: data
        }
      });

      return nextState;
    });
  };
}
/**
 * Execute a SQL statement
 * @example
 * execute(
 *   query({ sql: 'select * from users;' })
 * )(state)
 * @constructor
 * @param {object} options - Payload data for the message
 * @returns {Operation}
 */


function query(options) {
  return function (state) {
    var connection = state.connection;
    var opts = (0, _languageCommon.expandReferences)(options)(state);
    console.log('Executing MySQL statement with options: ' + JSON.stringify(opts, 2, null));
    return new Promise(function (resolve, reject) {
      // execute a query on our database
      connection.query(opts, function (err, results, fields) {
        if (err) {
          reject(err); // Disconnect if there's an error.

          console.log("That's an error. Disconnecting from database.");
          connection.end();
        } else {
          console.log('Success...');
          resolve(JSON.parse(JSON.stringify(results)));
        }
      });
    }).then(function (data) {
      console.log(data);

      var nextState = _objectSpread(_objectSpread({}, state), {}, {
        response: {
          body: data
        }
      });

      return nextState;
    });
  };
}
/**
 * Execute a SQL statement
 * @example
 * execute(
 *   sqlString(state => "select * from items;")
 * )(state)
 * @constructor
 * @param {String} queryString - A query string (or function which takes state and returns a string)
 * @returns {Operation}
 */


function sqlString(queryString) {
  return function (state) {
    return query({
      sql: queryString
    })(state);
  };
}
