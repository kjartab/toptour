/* */ 
"format cjs";
(function(process) {
  (function(define) {
    'use strict';
    define(function() {
      var reduceArray,
          slice,
          undef;
      when.defer = defer;
      when.resolve = resolve;
      when.reject = reject;
      when.join = join;
      when.all = all;
      when.map = map;
      when.reduce = reduce;
      when.any = any;
      when.some = some;
      when.chain = chain;
      when.isPromise = isPromise;
      function when(promiseOrValue, onFulfilled, onRejected, onProgress) {
        return resolve(promiseOrValue).then(onFulfilled, onRejected, onProgress);
      }
      function resolve(promiseOrValue) {
        var promise,
            deferred;
        if (promiseOrValue instanceof Promise) {
          promise = promiseOrValue;
        } else {
          if (isPromise(promiseOrValue)) {
            deferred = defer();
            promiseOrValue.then(function(value) {
              deferred.resolve(value);
            }, function(reason) {
              deferred.reject(reason);
            }, function(update) {
              deferred.progress(update);
            });
            promise = deferred.promise;
          } else {
            promise = fulfilled(promiseOrValue);
          }
        }
        return promise;
      }
      function reject(promiseOrValue) {
        return when(promiseOrValue, rejected);
      }
      function Promise(then) {
        this.then = then;
      }
      Promise.prototype = {
        always: function(onFulfilledOrRejected, onProgress) {
          return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
        },
        otherwise: function(onRejected) {
          return this.then(undef, onRejected);
        },
        yield: function(value) {
          return this.then(function() {
            return value;
          });
        },
        spread: function(onFulfilled) {
          return this.then(function(array) {
            return all(array, function(array) {
              return onFulfilled.apply(undef, array);
            });
          });
        }
      };
      function fulfilled(value) {
        var p = new Promise(function(onFulfilled) {
          try {
            return resolve(onFulfilled ? onFulfilled(value) : value);
          } catch (e) {
            return rejected(e);
          }
        });
        return p;
      }
      function rejected(reason) {
        var p = new Promise(function(_, onRejected) {
          try {
            return onRejected ? resolve(onRejected(reason)) : rejected(reason);
          } catch (e) {
            return rejected(e);
          }
        });
        return p;
      }
      function defer() {
        var deferred,
            promise,
            handlers,
            progressHandlers,
            _then,
            _progress,
            _resolve;
        promise = new Promise(then);
        deferred = {
          then: then,
          resolve: promiseResolve,
          reject: promiseReject,
          progress: promiseProgress,
          promise: promise,
          resolver: {
            resolve: promiseResolve,
            reject: promiseReject,
            progress: promiseProgress
          }
        };
        handlers = [];
        progressHandlers = [];
        _then = function(onFulfilled, onRejected, onProgress) {
          var deferred,
              progressHandler;
          deferred = defer();
          progressHandler = typeof onProgress === 'function' ? function(update) {
            try {
              deferred.progress(onProgress(update));
            } catch (e) {
              deferred.progress(e);
            }
          } : function(update) {
            deferred.progress(update);
          };
          handlers.push(function(promise) {
            promise.then(onFulfilled, onRejected).then(deferred.resolve, deferred.reject, progressHandler);
          });
          progressHandlers.push(progressHandler);
          return deferred.promise;
        };
        _progress = function(update) {
          processQueue(progressHandlers, update);
          return update;
        };
        _resolve = function(value) {
          value = resolve(value);
          _then = value.then;
          _resolve = resolve;
          _progress = noop;
          processQueue(handlers, value);
          progressHandlers = handlers = undef;
          return value;
        };
        return deferred;
        function then(onFulfilled, onRejected, onProgress) {
          return _then(onFulfilled, onRejected, onProgress);
        }
        function promiseResolve(val) {
          return _resolve(val);
        }
        function promiseReject(err) {
          return _resolve(rejected(err));
        }
        function promiseProgress(update) {
          return _progress(update);
        }
      }
      function isPromise(promiseOrValue) {
        return promiseOrValue && typeof promiseOrValue.then === 'function';
      }
      function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {
        checkCallbacks(2, arguments);
        return when(promisesOrValues, function(promisesOrValues) {
          var toResolve,
              toReject,
              values,
              reasons,
              deferred,
              fulfillOne,
              rejectOne,
              progress,
              len,
              i;
          len = promisesOrValues.length >>> 0;
          toResolve = Math.max(0, Math.min(howMany, len));
          values = [];
          toReject = (len - toResolve) + 1;
          reasons = [];
          deferred = defer();
          if (!toResolve) {
            deferred.resolve(values);
          } else {
            progress = deferred.progress;
            rejectOne = function(reason) {
              reasons.push(reason);
              if (!--toReject) {
                fulfillOne = rejectOne = noop;
                deferred.reject(reasons);
              }
            };
            fulfillOne = function(val) {
              values.push(val);
              if (!--toResolve) {
                fulfillOne = rejectOne = noop;
                deferred.resolve(values);
              }
            };
            for (i = 0; i < len; ++i) {
              if (i in promisesOrValues) {
                when(promisesOrValues[i], fulfiller, rejecter, progress);
              }
            }
          }
          return deferred.then(onFulfilled, onRejected, onProgress);
          function rejecter(reason) {
            rejectOne(reason);
          }
          function fulfiller(val) {
            fulfillOne(val);
          }
        });
      }
      function any(promisesOrValues, onFulfilled, onRejected, onProgress) {
        function unwrapSingleResult(val) {
          return onFulfilled ? onFulfilled(val[0]) : val[0];
        }
        return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
      }
      function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
        checkCallbacks(1, arguments);
        return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
      }
      function join() {
        return map(arguments, identity);
      }
      function map(promise, mapFunc) {
        return when(promise, function(array) {
          var results,
              len,
              toResolve,
              resolve,
              i,
              d;
          toResolve = len = array.length >>> 0;
          results = [];
          d = defer();
          if (!toResolve) {
            d.resolve(results);
          } else {
            resolve = function resolveOne(item, i) {
              when(item, mapFunc).then(function(mapped) {
                results[i] = mapped;
                if (!--toResolve) {
                  d.resolve(results);
                }
              }, d.reject);
            };
            for (i = 0; i < len; i++) {
              if (i in array) {
                resolve(array[i], i);
              } else {
                --toResolve;
              }
            }
          }
          return d.promise;
        });
      }
      function reduce(promise, reduceFunc) {
        var args = slice.call(arguments, 1);
        return when(promise, function(array) {
          var total;
          total = array.length;
          args[0] = function(current, val, i) {
            return when(current, function(c) {
              return when(val, function(value) {
                return reduceFunc(c, value, i, total);
              });
            });
          };
          return reduceArray.apply(array, args);
        });
      }
      function chain(promiseOrValue, resolver, resolveValue) {
        var useResolveValue = arguments.length > 2;
        return when(promiseOrValue, function(val) {
          val = useResolveValue ? resolveValue : val;
          resolver.resolve(val);
          return val;
        }, function(reason) {
          resolver.reject(reason);
          return rejected(reason);
        }, resolver.progress);
      }
      function processQueue(queue, value) {
        var handler,
            i = 0;
        while (handler = queue[i++]) {
          handler(value);
        }
      }
      function checkCallbacks(start, arrayOfCallbacks) {
        var arg,
            i = arrayOfCallbacks.length;
        while (i > start) {
          arg = arrayOfCallbacks[--i];
          if (arg != null && typeof arg != 'function') {
            throw new Error('arg ' + i + ' must be a function');
          }
        }
      }
      function noop() {}
      slice = [].slice;
      reduceArray = [].reduce || function(reduceFunc) {
        var arr,
            args,
            reduced,
            len,
            i;
        i = 0;
        arr = Object(this);
        len = arr.length >>> 0;
        args = arguments;
        if (args.length <= 1) {
          for (; ; ) {
            if (i in arr) {
              reduced = arr[i++];
              break;
            }
            if (++i >= len) {
              throw new TypeError();
            }
          }
        } else {
          reduced = args[1];
        }
        for (; i < len; ++i) {
          if (i in arr) {
            reduced = reduceFunc(reduced, arr[i], i, arr);
          }
        }
        return reduced;
      };
      function identity(x) {
        return x;
      }
      return when;
    });
  })(typeof define == 'function' && define.amd ? define : function(factory) {
    typeof exports === 'object' ? (module.exports = factory()) : (this.when = factory());
  });
})(require('process'));
