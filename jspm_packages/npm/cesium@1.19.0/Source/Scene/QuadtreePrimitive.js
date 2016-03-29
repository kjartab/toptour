/* */ 
"format cjs";
(function(process) {
  define(['../Core/Cartesian3', '../Core/Cartographic', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/DeveloperError', '../Core/Event', '../Core/getTimestamp', '../Core/Math', '../Core/Queue', '../Core/Ray', '../Core/Rectangle', '../Core/Visibility', './QuadtreeOccluders', './QuadtreeTile', './QuadtreeTileLoadState', './SceneMode', './TileReplacementQueue'], function(Cartesian3, Cartographic, defaultValue, defined, defineProperties, DeveloperError, Event, getTimestamp, CesiumMath, Queue, Ray, Rectangle, Visibility, QuadtreeOccluders, QuadtreeTile, QuadtreeTileLoadState, SceneMode, TileReplacementQueue) {
    'use strict';
    function QuadtreePrimitive(options) {
      if (!defined(options) || !defined(options.tileProvider)) {
        throw new DeveloperError('options.tileProvider is required.');
      }
      if (defined(options.tileProvider.quadtree)) {
        throw new DeveloperError('A QuadtreeTileProvider can only be used with a single QuadtreePrimitive');
      }
      this._tileProvider = options.tileProvider;
      this._tileProvider.quadtree = this;
      this._debug = {
        enableDebugOutput: false,
        maxDepth: 0,
        tilesVisited: 0,
        tilesCulled: 0,
        tilesRendered: 0,
        tilesWaitingForChildren: 0,
        lastMaxDepth: -1,
        lastTilesVisited: -1,
        lastTilesCulled: -1,
        lastTilesRendered: -1,
        lastTilesWaitingForChildren: -1,
        suspendLodUpdate: false
      };
      var tilingScheme = this._tileProvider.tilingScheme;
      var ellipsoid = tilingScheme.ellipsoid;
      this._tilesToRender = [];
      this._tileTraversalQueue = new Queue();
      this._tileLoadQueue = [];
      this._tileReplacementQueue = new TileReplacementQueue();
      this._levelZeroTiles = undefined;
      this._levelZeroTilesReady = false;
      this._loadQueueTimeSlice = 5.0;
      this._addHeightCallbacks = [];
      this._removeHeightCallbacks = [];
      this._tileToUpdateHeights = [];
      this._lastTileIndex = 0;
      this._updateHeightsTimeSlice = 2.0;
      this.maximumScreenSpaceError = defaultValue(options.maximumScreenSpaceError, 2);
      this.tileCacheSize = defaultValue(options.tileCacheSize, 100);
      this._occluders = new QuadtreeOccluders({ellipsoid: ellipsoid});
      this._tileLoadProgressEvent = new Event();
      this._lastTileLoadQueueLength = 0;
    }
    defineProperties(QuadtreePrimitive.prototype, {
      tileProvider: {get: function() {
          return this._tileProvider;
        }},
      tileLoadProgressEvent: {get: function() {
          return this._tileLoadProgressEvent;
        }}
    });
    QuadtreePrimitive.prototype.invalidateAllTiles = function() {
      var replacementQueue = this._tileReplacementQueue;
      replacementQueue.head = undefined;
      replacementQueue.tail = undefined;
      replacementQueue.count = 0;
      var levelZeroTiles = this._levelZeroTiles;
      if (defined(levelZeroTiles)) {
        for (var i = 0; i < levelZeroTiles.length; ++i) {
          var tile = levelZeroTiles[i];
          var customData = tile.customData;
          var customDataLength = customData.length;
          for (var j = 0; j < customDataLength; ++j) {
            var data = customData[j];
            data.level = 0;
            this._addHeightCallbacks.push(data);
          }
          levelZeroTiles[i].freeResources();
        }
      }
      this._levelZeroTiles = undefined;
    };
    QuadtreePrimitive.prototype.forEachLoadedTile = function(tileFunction) {
      var tile = this._tileReplacementQueue.head;
      while (defined(tile)) {
        if (tile.state !== QuadtreeTileLoadState.START) {
          tileFunction(tile);
        }
        tile = tile.replacementNext;
      }
    };
    QuadtreePrimitive.prototype.forEachRenderedTile = function(tileFunction) {
      var tilesRendered = this._tilesToRender;
      for (var i = 0,
          len = tilesRendered.length; i < len; ++i) {
        tileFunction(tilesRendered[i]);
      }
    };
    QuadtreePrimitive.prototype.updateHeight = function(cartographic, callback) {
      var primitive = this;
      var object = {
        position: undefined,
        positionCartographic: cartographic,
        level: -1,
        callback: callback
      };
      object.removeFunc = function() {
        var addedCallbacks = primitive._addHeightCallbacks;
        var length = addedCallbacks.length;
        for (var i = 0; i < length; ++i) {
          if (addedCallbacks[i] === object) {
            addedCallbacks.splice(i, 1);
            break;
          }
        }
        primitive._removeHeightCallbacks.push(object);
      };
      primitive._addHeightCallbacks.push(object);
      return object.removeFunc;
    };
    QuadtreePrimitive.prototype.beginFrame = function(frameState) {
      var passes = frameState.passes;
      if (!passes.render) {
        return;
      }
      this._tileProvider.initialize(frameState);
      var debug = this._debug;
      if (debug.suspendLodUpdate) {
        return;
      }
      debug.maxDepth = 0;
      debug.tilesVisited = 0;
      debug.tilesCulled = 0;
      debug.tilesRendered = 0;
      debug.tilesWaitingForChildren = 0;
      processTileLoadQueue(this, frameState);
      this._tileLoadQueue.length = 0;
      this._tileReplacementQueue.markStartOfRenderFrame();
    };
    QuadtreePrimitive.prototype.update = function(frameState) {
      var passes = frameState.passes;
      if (passes.render) {
        this._tileProvider.beginUpdate(frameState);
        selectTilesForRendering(this, frameState);
        createRenderCommandsForSelectedTiles(this, frameState);
        this._tileProvider.endUpdate(frameState);
      }
      if (passes.pick && this._tilesToRender.length > 0) {
        this._tileProvider.updateForPick(frameState);
      }
    };
    QuadtreePrimitive.prototype.endFrame = function(frameState) {
      var passes = frameState.passes;
      if (!passes.render) {
        return;
      }
      updateHeights(this, frameState);
      var debug = this._debug;
      if (debug.suspendLodUpdate) {
        return;
      }
      if (debug.enableDebugOutput) {
        if (debug.tilesVisited !== debug.lastTilesVisited || debug.tilesRendered !== debug.lastTilesRendered || debug.tilesCulled !== debug.lastTilesCulled || debug.maxDepth !== debug.lastMaxDepth || debug.tilesWaitingForChildren !== debug.lastTilesWaitingForChildren) {
          console.log('Visited ' + debug.tilesVisited + ', Rendered: ' + debug.tilesRendered + ', Culled: ' + debug.tilesCulled + ', Max Depth: ' + debug.maxDepth + ', Waiting for children: ' + debug.tilesWaitingForChildren);
          debug.lastTilesVisited = debug.tilesVisited;
          debug.lastTilesRendered = debug.tilesRendered;
          debug.lastTilesCulled = debug.tilesCulled;
          debug.lastMaxDepth = debug.maxDepth;
          debug.lastTilesWaitingForChildren = debug.tilesWaitingForChildren;
        }
      }
    };
    QuadtreePrimitive.prototype.isDestroyed = function() {
      return false;
    };
    QuadtreePrimitive.prototype.destroy = function() {
      this._tileProvider = this._tileProvider && this._tileProvider.destroy();
    };
    function selectTilesForRendering(primitive, frameState) {
      var debug = primitive._debug;
      if (debug.suspendLodUpdate) {
        return;
      }
      var i;
      var len;
      var tilesToRender = primitive._tilesToRender;
      tilesToRender.length = 0;
      var traversalQueue = primitive._tileTraversalQueue;
      traversalQueue.clear();
      if (!defined(primitive._levelZeroTiles)) {
        if (primitive._tileProvider.ready) {
          var tilingScheme = primitive._tileProvider.tilingScheme;
          primitive._levelZeroTiles = QuadtreeTile.createLevelZeroTiles(tilingScheme);
        } else {
          return;
        }
      }
      primitive._occluders.ellipsoid.cameraPosition = frameState.camera.positionWC;
      var tileProvider = primitive._tileProvider;
      var occluders = primitive._occluders;
      var tile;
      var levelZeroTiles = primitive._levelZeroTiles;
      var customDataAdded = primitive._addHeightCallbacks;
      var customDataRemoved = primitive._removeHeightCallbacks;
      var frameNumber = frameState.frameNumber;
      if (customDataAdded.length > 0 || customDataRemoved.length > 0) {
        for (i = 0, len = levelZeroTiles.length; i < len; ++i) {
          tile = levelZeroTiles[i];
          tile._updateCustomData(frameNumber, customDataAdded, customDataRemoved);
        }
        customDataAdded.length = 0;
        customDataRemoved.length = 0;
      }
      for (i = 0, len = levelZeroTiles.length; i < len; ++i) {
        tile = levelZeroTiles[i];
        primitive._tileReplacementQueue.markTileRendered(tile);
        if (tile.needsLoading) {
          queueTileLoad(primitive, tile);
        }
        if (tile.renderable && tileProvider.computeTileVisibility(tile, frameState, occluders) !== Visibility.NONE) {
          traversalQueue.enqueue(tile);
        } else {
          ++debug.tilesCulled;
          if (!tile.renderable) {
            ++debug.tilesWaitingForChildren;
          }
        }
      }
      while (defined((tile = traversalQueue.dequeue()))) {
        ++debug.tilesVisited;
        primitive._tileReplacementQueue.markTileRendered(tile);
        tile._updateCustomData(frameNumber);
        if (tile.level > debug.maxDepth) {
          debug.maxDepth = tile.level;
        }
        if (screenSpaceError(primitive, frameState, tile) < primitive.maximumScreenSpaceError) {
          addTileToRenderList(primitive, tile);
        } else if (queueChildrenLoadAndDetermineIfChildrenAreAllRenderable(primitive, tile)) {
          var children = tile.children;
          for (i = 0, len = children.length; i < len; ++i) {
            if (tileProvider.computeTileVisibility(children[i], frameState, occluders) !== Visibility.NONE) {
              traversalQueue.enqueue(children[i]);
            } else {
              ++debug.tilesCulled;
            }
          }
        } else {
          addTileToRenderList(primitive, tile);
        }
      }
      raiseTileLoadProgressEvent(primitive);
    }
    function raiseTileLoadProgressEvent(primitive) {
      var currentLoadQueueLength = primitive._tileLoadQueue.length;
      if (currentLoadQueueLength !== primitive._lastTileLoadQueueLength) {
        primitive._tileLoadProgressEvent.raiseEvent(currentLoadQueueLength);
        primitive._lastTileLoadQueueLength = currentLoadQueueLength;
      }
    }
    function screenSpaceError(primitive, frameState, tile) {
      if (frameState.mode === SceneMode.SCENE2D) {
        return screenSpaceError2D(primitive, frameState, tile);
      }
      var maxGeometricError = primitive._tileProvider.getLevelMaximumGeometricError(tile.level);
      var distance = tile._distance;
      var height = frameState.context.drawingBufferHeight;
      var sseDenominator = frameState.camera.frustum.sseDenominator;
      var error = (maxGeometricError * height) / (distance * sseDenominator);
      if (frameState.fog.enabled) {
        error = error - CesiumMath.fog(distance, frameState.fog.density) * frameState.fog.sse;
      }
      return error;
    }
    function screenSpaceError2D(primitive, frameState, tile) {
      var camera = frameState.camera;
      var frustum = camera.frustum;
      var context = frameState.context;
      var width = context.drawingBufferWidth;
      var height = context.drawingBufferHeight;
      var maxGeometricError = primitive._tileProvider.getLevelMaximumGeometricError(tile.level);
      var pixelSize = Math.max(frustum.top - frustum.bottom, frustum.right - frustum.left) / Math.max(width, height);
      return maxGeometricError / pixelSize;
    }
    function addTileToRenderList(primitive, tile) {
      primitive._tilesToRender.push(tile);
      ++primitive._debug.tilesRendered;
    }
    function queueChildrenLoadAndDetermineIfChildrenAreAllRenderable(primitive, tile) {
      var allRenderable = true;
      var allUpsampledOnly = true;
      var children = tile.children;
      for (var i = 0,
          len = children.length; i < len; ++i) {
        var child = children[i];
        primitive._tileReplacementQueue.markTileRendered(child);
        allUpsampledOnly = allUpsampledOnly && child.upsampledFromParent;
        allRenderable = allRenderable && child.renderable;
        if (child.needsLoading) {
          queueTileLoad(primitive, child);
        }
      }
      if (!allRenderable) {
        ++primitive._debug.tilesWaitingForChildren;
      }
      return allRenderable && !allUpsampledOnly;
    }
    function queueTileLoad(primitive, tile) {
      primitive._tileLoadQueue.push(tile);
    }
    function processTileLoadQueue(primitive, frameState) {
      var tileLoadQueue = primitive._tileLoadQueue;
      var tileProvider = primitive._tileProvider;
      if (tileLoadQueue.length === 0) {
        return;
      }
      primitive._tileReplacementQueue.trimTiles(primitive.tileCacheSize);
      var startTime = getTimestamp();
      var timeSlice = primitive._loadQueueTimeSlice;
      var endTime = startTime + timeSlice;
      for (var i = tileLoadQueue.length - 1; i >= 0; --i) {
        var tile = tileLoadQueue[i];
        primitive._tileReplacementQueue.markTileRendered(tile);
        tileProvider.loadTile(frameState, tile);
        if (getTimestamp() >= endTime) {
          break;
        }
      }
    }
    var scratchRay = new Ray();
    var scratchCartographic = new Cartographic();
    var scratchPosition = new Cartesian3();
    function updateHeights(primitive, frameState) {
      var tilesToUpdateHeights = primitive._tileToUpdateHeights;
      var terrainProvider = primitive._tileProvider.terrainProvider;
      var startTime = getTimestamp();
      var timeSlice = primitive._updateHeightsTimeSlice;
      var endTime = startTime + timeSlice;
      var mode = frameState.mode;
      var projection = frameState.mapProjection;
      var ellipsoid = projection.ellipsoid;
      while (tilesToUpdateHeights.length > 0) {
        var tile = tilesToUpdateHeights[tilesToUpdateHeights.length - 1];
        if (tile !== primitive._lastTileUpdated) {
          primitive._lastTileIndex = 0;
        }
        var customData = tile.customData;
        var customDataLength = customData.length;
        var timeSliceMax = false;
        for (var i = primitive._lastTileIndex; i < customDataLength; ++i) {
          var data = customData[i];
          if (tile.level > data.level) {
            if (!defined(data.position)) {
              data.position = ellipsoid.cartographicToCartesian(data.positionCartographic);
            }
            if (mode === SceneMode.SCENE3D) {
              Cartesian3.clone(Cartesian3.ZERO, scratchRay.origin);
              Cartesian3.normalize(data.position, scratchRay.direction);
            } else {
              Cartographic.clone(data.positionCartographic, scratchCartographic);
              scratchCartographic.height = -11500.0;
              projection.project(scratchCartographic, scratchPosition);
              Cartesian3.fromElements(scratchPosition.z, scratchPosition.x, scratchPosition.y, scratchPosition);
              Cartesian3.clone(scratchPosition, scratchRay.origin);
              Cartesian3.clone(Cartesian3.UNIT_X, scratchRay.direction);
            }
            var position = tile.data.pick(scratchRay, mode, projection, false, scratchPosition);
            if (defined(position)) {
              data.callback(position);
            }
            data.level = tile.level;
          } else if (tile.level === data.level) {
            var children = tile.children;
            var childrenLength = children.length;
            var child;
            for (var j = 0; j < childrenLength; ++j) {
              child = children[j];
              if (Rectangle.contains(child.rectangle, data.positionCartographic)) {
                break;
              }
            }
            var tileDataAvailable = terrainProvider.getTileDataAvailable(child.x, child.y, child.level);
            var parentTile = tile.parent;
            if ((defined(tileDataAvailable) && !tileDataAvailable) || (defined(parentTile) && defined(parentTile.data) && defined(parentTile.data.terrainData) && !parentTile.data.terrainData.isChildAvailable(parentTile.x, parentTile.y, child.x, child.y))) {
              data.removeFunc();
            }
          }
          if (getTimestamp() >= endTime) {
            timeSliceMax = true;
            break;
          }
        }
        if (timeSliceMax) {
          primitive._lastTileUpdated = tile;
          primitive._lastTileIndex = i;
          break;
        } else {
          tilesToUpdateHeights.pop();
        }
      }
    }
    function tileDistanceSortFunction(a, b) {
      return a._distance - b._distance;
    }
    function createRenderCommandsForSelectedTiles(primitive, frameState) {
      var tileProvider = primitive._tileProvider;
      var tilesToRender = primitive._tilesToRender;
      var tilesToUpdateHeights = primitive._tileToUpdateHeights;
      tilesToRender.sort(tileDistanceSortFunction);
      for (var i = 0,
          len = tilesToRender.length; i < len; ++i) {
        var tile = tilesToRender[i];
        tileProvider.showTileThisFrame(tile, frameState);
        if (tile._frameRendered !== frameState.frameNumber - 1) {
          tilesToUpdateHeights.push(tile);
        }
        tile._frameRendered = frameState.frameNumber;
      }
    }
    return QuadtreePrimitive;
  });
})(require('process'));
