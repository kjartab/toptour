/* */ 
"format cjs";
(function(process) {
  define(['../Core/BoundingRectangle', '../Core/BoundingSphere', '../Core/BoxGeometry', '../Core/Cartesian2', '../Core/Cartesian3', '../Core/Cartesian4', '../Core/Color', '../Core/ColorGeometryInstanceAttribute', '../Core/createGuid', '../Core/defaultValue', '../Core/defined', '../Core/defineProperties', '../Core/destroyObject', '../Core/DeveloperError', '../Core/EllipsoidGeometry', '../Core/Event', '../Core/GeographicProjection', '../Core/GeometryInstance', '../Core/GeometryPipeline', '../Core/getTimestamp', '../Core/Intersect', '../Core/Interval', '../Core/JulianDate', '../Core/Math', '../Core/Matrix4', '../Core/mergeSort', '../Core/Occluder', '../Core/ShowGeometryInstanceAttribute', '../Renderer/ClearCommand', '../Renderer/ComputeEngine', '../Renderer/Context', '../Renderer/ContextLimits', '../Renderer/PassState', '../Renderer/ShaderProgram', '../Renderer/ShaderSource', './Camera', './CreditDisplay', './CullingVolume', './DepthPlane', './DeviceOrientationCameraController', './Fog', './FrameState', './FrustumCommands', './FXAA', './GlobeDepth', './OIT', './OrthographicFrustum', './Pass', './PerformanceDisplay', './PerInstanceColorAppearance', './PerspectiveFrustum', './PerspectiveOffCenterFrustum', './PickDepth', './Primitive', './PrimitiveCollection', './SceneMode', './SceneTransforms', './SceneTransitioner', './ScreenSpaceCameraController', './SunPostProcess', './TweenCollection'], function(BoundingRectangle, BoundingSphere, BoxGeometry, Cartesian2, Cartesian3, Cartesian4, Color, ColorGeometryInstanceAttribute, createGuid, defaultValue, defined, defineProperties, destroyObject, DeveloperError, EllipsoidGeometry, Event, GeographicProjection, GeometryInstance, GeometryPipeline, getTimestamp, Intersect, Interval, JulianDate, CesiumMath, Matrix4, mergeSort, Occluder, ShowGeometryInstanceAttribute, ClearCommand, ComputeEngine, Context, ContextLimits, PassState, ShaderProgram, ShaderSource, Camera, CreditDisplay, CullingVolume, DepthPlane, DeviceOrientationCameraController, Fog, FrameState, FrustumCommands, FXAA, GlobeDepth, OIT, OrthographicFrustum, Pass, PerformanceDisplay, PerInstanceColorAppearance, PerspectiveFrustum, PerspectiveOffCenterFrustum, PickDepth, Primitive, PrimitiveCollection, SceneMode, SceneTransforms, SceneTransitioner, ScreenSpaceCameraController, SunPostProcess, TweenCollection) {
    'use strict';
    function Scene(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      var canvas = options.canvas;
      var contextOptions = options.contextOptions;
      var creditContainer = options.creditContainer;
      if (!defined(canvas)) {
        throw new DeveloperError('options and options.canvas are required.');
      }
      var context = new Context(canvas, contextOptions);
      if (!defined(creditContainer)) {
        creditContainer = document.createElement('div');
        creditContainer.style.position = 'absolute';
        creditContainer.style.bottom = '0';
        creditContainer.style['text-shadow'] = '0px 0px 2px #000000';
        creditContainer.style.color = '#ffffff';
        creditContainer.style['font-size'] = '10px';
        creditContainer.style['padding-right'] = '5px';
        canvas.parentNode.appendChild(creditContainer);
      }
      this._id = createGuid();
      this._frameState = new FrameState(context, new CreditDisplay(creditContainer));
      this._frameState.scene3DOnly = defaultValue(options.scene3DOnly, false);
      var ps = new PassState(context);
      ps.viewport = new BoundingRectangle();
      ps.viewport.x = 0;
      ps.viewport.y = 0;
      ps.viewport.width = context.drawingBufferWidth;
      ps.viewport.height = context.drawingBufferHeight;
      this._passState = ps;
      this._canvas = canvas;
      this._context = context;
      this._computeEngine = new ComputeEngine(context);
      this._globe = undefined;
      this._primitives = new PrimitiveCollection();
      this._groundPrimitives = new PrimitiveCollection();
      this._tweens = new TweenCollection();
      this._shaderFrameCount = 0;
      this._sunPostProcess = undefined;
      this._computeCommandList = [];
      this._frustumCommandsList = [];
      this._overlayCommandList = [];
      this._pickFramebuffer = undefined;
      this._useOIT = defaultValue(options.orderIndependentTranslucency, true);
      this._executeOITFunction = undefined;
      var globeDepth;
      if (context.depthTexture) {
        globeDepth = new GlobeDepth();
      }
      var oit;
      if (this._useOIT && defined(globeDepth)) {
        oit = new OIT(context);
      }
      this._globeDepth = globeDepth;
      this._depthPlane = new DepthPlane();
      this._oit = oit;
      this._fxaa = new FXAA();
      this._clearColorCommand = new ClearCommand({
        color: new Color(),
        stencil: 0,
        owner: this
      });
      this._depthClearCommand = new ClearCommand({
        depth: 1.0,
        owner: this
      });
      this._pickDepths = [];
      this._debugGlobeDepths = [];
      this._transitioner = new SceneTransitioner(this);
      this._renderError = new Event();
      this._preRender = new Event();
      this._postRender = new Event();
      this._cameraStartFired = false;
      this._cameraMovedTime = undefined;
      this.rethrowRenderErrors = false;
      this.completeMorphOnUserInput = true;
      this.morphStart = new Event();
      this.morphComplete = new Event();
      this.skyBox = undefined;
      this.skyAtmosphere = undefined;
      this.sun = undefined;
      this.sunBloom = true;
      this._sunBloom = undefined;
      this.moon = undefined;
      this.backgroundColor = Color.clone(Color.BLACK);
      this._mode = SceneMode.SCENE3D;
      this._mapProjection = defined(options.mapProjection) ? options.mapProjection : new GeographicProjection();
      this._transitioner = new SceneTransitioner(this, this._mapProjection.ellipsoid);
      this.morphTime = 1.0;
      this.farToNearRatio = 1000.0;
      this.debugCommandFilter = undefined;
      this.debugShowCommands = false;
      this.debugShowFrustums = false;
      this._debugFrustumStatistics = undefined;
      this.debugShowFramesPerSecond = false;
      this.debugShowGlobeDepth = false;
      this.debugShowDepthFrustum = 1;
      this.fxaa = true;
      this.useDepthPicking = true;
      this.cameraEventWaitTime = 500.0;
      this.copyGlobeDepth = false;
      this.fog = new Fog();
      this._terrainExaggeration = defaultValue(options.terrainExaggeration, 1.0);
      this._performanceDisplay = undefined;
      this._debugVolume = undefined;
      var camera = new Camera(this);
      this._camera = camera;
      this._cameraClone = Camera.clone(camera);
      this._screenSpaceCameraController = new ScreenSpaceCameraController(this);
      this._environmentState = {
        skyBoxCommand: undefined,
        skyAtmosphereCommand: undefined,
        sunDrawCommand: undefined,
        sunComputeCommand: undefined,
        moonCommand: undefined,
        isSunVisible: false,
        isMoonVisible: false,
        isSkyAtmosphereVisible: false,
        clearGlobeDepth: false,
        useDepthPlane: false,
        originalFramebuffer: undefined,
        useGlobeDepthFramebuffer: false,
        useOIT: false,
        useFXAA: false
      };
      this._useWebVR = false;
      this._cameraVR = undefined;
      this._aspectRatioVR = undefined;
      var near = camera.frustum.near;
      var far = camera.frustum.far;
      var numFrustums = Math.ceil(Math.log(far / near) / Math.log(this.farToNearRatio));
      updateFrustums(near, far, this.farToNearRatio, numFrustums, this._frustumCommandsList);
      updateFrameState(this, 0.0, JulianDate.now());
      this.initializeFrame();
    }
    var OPAQUE_FRUSTUM_NEAR_OFFSET = 0.99;
    defineProperties(Scene.prototype, {
      canvas: {get: function() {
          return this._canvas;
        }},
      drawingBufferHeight: {get: function() {
          return this._context.drawingBufferHeight;
        }},
      drawingBufferWidth: {get: function() {
          return this._context.drawingBufferWidth;
        }},
      maximumAliasedLineWidth: {get: function() {
          return ContextLimits.maximumAliasedLineWidth;
        }},
      maximumCubeMapSize: {get: function() {
          return ContextLimits.maximumCubeMapSize;
        }},
      pickPositionSupported: {get: function() {
          return this._context.depthTexture;
        }},
      globe: {
        get: function() {
          return this._globe;
        },
        set: function(globe) {
          this._globe = this._globe && this._globe.destroy();
          this._globe = globe;
        }
      },
      primitives: {get: function() {
          return this._primitives;
        }},
      groundPrimitives: {get: function() {
          return this._groundPrimitives;
        }},
      camera: {get: function() {
          return this._camera;
        }},
      screenSpaceCameraController: {get: function() {
          return this._screenSpaceCameraController;
        }},
      mapProjection: {get: function() {
          return this._mapProjection;
        }},
      frameState: {get: function() {
          return this._frameState;
        }},
      tweens: {get: function() {
          return this._tweens;
        }},
      imageryLayers: {get: function() {
          return this.globe.imageryLayers;
        }},
      terrainProvider: {
        get: function() {
          return this.globe.terrainProvider;
        },
        set: function(terrainProvider) {
          this.globe.terrainProvider = terrainProvider;
        }
      },
      renderError: {get: function() {
          return this._renderError;
        }},
      preRender: {get: function() {
          return this._preRender;
        }},
      postRender: {get: function() {
          return this._postRender;
        }},
      context: {get: function() {
          return this._context;
        }},
      debugFrustumStatistics: {get: function() {
          return this._debugFrustumStatistics;
        }},
      scene3DOnly: {get: function() {
          return this._frameState.scene3DOnly;
        }},
      orderIndependentTranslucency: {get: function() {
          return defined(this._oit);
        }},
      id: {get: function() {
          return this._id;
        }},
      mode: {
        get: function() {
          return this._mode;
        },
        set: function(value) {
          if (this.scene3DOnly && value !== SceneMode.SCENE3D) {
            throw new DeveloperError('Only SceneMode.SCENE3D is valid when scene3DOnly is true.');
          }
          if (value === SceneMode.SCENE2D) {
            this.morphTo2D(0);
          } else if (value === SceneMode.SCENE3D) {
            this.morphTo3D(0);
          } else if (value === SceneMode.COLUMBUS_VIEW) {
            this.morphToColumbusView(0);
          } else {
            throw new DeveloperError('value must be a valid SceneMode enumeration.');
          }
          this._mode = value;
        }
      },
      numberOfFrustums: {get: function() {
          return this._frustumCommandsList.length;
        }},
      terrainExaggeration: {get: function() {
          return this._terrainExaggeration;
        }},
      useWebVR: {
        get: function() {
          return this._useWebVR;
        },
        set: function(value) {
          this._useWebVR = value;
          if (this._useWebVR) {
            this._frameState.creditDisplay.container.style.visibility = 'hidden';
            this._cameraVR = new Camera(this);
            if (!defined(this._deviceOrientationCameraController)) {
              this._deviceOrientationCameraController = new DeviceOrientationCameraController(this);
            }
            this._aspectRatioVR = this._camera.frustum.aspectRatio;
          } else {
            this._frameState.creditDisplay.container.style.visibility = 'visible';
            this._cameraVR = undefined;
            this._deviceOrientationCameraController = this._deviceOrientationCameraController && !this._deviceOrientationCameraController.isDestroyed() && this._deviceOrientationCameraController.destroy();
            this._camera.frustum.aspectRatio = this._aspectRatioVR;
            this._camera.frustum.xOffset = 0.0;
          }
        }
      }
    });
    var scratchPosition0 = new Cartesian3();
    var scratchPosition1 = new Cartesian3();
    function maxComponent(a, b) {
      var x = Math.max(Math.abs(a.x), Math.abs(b.x));
      var y = Math.max(Math.abs(a.y), Math.abs(b.y));
      var z = Math.max(Math.abs(a.z), Math.abs(b.z));
      return Math.max(Math.max(x, y), z);
    }
    function cameraEqual(camera0, camera1, epsilon) {
      var scalar = 1 / Math.max(1, maxComponent(camera0.position, camera1.position));
      Cartesian3.multiplyByScalar(camera0.position, scalar, scratchPosition0);
      Cartesian3.multiplyByScalar(camera1.position, scalar, scratchPosition1);
      return Cartesian3.equalsEpsilon(scratchPosition0, scratchPosition1, epsilon) && Cartesian3.equalsEpsilon(camera0.direction, camera1.direction, epsilon) && Cartesian3.equalsEpsilon(camera0.up, camera1.up, epsilon) && Cartesian3.equalsEpsilon(camera0.right, camera1.right, epsilon) && Matrix4.equalsEpsilon(camera0.transform, camera1.transform, epsilon);
    }
    var scratchOccluderBoundingSphere = new BoundingSphere();
    var scratchOccluder;
    function getOccluder(scene) {
      var globe = scene.globe;
      if (scene._mode === SceneMode.SCENE3D && defined(globe)) {
        var ellipsoid = globe.ellipsoid;
        scratchOccluderBoundingSphere.radius = ellipsoid.minimumRadius;
        scratchOccluder = Occluder.fromBoundingSphere(scratchOccluderBoundingSphere, scene._camera.positionWC, scratchOccluder);
        return scratchOccluder;
      }
      return undefined;
    }
    function clearPasses(passes) {
      passes.render = false;
      passes.pick = false;
    }
    function updateFrameState(scene, frameNumber, time) {
      var camera = scene._camera;
      var frameState = scene._frameState;
      frameState.commandList.length = 0;
      frameState.mode = scene._mode;
      frameState.morphTime = scene.morphTime;
      frameState.mapProjection = scene.mapProjection;
      frameState.frameNumber = frameNumber;
      frameState.time = JulianDate.clone(time, frameState.time);
      frameState.camera = camera;
      frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
      frameState.occluder = getOccluder(scene);
      frameState.terrainExaggeration = scene._terrainExaggeration;
      clearPasses(frameState.passes);
    }
    function updateFrustums(near, far, farToNearRatio, numFrustums, frustumCommandsList) {
      frustumCommandsList.length = numFrustums;
      for (var m = 0; m < numFrustums; ++m) {
        var curNear = Math.max(near, Math.pow(farToNearRatio, m) * near);
        var curFar = Math.min(far, farToNearRatio * curNear);
        var frustumCommands = frustumCommandsList[m];
        if (!defined(frustumCommands)) {
          frustumCommands = frustumCommandsList[m] = new FrustumCommands(curNear, curFar);
        } else {
          frustumCommands.near = curNear;
          frustumCommands.far = curFar;
        }
      }
    }
    function insertIntoBin(scene, command, distance) {
      if (scene.debugShowFrustums) {
        command.debugOverlappingFrustums = 0;
      }
      var frustumCommandsList = scene._frustumCommandsList;
      var length = frustumCommandsList.length;
      for (var i = 0; i < length; ++i) {
        var frustumCommands = frustumCommandsList[i];
        var curNear = frustumCommands.near;
        var curFar = frustumCommands.far;
        if (distance.start > curFar) {
          continue;
        }
        if (distance.stop < curNear) {
          break;
        }
        var pass = command instanceof ClearCommand ? Pass.OPAQUE : command.pass;
        var index = frustumCommands.indices[pass]++;
        frustumCommands.commands[pass][index] = command;
        if (scene.debugShowFrustums) {
          command.debugOverlappingFrustums |= (1 << i);
        }
        if (command.executeInClosestFrustum) {
          break;
        }
      }
      if (scene.debugShowFrustums) {
        var cf = scene._debugFrustumStatistics.commandsInFrustums;
        cf[command.debugOverlappingFrustums] = defined(cf[command.debugOverlappingFrustums]) ? cf[command.debugOverlappingFrustums] + 1 : 1;
        ++scene._debugFrustumStatistics.totalCommands;
      }
    }
    var scratchCullingVolume = new CullingVolume();
    var distances = new Interval();
    function isVisible(command, cullingVolume, occluder) {
      return ((defined(command)) && ((!defined(command.boundingVolume)) || !command.cull || ((cullingVolume.computeVisibility(command.boundingVolume) !== Intersect.OUTSIDE) && (!defined(occluder) || !command.boundingVolume.isOccluded(occluder)))));
    }
    function createPotentiallyVisibleSet(scene) {
      var frameState = scene._frameState;
      var camera = frameState.camera;
      var direction = camera.directionWC;
      var position = camera.positionWC;
      var computeList = scene._computeCommandList;
      var overlayList = scene._overlayCommandList;
      var commandList = frameState.commandList;
      if (scene.debugShowFrustums) {
        scene._debugFrustumStatistics = {
          totalCommands: 0,
          commandsInFrustums: {}
        };
      }
      var frustumCommandsList = scene._frustumCommandsList;
      var numberOfFrustums = frustumCommandsList.length;
      var numberOfPasses = Pass.NUMBER_OF_PASSES;
      for (var n = 0; n < numberOfFrustums; ++n) {
        for (var p = 0; p < numberOfPasses; ++p) {
          frustumCommandsList[n].indices[p] = 0;
        }
      }
      computeList.length = 0;
      overlayList.length = 0;
      var near = Number.MAX_VALUE;
      var far = Number.MIN_VALUE;
      var undefBV = false;
      var occluder = (frameState.mode === SceneMode.SCENE3D) ? frameState.occluder : undefined;
      var cullingVolume = frameState.cullingVolume;
      var planes = scratchCullingVolume.planes;
      for (var k = 0; k < 5; ++k) {
        planes[k] = cullingVolume.planes[k];
      }
      cullingVolume = scratchCullingVolume;
      var environmentState = scene._environmentState;
      environmentState.isSkyAtmosphereVisible = defined(environmentState.skyAtmosphereCommand) && defined(scene.globe) && scene.globe._surface._tilesToRender.length > 0;
      environmentState.isSunVisible = isVisible(environmentState.sunDrawCommand, cullingVolume, occluder);
      environmentState.isMoonVisible = isVisible(environmentState.moonCommand, cullingVolume, occluder);
      var length = commandList.length;
      for (var i = 0; i < length; ++i) {
        var command = commandList[i];
        var pass = command.pass;
        if (pass === Pass.COMPUTE) {
          computeList.push(command);
        } else if (pass === Pass.OVERLAY) {
          overlayList.push(command);
        } else {
          var boundingVolume = command.boundingVolume;
          if (defined(boundingVolume)) {
            if (!isVisible(command, cullingVolume, occluder)) {
              continue;
            }
            distances = boundingVolume.computePlaneDistances(position, direction, distances);
            near = Math.min(near, distances.start);
            far = Math.max(far, distances.stop);
          } else {
            distances.start = camera.frustum.near;
            distances.stop = camera.frustum.far;
            undefBV = !(command instanceof ClearCommand);
          }
          insertIntoBin(scene, command, distances);
        }
      }
      if (undefBV) {
        near = camera.frustum.near;
        far = camera.frustum.far;
      } else {
        near = Math.min(Math.max(near, camera.frustum.near), camera.frustum.far);
        far = Math.max(Math.min(far, camera.frustum.far), near);
      }
      var farToNearRatio = scene.farToNearRatio;
      var numFrustums = Math.ceil(Math.log(far / near) / Math.log(farToNearRatio));
      if (near !== Number.MAX_VALUE && (numFrustums !== numberOfFrustums || (frustumCommandsList.length !== 0 && (near < frustumCommandsList[0].near || far > frustumCommandsList[numberOfFrustums - 1].far)))) {
        updateFrustums(near, far, farToNearRatio, numFrustums, frustumCommandsList);
        createPotentiallyVisibleSet(scene);
      }
    }
    function getAttributeLocations(shaderProgram) {
      var attributeLocations = {};
      var attributes = shaderProgram.vertexAttributes;
      for (var a in attributes) {
        if (attributes.hasOwnProperty(a)) {
          attributeLocations[a] = attributes[a].index;
        }
      }
      return attributeLocations;
    }
    function createDebugFragmentShaderProgram(command, scene, shaderProgram) {
      var context = scene.context;
      var sp = defaultValue(shaderProgram, command.shaderProgram);
      var fs = sp.fragmentShaderSource.clone();
      fs.sources = fs.sources.map(function(source) {
        source = ShaderSource.replaceMain(source, 'czm_Debug_main');
        return source;
      });
      var newMain = 'void main() \n' + '{ \n' + '    czm_Debug_main(); \n';
      if (scene.debugShowCommands) {
        if (!defined(command._debugColor)) {
          command._debugColor = Color.fromRandom();
        }
        var c = command._debugColor;
        newMain += '    gl_FragColor.rgb *= vec3(' + c.red + ', ' + c.green + ', ' + c.blue + '); \n';
      }
      if (scene.debugShowFrustums) {
        var r = (command.debugOverlappingFrustums & (1 << 0)) ? '1.0' : '0.0';
        var g = (command.debugOverlappingFrustums & (1 << 1)) ? '1.0' : '0.0';
        var b = (command.debugOverlappingFrustums & (1 << 2)) ? '1.0' : '0.0';
        newMain += '    gl_FragColor.rgb *= vec3(' + r + ', ' + g + ', ' + b + '); \n';
      }
      newMain += '}';
      fs.sources.push(newMain);
      var attributeLocations = getAttributeLocations(sp);
      return ShaderProgram.fromCache({
        context: context,
        vertexShaderSource: sp.vertexShaderSource,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations
      });
    }
    function executeDebugCommand(command, scene, passState, renderState, shaderProgram) {
      if (defined(command.shaderProgram) || defined(shaderProgram)) {
        var sp = createDebugFragmentShaderProgram(command, scene, shaderProgram);
        command.execute(scene.context, passState, renderState, sp);
        sp.destroy();
      }
    }
    var transformFrom2D = new Matrix4(0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
    transformFrom2D = Matrix4.inverseTransformation(transformFrom2D, transformFrom2D);
    function executeCommand(command, scene, context, passState, renderState, shaderProgram, debugFramebuffer) {
      if ((defined(scene.debugCommandFilter)) && !scene.debugCommandFilter(command)) {
        return;
      }
      if (scene.debugShowCommands || scene.debugShowFrustums) {
        executeDebugCommand(command, scene, passState, renderState, shaderProgram);
      } else {
        command.execute(context, passState, renderState, shaderProgram);
      }
      if (command.debugShowBoundingVolume && (defined(command.boundingVolume))) {
        var frameState = scene._frameState;
        var boundingVolume = command.boundingVolume;
        if (defined(scene._debugVolume)) {
          scene._debugVolume.destroy();
        }
        var geometry;
        var center = Cartesian3.clone(boundingVolume.center);
        if (frameState.mode !== SceneMode.SCENE3D) {
          center = Matrix4.multiplyByPoint(transformFrom2D, center, center);
          var projection = frameState.mapProjection;
          var centerCartographic = projection.unproject(center);
          center = projection.ellipsoid.cartographicToCartesian(centerCartographic);
        }
        if (defined(boundingVolume.radius)) {
          var radius = boundingVolume.radius;
          geometry = GeometryPipeline.toWireframe(EllipsoidGeometry.createGeometry(new EllipsoidGeometry({
            radii: new Cartesian3(radius, radius, radius),
            vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT
          })));
          scene._debugVolume = new Primitive({
            geometryInstances: new GeometryInstance({
              geometry: geometry,
              modelMatrix: Matrix4.multiplyByTranslation(Matrix4.IDENTITY, center, new Matrix4()),
              attributes: {color: new ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0)}
            }),
            appearance: new PerInstanceColorAppearance({
              flat: true,
              translucent: false
            }),
            asynchronous: false
          });
        } else {
          var halfAxes = boundingVolume.halfAxes;
          geometry = GeometryPipeline.toWireframe(BoxGeometry.createGeometry(BoxGeometry.fromDimensions({
            dimensions: new Cartesian3(2.0, 2.0, 2.0),
            vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT
          })));
          scene._debugVolume = new Primitive({
            geometryInstances: new GeometryInstance({
              geometry: geometry,
              modelMatrix: Matrix4.fromRotationTranslation(halfAxes, center, new Matrix4()),
              attributes: {color: new ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0)}
            }),
            appearance: new PerInstanceColorAppearance({
              flat: true,
              translucent: false
            }),
            asynchronous: false
          });
        }
        var savedCommandList = frameState.commandList;
        var commandList = frameState.commandList = [];
        scene._debugVolume.update(frameState);
        var framebuffer;
        if (defined(debugFramebuffer)) {
          framebuffer = passState.framebuffer;
          passState.framebuffer = debugFramebuffer;
        }
        commandList[0].execute(context, passState);
        if (defined(framebuffer)) {
          passState.framebuffer = framebuffer;
        }
        frameState.commandList = savedCommandList;
      }
    }
    function translucentCompare(a, b, position) {
      return b.boundingVolume.distanceSquaredTo(position) - a.boundingVolume.distanceSquaredTo(position);
    }
    function executeTranslucentCommandsSorted(scene, executeFunction, passState, commands) {
      var context = scene.context;
      mergeSort(commands, translucentCompare, scene._camera.positionWC);
      var length = commands.length;
      for (var j = 0; j < length; ++j) {
        executeFunction(commands[j], scene, context, passState);
      }
    }
    function getDebugGlobeDepth(scene, index) {
      var globeDepth = scene._debugGlobeDepths[index];
      if (!defined(globeDepth) && scene.context.depthTexture) {
        globeDepth = new GlobeDepth();
        scene._debugGlobeDepths[index] = globeDepth;
      }
      return globeDepth;
    }
    function getPickDepth(scene, index) {
      var pickDepth = scene._pickDepths[index];
      if (!defined(pickDepth)) {
        pickDepth = new PickDepth();
        scene._pickDepths[index] = pickDepth;
      }
      return pickDepth;
    }
    var scratchPerspectiveFrustum = new PerspectiveFrustum();
    var scratchPerspectiveOffCenterFrustum = new PerspectiveOffCenterFrustum();
    var scratchOrthographicFrustum = new OrthographicFrustum();
    function executeCommands(scene, passState) {
      var camera = scene._camera;
      var context = scene.context;
      var us = context.uniformState;
      var frustum;
      if (defined(camera.frustum.fov)) {
        frustum = camera.frustum.clone(scratchPerspectiveFrustum);
      } else if (defined(camera.frustum.infiniteProjectionMatrix)) {
        frustum = camera.frustum.clone(scratchPerspectiveOffCenterFrustum);
      } else {
        frustum = camera.frustum.clone(scratchOrthographicFrustum);
      }
      frustum.near = camera.frustum.near;
      frustum.far = camera.frustum.far;
      us.updateFrustum(frustum);
      us.updatePass(Pass.ENVIRONMENT);
      var environmentState = scene._environmentState;
      var skyBoxCommand = environmentState.skyBoxCommand;
      if (defined(skyBoxCommand)) {
        executeCommand(skyBoxCommand, scene, context, passState);
      }
      if (environmentState.isSkyAtmosphereVisible) {
        executeCommand(environmentState.skyAtmosphereCommand, scene, context, passState);
      }
      if (environmentState.isSunVisible) {
        environmentState.sunDrawCommand.execute(context, passState);
        if (scene.sunBloom && !scene._useWebVR) {
          var framebuffer;
          if (environmentState.useGlobeDepthFramebuffer) {
            framebuffer = scene._globeDepth.framebuffer;
          } else if (environmentState.useFXAA) {
            framebuffer = scene._fxaa.getColorFramebuffer();
          } else {
            framebuffer = environmentState.originalFramebuffer;
          }
          scene._sunPostProcess.execute(context, framebuffer);
          passState.framebuffer = framebuffer;
        }
      }
      if (environmentState.isMoonVisible) {
        environmentState.moonCommand.execute(context, passState);
      }
      var executeTranslucentCommands;
      if (environmentState.useOIT) {
        if (!defined(scene._executeOITFunction)) {
          scene._executeOITFunction = function(scene, executeFunction, passState, commands) {
            scene._oit.executeCommands(scene, executeFunction, passState, commands);
          };
        }
        executeTranslucentCommands = scene._executeOITFunction;
      } else {
        executeTranslucentCommands = executeTranslucentCommandsSorted;
      }
      var clearGlobeDepth = environmentState.clearGlobeDepth;
      var useDepthPlane = environmentState.clearGlobeDepth;
      var clearDepth = scene._depthClearCommand;
      var depthPlane = scene._depthPlane;
      var j;
      var frustumCommandsList = scene._frustumCommandsList;
      var numFrustums = frustumCommandsList.length;
      for (var i = 0; i < numFrustums; ++i) {
        var index = numFrustums - i - 1;
        var frustumCommands = frustumCommandsList[index];
        frustum.near = index !== 0 ? frustumCommands.near * OPAQUE_FRUSTUM_NEAR_OFFSET : frustumCommands.near;
        frustum.far = frustumCommands.far;
        var globeDepth = scene.debugShowGlobeDepth ? getDebugGlobeDepth(scene, index) : scene._globeDepth;
        var fb;
        if (scene.debugShowGlobeDepth && defined(globeDepth) && environmentState.useGlobeDepthFramebuffer) {
          fb = passState.framebuffer;
          passState.framebuffer = globeDepth.framebuffer;
        }
        us.updateFrustum(frustum);
        clearDepth.execute(context, passState);
        us.updatePass(Pass.GLOBE);
        var commands = frustumCommands.commands[Pass.GLOBE];
        var length = frustumCommands.indices[Pass.GLOBE];
        for (j = 0; j < length; ++j) {
          executeCommand(commands[j], scene, context, passState);
        }
        if (defined(globeDepth) && environmentState.useGlobeDepthFramebuffer && (scene.copyGlobeDepth || scene.debugShowGlobeDepth)) {
          globeDepth.update(context);
          globeDepth.executeCopyDepth(context, passState);
        }
        if (scene.debugShowGlobeDepth && defined(globeDepth) && environmentState.useGlobeDepthFramebuffer) {
          passState.framebuffer = fb;
        }
        us.updatePass(Pass.GROUND);
        commands = frustumCommands.commands[Pass.GROUND];
        length = frustumCommands.indices[Pass.GROUND];
        for (j = 0; j < length; ++j) {
          executeCommand(commands[j], scene, context, passState);
        }
        if (clearGlobeDepth) {
          clearDepth.execute(context, passState);
          if (useDepthPlane) {
            depthPlane.execute(context, passState);
          }
        }
        var startPass = Pass.GROUND + 1;
        var endPass = Pass.TRANSLUCENT;
        for (var pass = startPass; pass < endPass; ++pass) {
          us.updatePass(pass);
          commands = frustumCommands.commands[pass];
          length = frustumCommands.indices[pass];
          for (j = 0; j < length; ++j) {
            executeCommand(commands[j], scene, context, passState);
          }
        }
        if (index !== 0) {
          frustum.near = frustumCommands.near;
          us.updateFrustum(frustum);
        }
        us.updatePass(Pass.TRANSLUCENT);
        commands = frustumCommands.commands[Pass.TRANSLUCENT];
        commands.length = frustumCommands.indices[Pass.TRANSLUCENT];
        executeTranslucentCommands(scene, executeCommand, passState, commands);
        if (defined(globeDepth) && environmentState.useGlobeDepthFramebuffer && scene.useDepthPicking) {
          var pickDepth = getPickDepth(scene, index);
          pickDepth.update(context, globeDepth.framebuffer.depthStencilTexture);
          pickDepth.executeCopyDepth(context, passState);
        }
      }
    }
    function executeComputeCommands(scene) {
      var us = scene.context.uniformState;
      us.updatePass(Pass.COMPUTE);
      var sunComputeCommand = scene._environmentState.sunComputeCommand;
      if (defined(sunComputeCommand)) {
        sunComputeCommand.execute(scene._computeEngine);
      }
      var commandList = scene._computeCommandList;
      var length = commandList.length;
      for (var i = 0; i < length; ++i) {
        commandList[i].execute(scene._computeEngine);
      }
    }
    function executeOverlayCommands(scene, passState) {
      var us = scene.context.uniformState;
      us.updatePass(Pass.OVERLAY);
      var context = scene.context;
      var commandList = scene._overlayCommandList;
      var length = commandList.length;
      for (var i = 0; i < length; ++i) {
        commandList[i].execute(context, passState);
      }
    }
    function executeViewportCommands(scene, passState) {
      var context = scene._context;
      var viewport = passState.viewport;
      var frameState = scene._frameState;
      var camera = frameState.camera;
      if (scene._useWebVR) {
        if (frameState.mode !== SceneMode.SCENE2D) {
          viewport.x = 0;
          viewport.y = 0;
          viewport.width = context.drawingBufferWidth * 0.5;
          viewport.height = context.drawingBufferHeight;
          var savedCamera = Camera.clone(camera, scene._cameraVR);
          var near = camera.frustum.near;
          var fo = near * 5.0;
          var eyeSeparation = fo / 30.0;
          var eyeTranslation = Cartesian3.multiplyByScalar(savedCamera.right, eyeSeparation * 0.5, scratchEyeTranslation);
          camera.frustum.aspectRatio = viewport.width / viewport.height;
          var offset = 0.5 * eyeSeparation * near / fo;
          Cartesian3.add(savedCamera.position, eyeTranslation, camera.position);
          camera.frustum.xOffset = offset;
          executeCommands(scene, passState);
          viewport.x = passState.viewport.width;
          Cartesian3.subtract(savedCamera.position, eyeTranslation, camera.position);
          camera.frustum.xOffset = -offset;
          executeCommands(scene, passState);
          Camera.clone(savedCamera, camera);
        } else {
          viewport.x = 0;
          viewport.y = 0;
          viewport.width = context.drawingBufferWidth * 0.5;
          viewport.height = context.drawingBufferHeight;
          var savedTop = camera.frustum.top;
          camera.frustum.top = camera.frustum.right * (viewport.height / viewport.width);
          camera.frustum.bottom = -camera.frustum.top;
          executeCommands(scene, passState);
          viewport.x = passState.viewport.width;
          executeCommands(scene, passState);
          camera.frustum.top = savedTop;
          camera.frustum.bottom = -savedTop;
        }
      } else {
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = context.drawingBufferWidth;
        viewport.height = context.drawingBufferHeight;
        executeCommands(scene, passState);
      }
    }
    function updateEnvironment(scene) {
      var frameState = scene._frameState;
      var environmentState = scene._environmentState;
      var renderPass = frameState.passes.render;
      environmentState.skyBoxCommand = (renderPass && defined(scene.skyBox)) ? scene.skyBox.update(frameState) : undefined;
      environmentState.skyAtmosphereCommand = (renderPass && defined(scene.skyAtmosphere)) ? scene.skyAtmosphere.update(frameState) : undefined;
      var sunCommands = (renderPass && defined(scene.sun)) ? scene.sun.update(scene) : undefined;
      environmentState.sunDrawCommand = defined(sunCommands) ? sunCommands.drawCommand : undefined;
      environmentState.sunComputeCommand = defined(sunCommands) ? sunCommands.computeCommand : undefined;
      environmentState.moonCommand = (renderPass && defined(scene.moon)) ? scene.moon.update(frameState) : undefined;
      var clearGlobeDepth = environmentState.clearGlobeDepth = defined(scene.globe) && (!scene.globe.depthTestAgainstTerrain || scene.mode === SceneMode.SCENE2D);
      var useDepthPlane = environmentState.useDepthPlane = clearGlobeDepth && scene.mode === SceneMode.SCENE3D;
      if (useDepthPlane) {
        scene._depthPlane.update(frameState);
      }
    }
    function updatePrimitives(scene) {
      var frameState = scene._frameState;
      if (scene._globe) {
        scene._globe.update(frameState);
      }
      scene._groundPrimitives.update(frameState);
      scene._primitives.update(frameState);
    }
    function updateAndClearFramebuffers(scene, passState, clearColor, picking) {
      var context = scene._context;
      var environmentState = scene._environmentState;
      environmentState.originalFramebuffer = passState.framebuffer;
      if (defined(scene.sun) && scene.sunBloom !== scene._sunBloom) {
        if (scene.sunBloom && !scene._useWebVR) {
          scene._sunPostProcess = new SunPostProcess();
        } else if (defined(scene._sunPostProcess)) {
          scene._sunPostProcess = scene._sunPostProcess.destroy();
        }
        scene._sunBloom = scene.sunBloom;
      } else if (!defined(scene.sun) && defined(scene._sunPostProcess)) {
        scene._sunPostProcess = scene._sunPostProcess.destroy();
        scene._sunBloom = false;
      }
      var clear = scene._clearColorCommand;
      Color.clone(clearColor, clear.color);
      clear.execute(context, passState);
      var useGlobeDepthFramebuffer = environmentState.useGlobeDepthFramebuffer = !picking && defined(scene._globeDepth);
      if (useGlobeDepthFramebuffer) {
        scene._globeDepth.update(context);
        scene._globeDepth.clear(context, passState, clearColor);
      }
      var renderTranslucentCommands = false;
      var frustumCommandsList = scene._frustumCommandsList;
      var numFrustums = frustumCommandsList.length;
      for (var i = 0; i < numFrustums; ++i) {
        if (frustumCommandsList[i].indices[Pass.TRANSLUCENT] > 0) {
          renderTranslucentCommands = true;
          break;
        }
      }
      var useOIT = environmentState.useOIT = !picking && renderTranslucentCommands && defined(scene._oit) && scene._oit.isSupported();
      if (useOIT) {
        scene._oit.update(context, scene._globeDepth.framebuffer);
        scene._oit.clear(context, passState, clearColor);
        environmentState.useOIT = scene._oit.isSupported();
      }
      var useFXAA = environmentState.useFXAA = !picking && scene.fxaa;
      if (useFXAA) {
        scene._fxaa.update(context);
        scene._fxaa.clear(context, passState, clearColor);
      }
      if (environmentState.isSunVisible && scene.sunBloom && !scene._useWebVR) {
        passState.framebuffer = scene._sunPostProcess.update(passState);
      } else if (useGlobeDepthFramebuffer) {
        passState.framebuffer = scene._globeDepth.framebuffer;
      } else if (useFXAA) {
        passState.framebuffer = scene._fxaa.getColorFramebuffer();
      }
      if (defined(passState.framebuffer)) {
        clear.execute(context, passState);
      }
    }
    function resolveFramebuffers(scene, passState) {
      var context = scene._context;
      var environmentState = scene._environmentState;
      var useGlobeDepthFramebuffer = environmentState.useGlobeDepthFramebuffer;
      if (scene.debugShowGlobeDepth && useGlobeDepthFramebuffer) {
        var gd = getDebugGlobeDepth(scene, scene.debugShowDepthFrustum - 1);
        gd.executeDebugGlobeDepth(context, passState);
      }
      if (scene.debugShowPickDepth && useGlobeDepthFramebuffer) {
        var pd = getPickDepth(scene, scene.debugShowDepthFrustum - 1);
        pd.executeDebugPickDepth(context, passState);
      }
      var useOIT = environmentState.useOIT;
      var useFXAA = environmentState.useFXAA;
      if (useOIT) {
        passState.framebuffer = useFXAA ? scene._fxaa.getColorFramebuffer() : undefined;
        scene._oit.execute(context, passState);
      }
      if (useFXAA) {
        if (!useOIT && useGlobeDepthFramebuffer) {
          passState.framebuffer = scene._fxaa.getColorFramebuffer();
          scene._globeDepth.executeCopyColor(context, passState);
        }
        passState.framebuffer = environmentState.originalFramebuffer;
        scene._fxaa.execute(context, passState);
      }
      if (!useOIT && !useFXAA && useGlobeDepthFramebuffer) {
        passState.framebuffer = environmentState.originalFramebuffer;
        scene._globeDepth.executeCopyColor(context, passState);
      }
    }
    function callAfterRenderFunctions(frameState) {
      var functions = frameState.afterRender;
      for (var i = 0,
          length = functions.length; i < length; ++i) {
        functions[i]();
      }
      functions.length = 0;
    }
    Scene.prototype.initializeFrame = function() {
      if (this._shaderFrameCount++ === 120) {
        this._shaderFrameCount = 0;
        this._context.shaderCache.destroyReleasedShaderPrograms();
      }
      this._tweens.update();
      this._camera.update(this._mode);
      this._screenSpaceCameraController.update();
      if (defined(this._deviceOrientationCameraController)) {
        this._deviceOrientationCameraController.update();
      }
    };
    var scratchEyeTranslation = new Cartesian3();
    function render(scene, time) {
      if (!defined(time)) {
        time = JulianDate.now();
      }
      var camera = scene._camera;
      if (!cameraEqual(camera, scene._cameraClone, CesiumMath.EPSILON6)) {
        if (!scene._cameraStartFired) {
          camera.moveStart.raiseEvent();
          scene._cameraStartFired = true;
        }
        scene._cameraMovedTime = getTimestamp();
        Camera.clone(camera, scene._cameraClone);
      } else if (scene._cameraStartFired && getTimestamp() - scene._cameraMovedTime > scene.cameraEventWaitTime) {
        camera.moveEnd.raiseEvent();
        scene._cameraStartFired = false;
      }
      scene._preRender.raiseEvent(scene, time);
      var context = scene.context;
      var us = context.uniformState;
      var frameState = scene._frameState;
      var frameNumber = CesiumMath.incrementWrap(frameState.frameNumber, 15000000.0, 1.0);
      updateFrameState(scene, frameNumber, time);
      frameState.passes.render = true;
      frameState.creditDisplay.beginFrame();
      scene.fog.update(frameState);
      us.update(frameState);
      scene._computeCommandList.length = 0;
      scene._overlayCommandList.length = 0;
      var passState = scene._passState;
      passState.framebuffer = undefined;
      passState.blendingEnabled = undefined;
      passState.scissorTest = undefined;
      var viewport = passState.viewport;
      viewport.x = 0;
      viewport.y = 0;
      viewport.width = context.drawingBufferWidth;
      viewport.height = context.drawingBufferHeight;
      if (defined(scene.globe)) {
        scene.globe.beginFrame(frameState);
      }
      updateEnvironment(scene);
      updatePrimitives(scene);
      createPotentiallyVisibleSet(scene);
      updateAndClearFramebuffers(scene, passState, defaultValue(scene.backgroundColor, Color.BLACK));
      executeComputeCommands(scene);
      executeViewportCommands(scene, passState);
      resolveFramebuffers(scene, passState);
      executeOverlayCommands(scene, passState);
      if (defined(scene.globe)) {
        scene.globe.endFrame(frameState);
      }
      frameState.creditDisplay.endFrame();
      if (scene.debugShowFramesPerSecond) {
        if (!defined(scene._performanceDisplay)) {
          var performanceContainer = document.createElement('div');
          performanceContainer.className = 'cesium-performanceDisplay-defaultContainer';
          var container = scene._canvas.parentNode;
          container.appendChild(performanceContainer);
          var performanceDisplay = new PerformanceDisplay({container: performanceContainer});
          scene._performanceDisplay = performanceDisplay;
          scene._performanceContainer = performanceContainer;
        }
        scene._performanceDisplay.update();
      } else if (defined(scene._performanceDisplay)) {
        scene._performanceDisplay = scene._performanceDisplay && scene._performanceDisplay.destroy();
        scene._performanceContainer.parentNode.removeChild(scene._performanceContainer);
      }
      context.endFrame();
      callAfterRenderFunctions(frameState);
      scene._postRender.raiseEvent(scene, time);
    }
    Scene.prototype.render = function(time) {
      try {
        render(this, time);
      } catch (error) {
        this._renderError.raiseEvent(this, error);
        if (this.rethrowRenderErrors) {
          throw error;
        }
      }
    };
    Scene.prototype.clampLineWidth = function(width) {
      return Math.max(ContextLimits.minimumAliasedLineWidth, Math.min(width, ContextLimits.maximumAliasedLineWidth));
    };
    var orthoPickingFrustum = new OrthographicFrustum();
    var scratchOrigin = new Cartesian3();
    var scratchDirection = new Cartesian3();
    var scratchPixelSize = new Cartesian2();
    var scratchPickVolumeMatrix4 = new Matrix4();
    function getPickOrthographicCullingVolume(scene, drawingBufferPosition, width, height) {
      var camera = scene._camera;
      var frustum = camera.frustum;
      var viewport = scene._passState.viewport;
      var x = 2.0 * (drawingBufferPosition.x - viewport.x) / viewport.width - 1.0;
      x *= (frustum.right - frustum.left) * 0.5;
      var y = 2.0 * (viewport.height - drawingBufferPosition.y - viewport.y) / viewport.height - 1.0;
      y *= (frustum.top - frustum.bottom) * 0.5;
      var transform = Matrix4.clone(camera.transform, scratchPickVolumeMatrix4);
      camera._setTransform(Matrix4.IDENTITY);
      var origin = Cartesian3.clone(camera.position, scratchOrigin);
      Cartesian3.multiplyByScalar(camera.right, x, scratchDirection);
      Cartesian3.add(scratchDirection, origin, origin);
      Cartesian3.multiplyByScalar(camera.up, y, scratchDirection);
      Cartesian3.add(scratchDirection, origin, origin);
      camera._setTransform(transform);
      Cartesian3.fromElements(origin.z, origin.x, origin.y, origin);
      var pixelSize = frustum.getPixelDimensions(viewport.width, viewport.height, 1.0, scratchPixelSize);
      var ortho = orthoPickingFrustum;
      ortho.right = pixelSize.x * 0.5;
      ortho.left = -ortho.right;
      ortho.top = pixelSize.y * 0.5;
      ortho.bottom = -ortho.top;
      ortho.near = frustum.near;
      ortho.far = frustum.far;
      return ortho.computeCullingVolume(origin, camera.directionWC, camera.upWC);
    }
    var perspPickingFrustum = new PerspectiveOffCenterFrustum();
    function getPickPerspectiveCullingVolume(scene, drawingBufferPosition, width, height) {
      var camera = scene._camera;
      var frustum = camera.frustum;
      var near = frustum.near;
      var tanPhi = Math.tan(frustum.fovy * 0.5);
      var tanTheta = frustum.aspectRatio * tanPhi;
      var viewport = scene._passState.viewport;
      var x = 2.0 * (drawingBufferPosition.x - viewport.x) / viewport.width - 1.0;
      var y = 2.0 * (viewport.height - drawingBufferPosition.y - viewport.y) / viewport.height - 1.0;
      var xDir = x * near * tanTheta;
      var yDir = y * near * tanPhi;
      var pixelSize = frustum.getPixelDimensions(viewport.width, viewport.height, 1.0, scratchPixelSize);
      var pickWidth = pixelSize.x * width * 0.5;
      var pickHeight = pixelSize.y * height * 0.5;
      var offCenter = perspPickingFrustum;
      offCenter.top = yDir + pickHeight;
      offCenter.bottom = yDir - pickHeight;
      offCenter.right = xDir + pickWidth;
      offCenter.left = xDir - pickWidth;
      offCenter.near = near;
      offCenter.far = frustum.far;
      return offCenter.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
    }
    function getPickCullingVolume(scene, drawingBufferPosition, width, height) {
      if (scene._mode === SceneMode.SCENE2D) {
        return getPickOrthographicCullingVolume(scene, drawingBufferPosition, width, height);
      }
      return getPickPerspectiveCullingVolume(scene, drawingBufferPosition, width, height);
    }
    var rectangleWidth = 3.0;
    var rectangleHeight = 3.0;
    var scratchRectangle = new BoundingRectangle(0.0, 0.0, rectangleWidth, rectangleHeight);
    var scratchColorZero = new Color(0.0, 0.0, 0.0, 0.0);
    var scratchPosition = new Cartesian2();
    Scene.prototype.pick = function(windowPosition) {
      if (!defined(windowPosition)) {
        throw new DeveloperError('windowPosition is undefined.');
      }
      var context = this._context;
      var us = context.uniformState;
      var frameState = this._frameState;
      var drawingBufferPosition = SceneTransforms.transformWindowToDrawingBuffer(this, windowPosition, scratchPosition);
      if (!defined(this._pickFramebuffer)) {
        this._pickFramebuffer = context.createPickFramebuffer();
      }
      updateFrameState(this, frameState.frameNumber, frameState.time);
      frameState.cullingVolume = getPickCullingVolume(this, drawingBufferPosition, rectangleWidth, rectangleHeight);
      frameState.passes.pick = true;
      us.update(frameState);
      scratchRectangle.x = drawingBufferPosition.x - ((rectangleWidth - 1.0) * 0.5);
      scratchRectangle.y = (this.drawingBufferHeight - drawingBufferPosition.y) - ((rectangleHeight - 1.0) * 0.5);
      var passState = this._pickFramebuffer.begin(scratchRectangle);
      updatePrimitives(this);
      createPotentiallyVisibleSet(this);
      updateAndClearFramebuffers(this, passState, scratchColorZero, true);
      executeCommands(this, passState);
      resolveFramebuffers(this, passState);
      var object = this._pickFramebuffer.end(scratchRectangle);
      context.endFrame();
      callAfterRenderFunctions(frameState);
      return object;
    };
    var scratchPackedDepth = new Cartesian4();
    var packedDepthScale = new Cartesian4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 160581375.0);
    Scene.prototype.pickPosition = function(windowPosition, result) {
      if (!this.useDepthPicking) {
        return undefined;
      }
      if (!defined(windowPosition)) {
        throw new DeveloperError('windowPosition is undefined.');
      }
      if (!defined(this._globeDepth)) {
        throw new DeveloperError('Picking from the depth buffer is not supported. Check pickPositionSupported.');
      }
      var context = this._context;
      var uniformState = context.uniformState;
      var drawingBufferPosition = SceneTransforms.transformWindowToDrawingBuffer(this, windowPosition, scratchPosition);
      drawingBufferPosition.y = this.drawingBufferHeight - drawingBufferPosition.y;
      var camera = this._camera;
      var frustum;
      if (defined(camera.frustum.fov)) {
        frustum = camera.frustum.clone(scratchPerspectiveFrustum);
      } else if (defined(camera.frustum.infiniteProjectionMatrix)) {
        frustum = camera.frustum.clone(scratchPerspectiveOffCenterFrustum);
      } else {
        throw new DeveloperError('2D is not supported. An orthographic projection matrix is not invertible.');
      }
      var numFrustums = this.numberOfFrustums;
      for (var i = 0; i < numFrustums; ++i) {
        var pickDepth = getPickDepth(this, i);
        var pixels = context.readPixels({
          x: drawingBufferPosition.x,
          y: drawingBufferPosition.y,
          width: 1,
          height: 1,
          framebuffer: pickDepth.framebuffer
        });
        var packedDepth = Cartesian4.unpack(pixels, 0, scratchPackedDepth);
        Cartesian4.divideByScalar(packedDepth, 255.0, packedDepth);
        var depth = Cartesian4.dot(packedDepth, packedDepthScale);
        if (depth > 0.0 && depth < 1.0) {
          var renderedFrustum = this._frustumCommandsList[i];
          frustum.near = renderedFrustum.near * (i !== 0 ? OPAQUE_FRUSTUM_NEAR_OFFSET : 1.0);
          frustum.far = renderedFrustum.far;
          uniformState.updateFrustum(frustum);
          return SceneTransforms.drawingBufferToWgs84Coordinates(this, drawingBufferPosition, depth, result);
        }
      }
      return undefined;
    };
    Scene.prototype.drillPick = function(windowPosition, limit) {
      if (!defined(windowPosition)) {
        throw new DeveloperError('windowPosition is undefined.');
      }
      var i;
      var attributes;
      var result = [];
      var pickedPrimitives = [];
      var pickedAttributes = [];
      if (!defined(limit)) {
        limit = Number.MAX_VALUE;
      }
      var pickedResult = this.pick(windowPosition);
      while (defined(pickedResult) && defined(pickedResult.primitive)) {
        result.push(pickedResult);
        if (0 >= --limit) {
          break;
        }
        var primitive = pickedResult.primitive;
        var hasShowAttribute = false;
        if (typeof primitive.getGeometryInstanceAttributes === 'function') {
          if (defined(pickedResult.id)) {
            attributes = primitive.getGeometryInstanceAttributes(pickedResult.id);
            if (defined(attributes) && defined(attributes.show)) {
              hasShowAttribute = true;
              attributes.show = ShowGeometryInstanceAttribute.toValue(false, attributes.show);
              pickedAttributes.push(attributes);
            }
          }
        }
        if (!hasShowAttribute) {
          primitive.show = false;
          pickedPrimitives.push(primitive);
        }
        pickedResult = this.pick(windowPosition);
      }
      for (i = 0; i < pickedPrimitives.length; ++i) {
        pickedPrimitives[i].show = true;
      }
      for (i = 0; i < pickedAttributes.length; ++i) {
        attributes = pickedAttributes[i];
        attributes.show = ShowGeometryInstanceAttribute.toValue(true, attributes.show);
      }
      return result;
    };
    Scene.prototype.completeMorph = function() {
      this._transitioner.completeMorph();
    };
    Scene.prototype.morphTo2D = function(duration) {
      var ellipsoid;
      var globe = this.globe;
      if (defined(globe)) {
        ellipsoid = globe.ellipsoid;
      } else {
        ellipsoid = this.mapProjection.ellipsoid;
      }
      duration = defaultValue(duration, 2.0);
      this._transitioner.morphTo2D(duration, ellipsoid);
    };
    Scene.prototype.morphToColumbusView = function(duration) {
      var ellipsoid;
      var globe = this.globe;
      if (defined(globe)) {
        ellipsoid = globe.ellipsoid;
      } else {
        ellipsoid = this.mapProjection.ellipsoid;
      }
      duration = defaultValue(duration, 2.0);
      this._transitioner.morphToColumbusView(duration, ellipsoid);
    };
    Scene.prototype.morphTo3D = function(duration) {
      var ellipsoid;
      var globe = this.globe;
      if (defined(globe)) {
        ellipsoid = globe.ellipsoid;
      } else {
        ellipsoid = this.mapProjection.ellipsoid;
      }
      duration = defaultValue(duration, 2.0);
      this._transitioner.morphTo3D(duration, ellipsoid);
    };
    Scene.prototype.isDestroyed = function() {
      return false;
    };
    Scene.prototype.destroy = function() {
      this._tweens.removeAll();
      this._computeEngine = this._computeEngine && this._computeEngine.destroy();
      this._screenSpaceCameraController = this._screenSpaceCameraController && this._screenSpaceCameraController.destroy();
      this._deviceOrientationCameraController = this._deviceOrientationCameraController && !this._deviceOrientationCameraController.isDestroyed() && this._deviceOrientationCameraController.destroy();
      this._pickFramebuffer = this._pickFramebuffer && this._pickFramebuffer.destroy();
      this._primitives = this._primitives && this._primitives.destroy();
      this._groundPrimitives = this._groundPrimitives && this._groundPrimitives.destroy();
      this._globe = this._globe && this._globe.destroy();
      this.skyBox = this.skyBox && this.skyBox.destroy();
      this.skyAtmosphere = this.skyAtmosphere && this.skyAtmosphere.destroy();
      this._debugSphere = this._debugSphere && this._debugSphere.destroy();
      this.sun = this.sun && this.sun.destroy();
      this._sunPostProcess = this._sunPostProcess && this._sunPostProcess.destroy();
      this._depthPlane = this._depthPlane && this._depthPlane.destroy();
      this._transitioner.destroy();
      if (defined(this._globeDepth)) {
        this._globeDepth.destroy();
      }
      if (defined(this._oit)) {
        this._oit.destroy();
      }
      this._fxaa.destroy();
      this._context = this._context && this._context.destroy();
      this._frameState.creditDisplay.destroy();
      if (defined(this._performanceDisplay)) {
        this._performanceDisplay = this._performanceDisplay && this._performanceDisplay.destroy();
        this._performanceContainer.parentNode.removeChild(this._performanceContainer);
      }
      return destroyObject(this);
    };
    return Scene;
  });
})(require('process'));
