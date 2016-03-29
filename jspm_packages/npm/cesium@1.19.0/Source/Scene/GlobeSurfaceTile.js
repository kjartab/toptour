/* */ 
"format cjs";
(function(process) {
  define(['../Core/BoundingSphere', '../Core/Cartesian3', '../Core/Cartesian4', '../Core/Cartographic', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/IntersectionTests', '../Core/PixelFormat', '../Core/Rectangle', '../Renderer/PixelDatatype', '../Renderer/Sampler', '../Renderer/Texture', '../Renderer/TextureMagnificationFilter', '../Renderer/TextureMinificationFilter', '../Renderer/TextureWrap', './ImageryState', './QuadtreeTileLoadState', './SceneMode', './TerrainState', './TileBoundingBox', './TileTerrain'], function(BoundingSphere, Cartesian3, Cartesian4, Cartographic, defaultValue, defined, defineProperties, IntersectionTests, PixelFormat, Rectangle, PixelDatatype, Sampler, Texture, TextureMagnificationFilter, TextureMinificationFilter, TextureWrap, ImageryState, QuadtreeTileLoadState, SceneMode, TerrainState, TileBoundingBox, TileTerrain) {
    'use strict';
    function GlobeSurfaceTile() {
      this.imagery = [];
      this.waterMaskTexture = undefined;
      this.waterMaskTranslationAndScale = new Cartesian4(0.0, 0.0, 1.0, 1.0);
      this.terrainData = undefined;
      this.center = new Cartesian3();
      this.vertexArray = undefined;
      this.minimumHeight = 0.0;
      this.maximumHeight = 0.0;
      this.boundingSphere3D = new BoundingSphere();
      this.boundingSphere2D = new BoundingSphere();
      this.orientedBoundingBox = undefined;
      this.tileBoundingBox = undefined;
      this.occludeePointInScaledSpace = new Cartesian3();
      this.loadedTerrain = undefined;
      this.upsampledTerrain = undefined;
      this.pickBoundingSphere = new BoundingSphere();
      this.pickTerrain = undefined;
      this.surfaceShader = undefined;
    }
    defineProperties(GlobeSurfaceTile.prototype, {eligibleForUnloading: {get: function() {
          var loadedTerrain = this.loadedTerrain;
          var loadingIsTransitioning = defined(loadedTerrain) && (loadedTerrain.state === TerrainState.RECEIVING || loadedTerrain.state === TerrainState.TRANSFORMING);
          var upsampledTerrain = this.upsampledTerrain;
          var upsamplingIsTransitioning = defined(upsampledTerrain) && (upsampledTerrain.state === TerrainState.RECEIVING || upsampledTerrain.state === TerrainState.TRANSFORMING);
          var shouldRemoveTile = !loadingIsTransitioning && !upsamplingIsTransitioning;
          var imagery = this.imagery;
          for (var i = 0,
              len = imagery.length; shouldRemoveTile && i < len; ++i) {
            var tileImagery = imagery[i];
            shouldRemoveTile = !defined(tileImagery.loadingImagery) || tileImagery.loadingImagery.state !== ImageryState.TRANSITIONING;
          }
          return shouldRemoveTile;
        }}});
    function getPosition(encoding, mode, projection, vertices, index, result) {
      encoding.decodePosition(vertices, index, result);
      if (defined(mode) && mode !== SceneMode.SCENE3D) {
        var ellipsoid = projection.ellipsoid;
        var positionCart = ellipsoid.cartesianToCartographic(result);
        projection.project(positionCart, result);
        Cartesian3.fromElements(result.z, result.x, result.y, result);
      }
      return result;
    }
    var scratchV0 = new Cartesian3();
    var scratchV1 = new Cartesian3();
    var scratchV2 = new Cartesian3();
    var scratchResult = new Cartesian3();
    GlobeSurfaceTile.prototype.pick = function(ray, mode, projection, cullBackFaces, result) {
      var terrain = this.pickTerrain;
      if (!defined(terrain)) {
        return undefined;
      }
      var mesh = terrain.mesh;
      if (!defined(mesh)) {
        return undefined;
      }
      var vertices = mesh.vertices;
      var indices = mesh.indices;
      var encoding = mesh.encoding;
      var length = indices.length;
      for (var i = 0; i < length; i += 3) {
        var i0 = indices[i];
        var i1 = indices[i + 1];
        var i2 = indices[i + 2];
        var v0 = getPosition(encoding, mode, projection, vertices, i0, scratchV0);
        var v1 = getPosition(encoding, mode, projection, vertices, i1, scratchV1);
        var v2 = getPosition(encoding, mode, projection, vertices, i2, scratchV2);
        var intersection = IntersectionTests.rayTriangle(ray, v0, v1, v2, cullBackFaces, scratchResult);
        if (defined(intersection)) {
          return Cartesian3.clone(intersection, result);
        }
      }
      return undefined;
    };
    GlobeSurfaceTile.prototype.freeResources = function() {
      if (defined(this.waterMaskTexture)) {
        --this.waterMaskTexture.referenceCount;
        if (this.waterMaskTexture.referenceCount === 0) {
          this.waterMaskTexture.destroy();
        }
        this.waterMaskTexture = undefined;
      }
      this.terrainData = undefined;
      if (defined(this.loadedTerrain)) {
        this.loadedTerrain.freeResources();
        this.loadedTerrain = undefined;
      }
      if (defined(this.upsampledTerrain)) {
        this.upsampledTerrain.freeResources();
        this.upsampledTerrain = undefined;
      }
      if (defined(this.pickTerrain)) {
        this.pickTerrain.freeResources();
        this.pickTerrain = undefined;
      }
      var i,
          len;
      var imageryList = this.imagery;
      for (i = 0, len = imageryList.length; i < len; ++i) {
        imageryList[i].freeResources();
      }
      this.imagery.length = 0;
      this.freeVertexArray();
    };
    GlobeSurfaceTile.prototype.freeVertexArray = function() {
      var indexBuffer;
      if (defined(this.vertexArray)) {
        indexBuffer = this.vertexArray.indexBuffer;
        this.vertexArray = this.vertexArray.destroy();
        if (!indexBuffer.isDestroyed() && defined(indexBuffer.referenceCount)) {
          --indexBuffer.referenceCount;
          if (indexBuffer.referenceCount === 0) {
            indexBuffer.destroy();
          }
        }
      }
      if (defined(this.wireframeVertexArray)) {
        indexBuffer = this.wireframeVertexArray.indexBuffer;
        this.wireframeVertexArray = this.wireframeVertexArray.destroy();
        if (!indexBuffer.isDestroyed() && defined(indexBuffer.referenceCount)) {
          --indexBuffer.referenceCount;
          if (indexBuffer.referenceCount === 0) {
            indexBuffer.destroy();
          }
        }
      }
    };
    GlobeSurfaceTile.processStateMachine = function(tile, frameState, terrainProvider, imageryLayerCollection) {
      var surfaceTile = tile.data;
      if (!defined(surfaceTile)) {
        surfaceTile = tile.data = new GlobeSurfaceTile();
      }
      if (tile.state === QuadtreeTileLoadState.START) {
        prepareNewTile(tile, terrainProvider, imageryLayerCollection);
        tile.state = QuadtreeTileLoadState.LOADING;
      }
      if (tile.state === QuadtreeTileLoadState.LOADING) {
        processTerrainStateMachine(tile, frameState, terrainProvider);
      }
      var isRenderable = defined(surfaceTile.vertexArray);
      var isDoneLoading = !defined(surfaceTile.loadedTerrain) && !defined(surfaceTile.upsampledTerrain);
      var isUpsampledOnly = defined(surfaceTile.terrainData) && surfaceTile.terrainData.wasCreatedByUpsampling();
      var tileImageryCollection = surfaceTile.imagery;
      for (var i = 0,
          len = tileImageryCollection.length; i < len; ++i) {
        var tileImagery = tileImageryCollection[i];
        if (!defined(tileImagery.loadingImagery)) {
          isUpsampledOnly = false;
          continue;
        }
        if (tileImagery.loadingImagery.state === ImageryState.PLACEHOLDER) {
          var imageryLayer = tileImagery.loadingImagery.imageryLayer;
          if (imageryLayer.imageryProvider.ready) {
            tileImagery.freeResources();
            tileImageryCollection.splice(i, 1);
            imageryLayer._createTileImagerySkeletons(tile, terrainProvider, i);
            --i;
            len = tileImageryCollection.length;
            continue;
          } else {
            isUpsampledOnly = false;
          }
        }
        var thisTileDoneLoading = tileImagery.processStateMachine(tile, frameState);
        isDoneLoading = isDoneLoading && thisTileDoneLoading;
        isRenderable = isRenderable && (thisTileDoneLoading || defined(tileImagery.readyImagery));
        isUpsampledOnly = isUpsampledOnly && defined(tileImagery.loadingImagery) && (tileImagery.loadingImagery.state === ImageryState.FAILED || tileImagery.loadingImagery.state === ImageryState.INVALID);
      }
      tile.upsampledFromParent = isUpsampledOnly;
      if (i === len) {
        if (isRenderable) {
          tile.renderable = true;
        }
        if (isDoneLoading) {
          tile.state = QuadtreeTileLoadState.DONE;
        }
      }
    };
    function prepareNewTile(tile, terrainProvider, imageryLayerCollection) {
      var surfaceTile = tile.data;
      var upsampleTileDetails = getUpsampleTileDetails(tile);
      if (defined(upsampleTileDetails)) {
        surfaceTile.upsampledTerrain = new TileTerrain(upsampleTileDetails);
      }
      if (isDataAvailable(tile, terrainProvider)) {
        surfaceTile.loadedTerrain = new TileTerrain();
      }
      for (var i = 0,
          len = imageryLayerCollection.length; i < len; ++i) {
        var layer = imageryLayerCollection.get(i);
        if (layer.show) {
          layer._createTileImagerySkeletons(tile, terrainProvider);
        }
      }
    }
    function processTerrainStateMachine(tile, frameState, terrainProvider) {
      var surfaceTile = tile.data;
      var loaded = surfaceTile.loadedTerrain;
      var upsampled = surfaceTile.upsampledTerrain;
      var suspendUpsampling = false;
      if (defined(loaded)) {
        loaded.processLoadStateMachine(frameState, terrainProvider, tile.x, tile.y, tile.level);
        if (loaded.state >= TerrainState.RECEIVED) {
          if (surfaceTile.terrainData !== loaded.data) {
            surfaceTile.terrainData = loaded.data;
            createWaterMaskTextureIfNeeded(frameState.context, surfaceTile);
            propagateNewLoadedDataToChildren(tile);
          }
          suspendUpsampling = true;
        }
        if (loaded.state === TerrainState.READY) {
          loaded.publishToTile(tile);
          surfaceTile.pickTerrain = defaultValue(surfaceTile.loadedTerrain, surfaceTile.upsampledTerrain);
          surfaceTile.loadedTerrain = undefined;
          surfaceTile.upsampledTerrain = undefined;
        } else if (loaded.state === TerrainState.FAILED) {
          surfaceTile.loadedTerrain = undefined;
        }
      }
      if (!suspendUpsampling && defined(upsampled)) {
        upsampled.processUpsampleStateMachine(frameState, terrainProvider, tile.x, tile.y, tile.level);
        if (upsampled.state >= TerrainState.RECEIVED) {
          if (surfaceTile.terrainData !== upsampled.data) {
            surfaceTile.terrainData = upsampled.data;
            if (terrainProvider.hasWaterMask) {
              upsampleWaterMask(tile);
            }
            propagateNewUpsampledDataToChildren(tile);
          }
        }
        if (upsampled.state === TerrainState.READY) {
          upsampled.publishToTile(tile);
          surfaceTile.pickTerrain = surfaceTile.upsampledTerrain;
          surfaceTile.upsampledTerrain = undefined;
        } else if (upsampled.state === TerrainState.FAILED) {
          surfaceTile.upsampledTerrain = undefined;
        }
      }
    }
    function getUpsampleTileDetails(tile) {
      var sourceTile = tile.parent;
      while (defined(sourceTile) && defined(sourceTile.data) && !defined(sourceTile.data.terrainData)) {
        sourceTile = sourceTile.parent;
      }
      if (!defined(sourceTile) || !defined(sourceTile.data)) {
        return undefined;
      }
      return {
        data: sourceTile.data.terrainData,
        x: sourceTile.x,
        y: sourceTile.y,
        level: sourceTile.level
      };
    }
    function propagateNewUpsampledDataToChildren(tile) {
      var surfaceTile = tile.data;
      if (defined(tile._children)) {
        for (var childIndex = 0; childIndex < 4; ++childIndex) {
          var childTile = tile._children[childIndex];
          if (childTile.state !== QuadtreeTileLoadState.START) {
            var childSurfaceTile = childTile.data;
            if (defined(childSurfaceTile.terrainData) && !childSurfaceTile.terrainData.wasCreatedByUpsampling()) {
              continue;
            }
            if (defined(childSurfaceTile.upsampledTerrain)) {
              childSurfaceTile.upsampledTerrain.freeResources();
            }
            childSurfaceTile.upsampledTerrain = new TileTerrain({
              data: surfaceTile.terrainData,
              x: tile.x,
              y: tile.y,
              level: tile.level
            });
            childTile.state = QuadtreeTileLoadState.LOADING;
          }
        }
      }
    }
    function propagateNewLoadedDataToChildren(tile) {
      var surfaceTile = tile.data;
      if (defined(tile.children)) {
        for (var childIndex = 0; childIndex < 4; ++childIndex) {
          var childTile = tile.children[childIndex];
          if (childTile.state !== QuadtreeTileLoadState.START) {
            var childSurfaceTile = childTile.data;
            if (defined(childSurfaceTile.terrainData) && !childSurfaceTile.terrainData.wasCreatedByUpsampling()) {
              continue;
            }
            if (defined(childSurfaceTile.upsampledTerrain)) {
              childSurfaceTile.upsampledTerrain.freeResources();
            }
            childSurfaceTile.upsampledTerrain = new TileTerrain({
              data: surfaceTile.terrainData,
              x: tile.x,
              y: tile.y,
              level: tile.level
            });
            if (surfaceTile.terrainData.isChildAvailable(tile.x, tile.y, childTile.x, childTile.y)) {
              if (!defined(childSurfaceTile.loadedTerrain)) {
                childSurfaceTile.loadedTerrain = new TileTerrain();
              }
            }
            childTile.state = QuadtreeTileLoadState.LOADING;
          }
        }
      }
    }
    function isDataAvailable(tile, terrainProvider) {
      var tileDataAvailable = terrainProvider.getTileDataAvailable(tile.x, tile.y, tile.level);
      if (defined(tileDataAvailable)) {
        return tileDataAvailable;
      }
      var parent = tile.parent;
      if (!defined(parent)) {
        return true;
      }
      if (!defined(parent.data) || !defined(parent.data.terrainData)) {
        return false;
      }
      return parent.data.terrainData.isChildAvailable(parent.x, parent.y, tile.x, tile.y);
    }
    function getContextWaterMaskData(context) {
      var data = context.cache.tile_waterMaskData;
      if (!defined(data)) {
        var allWaterTexture = new Texture({
          context: context,
          pixelFormat: PixelFormat.LUMINANCE,
          pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
          source: {
            arrayBufferView: new Uint8Array([255]),
            width: 1,
            height: 1
          }
        });
        allWaterTexture.referenceCount = 1;
        var sampler = new Sampler({
          wrapS: TextureWrap.CLAMP_TO_EDGE,
          wrapT: TextureWrap.CLAMP_TO_EDGE,
          minificationFilter: TextureMinificationFilter.LINEAR,
          magnificationFilter: TextureMagnificationFilter.LINEAR
        });
        data = {
          allWaterTexture: allWaterTexture,
          sampler: sampler,
          destroy: function() {
            this.allWaterTexture.destroy();
          }
        };
        context.cache.tile_waterMaskData = data;
      }
      return data;
    }
    function createWaterMaskTextureIfNeeded(context, surfaceTile) {
      var previousTexture = surfaceTile.waterMaskTexture;
      if (defined(previousTexture)) {
        --previousTexture.referenceCount;
        if (previousTexture.referenceCount === 0) {
          previousTexture.destroy();
        }
        surfaceTile.waterMaskTexture = undefined;
      }
      var waterMask = surfaceTile.terrainData.waterMask;
      if (!defined(waterMask)) {
        return;
      }
      var waterMaskData = getContextWaterMaskData(context);
      var texture;
      var waterMaskLength = waterMask.length;
      if (waterMaskLength === 1) {
        if (waterMask[0] !== 0) {
          texture = waterMaskData.allWaterTexture;
        } else {
          return;
        }
      } else {
        var textureSize = Math.sqrt(waterMaskLength);
        texture = new Texture({
          context: context,
          pixelFormat: PixelFormat.LUMINANCE,
          pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
          source: {
            width: textureSize,
            height: textureSize,
            arrayBufferView: waterMask
          },
          sampler: waterMaskData.sampler
        });
        texture.referenceCount = 0;
      }
      ++texture.referenceCount;
      surfaceTile.waterMaskTexture = texture;
      Cartesian4.fromElements(0.0, 0.0, 1.0, 1.0, surfaceTile.waterMaskTranslationAndScale);
    }
    function upsampleWaterMask(tile) {
      var surfaceTile = tile.data;
      var sourceTile = tile.parent;
      while (defined(sourceTile) && !defined(sourceTile.data.terrainData) || sourceTile.data.terrainData.wasCreatedByUpsampling()) {
        sourceTile = sourceTile.parent;
      }
      if (!defined(sourceTile) || !defined(sourceTile.data.waterMaskTexture)) {
        return;
      }
      surfaceTile.waterMaskTexture = sourceTile.data.waterMaskTexture;
      ++surfaceTile.waterMaskTexture.referenceCount;
      var sourceTileRectangle = sourceTile.rectangle;
      var tileRectangle = tile.rectangle;
      var tileWidth = tileRectangle.width;
      var tileHeight = tileRectangle.height;
      var scaleX = tileWidth / sourceTileRectangle.width;
      var scaleY = tileHeight / sourceTileRectangle.height;
      surfaceTile.waterMaskTranslationAndScale.x = scaleX * (tileRectangle.west - sourceTileRectangle.west) / tileWidth;
      surfaceTile.waterMaskTranslationAndScale.y = scaleY * (tileRectangle.south - sourceTileRectangle.south) / tileHeight;
      surfaceTile.waterMaskTranslationAndScale.z = scaleX;
      surfaceTile.waterMaskTranslationAndScale.w = scaleY;
    }
    return GlobeSurfaceTile;
  });
})(require('process'));