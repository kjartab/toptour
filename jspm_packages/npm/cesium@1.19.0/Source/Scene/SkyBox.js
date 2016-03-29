/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/BoxGeometry', '../Core/Cartesian3', '../Core/defaultValue', '../Core/defined', '../Core/destroyObject', '../Core/DeveloperError', '../Core/GeometryPipeline', '../Core/Matrix4', '../Core/VertexFormat', '../Renderer/BufferUsage', '../Renderer/CubeMap', '../Renderer/DrawCommand', '../Renderer/loadCubeMap', '../Renderer/RenderState', '../Renderer/ShaderProgram', '../Renderer/VertexArray', '../Shaders/SkyBoxFS', '../Shaders/SkyBoxVS', './BlendingState', './SceneMode'], function(BoxGeometry, Cartesian3, defaultValue, defined, destroyObject, DeveloperError, GeometryPipeline, Matrix4, VertexFormat, BufferUsage, CubeMap, DrawCommand, loadCubeMap, RenderState, ShaderProgram, VertexArray, SkyBoxFS, SkyBoxVS, BlendingState, SceneMode) {
    'use strict';
    function SkyBox(options) {
      this.sources = options.sources;
      this._sources = undefined;
      this.show = defaultValue(options.show, true);
      this._command = new DrawCommand({
        modelMatrix: Matrix4.clone(Matrix4.IDENTITY),
        owner: this
      });
      this._cubeMap = undefined;
    }
    SkyBox.prototype.update = function(frameState) {
      if (!this.show) {
        return undefined;
      }
      if ((frameState.mode !== SceneMode.SCENE3D) && (frameState.mode !== SceneMode.MORPHING)) {
        return undefined;
      }
      if (!frameState.passes.render) {
        return undefined;
      }
      var context = frameState.context;
      if (this._sources !== this.sources) {
        this._sources = this.sources;
        var sources = this.sources;
        if ((!defined(sources.positiveX)) || (!defined(sources.negativeX)) || (!defined(sources.positiveY)) || (!defined(sources.negativeY)) || (!defined(sources.positiveZ)) || (!defined(sources.negativeZ))) {
          throw new DeveloperError('this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.');
        }
        if ((typeof sources.positiveX !== typeof sources.negativeX) || (typeof sources.positiveX !== typeof sources.positiveY) || (typeof sources.positiveX !== typeof sources.negativeY) || (typeof sources.positiveX !== typeof sources.positiveZ) || (typeof sources.positiveX !== typeof sources.negativeZ)) {
          throw new DeveloperError('this.sources properties must all be the same type.');
        }
        if (typeof sources.positiveX === 'string') {
          loadCubeMap(context, this._sources).then(function(cubeMap) {
            that._cubeMap = that._cubeMap && that._cubeMap.destroy();
            that._cubeMap = cubeMap;
          });
        } else {
          this._cubeMap = this._cubeMap && this._cubeMap.destroy();
          this._cubeMap = new CubeMap({
            context: context,
            source: sources
          });
        }
      }
      var command = this._command;
      if (!defined(command.vertexArray)) {
        var that = this;
        command.uniformMap = {u_cubeMap: function() {
            return that._cubeMap;
          }};
        var geometry = BoxGeometry.createGeometry(BoxGeometry.fromDimensions({
          dimensions: new Cartesian3(2.0, 2.0, 2.0),
          vertexFormat: VertexFormat.POSITION_ONLY
        }));
        var attributeLocations = GeometryPipeline.createAttributeLocations(geometry);
        command.vertexArray = VertexArray.fromGeometry({
          context: context,
          geometry: geometry,
          attributeLocations: attributeLocations,
          bufferUsage: BufferUsage.STATIC_DRAW
        });
        command.shaderProgram = ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: SkyBoxVS,
          fragmentShaderSource: SkyBoxFS,
          attributeLocations: attributeLocations
        });
        command.renderState = RenderState.fromCache({blending: BlendingState.ALPHA_BLEND});
      }
      if (!defined(this._cubeMap)) {
        return undefined;
      }
      return command;
    };
    SkyBox.prototype.isDestroyed = function() {
      return false;
    };
    SkyBox.prototype.destroy = function() {
      var command = this._command;
      command.vertexArray = command.vertexArray && command.vertexArray.destroy();
      command.shaderProgram = command.shaderProgram && command.shaderProgram.destroy();
      this._cubeMap = this._cubeMap && this._cubeMap.destroy();
      return destroyObject(this);
    };
    return SkyBox;
  });
})(require('buffer').Buffer);
