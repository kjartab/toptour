/* */ 
"format cjs";
(function(process) {
  define(['../Core/defaultValue', '../Core/PrimitiveType', '../Scene/Pass'], function(defaultValue, PrimitiveType, Pass) {
    'use strict';
    function ComputeCommand(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      this.vertexArray = options.vertexArray;
      this.fragmentShaderSource = options.fragmentShaderSource;
      this.shaderProgram = options.shaderProgram;
      this.uniformMap = options.uniformMap;
      this.outputTexture = options.outputTexture;
      this.preExecute = options.preExecute;
      this.postExecute = options.postExecute;
      this.persists = defaultValue(options.persists, false);
      this.pass = Pass.COMPUTE;
      this.owner = options.owner;
    }
    ComputeCommand.prototype.execute = function(computeEngine) {
      computeEngine.execute(this);
    };
    return ComputeCommand;
  });
})(require('process'));
