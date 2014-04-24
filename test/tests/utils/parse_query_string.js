define(function(require) {
  'use strict';

  var parseQueryString = require('../../../lib/utils/parse_query_string');

  describe('utils/parseQueryString', function() {
    it('exposes a function', function() {
      expect(parseQueryString).to.be.a('function');
    });

    it('returns an empty object for invalid url params', function() {
      var retVal = parseQueryString();

      expect(retVal).to.be.an('object');
      expect(JSON.stringify(retVal)).to.equal('{}');
    });

    it('can parse a simple key value', function() {
      var retVal = parseQueryString('key=value');

      expect(retVal).to.be.an('object');
      expect(JSON.stringify(retVal)).to.equal('{"key":"value"}');
    });

    it('can parse a complex location.search-like string', function() {
      var search = '?special%20key=%20(%E2%95%AF%C2%B0%E2%96%A1%C2%B0%EF%BC%' +
        '89%E2%95%AF%EF%B8%B5%20%E2%94%BB%E2%94%81%E2%94%BB';
      var retVal = parseQueryString(search);

      expect(retVal).to.be.an('object');
      expect(retVal).to.have.property('special key')
        .and.equal(' (╯°□°）╯︵ ┻━┻');
    });
  });
});
