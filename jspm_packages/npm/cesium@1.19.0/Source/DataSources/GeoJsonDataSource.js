/* */ 
"format cjs";
(function(process) {
  define(['../Core/Cartesian3', '../Core/Color', '../Core/createGuid', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/DeveloperError', '../Core/Event', '../Core/getFilenameFromUri', '../Core/loadJson', '../Core/PinBuilder', '../Core/PolygonHierarchy', '../Core/RuntimeError', '../Scene/VerticalOrigin', '../ThirdParty/topojson', '../ThirdParty/when', './BillboardGraphics', './CallbackProperty', './ColorMaterialProperty', './ConstantPositionProperty', './ConstantProperty', './DataSource', './EntityCollection', './PolygonGraphics', './PolylineGraphics'], function(Cartesian3, Color, createGuid, defaultValue, defined, defineProperties, DeveloperError, Event, getFilenameFromUri, loadJson, PinBuilder, PolygonHierarchy, RuntimeError, VerticalOrigin, topojson, when, BillboardGraphics, CallbackProperty, ColorMaterialProperty, ConstantPositionProperty, ConstantProperty, DataSource, EntityCollection, PolygonGraphics, PolylineGraphics) {
    'use strict';
    function defaultCrsFunction(coordinates) {
      return Cartesian3.fromDegrees(coordinates[0], coordinates[1], coordinates[2]);
    }
    var crsNames = {
      'urn:ogc:def:crs:OGC:1.3:CRS84': defaultCrsFunction,
      'EPSG:4326': defaultCrsFunction
    };
    var crsLinkHrefs = {};
    var crsLinkTypes = {};
    var defaultMarkerSize = 48;
    var defaultMarkerSymbol;
    var defaultMarkerColor = Color.ROYALBLUE;
    var defaultStroke = Color.YELLOW;
    var defaultStrokeWidth = 2;
    var defaultFill = Color.fromBytes(255, 255, 0, 100);
    var defaultStrokeWidthProperty = new ConstantProperty(defaultStrokeWidth);
    var defaultStrokeMaterialProperty = new ColorMaterialProperty(defaultStroke);
    var defaultFillMaterialProperty = new ColorMaterialProperty(defaultFill);
    var sizes = {
      small: 24,
      medium: 48,
      large: 64
    };
    var simpleStyleIdentifiers = ['title', 'description', 'marker-size', 'marker-symbol', 'marker-color', 'stroke', 'stroke-opacity', 'stroke-width', 'fill', 'fill-opacity'];
    function defaultDescribe(properties, nameProperty) {
      var html = '';
      for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
          if (key === nameProperty || simpleStyleIdentifiers.indexOf(key) !== -1) {
            continue;
          }
          var value = properties[key];
          if (defined(value)) {
            if (typeof value === 'object') {
              html += '<tr><th>' + key + '</th><td>' + defaultDescribe(value) + '</td></tr>';
            } else {
              html += '<tr><th>' + key + '</th><td>' + value + '</td></tr>';
            }
          }
        }
      }
      if (html.length > 0) {
        html = '<table class="cesium-infoBox-defaultTable"><tbody>' + html + '</tbody></table>';
      }
      return html;
    }
    function createDescriptionCallback(describe, properties, nameProperty) {
      var description;
      return function(time, result) {
        if (!defined(description)) {
          description = describe(properties, nameProperty);
        }
        return description;
      };
    }
    function defaultDescribeProperty(properties, nameProperty) {
      return new CallbackProperty(createDescriptionCallback(defaultDescribe, properties, nameProperty), true);
    }
    function createObject(geoJson, entityCollection, describe) {
      var id = geoJson.id;
      if (!defined(id) || geoJson.type !== 'Feature') {
        id = createGuid();
      } else {
        var i = 2;
        var finalId = id;
        while (defined(entityCollection.getById(finalId))) {
          finalId = id + "_" + i;
          i++;
        }
        id = finalId;
      }
      var entity = entityCollection.getOrCreateEntity(id);
      var properties = geoJson.properties;
      if (defined(properties)) {
        entity.addProperty('properties');
        entity.properties = properties;
        var nameProperty;
        var name = properties.title;
        if (defined(name)) {
          entity.name = name;
          nameProperty = 'title';
        } else {
          var namePropertyPrecedence = Number.MAX_VALUE;
          for (var key in properties) {
            if (properties.hasOwnProperty(key) && properties[key]) {
              var lowerKey = key.toLowerCase();
              if (namePropertyPrecedence > 1 && lowerKey === 'title') {
                namePropertyPrecedence = 1;
                nameProperty = key;
                break;
              } else if (namePropertyPrecedence > 2 && lowerKey === 'name') {
                namePropertyPrecedence = 2;
                nameProperty = key;
              } else if (namePropertyPrecedence > 3 && /title/i.test(key)) {
                namePropertyPrecedence = 3;
                nameProperty = key;
              } else if (namePropertyPrecedence > 4 && /name/i.test(key)) {
                namePropertyPrecedence = 4;
                nameProperty = key;
              }
            }
          }
          if (defined(nameProperty)) {
            entity.name = properties[nameProperty];
          }
        }
        var description = properties.description;
        if (description !== null) {
          entity.description = !defined(description) ? describe(properties, nameProperty) : new ConstantProperty(description);
        }
      }
      return entity;
    }
    function coordinatesArrayToCartesianArray(coordinates, crsFunction) {
      var positions = new Array(coordinates.length);
      for (var i = 0; i < coordinates.length; i++) {
        positions[i] = crsFunction(coordinates[i]);
      }
      return positions;
    }
    function processFeature(dataSource, feature, notUsed, crsFunction, options) {
      if (feature.geometry === null) {
        createObject(feature, dataSource._entityCollection, options.describe);
        return;
      }
      if (!defined(feature.geometry)) {
        throw new RuntimeError('feature.geometry is required.');
      }
      var geometryType = feature.geometry.type;
      var geometryHandler = geometryTypes[geometryType];
      if (!defined(geometryHandler)) {
        throw new RuntimeError('Unknown geometry type: ' + geometryType);
      }
      geometryHandler(dataSource, feature, feature.geometry, crsFunction, options);
    }
    function processFeatureCollection(dataSource, featureCollection, notUsed, crsFunction, options) {
      var features = featureCollection.features;
      for (var i = 0,
          len = features.length; i < len; i++) {
        processFeature(dataSource, features[i], undefined, crsFunction, options);
      }
    }
    function processGeometryCollection(dataSource, geoJson, geometryCollection, crsFunction, options) {
      var geometries = geometryCollection.geometries;
      for (var i = 0,
          len = geometries.length; i < len; i++) {
        var geometry = geometries[i];
        var geometryType = geometry.type;
        var geometryHandler = geometryTypes[geometryType];
        if (!defined(geometryHandler)) {
          throw new RuntimeError('Unknown geometry type: ' + geometryType);
        }
        geometryHandler(dataSource, geoJson, geometry, crsFunction, options);
      }
    }
    function createPoint(dataSource, geoJson, crsFunction, coordinates, options) {
      var symbol = options.markerSymbol;
      var color = options.markerColor;
      var size = options.markerSize;
      var properties = geoJson.properties;
      if (defined(properties)) {
        var cssColor = properties['marker-color'];
        if (defined(cssColor)) {
          color = Color.fromCssColorString(cssColor);
        }
        size = defaultValue(sizes[properties['marker-size']], size);
        var markerSymbol = properties['marker-symbol'];
        if (defined(markerSymbol)) {
          symbol = markerSymbol;
        }
      }
      var canvasOrPromise;
      if (defined(symbol)) {
        if (symbol.length === 1) {
          canvasOrPromise = dataSource._pinBuilder.fromText(symbol.toUpperCase(), color, size);
        } else {
          canvasOrPromise = dataSource._pinBuilder.fromMakiIconId(symbol, color, size);
        }
      } else {
        canvasOrPromise = dataSource._pinBuilder.fromColor(color, size);
      }
      dataSource._promises.push(when(canvasOrPromise, function(dataUrl) {
        var billboard = new BillboardGraphics();
        billboard.verticalOrigin = new ConstantProperty(VerticalOrigin.BOTTOM);
        billboard.image = new ConstantProperty(dataUrl);
        var entity = createObject(geoJson, dataSource._entityCollection, options.describe);
        entity.billboard = billboard;
        entity.position = new ConstantPositionProperty(crsFunction(coordinates));
      }));
    }
    function processPoint(dataSource, geoJson, geometry, crsFunction, options) {
      createPoint(dataSource, geoJson, crsFunction, geometry.coordinates, options);
    }
    function processMultiPoint(dataSource, geoJson, geometry, crsFunction, options) {
      var coordinates = geometry.coordinates;
      for (var i = 0; i < coordinates.length; i++) {
        createPoint(dataSource, geoJson, crsFunction, coordinates[i], options);
      }
    }
    function createLineString(dataSource, geoJson, crsFunction, coordinates, options) {
      var material = options.strokeMaterialProperty;
      var widthProperty = options.strokeWidthProperty;
      var properties = geoJson.properties;
      if (defined(properties)) {
        var width = properties['stroke-width'];
        if (defined(width)) {
          widthProperty = new ConstantProperty(width);
        }
        var color;
        var stroke = properties.stroke;
        if (defined(stroke)) {
          color = Color.fromCssColorString(stroke);
        }
        var opacity = properties['stroke-opacity'];
        if (defined(opacity) && opacity !== 1.0) {
          if (!defined(color)) {
            color = material.color.clone();
          }
          color.alpha = opacity;
        }
        if (defined(color)) {
          material = new ColorMaterialProperty(color);
        }
      }
      var polyline = new PolylineGraphics();
      polyline.material = material;
      polyline.width = widthProperty;
      polyline.positions = new ConstantProperty(coordinatesArrayToCartesianArray(coordinates, crsFunction));
      var entity = createObject(geoJson, dataSource._entityCollection, options.describe);
      entity.polyline = polyline;
    }
    function processLineString(dataSource, geoJson, geometry, crsFunction, options) {
      createLineString(dataSource, geoJson, crsFunction, geometry.coordinates, options);
    }
    function processMultiLineString(dataSource, geoJson, geometry, crsFunction, options) {
      var lineStrings = geometry.coordinates;
      for (var i = 0; i < lineStrings.length; i++) {
        createLineString(dataSource, geoJson, crsFunction, lineStrings[i], options);
      }
    }
    function createPolygon(dataSource, geoJson, crsFunction, coordinates, options) {
      if (coordinates.length === 0 || coordinates[0].length === 0) {
        return;
      }
      var outlineColorProperty = options.strokeMaterialProperty.color;
      var material = options.fillMaterialProperty;
      var widthProperty = options.strokeWidthProperty;
      var properties = geoJson.properties;
      if (defined(properties)) {
        var width = properties['stroke-width'];
        if (defined(width)) {
          widthProperty = new ConstantProperty(width);
        }
        var color;
        var stroke = properties.stroke;
        if (defined(stroke)) {
          color = Color.fromCssColorString(stroke);
        }
        var opacity = properties['stroke-opacity'];
        if (defined(opacity) && opacity !== 1.0) {
          if (!defined(color)) {
            color = options.strokeMaterialProperty.color.clone();
          }
          color.alpha = opacity;
        }
        if (defined(color)) {
          outlineColorProperty = new ConstantProperty(color);
        }
        var fillColor;
        var fill = properties.fill;
        if (defined(fill)) {
          fillColor = Color.fromCssColorString(fill);
          fillColor.alpha = material.color.alpha;
        }
        opacity = properties['fill-opacity'];
        if (defined(opacity) && opacity !== material.color.alpha) {
          if (!defined(fillColor)) {
            fillColor = material.color.clone();
          }
          fillColor.alpha = opacity;
        }
        if (defined(fillColor)) {
          material = new ColorMaterialProperty(fillColor);
        }
      }
      var polygon = new PolygonGraphics();
      polygon.outline = new ConstantProperty(true);
      polygon.outlineColor = outlineColorProperty;
      polygon.outlineWidth = widthProperty;
      polygon.material = material;
      var holes = [];
      for (var i = 1,
          len = coordinates.length; i < len; i++) {
        holes.push(new PolygonHierarchy(coordinatesArrayToCartesianArray(coordinates[i], crsFunction)));
      }
      var positions = coordinates[0];
      polygon.hierarchy = new ConstantProperty(new PolygonHierarchy(coordinatesArrayToCartesianArray(positions, crsFunction), holes));
      if (positions[0].length > 2) {
        polygon.perPositionHeight = new ConstantProperty(true);
      }
      var entity = createObject(geoJson, dataSource._entityCollection, options.describe);
      entity.polygon = polygon;
    }
    function processPolygon(dataSource, geoJson, geometry, crsFunction, options) {
      createPolygon(dataSource, geoJson, crsFunction, geometry.coordinates, options);
    }
    function processMultiPolygon(dataSource, geoJson, geometry, crsFunction, options) {
      var polygons = geometry.coordinates;
      for (var i = 0; i < polygons.length; i++) {
        createPolygon(dataSource, geoJson, crsFunction, polygons[i], options);
      }
    }
    function processTopology(dataSource, geoJson, geometry, crsFunction, options) {
      for (var property in geometry.objects) {
        if (geometry.objects.hasOwnProperty(property)) {
          var feature = topojson.feature(geometry, geometry.objects[property]);
          var typeHandler = geoJsonObjectTypes[feature.type];
          typeHandler(dataSource, feature, feature, crsFunction, options);
        }
      }
    }
    var geoJsonObjectTypes = {
      Feature: processFeature,
      FeatureCollection: processFeatureCollection,
      GeometryCollection: processGeometryCollection,
      LineString: processLineString,
      MultiLineString: processMultiLineString,
      MultiPoint: processMultiPoint,
      MultiPolygon: processMultiPolygon,
      Point: processPoint,
      Polygon: processPolygon,
      Topology: processTopology
    };
    var geometryTypes = {
      GeometryCollection: processGeometryCollection,
      LineString: processLineString,
      MultiLineString: processMultiLineString,
      MultiPoint: processMultiPoint,
      MultiPolygon: processMultiPolygon,
      Point: processPoint,
      Polygon: processPolygon,
      Topology: processTopology
    };
    function GeoJsonDataSource(name) {
      this._name = name;
      this._changed = new Event();
      this._error = new Event();
      this._isLoading = false;
      this._loading = new Event();
      this._entityCollection = new EntityCollection(this);
      this._promises = [];
      this._pinBuilder = new PinBuilder();
    }
    GeoJsonDataSource.load = function(data, options) {
      return new GeoJsonDataSource().load(data, options);
    };
    defineProperties(GeoJsonDataSource, {
      markerSize: {
        get: function() {
          return defaultMarkerSize;
        },
        set: function(value) {
          defaultMarkerSize = value;
        }
      },
      markerSymbol: {
        get: function() {
          return defaultMarkerSymbol;
        },
        set: function(value) {
          defaultMarkerSymbol = value;
        }
      },
      markerColor: {
        get: function() {
          return defaultMarkerColor;
        },
        set: function(value) {
          defaultMarkerColor = value;
        }
      },
      stroke: {
        get: function() {
          return defaultStroke;
        },
        set: function(value) {
          defaultStroke = value;
          defaultStrokeMaterialProperty.color.setValue(value);
        }
      },
      strokeWidth: {
        get: function() {
          return defaultStrokeWidth;
        },
        set: function(value) {
          defaultStrokeWidth = value;
          defaultStrokeWidthProperty.setValue(value);
        }
      },
      fill: {
        get: function() {
          return defaultFill;
        },
        set: function(value) {
          defaultFill = value;
          defaultFillMaterialProperty = new ColorMaterialProperty(defaultFill);
        }
      },
      crsNames: {get: function() {
          return crsNames;
        }},
      crsLinkHrefs: {get: function() {
          return crsLinkHrefs;
        }},
      crsLinkTypes: {get: function() {
          return crsLinkTypes;
        }}
    });
    defineProperties(GeoJsonDataSource.prototype, {
      name: {get: function() {
          return this._name;
        }},
      clock: {
        value: undefined,
        writable: false
      },
      entities: {get: function() {
          return this._entityCollection;
        }},
      isLoading: {get: function() {
          return this._isLoading;
        }},
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
    GeoJsonDataSource.prototype.load = function(data, options) {
      if (!defined(data)) {
        throw new DeveloperError('data is required.');
      }
      DataSource.setLoading(this, true);
      var promise = data;
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      var sourceUri = options.sourceUri;
      if (typeof data === 'string') {
        if (!defined(sourceUri)) {
          sourceUri = data;
        }
        promise = loadJson(data);
      }
      options = {
        describe: defaultValue(options.describe, defaultDescribeProperty),
        markerSize: defaultValue(options.markerSize, defaultMarkerSize),
        markerSymbol: defaultValue(options.markerSymbol, defaultMarkerSymbol),
        markerColor: defaultValue(options.markerColor, defaultMarkerColor),
        strokeWidthProperty: new ConstantProperty(defaultValue(options.strokeWidth, defaultStrokeWidth)),
        strokeMaterialProperty: new ColorMaterialProperty(defaultValue(options.stroke, defaultStroke)),
        fillMaterialProperty: new ColorMaterialProperty(defaultValue(options.fill, defaultFill))
      };
      var that = this;
      return when(promise, function(geoJson) {
        return load(that, geoJson, options, sourceUri);
      }).otherwise(function(error) {
        DataSource.setLoading(that, false);
        that._error.raiseEvent(that, error);
        console.log(error);
        return when.reject(error);
      });
    };
    function load(that, geoJson, options, sourceUri) {
      var name;
      if (defined(sourceUri)) {
        name = getFilenameFromUri(sourceUri);
      }
      if (defined(name) && that._name !== name) {
        that._name = name;
        that._changed.raiseEvent(that);
      }
      var typeHandler = geoJsonObjectTypes[geoJson.type];
      if (!defined(typeHandler)) {
        throw new RuntimeError('Unsupported GeoJSON object type: ' + geoJson.type);
      }
      var crsFunction = defaultCrsFunction;
      var crs = geoJson.crs;
      if (crs === null) {
        throw new RuntimeError('crs is null.');
      }
      if (defined(crs)) {
        if (!defined(crs.properties)) {
          throw new RuntimeError('crs.properties is undefined.');
        }
        var properties = crs.properties;
        if (crs.type === 'name') {
          crsFunction = crsNames[properties.name];
          if (!defined(crsFunction)) {
            throw new RuntimeError('Unknown crs name: ' + properties.name);
          }
        } else if (crs.type === 'link') {
          var handler = crsLinkHrefs[properties.href];
          if (!defined(handler)) {
            handler = crsLinkTypes[properties.type];
          }
          if (!defined(handler)) {
            throw new RuntimeError('Unable to resolve crs link: ' + JSON.stringify(properties));
          }
          crsFunction = handler(properties);
        } else if (crs.type === 'EPSG') {
          crsFunction = crsNames['EPSG:' + properties.code];
          if (!defined(crsFunction)) {
            throw new RuntimeError('Unknown crs EPSG code: ' + properties.code);
          }
        } else {
          throw new RuntimeError('Unknown crs type: ' + crs.type);
        }
      }
      return when(crsFunction, function(crsFunction) {
        that._entityCollection.removeAll();
        typeHandler(that, geoJson, geoJson, crsFunction, options);
        return when.all(that._promises, function() {
          that._promises.length = 0;
          DataSource.setLoading(that, false);
          return that;
        });
      });
    }
    return GeoJsonDataSource;
  });
})(require('process'));
