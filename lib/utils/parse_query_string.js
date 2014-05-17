/**
 * @module util/parse_query_string
 */
define(function(require, exports, module) {
  'use strict';

  /** 
   * Accepts a URL params string and formats into an object.
   *
   * @param {string} querystring - A string formatted as URL paramters.
   * @returns {object} params - Containing decoded Key/Val parameters.
   */
  function parseQueryString(querystring) {
    // Ensure querystring is always a valid string.
    querystring = typeof querystring === "string" ? querystring : "";

    // Slice off leading `?`.
    querystring = querystring[0] === "?" ? querystring.slice(1) : querystring;

    // Split on all key/value pairs.
    return querystring.split("&").reduce(function(memo, pair) {
      // Decode both the key and the value.
      var keyVal = pair.split("=").map(decodeURIComponent);
      // Assign to the parameters object.
      return memo[keyVal[0]] = keyVal[1], memo;
    }, {});
  }

  module.exports = parseQueryString;
});
