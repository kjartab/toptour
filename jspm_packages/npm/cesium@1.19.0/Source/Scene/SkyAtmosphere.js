/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/Cartesian3', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/Ellipsoid', '../Core/EllipsoidGeometry', '../Core/GeometryPipeline', '../Core/VertexFormat', '../Renderer/BufferUsage', '../Renderer/DrawCommand', '../Renderer/RenderState', '../Renderer/ShaderProgram', '../Renderer/ShaderSource', '../Renderer/VertexArray', '../Shaders/SkyAtmosphereFS', '../Shaders/SkyAtmosphereVS', './BlendingState', './CullFace', './SceneMode'], function(Cartesian3, defaultValue, defined, defineProperties, destroyObject, Ellipsoid, EllipsoidGeometry, GeometryPipeline, VertexFormat, BufferUsage, DrawCommand, RenderState, ShaderProgram, ShaderSource, VertexArray, SkyAtmosphereFS, SkyAtmosphereVS, BlendingState, CullFace, SceneMode) {
    'use strict';
    function SkyAtmosphere(ellipsoid) {
      ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
      this.show = true;
      this._ellipsoid = ellipsoid;
      this._command = new DrawCommand({owner: this});
      this._spSkyFromSpace = undefined;
      this._spSkyFromAtmosphere = undefined;
      this._fCameraHeight = undefined;
      this._fCameraHeight2 = undefined;
      this._outerRadius = Cartesian3.maximumComponent(Cartesian3.multiplyByScalar(ellipsoid.radii, 1.025, new Cartesian3()));
      var innerRadius = ellipsoid.maximumRadius;
      var rayleighScaleDepth = 0.25;
      var that = this;
      this._command.uniformMap = {
        fCameraHeight: function() {
          return that._fCameraHeight;
        },
        fCameraHeight2: function() {
          return that._fCameraHeight2;
        },
        fOuterRadius: function() {
          return that._outerRadius;
        },
        fOuterRadius2: function() {
          return that._outerRadius * that._outerRadius;
        },
        fInnerRadius: function() {
          return innerRadius;
        },
        fScale: function() {
          return 1.0 / (that._outerRadius - innerRadius);
        },
        fScaleDepth: function() {
          return rayleighScaleDepth;
        },
        fScaleOverScaleDepth: function() {
          return (1.0 / (that._outerRadius - innerRadius)) / rayleighScaleDepth;
        }
      };
    }
    defineProperties(SkyAtmosphere.prototype, {ellipsoid: {get: function() {
          return this._ellipsoid;
        }}});
    SkyAtmosphere.prototype.update = function(frameState) {
      if (!this.show) {
        return undefined;
      }
      if ((frameState.mode !== SceneMode.SCENE3D) && (frameState.mode !== SceneMode.MORPHING)) {
        return undefined;
      }
      if (!frameState.passes.render) {
        return undefined;
      }
      var command = this._command;
      if (!defined(command.vertexArray)) {
        var context = frameState.context;
        var geometry = EllipsoidGeometry.createGeometry(new EllipsoidGeometry({
          radii: Cartesian3.multiplyByScalar(this._ellipsoid.radii, 1.025, new Cartesian3()),
          slicePartitions: 256,
          stackPartitions: 256,
          vertexFormat: VertexFormat.POSITION_ONLY
        }));
        command.vertexArray = VertexArray.fromGeometry({
          context: context,
          geometry: geometry,
          attributeLocations: GeometryPipeline.createAttributeLocations(geometry),
          bufferUsage: BufferUsage.STATIC_DRAW
        });
        command.renderState = RenderState.fromCache({
          cull: {
            enabled: true,
            face: CullFace.FRONT
          },
          blending: BlendingState.ALPHA_BLEND
        });
        var vs = new ShaderSource({
          defines: ['SKY_FROM_SPACE'],
          sources: [SkyAtmosphereVS]
        });
        this._spSkyFromSpace = ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: vs,
          fragmentShaderSource: SkyAtmosphereFS
        });
        vs = new ShaderSource({
          defines: ['SKY_FROM_ATMOSPHERE'],
          sources: [SkyAtmosphereVS]
        });
        this._spSkyFromAtmosphere = ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: vs,
          fragmentShaderSource: SkyAtmosphereFS
        });
      }
      var cameraPosition = frameState.camera.positionWC;
      this._fCameraHeight2 = Cartesian3.magnitudeSquared(cameraPosition);
      this._fCameraHeight = Math.sqrt(this._fCameraHeight2);
      if (this._fCameraHeight > this._outerRadius) {
        command.shaderProgram = this._spSkyFromSpace;
      } else {
        command.shaderProgram = this._spSkyFromAtmosphere;
      }
      return command;
    };
    SkyAtmosphere.prototype.isDestroyed = function() {
      return false;
    };
    SkyAtmosphere.prototype.destroy = function() {
      var command = this._command;
      command.vertexArray = command.vertexArray && command.vertexArray.destroy();
      this._spSkyFromSpace = this._spSkyFromSpace && this._spSkyFromSpace.destroy();
      this._spSkyFromAtmosphere = this._spSkyFromAtmosphere && this._spSkyFromAtmosphere.destroy();
      return destroyObject(this);
    };
    return SkyAtmosphere;
  });
})(require('buffer').Buffer);
