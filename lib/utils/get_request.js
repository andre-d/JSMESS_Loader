define(function() {
  'use strict';

  /** 
   * Returns the sample rate as reported by the Web Audio API.
   *
   * @returns {number} Representing the sample rate, in samples per second,
   *   used by all nodes in this context. 
   */
  function getRequest(url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
      if (xhr.readyState === 4) {
        callback.call(xhr, xhr.response);
      }
    };

    window.setTimeout(function() {
      xhr.open('GET', url, true);
      xhr.send();
    }, 0);

    return xhr;
  }

  return getRequest;
});
