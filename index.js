var _ = require('lodash')
  , async = require('async');

module.exports = {
  name: 'apostrophe-place',
  alias: 'places',
  label: 'Place',
  extend: 'apostrophe-pieces',
  
  // moogBundle: {
  //   modules: ['apostrophe-places-pages', 'apostrophe-places-widgets'],
  //   directory: 'lib/modules'
  // },

  beforeConstruct: function(self, options) {
    options.sort = { title: 1 };

    options.addFields = [].concat(options.addFields || []);

    options.arrangeFields = _.merge([
      { name: 'basic', label: 'Basics', fields: ['title', 'slug'] },
    ], options.arrangeFields || []);
  },

  construct: function(self, options) {
    var superFind = self.find;

    self.find = function(req, criteria, projection) {
      var cursor = superFind(req, criteria, projection);
      // require('./lib/cursor')(self, cursor);
      return cursor;
    };

    // limit the results of autocomplete for joins
    // so they only include 
    self.extendAutocompleteCursor = function(cursor) {
      // return cursor.upcoming(true);
    };
  },
};