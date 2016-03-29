/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/AttributeCompression', '../Core/BoundingSphere', '../Core/Cartesian2', '../Core/Cartesian3', '../Core/Color', '../Core/ComponentDatatype', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/DeveloperError', '../Core/EncodedCartesian3', '../Core/IndexDatatype', '../Core/Math', '../Core/Matrix4', '../Renderer/Buffer', '../Renderer/BufferUsage', '../Renderer/DrawCommand', '../Renderer/RenderState', '../Renderer/ShaderProgram', '../Renderer/ShaderSource', '../Renderer/VertexArrayFacade', '../Shaders/BillboardCollectionFS', '../Shaders/BillboardCollectionVS', './Billboard', './BlendingState', './HorizontalOrigin', './Pass', './SceneMode', './TextureAtlas'], function(AttributeCompression, BoundingSphere, Cartesian2, Cartesian3, Color, ComponentDatatype, defaultValue, defined, defineProperties, destroyObject, DeveloperError, EncodedCartesian3, IndexDatatype, CesiumMath, Matrix4, Buffer, BufferUsage, DrawCommand, RenderState, ShaderProgram, ShaderSource, VertexArrayFacade, BillboardCollectionFS, BillboardCollectionVS, Billboard, BlendingState, HorizontalOrigin, Pass, SceneMode, TextureAtlas) {
    'use strict';
    var SHOW_INDEX = Billboard.SHOW_INDEX;
    var POSITION_INDEX = Billboard.POSITION_INDEX;
    var PIXEL_OFFSET_INDEX = Billboard.PIXEL_OFFSET_INDEX;
    var EYE_OFFSET_INDEX = Billboard.EYE_OFFSET_INDEX;
    var HORIZONTAL_ORIGIN_INDEX = Billboard.HORIZONTAL_ORIGIN_INDEX;
    var VERTICAL_ORIGIN_INDEX = Billboard.VERTICAL_ORIGIN_INDEX;
    var SCALE_INDEX = Billboard.SCALE_INDEX;
    var IMAGE_INDEX_INDEX = Billboard.IMAGE_INDEX_INDEX;
    var COLOR_INDEX = Billboard.COLOR_INDEX;
    var ROTATION_INDEX = Billboard.ROTATION_INDEX;
    var ALIGNED_AXIS_INDEX = Billboard.ALIGNED_AXIS_INDEX;
    var SCALE_BY_DISTANCE_INDEX = Billboard.SCALE_BY_DISTANCE_INDEX;
    var TRANSLUCENCY_BY_DISTANCE_INDEX = Billboard.TRANSLUCENCY_BY_DISTANCE_INDEX;
    var PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX = Billboard.PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX;
    var NUMBER_OF_PROPERTIES = Billboard.NUMBER_OF_PROPERTIES;
    var attributeLocations;
    var attributeLocationsBatched = {
      positionHighAndScale: 0,
      positionLowAndRotation: 1,
      compressedAttribute0: 2,
      compressedAttribute1: 3,
      compressedAttribute2: 4,
      eyeOffset: 5,
      scaleByDistance: 6,
      pixelOffsetScaleByDistance: 7
    };
    var attributeLocationsInstanced = {
      direction: 0,
      positionHighAndScale: 1,
      positionLowAndRotation: 2,
      compressedAttribute0: 3,
      compressedAttribute1: 4,
      compressedAttribute2: 5,
      eyeOffset: 6,
      scaleByDistance: 7,
      pixelOffsetScaleByDistance: 8
    };
    function BillboardCollection(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      this._scene = options.scene;
      this._textureAtlas = undefined;
      this._textureAtlasGUID = undefined;
      this._destroyTextureAtlas = true;
      this._sp = undefined;
      this._rs = undefined;
      this._vaf = undefined;
      this._spPick = undefined;
      this._billboards = [];
      this._billboardsToUpdate = [];
      this._billboardsToUpdateIndex = 0;
      this._billboardsRemoved = false;
      this._createVertexArray = false;
      this._shaderRotation = false;
      this._compiledShaderRotation = false;
      this._compiledShaderRotationPick = false;
      this._shaderAlignedAxis = false;
      this._compiledShaderAlignedAxis = false;
      this._compiledShaderAlignedAxisPick = false;
      this._shaderScaleByDistance = false;
      this._compiledShaderScaleByDistance = false;
      this._compiledShaderScaleByDistancePick = false;
      this._shaderTranslucencyByDistance = false;
      this._compiledShaderTranslucencyByDistance = false;
      this._compiledShaderTranslucencyByDistancePick = false;
      this._shaderPixelOffsetScaleByDistance = false;
      this._compiledShaderPixelOffsetScaleByDistance = false;
      this._compiledShaderPixelOffsetScaleByDistancePick = false;
      this._propertiesChanged = new Uint32Array(NUMBER_OF_PROPERTIES);
      this._maxSize = 0.0;
      this._maxEyeOffset = 0.0;
      this._maxScale = 1.0;
      this._maxPixelOffset = 0.0;
      this._allHorizontalCenter = true;
      this._allVerticalCenter = true;
      this._allSizedInMeters = true;
      this._baseVolume = new BoundingSphere();
      this._baseVolumeWC = new BoundingSphere();
      this._baseVolume2D = new BoundingSphere();
      this._boundingVolume = new BoundingSphere();
      this._boundingVolumeDirty = false;
      this._colorCommands = [];
      this._pickCommands = [];
      this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
      this._modelMatrix = Matrix4.clone(Matrix4.IDENTITY);
      this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);
      this._mode = SceneMode.SCENE3D;
      this._buffersUsage = [BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW, BufferUsage.STATIC_DRAW];
      var that = this;
      this._uniforms = {u_atlas: function() {
          return that._textureAtlas.texture;
        }};
    }
    defineProperties(BillboardCollection.prototype, {
      length: {get: function() {
          removeBillboards(this);
          return this._billboards.length;
        }},
      textureAtlas: {
        get: function() {
          return this._textureAtlas;
        },
        set: function(value) {
          if (this._textureAtlas !== value) {
            this._textureAtlas = this._destroyTextureAtlas && this._textureAtlas && this._textureAtlas.destroy();
            this._textureAtlas = value;
            this._createVertexArray = true;
          }
        }
      },
      destroyTextureAtlas: {
        get: function() {
          return this._destroyTextureAtlas;
        },
        set: function(value) {
          this._destroyTextureAtlas = value;
        }
      }
    });
    function destroyBillboards(billboards) {
      var length = billboards.length;
      for (var i = 0; i < length; ++i) {
        if (billboards[i]) {
          billboards[i]._destroy();
        }
      }
    }
    BillboardCollection.prototype.add = function(billboard) {
      var b = new Billboard(billboard, this);
      b._index = this._billboards.length;
      this._billboards.push(b);
      this._createVertexArray = true;
      return b;
    };
    BillboardCollection.prototype.remove = function(billboard) {
      if (this.contains(billboard)) {
        this._billboards[billboard._index] = null;
        this._billboardsRemoved = true;
        this._createVertexArray = true;
        billboard._destroy();
        return true;
      }
      return false;
    };
    BillboardCollection.prototype.removeAll = function() {
      destroyBillboards(this._billboards);
      this._billboards = [];
      this._billboardsToUpdate = [];
      this._billboardsToUpdateIndex = 0;
      this._billboardsRemoved = false;
      this._createVertexArray = true;
    };
    function removeBillboards(billboardCollection) {
      if (billboardCollection._billboardsRemoved) {
        billboardCollection._billboardsRemoved = false;
        var newBillboards = [];
        var billboards = billboardCollection._billboards;
        var length = billboards.length;
        for (var i = 0,
            j = 0; i < length; ++i) {
          var billboard = billboards[i];
          if (billboard) {
            billboard._index = j++;
            newBillboards.push(billboard);
          }
        }
        billboardCollection._billboards = newBillboards;
      }
    }
    BillboardCollection.prototype._updateBillboard = function(billboard, propertyChanged) {
      if (!billboard._dirty) {
        this._billboardsToUpdate[this._billboardsToUpdateIndex++] = billboard;
      }
      ++this._propertiesChanged[propertyChanged];
    };
    BillboardCollection.prototype.contains = function(billboard) {
      return defined(billboard) && billboard._billboardCollection === this;
    };
    BillboardCollection.prototype.get = function(index) {
      if (!defined(index)) {
        throw new DeveloperError('index is required.');
      }
      removeBillboards(this);
      return this._billboards[index];
    };
    var getIndexBuffer;
    function getIndexBufferBatched(context) {
      var sixteenK = 16 * 1024;
      var indexBuffer = context.cache.billboardCollection_indexBufferBatched;
      if (defined(indexBuffer)) {
        return indexBuffer;
      }
      var length = sixteenK * 6 - 6;
      var indices = new Uint16Array(length);
      for (var i = 0,
          j = 0; i < length; i += 6, j += 4) {
        indices[i] = j;
        indices[i + 1] = j + 1;
        indices[i + 2] = j + 2;
        indices[i + 3] = j + 0;
        indices[i + 4] = j + 2;
        indices[i + 5] = j + 3;
      }
      indexBuffer = Buffer.createIndexBuffer({
        context: context,
        typedArray: indices,
        usage: BufferUsage.STATIC_DRAW,
        indexDatatype: IndexDatatype.UNSIGNED_SHORT
      });
      indexBuffer.vertexArrayDestroyable = false;
      context.cache.billboardCollection_indexBufferBatched = indexBuffer;
      return indexBuffer;
    }
    function getIndexBufferInstanced(context) {
      var indexBuffer = context.cache.billboardCollection_indexBufferInstanced;
      if (defined(indexBuffer)) {
        return indexBuffer;
      }
      indexBuffer = Buffer.createIndexBuffer({
        context: context,
        typedArray: new Uint16Array([0, 1, 2, 0, 2, 3]),
        usage: BufferUsage.STATIC_DRAW,
        indexDatatype: IndexDatatype.UNSIGNED_SHORT
      });
      indexBuffer.vertexArrayDestroyable = false;
      context.cache.billboardCollection_indexBufferInstanced = indexBuffer;
      return indexBuffer;
    }
    function getVertexBufferInstanced(context) {
      var vertexBuffer = context.cache.billboardCollection_vertexBufferInstanced;
      if (defined(vertexBuffer)) {
        return vertexBuffer;
      }
      vertexBuffer = Buffer.createVertexBuffer({
        context: context,
        typedArray: new Float32Array([0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]),
        usage: BufferUsage.STATIC_DRAW
      });
      vertexBuffer.vertexArrayDestroyable = false;
      context.cache.billboardCollection_vertexBufferInstanced = vertexBuffer;
      return vertexBuffer;
    }
    BillboardCollection.prototype.computeNewBuffersUsage = function() {
      var buffersUsage = this._buffersUsage;
      var usageChanged = false;
      var properties = this._propertiesChanged;
      for (var k = 0; k < NUMBER_OF_PROPERTIES; ++k) {
        var newUsage = (properties[k] === 0) ? BufferUsage.STATIC_DRAW : BufferUsage.STREAM_DRAW;
        usageChanged = usageChanged || (buffersUsage[k] !== newUsage);
        buffersUsage[k] = newUsage;
      }
      return usageChanged;
    };
    function createVAF(context, numberOfBillboards, buffersUsage, instanced) {
      var attributes = [{
        index: attributeLocations.positionHighAndScale,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[POSITION_INDEX]
      }, {
        index: attributeLocations.positionLowAndRotation,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[POSITION_INDEX]
      }, {
        index: attributeLocations.compressedAttribute0,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[PIXEL_OFFSET_INDEX]
      }, {
        index: attributeLocations.compressedAttribute1,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[TRANSLUCENCY_BY_DISTANCE_INDEX]
      }, {
        index: attributeLocations.compressedAttribute2,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[COLOR_INDEX]
      }, {
        index: attributeLocations.eyeOffset,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[EYE_OFFSET_INDEX]
      }, {
        index: attributeLocations.scaleByDistance,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[SCALE_BY_DISTANCE_INDEX]
      }, {
        index: attributeLocations.pixelOffsetScaleByDistance,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX]
      }];
      if (instanced) {
        attributes.push({
          index: attributeLocations.direction,
          componentsPerAttribute: 2,
          componentDatatype: ComponentDatatype.FLOAT,
          vertexBuffer: getVertexBufferInstanced(context)
        });
      }
      var sizeInVertices = instanced ? numberOfBillboards : 4 * numberOfBillboards;
      return new VertexArrayFacade(context, attributes, sizeInVertices, instanced);
    }
    var writePositionScratch = new EncodedCartesian3();
    function writePositionScaleAndRotation(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
      var i;
      var positionHighWriter = vafWriters[attributeLocations.positionHighAndScale];
      var positionLowWriter = vafWriters[attributeLocations.positionLowAndRotation];
      var position = billboard._getActualPosition();
      if (billboardCollection._mode === SceneMode.SCENE3D) {
        BoundingSphere.expand(billboardCollection._baseVolume, position, billboardCollection._baseVolume);
        billboardCollection._boundingVolumeDirty = true;
      }
      EncodedCartesian3.fromCartesian(position, writePositionScratch);
      var scale = billboard.scale;
      var rotation = billboard.rotation;
      if (rotation !== 0.0) {
        billboardCollection._shaderRotation = true;
      }
      billboardCollection._maxScale = Math.max(billboardCollection._maxScale, scale);
      var high = writePositionScratch.high;
      var low = writePositionScratch.low;
      if (billboardCollection._instanced) {
        i = billboard._index;
        positionHighWriter(i, high.x, high.y, high.z, scale);
        positionLowWriter(i, low.x, low.y, low.z, rotation);
      } else {
        i = billboard._index * 4;
        positionHighWriter(i + 0, high.x, high.y, high.z, scale);
        positionHighWriter(i + 1, high.x, high.y, high.z, scale);
        positionHighWriter(i + 2, high.x, high.y, high.z, scale);
        positionHighWriter(i + 3, high.x, high.y, high.z, scale);
        positionLowWriter(i + 0, low.x, low.y, low.z, rotation);
        positionLowWriter(i + 1, low.x, low.y, low.z, rotation);
        positionLowWriter(i + 2, low.x, low.y, low.z, rotation);
        positionLowWriter(i + 3, low.x, low.y, low.z, rotation);
      }
    }
    var scratchCartesian2 = new Cartesian2();
    var UPPER_BOUND = 32768.0;
    var LEFT_SHIFT16 = 65536.0;
    var LEFT_SHIFT8 = 256.0;
    var LEFT_SHIFT7 = 128.0;
    var LEFT_SHIFT5 = 32.0;
    var LEFT_SHIFT3 = 8.0;
    var LEFT_SHIFT2 = 4.0;
    var RIGHT_SHIFT8 = 1.0 / 256.0;
    var LOWER_LEFT = 0.0;
    var LOWER_RIGHT = 2.0;
    var UPPER_RIGHT = 3.0;
    var UPPER_LEFT = 1.0;
    function writeCompressedAttrib0(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
      var i;
      var writer = vafWriters[attributeLocations.compressedAttribute0];
      var pixelOffset = billboard.pixelOffset;
      var pixelOffsetX = pixelOffset.x;
      var pixelOffsetY = pixelOffset.y;
      var translate = billboard._translate;
      var translateX = translate.x;
      var translateY = translate.y;
      billboardCollection._maxPixelOffset = Math.max(billboardCollection._maxPixelOffset, Math.abs(pixelOffsetX + translateX), Math.abs(-pixelOffsetY + translateY));
      var horizontalOrigin = billboard.horizontalOrigin;
      var verticalOrigin = billboard.verticalOrigin;
      var show = billboard.show;
      if (billboard.color.alpha === 0.0) {
        show = false;
      }
      billboardCollection._allHorizontalCenter = billboardCollection._allHorizontalCenter && horizontalOrigin === HorizontalOrigin.CENTER;
      billboardCollection._allVerticalCenter = billboardCollection._allVerticalCenter && verticalOrigin === HorizontalOrigin.CENTER;
      var bottomLeftX = 0;
      var bottomLeftY = 0;
      var width = 0;
      var height = 0;
      var index = billboard._imageIndex;
      if (index !== -1) {
        var imageRectangle = textureAtlasCoordinates[index];
        if (!defined(imageRectangle)) {
          throw new DeveloperError('Invalid billboard image index: ' + index);
        }
        bottomLeftX = imageRectangle.x;
        bottomLeftY = imageRectangle.y;
        width = imageRectangle.width;
        height = imageRectangle.height;
      }
      var topRightX = bottomLeftX + width;
      var topRightY = bottomLeftY + height;
      var compressed0 = Math.floor(CesiumMath.clamp(pixelOffsetX, -UPPER_BOUND, UPPER_BOUND) + UPPER_BOUND) * LEFT_SHIFT7;
      compressed0 += (horizontalOrigin + 1.0) * LEFT_SHIFT5;
      compressed0 += (verticalOrigin + 1.0) * LEFT_SHIFT3;
      compressed0 += (show ? 1.0 : 0.0) * LEFT_SHIFT2;
      var compressed1 = Math.floor(CesiumMath.clamp(pixelOffsetY, -UPPER_BOUND, UPPER_BOUND) + UPPER_BOUND) * LEFT_SHIFT8;
      var compressed2 = Math.floor(CesiumMath.clamp(translateX, -UPPER_BOUND, UPPER_BOUND) + UPPER_BOUND) * LEFT_SHIFT8;
      var tempTanslateY = (CesiumMath.clamp(translateY, -UPPER_BOUND, UPPER_BOUND) + UPPER_BOUND) * RIGHT_SHIFT8;
      var upperTranslateY = Math.floor(tempTanslateY);
      var lowerTranslateY = Math.floor((tempTanslateY - upperTranslateY) * LEFT_SHIFT8);
      compressed1 += upperTranslateY;
      compressed2 += lowerTranslateY;
      scratchCartesian2.x = bottomLeftX;
      scratchCartesian2.y = bottomLeftY;
      var compressedTexCoordsLL = AttributeCompression.compressTextureCoordinates(scratchCartesian2);
      scratchCartesian2.x = topRightX;
      var compressedTexCoordsLR = AttributeCompression.compressTextureCoordinates(scratchCartesian2);
      scratchCartesian2.y = topRightY;
      var compressedTexCoordsUR = AttributeCompression.compressTextureCoordinates(scratchCartesian2);
      scratchCartesian2.x = bottomLeftX;
      var compressedTexCoordsUL = AttributeCompression.compressTextureCoordinates(scratchCartesian2);
      if (billboardCollection._instanced) {
        i = billboard._index;
        writer(i, compressed0, compressed1, compressed2, compressedTexCoordsLL);
      } else {
        i = billboard._index * 4;
        writer(i + 0, compressed0 + LOWER_LEFT, compressed1, compressed2, compressedTexCoordsLL);
        writer(i + 1, compressed0 + LOWER_RIGHT, compressed1, compressed2, compressedTexCoordsLR);
        writer(i + 2, compressed0 + UPPER_RIGHT, compressed1, compressed2, compressedTexCoordsUR);
        writer(i + 3, compressed0 + UPPER_LEFT, compressed1, compressed2, compressedTexCoordsUL);
      }
    }
    function writeCompressedAttrib1(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
      var i;
      var writer = vafWriters[attributeLocations.compressedAttribute1];
      var alignedAxis = billboard.alignedAxis;
      if (!Cartesian3.equals(alignedAxis, Cartesian3.ZERO)) {
        billboardCollection._shaderAlignedAxis = true;
      }
      var near = 0.0;
      var nearValue = 1.0;
      var far = 1.0;
      var farValue = 1.0;
      var translucency = billboard.translucencyByDistance;
      if (defined(translucency)) {
        near = translucency.near;
        nearValue = translucency.nearValue;
        far = translucency.far;
        farValue = translucency.farValue;
        if (nearValue !== 1.0 || farValue !== 1.0) {
          billboardCollection._shaderTranslucencyByDistance = true;
        }
      }
      var width = 0;
      var index = billboard._imageIndex;
      if (index !== -1) {
        var imageRectangle = textureAtlasCoordinates[index];
        if (!defined(imageRectangle)) {
          throw new DeveloperError('Invalid billboard image index: ' + index);
        }
        width = imageRectangle.width;
      }
      var textureWidth = billboardCollection._textureAtlas.texture.width;
      var imageWidth = Math.ceil(defaultValue(billboard.width, textureWidth * width) * 0.5);
      billboardCollection._maxSize = Math.max(billboardCollection._maxSize, imageWidth);
      var compressed0 = CesiumMath.clamp(imageWidth, 0.0, LEFT_SHIFT16);
      var compressed1 = 0.0;
      if (Math.abs(Cartesian3.magnitudeSquared(alignedAxis) - 1.0) < CesiumMath.EPSILON6) {
        compressed1 = AttributeCompression.octEncodeFloat(alignedAxis);
      }
      nearValue = CesiumMath.clamp(nearValue, 0.0, 1.0);
      nearValue = nearValue === 1.0 ? 255.0 : (nearValue * 255.0) | 0;
      compressed0 = compressed0 * LEFT_SHIFT8 + nearValue;
      farValue = CesiumMath.clamp(farValue, 0.0, 1.0);
      farValue = farValue === 1.0 ? 255.0 : (farValue * 255.0) | 0;
      compressed1 = compressed1 * LEFT_SHIFT8 + farValue;
      if (billboardCollection._instanced) {
        i = billboard._index;
        writer(i, compressed0, compressed1, near, far);
      } else {
        i = billboard._index * 4;
        writer(i + 0, compressed0, compressed1, near, far);
        writer(i + 1, compressed0, compressed1, near, far);
        writer(i + 2, compressed0, compressed1, near, far);
        writer(i + 3, compressed0, compressed1, near, far);
      }
    }
    function writeCompressedAttrib2(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
      var i;
      var writer = vafWriters[attributeLocations.compressedAttribute2];
      var color = billboard.color;
      var pickColor = billboard.getPickId(context).color;
      var sizeInMeters = billboard.sizeInMeters ? 1.0 : 0.0;
      billboardCollection._allSizedInMeters = billboardCollection._allSizedInMeters && sizeInMeters === 1.0;
      var height = 0;
      var index = billboard._imageIndex;
      if (index !== -1) {
        var imageRectangle = textureAtlasCoordinates[index];
        if (!defined(imageRectangle)) {
          throw new DeveloperError('Invalid billboard image index: ' + index);
        }
        height = imageRectangle.height;
      }
      var dimensions = billboardCollection._textureAtlas.texture.dimensions;
      var imageHeight = Math.ceil(defaultValue(billboard.height, dimensions.y * height) * 0.5);
      billboardCollection._maxSize = Math.max(billboardCollection._maxSize, imageHeight);
      var red = Color.floatToByte(color.red);
      var green = Color.floatToByte(color.green);
      var blue = Color.floatToByte(color.blue);
      var compressed0 = red * LEFT_SHIFT16 + green * LEFT_SHIFT8 + blue;
      red = Color.floatToByte(pickColor.red);
      green = Color.floatToByte(pickColor.green);
      blue = Color.floatToByte(pickColor.blue);
      var compressed1 = red * LEFT_SHIFT16 + green * LEFT_SHIFT8 + blue;
      var compressed2 = Color.floatToByte(color.alpha) * LEFT_SHIFT16 + Color.floatToByte(pickColor.alpha) * LEFT_SHIFT8 + sizeInMeters;
      if (billboardCollection._instanced) {
        i = billboard._index;
        writer(i, compressed0, compressed1, compressed2, imageHeight);
      } else {
        i = billboard._index * 4;
        writer(i + 0, compressed0, compressed1, compressed2, imageHeight);
        writer(i + 1, compressed0, compressed1, compressed2, imageHeight);
        writer(i + 2, compressed0, compressed1, compressed2, imageHeight);
        writer(i + 3, compressed0, compressed1, compressed2, imageHeight);
      }
    }
    function writeEyeOffset(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
      var i;
      var writer = vafWriters[attributeLocations.eyeOffset];
      var eyeOffset = billboard.eyeOffset;
      billboardCollection._maxEyeOffset = Math.max(billboardCollection._maxEyeOffset, Math.abs(eyeOffset.x), Math.abs(eyeOffset.y), Math.abs(eyeOffset.z));
      if (billboardCollection._instanced) {
        var width = 0;
        var height = 0;
        var index = billboard._imageIndex;
        if (index !== -1) {
          var imageRectangle = textureAtlasCoordinates[index];
          if (!defined(imageRectangle)) {
            throw new DeveloperError('Invalid billboard image index: ' + index);
          }
          width = imageRectangle.width;
          height = imageRectangle.height;
        }
        scratchCartesian2.x = width;
        scratchCartesian2.y = height;
        var compressedTexCoordsRange = AttributeCompression.compressTextureCoordinates(scratchCartesian2);
        i = billboard._index;
        writer(i, eyeOffset.x, eyeOffset.y, eyeOffset.z, compressedTexCoordsRange);
      } else {
        i = billboard._index * 4;
        writer(i + 0, eyeOffset.x, eyeOffset.y, eyeOffset.z, 0.0);
        writer(i + 1, eyeOffset.x, eyeOffset.y, eyeOffset.z, 0.0);
        writer(i + 2, eyeOffset.x, eyeOffset.y, eyeOffset.z, 0.0);
        writer(i + 3, eyeOffset.x, eyeOffset.y, eyeOffset.z, 0.0);
      }
    }
    function writeScaleByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
      var i;
      var writer = vafWriters[attributeLocations.scaleByDistance];
      var near = 0.0;
      var nearValue = 1.0;
      var far = 1.0;
      var farValue = 1.0;
      var scale = billboard.scaleByDistance;
      if (defined(scale)) {
        near = scale.near;
        nearValue = scale.nearValue;
        far = scale.far;
        farValue = scale.farValue;
        if (nearValue !== 1.0 || farValue !== 1.0) {
          billboardCollection._shaderScaleByDistance = true;
        }
      }
      if (billboardCollection._instanced) {
        i = billboard._index;
        writer(i, near, nearValue, far, farValue);
      } else {
        i = billboard._index * 4;
        writer(i + 0, near, nearValue, far, farValue);
        writer(i + 1, near, nearValue, far, farValue);
        writer(i + 2, near, nearValue, far, farValue);
        writer(i + 3, near, nearValue, far, farValue);
      }
    }
    function writePixelOffsetScaleByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
      var i;
      var writer = vafWriters[attributeLocations.pixelOffsetScaleByDistance];
      var near = 0.0;
      var nearValue = 1.0;
      var far = 1.0;
      var farValue = 1.0;
      var pixelOffsetScale = billboard.pixelOffsetScaleByDistance;
      if (defined(pixelOffsetScale)) {
        near = pixelOffsetScale.near;
        nearValue = pixelOffsetScale.nearValue;
        far = pixelOffsetScale.far;
        farValue = pixelOffsetScale.farValue;
        if (nearValue !== 1.0 || farValue !== 1.0) {
          billboardCollection._shaderPixelOffsetScaleByDistance = true;
        }
      }
      if (billboardCollection._instanced) {
        i = billboard._index;
        writer(i, near, nearValue, far, farValue);
      } else {
        i = billboard._index * 4;
        writer(i + 0, near, nearValue, far, farValue);
        writer(i + 1, near, nearValue, far, farValue);
        writer(i + 2, near, nearValue, far, farValue);
        writer(i + 3, near, nearValue, far, farValue);
      }
    }
    function writeBillboard(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
      writePositionScaleAndRotation(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
      writeCompressedAttrib0(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
      writeCompressedAttrib1(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
      writeCompressedAttrib2(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
      writeEyeOffset(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
      writeScaleByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
      writePixelOffsetScaleByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
    }
    function recomputeActualPositions(billboardCollection, billboards, length, frameState, modelMatrix, recomputeBoundingVolume) {
      var boundingVolume;
      if (frameState.mode === SceneMode.SCENE3D) {
        boundingVolume = billboardCollection._baseVolume;
        billboardCollection._boundingVolumeDirty = true;
      } else {
        boundingVolume = billboardCollection._baseVolume2D;
      }
      var positions = [];
      for (var i = 0; i < length; ++i) {
        var billboard = billboards[i];
        var position = billboard.position;
        var actualPosition = Billboard._computeActualPosition(billboard, position, frameState, modelMatrix);
        if (defined(actualPosition)) {
          billboard._setActualPosition(actualPosition);
          if (recomputeBoundingVolume) {
            positions.push(actualPosition);
          } else {
            BoundingSphere.expand(boundingVolume, actualPosition, boundingVolume);
          }
        }
      }
      if (recomputeBoundingVolume) {
        BoundingSphere.fromPoints(positions, boundingVolume);
      }
    }
    function updateMode(billboardCollection, frameState) {
      var mode = frameState.mode;
      var billboards = billboardCollection._billboards;
      var billboardsToUpdate = billboardCollection._billboardsToUpdate;
      var modelMatrix = billboardCollection._modelMatrix;
      if (billboardCollection._createVertexArray || billboardCollection._mode !== mode || mode !== SceneMode.SCENE3D && !Matrix4.equals(modelMatrix, billboardCollection.modelMatrix)) {
        billboardCollection._mode = mode;
        Matrix4.clone(billboardCollection.modelMatrix, modelMatrix);
        billboardCollection._createVertexArray = true;
        if (mode === SceneMode.SCENE3D || mode === SceneMode.SCENE2D || mode === SceneMode.COLUMBUS_VIEW) {
          recomputeActualPositions(billboardCollection, billboards, billboards.length, frameState, modelMatrix, true);
        }
      } else if (mode === SceneMode.MORPHING) {
        recomputeActualPositions(billboardCollection, billboards, billboards.length, frameState, modelMatrix, true);
      } else if (mode === SceneMode.SCENE2D || mode === SceneMode.COLUMBUS_VIEW) {
        recomputeActualPositions(billboardCollection, billboardsToUpdate, billboardCollection._billboardsToUpdateIndex, frameState, modelMatrix, false);
      }
    }
    function updateBoundingVolume(collection, frameState, boundingVolume) {
      var pixelScale = 1.0;
      if (!collection._allSizedInMeters || collection._maxPixelOffset !== 0.0) {
        pixelScale = frameState.camera.getPixelSize(boundingVolume, frameState.context.drawingBufferWidth, frameState.context.drawingBufferHeight);
      }
      var size = pixelScale * collection._maxScale * collection._maxSize * 2.0;
      if (collection._allHorizontalCenter && collection._allVerticalCenter) {
        size *= 0.5;
      }
      var offset = pixelScale * collection._maxPixelOffset + collection._maxEyeOffset;
      boundingVolume.radius += size + offset;
    }
    var scratchWriterArray = [];
    BillboardCollection.prototype.update = function(frameState) {
      removeBillboards(this);
      var billboards = this._billboards;
      var billboardsLength = billboards.length;
      var context = frameState.context;
      this._instanced = context.instancedArrays;
      attributeLocations = this._instanced ? attributeLocationsInstanced : attributeLocationsBatched;
      getIndexBuffer = this._instanced ? getIndexBufferInstanced : getIndexBufferBatched;
      var textureAtlas = this._textureAtlas;
      if (!defined(textureAtlas)) {
        textureAtlas = this._textureAtlas = new TextureAtlas({context: context});
        for (var ii = 0; ii < billboardsLength; ++ii) {
          billboards[ii]._loadImage();
        }
      }
      var textureAtlasCoordinates = textureAtlas.textureCoordinates;
      if (textureAtlasCoordinates.length === 0) {
        return;
      }
      updateMode(this, frameState);
      billboards = this._billboards;
      billboardsLength = billboards.length;
      var billboardsToUpdate = this._billboardsToUpdate;
      var billboardsToUpdateLength = this._billboardsToUpdateIndex;
      var properties = this._propertiesChanged;
      var textureAtlasGUID = textureAtlas.guid;
      var createVertexArray = this._createVertexArray || this._textureAtlasGUID !== textureAtlasGUID;
      this._textureAtlasGUID = textureAtlasGUID;
      var vafWriters;
      var pass = frameState.passes;
      var picking = pass.pick;
      if (createVertexArray || (!picking && this.computeNewBuffersUsage())) {
        this._createVertexArray = false;
        for (var k = 0; k < NUMBER_OF_PROPERTIES; ++k) {
          properties[k] = 0;
        }
        this._vaf = this._vaf && this._vaf.destroy();
        if (billboardsLength > 0) {
          this._vaf = createVAF(context, billboardsLength, this._buffersUsage, this._instanced);
          vafWriters = this._vaf.writers;
          for (var i = 0; i < billboardsLength; ++i) {
            var billboard = this._billboards[i];
            billboard._dirty = false;
            writeBillboard(this, context, textureAtlasCoordinates, vafWriters, billboard);
          }
          this._vaf.commit(getIndexBuffer(context));
        }
        this._billboardsToUpdateIndex = 0;
      } else {
        if (billboardsToUpdateLength > 0) {
          var writers = scratchWriterArray;
          writers.length = 0;
          if (properties[POSITION_INDEX] || properties[ROTATION_INDEX] || properties[SCALE_INDEX]) {
            writers.push(writePositionScaleAndRotation);
          }
          if (properties[IMAGE_INDEX_INDEX] || properties[PIXEL_OFFSET_INDEX] || properties[HORIZONTAL_ORIGIN_INDEX] || properties[VERTICAL_ORIGIN_INDEX] || properties[SHOW_INDEX]) {
            writers.push(writeCompressedAttrib0);
            if (this._instanced) {
              writers.push(writeEyeOffset);
            }
          }
          if (properties[IMAGE_INDEX_INDEX] || properties[ALIGNED_AXIS_INDEX] || properties[TRANSLUCENCY_BY_DISTANCE_INDEX]) {
            writers.push(writeCompressedAttrib1);
          }
          if (properties[IMAGE_INDEX_INDEX] || properties[COLOR_INDEX]) {
            writers.push(writeCompressedAttrib2);
          }
          if (properties[EYE_OFFSET_INDEX]) {
            writers.push(writeEyeOffset);
          }
          if (properties[SCALE_BY_DISTANCE_INDEX]) {
            writers.push(writeScaleByDistance);
          }
          if (properties[PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX]) {
            writers.push(writePixelOffsetScaleByDistance);
          }
          var numWriters = writers.length;
          vafWriters = this._vaf.writers;
          if ((billboardsToUpdateLength / billboardsLength) > 0.1) {
            for (var m = 0; m < billboardsToUpdateLength; ++m) {
              var b = billboardsToUpdate[m];
              b._dirty = false;
              for (var n = 0; n < numWriters; ++n) {
                writers[n](this, context, textureAtlasCoordinates, vafWriters, b);
              }
            }
            this._vaf.commit(getIndexBuffer(context));
          } else {
            for (var h = 0; h < billboardsToUpdateLength; ++h) {
              var bb = billboardsToUpdate[h];
              bb._dirty = false;
              for (var o = 0; o < numWriters; ++o) {
                writers[o](this, context, textureAtlasCoordinates, vafWriters, bb);
              }
              if (this._instanced) {
                this._vaf.subCommit(bb._index, 1);
              } else {
                this._vaf.subCommit(bb._index * 4, 4);
              }
            }
            this._vaf.endSubCommits();
          }
          this._billboardsToUpdateIndex = 0;
        }
      }
      if (billboardsToUpdateLength > billboardsLength * 1.5) {
        billboardsToUpdate.length = billboardsLength;
      }
      if (!defined(this._vaf) || !defined(this._vaf.va)) {
        return;
      }
      if (this._boundingVolumeDirty) {
        this._boundingVolumeDirty = false;
        BoundingSphere.transform(this._baseVolume, this.modelMatrix, this._baseVolumeWC);
      }
      var boundingVolume;
      var modelMatrix = Matrix4.IDENTITY;
      if (frameState.mode === SceneMode.SCENE3D) {
        modelMatrix = this.modelMatrix;
        boundingVolume = BoundingSphere.clone(this._baseVolumeWC, this._boundingVolume);
      } else {
        boundingVolume = BoundingSphere.clone(this._baseVolume2D, this._boundingVolume);
      }
      updateBoundingVolume(this, frameState, boundingVolume);
      var va;
      var vaLength;
      var command;
      var vs;
      var fs;
      var j;
      var commandList = frameState.commandList;
      if (pass.render) {
        var colorList = this._colorCommands;
        if (!defined(this._rs)) {
          this._rs = RenderState.fromCache({
            depthTest: {enabled: true},
            blending: BlendingState.ALPHA_BLEND
          });
        }
        if (!defined(this._sp) || (this._shaderRotation !== this._compiledShaderRotation) || (this._shaderAlignedAxis !== this._compiledShaderAlignedAxis) || (this._shaderScaleByDistance !== this._compiledShaderScaleByDistance) || (this._shaderTranslucencyByDistance !== this._compiledShaderTranslucencyByDistance) || (this._shaderPixelOffsetScaleByDistance !== this._compiledShaderPixelOffsetScaleByDistance)) {
          vs = new ShaderSource({sources: [BillboardCollectionVS]});
          if (this._instanced) {
            vs.defines.push('INSTANCED');
          }
          if (this._shaderRotation) {
            vs.defines.push('ROTATION');
          }
          if (this._shaderAlignedAxis) {
            vs.defines.push('ALIGNED_AXIS');
          }
          if (this._shaderScaleByDistance) {
            vs.defines.push('EYE_DISTANCE_SCALING');
          }
          if (this._shaderTranslucencyByDistance) {
            vs.defines.push('EYE_DISTANCE_TRANSLUCENCY');
          }
          if (this._shaderPixelOffsetScaleByDistance) {
            vs.defines.push('EYE_DISTANCE_PIXEL_OFFSET');
          }
          if (defined(this._scene)) {
            vs.defines.push('CLAMPED_TO_GROUND');
          }
          this._sp = ShaderProgram.replaceCache({
            context: context,
            shaderProgram: this._sp,
            vertexShaderSource: vs,
            fragmentShaderSource: BillboardCollectionFS,
            attributeLocations: attributeLocations
          });
          this._compiledShaderRotation = this._shaderRotation;
          this._compiledShaderAlignedAxis = this._shaderAlignedAxis;
          this._compiledShaderScaleByDistance = this._shaderScaleByDistance;
          this._compiledShaderTranslucencyByDistance = this._shaderTranslucencyByDistance;
          this._compiledShaderPixelOffsetScaleByDistance = this._shaderPixelOffsetScaleByDistance;
        }
        va = this._vaf.va;
        vaLength = va.length;
        colorList.length = vaLength;
        for (j = 0; j < vaLength; ++j) {
          command = colorList[j];
          if (!defined(command)) {
            command = colorList[j] = new DrawCommand({
              pass: Pass.OPAQUE,
              owner: this
            });
          }
          command.boundingVolume = boundingVolume;
          command.modelMatrix = modelMatrix;
          command.count = va[j].indicesCount;
          command.shaderProgram = this._sp;
          command.uniformMap = this._uniforms;
          command.vertexArray = va[j].va;
          command.renderState = this._rs;
          command.debugShowBoundingVolume = this.debugShowBoundingVolume;
          if (this._instanced) {
            command.count = 6;
            command.instanceCount = billboardsLength;
          }
          commandList.push(command);
        }
      }
      if (picking) {
        var pickList = this._pickCommands;
        if (!defined(this._spPick) || (this._shaderRotation !== this._compiledShaderRotationPick) || (this._shaderAlignedAxis !== this._compiledShaderAlignedAxisPick) || (this._shaderScaleByDistance !== this._compiledShaderScaleByDistancePick) || (this._shaderTranslucencyByDistance !== this._compiledShaderTranslucencyByDistancePick) || (this._shaderPixelOffsetScaleByDistance !== this._compiledShaderPixelOffsetScaleByDistancePick)) {
          vs = new ShaderSource({
            defines: ['RENDER_FOR_PICK'],
            sources: [BillboardCollectionVS]
          });
          if (this._instanced) {
            vs.defines.push('INSTANCED');
          }
          if (this._shaderRotation) {
            vs.defines.push('ROTATION');
          }
          if (this._shaderAlignedAxis) {
            vs.defines.push('ALIGNED_AXIS');
          }
          if (this._shaderScaleByDistance) {
            vs.defines.push('EYE_DISTANCE_SCALING');
          }
          if (this._shaderTranslucencyByDistance) {
            vs.defines.push('EYE_DISTANCE_TRANSLUCENCY');
          }
          if (this._shaderPixelOffsetScaleByDistance) {
            vs.defines.push('EYE_DISTANCE_PIXEL_OFFSET');
          }
          if (defined(this._scene)) {
            vs.defines.push('CLAMPED_TO_GROUND');
          }
          fs = new ShaderSource({
            defines: ['RENDER_FOR_PICK'],
            sources: [BillboardCollectionFS]
          });
          this._spPick = ShaderProgram.replaceCache({
            context: context,
            shaderProgram: this._spPick,
            vertexShaderSource: vs,
            fragmentShaderSource: fs,
            attributeLocations: attributeLocations
          });
          this._compiledShaderRotationPick = this._shaderRotation;
          this._compiledShaderAlignedAxisPick = this._shaderAlignedAxis;
          this._compiledShaderScaleByDistancePick = this._shaderScaleByDistance;
          this._compiledShaderTranslucencyByDistancePick = this._shaderTranslucencyByDistance;
          this._compiledShaderPixelOffsetScaleByDistancePick = this._shaderPixelOffsetScaleByDistance;
        }
        va = this._vaf.va;
        vaLength = va.length;
        pickList.length = vaLength;
        for (j = 0; j < vaLength; ++j) {
          command = pickList[j];
          if (!defined(command)) {
            command = pickList[j] = new DrawCommand({
              pass: Pass.OPAQUE,
              owner: this
            });
          }
          command.boundingVolume = boundingVolume;
          command.modelMatrix = modelMatrix;
          command.count = va[j].indicesCount;
          command.shaderProgram = this._spPick;
          command.uniformMap = this._uniforms;
          command.vertexArray = va[j].va;
          command.renderState = this._rs;
          if (this._instanced) {
            command.count = 6;
            command.instanceCount = billboardsLength;
          }
          commandList.push(command);
        }
      }
    };
    BillboardCollection.prototype.isDestroyed = function() {
      return false;
    };
    BillboardCollection.prototype.destroy = function() {
      this._textureAtlas = this._destroyTextureAtlas && this._textureAtlas && this._textureAtlas.destroy();
      this._sp = this._sp && this._sp.destroy();
      this._spPick = this._spPick && this._spPick.destroy();
      this._vaf = this._vaf && this._vaf.destroy();
      destroyBillboards(this._billboards);
      return destroyObject(this);
    };
    return BillboardCollection;
  });
})(require('buffer').Buffer);
