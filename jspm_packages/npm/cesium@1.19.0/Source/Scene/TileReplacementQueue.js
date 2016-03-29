/* */ 
"format cjs";
(function(process) {
  define(['../Core/defined'], function(defined) {
    'use strict';
    function TileReplacementQueue() {
      this.head = undefined;
      this.tail = undefined;
      this.count = 0;
      this._lastBeforeStartOfFrame = undefined;
    }
    TileReplacementQueue.prototype.markStartOfRenderFrame = function() {
      this._lastBeforeStartOfFrame = this.head;
    };
    TileReplacementQueue.prototype.trimTiles = function(maximumTiles) {
      var tileToTrim = this.tail;
      var keepTrimming = true;
      while (keepTrimming && defined(this._lastBeforeStartOfFrame) && this.count > maximumTiles && defined(tileToTrim)) {
        keepTrimming = tileToTrim !== this._lastBeforeStartOfFrame;
        var previous = tileToTrim.replacementPrevious;
        if (tileToTrim.eligibleForUnloading) {
          tileToTrim.freeResources();
          remove(this, tileToTrim);
        }
        tileToTrim = previous;
      }
    };
    function remove(tileReplacementQueue, item) {
      var previous = item.replacementPrevious;
      var next = item.replacementNext;
      if (item === tileReplacementQueue._lastBeforeStartOfFrame) {
        tileReplacementQueue._lastBeforeStartOfFrame = next;
      }
      if (item === tileReplacementQueue.head) {
        tileReplacementQueue.head = next;
      } else {
        previous.replacementNext = next;
      }
      if (item === tileReplacementQueue.tail) {
        tileReplacementQueue.tail = previous;
      } else {
        next.replacementPrevious = previous;
      }
      item.replacementPrevious = undefined;
      item.replacementNext = undefined;
      --tileReplacementQueue.count;
    }
    TileReplacementQueue.prototype.markTileRendered = function(item) {
      var head = this.head;
      if (head === item) {
        if (item === this._lastBeforeStartOfFrame) {
          this._lastBeforeStartOfFrame = item.replacementNext;
        }
        return;
      }
      ++this.count;
      if (!defined(head)) {
        item.replacementPrevious = undefined;
        item.replacementNext = undefined;
        this.head = item;
        this.tail = item;
        return;
      }
      if (defined(item.replacementPrevious) || defined(item.replacementNext)) {
        remove(this, item);
      }
      item.replacementPrevious = undefined;
      item.replacementNext = head;
      head.replacementPrevious = item;
      this.head = item;
    };
    return TileReplacementQueue;
  });
})(require('process'));
