/* */ 
"format cjs";
(function(process) {
  define(['../Core/defineProperties', '../Core/Event', './DataSource', './EntityCollection'], function(defineProperties, Event, DataSource, EntityCollection) {
    'use strict';
    function CustomDataSource(name) {
      this._name = name;
      this._clock = undefined;
      this._changed = new Event();
      this._error = new Event();
      this._isLoading = false;
      this._loading = new Event();
      this._entityCollection = new EntityCollection(this);
    }
    defineProperties(CustomDataSource.prototype, {
      name: {
        get: function() {
          return this._name;
        },
        set: function(value) {
          if (this._name !== value) {
            this._name = value;
            this._changed.raiseEvent(this);
          }
        }
      },
      clock: {
        get: function() {
          return this._clock;
        },
        set: function(value) {
          if (this._clock !== value) {
            this._clock = value;
            this._changed.raiseEvent(this);
          }
        }
      },
      entities: {get: function() {
          return this._entityCollection;
        }},
      isLoading: {
        get: function() {
          return this._isLoading;
        },
        set: function(value) {
          DataSource.setLoading(this, value);
        }
      },
      changedEvent: {get: function() {
          return this._changed;
        }},
      errorEvent: {get: function() {
          return this._error;
        }},
      loadingEvent: {get: function() {
          return this._loading;
        }},
      show: {
        get: function() {
          return this._entityCollection.show;
        },
        set: function(value) {
          this._entityCollection.show = value;
        }
      }
    });
    return CustomDataSource;
  });
})(require('process'));
