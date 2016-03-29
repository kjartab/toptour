/* */ 
"format cjs";
(function(Buffer) {
  define(['../Core/BoundingSphere', '../Core/Cartesian2', '../Core/Cartesian3', '../Core/clone', '../Core/combine', '../Core/ComponentDatatype', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/DeveloperError', '../Core/FeatureDetection', '../Core/Geometry', '../Core/GeometryAttribute', '../Core/GeometryAttributes', '../Core/GeometryInstance', '../Core/GeometryInstanceAttribute', '../Core/isArray', '../Core/Matrix4', '../Core/subdivideArray', '../Core/TaskProcessor', '../Renderer/Buffer', '../Renderer/BufferUsage', '../Renderer/DrawCommand', '../Renderer/RenderState', '../Renderer/ShaderProgram', '../Renderer/ShaderSource', '../Renderer/VertexArray', '../ThirdParty/when', './CullFace', './Pass', './PrimitivePipeline', './PrimitiveState', './SceneMode'], function(BoundingSphere, Cartesian2, Cartesian3, clone, combine, ComponentDatatype, defaultValue, defined, defineProperties, destroyObject, DeveloperError, FeatureDetection, Geometry, GeometryAttribute, GeometryAttributes, GeometryInstance, GeometryInstanceAttribute, isArray, Matrix4, subdivideArray, TaskProcessor, Buffer, BufferUsage, DrawCommand, RenderState, ShaderProgram, ShaderSource, VertexArray, when, CullFace, Pass, PrimitivePipeline, PrimitiveState, SceneMode) {
    'use strict';
    function Primitive(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      this.geometryInstances = options.geometryInstances;
      this.appearance = options.appearance;
      this._appearance = undefined;
      this._material = undefined;
      this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
      this._modelMatrix = new Matrix4();
      this.show = defaultValue(options.show, true);
      this._vertexCacheOptimize = defaultValue(options.vertexCacheOptimize, false);
      this._interleave = defaultValue(options.interleave, false);
      this._releaseGeometryInstances = defaultValue(options.releaseGeometryInstances, true);
      this._allowPicking = defaultValue(options.allowPicking, true);
      this._asynchronous = defaultValue(options.asynchronous, true);
      this._compressVertices = defaultValue(options.compressVertices, true);
      this.cull = defaultValue(options.cull, true);
      this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);
      this.rtcCenter = options.rtcCenter;
      this._modifiedModelView = new Matrix4();
      if (defined(this.rtcCenter) && (!defined(this.geometryInstances) || (isArray(this.geometryInstances) && this.geometryInstances !== 1))) {
        throw new DeveloperError('Relative-to-center rendering only supports one geometry instance.');
      }
      this._translucent = undefined;
      this._state = PrimitiveState.READY;
      this._geometries = [];
      this._vaAttributes = undefined;
      this._error = undefined;
      this._numberOfInstances = 0;
      this._validModelMatrix = false;
      this._boundingSpheres = [];
      this._boundingSphereWC = [];
      this._boundingSphereCV = [];
      this._boundingSphere2D = [];
      this._boundingSphereMorph = [];
      this._perInstanceAttributeLocations = undefined;
      this._perInstanceAttributeCache = [];
      this._instanceIds = [];
      this._lastPerInstanceAttributeIndex = 0;
      this._dirtyAttributes = [];
      this._va = [];
      this._attributeLocations = undefined;
      this._primitiveType = undefined;
      this._frontFaceRS = undefined;
      this._backFaceRS = undefined;
      this._sp = undefined;
      this._pickRS = undefined;
      this._pickSP = undefined;
      this._pickIds = [];
      this._colorCommands = [];
      this._pickCommands = [];
      this._readOnlyInstanceAttributes = options._readOnlyInstanceAttributes;
      this._createBoundingVolumeFunction = options._createBoundingVolumeFunction;
      this._createRenderStatesFunction = options._createRenderStatesFunction;
      this._createShaderProgramFunction = options._createShaderProgramFunction;
      this._createCommandsFunction = options._createCommandsFunction;
      this._updateAndQueueCommandsFunction = options._updateAndQueueCommandsFunction;
      this._createPickOffsets = options._createPickOffsets;
      this._pickOffsets = undefined;
      this._createGeometryResults = undefined;
      this._ready = false;
      this._readyPromise = when.defer();
    }
    defineProperties(Primitive.prototype, {
      vertexCacheOptimize: {get: function() {
          return this._vertexCacheOptimize;
        }},
      interleave: {get: function() {
          return this._interleave;
        }},
      releaseGeometryInstances: {get: function() {
          return this._releaseGeometryInstances;
        }},
      allowPicking: {get: function() {
          return this._allowPicking;
        }},
      asynchronous: {get: function() {
          return this._asynchronous;
        }},
      compressVertices: {get: function() {
          return this._compressVertices;
        }},
      ready: {get: function() {
          return this._ready;
        }},
      readyPromise: {get: function() {
          return this._readyPromise.promise;
        }}
    });
    function cloneAttribute(attribute) {
      return new GeometryAttribute({
        componentDatatype: attribute.componentDatatype,
        componentsPerAttribute: attribute.componentsPerAttribute,
        normalize: attribute.normalize,
        values: new attribute.values.constructor(attribute.values)
      });
    }
    function cloneGeometry(geometry) {
      var attributes = geometry.attributes;
      var newAttributes = new GeometryAttributes();
      for (var property in attributes) {
        if (attributes.hasOwnProperty(property) && defined(attributes[property])) {
          newAttributes[property] = cloneAttribute(attributes[property]);
        }
      }
      var indices;
      if (defined(geometry.indices)) {
        var sourceValues = geometry.indices;
        indices = new sourceValues.constructor(sourceValues);
      }
      return new Geometry({
        attributes: newAttributes,
        indices: indices,
        primitiveType: geometry.primitiveType,
        boundingSphere: BoundingSphere.clone(geometry.boundingSphere)
      });
    }
    function cloneGeometryInstanceAttribute(attribute) {
      return new GeometryInstanceAttribute({
        componentDatatype: attribute.componentDatatype,
        componentsPerAttribute: attribute.componentsPerAttribute,
        normalize: attribute.normalize,
        value: new attribute.value.constructor(attribute.value)
      });
    }
    function cloneInstance(instance, geometry) {
      var attributes = instance.attributes;
      var newAttributes = {};
      for (var property in attributes) {
        if (attributes.hasOwnProperty(property)) {
          newAttributes[property] = cloneGeometryInstanceAttribute(attributes[property]);
        }
      }
      return new GeometryInstance({
        geometry: geometry,
        modelMatrix: Matrix4.clone(instance.modelMatrix),
        attributes: newAttributes,
        pickPrimitive: instance.pickPrimitive,
        id: instance.id
      });
    }
    var positionRegex = /attribute\s+vec(?:3|4)\s+(.*)3DHigh;/g;
    Primitive._modifyShaderPosition = function(primitive, vertexShaderSource, scene3DOnly) {
      var match;
      var forwardDecl = '';
      var attributes = '';
      var computeFunctions = '';
      while ((match = positionRegex.exec(vertexShaderSource)) !== null) {
        var name = match[1];
        var functionName = 'vec4 czm_compute' + name[0].toUpperCase() + name.substr(1) + '()';
        if (functionName !== 'vec4 czm_computePosition()') {
          forwardDecl += functionName + ';\n';
        }
        if (!defined(primitive.rtcCenter)) {
          if (!scene3DOnly) {
            attributes += 'attribute vec3 ' + name + '2DHigh;\n' + 'attribute vec3 ' + name + '2DLow;\n';
            computeFunctions += functionName + '\n' + '{\n' + '    vec4 p;\n' + '    if (czm_morphTime == 1.0)\n' + '    {\n' + '        p = czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow);\n' + '    }\n' + '    else if (czm_morphTime == 0.0)\n' + '    {\n' + '        p = czm_translateRelativeToEye(' + name + '2DHigh.zxy, ' + name + '2DLow.zxy);\n' + '    }\n' + '    else\n' + '    {\n' + '        p = czm_columbusViewMorph(\n' + '                czm_translateRelativeToEye(' + name + '2DHigh.zxy, ' + name + '2DLow.zxy),\n' + '                czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow),\n' + '                czm_morphTime);\n' + '    }\n' + '    return p;\n' + '}\n\n';
          } else {
            computeFunctions += functionName + '\n' + '{\n' + '    return czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow);\n' + '}\n\n';
          }
        } else {
          vertexShaderSource = vertexShaderSource.replace(/attribute\s+vec(?:3|4)\s+position3DHigh;/g, '');
          vertexShaderSource = vertexShaderSource.replace(/attribute\s+vec(?:3|4)\s+position3DLow;/g, '');
          forwardDecl += 'uniform mat4 u_modifiedModelView;\n';
          attributes += 'attribute vec4 position;\n';
          computeFunctions += functionName + '\n' + '{\n' + '    return u_modifiedModelView * position;\n' + '}\n\n';
          vertexShaderSource = vertexShaderSource.replace(/czm_modelViewRelativeToEye\s+\*\s+/g, '');
          vertexShaderSource = vertexShaderSource.replace(/czm_modelViewProjectionRelativeToEye/g, 'czm_projection');
        }
      }
      return [forwardDecl, attributes, vertexShaderSource, computeFunctions].join('\n');
    };
    Primitive._appendShowToShader = function(primitive, vertexShaderSource) {
      if (!defined(primitive._attributeLocations.show)) {
        return vertexShaderSource;
      }
      var renamedVS = ShaderSource.replaceMain(vertexShaderSource, 'czm_non_show_main');
      var showMain = 'attribute float show;\n' + 'void main() \n' + '{ \n' + '    czm_non_show_main(); \n' + '    gl_Position *= show; \n' + '}';
      return renamedVS + '\n' + showMain;
    };
    function modifyForEncodedNormals(primitive, vertexShaderSource) {
      if (!primitive.compressVertices) {
        return vertexShaderSource;
      }
      var containsNormal = vertexShaderSource.search(/attribute\s+vec3\s+normal;/g) !== -1;
      var containsSt = vertexShaderSource.search(/attribute\s+vec2\s+st;/g) !== -1;
      if (!containsNormal && !containsSt) {
        return vertexShaderSource;
      }
      var containsTangent = vertexShaderSource.search(/attribute\s+vec3\s+tangent;/g) !== -1;
      var containsBinormal = vertexShaderSource.search(/attribute\s+vec3\s+binormal;/g) !== -1;
      var numComponents = containsSt && containsNormal ? 2.0 : 1.0;
      numComponents += containsTangent || containsBinormal ? 1 : 0;
      var type = (numComponents > 1) ? 'vec' + numComponents : 'float';
      var attributeName = 'compressedAttributes';
      var attributeDecl = 'attribute ' + type + ' ' + attributeName + ';';
      var globalDecl = '';
      var decode = '';
      if (containsSt) {
        globalDecl += 'vec2 st;\n';
        var stComponent = numComponents > 1 ? attributeName + '.x' : attributeName;
        decode += '    st = czm_decompressTextureCoordinates(' + stComponent + ');\n';
      }
      if (containsNormal && containsTangent && containsBinormal) {
        globalDecl += 'vec3 normal;\n' + 'vec3 tangent;\n' + 'vec3 binormal;\n';
        decode += '    czm_octDecode(' + attributeName + '.' + (containsSt ? 'yz' : 'xy') + ', normal, tangent, binormal);\n';
      } else {
        if (containsNormal) {
          globalDecl += 'vec3 normal;\n';
          decode += '    normal = czm_octDecode(' + attributeName + (numComponents > 1 ? '.' + (containsSt ? 'y' : 'x') : '') + ');\n';
        }
        if (containsTangent) {
          globalDecl += 'vec3 tangent;\n';
          decode += '    tangent = czm_octDecode(' + attributeName + '.' + (containsSt && containsNormal ? 'z' : 'y') + ');\n';
        }
        if (containsBinormal) {
          globalDecl += 'vec3 binormal;\n';
          decode += '    binormal = czm_octDecode(' + attributeName + '.' + (containsSt && containsNormal ? 'z' : 'y') + ');\n';
        }
      }
      var modifiedVS = vertexShaderSource;
      modifiedVS = modifiedVS.replace(/attribute\s+vec3\s+normal;/g, '');
      modifiedVS = modifiedVS.replace(/attribute\s+vec2\s+st;/g, '');
      modifiedVS = modifiedVS.replace(/attribute\s+vec3\s+tangent;/g, '');
      modifiedVS = modifiedVS.replace(/attribute\s+vec3\s+binormal;/g, '');
      modifiedVS = ShaderSource.replaceMain(modifiedVS, 'czm_non_compressed_main');
      var compressedMain = 'void main() \n' + '{ \n' + decode + '    czm_non_compressed_main(); \n' + '}';
      return [attributeDecl, globalDecl, modifiedVS, compressedMain].join('\n');
    }
    function validateShaderMatching(shaderProgram, attributeLocations) {
      var shaderAttributes = shaderProgram.vertexAttributes;
      for (var name in shaderAttributes) {
        if (shaderAttributes.hasOwnProperty(name)) {
          if (!defined(attributeLocations[name])) {
            throw new DeveloperError('Appearance/Geometry mismatch.  The appearance requires vertex shader attribute input \'' + name + '\', which was not computed as part of the Geometry.  Use the appearance\'s vertexFormat property when constructing the geometry.');
          }
        }
      }
    }
    function createPickIds(context, primitive, instances) {
      var pickColors = [];
      var length = instances.length;
      for (var i = 0; i < length; ++i) {
        var pickObject = {primitive: defaultValue(instances[i].pickPrimitive, primitive)};
        if (defined(instances[i].id)) {
          pickObject.id = instances[i].id;
        }
        var pickId = context.createPickId(pickObject);
        primitive._pickIds.push(pickId);
        pickColors.push(pickId.color);
      }
      return pickColors;
    }
    function getUniformFunction(uniforms, name) {
      return function() {
        return uniforms[name];
      };
    }
    var numberOfCreationWorkers = Math.max(FeatureDetection.hardwareConcurrency - 1, 1);
    var createGeometryTaskProcessors;
    var combineGeometryTaskProcessor = new TaskProcessor('combineGeometry', Number.POSITIVE_INFINITY);
    function loadAsynchronous(primitive, frameState) {
      var instances;
      var geometry;
      var i;
      var j;
      var instanceIds = primitive._instanceIds;
      if (primitive._state === PrimitiveState.READY) {
        instances = (isArray(primitive.geometryInstances)) ? primitive.geometryInstances : [primitive.geometryInstances];
        var length = primitive._numberOfInstances = instances.length;
        var promises = [];
        var subTasks = [];
        for (i = 0; i < length; ++i) {
          geometry = instances[i].geometry;
          instanceIds.push(instances[i].id);
          if (!defined(geometry._workerName)) {
            throw new DeveloperError('_workerName must be defined for asynchronous geometry.');
          }
          subTasks.push({
            moduleName: geometry._workerName,
            geometry: geometry
          });
        }
        if (!defined(createGeometryTaskProcessors)) {
          createGeometryTaskProcessors = new Array(numberOfCreationWorkers);
          for (i = 0; i < numberOfCreationWorkers; i++) {
            createGeometryTaskProcessors[i] = new TaskProcessor('createGeometry', Number.POSITIVE_INFINITY);
          }
        }
        var subTask;
        subTasks = subdivideArray(subTasks, numberOfCreationWorkers);
        for (i = 0; i < subTasks.length; i++) {
          var packedLength = 0;
          var workerSubTasks = subTasks[i];
          var workerSubTasksLength = workerSubTasks.length;
          for (j = 0; j < workerSubTasksLength; ++j) {
            subTask = workerSubTasks[j];
            geometry = subTask.geometry;
            if (defined(geometry.constructor.pack)) {
              subTask.offset = packedLength;
              packedLength += defaultValue(geometry.constructor.packedLength, geometry.packedLength);
            }
          }
          var subTaskTransferableObjects;
          if (packedLength > 0) {
            var array = new Float64Array(packedLength);
            subTaskTransferableObjects = [array.buffer];
            for (j = 0; j < workerSubTasksLength; ++j) {
              subTask = workerSubTasks[j];
              geometry = subTask.geometry;
              if (defined(geometry.constructor.pack)) {
                geometry.constructor.pack(geometry, array, subTask.offset);
                subTask.geometry = array;
              }
            }
          }
          promises.push(createGeometryTaskProcessors[i].scheduleTask({subTasks: subTasks[i]}, subTaskTransferableObjects));
        }
        primitive._state = PrimitiveState.CREATING;
        when.all(promises, function(results) {
          primitive._createGeometryResults = results;
          primitive._state = PrimitiveState.CREATED;
        }).otherwise(function(error) {
          setReady(primitive, frameState, PrimitiveState.FAILED, error);
        });
      } else if (primitive._state === PrimitiveState.CREATED) {
        var transferableObjects = [];
        instances = (isArray(primitive.geometryInstances)) ? primitive.geometryInstances : [primitive.geometryInstances];
        var allowPicking = primitive.allowPicking;
        var scene3DOnly = frameState.scene3DOnly;
        var projection = frameState.mapProjection;
        var promise = combineGeometryTaskProcessor.scheduleTask(PrimitivePipeline.packCombineGeometryParameters({
          createGeometryResults: primitive._createGeometryResults,
          instances: instances,
          pickIds: allowPicking ? createPickIds(frameState.context, primitive, instances) : undefined,
          ellipsoid: projection.ellipsoid,
          projection: projection,
          elementIndexUintSupported: frameState.context.elementIndexUint,
          scene3DOnly: scene3DOnly,
          allowPicking: allowPicking,
          vertexCacheOptimize: primitive.vertexCacheOptimize,
          compressVertices: primitive.compressVertices,
          modelMatrix: primitive.modelMatrix,
          createPickOffsets: primitive._createPickOffsets
        }, transferableObjects), transferableObjects);
        primitive._createGeometryResults = undefined;
        primitive._state = PrimitiveState.COMBINING;
        when(promise, function(packedResult) {
          var result = PrimitivePipeline.unpackCombineGeometryResults(packedResult);
          primitive._geometries = result.geometries;
          primitive._attributeLocations = result.attributeLocations;
          primitive._vaAttributes = result.vaAttributes;
          primitive._perInstanceAttributeLocations = result.perInstanceAttributeLocations;
          primitive.modelMatrix = Matrix4.clone(result.modelMatrix, primitive.modelMatrix);
          primitive._validModelMatrix = !Matrix4.equals(primitive.modelMatrix, Matrix4.IDENTITY);
          primitive._pickOffsets = result.pickOffsets;
          var validInstancesIndices = packedResult.validInstancesIndices;
          var invalidInstancesIndices = packedResult.invalidInstancesIndices;
          var instanceIds = primitive._instanceIds;
          var reorderedInstanceIds = new Array(instanceIds.length);
          var validLength = validInstancesIndices.length;
          for (var i = 0; i < validLength; ++i) {
            reorderedInstanceIds[i] = instanceIds[validInstancesIndices[i]];
          }
          var invalidLength = invalidInstancesIndices.length;
          for (var j = 0; j < invalidLength; ++j) {
            reorderedInstanceIds[validLength + j] = instanceIds[invalidInstancesIndices[j]];
          }
          primitive._instanceIds = reorderedInstanceIds;
          if (defined(primitive._geometries)) {
            primitive._state = PrimitiveState.COMBINED;
          } else {
            setReady(primitive, frameState, PrimitiveState.FAILED, undefined);
          }
        }).otherwise(function(error) {
          setReady(primitive, frameState, PrimitiveState.FAILED, error);
        });
      }
    }
    function loadSynchronous(primitive, frameState) {
      var instances = (isArray(primitive.geometryInstances)) ? primitive.geometryInstances : [primitive.geometryInstances];
      var length = primitive._numberOfInstances = instances.length;
      var geometries = new Array(length);
      var clonedInstances = new Array(length);
      var invalidInstances = [];
      var instanceIds = primitive._instanceIds;
      var instance;
      var i;
      var geometryIndex = 0;
      for (i = 0; i < length; i++) {
        instance = instances[i];
        var geometry = instance.geometry;
        var createdGeometry;
        if (defined(geometry.attributes) && defined(geometry.primitiveType)) {
          createdGeometry = cloneGeometry(geometry);
        } else {
          createdGeometry = geometry.constructor.createGeometry(geometry);
        }
        if (defined(createdGeometry)) {
          geometries[geometryIndex] = createdGeometry;
          clonedInstances[geometryIndex++] = cloneInstance(instance, createdGeometry);
          instanceIds.push(instance.id);
        } else {
          invalidInstances.push(instance);
        }
      }
      geometries.length = geometryIndex;
      clonedInstances.length = geometryIndex;
      var allowPicking = primitive.allowPicking;
      var scene3DOnly = frameState.scene3DOnly;
      var projection = frameState.mapProjection;
      var result = PrimitivePipeline.combineGeometry({
        instances: clonedInstances,
        invalidInstances: invalidInstances,
        pickIds: allowPicking ? createPickIds(frameState.context, primitive, clonedInstances) : undefined,
        ellipsoid: projection.ellipsoid,
        projection: projection,
        elementIndexUintSupported: frameState.context.elementIndexUint,
        scene3DOnly: scene3DOnly,
        allowPicking: allowPicking,
        vertexCacheOptimize: primitive.vertexCacheOptimize,
        compressVertices: primitive.compressVertices,
        modelMatrix: primitive.modelMatrix,
        createPickOffsets: primitive._createPickOffsets
      });
      primitive._geometries = result.geometries;
      primitive._attributeLocations = result.attributeLocations;
      primitive._vaAttributes = result.vaAttributes;
      primitive._perInstanceAttributeLocations = result.vaAttributeLocations;
      primitive.modelMatrix = Matrix4.clone(result.modelMatrix, primitive.modelMatrix);
      primitive._validModelMatrix = !Matrix4.equals(primitive.modelMatrix, Matrix4.IDENTITY);
      primitive._pickOffsets = result.pickOffsets;
      for (i = 0; i < invalidInstances.length; ++i) {
        instance = invalidInstances[i];
        instanceIds.push(instance.id);
      }
      if (defined(primitive._geometries)) {
        primitive._state = PrimitiveState.COMBINED;
      } else {
        setReady(primitive, frameState, PrimitiveState.FAILED, undefined);
      }
    }
    function createVertexArray(primitive, frameState) {
      var attributeLocations = primitive._attributeLocations;
      var geometries = primitive._geometries;
      var vaAttributes = primitive._vaAttributes;
      var scene3DOnly = frameState.scene3DOnly;
      var context = frameState.context;
      var va = [];
      var length = geometries.length;
      for (var i = 0; i < length; ++i) {
        var geometry = geometries[i];
        var attributes = vaAttributes[i];
        var vaLength = attributes.length;
        for (var j = 0; j < vaLength; ++j) {
          var attribute = attributes[j];
          attribute.vertexBuffer = Buffer.createVertexBuffer({
            context: context,
            typedArray: attribute.values,
            usage: BufferUsage.DYNAMIC_DRAW
          });
          delete attribute.values;
        }
        va.push(VertexArray.fromGeometry({
          context: context,
          geometry: geometry,
          attributeLocations: attributeLocations,
          bufferUsage: BufferUsage.STATIC_DRAW,
          interleave: primitive._interleave,
          vertexArrayAttributes: attributes
        }));
        if (defined(primitive._createBoundingVolumeFunction)) {
          primitive._createBoundingVolumeFunction(frameState, geometry);
        } else {
          primitive._boundingSpheres.push(BoundingSphere.clone(geometry.boundingSphere));
          primitive._boundingSphereWC.push(new BoundingSphere());
          if (!scene3DOnly) {
            var center = geometry.boundingSphereCV.center;
            var x = center.x;
            var y = center.y;
            var z = center.z;
            center.x = z;
            center.y = x;
            center.z = y;
            primitive._boundingSphereCV.push(BoundingSphere.clone(geometry.boundingSphereCV));
            primitive._boundingSphere2D.push(new BoundingSphere());
            primitive._boundingSphereMorph.push(new BoundingSphere());
          }
        }
      }
      primitive._va = va;
      primitive._primitiveType = geometries[0].primitiveType;
      if (primitive.releaseGeometryInstances) {
        primitive.geometryInstances = undefined;
      }
      primitive._geometries = undefined;
      setReady(primitive, frameState, PrimitiveState.COMPLETE, undefined);
    }
    function createRenderStates(primitive, context, appearance, twoPasses) {
      var renderState = appearance.getRenderState();
      var rs;
      if (twoPasses) {
        rs = clone(renderState, false);
        rs.cull = {
          enabled: true,
          face: CullFace.BACK
        };
        primitive._frontFaceRS = RenderState.fromCache(rs);
        rs.cull.face = CullFace.FRONT;
        primitive._backFaceRS = RenderState.fromCache(rs);
      } else {
        primitive._frontFaceRS = RenderState.fromCache(renderState);
        primitive._backFaceRS = primitive._frontFaceRS;
      }
      if (primitive.allowPicking) {
        if (twoPasses) {
          rs = clone(renderState, false);
          rs.cull = {enabled: false};
          primitive._pickRS = RenderState.fromCache(rs);
        } else {
          primitive._pickRS = primitive._frontFaceRS;
        }
      } else {
        rs = clone(renderState, false);
        rs.colorMask = {
          red: false,
          green: false,
          blue: false,
          alpha: false
        };
        if (twoPasses) {
          rs.cull = {enabled: false};
          primitive._pickRS = RenderState.fromCache(rs);
        } else {
          primitive._pickRS = RenderState.fromCache(rs);
        }
      }
    }
    function createShaderProgram(primitive, frameState, appearance) {
      var context = frameState.context;
      var vs = Primitive._modifyShaderPosition(primitive, appearance.vertexShaderSource, frameState.scene3DOnly);
      vs = Primitive._appendShowToShader(primitive, vs);
      vs = modifyForEncodedNormals(primitive, vs);
      var fs = appearance.getFragmentShaderSource();
      var attributeLocations = primitive._attributeLocations;
      primitive._sp = ShaderProgram.replaceCache({
        context: context,
        shaderProgram: primitive._sp,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations
      });
      validateShaderMatching(primitive._sp, attributeLocations);
      if (primitive.allowPicking) {
        var pickFS = new ShaderSource({
          sources: [fs],
          pickColorQualifier: 'varying'
        });
        primitive._pickSP = ShaderProgram.replaceCache({
          context: context,
          shaderProgram: primitive._pickSP,
          vertexShaderSource: ShaderSource.createPickVertexShaderSource(vs),
          fragmentShaderSource: pickFS,
          attributeLocations: attributeLocations
        });
      } else {
        primitive._pickSP = ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: vs,
          fragmentShaderSource: fs,
          attributeLocations: attributeLocations
        });
      }
      validateShaderMatching(primitive._pickSP, attributeLocations);
    }
    function createCommands(primitive, appearance, material, translucent, twoPasses, colorCommands, pickCommands) {
      var materialUniformMap = defined(material) ? material._uniforms : undefined;
      var appearanceUniformMap = {};
      var appearanceUniforms = appearance.uniforms;
      if (defined(appearanceUniforms)) {
        for (var name in appearanceUniforms) {
          if (appearanceUniforms.hasOwnProperty(name)) {
            if (defined(materialUniformMap) && defined(materialUniformMap[name])) {
              throw new DeveloperError('Appearance and material have a uniform with the same name: ' + name);
            }
            appearanceUniformMap[name] = getUniformFunction(appearanceUniforms, name);
          }
        }
      }
      var uniforms = combine(appearanceUniformMap, materialUniformMap);
      if (defined(primitive.rtcCenter)) {
        uniforms.u_modifiedModelView = function() {
          return primitive._modifiedModelView;
        };
      }
      var pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;
      colorCommands.length = primitive._va.length * (twoPasses ? 2 : 1);
      pickCommands.length = primitive._va.length;
      var length = colorCommands.length;
      var m = 0;
      var vaIndex = 0;
      for (var i = 0; i < length; ++i) {
        var colorCommand;
        if (twoPasses) {
          colorCommand = colorCommands[i];
          if (!defined(colorCommand)) {
            colorCommand = colorCommands[i] = new DrawCommand({
              owner: primitive,
              primitiveType: primitive._primitiveType
            });
          }
          colorCommand.vertexArray = primitive._va[vaIndex];
          colorCommand.renderState = primitive._backFaceRS;
          colorCommand.shaderProgram = primitive._sp;
          colorCommand.uniformMap = uniforms;
          colorCommand.pass = pass;
          ++i;
        }
        colorCommand = colorCommands[i];
        if (!defined(colorCommand)) {
          colorCommand = colorCommands[i] = new DrawCommand({
            owner: primitive,
            primitiveType: primitive._primitiveType
          });
        }
        colorCommand.vertexArray = primitive._va[vaIndex];
        colorCommand.renderState = primitive._frontFaceRS;
        colorCommand.shaderProgram = primitive._sp;
        colorCommand.uniformMap = uniforms;
        colorCommand.pass = pass;
        var pickCommand = pickCommands[m];
        if (!defined(pickCommand)) {
          pickCommand = pickCommands[m] = new DrawCommand({
            owner: primitive,
            primitiveType: primitive._primitiveType
          });
        }
        pickCommand.vertexArray = primitive._va[vaIndex];
        pickCommand.renderState = primitive._pickRS;
        pickCommand.shaderProgram = primitive._pickSP;
        pickCommand.uniformMap = uniforms;
        pickCommand.pass = pass;
        ++m;
        ++vaIndex;
      }
    }
    function updatePerInstanceAttributes(primitive) {
      if (primitive._dirtyAttributes.length === 0) {
        return;
      }
      var attributes = primitive._dirtyAttributes;
      var length = attributes.length;
      for (var i = 0; i < length; ++i) {
        var attribute = attributes[i];
        var value = attribute.value;
        var indices = attribute.indices;
        var indicesLength = indices.length;
        for (var j = 0; j < indicesLength; ++j) {
          var index = indices[j];
          var offset = index.offset;
          var count = index.count;
          var vaAttribute = index.attribute;
          var componentDatatype = vaAttribute.componentDatatype;
          var componentsPerAttribute = vaAttribute.componentsPerAttribute;
          var typedArray = ComponentDatatype.createTypedArray(componentDatatype, count * componentsPerAttribute);
          for (var k = 0; k < count; ++k) {
            typedArray.set(value, k * componentsPerAttribute);
          }
          var offsetInBytes = offset * componentsPerAttribute * ComponentDatatype.getSizeInBytes(componentDatatype);
          vaAttribute.vertexBuffer.copyFromArrayView(typedArray, offsetInBytes);
        }
        attribute.dirty = false;
      }
      attributes.length = 0;
    }
    function updateBoundingVolumes(primitive, frameState) {
      var pixelSize = primitive.appearance.pixelSize;
      if (defined(pixelSize)) {
        var length = primitive._boundingSpheres.length;
        for (var i = 0; i < length; ++i) {
          var boundingSphere = primitive._boundingSpheres[i];
          var boundingSphereWC = primitive._boundingSphereWC[i];
          var pixelSizeInMeters = frameState.camera.getPixelSize(boundingSphere, frameState.context.drawingBufferWidth, frameState.context.drawingBufferHeight);
          var sizeInMeters = pixelSizeInMeters * pixelSize;
          boundingSphereWC.radius = boundingSphere.radius + sizeInMeters;
        }
      }
    }
    var rtcScratch = new Cartesian3();
    function updateAndQueueCommands(primitive, frameState, colorCommands, pickCommands, modelMatrix, cull, debugShowBoundingVolume, twoPasses) {
      if (frameState.mode !== SceneMode.SCENE3D && !Matrix4.equals(modelMatrix, Matrix4.IDENTITY)) {
        throw new DeveloperError('Primitive.modelMatrix is only supported in 3D mode.');
      }
      updateBoundingVolumes(primitive, frameState);
      if (!Matrix4.equals(modelMatrix, primitive._modelMatrix)) {
        Matrix4.clone(modelMatrix, primitive._modelMatrix);
        var length = primitive._boundingSpheres.length;
        for (var i = 0; i < length; ++i) {
          var boundingSphere = primitive._boundingSpheres[i];
          if (defined(boundingSphere)) {
            primitive._boundingSphereWC[i] = BoundingSphere.transform(boundingSphere, modelMatrix, primitive._boundingSphereWC[i]);
            if (!frameState.scene3DOnly) {
              primitive._boundingSphere2D[i] = BoundingSphere.clone(primitive._boundingSphereCV[i], primitive._boundingSphere2D[i]);
              primitive._boundingSphere2D[i].center.x = 0.0;
              primitive._boundingSphereMorph[i] = BoundingSphere.union(primitive._boundingSphereWC[i], primitive._boundingSphereCV[i]);
            }
          }
        }
      }
      if (defined(primitive.rtcCenter)) {
        var viewMatrix = frameState.camera.viewMatrix;
        Matrix4.multiply(viewMatrix, primitive._modelMatrix, primitive._modifiedModelView);
        Matrix4.multiplyByPoint(primitive._modifiedModelView, primitive.rtcCenter, rtcScratch);
        Matrix4.setTranslation(primitive._modifiedModelView, rtcScratch, primitive._modifiedModelView);
      }
      var boundingSpheres;
      if (frameState.mode === SceneMode.SCENE3D) {
        boundingSpheres = primitive._boundingSphereWC;
      } else if (frameState.mode === SceneMode.COLUMBUS_VIEW) {
        boundingSpheres = primitive._boundingSphereCV;
      } else if (frameState.mode === SceneMode.SCENE2D && defined(primitive._boundingSphere2D)) {
        boundingSpheres = primitive._boundingSphere2D;
      } else if (defined(primitive._boundingSphereMorph)) {
        boundingSpheres = primitive._boundingSphereMorph;
      }
      var commandList = frameState.commandList;
      var passes = frameState.passes;
      if (passes.render) {
        var colorLength = colorCommands.length;
        for (var j = 0; j < colorLength; ++j) {
          var sphereIndex = twoPasses ? Math.floor(j / 2) : j;
          colorCommands[j].modelMatrix = modelMatrix;
          colorCommands[j].boundingVolume = boundingSpheres[sphereIndex];
          colorCommands[j].cull = cull;
          colorCommands[j].debugShowBoundingVolume = debugShowBoundingVolume;
          commandList.push(colorCommands[j]);
        }
      }
      if (passes.pick) {
        var pickLength = pickCommands.length;
        for (var k = 0; k < pickLength; ++k) {
          pickCommands[k].modelMatrix = modelMatrix;
          pickCommands[k].boundingVolume = boundingSpheres[k];
          pickCommands[k].cull = cull;
          commandList.push(pickCommands[k]);
        }
      }
    }
    Primitive.prototype.update = function(frameState) {
      if (((!defined(this.geometryInstances)) && (this._va.length === 0)) || (defined(this.geometryInstances) && isArray(this.geometryInstances) && this.geometryInstances.length === 0) || (!defined(this.appearance)) || (frameState.mode !== SceneMode.SCENE3D && frameState.scene3DOnly) || (!frameState.passes.render && !frameState.passes.pick)) {
        return;
      }
      if (defined(this._error)) {
        throw this._error;
      }
      if (defined(this.rtcCenter) && !frameState.scene3DOnly) {
        throw new DeveloperError('RTC rendering is only available for 3D only scenes.');
      }
      if (this._state === PrimitiveState.FAILED) {
        return;
      }
      if (this._state !== PrimitiveState.COMPLETE && this._state !== PrimitiveState.COMBINED) {
        if (this.asynchronous) {
          loadAsynchronous(this, frameState);
        } else {
          loadSynchronous(this, frameState);
        }
      }
      if (this._state === PrimitiveState.COMBINED) {
        createVertexArray(this, frameState);
      }
      if (!this.show || this._state !== PrimitiveState.COMPLETE) {
        return;
      }
      var appearance = this.appearance;
      var material = appearance.material;
      var createRS = false;
      var createSP = false;
      if (this._appearance !== appearance) {
        this._appearance = appearance;
        this._material = material;
        createRS = true;
        createSP = true;
      } else if (this._material !== material) {
        this._material = material;
        createSP = true;
      }
      var translucent = this._appearance.isTranslucent();
      if (this._translucent !== translucent) {
        this._translucent = translucent;
        createRS = true;
      }
      var context = frameState.context;
      if (defined(this._material)) {
        this._material.update(context);
      }
      var twoPasses = appearance.closed && translucent;
      if (createRS) {
        var rsFunc = defaultValue(this._createRenderStatesFunction, createRenderStates);
        rsFunc(this, context, appearance, twoPasses);
      }
      if (createSP) {
        var spFunc = defaultValue(this._createShaderProgramFunction, createShaderProgram);
        spFunc(this, frameState, appearance);
      }
      if (createRS || createSP) {
        var commandFunc = defaultValue(this._createCommandsFunction, createCommands);
        commandFunc(this, appearance, material, translucent, twoPasses, this._colorCommands, this._pickCommands);
      }
      updatePerInstanceAttributes(this);
      var updateAndQueueCommandsFunc = defaultValue(this._updateAndQueueCommandsFunction, updateAndQueueCommands);
      updateAndQueueCommandsFunc(this, frameState, this._colorCommands, this._pickCommands, this.modelMatrix, this.cull, this.debugShowBoundingVolume, twoPasses);
    };
    function createGetFunction(name, perInstanceAttributes) {
      var attribute = perInstanceAttributes[name];
      return function() {
        if (defined(attribute) && defined(attribute.value)) {
          return perInstanceAttributes[name].value;
        }
        return attribute;
      };
    }
    function createSetFunction(name, perInstanceAttributes, dirtyList) {
      return function(value) {
        if (!defined(value) || !defined(value.length) || value.length < 1 || value.length > 4) {
          throw new DeveloperError('value must be and array with length between 1 and 4.');
        }
        var attribute = perInstanceAttributes[name];
        attribute.value = value;
        if (!attribute.dirty && attribute.valid) {
          dirtyList.push(attribute);
          attribute.dirty = true;
        }
      };
    }
    var readOnlyInstanceAttributesScratch = ['boundingSphere', 'boundingSphereCV'];
    Primitive.prototype.getGeometryInstanceAttributes = function(id) {
      if (!defined(id)) {
        throw new DeveloperError('id is required');
      }
      if (!defined(this._perInstanceAttributeLocations)) {
        throw new DeveloperError('must call update before calling getGeometryInstanceAttributes');
      }
      var index = -1;
      var lastIndex = this._lastPerInstanceAttributeIndex;
      var ids = this._instanceIds;
      var length = ids.length;
      for (var i = 0; i < length; ++i) {
        var curIndex = (lastIndex + i) % length;
        if (id === ids[curIndex]) {
          index = curIndex;
          break;
        }
      }
      if (index === -1) {
        return undefined;
      }
      var attributes = this._perInstanceAttributeCache[index];
      if (defined(attributes)) {
        return attributes;
      }
      var perInstanceAttributes = this._perInstanceAttributeLocations[index];
      attributes = {};
      var properties = {};
      var hasProperties = false;
      for (var name in perInstanceAttributes) {
        if (perInstanceAttributes.hasOwnProperty(name)) {
          hasProperties = true;
          properties[name] = {get: createGetFunction(name, perInstanceAttributes)};
          var createSetter = true;
          var readOnlyAttributes = readOnlyInstanceAttributesScratch;
          length = readOnlyAttributes.length;
          for (var j = 0; j < length; ++j) {
            if (name === readOnlyInstanceAttributesScratch[j]) {
              createSetter = false;
              break;
            }
          }
          readOnlyAttributes = this._readOnlyInstanceAttributes;
          if (createSetter && defined(readOnlyAttributes)) {
            length = readOnlyAttributes.length;
            for (var k = 0; k < length; ++k) {
              if (name === readOnlyAttributes[k]) {
                createSetter = false;
                break;
              }
            }
          }
          if (createSetter) {
            properties[name].set = createSetFunction(name, perInstanceAttributes, this._dirtyAttributes);
          }
        }
      }
      if (hasProperties) {
        defineProperties(attributes, properties);
      }
      this._lastPerInstanceAttributeIndex = index;
      this._perInstanceAttributeCache[index] = attributes;
      return attributes;
    };
    Primitive.prototype.isDestroyed = function() {
      return false;
    };
    Primitive.prototype.destroy = function() {
      var length;
      var i;
      this._sp = this._sp && this._sp.destroy();
      this._pickSP = this._pickSP && this._pickSP.destroy();
      var va = this._va;
      length = va.length;
      for (i = 0; i < length; ++i) {
        va[i].destroy();
      }
      this._va = undefined;
      var pickIds = this._pickIds;
      length = pickIds.length;
      for (i = 0; i < length; ++i) {
        pickIds[i].destroy();
      }
      this._pickIds = undefined;
      this._instanceIds = undefined;
      this._perInstanceAttributeCache = undefined;
      this._perInstanceAttributeLocations = undefined;
      this._attributeLocations = undefined;
      this._dirtyAttributes = undefined;
      return destroyObject(this);
    };
    function setReady(primitive, frameState, state, error) {
      primitive._error = error;
      primitive._state = state;
      frameState.afterRender.push(function() {
        primitive._ready = primitive._state === PrimitiveState.COMPLETE || primitive._state === PrimitiveState.FAILED;
        if (!defined(error)) {
          primitive._readyPromise.resolve(primitive);
        } else {
          primitive._readyPromise.reject(error);
        }
      });
    }
    return Primitive;
  });
})(require('buffer').Buffer);
