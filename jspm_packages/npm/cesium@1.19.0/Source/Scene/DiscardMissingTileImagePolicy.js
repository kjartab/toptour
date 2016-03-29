/* */ 
"format cjs";
(function(process) {
  define(['../Core/defaultValue', '../Core/defined', '../Core/DeveloperError', '../Core/getImagePixels', '../Core/loadImageViaBlob', '../ThirdParty/when'], function(defaultValue, defined, DeveloperError, getImagePixels, loadImageViaBlob, when) {
    'use strict';
    function DiscardMissingTileImagePolicy(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      if (!defined(options.missingImageUrl)) {
        throw new DeveloperError('options.missingImageUrl is required.');
      }
      if (!defined(options.pixelsToCheck)) {
        throw new DeveloperError('options.pixelsToCheck is required.');
      }
      this._pixelsToCheck = options.pixelsToCheck;
      this._missingImagePixels = undefined;
      this._missingImageByteLength = undefined;
      this._isReady = false;
      var that = this;
      function success(image) {
        if (defined(image.blob)) {
          that._missingImageByteLength = image.blob.size;
        }
        var pixels = getImagePixels(image);
        if (options.disableCheckIfAllPixelsAreTransparent) {
          var allAreTransparent = true;
          var width = image.width;
          var pixelsToCheck = options.pixelsToCheck;
          for (var i = 0,
              len = pixelsToCheck.length; allAreTransparent && i < len; ++i) {
            var pos = pixelsToCheck[i];
            var index = pos.x * 4 + pos.y * width;
            var alpha = pixels[index + 3];
            if (alpha > 0) {
              allAreTransparent = false;
            }
          }
          if (allAreTransparent) {
            pixels = undefined;
          }
        }
        that._missingImagePixels = pixels;
        that._isReady = true;
      }
      function failure() {
        that._missingImagePixels = undefined;
        that._isReady = true;
      }
      when(loadImageViaBlob(options.missingImageUrl), success, failure);
    }
    DiscardMissingTileImagePolicy.prototype.isReady = function() {
      return this._isReady;
    };
    DiscardMissingTileImagePolicy.prototype.shouldDiscardImage = function(image) {
      if (!this._isReady) {
        throw new DeveloperError('shouldDiscardImage must not be called before the discard policy is ready.');
      }
      var pixelsToCheck = this._pixelsToCheck;
      var missingImagePixels = this._missingImagePixels;
      if (!defined(missingImagePixels)) {
        return false;
      }
      if (defined(image.blob) && image.blob.size !== this._missingImageByteLength) {
        return false;
      }
      var pixels = getImagePixels(image);
      var width = image.width;
      for (var i = 0,
          len = pixelsToCheck.length; i < len; ++i) {
        var pos = pixelsToCheck[i];
        var index = pos.x * 4 + pos.y * width;
        for (var offset = 0; offset < 4; ++offset) {
          var pixel = index + offset;
          if (pixels[pixel] !== missingImagePixels[pixel]) {
            return false;
          }
        }
      }
      return true;
    };
    return DiscardMissingTileImagePolicy;
  });
})(require('process'));
