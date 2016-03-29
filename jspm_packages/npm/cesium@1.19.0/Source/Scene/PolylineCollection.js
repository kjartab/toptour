/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/BoundingSphere', '../Core/Cartesian3', '../Core/Cartesian4', '../Core/Cartographic', '../Core/Color', '../Core/ComponentDatatype', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/DeveloperError', '../Core/EncodedCartesian3', '../Core/IndexDatatype', '../Core/Intersect', '../Core/Math', '../Core/Matrix4', '../Core/Plane', '../Renderer/Buffer', '../Renderer/BufferUsage', '../Renderer/DrawCommand', '../Renderer/RenderState', '../Renderer/ShaderProgram', '../Renderer/ShaderSource', '../Renderer/VertexArray', '../Shaders/PolylineCommon', '../Shaders/PolylineFS', '../Shaders/PolylineVS', './BlendingState', './Material', './Pass', './Polyline', './SceneMode'], function(BoundingSphere, Cartesian3, Cartesian4, Cartographic, Color, ComponentDatatype, defaultValue, defined, defineProperties, destroyObject, DeveloperError, EncodedCartesian3, IndexDatatype, Intersect, CesiumMath, Matrix4, Plane, Buffer, BufferUsage, DrawCommand, RenderState, ShaderProgram, ShaderSource, VertexArray, PolylineCommon, PolylineFS, PolylineVS, BlendingState, Material, Pass, Polyline, SceneMode) {
    'use strict';
    var SHOW_INDEX = Polyline.SHOW_INDEX;
    var WIDTH_INDEX = Polyline.WIDTH_INDEX;
    var POSITION_INDEX = Polyline.POSITION_INDEX;
    var MATERIAL_INDEX = Polyline.MATERIAL_INDEX;
    var POSITION_SIZE_INDEX = Polyline.POSITION_SIZE_INDEX;
    var NUMBER_OF_PROPERTIES = Polyline.NUMBER_OF_PROPERTIES;
    var attributeLocations = {
      texCoordExpandWidthAndShow: 0,
      position3DHigh: 1,
      position3DLow: 2,
      position2DHigh: 3,
      position2DLow: 4,
      prevPosition3DHigh: 5,
      prevPosition3DLow: 6,
      prevPosition2DHigh: 7,
      prevPosition2DLow: 8,
      nextPosition3DHigh: 9,
      nextPosition3DLow: 10,
      nextPosition2DHigh: 11,
      nextPosition2DLow: 12,
      pickColor: 13
    };
    function PolylineCollection(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
      this._modelMatrix = Matrix4.clone(Matrix4.IDENTITY);
      this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);
      this._opaqueRS = undefined;
      this._translucentRS = undefined;
      this._colorCommands = [];
      this._pickCommands = [];
      this._polylinesUpdated = false;
      this._polylinesRemoved = false;
      this._createVertexArray = false;
      this._propertiesChanged = new Uint32Array(NUMBER_OF_PROPERTIES);
      this._polylines = [];
      this._polylineBuckets = {};
      this._buffersUsage = [{
        bufferUsage: BufferUsage.STATIC_DRAW,
        frameCount: 0
      }, {
        bufferUsage: BufferUsage.STATIC_DRAW,
        frameCount: 0
      }, {
        bufferUsage: BufferUsage.STATIC_DRAW,
        frameCount: 0
      }];
      this._mode = undefined;
      this._polylinesToUpdate = [];
      this._vertexArrays = [];
      this._positionBuffer = undefined;
      this._pickColorBuffer = undefined;
      this._texCoordExpandWidthAndShowBuffer = undefined;
    }
    defineProperties(PolylineCollection.prototype, {length: {get: function() {
          removePolylines(this);
          return this._polylines.length;
        }}});
    PolylineCollection.prototype.add = function(polyline) {
      var p = new Polyline(polyline, this);
      p._index = this._polylines.length;
      this._polylines.push(p);
      this._createVertexArray = true;
      return p;
    };
    PolylineCollection.prototype.remove = function(polyline) {
      if (this.contains(polyline)) {
        this._polylines[polyline._index] = undefined;
        this._polylinesRemoved = true;
        this._createVertexArray = true;
        if (defined(polyline._bucket)) {
          var bucket = polyline._bucket;
          bucket.shaderProgram = bucket.shaderProgram && bucket.shaderProgram.destroy();
          bucket.pickShaderProgram = bucket.pickShaderProgram && bucket.pickShaderProgram.destroy();
        }
        polyline._destroy();
        return true;
      }
      return false;
    };
    PolylineCollection.prototype.removeAll = function() {
      releaseShaders(this);
      destroyPolylines(this);
      this._polylineBuckets = {};
      this._polylinesRemoved = false;
      this._polylines.length = 0;
      this._polylinesToUpdate.length = 0;
      this._createVertexArray = true;
    };
    PolylineCollection.prototype.contains = function(polyline) {
      return defined(polyline) && polyline._polylineCollection === this;
    };
    PolylineCollection.prototype.get = function(index) {
      if (!defined(index)) {
        throw new DeveloperError('index is required.');
      }
      removePolylines(this);
      return this._polylines[index];
    };
    PolylineCollection.prototype.update = function(frameState, commandList) {
      removePolylines(this);
      if (this._polylines.length === 0) {
        return;
      }
      updateMode(this, frameState);
      var context = frameState.context;
      var projection = frameState.mapProjection;
      var polyline;
      var properties = this._propertiesChanged;
      if (this._createVertexArray || computeNewBuffersUsage(this)) {
        createVertexArrays(this, context, projection);
      } else if (this._polylinesUpdated) {
        var polylinesToUpdate = this._polylinesToUpdate;
        if (this._mode !== SceneMode.SCENE3D) {
          var updateLength = polylinesToUpdate.length;
          for (var i = 0; i < updateLength; ++i) {
            polyline = polylinesToUpdate[i];
            polyline.update();
          }
        }
        if (properties[POSITION_SIZE_INDEX] || properties[MATERIAL_INDEX]) {
          createVertexArrays(this, context, projection);
        } else {
          var length = polylinesToUpdate.length;
          var polylineBuckets = this._polylineBuckets;
          for (var ii = 0; ii < length; ++ii) {
            polyline = polylinesToUpdate[ii];
            properties = polyline._propertiesChanged;
            var bucket = polyline._bucket;
            var index = 0;
            for (var x in polylineBuckets) {
              if (polylineBuckets.hasOwnProperty(x)) {
                if (polylineBuckets[x] === bucket) {
                  if (properties[POSITION_INDEX] || properties[SHOW_INDEX] || properties[WIDTH_INDEX]) {
                    bucket.writeUpdate(index, polyline, this._positionBuffer, this._texCoordExpandWidthAndShowBuffer, projection);
                  }
                  break;
                }
                index += polylineBuckets[x].lengthOfPositions;
              }
            }
            polyline._clean();
          }
        }
        polylinesToUpdate.length = 0;
        this._polylinesUpdated = false;
      }
      properties = this._propertiesChanged;
      for (var k = 0; k < NUMBER_OF_PROPERTIES; ++k) {
        properties[k] = 0;
      }
      var modelMatrix = Matrix4.IDENTITY;
      if (frameState.mode === SceneMode.SCENE3D) {
        modelMatrix = this.modelMatrix;
      }
      var pass = frameState.passes;
      var useDepthTest = (frameState.morphTime !== 0.0);
      if (!defined(this._opaqueRS) || this._opaqueRS.depthTest.enabled !== useDepthTest) {
        this._opaqueRS = RenderState.fromCache({
          depthMask: useDepthTest,
          depthTest: {enabled: useDepthTest}
        });
      }
      if (!defined(this._translucentRS) || this._translucentRS.depthTest.enabled !== useDepthTest) {
        this._translucentRS = RenderState.fromCache({
          blending: BlendingState.ALPHA_BLEND,
          depthMask: !useDepthTest,
          depthTest: {enabled: useDepthTest}
        });
      }
      if (pass.render) {
        var colorList = this._colorCommands;
        createCommandLists(this, frameState, colorList, modelMatrix, true);
      }
      if (pass.pick) {
        var pickList = this._pickCommands;
        createCommandLists(this, frameState, pickList, modelMatrix, false);
      }
    };
    var boundingSphereScratch = new BoundingSphere();
    var boundingSphereScratch2 = new BoundingSphere();
    function createCommandLists(polylineCollection, frameState, commands, modelMatrix, renderPass) {
      var context = frameState.context;
      var commandList = frameState.commandList;
      var commandsLength = commands.length;
      var commandIndex = 0;
      var cloneBoundingSphere = true;
      var vertexArrays = polylineCollection._vertexArrays;
      var debugShowBoundingVolume = polylineCollection.debugShowBoundingVolume;
      var length = vertexArrays.length;
      for (var m = 0; m < length; ++m) {
        var va = vertexArrays[m];
        var buckets = va.buckets;
        var bucketLength = buckets.length;
        for (var n = 0; n < bucketLength; ++n) {
          var bucketLocator = buckets[n];
          var offset = bucketLocator.offset;
          var sp = renderPass ? bucketLocator.bucket.shaderProgram : bucketLocator.bucket.pickShaderProgram;
          var polylines = bucketLocator.bucket.polylines;
          var polylineLength = polylines.length;
          var currentId;
          var currentMaterial;
          var count = 0;
          var command;
          for (var s = 0; s < polylineLength; ++s) {
            var polyline = polylines[s];
            var mId = createMaterialId(polyline._material);
            if (mId !== currentId) {
              if (defined(currentId) && count > 0) {
                var translucent = currentMaterial.isTranslucent();
                if (commandIndex >= commandsLength) {
                  command = new DrawCommand({owner: polylineCollection});
                  commands.push(command);
                } else {
                  command = commands[commandIndex];
                }
                ++commandIndex;
                command.boundingVolume = BoundingSphere.clone(boundingSphereScratch, command.boundingVolume);
                command.modelMatrix = modelMatrix;
                command.shaderProgram = sp;
                command.vertexArray = va.va;
                command.renderState = translucent ? polylineCollection._translucentRS : polylineCollection._opaqueRS;
                command.pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;
                command.debugShowBoundingVolume = renderPass ? debugShowBoundingVolume : false;
                command.uniformMap = currentMaterial._uniforms;
                command.count = count;
                command.offset = offset;
                offset += count;
                count = 0;
                cloneBoundingSphere = true;
                commandList.push(command);
              }
              currentMaterial = polyline._material;
              currentMaterial.update(context);
              currentId = mId;
            }
            var locators = polyline._locatorBuckets;
            var locatorLength = locators.length;
            for (var t = 0; t < locatorLength; ++t) {
              var locator = locators[t];
              if (locator.locator === bucketLocator) {
                count += locator.count;
              }
            }
            var boundingVolume;
            if (frameState.mode === SceneMode.SCENE3D) {
              boundingVolume = polyline._boundingVolumeWC;
            } else if (frameState.mode === SceneMode.COLUMBUS_VIEW) {
              boundingVolume = polyline._boundingVolume2D;
            } else if (frameState.mode === SceneMode.SCENE2D) {
              if (defined(polyline._boundingVolume2D)) {
                boundingVolume = BoundingSphere.clone(polyline._boundingVolume2D, boundingSphereScratch2);
                boundingVolume.center.x = 0.0;
              }
            } else if (defined(polyline._boundingVolumeWC) && defined(polyline._boundingVolume2D)) {
              boundingVolume = BoundingSphere.union(polyline._boundingVolumeWC, polyline._boundingVolume2D, boundingSphereScratch2);
            }
            if (cloneBoundingSphere) {
              cloneBoundingSphere = false;
              BoundingSphere.clone(boundingVolume, boundingSphereScratch);
            } else {
              BoundingSphere.union(boundingVolume, boundingSphereScratch, boundingSphereScratch);
            }
          }
          if (defined(currentId) && count > 0) {
            if (commandIndex >= commandsLength) {
              command = new DrawCommand({owner: polylineCollection});
              commands.push(command);
            } else {
              command = commands[commandIndex];
            }
            ++commandIndex;
            command.boundingVolume = BoundingSphere.clone(boundingSphereScratch, command.boundingVolume);
            command.modelMatrix = modelMatrix;
            command.shaderProgram = sp;
            command.vertexArray = va.va;
            command.renderState = currentMaterial.isTranslucent() ? polylineCollection._translucentRS : polylineCollection._opaqueRS;
            command.pass = currentMaterial.isTranslucent() ? Pass.TRANSLUCENT : Pass.OPAQUE;
            command.debugShowBoundingVolume = renderPass ? debugShowBoundingVolume : false;
            command.uniformMap = currentMaterial._uniforms;
            command.count = count;
            command.offset = offset;
            cloneBoundingSphere = true;
            commandList.push(command);
          }
          currentId = undefined;
        }
      }
      commands.length = commandIndex;
    }
    PolylineCollection.prototype.isDestroyed = function() {
      return false;
    };
    PolylineCollection.prototype.destroy = function() {
      destroyVertexArrays(this);
      releaseShaders(this);
      destroyPolylines(this);
      return destroyObject(this);
    };
    function computeNewBuffersUsage(collection) {
      var buffersUsage = collection._buffersUsage;
      var usageChanged = false;
      var properties = collection._propertiesChanged;
      for (var k = 0; k < NUMBER_OF_PROPERTIES - 2; ++k) {
        var bufferUsage = buffersUsage[k];
        if (properties[k]) {
          if (bufferUsage.bufferUsage !== BufferUsage.STREAM_DRAW) {
            usageChanged = true;
            bufferUsage.bufferUsage = BufferUsage.STREAM_DRAW;
            bufferUsage.frameCount = 100;
          } else {
            bufferUsage.frameCount = 100;
          }
        } else {
          if (bufferUsage.bufferUsage !== BufferUsage.STATIC_DRAW) {
            if (bufferUsage.frameCount === 0) {
              usageChanged = true;
              bufferUsage.bufferUsage = BufferUsage.STATIC_DRAW;
            } else {
              bufferUsage.frameCount--;
            }
          }
        }
      }
      return usageChanged;
    }
    var emptyVertexBuffer = [0.0, 0.0, 0.0];
    function createVertexArrays(collection, context, projection) {
      collection._createVertexArray = false;
      releaseShaders(collection);
      destroyVertexArrays(collection);
      sortPolylinesIntoBuckets(collection);
      var totalIndices = [[]];
      var indices = totalIndices[0];
      var vertexBufferOffset = [0];
      var offset = 0;
      var vertexArrayBuckets = [[]];
      var totalLength = 0;
      var polylineBuckets = collection._polylineBuckets;
      var x;
      var bucket;
      for (x in polylineBuckets) {
        if (polylineBuckets.hasOwnProperty(x)) {
          bucket = polylineBuckets[x];
          bucket.updateShader(context);
          totalLength += bucket.lengthOfPositions;
        }
      }
      if (totalLength > 0) {
        var mode = collection._mode;
        var positionArray = new Float32Array(6 * totalLength * 3);
        var pickColorArray = new Uint8Array(totalLength * 4);
        var texCoordExpandWidthAndShowArray = new Float32Array(totalLength * 4);
        var position3DArray;
        var positionIndex = 0;
        var colorIndex = 0;
        var texCoordExpandWidthAndShowIndex = 0;
        for (x in polylineBuckets) {
          if (polylineBuckets.hasOwnProperty(x)) {
            bucket = polylineBuckets[x];
            bucket.write(positionArray, pickColorArray, texCoordExpandWidthAndShowArray, positionIndex, colorIndex, texCoordExpandWidthAndShowIndex, context, projection);
            if (mode === SceneMode.MORPHING) {
              if (!defined(position3DArray)) {
                position3DArray = new Float32Array(6 * totalLength * 3);
              }
              bucket.writeForMorph(position3DArray, positionIndex);
            }
            var bucketLength = bucket.lengthOfPositions;
            positionIndex += 6 * bucketLength * 3;
            colorIndex += bucketLength * 4;
            texCoordExpandWidthAndShowIndex += bucketLength * 4;
            offset = bucket.updateIndices(totalIndices, vertexBufferOffset, vertexArrayBuckets, offset);
          }
        }
        var positionBufferUsage = collection._buffersUsage[POSITION_INDEX].bufferUsage;
        var showBufferUsage = collection._buffersUsage[SHOW_INDEX].bufferUsage;
        var widthBufferUsage = collection._buffersUsage[WIDTH_INDEX].bufferUsage;
        var texCoordExpandWidthAndShowBufferUsage = (showBufferUsage === BufferUsage.STREAM_DRAW || widthBufferUsage === BufferUsage.STREAM_DRAW) ? BufferUsage.STREAM_DRAW : BufferUsage.STATIC_DRAW;
        collection._positionBuffer = Buffer.createVertexBuffer({
          context: context,
          typedArray: positionArray,
          usage: positionBufferUsage
        });
        var position3DBuffer;
        if (defined(position3DArray)) {
          position3DBuffer = Buffer.createVertexBuffer({
            context: context,
            typedArray: position3DArray,
            usage: positionBufferUsage
          });
        }
        collection._pickColorBuffer = Buffer.createVertexBuffer({
          context: context,
          typedArray: pickColorArray,
          usage: BufferUsage.STATIC_DRAW
        });
        collection._texCoordExpandWidthAndShowBuffer = Buffer.createVertexBuffer({
          context: context,
          typedArray: texCoordExpandWidthAndShowArray,
          usage: texCoordExpandWidthAndShowBufferUsage
        });
        var pickColorSizeInBytes = 4 * Uint8Array.BYTES_PER_ELEMENT;
        var positionSizeInBytes = 3 * Float32Array.BYTES_PER_ELEMENT;
        var texCoordExpandWidthAndShowSizeInBytes = 4 * Float32Array.BYTES_PER_ELEMENT;
        var vbo = 0;
        var numberOfIndicesArrays = totalIndices.length;
        for (var k = 0; k < numberOfIndicesArrays; ++k) {
          indices = totalIndices[k];
          if (indices.length > 0) {
            var indicesArray = new Uint16Array(indices);
            var indexBuffer = Buffer.createIndexBuffer({
              context: context,
              typedArray: indicesArray,
              usage: BufferUsage.STATIC_DRAW,
              indexDatatype: IndexDatatype.UNSIGNED_SHORT
            });
            vbo += vertexBufferOffset[k];
            var positionHighOffset = 6 * (k * (positionSizeInBytes * CesiumMath.SIXTY_FOUR_KILOBYTES) - vbo * positionSizeInBytes);
            var positionLowOffset = positionSizeInBytes + positionHighOffset;
            var prevPositionHighOffset = positionSizeInBytes + positionLowOffset;
            var prevPositionLowOffset = positionSizeInBytes + prevPositionHighOffset;
            var nextPositionHighOffset = positionSizeInBytes + prevPositionLowOffset;
            var nextPositionLowOffset = positionSizeInBytes + nextPositionHighOffset;
            var vertexPickColorBufferOffset = k * (pickColorSizeInBytes * CesiumMath.SIXTY_FOUR_KILOBYTES) - vbo * pickColorSizeInBytes;
            var vertexTexCoordExpandWidthAndShowBufferOffset = k * (texCoordExpandWidthAndShowSizeInBytes * CesiumMath.SIXTY_FOUR_KILOBYTES) - vbo * texCoordExpandWidthAndShowSizeInBytes;
            var attributes = [{
              index: attributeLocations.position3DHigh,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: positionHighOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.position3DLow,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: positionLowOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.position2DHigh,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: positionHighOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.position2DLow,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: positionLowOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.prevPosition3DHigh,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: prevPositionHighOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.prevPosition3DLow,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: prevPositionLowOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.prevPosition2DHigh,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: prevPositionHighOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.prevPosition2DLow,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: prevPositionLowOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.nextPosition3DHigh,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: nextPositionHighOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.nextPosition3DLow,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: nextPositionLowOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.nextPosition2DHigh,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: nextPositionHighOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.nextPosition2DLow,
              componentsPerAttribute: 3,
              componentDatatype: ComponentDatatype.FLOAT,
              offsetInBytes: nextPositionLowOffset,
              strideInBytes: 6 * positionSizeInBytes
            }, {
              index: attributeLocations.texCoordExpandWidthAndShow,
              componentsPerAttribute: 4,
              componentDatatype: ComponentDatatype.FLOAT,
              vertexBuffer: collection._texCoordExpandWidthAndShowBuffer,
              offsetInBytes: vertexTexCoordExpandWidthAndShowBufferOffset
            }, {
              index: attributeLocations.pickColor,
              componentsPerAttribute: 4,
              componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
              vertexBuffer: collection._pickColorBuffer,
              offsetInBytes: vertexPickColorBufferOffset,
              normalize: true
            }];
            var buffer3D;
            var bufferProperty3D;
            var buffer2D;
            var bufferProperty2D;
            if (mode === SceneMode.SCENE3D) {
              buffer3D = collection._positionBuffer;
              bufferProperty3D = 'vertexBuffer';
              buffer2D = emptyVertexBuffer;
              bufferProperty2D = 'value';
            } else if (mode === SceneMode.SCENE2D || mode === SceneMode.COLUMBUS_VIEW) {
              buffer3D = emptyVertexBuffer;
              bufferProperty3D = 'value';
              buffer2D = collection._positionBuffer;
              bufferProperty2D = 'vertexBuffer';
            } else {
              buffer3D = position3DBuffer;
              bufferProperty3D = 'vertexBuffer';
              buffer2D = collection._positionBuffer;
              bufferProperty2D = 'vertexBuffer';
            }
            attributes[0][bufferProperty3D] = buffer3D;
            attributes[1][bufferProperty3D] = buffer3D;
            attributes[2][bufferProperty2D] = buffer2D;
            attributes[3][bufferProperty2D] = buffer2D;
            attributes[4][bufferProperty3D] = buffer3D;
            attributes[5][bufferProperty3D] = buffer3D;
            attributes[6][bufferProperty2D] = buffer2D;
            attributes[7][bufferProperty2D] = buffer2D;
            attributes[8][bufferProperty3D] = buffer3D;
            attributes[9][bufferProperty3D] = buffer3D;
            attributes[10][bufferProperty2D] = buffer2D;
            attributes[11][bufferProperty2D] = buffer2D;
            var va = new VertexArray({
              context: context,
              attributes: attributes,
              indexBuffer: indexBuffer
            });
            collection._vertexArrays.push({
              va: va,
              buckets: vertexArrayBuckets[k]
            });
          }
        }
      }
    }
    var scratchUniformArray = [];
    function createMaterialId(material) {
      var uniforms = Material._uniformList[material.type];
      var length = uniforms.length;
      scratchUniformArray.length = 2.0 * length;
      var index = 0;
      for (var i = 0; i < length; ++i) {
        var uniform = uniforms[i];
        scratchUniformArray[index] = uniform;
        scratchUniformArray[index + 1] = material._uniforms[uniform]();
        index += 2;
      }
      return material.type + ':' + JSON.stringify(scratchUniformArray);
    }
    function sortPolylinesIntoBuckets(collection) {
      var mode = collection._mode;
      var modelMatrix = collection._modelMatrix;
      var polylineBuckets = collection._polylineBuckets = {};
      var polylines = collection._polylines;
      var length = polylines.length;
      for (var i = 0; i < length; ++i) {
        var p = polylines[i];
        if (p._actualPositions.length > 1) {
          p.update();
          var material = p.material;
          var value = polylineBuckets[material.type];
          if (!defined(value)) {
            value = polylineBuckets[material.type] = new PolylineBucket(material, mode, modelMatrix);
          }
          value.addPolyline(p);
        }
      }
    }
    function updateMode(collection, frameState) {
      var mode = frameState.mode;
      if (collection._mode !== mode || (!Matrix4.equals(collection._modelMatrix, collection.modelMatrix))) {
        collection._mode = mode;
        collection._modelMatrix = Matrix4.clone(collection.modelMatrix);
        collection._createVertexArray = true;
      }
    }
    function removePolylines(collection) {
      if (collection._polylinesRemoved) {
        collection._polylinesRemoved = false;
        var polylines = [];
        var length = collection._polylines.length;
        for (var i = 0,
            j = 0; i < length; ++i) {
          var polyline = collection._polylines[i];
          if (defined(polyline)) {
            polyline._index = j++;
            polylines.push(polyline);
          }
        }
        collection._polylines = polylines;
      }
    }
    function releaseShaders(collection) {
      var polylines = collection._polylines;
      var length = polylines.length;
      for (var i = 0; i < length; ++i) {
        if (defined(polylines[i])) {
          var bucket = polylines[i]._bucket;
          if (defined(bucket)) {
            bucket.shaderProgram = bucket.shaderProgram && bucket.shaderProgram.destroy();
          }
        }
      }
    }
    function destroyVertexArrays(collection) {
      var length = collection._vertexArrays.length;
      for (var t = 0; t < length; ++t) {
        collection._vertexArrays[t].va.destroy();
      }
      collection._vertexArrays.length = 0;
    }
    PolylineCollection.prototype._updatePolyline = function(polyline, propertyChanged) {
      this._polylinesUpdated = true;
      this._polylinesToUpdate.push(polyline);
      ++this._propertiesChanged[propertyChanged];
    };
    function destroyPolylines(collection) {
      var polylines = collection._polylines;
      var length = polylines.length;
      for (var i = 0; i < length; ++i) {
        if (defined(polylines[i])) {
          polylines[i]._destroy();
        }
      }
    }
    function VertexArrayBucketLocator(count, offset, bucket) {
      this.count = count;
      this.offset = offset;
      this.bucket = bucket;
    }
    function PolylineBucket(material, mode, modelMatrix) {
      this.polylines = [];
      this.lengthOfPositions = 0;
      this.material = material;
      this.shaderProgram = undefined;
      this.pickShaderProgram = undefined;
      this.mode = mode;
      this.modelMatrix = modelMatrix;
    }
    PolylineBucket.prototype.addPolyline = function(p) {
      var polylines = this.polylines;
      polylines.push(p);
      p._actualLength = this.getPolylinePositionsLength(p);
      this.lengthOfPositions += p._actualLength;
      p._bucket = this;
    };
    PolylineBucket.prototype.updateShader = function(context) {
      if (defined(this.shaderProgram)) {
        return;
      }
      var vs = new ShaderSource({sources: [PolylineCommon, PolylineVS]});
      var fs = new ShaderSource({sources: [this.material.shaderSource, PolylineFS]});
      var fsPick = new ShaderSource({
        sources: fs.sources,
        pickColorQualifier: 'varying'
      });
      this.shaderProgram = ShaderProgram.fromCache({
        context: context,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations
      });
      this.pickShaderProgram = ShaderProgram.fromCache({
        context: context,
        vertexShaderSource: vs,
        fragmentShaderSource: fsPick,
        attributeLocations: attributeLocations
      });
    };
    function intersectsIDL(polyline) {
      return Cartesian3.dot(Cartesian3.UNIT_X, polyline._boundingVolume.center) < 0 || polyline._boundingVolume.intersectPlane(Plane.ORIGIN_ZX_PLANE) === Intersect.INTERSECTING;
    }
    PolylineBucket.prototype.getPolylinePositionsLength = function(polyline) {
      var length;
      if (this.mode === SceneMode.SCENE3D || !intersectsIDL(polyline)) {
        length = polyline._actualPositions.length;
        return length * 4.0 - 4.0;
      }
      var count = 0;
      var segmentLengths = polyline._segments.lengths;
      length = segmentLengths.length;
      for (var i = 0; i < length; ++i) {
        count += segmentLengths[i] * 4.0 - 4.0;
      }
      return count;
    };
    var scratchWritePosition = new Cartesian3();
    var scratchWritePrevPosition = new Cartesian3();
    var scratchWriteNextPosition = new Cartesian3();
    var scratchWriteVector = new Cartesian3();
    PolylineBucket.prototype.write = function(positionArray, pickColorArray, texCoordExpandWidthAndShowArray, positionIndex, colorIndex, texCoordExpandWidthAndShowIndex, context, projection) {
      var mode = this.mode;
      var polylines = this.polylines;
      var length = polylines.length;
      for (var i = 0; i < length; ++i) {
        var polyline = polylines[i];
        var width = polyline.width;
        var show = polyline.show && width > 0.0;
        var segments = this.getSegments(polyline, projection);
        var positions = segments.positions;
        var lengths = segments.lengths;
        var positionsLength = positions.length;
        var pickColor = polyline.getPickId(context).color;
        var segmentIndex = 0;
        var count = 0;
        var position;
        for (var j = 0; j < positionsLength; ++j) {
          if (j === 0) {
            if (polyline._loop) {
              position = positions[positionsLength - 2];
            } else {
              position = scratchWriteVector;
              Cartesian3.subtract(positions[0], positions[1], position);
              Cartesian3.add(positions[0], position, position);
            }
          } else {
            position = positions[j - 1];
          }
          scratchWritePrevPosition.x = position.x;
          scratchWritePrevPosition.y = position.y;
          scratchWritePrevPosition.z = (mode !== SceneMode.SCENE2D) ? position.z : 0.0;
          position = positions[j];
          scratchWritePosition.x = position.x;
          scratchWritePosition.y = position.y;
          scratchWritePosition.z = (mode !== SceneMode.SCENE2D) ? position.z : 0.0;
          if (j === positionsLength - 1) {
            if (polyline._loop) {
              position = positions[1];
            } else {
              position = scratchWriteVector;
              Cartesian3.subtract(positions[positionsLength - 1], positions[positionsLength - 2], position);
              Cartesian3.add(positions[positionsLength - 1], position, position);
            }
          } else {
            position = positions[j + 1];
          }
          scratchWriteNextPosition.x = position.x;
          scratchWriteNextPosition.y = position.y;
          scratchWriteNextPosition.z = (mode !== SceneMode.SCENE2D) ? position.z : 0.0;
          var segmentLength = lengths[segmentIndex];
          if (j === count + segmentLength) {
            count += segmentLength;
            ++segmentIndex;
          }
          var segmentStart = j - count === 0;
          var segmentEnd = j === count + lengths[segmentIndex] - 1;
          var startK = (segmentStart) ? 2 : 0;
          var endK = (segmentEnd) ? 2 : 4;
          for (var k = startK; k < endK; ++k) {
            EncodedCartesian3.writeElements(scratchWritePosition, positionArray, positionIndex);
            EncodedCartesian3.writeElements(scratchWritePrevPosition, positionArray, positionIndex + 6);
            EncodedCartesian3.writeElements(scratchWriteNextPosition, positionArray, positionIndex + 12);
            pickColorArray[colorIndex] = Color.floatToByte(pickColor.red);
            pickColorArray[colorIndex + 1] = Color.floatToByte(pickColor.green);
            pickColorArray[colorIndex + 2] = Color.floatToByte(pickColor.blue);
            pickColorArray[colorIndex + 3] = Color.floatToByte(pickColor.alpha);
            var direction = (k - 2 < 0) ? -1.0 : 1.0;
            texCoordExpandWidthAndShowArray[texCoordExpandWidthAndShowIndex] = j / (positionsLength - 1);
            texCoordExpandWidthAndShowArray[texCoordExpandWidthAndShowIndex + 1] = 2 * (k % 2) - 1;
            texCoordExpandWidthAndShowArray[texCoordExpandWidthAndShowIndex + 2] = direction * width;
            texCoordExpandWidthAndShowArray[texCoordExpandWidthAndShowIndex + 3] = show;
            positionIndex += 6 * 3;
            colorIndex += 4;
            texCoordExpandWidthAndShowIndex += 4;
          }
        }
      }
    };
    var morphPositionScratch = new Cartesian3();
    var morphPrevPositionScratch = new Cartesian3();
    var morphNextPositionScratch = new Cartesian3();
    var morphVectorScratch = new Cartesian3();
    PolylineBucket.prototype.writeForMorph = function(positionArray, positionIndex) {
      var modelMatrix = this.modelMatrix;
      var polylines = this.polylines;
      var length = polylines.length;
      for (var i = 0; i < length; ++i) {
        var polyline = polylines[i];
        var positions = polyline._segments.positions;
        var lengths = polyline._segments.lengths;
        var positionsLength = positions.length;
        var segmentIndex = 0;
        var count = 0;
        for (var j = 0; j < positionsLength; ++j) {
          var prevPosition;
          if (j === 0) {
            if (polyline._loop) {
              prevPosition = positions[positionsLength - 2];
            } else {
              prevPosition = morphVectorScratch;
              Cartesian3.subtract(positions[0], positions[1], prevPosition);
              Cartesian3.add(positions[0], prevPosition, prevPosition);
            }
          } else {
            prevPosition = positions[j - 1];
          }
          prevPosition = Matrix4.multiplyByPoint(modelMatrix, prevPosition, morphPrevPositionScratch);
          var position = Matrix4.multiplyByPoint(modelMatrix, positions[j], morphPositionScratch);
          var nextPosition;
          if (j === positionsLength - 1) {
            if (polyline._loop) {
              nextPosition = positions[1];
            } else {
              nextPosition = morphVectorScratch;
              Cartesian3.subtract(positions[positionsLength - 1], positions[positionsLength - 2], nextPosition);
              Cartesian3.add(positions[positionsLength - 1], nextPosition, nextPosition);
            }
          } else {
            nextPosition = positions[j + 1];
          }
          nextPosition = Matrix4.multiplyByPoint(modelMatrix, nextPosition, morphNextPositionScratch);
          var segmentLength = lengths[segmentIndex];
          if (j === count + segmentLength) {
            count += segmentLength;
            ++segmentIndex;
          }
          var segmentStart = j - count === 0;
          var segmentEnd = j === count + lengths[segmentIndex] - 1;
          var startK = (segmentStart) ? 2 : 0;
          var endK = (segmentEnd) ? 2 : 4;
          for (var k = startK; k < endK; ++k) {
            EncodedCartesian3.writeElements(position, positionArray, positionIndex);
            EncodedCartesian3.writeElements(prevPosition, positionArray, positionIndex + 6);
            EncodedCartesian3.writeElements(nextPosition, positionArray, positionIndex + 12);
            positionIndex += 6 * 3;
          }
        }
      }
    };
    var scratchSegmentLengths = new Array(1);
    PolylineBucket.prototype.updateIndices = function(totalIndices, vertexBufferOffset, vertexArrayBuckets, offset) {
      var vaCount = vertexArrayBuckets.length - 1;
      var bucketLocator = new VertexArrayBucketLocator(0, offset, this);
      vertexArrayBuckets[vaCount].push(bucketLocator);
      var count = 0;
      var indices = totalIndices[totalIndices.length - 1];
      var indicesCount = 0;
      if (indices.length > 0) {
        indicesCount = indices[indices.length - 1] + 1;
      }
      var polylines = this.polylines;
      var length = polylines.length;
      for (var i = 0; i < length; ++i) {
        var polyline = polylines[i];
        polyline._locatorBuckets = [];
        var segments;
        if (this.mode === SceneMode.SCENE3D) {
          segments = scratchSegmentLengths;
          var positionsLength = polyline._actualPositions.length;
          if (positionsLength > 0) {
            segments[0] = positionsLength;
          } else {
            continue;
          }
        } else {
          segments = polyline._segments.lengths;
        }
        var numberOfSegments = segments.length;
        if (numberOfSegments > 0) {
          var segmentIndexCount = 0;
          for (var j = 0; j < numberOfSegments; ++j) {
            var segmentLength = segments[j] - 1.0;
            for (var k = 0; k < segmentLength; ++k) {
              if (indicesCount + 4 >= CesiumMath.SIXTY_FOUR_KILOBYTES - 2) {
                polyline._locatorBuckets.push({
                  locator: bucketLocator,
                  count: segmentIndexCount
                });
                segmentIndexCount = 0;
                vertexBufferOffset.push(4);
                indices = [];
                totalIndices.push(indices);
                indicesCount = 0;
                bucketLocator.count = count;
                count = 0;
                offset = 0;
                bucketLocator = new VertexArrayBucketLocator(0, 0, this);
                vertexArrayBuckets[++vaCount] = [bucketLocator];
              }
              indices.push(indicesCount, indicesCount + 2, indicesCount + 1);
              indices.push(indicesCount + 1, indicesCount + 2, indicesCount + 3);
              segmentIndexCount += 6;
              count += 6;
              offset += 6;
              indicesCount += 4;
            }
          }
          polyline._locatorBuckets.push({
            locator: bucketLocator,
            count: segmentIndexCount
          });
          if (indicesCount + 4 >= CesiumMath.SIXTY_FOUR_KILOBYTES - 2) {
            vertexBufferOffset.push(0);
            indices = [];
            totalIndices.push(indices);
            indicesCount = 0;
            bucketLocator.count = count;
            offset = 0;
            count = 0;
            bucketLocator = new VertexArrayBucketLocator(0, 0, this);
            vertexArrayBuckets[++vaCount] = [bucketLocator];
          }
        }
        polyline._clean();
      }
      bucketLocator.count = count;
      return offset;
    };
    PolylineBucket.prototype.getPolylineStartIndex = function(polyline) {
      var polylines = this.polylines;
      var positionIndex = 0;
      var length = polylines.length;
      for (var i = 0; i < length; ++i) {
        var p = polylines[i];
        if (p === polyline) {
          break;
        }
        positionIndex += p._actualLength;
      }
      return positionIndex;
    };
    var scratchSegments = {
      positions: undefined,
      lengths: undefined
    };
    var scratchLengths = new Array(1);
    var pscratch = new Cartesian3();
    var scratchCartographic = new Cartographic();
    PolylineBucket.prototype.getSegments = function(polyline, projection) {
      var positions = polyline._actualPositions;
      if (this.mode === SceneMode.SCENE3D) {
        scratchLengths[0] = positions.length;
        scratchSegments.positions = positions;
        scratchSegments.lengths = scratchLengths;
        return scratchSegments;
      }
      if (intersectsIDL(polyline)) {
        positions = polyline._segments.positions;
      }
      var ellipsoid = projection.ellipsoid;
      var newPositions = [];
      var modelMatrix = this.modelMatrix;
      var length = positions.length;
      var position;
      var p = pscratch;
      for (var n = 0; n < length; ++n) {
        position = positions[n];
        p = Matrix4.multiplyByPoint(modelMatrix, position, p);
        newPositions.push(projection.project(ellipsoid.cartesianToCartographic(p, scratchCartographic)));
      }
      if (newPositions.length > 0) {
        polyline._boundingVolume2D = BoundingSphere.fromPoints(newPositions, polyline._boundingVolume2D);
        var center2D = polyline._boundingVolume2D.center;
        polyline._boundingVolume2D.center = new Cartesian3(center2D.z, center2D.x, center2D.y);
      }
      scratchSegments.positions = newPositions;
      scratchSegments.lengths = polyline._segments.lengths;
      return scratchSegments;
    };
    var scratchPositionsArray;
    var scratchTexCoordArray;
    PolylineBucket.prototype.writeUpdate = function(index, polyline, positionBuffer, texCoordExpandWidthAndShowBuffer, projection) {
      var mode = this.mode;
      var positionsLength = polyline._actualLength;
      if (positionsLength) {
        index += this.getPolylineStartIndex(polyline);
        var positionArray = scratchPositionsArray;
        var texCoordExpandWidthAndShowArray = scratchTexCoordArray;
        var positionsArrayLength = 6 * positionsLength * 3;
        if (!defined(positionArray) || positionArray.length < positionsArrayLength) {
          positionArray = scratchPositionsArray = new Float32Array(positionsArrayLength);
          texCoordExpandWidthAndShowArray = scratchTexCoordArray = new Float32Array(positionsLength * 4);
        } else if (positionArray.length > positionsArrayLength) {
          positionArray = new Float32Array(positionArray.buffer, 0, positionsArrayLength);
          texCoordExpandWidthAndShowArray = new Float32Array(texCoordExpandWidthAndShowArray.buffer, 0, positionsLength * 4);
        }
        var positionIndex = 0;
        var texCoordExpandWidthAndShowIndex = 0;
        var segments = this.getSegments(polyline, projection);
        var positions = segments.positions;
        var lengths = segments.lengths;
        var segmentIndex = 0;
        var count = 0;
        var position;
        var width = polyline.width;
        var show = polyline.show && width > 0.0;
        positionsLength = positions.length;
        for (var i = 0; i < positionsLength; ++i) {
          if (i === 0) {
            if (polyline._loop) {
              position = positions[positionsLength - 2];
            } else {
              position = scratchWriteVector;
              Cartesian3.subtract(positions[0], positions[1], position);
              Cartesian3.add(positions[0], position, position);
            }
          } else {
            position = positions[i - 1];
          }
          scratchWritePrevPosition.x = position.x;
          scratchWritePrevPosition.y = position.y;
          scratchWritePrevPosition.z = (mode !== SceneMode.SCENE2D) ? position.z : 0.0;
          position = positions[i];
          scratchWritePosition.x = position.x;
          scratchWritePosition.y = position.y;
          scratchWritePosition.z = (mode !== SceneMode.SCENE2D) ? position.z : 0.0;
          if (i === positionsLength - 1) {
            if (polyline._loop) {
              position = positions[1];
            } else {
              position = scratchWriteVector;
              Cartesian3.subtract(positions[positionsLength - 1], positions[positionsLength - 2], position);
              Cartesian3.add(positions[positionsLength - 1], position, position);
            }
          } else {
            position = positions[i + 1];
          }
          scratchWriteNextPosition.x = position.x;
          scratchWriteNextPosition.y = position.y;
          scratchWriteNextPosition.z = (mode !== SceneMode.SCENE2D) ? position.z : 0.0;
          var segmentLength = lengths[segmentIndex];
          if (i === count + segmentLength) {
            count += segmentLength;
            ++segmentIndex;
          }
          var segmentStart = i - count === 0;
          var segmentEnd = i === count + lengths[segmentIndex] - 1;
          var startJ = (segmentStart) ? 2 : 0;
          var endJ = (segmentEnd) ? 2 : 4;
          for (var j = startJ; j < endJ; ++j) {
            EncodedCartesian3.writeElements(scratchWritePosition, positionArray, positionIndex);
            EncodedCartesian3.writeElements(scratchWritePrevPosition, positionArray, positionIndex + 6);
            EncodedCartesian3.writeElements(scratchWriteNextPosition, positionArray, positionIndex + 12);
            var direction = (j - 2 < 0) ? -1.0 : 1.0;
            texCoordExpandWidthAndShowArray[texCoordExpandWidthAndShowIndex] = i / (positionsLength - 1);
            texCoordExpandWidthAndShowArray[texCoordExpandWidthAndShowIndex + 1] = 2 * (j % 2) - 1;
            texCoordExpandWidthAndShowArray[texCoordExpandWidthAndShowIndex + 2] = direction * width;
            texCoordExpandWidthAndShowArray[texCoordExpandWidthAndShowIndex + 3] = show;
            positionIndex += 6 * 3;
            texCoordExpandWidthAndShowIndex += 4;
          }
        }
        positionBuffer.copyFromArrayView(positionArray, 6 * 3 * Float32Array.BYTES_PER_ELEMENT * index);
        texCoordExpandWidthAndShowBuffer.copyFromArrayView(texCoordExpandWidthAndShowArray, 4 * Float32Array.BYTES_PER_ELEMENT * index);
      }
    };
    return PolylineCollection;
  });
})(require('buffer').Buffer);
