/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/DeveloperError', '../Core/IndexDatatype', './BufferUsage', './WebGLConstants'], function(defaultValue, defined, defineProperties, destroyObject, DeveloperError, IndexDatatype, BufferUsage, WebGLConstants) {
    'use strict';
    function Buffer(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      if (!defined(options.context)) {
        throw new DeveloperError('options.context is required.');
      }
      if (!defined(options.typedArray) && !defined(options.sizeInBytes)) {
        throw new DeveloperError('Either options.sizeInBytes or options.typedArray is required.');
      }
      if (defined(options.typedArray) && defined(options.sizeInBytes)) {
        throw new DeveloperError('Cannot pass in both options.sizeInBytes and options.typedArray.');
      }
      if (defined(options.typedArray) && !(typeof options.typedArray === 'object' && typeof options.typedArray.byteLength === 'number')) {
        throw new DeveloperError('options.typedArray must be a typed array');
      }
      if (!BufferUsage.validate(options.usage)) {
        throw new DeveloperError('usage is invalid.');
      }
      var gl = options.context._gl;
      var bufferTarget = options.bufferTarget;
      var typedArray = options.typedArray;
      var sizeInBytes = options.sizeInBytes;
      var usage = options.usage;
      var hasArray = defined(typedArray);
      if (hasArray) {
        sizeInBytes = typedArray.byteLength;
      }
      if (sizeInBytes <= 0) {
        throw new DeveloperError('Buffer size must be greater than zero.');
      }
      var buffer = gl.createBuffer();
      gl.bindBuffer(bufferTarget, buffer);
      gl.bufferData(bufferTarget, hasArray ? typedArray : sizeInBytes, usage);
      gl.bindBuffer(bufferTarget, null);
      this._gl = gl;
      this._bufferTarget = bufferTarget;
      this._sizeInBytes = sizeInBytes;
      this._usage = usage;
      this._buffer = buffer;
      this.vertexArrayDestroyable = true;
    }
    Buffer.createVertexBuffer = function(options) {
      if (!defined(options.context)) {
        throw new DeveloperError('options.context is required.');
      }
      return new Buffer({
        context: options.context,
        bufferTarget: WebGLConstants.ARRAY_BUFFER,
        typedArray: options.typedArray,
        sizeInBytes: options.sizeInBytes,
        usage: options.usage
      });
    };
    Buffer.createIndexBuffer = function(options) {
      if (!defined(options.context)) {
        throw new DeveloperError('options.context is required.');
      }
      if (!IndexDatatype.validate(options.indexDatatype)) {
        throw new DeveloperError('Invalid indexDatatype.');
      }
      if ((options.indexDatatype === IndexDatatype.UNSIGNED_INT) && !options.context.elementIndexUint) {
        throw new DeveloperError('IndexDatatype.UNSIGNED_INT requires OES_element_index_uint, which is not supported on this system.  Check context.elementIndexUint.');
      }
      var context = options.context;
      var indexDatatype = options.indexDatatype;
      var bytesPerIndex = IndexDatatype.getSizeInBytes(indexDatatype);
      var buffer = new Buffer({
        context: context,
        bufferTarget: WebGLConstants.ELEMENT_ARRAY_BUFFER,
        typedArray: options.typedArray,
        sizeInBytes: options.sizeInBytes,
        usage: options.usage
      });
      var numberOfIndices = buffer.sizeInBytes / bytesPerIndex;
      defineProperties(buffer, {
        indexDatatype: {get: function() {
            return indexDatatype;
          }},
        bytesPerIndex: {get: function() {
            return bytesPerIndex;
          }},
        numberOfIndices: {get: function() {
            return numberOfIndices;
          }}
      });
      return buffer;
    };
    defineProperties(Buffer.prototype, {
      sizeInBytes: {get: function() {
          return this._sizeInBytes;
        }},
      usage: {get: function() {
          return this._usage;
        }}
    });
    Buffer.prototype._getBuffer = function() {
      return this._buffer;
    };
    Buffer.prototype.copyFromArrayView = function(arrayView, offsetInBytes) {
      offsetInBytes = defaultValue(offsetInBytes, 0);
      if (!arrayView) {
        throw new DeveloperError('arrayView is required.');
      }
      if (offsetInBytes + arrayView.byteLength > this._sizeInBytes) {
        throw new DeveloperError('This buffer is not large enough.');
      }
      var gl = this._gl;
      var target = this._bufferTarget;
      gl.bindBuffer(target, this._buffer);
      gl.bufferSubData(target, offsetInBytes, arrayView);
      gl.bindBuffer(target, null);
    };
    Buffer.prototype.isDestroyed = function() {
      return false;
    };
    Buffer.prototype.destroy = function() {
      this._gl.deleteBuffer(this._buffer);
      return destroyObject(this);
    };
    return Buffer;
  });
})(require('buffer').Buffer);
