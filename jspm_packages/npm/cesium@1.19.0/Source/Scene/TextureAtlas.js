/* */ 
"format cjs";
(function(process) {
  define(['../Core/BoundingRectangle', '../Core/Cartesian2', '../Core/createGuid', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/DeveloperError', '../Core/loadImage', '../Core/PixelFormat', '../Core/RuntimeError', '../Renderer/Framebuffer', '../Renderer/RenderState', '../Renderer/Texture', '../ThirdParty/when'], function(BoundingRectangle, Cartesian2, createGuid, defaultValue, defined, defineProperties, destroyObject, DeveloperError, loadImage, PixelFormat, RuntimeError, Framebuffer, RenderState, Texture, when) {
    'use strict';
    function TextureAtlasNode(bottomLeft, topRight, childNode1, childNode2, imageIndex) {
      this.bottomLeft = defaultValue(bottomLeft, Cartesian2.ZERO);
      this.topRight = defaultValue(topRight, Cartesian2.ZERO);
      this.childNode1 = childNode1;
      this.childNode2 = childNode2;
      this.imageIndex = imageIndex;
    }
    var defaultInitialSize = new Cartesian2(16.0, 16.0);
    function TextureAtlas(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      var borderWidthInPixels = defaultValue(options.borderWidthInPixels, 1.0);
      var initialSize = defaultValue(options.initialSize, defaultInitialSize);
      if (!defined(options.context)) {
        throw new DeveloperError('context is required.');
      }
      if (borderWidthInPixels < 0) {
        throw new DeveloperError('borderWidthInPixels must be greater than or equal to zero.');
      }
      if (initialSize.x < 1 || initialSize.y < 1) {
        throw new DeveloperError('initialSize must be greater than zero.');
      }
      this._context = options.context;
      this._pixelFormat = defaultValue(options.pixelFormat, PixelFormat.RGBA);
      this._borderWidthInPixels = borderWidthInPixels;
      this._textureCoordinates = [];
      this._guid = createGuid();
      this._idHash = {};
      this._texture = new Texture({
        context: this._context,
        width: initialSize.x,
        height: initialSize.y,
        pixelFormat: this._pixelFormat
      });
      this._root = new TextureAtlasNode(new Cartesian2(), new Cartesian2(initialSize.x, initialSize.y));
      var that = this;
      var uniformMap = {u_texture: function() {
          return that._texture;
        }};
      var fs = 'uniform sampler2D u_texture;\n' + 'varying vec2 v_textureCoordinates;\n' + 'void main()\n' + '{\n' + '    gl_FragColor = texture2D(u_texture, v_textureCoordinates);\n' + '}\n';
      this._copyCommand = this._context.createViewportQuadCommand(fs, {uniformMap: uniformMap});
    }
    defineProperties(TextureAtlas.prototype, {
      borderWidthInPixels: {get: function() {
          return this._borderWidthInPixels;
        }},
      textureCoordinates: {get: function() {
          return this._textureCoordinates;
        }},
      texture: {get: function() {
          return this._texture;
        }},
      numberOfImages: {get: function() {
          return this._textureCoordinates.length;
        }},
      guid: {get: function() {
          return this._guid;
        }}
    });
    function resizeAtlas(textureAtlas, image) {
      var context = textureAtlas._context;
      var numImages = textureAtlas.numberOfImages;
      var scalingFactor = 2.0;
      if (numImages > 0) {
        var oldAtlasWidth = textureAtlas._texture.width;
        var oldAtlasHeight = textureAtlas._texture.height;
        var atlasWidth = scalingFactor * (oldAtlasWidth + image.width + textureAtlas._borderWidthInPixels);
        var atlasHeight = scalingFactor * (oldAtlasHeight + image.height + textureAtlas._borderWidthInPixels);
        var widthRatio = oldAtlasWidth / atlasWidth;
        var heightRatio = oldAtlasHeight / atlasHeight;
        var nodeBottomRight = new TextureAtlasNode(new Cartesian2(oldAtlasWidth + textureAtlas._borderWidthInPixels, 0.0), new Cartesian2(atlasWidth, oldAtlasHeight));
        var nodeBottomHalf = new TextureAtlasNode(new Cartesian2(), new Cartesian2(atlasWidth, oldAtlasHeight), textureAtlas._root, nodeBottomRight);
        var nodeTopHalf = new TextureAtlasNode(new Cartesian2(0.0, oldAtlasHeight + textureAtlas._borderWidthInPixels), new Cartesian2(atlasWidth, atlasHeight));
        var nodeMain = new TextureAtlasNode(new Cartesian2(), new Cartesian2(atlasWidth, atlasHeight), nodeBottomHalf, nodeTopHalf);
        textureAtlas._root = nodeMain;
        for (var i = 0; i < textureAtlas._textureCoordinates.length; i++) {
          var texCoord = textureAtlas._textureCoordinates[i];
          if (defined(texCoord)) {
            texCoord.x *= widthRatio;
            texCoord.y *= heightRatio;
            texCoord.width *= widthRatio;
            texCoord.height *= heightRatio;
          }
        }
        var newTexture = new Texture({
          context: textureAtlas._context,
          width: atlasWidth,
          height: atlasHeight,
          pixelFormat: textureAtlas._pixelFormat
        });
        var framebuffer = new Framebuffer({
          context: context,
          colorTextures: [newTexture],
          destroyAttachments: false
        });
        var command = textureAtlas._copyCommand;
        var renderState = {viewport: new BoundingRectangle(0, 0, oldAtlasWidth, oldAtlasHeight)};
        command.renderState = RenderState.fromCache(renderState);
        framebuffer._bind();
        command.execute(textureAtlas._context);
        framebuffer._unBind();
        framebuffer.destroy();
        textureAtlas._texture = newTexture;
        RenderState.removeFromCache(renderState);
        command.renderState = undefined;
      } else {
        var initialWidth = scalingFactor * (image.width + textureAtlas._borderWidthInPixels);
        var initialHeight = scalingFactor * (image.height + textureAtlas._borderWidthInPixels);
        textureAtlas._texture = textureAtlas._texture && textureAtlas._texture.destroy();
        textureAtlas._texture = new Texture({
          context: textureAtlas._context,
          width: initialWidth,
          height: initialHeight,
          pixelFormat: textureAtlas._pixelFormat
        });
        textureAtlas._root = new TextureAtlasNode(new Cartesian2(), new Cartesian2(initialWidth, initialHeight));
      }
    }
    function findNode(textureAtlas, node, image) {
      if (!defined(node)) {
        return undefined;
      }
      if (!defined(node.childNode1) && !defined(node.childNode2)) {
        if (defined(node.imageIndex)) {
          return undefined;
        }
        var nodeWidth = node.topRight.x - node.bottomLeft.x;
        var nodeHeight = node.topRight.y - node.bottomLeft.y;
        var widthDifference = nodeWidth - image.width;
        var heightDifference = nodeHeight - image.height;
        if (widthDifference < 0 || heightDifference < 0) {
          return undefined;
        }
        if (widthDifference === 0 && heightDifference === 0) {
          return node;
        }
        if (widthDifference > heightDifference) {
          node.childNode1 = new TextureAtlasNode(new Cartesian2(node.bottomLeft.x, node.bottomLeft.y), new Cartesian2(node.bottomLeft.x + image.width, node.topRight.y));
          var childNode2BottomLeftX = node.bottomLeft.x + image.width + textureAtlas._borderWidthInPixels;
          if (childNode2BottomLeftX < node.topRight.x) {
            node.childNode2 = new TextureAtlasNode(new Cartesian2(childNode2BottomLeftX, node.bottomLeft.y), new Cartesian2(node.topRight.x, node.topRight.y));
          }
        } else {
          node.childNode1 = new TextureAtlasNode(new Cartesian2(node.bottomLeft.x, node.bottomLeft.y), new Cartesian2(node.topRight.x, node.bottomLeft.y + image.height));
          var childNode2BottomLeftY = node.bottomLeft.y + image.height + textureAtlas._borderWidthInPixels;
          if (childNode2BottomLeftY < node.topRight.y) {
            node.childNode2 = new TextureAtlasNode(new Cartesian2(node.bottomLeft.x, childNode2BottomLeftY), new Cartesian2(node.topRight.x, node.topRight.y));
          }
        }
        return findNode(textureAtlas, node.childNode1, image);
      }
      return findNode(textureAtlas, node.childNode1, image) || findNode(textureAtlas, node.childNode2, image);
    }
    function addImage(textureAtlas, image, index) {
      var node = findNode(textureAtlas, textureAtlas._root, image);
      if (defined(node)) {
        node.imageIndex = index;
        var atlasWidth = textureAtlas._texture.width;
        var atlasHeight = textureAtlas._texture.height;
        var nodeWidth = node.topRight.x - node.bottomLeft.x;
        var nodeHeight = node.topRight.y - node.bottomLeft.y;
        var x = node.bottomLeft.x / atlasWidth;
        var y = node.bottomLeft.y / atlasHeight;
        var w = nodeWidth / atlasWidth;
        var h = nodeHeight / atlasHeight;
        textureAtlas._textureCoordinates[index] = new BoundingRectangle(x, y, w, h);
        textureAtlas._texture.copyFrom(image, node.bottomLeft.x, node.bottomLeft.y);
      } else {
        resizeAtlas(textureAtlas, image);
        addImage(textureAtlas, image, index);
      }
      textureAtlas._guid = createGuid();
    }
    TextureAtlas.prototype.addImage = function(id, image) {
      if (!defined(id)) {
        throw new DeveloperError('id is required.');
      }
      if (!defined(image)) {
        throw new DeveloperError('image is required.');
      }
      var indexPromise = this._idHash[id];
      if (defined(indexPromise)) {
        return indexPromise;
      }
      if (typeof image === 'function') {
        image = image(id);
        if (!defined(image)) {
          throw new DeveloperError('image is required.');
        }
      } else if (typeof image === 'string') {
        image = loadImage(image);
      }
      var that = this;
      indexPromise = when(image, function(image) {
        if (that.isDestroyed()) {
          return -1;
        }
        var index = that.numberOfImages;
        addImage(that, image, index);
        return index;
      });
      this._idHash[id] = indexPromise;
      return indexPromise;
    };
    TextureAtlas.prototype.addSubRegion = function(id, subRegion) {
      if (!defined(id)) {
        throw new DeveloperError('id is required.');
      }
      if (!defined(subRegion)) {
        throw new DeveloperError('subRegion is required.');
      }
      var indexPromise = this._idHash[id];
      if (!defined(indexPromise)) {
        throw new RuntimeError('image with id "' + id + '" not found in the atlas.');
      }
      var that = this;
      return when(indexPromise, function(index) {
        if (index === -1) {
          return -1;
        }
        var atlasWidth = that._texture.width;
        var atlasHeight = that._texture.height;
        var numImages = that.numberOfImages;
        var baseRegion = that._textureCoordinates[index];
        var x = baseRegion.x + (subRegion.x / atlasWidth);
        var y = baseRegion.y + (subRegion.y / atlasHeight);
        var w = subRegion.width / atlasWidth;
        var h = subRegion.height / atlasHeight;
        that._textureCoordinates.push(new BoundingRectangle(x, y, w, h));
        that._guid = createGuid();
        return numImages;
      });
    };
    TextureAtlas.prototype.isDestroyed = function() {
      return false;
    };
    TextureAtlas.prototype.destroy = function() {
      this._texture = this._texture && this._texture.destroy();
      return destroyObject(this);
    };
    return TextureAtlas;
  });
})(require('process'));
