/* */ 
"format cjs";
(function(process) {
  define(['./defaultValue', './defined', './DeveloperError'], function(defaultValue, defined, DeveloperError) {
    'use strict';
    var Tipsify = {};
    Tipsify.calculateACMR = function(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      var indices = options.indices;
      var maximumIndex = options.maximumIndex;
      var cacheSize = defaultValue(options.cacheSize, 24);
      if (!defined(indices)) {
        throw new DeveloperError('indices is required.');
      }
      var numIndices = indices.length;
      if (numIndices < 3 || numIndices % 3 !== 0) {
        throw new DeveloperError('indices length must be a multiple of three.');
      }
      if (maximumIndex <= 0) {
        throw new DeveloperError('maximumIndex must be greater than zero.');
      }
      if (cacheSize < 3) {
        throw new DeveloperError('cacheSize must be greater than two.');
      }
      if (!defined(maximumIndex)) {
        maximumIndex = 0;
        var currentIndex = 0;
        var intoIndices = indices[currentIndex];
        while (currentIndex < numIndices) {
          if (intoIndices > maximumIndex) {
            maximumIndex = intoIndices;
          }
          ++currentIndex;
          intoIndices = indices[currentIndex];
        }
      }
      var vertexTimeStamps = [];
      for (var i = 0; i < maximumIndex + 1; i++) {
        vertexTimeStamps[i] = 0;
      }
      var s = cacheSize + 1;
      for (var j = 0; j < numIndices; ++j) {
        if ((s - vertexTimeStamps[indices[j]]) > cacheSize) {
          vertexTimeStamps[indices[j]] = s;
          ++s;
        }
      }
      return (s - cacheSize + 1) / (numIndices / 3);
    };
    Tipsify.tipsify = function(options) {
      options = defaultValue(options, defaultValue.EMPTY_OBJECT);
      var indices = options.indices;
      var maximumIndex = options.maximumIndex;
      var cacheSize = defaultValue(options.cacheSize, 24);
      var cursor;
      function skipDeadEnd(vertices, deadEnd, indices, maximumIndexPlusOne) {
        while (deadEnd.length >= 1) {
          var d = deadEnd[deadEnd.length - 1];
          deadEnd.splice(deadEnd.length - 1, 1);
          if (vertices[d].numLiveTriangles > 0) {
            return d;
          }
        }
        while (cursor < maximumIndexPlusOne) {
          if (vertices[cursor].numLiveTriangles > 0) {
            ++cursor;
            return cursor - 1;
          }
          ++cursor;
        }
        return -1;
      }
      function getNextVertex(indices, cacheSize, oneRing, vertices, s, deadEnd, maximumIndexPlusOne) {
        var n = -1;
        var p;
        var m = -1;
        var itOneRing = 0;
        while (itOneRing < oneRing.length) {
          var index = oneRing[itOneRing];
          if (vertices[index].numLiveTriangles) {
            p = 0;
            if ((s - vertices[index].timeStamp + (2 * vertices[index].numLiveTriangles)) <= cacheSize) {
              p = s - vertices[index].timeStamp;
            }
            if ((p > m) || (m === -1)) {
              m = p;
              n = index;
            }
          }
          ++itOneRing;
        }
        if (n === -1) {
          return skipDeadEnd(vertices, deadEnd, indices, maximumIndexPlusOne);
        }
        return n;
      }
      if (!defined(indices)) {
        throw new DeveloperError('indices is required.');
      }
      var numIndices = indices.length;
      if (numIndices < 3 || numIndices % 3 !== 0) {
        throw new DeveloperError('indices length must be a multiple of three.');
      }
      if (maximumIndex <= 0) {
        throw new DeveloperError('maximumIndex must be greater than zero.');
      }
      if (cacheSize < 3) {
        throw new DeveloperError('cacheSize must be greater than two.');
      }
      var maximumIndexPlusOne = 0;
      var currentIndex = 0;
      var intoIndices = indices[currentIndex];
      var endIndex = numIndices;
      if (defined(maximumIndex)) {
        maximumIndexPlusOne = maximumIndex + 1;
      } else {
        while (currentIndex < endIndex) {
          if (intoIndices > maximumIndexPlusOne) {
            maximumIndexPlusOne = intoIndices;
          }
          ++currentIndex;
          intoIndices = indices[currentIndex];
        }
        if (maximumIndexPlusOne === -1) {
          return 0;
        }
        ++maximumIndexPlusOne;
      }
      var vertices = [];
      for (var i = 0; i < maximumIndexPlusOne; i++) {
        vertices[i] = {
          numLiveTriangles: 0,
          timeStamp: 0,
          vertexTriangles: []
        };
      }
      currentIndex = 0;
      var triangle = 0;
      while (currentIndex < endIndex) {
        vertices[indices[currentIndex]].vertexTriangles.push(triangle);
        ++(vertices[indices[currentIndex]]).numLiveTriangles;
        vertices[indices[currentIndex + 1]].vertexTriangles.push(triangle);
        ++(vertices[indices[currentIndex + 1]]).numLiveTriangles;
        vertices[indices[currentIndex + 2]].vertexTriangles.push(triangle);
        ++(vertices[indices[currentIndex + 2]]).numLiveTriangles;
        ++triangle;
        currentIndex += 3;
      }
      var f = 0;
      var s = cacheSize + 1;
      cursor = 1;
      var oneRing = [];
      var deadEnd = [];
      var vertex;
      var intoVertices;
      var currentOutputIndex = 0;
      var outputIndices = [];
      var numTriangles = numIndices / 3;
      var triangleEmitted = [];
      for (i = 0; i < numTriangles; i++) {
        triangleEmitted[i] = false;
      }
      var index;
      var limit;
      while (f !== -1) {
        oneRing = [];
        intoVertices = vertices[f];
        limit = intoVertices.vertexTriangles.length;
        for (var k = 0; k < limit; ++k) {
          triangle = intoVertices.vertexTriangles[k];
          if (!triangleEmitted[triangle]) {
            triangleEmitted[triangle] = true;
            currentIndex = triangle + triangle + triangle;
            for (var j = 0; j < 3; ++j) {
              index = indices[currentIndex];
              oneRing.push(index);
              deadEnd.push(index);
              outputIndices[currentOutputIndex] = index;
              ++currentOutputIndex;
              vertex = vertices[index];
              --vertex.numLiveTriangles;
              if ((s - vertex.timeStamp) > cacheSize) {
                vertex.timeStamp = s;
                ++s;
              }
              ++currentIndex;
            }
          }
        }
        f = getNextVertex(indices, cacheSize, oneRing, vertices, s, deadEnd, maximumIndexPlusOne);
      }
      return outputIndices;
    };
    return Tipsify;
  });
})(require('process'));
