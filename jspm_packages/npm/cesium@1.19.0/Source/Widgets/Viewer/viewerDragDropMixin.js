/* */ 
"format cjs";
(function(process) {
  define(['../../Core/defaultValue', '../../Core/defined', '../../Core/defineProperties', '../../Core/DeveloperError', '../../Core/Event', '../../Core/wrapFunction', '../../DataSources/CzmlDataSource', '../../DataSources/GeoJsonDataSource', '../../DataSources/KmlDataSource', '../getElement'], function(defaultValue, defined, defineProperties, DeveloperError, Event, wrapFunction, CzmlDataSource, GeoJsonDataSource, KmlDataSource, getElement) {
    'use strict';
    function viewerDragDropMixin(viewer, options) {
      if (!defined(viewer)) {
        throw new DeveloperError('viewer is required.');
      }
      if (viewer.hasOwnProperty('dropTarget')) {
        throw new DeveloperError('dropTarget is already defined by another mixin.');
      }
      if (viewer.hasOwnProperty('dropEnabled')) {
        throw new DeveloperError('dropEnabled is already defined by another mixin.');
      }
      if (viewer.hasOwnProperty('dropError')) {
        throw new DeveloperError('dropError is already defined by another mixin.');
      }
      if (viewer.hasOwnProperty('clearOnDrop')) {
        throw new DeveloperError('clearOnDrop is already defined by another mixin.');
      }
      if (viewer.hasOwnProperty('flyToOnDrop')) {
        throw new DeveloperError('flyToOnDrop is already defined by another mixin.');
      }
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      var dropEnabled = true;
      var flyToOnDrop = true;
      var dropError = new Event();
      var clearOnDrop = defaultValue(options.clearOnDrop, true);
      var dropTarget = defaultValue(options.dropTarget, viewer.container);
      var proxy = options.proxy;
      dropTarget = getElement(dropTarget);
      defineProperties(viewer, {
        dropTarget: {
          get: function() {
            return dropTarget;
          },
          set: function(value) {
            if (!defined(value)) {
              throw new DeveloperError('value is required.');
            }
            unsubscribe(dropTarget, handleDrop);
            dropTarget = value;
            subscribe(dropTarget, handleDrop);
          }
        },
        dropEnabled: {
          get: function() {
            return dropEnabled;
          },
          set: function(value) {
            if (value !== dropEnabled) {
              if (value) {
                subscribe(dropTarget, handleDrop);
              } else {
                unsubscribe(dropTarget, handleDrop);
              }
              dropEnabled = value;
            }
          }
        },
        dropError: {get: function() {
            return dropError;
          }},
        clearOnDrop: {
          get: function() {
            return clearOnDrop;
          },
          set: function(value) {
            clearOnDrop = value;
          }
        },
        flyToOnDrop: {
          get: function() {
            return flyToOnDrop;
          },
          set: function(value) {
            flyToOnDrop = value;
          }
        },
        proxy: {
          get: function() {
            return proxy;
          },
          set: function(value) {
            proxy = value;
          }
        }
      });
      function handleDrop(event) {
        stop(event);
        if (clearOnDrop) {
          viewer.entities.removeAll();
          viewer.dataSources.removeAll();
        }
        var files = event.dataTransfer.files;
        var length = files.length;
        for (var i = 0; i < length; i++) {
          var file = files[i];
          var reader = new FileReader();
          reader.onload = createOnLoadCallback(viewer, file, proxy);
          reader.onerror = createDropErrorCallback(viewer, file);
          reader.readAsText(file);
        }
      }
      subscribe(dropTarget, handleDrop);
      viewer.destroy = wrapFunction(viewer, viewer.destroy, function() {
        viewer.dropEnabled = false;
      });
      viewer._handleDrop = handleDrop;
    }
    function stop(event) {
      event.stopPropagation();
      event.preventDefault();
    }
    function unsubscribe(dropTarget, handleDrop) {
      var currentTarget = dropTarget;
      if (defined(currentTarget)) {
        currentTarget.removeEventListener('drop', handleDrop, false);
        currentTarget.removeEventListener('dragenter', stop, false);
        currentTarget.removeEventListener('dragover', stop, false);
        currentTarget.removeEventListener('dragexit', stop, false);
      }
    }
    function subscribe(dropTarget, handleDrop) {
      dropTarget.addEventListener('drop', handleDrop, false);
      dropTarget.addEventListener('dragenter', stop, false);
      dropTarget.addEventListener('dragover', stop, false);
      dropTarget.addEventListener('dragexit', stop, false);
    }
    function createOnLoadCallback(viewer, file, proxy) {
      var scene = viewer.scene;
      return function(evt) {
        var fileName = file.name;
        try {
          var loadPromise;
          if (/\.czml$/i.test(fileName)) {
            loadPromise = CzmlDataSource.load(JSON.parse(evt.target.result), {sourceUri: fileName});
          } else if (/\.geojson$/i.test(fileName) || /\.json$/i.test(fileName) || /\.topojson$/i.test(fileName)) {
            loadPromise = GeoJsonDataSource.load(JSON.parse(evt.target.result), {sourceUri: fileName});
          } else if (/\.(kml|kmz)$/i.test(fileName)) {
            loadPromise = KmlDataSource.load(file, {
              sourceUri: fileName,
              proxy: proxy,
              camera: scene.camera,
              canvas: scene.canvas
            });
          } else {
            viewer.dropError.raiseEvent(viewer, fileName, 'Unrecognized file: ' + fileName);
            return;
          }
          if (defined(loadPromise)) {
            viewer.dataSources.add(loadPromise).then(function(dataSource) {
              if (viewer.flyToOnDrop) {
                viewer.flyTo(dataSource);
              }
            }).otherwise(function(error) {
              viewer.dropError.raiseEvent(viewer, fileName, error);
            });
          }
        } catch (error) {
          viewer.dropError.raiseEvent(viewer, fileName, error);
        }
      };
    }
    function createDropErrorCallback(viewer, file) {
      return function(evt) {
        viewer.dropError.raiseEvent(viewer, file.name, evt.target.error);
      };
    }
    return viewerDragDropMixin;
  });
})(require('process'));
