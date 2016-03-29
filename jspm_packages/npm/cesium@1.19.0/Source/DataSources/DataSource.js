/* */ 
"format cjs";
(function(process) {
  define(['../Core/defineProperties', '../Core/DeveloperError'], function(defineProperties, DeveloperError) {
    'use strict';
    function DataSource() {
      DeveloperError.throwInstantiationError();
    }
    defineProperties(DataSource.prototype, {
      name: {get: DeveloperError.throwInstantiationError},
      clock: {get: DeveloperError.throwInstantiationError},
      entities: {get: DeveloperError.throwInstantiationError},
      isLoading: {get: DeveloperError.throwInstantiationError},
      changedEvent: {get: DeveloperError.throwInstantiationError},
      errorEvent: {get: DeveloperError.throwInstantiationError},
      loadingEvent: {get: DeveloperError.throwInstantiationError},
      show: {get: DeveloperError.throwInstantiationError}
    });
    DataSource.prototype.update = DeveloperError.throwInstantiationError;
    DataSource.setLoading = function(dataSource, isLoading) {
      if (dataSource._isLoading !== isLoading) {
        if (isLoading) {
          dataSource._entityCollection.suspendEvents();
        } else {
          dataSource._entityCollection.resumeEvents();
        }
        dataSource._isLoading = isLoading;
        dataSource._loading.raiseEvent(dataSource, isLoading);
      }
    };
    return DataSource;
  });
})(require('process'));
