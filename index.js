var _ = require('lodash')
  , async = require('async')
  , geocoder = require('./lib/geocoder');

module.exports = {
  name: 'apostrophe-place',
  alias: 'places',
  label: 'Place',
  extend: 'apostrophe-pieces',

  map: {
    browser: {
      // Hey, you have to configure me or it'll fail in production!
      // Yes really
      key: null
    }
  },

  moogBundle: {
    modules: ['apostrophe-places-pages', 'apostrophe-places-widgets'],
    directory: 'lib/modules'
  },

  afterConstruct: function(self) {

    if (!(self.options && self.options.map && self.options.map.browser && self.options.map.browser.key)) {
      console.error('*** Beginning July 2016 Google REQUIRES an API key for all new domains.');
      console.error('Make sure you get one and configure the "key" option to the');
      console.error('apostrophe-places module.');
      console.error('');
      console.error('Otherwise it will work in dev & staging but FAIL in production.');
    }

    self.pushAsset('script', 'always', { when: 'always' });
    self.pushAsset('stylesheet', 'map', { when: 'always' });

    var tools = [ 'map' ];
    _.each(tools, function(tool) {
      self.apos.push.browserMirrorCall('always', self, { 'tool': tool, stop: 'apostrophe-places' });
      var _options = (self.options && self.options[tool] && self.options[tool].browser) || {};

      // Otherwise there's really only one when multiple subclasses are
      // in play. TODO consider whether this makes self-documenting
      // options a bad idea when they are objects

      _options = _.cloneDeep(_options);
      _.defaults(_options, {
        name: self.__meta.name
      });

      self.apos.push.browserCall('always', 'apos.create(? + "-" + ?, ?)', self.__meta.name, tool, _options);
    });

    // Set up our route for serving
    self.apos.app.post(self.action + '/infoBox', function(req, res) {
      return res.send(self.render(req, '_infoBox', { item: req.body }));
    });
  },

  beforeConstruct: function(self, options) {
    options.sort = { title: 1 };

    options.addFields = [
      {
        name: 'address',
        label: 'Address',
        type: 'string'
      }
    ].concat(options.addFields || []);

    options.arrangeFields = _.merge([
      { name: 'basic', label: 'Basics', fields: ['title', 'slug', 'address'] },
    ], options.arrangeFields || []);

    options.mapInfoBoxFields = _.union(['_id', 'slug', 'title', 'tags', 'address', 'url', 'geo'], options.mapInfoBoxFields || []);
  },

  construct: function(self, options) {
    var superFind = self.find;

    self.addHelpers({
      pruneMapLocations: self.pruneMapLocations
    });

    self.pruneMapLocations = function(items) {
      var result = _.map(items, function(item) {
        return _.pick(item, options.mapInfoBoxFields);
      });

      return result;
    };

    // limit the results of autocomplete for joins
    // so they only include
    self.extendAutocompleteCursor = function(cursor) {
      // return cursor.upcoming(true);
    };

    if(!options.key) {
      console.log('WARNING: You need to provide a Google maps API key in your options in order for this module to work in the wild');
    }

    self.geocoder = geocoder({
      rateLimit: options.rateLimit,
      dailyLimit: options.dailyLimit,
      key: options.key,
      instance: self.name,
      apos: self.apos
    });

    self.beforeSave = function(req, piece, options, callback) {
      return self.geocoder.geocodePiece(piece, true, callback);
    };
  }
};
