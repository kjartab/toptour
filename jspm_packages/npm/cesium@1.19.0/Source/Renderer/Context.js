/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/clone', '../Core/Color', '../Core/ComponentDatatype', '../Core/createGuid', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/DeveloperError', '../Core/FeatureDetection', '../Core/Geometry', '../Core/GeometryAttribute', '../Core/Math', '../Core/Matrix4', '../Core/PrimitiveType', '../Core/RuntimeError', '../Shaders/ViewportQuadVS', './BufferUsage', './ClearCommand', './ContextLimits', './CubeMap', './DrawCommand', './PassState', './PickFramebuffer', './PixelDatatype', './RenderbufferFormat', './RenderState', './ShaderCache', './ShaderProgram', './Texture', './UniformState', './VertexArray', './WebGLConstants'], function(clone, Color, ComponentDatatype, createGuid, defaultValue, defined, defineProperties, destroyObject, DeveloperError, FeatureDetection, Geometry, GeometryAttribute, CesiumMath, Matrix4, PrimitiveType, RuntimeError, ViewportQuadVS, BufferUsage, ClearCommand, ContextLimits, CubeMap, DrawCommand, PassState, PickFramebuffer, PixelDatatype, RenderbufferFormat, RenderState, ShaderCache, ShaderProgram, Texture, UniformState, VertexArray, WebGLConstants) {
    'use strict';
    function errorToString(gl, error) {
      var message = 'WebGL Error:  ';
      switch (error) {
        case gl.INVALID_ENUM:
          message += 'INVALID_ENUM';
          break;
        case gl.INVALID_VALUE:
          message += 'INVALID_VALUE';
          break;
        case gl.INVALID_OPERATION:
          message += 'INVALID_OPERATION';
          break;
        case gl.OUT_OF_MEMORY:
          message += 'OUT_OF_MEMORY';
          break;
        case gl.CONTEXT_LOST_WEBGL:
          message += 'CONTEXT_LOST_WEBGL lost';
          break;
        default:
          message += 'Unknown (' + error + ')';
      }
      return message;
    }
    function createErrorMessage(gl, glFunc, glFuncArguments, error) {
      var message = errorToString(gl, error) + ': ' + glFunc.name + '(';
      for (var i = 0; i < glFuncArguments.length; ++i) {
        if (i !== 0) {
          message += ', ';
        }
        message += glFuncArguments[i];
      }
      message += ');';
      return message;
    }
    function throwOnError(gl, glFunc, glFuncArguments) {
      var error = gl.getError();
      if (error !== gl.NO_ERROR) {
        throw new RuntimeError(createErrorMessage(gl, glFunc, glFuncArguments, error));
      }
    }
    function makeGetterSetter(gl, propertyName, logFunc) {
      return {
        get: function() {
          var value = gl[propertyName];
          logFunc(gl, 'get: ' + propertyName, value);
          return gl[propertyName];
        },
        set: function(value) {
          gl[propertyName] = value;
          logFunc(gl, 'set: ' + propertyName, value);
        }
      };
    }
    function wrapGL(gl, logFunc) {
      if (!logFunc) {
        return gl;
      }
      function wrapFunction(property) {
        return function() {
          var result = property.apply(gl, arguments);
          logFunc(gl, property, arguments);
          return result;
        };
      }
      var glWrapper = {};
      for (var propertyName in gl) {
        var property = gl[propertyName];
        if (typeof property === 'function') {
          glWrapper[propertyName] = wrapFunction(property);
        } else {
          Object.defineProperty(glWrapper, propertyName, makeGetterSetter(gl, propertyName, logFunc));
        }
      }
      return glWrapper;
    }
    function getExtension(gl, names) {
      var length = names.length;
      for (var i = 0; i < length; ++i) {
        var extension = gl.getExtension(names[i]);
        if (extension) {
          return extension;
        }
      }
      return undefined;
    }
    function Context(canvas, options) {
      if (typeof WebGLRenderingContext === 'undefined') {
        throw new RuntimeError('The browser does not support WebGL.  Visit http://get.webgl.org.');
      }
      if (!defined(canvas)) {
        throw new DeveloperError('canvas is required.');
      }
      this._canvas = canvas;
      options = clone(options, true);
      options = defaultValue(options, {});
      options.allowTextureFilterAnisotropic = defaultValue(options.allowTextureFilterAnisotropic, true);
      var webglOptions = defaultValue(options.webgl, {});
      webglOptions.alpha = defaultValue(webglOptions.alpha, false);
      var defaultToWebgl2 = false;
      var webgl2Supported = (typeof WebGL2RenderingContext !== 'undefined');
      var webgl2 = false;
      var glContext;
      if (defaultToWebgl2 && webgl2Supported) {
        glContext = canvas.getContext('webgl2', webglOptions) || canvas.getContext('experimental-webgl2', webglOptions) || undefined;
        if (defined(glContext)) {
          webgl2 = true;
        }
      }
      if (!defined(glContext)) {
        glContext = canvas.getContext('webgl', webglOptions) || canvas.getContext('experimental-webgl', webglOptions) || undefined;
      }
      if (!defined(glContext)) {
        throw new RuntimeError('The browser supports WebGL, but initialization failed.');
      }
      this._originalGLContext = glContext;
      this._webgl2 = webgl2;
      this._id = createGuid();
      this.validateFramebuffer = false;
      this.validateShaderProgram = false;
      this.logShaderCompilation = false;
      this._throwOnWebGLError = false;
      this._shaderCache = new ShaderCache(this);
      var gl = this._gl = this._originalGLContext;
      this._redBits = gl.getParameter(gl.RED_BITS);
      this._greenBits = gl.getParameter(gl.GREEN_BITS);
      this._blueBits = gl.getParameter(gl.BLUE_BITS);
      this._alphaBits = gl.getParameter(gl.ALPHA_BITS);
      this._depthBits = gl.getParameter(gl.DEPTH_BITS);
      this._stencilBits = gl.getParameter(gl.STENCIL_BITS);
      ContextLimits._maximumCombinedTextureImageUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
      ContextLimits._maximumCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
      ContextLimits._maximumFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
      ContextLimits._maximumTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      ContextLimits._maximumRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      ContextLimits._maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      ContextLimits._maximumVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);
      ContextLimits._maximumVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      ContextLimits._maximumVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
      ContextLimits._maximumVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
      var aliasedLineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
      ContextLimits._minimumAliasedLineWidth = aliasedLineWidthRange[0];
      ContextLimits._maximumAliasedLineWidth = aliasedLineWidthRange[1];
      var aliasedPointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
      ContextLimits._minimumAliasedPointSize = aliasedPointSizeRange[0];
      ContextLimits._maximumAliasedPointSize = aliasedPointSizeRange[1];
      var maximumViewportDimensions = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      ContextLimits._maximumViewportWidth = maximumViewportDimensions[0];
      ContextLimits._maximumViewportHeight = maximumViewportDimensions[1];
      var highpFloat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      ContextLimits._highpFloatSupported = highpFloat.precision !== 0;
      var highpInt = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT);
      ContextLimits._highpIntSupported = highpInt.rangeMax !== 0;
      this._antialias = gl.getContextAttributes().antialias;
      this._standardDerivatives = !!getExtension(gl, ['OES_standard_derivatives']);
      this._elementIndexUint = !!getExtension(gl, ['OES_element_index_uint']);
      this._depthTexture = !!getExtension(gl, ['WEBGL_depth_texture', 'WEBKIT_WEBGL_depth_texture']);
      this._textureFloat = !!getExtension(gl, ['OES_texture_float']);
      this._fragDepth = !!getExtension(gl, ['EXT_frag_depth']);
      this._debugShaders = getExtension(gl, ['WEBGL_debug_shaders']);
      var textureFilterAnisotropic = options.allowTextureFilterAnisotropic ? getExtension(gl, ['EXT_texture_filter_anisotropic', 'WEBKIT_EXT_texture_filter_anisotropic']) : undefined;
      this._textureFilterAnisotropic = textureFilterAnisotropic;
      ContextLimits._maximumTextureFilterAnisotropy = defined(textureFilterAnisotropic) ? gl.getParameter(textureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1.0;
      var glCreateVertexArray;
      var glBindVertexArray;
      var glDeleteVertexArray;
      var glDrawElementsInstanced;
      var glDrawArraysInstanced;
      var glVertexAttribDivisor;
      var glDrawBuffers;
      var vertexArrayObject;
      var instancedArrays;
      var drawBuffers;
      if (webgl2) {
        var that = this;
        glCreateVertexArray = function() {
          return that._gl.createVertexArray();
        };
        glBindVertexArray = function(vao) {
          that._gl.bindVertexArray(vao);
        };
        glDeleteVertexArray = function(vao) {
          that._gl.deleteVertexArray(vao);
        };
        glDrawElementsInstanced = function(mode, count, type, offset, instanceCount) {
          gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
        };
        glDrawArraysInstanced = function(mode, first, count, instanceCount) {
          gl.drawArraysInstanced(mode, first, count, instanceCount);
        };
        glVertexAttribDivisor = function(index, divisor) {
          gl.vertexAttribDivisor(index, divisor);
        };
        glDrawBuffers = function(buffers) {
          gl.drawBuffers(buffers);
        };
      } else {
        vertexArrayObject = getExtension(gl, ['OES_vertex_array_object']);
        if (defined(vertexArrayObject)) {
          glCreateVertexArray = function() {
            return vertexArrayObject.createVertexArrayOES();
          };
          glBindVertexArray = function(vertexArray) {
            vertexArrayObject.bindVertexArrayOES(vertexArray);
          };
          glDeleteVertexArray = function(vertexArray) {
            vertexArrayObject.deleteVertexArrayOES(vertexArray);
          };
        }
        instancedArrays = getExtension(gl, ['ANGLE_instanced_arrays']);
        if (defined(instancedArrays)) {
          glDrawElementsInstanced = function(mode, count, type, offset, instanceCount) {
            instancedArrays.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
          };
          glDrawArraysInstanced = function(mode, first, count, instanceCount) {
            instancedArrays.drawArraysInstancedANGLE(mode, first, count, instanceCount);
          };
          glVertexAttribDivisor = function(index, divisor) {
            instancedArrays.vertexAttribDivisorANGLE(index, divisor);
          };
        }
        drawBuffers = getExtension(gl, ['WEBGL_draw_buffers']);
        if (defined(drawBuffers)) {
          glDrawBuffers = function(buffers) {
            drawBuffers.drawBuffersWEBGL(buffers);
          };
        }
      }
      this.glCreateVertexArray = glCreateVertexArray;
      this.glBindVertexArray = glBindVertexArray;
      this.glDeleteVertexArray = glDeleteVertexArray;
      this.glDrawElementsInstanced = glDrawElementsInstanced;
      this.glDrawArraysInstanced = glDrawArraysInstanced;
      this.glVertexAttribDivisor = glVertexAttribDivisor;
      this.glDrawBuffers = glDrawBuffers;
      this._vertexArrayObject = !!vertexArrayObject;
      this._instancedArrays = !!instancedArrays;
      this._drawBuffers = !!drawBuffers;
      ContextLimits._maximumDrawBuffers = this.drawBuffers ? gl.getParameter(WebGLConstants.MAX_DRAW_BUFFERS) : 1;
      ContextLimits._maximumColorAttachments = this.drawBuffers ? gl.getParameter(WebGLConstants.MAX_COLOR_ATTACHMENTS) : 1;
      var cc = gl.getParameter(gl.COLOR_CLEAR_VALUE);
      this._clearColor = new Color(cc[0], cc[1], cc[2], cc[3]);
      this._clearDepth = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
      this._clearStencil = gl.getParameter(gl.STENCIL_CLEAR_VALUE);
      var us = new UniformState();
      var ps = new PassState(this);
      var rs = RenderState.fromCache();
      this._defaultPassState = ps;
      this._defaultRenderState = rs;
      this._defaultTexture = undefined;
      this._defaultCubeMap = undefined;
      this._us = us;
      this._currentRenderState = rs;
      this._currentPassState = ps;
      this._currentFramebuffer = undefined;
      this._maxFrameTextureUnitIndex = 0;
      this._vertexAttribDivisors = [];
      this._previousDrawInstanced = false;
      for (var i = 0; i < ContextLimits._maximumVertexAttributes; i++) {
        this._vertexAttribDivisors.push(0);
      }
      this._pickObjects = {};
      this._nextPickColor = new Uint32Array(1);
      this.options = options;
      this.cache = {};
      RenderState.apply(gl, rs, ps);
    }
    var defaultFramebufferMarker = {};
    defineProperties(Context.prototype, {
      id: {get: function() {
          return this._id;
        }},
      webgl2: {get: function() {
          return this._webgl2;
        }},
      canvas: {get: function() {
          return this._canvas;
        }},
      shaderCache: {get: function() {
          return this._shaderCache;
        }},
      uniformState: {get: function() {
          return this._us;
        }},
      redBits: {get: function() {
          return this._redBits;
        }},
      greenBits: {get: function() {
          return this._greenBits;
        }},
      blueBits: {get: function() {
          return this._blueBits;
        }},
      alphaBits: {get: function() {
          return this._alphaBits;
        }},
      depthBits: {get: function() {
          return this._depthBits;
        }},
      stencilBits: {get: function() {
          return this._stencilBits;
        }},
      antialias: {get: function() {
          return this._antialias;
        }},
      standardDerivatives: {get: function() {
          return this._standardDerivatives;
        }},
      elementIndexUint: {get: function() {
          return this._elementIndexUint || this._webgl2;
        }},
      depthTexture: {get: function() {
          return this._depthTexture;
        }},
      floatingPointTexture: {get: function() {
          return this._textureFloat;
        }},
      textureFilterAnisotropic: {get: function() {
          return !!this._textureFilterAnisotropic;
        }},
      vertexArrayObject: {get: function() {
          return this._vertexArrayObject || this._webgl2;
        }},
      fragmentDepth: {get: function() {
          return this._fragDepth;
        }},
      instancedArrays: {get: function() {
          return this._instancedArrays || this._webgl2;
        }},
      drawBuffers: {get: function() {
          return this._drawBuffers || this._webgl2;
        }},
      debugShaders: {get: function() {
          return this._debugShaders;
        }},
      throwOnWebGLError: {
        get: function() {
          return this._throwOnWebGLError;
        },
        set: function(value) {
          this._throwOnWebGLError = value;
          this._gl = wrapGL(this._originalGLContext, value ? throwOnError : null);
        }
      },
      defaultTexture: {get: function() {
          if (this._defaultTexture === undefined) {
            this._defaultTexture = new Texture({
              context: this,
              source: {
                width: 1,
                height: 1,
                arrayBufferView: new Uint8Array([255, 255, 255, 255])
              }
            });
          }
          return this._defaultTexture;
        }},
      defaultCubeMap: {get: function() {
          if (this._defaultCubeMap === undefined) {
            var face = {
              width: 1,
              height: 1,
              arrayBufferView: new Uint8Array([255, 255, 255, 255])
            };
            this._defaultCubeMap = new CubeMap({
              context: this,
              source: {
                positiveX: face,
                negativeX: face,
                positiveY: face,
                negativeY: face,
                positiveZ: face,
                negativeZ: face
              }
            });
          }
          return this._defaultCubeMap;
        }},
      drawingBufferHeight: {get: function() {
          return this._gl.drawingBufferHeight;
        }},
      drawingBufferWidth: {get: function() {
          return this._gl.drawingBufferWidth;
        }},
      defaultFramebuffer: {get: function() {
          return defaultFramebufferMarker;
        }}
    });
    function validateFramebuffer(context, framebuffer) {
      if (context.validateFramebuffer) {
        var gl = context._gl;
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          var message;
          switch (status) {
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
              message = 'Framebuffer is not complete.  Incomplete attachment: at least one attachment point with a renderbuffer or texture attached has its attached object no longer in existence or has an attached image with a width or height of zero, or the color attachment point has a non-color-renderable image attached, or the depth attachment point has a non-depth-renderable image attached, or the stencil attachment point has a non-stencil-renderable image attached.  Color-renderable formats include GL_RGBA4, GL_RGB5_A1, and GL_RGB565. GL_DEPTH_COMPONENT16 is the only depth-renderable format. GL_STENCIL_INDEX8 is the only stencil-renderable format.';
              break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
              message = 'Framebuffer is not complete.  Incomplete dimensions: not all attached images have the same width and height.';
              break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
              message = 'Framebuffer is not complete.  Missing attachment: no images are attached to the framebuffer.';
              break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
              message = 'Framebuffer is not complete.  Unsupported: the combination of internal formats of the attached images violates an implementation-dependent set of restrictions.';
              break;
          }
          throw new DeveloperError(message);
        }
      }
    }
    function applyRenderState(context, renderState, passState, clear) {
      var previousRenderState = context._currentRenderState;
      var previousPassState = context._currentPassState;
      context._currentRenderState = renderState;
      context._currentPassState = passState;
      RenderState.partialApply(context._gl, previousRenderState, renderState, previousPassState, passState, clear);
    }
    var scratchBackBufferArray;
    if (typeof WebGLRenderingContext !== 'undefined') {
      scratchBackBufferArray = [WebGLConstants.BACK];
    }
    function bindFramebuffer(context, framebuffer) {
      if (framebuffer !== context._currentFramebuffer) {
        context._currentFramebuffer = framebuffer;
        var buffers = scratchBackBufferArray;
        if (defined(framebuffer)) {
          framebuffer._bind();
          validateFramebuffer(context, framebuffer);
          buffers = framebuffer._getActiveColorAttachments();
        } else {
          var gl = context._gl;
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        if (context.drawBuffers) {
          context.glDrawBuffers(buffers);
        }
      }
    }
    var defaultClearCommand = new ClearCommand();
    Context.prototype.clear = function(clearCommand, passState) {
      clearCommand = defaultValue(clearCommand, defaultClearCommand);
      passState = defaultValue(passState, this._defaultPassState);
      var gl = this._gl;
      var bitmask = 0;
      var c = clearCommand.color;
      var d = clearCommand.depth;
      var s = clearCommand.stencil;
      if (defined(c)) {
        if (!Color.equals(this._clearColor, c)) {
          Color.clone(c, this._clearColor);
          gl.clearColor(c.red, c.green, c.blue, c.alpha);
        }
        bitmask |= gl.COLOR_BUFFER_BIT;
      }
      if (defined(d)) {
        if (d !== this._clearDepth) {
          this._clearDepth = d;
          gl.clearDepth(d);
        }
        bitmask |= gl.DEPTH_BUFFER_BIT;
      }
      if (defined(s)) {
        if (s !== this._clearStencil) {
          this._clearStencil = s;
          gl.clearStencil(s);
        }
        bitmask |= gl.STENCIL_BUFFER_BIT;
      }
      var rs = defaultValue(clearCommand.renderState, this._defaultRenderState);
      applyRenderState(this, rs, passState, true);
      var framebuffer = defaultValue(clearCommand.framebuffer, passState.framebuffer);
      bindFramebuffer(this, framebuffer);
      gl.clear(bitmask);
    };
    function beginDraw(context, framebuffer, drawCommand, passState, renderState, shaderProgram) {
      var rs = defaultValue(defaultValue(renderState, drawCommand.renderState), context._defaultRenderState);
      if (defined(framebuffer) && rs.depthTest) {
        if (rs.depthTest.enabled && !framebuffer.hasDepthAttachment) {
          throw new DeveloperError('The depth test can not be enabled (drawCommand.renderState.depthTest.enabled) because the framebuffer (drawCommand.framebuffer) does not have a depth or depth-stencil renderbuffer.');
        }
      }
      bindFramebuffer(context, framebuffer);
      applyRenderState(context, rs, passState, false);
      var sp = defaultValue(shaderProgram, drawCommand.shaderProgram);
      sp._bind();
      context._maxFrameTextureUnitIndex = Math.max(context._maxFrameTextureUnitIndex, sp.maximumTextureUnitIndex);
    }
    function continueDraw(context, drawCommand, shaderProgram) {
      var primitiveType = drawCommand.primitiveType;
      var va = drawCommand.vertexArray;
      var offset = drawCommand.offset;
      var count = drawCommand.count;
      var instanceCount = drawCommand.instanceCount;
      if (!PrimitiveType.validate(primitiveType)) {
        throw new DeveloperError('drawCommand.primitiveType is required and must be valid.');
      }
      if (!defined(va)) {
        throw new DeveloperError('drawCommand.vertexArray is required.');
      }
      if (offset < 0) {
        throw new DeveloperError('drawCommand.offset must be greater than or equal to zero.');
      }
      if (count < 0) {
        throw new DeveloperError('drawCommand.count must be greater than or equal to zero.');
      }
      if (instanceCount < 0) {
        throw new DeveloperError('drawCommand.instanceCount must be greater than or equal to zero.');
      }
      if (instanceCount > 0 && !context.instancedArrays) {
        throw new DeveloperError('Instanced arrays extension is not supported');
      }
      context._us.model = defaultValue(drawCommand.modelMatrix, Matrix4.IDENTITY);
      var sp = defaultValue(shaderProgram, drawCommand.shaderProgram);
      sp._setUniforms(drawCommand.uniformMap, context._us, context.validateShaderProgram);
      va._bind();
      var indexBuffer = va.indexBuffer;
      if (defined(indexBuffer)) {
        offset = offset * indexBuffer.bytesPerIndex;
        count = defaultValue(count, indexBuffer.numberOfIndices);
        if (instanceCount === 0) {
          context._gl.drawElements(primitiveType, count, indexBuffer.indexDatatype, offset);
        } else {
          context.glDrawElementsInstanced(primitiveType, count, indexBuffer.indexDatatype, offset, instanceCount);
        }
      } else {
        count = defaultValue(count, va.numberOfVertices);
        if (instanceCount === 0) {
          context._gl.drawArrays(primitiveType, offset, count);
        } else {
          context.glDrawArraysInstanced(primitiveType, offset, count, instanceCount);
        }
      }
      va._unBind();
    }
    Context.prototype.draw = function(drawCommand, passState, renderState, shaderProgram) {
      if (!defined(drawCommand)) {
        throw new DeveloperError('drawCommand is required.');
      }
      if (!defined(drawCommand.shaderProgram)) {
        throw new DeveloperError('drawCommand.shaderProgram is required.');
      }
      passState = defaultValue(passState, this._defaultPassState);
      var framebuffer = defaultValue(drawCommand.framebuffer, passState.framebuffer);
      beginDraw(this, framebuffer, drawCommand, passState, renderState, shaderProgram);
      continueDraw(this, drawCommand, shaderProgram);
    };
    Context.prototype.endFrame = function() {
      var gl = this._gl;
      gl.useProgram(null);
      this._currentFramebuffer = undefined;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      var buffers = scratchBackBufferArray;
      if (this.drawBuffers) {
        this.glDrawBuffers(buffers);
      }
      var length = this._maxFrameTextureUnitIndex;
      this._maxFrameTextureUnitIndex = 0;
      for (var i = 0; i < length; ++i) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
      }
    };
    Context.prototype.readPixels = function(readState) {
      var gl = this._gl;
      readState = readState || {};
      var x = Math.max(readState.x || 0, 0);
      var y = Math.max(readState.y || 0, 0);
      var width = readState.width || gl.drawingBufferWidth;
      var height = readState.height || gl.drawingBufferHeight;
      var framebuffer = readState.framebuffer;
      if (width <= 0) {
        throw new DeveloperError('readState.width must be greater than zero.');
      }
      if (height <= 0) {
        throw new DeveloperError('readState.height must be greater than zero.');
      }
      var pixels = new Uint8Array(4 * width * height);
      bindFramebuffer(this, framebuffer);
      gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    };
    var viewportQuadAttributeLocations = {
      position: 0,
      textureCoordinates: 1
    };
    Context.prototype.getViewportQuadVertexArray = function() {
      var vertexArray = this.cache.viewportQuad_vertexArray;
      if (!defined(vertexArray)) {
        var geometry = new Geometry({
          attributes: {
            position: new GeometryAttribute({
              componentDatatype: ComponentDatatype.FLOAT,
              componentsPerAttribute: 2,
              values: [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]
            }),
            textureCoordinates: new GeometryAttribute({
              componentDatatype: ComponentDatatype.FLOAT,
              componentsPerAttribute: 2,
              values: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]
            })
          },
          indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
          primitiveType: PrimitiveType.TRIANGLES
        });
        vertexArray = VertexArray.fromGeometry({
          context: this,
          geometry: geometry,
          attributeLocations: viewportQuadAttributeLocations,
          bufferUsage: BufferUsage.STATIC_DRAW,
          interleave: true
        });
        this.cache.viewportQuad_vertexArray = vertexArray;
      }
      return vertexArray;
    };
    Context.prototype.createViewportQuadCommand = function(fragmentShaderSource, overrides) {
      overrides = defaultValue(overrides, defaultValue.EMPTY_OBJECT);
      return new DrawCommand({
        vertexArray: this.getViewportQuadVertexArray(),
        primitiveType: PrimitiveType.TRIANGLES,
        renderState: overrides.renderState,
        shaderProgram: ShaderProgram.fromCache({
          context: this,
          vertexShaderSource: ViewportQuadVS,
          fragmentShaderSource: fragmentShaderSource,
          attributeLocations: viewportQuadAttributeLocations
        }),
        uniformMap: overrides.uniformMap,
        owner: overrides.owner,
        framebuffer: overrides.framebuffer
      });
    };
    Context.prototype.createPickFramebuffer = function() {
      return new PickFramebuffer(this);
    };
    Context.prototype.getObjectByPickColor = function(pickColor) {
      if (!defined(pickColor)) {
        throw new DeveloperError('pickColor is required.');
      }
      return this._pickObjects[pickColor.toRgba()];
    };
    function PickId(pickObjects, key, color) {
      this._pickObjects = pickObjects;
      this.key = key;
      this.color = color;
    }
    defineProperties(PickId.prototype, {object: {
        get: function() {
          return this._pickObjects[this.key];
        },
        set: function(value) {
          this._pickObjects[this.key] = value;
        }
      }});
    PickId.prototype.destroy = function() {
      delete this._pickObjects[this.key];
      return undefined;
    };
    Context.prototype.createPickId = function(object) {
      if (!defined(object)) {
        throw new DeveloperError('object is required.');
      }
      ++this._nextPickColor[0];
      var key = this._nextPickColor[0];
      if (key === 0) {
        throw new RuntimeError('Out of unique Pick IDs.');
      }
      this._pickObjects[key] = object;
      return new PickId(this._pickObjects, key, Color.fromRgba(key));
    };
    Context.prototype.isDestroyed = function() {
      return false;
    };
    Context.prototype.destroy = function() {
      var cache = this.cache;
      for (var property in cache) {
        if (cache.hasOwnProperty(property)) {
          var propertyValue = cache[property];
          if (defined(propertyValue.destroy)) {
            propertyValue.destroy();
          }
        }
      }
      this._shaderCache = this._shaderCache.destroy();
      this._defaultTexture = this._defaultTexture && this._defaultTexture.destroy();
      this._defaultCubeMap = this._defaultCubeMap && this._defaultCubeMap.destroy();
      return destroyObject(this);
    };
    return Context;
  });
})(require('buffer').Buffer);
