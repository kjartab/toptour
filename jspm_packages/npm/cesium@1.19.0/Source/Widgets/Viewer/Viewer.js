/* */ 
"format cjs";
(function(process) {
  define(['../../Core/BoundingSphere', '../../Core/Cartesian3', '../../Core/defaultValue', '../../Core/defined', '../../Core/defineProperties', '../../Core/destroyObject', '../../Core/DeveloperError', '../../Core/EventHelper', '../../Core/Fullscreen', '../../Core/isArray', '../../Core/Matrix4', '../../Core/Rectangle', '../../Core/ScreenSpaceEventType', '../../DataSources/BoundingSphereState', '../../DataSources/ConstantPositionProperty', '../../DataSources/DataSourceCollection', '../../DataSources/DataSourceDisplay', '../../DataSources/Entity', '../../DataSources/EntityView', '../../DataSources/Property', '../../Scene/ImageryLayer', '../../Scene/SceneMode', '../../ThirdParty/knockout', '../../ThirdParty/when', '../Animation/Animation', '../Animation/AnimationViewModel', '../BaseLayerPicker/BaseLayerPicker', '../BaseLayerPicker/createDefaultImageryProviderViewModels', '../BaseLayerPicker/createDefaultTerrainProviderViewModels', '../CesiumWidget/CesiumWidget', '../ClockViewModel', '../FullscreenButton/FullscreenButton', '../Geocoder/Geocoder', '../getElement', '../HomeButton/HomeButton', '../InfoBox/InfoBox', '../NavigationHelpButton/NavigationHelpButton', '../SceneModePicker/SceneModePicker', '../SelectionIndicator/SelectionIndicator', '../subscribeAndEvaluate', '../Timeline/Timeline', '../VRButton/VRButton'], function(BoundingSphere, Cartesian3, defaultValue, defined, defineProperties, destroyObject, DeveloperError, EventHelper, Fullscreen, isArray, Matrix4, Rectangle, ScreenSpaceEventType, BoundingSphereState, ConstantPositionProperty, DataSourceCollection, DataSourceDisplay, Entity, EntityView, Property, ImageryLayer, SceneMode, knockout, when, Animation, AnimationViewModel, BaseLayerPicker, createDefaultImageryProviderViewModels, createDefaultTerrainProviderViewModels, CesiumWidget, ClockViewModel, FullscreenButton, Geocoder, getElement, HomeButton, InfoBox, NavigationHelpButton, SceneModePicker, SelectionIndicator, subscribeAndEvaluate, Timeline, VRButton) {
    'use strict';
    var boundingSphereScratch = new BoundingSphere();
    function onTimelineScrubfunction(e) {
      var clock = e.clock;
      clock.currentTime = e.timeJulian;
      clock.shouldAnimate = false;
    }
    function pickEntity(viewer, e) {
      var picked = viewer.scene.pick(e.position);
      if (defined(picked)) {
        var id = defaultValue(picked.id, picked.primitive.id);
        if (id instanceof Entity) {
          return id;
        }
      }
      if (defined(viewer.scene.globe)) {
        return pickImageryLayerFeature(viewer, e.position);
      }
    }
    function trackDataSourceClock(timeline, clock, dataSource) {
      if (defined(dataSource)) {
        var dataSourceClock = dataSource.clock;
        if (defined(dataSourceClock)) {
          dataSourceClock.getValue(clock);
          if (defined(timeline)) {
            timeline.updateFromClock();
            timeline.zoomTo(dataSourceClock.startTime, dataSourceClock.stopTime);
          }
        }
      }
    }
    var cartesian3Scratch = new Cartesian3();
    function pickImageryLayerFeature(viewer, windowPosition) {
      var scene = viewer.scene;
      var pickRay = scene.camera.getPickRay(windowPosition);
      var imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures(pickRay, scene);
      if (!defined(imageryLayerFeaturePromise)) {
        return;
      }
      var loadingMessage = new Entity({
        id: 'Loading...',
        description: 'Loading feature information...'
      });
      when(imageryLayerFeaturePromise, function(features) {
        if (viewer.selectedEntity !== loadingMessage) {
          return;
        }
        if (!defined(features) || features.length === 0) {
          viewer.selectedEntity = createNoFeaturesEntity();
          return;
        }
        var feature = features[0];
        var entity = new Entity({
          id: feature.name,
          description: feature.description
        });
        if (defined(feature.position)) {
          var ecfPosition = viewer.scene.globe.ellipsoid.cartographicToCartesian(feature.position, cartesian3Scratch);
          entity.position = new ConstantPositionProperty(ecfPosition);
        }
        viewer.selectedEntity = entity;
      }, function() {
        if (viewer.selectedEntity !== loadingMessage) {
          return;
        }
        viewer.selectedEntity = createNoFeaturesEntity();
      });
      return loadingMessage;
    }
    function createNoFeaturesEntity() {
      return new Entity({
        id: 'None',
        description: 'No features found.'
      });
    }
    function enableVRUI(viewer, enabled) {
      var geocoder = viewer._geocoder;
      var homeButton = viewer._homeButton;
      var sceneModePicker = viewer._sceneModePicker;
      var baseLayerPicker = viewer._baseLayerPicker;
      var animation = viewer._animation;
      var timeline = viewer._timeline;
      var fullscreenButton = viewer._fullscreenButton;
      var infoBox = viewer._infoBox;
      var selectionIndicator = viewer._selectionIndicator;
      var visibility = enabled ? 'hidden' : 'visible';
      if (defined(geocoder)) {
        geocoder.container.style.visibility = visibility;
      }
      if (defined(homeButton)) {
        homeButton.container.style.visibility = visibility;
      }
      if (defined(sceneModePicker)) {
        sceneModePicker.container.style.visibility = visibility;
      }
      if (defined(baseLayerPicker)) {
        baseLayerPicker.container.style.visibility = visibility;
      }
      if (defined(animation)) {
        animation.container.style.visibility = visibility;
      }
      if (defined(timeline)) {
        timeline.container.style.visibility = visibility;
      }
      if (defined(fullscreenButton) && fullscreenButton.viewModel.isFullscreenEnabled) {
        fullscreenButton.container.style.visibility = visibility;
      }
      if (defined(infoBox)) {
        infoBox.container.style.visibility = visibility;
      }
      if (defined(selectionIndicator)) {
        selectionIndicator.container.style.visibility = visibility;
      }
      if (viewer._container) {
        var right = enabled || !defined(fullscreenButton) ? 0 : fullscreenButton.container.clientWidth;
        viewer._vrButton.container.style.right = right + 'px';
        viewer.forceResize();
      }
    }
    function Viewer(container, options) {
      if (!defined(container)) {
        throw new DeveloperError('container is required.');
      }
      container = getElement(container);
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      var createBaseLayerPicker = (!defined(options.globe) || options.globe !== false) && (!defined(options.baseLayerPicker) || options.baseLayerPicker !== false);
      if (createBaseLayerPicker && defined(options.imageryProvider)) {
        throw new DeveloperError('options.imageryProvider is not available when using the BaseLayerPicker widget. \
Either specify options.selectedImageryProviderViewModel instead or set options.baseLayerPicker to false.');
      }
      if (!createBaseLayerPicker && defined(options.selectedImageryProviderViewModel)) {
        throw new DeveloperError('options.selectedImageryProviderViewModel is not available when not using the BaseLayerPicker widget. \
Either specify options.imageryProvider instead or set options.baseLayerPicker to true.');
      }
      if (createBaseLayerPicker && defined(options.terrainProvider)) {
        throw new DeveloperError('options.terrainProvider is not available when using the BaseLayerPicker widget. \
Either specify options.selectedTerrainProviderViewModel instead or set options.baseLayerPicker to false.');
      }
      if (!createBaseLayerPicker && defined(options.selectedTerrainProviderViewModel)) {
        throw new DeveloperError('options.selectedTerrainProviderViewModel is not available when not using the BaseLayerPicker widget. \
Either specify options.terrainProvider instead or set options.baseLayerPicker to true.');
      }
      var that = this;
      var viewerContainer = document.createElement('div');
      viewerContainer.className = 'cesium-viewer';
      container.appendChild(viewerContainer);
      var cesiumWidgetContainer = document.createElement('div');
      cesiumWidgetContainer.className = 'cesium-viewer-cesiumWidgetContainer';
      viewerContainer.appendChild(cesiumWidgetContainer);
      var bottomContainer = document.createElement('div');
      bottomContainer.className = 'cesium-viewer-bottom';
      viewerContainer.appendChild(bottomContainer);
      var scene3DOnly = defaultValue(options.scene3DOnly, false);
      var cesiumWidget = new CesiumWidget(cesiumWidgetContainer, {
        terrainProvider: options.terrainProvider,
        imageryProvider: createBaseLayerPicker ? false : options.imageryProvider,
        clock: options.clock,
        skyBox: options.skyBox,
        skyAtmosphere: options.skyAtmosphere,
        sceneMode: options.sceneMode,
        mapProjection: options.mapProjection,
        globe: options.globe,
        orderIndependentTranslucency: options.orderIndependentTranslucency,
        contextOptions: options.contextOptions,
        useDefaultRenderLoop: options.useDefaultRenderLoop,
        targetFrameRate: options.targetFrameRate,
        showRenderLoopErrors: options.showRenderLoopErrors,
        creditContainer: defined(options.creditContainer) ? options.creditContainer : bottomContainer,
        scene3DOnly: scene3DOnly,
        terrainExaggeration: options.terrainExaggeration
      });
      var dataSourceCollection = options.dataSources;
      var destroyDataSourceCollection = false;
      if (!defined(dataSourceCollection)) {
        dataSourceCollection = new DataSourceCollection();
        destroyDataSourceCollection = true;
      }
      var dataSourceDisplay = new DataSourceDisplay({
        scene: cesiumWidget.scene,
        dataSourceCollection: dataSourceCollection
      });
      var clock = cesiumWidget.clock;
      var clockViewModel = new ClockViewModel(clock);
      var eventHelper = new EventHelper();
      eventHelper.add(clock.onTick, Viewer.prototype._onTick, this);
      eventHelper.add(cesiumWidget.scene.morphStart, Viewer.prototype._clearTrackedObject, this);
      var selectionIndicator;
      if (!defined(options.selectionIndicator) || options.selectionIndicator !== false) {
        var selectionIndicatorContainer = document.createElement('div');
        selectionIndicatorContainer.className = 'cesium-viewer-selectionIndicatorContainer';
        viewerContainer.appendChild(selectionIndicatorContainer);
        selectionIndicator = new SelectionIndicator(selectionIndicatorContainer, cesiumWidget.scene);
      }
      var infoBox;
      if (!defined(options.infoBox) || options.infoBox !== false) {
        var infoBoxContainer = document.createElement('div');
        infoBoxContainer.className = 'cesium-viewer-infoBoxContainer';
        viewerContainer.appendChild(infoBoxContainer);
        infoBox = new InfoBox(infoBoxContainer);
        var infoBoxViewModel = infoBox.viewModel;
        eventHelper.add(infoBoxViewModel.cameraClicked, Viewer.prototype._onInfoBoxCameraClicked, this);
        eventHelper.add(infoBoxViewModel.closeClicked, Viewer.prototype._onInfoBoxClockClicked, this);
      }
      var toolbar = document.createElement('div');
      toolbar.className = 'cesium-viewer-toolbar';
      viewerContainer.appendChild(toolbar);
      var geocoder;
      if (!defined(options.geocoder) || options.geocoder !== false) {
        var geocoderContainer = document.createElement('div');
        geocoderContainer.className = 'cesium-viewer-geocoderContainer';
        toolbar.appendChild(geocoderContainer);
        geocoder = new Geocoder({
          container: geocoderContainer,
          scene: cesiumWidget.scene
        });
        eventHelper.add(geocoder.viewModel.search.beforeExecute, Viewer.prototype._clearObjects, this);
      }
      var homeButton;
      if (!defined(options.homeButton) || options.homeButton !== false) {
        homeButton = new HomeButton(toolbar, cesiumWidget.scene);
        if (defined(geocoder)) {
          eventHelper.add(homeButton.viewModel.command.afterExecute, function() {
            var viewModel = geocoder.viewModel;
            viewModel.searchText = '';
            if (viewModel.isSearchInProgress) {
              viewModel.search();
            }
          });
        }
        eventHelper.add(homeButton.viewModel.command.beforeExecute, Viewer.prototype._clearTrackedObject, this);
      }
      if ((options.sceneModePicker === true) && scene3DOnly) {
        throw new DeveloperError('options.sceneModePicker is not available when options.scene3DOnly is set to true.');
      }
      var sceneModePicker;
      if (!scene3DOnly && (!defined(options.sceneModePicker) || options.sceneModePicker !== false)) {
        sceneModePicker = new SceneModePicker(toolbar, cesiumWidget.scene);
      }
      var baseLayerPicker;
      var baseLayerPickerDropDown;
      if (createBaseLayerPicker) {
        var imageryProviderViewModels = defaultValue(options.imageryProviderViewModels, createDefaultImageryProviderViewModels());
        var terrainProviderViewModels = defaultValue(options.terrainProviderViewModels, createDefaultTerrainProviderViewModels());
        baseLayerPicker = new BaseLayerPicker(toolbar, {
          globe: cesiumWidget.scene.globe,
          imageryProviderViewModels: imageryProviderViewModels,
          selectedImageryProviderViewModel: options.selectedImageryProviderViewModel,
          terrainProviderViewModels: terrainProviderViewModels,
          selectedTerrainProviderViewModel: options.selectedTerrainProviderViewModel
        });
        var elements = toolbar.getElementsByClassName('cesium-baseLayerPicker-dropDown');
        baseLayerPickerDropDown = elements[0];
      }
      var navigationHelpButton;
      if (!defined(options.navigationHelpButton) || options.navigationHelpButton !== false) {
        var showNavHelp = true;
        try {
          if (defined(window.localStorage)) {
            var hasSeenNavHelp = window.localStorage.getItem('cesium-hasSeenNavHelp');
            if (defined(hasSeenNavHelp) && Boolean(hasSeenNavHelp)) {
              showNavHelp = false;
            } else {
              window.localStorage.setItem('cesium-hasSeenNavHelp', 'true');
            }
          }
        } catch (e) {}
        navigationHelpButton = new NavigationHelpButton({
          container: toolbar,
          instructionsInitiallyVisible: defaultValue(options.navigationInstructionsInitiallyVisible, showNavHelp)
        });
      }
      var animation;
      if (!defined(options.animation) || options.animation !== false) {
        var animationContainer = document.createElement('div');
        animationContainer.className = 'cesium-viewer-animationContainer';
        viewerContainer.appendChild(animationContainer);
        animation = new Animation(animationContainer, new AnimationViewModel(clockViewModel));
      }
      var timeline;
      if (!defined(options.timeline) || options.timeline !== false) {
        var timelineContainer = document.createElement('div');
        timelineContainer.className = 'cesium-viewer-timelineContainer';
        viewerContainer.appendChild(timelineContainer);
        timeline = new Timeline(timelineContainer, clock);
        timeline.addEventListener('settime', onTimelineScrubfunction, false);
        timeline.zoomTo(clock.startTime, clock.stopTime);
      }
      var fullscreenButton;
      var fullscreenSubscription;
      if (!defined(options.fullscreenButton) || options.fullscreenButton !== false) {
        var fullscreenContainer = document.createElement('div');
        fullscreenContainer.className = 'cesium-viewer-fullscreenContainer';
        viewerContainer.appendChild(fullscreenContainer);
        fullscreenButton = new FullscreenButton(fullscreenContainer, options.fullscreenElement);
        fullscreenSubscription = subscribeAndEvaluate(fullscreenButton.viewModel, 'isFullscreenEnabled', function(isFullscreenEnabled) {
          fullscreenContainer.style.display = isFullscreenEnabled ? 'block' : 'none';
          if (defined(timeline)) {
            timeline.container.style.right = fullscreenContainer.clientWidth + 'px';
            timeline.resize();
          }
        });
      }
      var vrButton;
      var vrSubscription;
      var vrModeSubscription;
      if (options.vrButton) {
        var vrContainer = document.createElement('div');
        vrContainer.className = 'cesium-viewer-vrContainer';
        viewerContainer.appendChild(vrContainer);
        vrButton = new VRButton(vrContainer, cesiumWidget.scene, options.fullScreenElement);
        vrSubscription = subscribeAndEvaluate(vrButton.viewModel, 'isVREnabled', function(isVREnabled) {
          vrContainer.style.display = isVREnabled ? 'block' : 'none';
          if (defined(fullscreenButton)) {
            vrContainer.style.right = fullscreenContainer.clientWidth + 'px';
          }
          if (defined(timeline)) {
            timeline.container.style.right = vrContainer.clientWidth + 'px';
            timeline.resize();
          }
        });
        vrModeSubscription = subscribeAndEvaluate(vrButton.viewModel, 'isVRMode', function(isVRMode) {
          enableVRUI(that, isVRMode);
        });
      }
      this._baseLayerPickerDropDown = baseLayerPickerDropDown;
      this._fullscreenSubscription = fullscreenSubscription;
      this._vrSubscription = vrSubscription;
      this._vrModeSubscription = vrModeSubscription;
      this._dataSourceChangedListeners = {};
      this._automaticallyTrackDataSourceClocks = defaultValue(options.automaticallyTrackDataSourceClocks, true);
      this._container = container;
      this._bottomContainer = bottomContainer;
      this._element = viewerContainer;
      this._cesiumWidget = cesiumWidget;
      this._selectionIndicator = selectionIndicator;
      this._infoBox = infoBox;
      this._dataSourceCollection = dataSourceCollection;
      this._destroyDataSourceCollection = destroyDataSourceCollection;
      this._dataSourceDisplay = dataSourceDisplay;
      this._clockViewModel = clockViewModel;
      this._toolbar = toolbar;
      this._homeButton = homeButton;
      this._sceneModePicker = sceneModePicker;
      this._baseLayerPicker = baseLayerPicker;
      this._navigationHelpButton = navigationHelpButton;
      this._animation = animation;
      this._timeline = timeline;
      this._fullscreenButton = fullscreenButton;
      this._vrButton = vrButton;
      this._geocoder = geocoder;
      this._eventHelper = eventHelper;
      this._lastWidth = 0;
      this._lastHeight = 0;
      this._allowDataSourcesToSuspendAnimation = true;
      this._entityView = undefined;
      this._enableInfoOrSelection = defined(infoBox) || defined(selectionIndicator);
      this._clockTrackedDataSource = undefined;
      this._trackedEntity = undefined;
      this._needTrackedEntityUpdate = false;
      this._selectedEntity = undefined;
      this._clockTrackedDataSource = undefined;
      this._forceResize = false;
      this._zoomIsFlight = false;
      this._zoomTarget = undefined;
      this._zoomPromise = undefined;
      this._zoomOptions = undefined;
      knockout.track(this, ['_trackedEntity', '_selectedEntity', '_clockTrackedDataSource']);
      eventHelper.add(dataSourceCollection.dataSourceAdded, Viewer.prototype._onDataSourceAdded, this);
      eventHelper.add(dataSourceCollection.dataSourceRemoved, Viewer.prototype._onDataSourceRemoved, this);
      eventHelper.add(cesiumWidget.scene.preRender, Viewer.prototype.resize, this);
      eventHelper.add(cesiumWidget.scene.postRender, Viewer.prototype._postRender, this);
      var dataSourceLength = dataSourceCollection.length;
      for (var i = 0; i < dataSourceLength; i++) {
        this._dataSourceAdded(dataSourceCollection, dataSourceCollection.get(i));
      }
      this._dataSourceAdded(undefined, dataSourceDisplay.defaultDataSource);
      eventHelper.add(dataSourceCollection.dataSourceAdded, Viewer.prototype._dataSourceAdded, this);
      eventHelper.add(dataSourceCollection.dataSourceRemoved, Viewer.prototype._dataSourceRemoved, this);
      function pickAndTrackObject(e) {
        var entity = pickEntity(that, e);
        if (defined(entity)) {
          if (Property.getValueOrUndefined(entity.position, that.clock.currentTime)) {
            that.trackedEntity = entity;
          } else {
            that.zoomTo(entity);
          }
        }
      }
      function pickAndSelectObject(e) {
        that.selectedEntity = pickEntity(that, e);
      }
      cesiumWidget.screenSpaceEventHandler.setInputAction(pickAndSelectObject, ScreenSpaceEventType.LEFT_CLICK);
      cesiumWidget.screenSpaceEventHandler.setInputAction(pickAndTrackObject, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }
    defineProperties(Viewer.prototype, {
      container: {get: function() {
          return this._container;
        }},
      bottomContainer: {get: function() {
          return this._bottomContainer;
        }},
      cesiumWidget: {get: function() {
          return this._cesiumWidget;
        }},
      selectionIndicator: {get: function() {
          return this._selectionIndicator;
        }},
      infoBox: {get: function() {
          return this._infoBox;
        }},
      geocoder: {get: function() {
          return this._geocoder;
        }},
      homeButton: {get: function() {
          return this._homeButton;
        }},
      sceneModePicker: {get: function() {
          return this._sceneModePicker;
        }},
      baseLayerPicker: {get: function() {
          return this._baseLayerPicker;
        }},
      navigationHelpButton: {get: function() {
          return this._navigationHelpButton;
        }},
      animation: {get: function() {
          return this._animation;
        }},
      timeline: {get: function() {
          return this._timeline;
        }},
      fullscreenButton: {get: function() {
          return this._fullscreenButton;
        }},
      vrButton: {get: function() {
          return this._vrButton;
        }},
      dataSourceDisplay: {get: function() {
          return this._dataSourceDisplay;
        }},
      entities: {get: function() {
          return this._dataSourceDisplay.defaultDataSource.entities;
        }},
      dataSources: {get: function() {
          return this._dataSourceCollection;
        }},
      canvas: {get: function() {
          return this._cesiumWidget.canvas;
        }},
      cesiumLogo: {get: function() {
          return this._cesiumWidget.cesiumLogo;
        }},
      scene: {get: function() {
          return this._cesiumWidget.scene;
        }},
      imageryLayers: {get: function() {
          return this.scene.imageryLayers;
        }},
      terrainProvider: {
        get: function() {
          return this.scene.terrainProvider;
        },
        set: function(terrainProvider) {
          this.scene.terrainProvider = terrainProvider;
        }
      },
      camera: {get: function() {
          return this.scene.camera;
        }},
      clock: {get: function() {
          return this._cesiumWidget.clock;
        }},
      screenSpaceEventHandler: {get: function() {
          return this._cesiumWidget.screenSpaceEventHandler;
        }},
      targetFrameRate: {
        get: function() {
          return this._cesiumWidget.targetFrameRate;
        },
        set: function(value) {
          this._cesiumWidget.targetFrameRate = value;
        }
      },
      useDefaultRenderLoop: {
        get: function() {
          return this._cesiumWidget.useDefaultRenderLoop;
        },
        set: function(value) {
          this._cesiumWidget.useDefaultRenderLoop = value;
        }
      },
      resolutionScale: {
        get: function() {
          return this._cesiumWidget.resolutionScale;
        },
        set: function(value) {
          this._cesiumWidget.resolutionScale = value;
          this._forceResize = true;
        }
      },
      allowDataSourcesToSuspendAnimation: {
        get: function() {
          return this._allowDataSourcesToSuspendAnimation;
        },
        set: function(value) {
          this._allowDataSourcesToSuspendAnimation = value;
        }
      },
      trackedEntity: {
        get: function() {
          return this._trackedEntity;
        },
        set: function(value) {
          if (this._trackedEntity !== value) {
            this._trackedEntity = value;
            cancelZoom(this);
            var scene = this.scene;
            var sceneMode = scene.mode;
            if (!defined(value) || !defined(value.position)) {
              this._needTrackedEntityUpdate = false;
              if (sceneMode === SceneMode.COLUMBUS_VIEW || sceneMode === SceneMode.SCENE2D) {
                scene.screenSpaceCameraController.enableTranslate = true;
              }
              if (sceneMode === SceneMode.COLUMBUS_VIEW || sceneMode === SceneMode.SCENE3D) {
                scene.screenSpaceCameraController.enableTilt = true;
              }
              this._entityView = undefined;
              this.camera.lookAtTransform(Matrix4.IDENTITY);
              return;
            }
            this._needTrackedEntityUpdate = true;
          }
        }
      },
      selectedEntity: {
        get: function() {
          return this._selectedEntity;
        },
        set: function(value) {
          if (this._selectedEntity !== value) {
            this._selectedEntity = value;
            var selectionIndicatorViewModel = defined(this._selectionIndicator) ? this._selectionIndicator.viewModel : undefined;
            if (defined(value)) {
              if (defined(selectionIndicatorViewModel)) {
                selectionIndicatorViewModel.animateAppear();
              }
            } else {
              if (defined(selectionIndicatorViewModel)) {
                selectionIndicatorViewModel.animateDepart();
              }
            }
          }
        }
      },
      clockTrackedDataSource: {
        get: function() {
          return this._clockTrackedDataSource;
        },
        set: function(value) {
          if (this._clockTrackedDataSource !== value) {
            this._clockTrackedDataSource = value;
            trackDataSourceClock(this._timeline, this.clock, value);
          }
        }
      }
    });
    Viewer.prototype.extend = function(mixin, options) {
      if (!defined(mixin)) {
        throw new DeveloperError('mixin is required.');
      }
      mixin(this, options);
    };
    Viewer.prototype.resize = function() {
      var cesiumWidget = this._cesiumWidget;
      var container = this._container;
      var width = container.clientWidth;
      var height = container.clientHeight;
      var animationExists = defined(this._animation);
      var timelineExists = defined(this._timeline);
      if (!this._forceResize && width === this._lastWidth && height === this._lastHeight) {
        return;
      }
      cesiumWidget.resize();
      this._forceResize = false;
      var panelMaxHeight = height - 125;
      var baseLayerPickerDropDown = this._baseLayerPickerDropDown;
      if (defined(baseLayerPickerDropDown)) {
        baseLayerPickerDropDown.style.maxHeight = panelMaxHeight + 'px';
      }
      if (defined(this._infoBox)) {
        this._infoBox.viewModel.maxHeight = panelMaxHeight;
      }
      var timeline = this._timeline;
      var animationContainer;
      var animationWidth = 0;
      var creditLeft = 0;
      var creditBottom = 0;
      if (animationExists && window.getComputedStyle(this._animation.container).visibility !== 'hidden') {
        var lastWidth = this._lastWidth;
        animationContainer = this._animation.container;
        if (width > 900) {
          animationWidth = 169;
          if (lastWidth <= 900) {
            animationContainer.style.width = '169px';
            animationContainer.style.height = '112px';
            this._animation.resize();
          }
        } else if (width >= 600) {
          animationWidth = 136;
          if (lastWidth < 600 || lastWidth > 900) {
            animationContainer.style.width = '136px';
            animationContainer.style.height = '90px';
            this._animation.resize();
          }
        } else {
          animationWidth = 106;
          if (lastWidth > 600 || lastWidth === 0) {
            animationContainer.style.width = '106px';
            animationContainer.style.height = '70px';
            this._animation.resize();
          }
        }
        creditLeft = animationWidth + 5;
      }
      if (timelineExists && window.getComputedStyle(this._timeline.container).visibility !== 'hidden') {
        var fullscreenButton = this._fullscreenButton;
        var vrButton = this._vrButton;
        var timelineContainer = timeline.container;
        var timelineStyle = timelineContainer.style;
        creditBottom = timelineContainer.clientHeight + 3;
        timelineStyle.left = animationWidth + 'px';
        var pixels = 0;
        if (defined(fullscreenButton)) {
          pixels += fullscreenButton.container.clientWidth;
        }
        if (defined(vrButton)) {
          pixels += vrButton.container.clientWidth;
        }
        timelineStyle.right = pixels + 'px';
        timeline.resize();
      }
      this._bottomContainer.style.left = creditLeft + 'px';
      this._bottomContainer.style.bottom = creditBottom + 'px';
      this._lastWidth = width;
      this._lastHeight = height;
    };
    Viewer.prototype.forceResize = function() {
      this._lastWidth = 0;
      this.resize();
    };
    Viewer.prototype.render = function() {
      this._cesiumWidget.render();
    };
    Viewer.prototype.isDestroyed = function() {
      return false;
    };
    Viewer.prototype.destroy = function() {
      var i;
      this.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      this.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      var dataSources = this.dataSources;
      var dataSourceLength = dataSources.length;
      for (i = 0; i < dataSourceLength; i++) {
        this._dataSourceRemoved(dataSources, dataSources.get(i));
      }
      this._dataSourceRemoved(undefined, this._dataSourceDisplay.defaultDataSource);
      this._container.removeChild(this._element);
      this._element.removeChild(this._toolbar);
      this._eventHelper.removeAll();
      if (defined(this._geocoder)) {
        this._geocoder = this._geocoder.destroy();
      }
      if (defined(this._homeButton)) {
        this._homeButton = this._homeButton.destroy();
      }
      if (defined(this._sceneModePicker)) {
        this._sceneModePicker = this._sceneModePicker.destroy();
      }
      if (defined(this._baseLayerPicker)) {
        this._baseLayerPicker = this._baseLayerPicker.destroy();
      }
      if (defined(this._animation)) {
        this._element.removeChild(this._animation.container);
        this._animation = this._animation.destroy();
      }
      if (defined(this._timeline)) {
        this._timeline.removeEventListener('settime', onTimelineScrubfunction, false);
        this._element.removeChild(this._timeline.container);
        this._timeline = this._timeline.destroy();
      }
      if (defined(this._fullscreenButton)) {
        this._fullscreenSubscription.dispose();
        this._element.removeChild(this._fullscreenButton.container);
        this._fullscreenButton = this._fullscreenButton.destroy();
      }
      if (defined(this._vrButton)) {
        this._vrSubscription.dispose();
        this._vrModeSubscription.dispose();
        this._element.removeChild(this._vrButton.container);
        this._vrButton = this._vrButton.destroy();
      }
      if (defined(this._infoBox)) {
        this._element.removeChild(this._infoBox.container);
        this._infoBox = this._infoBox.destroy();
      }
      if (defined(this._selectionIndicator)) {
        this._element.removeChild(this._selectionIndicator.container);
        this._selectionIndicator = this._selectionIndicator.destroy();
      }
      this._clockViewModel = this._clockViewModel.destroy();
      this._dataSourceDisplay = this._dataSourceDisplay.destroy();
      this._cesiumWidget = this._cesiumWidget.destroy();
      if (this._destroyDataSourceCollection) {
        this._dataSourceCollection = this._dataSourceCollection.destroy();
      }
      return destroyObject(this);
    };
    Viewer.prototype._dataSourceAdded = function(dataSourceCollection, dataSource) {
      var entityCollection = dataSource.entities;
      entityCollection.collectionChanged.addEventListener(Viewer.prototype._onEntityCollectionChanged, this);
    };
    Viewer.prototype._dataSourceRemoved = function(dataSourceCollection, dataSource) {
      var entityCollection = dataSource.entities;
      entityCollection.collectionChanged.removeEventListener(Viewer.prototype._onEntityCollectionChanged, this);
      if (defined(this.trackedEntity)) {
        if (entityCollection.getById(this.trackedEntity.id) === this.trackedEntity) {
          this.trackedEntity = undefined;
        }
      }
      if (defined(this.selectedEntity)) {
        if (entityCollection.getById(this.selectedEntity.id) === this.selectedEntity) {
          this.selectedEntity = undefined;
        }
      }
    };
    Viewer.prototype._onTick = function(clock) {
      var time = clock.currentTime;
      var isUpdated = this._dataSourceDisplay.update(time);
      if (this._allowDataSourcesToSuspendAnimation) {
        this._clockViewModel.canAnimate = isUpdated;
      }
      var entityView = this._entityView;
      if (defined(entityView)) {
        entityView.update(time);
      }
      var position;
      var enableCamera = false;
      var selectedEntity = this.selectedEntity;
      var showSelection = defined(selectedEntity) && this._enableInfoOrSelection;
      if (showSelection && selectedEntity.isShowing && selectedEntity.isAvailable(time)) {
        var state = this._dataSourceDisplay.getBoundingSphere(selectedEntity, true, boundingSphereScratch);
        if (state !== BoundingSphereState.FAILED) {
          position = boundingSphereScratch.center;
        } else if (defined(selectedEntity.position)) {
          position = selectedEntity.position.getValue(time, position);
        }
        enableCamera = defined(position);
      }
      var selectionIndicatorViewModel = defined(this._selectionIndicator) ? this._selectionIndicator.viewModel : undefined;
      if (defined(selectionIndicatorViewModel)) {
        selectionIndicatorViewModel.position = Cartesian3.clone(position, selectionIndicatorViewModel.position);
        selectionIndicatorViewModel.showSelection = showSelection && enableCamera;
        selectionIndicatorViewModel.update();
      }
      var infoBoxViewModel = defined(this._infoBox) ? this._infoBox.viewModel : undefined;
      if (defined(infoBoxViewModel)) {
        infoBoxViewModel.showInfo = showSelection;
        infoBoxViewModel.enableCamera = enableCamera;
        infoBoxViewModel.isCameraTracking = (this.trackedEntity === this.selectedEntity);
        if (showSelection) {
          infoBoxViewModel.titleText = defaultValue(selectedEntity.name, selectedEntity.id);
          infoBoxViewModel.description = Property.getValueOrDefault(selectedEntity.description, time, '');
        } else {
          infoBoxViewModel.titleText = '';
          infoBoxViewModel.description = '';
        }
      }
    };
    Viewer.prototype._onEntityCollectionChanged = function(collection, added, removed) {
      var length = removed.length;
      for (var i = 0; i < length; i++) {
        var removedObject = removed[i];
        if (this.trackedEntity === removedObject) {
          this.trackedEntity = undefined;
        }
        if (this.selectedEntity === removedObject) {
          this.selectedEntity = undefined;
        }
      }
    };
    Viewer.prototype._onInfoBoxCameraClicked = function(infoBoxViewModel) {
      if (infoBoxViewModel.isCameraTracking && (this.trackedEntity === this.selectedEntity)) {
        this.trackedEntity = undefined;
      } else {
        var selectedEntity = this.selectedEntity;
        var position = selectedEntity.position;
        if (defined(position)) {
          this.trackedEntity = this.selectedEntity;
        } else {
          this.zoomTo(this.selectedEntity);
        }
      }
    };
    Viewer.prototype._clearTrackedObject = function() {
      this.trackedEntity = undefined;
    };
    Viewer.prototype._onInfoBoxClockClicked = function(infoBoxViewModel) {
      this.selectedEntity = undefined;
    };
    Viewer.prototype._clearObjects = function() {
      this.trackedEntity = undefined;
      this.selectedEntity = undefined;
    };
    Viewer.prototype._onDataSourceChanged = function(dataSource) {
      if (this.clockTrackedDataSource === dataSource) {
        trackDataSourceClock(this.timeline, this.clock, dataSource);
      }
    };
    Viewer.prototype._onDataSourceAdded = function(dataSourceCollection, dataSource) {
      if (this._automaticallyTrackDataSourceClocks) {
        this.clockTrackedDataSource = dataSource;
      }
      var id = dataSource.entities.id;
      var removalFunc = this._eventHelper.add(dataSource.changedEvent, Viewer.prototype._onDataSourceChanged, this);
      this._dataSourceChangedListeners[id] = removalFunc;
    };
    Viewer.prototype._onDataSourceRemoved = function(dataSourceCollection, dataSource) {
      var resetClock = (this.clockTrackedDataSource === dataSource);
      var id = dataSource.entities.id;
      this._dataSourceChangedListeners[id]();
      this._dataSourceChangedListeners[id] = undefined;
      if (resetClock) {
        var numDataSources = dataSourceCollection.length;
        if (this._automaticallyTrackDataSourceClocks && numDataSources > 0) {
          this.clockTrackedDataSource = dataSourceCollection.get(numDataSources - 1);
        } else {
          this.clockTrackedDataSource = undefined;
        }
      }
    };
    Viewer.prototype.zoomTo = function(target, offset) {
      return zoomToOrFly(this, target, offset, false);
    };
    Viewer.prototype.flyTo = function(target, options) {
      return zoomToOrFly(this, target, options, true);
    };
    function zoomToOrFly(that, zoomTarget, options, isFlight) {
      if (!defined(zoomTarget)) {
        throw new DeveloperError('zoomTarget is required.');
      }
      cancelZoom(that);
      var zoomPromise = when.defer();
      that._zoomPromise = zoomPromise;
      that._zoomIsFlight = isFlight;
      that._zoomOptions = options;
      when(zoomTarget, function(zoomTarget) {
        if (that._zoomPromise !== zoomPromise) {
          return;
        }
        if (zoomTarget instanceof ImageryLayer) {
          zoomTarget.getViewableRectangle().then(function(rectangle) {
            if (that._zoomPromise === zoomPromise) {
              that._zoomTarget = rectangle;
            }
          });
          return;
        }
        if (zoomTarget.isLoading && defined(zoomTarget.loadingEvent)) {
          var removeEvent = zoomTarget.loadingEvent.addEventListener(function() {
            removeEvent();
            if (that._zoomPromise === zoomPromise) {
              that._zoomTarget = zoomTarget.entities.values.slice(0);
            }
          });
          return;
        }
        zoomTarget = defaultValue(zoomTarget.values, zoomTarget);
        if (defined(zoomTarget.entities)) {
          zoomTarget = zoomTarget.entities.values;
        }
        if (isArray(zoomTarget)) {
          that._zoomTarget = zoomTarget.slice(0);
        } else {
          that._zoomTarget = [zoomTarget];
        }
      });
      return zoomPromise.promise;
    }
    function clearZoom(viewer) {
      viewer._zoomPromise = undefined;
      viewer._zoomTarget = undefined;
      viewer._zoomOptions = undefined;
    }
    function cancelZoom(viewer) {
      var zoomPromise = viewer._zoomPromise;
      if (defined(zoomPromise)) {
        clearZoom(viewer);
        zoomPromise.resolve(false);
      }
    }
    Viewer.prototype._postRender = function() {
      updateZoomTarget(this);
      updateTrackedEntity(this);
    };
    function updateZoomTarget(viewer) {
      var entities = viewer._zoomTarget;
      if (!defined(entities) || viewer.scene.mode === SceneMode.MORPHING) {
        return;
      }
      var scene = viewer.scene;
      var camera = scene.camera;
      var zoomPromise = viewer._zoomPromise;
      var zoomOptions = defaultValue(viewer._zoomOptions, {});
      if (entities instanceof Rectangle) {
        var options = {
          destination: entities,
          duration: zoomOptions.duration,
          maximumHeight: zoomOptions.maximumHeight,
          complete: function() {
            zoomPromise.resolve(true);
          },
          cancel: function() {
            zoomPromise.resolve(false);
          }
        };
        if (viewer._zoomIsFlight) {
          camera.flyTo(options);
        } else {
          camera.setView(options);
          zoomPromise.resolve(true);
        }
        clearZoom(viewer);
        return;
      }
      var boundingSpheres = [];
      for (var i = 0,
          len = entities.length; i < len; i++) {
        var state = viewer._dataSourceDisplay.getBoundingSphere(entities[i], false, boundingSphereScratch);
        if (state === BoundingSphereState.PENDING) {
          return;
        } else if (state !== BoundingSphereState.FAILED) {
          boundingSpheres.push(BoundingSphere.clone(boundingSphereScratch));
        }
      }
      if (boundingSpheres.length === 0) {
        cancelZoom(viewer);
        return;
      }
      viewer.trackedEntity = undefined;
      var boundingSphere = BoundingSphere.fromBoundingSpheres(boundingSpheres);
      var controller = scene.screenSpaceCameraController;
      controller.minimumZoomDistance = Math.min(controller.minimumZoomDistance, boundingSphere.radius * 0.5);
      if (!viewer._zoomIsFlight) {
        camera.viewBoundingSphere(boundingSphere, viewer._zoomOptions);
        camera.lookAtTransform(Matrix4.IDENTITY);
        clearZoom(viewer);
        zoomPromise.resolve(true);
      } else {
        clearZoom(viewer);
        camera.flyToBoundingSphere(boundingSphere, {
          duration: zoomOptions.duration,
          maximumHeight: zoomOptions.maximumHeight,
          complete: function() {
            zoomPromise.resolve(true);
          },
          cancel: function() {
            zoomPromise.resolve(false);
          },
          offset: zoomOptions.offset
        });
      }
    }
    function updateTrackedEntity(viewer) {
      if (!viewer._needTrackedEntityUpdate) {
        return;
      }
      var trackedEntity = viewer._trackedEntity;
      var currentTime = viewer.clock.currentTime;
      var currentPosition = Property.getValueOrUndefined(trackedEntity.position, currentTime);
      if (!defined(currentPosition)) {
        return;
      }
      var scene = viewer.scene;
      var state = viewer._dataSourceDisplay.getBoundingSphere(trackedEntity, false, boundingSphereScratch);
      if (state === BoundingSphereState.PENDING) {
        return;
      }
      var sceneMode = scene.mode;
      if (sceneMode === SceneMode.COLUMBUS_VIEW || sceneMode === SceneMode.SCENE2D) {
        scene.screenSpaceCameraController.enableTranslate = false;
      }
      if (sceneMode === SceneMode.COLUMBUS_VIEW || sceneMode === SceneMode.SCENE3D) {
        scene.screenSpaceCameraController.enableTilt = false;
      }
      var bs = state !== BoundingSphereState.FAILED ? boundingSphereScratch : undefined;
      viewer._entityView = new EntityView(trackedEntity, scene, scene.mapProjection.ellipsoid, bs);
      viewer._entityView.update(currentTime);
      viewer._needTrackedEntityUpdate = false;
    }
    return Viewer;
  });
})(require('process'));
