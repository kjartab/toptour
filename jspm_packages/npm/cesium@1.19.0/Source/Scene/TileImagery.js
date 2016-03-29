/* */ 
"format cjs";
(function(process) {
  define(['../Core/defined', './ImageryState'], function(defined, ImageryState) {
    'use strict';
    function TileImagery(imagery, textureCoordinateRectangle) {
      this.readyImagery = undefined;
      this.loadingImagery = imagery;
      this.textureCoordinateRectangle = textureCoordinateRectangle;
      this.textureTranslationAndScale = undefined;
    }
    TileImagery.prototype.freeResources = function() {
      if (defined(this.readyImagery)) {
        this.readyImagery.releaseReference();
      }
      if (defined(this.loadingImagery)) {
        this.loadingImagery.releaseReference();
      }
    };
    TileImagery.prototype.processStateMachine = function(tile, frameState) {
      var loadingImagery = this.loadingImagery;
      var imageryLayer = loadingImagery.imageryLayer;
      loadingImagery.processStateMachine(frameState);
      if (loadingImagery.state === ImageryState.READY) {
        if (defined(this.readyImagery)) {
          this.readyImagery.releaseReference();
        }
        this.readyImagery = this.loadingImagery;
        this.loadingImagery = undefined;
        this.textureTranslationAndScale = imageryLayer._calculateTextureTranslationAndScale(tile, this);
        return true;
      }
      var ancestor = loadingImagery.parent;
      var closestAncestorThatNeedsLoading;
      while (defined(ancestor) && ancestor.state !== ImageryState.READY) {
        if (ancestor.state !== ImageryState.FAILED && ancestor.state !== ImageryState.INVALID) {
          closestAncestorThatNeedsLoading = closestAncestorThatNeedsLoading || ancestor;
        }
        ancestor = ancestor.parent;
      }
      if (this.readyImagery !== ancestor) {
        if (defined(this.readyImagery)) {
          this.readyImagery.releaseReference();
        }
        this.readyImagery = ancestor;
        if (defined(ancestor)) {
          ancestor.addReference();
          this.textureTranslationAndScale = imageryLayer._calculateTextureTranslationAndScale(tile, this);
        }
      }
      if (loadingImagery.state === ImageryState.FAILED || loadingImagery.state === ImageryState.INVALID) {
        if (defined(closestAncestorThatNeedsLoading)) {
          closestAncestorThatNeedsLoading.processStateMachine(frameState);
          return false;
        } else {
          return true;
        }
      }
      return false;
    };
    return TileImagery;
  });
})(require('process'));
