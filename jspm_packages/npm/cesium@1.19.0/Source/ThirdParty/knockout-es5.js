/* */ 
"format cjs";
(function(process) {
  define(function() {
    'use strict';
    var OBSERVABLES_PROPERTY = '__knockoutObservables';
    var SUBSCRIBABLE_PROPERTY = '__knockoutSubscribable';
    function track(obj, propertyNames) {
      if (!obj) {
        throw new Error('When calling ko.track, you must pass an object as the first parameter.');
      }
      var ko = this,
          allObservablesForObject = getAllObservablesForObject(obj, true);
      propertyNames = propertyNames || Object.getOwnPropertyNames(obj);
      propertyNames.forEach(function(propertyName) {
        if (propertyName === OBSERVABLES_PROPERTY || propertyName === SUBSCRIBABLE_PROPERTY) {
          return;
        }
        if (propertyName in allObservablesForObject) {
          return;
        }
        var origValue = obj[propertyName],
            isArray = origValue instanceof Array,
            observable = ko.isObservable(origValue) ? origValue : isArray ? ko.observableArray(origValue) : ko.observable(origValue);
        Object.defineProperty(obj, propertyName, {
          configurable: true,
          enumerable: true,
          get: observable,
          set: ko.isWriteableObservable(observable) ? observable : undefined
        });
        allObservablesForObject[propertyName] = observable;
        if (isArray) {
          notifyWhenPresentOrFutureArrayValuesMutate(ko, observable);
        }
      });
      return obj;
    }
    function getAllObservablesForObject(obj, createIfNotDefined) {
      var result = obj[OBSERVABLES_PROPERTY];
      if (!result && createIfNotDefined) {
        result = {};
        Object.defineProperty(obj, OBSERVABLES_PROPERTY, {value: result});
      }
      return result;
    }
    function defineComputedProperty(obj, propertyName, evaluatorOrOptions) {
      var ko = this,
          computedOptions = {
            owner: obj,
            deferEvaluation: true
          };
      if (typeof evaluatorOrOptions === 'function') {
        computedOptions.read = evaluatorOrOptions;
      } else {
        if ('value' in evaluatorOrOptions) {
          throw new Error('For ko.defineProperty, you must not specify a "value" for the property. You must provide a "get" function.');
        }
        if (typeof evaluatorOrOptions.get !== 'function') {
          throw new Error('For ko.defineProperty, the third parameter must be either an evaluator function, or an options object containing a function called "get".');
        }
        computedOptions.read = evaluatorOrOptions.get;
        computedOptions.write = evaluatorOrOptions.set;
      }
      obj[propertyName] = ko.computed(computedOptions);
      track.call(ko, obj, [propertyName]);
      return obj;
    }
    function notifyWhenPresentOrFutureArrayValuesMutate(ko, observable) {
      var watchingArraySubscription = null;
      ko.computed(function() {
        if (watchingArraySubscription) {
          watchingArraySubscription.dispose();
          watchingArraySubscription = null;
        }
        var newArrayInstance = observable();
        if (newArrayInstance instanceof Array) {
          watchingArraySubscription = startWatchingArrayInstance(ko, observable, newArrayInstance);
        }
      });
    }
    function startWatchingArrayInstance(ko, observable, arrayInstance) {
      var subscribable = getSubscribableForArray(ko, arrayInstance);
      return subscribable.subscribe(observable);
    }
    function getSubscribableForArray(ko, arrayInstance) {
      var subscribable = arrayInstance[SUBSCRIBABLE_PROPERTY];
      if (!subscribable) {
        subscribable = new ko.subscribable();
        Object.defineProperty(arrayInstance, SUBSCRIBABLE_PROPERTY, {value: subscribable});
        var notificationPauseSignal = {};
        wrapStandardArrayMutators(arrayInstance, subscribable, notificationPauseSignal);
        addKnockoutArrayMutators(ko, arrayInstance, subscribable, notificationPauseSignal);
      }
      return subscribable;
    }
    function wrapStandardArrayMutators(arrayInstance, subscribable, notificationPauseSignal) {
      ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'].forEach(function(fnName) {
        var origMutator = arrayInstance[fnName];
        arrayInstance[fnName] = function() {
          var result = origMutator.apply(this, arguments);
          if (notificationPauseSignal.pause !== true) {
            subscribable.notifySubscribers(this);
          }
          return result;
        };
      });
    }
    function addKnockoutArrayMutators(ko, arrayInstance, subscribable, notificationPauseSignal) {
      ['remove', 'removeAll', 'destroy', 'destroyAll', 'replace'].forEach(function(fnName) {
        Object.defineProperty(arrayInstance, fnName, {
          enumerable: false,
          value: function() {
            var result;
            notificationPauseSignal.pause = true;
            try {
              result = ko.observableArray.fn[fnName].apply(ko.observableArray(arrayInstance), arguments);
            } finally {
              notificationPauseSignal.pause = false;
            }
            subscribable.notifySubscribers(arrayInstance);
            return result;
          }
        });
      });
    }
    function getObservable(obj, propertyName) {
      if (!obj) {
        return null;
      }
      var allObservablesForObject = getAllObservablesForObject(obj, false);
      return (allObservablesForObject && allObservablesForObject[propertyName]) || null;
    }
    function valueHasMutated(obj, propertyName) {
      var observable = getObservable(obj, propertyName);
      if (observable) {
        observable.valueHasMutated();
      }
    }
    function attachToKo(ko) {
      ko.track = track;
      ko.getObservable = getObservable;
      ko.valueHasMutated = valueHasMutated;
      ko.defineProperty = defineComputedProperty;
    }
    return {attachToKo: attachToKo};
  });
})(require('process'));
