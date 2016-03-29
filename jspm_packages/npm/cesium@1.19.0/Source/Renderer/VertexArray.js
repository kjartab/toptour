/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/ComponentDatatype', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/DeveloperError', '../Core/Geometry', '../Core/IndexDatatype', '../Core/Math', '../Core/RuntimeError', './Buffer', './BufferUsage', './ContextLimits'], function(ComponentDatatype, defaultValue, defined, defineProperties, destroyObject, DeveloperError, Geometry, IndexDatatype, CesiumMath, RuntimeError, Buffer, BufferUsage, ContextLimits) {
    'use strict';
    function addAttribute(attributes, attribute, index, context) {
      var hasVertexBuffer = defined(attribute.vertexBuffer);
      var hasValue = defined(attribute.value);
      var componentsPerAttribute = attribute.value ? attribute.value.length : attribute.componentsPerAttribute;
      if (!hasVertexBuffer && !hasValue) {
        throw new DeveloperError('attribute must have a vertexBuffer or a value.');
      }
      if (hasVertexBuffer && hasValue) {
        throw new DeveloperError('attribute cannot have both a vertexBuffer and a value.  It must have either a vertexBuffer property defining per-vertex data or a value property defining data for all vertices.');
      }
      if ((componentsPerAttribute !== 1) && (componentsPerAttribute !== 2) && (componentsPerAttribute !== 3) && (componentsPerAttribute !== 4)) {
        if (hasValue) {
          throw new DeveloperError('attribute.value.length must be in the range [1, 4].');
        }
        throw new DeveloperError('attribute.componentsPerAttribute must be in the range [1, 4].');
      }
      if (defined(attribute.componentDatatype) && !ComponentDatatype.validate(attribute.componentDatatype)) {
        throw new DeveloperError('attribute must have a valid componentDatatype or not specify it.');
      }
      if (defined(attribute.strideInBytes) && (attribute.strideInBytes > 255)) {
        throw new DeveloperError('attribute must have a strideInBytes less than or equal to 255 or not specify it.');
      }
      if (defined(attribute.instanceDivisor) && (attribute.instanceDivisor > 0) && !context.instancedArrays) {
        throw new DeveloperError('instanced arrays is not supported');
      }
      if (defined(attribute.instanceDivisor) && (attribute.instanceDivisor < 0)) {
        throw new DeveloperError('attribute must have an instanceDivisor greater than or equal to zero');
      }
      if (defined(attribute.instanceDivisor) && hasValue) {
        throw new DeveloperError('attribute cannot have have an instanceDivisor if it is not backed by a buffer');
      }
      if (defined(attribute.instanceDivisor) && (attribute.instanceDivisor > 0) && (attribute.index === 0)) {
        throw new DeveloperError('attribute zero cannot have an instanceDivisor greater than 0');
      }
      var attr = {
        index: defaultValue(attribute.index, index),
        enabled: defaultValue(attribute.enabled, true),
        vertexBuffer: attribute.vertexBuffer,
        value: hasValue ? attribute.value.slice(0) : undefined,
        componentsPerAttribute: componentsPerAttribute,
        componentDatatype: defaultValue(attribute.componentDatatype, ComponentDatatype.FLOAT),
        normalize: defaultValue(attribute.normalize, false),
        offsetInBytes: defaultValue(attribute.offsetInBytes, 0),
        strideInBytes: defaultValue(attribute.strideInBytes, 0),
        instanceDivisor: defaultValue(attribute.instanceDivisor, 0)
      };
      if (hasVertexBuffer) {
        attr.vertexAttrib = function(gl) {
          var index = this.index;
          gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer._getBuffer());
          gl.vertexAttribPointer(index, this.componentsPerAttribute, this.componentDatatype, this.normalize, this.strideInBytes, this.offsetInBytes);
          gl.enableVertexAttribArray(index);
          if (this.instanceDivisor > 0) {
            context.glVertexAttribDivisor(index, this.instanceDivisor);
            context._vertexAttribDivisors[index] = this.instanceDivisor;
            context._previousDrawInstanced = true;
          }
        };
        attr.disableVertexAttribArray = function(gl) {
          gl.disableVertexAttribArray(this.index);
          if (this.instanceDivisor > 0) {
            context.glVertexAttribDivisor(index, 0);
          }
        };
      } else {
        switch (attr.componentsPerAttribute) {
          case 1:
            attr.vertexAttrib = function(gl) {
              gl.vertexAttrib1fv(this.index, this.value);
            };
            break;
          case 2:
            attr.vertexAttrib = function(gl) {
              gl.vertexAttrib2fv(this.index, this.value);
            };
            break;
          case 3:
            attr.vertexAttrib = function(gl) {
              gl.vertexAttrib3fv(this.index, this.value);
            };
            break;
          case 4:
            attr.vertexAttrib = function(gl) {
              gl.vertexAttrib4fv(this.index, this.value);
            };
            break;
        }
        attr.disableVertexAttribArray = function(gl) {};
      }
      attributes.push(attr);
    }
    function bind(gl, attributes, indexBuffer) {
      for (var i = 0; i < attributes.length; ++i) {
        var attribute = attributes[i];
        if (attribute.enabled) {
          attribute.vertexAttrib(gl);
        }
      }
      if (defined(indexBuffer)) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer._getBuffer());
      }
    }
    function VertexArray(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      if (!defined(options.context)) {
        throw new DeveloperError('options.context is required.');
      }
      if (!defined(options.attributes)) {
        throw new DeveloperError('options.attributes is required.');
      }
      var context = options.context;
      var gl = context._gl;
      var attributes = options.attributes;
      var indexBuffer = options.indexBuffer;
      var i;
      var vaAttributes = [];
      var numberOfVertices = 1;
      var hasInstancedAttributes = false;
      var length = attributes.length;
      for (i = 0; i < length; ++i) {
        addAttribute(vaAttributes, attributes[i], i, context);
      }
      length = vaAttributes.length;
      for (i = 0; i < length; ++i) {
        var attribute = vaAttributes[i];
        if (defined(attribute.vertexBuffer) && (attribute.instanceDivisor === 0)) {
          var bytes = attribute.strideInBytes || (attribute.componentsPerAttribute * ComponentDatatype.getSizeInBytes(attribute.componentDatatype));
          numberOfVertices = attribute.vertexBuffer.sizeInBytes / bytes;
          break;
        }
      }
      for (i = 0; i < length; ++i) {
        if (vaAttributes[i].instanceDivisor > 0) {
          hasInstancedAttributes = true;
          break;
        }
      }
      var uniqueIndices = {};
      for (i = 0; i < length; ++i) {
        var index = vaAttributes[i].index;
        if (uniqueIndices[index]) {
          throw new DeveloperError('Index ' + index + ' is used by more than one attribute.');
        }
        uniqueIndices[index] = true;
      }
      var vao;
      if (context.vertexArrayObject) {
        vao = context.glCreateVertexArray();
        context.glBindVertexArray(vao);
        bind(gl, vaAttributes, indexBuffer);
        context.glBindVertexArray(null);
      }
      this._numberOfVertices = numberOfVertices;
      this._hasInstancedAttributes = hasInstancedAttributes;
      this._context = context;
      this._gl = gl;
      this._vao = vao;
      this._attributes = vaAttributes;
      this._indexBuffer = indexBuffer;
    }
    function computeNumberOfVertices(attribute) {
      return attribute.values.length / attribute.componentsPerAttribute;
    }
    function computeAttributeSizeInBytes(attribute) {
      return ComponentDatatype.getSizeInBytes(attribute.componentDatatype) * attribute.componentsPerAttribute;
    }
    function interleaveAttributes(attributes) {
      var j;
      var name;
      var attribute;
      var names = [];
      for (name in attributes) {
        if (attributes.hasOwnProperty(name) && defined(attributes[name]) && defined(attributes[name].values)) {
          names.push(name);
          if (attributes[name].componentDatatype === ComponentDatatype.DOUBLE) {
            attributes[name].componentDatatype = ComponentDatatype.FLOAT;
            attributes[name].values = ComponentDatatype.createTypedArray(ComponentDatatype.FLOAT, attributes[name].values);
          }
        }
      }
      var numberOfVertices;
      var namesLength = names.length;
      if (namesLength > 0) {
        numberOfVertices = computeNumberOfVertices(attributes[names[0]]);
        for (j = 1; j < namesLength; ++j) {
          var currentNumberOfVertices = computeNumberOfVertices(attributes[names[j]]);
          if (currentNumberOfVertices !== numberOfVertices) {
            throw new RuntimeError('Each attribute list must have the same number of vertices.  ' + 'Attribute ' + names[j] + ' has a different number of vertices ' + '(' + currentNumberOfVertices.toString() + ')' + ' than attribute ' + names[0] + ' (' + numberOfVertices.toString() + ').');
          }
        }
      }
      names.sort(function(left, right) {
        return ComponentDatatype.getSizeInBytes(attributes[right].componentDatatype) - ComponentDatatype.getSizeInBytes(attributes[left].componentDatatype);
      });
      var vertexSizeInBytes = 0;
      var offsetsInBytes = {};
      for (j = 0; j < namesLength; ++j) {
        name = names[j];
        attribute = attributes[name];
        offsetsInBytes[name] = vertexSizeInBytes;
        vertexSizeInBytes += computeAttributeSizeInBytes(attribute);
      }
      if (vertexSizeInBytes > 0) {
        var maxComponentSizeInBytes = ComponentDatatype.getSizeInBytes(attributes[names[0]].componentDatatype);
        var remainder = vertexSizeInBytes % maxComponentSizeInBytes;
        if (remainder !== 0) {
          vertexSizeInBytes += (maxComponentSizeInBytes - remainder);
        }
        var vertexBufferSizeInBytes = numberOfVertices * vertexSizeInBytes;
        var buffer = new ArrayBuffer(vertexBufferSizeInBytes);
        var views = {};
        for (j = 0; j < namesLength; ++j) {
          name = names[j];
          var sizeInBytes = ComponentDatatype.getSizeInBytes(attributes[name].componentDatatype);
          views[name] = {
            pointer: ComponentDatatype.createTypedArray(attributes[name].componentDatatype, buffer),
            index: offsetsInBytes[name] / sizeInBytes,
            strideInComponentType: vertexSizeInBytes / sizeInBytes
          };
        }
        for (j = 0; j < numberOfVertices; ++j) {
          for (var n = 0; n < namesLength; ++n) {
            name = names[n];
            attribute = attributes[name];
            var values = attribute.values;
            var view = views[name];
            var pointer = view.pointer;
            var numberOfComponents = attribute.componentsPerAttribute;
            for (var k = 0; k < numberOfComponents; ++k) {
              pointer[view.index + k] = values[(j * numberOfComponents) + k];
            }
            view.index += view.strideInComponentType;
          }
        }
        return {
          buffer: buffer,
          offsetsInBytes: offsetsInBytes,
          vertexSizeInBytes: vertexSizeInBytes
        };
      }
      return undefined;
    }
    VertexArray.fromGeometry = function(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      if (!defined(options.context)) {
        throw new DeveloperError('options.context is required.');
      }
      var context = options.context;
      var geometry = defaultValue(options.geometry, defaultValue.EMPTY_OBJECT);
      var bufferUsage = defaultValue(options.bufferUsage, BufferUsage.DYNAMIC_DRAW);
      var attributeLocations = defaultValue(options.attributeLocations, defaultValue.EMPTY_OBJECT);
      var interleave = defaultValue(options.interleave, false);
      var createdVAAttributes = options.vertexArrayAttributes;
      var name;
      var attribute;
      var vertexBuffer;
      var vaAttributes = (defined(createdVAAttributes)) ? createdVAAttributes : [];
      var attributes = geometry.attributes;
      if (interleave) {
        var interleavedAttributes = interleaveAttributes(attributes);
        if (defined(interleavedAttributes)) {
          vertexBuffer = Buffer.createVertexBuffer({
            context: context,
            typedArray: interleavedAttributes.buffer,
            usage: bufferUsage
          });
          var offsetsInBytes = interleavedAttributes.offsetsInBytes;
          var strideInBytes = interleavedAttributes.vertexSizeInBytes;
          for (name in attributes) {
            if (attributes.hasOwnProperty(name) && defined(attributes[name])) {
              attribute = attributes[name];
              if (defined(attribute.values)) {
                vaAttributes.push({
                  index: attributeLocations[name],
                  vertexBuffer: vertexBuffer,
                  componentDatatype: attribute.componentDatatype,
                  componentsPerAttribute: attribute.componentsPerAttribute,
                  normalize: attribute.normalize,
                  offsetInBytes: offsetsInBytes[name],
                  strideInBytes: strideInBytes
                });
              } else {
                vaAttributes.push({
                  index: attributeLocations[name],
                  value: attribute.value,
                  componentDatatype: attribute.componentDatatype,
                  normalize: attribute.normalize
                });
              }
            }
          }
        }
      } else {
        for (name in attributes) {
          if (attributes.hasOwnProperty(name) && defined(attributes[name])) {
            attribute = attributes[name];
            var componentDatatype = attribute.componentDatatype;
            if (componentDatatype === ComponentDatatype.DOUBLE) {
              componentDatatype = ComponentDatatype.FLOAT;
            }
            vertexBuffer = undefined;
            if (defined(attribute.values)) {
              vertexBuffer = Buffer.createVertexBuffer({
                context: context,
                typedArray: ComponentDatatype.createTypedArray(componentDatatype, attribute.values),
                usage: bufferUsage
              });
            }
            vaAttributes.push({
              index: attributeLocations[name],
              vertexBuffer: vertexBuffer,
              value: attribute.value,
              componentDatatype: componentDatatype,
              componentsPerAttribute: attribute.componentsPerAttribute,
              normalize: attribute.normalize
            });
          }
        }
      }
      var indexBuffer;
      var indices = geometry.indices;
      if (defined(indices)) {
        if ((Geometry.computeNumberOfVertices(geometry) >= CesiumMath.SIXTY_FOUR_KILOBYTES) && context.elementIndexUint) {
          indexBuffer = Buffer.createIndexBuffer({
            context: context,
            typedArray: new Uint32Array(indices),
            usage: bufferUsage,
            indexDatatype: IndexDatatype.UNSIGNED_INT
          });
        } else {
          indexBuffer = Buffer.createIndexBuffer({
            context: context,
            typedArray: new Uint16Array(indices),
            usage: bufferUsage,
            indexDatatype: IndexDatatype.UNSIGNED_SHORT
          });
        }
      }
      return new VertexArray({
        context: context,
        attributes: vaAttributes,
        indexBuffer: indexBuffer
      });
    };
    defineProperties(VertexArray.prototype, {
      numberOfAttributes: {get: function() {
          return this._attributes.length;
        }},
      numberOfVertices: {get: function() {
          return this._numberOfVertices;
        }},
      indexBuffer: {get: function() {
          return this._indexBuffer;
        }}
    });
    VertexArray.prototype.getAttribute = function(index) {
      if (!defined(index)) {
        throw new DeveloperError('index is required.');
      }
      return this._attributes[index];
    };
    function setVertexAttribDivisor(vertexArray) {
      var context = vertexArray._context;
      var hasInstancedAttributes = vertexArray._hasInstancedAttributes;
      if (!hasInstancedAttributes && !context._previousDrawInstanced) {
        return;
      }
      context._previousDrawInstanced = hasInstancedAttributes;
      var divisors = context._vertexAttribDivisors;
      var attributes = vertexArray._attributes;
      var maxAttributes = ContextLimits.maximumVertexAttributes;
      var i;
      if (hasInstancedAttributes) {
        var length = attributes.length;
        for (i = 0; i < length; ++i) {
          var attribute = attributes[i];
          if (attribute.enabled) {
            var divisor = attribute.instanceDivisor;
            var index = attribute.index;
            if (divisor !== divisors[index]) {
              context.glVertexAttribDivisor(index, divisor);
              divisors[index] = divisor;
            }
          }
        }
      } else {
        for (i = 0; i < maxAttributes; ++i) {
          if (divisors[i] > 0) {
            context.glVertexAttribDivisor(i, 0);
            divisors[i] = 0;
          }
        }
      }
    }
    VertexArray.prototype._bind = function() {
      if (defined(this._vao)) {
        this._context.glBindVertexArray(this._vao);
        if (this._context.instancedArrays) {
          setVertexAttribDivisor(this);
        }
      } else {
        bind(this._gl, this._attributes, this._indexBuffer);
      }
    };
    VertexArray.prototype._unBind = function() {
      if (defined(this._vao)) {
        this._context.glBindVertexArray(null);
      } else {
        var attributes = this._attributes;
        var gl = this._gl;
        for (var i = 0; i < attributes.length; ++i) {
          var attribute = attributes[i];
          if (attribute.enabled) {
            attribute.disableVertexAttribArray(gl);
          }
        }
        if (this._indexBuffer) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
      }
    };
    VertexArray.prototype.isDestroyed = function() {
      return false;
    };
    VertexArray.prototype.destroy = function() {
      var attributes = this._attributes;
      for (var i = 0; i < attributes.length; ++i) {
        var vertexBuffer = attributes[i].vertexBuffer;
        if (defined(vertexBuffer) && !vertexBuffer.isDestroyed() && vertexBuffer.vertexArrayDestroyable) {
          vertexBuffer.destroy();
        }
      }
      var indexBuffer = this._indexBuffer;
      if (defined(indexBuffer) && !indexBuffer.isDestroyed() && indexBuffer.vertexArrayDestroyable) {
        indexBuffer.destroy();
      }
      if (defined(this._vao)) {
        this._context.glDeleteVertexArray(this._vao);
      }
      return destroyObject(this);
    };
    return VertexArray;
  });
})(require('buffer').Buffer);
