/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/BoundingRectangle', '../Core/Cartesian2', '../Core/Cartesian4', '../Core/Color', '../Core/ComponentDatatype', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/FeatureDetection', '../Core/GeographicTilingScheme', '../Core/IndexDatatype', '../Core/Math', '../Core/PixelFormat', '../Core/PrimitiveType', '../Core/Rectangle', '../Core/TerrainProvider', '../Core/TileProviderError', '../Renderer/Buffer', '../Renderer/BufferUsage', '../Renderer/ClearCommand', '../Renderer/ComputeCommand', '../Renderer/ContextLimits', '../Renderer/DrawCommand', '../Renderer/Framebuffer', '../Renderer/MipmapHint', '../Renderer/RenderState', '../Renderer/Sampler', '../Renderer/ShaderProgram', '../Renderer/ShaderSource', '../Renderer/Texture', '../Renderer/TextureMagnificationFilter', '../Renderer/TextureMinificationFilter', '../Renderer/TextureWrap', '../Renderer/VertexArray', '../Shaders/ReprojectWebMercatorFS', '../Shaders/ReprojectWebMercatorVS', '../ThirdParty/when', './Imagery', './ImageryState', './TileImagery'], function(BoundingRectangle, Cartesian2, Cartesian4, Color, ComponentDatatype, defaultValue, defined, defineProperties, destroyObject, FeatureDetection, GeographicTilingScheme, IndexDatatype, CesiumMath, PixelFormat, PrimitiveType, Rectangle, TerrainProvider, TileProviderError, Buffer, BufferUsage, ClearCommand, ComputeCommand, ContextLimits, DrawCommand, Framebuffer, MipmapHint, RenderState, Sampler, ShaderProgram, ShaderSource, Texture, TextureMagnificationFilter, TextureMinificationFilter, TextureWrap, VertexArray, ReprojectWebMercatorFS, ReprojectWebMercatorVS, when, Imagery, ImageryState, TileImagery) {
    'use strict';
    function ImageryLayer(imageryProvider, options) {
      this._imageryProvider = imageryProvider;
      options = defaultValue(options, {});
      this.alpha = defaultValue(options.alpha, defaultValue(imageryProvider.defaultAlpha, 1.0));
      this.brightness = defaultValue(options.brightness, defaultValue(imageryProvider.defaultBrightness, ImageryLayer.DEFAULT_BRIGHTNESS));
      this.contrast = defaultValue(options.contrast, defaultValue(imageryProvider.defaultContrast, ImageryLayer.DEFAULT_CONTRAST));
      this.hue = defaultValue(options.hue, defaultValue(imageryProvider.defaultHue, ImageryLayer.DEFAULT_HUE));
      this.saturation = defaultValue(options.saturation, defaultValue(imageryProvider.defaultSaturation, ImageryLayer.DEFAULT_SATURATION));
      this.gamma = defaultValue(options.gamma, defaultValue(imageryProvider.defaultGamma, ImageryLayer.DEFAULT_GAMMA));
      this.show = defaultValue(options.show, true);
      this._minimumTerrainLevel = options.minimumTerrainLevel;
      this._maximumTerrainLevel = options.maximumTerrainLevel;
      this._rectangle = defaultValue(options.rectangle, Rectangle.MAX_VALUE);
      this._maximumAnisotropy = options.maximumAnisotropy;
      this._imageryCache = {};
      this._skeletonPlaceholder = new TileImagery(Imagery.createPlaceholder(this));
      this._show = true;
      this._layerIndex = -1;
      this._isBaseLayer = false;
      this._requestImageError = undefined;
    }
    defineProperties(ImageryLayer.prototype, {
      imageryProvider: {get: function() {
          return this._imageryProvider;
        }},
      rectangle: {get: function() {
          return this._rectangle;
        }}
    });
    ImageryLayer.DEFAULT_BRIGHTNESS = 1.0;
    ImageryLayer.DEFAULT_CONTRAST = 1.0;
    ImageryLayer.DEFAULT_HUE = 0.0;
    ImageryLayer.DEFAULT_SATURATION = 1.0;
    ImageryLayer.DEFAULT_GAMMA = 1.0;
    ImageryLayer.prototype.isBaseLayer = function() {
      return this._isBaseLayer;
    };
    ImageryLayer.prototype.isDestroyed = function() {
      return false;
    };
    ImageryLayer.prototype.destroy = function() {
      return destroyObject(this);
    };
    var imageryBoundsScratch = new Rectangle();
    var tileImageryBoundsScratch = new Rectangle();
    var clippedRectangleScratch = new Rectangle();
    ImageryLayer.prototype.getViewableRectangle = function() {
      var imageryProvider = this._imageryProvider;
      var rectangle = this._rectangle;
      return imageryProvider.readyPromise.then(function() {
        return Rectangle.intersection(imageryProvider.rectangle, rectangle);
      });
    };
    ImageryLayer.prototype._createTileImagerySkeletons = function(tile, terrainProvider, insertionPoint) {
      var surfaceTile = tile.data;
      if (defined(this._minimumTerrainLevel) && tile.level < this._minimumTerrainLevel) {
        return false;
      }
      if (defined(this._maximumTerrainLevel) && tile.level > this._maximumTerrainLevel) {
        return false;
      }
      var imageryProvider = this._imageryProvider;
      if (!defined(insertionPoint)) {
        insertionPoint = surfaceTile.imagery.length;
      }
      if (!imageryProvider.ready) {
        this._skeletonPlaceholder.loadingImagery.addReference();
        surfaceTile.imagery.splice(insertionPoint, 0, this._skeletonPlaceholder);
        return true;
      }
      var imageryBounds = Rectangle.intersection(imageryProvider.rectangle, this._rectangle, imageryBoundsScratch);
      var rectangle = Rectangle.intersection(tile.rectangle, imageryBounds, tileImageryBoundsScratch);
      if (!defined(rectangle)) {
        if (!this.isBaseLayer()) {
          return false;
        }
        var baseImageryRectangle = imageryBounds;
        var baseTerrainRectangle = tile.rectangle;
        rectangle = tileImageryBoundsScratch;
        if (baseTerrainRectangle.south >= baseImageryRectangle.north) {
          rectangle.north = rectangle.south = baseImageryRectangle.north;
        } else if (baseTerrainRectangle.north <= baseImageryRectangle.south) {
          rectangle.north = rectangle.south = baseImageryRectangle.south;
        } else {
          rectangle.south = Math.max(baseTerrainRectangle.south, baseImageryRectangle.south);
          rectangle.north = Math.min(baseTerrainRectangle.north, baseImageryRectangle.north);
        }
        if (baseTerrainRectangle.west >= baseImageryRectangle.east) {
          rectangle.west = rectangle.east = baseImageryRectangle.east;
        } else if (baseTerrainRectangle.east <= baseImageryRectangle.west) {
          rectangle.west = rectangle.east = baseImageryRectangle.west;
        } else {
          rectangle.west = Math.max(baseTerrainRectangle.west, baseImageryRectangle.west);
          rectangle.east = Math.min(baseTerrainRectangle.east, baseImageryRectangle.east);
        }
      }
      var latitudeClosestToEquator = 0.0;
      if (rectangle.south > 0.0) {
        latitudeClosestToEquator = rectangle.south;
      } else if (rectangle.north < 0.0) {
        latitudeClosestToEquator = rectangle.north;
      }
      var errorRatio = 1.0;
      var targetGeometricError = errorRatio * terrainProvider.getLevelMaximumGeometricError(tile.level);
      var imageryLevel = getLevelWithMaximumTexelSpacing(this, targetGeometricError, latitudeClosestToEquator);
      imageryLevel = Math.max(0, imageryLevel);
      var maximumLevel = imageryProvider.maximumLevel;
      if (imageryLevel > maximumLevel) {
        imageryLevel = maximumLevel;
      }
      if (defined(imageryProvider.minimumLevel)) {
        var minimumLevel = imageryProvider.minimumLevel;
        if (imageryLevel < minimumLevel) {
          imageryLevel = minimumLevel;
        }
      }
      var imageryTilingScheme = imageryProvider.tilingScheme;
      var northwestTileCoordinates = imageryTilingScheme.positionToTileXY(Rectangle.northwest(rectangle), imageryLevel);
      var southeastTileCoordinates = imageryTilingScheme.positionToTileXY(Rectangle.southeast(rectangle), imageryLevel);
      var veryCloseX = tile.rectangle.height / 512.0;
      var veryCloseY = tile.rectangle.width / 512.0;
      var northwestTileRectangle = imageryTilingScheme.tileXYToRectangle(northwestTileCoordinates.x, northwestTileCoordinates.y, imageryLevel);
      if (Math.abs(northwestTileRectangle.south - tile.rectangle.north) < veryCloseY && northwestTileCoordinates.y < southeastTileCoordinates.y) {
        ++northwestTileCoordinates.y;
      }
      if (Math.abs(northwestTileRectangle.east - tile.rectangle.west) < veryCloseX && northwestTileCoordinates.x < southeastTileCoordinates.x) {
        ++northwestTileCoordinates.x;
      }
      var southeastTileRectangle = imageryTilingScheme.tileXYToRectangle(southeastTileCoordinates.x, southeastTileCoordinates.y, imageryLevel);
      if (Math.abs(southeastTileRectangle.north - tile.rectangle.south) < veryCloseY && southeastTileCoordinates.y > northwestTileCoordinates.y) {
        --southeastTileCoordinates.y;
      }
      if (Math.abs(southeastTileRectangle.west - tile.rectangle.east) < veryCloseX && southeastTileCoordinates.x > northwestTileCoordinates.x) {
        --southeastTileCoordinates.x;
      }
      var terrainRectangle = tile.rectangle;
      var imageryRectangle = imageryTilingScheme.tileXYToRectangle(northwestTileCoordinates.x, northwestTileCoordinates.y, imageryLevel);
      var clippedImageryRectangle = Rectangle.intersection(imageryRectangle, imageryBounds, clippedRectangleScratch);
      var minU;
      var maxU = 0.0;
      var minV = 1.0;
      var maxV;
      if (!this.isBaseLayer() && Math.abs(clippedImageryRectangle.west - tile.rectangle.west) >= veryCloseX) {
        maxU = Math.min(1.0, (clippedImageryRectangle.west - terrainRectangle.west) / terrainRectangle.width);
      }
      if (!this.isBaseLayer() && Math.abs(clippedImageryRectangle.north - tile.rectangle.north) >= veryCloseY) {
        minV = Math.max(0.0, (clippedImageryRectangle.north - terrainRectangle.south) / terrainRectangle.height);
      }
      var initialMinV = minV;
      for (var i = northwestTileCoordinates.x; i <= southeastTileCoordinates.x; i++) {
        minU = maxU;
        imageryRectangle = imageryTilingScheme.tileXYToRectangle(i, northwestTileCoordinates.y, imageryLevel);
        clippedImageryRectangle = Rectangle.intersection(imageryRectangle, imageryBounds, clippedRectangleScratch);
        maxU = Math.min(1.0, (clippedImageryRectangle.east - terrainRectangle.west) / terrainRectangle.width);
        if (i === southeastTileCoordinates.x && (this.isBaseLayer() || Math.abs(clippedImageryRectangle.east - tile.rectangle.east) < veryCloseX)) {
          maxU = 1.0;
        }
        minV = initialMinV;
        for (var j = northwestTileCoordinates.y; j <= southeastTileCoordinates.y; j++) {
          maxV = minV;
          imageryRectangle = imageryTilingScheme.tileXYToRectangle(i, j, imageryLevel);
          clippedImageryRectangle = Rectangle.intersection(imageryRectangle, imageryBounds, clippedRectangleScratch);
          minV = Math.max(0.0, (clippedImageryRectangle.south - terrainRectangle.south) / terrainRectangle.height);
          if (j === southeastTileCoordinates.y && (this.isBaseLayer() || Math.abs(clippedImageryRectangle.south - tile.rectangle.south) < veryCloseY)) {
            minV = 0.0;
          }
          var texCoordsRectangle = new Cartesian4(minU, minV, maxU, maxV);
          var imagery = this.getImageryFromCache(i, j, imageryLevel, imageryRectangle);
          surfaceTile.imagery.splice(insertionPoint, 0, new TileImagery(imagery, texCoordsRectangle));
          ++insertionPoint;
        }
      }
      return true;
    };
    ImageryLayer.prototype._calculateTextureTranslationAndScale = function(tile, tileImagery) {
      var imageryRectangle = tileImagery.readyImagery.rectangle;
      var terrainRectangle = tile.rectangle;
      var terrainWidth = terrainRectangle.width;
      var terrainHeight = terrainRectangle.height;
      var scaleX = terrainWidth / imageryRectangle.width;
      var scaleY = terrainHeight / imageryRectangle.height;
      return new Cartesian4(scaleX * (terrainRectangle.west - imageryRectangle.west) / terrainWidth, scaleY * (terrainRectangle.south - imageryRectangle.south) / terrainHeight, scaleX, scaleY);
    };
    ImageryLayer.prototype._requestImagery = function(imagery) {
      var imageryProvider = this._imageryProvider;
      var that = this;
      function success(image) {
        if (!defined(image)) {
          return failure();
        }
        imagery.image = image;
        imagery.state = ImageryState.RECEIVED;
        TileProviderError.handleSuccess(that._requestImageError);
      }
      function failure(e) {
        imagery.state = ImageryState.FAILED;
        var message = 'Failed to obtain image tile X: ' + imagery.x + ' Y: ' + imagery.y + ' Level: ' + imagery.level + '.';
        that._requestImageError = TileProviderError.handleError(that._requestImageError, imageryProvider, imageryProvider.errorEvent, message, imagery.x, imagery.y, imagery.level, doRequest, e);
      }
      function doRequest() {
        imagery.state = ImageryState.TRANSITIONING;
        var imagePromise = imageryProvider.requestImage(imagery.x, imagery.y, imagery.level);
        if (!defined(imagePromise)) {
          imagery.state = ImageryState.UNLOADED;
          return;
        }
        if (defined(imageryProvider.getTileCredits)) {
          imagery.credits = imageryProvider.getTileCredits(imagery.x, imagery.y, imagery.level);
        }
        when(imagePromise, success, failure);
      }
      doRequest();
    };
    ImageryLayer.prototype._createTexture = function(context, imagery) {
      var imageryProvider = this._imageryProvider;
      if (defined(imageryProvider.tileDiscardPolicy)) {
        var discardPolicy = imageryProvider.tileDiscardPolicy;
        if (defined(discardPolicy)) {
          if (!discardPolicy.isReady()) {
            imagery.state = ImageryState.RECEIVED;
            return;
          }
          if (discardPolicy.shouldDiscardImage(imagery.image)) {
            imagery.state = ImageryState.INVALID;
            return;
          }
        }
      }
      var texture = new Texture({
        context: context,
        source: imagery.image,
        pixelFormat: imageryProvider.hasAlphaChannel ? PixelFormat.RGBA : PixelFormat.RGB
      });
      imagery.texture = texture;
      imagery.image = undefined;
      imagery.state = ImageryState.TEXTURE_LOADED;
    };
    function finalizeReprojectTexture(imageryLayer, context, imagery, texture) {
      if (CesiumMath.isPowerOfTwo(texture.width) && CesiumMath.isPowerOfTwo(texture.height)) {
        var mipmapSampler = context.cache.imageryLayer_mipmapSampler;
        if (!defined(mipmapSampler)) {
          var maximumSupportedAnisotropy = ContextLimits.maximumTextureFilterAnisotropy;
          mipmapSampler = context.cache.imageryLayer_mipmapSampler = new Sampler({
            wrapS: TextureWrap.CLAMP_TO_EDGE,
            wrapT: TextureWrap.CLAMP_TO_EDGE,
            minificationFilter: TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
            magnificationFilter: TextureMagnificationFilter.LINEAR,
            maximumAnisotropy: Math.min(maximumSupportedAnisotropy, defaultValue(imageryLayer._maximumAnisotropy, maximumSupportedAnisotropy))
          });
        }
        texture.generateMipmap(MipmapHint.NICEST);
        texture.sampler = mipmapSampler;
      } else {
        var nonMipmapSampler = context.cache.imageryLayer_nonMipmapSampler;
        if (!defined(nonMipmapSampler)) {
          nonMipmapSampler = context.cache.imageryLayer_nonMipmapSampler = new Sampler({
            wrapS: TextureWrap.CLAMP_TO_EDGE,
            wrapT: TextureWrap.CLAMP_TO_EDGE,
            minificationFilter: TextureMinificationFilter.LINEAR,
            magnificationFilter: TextureMagnificationFilter.LINEAR
          });
        }
        texture.sampler = nonMipmapSampler;
      }
      imagery.state = ImageryState.READY;
    }
    ImageryLayer.prototype._reprojectTexture = function(frameState, imagery) {
      var texture = imagery.texture;
      var rectangle = imagery.rectangle;
      var context = frameState.context;
      if (!(this._imageryProvider.tilingScheme instanceof GeographicTilingScheme) && rectangle.width / texture.width > 1e-5) {
        var that = this;
        var computeCommand = new ComputeCommand({
          persists: true,
          owner: this,
          preExecute: function(command) {
            reprojectToGeographic(command, context, texture, imagery.rectangle);
          },
          postExecute: function(outputTexture) {
            texture.destroy();
            imagery.texture = outputTexture;
            finalizeReprojectTexture(that, context, imagery, outputTexture);
          }
        });
        frameState.commandList.push(computeCommand);
      } else {
        finalizeReprojectTexture(this, context, imagery, texture);
      }
    };
    ImageryLayer.prototype.getImageryFromCache = function(x, y, level, imageryRectangle) {
      var cacheKey = getImageryCacheKey(x, y, level);
      var imagery = this._imageryCache[cacheKey];
      if (!defined(imagery)) {
        imagery = new Imagery(this, x, y, level, imageryRectangle);
        this._imageryCache[cacheKey] = imagery;
      }
      imagery.addReference();
      return imagery;
    };
    ImageryLayer.prototype.removeImageryFromCache = function(imagery) {
      var cacheKey = getImageryCacheKey(imagery.x, imagery.y, imagery.level);
      delete this._imageryCache[cacheKey];
    };
    function getImageryCacheKey(x, y, level) {
      return JSON.stringify([x, y, level]);
    }
    var uniformMap = {
      u_textureDimensions: function() {
        return this.textureDimensions;
      },
      u_texture: function() {
        return this.texture;
      },
      textureDimensions: new Cartesian2(),
      texture: undefined
    };
    var float32ArrayScratch = FeatureDetection.supportsTypedArrays() ? new Float32Array(2 * 64) : undefined;
    function reprojectToGeographic(command, context, texture, rectangle) {
      var reproject = context.cache.imageryLayer_reproject;
      if (!defined(reproject)) {
        reproject = context.cache.imageryLayer_reproject = {
          vertexArray: undefined,
          shaderProgram: undefined,
          sampler: undefined,
          destroy: function() {
            if (defined(this.framebuffer)) {
              this.framebuffer.destroy();
            }
            if (defined(this.vertexArray)) {
              this.vertexArray.destroy();
            }
            if (defined(this.shaderProgram)) {
              this.shaderProgram.destroy();
            }
          }
        };
        var positions = new Float32Array(2 * 64 * 2);
        var index = 0;
        for (var j = 0; j < 64; ++j) {
          var y = j / 63.0;
          positions[index++] = 0.0;
          positions[index++] = y;
          positions[index++] = 1.0;
          positions[index++] = y;
        }
        var reprojectAttributeIndices = {
          position: 0,
          webMercatorT: 1
        };
        var indices = TerrainProvider.getRegularGridIndices(2, 64);
        var indexBuffer = Buffer.createIndexBuffer({
          context: context,
          typedArray: indices,
          usage: BufferUsage.STATIC_DRAW,
          indexDatatype: IndexDatatype.UNSIGNED_SHORT
        });
        reproject.vertexArray = new VertexArray({
          context: context,
          attributes: [{
            index: reprojectAttributeIndices.position,
            vertexBuffer: Buffer.createVertexBuffer({
              context: context,
              typedArray: positions,
              usage: BufferUsage.STATIC_DRAW
            }),
            componentsPerAttribute: 2
          }, {
            index: reprojectAttributeIndices.webMercatorT,
            vertexBuffer: Buffer.createVertexBuffer({
              context: context,
              sizeInBytes: 64 * 2 * 4,
              usage: BufferUsage.STREAM_DRAW
            }),
            componentsPerAttribute: 1
          }],
          indexBuffer: indexBuffer
        });
        var vs = new ShaderSource({sources: [ReprojectWebMercatorVS]});
        reproject.shaderProgram = ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: vs,
          fragmentShaderSource: ReprojectWebMercatorFS,
          attributeLocations: reprojectAttributeIndices
        });
        reproject.sampler = new Sampler({
          wrapS: TextureWrap.CLAMP_TO_EDGE,
          wrapT: TextureWrap.CLAMP_TO_EDGE,
          minificationFilter: TextureMinificationFilter.LINEAR,
          magnificationFilter: TextureMagnificationFilter.LINEAR
        });
      }
      texture.sampler = reproject.sampler;
      var width = texture.width;
      var height = texture.height;
      uniformMap.textureDimensions.x = width;
      uniformMap.textureDimensions.y = height;
      uniformMap.texture = texture;
      var sinLatitude = Math.sin(rectangle.south);
      var southMercatorY = 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));
      sinLatitude = Math.sin(rectangle.north);
      var northMercatorY = 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));
      var oneOverMercatorHeight = 1.0 / (northMercatorY - southMercatorY);
      var outputTexture = new Texture({
        context: context,
        width: width,
        height: height,
        pixelFormat: texture.pixelFormat,
        pixelDatatype: texture.pixelDatatype,
        preMultiplyAlpha: texture.preMultiplyAlpha
      });
      if (CesiumMath.isPowerOfTwo(width) && CesiumMath.isPowerOfTwo(height)) {
        outputTexture.generateMipmap(MipmapHint.NICEST);
      }
      var south = rectangle.south;
      var north = rectangle.north;
      var webMercatorT = float32ArrayScratch;
      var outputIndex = 0;
      for (var webMercatorTIndex = 0; webMercatorTIndex < 64; ++webMercatorTIndex) {
        var fraction = webMercatorTIndex / 63.0;
        var latitude = CesiumMath.lerp(south, north, fraction);
        sinLatitude = Math.sin(latitude);
        var mercatorY = 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
        var mercatorFraction = (mercatorY - southMercatorY) * oneOverMercatorHeight;
        webMercatorT[outputIndex++] = mercatorFraction;
        webMercatorT[outputIndex++] = mercatorFraction;
      }
      reproject.vertexArray.getAttribute(1).vertexBuffer.copyFromArrayView(webMercatorT);
      command.shaderProgram = reproject.shaderProgram;
      command.outputTexture = outputTexture;
      command.uniformMap = uniformMap;
      command.vertexArray = reproject.vertexArray;
    }
    function getLevelWithMaximumTexelSpacing(layer, texelSpacing, latitudeClosestToEquator) {
      var imageryProvider = layer._imageryProvider;
      var tilingScheme = imageryProvider.tilingScheme;
      var ellipsoid = tilingScheme.ellipsoid;
      var latitudeFactor = !(layer._imageryProvider.tilingScheme instanceof GeographicTilingScheme) ? Math.cos(latitudeClosestToEquator) : 1.0;
      var tilingSchemeRectangle = tilingScheme.rectangle;
      var levelZeroMaximumTexelSpacing = ellipsoid.maximumRadius * tilingSchemeRectangle.width * latitudeFactor / (imageryProvider.tileWidth * tilingScheme.getNumberOfXTilesAtLevel(0));
      var twoToTheLevelPower = levelZeroMaximumTexelSpacing / texelSpacing;
      var level = Math.log(twoToTheLevelPower) / Math.log(2);
      var rounded = Math.round(level);
      return rounded | 0;
    }
    return ImageryLayer;
  });
})(require('buffer').Buffer);
