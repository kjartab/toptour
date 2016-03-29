/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/BoundingSphere', '../Core/BoxGeometry', '../Core/Cartesian3', '../Core/combine', '../Core/defaultValue', '../Core/defined', '../Core/destroyObject', '../Core/DeveloperError', '../Core/Matrix4', '../Core/VertexFormat', '../Renderer/BufferUsage', '../Renderer/DrawCommand', '../Renderer/RenderState', '../Renderer/ShaderProgram', '../Renderer/ShaderSource', '../Renderer/VertexArray', '../Shaders/EllipsoidFS', '../Shaders/EllipsoidVS', './BlendingState', './CullFace', './Material', './Pass', './SceneMode'], function(BoundingSphere, BoxGeometry, Cartesian3, combine, defaultValue, defined, destroyObject, DeveloperError, Matrix4, VertexFormat, BufferUsage, DrawCommand, RenderState, ShaderProgram, ShaderSource, VertexArray, EllipsoidFS, EllipsoidVS, BlendingState, CullFace, Material, Pass, SceneMode) {
    'use strict';
    var attributeLocations = {position: 0};
    function EllipsoidPrimitive(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      this.center = Cartesian3.clone(defaultValue(options.center, Cartesian3.ZERO));
      this._center = new Cartesian3();
      this.radii = Cartesian3.clone(options.radii);
      this._radii = new Cartesian3();
      this._oneOverEllipsoidRadiiSquared = new Cartesian3();
      this._boundingSphere = new BoundingSphere();
      this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
      this._modelMatrix = new Matrix4();
      this._computedModelMatrix = new Matrix4();
      this.show = defaultValue(options.show, true);
      this.material = defaultValue(options.material, Material.fromType(Material.ColorType));
      this._material = undefined;
      this._translucent = undefined;
      this.id = options.id;
      this._id = undefined;
      this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);
      this.onlySunLighting = defaultValue(options.onlySunLighting, false);
      this._onlySunLighting = false;
      this._depthTestEnabled = defaultValue(options.depthTestEnabled, true);
      this._sp = undefined;
      this._rs = undefined;
      this._va = undefined;
      this._pickSP = undefined;
      this._pickId = undefined;
      this._colorCommand = new DrawCommand({owner: defaultValue(options._owner, this)});
      this._pickCommand = new DrawCommand({owner: defaultValue(options._owner, this)});
      var that = this;
      this._uniforms = {
        u_radii: function() {
          return that.radii;
        },
        u_oneOverEllipsoidRadiiSquared: function() {
          return that._oneOverEllipsoidRadiiSquared;
        }
      };
      this._pickUniforms = {czm_pickColor: function() {
          return that._pickId.color;
        }};
    }
    function getVertexArray(context) {
      var vertexArray = context.cache.ellipsoidPrimitive_vertexArray;
      if (defined(vertexArray)) {
        return vertexArray;
      }
      var geometry = BoxGeometry.createGeometry(BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(2.0, 2.0, 2.0),
        vertexFormat: VertexFormat.POSITION_ONLY
      }));
      vertexArray = VertexArray.fromGeometry({
        context: context,
        geometry: geometry,
        attributeLocations: attributeLocations,
        bufferUsage: BufferUsage.STATIC_DRAW,
        interleave: true
      });
      context.cache.ellipsoidPrimitive_vertexArray = vertexArray;
      return vertexArray;
    }
    EllipsoidPrimitive.prototype.update = function(frameState) {
      if (!this.show || (frameState.mode !== SceneMode.SCENE3D) || (!defined(this.center)) || (!defined(this.radii))) {
        return;
      }
      if (!defined(this.material)) {
        throw new DeveloperError('this.material must be defined.');
      }
      var context = frameState.context;
      var translucent = this.material.isTranslucent();
      var translucencyChanged = this._translucent !== translucent;
      if (!defined(this._rs) || translucencyChanged) {
        this._translucent = translucent;
        this._rs = RenderState.fromCache({
          cull: {
            enabled: true,
            face: CullFace.FRONT
          },
          depthTest: {enabled: this._depthTestEnabled},
          depthMask: !translucent && context.fragmentDepth,
          blending: translucent ? BlendingState.ALPHA_BLEND : undefined
        });
      }
      if (!defined(this._va)) {
        this._va = getVertexArray(context);
      }
      var boundingSphereDirty = false;
      var radii = this.radii;
      if (!Cartesian3.equals(this._radii, radii)) {
        Cartesian3.clone(radii, this._radii);
        var r = this._oneOverEllipsoidRadiiSquared;
        r.x = 1.0 / (radii.x * radii.x);
        r.y = 1.0 / (radii.y * radii.y);
        r.z = 1.0 / (radii.z * radii.z);
        boundingSphereDirty = true;
      }
      if (!Matrix4.equals(this.modelMatrix, this._modelMatrix) || !Cartesian3.equals(this.center, this._center)) {
        Matrix4.clone(this.modelMatrix, this._modelMatrix);
        Cartesian3.clone(this.center, this._center);
        Matrix4.multiplyByTranslation(this.modelMatrix, this.center, this._computedModelMatrix);
        boundingSphereDirty = true;
      }
      if (boundingSphereDirty) {
        Cartesian3.clone(Cartesian3.ZERO, this._boundingSphere.center);
        this._boundingSphere.radius = Cartesian3.maximumComponent(radii);
        BoundingSphere.transform(this._boundingSphere, this._computedModelMatrix, this._boundingSphere);
      }
      var materialChanged = this._material !== this.material;
      this._material = this.material;
      this._material.update(context);
      var lightingChanged = this.onlySunLighting !== this._onlySunLighting;
      this._onlySunLighting = this.onlySunLighting;
      var colorCommand = this._colorCommand;
      var fs;
      if (materialChanged || lightingChanged || translucencyChanged) {
        fs = new ShaderSource({sources: [this.material.shaderSource, EllipsoidFS]});
        if (this.onlySunLighting) {
          fs.defines.push('ONLY_SUN_LIGHTING');
        }
        if (!translucent && context.fragmentDepth) {
          fs.defines.push('WRITE_DEPTH');
        }
        this._sp = ShaderProgram.replaceCache({
          context: context,
          shaderProgram: this._sp,
          vertexShaderSource: EllipsoidVS,
          fragmentShaderSource: fs,
          attributeLocations: attributeLocations
        });
        colorCommand.vertexArray = this._va;
        colorCommand.renderState = this._rs;
        colorCommand.shaderProgram = this._sp;
        colorCommand.uniformMap = combine(this._uniforms, this.material._uniforms);
        colorCommand.executeInClosestFrustum = translucent;
      }
      var commandList = frameState.commandList;
      var passes = frameState.passes;
      if (passes.render) {
        colorCommand.boundingVolume = this._boundingSphere;
        colorCommand.debugShowBoundingVolume = this.debugShowBoundingVolume;
        colorCommand.modelMatrix = this._computedModelMatrix;
        colorCommand.pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;
        commandList.push(colorCommand);
      }
      if (passes.pick) {
        var pickCommand = this._pickCommand;
        if (!defined(this._pickId) || (this._id !== this.id)) {
          this._id = this.id;
          this._pickId = this._pickId && this._pickId.destroy();
          this._pickId = context.createPickId({
            primitive: this,
            id: this.id
          });
        }
        if (materialChanged || lightingChanged || !defined(this._pickSP)) {
          fs = new ShaderSource({
            sources: [this.material.shaderSource, EllipsoidFS],
            pickColorQualifier: 'uniform'
          });
          if (this.onlySunLighting) {
            fs.defines.push('ONLY_SUN_LIGHTING');
          }
          if (!translucent && context.fragmentDepth) {
            fs.defines.push('WRITE_DEPTH');
          }
          this._pickSP = ShaderProgram.replaceCache({
            context: context,
            shaderProgram: this._pickSP,
            vertexShaderSource: EllipsoidVS,
            fragmentShaderSource: fs,
            attributeLocations: attributeLocations
          });
          pickCommand.vertexArray = this._va;
          pickCommand.renderState = this._rs;
          pickCommand.shaderProgram = this._pickSP;
          pickCommand.uniformMap = combine(combine(this._uniforms, this._pickUniforms), this.material._uniforms);
          pickCommand.executeInClosestFrustum = translucent;
        }
        pickCommand.boundingVolume = this._boundingSphere;
        pickCommand.modelMatrix = this._computedModelMatrix;
        pickCommand.pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;
        commandList.push(pickCommand);
      }
    };
    EllipsoidPrimitive.prototype.isDestroyed = function() {
      return false;
    };
    EllipsoidPrimitive.prototype.destroy = function() {
      this._sp = this._sp && this._sp.destroy();
      this._pickSP = this._pickSP && this._pickSP.destroy();
      this._pickId = this._pickId && this._pickId.destroy();
      return destroyObject(this);
    };
    return EllipsoidPrimitive;
  });
})(require('buffer').Buffer);
