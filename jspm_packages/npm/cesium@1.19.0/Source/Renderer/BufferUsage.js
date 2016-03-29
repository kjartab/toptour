/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/freezeObject', './WebGLConstants'], function(freezeObject, WebGLConstants) {
    'use strict';
    var BufferUsage = {
      STREAM_DRAW: WebGLConstants.STREAM_DRAW,
      STATIC_DRAW: WebGLConstants.STATIC_DRAW,
      DYNAMIC_DRAW: WebGLConstants.DYNAMIC_DRAW,
      validate: function(bufferUsage) {
        return ((bufferUsage === BufferUsage.STREAM_DRAW) || (bufferUsage === BufferUsage.STATIC_DRAW) || (bufferUsage === BufferUsage.DYNAMIC_DRAW));
      }
    };
    return freezeObject(BufferUsage);
  });
})(require('buffer').Buffer);
