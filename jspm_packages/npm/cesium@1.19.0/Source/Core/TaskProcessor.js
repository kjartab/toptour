/* */ 
"format cjs";
(function(process) {
  define(['../ThirdParty/Uri', '../ThirdParty/when', './buildModuleUrl', './defaultValue', './defined', './destroyObject', './DeveloperError', './getAbsoluteUri', './isCrossOriginUrl', './RuntimeError', 'require'], function(Uri, when, buildModuleUrl, defaultValue, defined, destroyObject, DeveloperError, getAbsoluteUri, isCrossOriginUrl, RuntimeError, require) {
    'use strict';
    function canTransferArrayBuffer() {
      if (!defined(TaskProcessor._canTransferArrayBuffer)) {
        var worker = new Worker(getWorkerUrl('Workers/transferTypedArrayTest.js'));
        worker.postMessage = defaultValue(worker.webkitPostMessage, worker.postMessage);
        var value = 99;
        var array = new Int8Array([value]);
        try {
          worker.postMessage({array: array}, [array.buffer]);
        } catch (e) {
          TaskProcessor._canTransferArrayBuffer = false;
          return TaskProcessor._canTransferArrayBuffer;
        }
        var deferred = when.defer();
        worker.onmessage = function(event) {
          var array = event.data.array;
          var result = defined(array) && array[0] === value;
          deferred.resolve(result);
          worker.terminate();
          TaskProcessor._canTransferArrayBuffer = result;
        };
        TaskProcessor._canTransferArrayBuffer = deferred.promise;
      }
      return TaskProcessor._canTransferArrayBuffer;
    }
    function completeTask(processor, data) {
      --processor._activeTasks;
      var id = data.id;
      if (!defined(id)) {
        return;
      }
      var deferreds = processor._deferreds;
      var deferred = deferreds[id];
      if (defined(data.error)) {
        var error = data.error;
        if (error.name === 'RuntimeError') {
          error = new RuntimeError(data.error.message);
          error.stack = data.error.stack;
        } else if (error.name === 'DeveloperError') {
          error = new DeveloperError(data.error.message);
          error.stack = data.error.stack;
        }
        deferred.reject(error);
      } else {
        deferred.resolve(data.result);
      }
      delete deferreds[id];
    }
    function getWorkerUrl(moduleID) {
      var url = buildModuleUrl(moduleID);
      if (isCrossOriginUrl(url)) {
        var script = 'importScripts("' + url + '");';
        var blob;
        try {
          blob = new Blob([script], {type: 'application/javascript'});
        } catch (e) {
          var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
          var blobBuilder = new BlobBuilder();
          blobBuilder.append(script);
          blob = blobBuilder.getBlob('application/javascript');
        }
        var URL = window.URL || window.webkitURL;
        url = URL.createObjectURL(blob);
      }
      return url;
    }
    var bootstrapperUrlResult;
    function getBootstrapperUrl() {
      if (!defined(bootstrapperUrlResult)) {
        bootstrapperUrlResult = getWorkerUrl('Workers/cesiumWorkerBootstrapper.js');
      }
      return bootstrapperUrlResult;
    }
    function createWorker(processor) {
      var worker = new Worker(getBootstrapperUrl());
      worker.postMessage = defaultValue(worker.webkitPostMessage, worker.postMessage);
      var bootstrapMessage = {
        loaderConfig: {},
        workerModule: TaskProcessor._workerModulePrefix + processor._workerName
      };
      if (defined(TaskProcessor._loaderConfig)) {
        bootstrapMessage.loaderConfig = TaskProcessor._loaderConfig;
      } else if (defined(require.toUrl)) {
        bootstrapMessage.loaderConfig.baseUrl = getAbsoluteUri('..', buildModuleUrl('Workers/cesiumWorkerBootstrapper.js'));
      } else {
        bootstrapMessage.loaderConfig.paths = {'Workers': buildModuleUrl('Workers')};
      }
      worker.postMessage(bootstrapMessage);
      worker.onmessage = function(event) {
        completeTask(processor, event.data);
      };
      return worker;
    }
    function TaskProcessor(workerName, maximumActiveTasks) {
      this._workerName = workerName;
      this._maximumActiveTasks = defaultValue(maximumActiveTasks, 5);
      this._activeTasks = 0;
      this._deferreds = {};
      this._nextID = 0;
    }
    var emptyTransferableObjectArray = [];
    TaskProcessor.prototype.scheduleTask = function(parameters, transferableObjects) {
      if (!defined(this._worker)) {
        this._worker = createWorker(this);
      }
      if (this._activeTasks >= this._maximumActiveTasks) {
        return undefined;
      }
      ++this._activeTasks;
      var processor = this;
      return when(canTransferArrayBuffer(), function(canTransferArrayBuffer) {
        if (!defined(transferableObjects)) {
          transferableObjects = emptyTransferableObjectArray;
        } else if (!canTransferArrayBuffer) {
          transferableObjects.length = 0;
        }
        var id = processor._nextID++;
        var deferred = when.defer();
        processor._deferreds[id] = deferred;
        processor._worker.postMessage({
          id: id,
          parameters: parameters,
          canTransferArrayBuffer: canTransferArrayBuffer
        }, transferableObjects);
        return deferred.promise;
      });
    };
    TaskProcessor.prototype.isDestroyed = function() {
      return false;
    };
    TaskProcessor.prototype.destroy = function() {
      if (defined(this._worker)) {
        this._worker.terminate();
      }
      return destroyObject(this);
    };
    TaskProcessor._defaultWorkerModulePrefix = 'Workers/';
    TaskProcessor._workerModulePrefix = TaskProcessor._defaultWorkerModulePrefix;
    TaskProcessor._loaderConfig = undefined;
    TaskProcessor._canTransferArrayBuffer = undefined;
    return TaskProcessor;
  });
})(require('process'));
