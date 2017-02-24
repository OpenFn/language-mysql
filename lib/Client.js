'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clientPost = clientPost;
exports.getThenPost = getThenPost;

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function clientPost(_ref) {
  var username = _ref.username;
  var password = _ref.password;
  var body = _ref.body;
  var url = _ref.url;

  return new Promise(function (resolve, reject) {
    _request2.default.post({
      url: url,
      json: body
    }, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        console.log("POST succeeded.");
        resolve(body);
      }
    });
  });
}

function getThenPost(_ref2) {
  var username = _ref2.username;
  var password = _ref2.password;
  var query = _ref2.query;
  var url = _ref2.url;
  var sendImmediately = _ref2.sendImmediately;
  var postUrl = _ref2.postUrl;

  return new Promise(function (resolve, reject) {

    (0, _request2.default)({
      url: url, //URL to hit
      qs: query, //Query string data
      method: 'GET', //Specify the method
      'auth': {
        'user': username,
        'pass': password,
        'sendImmediately': sendImmediately
      }
    }, function (error, response, getResponseBody) {
      if ([200, 201, 202].indexOf(response.statusCode) == -1 || error) {
        console.log("GET failed.");
        // TODO: construct a useful error message, request returns a blank
        // error when the server responds, and the response object is massive
        // and unserializable.
        reject(error);
      } else {
        console.log("GET succeeded.");
        _request2.default.post({
          url: postUrl,
          json: JSON.parse(getResponseBody)
        }, function (error, response, postResponseBody) {
          if (error) {
            reject(error);
          } else {
            console.log("POST succeeded.");
            resolve(getResponseBody);
          }
        });
      }
    });
  });
}
