/* */ 
"format cjs";
(function(process) {
  define(['../Core/DeveloperError'], function(DeveloperError) {
    'use strict';
    function TileDiscardPolicy(options) {
      DeveloperError.throwInstantiationError();
    }
    TileDiscardPolicy.prototype.isReady = DeveloperError.throwInstantiationError;
    TileDiscardPolicy.prototype.shouldDiscardImage = DeveloperError.throwInstantiationError;
    return TileDiscardPolicy;
  });
})(require('process'));
