/* */ 
"format cjs";
(function(process) {
  define([], function() {
    'use strict';
    function NeverTileDiscardPolicy(options) {}
    NeverTileDiscardPolicy.prototype.isReady = function() {
      return true;
    };
    NeverTileDiscardPolicy.prototype.shouldDiscardImage = function(image) {
      return false;
    };
    return NeverTileDiscardPolicy;
  });
})(require('process'));
