/* */ 
"format cjs";
(function(process) {
  (function() {
    define('Core/defined', [], function() {
      'use strict';
      function defined(value) {
        return value !== undefined && value !== null;
      }
      return defined;
    });
    define('Core/freezeObject', ['./defined'], function(defined) {
      'use strict';
      var freezeObject = Object.freeze;
      if (!defined(freezeObject)) {
        freezeObject = function(o) {
          return o;
        };
      }
      return freezeObject;
    });
    define('Core/defaultValue', ['./freezeObject'], function(freezeObject) {
      'use strict';
      function defaultValue(a, b) {
        if (a !== undefined) {
          return a;
        }
        return b;
      }
      defaultValue.EMPTY_OBJECT = freezeObject({});
      return defaultValue;
    });
    define('Core/DeveloperError', ['./defined'], function(defined) {
      'use strict';
      function DeveloperError(message) {
        this.name = 'DeveloperError';
        this.message = message;
        var stack;
        try {
          throw new Error();
        } catch (e) {
          stack = e.stack;
        }
        this.stack = stack;
      }
      DeveloperError.prototype.toString = function() {
        var str = this.name + ': ' + this.message;
        if (defined(this.stack)) {
          str += '\n' + this.stack.toString();
        }
        return str;
      };
      DeveloperError.throwInstantiationError = function() {
        throw new DeveloperError('This function defines an interface and should not be called directly.');
      };
      return DeveloperError;
    });
    define('ThirdParty/mersenne-twister', [], function() {
      var MersenneTwister = function(seed) {
        if (seed == undefined) {
          seed = new Date().getTime();
        }
        this.N = 624;
        this.M = 397;
        this.MATRIX_A = 0x9908b0df;
        this.UPPER_MASK = 0x80000000;
        this.LOWER_MASK = 0x7fffffff;
        this.mt = new Array(this.N);
        this.mti = this.N + 1;
        this.init_genrand(seed);
      };
      MersenneTwister.prototype.init_genrand = function(s) {
        this.mt[0] = s >>> 0;
        for (this.mti = 1; this.mti < this.N; this.mti++) {
          var s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
          this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
          this.mt[this.mti] >>>= 0;
        }
      };
      MersenneTwister.prototype.genrand_int32 = function() {
        var y;
        var mag01 = new Array(0x0, this.MATRIX_A);
        if (this.mti >= this.N) {
          var kk;
          if (this.mti == this.N + 1)
            this.init_genrand(5489);
          for (kk = 0; kk < this.N - this.M; kk++) {
            y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
            this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
          }
          for (; kk < this.N - 1; kk++) {
            y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
            this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
          }
          y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
          this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
          this.mti = 0;
        }
        y = this.mt[this.mti++];
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);
        return y >>> 0;
      };
      MersenneTwister.prototype.random = function() {
        return this.genrand_int32() * (1.0 / 4294967296.0);
      };
      return MersenneTwister;
    });
    define('Core/Math', ['../ThirdParty/mersenne-twister', './defaultValue', './defined', './DeveloperError'], function(MersenneTwister, defaultValue, defined, DeveloperError) {
      'use strict';
      var CesiumMath = {};
      CesiumMath.EPSILON1 = 0.1;
      CesiumMath.EPSILON2 = 0.01;
      CesiumMath.EPSILON3 = 0.001;
      CesiumMath.EPSILON4 = 0.0001;
      CesiumMath.EPSILON5 = 0.00001;
      CesiumMath.EPSILON6 = 0.000001;
      CesiumMath.EPSILON7 = 0.0000001;
      CesiumMath.EPSILON8 = 0.00000001;
      CesiumMath.EPSILON9 = 0.000000001;
      CesiumMath.EPSILON10 = 0.0000000001;
      CesiumMath.EPSILON11 = 0.00000000001;
      CesiumMath.EPSILON12 = 0.000000000001;
      CesiumMath.EPSILON13 = 0.0000000000001;
      CesiumMath.EPSILON14 = 0.00000000000001;
      CesiumMath.EPSILON15 = 0.000000000000001;
      CesiumMath.EPSILON16 = 0.0000000000000001;
      CesiumMath.EPSILON17 = 0.00000000000000001;
      CesiumMath.EPSILON18 = 0.000000000000000001;
      CesiumMath.EPSILON19 = 0.0000000000000000001;
      CesiumMath.EPSILON20 = 0.00000000000000000001;
      CesiumMath.GRAVITATIONALPARAMETER = 3.986004418e14;
      CesiumMath.SOLAR_RADIUS = 6.955e8;
      CesiumMath.LUNAR_RADIUS = 1737400.0;
      CesiumMath.SIXTY_FOUR_KILOBYTES = 64 * 1024;
      CesiumMath.sign = function(value) {
        if (value > 0) {
          return 1;
        }
        if (value < 0) {
          return -1;
        }
        return 0;
      };
      CesiumMath.signNotZero = function(value) {
        return value < 0.0 ? -1.0 : 1.0;
      };
      CesiumMath.toSNorm = function(value) {
        return Math.round((CesiumMath.clamp(value, -1.0, 1.0) * 0.5 + 0.5) * 255.0);
      };
      CesiumMath.fromSNorm = function(value) {
        return CesiumMath.clamp(value, 0.0, 255.0) / 255.0 * 2.0 - 1.0;
      };
      CesiumMath.sinh = function(value) {
        var part1 = Math.pow(Math.E, value);
        var part2 = Math.pow(Math.E, -1.0 * value);
        return (part1 - part2) * 0.5;
      };
      CesiumMath.cosh = function(value) {
        var part1 = Math.pow(Math.E, value);
        var part2 = Math.pow(Math.E, -1.0 * value);
        return (part1 + part2) * 0.5;
      };
      CesiumMath.lerp = function(p, q, time) {
        return ((1.0 - time) * p) + (time * q);
      };
      CesiumMath.PI = Math.PI;
      CesiumMath.ONE_OVER_PI = 1.0 / Math.PI;
      CesiumMath.PI_OVER_TWO = Math.PI * 0.5;
      CesiumMath.PI_OVER_THREE = Math.PI / 3.0;
      CesiumMath.PI_OVER_FOUR = Math.PI / 4.0;
      CesiumMath.PI_OVER_SIX = Math.PI / 6.0;
      CesiumMath.THREE_PI_OVER_TWO = (3.0 * Math.PI) * 0.5;
      CesiumMath.TWO_PI = 2.0 * Math.PI;
      CesiumMath.ONE_OVER_TWO_PI = 1.0 / (2.0 * Math.PI);
      CesiumMath.RADIANS_PER_DEGREE = Math.PI / 180.0;
      CesiumMath.DEGREES_PER_RADIAN = 180.0 / Math.PI;
      CesiumMath.RADIANS_PER_ARCSECOND = CesiumMath.RADIANS_PER_DEGREE / 3600.0;
      CesiumMath.toRadians = function(degrees) {
        if (!defined(degrees)) {
          throw new DeveloperError('degrees is required.');
        }
        return degrees * CesiumMath.RADIANS_PER_DEGREE;
      };
      CesiumMath.toDegrees = function(radians) {
        if (!defined(radians)) {
          throw new DeveloperError('radians is required.');
        }
        return radians * CesiumMath.DEGREES_PER_RADIAN;
      };
      CesiumMath.convertLongitudeRange = function(angle) {
        if (!defined(angle)) {
          throw new DeveloperError('angle is required.');
        }
        var twoPi = CesiumMath.TWO_PI;
        var simplified = angle - Math.floor(angle / twoPi) * twoPi;
        if (simplified < -Math.PI) {
          return simplified + twoPi;
        }
        if (simplified >= Math.PI) {
          return simplified - twoPi;
        }
        return simplified;
      };
      CesiumMath.negativePiToPi = function(x) {
        if (!defined(x)) {
          throw new DeveloperError('x is required.');
        }
        return CesiumMath.zeroToTwoPi(x + CesiumMath.PI) - CesiumMath.PI;
      };
      CesiumMath.zeroToTwoPi = function(x) {
        if (!defined(x)) {
          throw new DeveloperError('x is required.');
        }
        var mod = CesiumMath.mod(x, CesiumMath.TWO_PI);
        if (Math.abs(mod) < CesiumMath.EPSILON14 && Math.abs(x) > CesiumMath.EPSILON14) {
          return CesiumMath.TWO_PI;
        }
        return mod;
      };
      CesiumMath.mod = function(m, n) {
        if (!defined(m)) {
          throw new DeveloperError('m is required.');
        }
        if (!defined(n)) {
          throw new DeveloperError('n is required.');
        }
        return ((m % n) + n) % n;
      };
      CesiumMath.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
        if (!defined(left)) {
          throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required.');
        }
        if (!defined(relativeEpsilon)) {
          throw new DeveloperError('relativeEpsilon is required.');
        }
        absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
        var absDiff = Math.abs(left - right);
        return absDiff <= absoluteEpsilon || absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right));
      };
      var factorials = [1];
      CesiumMath.factorial = function(n) {
        if (typeof n !== 'number' || n < 0) {
          throw new DeveloperError('A number greater than or equal to 0 is required.');
        }
        var length = factorials.length;
        if (n >= length) {
          var sum = factorials[length - 1];
          for (var i = length; i <= n; i++) {
            factorials.push(sum * i);
          }
        }
        return factorials[n];
      };
      CesiumMath.incrementWrap = function(n, maximumValue, minimumValue) {
        minimumValue = defaultValue(minimumValue, 0.0);
        if (!defined(n)) {
          throw new DeveloperError('n is required.');
        }
        if (maximumValue <= minimumValue) {
          throw new DeveloperError('maximumValue must be greater than minimumValue.');
        }
        ++n;
        if (n > maximumValue) {
          n = minimumValue;
        }
        return n;
      };
      CesiumMath.isPowerOfTwo = function(n) {
        if (typeof n !== 'number' || n < 0) {
          throw new DeveloperError('A number greater than or equal to 0 is required.');
        }
        return (n !== 0) && ((n & (n - 1)) === 0);
      };
      CesiumMath.nextPowerOfTwo = function(n) {
        if (typeof n !== 'number' || n < 0) {
          throw new DeveloperError('A number greater than or equal to 0 is required.');
        }
        --n;
        n |= n >> 1;
        n |= n >> 2;
        n |= n >> 4;
        n |= n >> 8;
        n |= n >> 16;
        ++n;
        return n;
      };
      CesiumMath.clamp = function(value, min, max) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(min)) {
          throw new DeveloperError('min is required.');
        }
        if (!defined(max)) {
          throw new DeveloperError('max is required.');
        }
        return value < min ? min : value > max ? max : value;
      };
      var randomNumberGenerator = new MersenneTwister();
      CesiumMath.setRandomNumberSeed = function(seed) {
        if (!defined(seed)) {
          throw new DeveloperError('seed is required.');
        }
        randomNumberGenerator = new MersenneTwister(seed);
      };
      CesiumMath.nextRandomNumber = function() {
        return randomNumberGenerator.random();
      };
      CesiumMath.acosClamped = function(value) {
        if (!defined(value)) {
          throw new DeveloperError('value is required.');
        }
        return Math.acos(CesiumMath.clamp(value, -1.0, 1.0));
      };
      CesiumMath.asinClamped = function(value) {
        if (!defined(value)) {
          throw new DeveloperError('value is required.');
        }
        return Math.asin(CesiumMath.clamp(value, -1.0, 1.0));
      };
      CesiumMath.chordLength = function(angle, radius) {
        if (!defined(angle)) {
          throw new DeveloperError('angle is required.');
        }
        if (!defined(radius)) {
          throw new DeveloperError('radius is required.');
        }
        return 2.0 * radius * Math.sin(angle * 0.5);
      };
      CesiumMath.logBase = function(number, base) {
        if (!defined(number)) {
          throw new DeveloperError('number is required.');
        }
        if (!defined(base)) {
          throw new DeveloperError('base is required.');
        }
        return Math.log(number) / Math.log(base);
      };
      CesiumMath.fog = function(distanceToCamera, density) {
        var scalar = distanceToCamera * density;
        return 1.0 - Math.exp(-(scalar * scalar));
      };
      return CesiumMath;
    });
    define('Core/Cartesian3', ['./defaultValue', './defined', './DeveloperError', './freezeObject', './Math'], function(defaultValue, defined, DeveloperError, freezeObject, CesiumMath) {
      'use strict';
      function Cartesian3(x, y, z) {
        this.x = defaultValue(x, 0.0);
        this.y = defaultValue(y, 0.0);
        this.z = defaultValue(z, 0.0);
      }
      Cartesian3.fromSpherical = function(spherical, result) {
        if (!defined(spherical)) {
          throw new DeveloperError('spherical is required');
        }
        if (!defined(result)) {
          result = new Cartesian3();
        }
        var clock = spherical.clock;
        var cone = spherical.cone;
        var magnitude = defaultValue(spherical.magnitude, 1.0);
        var radial = magnitude * Math.sin(cone);
        result.x = radial * Math.cos(clock);
        result.y = radial * Math.sin(clock);
        result.z = magnitude * Math.cos(cone);
        return result;
      };
      Cartesian3.fromElements = function(x, y, z, result) {
        if (!defined(result)) {
          return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      Cartesian3.clone = function(cartesian, result) {
        if (!defined(cartesian)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Cartesian3(cartesian.x, cartesian.y, cartesian.z);
        }
        result.x = cartesian.x;
        result.y = cartesian.y;
        result.z = cartesian.z;
        return result;
      };
      Cartesian3.fromCartesian4 = Cartesian3.clone;
      Cartesian3.packedLength = 3;
      Cartesian3.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value.x;
        array[startingIndex++] = value.y;
        array[startingIndex] = value.z;
      };
      Cartesian3.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Cartesian3();
        }
        result.x = array[startingIndex++];
        result.y = array[startingIndex++];
        result.z = array[startingIndex];
        return result;
      };
      Cartesian3.fromArray = Cartesian3.unpack;
      Cartesian3.maximumComponent = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return Math.max(cartesian.x, cartesian.y, cartesian.z);
      };
      Cartesian3.minimumComponent = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return Math.min(cartesian.x, cartesian.y, cartesian.z);
      };
      Cartesian3.minimumByComponent = function(first, second, result) {
        if (!defined(first)) {
          throw new DeveloperError('first is required.');
        }
        if (!defined(second)) {
          throw new DeveloperError('second is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        result.x = Math.min(first.x, second.x);
        result.y = Math.min(first.y, second.y);
        result.z = Math.min(first.z, second.z);
        return result;
      };
      Cartesian3.maximumByComponent = function(first, second, result) {
        if (!defined(first)) {
          throw new DeveloperError('first is required.');
        }
        if (!defined(second)) {
          throw new DeveloperError('second is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        result.x = Math.max(first.x, second.x);
        result.y = Math.max(first.y, second.y);
        result.z = Math.max(first.z, second.z);
        return result;
      };
      Cartesian3.magnitudeSquared = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z;
      };
      Cartesian3.magnitude = function(cartesian) {
        return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
      };
      var distanceScratch = new Cartesian3();
      Cartesian3.distance = function(left, right) {
        if (!defined(left) || !defined(right)) {
          throw new DeveloperError('left and right are required.');
        }
        Cartesian3.subtract(left, right, distanceScratch);
        return Cartesian3.magnitude(distanceScratch);
      };
      Cartesian3.distanceSquared = function(left, right) {
        if (!defined(left) || !defined(right)) {
          throw new DeveloperError('left and right are required.');
        }
        Cartesian3.subtract(left, right, distanceScratch);
        return Cartesian3.magnitudeSquared(distanceScratch);
      };
      Cartesian3.normalize = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var magnitude = Cartesian3.magnitude(cartesian);
        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;
        result.z = cartesian.z / magnitude;
        return result;
      };
      Cartesian3.dot = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        return left.x * right.x + left.y * right.y + left.z * right.z;
      };
      Cartesian3.multiplyComponents = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x * right.x;
        result.y = left.y * right.y;
        result.z = left.z * right.z;
        return result;
      };
      Cartesian3.add = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        return result;
      };
      Cartesian3.subtract = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        return result;
      };
      Cartesian3.multiplyByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = cartesian.x * scalar;
        result.y = cartesian.y * scalar;
        result.z = cartesian.z * scalar;
        return result;
      };
      Cartesian3.divideByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = cartesian.x / scalar;
        result.y = cartesian.y / scalar;
        result.z = cartesian.z / scalar;
        return result;
      };
      Cartesian3.negate = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = -cartesian.x;
        result.y = -cartesian.y;
        result.z = -cartesian.z;
        return result;
      };
      Cartesian3.abs = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = Math.abs(cartesian.x);
        result.y = Math.abs(cartesian.y);
        result.z = Math.abs(cartesian.z);
        return result;
      };
      var lerpScratch = new Cartesian3();
      Cartesian3.lerp = function(start, end, t, result) {
        if (!defined(start)) {
          throw new DeveloperError('start is required.');
        }
        if (!defined(end)) {
          throw new DeveloperError('end is required.');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        Cartesian3.multiplyByScalar(end, t, lerpScratch);
        result = Cartesian3.multiplyByScalar(start, 1.0 - t, result);
        return Cartesian3.add(lerpScratch, result, result);
      };
      var angleBetweenScratch = new Cartesian3();
      var angleBetweenScratch2 = new Cartesian3();
      Cartesian3.angleBetween = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        Cartesian3.normalize(left, angleBetweenScratch);
        Cartesian3.normalize(right, angleBetweenScratch2);
        var cosine = Cartesian3.dot(angleBetweenScratch, angleBetweenScratch2);
        var sine = Cartesian3.magnitude(Cartesian3.cross(angleBetweenScratch, angleBetweenScratch2, angleBetweenScratch));
        return Math.atan2(sine, cosine);
      };
      var mostOrthogonalAxisScratch = new Cartesian3();
      Cartesian3.mostOrthogonalAxis = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var f = Cartesian3.normalize(cartesian, mostOrthogonalAxisScratch);
        Cartesian3.abs(f, f);
        if (f.x <= f.y) {
          if (f.x <= f.z) {
            result = Cartesian3.clone(Cartesian3.UNIT_X, result);
          } else {
            result = Cartesian3.clone(Cartesian3.UNIT_Z, result);
          }
        } else {
          if (f.y <= f.z) {
            result = Cartesian3.clone(Cartesian3.UNIT_Y, result);
          } else {
            result = Cartesian3.clone(Cartesian3.UNIT_Z, result);
          }
        }
        return result;
      };
      Cartesian3.equals = function(left, right) {
        return (left === right) || ((defined(left)) && (defined(right)) && (left.x === right.x) && (left.y === right.y) && (left.z === right.z));
      };
      Cartesian3.equalsArray = function(cartesian, array, offset) {
        return cartesian.x === array[offset] && cartesian.y === array[offset + 1] && cartesian.z === array[offset + 2];
      };
      Cartesian3.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
        return (left === right) || (defined(left) && defined(right) && CesiumMath.equalsEpsilon(left.x, right.x, relativeEpsilon, absoluteEpsilon) && CesiumMath.equalsEpsilon(left.y, right.y, relativeEpsilon, absoluteEpsilon) && CesiumMath.equalsEpsilon(left.z, right.z, relativeEpsilon, absoluteEpsilon));
      };
      Cartesian3.cross = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var leftX = left.x;
        var leftY = left.y;
        var leftZ = left.z;
        var rightX = right.x;
        var rightY = right.y;
        var rightZ = right.z;
        var x = leftY * rightZ - leftZ * rightY;
        var y = leftZ * rightX - leftX * rightZ;
        var z = leftX * rightY - leftY * rightX;
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      Cartesian3.fromDegrees = function(longitude, latitude, height, ellipsoid, result) {
        if (!defined(longitude)) {
          throw new DeveloperError('longitude is required');
        }
        if (!defined(latitude)) {
          throw new DeveloperError('latitude is required');
        }
        var lon = CesiumMath.toRadians(longitude);
        var lat = CesiumMath.toRadians(latitude);
        return Cartesian3.fromRadians(lon, lat, height, ellipsoid, result);
      };
      var scratchN = new Cartesian3();
      var scratchK = new Cartesian3();
      var wgs84RadiiSquared = new Cartesian3(6378137.0 * 6378137.0, 6378137.0 * 6378137.0, 6356752.3142451793 * 6356752.3142451793);
      Cartesian3.fromRadians = function(longitude, latitude, height, ellipsoid, result) {
        if (!defined(longitude)) {
          throw new DeveloperError('longitude is required');
        }
        if (!defined(latitude)) {
          throw new DeveloperError('latitude is required');
        }
        height = defaultValue(height, 0.0);
        var radiiSquared = defined(ellipsoid) ? ellipsoid.radiiSquared : wgs84RadiiSquared;
        var cosLatitude = Math.cos(latitude);
        scratchN.x = cosLatitude * Math.cos(longitude);
        scratchN.y = cosLatitude * Math.sin(longitude);
        scratchN.z = Math.sin(latitude);
        scratchN = Cartesian3.normalize(scratchN, scratchN);
        Cartesian3.multiplyComponents(radiiSquared, scratchN, scratchK);
        var gamma = Math.sqrt(Cartesian3.dot(scratchN, scratchK));
        scratchK = Cartesian3.divideByScalar(scratchK, gamma, scratchK);
        scratchN = Cartesian3.multiplyByScalar(scratchN, height, scratchN);
        if (!defined(result)) {
          result = new Cartesian3();
        }
        return Cartesian3.add(scratchK, scratchN, result);
      };
      Cartesian3.fromDegreesArray = function(coordinates, ellipsoid, result) {
        if (!defined(coordinates)) {
          throw new DeveloperError('positions is required.');
        }
        var pos = new Array(coordinates.length);
        for (var i = 0; i < coordinates.length; i++) {
          pos[i] = CesiumMath.toRadians(coordinates[i]);
        }
        return Cartesian3.fromRadiansArray(pos, ellipsoid, result);
      };
      Cartesian3.fromRadiansArray = function(coordinates, ellipsoid, result) {
        if (!defined(coordinates)) {
          throw new DeveloperError('positions is required.');
        }
        if (coordinates.length < 2) {
          throw new DeveloperError('positions length cannot be less than 2.');
        }
        if (coordinates.length % 2 !== 0) {
          throw new DeveloperError('positions length must be a multiple of 2.');
        }
        var length = coordinates.length;
        if (!defined(result)) {
          result = new Array(length / 2);
        } else {
          result.length = length / 2;
        }
        for (var i = 0; i < length; i += 2) {
          var lon = coordinates[i];
          var lat = coordinates[i + 1];
          result[i / 2] = Cartesian3.fromRadians(lon, lat, 0, ellipsoid, result[i / 2]);
        }
        return result;
      };
      Cartesian3.fromDegreesArrayHeights = function(coordinates, ellipsoid, result) {
        if (!defined(coordinates)) {
          throw new DeveloperError('positions is required.');
        }
        if (coordinates.length < 3) {
          throw new DeveloperError('positions length cannot be less than 3.');
        }
        if (coordinates.length % 3 !== 0) {
          throw new DeveloperError('positions length must be a multiple of 3.');
        }
        var pos = new Array(coordinates.length);
        for (var i = 0; i < coordinates.length; i += 3) {
          pos[i] = CesiumMath.toRadians(coordinates[i]);
          pos[i + 1] = CesiumMath.toRadians(coordinates[i + 1]);
          pos[i + 2] = coordinates[i + 2];
        }
        return Cartesian3.fromRadiansArrayHeights(pos, ellipsoid, result);
      };
      Cartesian3.fromRadiansArrayHeights = function(coordinates, ellipsoid, result) {
        if (!defined(coordinates)) {
          throw new DeveloperError('positions is required.');
        }
        if (coordinates.length < 3) {
          throw new DeveloperError('positions length cannot be less than 3.');
        }
        if (coordinates.length % 3 !== 0) {
          throw new DeveloperError('positions length must be a multiple of 3.');
        }
        var length = coordinates.length;
        if (!defined(result)) {
          result = new Array(length / 3);
        } else {
          result.length = length / 3;
        }
        for (var i = 0; i < length; i += 3) {
          var lon = coordinates[i];
          var lat = coordinates[i + 1];
          var alt = coordinates[i + 2];
          result[i / 3] = Cartesian3.fromRadians(lon, lat, alt, ellipsoid, result[i / 3]);
        }
        return result;
      };
      Cartesian3.ZERO = freezeObject(new Cartesian3(0.0, 0.0, 0.0));
      Cartesian3.UNIT_X = freezeObject(new Cartesian3(1.0, 0.0, 0.0));
      Cartesian3.UNIT_Y = freezeObject(new Cartesian3(0.0, 1.0, 0.0));
      Cartesian3.UNIT_Z = freezeObject(new Cartesian3(0.0, 0.0, 1.0));
      Cartesian3.prototype.clone = function(result) {
        return Cartesian3.clone(this, result);
      };
      Cartesian3.prototype.equals = function(right) {
        return Cartesian3.equals(this, right);
      };
      Cartesian3.prototype.equalsEpsilon = function(right, relativeEpsilon, absoluteEpsilon) {
        return Cartesian3.equalsEpsilon(this, right, relativeEpsilon, absoluteEpsilon);
      };
      Cartesian3.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ')';
      };
      return Cartesian3;
    });
    define('Core/scaleToGeodeticSurface', ['./Cartesian3', './defined', './DeveloperError', './Math'], function(Cartesian3, defined, DeveloperError, CesiumMath) {
      'use strict';
      var scaleToGeodeticSurfaceIntersection = new Cartesian3();
      var scaleToGeodeticSurfaceGradient = new Cartesian3();
      function scaleToGeodeticSurface(cartesian, oneOverRadii, oneOverRadiiSquared, centerToleranceSquared, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        if (!defined(oneOverRadii)) {
          throw new DeveloperError('oneOverRadii is required.');
        }
        if (!defined(oneOverRadiiSquared)) {
          throw new DeveloperError('oneOverRadiiSquared is required.');
        }
        if (!defined(centerToleranceSquared)) {
          throw new DeveloperError('centerToleranceSquared is required.');
        }
        var positionX = cartesian.x;
        var positionY = cartesian.y;
        var positionZ = cartesian.z;
        var oneOverRadiiX = oneOverRadii.x;
        var oneOverRadiiY = oneOverRadii.y;
        var oneOverRadiiZ = oneOverRadii.z;
        var x2 = positionX * positionX * oneOverRadiiX * oneOverRadiiX;
        var y2 = positionY * positionY * oneOverRadiiY * oneOverRadiiY;
        var z2 = positionZ * positionZ * oneOverRadiiZ * oneOverRadiiZ;
        var squaredNorm = x2 + y2 + z2;
        var ratio = Math.sqrt(1.0 / squaredNorm);
        var intersection = Cartesian3.multiplyByScalar(cartesian, ratio, scaleToGeodeticSurfaceIntersection);
        if (squaredNorm < centerToleranceSquared) {
          return !isFinite(ratio) ? undefined : Cartesian3.clone(intersection, result);
        }
        var oneOverRadiiSquaredX = oneOverRadiiSquared.x;
        var oneOverRadiiSquaredY = oneOverRadiiSquared.y;
        var oneOverRadiiSquaredZ = oneOverRadiiSquared.z;
        var gradient = scaleToGeodeticSurfaceGradient;
        gradient.x = intersection.x * oneOverRadiiSquaredX * 2.0;
        gradient.y = intersection.y * oneOverRadiiSquaredY * 2.0;
        gradient.z = intersection.z * oneOverRadiiSquaredZ * 2.0;
        var lambda = (1.0 - ratio) * Cartesian3.magnitude(cartesian) / (0.5 * Cartesian3.magnitude(gradient));
        var correction = 0.0;
        var func;
        var denominator;
        var xMultiplier;
        var yMultiplier;
        var zMultiplier;
        var xMultiplier2;
        var yMultiplier2;
        var zMultiplier2;
        var xMultiplier3;
        var yMultiplier3;
        var zMultiplier3;
        do {
          lambda -= correction;
          xMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredX);
          yMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredY);
          zMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredZ);
          xMultiplier2 = xMultiplier * xMultiplier;
          yMultiplier2 = yMultiplier * yMultiplier;
          zMultiplier2 = zMultiplier * zMultiplier;
          xMultiplier3 = xMultiplier2 * xMultiplier;
          yMultiplier3 = yMultiplier2 * yMultiplier;
          zMultiplier3 = zMultiplier2 * zMultiplier;
          func = x2 * xMultiplier2 + y2 * yMultiplier2 + z2 * zMultiplier2 - 1.0;
          denominator = x2 * xMultiplier3 * oneOverRadiiSquaredX + y2 * yMultiplier3 * oneOverRadiiSquaredY + z2 * zMultiplier3 * oneOverRadiiSquaredZ;
          var derivative = -2.0 * denominator;
          correction = func / derivative;
        } while (Math.abs(func) > CesiumMath.EPSILON12);
        if (!defined(result)) {
          return new Cartesian3(positionX * xMultiplier, positionY * yMultiplier, positionZ * zMultiplier);
        }
        result.x = positionX * xMultiplier;
        result.y = positionY * yMultiplier;
        result.z = positionZ * zMultiplier;
        return result;
      }
      return scaleToGeodeticSurface;
    });
    define('Core/Cartographic', ['./Cartesian3', './defaultValue', './defined', './DeveloperError', './freezeObject', './Math', './scaleToGeodeticSurface'], function(Cartesian3, defaultValue, defined, DeveloperError, freezeObject, CesiumMath, scaleToGeodeticSurface) {
      'use strict';
      function Cartographic(longitude, latitude, height) {
        this.longitude = defaultValue(longitude, 0.0);
        this.latitude = defaultValue(latitude, 0.0);
        this.height = defaultValue(height, 0.0);
      }
      Cartographic.fromRadians = function(longitude, latitude, height, result) {
        if (!defined(longitude)) {
          throw new DeveloperError('longitude is required.');
        }
        if (!defined(latitude)) {
          throw new DeveloperError('latitude is required.');
        }
        height = defaultValue(height, 0.0);
        if (!defined(result)) {
          return new Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
      };
      Cartographic.fromDegrees = function(longitude, latitude, height, result) {
        if (!defined(longitude)) {
          throw new DeveloperError('longitude is required.');
        }
        if (!defined(latitude)) {
          throw new DeveloperError('latitude is required.');
        }
        longitude = CesiumMath.toRadians(longitude);
        latitude = CesiumMath.toRadians(latitude);
        return Cartographic.fromRadians(longitude, latitude, height, result);
      };
      var cartesianToCartographicN = new Cartesian3();
      var cartesianToCartographicP = new Cartesian3();
      var cartesianToCartographicH = new Cartesian3();
      var wgs84OneOverRadii = new Cartesian3(1.0 / 6378137.0, 1.0 / 6378137.0, 1.0 / 6356752.3142451793);
      var wgs84OneOverRadiiSquared = new Cartesian3(1.0 / (6378137.0 * 6378137.0), 1.0 / (6378137.0 * 6378137.0), 1.0 / (6356752.3142451793 * 6356752.3142451793));
      var wgs84CenterToleranceSquared = CesiumMath.EPSILON1;
      Cartographic.fromCartesian = function(cartesian, ellipsoid, result) {
        var oneOverRadii = defined(ellipsoid) ? ellipsoid.oneOverRadii : wgs84OneOverRadii;
        var oneOverRadiiSquared = defined(ellipsoid) ? ellipsoid.oneOverRadiiSquared : wgs84OneOverRadiiSquared;
        var centerToleranceSquared = defined(ellipsoid) ? ellipsoid._centerToleranceSquared : wgs84CenterToleranceSquared;
        var p = scaleToGeodeticSurface(cartesian, oneOverRadii, oneOverRadiiSquared, centerToleranceSquared, cartesianToCartographicP);
        if (!defined(p)) {
          return undefined;
        }
        var n = Cartesian3.multiplyComponents(cartesian, oneOverRadiiSquared, cartesianToCartographicN);
        n = Cartesian3.normalize(n, n);
        var h = Cartesian3.subtract(cartesian, p, cartesianToCartographicH);
        var longitude = Math.atan2(n.y, n.x);
        var latitude = Math.asin(n.z);
        var height = CesiumMath.sign(Cartesian3.dot(h, cartesian)) * Cartesian3.magnitude(h);
        if (!defined(result)) {
          return new Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
      };
      Cartographic.clone = function(cartographic, result) {
        if (!defined(cartographic)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Cartographic(cartographic.longitude, cartographic.latitude, cartographic.height);
        }
        result.longitude = cartographic.longitude;
        result.latitude = cartographic.latitude;
        result.height = cartographic.height;
        return result;
      };
      Cartographic.equals = function(left, right) {
        return (left === right) || ((defined(left)) && (defined(right)) && (left.longitude === right.longitude) && (left.latitude === right.latitude) && (left.height === right.height));
      };
      Cartographic.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
          throw new DeveloperError('epsilon is required and must be a number.');
        }
        return (left === right) || ((defined(left)) && (defined(right)) && (Math.abs(left.longitude - right.longitude) <= epsilon) && (Math.abs(left.latitude - right.latitude) <= epsilon) && (Math.abs(left.height - right.height) <= epsilon));
      };
      Cartographic.ZERO = freezeObject(new Cartographic(0.0, 0.0, 0.0));
      Cartographic.prototype.clone = function(result) {
        return Cartographic.clone(this, result);
      };
      Cartographic.prototype.equals = function(right) {
        return Cartographic.equals(this, right);
      };
      Cartographic.prototype.equalsEpsilon = function(right, epsilon) {
        return Cartographic.equalsEpsilon(this, right, epsilon);
      };
      Cartographic.prototype.toString = function() {
        return '(' + this.longitude + ', ' + this.latitude + ', ' + this.height + ')';
      };
      return Cartographic;
    });
    define('Core/defineProperties', ['./defined'], function(defined) {
      'use strict';
      var definePropertyWorks = (function() {
        try {
          return 'x' in Object.defineProperty({}, 'x', {});
        } catch (e) {
          return false;
        }
      })();
      var defineProperties = Object.defineProperties;
      if (!definePropertyWorks || !defined(defineProperties)) {
        defineProperties = function(o) {
          return o;
        };
      }
      return defineProperties;
    });
    define('Core/Ellipsoid', ['./Cartesian3', './Cartographic', './defaultValue', './defined', './defineProperties', './DeveloperError', './freezeObject', './Math', './scaleToGeodeticSurface'], function(Cartesian3, Cartographic, defaultValue, defined, defineProperties, DeveloperError, freezeObject, CesiumMath, scaleToGeodeticSurface) {
      'use strict';
      function initialize(ellipsoid, x, y, z) {
        x = defaultValue(x, 0.0);
        y = defaultValue(y, 0.0);
        z = defaultValue(z, 0.0);
        if (x < 0.0 || y < 0.0 || z < 0.0) {
          throw new DeveloperError('All radii components must be greater than or equal to zero.');
        }
        ellipsoid._radii = new Cartesian3(x, y, z);
        ellipsoid._radiiSquared = new Cartesian3(x * x, y * y, z * z);
        ellipsoid._radiiToTheFourth = new Cartesian3(x * x * x * x, y * y * y * y, z * z * z * z);
        ellipsoid._oneOverRadii = new Cartesian3(x === 0.0 ? 0.0 : 1.0 / x, y === 0.0 ? 0.0 : 1.0 / y, z === 0.0 ? 0.0 : 1.0 / z);
        ellipsoid._oneOverRadiiSquared = new Cartesian3(x === 0.0 ? 0.0 : 1.0 / (x * x), y === 0.0 ? 0.0 : 1.0 / (y * y), z === 0.0 ? 0.0 : 1.0 / (z * z));
        ellipsoid._minimumRadius = Math.min(x, y, z);
        ellipsoid._maximumRadius = Math.max(x, y, z);
        ellipsoid._centerToleranceSquared = CesiumMath.EPSILON1;
      }
      function Ellipsoid(x, y, z) {
        this._radii = undefined;
        this._radiiSquared = undefined;
        this._radiiToTheFourth = undefined;
        this._oneOverRadii = undefined;
        this._oneOverRadiiSquared = undefined;
        this._minimumRadius = undefined;
        this._maximumRadius = undefined;
        this._centerToleranceSquared = undefined;
        initialize(this, x, y, z);
      }
      defineProperties(Ellipsoid.prototype, {
        radii: {get: function() {
            return this._radii;
          }},
        radiiSquared: {get: function() {
            return this._radiiSquared;
          }},
        radiiToTheFourth: {get: function() {
            return this._radiiToTheFourth;
          }},
        oneOverRadii: {get: function() {
            return this._oneOverRadii;
          }},
        oneOverRadiiSquared: {get: function() {
            return this._oneOverRadiiSquared;
          }},
        minimumRadius: {get: function() {
            return this._minimumRadius;
          }},
        maximumRadius: {get: function() {
            return this._maximumRadius;
          }}
      });
      Ellipsoid.clone = function(ellipsoid, result) {
        if (!defined(ellipsoid)) {
          return undefined;
        }
        var radii = ellipsoid._radii;
        if (!defined(result)) {
          return new Ellipsoid(radii.x, radii.y, radii.z);
        }
        Cartesian3.clone(radii, result._radii);
        Cartesian3.clone(ellipsoid._radiiSquared, result._radiiSquared);
        Cartesian3.clone(ellipsoid._radiiToTheFourth, result._radiiToTheFourth);
        Cartesian3.clone(ellipsoid._oneOverRadii, result._oneOverRadii);
        Cartesian3.clone(ellipsoid._oneOverRadiiSquared, result._oneOverRadiiSquared);
        result._minimumRadius = ellipsoid._minimumRadius;
        result._maximumRadius = ellipsoid._maximumRadius;
        result._centerToleranceSquared = ellipsoid._centerToleranceSquared;
        return result;
      };
      Ellipsoid.fromCartesian3 = function(cartesian, result) {
        if (!defined(result)) {
          result = new Ellipsoid();
        }
        if (!defined(cartesian)) {
          return result;
        }
        initialize(result, cartesian.x, cartesian.y, cartesian.z);
        return result;
      };
      Ellipsoid.WGS84 = freezeObject(new Ellipsoid(6378137.0, 6378137.0, 6356752.3142451793));
      Ellipsoid.UNIT_SPHERE = freezeObject(new Ellipsoid(1.0, 1.0, 1.0));
      Ellipsoid.MOON = freezeObject(new Ellipsoid(CesiumMath.LUNAR_RADIUS, CesiumMath.LUNAR_RADIUS, CesiumMath.LUNAR_RADIUS));
      Ellipsoid.prototype.clone = function(result) {
        return Ellipsoid.clone(this, result);
      };
      Ellipsoid.packedLength = Cartesian3.packedLength;
      Ellipsoid.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        Cartesian3.pack(value._radii, array, startingIndex);
      };
      Ellipsoid.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        var radii = Cartesian3.unpack(array, startingIndex);
        return Ellipsoid.fromCartesian3(radii, result);
      };
      Ellipsoid.prototype.geocentricSurfaceNormal = Cartesian3.normalize;
      Ellipsoid.prototype.geodeticSurfaceNormalCartographic = function(cartographic, result) {
        if (!defined(cartographic)) {
          throw new DeveloperError('cartographic is required.');
        }
        var longitude = cartographic.longitude;
        var latitude = cartographic.latitude;
        var cosLatitude = Math.cos(latitude);
        var x = cosLatitude * Math.cos(longitude);
        var y = cosLatitude * Math.sin(longitude);
        var z = Math.sin(latitude);
        if (!defined(result)) {
          result = new Cartesian3();
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return Cartesian3.normalize(result, result);
      };
      Ellipsoid.prototype.geodeticSurfaceNormal = function(cartesian, result) {
        if (!defined(result)) {
          result = new Cartesian3();
        }
        result = Cartesian3.multiplyComponents(cartesian, this._oneOverRadiiSquared, result);
        return Cartesian3.normalize(result, result);
      };
      var cartographicToCartesianNormal = new Cartesian3();
      var cartographicToCartesianK = new Cartesian3();
      Ellipsoid.prototype.cartographicToCartesian = function(cartographic, result) {
        var n = cartographicToCartesianNormal;
        var k = cartographicToCartesianK;
        this.geodeticSurfaceNormalCartographic(cartographic, n);
        Cartesian3.multiplyComponents(this._radiiSquared, n, k);
        var gamma = Math.sqrt(Cartesian3.dot(n, k));
        Cartesian3.divideByScalar(k, gamma, k);
        Cartesian3.multiplyByScalar(n, cartographic.height, n);
        if (!defined(result)) {
          result = new Cartesian3();
        }
        return Cartesian3.add(k, n, result);
      };
      Ellipsoid.prototype.cartographicArrayToCartesianArray = function(cartographics, result) {
        if (!defined(cartographics)) {
          throw new DeveloperError('cartographics is required.');
        }
        var length = cartographics.length;
        if (!defined(result)) {
          result = new Array(length);
        } else {
          result.length = length;
        }
        for (var i = 0; i < length; i++) {
          result[i] = this.cartographicToCartesian(cartographics[i], result[i]);
        }
        return result;
      };
      var cartesianToCartographicN = new Cartesian3();
      var cartesianToCartographicP = new Cartesian3();
      var cartesianToCartographicH = new Cartesian3();
      Ellipsoid.prototype.cartesianToCartographic = function(cartesian, result) {
        var p = this.scaleToGeodeticSurface(cartesian, cartesianToCartographicP);
        if (!defined(p)) {
          return undefined;
        }
        var n = this.geodeticSurfaceNormal(p, cartesianToCartographicN);
        var h = Cartesian3.subtract(cartesian, p, cartesianToCartographicH);
        var longitude = Math.atan2(n.y, n.x);
        var latitude = Math.asin(n.z);
        var height = CesiumMath.sign(Cartesian3.dot(h, cartesian)) * Cartesian3.magnitude(h);
        if (!defined(result)) {
          return new Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
      };
      Ellipsoid.prototype.cartesianArrayToCartographicArray = function(cartesians, result) {
        if (!defined(cartesians)) {
          throw new DeveloperError('cartesians is required.');
        }
        var length = cartesians.length;
        if (!defined(result)) {
          result = new Array(length);
        } else {
          result.length = length;
        }
        for (var i = 0; i < length; ++i) {
          result[i] = this.cartesianToCartographic(cartesians[i], result[i]);
        }
        return result;
      };
      Ellipsoid.prototype.scaleToGeodeticSurface = function(cartesian, result) {
        return scaleToGeodeticSurface(cartesian, this._oneOverRadii, this._oneOverRadiiSquared, this._centerToleranceSquared, result);
      };
      Ellipsoid.prototype.scaleToGeocentricSurface = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        if (!defined(result)) {
          result = new Cartesian3();
        }
        var positionX = cartesian.x;
        var positionY = cartesian.y;
        var positionZ = cartesian.z;
        var oneOverRadiiSquared = this._oneOverRadiiSquared;
        var beta = 1.0 / Math.sqrt((positionX * positionX) * oneOverRadiiSquared.x + (positionY * positionY) * oneOverRadiiSquared.y + (positionZ * positionZ) * oneOverRadiiSquared.z);
        return Cartesian3.multiplyByScalar(cartesian, beta, result);
      };
      Ellipsoid.prototype.transformPositionToScaledSpace = function(position, result) {
        if (!defined(result)) {
          result = new Cartesian3();
        }
        return Cartesian3.multiplyComponents(position, this._oneOverRadii, result);
      };
      Ellipsoid.prototype.transformPositionFromScaledSpace = function(position, result) {
        if (!defined(result)) {
          result = new Cartesian3();
        }
        return Cartesian3.multiplyComponents(position, this._radii, result);
      };
      Ellipsoid.prototype.equals = function(right) {
        return (this === right) || (defined(right) && Cartesian3.equals(this._radii, right._radii));
      };
      Ellipsoid.prototype.toString = function() {
        return this._radii.toString();
      };
      return Ellipsoid;
    });
    define('Core/GeographicProjection', ['./Cartesian3', './Cartographic', './defaultValue', './defined', './defineProperties', './DeveloperError', './Ellipsoid'], function(Cartesian3, Cartographic, defaultValue, defined, defineProperties, DeveloperError, Ellipsoid) {
      'use strict';
      function GeographicProjection(ellipsoid) {
        this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        this._semimajorAxis = this._ellipsoid.maximumRadius;
        this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
      }
      defineProperties(GeographicProjection.prototype, {ellipsoid: {get: function() {
            return this._ellipsoid;
          }}});
      GeographicProjection.prototype.project = function(cartographic, result) {
        var semimajorAxis = this._semimajorAxis;
        var x = cartographic.longitude * semimajorAxis;
        var y = cartographic.latitude * semimajorAxis;
        var z = cartographic.height;
        if (!defined(result)) {
          return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      GeographicProjection.prototype.unproject = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        var oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
        var longitude = cartesian.x * oneOverEarthSemimajorAxis;
        var latitude = cartesian.y * oneOverEarthSemimajorAxis;
        var height = cartesian.z;
        if (!defined(result)) {
          return new Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
      };
      return GeographicProjection;
    });
    define('Core/Intersect', ['./freezeObject'], function(freezeObject) {
      'use strict';
      var Intersect = {
        OUTSIDE: -1,
        INTERSECTING: 0,
        INSIDE: 1
      };
      return freezeObject(Intersect);
    });
    define('Core/Interval', ['./defaultValue'], function(defaultValue) {
      'use strict';
      function Interval(start, stop) {
        this.start = defaultValue(start, 0.0);
        this.stop = defaultValue(stop, 0.0);
      }
      return Interval;
    });
    define('Core/Matrix3', ['./Cartesian3', './defaultValue', './defined', './defineProperties', './DeveloperError', './freezeObject', './Math'], function(Cartesian3, defaultValue, defined, defineProperties, DeveloperError, freezeObject, CesiumMath) {
      'use strict';
      function Matrix3(column0Row0, column1Row0, column2Row0, column0Row1, column1Row1, column2Row1, column0Row2, column1Row2, column2Row2) {
        this[0] = defaultValue(column0Row0, 0.0);
        this[1] = defaultValue(column0Row1, 0.0);
        this[2] = defaultValue(column0Row2, 0.0);
        this[3] = defaultValue(column1Row0, 0.0);
        this[4] = defaultValue(column1Row1, 0.0);
        this[5] = defaultValue(column1Row2, 0.0);
        this[6] = defaultValue(column2Row0, 0.0);
        this[7] = defaultValue(column2Row1, 0.0);
        this[8] = defaultValue(column2Row2, 0.0);
      }
      Matrix3.packedLength = 9;
      Matrix3.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value[0];
        array[startingIndex++] = value[1];
        array[startingIndex++] = value[2];
        array[startingIndex++] = value[3];
        array[startingIndex++] = value[4];
        array[startingIndex++] = value[5];
        array[startingIndex++] = value[6];
        array[startingIndex++] = value[7];
        array[startingIndex++] = value[8];
      };
      Matrix3.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Matrix3();
        }
        result[0] = array[startingIndex++];
        result[1] = array[startingIndex++];
        result[2] = array[startingIndex++];
        result[3] = array[startingIndex++];
        result[4] = array[startingIndex++];
        result[5] = array[startingIndex++];
        result[6] = array[startingIndex++];
        result[7] = array[startingIndex++];
        result[8] = array[startingIndex++];
        return result;
      };
      Matrix3.clone = function(values, result) {
        if (!defined(values)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Matrix3(values[0], values[3], values[6], values[1], values[4], values[7], values[2], values[5], values[8]);
        }
        result[0] = values[0];
        result[1] = values[1];
        result[2] = values[2];
        result[3] = values[3];
        result[4] = values[4];
        result[5] = values[5];
        result[6] = values[6];
        result[7] = values[7];
        result[8] = values[8];
        return result;
      };
      Matrix3.fromArray = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Matrix3();
        }
        result[0] = array[startingIndex];
        result[1] = array[startingIndex + 1];
        result[2] = array[startingIndex + 2];
        result[3] = array[startingIndex + 3];
        result[4] = array[startingIndex + 4];
        result[5] = array[startingIndex + 5];
        result[6] = array[startingIndex + 6];
        result[7] = array[startingIndex + 7];
        result[8] = array[startingIndex + 8];
        return result;
      };
      Matrix3.fromColumnMajorArray = function(values, result) {
        if (!defined(values)) {
          throw new DeveloperError('values parameter is required');
        }
        return Matrix3.clone(values, result);
      };
      Matrix3.fromRowMajorArray = function(values, result) {
        if (!defined(values)) {
          throw new DeveloperError('values is required.');
        }
        if (!defined(result)) {
          return new Matrix3(values[0], values[1], values[2], values[3], values[4], values[5], values[6], values[7], values[8]);
        }
        result[0] = values[0];
        result[1] = values[3];
        result[2] = values[6];
        result[3] = values[1];
        result[4] = values[4];
        result[5] = values[7];
        result[6] = values[2];
        result[7] = values[5];
        result[8] = values[8];
        return result;
      };
      Matrix3.fromQuaternion = function(quaternion, result) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required');
        }
        var x2 = quaternion.x * quaternion.x;
        var xy = quaternion.x * quaternion.y;
        var xz = quaternion.x * quaternion.z;
        var xw = quaternion.x * quaternion.w;
        var y2 = quaternion.y * quaternion.y;
        var yz = quaternion.y * quaternion.z;
        var yw = quaternion.y * quaternion.w;
        var z2 = quaternion.z * quaternion.z;
        var zw = quaternion.z * quaternion.w;
        var w2 = quaternion.w * quaternion.w;
        var m00 = x2 - y2 - z2 + w2;
        var m01 = 2.0 * (xy - zw);
        var m02 = 2.0 * (xz + yw);
        var m10 = 2.0 * (xy + zw);
        var m11 = -x2 + y2 - z2 + w2;
        var m12 = 2.0 * (yz - xw);
        var m20 = 2.0 * (xz - yw);
        var m21 = 2.0 * (yz + xw);
        var m22 = -x2 - y2 + z2 + w2;
        if (!defined(result)) {
          return new Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
        }
        result[0] = m00;
        result[1] = m10;
        result[2] = m20;
        result[3] = m01;
        result[4] = m11;
        result[5] = m21;
        result[6] = m02;
        result[7] = m12;
        result[8] = m22;
        return result;
      };
      Matrix3.fromScale = function(scale, result) {
        if (!defined(scale)) {
          throw new DeveloperError('scale is required.');
        }
        if (!defined(result)) {
          return new Matrix3(scale.x, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, scale.z);
        }
        result[0] = scale.x;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = scale.y;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = scale.z;
        return result;
      };
      Matrix3.fromUniformScale = function(scale, result) {
        if (typeof scale !== 'number') {
          throw new DeveloperError('scale is required.');
        }
        if (!defined(result)) {
          return new Matrix3(scale, 0.0, 0.0, 0.0, scale, 0.0, 0.0, 0.0, scale);
        }
        result[0] = scale;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = scale;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = scale;
        return result;
      };
      Matrix3.fromCrossProduct = function(vector, result) {
        if (!defined(vector)) {
          throw new DeveloperError('vector is required.');
        }
        if (!defined(result)) {
          return new Matrix3(0.0, -vector.z, vector.y, vector.z, 0.0, -vector.x, -vector.y, vector.x, 0.0);
        }
        result[0] = 0.0;
        result[1] = vector.z;
        result[2] = -vector.y;
        result[3] = -vector.z;
        result[4] = 0.0;
        result[5] = vector.x;
        result[6] = vector.y;
        result[7] = -vector.x;
        result[8] = 0.0;
        return result;
      };
      Matrix3.fromRotationX = function(angle, result) {
        if (!defined(angle)) {
          throw new DeveloperError('angle is required.');
        }
        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);
        if (!defined(result)) {
          return new Matrix3(1.0, 0.0, 0.0, 0.0, cosAngle, -sinAngle, 0.0, sinAngle, cosAngle);
        }
        result[0] = 1.0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = cosAngle;
        result[5] = sinAngle;
        result[6] = 0.0;
        result[7] = -sinAngle;
        result[8] = cosAngle;
        return result;
      };
      Matrix3.fromRotationY = function(angle, result) {
        if (!defined(angle)) {
          throw new DeveloperError('angle is required.');
        }
        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);
        if (!defined(result)) {
          return new Matrix3(cosAngle, 0.0, sinAngle, 0.0, 1.0, 0.0, -sinAngle, 0.0, cosAngle);
        }
        result[0] = cosAngle;
        result[1] = 0.0;
        result[2] = -sinAngle;
        result[3] = 0.0;
        result[4] = 1.0;
        result[5] = 0.0;
        result[6] = sinAngle;
        result[7] = 0.0;
        result[8] = cosAngle;
        return result;
      };
      Matrix3.fromRotationZ = function(angle, result) {
        if (!defined(angle)) {
          throw new DeveloperError('angle is required.');
        }
        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);
        if (!defined(result)) {
          return new Matrix3(cosAngle, -sinAngle, 0.0, sinAngle, cosAngle, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = cosAngle;
        result[1] = sinAngle;
        result[2] = 0.0;
        result[3] = -sinAngle;
        result[4] = cosAngle;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 1.0;
        return result;
      };
      Matrix3.toArray = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          return [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6], matrix[7], matrix[8]];
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        return result;
      };
      Matrix3.getElementIndex = function(column, row) {
        if (typeof row !== 'number' || row < 0 || row > 2) {
          throw new DeveloperError('row must be 0, 1, or 2.');
        }
        if (typeof column !== 'number' || column < 0 || column > 2) {
          throw new DeveloperError('column must be 0, 1, or 2.');
        }
        return column * 3 + row;
      };
      Matrix3.getColumn = function(matrix, index, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required.');
        }
        if (typeof index !== 'number' || index < 0 || index > 2) {
          throw new DeveloperError('index must be 0, 1, or 2.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var startIndex = index * 3;
        var x = matrix[startIndex];
        var y = matrix[startIndex + 1];
        var z = matrix[startIndex + 2];
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      Matrix3.setColumn = function(matrix, index, cartesian, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 2) {
          throw new DeveloperError('index must be 0, 1, or 2.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result = Matrix3.clone(matrix, result);
        var startIndex = index * 3;
        result[startIndex] = cartesian.x;
        result[startIndex + 1] = cartesian.y;
        result[startIndex + 2] = cartesian.z;
        return result;
      };
      Matrix3.getRow = function(matrix, index, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required.');
        }
        if (typeof index !== 'number' || index < 0 || index > 2) {
          throw new DeveloperError('index must be 0, 1, or 2.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var x = matrix[index];
        var y = matrix[index + 3];
        var z = matrix[index + 6];
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      Matrix3.setRow = function(matrix, index, cartesian, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 2) {
          throw new DeveloperError('index must be 0, 1, or 2.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result = Matrix3.clone(matrix, result);
        result[index] = cartesian.x;
        result[index + 3] = cartesian.y;
        result[index + 6] = cartesian.z;
        return result;
      };
      var scratchColumn = new Cartesian3();
      Matrix3.getScale = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = Cartesian3.magnitude(Cartesian3.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn));
        result.y = Cartesian3.magnitude(Cartesian3.fromElements(matrix[3], matrix[4], matrix[5], scratchColumn));
        result.z = Cartesian3.magnitude(Cartesian3.fromElements(matrix[6], matrix[7], matrix[8], scratchColumn));
        return result;
      };
      var scratchScale = new Cartesian3();
      Matrix3.getMaximumScale = function(matrix) {
        Matrix3.getScale(matrix, scratchScale);
        return Cartesian3.maximumComponent(scratchScale);
      };
      Matrix3.multiply = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var column0Row0 = left[0] * right[0] + left[3] * right[1] + left[6] * right[2];
        var column0Row1 = left[1] * right[0] + left[4] * right[1] + left[7] * right[2];
        var column0Row2 = left[2] * right[0] + left[5] * right[1] + left[8] * right[2];
        var column1Row0 = left[0] * right[3] + left[3] * right[4] + left[6] * right[5];
        var column1Row1 = left[1] * right[3] + left[4] * right[4] + left[7] * right[5];
        var column1Row2 = left[2] * right[3] + left[5] * right[4] + left[8] * right[5];
        var column2Row0 = left[0] * right[6] + left[3] * right[7] + left[6] * right[8];
        var column2Row1 = left[1] * right[6] + left[4] * right[7] + left[7] * right[8];
        var column2Row2 = left[2] * right[6] + left[5] * right[7] + left[8] * right[8];
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = column1Row0;
        result[4] = column1Row1;
        result[5] = column1Row2;
        result[6] = column2Row0;
        result[7] = column2Row1;
        result[8] = column2Row2;
        return result;
      };
      Matrix3.add = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = left[0] + right[0];
        result[1] = left[1] + right[1];
        result[2] = left[2] + right[2];
        result[3] = left[3] + right[3];
        result[4] = left[4] + right[4];
        result[5] = left[5] + right[5];
        result[6] = left[6] + right[6];
        result[7] = left[7] + right[7];
        result[8] = left[8] + right[8];
        return result;
      };
      Matrix3.subtract = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = left[0] - right[0];
        result[1] = left[1] - right[1];
        result[2] = left[2] - right[2];
        result[3] = left[3] - right[3];
        result[4] = left[4] - right[4];
        result[5] = left[5] - right[5];
        result[6] = left[6] - right[6];
        result[7] = left[7] - right[7];
        result[8] = left[8] - right[8];
        return result;
      };
      Matrix3.multiplyByVector = function(matrix, cartesian, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var vX = cartesian.x;
        var vY = cartesian.y;
        var vZ = cartesian.z;
        var x = matrix[0] * vX + matrix[3] * vY + matrix[6] * vZ;
        var y = matrix[1] * vX + matrix[4] * vY + matrix[7] * vZ;
        var z = matrix[2] * vX + matrix[5] * vY + matrix[8] * vZ;
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      Matrix3.multiplyByScalar = function(matrix, scalar, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar must be a number');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = matrix[0] * scalar;
        result[1] = matrix[1] * scalar;
        result[2] = matrix[2] * scalar;
        result[3] = matrix[3] * scalar;
        result[4] = matrix[4] * scalar;
        result[5] = matrix[5] * scalar;
        result[6] = matrix[6] * scalar;
        result[7] = matrix[7] * scalar;
        result[8] = matrix[8] * scalar;
        return result;
      };
      Matrix3.multiplyByScale = function(matrix, scale, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(scale)) {
          throw new DeveloperError('scale is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = matrix[0] * scale.x;
        result[1] = matrix[1] * scale.x;
        result[2] = matrix[2] * scale.x;
        result[3] = matrix[3] * scale.y;
        result[4] = matrix[4] * scale.y;
        result[5] = matrix[5] * scale.y;
        result[6] = matrix[6] * scale.z;
        result[7] = matrix[7] * scale.z;
        result[8] = matrix[8] * scale.z;
        return result;
      };
      Matrix3.negate = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = -matrix[0];
        result[1] = -matrix[1];
        result[2] = -matrix[2];
        result[3] = -matrix[3];
        result[4] = -matrix[4];
        result[5] = -matrix[5];
        result[6] = -matrix[6];
        result[7] = -matrix[7];
        result[8] = -matrix[8];
        return result;
      };
      Matrix3.transpose = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var column0Row0 = matrix[0];
        var column0Row1 = matrix[3];
        var column0Row2 = matrix[6];
        var column1Row0 = matrix[1];
        var column1Row1 = matrix[4];
        var column1Row2 = matrix[7];
        var column2Row0 = matrix[2];
        var column2Row1 = matrix[5];
        var column2Row2 = matrix[8];
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = column1Row0;
        result[4] = column1Row1;
        result[5] = column1Row2;
        result[6] = column2Row0;
        result[7] = column2Row1;
        result[8] = column2Row2;
        return result;
      };
      function computeFrobeniusNorm(matrix) {
        var norm = 0.0;
        for (var i = 0; i < 9; ++i) {
          var temp = matrix[i];
          norm += temp * temp;
        }
        return Math.sqrt(norm);
      }
      var rowVal = [1, 0, 0];
      var colVal = [2, 2, 1];
      function offDiagonalFrobeniusNorm(matrix) {
        var norm = 0.0;
        for (var i = 0; i < 3; ++i) {
          var temp = matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])];
          norm += 2.0 * temp * temp;
        }
        return Math.sqrt(norm);
      }
      function shurDecomposition(matrix, result) {
        var tolerance = CesiumMath.EPSILON15;
        var maxDiagonal = 0.0;
        var rotAxis = 1;
        for (var i = 0; i < 3; ++i) {
          var temp = Math.abs(matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])]);
          if (temp > maxDiagonal) {
            rotAxis = i;
            maxDiagonal = temp;
          }
        }
        var c = 1.0;
        var s = 0.0;
        var p = rowVal[rotAxis];
        var q = colVal[rotAxis];
        if (Math.abs(matrix[Matrix3.getElementIndex(q, p)]) > tolerance) {
          var qq = matrix[Matrix3.getElementIndex(q, q)];
          var pp = matrix[Matrix3.getElementIndex(p, p)];
          var qp = matrix[Matrix3.getElementIndex(q, p)];
          var tau = (qq - pp) / 2.0 / qp;
          var t;
          if (tau < 0.0) {
            t = -1.0 / (-tau + Math.sqrt(1.0 + tau * tau));
          } else {
            t = 1.0 / (tau + Math.sqrt(1.0 + tau * tau));
          }
          c = 1.0 / Math.sqrt(1.0 + t * t);
          s = t * c;
        }
        result = Matrix3.clone(Matrix3.IDENTITY, result);
        result[Matrix3.getElementIndex(p, p)] = result[Matrix3.getElementIndex(q, q)] = c;
        result[Matrix3.getElementIndex(q, p)] = s;
        result[Matrix3.getElementIndex(p, q)] = -s;
        return result;
      }
      var jMatrix = new Matrix3();
      var jMatrixTranspose = new Matrix3();
      Matrix3.computeEigenDecomposition = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required.');
        }
        var tolerance = CesiumMath.EPSILON20;
        var maxSweeps = 10;
        var count = 0;
        var sweep = 0;
        if (!defined(result)) {
          result = {};
        }
        var unitaryMatrix = result.unitary = Matrix3.clone(Matrix3.IDENTITY, result.unitary);
        var diagMatrix = result.diagonal = Matrix3.clone(matrix, result.diagonal);
        var epsilon = tolerance * computeFrobeniusNorm(diagMatrix);
        while (sweep < maxSweeps && offDiagonalFrobeniusNorm(diagMatrix) > epsilon) {
          shurDecomposition(diagMatrix, jMatrix);
          Matrix3.transpose(jMatrix, jMatrixTranspose);
          Matrix3.multiply(diagMatrix, jMatrix, diagMatrix);
          Matrix3.multiply(jMatrixTranspose, diagMatrix, diagMatrix);
          Matrix3.multiply(unitaryMatrix, jMatrix, unitaryMatrix);
          if (++count > 2) {
            ++sweep;
            count = 0;
          }
        }
        return result;
      };
      Matrix3.abs = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = Math.abs(matrix[0]);
        result[1] = Math.abs(matrix[1]);
        result[2] = Math.abs(matrix[2]);
        result[3] = Math.abs(matrix[3]);
        result[4] = Math.abs(matrix[4]);
        result[5] = Math.abs(matrix[5]);
        result[6] = Math.abs(matrix[6]);
        result[7] = Math.abs(matrix[7]);
        result[8] = Math.abs(matrix[8]);
        return result;
      };
      Matrix3.determinant = function(matrix) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        var m11 = matrix[0];
        var m21 = matrix[3];
        var m31 = matrix[6];
        var m12 = matrix[1];
        var m22 = matrix[4];
        var m32 = matrix[7];
        var m13 = matrix[2];
        var m23 = matrix[5];
        var m33 = matrix[8];
        return m11 * (m22 * m33 - m23 * m32) + m12 * (m23 * m31 - m21 * m33) + m13 * (m21 * m32 - m22 * m31);
      };
      Matrix3.inverse = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var m11 = matrix[0];
        var m21 = matrix[1];
        var m31 = matrix[2];
        var m12 = matrix[3];
        var m22 = matrix[4];
        var m32 = matrix[5];
        var m13 = matrix[6];
        var m23 = matrix[7];
        var m33 = matrix[8];
        var determinant = Matrix3.determinant(matrix);
        if (Math.abs(determinant) <= CesiumMath.EPSILON15) {
          throw new DeveloperError('matrix is not invertible');
        }
        result[0] = m22 * m33 - m23 * m32;
        result[1] = m23 * m31 - m21 * m33;
        result[2] = m21 * m32 - m22 * m31;
        result[3] = m13 * m32 - m12 * m33;
        result[4] = m11 * m33 - m13 * m31;
        result[5] = m12 * m31 - m11 * m32;
        result[6] = m12 * m23 - m13 * m22;
        result[7] = m13 * m21 - m11 * m23;
        result[8] = m11 * m22 - m12 * m21;
        var scale = 1.0 / determinant;
        return Matrix3.multiplyByScalar(result, scale, result);
      };
      Matrix3.equals = function(left, right) {
        return (left === right) || (defined(left) && defined(right) && left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[3] === right[3] && left[4] === right[4] && left[5] === right[5] && left[6] === right[6] && left[7] === right[7] && left[8] === right[8]);
      };
      Matrix3.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
          throw new DeveloperError('epsilon must be a number');
        }
        return (left === right) || (defined(left) && defined(right) && Math.abs(left[0] - right[0]) <= epsilon && Math.abs(left[1] - right[1]) <= epsilon && Math.abs(left[2] - right[2]) <= epsilon && Math.abs(left[3] - right[3]) <= epsilon && Math.abs(left[4] - right[4]) <= epsilon && Math.abs(left[5] - right[5]) <= epsilon && Math.abs(left[6] - right[6]) <= epsilon && Math.abs(left[7] - right[7]) <= epsilon && Math.abs(left[8] - right[8]) <= epsilon);
      };
      Matrix3.IDENTITY = freezeObject(new Matrix3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0));
      Matrix3.ZERO = freezeObject(new Matrix3(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0));
      Matrix3.COLUMN0ROW0 = 0;
      Matrix3.COLUMN0ROW1 = 1;
      Matrix3.COLUMN0ROW2 = 2;
      Matrix3.COLUMN1ROW0 = 3;
      Matrix3.COLUMN1ROW1 = 4;
      Matrix3.COLUMN1ROW2 = 5;
      Matrix3.COLUMN2ROW0 = 6;
      Matrix3.COLUMN2ROW1 = 7;
      Matrix3.COLUMN2ROW2 = 8;
      defineProperties(Matrix3.prototype, {length: {get: function() {
            return Matrix3.packedLength;
          }}});
      Matrix3.prototype.clone = function(result) {
        return Matrix3.clone(this, result);
      };
      Matrix3.prototype.equals = function(right) {
        return Matrix3.equals(this, right);
      };
      Matrix3.equalsArray = function(matrix, array, offset) {
        return matrix[0] === array[offset] && matrix[1] === array[offset + 1] && matrix[2] === array[offset + 2] && matrix[3] === array[offset + 3] && matrix[4] === array[offset + 4] && matrix[5] === array[offset + 5] && matrix[6] === array[offset + 6] && matrix[7] === array[offset + 7] && matrix[8] === array[offset + 8];
      };
      Matrix3.prototype.equalsEpsilon = function(right, epsilon) {
        return Matrix3.equalsEpsilon(this, right, epsilon);
      };
      Matrix3.prototype.toString = function() {
        return '(' + this[0] + ', ' + this[3] + ', ' + this[6] + ')\n' + '(' + this[1] + ', ' + this[4] + ', ' + this[7] + ')\n' + '(' + this[2] + ', ' + this[5] + ', ' + this[8] + ')';
      };
      return Matrix3;
    });
    define('Core/Cartesian4', ['./defaultValue', './defined', './DeveloperError', './freezeObject', './Math'], function(defaultValue, defined, DeveloperError, freezeObject, CesiumMath) {
      'use strict';
      function Cartesian4(x, y, z, w) {
        this.x = defaultValue(x, 0.0);
        this.y = defaultValue(y, 0.0);
        this.z = defaultValue(z, 0.0);
        this.w = defaultValue(w, 0.0);
      }
      Cartesian4.fromElements = function(x, y, z, w, result) {
        if (!defined(result)) {
          return new Cartesian4(x, y, z, w);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
      };
      Cartesian4.fromColor = function(color, result) {
        if (!defined(color)) {
          throw new DeveloperError('color is required');
        }
        if (!defined(result)) {
          return new Cartesian4(color.red, color.green, color.blue, color.alpha);
        }
        result.x = color.red;
        result.y = color.green;
        result.z = color.blue;
        result.w = color.alpha;
        return result;
      };
      Cartesian4.clone = function(cartesian, result) {
        if (!defined(cartesian)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Cartesian4(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
        }
        result.x = cartesian.x;
        result.y = cartesian.y;
        result.z = cartesian.z;
        result.w = cartesian.w;
        return result;
      };
      Cartesian4.packedLength = 4;
      Cartesian4.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value.x;
        array[startingIndex++] = value.y;
        array[startingIndex++] = value.z;
        array[startingIndex] = value.w;
      };
      Cartesian4.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Cartesian4();
        }
        result.x = array[startingIndex++];
        result.y = array[startingIndex++];
        result.z = array[startingIndex++];
        result.w = array[startingIndex];
        return result;
      };
      Cartesian4.fromArray = Cartesian4.unpack;
      Cartesian4.maximumComponent = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return Math.max(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
      };
      Cartesian4.minimumComponent = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return Math.min(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
      };
      Cartesian4.minimumByComponent = function(first, second, result) {
        if (!defined(first)) {
          throw new DeveloperError('first is required.');
        }
        if (!defined(second)) {
          throw new DeveloperError('second is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        result.x = Math.min(first.x, second.x);
        result.y = Math.min(first.y, second.y);
        result.z = Math.min(first.z, second.z);
        result.w = Math.min(first.w, second.w);
        return result;
      };
      Cartesian4.maximumByComponent = function(first, second, result) {
        if (!defined(first)) {
          throw new DeveloperError('first is required.');
        }
        if (!defined(second)) {
          throw new DeveloperError('second is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        result.x = Math.max(first.x, second.x);
        result.y = Math.max(first.y, second.y);
        result.z = Math.max(first.z, second.z);
        result.w = Math.max(first.w, second.w);
        return result;
      };
      Cartesian4.magnitudeSquared = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z + cartesian.w * cartesian.w;
      };
      Cartesian4.magnitude = function(cartesian) {
        return Math.sqrt(Cartesian4.magnitudeSquared(cartesian));
      };
      var distanceScratch = new Cartesian4();
      Cartesian4.distance = function(left, right) {
        if (!defined(left) || !defined(right)) {
          throw new DeveloperError('left and right are required.');
        }
        Cartesian4.subtract(left, right, distanceScratch);
        return Cartesian4.magnitude(distanceScratch);
      };
      Cartesian4.distanceSquared = function(left, right) {
        if (!defined(left) || !defined(right)) {
          throw new DeveloperError('left and right are required.');
        }
        Cartesian4.subtract(left, right, distanceScratch);
        return Cartesian4.magnitudeSquared(distanceScratch);
      };
      Cartesian4.normalize = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var magnitude = Cartesian4.magnitude(cartesian);
        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;
        result.z = cartesian.z / magnitude;
        result.w = cartesian.w / magnitude;
        return result;
      };
      Cartesian4.dot = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        return left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
      };
      Cartesian4.multiplyComponents = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x * right.x;
        result.y = left.y * right.y;
        result.z = left.z * right.z;
        result.w = left.w * right.w;
        return result;
      };
      Cartesian4.add = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        result.w = left.w + right.w;
        return result;
      };
      Cartesian4.subtract = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        result.w = left.w - right.w;
        return result;
      };
      Cartesian4.multiplyByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = cartesian.x * scalar;
        result.y = cartesian.y * scalar;
        result.z = cartesian.z * scalar;
        result.w = cartesian.w * scalar;
        return result;
      };
      Cartesian4.divideByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = cartesian.x / scalar;
        result.y = cartesian.y / scalar;
        result.z = cartesian.z / scalar;
        result.w = cartesian.w / scalar;
        return result;
      };
      Cartesian4.negate = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = -cartesian.x;
        result.y = -cartesian.y;
        result.z = -cartesian.z;
        result.w = -cartesian.w;
        return result;
      };
      Cartesian4.abs = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = Math.abs(cartesian.x);
        result.y = Math.abs(cartesian.y);
        result.z = Math.abs(cartesian.z);
        result.w = Math.abs(cartesian.w);
        return result;
      };
      var lerpScratch = new Cartesian4();
      Cartesian4.lerp = function(start, end, t, result) {
        if (!defined(start)) {
          throw new DeveloperError('start is required.');
        }
        if (!defined(end)) {
          throw new DeveloperError('end is required.');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        Cartesian4.multiplyByScalar(end, t, lerpScratch);
        result = Cartesian4.multiplyByScalar(start, 1.0 - t, result);
        return Cartesian4.add(lerpScratch, result, result);
      };
      var mostOrthogonalAxisScratch = new Cartesian4();
      Cartesian4.mostOrthogonalAxis = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var f = Cartesian4.normalize(cartesian, mostOrthogonalAxisScratch);
        Cartesian4.abs(f, f);
        if (f.x <= f.y) {
          if (f.x <= f.z) {
            if (f.x <= f.w) {
              result = Cartesian4.clone(Cartesian4.UNIT_X, result);
            } else {
              result = Cartesian4.clone(Cartesian4.UNIT_W, result);
            }
          } else if (f.z <= f.w) {
            result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
          } else {
            result = Cartesian4.clone(Cartesian4.UNIT_W, result);
          }
        } else if (f.y <= f.z) {
          if (f.y <= f.w) {
            result = Cartesian4.clone(Cartesian4.UNIT_Y, result);
          } else {
            result = Cartesian4.clone(Cartesian4.UNIT_W, result);
          }
        } else if (f.z <= f.w) {
          result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
        } else {
          result = Cartesian4.clone(Cartesian4.UNIT_W, result);
        }
        return result;
      };
      Cartesian4.equals = function(left, right) {
        return (left === right) || ((defined(left)) && (defined(right)) && (left.x === right.x) && (left.y === right.y) && (left.z === right.z) && (left.w === right.w));
      };
      Cartesian4.equalsArray = function(cartesian, array, offset) {
        return cartesian.x === array[offset] && cartesian.y === array[offset + 1] && cartesian.z === array[offset + 2] && cartesian.w === array[offset + 3];
      };
      Cartesian4.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
        return (left === right) || (defined(left) && defined(right) && CesiumMath.equalsEpsilon(left.x, right.x, relativeEpsilon, absoluteEpsilon) && CesiumMath.equalsEpsilon(left.y, right.y, relativeEpsilon, absoluteEpsilon) && CesiumMath.equalsEpsilon(left.z, right.z, relativeEpsilon, absoluteEpsilon) && CesiumMath.equalsEpsilon(left.w, right.w, relativeEpsilon, absoluteEpsilon));
      };
      Cartesian4.ZERO = freezeObject(new Cartesian4(0.0, 0.0, 0.0, 0.0));
      Cartesian4.UNIT_X = freezeObject(new Cartesian4(1.0, 0.0, 0.0, 0.0));
      Cartesian4.UNIT_Y = freezeObject(new Cartesian4(0.0, 1.0, 0.0, 0.0));
      Cartesian4.UNIT_Z = freezeObject(new Cartesian4(0.0, 0.0, 1.0, 0.0));
      Cartesian4.UNIT_W = freezeObject(new Cartesian4(0.0, 0.0, 0.0, 1.0));
      Cartesian4.prototype.clone = function(result) {
        return Cartesian4.clone(this, result);
      };
      Cartesian4.prototype.equals = function(right) {
        return Cartesian4.equals(this, right);
      };
      Cartesian4.prototype.equalsEpsilon = function(right, relativeEpsilon, absoluteEpsilon) {
        return Cartesian4.equalsEpsilon(this, right, relativeEpsilon, absoluteEpsilon);
      };
      Cartesian4.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
      };
      return Cartesian4;
    });
    define('Core/RuntimeError', ['./defined'], function(defined) {
      'use strict';
      function RuntimeError(message) {
        this.name = 'RuntimeError';
        this.message = message;
        var stack;
        try {
          throw new Error();
        } catch (e) {
          stack = e.stack;
        }
        this.stack = stack;
      }
      RuntimeError.prototype.toString = function() {
        var str = this.name + ': ' + this.message;
        if (defined(this.stack)) {
          str += '\n' + this.stack.toString();
        }
        return str;
      };
      return RuntimeError;
    });
    define('Core/Matrix4', ['./Cartesian3', './Cartesian4', './defaultValue', './defined', './defineProperties', './DeveloperError', './freezeObject', './Math', './Matrix3', './RuntimeError'], function(Cartesian3, Cartesian4, defaultValue, defined, defineProperties, DeveloperError, freezeObject, CesiumMath, Matrix3, RuntimeError) {
      'use strict';
      function Matrix4(column0Row0, column1Row0, column2Row0, column3Row0, column0Row1, column1Row1, column2Row1, column3Row1, column0Row2, column1Row2, column2Row2, column3Row2, column0Row3, column1Row3, column2Row3, column3Row3) {
        this[0] = defaultValue(column0Row0, 0.0);
        this[1] = defaultValue(column0Row1, 0.0);
        this[2] = defaultValue(column0Row2, 0.0);
        this[3] = defaultValue(column0Row3, 0.0);
        this[4] = defaultValue(column1Row0, 0.0);
        this[5] = defaultValue(column1Row1, 0.0);
        this[6] = defaultValue(column1Row2, 0.0);
        this[7] = defaultValue(column1Row3, 0.0);
        this[8] = defaultValue(column2Row0, 0.0);
        this[9] = defaultValue(column2Row1, 0.0);
        this[10] = defaultValue(column2Row2, 0.0);
        this[11] = defaultValue(column2Row3, 0.0);
        this[12] = defaultValue(column3Row0, 0.0);
        this[13] = defaultValue(column3Row1, 0.0);
        this[14] = defaultValue(column3Row2, 0.0);
        this[15] = defaultValue(column3Row3, 0.0);
      }
      Matrix4.packedLength = 16;
      Matrix4.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value[0];
        array[startingIndex++] = value[1];
        array[startingIndex++] = value[2];
        array[startingIndex++] = value[3];
        array[startingIndex++] = value[4];
        array[startingIndex++] = value[5];
        array[startingIndex++] = value[6];
        array[startingIndex++] = value[7];
        array[startingIndex++] = value[8];
        array[startingIndex++] = value[9];
        array[startingIndex++] = value[10];
        array[startingIndex++] = value[11];
        array[startingIndex++] = value[12];
        array[startingIndex++] = value[13];
        array[startingIndex++] = value[14];
        array[startingIndex] = value[15];
      };
      Matrix4.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Matrix4();
        }
        result[0] = array[startingIndex++];
        result[1] = array[startingIndex++];
        result[2] = array[startingIndex++];
        result[3] = array[startingIndex++];
        result[4] = array[startingIndex++];
        result[5] = array[startingIndex++];
        result[6] = array[startingIndex++];
        result[7] = array[startingIndex++];
        result[8] = array[startingIndex++];
        result[9] = array[startingIndex++];
        result[10] = array[startingIndex++];
        result[11] = array[startingIndex++];
        result[12] = array[startingIndex++];
        result[13] = array[startingIndex++];
        result[14] = array[startingIndex++];
        result[15] = array[startingIndex];
        return result;
      };
      Matrix4.clone = function(matrix, result) {
        if (!defined(matrix)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Matrix4(matrix[0], matrix[4], matrix[8], matrix[12], matrix[1], matrix[5], matrix[9], matrix[13], matrix[2], matrix[6], matrix[10], matrix[14], matrix[3], matrix[7], matrix[11], matrix[15]);
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        result[9] = matrix[9];
        result[10] = matrix[10];
        result[11] = matrix[11];
        result[12] = matrix[12];
        result[13] = matrix[13];
        result[14] = matrix[14];
        result[15] = matrix[15];
        return result;
      };
      Matrix4.fromArray = Matrix4.unpack;
      Matrix4.fromColumnMajorArray = function(values, result) {
        if (!defined(values)) {
          throw new DeveloperError('values is required');
        }
        return Matrix4.clone(values, result);
      };
      Matrix4.fromRowMajorArray = function(values, result) {
        if (!defined(values)) {
          throw new DeveloperError('values is required.');
        }
        if (!defined(result)) {
          return new Matrix4(values[0], values[1], values[2], values[3], values[4], values[5], values[6], values[7], values[8], values[9], values[10], values[11], values[12], values[13], values[14], values[15]);
        }
        result[0] = values[0];
        result[1] = values[4];
        result[2] = values[8];
        result[3] = values[12];
        result[4] = values[1];
        result[5] = values[5];
        result[6] = values[9];
        result[7] = values[13];
        result[8] = values[2];
        result[9] = values[6];
        result[10] = values[10];
        result[11] = values[14];
        result[12] = values[3];
        result[13] = values[7];
        result[14] = values[11];
        result[15] = values[15];
        return result;
      };
      Matrix4.fromRotationTranslation = function(rotation, translation, result) {
        if (!defined(rotation)) {
          throw new DeveloperError('rotation is required.');
        }
        translation = defaultValue(translation, Cartesian3.ZERO);
        if (!defined(result)) {
          return new Matrix4(rotation[0], rotation[3], rotation[6], translation.x, rotation[1], rotation[4], rotation[7], translation.y, rotation[2], rotation[5], rotation[8], translation.z, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = rotation[0];
        result[1] = rotation[1];
        result[2] = rotation[2];
        result[3] = 0.0;
        result[4] = rotation[3];
        result[5] = rotation[4];
        result[6] = rotation[5];
        result[7] = 0.0;
        result[8] = rotation[6];
        result[9] = rotation[7];
        result[10] = rotation[8];
        result[11] = 0.0;
        result[12] = translation.x;
        result[13] = translation.y;
        result[14] = translation.z;
        result[15] = 1.0;
        return result;
      };
      Matrix4.fromTranslationQuaternionRotationScale = function(translation, rotation, scale, result) {
        if (!defined(translation)) {
          throw new DeveloperError('translation is required.');
        }
        if (!defined(rotation)) {
          throw new DeveloperError('rotation is required.');
        }
        if (!defined(scale)) {
          throw new DeveloperError('scale is required.');
        }
        if (!defined(result)) {
          result = new Matrix4();
        }
        var scaleX = scale.x;
        var scaleY = scale.y;
        var scaleZ = scale.z;
        var x2 = rotation.x * rotation.x;
        var xy = rotation.x * rotation.y;
        var xz = rotation.x * rotation.z;
        var xw = rotation.x * rotation.w;
        var y2 = rotation.y * rotation.y;
        var yz = rotation.y * rotation.z;
        var yw = rotation.y * rotation.w;
        var z2 = rotation.z * rotation.z;
        var zw = rotation.z * rotation.w;
        var w2 = rotation.w * rotation.w;
        var m00 = x2 - y2 - z2 + w2;
        var m01 = 2.0 * (xy - zw);
        var m02 = 2.0 * (xz + yw);
        var m10 = 2.0 * (xy + zw);
        var m11 = -x2 + y2 - z2 + w2;
        var m12 = 2.0 * (yz - xw);
        var m20 = 2.0 * (xz - yw);
        var m21 = 2.0 * (yz + xw);
        var m22 = -x2 - y2 + z2 + w2;
        result[0] = m00 * scaleX;
        result[1] = m10 * scaleX;
        result[2] = m20 * scaleX;
        result[3] = 0.0;
        result[4] = m01 * scaleY;
        result[5] = m11 * scaleY;
        result[6] = m21 * scaleY;
        result[7] = 0.0;
        result[8] = m02 * scaleZ;
        result[9] = m12 * scaleZ;
        result[10] = m22 * scaleZ;
        result[11] = 0.0;
        result[12] = translation.x;
        result[13] = translation.y;
        result[14] = translation.z;
        result[15] = 1.0;
        return result;
      };
      Matrix4.fromTranslationRotationScale = function(translationRotationScale, result) {
        if (!defined(translationRotationScale)) {
          throw new DeveloperError('translationRotationScale is required.');
        }
        return Matrix4.fromTranslationQuaternionRotationScale(translationRotationScale.translation, translationRotationScale.rotation, translationRotationScale.scale, result);
      };
      Matrix4.fromTranslation = function(translation, result) {
        if (!defined(translation)) {
          throw new DeveloperError('translation is required.');
        }
        return Matrix4.fromRotationTranslation(Matrix3.IDENTITY, translation, result);
      };
      Matrix4.fromScale = function(scale, result) {
        if (!defined(scale)) {
          throw new DeveloperError('scale is required.');
        }
        if (!defined(result)) {
          return new Matrix4(scale.x, 0.0, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, 0.0, scale.z, 0.0, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = scale.x;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = scale.y;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = scale.z;
        result[11] = 0.0;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = 0.0;
        result[15] = 1.0;
        return result;
      };
      Matrix4.fromUniformScale = function(scale, result) {
        if (typeof scale !== 'number') {
          throw new DeveloperError('scale is required.');
        }
        if (!defined(result)) {
          return new Matrix4(scale, 0.0, 0.0, 0.0, 0.0, scale, 0.0, 0.0, 0.0, 0.0, scale, 0.0, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = scale;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = scale;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = scale;
        result[11] = 0.0;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = 0.0;
        result[15] = 1.0;
        return result;
      };
      var fromCameraF = new Cartesian3();
      var fromCameraS = new Cartesian3();
      var fromCameraU = new Cartesian3();
      Matrix4.fromCamera = function(camera, result) {
        if (!defined(camera)) {
          throw new DeveloperError('camera is required.');
        }
        var eye = camera.eye;
        var target = camera.target;
        var up = camera.up;
        if (!defined(eye)) {
          throw new DeveloperError('camera.eye is required.');
        }
        if (!defined(target)) {
          throw new DeveloperError('camera.target is required.');
        }
        if (!defined(up)) {
          throw new DeveloperError('camera.up is required.');
        }
        Cartesian3.normalize(Cartesian3.subtract(target, eye, fromCameraF), fromCameraF);
        Cartesian3.normalize(Cartesian3.cross(fromCameraF, up, fromCameraS), fromCameraS);
        Cartesian3.normalize(Cartesian3.cross(fromCameraS, fromCameraF, fromCameraU), fromCameraU);
        var sX = fromCameraS.x;
        var sY = fromCameraS.y;
        var sZ = fromCameraS.z;
        var fX = fromCameraF.x;
        var fY = fromCameraF.y;
        var fZ = fromCameraF.z;
        var uX = fromCameraU.x;
        var uY = fromCameraU.y;
        var uZ = fromCameraU.z;
        var eyeX = eye.x;
        var eyeY = eye.y;
        var eyeZ = eye.z;
        var t0 = sX * -eyeX + sY * -eyeY + sZ * -eyeZ;
        var t1 = uX * -eyeX + uY * -eyeY + uZ * -eyeZ;
        var t2 = fX * eyeX + fY * eyeY + fZ * eyeZ;
        if (!defined(result)) {
          return new Matrix4(sX, sY, sZ, t0, uX, uY, uZ, t1, -fX, -fY, -fZ, t2, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = sX;
        result[1] = uX;
        result[2] = -fX;
        result[3] = 0.0;
        result[4] = sY;
        result[5] = uY;
        result[6] = -fY;
        result[7] = 0.0;
        result[8] = sZ;
        result[9] = uZ;
        result[10] = -fZ;
        result[11] = 0.0;
        result[12] = t0;
        result[13] = t1;
        result[14] = t2;
        result[15] = 1.0;
        return result;
      };
      Matrix4.computePerspectiveFieldOfView = function(fovY, aspectRatio, near, far, result) {
        if (fovY <= 0.0 || fovY > Math.PI) {
          throw new DeveloperError('fovY must be in [0, PI).');
        }
        if (aspectRatio <= 0.0) {
          throw new DeveloperError('aspectRatio must be greater than zero.');
        }
        if (near <= 0.0) {
          throw new DeveloperError('near must be greater than zero.');
        }
        if (far <= 0.0) {
          throw new DeveloperError('far must be greater than zero.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var bottom = Math.tan(fovY * 0.5);
        var column1Row1 = 1.0 / bottom;
        var column0Row0 = column1Row1 / aspectRatio;
        var column2Row2 = (far + near) / (near - far);
        var column3Row2 = (2.0 * far * near) / (near - far);
        result[0] = column0Row0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = column1Row1;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = column2Row2;
        result[11] = -1.0;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = column3Row2;
        result[15] = 0.0;
        return result;
      };
      Matrix4.computeOrthographicOffCenter = function(left, right, bottom, top, near, far, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required.');
        }
        if (!defined(bottom)) {
          throw new DeveloperError('bottom is required.');
        }
        if (!defined(top)) {
          throw new DeveloperError('top is required.');
        }
        if (!defined(near)) {
          throw new DeveloperError('near is required.');
        }
        if (!defined(far)) {
          throw new DeveloperError('far is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var a = 1.0 / (right - left);
        var b = 1.0 / (top - bottom);
        var c = 1.0 / (far - near);
        var tx = -(right + left) * a;
        var ty = -(top + bottom) * b;
        var tz = -(far + near) * c;
        a *= 2.0;
        b *= 2.0;
        c *= -2.0;
        result[0] = a;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = b;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = c;
        result[11] = 0.0;
        result[12] = tx;
        result[13] = ty;
        result[14] = tz;
        result[15] = 1.0;
        return result;
      };
      Matrix4.computePerspectiveOffCenter = function(left, right, bottom, top, near, far, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required.');
        }
        if (!defined(bottom)) {
          throw new DeveloperError('bottom is required.');
        }
        if (!defined(top)) {
          throw new DeveloperError('top is required.');
        }
        if (!defined(near)) {
          throw new DeveloperError('near is required.');
        }
        if (!defined(far)) {
          throw new DeveloperError('far is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var column0Row0 = 2.0 * near / (right - left);
        var column1Row1 = 2.0 * near / (top - bottom);
        var column2Row0 = (right + left) / (right - left);
        var column2Row1 = (top + bottom) / (top - bottom);
        var column2Row2 = -(far + near) / (far - near);
        var column2Row3 = -1.0;
        var column3Row2 = -2.0 * far * near / (far - near);
        result[0] = column0Row0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = column1Row1;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = column2Row0;
        result[9] = column2Row1;
        result[10] = column2Row2;
        result[11] = column2Row3;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = column3Row2;
        result[15] = 0.0;
        return result;
      };
      Matrix4.computeInfinitePerspectiveOffCenter = function(left, right, bottom, top, near, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required.');
        }
        if (!defined(bottom)) {
          throw new DeveloperError('bottom is required.');
        }
        if (!defined(top)) {
          throw new DeveloperError('top is required.');
        }
        if (!defined(near)) {
          throw new DeveloperError('near is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var column0Row0 = 2.0 * near / (right - left);
        var column1Row1 = 2.0 * near / (top - bottom);
        var column2Row0 = (right + left) / (right - left);
        var column2Row1 = (top + bottom) / (top - bottom);
        var column2Row2 = -1.0;
        var column2Row3 = -1.0;
        var column3Row2 = -2.0 * near;
        result[0] = column0Row0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = column1Row1;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = column2Row0;
        result[9] = column2Row1;
        result[10] = column2Row2;
        result[11] = column2Row3;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = column3Row2;
        result[15] = 0.0;
        return result;
      };
      Matrix4.computeViewportTransformation = function(viewport, nearDepthRange, farDepthRange, result) {
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        viewport = defaultValue(viewport, defaultValue.EMPTY_OBJECT);
        var x = defaultValue(viewport.x, 0.0);
        var y = defaultValue(viewport.y, 0.0);
        var width = defaultValue(viewport.width, 0.0);
        var height = defaultValue(viewport.height, 0.0);
        nearDepthRange = defaultValue(nearDepthRange, 0.0);
        farDepthRange = defaultValue(farDepthRange, 1.0);
        var halfWidth = width * 0.5;
        var halfHeight = height * 0.5;
        var halfDepth = (farDepthRange - nearDepthRange) * 0.5;
        var column0Row0 = halfWidth;
        var column1Row1 = halfHeight;
        var column2Row2 = halfDepth;
        var column3Row0 = x + halfWidth;
        var column3Row1 = y + halfHeight;
        var column3Row2 = nearDepthRange + halfDepth;
        var column3Row3 = 1.0;
        result[0] = column0Row0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = column1Row1;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = column2Row2;
        result[11] = 0.0;
        result[12] = column3Row0;
        result[13] = column3Row1;
        result[14] = column3Row2;
        result[15] = column3Row3;
        return result;
      };
      Matrix4.toArray = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          return [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6], matrix[7], matrix[8], matrix[9], matrix[10], matrix[11], matrix[12], matrix[13], matrix[14], matrix[15]];
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        result[9] = matrix[9];
        result[10] = matrix[10];
        result[11] = matrix[11];
        result[12] = matrix[12];
        result[13] = matrix[13];
        result[14] = matrix[14];
        result[15] = matrix[15];
        return result;
      };
      Matrix4.getElementIndex = function(column, row) {
        if (typeof row !== 'number' || row < 0 || row > 3) {
          throw new DeveloperError('row must be 0, 1, 2, or 3.');
        }
        if (typeof column !== 'number' || column < 0 || column > 3) {
          throw new DeveloperError('column must be 0, 1, 2, or 3.');
        }
        return column * 4 + row;
      };
      Matrix4.getColumn = function(matrix, index, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required.');
        }
        if (typeof index !== 'number' || index < 0 || index > 3) {
          throw new DeveloperError('index must be 0, 1, 2, or 3.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var startIndex = index * 4;
        var x = matrix[startIndex];
        var y = matrix[startIndex + 1];
        var z = matrix[startIndex + 2];
        var w = matrix[startIndex + 3];
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
      };
      Matrix4.setColumn = function(matrix, index, cartesian, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 3) {
          throw new DeveloperError('index must be 0, 1, 2, or 3.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result = Matrix4.clone(matrix, result);
        var startIndex = index * 4;
        result[startIndex] = cartesian.x;
        result[startIndex + 1] = cartesian.y;
        result[startIndex + 2] = cartesian.z;
        result[startIndex + 3] = cartesian.w;
        return result;
      };
      Matrix4.setTranslation = function(matrix, translation, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(translation)) {
          throw new DeveloperError('translation is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        result[9] = matrix[9];
        result[10] = matrix[10];
        result[11] = matrix[11];
        result[12] = translation.x;
        result[13] = translation.y;
        result[14] = translation.z;
        result[15] = matrix[15];
        return result;
      };
      Matrix4.getRow = function(matrix, index, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required.');
        }
        if (typeof index !== 'number' || index < 0 || index > 3) {
          throw new DeveloperError('index must be 0, 1, 2, or 3.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var x = matrix[index];
        var y = matrix[index + 4];
        var z = matrix[index + 8];
        var w = matrix[index + 12];
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
      };
      Matrix4.setRow = function(matrix, index, cartesian, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 3) {
          throw new DeveloperError('index must be 0, 1, 2, or 3.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result = Matrix4.clone(matrix, result);
        result[index] = cartesian.x;
        result[index + 4] = cartesian.y;
        result[index + 8] = cartesian.z;
        result[index + 12] = cartesian.w;
        return result;
      };
      var scratchColumn = new Cartesian3();
      Matrix4.getScale = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = Cartesian3.magnitude(Cartesian3.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn));
        result.y = Cartesian3.magnitude(Cartesian3.fromElements(matrix[4], matrix[5], matrix[6], scratchColumn));
        result.z = Cartesian3.magnitude(Cartesian3.fromElements(matrix[8], matrix[9], matrix[10], scratchColumn));
        return result;
      };
      var scratchScale = new Cartesian3();
      Matrix4.getMaximumScale = function(matrix) {
        Matrix4.getScale(matrix, scratchScale);
        return Cartesian3.maximumComponent(scratchScale);
      };
      Matrix4.multiply = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var left0 = left[0];
        var left1 = left[1];
        var left2 = left[2];
        var left3 = left[3];
        var left4 = left[4];
        var left5 = left[5];
        var left6 = left[6];
        var left7 = left[7];
        var left8 = left[8];
        var left9 = left[9];
        var left10 = left[10];
        var left11 = left[11];
        var left12 = left[12];
        var left13 = left[13];
        var left14 = left[14];
        var left15 = left[15];
        var right0 = right[0];
        var right1 = right[1];
        var right2 = right[2];
        var right3 = right[3];
        var right4 = right[4];
        var right5 = right[5];
        var right6 = right[6];
        var right7 = right[7];
        var right8 = right[8];
        var right9 = right[9];
        var right10 = right[10];
        var right11 = right[11];
        var right12 = right[12];
        var right13 = right[13];
        var right14 = right[14];
        var right15 = right[15];
        var column0Row0 = left0 * right0 + left4 * right1 + left8 * right2 + left12 * right3;
        var column0Row1 = left1 * right0 + left5 * right1 + left9 * right2 + left13 * right3;
        var column0Row2 = left2 * right0 + left6 * right1 + left10 * right2 + left14 * right3;
        var column0Row3 = left3 * right0 + left7 * right1 + left11 * right2 + left15 * right3;
        var column1Row0 = left0 * right4 + left4 * right5 + left8 * right6 + left12 * right7;
        var column1Row1 = left1 * right4 + left5 * right5 + left9 * right6 + left13 * right7;
        var column1Row2 = left2 * right4 + left6 * right5 + left10 * right6 + left14 * right7;
        var column1Row3 = left3 * right4 + left7 * right5 + left11 * right6 + left15 * right7;
        var column2Row0 = left0 * right8 + left4 * right9 + left8 * right10 + left12 * right11;
        var column2Row1 = left1 * right8 + left5 * right9 + left9 * right10 + left13 * right11;
        var column2Row2 = left2 * right8 + left6 * right9 + left10 * right10 + left14 * right11;
        var column2Row3 = left3 * right8 + left7 * right9 + left11 * right10 + left15 * right11;
        var column3Row0 = left0 * right12 + left4 * right13 + left8 * right14 + left12 * right15;
        var column3Row1 = left1 * right12 + left5 * right13 + left9 * right14 + left13 * right15;
        var column3Row2 = left2 * right12 + left6 * right13 + left10 * right14 + left14 * right15;
        var column3Row3 = left3 * right12 + left7 * right13 + left11 * right14 + left15 * right15;
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = column0Row3;
        result[4] = column1Row0;
        result[5] = column1Row1;
        result[6] = column1Row2;
        result[7] = column1Row3;
        result[8] = column2Row0;
        result[9] = column2Row1;
        result[10] = column2Row2;
        result[11] = column2Row3;
        result[12] = column3Row0;
        result[13] = column3Row1;
        result[14] = column3Row2;
        result[15] = column3Row3;
        return result;
      };
      Matrix4.add = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = left[0] + right[0];
        result[1] = left[1] + right[1];
        result[2] = left[2] + right[2];
        result[3] = left[3] + right[3];
        result[4] = left[4] + right[4];
        result[5] = left[5] + right[5];
        result[6] = left[6] + right[6];
        result[7] = left[7] + right[7];
        result[8] = left[8] + right[8];
        result[9] = left[9] + right[9];
        result[10] = left[10] + right[10];
        result[11] = left[11] + right[11];
        result[12] = left[12] + right[12];
        result[13] = left[13] + right[13];
        result[14] = left[14] + right[14];
        result[15] = left[15] + right[15];
        return result;
      };
      Matrix4.subtract = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = left[0] - right[0];
        result[1] = left[1] - right[1];
        result[2] = left[2] - right[2];
        result[3] = left[3] - right[3];
        result[4] = left[4] - right[4];
        result[5] = left[5] - right[5];
        result[6] = left[6] - right[6];
        result[7] = left[7] - right[7];
        result[8] = left[8] - right[8];
        result[9] = left[9] - right[9];
        result[10] = left[10] - right[10];
        result[11] = left[11] - right[11];
        result[12] = left[12] - right[12];
        result[13] = left[13] - right[13];
        result[14] = left[14] - right[14];
        result[15] = left[15] - right[15];
        return result;
      };
      Matrix4.multiplyTransformation = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var left0 = left[0];
        var left1 = left[1];
        var left2 = left[2];
        var left4 = left[4];
        var left5 = left[5];
        var left6 = left[6];
        var left8 = left[8];
        var left9 = left[9];
        var left10 = left[10];
        var left12 = left[12];
        var left13 = left[13];
        var left14 = left[14];
        var right0 = right[0];
        var right1 = right[1];
        var right2 = right[2];
        var right4 = right[4];
        var right5 = right[5];
        var right6 = right[6];
        var right8 = right[8];
        var right9 = right[9];
        var right10 = right[10];
        var right12 = right[12];
        var right13 = right[13];
        var right14 = right[14];
        var column0Row0 = left0 * right0 + left4 * right1 + left8 * right2;
        var column0Row1 = left1 * right0 + left5 * right1 + left9 * right2;
        var column0Row2 = left2 * right0 + left6 * right1 + left10 * right2;
        var column1Row0 = left0 * right4 + left4 * right5 + left8 * right6;
        var column1Row1 = left1 * right4 + left5 * right5 + left9 * right6;
        var column1Row2 = left2 * right4 + left6 * right5 + left10 * right6;
        var column2Row0 = left0 * right8 + left4 * right9 + left8 * right10;
        var column2Row1 = left1 * right8 + left5 * right9 + left9 * right10;
        var column2Row2 = left2 * right8 + left6 * right9 + left10 * right10;
        var column3Row0 = left0 * right12 + left4 * right13 + left8 * right14 + left12;
        var column3Row1 = left1 * right12 + left5 * right13 + left9 * right14 + left13;
        var column3Row2 = left2 * right12 + left6 * right13 + left10 * right14 + left14;
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = 0.0;
        result[4] = column1Row0;
        result[5] = column1Row1;
        result[6] = column1Row2;
        result[7] = 0.0;
        result[8] = column2Row0;
        result[9] = column2Row1;
        result[10] = column2Row2;
        result[11] = 0.0;
        result[12] = column3Row0;
        result[13] = column3Row1;
        result[14] = column3Row2;
        result[15] = 1.0;
        return result;
      };
      Matrix4.multiplyByMatrix3 = function(matrix, rotation, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(rotation)) {
          throw new DeveloperError('rotation is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var left0 = matrix[0];
        var left1 = matrix[1];
        var left2 = matrix[2];
        var left4 = matrix[4];
        var left5 = matrix[5];
        var left6 = matrix[6];
        var left8 = matrix[8];
        var left9 = matrix[9];
        var left10 = matrix[10];
        var right0 = rotation[0];
        var right1 = rotation[1];
        var right2 = rotation[2];
        var right4 = rotation[3];
        var right5 = rotation[4];
        var right6 = rotation[5];
        var right8 = rotation[6];
        var right9 = rotation[7];
        var right10 = rotation[8];
        var column0Row0 = left0 * right0 + left4 * right1 + left8 * right2;
        var column0Row1 = left1 * right0 + left5 * right1 + left9 * right2;
        var column0Row2 = left2 * right0 + left6 * right1 + left10 * right2;
        var column1Row0 = left0 * right4 + left4 * right5 + left8 * right6;
        var column1Row1 = left1 * right4 + left5 * right5 + left9 * right6;
        var column1Row2 = left2 * right4 + left6 * right5 + left10 * right6;
        var column2Row0 = left0 * right8 + left4 * right9 + left8 * right10;
        var column2Row1 = left1 * right8 + left5 * right9 + left9 * right10;
        var column2Row2 = left2 * right8 + left6 * right9 + left10 * right10;
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = 0.0;
        result[4] = column1Row0;
        result[5] = column1Row1;
        result[6] = column1Row2;
        result[7] = 0.0;
        result[8] = column2Row0;
        result[9] = column2Row1;
        result[10] = column2Row2;
        result[11] = 0.0;
        result[12] = matrix[12];
        result[13] = matrix[13];
        result[14] = matrix[14];
        result[15] = matrix[15];
        return result;
      };
      Matrix4.multiplyByTranslation = function(matrix, translation, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(translation)) {
          throw new DeveloperError('translation is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var x = translation.x;
        var y = translation.y;
        var z = translation.z;
        var tx = (x * matrix[0]) + (y * matrix[4]) + (z * matrix[8]) + matrix[12];
        var ty = (x * matrix[1]) + (y * matrix[5]) + (z * matrix[9]) + matrix[13];
        var tz = (x * matrix[2]) + (y * matrix[6]) + (z * matrix[10]) + matrix[14];
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        result[9] = matrix[9];
        result[10] = matrix[10];
        result[11] = matrix[11];
        result[12] = tx;
        result[13] = ty;
        result[14] = tz;
        result[15] = matrix[15];
        return result;
      };
      var uniformScaleScratch = new Cartesian3();
      Matrix4.multiplyByUniformScale = function(matrix, scale, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (typeof scale !== 'number') {
          throw new DeveloperError('scale is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        uniformScaleScratch.x = scale;
        uniformScaleScratch.y = scale;
        uniformScaleScratch.z = scale;
        return Matrix4.multiplyByScale(matrix, uniformScaleScratch, result);
      };
      Matrix4.multiplyByScale = function(matrix, scale, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(scale)) {
          throw new DeveloperError('scale is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var scaleX = scale.x;
        var scaleY = scale.y;
        var scaleZ = scale.z;
        if ((scaleX === 1.0) && (scaleY === 1.0) && (scaleZ === 1.0)) {
          return Matrix4.clone(matrix, result);
        }
        result[0] = scaleX * matrix[0];
        result[1] = scaleX * matrix[1];
        result[2] = scaleX * matrix[2];
        result[3] = 0.0;
        result[4] = scaleY * matrix[4];
        result[5] = scaleY * matrix[5];
        result[6] = scaleY * matrix[6];
        result[7] = 0.0;
        result[8] = scaleZ * matrix[8];
        result[9] = scaleZ * matrix[9];
        result[10] = scaleZ * matrix[10];
        result[11] = 0.0;
        result[12] = matrix[12];
        result[13] = matrix[13];
        result[14] = matrix[14];
        result[15] = 1.0;
        return result;
      };
      Matrix4.multiplyByVector = function(matrix, cartesian, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var vX = cartesian.x;
        var vY = cartesian.y;
        var vZ = cartesian.z;
        var vW = cartesian.w;
        var x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12] * vW;
        var y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13] * vW;
        var z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14] * vW;
        var w = matrix[3] * vX + matrix[7] * vY + matrix[11] * vZ + matrix[15] * vW;
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
      };
      Matrix4.multiplyByPointAsVector = function(matrix, cartesian, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var vX = cartesian.x;
        var vY = cartesian.y;
        var vZ = cartesian.z;
        var x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ;
        var y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ;
        var z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ;
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      Matrix4.multiplyByPoint = function(matrix, cartesian, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var vX = cartesian.x;
        var vY = cartesian.y;
        var vZ = cartesian.z;
        var x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12];
        var y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13];
        var z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14];
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      Matrix4.multiplyByScalar = function(matrix, scalar, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar must be a number');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = matrix[0] * scalar;
        result[1] = matrix[1] * scalar;
        result[2] = matrix[2] * scalar;
        result[3] = matrix[3] * scalar;
        result[4] = matrix[4] * scalar;
        result[5] = matrix[5] * scalar;
        result[6] = matrix[6] * scalar;
        result[7] = matrix[7] * scalar;
        result[8] = matrix[8] * scalar;
        result[9] = matrix[9] * scalar;
        result[10] = matrix[10] * scalar;
        result[11] = matrix[11] * scalar;
        result[12] = matrix[12] * scalar;
        result[13] = matrix[13] * scalar;
        result[14] = matrix[14] * scalar;
        result[15] = matrix[15] * scalar;
        return result;
      };
      Matrix4.negate = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = -matrix[0];
        result[1] = -matrix[1];
        result[2] = -matrix[2];
        result[3] = -matrix[3];
        result[4] = -matrix[4];
        result[5] = -matrix[5];
        result[6] = -matrix[6];
        result[7] = -matrix[7];
        result[8] = -matrix[8];
        result[9] = -matrix[9];
        result[10] = -matrix[10];
        result[11] = -matrix[11];
        result[12] = -matrix[12];
        result[13] = -matrix[13];
        result[14] = -matrix[14];
        result[15] = -matrix[15];
        return result;
      };
      Matrix4.transpose = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var matrix1 = matrix[1];
        var matrix2 = matrix[2];
        var matrix3 = matrix[3];
        var matrix6 = matrix[6];
        var matrix7 = matrix[7];
        var matrix11 = matrix[11];
        result[0] = matrix[0];
        result[1] = matrix[4];
        result[2] = matrix[8];
        result[3] = matrix[12];
        result[4] = matrix1;
        result[5] = matrix[5];
        result[6] = matrix[9];
        result[7] = matrix[13];
        result[8] = matrix2;
        result[9] = matrix6;
        result[10] = matrix[10];
        result[11] = matrix[14];
        result[12] = matrix3;
        result[13] = matrix7;
        result[14] = matrix11;
        result[15] = matrix[15];
        return result;
      };
      Matrix4.abs = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = Math.abs(matrix[0]);
        result[1] = Math.abs(matrix[1]);
        result[2] = Math.abs(matrix[2]);
        result[3] = Math.abs(matrix[3]);
        result[4] = Math.abs(matrix[4]);
        result[5] = Math.abs(matrix[5]);
        result[6] = Math.abs(matrix[6]);
        result[7] = Math.abs(matrix[7]);
        result[8] = Math.abs(matrix[8]);
        result[9] = Math.abs(matrix[9]);
        result[10] = Math.abs(matrix[10]);
        result[11] = Math.abs(matrix[11]);
        result[12] = Math.abs(matrix[12]);
        result[13] = Math.abs(matrix[13]);
        result[14] = Math.abs(matrix[14]);
        result[15] = Math.abs(matrix[15]);
        return result;
      };
      Matrix4.equals = function(left, right) {
        return (left === right) || (defined(left) && defined(right) && left[12] === right[12] && left[13] === right[13] && left[14] === right[14] && left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[4] === right[4] && left[5] === right[5] && left[6] === right[6] && left[8] === right[8] && left[9] === right[9] && left[10] === right[10] && left[3] === right[3] && left[7] === right[7] && left[11] === right[11] && left[15] === right[15]);
      };
      Matrix4.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
          throw new DeveloperError('epsilon must be a number');
        }
        return (left === right) || (defined(left) && defined(right) && Math.abs(left[0] - right[0]) <= epsilon && Math.abs(left[1] - right[1]) <= epsilon && Math.abs(left[2] - right[2]) <= epsilon && Math.abs(left[3] - right[3]) <= epsilon && Math.abs(left[4] - right[4]) <= epsilon && Math.abs(left[5] - right[5]) <= epsilon && Math.abs(left[6] - right[6]) <= epsilon && Math.abs(left[7] - right[7]) <= epsilon && Math.abs(left[8] - right[8]) <= epsilon && Math.abs(left[9] - right[9]) <= epsilon && Math.abs(left[10] - right[10]) <= epsilon && Math.abs(left[11] - right[11]) <= epsilon && Math.abs(left[12] - right[12]) <= epsilon && Math.abs(left[13] - right[13]) <= epsilon && Math.abs(left[14] - right[14]) <= epsilon && Math.abs(left[15] - right[15]) <= epsilon);
      };
      Matrix4.getTranslation = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = matrix[12];
        result.y = matrix[13];
        result.z = matrix[14];
        return result;
      };
      Matrix4.getRotation = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[4];
        result[4] = matrix[5];
        result[5] = matrix[6];
        result[6] = matrix[8];
        result[7] = matrix[9];
        result[8] = matrix[10];
        return result;
      };
      var scratchInverseRotation = new Matrix3();
      var scratchMatrix3Zero = new Matrix3();
      var scratchBottomRow = new Cartesian4();
      var scratchExpectedBottomRow = new Cartesian4(0.0, 0.0, 0.0, 1.0);
      Matrix4.inverse = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        if (Matrix3.equalsEpsilon(Matrix4.getRotation(matrix, scratchInverseRotation), scratchMatrix3Zero, CesiumMath.EPSILON7) && Cartesian4.equals(Matrix4.getRow(matrix, 3, scratchBottomRow), scratchExpectedBottomRow)) {
          result[0] = 0.0;
          result[1] = 0.0;
          result[2] = 0.0;
          result[3] = 0.0;
          result[4] = 0.0;
          result[5] = 0.0;
          result[6] = 0.0;
          result[7] = 0.0;
          result[8] = 0.0;
          result[9] = 0.0;
          result[10] = 0.0;
          result[11] = 0.0;
          result[12] = -matrix[12];
          result[13] = -matrix[13];
          result[14] = -matrix[14];
          result[15] = 1.0;
          return result;
        }
        var src0 = matrix[0];
        var src1 = matrix[4];
        var src2 = matrix[8];
        var src3 = matrix[12];
        var src4 = matrix[1];
        var src5 = matrix[5];
        var src6 = matrix[9];
        var src7 = matrix[13];
        var src8 = matrix[2];
        var src9 = matrix[6];
        var src10 = matrix[10];
        var src11 = matrix[14];
        var src12 = matrix[3];
        var src13 = matrix[7];
        var src14 = matrix[11];
        var src15 = matrix[15];
        var tmp0 = src10 * src15;
        var tmp1 = src11 * src14;
        var tmp2 = src9 * src15;
        var tmp3 = src11 * src13;
        var tmp4 = src9 * src14;
        var tmp5 = src10 * src13;
        var tmp6 = src8 * src15;
        var tmp7 = src11 * src12;
        var tmp8 = src8 * src14;
        var tmp9 = src10 * src12;
        var tmp10 = src8 * src13;
        var tmp11 = src9 * src12;
        var dst0 = (tmp0 * src5 + tmp3 * src6 + tmp4 * src7) - (tmp1 * src5 + tmp2 * src6 + tmp5 * src7);
        var dst1 = (tmp1 * src4 + tmp6 * src6 + tmp9 * src7) - (tmp0 * src4 + tmp7 * src6 + tmp8 * src7);
        var dst2 = (tmp2 * src4 + tmp7 * src5 + tmp10 * src7) - (tmp3 * src4 + tmp6 * src5 + tmp11 * src7);
        var dst3 = (tmp5 * src4 + tmp8 * src5 + tmp11 * src6) - (tmp4 * src4 + tmp9 * src5 + tmp10 * src6);
        var dst4 = (tmp1 * src1 + tmp2 * src2 + tmp5 * src3) - (tmp0 * src1 + tmp3 * src2 + tmp4 * src3);
        var dst5 = (tmp0 * src0 + tmp7 * src2 + tmp8 * src3) - (tmp1 * src0 + tmp6 * src2 + tmp9 * src3);
        var dst6 = (tmp3 * src0 + tmp6 * src1 + tmp11 * src3) - (tmp2 * src0 + tmp7 * src1 + tmp10 * src3);
        var dst7 = (tmp4 * src0 + tmp9 * src1 + tmp10 * src2) - (tmp5 * src0 + tmp8 * src1 + tmp11 * src2);
        tmp0 = src2 * src7;
        tmp1 = src3 * src6;
        tmp2 = src1 * src7;
        tmp3 = src3 * src5;
        tmp4 = src1 * src6;
        tmp5 = src2 * src5;
        tmp6 = src0 * src7;
        tmp7 = src3 * src4;
        tmp8 = src0 * src6;
        tmp9 = src2 * src4;
        tmp10 = src0 * src5;
        tmp11 = src1 * src4;
        var dst8 = (tmp0 * src13 + tmp3 * src14 + tmp4 * src15) - (tmp1 * src13 + tmp2 * src14 + tmp5 * src15);
        var dst9 = (tmp1 * src12 + tmp6 * src14 + tmp9 * src15) - (tmp0 * src12 + tmp7 * src14 + tmp8 * src15);
        var dst10 = (tmp2 * src12 + tmp7 * src13 + tmp10 * src15) - (tmp3 * src12 + tmp6 * src13 + tmp11 * src15);
        var dst11 = (tmp5 * src12 + tmp8 * src13 + tmp11 * src14) - (tmp4 * src12 + tmp9 * src13 + tmp10 * src14);
        var dst12 = (tmp2 * src10 + tmp5 * src11 + tmp1 * src9) - (tmp4 * src11 + tmp0 * src9 + tmp3 * src10);
        var dst13 = (tmp8 * src11 + tmp0 * src8 + tmp7 * src10) - (tmp6 * src10 + tmp9 * src11 + tmp1 * src8);
        var dst14 = (tmp6 * src9 + tmp11 * src11 + tmp3 * src8) - (tmp10 * src11 + tmp2 * src8 + tmp7 * src9);
        var dst15 = (tmp10 * src10 + tmp4 * src8 + tmp9 * src9) - (tmp8 * src9 + tmp11 * src10 + tmp5 * src8);
        var det = src0 * dst0 + src1 * dst1 + src2 * dst2 + src3 * dst3;
        if (Math.abs(det) < CesiumMath.EPSILON20) {
          throw new RuntimeError('matrix is not invertible because its determinate is zero.');
        }
        det = 1.0 / det;
        result[0] = dst0 * det;
        result[1] = dst1 * det;
        result[2] = dst2 * det;
        result[3] = dst3 * det;
        result[4] = dst4 * det;
        result[5] = dst5 * det;
        result[6] = dst6 * det;
        result[7] = dst7 * det;
        result[8] = dst8 * det;
        result[9] = dst9 * det;
        result[10] = dst10 * det;
        result[11] = dst11 * det;
        result[12] = dst12 * det;
        result[13] = dst13 * det;
        result[14] = dst14 * det;
        result[15] = dst15 * det;
        return result;
      };
      Matrix4.inverseTransformation = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var matrix0 = matrix[0];
        var matrix1 = matrix[1];
        var matrix2 = matrix[2];
        var matrix4 = matrix[4];
        var matrix5 = matrix[5];
        var matrix6 = matrix[6];
        var matrix8 = matrix[8];
        var matrix9 = matrix[9];
        var matrix10 = matrix[10];
        var vX = matrix[12];
        var vY = matrix[13];
        var vZ = matrix[14];
        var x = -matrix0 * vX - matrix1 * vY - matrix2 * vZ;
        var y = -matrix4 * vX - matrix5 * vY - matrix6 * vZ;
        var z = -matrix8 * vX - matrix9 * vY - matrix10 * vZ;
        result[0] = matrix0;
        result[1] = matrix4;
        result[2] = matrix8;
        result[3] = 0.0;
        result[4] = matrix1;
        result[5] = matrix5;
        result[6] = matrix9;
        result[7] = 0.0;
        result[8] = matrix2;
        result[9] = matrix6;
        result[10] = matrix10;
        result[11] = 0.0;
        result[12] = x;
        result[13] = y;
        result[14] = z;
        result[15] = 1.0;
        return result;
      };
      Matrix4.IDENTITY = freezeObject(new Matrix4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0));
      Matrix4.ZERO = freezeObject(new Matrix4(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0));
      Matrix4.COLUMN0ROW0 = 0;
      Matrix4.COLUMN0ROW1 = 1;
      Matrix4.COLUMN0ROW2 = 2;
      Matrix4.COLUMN0ROW3 = 3;
      Matrix4.COLUMN1ROW0 = 4;
      Matrix4.COLUMN1ROW1 = 5;
      Matrix4.COLUMN1ROW2 = 6;
      Matrix4.COLUMN1ROW3 = 7;
      Matrix4.COLUMN2ROW0 = 8;
      Matrix4.COLUMN2ROW1 = 9;
      Matrix4.COLUMN2ROW2 = 10;
      Matrix4.COLUMN2ROW3 = 11;
      Matrix4.COLUMN3ROW0 = 12;
      Matrix4.COLUMN3ROW1 = 13;
      Matrix4.COLUMN3ROW2 = 14;
      Matrix4.COLUMN3ROW3 = 15;
      defineProperties(Matrix4.prototype, {length: {get: function() {
            return Matrix4.packedLength;
          }}});
      Matrix4.prototype.clone = function(result) {
        return Matrix4.clone(this, result);
      };
      Matrix4.prototype.equals = function(right) {
        return Matrix4.equals(this, right);
      };
      Matrix4.equalsArray = function(matrix, array, offset) {
        return matrix[0] === array[offset] && matrix[1] === array[offset + 1] && matrix[2] === array[offset + 2] && matrix[3] === array[offset + 3] && matrix[4] === array[offset + 4] && matrix[5] === array[offset + 5] && matrix[6] === array[offset + 6] && matrix[7] === array[offset + 7] && matrix[8] === array[offset + 8] && matrix[9] === array[offset + 9] && matrix[10] === array[offset + 10] && matrix[11] === array[offset + 11] && matrix[12] === array[offset + 12] && matrix[13] === array[offset + 13] && matrix[14] === array[offset + 14] && matrix[15] === array[offset + 15];
      };
      Matrix4.prototype.equalsEpsilon = function(right, epsilon) {
        return Matrix4.equalsEpsilon(this, right, epsilon);
      };
      Matrix4.prototype.toString = function() {
        return '(' + this[0] + ', ' + this[4] + ', ' + this[8] + ', ' + this[12] + ')\n' + '(' + this[1] + ', ' + this[5] + ', ' + this[9] + ', ' + this[13] + ')\n' + '(' + this[2] + ', ' + this[6] + ', ' + this[10] + ', ' + this[14] + ')\n' + '(' + this[3] + ', ' + this[7] + ', ' + this[11] + ', ' + this[15] + ')';
      };
      return Matrix4;
    });
    define('Core/Plane', ['./Cartesian3', './defined', './DeveloperError', './freezeObject'], function(Cartesian3, defined, DeveloperError, freezeObject) {
      'use strict';
      function Plane(normal, distance) {
        if (!defined(normal)) {
          throw new DeveloperError('normal is required.');
        }
        if (!defined(distance)) {
          throw new DeveloperError('distance is required.');
        }
        this.normal = Cartesian3.clone(normal);
        this.distance = distance;
      }
      Plane.fromPointNormal = function(point, normal, result) {
        if (!defined(point)) {
          throw new DeveloperError('point is required.');
        }
        if (!defined(normal)) {
          throw new DeveloperError('normal is required.');
        }
        var distance = -Cartesian3.dot(normal, point);
        if (!defined(result)) {
          return new Plane(normal, distance);
        }
        Cartesian3.clone(normal, result.normal);
        result.distance = distance;
        return result;
      };
      var scratchNormal = new Cartesian3();
      Plane.fromCartesian4 = function(coefficients, result) {
        if (!defined(coefficients)) {
          throw new DeveloperError('coefficients is required.');
        }
        var normal = Cartesian3.fromCartesian4(coefficients, scratchNormal);
        var distance = coefficients.w;
        if (!defined(result)) {
          return new Plane(normal, distance);
        } else {
          Cartesian3.clone(normal, result.normal);
          result.distance = distance;
          return result;
        }
      };
      Plane.getPointDistance = function(plane, point) {
        if (!defined(plane)) {
          throw new DeveloperError('plane is required.');
        }
        if (!defined(point)) {
          throw new DeveloperError('point is required.');
        }
        return Cartesian3.dot(plane.normal, point) + plane.distance;
      };
      Plane.ORIGIN_XY_PLANE = freezeObject(new Plane(Cartesian3.UNIT_Z, 0.0));
      Plane.ORIGIN_YZ_PLANE = freezeObject(new Plane(Cartesian3.UNIT_X, 0.0));
      Plane.ORIGIN_ZX_PLANE = freezeObject(new Plane(Cartesian3.UNIT_Y, 0.0));
      return Plane;
    });
    define('Core/Rectangle', ['./Cartographic', './defaultValue', './defined', './defineProperties', './DeveloperError', './Ellipsoid', './freezeObject', './Math'], function(Cartographic, defaultValue, defined, defineProperties, DeveloperError, Ellipsoid, freezeObject, CesiumMath) {
      'use strict';
      function Rectangle(west, south, east, north) {
        this.west = defaultValue(west, 0.0);
        this.south = defaultValue(south, 0.0);
        this.east = defaultValue(east, 0.0);
        this.north = defaultValue(north, 0.0);
      }
      defineProperties(Rectangle.prototype, {
        width: {get: function() {
            return Rectangle.computeWidth(this);
          }},
        height: {get: function() {
            return Rectangle.computeHeight(this);
          }}
      });
      Rectangle.packedLength = 4;
      Rectangle.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value.west;
        array[startingIndex++] = value.south;
        array[startingIndex++] = value.east;
        array[startingIndex] = value.north;
      };
      Rectangle.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Rectangle();
        }
        result.west = array[startingIndex++];
        result.south = array[startingIndex++];
        result.east = array[startingIndex++];
        result.north = array[startingIndex];
        return result;
      };
      Rectangle.computeWidth = function(rectangle) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required.');
        }
        var east = rectangle.east;
        var west = rectangle.west;
        if (east < west) {
          east += CesiumMath.TWO_PI;
        }
        return east - west;
      };
      Rectangle.computeHeight = function(rectangle) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required.');
        }
        return rectangle.north - rectangle.south;
      };
      Rectangle.fromDegrees = function(west, south, east, north, result) {
        west = CesiumMath.toRadians(defaultValue(west, 0.0));
        south = CesiumMath.toRadians(defaultValue(south, 0.0));
        east = CesiumMath.toRadians(defaultValue(east, 0.0));
        north = CesiumMath.toRadians(defaultValue(north, 0.0));
        if (!defined(result)) {
          return new Rectangle(west, south, east, north);
        }
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
      };
      Rectangle.fromCartographicArray = function(cartographics, result) {
        if (!defined(cartographics)) {
          throw new DeveloperError('cartographics is required.');
        }
        var west = Number.MAX_VALUE;
        var east = -Number.MAX_VALUE;
        var westOverIDL = Number.MAX_VALUE;
        var eastOverIDL = -Number.MAX_VALUE;
        var south = Number.MAX_VALUE;
        var north = -Number.MAX_VALUE;
        for (var i = 0,
            len = cartographics.length; i < len; i++) {
          var position = cartographics[i];
          west = Math.min(west, position.longitude);
          east = Math.max(east, position.longitude);
          south = Math.min(south, position.latitude);
          north = Math.max(north, position.latitude);
          var lonAdjusted = position.longitude >= 0 ? position.longitude : position.longitude + CesiumMath.TWO_PI;
          westOverIDL = Math.min(westOverIDL, lonAdjusted);
          eastOverIDL = Math.max(eastOverIDL, lonAdjusted);
        }
        if (east - west > eastOverIDL - westOverIDL) {
          west = westOverIDL;
          east = eastOverIDL;
          if (east > CesiumMath.PI) {
            east = east - CesiumMath.TWO_PI;
          }
          if (west > CesiumMath.PI) {
            west = west - CesiumMath.TWO_PI;
          }
        }
        if (!defined(result)) {
          return new Rectangle(west, south, east, north);
        }
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
      };
      Rectangle.clone = function(rectangle, result) {
        if (!defined(rectangle)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Rectangle(rectangle.west, rectangle.south, rectangle.east, rectangle.north);
        }
        result.west = rectangle.west;
        result.south = rectangle.south;
        result.east = rectangle.east;
        result.north = rectangle.north;
        return result;
      };
      Rectangle.prototype.clone = function(result) {
        return Rectangle.clone(this, result);
      };
      Rectangle.prototype.equals = function(other) {
        return Rectangle.equals(this, other);
      };
      Rectangle.equals = function(left, right) {
        return (left === right) || ((defined(left)) && (defined(right)) && (left.west === right.west) && (left.south === right.south) && (left.east === right.east) && (left.north === right.north));
      };
      Rectangle.prototype.equalsEpsilon = function(other, epsilon) {
        if (typeof epsilon !== 'number') {
          throw new DeveloperError('epsilon is required and must be a number.');
        }
        return defined(other) && (Math.abs(this.west - other.west) <= epsilon) && (Math.abs(this.south - other.south) <= epsilon) && (Math.abs(this.east - other.east) <= epsilon) && (Math.abs(this.north - other.north) <= epsilon);
      };
      Rectangle.validate = function(rectangle) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        var north = rectangle.north;
        if (typeof north !== 'number') {
          throw new DeveloperError('north is required to be a number.');
        }
        if (north < -CesiumMath.PI_OVER_TWO || north > CesiumMath.PI_OVER_TWO) {
          throw new DeveloperError('north must be in the interval [-Pi/2, Pi/2].');
        }
        var south = rectangle.south;
        if (typeof south !== 'number') {
          throw new DeveloperError('south is required to be a number.');
        }
        if (south < -CesiumMath.PI_OVER_TWO || south > CesiumMath.PI_OVER_TWO) {
          throw new DeveloperError('south must be in the interval [-Pi/2, Pi/2].');
        }
        var west = rectangle.west;
        if (typeof west !== 'number') {
          throw new DeveloperError('west is required to be a number.');
        }
        if (west < -Math.PI || west > Math.PI) {
          throw new DeveloperError('west must be in the interval [-Pi, Pi].');
        }
        var east = rectangle.east;
        if (typeof east !== 'number') {
          throw new DeveloperError('east is required to be a number.');
        }
        if (east < -Math.PI || east > Math.PI) {
          throw new DeveloperError('east must be in the interval [-Pi, Pi].');
        }
      };
      Rectangle.southwest = function(rectangle, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        if (!defined(result)) {
          return new Cartographic(rectangle.west, rectangle.south);
        }
        result.longitude = rectangle.west;
        result.latitude = rectangle.south;
        result.height = 0.0;
        return result;
      };
      Rectangle.northwest = function(rectangle, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        if (!defined(result)) {
          return new Cartographic(rectangle.west, rectangle.north);
        }
        result.longitude = rectangle.west;
        result.latitude = rectangle.north;
        result.height = 0.0;
        return result;
      };
      Rectangle.northeast = function(rectangle, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        if (!defined(result)) {
          return new Cartographic(rectangle.east, rectangle.north);
        }
        result.longitude = rectangle.east;
        result.latitude = rectangle.north;
        result.height = 0.0;
        return result;
      };
      Rectangle.southeast = function(rectangle, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        if (!defined(result)) {
          return new Cartographic(rectangle.east, rectangle.south);
        }
        result.longitude = rectangle.east;
        result.latitude = rectangle.south;
        result.height = 0.0;
        return result;
      };
      Rectangle.center = function(rectangle, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        var east = rectangle.east;
        var west = rectangle.west;
        if (east < west) {
          east += CesiumMath.TWO_PI;
        }
        var longitude = CesiumMath.negativePiToPi((west + east) * 0.5);
        var latitude = (rectangle.south + rectangle.north) * 0.5;
        if (!defined(result)) {
          return new Cartographic(longitude, latitude);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = 0.0;
        return result;
      };
      Rectangle.intersection = function(rectangle, otherRectangle, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        if (!defined(otherRectangle)) {
          throw new DeveloperError('otherRectangle is required.');
        }
        var rectangleEast = rectangle.east;
        var rectangleWest = rectangle.west;
        var otherRectangleEast = otherRectangle.east;
        var otherRectangleWest = otherRectangle.west;
        if (rectangleEast < rectangleWest && otherRectangleEast > 0.0) {
          rectangleEast += CesiumMath.TWO_PI;
        } else if (otherRectangleEast < otherRectangleWest && rectangleEast > 0.0) {
          otherRectangleEast += CesiumMath.TWO_PI;
        }
        if (rectangleEast < rectangleWest && otherRectangleWest < 0.0) {
          otherRectangleWest += CesiumMath.TWO_PI;
        } else if (otherRectangleEast < otherRectangleWest && rectangleWest < 0.0) {
          rectangleWest += CesiumMath.TWO_PI;
        }
        var west = CesiumMath.negativePiToPi(Math.max(rectangleWest, otherRectangleWest));
        var east = CesiumMath.negativePiToPi(Math.min(rectangleEast, otherRectangleEast));
        if ((rectangle.west < rectangle.east || otherRectangle.west < otherRectangle.east) && east <= west) {
          return undefined;
        }
        var south = Math.max(rectangle.south, otherRectangle.south);
        var north = Math.min(rectangle.north, otherRectangle.north);
        if (south >= north) {
          return undefined;
        }
        if (!defined(result)) {
          return new Rectangle(west, south, east, north);
        }
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
      };
      Rectangle.union = function(rectangle, otherRectangle, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        if (!defined(otherRectangle)) {
          throw new DeveloperError('otherRectangle is required.');
        }
        if (!defined(result)) {
          result = new Rectangle();
        }
        result.west = Math.min(rectangle.west, otherRectangle.west);
        result.south = Math.min(rectangle.south, otherRectangle.south);
        result.east = Math.max(rectangle.east, otherRectangle.east);
        result.north = Math.max(rectangle.north, otherRectangle.north);
        return result;
      };
      Rectangle.expand = function(rectangle, cartographic, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required.');
        }
        if (!defined(cartographic)) {
          throw new DeveloperError('cartographic is required.');
        }
        if (!defined(result)) {
          result = new Rectangle();
        }
        result.west = Math.min(rectangle.west, cartographic.longitude);
        result.south = Math.min(rectangle.south, cartographic.latitude);
        result.east = Math.max(rectangle.east, cartographic.longitude);
        result.north = Math.max(rectangle.north, cartographic.latitude);
        return result;
      };
      Rectangle.contains = function(rectangle, cartographic) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        if (!defined(cartographic)) {
          throw new DeveloperError('cartographic is required.');
        }
        var longitude = cartographic.longitude;
        var latitude = cartographic.latitude;
        var west = rectangle.west;
        var east = rectangle.east;
        if (east < west) {
          east += CesiumMath.TWO_PI;
          if (longitude < 0.0) {
            longitude += CesiumMath.TWO_PI;
          }
        }
        return (longitude > west || CesiumMath.equalsEpsilon(longitude, west, CesiumMath.EPSILON14)) && (longitude < east || CesiumMath.equalsEpsilon(longitude, east, CesiumMath.EPSILON14)) && latitude >= rectangle.south && latitude <= rectangle.north;
      };
      var subsampleLlaScratch = new Cartographic();
      Rectangle.subsample = function(rectangle, ellipsoid, surfaceHeight, result) {
        if (!defined(rectangle)) {
          throw new DeveloperError('rectangle is required');
        }
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        surfaceHeight = defaultValue(surfaceHeight, 0.0);
        if (!defined(result)) {
          result = [];
        }
        var length = 0;
        var north = rectangle.north;
        var south = rectangle.south;
        var east = rectangle.east;
        var west = rectangle.west;
        var lla = subsampleLlaScratch;
        lla.height = surfaceHeight;
        lla.longitude = west;
        lla.latitude = north;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;
        lla.longitude = east;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;
        lla.latitude = south;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;
        lla.longitude = west;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;
        if (north < 0.0) {
          lla.latitude = north;
        } else if (south > 0.0) {
          lla.latitude = south;
        } else {
          lla.latitude = 0.0;
        }
        for (var i = 1; i < 8; ++i) {
          lla.longitude = -Math.PI + i * CesiumMath.PI_OVER_TWO;
          if (Rectangle.contains(rectangle, lla)) {
            result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
            length++;
          }
        }
        if (lla.latitude === 0.0) {
          lla.longitude = west;
          result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
          length++;
          lla.longitude = east;
          result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
          length++;
        }
        result.length = length;
        return result;
      };
      Rectangle.MAX_VALUE = freezeObject(new Rectangle(-Math.PI, -CesiumMath.PI_OVER_TWO, Math.PI, CesiumMath.PI_OVER_TWO));
      return Rectangle;
    });
    define('Core/BoundingSphere', ['./Cartesian3', './Cartographic', './defaultValue', './defined', './DeveloperError', './Ellipsoid', './GeographicProjection', './Intersect', './Interval', './Matrix3', './Matrix4', './Plane', './Rectangle'], function(Cartesian3, Cartographic, defaultValue, defined, DeveloperError, Ellipsoid, GeographicProjection, Intersect, Interval, Matrix3, Matrix4, Plane, Rectangle) {
      'use strict';
      function BoundingSphere(center, radius) {
        this.center = Cartesian3.clone(defaultValue(center, Cartesian3.ZERO));
        this.radius = defaultValue(radius, 0.0);
      }
      var fromPointsXMin = new Cartesian3();
      var fromPointsYMin = new Cartesian3();
      var fromPointsZMin = new Cartesian3();
      var fromPointsXMax = new Cartesian3();
      var fromPointsYMax = new Cartesian3();
      var fromPointsZMax = new Cartesian3();
      var fromPointsCurrentPos = new Cartesian3();
      var fromPointsScratch = new Cartesian3();
      var fromPointsRitterCenter = new Cartesian3();
      var fromPointsMinBoxPt = new Cartesian3();
      var fromPointsMaxBoxPt = new Cartesian3();
      var fromPointsNaiveCenterScratch = new Cartesian3();
      BoundingSphere.fromPoints = function(positions, result) {
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        if (!defined(positions) || positions.length === 0) {
          result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
          result.radius = 0.0;
          return result;
        }
        var currentPos = Cartesian3.clone(positions[0], fromPointsCurrentPos);
        var xMin = Cartesian3.clone(currentPos, fromPointsXMin);
        var yMin = Cartesian3.clone(currentPos, fromPointsYMin);
        var zMin = Cartesian3.clone(currentPos, fromPointsZMin);
        var xMax = Cartesian3.clone(currentPos, fromPointsXMax);
        var yMax = Cartesian3.clone(currentPos, fromPointsYMax);
        var zMax = Cartesian3.clone(currentPos, fromPointsZMax);
        var numPositions = positions.length;
        for (var i = 1; i < numPositions; i++) {
          Cartesian3.clone(positions[i], currentPos);
          var x = currentPos.x;
          var y = currentPos.y;
          var z = currentPos.z;
          if (x < xMin.x) {
            Cartesian3.clone(currentPos, xMin);
          }
          if (x > xMax.x) {
            Cartesian3.clone(currentPos, xMax);
          }
          if (y < yMin.y) {
            Cartesian3.clone(currentPos, yMin);
          }
          if (y > yMax.y) {
            Cartesian3.clone(currentPos, yMax);
          }
          if (z < zMin.z) {
            Cartesian3.clone(currentPos, zMin);
          }
          if (z > zMax.z) {
            Cartesian3.clone(currentPos, zMax);
          }
        }
        var xSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(xMax, xMin, fromPointsScratch));
        var ySpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(yMax, yMin, fromPointsScratch));
        var zSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(zMax, zMin, fromPointsScratch));
        var diameter1 = xMin;
        var diameter2 = xMax;
        var maxSpan = xSpan;
        if (ySpan > maxSpan) {
          maxSpan = ySpan;
          diameter1 = yMin;
          diameter2 = yMax;
        }
        if (zSpan > maxSpan) {
          maxSpan = zSpan;
          diameter1 = zMin;
          diameter2 = zMax;
        }
        var ritterCenter = fromPointsRitterCenter;
        ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
        ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
        ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;
        var radiusSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch));
        var ritterRadius = Math.sqrt(radiusSquared);
        var minBoxPt = fromPointsMinBoxPt;
        minBoxPt.x = xMin.x;
        minBoxPt.y = yMin.y;
        minBoxPt.z = zMin.z;
        var maxBoxPt = fromPointsMaxBoxPt;
        maxBoxPt.x = xMax.x;
        maxBoxPt.y = yMax.y;
        maxBoxPt.z = zMax.z;
        var naiveCenter = Cartesian3.multiplyByScalar(Cartesian3.add(minBoxPt, maxBoxPt, fromPointsScratch), 0.5, fromPointsNaiveCenterScratch);
        var naiveRadius = 0;
        for (i = 0; i < numPositions; i++) {
          Cartesian3.clone(positions[i], currentPos);
          var r = Cartesian3.magnitude(Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch));
          if (r > naiveRadius) {
            naiveRadius = r;
          }
          var oldCenterToPointSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch));
          if (oldCenterToPointSquared > radiusSquared) {
            var oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
            ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
            radiusSquared = ritterRadius * ritterRadius;
            var oldToNew = oldCenterToPoint - ritterRadius;
            ritterCenter.x = (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) / oldCenterToPoint;
            ritterCenter.y = (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) / oldCenterToPoint;
            ritterCenter.z = (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) / oldCenterToPoint;
          }
        }
        if (ritterRadius < naiveRadius) {
          Cartesian3.clone(ritterCenter, result.center);
          result.radius = ritterRadius;
        } else {
          Cartesian3.clone(naiveCenter, result.center);
          result.radius = naiveRadius;
        }
        return result;
      };
      var defaultProjection = new GeographicProjection();
      var fromRectangle2DLowerLeft = new Cartesian3();
      var fromRectangle2DUpperRight = new Cartesian3();
      var fromRectangle2DSouthwest = new Cartographic();
      var fromRectangle2DNortheast = new Cartographic();
      BoundingSphere.fromRectangle2D = function(rectangle, projection, result) {
        return BoundingSphere.fromRectangleWithHeights2D(rectangle, projection, 0.0, 0.0, result);
      };
      BoundingSphere.fromRectangleWithHeights2D = function(rectangle, projection, minimumHeight, maximumHeight, result) {
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        if (!defined(rectangle)) {
          result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
          result.radius = 0.0;
          return result;
        }
        projection = defaultValue(projection, defaultProjection);
        Rectangle.southwest(rectangle, fromRectangle2DSouthwest);
        fromRectangle2DSouthwest.height = minimumHeight;
        Rectangle.northeast(rectangle, fromRectangle2DNortheast);
        fromRectangle2DNortheast.height = maximumHeight;
        var lowerLeft = projection.project(fromRectangle2DSouthwest, fromRectangle2DLowerLeft);
        var upperRight = projection.project(fromRectangle2DNortheast, fromRectangle2DUpperRight);
        var width = upperRight.x - lowerLeft.x;
        var height = upperRight.y - lowerLeft.y;
        var elevation = upperRight.z - lowerLeft.z;
        result.radius = Math.sqrt(width * width + height * height + elevation * elevation) * 0.5;
        var center = result.center;
        center.x = lowerLeft.x + width * 0.5;
        center.y = lowerLeft.y + height * 0.5;
        center.z = lowerLeft.z + elevation * 0.5;
        return result;
      };
      var fromRectangle3DScratch = [];
      BoundingSphere.fromRectangle3D = function(rectangle, ellipsoid, surfaceHeight, result) {
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        surfaceHeight = defaultValue(surfaceHeight, 0.0);
        var positions;
        if (defined(rectangle)) {
          positions = Rectangle.subsample(rectangle, ellipsoid, surfaceHeight, fromRectangle3DScratch);
        }
        return BoundingSphere.fromPoints(positions, result);
      };
      BoundingSphere.fromVertices = function(positions, center, stride, result) {
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        if (!defined(positions) || positions.length === 0) {
          result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
          result.radius = 0.0;
          return result;
        }
        center = defaultValue(center, Cartesian3.ZERO);
        stride = defaultValue(stride, 3);
        if (stride < 3) {
          throw new DeveloperError('stride must be 3 or greater.');
        }
        var currentPos = fromPointsCurrentPos;
        currentPos.x = positions[0] + center.x;
        currentPos.y = positions[1] + center.y;
        currentPos.z = positions[2] + center.z;
        var xMin = Cartesian3.clone(currentPos, fromPointsXMin);
        var yMin = Cartesian3.clone(currentPos, fromPointsYMin);
        var zMin = Cartesian3.clone(currentPos, fromPointsZMin);
        var xMax = Cartesian3.clone(currentPos, fromPointsXMax);
        var yMax = Cartesian3.clone(currentPos, fromPointsYMax);
        var zMax = Cartesian3.clone(currentPos, fromPointsZMax);
        var numElements = positions.length;
        for (var i = 0; i < numElements; i += stride) {
          var x = positions[i] + center.x;
          var y = positions[i + 1] + center.y;
          var z = positions[i + 2] + center.z;
          currentPos.x = x;
          currentPos.y = y;
          currentPos.z = z;
          if (x < xMin.x) {
            Cartesian3.clone(currentPos, xMin);
          }
          if (x > xMax.x) {
            Cartesian3.clone(currentPos, xMax);
          }
          if (y < yMin.y) {
            Cartesian3.clone(currentPos, yMin);
          }
          if (y > yMax.y) {
            Cartesian3.clone(currentPos, yMax);
          }
          if (z < zMin.z) {
            Cartesian3.clone(currentPos, zMin);
          }
          if (z > zMax.z) {
            Cartesian3.clone(currentPos, zMax);
          }
        }
        var xSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(xMax, xMin, fromPointsScratch));
        var ySpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(yMax, yMin, fromPointsScratch));
        var zSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(zMax, zMin, fromPointsScratch));
        var diameter1 = xMin;
        var diameter2 = xMax;
        var maxSpan = xSpan;
        if (ySpan > maxSpan) {
          maxSpan = ySpan;
          diameter1 = yMin;
          diameter2 = yMax;
        }
        if (zSpan > maxSpan) {
          maxSpan = zSpan;
          diameter1 = zMin;
          diameter2 = zMax;
        }
        var ritterCenter = fromPointsRitterCenter;
        ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
        ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
        ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;
        var radiusSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch));
        var ritterRadius = Math.sqrt(radiusSquared);
        var minBoxPt = fromPointsMinBoxPt;
        minBoxPt.x = xMin.x;
        minBoxPt.y = yMin.y;
        minBoxPt.z = zMin.z;
        var maxBoxPt = fromPointsMaxBoxPt;
        maxBoxPt.x = xMax.x;
        maxBoxPt.y = yMax.y;
        maxBoxPt.z = zMax.z;
        var naiveCenter = Cartesian3.multiplyByScalar(Cartesian3.add(minBoxPt, maxBoxPt, fromPointsScratch), 0.5, fromPointsNaiveCenterScratch);
        var naiveRadius = 0;
        for (i = 0; i < numElements; i += stride) {
          currentPos.x = positions[i] + center.x;
          currentPos.y = positions[i + 1] + center.y;
          currentPos.z = positions[i + 2] + center.z;
          var r = Cartesian3.magnitude(Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch));
          if (r > naiveRadius) {
            naiveRadius = r;
          }
          var oldCenterToPointSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch));
          if (oldCenterToPointSquared > radiusSquared) {
            var oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
            ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
            radiusSquared = ritterRadius * ritterRadius;
            var oldToNew = oldCenterToPoint - ritterRadius;
            ritterCenter.x = (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) / oldCenterToPoint;
            ritterCenter.y = (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) / oldCenterToPoint;
            ritterCenter.z = (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) / oldCenterToPoint;
          }
        }
        if (ritterRadius < naiveRadius) {
          Cartesian3.clone(ritterCenter, result.center);
          result.radius = ritterRadius;
        } else {
          Cartesian3.clone(naiveCenter, result.center);
          result.radius = naiveRadius;
        }
        return result;
      };
      BoundingSphere.fromEncodedCartesianVertices = function(positionsHigh, positionsLow, result) {
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        if (!defined(positionsHigh) || !defined(positionsLow) || positionsHigh.length !== positionsLow.length || positionsHigh.length === 0) {
          result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
          result.radius = 0.0;
          return result;
        }
        var currentPos = fromPointsCurrentPos;
        currentPos.x = positionsHigh[0] + positionsLow[0];
        currentPos.y = positionsHigh[1] + positionsLow[1];
        currentPos.z = positionsHigh[2] + positionsLow[2];
        var xMin = Cartesian3.clone(currentPos, fromPointsXMin);
        var yMin = Cartesian3.clone(currentPos, fromPointsYMin);
        var zMin = Cartesian3.clone(currentPos, fromPointsZMin);
        var xMax = Cartesian3.clone(currentPos, fromPointsXMax);
        var yMax = Cartesian3.clone(currentPos, fromPointsYMax);
        var zMax = Cartesian3.clone(currentPos, fromPointsZMax);
        var numElements = positionsHigh.length;
        for (var i = 0; i < numElements; i += 3) {
          var x = positionsHigh[i] + positionsLow[i];
          var y = positionsHigh[i + 1] + positionsLow[i + 1];
          var z = positionsHigh[i + 2] + positionsLow[i + 2];
          currentPos.x = x;
          currentPos.y = y;
          currentPos.z = z;
          if (x < xMin.x) {
            Cartesian3.clone(currentPos, xMin);
          }
          if (x > xMax.x) {
            Cartesian3.clone(currentPos, xMax);
          }
          if (y < yMin.y) {
            Cartesian3.clone(currentPos, yMin);
          }
          if (y > yMax.y) {
            Cartesian3.clone(currentPos, yMax);
          }
          if (z < zMin.z) {
            Cartesian3.clone(currentPos, zMin);
          }
          if (z > zMax.z) {
            Cartesian3.clone(currentPos, zMax);
          }
        }
        var xSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(xMax, xMin, fromPointsScratch));
        var ySpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(yMax, yMin, fromPointsScratch));
        var zSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(zMax, zMin, fromPointsScratch));
        var diameter1 = xMin;
        var diameter2 = xMax;
        var maxSpan = xSpan;
        if (ySpan > maxSpan) {
          maxSpan = ySpan;
          diameter1 = yMin;
          diameter2 = yMax;
        }
        if (zSpan > maxSpan) {
          maxSpan = zSpan;
          diameter1 = zMin;
          diameter2 = zMax;
        }
        var ritterCenter = fromPointsRitterCenter;
        ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
        ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
        ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;
        var radiusSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch));
        var ritterRadius = Math.sqrt(radiusSquared);
        var minBoxPt = fromPointsMinBoxPt;
        minBoxPt.x = xMin.x;
        minBoxPt.y = yMin.y;
        minBoxPt.z = zMin.z;
        var maxBoxPt = fromPointsMaxBoxPt;
        maxBoxPt.x = xMax.x;
        maxBoxPt.y = yMax.y;
        maxBoxPt.z = zMax.z;
        var naiveCenter = Cartesian3.multiplyByScalar(Cartesian3.add(minBoxPt, maxBoxPt, fromPointsScratch), 0.5, fromPointsNaiveCenterScratch);
        var naiveRadius = 0;
        for (i = 0; i < numElements; i += 3) {
          currentPos.x = positionsHigh[i] + positionsLow[i];
          currentPos.y = positionsHigh[i + 1] + positionsLow[i + 1];
          currentPos.z = positionsHigh[i + 2] + positionsLow[i + 2];
          var r = Cartesian3.magnitude(Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch));
          if (r > naiveRadius) {
            naiveRadius = r;
          }
          var oldCenterToPointSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch));
          if (oldCenterToPointSquared > radiusSquared) {
            var oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
            ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
            radiusSquared = ritterRadius * ritterRadius;
            var oldToNew = oldCenterToPoint - ritterRadius;
            ritterCenter.x = (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) / oldCenterToPoint;
            ritterCenter.y = (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) / oldCenterToPoint;
            ritterCenter.z = (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) / oldCenterToPoint;
          }
        }
        if (ritterRadius < naiveRadius) {
          Cartesian3.clone(ritterCenter, result.center);
          result.radius = ritterRadius;
        } else {
          Cartesian3.clone(naiveCenter, result.center);
          result.radius = naiveRadius;
        }
        return result;
      };
      BoundingSphere.fromCornerPoints = function(corner, oppositeCorner, result) {
        if (!defined(corner) || !defined(oppositeCorner)) {
          throw new DeveloperError('corner and oppositeCorner are required.');
        }
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        var center = result.center;
        Cartesian3.add(corner, oppositeCorner, center);
        Cartesian3.multiplyByScalar(center, 0.5, center);
        result.radius = Cartesian3.distance(center, oppositeCorner);
        return result;
      };
      BoundingSphere.fromEllipsoid = function(ellipsoid, result) {
        if (!defined(ellipsoid)) {
          throw new DeveloperError('ellipsoid is required.');
        }
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        Cartesian3.clone(Cartesian3.ZERO, result.center);
        result.radius = ellipsoid.maximumRadius;
        return result;
      };
      var fromBoundingSpheresScratch = new Cartesian3();
      BoundingSphere.fromBoundingSpheres = function(boundingSpheres, result) {
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        if (!defined(boundingSpheres) || boundingSpheres.length === 0) {
          result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
          result.radius = 0.0;
          return result;
        }
        var length = boundingSpheres.length;
        if (length === 1) {
          return BoundingSphere.clone(boundingSpheres[0], result);
        }
        if (length === 2) {
          return BoundingSphere.union(boundingSpheres[0], boundingSpheres[1], result);
        }
        var positions = [];
        for (var i = 0; i < length; i++) {
          positions.push(boundingSpheres[i].center);
        }
        result = BoundingSphere.fromPoints(positions, result);
        var center = result.center;
        var radius = result.radius;
        for (i = 0; i < length; i++) {
          var tmp = boundingSpheres[i];
          radius = Math.max(radius, Cartesian3.distance(center, tmp.center, fromBoundingSpheresScratch) + tmp.radius);
        }
        result.radius = radius;
        return result;
      };
      var fromOrientedBoundingBoxScratchU = new Cartesian3();
      var fromOrientedBoundingBoxScratchV = new Cartesian3();
      var fromOrientedBoundingBoxScratchW = new Cartesian3();
      BoundingSphere.fromOrientedBoundingBox = function(orientedBoundingBox, result) {
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        var halfAxes = orientedBoundingBox.halfAxes;
        var u = Matrix3.getColumn(halfAxes, 0, fromOrientedBoundingBoxScratchU);
        var v = Matrix3.getColumn(halfAxes, 1, fromOrientedBoundingBoxScratchV);
        var w = Matrix3.getColumn(halfAxes, 2, fromOrientedBoundingBoxScratchW);
        var uHalf = Cartesian3.magnitude(u);
        var vHalf = Cartesian3.magnitude(v);
        var wHalf = Cartesian3.magnitude(w);
        result.center = Cartesian3.clone(orientedBoundingBox.center, result.center);
        result.radius = Math.max(uHalf, vHalf, wHalf);
        return result;
      };
      BoundingSphere.clone = function(sphere, result) {
        if (!defined(sphere)) {
          return undefined;
        }
        if (!defined(result)) {
          return new BoundingSphere(sphere.center, sphere.radius);
        }
        result.center = Cartesian3.clone(sphere.center, result.center);
        result.radius = sphere.radius;
        return result;
      };
      BoundingSphere.packedLength = 4;
      BoundingSphere.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        var center = value.center;
        array[startingIndex++] = center.x;
        array[startingIndex++] = center.y;
        array[startingIndex++] = center.z;
        array[startingIndex] = value.radius;
      };
      BoundingSphere.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        var center = result.center;
        center.x = array[startingIndex++];
        center.y = array[startingIndex++];
        center.z = array[startingIndex++];
        result.radius = array[startingIndex];
        return result;
      };
      var unionScratch = new Cartesian3();
      var unionScratchCenter = new Cartesian3();
      BoundingSphere.union = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required.');
        }
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        var leftCenter = left.center;
        var leftRadius = left.radius;
        var rightCenter = right.center;
        var rightRadius = right.radius;
        var toRightCenter = Cartesian3.subtract(rightCenter, leftCenter, unionScratch);
        var centerSeparation = Cartesian3.magnitude(toRightCenter);
        if (leftRadius >= (centerSeparation + rightRadius)) {
          left.clone(result);
          return result;
        }
        if (rightRadius >= (centerSeparation + leftRadius)) {
          right.clone(result);
          return result;
        }
        var halfDistanceBetweenTangentPoints = (leftRadius + centerSeparation + rightRadius) * 0.5;
        var center = Cartesian3.multiplyByScalar(toRightCenter, (-leftRadius + halfDistanceBetweenTangentPoints) / centerSeparation, unionScratchCenter);
        Cartesian3.add(center, leftCenter, center);
        Cartesian3.clone(center, result.center);
        result.radius = halfDistanceBetweenTangentPoints;
        return result;
      };
      var expandScratch = new Cartesian3();
      BoundingSphere.expand = function(sphere, point, result) {
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        if (!defined(point)) {
          throw new DeveloperError('point is required.');
        }
        result = BoundingSphere.clone(sphere, result);
        var radius = Cartesian3.magnitude(Cartesian3.subtract(point, result.center, expandScratch));
        if (radius > result.radius) {
          result.radius = radius;
        }
        return result;
      };
      BoundingSphere.intersectPlane = function(sphere, plane) {
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        if (!defined(plane)) {
          throw new DeveloperError('plane is required.');
        }
        var center = sphere.center;
        var radius = sphere.radius;
        var normal = plane.normal;
        var distanceToPlane = Cartesian3.dot(normal, center) + plane.distance;
        if (distanceToPlane < -radius) {
          return Intersect.OUTSIDE;
        } else if (distanceToPlane < radius) {
          return Intersect.INTERSECTING;
        }
        return Intersect.INSIDE;
      };
      BoundingSphere.transform = function(sphere, transform, result) {
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        if (!defined(transform)) {
          throw new DeveloperError('transform is required.');
        }
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        result.center = Matrix4.multiplyByPoint(transform, sphere.center, result.center);
        result.radius = Matrix4.getMaximumScale(transform) * sphere.radius;
        return result;
      };
      var distanceSquaredToScratch = new Cartesian3();
      BoundingSphere.distanceSquaredTo = function(sphere, cartesian) {
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        var diff = Cartesian3.subtract(sphere.center, cartesian, distanceSquaredToScratch);
        return Cartesian3.magnitudeSquared(diff) - sphere.radius * sphere.radius;
      };
      BoundingSphere.transformWithoutScale = function(sphere, transform, result) {
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        if (!defined(transform)) {
          throw new DeveloperError('transform is required.');
        }
        if (!defined(result)) {
          result = new BoundingSphere();
        }
        result.center = Matrix4.multiplyByPoint(transform, sphere.center, result.center);
        result.radius = sphere.radius;
        return result;
      };
      var scratchCartesian3 = new Cartesian3();
      BoundingSphere.computePlaneDistances = function(sphere, position, direction, result) {
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        if (!defined(position)) {
          throw new DeveloperError('position is required.');
        }
        if (!defined(direction)) {
          throw new DeveloperError('direction is required.');
        }
        if (!defined(result)) {
          result = new Interval();
        }
        var toCenter = Cartesian3.subtract(sphere.center, position, scratchCartesian3);
        var mag = Cartesian3.dot(direction, toCenter);
        result.start = mag - sphere.radius;
        result.stop = mag + sphere.radius;
        return result;
      };
      var projectTo2DNormalScratch = new Cartesian3();
      var projectTo2DEastScratch = new Cartesian3();
      var projectTo2DNorthScratch = new Cartesian3();
      var projectTo2DWestScratch = new Cartesian3();
      var projectTo2DSouthScratch = new Cartesian3();
      var projectTo2DCartographicScratch = new Cartographic();
      var projectTo2DPositionsScratch = new Array(8);
      for (var n = 0; n < 8; ++n) {
        projectTo2DPositionsScratch[n] = new Cartesian3();
      }
      var projectTo2DProjection = new GeographicProjection();
      BoundingSphere.projectTo2D = function(sphere, projection, result) {
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        projection = defaultValue(projection, projectTo2DProjection);
        var ellipsoid = projection.ellipsoid;
        var center = sphere.center;
        var radius = sphere.radius;
        var normal = ellipsoid.geodeticSurfaceNormal(center, projectTo2DNormalScratch);
        var east = Cartesian3.cross(Cartesian3.UNIT_Z, normal, projectTo2DEastScratch);
        Cartesian3.normalize(east, east);
        var north = Cartesian3.cross(normal, east, projectTo2DNorthScratch);
        Cartesian3.normalize(north, north);
        Cartesian3.multiplyByScalar(normal, radius, normal);
        Cartesian3.multiplyByScalar(north, radius, north);
        Cartesian3.multiplyByScalar(east, radius, east);
        var south = Cartesian3.negate(north, projectTo2DSouthScratch);
        var west = Cartesian3.negate(east, projectTo2DWestScratch);
        var positions = projectTo2DPositionsScratch;
        var corner = positions[0];
        Cartesian3.add(normal, north, corner);
        Cartesian3.add(corner, east, corner);
        corner = positions[1];
        Cartesian3.add(normal, north, corner);
        Cartesian3.add(corner, west, corner);
        corner = positions[2];
        Cartesian3.add(normal, south, corner);
        Cartesian3.add(corner, west, corner);
        corner = positions[3];
        Cartesian3.add(normal, south, corner);
        Cartesian3.add(corner, east, corner);
        Cartesian3.negate(normal, normal);
        corner = positions[4];
        Cartesian3.add(normal, north, corner);
        Cartesian3.add(corner, east, corner);
        corner = positions[5];
        Cartesian3.add(normal, north, corner);
        Cartesian3.add(corner, west, corner);
        corner = positions[6];
        Cartesian3.add(normal, south, corner);
        Cartesian3.add(corner, west, corner);
        corner = positions[7];
        Cartesian3.add(normal, south, corner);
        Cartesian3.add(corner, east, corner);
        var length = positions.length;
        for (var i = 0; i < length; ++i) {
          var position = positions[i];
          Cartesian3.add(center, position, position);
          var cartographic = ellipsoid.cartesianToCartographic(position, projectTo2DCartographicScratch);
          projection.project(cartographic, position);
        }
        result = BoundingSphere.fromPoints(positions, result);
        center = result.center;
        var x = center.x;
        var y = center.y;
        var z = center.z;
        center.x = z;
        center.y = x;
        center.z = y;
        return result;
      };
      BoundingSphere.isOccluded = function(sphere, occluder) {
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        if (!defined(occluder)) {
          throw new DeveloperError('occluder is required.');
        }
        return !occluder.isBoundingSphereVisible(sphere);
      };
      BoundingSphere.equals = function(left, right) {
        return (left === right) || ((defined(left)) && (defined(right)) && Cartesian3.equals(left.center, right.center) && left.radius === right.radius);
      };
      BoundingSphere.prototype.intersectPlane = function(plane) {
        return BoundingSphere.intersectPlane(this, plane);
      };
      BoundingSphere.prototype.distanceSquaredTo = function(cartesian) {
        return BoundingSphere.distanceSquaredTo(this, cartesian);
      };
      BoundingSphere.prototype.computePlaneDistances = function(position, direction, result) {
        return BoundingSphere.computePlaneDistances(this, position, direction, result);
      };
      BoundingSphere.prototype.isOccluded = function(occluder) {
        return BoundingSphere.isOccluded(this, occluder);
      };
      BoundingSphere.prototype.equals = function(right) {
        return BoundingSphere.equals(this, right);
      };
      BoundingSphere.prototype.clone = function(result) {
        return BoundingSphere.clone(this, result);
      };
      return BoundingSphere;
    });
    define('Renderer/WebGLConstants', ['../Core/freezeObject'], function(freezeObject) {
      'use strict';
      var WebGLConstants = {
        DEPTH_BUFFER_BIT: 0x00000100,
        STENCIL_BUFFER_BIT: 0x00000400,
        COLOR_BUFFER_BIT: 0x00004000,
        POINTS: 0x0000,
        LINES: 0x0001,
        LINE_LOOP: 0x0002,
        LINE_STRIP: 0x0003,
        TRIANGLES: 0x0004,
        TRIANGLE_STRIP: 0x0005,
        TRIANGLE_FAN: 0x0006,
        ZERO: 0,
        ONE: 1,
        SRC_COLOR: 0x0300,
        ONE_MINUS_SRC_COLOR: 0x0301,
        SRC_ALPHA: 0x0302,
        ONE_MINUS_SRC_ALPHA: 0x0303,
        DST_ALPHA: 0x0304,
        ONE_MINUS_DST_ALPHA: 0x0305,
        DST_COLOR: 0x0306,
        ONE_MINUS_DST_COLOR: 0x0307,
        SRC_ALPHA_SATURATE: 0x0308,
        FUNC_ADD: 0x8006,
        BLEND_EQUATION: 0x8009,
        BLEND_EQUATION_RGB: 0x8009,
        BLEND_EQUATION_ALPHA: 0x883D,
        FUNC_SUBTRACT: 0x800A,
        FUNC_REVERSE_SUBTRACT: 0x800B,
        BLEND_DST_RGB: 0x80C8,
        BLEND_SRC_RGB: 0x80C9,
        BLEND_DST_ALPHA: 0x80CA,
        BLEND_SRC_ALPHA: 0x80CB,
        CONSTANT_COLOR: 0x8001,
        ONE_MINUS_CONSTANT_COLOR: 0x8002,
        CONSTANT_ALPHA: 0x8003,
        ONE_MINUS_CONSTANT_ALPHA: 0x8004,
        BLEND_COLOR: 0x8005,
        ARRAY_BUFFER: 0x8892,
        ELEMENT_ARRAY_BUFFER: 0x8893,
        ARRAY_BUFFER_BINDING: 0x8894,
        ELEMENT_ARRAY_BUFFER_BINDING: 0x8895,
        STREAM_DRAW: 0x88E0,
        STATIC_DRAW: 0x88E4,
        DYNAMIC_DRAW: 0x88E8,
        BUFFER_SIZE: 0x8764,
        BUFFER_USAGE: 0x8765,
        CURRENT_VERTEX_ATTRIB: 0x8626,
        FRONT: 0x0404,
        BACK: 0x0405,
        FRONT_AND_BACK: 0x0408,
        CULL_FACE: 0x0B44,
        BLEND: 0x0BE2,
        DITHER: 0x0BD0,
        STENCIL_TEST: 0x0B90,
        DEPTH_TEST: 0x0B71,
        SCISSOR_TEST: 0x0C11,
        POLYGON_OFFSET_FILL: 0x8037,
        SAMPLE_ALPHA_TO_COVERAGE: 0x809E,
        SAMPLE_COVERAGE: 0x80A0,
        NO_ERROR: 0,
        INVALID_ENUM: 0x0500,
        INVALID_VALUE: 0x0501,
        INVALID_OPERATION: 0x0502,
        OUT_OF_MEMORY: 0x0505,
        CW: 0x0900,
        CCW: 0x0901,
        LINE_WIDTH: 0x0B21,
        ALIASED_POINT_SIZE_RANGE: 0x846D,
        ALIASED_LINE_WIDTH_RANGE: 0x846E,
        CULL_FACE_MODE: 0x0B45,
        FRONT_FACE: 0x0B46,
        DEPTH_RANGE: 0x0B70,
        DEPTH_WRITEMASK: 0x0B72,
        DEPTH_CLEAR_VALUE: 0x0B73,
        DEPTH_FUNC: 0x0B74,
        STENCIL_CLEAR_VALUE: 0x0B91,
        STENCIL_FUNC: 0x0B92,
        STENCIL_FAIL: 0x0B94,
        STENCIL_PASS_DEPTH_FAIL: 0x0B95,
        STENCIL_PASS_DEPTH_PASS: 0x0B96,
        STENCIL_REF: 0x0B97,
        STENCIL_VALUE_MASK: 0x0B93,
        STENCIL_WRITEMASK: 0x0B98,
        STENCIL_BACK_FUNC: 0x8800,
        STENCIL_BACK_FAIL: 0x8801,
        STENCIL_BACK_PASS_DEPTH_FAIL: 0x8802,
        STENCIL_BACK_PASS_DEPTH_PASS: 0x8803,
        STENCIL_BACK_REF: 0x8CA3,
        STENCIL_BACK_VALUE_MASK: 0x8CA4,
        STENCIL_BACK_WRITEMASK: 0x8CA5,
        VIEWPORT: 0x0BA2,
        SCISSOR_BOX: 0x0C10,
        COLOR_CLEAR_VALUE: 0x0C22,
        COLOR_WRITEMASK: 0x0C23,
        UNPACK_ALIGNMENT: 0x0CF5,
        PACK_ALIGNMENT: 0x0D05,
        MAX_TEXTURE_SIZE: 0x0D33,
        MAX_VIEWPORT_DIMS: 0x0D3A,
        SUBPIXEL_BITS: 0x0D50,
        RED_BITS: 0x0D52,
        GREEN_BITS: 0x0D53,
        BLUE_BITS: 0x0D54,
        ALPHA_BITS: 0x0D55,
        DEPTH_BITS: 0x0D56,
        STENCIL_BITS: 0x0D57,
        POLYGON_OFFSET_UNITS: 0x2A00,
        POLYGON_OFFSET_FACTOR: 0x8038,
        TEXTURE_BINDING_2D: 0x8069,
        SAMPLE_BUFFERS: 0x80A8,
        SAMPLES: 0x80A9,
        SAMPLE_COVERAGE_VALUE: 0x80AA,
        SAMPLE_COVERAGE_INVERT: 0x80AB,
        COMPRESSED_TEXTURE_FORMATS: 0x86A3,
        DONT_CARE: 0x1100,
        FASTEST: 0x1101,
        NICEST: 0x1102,
        GENERATE_MIPMAP_HINT: 0x8192,
        BYTE: 0x1400,
        UNSIGNED_BYTE: 0x1401,
        SHORT: 0x1402,
        UNSIGNED_SHORT: 0x1403,
        INT: 0x1404,
        UNSIGNED_INT: 0x1405,
        FLOAT: 0x1406,
        DEPTH_COMPONENT: 0x1902,
        ALPHA: 0x1906,
        RGB: 0x1907,
        RGBA: 0x1908,
        LUMINANCE: 0x1909,
        LUMINANCE_ALPHA: 0x190A,
        UNSIGNED_SHORT_4_4_4_4: 0x8033,
        UNSIGNED_SHORT_5_5_5_1: 0x8034,
        UNSIGNED_SHORT_5_6_5: 0x8363,
        FRAGMENT_SHADER: 0x8B30,
        VERTEX_SHADER: 0x8B31,
        MAX_VERTEX_ATTRIBS: 0x8869,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB,
        MAX_VARYING_VECTORS: 0x8DFC,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
        MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C,
        MAX_TEXTURE_IMAGE_UNITS: 0x8872,
        MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFD,
        SHADER_TYPE: 0x8B4F,
        DELETE_STATUS: 0x8B80,
        LINK_STATUS: 0x8B82,
        VALIDATE_STATUS: 0x8B83,
        ATTACHED_SHADERS: 0x8B85,
        ACTIVE_UNIFORMS: 0x8B86,
        ACTIVE_ATTRIBUTES: 0x8B89,
        SHADING_LANGUAGE_VERSION: 0x8B8C,
        CURRENT_PROGRAM: 0x8B8D,
        NEVER: 0x0200,
        LESS: 0x0201,
        EQUAL: 0x0202,
        LEQUAL: 0x0203,
        GREATER: 0x0204,
        NOTEQUAL: 0x0205,
        GEQUAL: 0x0206,
        ALWAYS: 0x0207,
        KEEP: 0x1E00,
        REPLACE: 0x1E01,
        INCR: 0x1E02,
        DECR: 0x1E03,
        INVERT: 0x150A,
        INCR_WRAP: 0x8507,
        DECR_WRAP: 0x8508,
        VENDOR: 0x1F00,
        RENDERER: 0x1F01,
        VERSION: 0x1F02,
        NEAREST: 0x2600,
        LINEAR: 0x2601,
        NEAREST_MIPMAP_NEAREST: 0x2700,
        LINEAR_MIPMAP_NEAREST: 0x2701,
        NEAREST_MIPMAP_LINEAR: 0x2702,
        LINEAR_MIPMAP_LINEAR: 0x2703,
        TEXTURE_MAG_FILTER: 0x2800,
        TEXTURE_MIN_FILTER: 0x2801,
        TEXTURE_WRAP_S: 0x2802,
        TEXTURE_WRAP_T: 0x2803,
        TEXTURE_2D: 0x0DE1,
        TEXTURE: 0x1702,
        TEXTURE_CUBE_MAP: 0x8513,
        TEXTURE_BINDING_CUBE_MAP: 0x8514,
        TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
        TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
        TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517,
        TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518,
        TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519,
        TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851A,
        MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C,
        TEXTURE0: 0x84C0,
        TEXTURE1: 0x84C1,
        TEXTURE2: 0x84C2,
        TEXTURE3: 0x84C3,
        TEXTURE4: 0x84C4,
        TEXTURE5: 0x84C5,
        TEXTURE6: 0x84C6,
        TEXTURE7: 0x84C7,
        TEXTURE8: 0x84C8,
        TEXTURE9: 0x84C9,
        TEXTURE10: 0x84CA,
        TEXTURE11: 0x84CB,
        TEXTURE12: 0x84CC,
        TEXTURE13: 0x84CD,
        TEXTURE14: 0x84CE,
        TEXTURE15: 0x84CF,
        TEXTURE16: 0x84D0,
        TEXTURE17: 0x84D1,
        TEXTURE18: 0x84D2,
        TEXTURE19: 0x84D3,
        TEXTURE20: 0x84D4,
        TEXTURE21: 0x84D5,
        TEXTURE22: 0x84D6,
        TEXTURE23: 0x84D7,
        TEXTURE24: 0x84D8,
        TEXTURE25: 0x84D9,
        TEXTURE26: 0x84DA,
        TEXTURE27: 0x84DB,
        TEXTURE28: 0x84DC,
        TEXTURE29: 0x84DD,
        TEXTURE30: 0x84DE,
        TEXTURE31: 0x84DF,
        ACTIVE_TEXTURE: 0x84E0,
        REPEAT: 0x2901,
        CLAMP_TO_EDGE: 0x812F,
        MIRRORED_REPEAT: 0x8370,
        FLOAT_VEC2: 0x8B50,
        FLOAT_VEC3: 0x8B51,
        FLOAT_VEC4: 0x8B52,
        INT_VEC2: 0x8B53,
        INT_VEC3: 0x8B54,
        INT_VEC4: 0x8B55,
        BOOL: 0x8B56,
        BOOL_VEC2: 0x8B57,
        BOOL_VEC3: 0x8B58,
        BOOL_VEC4: 0x8B59,
        FLOAT_MAT2: 0x8B5A,
        FLOAT_MAT3: 0x8B5B,
        FLOAT_MAT4: 0x8B5C,
        SAMPLER_2D: 0x8B5E,
        SAMPLER_CUBE: 0x8B60,
        VERTEX_ATTRIB_ARRAY_ENABLED: 0x8622,
        VERTEX_ATTRIB_ARRAY_SIZE: 0x8623,
        VERTEX_ATTRIB_ARRAY_STRIDE: 0x8624,
        VERTEX_ATTRIB_ARRAY_TYPE: 0x8625,
        VERTEX_ATTRIB_ARRAY_NORMALIZED: 0x886A,
        VERTEX_ATTRIB_ARRAY_POINTER: 0x8645,
        VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 0x889F,
        IMPLEMENTATION_COLOR_READ_TYPE: 0x8B9A,
        IMPLEMENTATION_COLOR_READ_FORMAT: 0x8B9B,
        COMPILE_STATUS: 0x8B81,
        LOW_FLOAT: 0x8DF0,
        MEDIUM_FLOAT: 0x8DF1,
        HIGH_FLOAT: 0x8DF2,
        LOW_INT: 0x8DF3,
        MEDIUM_INT: 0x8DF4,
        HIGH_INT: 0x8DF5,
        FRAMEBUFFER: 0x8D40,
        RENDERBUFFER: 0x8D41,
        RGBA4: 0x8056,
        RGB5_A1: 0x8057,
        RGB565: 0x8D62,
        DEPTH_COMPONENT16: 0x81A5,
        STENCIL_INDEX: 0x1901,
        STENCIL_INDEX8: 0x8D48,
        DEPTH_STENCIL: 0x84F9,
        RENDERBUFFER_WIDTH: 0x8D42,
        RENDERBUFFER_HEIGHT: 0x8D43,
        RENDERBUFFER_INTERNAL_FORMAT: 0x8D44,
        RENDERBUFFER_RED_SIZE: 0x8D50,
        RENDERBUFFER_GREEN_SIZE: 0x8D51,
        RENDERBUFFER_BLUE_SIZE: 0x8D52,
        RENDERBUFFER_ALPHA_SIZE: 0x8D53,
        RENDERBUFFER_DEPTH_SIZE: 0x8D54,
        RENDERBUFFER_STENCIL_SIZE: 0x8D55,
        FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 0x8CD0,
        FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 0x8CD1,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 0x8CD2,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 0x8CD3,
        COLOR_ATTACHMENT0: 0x8CE0,
        DEPTH_ATTACHMENT: 0x8D00,
        STENCIL_ATTACHMENT: 0x8D20,
        DEPTH_STENCIL_ATTACHMENT: 0x821A,
        NONE: 0,
        FRAMEBUFFER_COMPLETE: 0x8CD5,
        FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 0x8CD6,
        FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 0x8CD7,
        FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 0x8CD9,
        FRAMEBUFFER_UNSUPPORTED: 0x8CDD,
        FRAMEBUFFER_BINDING: 0x8CA6,
        RENDERBUFFER_BINDING: 0x8CA7,
        MAX_RENDERBUFFER_SIZE: 0x84E8,
        INVALID_FRAMEBUFFER_OPERATION: 0x0506,
        UNPACK_FLIP_Y_WEBGL: 0x9240,
        UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
        CONTEXT_LOST_WEBGL: 0x9242,
        UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,
        BROWSER_DEFAULT_WEBGL: 0x9244,
        DOUBLE: 0x140A,
        READ_BUFFER: 0x0C02,
        UNPACK_ROW_LENGTH: 0x0CF2,
        UNPACK_SKIP_ROWS: 0x0CF3,
        UNPACK_SKIP_PIXELS: 0x0CF4,
        PACK_ROW_LENGTH: 0x0D02,
        PACK_SKIP_ROWS: 0x0D03,
        PACK_SKIP_PIXELS: 0x0D04,
        COLOR: 0x1800,
        DEPTH: 0x1801,
        STENCIL: 0x1802,
        RED: 0x1903,
        RGB8: 0x8051,
        RGBA8: 0x8058,
        RGB10_A2: 0x8059,
        TEXTURE_BINDING_3D: 0x806A,
        UNPACK_SKIP_IMAGES: 0x806D,
        UNPACK_IMAGE_HEIGHT: 0x806E,
        TEXTURE_3D: 0x806F,
        TEXTURE_WRAP_R: 0x8072,
        MAX_3D_TEXTURE_SIZE: 0x8073,
        UNSIGNED_INT_2_10_10_10_REV: 0x8368,
        MAX_ELEMENTS_VERTICES: 0x80E8,
        MAX_ELEMENTS_INDICES: 0x80E9,
        TEXTURE_MIN_LOD: 0x813A,
        TEXTURE_MAX_LOD: 0x813B,
        TEXTURE_BASE_LEVEL: 0x813C,
        TEXTURE_MAX_LEVEL: 0x813D,
        MIN: 0x8007,
        MAX: 0x8008,
        DEPTH_COMPONENT24: 0x81A6,
        MAX_TEXTURE_LOD_BIAS: 0x84FD,
        TEXTURE_COMPARE_MODE: 0x884C,
        TEXTURE_COMPARE_FUNC: 0x884D,
        CURRENT_QUERY: 0x8865,
        QUERY_RESULT: 0x8866,
        QUERY_RESULT_AVAILABLE: 0x8867,
        STREAM_READ: 0x88E1,
        STREAM_COPY: 0x88E2,
        STATIC_READ: 0x88E5,
        STATIC_COPY: 0x88E6,
        DYNAMIC_READ: 0x88E9,
        DYNAMIC_COPY: 0x88EA,
        MAX_DRAW_BUFFERS: 0x8824,
        DRAW_BUFFER0: 0x8825,
        DRAW_BUFFER1: 0x8826,
        DRAW_BUFFER2: 0x8827,
        DRAW_BUFFER3: 0x8828,
        DRAW_BUFFER4: 0x8829,
        DRAW_BUFFER5: 0x882A,
        DRAW_BUFFER6: 0x882B,
        DRAW_BUFFER7: 0x882C,
        DRAW_BUFFER8: 0x882D,
        DRAW_BUFFER9: 0x882E,
        DRAW_BUFFER10: 0x882F,
        DRAW_BUFFER11: 0x8830,
        DRAW_BUFFER12: 0x8831,
        DRAW_BUFFER13: 0x8832,
        DRAW_BUFFER14: 0x8833,
        DRAW_BUFFER15: 0x8834,
        MAX_FRAGMENT_UNIFORM_COMPONENTS: 0x8B49,
        MAX_VERTEX_UNIFORM_COMPONENTS: 0x8B4A,
        SAMPLER_3D: 0x8B5F,
        SAMPLER_2D_SHADOW: 0x8B62,
        FRAGMENT_SHADER_DERIVATIVE_HINT: 0x8B8B,
        PIXEL_PACK_BUFFER: 0x88EB,
        PIXEL_UNPACK_BUFFER: 0x88EC,
        PIXEL_PACK_BUFFER_BINDING: 0x88ED,
        PIXEL_UNPACK_BUFFER_BINDING: 0x88EF,
        FLOAT_MAT2x3: 0x8B65,
        FLOAT_MAT2x4: 0x8B66,
        FLOAT_MAT3x2: 0x8B67,
        FLOAT_MAT3x4: 0x8B68,
        FLOAT_MAT4x2: 0x8B69,
        FLOAT_MAT4x3: 0x8B6A,
        SRGB: 0x8C40,
        SRGB8: 0x8C41,
        SRGB8_ALPHA8: 0x8C43,
        COMPARE_REF_TO_TEXTURE: 0x884E,
        RGBA32F: 0x8814,
        RGB32F: 0x8815,
        RGBA16F: 0x881A,
        RGB16F: 0x881B,
        VERTEX_ATTRIB_ARRAY_INTEGER: 0x88FD,
        MAX_ARRAY_TEXTURE_LAYERS: 0x88FF,
        MIN_PROGRAM_TEXEL_OFFSET: 0x8904,
        MAX_PROGRAM_TEXEL_OFFSET: 0x8905,
        MAX_VARYING_COMPONENTS: 0x8B4B,
        TEXTURE_2D_ARRAY: 0x8C1A,
        TEXTURE_BINDING_2D_ARRAY: 0x8C1D,
        R11F_G11F_B10F: 0x8C3A,
        UNSIGNED_INT_10F_11F_11F_REV: 0x8C3B,
        RGB9_E5: 0x8C3D,
        UNSIGNED_INT_5_9_9_9_REV: 0x8C3E,
        TRANSFORM_FEEDBACK_BUFFER_MODE: 0x8C7F,
        MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: 0x8C80,
        TRANSFORM_FEEDBACK_VARYINGS: 0x8C83,
        TRANSFORM_FEEDBACK_BUFFER_START: 0x8C84,
        TRANSFORM_FEEDBACK_BUFFER_SIZE: 0x8C85,
        TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: 0x8C88,
        RASTERIZER_DISCARD: 0x8C89,
        MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: 0x8C8A,
        MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: 0x8C8B,
        INTERLEAVED_ATTRIBS: 0x8C8C,
        SEPARATE_ATTRIBS: 0x8C8D,
        TRANSFORM_FEEDBACK_BUFFER: 0x8C8E,
        TRANSFORM_FEEDBACK_BUFFER_BINDING: 0x8C8F,
        RGBA32UI: 0x8D70,
        RGB32UI: 0x8D71,
        RGBA16UI: 0x8D76,
        RGB16UI: 0x8D77,
        RGBA8UI: 0x8D7C,
        RGB8UI: 0x8D7D,
        RGBA32I: 0x8D82,
        RGB32I: 0x8D83,
        RGBA16I: 0x8D88,
        RGB16I: 0x8D89,
        RGBA8I: 0x8D8E,
        RGB8I: 0x8D8F,
        RED_INTEGER: 0x8D94,
        RGB_INTEGER: 0x8D98,
        RGBA_INTEGER: 0x8D99,
        SAMPLER_2D_ARRAY: 0x8DC1,
        SAMPLER_2D_ARRAY_SHADOW: 0x8DC4,
        SAMPLER_CUBE_SHADOW: 0x8DC5,
        UNSIGNED_INT_VEC2: 0x8DC6,
        UNSIGNED_INT_VEC3: 0x8DC7,
        UNSIGNED_INT_VEC4: 0x8DC8,
        INT_SAMPLER_2D: 0x8DCA,
        INT_SAMPLER_3D: 0x8DCB,
        INT_SAMPLER_CUBE: 0x8DCC,
        INT_SAMPLER_2D_ARRAY: 0x8DCF,
        UNSIGNED_INT_SAMPLER_2D: 0x8DD2,
        UNSIGNED_INT_SAMPLER_3D: 0x8DD3,
        UNSIGNED_INT_SAMPLER_CUBE: 0x8DD4,
        UNSIGNED_INT_SAMPLER_2D_ARRAY: 0x8DD7,
        DEPTH_COMPONENT32F: 0x8CAC,
        DEPTH32F_STENCIL8: 0x8CAD,
        FLOAT_32_UNSIGNED_INT_24_8_REV: 0x8DAD,
        FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: 0x8210,
        FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: 0x8211,
        FRAMEBUFFER_ATTACHMENT_RED_SIZE: 0x8212,
        FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: 0x8213,
        FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: 0x8214,
        FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: 0x8215,
        FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: 0x8216,
        FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: 0x8217,
        FRAMEBUFFER_DEFAULT: 0x8218,
        UNSIGNED_INT_24_8: 0x84FA,
        DEPTH24_STENCIL8: 0x88F0,
        UNSIGNED_NORMALIZED: 0x8C17,
        DRAW_FRAMEBUFFER_BINDING: 0x8CA6,
        READ_FRAMEBUFFER: 0x8CA8,
        DRAW_FRAMEBUFFER: 0x8CA9,
        READ_FRAMEBUFFER_BINDING: 0x8CAA,
        RENDERBUFFER_SAMPLES: 0x8CAB,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: 0x8CD4,
        MAX_COLOR_ATTACHMENTS: 0x8CDF,
        COLOR_ATTACHMENT1: 0x8CE1,
        COLOR_ATTACHMENT2: 0x8CE2,
        COLOR_ATTACHMENT3: 0x8CE3,
        COLOR_ATTACHMENT4: 0x8CE4,
        COLOR_ATTACHMENT5: 0x8CE5,
        COLOR_ATTACHMENT6: 0x8CE6,
        COLOR_ATTACHMENT7: 0x8CE7,
        COLOR_ATTACHMENT8: 0x8CE8,
        COLOR_ATTACHMENT9: 0x8CE9,
        COLOR_ATTACHMENT10: 0x8CEA,
        COLOR_ATTACHMENT11: 0x8CEB,
        COLOR_ATTACHMENT12: 0x8CEC,
        COLOR_ATTACHMENT13: 0x8CED,
        COLOR_ATTACHMENT14: 0x8CEE,
        COLOR_ATTACHMENT15: 0x8CEF,
        FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: 0x8D56,
        MAX_SAMPLES: 0x8D57,
        HALF_FLOAT: 0x140B,
        RG: 0x8227,
        RG_INTEGER: 0x8228,
        R8: 0x8229,
        RG8: 0x822B,
        R16F: 0x822D,
        R32F: 0x822E,
        RG16F: 0x822F,
        RG32F: 0x8230,
        R8I: 0x8231,
        R8UI: 0x8232,
        R16I: 0x8233,
        R16UI: 0x8234,
        R32I: 0x8235,
        R32UI: 0x8236,
        RG8I: 0x8237,
        RG8UI: 0x8238,
        RG16I: 0x8239,
        RG16UI: 0x823A,
        RG32I: 0x823B,
        RG32UI: 0x823C,
        VERTEX_ARRAY_BINDING: 0x85B5,
        R8_SNORM: 0x8F94,
        RG8_SNORM: 0x8F95,
        RGB8_SNORM: 0x8F96,
        RGBA8_SNORM: 0x8F97,
        SIGNED_NORMALIZED: 0x8F9C,
        COPY_READ_BUFFER: 0x8F36,
        COPY_WRITE_BUFFER: 0x8F37,
        COPY_READ_BUFFER_BINDING: 0x8F36,
        COPY_WRITE_BUFFER_BINDING: 0x8F37,
        UNIFORM_BUFFER: 0x8A11,
        UNIFORM_BUFFER_BINDING: 0x8A28,
        UNIFORM_BUFFER_START: 0x8A29,
        UNIFORM_BUFFER_SIZE: 0x8A2A,
        MAX_VERTEX_UNIFORM_BLOCKS: 0x8A2B,
        MAX_FRAGMENT_UNIFORM_BLOCKS: 0x8A2D,
        MAX_COMBINED_UNIFORM_BLOCKS: 0x8A2E,
        MAX_UNIFORM_BUFFER_BINDINGS: 0x8A2F,
        MAX_UNIFORM_BLOCK_SIZE: 0x8A30,
        MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: 0x8A31,
        MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: 0x8A33,
        UNIFORM_BUFFER_OFFSET_ALIGNMENT: 0x8A34,
        ACTIVE_UNIFORM_BLOCKS: 0x8A36,
        UNIFORM_TYPE: 0x8A37,
        UNIFORM_SIZE: 0x8A38,
        UNIFORM_BLOCK_INDEX: 0x8A3A,
        UNIFORM_OFFSET: 0x8A3B,
        UNIFORM_ARRAY_STRIDE: 0x8A3C,
        UNIFORM_MATRIX_STRIDE: 0x8A3D,
        UNIFORM_IS_ROW_MAJOR: 0x8A3E,
        UNIFORM_BLOCK_BINDING: 0x8A3F,
        UNIFORM_BLOCK_DATA_SIZE: 0x8A40,
        UNIFORM_BLOCK_ACTIVE_UNIFORMS: 0x8A42,
        UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: 0x8A43,
        UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: 0x8A44,
        UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: 0x8A46,
        INVALID_INDEX: 0xFFFFFFFF,
        MAX_VERTEX_OUTPUT_COMPONENTS: 0x9122,
        MAX_FRAGMENT_INPUT_COMPONENTS: 0x9125,
        MAX_SERVER_WAIT_TIMEOUT: 0x9111,
        OBJECT_TYPE: 0x9112,
        SYNC_CONDITION: 0x9113,
        SYNC_STATUS: 0x9114,
        SYNC_FLAGS: 0x9115,
        SYNC_FENCE: 0x9116,
        SYNC_GPU_COMMANDS_COMPLETE: 0x9117,
        UNSIGNALED: 0x9118,
        SIGNALED: 0x9119,
        ALREADY_SIGNALED: 0x911A,
        TIMEOUT_EXPIRED: 0x911B,
        CONDITION_SATISFIED: 0x911C,
        WAIT_FAILED: 0x911D,
        SYNC_FLUSH_COMMANDS_BIT: 0x00000001,
        VERTEX_ATTRIB_ARRAY_DIVISOR: 0x88FE,
        ANY_SAMPLES_PASSED: 0x8C2F,
        ANY_SAMPLES_PASSED_CONSERVATIVE: 0x8D6A,
        SAMPLER_BINDING: 0x8919,
        RGB10_A2UI: 0x906F,
        INT_2_10_10_10_REV: 0x8D9F,
        TRANSFORM_FEEDBACK: 0x8E22,
        TRANSFORM_FEEDBACK_PAUSED: 0x8E23,
        TRANSFORM_FEEDBACK_ACTIVE: 0x8E24,
        TRANSFORM_FEEDBACK_BINDING: 0x8E25,
        COMPRESSED_R11_EAC: 0x9270,
        COMPRESSED_SIGNED_R11_EAC: 0x9271,
        COMPRESSED_RG11_EAC: 0x9272,
        COMPRESSED_SIGNED_RG11_EAC: 0x9273,
        COMPRESSED_RGB8_ETC2: 0x9274,
        COMPRESSED_SRGB8_ETC2: 0x9275,
        COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: 0x9276,
        COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: 0x9277,
        COMPRESSED_RGBA8_ETC2_EAC: 0x9278,
        COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: 0x9279,
        TEXTURE_IMMUTABLE_FORMAT: 0x912F,
        MAX_ELEMENT_INDEX: 0x8D6B,
        TEXTURE_IMMUTABLE_LEVELS: 0x82DF
      };
      return freezeObject(WebGLConstants);
    });
    define('Core/Fullscreen', ['./defined', './defineProperties'], function(defined, defineProperties) {
      'use strict';
      var _supportsFullscreen;
      var _names = {
        requestFullscreen: undefined,
        exitFullscreen: undefined,
        fullscreenEnabled: undefined,
        fullscreenElement: undefined,
        fullscreenchange: undefined,
        fullscreenerror: undefined
      };
      var Fullscreen = {};
      defineProperties(Fullscreen, {
        element: {get: function() {
            if (!Fullscreen.supportsFullscreen()) {
              return undefined;
            }
            return document[_names.fullscreenElement];
          }},
        changeEventName: {get: function() {
            if (!Fullscreen.supportsFullscreen()) {
              return undefined;
            }
            return _names.fullscreenchange;
          }},
        errorEventName: {get: function() {
            if (!Fullscreen.supportsFullscreen()) {
              return undefined;
            }
            return _names.fullscreenerror;
          }},
        enabled: {get: function() {
            if (!Fullscreen.supportsFullscreen()) {
              return undefined;
            }
            return document[_names.fullscreenEnabled];
          }},
        fullscreen: {get: function() {
            if (!Fullscreen.supportsFullscreen()) {
              return undefined;
            }
            return Fullscreen.element !== null;
          }}
      });
      Fullscreen.supportsFullscreen = function() {
        if (defined(_supportsFullscreen)) {
          return _supportsFullscreen;
        }
        _supportsFullscreen = false;
        var body = document.body;
        if (typeof body.requestFullscreen === 'function') {
          _names.requestFullscreen = 'requestFullscreen';
          _names.exitFullscreen = 'exitFullscreen';
          _names.fullscreenEnabled = 'fullscreenEnabled';
          _names.fullscreenElement = 'fullscreenElement';
          _names.fullscreenchange = 'fullscreenchange';
          _names.fullscreenerror = 'fullscreenerror';
          _supportsFullscreen = true;
          return _supportsFullscreen;
        }
        var prefixes = ['webkit', 'moz', 'o', 'ms', 'khtml'];
        var name;
        for (var i = 0,
            len = prefixes.length; i < len; ++i) {
          var prefix = prefixes[i];
          name = prefix + 'RequestFullscreen';
          if (typeof body[name] === 'function') {
            _names.requestFullscreen = name;
            _supportsFullscreen = true;
          } else {
            name = prefix + 'RequestFullScreen';
            if (typeof body[name] === 'function') {
              _names.requestFullscreen = name;
              _supportsFullscreen = true;
            }
          }
          name = prefix + 'ExitFullscreen';
          if (typeof document[name] === 'function') {
            _names.exitFullscreen = name;
          } else {
            name = prefix + 'CancelFullScreen';
            if (typeof document[name] === 'function') {
              _names.exitFullscreen = name;
            }
          }
          name = prefix + 'FullscreenEnabled';
          if (defined(document[name])) {
            _names.fullscreenEnabled = name;
          } else {
            name = prefix + 'FullScreenEnabled';
            if (defined(document[name])) {
              _names.fullscreenEnabled = name;
            }
          }
          name = prefix + 'FullscreenElement';
          if (document[name] !== undefined) {
            _names.fullscreenElement = name;
          } else {
            name = prefix + 'FullScreenElement';
            if (defined(document[name])) {
              _names.fullscreenElement = name;
            }
          }
          name = prefix + 'fullscreenchange';
          if (document['on' + name] !== undefined) {
            if (prefix === 'ms') {
              name = 'MSFullscreenChange';
            }
            _names.fullscreenchange = name;
          }
          name = prefix + 'fullscreenerror';
          if (document['on' + name] !== undefined) {
            if (prefix === 'ms') {
              name = 'MSFullscreenError';
            }
            _names.fullscreenerror = name;
          }
        }
        return _supportsFullscreen;
      };
      Fullscreen.requestFullscreen = function(element, vrDevice) {
        if (!Fullscreen.supportsFullscreen()) {
          return;
        }
        element[_names.requestFullscreen]({vrDisplay: vrDevice});
      };
      Fullscreen.exitFullscreen = function() {
        if (!Fullscreen.supportsFullscreen()) {
          return;
        }
        document[_names.exitFullscreen]();
      };
      return Fullscreen;
    });
    define('Core/FeatureDetection', ['./defaultValue', './defined', './Fullscreen'], function(defaultValue, defined, Fullscreen) {
      'use strict';
      var theNavigator;
      if (typeof navigator !== 'undefined') {
        theNavigator = navigator;
      } else {
        theNavigator = {};
      }
      function extractVersion(versionString) {
        var parts = versionString.split('.');
        for (var i = 0,
            len = parts.length; i < len; ++i) {
          parts[i] = parseInt(parts[i], 10);
        }
        return parts;
      }
      var isChromeResult;
      var chromeVersionResult;
      function isChrome() {
        if (!defined(isChromeResult)) {
          isChromeResult = false;
          var fields = (/ Chrome\/([\.0-9]+)/).exec(theNavigator.userAgent);
          if (fields !== null) {
            isChromeResult = true;
            chromeVersionResult = extractVersion(fields[1]);
          }
        }
        return isChromeResult;
      }
      function chromeVersion() {
        return isChrome() && chromeVersionResult;
      }
      var isSafariResult;
      var safariVersionResult;
      function isSafari() {
        if (!defined(isSafariResult)) {
          isSafariResult = false;
          if (!isChrome() && (/ Safari\/[\.0-9]+/).test(theNavigator.userAgent)) {
            var fields = (/ Version\/([\.0-9]+)/).exec(theNavigator.userAgent);
            if (fields !== null) {
              isSafariResult = true;
              safariVersionResult = extractVersion(fields[1]);
            }
          }
        }
        return isSafariResult;
      }
      function safariVersion() {
        return isSafari() && safariVersionResult;
      }
      var isWebkitResult;
      var webkitVersionResult;
      function isWebkit() {
        if (!defined(isWebkitResult)) {
          isWebkitResult = false;
          var fields = (/ AppleWebKit\/([\.0-9]+)(\+?)/).exec(theNavigator.userAgent);
          if (fields !== null) {
            isWebkitResult = true;
            webkitVersionResult = extractVersion(fields[1]);
            webkitVersionResult.isNightly = !!fields[2];
          }
        }
        return isWebkitResult;
      }
      function webkitVersion() {
        return isWebkit() && webkitVersionResult;
      }
      var isInternetExplorerResult;
      var internetExplorerVersionResult;
      function isInternetExplorer() {
        if (!defined(isInternetExplorerResult)) {
          isInternetExplorerResult = false;
          var fields;
          if (theNavigator.appName === 'Microsoft Internet Explorer') {
            fields = /MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(theNavigator.userAgent);
            if (fields !== null) {
              isInternetExplorerResult = true;
              internetExplorerVersionResult = extractVersion(fields[1]);
            }
          } else if (theNavigator.appName === 'Netscape') {
            fields = /Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(theNavigator.userAgent);
            if (fields !== null) {
              isInternetExplorerResult = true;
              internetExplorerVersionResult = extractVersion(fields[1]);
            }
          }
        }
        return isInternetExplorerResult;
      }
      function internetExplorerVersion() {
        return isInternetExplorer() && internetExplorerVersionResult;
      }
      var isFirefoxResult;
      var firefoxVersionResult;
      function isFirefox() {
        if (!defined(isFirefoxResult)) {
          isFirefoxResult = false;
          var fields = /Firefox\/([\.0-9]+)/.exec(theNavigator.userAgent);
          if (fields !== null) {
            isFirefoxResult = true;
            firefoxVersionResult = extractVersion(fields[1]);
          }
        }
        return isFirefoxResult;
      }
      var isWindowsResult;
      function isWindows() {
        if (!defined(isWindowsResult)) {
          isWindowsResult = /Windows/i.test(theNavigator.appVersion);
        }
        return isWindowsResult;
      }
      function firefoxVersion() {
        return isFirefox() && firefoxVersionResult;
      }
      var hasPointerEvents;
      function supportsPointerEvents() {
        if (!defined(hasPointerEvents)) {
          hasPointerEvents = typeof PointerEvent !== 'undefined' && (!defined(theNavigator.pointerEnabled) || theNavigator.pointerEnabled);
        }
        return hasPointerEvents;
      }
      var imageRenderingValueResult;
      var supportsImageRenderingPixelatedResult;
      function supportsImageRenderingPixelated() {
        if (!defined(supportsImageRenderingPixelatedResult)) {
          var canvas = document.createElement('canvas');
          canvas.setAttribute('style', 'image-rendering: -moz-crisp-edges;' + 'image-rendering: pixelated;');
          var tmp = canvas.style.imageRendering;
          supportsImageRenderingPixelatedResult = defined(tmp) && tmp !== '';
          if (supportsImageRenderingPixelatedResult) {
            imageRenderingValueResult = tmp;
          }
        }
        return supportsImageRenderingPixelatedResult;
      }
      function imageRenderingValue() {
        return supportsImageRenderingPixelated() ? imageRenderingValueResult : undefined;
      }
      var FeatureDetection = {
        isChrome: isChrome,
        chromeVersion: chromeVersion,
        isSafari: isSafari,
        safariVersion: safariVersion,
        isWebkit: isWebkit,
        webkitVersion: webkitVersion,
        isInternetExplorer: isInternetExplorer,
        internetExplorerVersion: internetExplorerVersion,
        isFirefox: isFirefox,
        firefoxVersion: firefoxVersion,
        isWindows: isWindows,
        hardwareConcurrency: defaultValue(theNavigator.hardwareConcurrency, 3),
        supportsPointerEvents: supportsPointerEvents,
        supportsImageRenderingPixelated: supportsImageRenderingPixelated,
        imageRenderingValue: imageRenderingValue
      };
      FeatureDetection.supportsFullscreen = function() {
        return Fullscreen.supportsFullscreen();
      };
      FeatureDetection.supportsTypedArrays = function() {
        return typeof ArrayBuffer !== 'undefined';
      };
      FeatureDetection.supportsWebWorkers = function() {
        return typeof Worker !== 'undefined';
      };
      return FeatureDetection;
    });
    define('Core/ComponentDatatype', ['../Renderer/WebGLConstants', './defaultValue', './defined', './DeveloperError', './FeatureDetection', './freezeObject'], function(WebGLConstants, defaultValue, defined, DeveloperError, FeatureDetection, freezeObject) {
      'use strict';
      if (!FeatureDetection.supportsTypedArrays()) {
        return {};
      }
      var ComponentDatatype = {
        BYTE: WebGLConstants.BYTE,
        UNSIGNED_BYTE: WebGLConstants.UNSIGNED_BYTE,
        SHORT: WebGLConstants.SHORT,
        UNSIGNED_SHORT: WebGLConstants.UNSIGNED_SHORT,
        FLOAT: WebGLConstants.FLOAT,
        DOUBLE: WebGLConstants.DOUBLE
      };
      ComponentDatatype.getSizeInBytes = function(componentDatatype) {
        if (!defined(componentDatatype)) {
          throw new DeveloperError('value is required.');
        }
        switch (componentDatatype) {
          case ComponentDatatype.BYTE:
            return Int8Array.BYTES_PER_ELEMENT;
          case ComponentDatatype.UNSIGNED_BYTE:
            return Uint8Array.BYTES_PER_ELEMENT;
          case ComponentDatatype.SHORT:
            return Int16Array.BYTES_PER_ELEMENT;
          case ComponentDatatype.UNSIGNED_SHORT:
            return Uint16Array.BYTES_PER_ELEMENT;
          case ComponentDatatype.FLOAT:
            return Float32Array.BYTES_PER_ELEMENT;
          case ComponentDatatype.DOUBLE:
            return Float64Array.BYTES_PER_ELEMENT;
          default:
            throw new DeveloperError('componentDatatype is not a valid value.');
        }
      };
      ComponentDatatype.fromTypedArray = function(array) {
        if (array instanceof Int8Array) {
          return ComponentDatatype.BYTE;
        }
        if (array instanceof Uint8Array) {
          return ComponentDatatype.UNSIGNED_BYTE;
        }
        if (array instanceof Int16Array) {
          return ComponentDatatype.SHORT;
        }
        if (array instanceof Uint16Array) {
          return ComponentDatatype.UNSIGNED_SHORT;
        }
        if (array instanceof Float32Array) {
          return ComponentDatatype.FLOAT;
        }
        if (array instanceof Float64Array) {
          return ComponentDatatype.DOUBLE;
        }
      };
      ComponentDatatype.validate = function(componentDatatype) {
        return defined(componentDatatype) && (componentDatatype === ComponentDatatype.BYTE || componentDatatype === ComponentDatatype.UNSIGNED_BYTE || componentDatatype === ComponentDatatype.SHORT || componentDatatype === ComponentDatatype.UNSIGNED_SHORT || componentDatatype === ComponentDatatype.FLOAT || componentDatatype === ComponentDatatype.DOUBLE);
      };
      ComponentDatatype.createTypedArray = function(componentDatatype, valuesOrLength) {
        if (!defined(componentDatatype)) {
          throw new DeveloperError('componentDatatype is required.');
        }
        if (!defined(valuesOrLength)) {
          throw new DeveloperError('valuesOrLength is required.');
        }
        switch (componentDatatype) {
          case ComponentDatatype.BYTE:
            return new Int8Array(valuesOrLength);
          case ComponentDatatype.UNSIGNED_BYTE:
            return new Uint8Array(valuesOrLength);
          case ComponentDatatype.SHORT:
            return new Int16Array(valuesOrLength);
          case ComponentDatatype.UNSIGNED_SHORT:
            return new Uint16Array(valuesOrLength);
          case ComponentDatatype.FLOAT:
            return new Float32Array(valuesOrLength);
          case ComponentDatatype.DOUBLE:
            return new Float64Array(valuesOrLength);
          default:
            throw new DeveloperError('componentDatatype is not a valid value.');
        }
      };
      ComponentDatatype.createArrayBufferView = function(componentDatatype, buffer, byteOffset, length) {
        if (!defined(componentDatatype)) {
          throw new DeveloperError('componentDatatype is required.');
        }
        if (!defined(buffer)) {
          throw new DeveloperError('buffer is required.');
        }
        byteOffset = defaultValue(byteOffset, 0);
        length = defaultValue(length, (buffer.byteLength - byteOffset) / ComponentDatatype.getSizeInBytes(componentDatatype));
        switch (componentDatatype) {
          case ComponentDatatype.BYTE:
            return new Int8Array(buffer, byteOffset, length);
          case ComponentDatatype.UNSIGNED_BYTE:
            return new Uint8Array(buffer, byteOffset, length);
          case ComponentDatatype.SHORT:
            return new Int16Array(buffer, byteOffset, length);
          case ComponentDatatype.UNSIGNED_SHORT:
            return new Uint16Array(buffer, byteOffset, length);
          case ComponentDatatype.FLOAT:
            return new Float32Array(buffer, byteOffset, length);
          case ComponentDatatype.DOUBLE:
            return new Float64Array(buffer, byteOffset, length);
          default:
            throw new DeveloperError('componentDatatype is not a valid value.');
        }
      };
      return freezeObject(ComponentDatatype);
    });
    define('Core/CornerType', ['./freezeObject'], function(freezeObject) {
      'use strict';
      var CornerType = {
        ROUNDED: 0,
        MITERED: 1,
        BEVELED: 2
      };
      return freezeObject(CornerType);
    });
    define('Core/isArray', ['./defined'], function(defined) {
      'use strict';
      var isArray = Array.isArray;
      if (!defined(isArray)) {
        isArray = function(value) {
          return Object.prototype.toString.call(value) === '[object Array]';
        };
      }
      return isArray;
    });
    define('Core/EllipsoidGeodesic', ['./Cartesian3', './Cartographic', './defaultValue', './defined', './defineProperties', './DeveloperError', './Ellipsoid', './Math'], function(Cartesian3, Cartographic, defaultValue, defined, defineProperties, DeveloperError, Ellipsoid, CesiumMath) {
      'use strict';
      function setConstants(ellipsoidGeodesic) {
        var uSquared = ellipsoidGeodesic._uSquared;
        var a = ellipsoidGeodesic._ellipsoid.maximumRadius;
        var b = ellipsoidGeodesic._ellipsoid.minimumRadius;
        var f = (a - b) / a;
        var cosineHeading = Math.cos(ellipsoidGeodesic._startHeading);
        var sineHeading = Math.sin(ellipsoidGeodesic._startHeading);
        var tanU = (1 - f) * Math.tan(ellipsoidGeodesic._start.latitude);
        var cosineU = 1.0 / Math.sqrt(1.0 + tanU * tanU);
        var sineU = cosineU * tanU;
        var sigma = Math.atan2(tanU, cosineHeading);
        var sineAlpha = cosineU * sineHeading;
        var sineSquaredAlpha = sineAlpha * sineAlpha;
        var cosineSquaredAlpha = 1.0 - sineSquaredAlpha;
        var cosineAlpha = Math.sqrt(cosineSquaredAlpha);
        var u2Over4 = uSquared / 4.0;
        var u4Over16 = u2Over4 * u2Over4;
        var u6Over64 = u4Over16 * u2Over4;
        var u8Over256 = u4Over16 * u4Over16;
        var a0 = (1.0 + u2Over4 - 3.0 * u4Over16 / 4.0 + 5.0 * u6Over64 / 4.0 - 175.0 * u8Over256 / 64.0);
        var a1 = (1.0 - u2Over4 + 15.0 * u4Over16 / 8.0 - 35.0 * u6Over64 / 8.0);
        var a2 = (1.0 - 3.0 * u2Over4 + 35.0 * u4Over16 / 4.0);
        var a3 = (1.0 - 5.0 * u2Over4);
        var distanceRatio = a0 * sigma - a1 * Math.sin(2.0 * sigma) * u2Over4 / 2.0 - a2 * Math.sin(4.0 * sigma) * u4Over16 / 16.0 - a3 * Math.sin(6.0 * sigma) * u6Over64 / 48.0 - Math.sin(8.0 * sigma) * 5.0 * u8Over256 / 512;
        var constants = ellipsoidGeodesic._constants;
        constants.a = a;
        constants.b = b;
        constants.f = f;
        constants.cosineHeading = cosineHeading;
        constants.sineHeading = sineHeading;
        constants.tanU = tanU;
        constants.cosineU = cosineU;
        constants.sineU = sineU;
        constants.sigma = sigma;
        constants.sineAlpha = sineAlpha;
        constants.sineSquaredAlpha = sineSquaredAlpha;
        constants.cosineSquaredAlpha = cosineSquaredAlpha;
        constants.cosineAlpha = cosineAlpha;
        constants.u2Over4 = u2Over4;
        constants.u4Over16 = u4Over16;
        constants.u6Over64 = u6Over64;
        constants.u8Over256 = u8Over256;
        constants.a0 = a0;
        constants.a1 = a1;
        constants.a2 = a2;
        constants.a3 = a3;
        constants.distanceRatio = distanceRatio;
      }
      function computeC(f, cosineSquaredAlpha) {
        return f * cosineSquaredAlpha * (4.0 + f * (4.0 - 3.0 * cosineSquaredAlpha)) / 16.0;
      }
      function computeDeltaLambda(f, sineAlpha, cosineSquaredAlpha, sigma, sineSigma, cosineSigma, cosineTwiceSigmaMidpoint) {
        var C = computeC(f, cosineSquaredAlpha);
        return (1.0 - C) * f * sineAlpha * (sigma + C * sineSigma * (cosineTwiceSigmaMidpoint + C * cosineSigma * (2.0 * cosineTwiceSigmaMidpoint * cosineTwiceSigmaMidpoint - 1.0)));
      }
      function vincentyInverseFormula(ellipsoidGeodesic, major, minor, firstLongitude, firstLatitude, secondLongitude, secondLatitude) {
        var eff = (major - minor) / major;
        var l = secondLongitude - firstLongitude;
        var u1 = Math.atan((1 - eff) * Math.tan(firstLatitude));
        var u2 = Math.atan((1 - eff) * Math.tan(secondLatitude));
        var cosineU1 = Math.cos(u1);
        var sineU1 = Math.sin(u1);
        var cosineU2 = Math.cos(u2);
        var sineU2 = Math.sin(u2);
        var cc = cosineU1 * cosineU2;
        var cs = cosineU1 * sineU2;
        var ss = sineU1 * sineU2;
        var sc = sineU1 * cosineU2;
        var lambda = l;
        var lambdaDot = CesiumMath.TWO_PI;
        var cosineLambda = Math.cos(lambda);
        var sineLambda = Math.sin(lambda);
        var sigma;
        var cosineSigma;
        var sineSigma;
        var cosineSquaredAlpha;
        var cosineTwiceSigmaMidpoint;
        do {
          cosineLambda = Math.cos(lambda);
          sineLambda = Math.sin(lambda);
          var temp = cs - sc * cosineLambda;
          sineSigma = Math.sqrt(cosineU2 * cosineU2 * sineLambda * sineLambda + temp * temp);
          cosineSigma = ss + cc * cosineLambda;
          sigma = Math.atan2(sineSigma, cosineSigma);
          var sineAlpha;
          if (sineSigma === 0.0) {
            sineAlpha = 0.0;
            cosineSquaredAlpha = 1.0;
          } else {
            sineAlpha = cc * sineLambda / sineSigma;
            cosineSquaredAlpha = 1.0 - sineAlpha * sineAlpha;
          }
          lambdaDot = lambda;
          cosineTwiceSigmaMidpoint = cosineSigma - 2.0 * ss / cosineSquaredAlpha;
          if (isNaN(cosineTwiceSigmaMidpoint)) {
            cosineTwiceSigmaMidpoint = 0.0;
          }
          lambda = l + computeDeltaLambda(eff, sineAlpha, cosineSquaredAlpha, sigma, sineSigma, cosineSigma, cosineTwiceSigmaMidpoint);
        } while (Math.abs(lambda - lambdaDot) > CesiumMath.EPSILON12);
        var uSquared = cosineSquaredAlpha * (major * major - minor * minor) / (minor * minor);
        var A = 1.0 + uSquared * (4096.0 + uSquared * (uSquared * (320.0 - 175.0 * uSquared) - 768.0)) / 16384.0;
        var B = uSquared * (256.0 + uSquared * (uSquared * (74.0 - 47.0 * uSquared) - 128.0)) / 1024.0;
        var cosineSquaredTwiceSigmaMidpoint = cosineTwiceSigmaMidpoint * cosineTwiceSigmaMidpoint;
        var deltaSigma = B * sineSigma * (cosineTwiceSigmaMidpoint + B * (cosineSigma * (2.0 * cosineSquaredTwiceSigmaMidpoint - 1.0) - B * cosineTwiceSigmaMidpoint * (4.0 * sineSigma * sineSigma - 3.0) * (4.0 * cosineSquaredTwiceSigmaMidpoint - 3.0) / 6.0) / 4.0);
        var distance = minor * A * (sigma - deltaSigma);
        var startHeading = Math.atan2(cosineU2 * sineLambda, cs - sc * cosineLambda);
        var endHeading = Math.atan2(cosineU1 * sineLambda, cs * cosineLambda - sc);
        ellipsoidGeodesic._distance = distance;
        ellipsoidGeodesic._startHeading = startHeading;
        ellipsoidGeodesic._endHeading = endHeading;
        ellipsoidGeodesic._uSquared = uSquared;
      }
      function computeProperties(ellipsoidGeodesic, start, end, ellipsoid) {
        var firstCartesian = Cartesian3.normalize(ellipsoid.cartographicToCartesian(start, scratchCart2), scratchCart1);
        var lastCartesian = Cartesian3.normalize(ellipsoid.cartographicToCartesian(end, scratchCart2), scratchCart2);
        if (Math.abs(Math.abs(Cartesian3.angleBetween(firstCartesian, lastCartesian)) - Math.PI) < 0.0125) {
          throw new DeveloperError('geodesic position is not unique');
        }
        vincentyInverseFormula(ellipsoidGeodesic, ellipsoid.maximumRadius, ellipsoid.minimumRadius, start.longitude, start.latitude, end.longitude, end.latitude);
        ellipsoidGeodesic._start = Cartographic.clone(start, ellipsoidGeodesic._start);
        ellipsoidGeodesic._end = Cartographic.clone(end, ellipsoidGeodesic._end);
        ellipsoidGeodesic._start.height = 0;
        ellipsoidGeodesic._end.height = 0;
        setConstants(ellipsoidGeodesic);
      }
      var scratchCart1 = new Cartesian3();
      var scratchCart2 = new Cartesian3();
      function EllipsoidGeodesic(start, end, ellipsoid) {
        var e = defaultValue(ellipsoid, Ellipsoid.WGS84);
        this._ellipsoid = e;
        this._start = new Cartographic();
        this._end = new Cartographic();
        this._constants = {};
        this._startHeading = undefined;
        this._endHeading = undefined;
        this._distance = undefined;
        this._uSquared = undefined;
        if (defined(start) && defined(end)) {
          computeProperties(this, start, end, e);
        }
      }
      defineProperties(EllipsoidGeodesic.prototype, {
        ellipsoid: {get: function() {
            return this._ellipsoid;
          }},
        surfaceDistance: {get: function() {
            if (!defined(this._distance)) {
              throw new DeveloperError('set end positions before getting surfaceDistance');
            }
            return this._distance;
          }},
        start: {get: function() {
            return this._start;
          }},
        end: {get: function() {
            return this._end;
          }},
        startHeading: {get: function() {
            if (!defined(this._distance)) {
              throw new DeveloperError('set end positions before getting startHeading');
            }
            return this._startHeading;
          }},
        endHeading: {get: function() {
            if (!defined(this._distance)) {
              throw new DeveloperError('set end positions before getting endHeading');
            }
            return this._endHeading;
          }}
      });
      EllipsoidGeodesic.prototype.setEndPoints = function(start, end) {
        if (!defined(start)) {
          throw new DeveloperError('start cartographic position is required');
        }
        if (!defined(end)) {
          throw new DeveloperError('end cartgraphic position is required');
        }
        computeProperties(this, start, end, this._ellipsoid);
      };
      EllipsoidGeodesic.prototype.interpolateUsingFraction = function(fraction, result) {
        return this.interpolateUsingSurfaceDistance(this._distance * fraction, result);
      };
      EllipsoidGeodesic.prototype.interpolateUsingSurfaceDistance = function(distance, result) {
        if (!defined(this._distance)) {
          throw new DeveloperError('start and end must be set before calling funciton interpolateUsingSurfaceDistance');
        }
        var constants = this._constants;
        var s = constants.distanceRatio + distance / constants.b;
        var cosine2S = Math.cos(2.0 * s);
        var cosine4S = Math.cos(4.0 * s);
        var cosine6S = Math.cos(6.0 * s);
        var sine2S = Math.sin(2.0 * s);
        var sine4S = Math.sin(4.0 * s);
        var sine6S = Math.sin(6.0 * s);
        var sine8S = Math.sin(8.0 * s);
        var s2 = s * s;
        var s3 = s * s2;
        var u8Over256 = constants.u8Over256;
        var u2Over4 = constants.u2Over4;
        var u6Over64 = constants.u6Over64;
        var u4Over16 = constants.u4Over16;
        var sigma = 2.0 * s3 * u8Over256 * cosine2S / 3.0 + s * (1.0 - u2Over4 + 7.0 * u4Over16 / 4.0 - 15.0 * u6Over64 / 4.0 + 579.0 * u8Over256 / 64.0 - (u4Over16 - 15.0 * u6Over64 / 4.0 + 187.0 * u8Over256 / 16.0) * cosine2S - (5.0 * u6Over64 / 4.0 - 115.0 * u8Over256 / 16.0) * cosine4S - 29.0 * u8Over256 * cosine6S / 16.0) + (u2Over4 / 2.0 - u4Over16 + 71.0 * u6Over64 / 32.0 - 85.0 * u8Over256 / 16.0) * sine2S + (5.0 * u4Over16 / 16.0 - 5.0 * u6Over64 / 4.0 + 383.0 * u8Over256 / 96.0) * sine4S - s2 * ((u6Over64 - 11.0 * u8Over256 / 2.0) * sine2S + 5.0 * u8Over256 * sine4S / 2.0) + (29.0 * u6Over64 / 96.0 - 29.0 * u8Over256 / 16.0) * sine6S + 539.0 * u8Over256 * sine8S / 1536.0;
        var theta = Math.asin(Math.sin(sigma) * constants.cosineAlpha);
        var latitude = Math.atan(constants.a / constants.b * Math.tan(theta));
        sigma = sigma - constants.sigma;
        var cosineTwiceSigmaMidpoint = Math.cos(2.0 * constants.sigma + sigma);
        var sineSigma = Math.sin(sigma);
        var cosineSigma = Math.cos(sigma);
        var cc = constants.cosineU * cosineSigma;
        var ss = constants.sineU * sineSigma;
        var lambda = Math.atan2(sineSigma * constants.sineHeading, cc - ss * constants.cosineHeading);
        var l = lambda - computeDeltaLambda(constants.f, constants.sineAlpha, constants.cosineSquaredAlpha, sigma, sineSigma, cosineSigma, cosineTwiceSigmaMidpoint);
        if (defined(result)) {
          result.longitude = this._start.longitude + l;
          result.latitude = latitude;
          result.height = 0.0;
          return result;
        }
        return new Cartographic(this._start.longitude + l, latitude, 0.0);
      };
      return EllipsoidGeodesic;
    });
    define('Core/QuadraticRealPolynomial', ['./DeveloperError', './Math'], function(DeveloperError, CesiumMath) {
      'use strict';
      var QuadraticRealPolynomial = {};
      QuadraticRealPolynomial.computeDiscriminant = function(a, b, c) {
        if (typeof a !== 'number') {
          throw new DeveloperError('a is a required number.');
        }
        if (typeof b !== 'number') {
          throw new DeveloperError('b is a required number.');
        }
        if (typeof c !== 'number') {
          throw new DeveloperError('c is a required number.');
        }
        var discriminant = b * b - 4.0 * a * c;
        return discriminant;
      };
      function addWithCancellationCheck(left, right, tolerance) {
        var difference = left + right;
        if ((CesiumMath.sign(left) !== CesiumMath.sign(right)) && Math.abs(difference / Math.max(Math.abs(left), Math.abs(right))) < tolerance) {
          return 0.0;
        }
        return difference;
      }
      QuadraticRealPolynomial.computeRealRoots = function(a, b, c) {
        if (typeof a !== 'number') {
          throw new DeveloperError('a is a required number.');
        }
        if (typeof b !== 'number') {
          throw new DeveloperError('b is a required number.');
        }
        if (typeof c !== 'number') {
          throw new DeveloperError('c is a required number.');
        }
        var ratio;
        if (a === 0.0) {
          if (b === 0.0) {
            return [];
          }
          return [-c / b];
        } else if (b === 0.0) {
          if (c === 0.0) {
            return [0.0, 0.0];
          }
          var cMagnitude = Math.abs(c);
          var aMagnitude = Math.abs(a);
          if ((cMagnitude < aMagnitude) && (cMagnitude / aMagnitude < CesiumMath.EPSILON14)) {
            return [0.0, 0.0];
          } else if ((cMagnitude > aMagnitude) && (aMagnitude / cMagnitude < CesiumMath.EPSILON14)) {
            return [];
          }
          ratio = -c / a;
          if (ratio < 0.0) {
            return [];
          }
          var root = Math.sqrt(ratio);
          return [-root, root];
        } else if (c === 0.0) {
          ratio = -b / a;
          if (ratio < 0.0) {
            return [ratio, 0.0];
          }
          return [0.0, ratio];
        }
        var b2 = b * b;
        var four_ac = 4.0 * a * c;
        var radicand = addWithCancellationCheck(b2, -four_ac, CesiumMath.EPSILON14);
        if (radicand < 0.0) {
          return [];
        }
        var q = -0.5 * addWithCancellationCheck(b, CesiumMath.sign(b) * Math.sqrt(radicand), CesiumMath.EPSILON14);
        if (b > 0.0) {
          return [q / a, c / q];
        }
        return [c / q, q / a];
      };
      return QuadraticRealPolynomial;
    });
    define('Core/CubicRealPolynomial', ['./DeveloperError', './QuadraticRealPolynomial'], function(DeveloperError, QuadraticRealPolynomial) {
      'use strict';
      var CubicRealPolynomial = {};
      CubicRealPolynomial.computeDiscriminant = function(a, b, c, d) {
        if (typeof a !== 'number') {
          throw new DeveloperError('a is a required number.');
        }
        if (typeof b !== 'number') {
          throw new DeveloperError('b is a required number.');
        }
        if (typeof c !== 'number') {
          throw new DeveloperError('c is a required number.');
        }
        if (typeof d !== 'number') {
          throw new DeveloperError('d is a required number.');
        }
        var a2 = a * a;
        var b2 = b * b;
        var c2 = c * c;
        var d2 = d * d;
        var discriminant = 18.0 * a * b * c * d + b2 * c2 - 27.0 * a2 * d2 - 4.0 * (a * c2 * c + b2 * b * d);
        return discriminant;
      };
      function computeRealRoots(a, b, c, d) {
        var A = a;
        var B = b / 3.0;
        var C = c / 3.0;
        var D = d;
        var AC = A * C;
        var BD = B * D;
        var B2 = B * B;
        var C2 = C * C;
        var delta1 = A * C - B2;
        var delta2 = A * D - B * C;
        var delta3 = B * D - C2;
        var discriminant = 4.0 * delta1 * delta3 - delta2 * delta2;
        var temp;
        var temp1;
        if (discriminant < 0.0) {
          var ABar;
          var CBar;
          var DBar;
          if (B2 * BD >= AC * C2) {
            ABar = A;
            CBar = delta1;
            DBar = -2.0 * B * delta1 + A * delta2;
          } else {
            ABar = D;
            CBar = delta3;
            DBar = -D * delta2 + 2.0 * C * delta3;
          }
          var s = (DBar < 0.0) ? -1.0 : 1.0;
          var temp0 = -s * Math.abs(ABar) * Math.sqrt(-discriminant);
          temp1 = -DBar + temp0;
          var x = temp1 / 2.0;
          var p = x < 0.0 ? -Math.pow(-x, 1.0 / 3.0) : Math.pow(x, 1.0 / 3.0);
          var q = (temp1 === temp0) ? -p : -CBar / p;
          temp = (CBar <= 0.0) ? p + q : -DBar / (p * p + q * q + CBar);
          if (B2 * BD >= AC * C2) {
            return [(temp - B) / A];
          }
          return [-D / (temp + C)];
        }
        var CBarA = delta1;
        var DBarA = -2.0 * B * delta1 + A * delta2;
        var CBarD = delta3;
        var DBarD = -D * delta2 + 2.0 * C * delta3;
        var squareRootOfDiscriminant = Math.sqrt(discriminant);
        var halfSquareRootOf3 = Math.sqrt(3.0) / 2.0;
        var theta = Math.abs(Math.atan2(A * squareRootOfDiscriminant, -DBarA) / 3.0);
        temp = 2.0 * Math.sqrt(-CBarA);
        var cosine = Math.cos(theta);
        temp1 = temp * cosine;
        var temp3 = temp * (-cosine / 2.0 - halfSquareRootOf3 * Math.sin(theta));
        var numeratorLarge = (temp1 + temp3 > 2.0 * B) ? temp1 - B : temp3 - B;
        var denominatorLarge = A;
        var root1 = numeratorLarge / denominatorLarge;
        theta = Math.abs(Math.atan2(D * squareRootOfDiscriminant, -DBarD) / 3.0);
        temp = 2.0 * Math.sqrt(-CBarD);
        cosine = Math.cos(theta);
        temp1 = temp * cosine;
        temp3 = temp * (-cosine / 2.0 - halfSquareRootOf3 * Math.sin(theta));
        var numeratorSmall = -D;
        var denominatorSmall = (temp1 + temp3 < 2.0 * C) ? temp1 + C : temp3 + C;
        var root3 = numeratorSmall / denominatorSmall;
        var E = denominatorLarge * denominatorSmall;
        var F = -numeratorLarge * denominatorSmall - denominatorLarge * numeratorSmall;
        var G = numeratorLarge * numeratorSmall;
        var root2 = (C * F - B * G) / (-B * F + C * E);
        if (root1 <= root2) {
          if (root1 <= root3) {
            if (root2 <= root3) {
              return [root1, root2, root3];
            }
            return [root1, root3, root2];
          }
          return [root3, root1, root2];
        }
        if (root1 <= root3) {
          return [root2, root1, root3];
        }
        if (root2 <= root3) {
          return [root2, root3, root1];
        }
        return [root3, root2, root1];
      }
      CubicRealPolynomial.computeRealRoots = function(a, b, c, d) {
        if (typeof a !== 'number') {
          throw new DeveloperError('a is a required number.');
        }
        if (typeof b !== 'number') {
          throw new DeveloperError('b is a required number.');
        }
        if (typeof c !== 'number') {
          throw new DeveloperError('c is a required number.');
        }
        if (typeof d !== 'number') {
          throw new DeveloperError('d is a required number.');
        }
        var roots;
        var ratio;
        if (a === 0.0) {
          return QuadraticRealPolynomial.computeRealRoots(b, c, d);
        } else if (b === 0.0) {
          if (c === 0.0) {
            if (d === 0.0) {
              return [0.0, 0.0, 0.0];
            }
            ratio = -d / a;
            var root = (ratio < 0.0) ? -Math.pow(-ratio, 1.0 / 3.0) : Math.pow(ratio, 1.0 / 3.0);
            return [root, root, root];
          } else if (d === 0.0) {
            roots = QuadraticRealPolynomial.computeRealRoots(a, 0, c);
            if (roots.Length === 0) {
              return [0.0];
            }
            return [roots[0], 0.0, roots[1]];
          }
          return computeRealRoots(a, 0, c, d);
        } else if (c === 0.0) {
          if (d === 0.0) {
            ratio = -b / a;
            if (ratio < 0.0) {
              return [ratio, 0.0, 0.0];
            }
            return [0.0, 0.0, ratio];
          }
          return computeRealRoots(a, b, 0, d);
        } else if (d === 0.0) {
          roots = QuadraticRealPolynomial.computeRealRoots(a, b, c);
          if (roots.length === 0) {
            return [0.0];
          } else if (roots[1] <= 0.0) {
            return [roots[0], roots[1], 0.0];
          } else if (roots[0] >= 0.0) {
            return [0.0, roots[0], roots[1]];
          }
          return [roots[0], 0.0, roots[1]];
        }
        return computeRealRoots(a, b, c, d);
      };
      return CubicRealPolynomial;
    });
    define('Core/QuarticRealPolynomial', ['./CubicRealPolynomial', './DeveloperError', './Math', './QuadraticRealPolynomial'], function(CubicRealPolynomial, DeveloperError, CesiumMath, QuadraticRealPolynomial) {
      'use strict';
      var QuarticRealPolynomial = {};
      QuarticRealPolynomial.computeDiscriminant = function(a, b, c, d, e) {
        if (typeof a !== 'number') {
          throw new DeveloperError('a is a required number.');
        }
        if (typeof b !== 'number') {
          throw new DeveloperError('b is a required number.');
        }
        if (typeof c !== 'number') {
          throw new DeveloperError('c is a required number.');
        }
        if (typeof d !== 'number') {
          throw new DeveloperError('d is a required number.');
        }
        if (typeof e !== 'number') {
          throw new DeveloperError('e is a required number.');
        }
        var a2 = a * a;
        var a3 = a2 * a;
        var b2 = b * b;
        var b3 = b2 * b;
        var c2 = c * c;
        var c3 = c2 * c;
        var d2 = d * d;
        var d3 = d2 * d;
        var e2 = e * e;
        var e3 = e2 * e;
        var discriminant = (b2 * c2 * d2 - 4.0 * b3 * d3 - 4.0 * a * c3 * d2 + 18 * a * b * c * d3 - 27.0 * a2 * d2 * d2 + 256.0 * a3 * e3) + e * (18.0 * b3 * c * d - 4.0 * b2 * c3 + 16.0 * a * c2 * c2 - 80.0 * a * b * c2 * d - 6.0 * a * b2 * d2 + 144.0 * a2 * c * d2) + e2 * (144.0 * a * b2 * c - 27.0 * b2 * b2 - 128.0 * a2 * c2 - 192.0 * a2 * b * d);
        return discriminant;
      };
      function original(a3, a2, a1, a0) {
        var a3Squared = a3 * a3;
        var p = a2 - 3.0 * a3Squared / 8.0;
        var q = a1 - a2 * a3 / 2.0 + a3Squared * a3 / 8.0;
        var r = a0 - a1 * a3 / 4.0 + a2 * a3Squared / 16.0 - 3.0 * a3Squared * a3Squared / 256.0;
        var cubicRoots = CubicRealPolynomial.computeRealRoots(1.0, 2.0 * p, p * p - 4.0 * r, -q * q);
        if (cubicRoots.length > 0) {
          var temp = -a3 / 4.0;
          var hSquared = cubicRoots[cubicRoots.length - 1];
          if (Math.abs(hSquared) < CesiumMath.EPSILON14) {
            var roots = QuadraticRealPolynomial.computeRealRoots(1.0, p, r);
            if (roots.length === 2) {
              var root0 = roots[0];
              var root1 = roots[1];
              var y;
              if (root0 >= 0.0 && root1 >= 0.0) {
                var y0 = Math.sqrt(root0);
                var y1 = Math.sqrt(root1);
                return [temp - y1, temp - y0, temp + y0, temp + y1];
              } else if (root0 >= 0.0 && root1 < 0.0) {
                y = Math.sqrt(root0);
                return [temp - y, temp + y];
              } else if (root0 < 0.0 && root1 >= 0.0) {
                y = Math.sqrt(root1);
                return [temp - y, temp + y];
              }
            }
            return [];
          } else if (hSquared > 0.0) {
            var h = Math.sqrt(hSquared);
            var m = (p + hSquared - q / h) / 2.0;
            var n = (p + hSquared + q / h) / 2.0;
            var roots1 = QuadraticRealPolynomial.computeRealRoots(1.0, h, m);
            var roots2 = QuadraticRealPolynomial.computeRealRoots(1.0, -h, n);
            if (roots1.length !== 0) {
              roots1[0] += temp;
              roots1[1] += temp;
              if (roots2.length !== 0) {
                roots2[0] += temp;
                roots2[1] += temp;
                if (roots1[1] <= roots2[0]) {
                  return [roots1[0], roots1[1], roots2[0], roots2[1]];
                } else if (roots2[1] <= roots1[0]) {
                  return [roots2[0], roots2[1], roots1[0], roots1[1]];
                } else if (roots1[0] >= roots2[0] && roots1[1] <= roots2[1]) {
                  return [roots2[0], roots1[0], roots1[1], roots2[1]];
                } else if (roots2[0] >= roots1[0] && roots2[1] <= roots1[1]) {
                  return [roots1[0], roots2[0], roots2[1], roots1[1]];
                } else if (roots1[0] > roots2[0] && roots1[0] < roots2[1]) {
                  return [roots2[0], roots1[0], roots2[1], roots1[1]];
                }
                return [roots1[0], roots2[0], roots1[1], roots2[1]];
              }
              return roots1;
            }
            if (roots2.length !== 0) {
              roots2[0] += temp;
              roots2[1] += temp;
              return roots2;
            }
            return [];
          }
        }
        return [];
      }
      function neumark(a3, a2, a1, a0) {
        var a1Squared = a1 * a1;
        var a2Squared = a2 * a2;
        var a3Squared = a3 * a3;
        var p = -2.0 * a2;
        var q = a1 * a3 + a2Squared - 4.0 * a0;
        var r = a3Squared * a0 - a1 * a2 * a3 + a1Squared;
        var cubicRoots = CubicRealPolynomial.computeRealRoots(1.0, p, q, r);
        if (cubicRoots.length > 0) {
          var y = cubicRoots[0];
          var temp = (a2 - y);
          var tempSquared = temp * temp;
          var g1 = a3 / 2.0;
          var h1 = temp / 2.0;
          var m = tempSquared - 4.0 * a0;
          var mError = tempSquared + 4.0 * Math.abs(a0);
          var n = a3Squared - 4.0 * y;
          var nError = a3Squared + 4.0 * Math.abs(y);
          var g2;
          var h2;
          if (y < 0.0 || (m * nError < n * mError)) {
            var squareRootOfN = Math.sqrt(n);
            g2 = squareRootOfN / 2.0;
            h2 = squareRootOfN === 0.0 ? 0.0 : (a3 * h1 - a1) / squareRootOfN;
          } else {
            var squareRootOfM = Math.sqrt(m);
            g2 = squareRootOfM === 0.0 ? 0.0 : (a3 * h1 - a1) / squareRootOfM;
            h2 = squareRootOfM / 2.0;
          }
          var G;
          var g;
          if (g1 === 0.0 && g2 === 0.0) {
            G = 0.0;
            g = 0.0;
          } else if (CesiumMath.sign(g1) === CesiumMath.sign(g2)) {
            G = g1 + g2;
            g = y / G;
          } else {
            g = g1 - g2;
            G = y / g;
          }
          var H;
          var h;
          if (h1 === 0.0 && h2 === 0.0) {
            H = 0.0;
            h = 0.0;
          } else if (CesiumMath.sign(h1) === CesiumMath.sign(h2)) {
            H = h1 + h2;
            h = a0 / H;
          } else {
            h = h1 - h2;
            H = a0 / h;
          }
          var roots1 = QuadraticRealPolynomial.computeRealRoots(1.0, G, H);
          var roots2 = QuadraticRealPolynomial.computeRealRoots(1.0, g, h);
          if (roots1.length !== 0) {
            if (roots2.length !== 0) {
              if (roots1[1] <= roots2[0]) {
                return [roots1[0], roots1[1], roots2[0], roots2[1]];
              } else if (roots2[1] <= roots1[0]) {
                return [roots2[0], roots2[1], roots1[0], roots1[1]];
              } else if (roots1[0] >= roots2[0] && roots1[1] <= roots2[1]) {
                return [roots2[0], roots1[0], roots1[1], roots2[1]];
              } else if (roots2[0] >= roots1[0] && roots2[1] <= roots1[1]) {
                return [roots1[0], roots2[0], roots2[1], roots1[1]];
              } else if (roots1[0] > roots2[0] && roots1[0] < roots2[1]) {
                return [roots2[0], roots1[0], roots2[1], roots1[1]];
              } else {
                return [roots1[0], roots2[0], roots1[1], roots2[1]];
              }
            }
            return roots1;
          }
          if (roots2.length !== 0) {
            return roots2;
          }
        }
        return [];
      }
      QuarticRealPolynomial.computeRealRoots = function(a, b, c, d, e) {
        if (typeof a !== 'number') {
          throw new DeveloperError('a is a required number.');
        }
        if (typeof b !== 'number') {
          throw new DeveloperError('b is a required number.');
        }
        if (typeof c !== 'number') {
          throw new DeveloperError('c is a required number.');
        }
        if (typeof d !== 'number') {
          throw new DeveloperError('d is a required number.');
        }
        if (typeof e !== 'number') {
          throw new DeveloperError('e is a required number.');
        }
        if (Math.abs(a) < CesiumMath.EPSILON15) {
          return CubicRealPolynomial.computeRealRoots(b, c, d, e);
        }
        var a3 = b / a;
        var a2 = c / a;
        var a1 = d / a;
        var a0 = e / a;
        var k = (a3 < 0.0) ? 1 : 0;
        k += (a2 < 0.0) ? k + 1 : k;
        k += (a1 < 0.0) ? k + 1 : k;
        k += (a0 < 0.0) ? k + 1 : k;
        switch (k) {
          case 0:
            return original(a3, a2, a1, a0);
          case 1:
            return neumark(a3, a2, a1, a0);
          case 2:
            return neumark(a3, a2, a1, a0);
          case 3:
            return original(a3, a2, a1, a0);
          case 4:
            return original(a3, a2, a1, a0);
          case 5:
            return neumark(a3, a2, a1, a0);
          case 6:
            return original(a3, a2, a1, a0);
          case 7:
            return original(a3, a2, a1, a0);
          case 8:
            return neumark(a3, a2, a1, a0);
          case 9:
            return original(a3, a2, a1, a0);
          case 10:
            return original(a3, a2, a1, a0);
          case 11:
            return neumark(a3, a2, a1, a0);
          case 12:
            return original(a3, a2, a1, a0);
          case 13:
            return original(a3, a2, a1, a0);
          case 14:
            return original(a3, a2, a1, a0);
          case 15:
            return original(a3, a2, a1, a0);
          default:
            return undefined;
        }
      };
      return QuarticRealPolynomial;
    });
    define('Core/Ray', ['./Cartesian3', './defaultValue', './defined', './DeveloperError'], function(Cartesian3, defaultValue, defined, DeveloperError) {
      'use strict';
      function Ray(origin, direction) {
        direction = Cartesian3.clone(defaultValue(direction, Cartesian3.ZERO));
        if (!Cartesian3.equals(direction, Cartesian3.ZERO)) {
          Cartesian3.normalize(direction, direction);
        }
        this.origin = Cartesian3.clone(defaultValue(origin, Cartesian3.ZERO));
        this.direction = direction;
      }
      Ray.getPoint = function(ray, t, result) {
        if (!defined(ray)) {
          throw new DeveloperError('ray is requred');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is a required number');
        }
        if (!defined(result)) {
          result = new Cartesian3();
        }
        result = Cartesian3.multiplyByScalar(ray.direction, t, result);
        return Cartesian3.add(ray.origin, result, result);
      };
      return Ray;
    });
    define('Core/IntersectionTests', ['./Cartesian3', './Cartographic', './defaultValue', './defined', './DeveloperError', './Math', './Matrix3', './QuadraticRealPolynomial', './QuarticRealPolynomial', './Ray'], function(Cartesian3, Cartographic, defaultValue, defined, DeveloperError, CesiumMath, Matrix3, QuadraticRealPolynomial, QuarticRealPolynomial, Ray) {
      'use strict';
      var IntersectionTests = {};
      IntersectionTests.rayPlane = function(ray, plane, result) {
        if (!defined(ray)) {
          throw new DeveloperError('ray is required.');
        }
        if (!defined(plane)) {
          throw new DeveloperError('plane is required.');
        }
        if (!defined(result)) {
          result = new Cartesian3();
        }
        var origin = ray.origin;
        var direction = ray.direction;
        var normal = plane.normal;
        var denominator = Cartesian3.dot(normal, direction);
        if (Math.abs(denominator) < CesiumMath.EPSILON15) {
          return undefined;
        }
        var t = (-plane.distance - Cartesian3.dot(normal, origin)) / denominator;
        if (t < 0) {
          return undefined;
        }
        result = Cartesian3.multiplyByScalar(direction, t, result);
        return Cartesian3.add(origin, result, result);
      };
      var scratchEdge0 = new Cartesian3();
      var scratchEdge1 = new Cartesian3();
      var scratchPVec = new Cartesian3();
      var scratchTVec = new Cartesian3();
      var scratchQVec = new Cartesian3();
      function rayTriangle(ray, p0, p1, p2, cullBackFaces) {
        if (!defined(ray)) {
          throw new DeveloperError('ray is required.');
        }
        if (!defined(p0)) {
          throw new DeveloperError('p0 is required.');
        }
        if (!defined(p1)) {
          throw new DeveloperError('p1 is required.');
        }
        if (!defined(p2)) {
          throw new DeveloperError('p2 is required.');
        }
        cullBackFaces = defaultValue(cullBackFaces, false);
        var origin = ray.origin;
        var direction = ray.direction;
        var edge0 = Cartesian3.subtract(p1, p0, scratchEdge0);
        var edge1 = Cartesian3.subtract(p2, p0, scratchEdge1);
        var p = Cartesian3.cross(direction, edge1, scratchPVec);
        var det = Cartesian3.dot(edge0, p);
        var tvec;
        var q;
        var u;
        var v;
        var t;
        if (cullBackFaces) {
          if (det < CesiumMath.EPSILON6) {
            return undefined;
          }
          tvec = Cartesian3.subtract(origin, p0, scratchTVec);
          u = Cartesian3.dot(tvec, p);
          if (u < 0.0 || u > det) {
            return undefined;
          }
          q = Cartesian3.cross(tvec, edge0, scratchQVec);
          v = Cartesian3.dot(direction, q);
          if (v < 0.0 || u + v > det) {
            return undefined;
          }
          t = Cartesian3.dot(edge1, q) / det;
        } else {
          if (Math.abs(det) < CesiumMath.EPSILON6) {
            return undefined;
          }
          var invDet = 1.0 / det;
          tvec = Cartesian3.subtract(origin, p0, scratchTVec);
          u = Cartesian3.dot(tvec, p) * invDet;
          if (u < 0.0 || u > 1.0) {
            return undefined;
          }
          q = Cartesian3.cross(tvec, edge0, scratchQVec);
          v = Cartesian3.dot(direction, q) * invDet;
          if (v < 0.0 || u + v > 1.0) {
            return undefined;
          }
          t = Cartesian3.dot(edge1, q) * invDet;
        }
        return t;
      }
      IntersectionTests.rayTriangle = function(ray, p0, p1, p2, cullBackFaces, result) {
        var t = rayTriangle(ray, p0, p1, p2, cullBackFaces);
        if (!defined(t) || t < 0.0) {
          return undefined;
        }
        if (!defined(result)) {
          result = new Cartesian3();
        }
        Cartesian3.multiplyByScalar(ray.direction, t, result);
        return Cartesian3.add(ray.origin, result, result);
      };
      var scratchLineSegmentTriangleRay = new Ray();
      IntersectionTests.lineSegmentTriangle = function(v0, v1, p0, p1, p2, cullBackFaces, result) {
        if (!defined(v0)) {
          throw new DeveloperError('v0 is required.');
        }
        if (!defined(v1)) {
          throw new DeveloperError('v1 is required.');
        }
        var ray = scratchLineSegmentTriangleRay;
        Cartesian3.clone(v0, ray.origin);
        Cartesian3.subtract(v1, v0, ray.direction);
        Cartesian3.normalize(ray.direction, ray.direction);
        var t = rayTriangle(ray, p0, p1, p2, cullBackFaces);
        if (!defined(t) || t < 0.0 || t > Cartesian3.distance(v0, v1)) {
          return undefined;
        }
        if (!defined(result)) {
          result = new Cartesian3();
        }
        Cartesian3.multiplyByScalar(ray.direction, t, result);
        return Cartesian3.add(ray.origin, result, result);
      };
      function solveQuadratic(a, b, c, result) {
        var det = b * b - 4.0 * a * c;
        if (det < 0.0) {
          return undefined;
        } else if (det > 0.0) {
          var denom = 1.0 / (2.0 * a);
          var disc = Math.sqrt(det);
          var root0 = (-b + disc) * denom;
          var root1 = (-b - disc) * denom;
          if (root0 < root1) {
            result.root0 = root0;
            result.root1 = root1;
          } else {
            result.root0 = root1;
            result.root1 = root0;
          }
          return result;
        }
        var root = -b / (2.0 * a);
        if (root === 0.0) {
          return undefined;
        }
        result.root0 = result.root1 = root;
        return result;
      }
      var raySphereRoots = {
        root0: 0.0,
        root1: 0.0
      };
      function raySphere(ray, sphere, result) {
        if (!defined(result)) {
          result = {};
        }
        var origin = ray.origin;
        var direction = ray.direction;
        var center = sphere.center;
        var radiusSquared = sphere.radius * sphere.radius;
        var diff = Cartesian3.subtract(origin, center, scratchPVec);
        var a = Cartesian3.dot(direction, direction);
        var b = 2.0 * Cartesian3.dot(direction, diff);
        var c = Cartesian3.magnitudeSquared(diff) - radiusSquared;
        var roots = solveQuadratic(a, b, c, raySphereRoots);
        if (!defined(roots)) {
          return undefined;
        }
        result.start = roots.root0;
        result.stop = roots.root1;
        return result;
      }
      IntersectionTests.raySphere = function(ray, sphere, result) {
        if (!defined(ray)) {
          throw new DeveloperError('ray is required.');
        }
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        result = raySphere(ray, sphere, result);
        if (!defined(result) || result.stop < 0.0) {
          return undefined;
        }
        result.start = Math.max(result.start, 0.0);
        return result;
      };
      var scratchLineSegmentRay = new Ray();
      IntersectionTests.lineSegmentSphere = function(p0, p1, sphere, result) {
        if (!defined(p0)) {
          throw new DeveloperError('p0 is required.');
        }
        if (!defined(p1)) {
          throw new DeveloperError('p1 is required.');
        }
        if (!defined(sphere)) {
          throw new DeveloperError('sphere is required.');
        }
        var ray = scratchLineSegmentRay;
        Cartesian3.clone(p0, ray.origin);
        var direction = Cartesian3.subtract(p1, p0, ray.direction);
        var maxT = Cartesian3.magnitude(direction);
        Cartesian3.normalize(direction, direction);
        result = raySphere(ray, sphere, result);
        if (!defined(result) || result.stop < 0.0 || result.start > maxT) {
          return undefined;
        }
        result.start = Math.max(result.start, 0.0);
        result.stop = Math.min(result.stop, maxT);
        return result;
      };
      var scratchQ = new Cartesian3();
      var scratchW = new Cartesian3();
      IntersectionTests.rayEllipsoid = function(ray, ellipsoid) {
        if (!defined(ray)) {
          throw new DeveloperError('ray is required.');
        }
        if (!defined(ellipsoid)) {
          throw new DeveloperError('ellipsoid is required.');
        }
        var inverseRadii = ellipsoid.oneOverRadii;
        var q = Cartesian3.multiplyComponents(inverseRadii, ray.origin, scratchQ);
        var w = Cartesian3.multiplyComponents(inverseRadii, ray.direction, scratchW);
        var q2 = Cartesian3.magnitudeSquared(q);
        var qw = Cartesian3.dot(q, w);
        var difference,
            w2,
            product,
            discriminant,
            temp;
        if (q2 > 1.0) {
          if (qw >= 0.0) {
            return undefined;
          }
          var qw2 = qw * qw;
          difference = q2 - 1.0;
          w2 = Cartesian3.magnitudeSquared(w);
          product = w2 * difference;
          if (qw2 < product) {
            return undefined;
          } else if (qw2 > product) {
            discriminant = qw * qw - product;
            temp = -qw + Math.sqrt(discriminant);
            var root0 = temp / w2;
            var root1 = difference / temp;
            if (root0 < root1) {
              return {
                start: root0,
                stop: root1
              };
            }
            return {
              start: root1,
              stop: root0
            };
          } else {
            var root = Math.sqrt(difference / w2);
            return {
              start: root,
              stop: root
            };
          }
        } else if (q2 < 1.0) {
          difference = q2 - 1.0;
          w2 = Cartesian3.magnitudeSquared(w);
          product = w2 * difference;
          discriminant = qw * qw - product;
          temp = -qw + Math.sqrt(discriminant);
          return {
            start: 0.0,
            stop: temp / w2
          };
        } else {
          if (qw < 0.0) {
            w2 = Cartesian3.magnitudeSquared(w);
            return {
              start: 0.0,
              stop: -qw / w2
            };
          }
          return undefined;
        }
      };
      function addWithCancellationCheck(left, right, tolerance) {
        var difference = left + right;
        if ((CesiumMath.sign(left) !== CesiumMath.sign(right)) && Math.abs(difference / Math.max(Math.abs(left), Math.abs(right))) < tolerance) {
          return 0.0;
        }
        return difference;
      }
      function quadraticVectorExpression(A, b, c, x, w) {
        var xSquared = x * x;
        var wSquared = w * w;
        var l2 = (A[Matrix3.COLUMN1ROW1] - A[Matrix3.COLUMN2ROW2]) * wSquared;
        var l1 = w * (x * addWithCancellationCheck(A[Matrix3.COLUMN1ROW0], A[Matrix3.COLUMN0ROW1], CesiumMath.EPSILON15) + b.y);
        var l0 = (A[Matrix3.COLUMN0ROW0] * xSquared + A[Matrix3.COLUMN2ROW2] * wSquared) + x * b.x + c;
        var r1 = wSquared * addWithCancellationCheck(A[Matrix3.COLUMN2ROW1], A[Matrix3.COLUMN1ROW2], CesiumMath.EPSILON15);
        var r0 = w * (x * addWithCancellationCheck(A[Matrix3.COLUMN2ROW0], A[Matrix3.COLUMN0ROW2]) + b.z);
        var cosines;
        var solutions = [];
        if (r0 === 0.0 && r1 === 0.0) {
          cosines = QuadraticRealPolynomial.computeRealRoots(l2, l1, l0);
          if (cosines.length === 0) {
            return solutions;
          }
          var cosine0 = cosines[0];
          var sine0 = Math.sqrt(Math.max(1.0 - cosine0 * cosine0, 0.0));
          solutions.push(new Cartesian3(x, w * cosine0, w * -sine0));
          solutions.push(new Cartesian3(x, w * cosine0, w * sine0));
          if (cosines.length === 2) {
            var cosine1 = cosines[1];
            var sine1 = Math.sqrt(Math.max(1.0 - cosine1 * cosine1, 0.0));
            solutions.push(new Cartesian3(x, w * cosine1, w * -sine1));
            solutions.push(new Cartesian3(x, w * cosine1, w * sine1));
          }
          return solutions;
        }
        var r0Squared = r0 * r0;
        var r1Squared = r1 * r1;
        var l2Squared = l2 * l2;
        var r0r1 = r0 * r1;
        var c4 = l2Squared + r1Squared;
        var c3 = 2.0 * (l1 * l2 + r0r1);
        var c2 = 2.0 * l0 * l2 + l1 * l1 - r1Squared + r0Squared;
        var c1 = 2.0 * (l0 * l1 - r0r1);
        var c0 = l0 * l0 - r0Squared;
        if (c4 === 0.0 && c3 === 0.0 && c2 === 0.0 && c1 === 0.0) {
          return solutions;
        }
        cosines = QuarticRealPolynomial.computeRealRoots(c4, c3, c2, c1, c0);
        var length = cosines.length;
        if (length === 0) {
          return solutions;
        }
        for (var i = 0; i < length; ++i) {
          var cosine = cosines[i];
          var cosineSquared = cosine * cosine;
          var sineSquared = Math.max(1.0 - cosineSquared, 0.0);
          var sine = Math.sqrt(sineSquared);
          var left;
          if (CesiumMath.sign(l2) === CesiumMath.sign(l0)) {
            left = addWithCancellationCheck(l2 * cosineSquared + l0, l1 * cosine, CesiumMath.EPSILON12);
          } else if (CesiumMath.sign(l0) === CesiumMath.sign(l1 * cosine)) {
            left = addWithCancellationCheck(l2 * cosineSquared, l1 * cosine + l0, CesiumMath.EPSILON12);
          } else {
            left = addWithCancellationCheck(l2 * cosineSquared + l1 * cosine, l0, CesiumMath.EPSILON12);
          }
          var right = addWithCancellationCheck(r1 * cosine, r0, CesiumMath.EPSILON15);
          var product = left * right;
          if (product < 0.0) {
            solutions.push(new Cartesian3(x, w * cosine, w * sine));
          } else if (product > 0.0) {
            solutions.push(new Cartesian3(x, w * cosine, w * -sine));
          } else if (sine !== 0.0) {
            solutions.push(new Cartesian3(x, w * cosine, w * -sine));
            solutions.push(new Cartesian3(x, w * cosine, w * sine));
            ++i;
          } else {
            solutions.push(new Cartesian3(x, w * cosine, w * sine));
          }
        }
        return solutions;
      }
      var firstAxisScratch = new Cartesian3();
      var secondAxisScratch = new Cartesian3();
      var thirdAxisScratch = new Cartesian3();
      var referenceScratch = new Cartesian3();
      var bCart = new Cartesian3();
      var bScratch = new Matrix3();
      var btScratch = new Matrix3();
      var diScratch = new Matrix3();
      var dScratch = new Matrix3();
      var cScratch = new Matrix3();
      var tempMatrix = new Matrix3();
      var aScratch = new Matrix3();
      var sScratch = new Cartesian3();
      var closestScratch = new Cartesian3();
      var surfPointScratch = new Cartographic();
      IntersectionTests.grazingAltitudeLocation = function(ray, ellipsoid) {
        if (!defined(ray)) {
          throw new DeveloperError('ray is required.');
        }
        if (!defined(ellipsoid)) {
          throw new DeveloperError('ellipsoid is required.');
        }
        var position = ray.origin;
        var direction = ray.direction;
        var normal = ellipsoid.geodeticSurfaceNormal(position, firstAxisScratch);
        if (Cartesian3.dot(direction, normal) >= 0.0) {
          return position;
        }
        var intersects = defined(this.rayEllipsoid(ray, ellipsoid));
        var f = ellipsoid.transformPositionToScaledSpace(direction, firstAxisScratch);
        var firstAxis = Cartesian3.normalize(f, f);
        var reference = Cartesian3.mostOrthogonalAxis(f, referenceScratch);
        var secondAxis = Cartesian3.normalize(Cartesian3.cross(reference, firstAxis, secondAxisScratch), secondAxisScratch);
        var thirdAxis = Cartesian3.normalize(Cartesian3.cross(firstAxis, secondAxis, thirdAxisScratch), thirdAxisScratch);
        var B = bScratch;
        B[0] = firstAxis.x;
        B[1] = firstAxis.y;
        B[2] = firstAxis.z;
        B[3] = secondAxis.x;
        B[4] = secondAxis.y;
        B[5] = secondAxis.z;
        B[6] = thirdAxis.x;
        B[7] = thirdAxis.y;
        B[8] = thirdAxis.z;
        var B_T = Matrix3.transpose(B, btScratch);
        var D_I = Matrix3.fromScale(ellipsoid.radii, diScratch);
        var D = Matrix3.fromScale(ellipsoid.oneOverRadii, dScratch);
        var C = cScratch;
        C[0] = 0.0;
        C[1] = -direction.z;
        C[2] = direction.y;
        C[3] = direction.z;
        C[4] = 0.0;
        C[5] = -direction.x;
        C[6] = -direction.y;
        C[7] = direction.x;
        C[8] = 0.0;
        var temp = Matrix3.multiply(Matrix3.multiply(B_T, D, tempMatrix), C, tempMatrix);
        var A = Matrix3.multiply(Matrix3.multiply(temp, D_I, aScratch), B, aScratch);
        var b = Matrix3.multiplyByVector(temp, position, bCart);
        var solutions = quadraticVectorExpression(A, Cartesian3.negate(b, firstAxisScratch), 0.0, 0.0, 1.0);
        var s;
        var altitude;
        var length = solutions.length;
        if (length > 0) {
          var closest = Cartesian3.clone(Cartesian3.ZERO, closestScratch);
          var maximumValue = Number.NEGATIVE_INFINITY;
          for (var i = 0; i < length; ++i) {
            s = Matrix3.multiplyByVector(D_I, Matrix3.multiplyByVector(B, solutions[i], sScratch), sScratch);
            var v = Cartesian3.normalize(Cartesian3.subtract(s, position, referenceScratch), referenceScratch);
            var dotProduct = Cartesian3.dot(v, direction);
            if (dotProduct > maximumValue) {
              maximumValue = dotProduct;
              closest = Cartesian3.clone(s, closest);
            }
          }
          var surfacePoint = ellipsoid.cartesianToCartographic(closest, surfPointScratch);
          maximumValue = CesiumMath.clamp(maximumValue, 0.0, 1.0);
          altitude = Cartesian3.magnitude(Cartesian3.subtract(closest, position, referenceScratch)) * Math.sqrt(1.0 - maximumValue * maximumValue);
          altitude = intersects ? -altitude : altitude;
          surfacePoint.height = altitude;
          return ellipsoid.cartographicToCartesian(surfacePoint, new Cartesian3());
        }
        return undefined;
      };
      var lineSegmentPlaneDifference = new Cartesian3();
      IntersectionTests.lineSegmentPlane = function(endPoint0, endPoint1, plane, result) {
        if (!defined(endPoint0)) {
          throw new DeveloperError('endPoint0 is required.');
        }
        if (!defined(endPoint1)) {
          throw new DeveloperError('endPoint1 is required.');
        }
        if (!defined(plane)) {
          throw new DeveloperError('plane is required.');
        }
        if (!defined(result)) {
          result = new Cartesian3();
        }
        var difference = Cartesian3.subtract(endPoint1, endPoint0, lineSegmentPlaneDifference);
        var normal = plane.normal;
        var nDotDiff = Cartesian3.dot(normal, difference);
        if (Math.abs(nDotDiff) < CesiumMath.EPSILON6) {
          return undefined;
        }
        var nDotP0 = Cartesian3.dot(normal, endPoint0);
        var t = -(plane.distance + nDotP0) / nDotDiff;
        if (t < 0.0 || t > 1.0) {
          return undefined;
        }
        Cartesian3.multiplyByScalar(difference, t, result);
        Cartesian3.add(endPoint0, result, result);
        return result;
      };
      IntersectionTests.trianglePlaneIntersection = function(p0, p1, p2, plane) {
        if ((!defined(p0)) || (!defined(p1)) || (!defined(p2)) || (!defined(plane))) {
          throw new DeveloperError('p0, p1, p2, and plane are required.');
        }
        var planeNormal = plane.normal;
        var planeD = plane.distance;
        var p0Behind = (Cartesian3.dot(planeNormal, p0) + planeD) < 0.0;
        var p1Behind = (Cartesian3.dot(planeNormal, p1) + planeD) < 0.0;
        var p2Behind = (Cartesian3.dot(planeNormal, p2) + planeD) < 0.0;
        var numBehind = 0;
        numBehind += p0Behind ? 1 : 0;
        numBehind += p1Behind ? 1 : 0;
        numBehind += p2Behind ? 1 : 0;
        var u1,
            u2;
        if (numBehind === 1 || numBehind === 2) {
          u1 = new Cartesian3();
          u2 = new Cartesian3();
        }
        if (numBehind === 1) {
          if (p0Behind) {
            IntersectionTests.lineSegmentPlane(p0, p1, plane, u1);
            IntersectionTests.lineSegmentPlane(p0, p2, plane, u2);
            return {
              positions: [p0, p1, p2, u1, u2],
              indices: [0, 3, 4, 1, 2, 4, 1, 4, 3]
            };
          } else if (p1Behind) {
            IntersectionTests.lineSegmentPlane(p1, p2, plane, u1);
            IntersectionTests.lineSegmentPlane(p1, p0, plane, u2);
            return {
              positions: [p0, p1, p2, u1, u2],
              indices: [1, 3, 4, 2, 0, 4, 2, 4, 3]
            };
          } else if (p2Behind) {
            IntersectionTests.lineSegmentPlane(p2, p0, plane, u1);
            IntersectionTests.lineSegmentPlane(p2, p1, plane, u2);
            return {
              positions: [p0, p1, p2, u1, u2],
              indices: [2, 3, 4, 0, 1, 4, 0, 4, 3]
            };
          }
        } else if (numBehind === 2) {
          if (!p0Behind) {
            IntersectionTests.lineSegmentPlane(p1, p0, plane, u1);
            IntersectionTests.lineSegmentPlane(p2, p0, plane, u2);
            return {
              positions: [p0, p1, p2, u1, u2],
              indices: [1, 2, 4, 1, 4, 3, 0, 3, 4]
            };
          } else if (!p1Behind) {
            IntersectionTests.lineSegmentPlane(p2, p1, plane, u1);
            IntersectionTests.lineSegmentPlane(p0, p1, plane, u2);
            return {
              positions: [p0, p1, p2, u1, u2],
              indices: [2, 0, 4, 2, 4, 3, 1, 3, 4]
            };
          } else if (!p2Behind) {
            IntersectionTests.lineSegmentPlane(p0, p2, plane, u1);
            IntersectionTests.lineSegmentPlane(p1, p2, plane, u2);
            return {
              positions: [p0, p1, p2, u1, u2],
              indices: [0, 1, 4, 0, 4, 3, 2, 3, 4]
            };
          }
        }
        return undefined;
      };
      return IntersectionTests;
    });
    define('Core/PolylinePipeline', ['./Cartesian3', './Cartographic', './defaultValue', './defined', './DeveloperError', './Ellipsoid', './EllipsoidGeodesic', './IntersectionTests', './isArray', './Math', './Matrix4', './Plane'], function(Cartesian3, Cartographic, defaultValue, defined, DeveloperError, Ellipsoid, EllipsoidGeodesic, IntersectionTests, isArray, CesiumMath, Matrix4, Plane) {
      'use strict';
      var PolylinePipeline = {};
      PolylinePipeline.numberOfPoints = function(p0, p1, minDistance) {
        var distance = Cartesian3.distance(p0, p1);
        return Math.ceil(distance / minDistance);
      };
      var cartoScratch = new Cartographic();
      PolylinePipeline.extractHeights = function(positions, ellipsoid) {
        var length = positions.length;
        var heights = new Array(length);
        for (var i = 0; i < length; i++) {
          var p = positions[i];
          heights[i] = ellipsoid.cartesianToCartographic(p, cartoScratch).height;
        }
        return heights;
      };
      var wrapLongitudeInversMatrix = new Matrix4();
      var wrapLongitudeOrigin = new Cartesian3();
      var wrapLongitudeXZNormal = new Cartesian3();
      var wrapLongitudeXZPlane = new Plane(Cartesian3.ZERO, 0.0);
      var wrapLongitudeYZNormal = new Cartesian3();
      var wrapLongitudeYZPlane = new Plane(Cartesian3.ZERO, 0.0);
      var wrapLongitudeIntersection = new Cartesian3();
      var wrapLongitudeOffset = new Cartesian3();
      var subdivideHeightsScratchArray = [];
      function subdivideHeights(numPoints, h0, h1) {
        var heights = subdivideHeightsScratchArray;
        heights.length = numPoints;
        var i;
        if (h0 === h1) {
          for (i = 0; i < numPoints; i++) {
            heights[i] = h0;
          }
          return heights;
        }
        var dHeight = h1 - h0;
        var heightPerVertex = dHeight / numPoints;
        for (i = 0; i < numPoints; i++) {
          var h = h0 + i * heightPerVertex;
          heights[i] = h;
        }
        return heights;
      }
      var carto1 = new Cartographic();
      var carto2 = new Cartographic();
      var cartesian = new Cartesian3();
      var scaleFirst = new Cartesian3();
      var scaleLast = new Cartesian3();
      var ellipsoidGeodesic = new EllipsoidGeodesic();
      function generateCartesianArc(p0, p1, minDistance, ellipsoid, h0, h1, array, offset) {
        var first = ellipsoid.scaleToGeodeticSurface(p0, scaleFirst);
        var last = ellipsoid.scaleToGeodeticSurface(p1, scaleLast);
        var numPoints = PolylinePipeline.numberOfPoints(p0, p1, minDistance);
        var start = ellipsoid.cartesianToCartographic(first, carto1);
        var end = ellipsoid.cartesianToCartographic(last, carto2);
        var heights = subdivideHeights(numPoints, h0, h1);
        ellipsoidGeodesic.setEndPoints(start, end);
        var surfaceDistanceBetweenPoints = ellipsoidGeodesic.surfaceDistance / numPoints;
        var index = offset;
        start.height = h0;
        var cart = ellipsoid.cartographicToCartesian(start, cartesian);
        Cartesian3.pack(cart, array, index);
        index += 3;
        for (var i = 1; i < numPoints; i++) {
          var carto = ellipsoidGeodesic.interpolateUsingSurfaceDistance(i * surfaceDistanceBetweenPoints, carto2);
          carto.height = heights[i];
          cart = ellipsoid.cartographicToCartesian(carto, cartesian);
          Cartesian3.pack(cart, array, index);
          index += 3;
        }
        return index;
      }
      PolylinePipeline.wrapLongitude = function(positions, modelMatrix) {
        var cartesians = [];
        var segments = [];
        if (defined(positions) && positions.length > 0) {
          modelMatrix = defaultValue(modelMatrix, Matrix4.IDENTITY);
          var inverseModelMatrix = Matrix4.inverseTransformation(modelMatrix, wrapLongitudeInversMatrix);
          var origin = Matrix4.multiplyByPoint(inverseModelMatrix, Cartesian3.ZERO, wrapLongitudeOrigin);
          var xzNormal = Matrix4.multiplyByPointAsVector(inverseModelMatrix, Cartesian3.UNIT_Y, wrapLongitudeXZNormal);
          var xzPlane = Plane.fromPointNormal(origin, xzNormal, wrapLongitudeXZPlane);
          var yzNormal = Matrix4.multiplyByPointAsVector(inverseModelMatrix, Cartesian3.UNIT_X, wrapLongitudeYZNormal);
          var yzPlane = Plane.fromPointNormal(origin, yzNormal, wrapLongitudeYZPlane);
          var count = 1;
          cartesians.push(Cartesian3.clone(positions[0]));
          var prev = cartesians[0];
          var length = positions.length;
          for (var i = 1; i < length; ++i) {
            var cur = positions[i];
            if (Plane.getPointDistance(yzPlane, prev) < 0.0 || Plane.getPointDistance(yzPlane, cur) < 0.0) {
              var intersection = IntersectionTests.lineSegmentPlane(prev, cur, xzPlane, wrapLongitudeIntersection);
              if (defined(intersection)) {
                var offset = Cartesian3.multiplyByScalar(xzNormal, 5.0e-9, wrapLongitudeOffset);
                if (Plane.getPointDistance(xzPlane, prev) < 0.0) {
                  Cartesian3.negate(offset, offset);
                }
                cartesians.push(Cartesian3.add(intersection, offset, new Cartesian3()));
                segments.push(count + 1);
                Cartesian3.negate(offset, offset);
                cartesians.push(Cartesian3.add(intersection, offset, new Cartesian3()));
                count = 1;
              }
            }
            cartesians.push(Cartesian3.clone(positions[i]));
            count++;
            prev = cur;
          }
          segments.push(count);
        }
        return {
          positions: cartesians,
          lengths: segments
        };
      };
      var removeDuplicatesEpsilon = CesiumMath.EPSILON10;
      PolylinePipeline.removeDuplicates = function(positions) {
        if (!defined(positions)) {
          throw new DeveloperError('positions is required.');
        }
        var length = positions.length;
        if (length < 2) {
          return positions;
        }
        var i;
        var v0;
        var v1;
        for (i = 1; i < length; ++i) {
          v0 = positions[i - 1];
          v1 = positions[i];
          if (Cartesian3.equalsEpsilon(v0, v1, removeDuplicatesEpsilon)) {
            break;
          }
        }
        if (i === length) {
          return positions;
        }
        var cleanedPositions = positions.slice(0, i);
        for (; i < length; ++i) {
          v1 = positions[i];
          if (!Cartesian3.equalsEpsilon(v0, v1, removeDuplicatesEpsilon)) {
            cleanedPositions.push(Cartesian3.clone(v1));
            v0 = v1;
          }
        }
        return cleanedPositions;
      };
      PolylinePipeline.generateArc = function(options) {
        if (!defined(options)) {
          options = {};
        }
        var positions = options.positions;
        if (!defined(positions)) {
          throw new DeveloperError('options.positions is required.');
        }
        var length = positions.length;
        var ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        var height = defaultValue(options.height, 0);
        if (length < 1) {
          return [];
        } else if (length === 1) {
          var p = ellipsoid.scaleToGeodeticSurface(positions[0], scaleFirst);
          if (height !== 0) {
            var n = ellipsoid.geodeticSurfaceNormal(p, cartesian);
            Cartesian3.multiplyByScalar(n, height, n);
            Cartesian3.add(p, n, p);
          }
          return [p.x, p.y, p.z];
        }
        var minDistance = options.minDistance;
        if (!defined(minDistance)) {
          var granularity = defaultValue(options.granularity, CesiumMath.RADIANS_PER_DEGREE);
          minDistance = CesiumMath.chordLength(granularity, ellipsoid.maximumRadius);
        }
        var numPoints = 0;
        var i;
        for (i = 0; i < length - 1; i++) {
          numPoints += PolylinePipeline.numberOfPoints(positions[i], positions[i + 1], minDistance);
        }
        var arrayLength = (numPoints + 1) * 3;
        var newPositions = new Array(arrayLength);
        var offset = 0;
        var hasHeightArray = isArray(height);
        for (i = 0; i < length - 1; i++) {
          var p0 = positions[i];
          var p1 = positions[i + 1];
          var h0 = hasHeightArray ? height[i] : height;
          var h1 = hasHeightArray ? height[i + 1] : height;
          offset = generateCartesianArc(p0, p1, minDistance, ellipsoid, h0, h1, newPositions, offset);
        }
        subdivideHeightsScratchArray.length = 0;
        var lastPoint = positions[length - 1];
        var carto = ellipsoid.cartesianToCartographic(lastPoint, carto1);
        carto.height = hasHeightArray ? height[length - 1] : height;
        var cart = ellipsoid.cartographicToCartesian(carto, cartesian);
        Cartesian3.pack(cart, newPositions, arrayLength - 3);
        return newPositions;
      };
      PolylinePipeline.generateCartesianArc = function(options) {
        var numberArray = PolylinePipeline.generateArc(options);
        var size = numberArray.length / 3;
        var newPositions = new Array(size);
        for (var i = 0; i < size; i++) {
          newPositions[i] = Cartesian3.unpack(numberArray, i * 3);
        }
        return newPositions;
      };
      return PolylinePipeline;
    });
    define('Core/Cartesian2', ['./defaultValue', './defined', './DeveloperError', './freezeObject', './Math'], function(defaultValue, defined, DeveloperError, freezeObject, CesiumMath) {
      'use strict';
      function Cartesian2(x, y) {
        this.x = defaultValue(x, 0.0);
        this.y = defaultValue(y, 0.0);
      }
      Cartesian2.fromElements = function(x, y, result) {
        if (!defined(result)) {
          return new Cartesian2(x, y);
        }
        result.x = x;
        result.y = y;
        return result;
      };
      Cartesian2.clone = function(cartesian, result) {
        if (!defined(cartesian)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Cartesian2(cartesian.x, cartesian.y);
        }
        result.x = cartesian.x;
        result.y = cartesian.y;
        return result;
      };
      Cartesian2.fromCartesian3 = Cartesian2.clone;
      Cartesian2.fromCartesian4 = Cartesian2.clone;
      Cartesian2.packedLength = 2;
      Cartesian2.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value.x;
        array[startingIndex] = value.y;
      };
      Cartesian2.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Cartesian2();
        }
        result.x = array[startingIndex++];
        result.y = array[startingIndex];
        return result;
      };
      Cartesian2.fromArray = Cartesian2.unpack;
      Cartesian2.maximumComponent = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return Math.max(cartesian.x, cartesian.y);
      };
      Cartesian2.minimumComponent = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return Math.min(cartesian.x, cartesian.y);
      };
      Cartesian2.minimumByComponent = function(first, second, result) {
        if (!defined(first)) {
          throw new DeveloperError('first is required.');
        }
        if (!defined(second)) {
          throw new DeveloperError('second is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        result.x = Math.min(first.x, second.x);
        result.y = Math.min(first.y, second.y);
        return result;
      };
      Cartesian2.maximumByComponent = function(first, second, result) {
        if (!defined(first)) {
          throw new DeveloperError('first is required.');
        }
        if (!defined(second)) {
          throw new DeveloperError('second is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        result.x = Math.max(first.x, second.x);
        result.y = Math.max(first.y, second.y);
        return result;
      };
      Cartesian2.magnitudeSquared = function(cartesian) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        return cartesian.x * cartesian.x + cartesian.y * cartesian.y;
      };
      Cartesian2.magnitude = function(cartesian) {
        return Math.sqrt(Cartesian2.magnitudeSquared(cartesian));
      };
      var distanceScratch = new Cartesian2();
      Cartesian2.distance = function(left, right) {
        if (!defined(left) || !defined(right)) {
          throw new DeveloperError('left and right are required.');
        }
        Cartesian2.subtract(left, right, distanceScratch);
        return Cartesian2.magnitude(distanceScratch);
      };
      Cartesian2.distanceSquared = function(left, right) {
        if (!defined(left) || !defined(right)) {
          throw new DeveloperError('left and right are required.');
        }
        Cartesian2.subtract(left, right, distanceScratch);
        return Cartesian2.magnitudeSquared(distanceScratch);
      };
      Cartesian2.normalize = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var magnitude = Cartesian2.magnitude(cartesian);
        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;
        return result;
      };
      Cartesian2.dot = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        return left.x * right.x + left.y * right.y;
      };
      Cartesian2.multiplyComponents = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x * right.x;
        result.y = left.y * right.y;
        return result;
      };
      Cartesian2.add = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x + right.x;
        result.y = left.y + right.y;
        return result;
      };
      Cartesian2.subtract = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        return result;
      };
      Cartesian2.multiplyByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = cartesian.x * scalar;
        result.y = cartesian.y * scalar;
        return result;
      };
      Cartesian2.divideByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = cartesian.x / scalar;
        result.y = cartesian.y / scalar;
        return result;
      };
      Cartesian2.negate = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = -cartesian.x;
        result.y = -cartesian.y;
        return result;
      };
      Cartesian2.abs = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = Math.abs(cartesian.x);
        result.y = Math.abs(cartesian.y);
        return result;
      };
      var lerpScratch = new Cartesian2();
      Cartesian2.lerp = function(start, end, t, result) {
        if (!defined(start)) {
          throw new DeveloperError('start is required.');
        }
        if (!defined(end)) {
          throw new DeveloperError('end is required.');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        Cartesian2.multiplyByScalar(end, t, lerpScratch);
        result = Cartesian2.multiplyByScalar(start, 1.0 - t, result);
        return Cartesian2.add(lerpScratch, result, result);
      };
      var angleBetweenScratch = new Cartesian2();
      var angleBetweenScratch2 = new Cartesian2();
      Cartesian2.angleBetween = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        Cartesian2.normalize(left, angleBetweenScratch);
        Cartesian2.normalize(right, angleBetweenScratch2);
        return CesiumMath.acosClamped(Cartesian2.dot(angleBetweenScratch, angleBetweenScratch2));
      };
      var mostOrthogonalAxisScratch = new Cartesian2();
      Cartesian2.mostOrthogonalAxis = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var f = Cartesian2.normalize(cartesian, mostOrthogonalAxisScratch);
        Cartesian2.abs(f, f);
        if (f.x <= f.y) {
          result = Cartesian2.clone(Cartesian2.UNIT_X, result);
        } else {
          result = Cartesian2.clone(Cartesian2.UNIT_Y, result);
        }
        return result;
      };
      Cartesian2.equals = function(left, right) {
        return (left === right) || ((defined(left)) && (defined(right)) && (left.x === right.x) && (left.y === right.y));
      };
      Cartesian2.equalsArray = function(cartesian, array, offset) {
        return cartesian.x === array[offset] && cartesian.y === array[offset + 1];
      };
      Cartesian2.equalsEpsilon = function(left, right, relativeEpsilon, absoluteEpsilon) {
        return (left === right) || (defined(left) && defined(right) && CesiumMath.equalsEpsilon(left.x, right.x, relativeEpsilon, absoluteEpsilon) && CesiumMath.equalsEpsilon(left.y, right.y, relativeEpsilon, absoluteEpsilon));
      };
      Cartesian2.ZERO = freezeObject(new Cartesian2(0.0, 0.0));
      Cartesian2.UNIT_X = freezeObject(new Cartesian2(1.0, 0.0));
      Cartesian2.UNIT_Y = freezeObject(new Cartesian2(0.0, 1.0));
      Cartesian2.prototype.clone = function(result) {
        return Cartesian2.clone(this, result);
      };
      Cartesian2.prototype.equals = function(right) {
        return Cartesian2.equals(this, right);
      };
      Cartesian2.prototype.equalsEpsilon = function(right, relativeEpsilon, absoluteEpsilon) {
        return Cartesian2.equalsEpsilon(this, right, relativeEpsilon, absoluteEpsilon);
      };
      Cartesian2.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ')';
      };
      return Cartesian2;
    });
    define('Core/AxisAlignedBoundingBox', ['./Cartesian3', './defaultValue', './defined', './DeveloperError', './Intersect'], function(Cartesian3, defaultValue, defined, DeveloperError, Intersect) {
      'use strict';
      function AxisAlignedBoundingBox(minimum, maximum, center) {
        this.minimum = Cartesian3.clone(defaultValue(minimum, Cartesian3.ZERO));
        this.maximum = Cartesian3.clone(defaultValue(maximum, Cartesian3.ZERO));
        if (!defined(center)) {
          center = Cartesian3.add(this.minimum, this.maximum, new Cartesian3());
          Cartesian3.multiplyByScalar(center, 0.5, center);
        } else {
          center = Cartesian3.clone(center);
        }
        this.center = center;
      }
      AxisAlignedBoundingBox.fromPoints = function(positions, result) {
        if (!defined(result)) {
          result = new AxisAlignedBoundingBox();
        }
        if (!defined(positions) || positions.length === 0) {
          result.minimum = Cartesian3.clone(Cartesian3.ZERO, result.minimum);
          result.maximum = Cartesian3.clone(Cartesian3.ZERO, result.maximum);
          result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
          return result;
        }
        var minimumX = positions[0].x;
        var minimumY = positions[0].y;
        var minimumZ = positions[0].z;
        var maximumX = positions[0].x;
        var maximumY = positions[0].y;
        var maximumZ = positions[0].z;
        var length = positions.length;
        for (var i = 1; i < length; i++) {
          var p = positions[i];
          var x = p.x;
          var y = p.y;
          var z = p.z;
          minimumX = Math.min(x, minimumX);
          maximumX = Math.max(x, maximumX);
          minimumY = Math.min(y, minimumY);
          maximumY = Math.max(y, maximumY);
          minimumZ = Math.min(z, minimumZ);
          maximumZ = Math.max(z, maximumZ);
        }
        var minimum = result.minimum;
        minimum.x = minimumX;
        minimum.y = minimumY;
        minimum.z = minimumZ;
        var maximum = result.maximum;
        maximum.x = maximumX;
        maximum.y = maximumY;
        maximum.z = maximumZ;
        var center = Cartesian3.add(minimum, maximum, result.center);
        Cartesian3.multiplyByScalar(center, 0.5, center);
        return result;
      };
      AxisAlignedBoundingBox.clone = function(box, result) {
        if (!defined(box)) {
          return undefined;
        }
        if (!defined(result)) {
          return new AxisAlignedBoundingBox(box.minimum, box.maximum);
        }
        result.minimum = Cartesian3.clone(box.minimum, result.minimum);
        result.maximum = Cartesian3.clone(box.maximum, result.maximum);
        result.center = Cartesian3.clone(box.center, result.center);
        return result;
      };
      AxisAlignedBoundingBox.equals = function(left, right) {
        return (left === right) || ((defined(left)) && (defined(right)) && Cartesian3.equals(left.center, right.center) && Cartesian3.equals(left.minimum, right.minimum) && Cartesian3.equals(left.maximum, right.maximum));
      };
      var intersectScratch = new Cartesian3();
      AxisAlignedBoundingBox.intersectPlane = function(box, plane) {
        if (!defined(box)) {
          throw new DeveloperError('box is required.');
        }
        if (!defined(plane)) {
          throw new DeveloperError('plane is required.');
        }
        intersectScratch = Cartesian3.subtract(box.maximum, box.minimum, intersectScratch);
        var h = Cartesian3.multiplyByScalar(intersectScratch, 0.5, intersectScratch);
        var normal = plane.normal;
        var e = h.x * Math.abs(normal.x) + h.y * Math.abs(normal.y) + h.z * Math.abs(normal.z);
        var s = Cartesian3.dot(box.center, normal) + plane.distance;
        if (s - e > 0) {
          return Intersect.INSIDE;
        }
        if (s + e < 0) {
          return Intersect.OUTSIDE;
        }
        return Intersect.INTERSECTING;
      };
      AxisAlignedBoundingBox.prototype.clone = function(result) {
        return AxisAlignedBoundingBox.clone(this, result);
      };
      AxisAlignedBoundingBox.prototype.intersectPlane = function(plane) {
        return AxisAlignedBoundingBox.intersectPlane(this, plane);
      };
      AxisAlignedBoundingBox.prototype.equals = function(right) {
        return AxisAlignedBoundingBox.equals(this, right);
      };
      return AxisAlignedBoundingBox;
    });
    (function(define) {
      'use strict';
      define('ThirdParty/when', [], function() {
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
    define('Core/binarySearch', ['./defined', './DeveloperError'], function(defined, DeveloperError) {
      'use strict';
      function binarySearch(array, itemToFind, comparator) {
        if (!defined(array)) {
          throw new DeveloperError('array is required.');
        }
        if (!defined(itemToFind)) {
          throw new DeveloperError('itemToFind is required.');
        }
        if (!defined(comparator)) {
          throw new DeveloperError('comparator is required.');
        }
        var low = 0;
        var high = array.length - 1;
        var i;
        var comparison;
        while (low <= high) {
          i = ~~((low + high) / 2);
          comparison = comparator(array[i], itemToFind);
          if (comparison < 0) {
            low = i + 1;
            continue;
          }
          if (comparison > 0) {
            high = i - 1;
            continue;
          }
          return i;
        }
        return ~(high + 1);
      }
      return binarySearch;
    });
    define('Core/EarthOrientationParametersSample', [], function() {
      'use strict';
      function EarthOrientationParametersSample(xPoleWander, yPoleWander, xPoleOffset, yPoleOffset, ut1MinusUtc) {
        this.xPoleWander = xPoleWander;
        this.yPoleWander = yPoleWander;
        this.xPoleOffset = xPoleOffset;
        this.yPoleOffset = yPoleOffset;
        this.ut1MinusUtc = ut1MinusUtc;
      }
      return EarthOrientationParametersSample;
    });
    define('ThirdParty/sprintf', [], function() {
      function sprintf() {
        var regex = /%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
        var a = arguments,
            i = 0,
            format = a[i++];
        var pad = function(str, len, chr, leftJustify) {
          if (!chr) {
            chr = ' ';
          }
          var padding = (str.length >= len) ? '' : Array(1 + len - str.length >>> 0).join(chr);
          return leftJustify ? str + padding : padding + str;
        };
        var justify = function(value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
          var diff = minWidth - value.length;
          if (diff > 0) {
            if (leftJustify || !zeroPad) {
              value = pad(value, minWidth, customPadChar, leftJustify);
            } else {
              value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
            }
          }
          return value;
        };
        var formatBaseX = function(value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
          var number = value >>> 0;
          prefix = prefix && number && {
            '2': '0b',
            '8': '0',
            '16': '0x'
          }[base] || '';
          value = prefix + pad(number.toString(base), precision || 0, '0', false);
          return justify(value, prefix, leftJustify, minWidth, zeroPad);
        };
        var formatString = function(value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
          if (precision != null) {
            value = value.slice(0, precision);
          }
          return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
        };
        var doFormat = function(substring, valueIndex, flags, minWidth, _, precision, type) {
          var number;
          var prefix;
          var method;
          var textTransform;
          var value;
          if (substring == '%%') {
            return '%';
          }
          var leftJustify = false,
              positivePrefix = '',
              zeroPad = false,
              prefixBaseX = false,
              customPadChar = ' ';
          var flagsl = flags.length;
          for (var j = 0; flags && j < flagsl; j++) {
            switch (flags.charAt(j)) {
              case ' ':
                positivePrefix = ' ';
                break;
              case '+':
                positivePrefix = '+';
                break;
              case '-':
                leftJustify = true;
                break;
              case "'":
                customPadChar = flags.charAt(j + 1);
                break;
              case '0':
                zeroPad = true;
                break;
              case '#':
                prefixBaseX = true;
                break;
            }
          }
          if (!minWidth) {
            minWidth = 0;
          } else if (minWidth == '*') {
            minWidth = +a[i++];
          } else if (minWidth.charAt(0) == '*') {
            minWidth = +a[minWidth.slice(1, -1)];
          } else {
            minWidth = +minWidth;
          }
          if (minWidth < 0) {
            minWidth = -minWidth;
            leftJustify = true;
          }
          if (!isFinite(minWidth)) {
            throw new Error('sprintf: (minimum-)width must be finite');
          }
          if (!precision) {
            precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type == 'd') ? 0 : undefined;
          } else if (precision == '*') {
            precision = +a[i++];
          } else if (precision.charAt(0) == '*') {
            precision = +a[precision.slice(1, -1)];
          } else {
            precision = +precision;
          }
          value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];
          switch (type) {
            case 's':
              return formatString(String(value), leftJustify, minWidth, precision, zeroPad, customPadChar);
            case 'c':
              return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
            case 'b':
              return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'o':
              return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'x':
              return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'X':
              return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad).toUpperCase();
            case 'u':
              return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'i':
            case 'd':
              number = +value || 0;
              number = Math.round(number - number % 1);
              prefix = number < 0 ? '-' : positivePrefix;
              value = prefix + pad(String(Math.abs(number)), precision, '0', false);
              return justify(value, prefix, leftJustify, minWidth, zeroPad);
            case 'e':
            case 'E':
            case 'f':
            case 'F':
            case 'g':
            case 'G':
              number = +value;
              prefix = number < 0 ? '-' : positivePrefix;
              method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
              textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
              value = prefix + Math.abs(number)[method](precision);
              return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
            default:
              return substring;
          }
        };
        return format.replace(regex, doFormat);
      }
      return sprintf;
    });
    define('Core/GregorianDate', [], function() {
      'use strict';
      function GregorianDate(year, month, day, hour, minute, second, millisecond, isLeapSecond) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.millisecond = millisecond;
        this.isLeapSecond = isLeapSecond;
      }
      return GregorianDate;
    });
    define('Core/isLeapYear', ['./DeveloperError'], function(DeveloperError) {
      'use strict';
      function isLeapYear(year) {
        if (year === null || isNaN(year)) {
          throw new DeveloperError('year is required and must be a number.');
        }
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
      }
      return isLeapYear;
    });
    define('Core/LeapSecond', [], function() {
      'use strict';
      function LeapSecond(date, offset) {
        this.julianDate = date;
        this.offset = offset;
      }
      return LeapSecond;
    });
    define('Core/TimeConstants', ['./freezeObject'], function(freezeObject) {
      'use strict';
      var TimeConstants = {
        SECONDS_PER_MILLISECOND: 0.001,
        SECONDS_PER_MINUTE: 60.0,
        MINUTES_PER_HOUR: 60.0,
        HOURS_PER_DAY: 24.0,
        SECONDS_PER_HOUR: 3600.0,
        MINUTES_PER_DAY: 1440.0,
        SECONDS_PER_DAY: 86400.0,
        DAYS_PER_JULIAN_CENTURY: 36525.0,
        PICOSECOND: 0.000000001,
        MODIFIED_JULIAN_DATE_DIFFERENCE: 2400000.5
      };
      return freezeObject(TimeConstants);
    });
    define('Core/TimeStandard', ['./freezeObject'], function(freezeObject) {
      'use strict';
      var TimeStandard = {
        UTC: 0,
        TAI: 1
      };
      return freezeObject(TimeStandard);
    });
    define('Core/JulianDate', ['../ThirdParty/sprintf', './binarySearch', './defaultValue', './defined', './DeveloperError', './GregorianDate', './isLeapYear', './LeapSecond', './TimeConstants', './TimeStandard'], function(sprintf, binarySearch, defaultValue, defined, DeveloperError, GregorianDate, isLeapYear, LeapSecond, TimeConstants, TimeStandard) {
      'use strict';
      var gregorianDateScratch = new GregorianDate();
      var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var daysInLeapFeburary = 29;
      function compareLeapSecondDates(leapSecond, dateToFind) {
        return JulianDate.compare(leapSecond.julianDate, dateToFind.julianDate);
      }
      var binarySearchScratchLeapSecond = new LeapSecond();
      function convertUtcToTai(julianDate) {
        binarySearchScratchLeapSecond.julianDate = julianDate;
        var leapSeconds = JulianDate.leapSeconds;
        var index = binarySearch(leapSeconds, binarySearchScratchLeapSecond, compareLeapSecondDates);
        if (index < 0) {
          index = ~index;
        }
        if (index >= leapSeconds.length) {
          index = leapSeconds.length - 1;
        }
        var offset = leapSeconds[index].offset;
        if (index > 0) {
          var difference = JulianDate.secondsDifference(leapSeconds[index].julianDate, julianDate);
          if (difference > offset) {
            index--;
            offset = leapSeconds[index].offset;
          }
        }
        JulianDate.addSeconds(julianDate, offset, julianDate);
      }
      function convertTaiToUtc(julianDate, result) {
        binarySearchScratchLeapSecond.julianDate = julianDate;
        var leapSeconds = JulianDate.leapSeconds;
        var index = binarySearch(leapSeconds, binarySearchScratchLeapSecond, compareLeapSecondDates);
        if (index < 0) {
          index = ~index;
        }
        if (index === 0) {
          return JulianDate.addSeconds(julianDate, -leapSeconds[0].offset, result);
        }
        if (index >= leapSeconds.length) {
          return JulianDate.addSeconds(julianDate, -leapSeconds[index - 1].offset, result);
        }
        var difference = JulianDate.secondsDifference(leapSeconds[index].julianDate, julianDate);
        if (difference === 0) {
          return JulianDate.addSeconds(julianDate, -leapSeconds[index].offset, result);
        }
        if (difference <= 1.0) {
          return undefined;
        }
        return JulianDate.addSeconds(julianDate, -leapSeconds[--index].offset, result);
      }
      function setComponents(wholeDays, secondsOfDay, julianDate) {
        var extraDays = (secondsOfDay / TimeConstants.SECONDS_PER_DAY) | 0;
        wholeDays += extraDays;
        secondsOfDay -= TimeConstants.SECONDS_PER_DAY * extraDays;
        if (secondsOfDay < 0) {
          wholeDays--;
          secondsOfDay += TimeConstants.SECONDS_PER_DAY;
        }
        julianDate.dayNumber = wholeDays;
        julianDate.secondsOfDay = secondsOfDay;
        return julianDate;
      }
      function computeJulianDateComponents(year, month, day, hour, minute, second, millisecond) {
        var a = ((month - 14) / 12) | 0;
        var b = year + 4800 + a;
        var dayNumber = (((1461 * b) / 4) | 0) + (((367 * (month - 2 - 12 * a)) / 12) | 0) - (((3 * (((b + 100) / 100) | 0)) / 4) | 0) + day - 32075;
        hour = hour - 12;
        if (hour < 0) {
          hour += 24;
        }
        var secondsOfDay = second + ((hour * TimeConstants.SECONDS_PER_HOUR) + (minute * TimeConstants.SECONDS_PER_MINUTE) + (millisecond * TimeConstants.SECONDS_PER_MILLISECOND));
        if (secondsOfDay >= 43200.0) {
          dayNumber -= 1;
        }
        return [dayNumber, secondsOfDay];
      }
      var matchCalendarYear = /^(\d{4})$/;
      var matchCalendarMonth = /^(\d{4})-(\d{2})$/;
      var matchOrdinalDate = /^(\d{4})-?(\d{3})$/;
      var matchWeekDate = /^(\d{4})-?W(\d{2})-?(\d{1})?$/;
      var matchCalendarDate = /^(\d{4})-?(\d{2})-?(\d{2})$/;
      var utcOffset = /([Z+\-])?(\d{2})?:?(\d{2})?$/;
      var matchHours = /^(\d{2})(\.\d+)?/.source + utcOffset.source;
      var matchHoursMinutes = /^(\d{2}):?(\d{2})(\.\d+)?/.source + utcOffset.source;
      var matchHoursMinutesSeconds = /^(\d{2}):?(\d{2}):?(\d{2})(\.\d+)?/.source + utcOffset.source;
      var iso8601ErrorMessage = 'Invalid ISO 8601 date.';
      function JulianDate(julianDayNumber, secondsOfDay, timeStandard) {
        this.dayNumber = undefined;
        this.secondsOfDay = undefined;
        julianDayNumber = defaultValue(julianDayNumber, 0.0);
        secondsOfDay = defaultValue(secondsOfDay, 0.0);
        timeStandard = defaultValue(timeStandard, TimeStandard.UTC);
        var wholeDays = julianDayNumber | 0;
        secondsOfDay = secondsOfDay + (julianDayNumber - wholeDays) * TimeConstants.SECONDS_PER_DAY;
        setComponents(wholeDays, secondsOfDay, this);
        if (timeStandard === TimeStandard.UTC) {
          convertUtcToTai(this);
        }
      }
      JulianDate.fromDate = function(date, result) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
          throw new DeveloperError('date must be a valid JavaScript Date.');
        }
        var components = computeJulianDateComponents(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
        if (!defined(result)) {
          return new JulianDate(components[0], components[1], TimeStandard.UTC);
        }
        setComponents(components[0], components[1], result);
        convertUtcToTai(result);
        return result;
      };
      JulianDate.fromIso8601 = function(iso8601String, result) {
        if (typeof iso8601String !== 'string') {
          throw new DeveloperError(iso8601ErrorMessage);
        }
        iso8601String = iso8601String.replace(',', '.');
        var tokens = iso8601String.split('T');
        var year;
        var month = 1;
        var day = 1;
        var hour = 0;
        var minute = 0;
        var second = 0;
        var millisecond = 0;
        var date = tokens[0];
        var time = tokens[1];
        var tmp;
        var inLeapYear;
        if (!defined(date)) {
          throw new DeveloperError(iso8601ErrorMessage);
        }
        var dashCount;
        tokens = date.match(matchCalendarDate);
        if (tokens !== null) {
          dashCount = date.split('-').length - 1;
          if (dashCount > 0 && dashCount !== 2) {
            throw new DeveloperError(iso8601ErrorMessage);
          }
          year = +tokens[1];
          month = +tokens[2];
          day = +tokens[3];
        } else {
          tokens = date.match(matchCalendarMonth);
          if (tokens !== null) {
            year = +tokens[1];
            month = +tokens[2];
          } else {
            tokens = date.match(matchCalendarYear);
            if (tokens !== null) {
              year = +tokens[1];
            } else {
              var dayOfYear;
              tokens = date.match(matchOrdinalDate);
              if (tokens !== null) {
                year = +tokens[1];
                dayOfYear = +tokens[2];
                inLeapYear = isLeapYear(year);
                if (dayOfYear < 1 || (inLeapYear && dayOfYear > 366) || (!inLeapYear && dayOfYear > 365)) {
                  throw new DeveloperError(iso8601ErrorMessage);
                }
              } else {
                tokens = date.match(matchWeekDate);
                if (tokens !== null) {
                  year = +tokens[1];
                  var weekNumber = +tokens[2];
                  var dayOfWeek = +tokens[3] || 0;
                  dashCount = date.split('-').length - 1;
                  if (dashCount > 0 && ((!defined(tokens[3]) && dashCount !== 1) || (defined(tokens[3]) && dashCount !== 2))) {
                    throw new DeveloperError(iso8601ErrorMessage);
                  }
                  var january4 = new Date(Date.UTC(year, 0, 4));
                  dayOfYear = (weekNumber * 7) + dayOfWeek - january4.getUTCDay() - 3;
                } else {
                  throw new DeveloperError(iso8601ErrorMessage);
                }
              }
              tmp = new Date(Date.UTC(year, 0, 1));
              tmp.setUTCDate(dayOfYear);
              month = tmp.getUTCMonth() + 1;
              day = tmp.getUTCDate();
            }
          }
        }
        inLeapYear = isLeapYear(year);
        if (month < 1 || month > 12 || day < 1 || ((month !== 2 || !inLeapYear) && day > daysInMonth[month - 1]) || (inLeapYear && month === 2 && day > daysInLeapFeburary)) {
          throw new DeveloperError(iso8601ErrorMessage);
        }
        var offsetIndex;
        if (defined(time)) {
          tokens = time.match(matchHoursMinutesSeconds);
          if (tokens !== null) {
            dashCount = time.split(':').length - 1;
            if (dashCount > 0 && dashCount !== 2 && dashCount !== 3) {
              throw new DeveloperError(iso8601ErrorMessage);
            }
            hour = +tokens[1];
            minute = +tokens[2];
            second = +tokens[3];
            millisecond = +(tokens[4] || 0) * 1000.0;
            offsetIndex = 5;
          } else {
            tokens = time.match(matchHoursMinutes);
            if (tokens !== null) {
              dashCount = time.split(':').length - 1;
              if (dashCount > 2) {
                throw new DeveloperError(iso8601ErrorMessage);
              }
              hour = +tokens[1];
              minute = +tokens[2];
              second = +(tokens[3] || 0) * 60.0;
              offsetIndex = 4;
            } else {
              tokens = time.match(matchHours);
              if (tokens !== null) {
                hour = +tokens[1];
                minute = +(tokens[2] || 0) * 60.0;
                offsetIndex = 3;
              } else {
                throw new DeveloperError(iso8601ErrorMessage);
              }
            }
          }
          if (minute >= 60 || second >= 61 || hour > 24 || (hour === 24 && (minute > 0 || second > 0 || millisecond > 0))) {
            throw new DeveloperError(iso8601ErrorMessage);
          }
          var offset = tokens[offsetIndex];
          var offsetHours = +(tokens[offsetIndex + 1]);
          var offsetMinutes = +(tokens[offsetIndex + 2] || 0);
          switch (offset) {
            case '+':
              hour = hour - offsetHours;
              minute = minute - offsetMinutes;
              break;
            case '-':
              hour = hour + offsetHours;
              minute = minute + offsetMinutes;
              break;
            case 'Z':
              break;
            default:
              minute = minute + new Date(Date.UTC(year, month - 1, day, hour, minute)).getTimezoneOffset();
              break;
          }
        } else {
          minute = minute + new Date(year, month - 1, day).getTimezoneOffset();
        }
        var isLeapSecond = second === 60;
        if (isLeapSecond) {
          second--;
        }
        while (minute >= 60) {
          minute -= 60;
          hour++;
        }
        while (hour >= 24) {
          hour -= 24;
          day++;
        }
        tmp = (inLeapYear && month === 2) ? daysInLeapFeburary : daysInMonth[month - 1];
        while (day > tmp) {
          day -= tmp;
          month++;
          if (month > 12) {
            month -= 12;
            year++;
          }
          tmp = (inLeapYear && month === 2) ? daysInLeapFeburary : daysInMonth[month - 1];
        }
        while (minute < 0) {
          minute += 60;
          hour--;
        }
        while (hour < 0) {
          hour += 24;
          day--;
        }
        while (day < 1) {
          month--;
          if (month < 1) {
            month += 12;
            year--;
          }
          tmp = (inLeapYear && month === 2) ? daysInLeapFeburary : daysInMonth[month - 1];
          day += tmp;
        }
        var components = computeJulianDateComponents(year, month, day, hour, minute, second, millisecond);
        if (!defined(result)) {
          result = new JulianDate(components[0], components[1], TimeStandard.UTC);
        } else {
          setComponents(components[0], components[1], result);
          convertUtcToTai(result);
        }
        if (isLeapSecond) {
          JulianDate.addSeconds(result, 1, result);
        }
        return result;
      };
      JulianDate.now = function(result) {
        return JulianDate.fromDate(new Date(), result);
      };
      var toGregorianDateScratch = new JulianDate(0, 0, TimeStandard.TAI);
      JulianDate.toGregorianDate = function(julianDate, result) {
        if (!defined(julianDate)) {
          throw new DeveloperError('julianDate is required.');
        }
        var isLeapSecond = false;
        var thisUtc = convertTaiToUtc(julianDate, toGregorianDateScratch);
        if (!defined(thisUtc)) {
          JulianDate.addSeconds(julianDate, -1, toGregorianDateScratch);
          thisUtc = convertTaiToUtc(toGregorianDateScratch, toGregorianDateScratch);
          isLeapSecond = true;
        }
        var julianDayNumber = thisUtc.dayNumber;
        var secondsOfDay = thisUtc.secondsOfDay;
        if (secondsOfDay >= 43200.0) {
          julianDayNumber += 1;
        }
        var L = (julianDayNumber + 68569) | 0;
        var N = (4 * L / 146097) | 0;
        L = (L - (((146097 * N + 3) / 4) | 0)) | 0;
        var I = ((4000 * (L + 1)) / 1461001) | 0;
        L = (L - (((1461 * I) / 4) | 0) + 31) | 0;
        var J = ((80 * L) / 2447) | 0;
        var day = (L - (((2447 * J) / 80) | 0)) | 0;
        L = (J / 11) | 0;
        var month = (J + 2 - 12 * L) | 0;
        var year = (100 * (N - 49) + I + L) | 0;
        var hour = (secondsOfDay / TimeConstants.SECONDS_PER_HOUR) | 0;
        var remainingSeconds = secondsOfDay - (hour * TimeConstants.SECONDS_PER_HOUR);
        var minute = (remainingSeconds / TimeConstants.SECONDS_PER_MINUTE) | 0;
        remainingSeconds = remainingSeconds - (minute * TimeConstants.SECONDS_PER_MINUTE);
        var second = remainingSeconds | 0;
        var millisecond = ((remainingSeconds - second) / TimeConstants.SECONDS_PER_MILLISECOND);
        hour += 12;
        if (hour > 23) {
          hour -= 24;
        }
        if (isLeapSecond) {
          second += 1;
        }
        if (!defined(result)) {
          return new GregorianDate(year, month, day, hour, minute, second, millisecond, isLeapSecond);
        }
        result.year = year;
        result.month = month;
        result.day = day;
        result.hour = hour;
        result.minute = minute;
        result.second = second;
        result.millisecond = millisecond;
        result.isLeapSecond = isLeapSecond;
        return result;
      };
      JulianDate.toDate = function(julianDate) {
        if (!defined(julianDate)) {
          throw new DeveloperError('julianDate is required.');
        }
        var gDate = JulianDate.toGregorianDate(julianDate, gregorianDateScratch);
        var second = gDate.second;
        if (gDate.isLeapSecond) {
          second -= 1;
        }
        return new Date(Date.UTC(gDate.year, gDate.month - 1, gDate.day, gDate.hour, gDate.minute, second, gDate.millisecond));
      };
      JulianDate.toIso8601 = function(julianDate, precision) {
        if (!defined(julianDate)) {
          throw new DeveloperError('julianDate is required.');
        }
        var gDate = JulianDate.toGregorianDate(julianDate, gDate);
        var millisecondStr;
        if (!defined(precision) && gDate.millisecond !== 0) {
          millisecondStr = (gDate.millisecond * 0.01).toString().replace('.', '');
          return sprintf("%04d-%02d-%02dT%02d:%02d:%02d.%sZ", gDate.year, gDate.month, gDate.day, gDate.hour, gDate.minute, gDate.second, millisecondStr);
        }
        if (!defined(precision) || precision === 0) {
          return sprintf("%04d-%02d-%02dT%02d:%02d:%02dZ", gDate.year, gDate.month, gDate.day, gDate.hour, gDate.minute, gDate.second);
        }
        millisecondStr = (gDate.millisecond * 0.01).toFixed(precision).replace('.', '').slice(0, precision);
        return sprintf("%04d-%02d-%02dT%02d:%02d:%02d.%sZ", gDate.year, gDate.month, gDate.day, gDate.hour, gDate.minute, gDate.second, millisecondStr);
      };
      JulianDate.clone = function(julianDate, result) {
        if (!defined(julianDate)) {
          return undefined;
        }
        if (!defined(result)) {
          return new JulianDate(julianDate.dayNumber, julianDate.secondsOfDay, TimeStandard.TAI);
        }
        result.dayNumber = julianDate.dayNumber;
        result.secondsOfDay = julianDate.secondsOfDay;
        return result;
      };
      JulianDate.compare = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required.');
        }
        var julianDayNumberDifference = left.dayNumber - right.dayNumber;
        if (julianDayNumberDifference !== 0) {
          return julianDayNumberDifference;
        }
        return left.secondsOfDay - right.secondsOfDay;
      };
      JulianDate.equals = function(left, right) {
        return (left === right) || (defined(left) && defined(right) && left.dayNumber === right.dayNumber && left.secondsOfDay === right.secondsOfDay);
      };
      JulianDate.equalsEpsilon = function(left, right, epsilon) {
        if (!defined(epsilon)) {
          throw new DeveloperError('epsilon is required.');
        }
        return (left === right) || (defined(left) && defined(right) && Math.abs(JulianDate.secondsDifference(left, right)) <= epsilon);
      };
      JulianDate.totalDays = function(julianDate) {
        if (!defined(julianDate)) {
          throw new DeveloperError('julianDate is required.');
        }
        return julianDate.dayNumber + (julianDate.secondsOfDay / TimeConstants.SECONDS_PER_DAY);
      };
      JulianDate.secondsDifference = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required.');
        }
        var dayDifference = (left.dayNumber - right.dayNumber) * TimeConstants.SECONDS_PER_DAY;
        return (dayDifference + (left.secondsOfDay - right.secondsOfDay));
      };
      JulianDate.daysDifference = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required.');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required.');
        }
        var dayDifference = (left.dayNumber - right.dayNumber);
        var secondDifference = (left.secondsOfDay - right.secondsOfDay) / TimeConstants.SECONDS_PER_DAY;
        return dayDifference + secondDifference;
      };
      JulianDate.computeTaiMinusUtc = function(julianDate) {
        binarySearchScratchLeapSecond.julianDate = julianDate;
        var leapSeconds = JulianDate.leapSeconds;
        var index = binarySearch(leapSeconds, binarySearchScratchLeapSecond, compareLeapSecondDates);
        if (index < 0) {
          index = ~index;
          --index;
          if (index < 0) {
            index = 0;
          }
        }
        return leapSeconds[index].offset;
      };
      JulianDate.addSeconds = function(julianDate, seconds, result) {
        if (!defined(julianDate)) {
          throw new DeveloperError('julianDate is required.');
        }
        if (!defined(seconds)) {
          throw new DeveloperError('seconds is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        return setComponents(julianDate.dayNumber, julianDate.secondsOfDay + seconds, result);
      };
      JulianDate.addMinutes = function(julianDate, minutes, result) {
        if (!defined(julianDate)) {
          throw new DeveloperError('julianDate is required.');
        }
        if (!defined(minutes)) {
          throw new DeveloperError('minutes is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var newSecondsOfDay = julianDate.secondsOfDay + (minutes * TimeConstants.SECONDS_PER_MINUTE);
        return setComponents(julianDate.dayNumber, newSecondsOfDay, result);
      };
      JulianDate.addHours = function(julianDate, hours, result) {
        if (!defined(julianDate)) {
          throw new DeveloperError('julianDate is required.');
        }
        if (!defined(hours)) {
          throw new DeveloperError('hours is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var newSecondsOfDay = julianDate.secondsOfDay + (hours * TimeConstants.SECONDS_PER_HOUR);
        return setComponents(julianDate.dayNumber, newSecondsOfDay, result);
      };
      JulianDate.addDays = function(julianDate, days, result) {
        if (!defined(julianDate)) {
          throw new DeveloperError('julianDate is required.');
        }
        if (!defined(days)) {
          throw new DeveloperError('days is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var newJulianDayNumber = julianDate.dayNumber + days;
        return setComponents(newJulianDayNumber, julianDate.secondsOfDay, result);
      };
      JulianDate.lessThan = function(left, right) {
        return JulianDate.compare(left, right) < 0;
      };
      JulianDate.lessThanOrEquals = function(left, right) {
        return JulianDate.compare(left, right) <= 0;
      };
      JulianDate.greaterThan = function(left, right) {
        return JulianDate.compare(left, right) > 0;
      };
      JulianDate.greaterThanOrEquals = function(left, right) {
        return JulianDate.compare(left, right) >= 0;
      };
      JulianDate.prototype.clone = function(result) {
        return JulianDate.clone(this, result);
      };
      JulianDate.prototype.equals = function(right) {
        return JulianDate.equals(this, right);
      };
      JulianDate.prototype.equalsEpsilon = function(right, epsilon) {
        return JulianDate.equalsEpsilon(this, right, epsilon);
      };
      JulianDate.prototype.toString = function() {
        return JulianDate.toIso8601(this);
      };
      JulianDate.leapSeconds = [new LeapSecond(new JulianDate(2441317, 43210.0, TimeStandard.TAI), 10), new LeapSecond(new JulianDate(2441499, 43211.0, TimeStandard.TAI), 11), new LeapSecond(new JulianDate(2441683, 43212.0, TimeStandard.TAI), 12), new LeapSecond(new JulianDate(2442048, 43213.0, TimeStandard.TAI), 13), new LeapSecond(new JulianDate(2442413, 43214.0, TimeStandard.TAI), 14), new LeapSecond(new JulianDate(2442778, 43215.0, TimeStandard.TAI), 15), new LeapSecond(new JulianDate(2443144, 43216.0, TimeStandard.TAI), 16), new LeapSecond(new JulianDate(2443509, 43217.0, TimeStandard.TAI), 17), new LeapSecond(new JulianDate(2443874, 43218.0, TimeStandard.TAI), 18), new LeapSecond(new JulianDate(2444239, 43219.0, TimeStandard.TAI), 19), new LeapSecond(new JulianDate(2444786, 43220.0, TimeStandard.TAI), 20), new LeapSecond(new JulianDate(2445151, 43221.0, TimeStandard.TAI), 21), new LeapSecond(new JulianDate(2445516, 43222.0, TimeStandard.TAI), 22), new LeapSecond(new JulianDate(2446247, 43223.0, TimeStandard.TAI), 23), new LeapSecond(new JulianDate(2447161, 43224.0, TimeStandard.TAI), 24), new LeapSecond(new JulianDate(2447892, 43225.0, TimeStandard.TAI), 25), new LeapSecond(new JulianDate(2448257, 43226.0, TimeStandard.TAI), 26), new LeapSecond(new JulianDate(2448804, 43227.0, TimeStandard.TAI), 27), new LeapSecond(new JulianDate(2449169, 43228.0, TimeStandard.TAI), 28), new LeapSecond(new JulianDate(2449534, 43229.0, TimeStandard.TAI), 29), new LeapSecond(new JulianDate(2450083, 43230.0, TimeStandard.TAI), 30), new LeapSecond(new JulianDate(2450630, 43231.0, TimeStandard.TAI), 31), new LeapSecond(new JulianDate(2451179, 43232.0, TimeStandard.TAI), 32), new LeapSecond(new JulianDate(2453736, 43233.0, TimeStandard.TAI), 33), new LeapSecond(new JulianDate(2454832, 43234.0, TimeStandard.TAI), 34), new LeapSecond(new JulianDate(2456109, 43235.0, TimeStandard.TAI), 35), new LeapSecond(new JulianDate(2457204, 43236.0, TimeStandard.TAI), 36)];
      return JulianDate;
    });
    define('Core/clone', ['./defaultValue'], function(defaultValue) {
      'use strict';
      function clone(object, deep) {
        if (object === null || typeof object !== 'object') {
          return object;
        }
        deep = defaultValue(deep, false);
        var result = new object.constructor();
        for (var propertyName in object) {
          if (object.hasOwnProperty(propertyName)) {
            var value = object[propertyName];
            if (deep) {
              value = clone(value, deep);
            }
            result[propertyName] = value;
          }
        }
        return result;
      }
      return clone;
    });
    define('Core/parseResponseHeaders', [], function() {
      'use strict';
      function parseResponseHeaders(headerString) {
        var headers = {};
        if (!headerString) {
          return headers;
        }
        var headerPairs = headerString.split('\u000d\u000a');
        for (var i = 0; i < headerPairs.length; ++i) {
          var headerPair = headerPairs[i];
          var index = headerPair.indexOf('\u003a\u0020');
          if (index > 0) {
            var key = headerPair.substring(0, index);
            var val = headerPair.substring(index + 2);
            headers[key] = val;
          }
        }
        return headers;
      }
      return parseResponseHeaders;
    });
    define('Core/RequestErrorEvent', ['./defined', './parseResponseHeaders'], function(defined, parseResponseHeaders) {
      'use strict';
      function RequestErrorEvent(statusCode, response, responseHeaders) {
        this.statusCode = statusCode;
        this.response = response;
        this.responseHeaders = responseHeaders;
        if (typeof this.responseHeaders === 'string') {
          this.responseHeaders = parseResponseHeaders(this.responseHeaders);
        }
      }
      RequestErrorEvent.prototype.toString = function() {
        var str = 'Request has failed.';
        if (defined(this.statusCode)) {
          str += ' Status Code: ' + this.statusCode;
        }
        return str;
      };
      return RequestErrorEvent;
    });
    define('Core/loadWithXhr', ['../ThirdParty/when', './defaultValue', './defined', './DeveloperError', './RequestErrorEvent', './RuntimeError'], function(when, defaultValue, defined, DeveloperError, RequestErrorEvent, RuntimeError) {
      'use strict';
      function loadWithXhr(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        if (!defined(options.url)) {
          throw new DeveloperError('options.url is required.');
        }
        var responseType = options.responseType;
        var method = defaultValue(options.method, 'GET');
        var data = options.data;
        var headers = options.headers;
        var overrideMimeType = options.overrideMimeType;
        return when(options.url, function(url) {
          var deferred = when.defer();
          loadWithXhr.load(url, responseType, method, data, headers, deferred, overrideMimeType);
          return deferred.promise;
        });
      }
      var dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;
      function decodeDataUriText(isBase64, data) {
        var result = decodeURIComponent(data);
        if (isBase64) {
          return atob(result);
        }
        return result;
      }
      function decodeDataUriArrayBuffer(isBase64, data) {
        var byteString = decodeDataUriText(isBase64, data);
        var buffer = new ArrayBuffer(byteString.length);
        var view = new Uint8Array(buffer);
        for (var i = 0; i < byteString.length; i++) {
          view[i] = byteString.charCodeAt(i);
        }
        return buffer;
      }
      function decodeDataUri(dataUriRegexResult, responseType) {
        responseType = defaultValue(responseType, '');
        var mimeType = dataUriRegexResult[1];
        var isBase64 = !!dataUriRegexResult[2];
        var data = dataUriRegexResult[3];
        switch (responseType) {
          case '':
          case 'text':
            return decodeDataUriText(isBase64, data);
          case 'arraybuffer':
            return decodeDataUriArrayBuffer(isBase64, data);
          case 'blob':
            var buffer = decodeDataUriArrayBuffer(isBase64, data);
            return new Blob([buffer], {type: mimeType});
          case 'document':
            var parser = new DOMParser();
            return parser.parseFromString(decodeDataUriText(isBase64, data), mimeType);
          case 'json':
            return JSON.parse(decodeDataUriText(isBase64, data));
          default:
            throw new DeveloperError('Unhandled responseType: ' + responseType);
        }
      }
      loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType) {
        var dataUriRegexResult = dataUriRegex.exec(url);
        if (dataUriRegexResult !== null) {
          deferred.resolve(decodeDataUri(dataUriRegexResult, responseType));
          return;
        }
        var xhr = new XMLHttpRequest();
        if (defined(overrideMimeType) && defined(xhr.overrideMimeType)) {
          xhr.overrideMimeType(overrideMimeType);
        }
        xhr.open(method, url, true);
        if (defined(headers)) {
          for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
              xhr.setRequestHeader(key, headers[key]);
            }
          }
        }
        if (defined(responseType)) {
          xhr.responseType = responseType;
        }
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (defined(xhr.response)) {
              deferred.resolve(xhr.response);
            } else {
              if (defined(xhr.responseXML) && xhr.responseXML.hasChildNodes()) {
                deferred.resolve(xhr.responseXML);
              } else if (defined(xhr.responseText)) {
                deferred.resolve(xhr.responseText);
              } else {
                deferred.reject(new RuntimeError('unknown XMLHttpRequest response type.'));
              }
            }
          } else {
            deferred.reject(new RequestErrorEvent(xhr.status, xhr.response, xhr.getAllResponseHeaders()));
          }
        };
        xhr.onerror = function(e) {
          deferred.reject(new RequestErrorEvent());
        };
        xhr.send(data);
      };
      loadWithXhr.defaultLoad = loadWithXhr.load;
      return loadWithXhr;
    });
    define('Core/loadText', ['./loadWithXhr'], function(loadWithXhr) {
      'use strict';
      function loadText(url, headers) {
        return loadWithXhr({
          url: url,
          headers: headers
        });
      }
      return loadText;
    });
    define('Core/loadJson', ['./clone', './defined', './DeveloperError', './loadText'], function(clone, defined, DeveloperError, loadText) {
      'use strict';
      var defaultHeaders = {Accept: 'application/json,*/*;q=0.01'};
      function loadJson(url, headers) {
        if (!defined(url)) {
          throw new DeveloperError('url is required.');
        }
        if (!defined(headers)) {
          headers = defaultHeaders;
        } else if (!defined(headers.Accept)) {
          headers = clone(headers);
          headers.Accept = defaultHeaders.Accept;
        }
        return loadText(url, headers).then(function(value) {
          return JSON.parse(value);
        });
      }
      return loadJson;
    });
    define('Core/EarthOrientationParameters', ['../ThirdParty/when', './binarySearch', './defaultValue', './defined', './EarthOrientationParametersSample', './freezeObject', './JulianDate', './LeapSecond', './loadJson', './RuntimeError', './TimeConstants', './TimeStandard'], function(when, binarySearch, defaultValue, defined, EarthOrientationParametersSample, freezeObject, JulianDate, LeapSecond, loadJson, RuntimeError, TimeConstants, TimeStandard) {
      'use strict';
      function EarthOrientationParameters(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        this._dates = undefined;
        this._samples = undefined;
        this._dateColumn = -1;
        this._xPoleWanderRadiansColumn = -1;
        this._yPoleWanderRadiansColumn = -1;
        this._ut1MinusUtcSecondsColumn = -1;
        this._xCelestialPoleOffsetRadiansColumn = -1;
        this._yCelestialPoleOffsetRadiansColumn = -1;
        this._taiMinusUtcSecondsColumn = -1;
        this._columnCount = 0;
        this._lastIndex = -1;
        this._downloadPromise = undefined;
        this._dataError = undefined;
        this._addNewLeapSeconds = defaultValue(options.addNewLeapSeconds, true);
        if (defined(options.data)) {
          onDataReady(this, options.data);
        } else if (defined(options.url)) {
          var that = this;
          this._downloadPromise = when(loadJson(options.url), function(eopData) {
            onDataReady(that, eopData);
          }, function() {
            that._dataError = 'An error occurred while retrieving the EOP data from the URL ' + options.url + '.';
          });
        } else {
          onDataReady(this, {
            'columnNames': ['dateIso8601', 'modifiedJulianDateUtc', 'xPoleWanderRadians', 'yPoleWanderRadians', 'ut1MinusUtcSeconds', 'lengthOfDayCorrectionSeconds', 'xCelestialPoleOffsetRadians', 'yCelestialPoleOffsetRadians', 'taiMinusUtcSeconds'],
            'samples': []
          });
        }
      }
      EarthOrientationParameters.NONE = freezeObject({
        getPromiseToLoad: function() {
          return when();
        },
        compute: function(date, result) {
          if (!defined(result)) {
            result = new EarthOrientationParametersSample(0.0, 0.0, 0.0, 0.0, 0.0);
          } else {
            result.xPoleWander = 0.0;
            result.yPoleWander = 0.0;
            result.xPoleOffset = 0.0;
            result.yPoleOffset = 0.0;
            result.ut1MinusUtc = 0.0;
          }
          return result;
        }
      });
      EarthOrientationParameters.prototype.getPromiseToLoad = function() {
        return when(this._downloadPromise);
      };
      EarthOrientationParameters.prototype.compute = function(date, result) {
        if (!defined(this._samples)) {
          if (defined(this._dataError)) {
            throw new RuntimeError(this._dataError);
          }
          return undefined;
        }
        if (!defined(result)) {
          result = new EarthOrientationParametersSample(0.0, 0.0, 0.0, 0.0, 0.0);
        }
        if (this._samples.length === 0) {
          result.xPoleWander = 0.0;
          result.yPoleWander = 0.0;
          result.xPoleOffset = 0.0;
          result.yPoleOffset = 0.0;
          result.ut1MinusUtc = 0.0;
          return result;
        }
        var dates = this._dates;
        var lastIndex = this._lastIndex;
        var before = 0;
        var after = 0;
        if (defined(lastIndex)) {
          var previousIndexDate = dates[lastIndex];
          var nextIndexDate = dates[lastIndex + 1];
          var isAfterPrevious = JulianDate.lessThanOrEquals(previousIndexDate, date);
          var isAfterLastSample = !defined(nextIndexDate);
          var isBeforeNext = isAfterLastSample || JulianDate.greaterThanOrEquals(nextIndexDate, date);
          if (isAfterPrevious && isBeforeNext) {
            before = lastIndex;
            if (!isAfterLastSample && nextIndexDate.equals(date)) {
              ++before;
            }
            after = before + 1;
            interpolate(this, dates, this._samples, date, before, after, result);
            return result;
          }
        }
        var index = binarySearch(dates, date, JulianDate.compare, this._dateColumn);
        if (index >= 0) {
          if (index < dates.length - 1 && dates[index + 1].equals(date)) {
            ++index;
          }
          before = index;
          after = index;
        } else {
          after = ~index;
          before = after - 1;
          if (before < 0) {
            before = 0;
          }
        }
        this._lastIndex = before;
        interpolate(this, dates, this._samples, date, before, after, result);
        return result;
      };
      function compareLeapSecondDates(leapSecond, dateToFind) {
        return JulianDate.compare(leapSecond.julianDate, dateToFind);
      }
      function onDataReady(eop, eopData) {
        if (!defined(eopData.columnNames)) {
          eop._dataError = 'Error in loaded EOP data: The columnNames property is required.';
          return;
        }
        if (!defined(eopData.samples)) {
          eop._dataError = 'Error in loaded EOP data: The samples property is required.';
          return;
        }
        var dateColumn = eopData.columnNames.indexOf('modifiedJulianDateUtc');
        var xPoleWanderRadiansColumn = eopData.columnNames.indexOf('xPoleWanderRadians');
        var yPoleWanderRadiansColumn = eopData.columnNames.indexOf('yPoleWanderRadians');
        var ut1MinusUtcSecondsColumn = eopData.columnNames.indexOf('ut1MinusUtcSeconds');
        var xCelestialPoleOffsetRadiansColumn = eopData.columnNames.indexOf('xCelestialPoleOffsetRadians');
        var yCelestialPoleOffsetRadiansColumn = eopData.columnNames.indexOf('yCelestialPoleOffsetRadians');
        var taiMinusUtcSecondsColumn = eopData.columnNames.indexOf('taiMinusUtcSeconds');
        if (dateColumn < 0 || xPoleWanderRadiansColumn < 0 || yPoleWanderRadiansColumn < 0 || ut1MinusUtcSecondsColumn < 0 || xCelestialPoleOffsetRadiansColumn < 0 || yCelestialPoleOffsetRadiansColumn < 0 || taiMinusUtcSecondsColumn < 0) {
          eop._dataError = 'Error in loaded EOP data: The columnNames property must include modifiedJulianDateUtc, xPoleWanderRadians, yPoleWanderRadians, ut1MinusUtcSeconds, xCelestialPoleOffsetRadians, yCelestialPoleOffsetRadians, and taiMinusUtcSeconds columns';
          return;
        }
        var samples = eop._samples = eopData.samples;
        var dates = eop._dates = [];
        eop._dateColumn = dateColumn;
        eop._xPoleWanderRadiansColumn = xPoleWanderRadiansColumn;
        eop._yPoleWanderRadiansColumn = yPoleWanderRadiansColumn;
        eop._ut1MinusUtcSecondsColumn = ut1MinusUtcSecondsColumn;
        eop._xCelestialPoleOffsetRadiansColumn = xCelestialPoleOffsetRadiansColumn;
        eop._yCelestialPoleOffsetRadiansColumn = yCelestialPoleOffsetRadiansColumn;
        eop._taiMinusUtcSecondsColumn = taiMinusUtcSecondsColumn;
        eop._columnCount = eopData.columnNames.length;
        eop._lastIndex = undefined;
        var lastTaiMinusUtc;
        var addNewLeapSeconds = eop._addNewLeapSeconds;
        for (var i = 0,
            len = samples.length; i < len; i += eop._columnCount) {
          var mjd = samples[i + dateColumn];
          var taiMinusUtc = samples[i + taiMinusUtcSecondsColumn];
          var day = mjd + TimeConstants.MODIFIED_JULIAN_DATE_DIFFERENCE;
          var date = new JulianDate(day, taiMinusUtc, TimeStandard.TAI);
          dates.push(date);
          if (addNewLeapSeconds) {
            if (taiMinusUtc !== lastTaiMinusUtc && defined(lastTaiMinusUtc)) {
              var leapSeconds = JulianDate.leapSeconds;
              var leapSecondIndex = binarySearch(leapSeconds, date, compareLeapSecondDates);
              if (leapSecondIndex < 0) {
                var leapSecond = new LeapSecond(date, taiMinusUtc);
                leapSeconds.splice(~leapSecondIndex, 0, leapSecond);
              }
            }
            lastTaiMinusUtc = taiMinusUtc;
          }
        }
      }
      function fillResultFromIndex(eop, samples, index, columnCount, result) {
        var start = index * columnCount;
        result.xPoleWander = samples[start + eop._xPoleWanderRadiansColumn];
        result.yPoleWander = samples[start + eop._yPoleWanderRadiansColumn];
        result.xPoleOffset = samples[start + eop._xCelestialPoleOffsetRadiansColumn];
        result.yPoleOffset = samples[start + eop._yCelestialPoleOffsetRadiansColumn];
        result.ut1MinusUtc = samples[start + eop._ut1MinusUtcSecondsColumn];
      }
      function linearInterp(dx, y1, y2) {
        return y1 + dx * (y2 - y1);
      }
      function interpolate(eop, dates, samples, date, before, after, result) {
        var columnCount = eop._columnCount;
        if (after > dates.length - 1) {
          result.xPoleWander = 0;
          result.yPoleWander = 0;
          result.xPoleOffset = 0;
          result.yPoleOffset = 0;
          result.ut1MinusUtc = 0;
          return result;
        }
        var beforeDate = dates[before];
        var afterDate = dates[after];
        if (beforeDate.equals(afterDate) || date.equals(beforeDate)) {
          fillResultFromIndex(eop, samples, before, columnCount, result);
          return result;
        } else if (date.equals(afterDate)) {
          fillResultFromIndex(eop, samples, after, columnCount, result);
          return result;
        }
        var factor = JulianDate.secondsDifference(date, beforeDate) / JulianDate.secondsDifference(afterDate, beforeDate);
        var startBefore = before * columnCount;
        var startAfter = after * columnCount;
        var beforeUt1MinusUtc = samples[startBefore + eop._ut1MinusUtcSecondsColumn];
        var afterUt1MinusUtc = samples[startAfter + eop._ut1MinusUtcSecondsColumn];
        var offsetDifference = afterUt1MinusUtc - beforeUt1MinusUtc;
        if (offsetDifference > 0.5 || offsetDifference < -0.5) {
          var beforeTaiMinusUtc = samples[startBefore + eop._taiMinusUtcSecondsColumn];
          var afterTaiMinusUtc = samples[startAfter + eop._taiMinusUtcSecondsColumn];
          if (beforeTaiMinusUtc !== afterTaiMinusUtc) {
            if (afterDate.equals(date)) {
              beforeUt1MinusUtc = afterUt1MinusUtc;
            } else {
              afterUt1MinusUtc -= afterTaiMinusUtc - beforeTaiMinusUtc;
            }
          }
        }
        result.xPoleWander = linearInterp(factor, samples[startBefore + eop._xPoleWanderRadiansColumn], samples[startAfter + eop._xPoleWanderRadiansColumn]);
        result.yPoleWander = linearInterp(factor, samples[startBefore + eop._yPoleWanderRadiansColumn], samples[startAfter + eop._yPoleWanderRadiansColumn]);
        result.xPoleOffset = linearInterp(factor, samples[startBefore + eop._xCelestialPoleOffsetRadiansColumn], samples[startAfter + eop._xCelestialPoleOffsetRadiansColumn]);
        result.yPoleOffset = linearInterp(factor, samples[startBefore + eop._yCelestialPoleOffsetRadiansColumn], samples[startAfter + eop._yCelestialPoleOffsetRadiansColumn]);
        result.ut1MinusUtc = linearInterp(factor, beforeUt1MinusUtc, afterUt1MinusUtc);
        return result;
      }
      return EarthOrientationParameters;
    });
    define('ThirdParty/Uri', [], function() {
      function URI(uri) {
        if (uri instanceof URI) {
          this.scheme = uri.scheme;
          this.authority = uri.authority;
          this.path = uri.path;
          this.query = uri.query;
          this.fragment = uri.fragment;
        } else if (uri) {
          var c = parseRegex.exec(uri);
          this.scheme = c[1];
          this.authority = c[2];
          this.path = c[3];
          this.query = c[4];
          this.fragment = c[5];
        }
      }
      URI.prototype.scheme = null;
      URI.prototype.authority = null;
      URI.prototype.path = '';
      URI.prototype.query = null;
      URI.prototype.fragment = null;
      var parseRegex = new RegExp('^(?:([^:/?#]+):)?(?://([^/?#]*))?([^?#]*)(?:\\?([^#]*))?(?:#(.*))?$');
      URI.prototype.getScheme = function() {
        return this.scheme;
      };
      URI.prototype.getAuthority = function() {
        return this.authority;
      };
      URI.prototype.getPath = function() {
        return this.path;
      };
      URI.prototype.getQuery = function() {
        return this.query;
      };
      URI.prototype.getFragment = function() {
        return this.fragment;
      };
      URI.prototype.isAbsolute = function() {
        return !!this.scheme && !this.fragment;
      };
      URI.prototype.isSameDocumentAs = function(uri) {
        return uri.scheme == this.scheme && uri.authority == this.authority && uri.path == this.path && uri.query == this.query;
      };
      URI.prototype.equals = function(uri) {
        return this.isSameDocumentAs(uri) && uri.fragment == this.fragment;
      };
      URI.prototype.normalize = function() {
        this.removeDotSegments();
        if (this.scheme)
          this.scheme = this.scheme.toLowerCase();
        if (this.authority)
          this.authority = this.authority.replace(authorityRegex, replaceAuthority).replace(caseRegex, replaceCase);
        if (this.path)
          this.path = this.path.replace(caseRegex, replaceCase);
        if (this.query)
          this.query = this.query.replace(caseRegex, replaceCase);
        if (this.fragment)
          this.fragment = this.fragment.replace(caseRegex, replaceCase);
      };
      var caseRegex = /%[0-9a-z]{2}/gi;
      var percentRegex = /[a-zA-Z0-9\-\._~]/;
      var authorityRegex = /(.*@)?([^@:]*)(:.*)?/;
      function replaceCase(str) {
        var dec = unescape(str);
        return percentRegex.test(dec) ? dec : str.toUpperCase();
      }
      function replaceAuthority(str, p1, p2, p3) {
        return (p1 || '') + p2.toLowerCase() + (p3 || '');
      }
      URI.prototype.resolve = function(baseURI) {
        var uri = new URI();
        if (this.scheme) {
          uri.scheme = this.scheme;
          uri.authority = this.authority;
          uri.path = this.path;
          uri.query = this.query;
        } else {
          uri.scheme = baseURI.scheme;
          if (this.authority) {
            uri.authority = this.authority;
            uri.path = this.path;
            uri.query = this.query;
          } else {
            uri.authority = baseURI.authority;
            if (this.path == '') {
              uri.path = baseURI.path;
              uri.query = this.query || baseURI.query;
            } else {
              if (this.path.charAt(0) == '/') {
                uri.path = this.path;
                uri.removeDotSegments();
              } else {
                if (baseURI.authority && baseURI.path == '') {
                  uri.path = '/' + this.path;
                } else {
                  uri.path = baseURI.path.substring(0, baseURI.path.lastIndexOf('/') + 1) + this.path;
                }
                uri.removeDotSegments();
              }
              uri.query = this.query;
            }
          }
        }
        uri.fragment = this.fragment;
        return uri;
      };
      URI.prototype.removeDotSegments = function() {
        var input = this.path.split('/'),
            output = [],
            segment,
            absPath = input[0] == '';
        if (absPath)
          input.shift();
        var sFirst = input[0] == '' ? input.shift() : null;
        while (input.length) {
          segment = input.shift();
          if (segment == '..') {
            output.pop();
          } else if (segment != '.') {
            output.push(segment);
          }
        }
        if (segment == '.' || segment == '..')
          output.push('');
        if (absPath)
          output.unshift('');
        this.path = output.join('/');
      };
      URI.prototype.toString = function() {
        var result = '';
        if (this.scheme)
          result += this.scheme + ':';
        if (this.authority)
          result += '//' + this.authority;
        result += this.path;
        if (this.query)
          result += '?' + this.query;
        if (this.fragment)
          result += '#' + this.fragment;
        return result;
      };
      return URI;
    });
    define('Core/getAbsoluteUri', ['../ThirdParty/Uri', './defaultValue', './defined', './DeveloperError'], function(Uri, defaultValue, defined, DeveloperError) {
      'use strict';
      function getAbsoluteUri(relative, base) {
        if (!defined(relative)) {
          throw new DeveloperError('relative uri is required.');
        }
        base = defaultValue(base, document.location.href);
        var baseUri = new Uri(base);
        var relativeUri = new Uri(relative);
        return relativeUri.resolve(baseUri).toString();
      }
      return getAbsoluteUri;
    });
    define('Core/joinUrls', ['../ThirdParty/Uri', './defaultValue', './defined', './DeveloperError'], function(Uri, defaultValue, defined, DeveloperError) {
      'use strict';
      function joinUrls(first, second, appendSlash) {
        if (!defined(first)) {
          throw new DeveloperError('first is required');
        }
        if (!defined(second)) {
          throw new DeveloperError('second is required');
        }
        appendSlash = defaultValue(appendSlash, true);
        if (!(first instanceof Uri)) {
          first = new Uri(first);
        }
        if (!(second instanceof Uri)) {
          second = new Uri(second);
        }
        if (defined(second.authority) && !defined(second.scheme)) {
          if (typeof document !== 'undefined' && defined(document.location) && defined(document.location.href)) {
            second.scheme = new Uri(document.location.href).scheme;
          } else {
            second.scheme = first.scheme;
          }
        }
        var baseUri = first;
        if (second.isAbsolute()) {
          baseUri = second;
        }
        var url = '';
        if (defined(baseUri.scheme)) {
          url += baseUri.scheme + ':';
        }
        if (defined(baseUri.authority)) {
          url += '//' + baseUri.authority;
          if (baseUri.path !== '' && baseUri.path !== '/') {
            url = url.replace(/\/?$/, '/');
            baseUri.path = baseUri.path.replace(/^\/?/g, '');
          }
        }
        if (baseUri === first) {
          if (appendSlash) {
            url += first.path.replace(/\/?$/, '/') + second.path.replace(/^\/?/g, '');
          } else {
            url += first.path + second.path;
          }
        } else {
          url += second.path;
        }
        var hasFirstQuery = defined(first.query);
        var hasSecondQuery = defined(second.query);
        if (hasFirstQuery && hasSecondQuery) {
          url += '?' + first.query + '&' + second.query;
        } else if (hasFirstQuery && !hasSecondQuery) {
          url += '?' + first.query;
        } else if (!hasFirstQuery && hasSecondQuery) {
          url += '?' + second.query;
        }
        var hasSecondFragment = defined(second.fragment);
        if (defined(first.fragment) && !hasSecondFragment) {
          url += '#' + first.fragment;
        } else if (hasSecondFragment) {
          url += '#' + second.fragment;
        }
        return url;
      }
      return joinUrls;
    });
    define('Core/buildModuleUrl', ['../ThirdParty/Uri', './defined', './DeveloperError', './getAbsoluteUri', './joinUrls', 'require'], function(Uri, defined, DeveloperError, getAbsoluteUri, joinUrls, require) {
      'use strict';
      var cesiumScriptRegex = /((?:.*\/)|^)cesium[\w-]*\.js(?:\W|$)/i;
      function getBaseUrlFromCesiumScript() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0,
            len = scripts.length; i < len; ++i) {
          var src = scripts[i].getAttribute('src');
          var result = cesiumScriptRegex.exec(src);
          if (result !== null) {
            return result[1];
          }
        }
        return undefined;
      }
      var baseUrl;
      function getCesiumBaseUrl() {
        if (defined(baseUrl)) {
          return baseUrl;
        }
        var baseUrlString;
        if (typeof CESIUM_BASE_URL !== 'undefined') {
          baseUrlString = CESIUM_BASE_URL;
        } else {
          baseUrlString = getBaseUrlFromCesiumScript();
        }
        if (!defined(baseUrlString)) {
          throw new DeveloperError('Unable to determine Cesium base URL automatically, try defining a global variable called CESIUM_BASE_URL.');
        }
        baseUrl = new Uri(getAbsoluteUri(baseUrlString));
        return baseUrl;
      }
      function buildModuleUrlFromRequireToUrl(moduleID) {
        return require.toUrl('../' + moduleID);
      }
      function buildModuleUrlFromBaseUrl(moduleID) {
        return joinUrls(getCesiumBaseUrl(), moduleID);
      }
      var implementation;
      var a;
      function buildModuleUrl(moduleID) {
        if (!defined(implementation)) {
          if (defined(require.toUrl)) {
            implementation = buildModuleUrlFromRequireToUrl;
          } else {
            implementation = buildModuleUrlFromBaseUrl;
          }
        }
        if (!defined(a)) {
          a = document.createElement('a');
        }
        var url = implementation(moduleID);
        a.href = url;
        a.href = a.href;
        return a.href;
      }
      buildModuleUrl._cesiumScriptRegex = cesiumScriptRegex;
      buildModuleUrl.setBaseUrl = function(value) {
        baseUrl = new Uri(value).resolve(new Uri(document.location.href));
      };
      return buildModuleUrl;
    });
    define('Core/Iau2006XysSample', [], function() {
      'use strict';
      function Iau2006XysSample(x, y, s) {
        this.x = x;
        this.y = y;
        this.s = s;
      }
      return Iau2006XysSample;
    });
    define('Core/Iau2006XysData', ['../ThirdParty/when', './buildModuleUrl', './defaultValue', './defined', './Iau2006XysSample', './JulianDate', './loadJson', './TimeStandard'], function(when, buildModuleUrl, defaultValue, defined, Iau2006XysSample, JulianDate, loadJson, TimeStandard) {
      'use strict';
      function Iau2006XysData(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        this._xysFileUrlTemplate = options.xysFileUrlTemplate;
        this._interpolationOrder = defaultValue(options.interpolationOrder, 9);
        this._sampleZeroJulianEphemerisDate = defaultValue(options.sampleZeroJulianEphemerisDate, 2442396.5);
        this._sampleZeroDateTT = new JulianDate(this._sampleZeroJulianEphemerisDate, 0.0, TimeStandard.TAI);
        this._stepSizeDays = defaultValue(options.stepSizeDays, 1.0);
        this._samplesPerXysFile = defaultValue(options.samplesPerXysFile, 1000);
        this._totalSamples = defaultValue(options.totalSamples, 27426);
        this._samples = new Array(this._totalSamples * 3);
        this._chunkDownloadsInProgress = [];
        var order = this._interpolationOrder;
        var denom = this._denominators = new Array(order + 1);
        var xTable = this._xTable = new Array(order + 1);
        var stepN = Math.pow(this._stepSizeDays, order);
        for (var i = 0; i <= order; ++i) {
          denom[i] = stepN;
          xTable[i] = i * this._stepSizeDays;
          for (var j = 0; j <= order; ++j) {
            if (j !== i) {
              denom[i] *= (i - j);
            }
          }
          denom[i] = 1.0 / denom[i];
        }
        this._work = new Array(order + 1);
        this._coef = new Array(order + 1);
      }
      var julianDateScratch = new JulianDate(0, 0.0, TimeStandard.TAI);
      function getDaysSinceEpoch(xys, dayTT, secondTT) {
        var dateTT = julianDateScratch;
        dateTT.dayNumber = dayTT;
        dateTT.secondsOfDay = secondTT;
        return JulianDate.daysDifference(dateTT, xys._sampleZeroDateTT);
      }
      Iau2006XysData.prototype.preload = function(startDayTT, startSecondTT, stopDayTT, stopSecondTT) {
        var startDaysSinceEpoch = getDaysSinceEpoch(this, startDayTT, startSecondTT);
        var stopDaysSinceEpoch = getDaysSinceEpoch(this, stopDayTT, stopSecondTT);
        var startIndex = (startDaysSinceEpoch / this._stepSizeDays - this._interpolationOrder / 2) | 0;
        if (startIndex < 0) {
          startIndex = 0;
        }
        var stopIndex = (stopDaysSinceEpoch / this._stepSizeDays - this._interpolationOrder / 2) | 0 + this._interpolationOrder;
        if (stopIndex >= this._totalSamples) {
          stopIndex = this._totalSamples - 1;
        }
        var startChunk = (startIndex / this._samplesPerXysFile) | 0;
        var stopChunk = (stopIndex / this._samplesPerXysFile) | 0;
        var promises = [];
        for (var i = startChunk; i <= stopChunk; ++i) {
          promises.push(requestXysChunk(this, i));
        }
        return when.all(promises);
      };
      Iau2006XysData.prototype.computeXysRadians = function(dayTT, secondTT, result) {
        var daysSinceEpoch = getDaysSinceEpoch(this, dayTT, secondTT);
        if (daysSinceEpoch < 0.0) {
          return undefined;
        }
        var centerIndex = (daysSinceEpoch / this._stepSizeDays) | 0;
        if (centerIndex >= this._totalSamples) {
          return undefined;
        }
        var degree = this._interpolationOrder;
        var firstIndex = centerIndex - ((degree / 2) | 0);
        if (firstIndex < 0) {
          firstIndex = 0;
        }
        var lastIndex = firstIndex + degree;
        if (lastIndex >= this._totalSamples) {
          lastIndex = this._totalSamples - 1;
          firstIndex = lastIndex - degree;
          if (firstIndex < 0) {
            firstIndex = 0;
          }
        }
        var isDataMissing = false;
        var samples = this._samples;
        if (!defined(samples[firstIndex * 3])) {
          requestXysChunk(this, (firstIndex / this._samplesPerXysFile) | 0);
          isDataMissing = true;
        }
        if (!defined(samples[lastIndex * 3])) {
          requestXysChunk(this, (lastIndex / this._samplesPerXysFile) | 0);
          isDataMissing = true;
        }
        if (isDataMissing) {
          return undefined;
        }
        if (!defined(result)) {
          result = new Iau2006XysSample(0.0, 0.0, 0.0);
        } else {
          result.x = 0.0;
          result.y = 0.0;
          result.s = 0.0;
        }
        var x = daysSinceEpoch - firstIndex * this._stepSizeDays;
        var work = this._work;
        var denom = this._denominators;
        var coef = this._coef;
        var xTable = this._xTable;
        var i,
            j;
        for (i = 0; i <= degree; ++i) {
          work[i] = x - xTable[i];
        }
        for (i = 0; i <= degree; ++i) {
          coef[i] = 1.0;
          for (j = 0; j <= degree; ++j) {
            if (j !== i) {
              coef[i] *= work[j];
            }
          }
          coef[i] *= denom[i];
          var sampleIndex = (firstIndex + i) * 3;
          result.x += coef[i] * samples[sampleIndex++];
          result.y += coef[i] * samples[sampleIndex++];
          result.s += coef[i] * samples[sampleIndex];
        }
        return result;
      };
      function requestXysChunk(xysData, chunkIndex) {
        if (xysData._chunkDownloadsInProgress[chunkIndex]) {
          return xysData._chunkDownloadsInProgress[chunkIndex];
        }
        var deferred = when.defer();
        xysData._chunkDownloadsInProgress[chunkIndex] = deferred;
        var chunkUrl;
        var xysFileUrlTemplate = xysData._xysFileUrlTemplate;
        if (defined(xysFileUrlTemplate)) {
          chunkUrl = xysFileUrlTemplate.replace('{0}', chunkIndex);
        } else {
          chunkUrl = buildModuleUrl('Assets/IAU2006_XYS/IAU2006_XYS_' + chunkIndex + '.json');
        }
        when(loadJson(chunkUrl), function(chunk) {
          xysData._chunkDownloadsInProgress[chunkIndex] = false;
          var samples = xysData._samples;
          var newSamples = chunk.samples;
          var startIndex = chunkIndex * xysData._samplesPerXysFile * 3;
          for (var i = 0,
              len = newSamples.length; i < len; ++i) {
            samples[startIndex + i] = newSamples[i];
          }
          deferred.resolve();
        });
        return deferred.promise;
      }
      return Iau2006XysData;
    });
    define('Core/Quaternion', ['./Cartesian3', './defaultValue', './defined', './DeveloperError', './FeatureDetection', './freezeObject', './Math', './Matrix3'], function(Cartesian3, defaultValue, defined, DeveloperError, FeatureDetection, freezeObject, CesiumMath, Matrix3) {
      'use strict';
      function Quaternion(x, y, z, w) {
        this.x = defaultValue(x, 0.0);
        this.y = defaultValue(y, 0.0);
        this.z = defaultValue(z, 0.0);
        this.w = defaultValue(w, 0.0);
      }
      var fromAxisAngleScratch = new Cartesian3();
      Quaternion.fromAxisAngle = function(axis, angle, result) {
        if (!defined(axis)) {
          throw new DeveloperError('axis is required.');
        }
        if (typeof angle !== 'number') {
          throw new DeveloperError('angle is required and must be a number.');
        }
        var halfAngle = angle / 2.0;
        var s = Math.sin(halfAngle);
        fromAxisAngleScratch = Cartesian3.normalize(axis, fromAxisAngleScratch);
        var x = fromAxisAngleScratch.x * s;
        var y = fromAxisAngleScratch.y * s;
        var z = fromAxisAngleScratch.z * s;
        var w = Math.cos(halfAngle);
        if (!defined(result)) {
          return new Quaternion(x, y, z, w);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
      };
      var fromRotationMatrixNext = [1, 2, 0];
      var fromRotationMatrixQuat = new Array(3);
      Quaternion.fromRotationMatrix = function(matrix, result) {
        if (!defined(matrix)) {
          throw new DeveloperError('matrix is required.');
        }
        var root;
        var x;
        var y;
        var z;
        var w;
        var m00 = matrix[Matrix3.COLUMN0ROW0];
        var m11 = matrix[Matrix3.COLUMN1ROW1];
        var m22 = matrix[Matrix3.COLUMN2ROW2];
        var trace = m00 + m11 + m22;
        if (trace > 0.0) {
          root = Math.sqrt(trace + 1.0);
          w = 0.5 * root;
          root = 0.5 / root;
          x = (matrix[Matrix3.COLUMN1ROW2] - matrix[Matrix3.COLUMN2ROW1]) * root;
          y = (matrix[Matrix3.COLUMN2ROW0] - matrix[Matrix3.COLUMN0ROW2]) * root;
          z = (matrix[Matrix3.COLUMN0ROW1] - matrix[Matrix3.COLUMN1ROW0]) * root;
        } else {
          var next = fromRotationMatrixNext;
          var i = 0;
          if (m11 > m00) {
            i = 1;
          }
          if (m22 > m00 && m22 > m11) {
            i = 2;
          }
          var j = next[i];
          var k = next[j];
          root = Math.sqrt(matrix[Matrix3.getElementIndex(i, i)] - matrix[Matrix3.getElementIndex(j, j)] - matrix[Matrix3.getElementIndex(k, k)] + 1.0);
          var quat = fromRotationMatrixQuat;
          quat[i] = 0.5 * root;
          root = 0.5 / root;
          w = (matrix[Matrix3.getElementIndex(k, j)] - matrix[Matrix3.getElementIndex(j, k)]) * root;
          quat[j] = (matrix[Matrix3.getElementIndex(j, i)] + matrix[Matrix3.getElementIndex(i, j)]) * root;
          quat[k] = (matrix[Matrix3.getElementIndex(k, i)] + matrix[Matrix3.getElementIndex(i, k)]) * root;
          x = -quat[0];
          y = -quat[1];
          z = -quat[2];
        }
        if (!defined(result)) {
          return new Quaternion(x, y, z, w);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
      };
      var scratchHPRQuaternion = new Quaternion();
      Quaternion.fromHeadingPitchRoll = function(heading, pitch, roll, result) {
        if (!defined(heading)) {
          throw new DeveloperError('heading is required.');
        }
        if (!defined(pitch)) {
          throw new DeveloperError('pitch is required.');
        }
        if (!defined(roll)) {
          throw new DeveloperError('roll is required.');
        }
        var rollQuaternion = Quaternion.fromAxisAngle(Cartesian3.UNIT_X, roll, scratchHPRQuaternion);
        var pitchQuaternion = Quaternion.fromAxisAngle(Cartesian3.UNIT_Y, -pitch, result);
        result = Quaternion.multiply(pitchQuaternion, rollQuaternion, pitchQuaternion);
        var headingQuaternion = Quaternion.fromAxisAngle(Cartesian3.UNIT_Z, -heading, scratchHPRQuaternion);
        return Quaternion.multiply(headingQuaternion, result, result);
      };
      var sampledQuaternionAxis = new Cartesian3();
      var sampledQuaternionRotation = new Cartesian3();
      var sampledQuaternionTempQuaternion = new Quaternion();
      var sampledQuaternionQuaternion0 = new Quaternion();
      var sampledQuaternionQuaternion0Conjugate = new Quaternion();
      Quaternion.packedLength = 4;
      Quaternion.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value.x;
        array[startingIndex++] = value.y;
        array[startingIndex++] = value.z;
        array[startingIndex] = value.w;
      };
      Quaternion.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Quaternion();
        }
        result.x = array[startingIndex];
        result.y = array[startingIndex + 1];
        result.z = array[startingIndex + 2];
        result.w = array[startingIndex + 3];
        return result;
      };
      Quaternion.packedInterpolationLength = 3;
      Quaternion.convertPackedArrayForInterpolation = function(packedArray, startingIndex, lastIndex, result) {
        Quaternion.unpack(packedArray, lastIndex * 4, sampledQuaternionQuaternion0Conjugate);
        Quaternion.conjugate(sampledQuaternionQuaternion0Conjugate, sampledQuaternionQuaternion0Conjugate);
        for (var i = 0,
            len = lastIndex - startingIndex + 1; i < len; i++) {
          var offset = i * 3;
          Quaternion.unpack(packedArray, (startingIndex + i) * 4, sampledQuaternionTempQuaternion);
          Quaternion.multiply(sampledQuaternionTempQuaternion, sampledQuaternionQuaternion0Conjugate, sampledQuaternionTempQuaternion);
          if (sampledQuaternionTempQuaternion.w < 0) {
            Quaternion.negate(sampledQuaternionTempQuaternion, sampledQuaternionTempQuaternion);
          }
          Quaternion.computeAxis(sampledQuaternionTempQuaternion, sampledQuaternionAxis);
          var angle = Quaternion.computeAngle(sampledQuaternionTempQuaternion);
          result[offset] = sampledQuaternionAxis.x * angle;
          result[offset + 1] = sampledQuaternionAxis.y * angle;
          result[offset + 2] = sampledQuaternionAxis.z * angle;
        }
      };
      Quaternion.unpackInterpolationResult = function(array, sourceArray, firstIndex, lastIndex, result) {
        if (!defined(result)) {
          result = new Quaternion();
        }
        Cartesian3.fromArray(array, 0, sampledQuaternionRotation);
        var magnitude = Cartesian3.magnitude(sampledQuaternionRotation);
        Quaternion.unpack(sourceArray, lastIndex * 4, sampledQuaternionQuaternion0);
        if (magnitude === 0) {
          Quaternion.clone(Quaternion.IDENTITY, sampledQuaternionTempQuaternion);
        } else {
          Quaternion.fromAxisAngle(sampledQuaternionRotation, magnitude, sampledQuaternionTempQuaternion);
        }
        return Quaternion.multiply(sampledQuaternionTempQuaternion, sampledQuaternionQuaternion0, result);
      };
      Quaternion.clone = function(quaternion, result) {
        if (!defined(quaternion)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        }
        result.x = quaternion.x;
        result.y = quaternion.y;
        result.z = quaternion.z;
        result.w = quaternion.w;
        return result;
      };
      Quaternion.conjugate = function(quaternion, result) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = -quaternion.x;
        result.y = -quaternion.y;
        result.z = -quaternion.z;
        result.w = quaternion.w;
        return result;
      };
      Quaternion.magnitudeSquared = function(quaternion) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required');
        }
        return quaternion.x * quaternion.x + quaternion.y * quaternion.y + quaternion.z * quaternion.z + quaternion.w * quaternion.w;
      };
      Quaternion.magnitude = function(quaternion) {
        return Math.sqrt(Quaternion.magnitudeSquared(quaternion));
      };
      Quaternion.normalize = function(quaternion, result) {
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var inverseMagnitude = 1.0 / Quaternion.magnitude(quaternion);
        var x = quaternion.x * inverseMagnitude;
        var y = quaternion.y * inverseMagnitude;
        var z = quaternion.z * inverseMagnitude;
        var w = quaternion.w * inverseMagnitude;
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
      };
      Quaternion.inverse = function(quaternion, result) {
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var magnitudeSquared = Quaternion.magnitudeSquared(quaternion);
        result = Quaternion.conjugate(quaternion, result);
        return Quaternion.multiplyByScalar(result, 1.0 / magnitudeSquared, result);
      };
      Quaternion.add = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        result.w = left.w + right.w;
        return result;
      };
      Quaternion.subtract = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        result.w = left.w - right.w;
        return result;
      };
      Quaternion.negate = function(quaternion, result) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = -quaternion.x;
        result.y = -quaternion.y;
        result.z = -quaternion.z;
        result.w = -quaternion.w;
        return result;
      };
      Quaternion.dot = function(left, right) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        return left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
      };
      Quaternion.multiply = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var leftX = left.x;
        var leftY = left.y;
        var leftZ = left.z;
        var leftW = left.w;
        var rightX = right.x;
        var rightY = right.y;
        var rightZ = right.z;
        var rightW = right.w;
        var x = leftW * rightX + leftX * rightW + leftY * rightZ - leftZ * rightY;
        var y = leftW * rightY - leftX * rightZ + leftY * rightW + leftZ * rightX;
        var z = leftW * rightZ + leftX * rightY - leftY * rightX + leftZ * rightW;
        var w = leftW * rightW - leftX * rightX - leftY * rightY - leftZ * rightZ;
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
      };
      Quaternion.multiplyByScalar = function(quaternion, scalar, result) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = quaternion.x * scalar;
        result.y = quaternion.y * scalar;
        result.z = quaternion.z * scalar;
        result.w = quaternion.w * scalar;
        return result;
      };
      Quaternion.divideByScalar = function(quaternion, scalar, result) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.x = quaternion.x / scalar;
        result.y = quaternion.y / scalar;
        result.z = quaternion.z / scalar;
        result.w = quaternion.w / scalar;
        return result;
      };
      Quaternion.computeAxis = function(quaternion, result) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var w = quaternion.w;
        if (Math.abs(w - 1.0) < CesiumMath.EPSILON6) {
          result.x = result.y = result.z = 0;
          return result;
        }
        var scalar = 1.0 / Math.sqrt(1.0 - (w * w));
        result.x = quaternion.x * scalar;
        result.y = quaternion.y * scalar;
        result.z = quaternion.z * scalar;
        return result;
      };
      Quaternion.computeAngle = function(quaternion) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required');
        }
        if (Math.abs(quaternion.w - 1.0) < CesiumMath.EPSILON6) {
          return 0.0;
        }
        return 2.0 * Math.acos(quaternion.w);
      };
      var lerpScratch = new Quaternion();
      Quaternion.lerp = function(start, end, t, result) {
        if (!defined(start)) {
          throw new DeveloperError('start is required.');
        }
        if (!defined(end)) {
          throw new DeveloperError('end is required.');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        lerpScratch = Quaternion.multiplyByScalar(end, t, lerpScratch);
        result = Quaternion.multiplyByScalar(start, 1.0 - t, result);
        return Quaternion.add(lerpScratch, result, result);
      };
      var slerpEndNegated = new Quaternion();
      var slerpScaledP = new Quaternion();
      var slerpScaledR = new Quaternion();
      Quaternion.slerp = function(start, end, t, result) {
        if (!defined(start)) {
          throw new DeveloperError('start is required.');
        }
        if (!defined(end)) {
          throw new DeveloperError('end is required.');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var dot = Quaternion.dot(start, end);
        var r = end;
        if (dot < 0.0) {
          dot = -dot;
          r = slerpEndNegated = Quaternion.negate(end, slerpEndNegated);
        }
        if (1.0 - dot < CesiumMath.EPSILON6) {
          return Quaternion.lerp(start, r, t, result);
        }
        var theta = Math.acos(dot);
        slerpScaledP = Quaternion.multiplyByScalar(start, Math.sin((1 - t) * theta), slerpScaledP);
        slerpScaledR = Quaternion.multiplyByScalar(r, Math.sin(t * theta), slerpScaledR);
        result = Quaternion.add(slerpScaledP, slerpScaledR, result);
        return Quaternion.multiplyByScalar(result, 1.0 / Math.sin(theta), result);
      };
      Quaternion.log = function(quaternion, result) {
        if (!defined(quaternion)) {
          throw new DeveloperError('quaternion is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var theta = CesiumMath.acosClamped(quaternion.w);
        var thetaOverSinTheta = 0.0;
        if (theta !== 0.0) {
          thetaOverSinTheta = theta / Math.sin(theta);
        }
        return Cartesian3.multiplyByScalar(quaternion, thetaOverSinTheta, result);
      };
      Quaternion.exp = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var theta = Cartesian3.magnitude(cartesian);
        var sinThetaOverTheta = 0.0;
        if (theta !== 0.0) {
          sinThetaOverTheta = Math.sin(theta) / theta;
        }
        result.x = cartesian.x * sinThetaOverTheta;
        result.y = cartesian.y * sinThetaOverTheta;
        result.z = cartesian.z * sinThetaOverTheta;
        result.w = Math.cos(theta);
        return result;
      };
      var squadScratchCartesian0 = new Cartesian3();
      var squadScratchCartesian1 = new Cartesian3();
      var squadScratchQuaternion0 = new Quaternion();
      var squadScratchQuaternion1 = new Quaternion();
      Quaternion.computeInnerQuadrangle = function(q0, q1, q2, result) {
        if (!defined(q0) || !defined(q1) || !defined(q2)) {
          throw new DeveloperError('q0, q1, and q2 are required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var qInv = Quaternion.conjugate(q1, squadScratchQuaternion0);
        Quaternion.multiply(qInv, q2, squadScratchQuaternion1);
        var cart0 = Quaternion.log(squadScratchQuaternion1, squadScratchCartesian0);
        Quaternion.multiply(qInv, q0, squadScratchQuaternion1);
        var cart1 = Quaternion.log(squadScratchQuaternion1, squadScratchCartesian1);
        Cartesian3.add(cart0, cart1, cart0);
        Cartesian3.multiplyByScalar(cart0, 0.25, cart0);
        Cartesian3.negate(cart0, cart0);
        Quaternion.exp(cart0, squadScratchQuaternion0);
        return Quaternion.multiply(q1, squadScratchQuaternion0, result);
      };
      Quaternion.squad = function(q0, q1, s0, s1, t, result) {
        if (!defined(q0) || !defined(q1) || !defined(s0) || !defined(s1)) {
          throw new DeveloperError('q0, q1, s0, and s1 are required.');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var slerp0 = Quaternion.slerp(q0, q1, t, squadScratchQuaternion0);
        var slerp1 = Quaternion.slerp(s0, s1, t, squadScratchQuaternion1);
        return Quaternion.slerp(slerp0, slerp1, 2.0 * t * (1.0 - t), result);
      };
      var fastSlerpScratchQuaternion = new Quaternion();
      var opmu = 1.90110745351730037;
      var u = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];
      var v = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];
      var bT = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];
      var bD = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];
      for (var i = 0; i < 7; ++i) {
        var s = i + 1.0;
        var t = 2.0 * s + 1.0;
        u[i] = 1.0 / (s * t);
        v[i] = s / t;
      }
      u[7] = opmu / (8.0 * 17.0);
      v[7] = opmu * 8.0 / 17.0;
      Quaternion.fastSlerp = function(start, end, t, result) {
        if (!defined(start)) {
          throw new DeveloperError('start is required.');
        }
        if (!defined(end)) {
          throw new DeveloperError('end is required.');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var x = Quaternion.dot(start, end);
        var sign;
        if (x >= 0) {
          sign = 1.0;
        } else {
          sign = -1.0;
          x = -x;
        }
        var xm1 = x - 1.0;
        var d = 1.0 - t;
        var sqrT = t * t;
        var sqrD = d * d;
        for (var i = 7; i >= 0; --i) {
          bT[i] = (u[i] * sqrT - v[i]) * xm1;
          bD[i] = (u[i] * sqrD - v[i]) * xm1;
        }
        var cT = sign * t * (1.0 + bT[0] * (1.0 + bT[1] * (1.0 + bT[2] * (1.0 + bT[3] * (1.0 + bT[4] * (1.0 + bT[5] * (1.0 + bT[6] * (1.0 + bT[7]))))))));
        var cD = d * (1.0 + bD[0] * (1.0 + bD[1] * (1.0 + bD[2] * (1.0 + bD[3] * (1.0 + bD[4] * (1.0 + bD[5] * (1.0 + bD[6] * (1.0 + bD[7]))))))));
        var temp = Quaternion.multiplyByScalar(start, cD, fastSlerpScratchQuaternion);
        Quaternion.multiplyByScalar(end, cT, result);
        return Quaternion.add(temp, result, result);
      };
      Quaternion.fastSquad = function(q0, q1, s0, s1, t, result) {
        if (!defined(q0) || !defined(q1) || !defined(s0) || !defined(s1)) {
          throw new DeveloperError('q0, q1, s0, and s1 are required.');
        }
        if (typeof t !== 'number') {
          throw new DeveloperError('t is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        var slerp0 = Quaternion.fastSlerp(q0, q1, t, squadScratchQuaternion0);
        var slerp1 = Quaternion.fastSlerp(s0, s1, t, squadScratchQuaternion1);
        return Quaternion.fastSlerp(slerp0, slerp1, 2.0 * t * (1.0 - t), result);
      };
      Quaternion.equals = function(left, right) {
        return (left === right) || ((defined(left)) && (defined(right)) && (left.x === right.x) && (left.y === right.y) && (left.z === right.z) && (left.w === right.w));
      };
      Quaternion.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
          throw new DeveloperError('epsilon is required and must be a number.');
        }
        return (left === right) || ((defined(left)) && (defined(right)) && (Math.abs(left.x - right.x) <= epsilon) && (Math.abs(left.y - right.y) <= epsilon) && (Math.abs(left.z - right.z) <= epsilon) && (Math.abs(left.w - right.w) <= epsilon));
      };
      Quaternion.ZERO = freezeObject(new Quaternion(0.0, 0.0, 0.0, 0.0));
      Quaternion.IDENTITY = freezeObject(new Quaternion(0.0, 0.0, 0.0, 1.0));
      Quaternion.prototype.clone = function(result) {
        return Quaternion.clone(this, result);
      };
      Quaternion.prototype.equals = function(right) {
        return Quaternion.equals(this, right);
      };
      Quaternion.prototype.equalsEpsilon = function(right, epsilon) {
        return Quaternion.equalsEpsilon(this, right, epsilon);
      };
      Quaternion.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
      };
      return Quaternion;
    });
    define('Core/Transforms', ['../ThirdParty/when', './Cartesian2', './Cartesian3', './Cartesian4', './defaultValue', './defined', './DeveloperError', './EarthOrientationParameters', './EarthOrientationParametersSample', './Ellipsoid', './Iau2006XysData', './Iau2006XysSample', './JulianDate', './Math', './Matrix3', './Matrix4', './Quaternion', './TimeConstants'], function(when, Cartesian2, Cartesian3, Cartesian4, defaultValue, defined, DeveloperError, EarthOrientationParameters, EarthOrientationParametersSample, Ellipsoid, Iau2006XysData, Iau2006XysSample, JulianDate, CesiumMath, Matrix3, Matrix4, Quaternion, TimeConstants) {
      'use strict';
      var Transforms = {};
      var eastNorthUpToFixedFrameNormal = new Cartesian3();
      var eastNorthUpToFixedFrameTangent = new Cartesian3();
      var eastNorthUpToFixedFrameBitangent = new Cartesian3();
      Transforms.eastNorthUpToFixedFrame = function(origin, ellipsoid, result) {
        if (!defined(origin)) {
          throw new DeveloperError('origin is required.');
        }
        if (CesiumMath.equalsEpsilon(origin.x, 0.0, CesiumMath.EPSILON14) && CesiumMath.equalsEpsilon(origin.y, 0.0, CesiumMath.EPSILON14)) {
          var sign = CesiumMath.sign(origin.z);
          if (!defined(result)) {
            return new Matrix4(0.0, -sign, 0.0, origin.x, 1.0, 0.0, 0.0, origin.y, 0.0, 0.0, sign, origin.z, 0.0, 0.0, 0.0, 1.0);
          }
          result[0] = 0.0;
          result[1] = 1.0;
          result[2] = 0.0;
          result[3] = 0.0;
          result[4] = -sign;
          result[5] = 0.0;
          result[6] = 0.0;
          result[7] = 0.0;
          result[8] = 0.0;
          result[9] = 0.0;
          result[10] = sign;
          result[11] = 0.0;
          result[12] = origin.x;
          result[13] = origin.y;
          result[14] = origin.z;
          result[15] = 1.0;
          return result;
        }
        var normal = eastNorthUpToFixedFrameNormal;
        var tangent = eastNorthUpToFixedFrameTangent;
        var bitangent = eastNorthUpToFixedFrameBitangent;
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        ellipsoid.geodeticSurfaceNormal(origin, normal);
        tangent.x = -origin.y;
        tangent.y = origin.x;
        tangent.z = 0.0;
        Cartesian3.normalize(tangent, tangent);
        Cartesian3.cross(normal, tangent, bitangent);
        if (!defined(result)) {
          return new Matrix4(tangent.x, bitangent.x, normal.x, origin.x, tangent.y, bitangent.y, normal.y, origin.y, tangent.z, bitangent.z, normal.z, origin.z, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = tangent.x;
        result[1] = tangent.y;
        result[2] = tangent.z;
        result[3] = 0.0;
        result[4] = bitangent.x;
        result[5] = bitangent.y;
        result[6] = bitangent.z;
        result[7] = 0.0;
        result[8] = normal.x;
        result[9] = normal.y;
        result[10] = normal.z;
        result[11] = 0.0;
        result[12] = origin.x;
        result[13] = origin.y;
        result[14] = origin.z;
        result[15] = 1.0;
        return result;
      };
      var northEastDownToFixedFrameNormal = new Cartesian3();
      var northEastDownToFixedFrameTangent = new Cartesian3();
      var northEastDownToFixedFrameBitangent = new Cartesian3();
      Transforms.northEastDownToFixedFrame = function(origin, ellipsoid, result) {
        if (!defined(origin)) {
          throw new DeveloperError('origin is required.');
        }
        if (CesiumMath.equalsEpsilon(origin.x, 0.0, CesiumMath.EPSILON14) && CesiumMath.equalsEpsilon(origin.y, 0.0, CesiumMath.EPSILON14)) {
          var sign = CesiumMath.sign(origin.z);
          if (!defined(result)) {
            return new Matrix4(-sign, 0.0, 0.0, origin.x, 0.0, 1.0, 0.0, origin.y, 0.0, 0.0, -sign, origin.z, 0.0, 0.0, 0.0, 1.0);
          }
          result[0] = -sign;
          result[1] = 0.0;
          result[2] = 0.0;
          result[3] = 0.0;
          result[4] = 0.0;
          result[5] = 1.0;
          result[6] = 0.0;
          result[7] = 0.0;
          result[8] = 0.0;
          result[9] = 0.0;
          result[10] = -sign;
          result[11] = 0.0;
          result[12] = origin.x;
          result[13] = origin.y;
          result[14] = origin.z;
          result[15] = 1.0;
          return result;
        }
        var normal = northEastDownToFixedFrameNormal;
        var tangent = northEastDownToFixedFrameTangent;
        var bitangent = northEastDownToFixedFrameBitangent;
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        ellipsoid.geodeticSurfaceNormal(origin, normal);
        tangent.x = -origin.y;
        tangent.y = origin.x;
        tangent.z = 0.0;
        Cartesian3.normalize(tangent, tangent);
        Cartesian3.cross(normal, tangent, bitangent);
        if (!defined(result)) {
          return new Matrix4(bitangent.x, tangent.x, -normal.x, origin.x, bitangent.y, tangent.y, -normal.y, origin.y, bitangent.z, tangent.z, -normal.z, origin.z, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = bitangent.x;
        result[1] = bitangent.y;
        result[2] = bitangent.z;
        result[3] = 0.0;
        result[4] = tangent.x;
        result[5] = tangent.y;
        result[6] = tangent.z;
        result[7] = 0.0;
        result[8] = -normal.x;
        result[9] = -normal.y;
        result[10] = -normal.z;
        result[11] = 0.0;
        result[12] = origin.x;
        result[13] = origin.y;
        result[14] = origin.z;
        result[15] = 1.0;
        return result;
      };
      Transforms.northUpEastToFixedFrame = function(origin, ellipsoid, result) {
        if (!defined(origin)) {
          throw new DeveloperError('origin is required.');
        }
        if (CesiumMath.equalsEpsilon(origin.x, 0.0, CesiumMath.EPSILON14) && CesiumMath.equalsEpsilon(origin.y, 0.0, CesiumMath.EPSILON14)) {
          var sign = CesiumMath.sign(origin.z);
          if (!defined(result)) {
            return new Matrix4(-sign, 0.0, 0.0, origin.x, 0.0, 0.0, 1.0, origin.y, 0.0, sign, 0.0, origin.z, 0.0, 0.0, 0.0, 1.0);
          }
          result[0] = -sign;
          result[1] = 0.0;
          result[2] = 0.0;
          result[3] = 0.0;
          result[4] = 0.0;
          result[5] = 0.0;
          result[6] = sign;
          result[7] = 0.0;
          result[8] = 0.0;
          result[9] = 1.0;
          result[10] = 0.0;
          result[11] = 0.0;
          result[12] = origin.x;
          result[13] = origin.y;
          result[14] = origin.z;
          result[15] = 1.0;
          return result;
        }
        var normal = eastNorthUpToFixedFrameNormal;
        var tangent = eastNorthUpToFixedFrameTangent;
        var bitangent = eastNorthUpToFixedFrameBitangent;
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        ellipsoid.geodeticSurfaceNormal(origin, normal);
        tangent.x = -origin.y;
        tangent.y = origin.x;
        tangent.z = 0.0;
        Cartesian3.normalize(tangent, tangent);
        Cartesian3.cross(normal, tangent, bitangent);
        if (!defined(result)) {
          return new Matrix4(bitangent.x, normal.x, tangent.x, origin.x, bitangent.y, normal.y, tangent.y, origin.y, bitangent.z, normal.z, tangent.z, origin.z, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = bitangent.x;
        result[1] = bitangent.y;
        result[2] = bitangent.z;
        result[3] = 0.0;
        result[4] = normal.x;
        result[5] = normal.y;
        result[6] = normal.z;
        result[7] = 0.0;
        result[8] = tangent.x;
        result[9] = tangent.y;
        result[10] = tangent.z;
        result[11] = 0.0;
        result[12] = origin.x;
        result[13] = origin.y;
        result[14] = origin.z;
        result[15] = 1.0;
        return result;
      };
      var scratchHPRQuaternion = new Quaternion();
      var scratchScale = new Cartesian3(1.0, 1.0, 1.0);
      var scratchHPRMatrix4 = new Matrix4();
      Transforms.headingPitchRollToFixedFrame = function(origin, heading, pitch, roll, ellipsoid, result) {
        var hprQuaternion = Quaternion.fromHeadingPitchRoll(heading, pitch, roll, scratchHPRQuaternion);
        var hprMatrix = Matrix4.fromTranslationQuaternionRotationScale(Cartesian3.ZERO, hprQuaternion, scratchScale, scratchHPRMatrix4);
        result = Transforms.eastNorthUpToFixedFrame(origin, ellipsoid, result);
        return Matrix4.multiply(result, hprMatrix, result);
      };
      var scratchENUMatrix4 = new Matrix4();
      var scratchHPRMatrix3 = new Matrix3();
      Transforms.headingPitchRollQuaternion = function(origin, heading, pitch, roll, ellipsoid, result) {
        var transform = Transforms.headingPitchRollToFixedFrame(origin, heading, pitch, roll, ellipsoid, scratchENUMatrix4);
        var rotation = Matrix4.getRotation(transform, scratchHPRMatrix3);
        return Quaternion.fromRotationMatrix(rotation, result);
      };
      var gmstConstant0 = 6 * 3600 + 41 * 60 + 50.54841;
      var gmstConstant1 = 8640184.812866;
      var gmstConstant2 = 0.093104;
      var gmstConstant3 = -6.2E-6;
      var rateCoef = 1.1772758384668e-19;
      var wgs84WRPrecessing = 7.2921158553E-5;
      var twoPiOverSecondsInDay = CesiumMath.TWO_PI / 86400.0;
      var dateInUtc = new JulianDate();
      Transforms.computeTemeToPseudoFixedMatrix = function(date, result) {
        if (!defined(date)) {
          throw new DeveloperError('date is required.');
        }
        dateInUtc = JulianDate.addSeconds(date, -JulianDate.computeTaiMinusUtc(date), dateInUtc);
        var utcDayNumber = dateInUtc.dayNumber;
        var utcSecondsIntoDay = dateInUtc.secondsOfDay;
        var t;
        var diffDays = utcDayNumber - 2451545;
        if (utcSecondsIntoDay >= 43200.0) {
          t = (diffDays + 0.5) / TimeConstants.DAYS_PER_JULIAN_CENTURY;
        } else {
          t = (diffDays - 0.5) / TimeConstants.DAYS_PER_JULIAN_CENTURY;
        }
        var gmst0 = gmstConstant0 + t * (gmstConstant1 + t * (gmstConstant2 + t * gmstConstant3));
        var angle = (gmst0 * twoPiOverSecondsInDay) % CesiumMath.TWO_PI;
        var ratio = wgs84WRPrecessing + rateCoef * (utcDayNumber - 2451545.5);
        var secondsSinceMidnight = (utcSecondsIntoDay + TimeConstants.SECONDS_PER_DAY * 0.5) % TimeConstants.SECONDS_PER_DAY;
        var gha = angle + (ratio * secondsSinceMidnight);
        var cosGha = Math.cos(gha);
        var sinGha = Math.sin(gha);
        if (!defined(result)) {
          return new Matrix3(cosGha, sinGha, 0.0, -sinGha, cosGha, 0.0, 0.0, 0.0, 1.0);
        }
        result[0] = cosGha;
        result[1] = -sinGha;
        result[2] = 0.0;
        result[3] = sinGha;
        result[4] = cosGha;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 1.0;
        return result;
      };
      Transforms.iau2006XysData = new Iau2006XysData();
      Transforms.earthOrientationParameters = EarthOrientationParameters.NONE;
      var ttMinusTai = 32.184;
      var j2000ttDays = 2451545.0;
      Transforms.preloadIcrfFixed = function(timeInterval) {
        var startDayTT = timeInterval.start.dayNumber;
        var startSecondTT = timeInterval.start.secondsOfDay + ttMinusTai;
        var stopDayTT = timeInterval.stop.dayNumber;
        var stopSecondTT = timeInterval.stop.secondsOfDay + ttMinusTai;
        var xysPromise = Transforms.iau2006XysData.preload(startDayTT, startSecondTT, stopDayTT, stopSecondTT);
        var eopPromise = Transforms.earthOrientationParameters.getPromiseToLoad();
        return when.all([xysPromise, eopPromise]);
      };
      Transforms.computeIcrfToFixedMatrix = function(date, result) {
        if (!defined(date)) {
          throw new DeveloperError('date is required.');
        }
        if (!defined(result)) {
          result = new Matrix3();
        }
        var fixedToIcrfMtx = Transforms.computeFixedToIcrfMatrix(date, result);
        if (!defined(fixedToIcrfMtx)) {
          return undefined;
        }
        return Matrix3.transpose(fixedToIcrfMtx, result);
      };
      var xysScratch = new Iau2006XysSample(0.0, 0.0, 0.0);
      var eopScratch = new EarthOrientationParametersSample(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
      var rotation1Scratch = new Matrix3();
      var rotation2Scratch = new Matrix3();
      Transforms.computeFixedToIcrfMatrix = function(date, result) {
        if (!defined(date)) {
          throw new DeveloperError('date is required.');
        }
        if (!defined(result)) {
          result = new Matrix3();
        }
        var eop = Transforms.earthOrientationParameters.compute(date, eopScratch);
        if (!defined(eop)) {
          return undefined;
        }
        var dayTT = date.dayNumber;
        var secondTT = date.secondsOfDay + ttMinusTai;
        var xys = Transforms.iau2006XysData.computeXysRadians(dayTT, secondTT, xysScratch);
        if (!defined(xys)) {
          return undefined;
        }
        var x = xys.x + eop.xPoleOffset;
        var y = xys.y + eop.yPoleOffset;
        var a = 1.0 / (1.0 + Math.sqrt(1.0 - x * x - y * y));
        var rotation1 = rotation1Scratch;
        rotation1[0] = 1.0 - a * x * x;
        rotation1[3] = -a * x * y;
        rotation1[6] = x;
        rotation1[1] = -a * x * y;
        rotation1[4] = 1 - a * y * y;
        rotation1[7] = y;
        rotation1[2] = -x;
        rotation1[5] = -y;
        rotation1[8] = 1 - a * (x * x + y * y);
        var rotation2 = Matrix3.fromRotationZ(-xys.s, rotation2Scratch);
        var matrixQ = Matrix3.multiply(rotation1, rotation2, rotation1Scratch);
        var dateUt1day = date.dayNumber;
        var dateUt1sec = date.secondsOfDay - JulianDate.computeTaiMinusUtc(date) + eop.ut1MinusUtc;
        var daysSinceJ2000 = dateUt1day - 2451545;
        var fractionOfDay = dateUt1sec / TimeConstants.SECONDS_PER_DAY;
        var era = 0.7790572732640 + fractionOfDay + 0.00273781191135448 * (daysSinceJ2000 + fractionOfDay);
        era = (era % 1.0) * CesiumMath.TWO_PI;
        var earthRotation = Matrix3.fromRotationZ(era, rotation2Scratch);
        var pfToIcrf = Matrix3.multiply(matrixQ, earthRotation, rotation1Scratch);
        var cosxp = Math.cos(eop.xPoleWander);
        var cosyp = Math.cos(eop.yPoleWander);
        var sinxp = Math.sin(eop.xPoleWander);
        var sinyp = Math.sin(eop.yPoleWander);
        var ttt = (dayTT - j2000ttDays) + secondTT / TimeConstants.SECONDS_PER_DAY;
        ttt /= 36525.0;
        var sp = -47.0e-6 * ttt * CesiumMath.RADIANS_PER_DEGREE / 3600.0;
        var cossp = Math.cos(sp);
        var sinsp = Math.sin(sp);
        var fToPfMtx = rotation2Scratch;
        fToPfMtx[0] = cosxp * cossp;
        fToPfMtx[1] = cosxp * sinsp;
        fToPfMtx[2] = sinxp;
        fToPfMtx[3] = -cosyp * sinsp + sinyp * sinxp * cossp;
        fToPfMtx[4] = cosyp * cossp + sinyp * sinxp * sinsp;
        fToPfMtx[5] = -sinyp * cosxp;
        fToPfMtx[6] = -sinyp * sinsp - cosyp * sinxp * cossp;
        fToPfMtx[7] = sinyp * cossp - cosyp * sinxp * sinsp;
        fToPfMtx[8] = cosyp * cosxp;
        return Matrix3.multiply(pfToIcrf, fToPfMtx, result);
      };
      var pointToWindowCoordinatesTemp = new Cartesian4();
      Transforms.pointToWindowCoordinates = function(modelViewProjectionMatrix, viewportTransformation, point, result) {
        result = Transforms.pointToGLWindowCoordinates(modelViewProjectionMatrix, viewportTransformation, point, result);
        result.y = 2.0 * viewportTransformation[5] - result.y;
        return result;
      };
      Transforms.pointToGLWindowCoordinates = function(modelViewProjectionMatrix, viewportTransformation, point, result) {
        if (!defined(modelViewProjectionMatrix)) {
          throw new DeveloperError('modelViewProjectionMatrix is required.');
        }
        if (!defined(viewportTransformation)) {
          throw new DeveloperError('viewportTransformation is required.');
        }
        if (!defined(point)) {
          throw new DeveloperError('point is required.');
        }
        if (!defined(result)) {
          result = new Cartesian2();
        }
        var tmp = pointToWindowCoordinatesTemp;
        Matrix4.multiplyByVector(modelViewProjectionMatrix, Cartesian4.fromElements(point.x, point.y, point.z, 1, tmp), tmp);
        Cartesian4.multiplyByScalar(tmp, 1.0 / tmp.w, tmp);
        Matrix4.multiplyByVector(viewportTransformation, tmp, tmp);
        return Cartesian2.fromCartesian4(tmp, result);
      };
      var normalScratch = new Cartesian3();
      var rightScratch = new Cartesian3();
      var upScratch = new Cartesian3();
      Transforms.rotationMatrixFromPositionVelocity = function(position, velocity, ellipsoid, result) {
        if (!defined(position)) {
          throw new DeveloperError('position is required.');
        }
        if (!defined(velocity)) {
          throw new DeveloperError('velocity is required.');
        }
        var normal = defaultValue(ellipsoid, Ellipsoid.WGS84).geodeticSurfaceNormal(position, normalScratch);
        var right = Cartesian3.cross(velocity, normal, rightScratch);
        if (Cartesian3.equalsEpsilon(right, Cartesian3.ZERO, CesiumMath.EPSILON6)) {
          right = Cartesian3.clone(Cartesian3.UNIT_X, right);
        }
        var up = Cartesian3.cross(right, velocity, upScratch);
        Cartesian3.cross(velocity, up, right);
        Cartesian3.negate(right, right);
        if (!defined(result)) {
          result = new Matrix3();
        }
        result[0] = velocity.x;
        result[1] = velocity.y;
        result[2] = velocity.z;
        result[3] = right.x;
        result[4] = right.y;
        result[5] = right.z;
        result[6] = up.x;
        result[7] = up.y;
        result[8] = up.z;
        return result;
      };
      return Transforms;
    });
    define('Core/EllipsoidTangentPlane', ['./AxisAlignedBoundingBox', './Cartesian2', './Cartesian3', './Cartesian4', './defaultValue', './defined', './defineProperties', './DeveloperError', './Ellipsoid', './IntersectionTests', './Matrix3', './Matrix4', './Plane', './Ray', './Transforms'], function(AxisAlignedBoundingBox, Cartesian2, Cartesian3, Cartesian4, defaultValue, defined, defineProperties, DeveloperError, Ellipsoid, IntersectionTests, Matrix3, Matrix4, Plane, Ray, Transforms) {
      'use strict';
      var scratchCart4 = new Cartesian4();
      function EllipsoidTangentPlane(origin, ellipsoid) {
        if (!defined(origin)) {
          throw new DeveloperError('origin is required.');
        }
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        origin = ellipsoid.scaleToGeodeticSurface(origin);
        if (!defined(origin)) {
          throw new DeveloperError('origin must not be at the center of the ellipsoid.');
        }
        var eastNorthUp = Transforms.eastNorthUpToFixedFrame(origin, ellipsoid);
        this._ellipsoid = ellipsoid;
        this._origin = origin;
        this._xAxis = Cartesian3.fromCartesian4(Matrix4.getColumn(eastNorthUp, 0, scratchCart4));
        this._yAxis = Cartesian3.fromCartesian4(Matrix4.getColumn(eastNorthUp, 1, scratchCart4));
        var normal = Cartesian3.fromCartesian4(Matrix4.getColumn(eastNorthUp, 2, scratchCart4));
        this._plane = Plane.fromPointNormal(origin, normal);
      }
      defineProperties(EllipsoidTangentPlane.prototype, {
        ellipsoid: {get: function() {
            return this._ellipsoid;
          }},
        origin: {get: function() {
            return this._origin;
          }},
        plane: {get: function() {
            return this._plane;
          }},
        xAxis: {get: function() {
            return this._xAxis;
          }},
        yAxis: {get: function() {
            return this._yAxis;
          }},
        zAxis: {get: function() {
            return this._plane.normal;
          }}
      });
      var tmp = new AxisAlignedBoundingBox();
      EllipsoidTangentPlane.fromPoints = function(cartesians, ellipsoid) {
        if (!defined(cartesians)) {
          throw new DeveloperError('cartesians is required.');
        }
        var box = AxisAlignedBoundingBox.fromPoints(cartesians, tmp);
        return new EllipsoidTangentPlane(box.center, ellipsoid);
      };
      var scratchProjectPointOntoPlaneRay = new Ray();
      var scratchProjectPointOntoPlaneCartesian3 = new Cartesian3();
      EllipsoidTangentPlane.prototype.projectPointOntoPlane = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        var ray = scratchProjectPointOntoPlaneRay;
        ray.origin = cartesian;
        Cartesian3.normalize(cartesian, ray.direction);
        var intersectionPoint = IntersectionTests.rayPlane(ray, this._plane, scratchProjectPointOntoPlaneCartesian3);
        if (!defined(intersectionPoint)) {
          Cartesian3.negate(ray.direction, ray.direction);
          intersectionPoint = IntersectionTests.rayPlane(ray, this._plane, scratchProjectPointOntoPlaneCartesian3);
        }
        if (defined(intersectionPoint)) {
          var v = Cartesian3.subtract(intersectionPoint, this._origin, intersectionPoint);
          var x = Cartesian3.dot(this._xAxis, v);
          var y = Cartesian3.dot(this._yAxis, v);
          if (!defined(result)) {
            return new Cartesian2(x, y);
          }
          result.x = x;
          result.y = y;
          return result;
        }
        return undefined;
      };
      EllipsoidTangentPlane.prototype.projectPointsOntoPlane = function(cartesians, result) {
        if (!defined(cartesians)) {
          throw new DeveloperError('cartesians is required.');
        }
        if (!defined(result)) {
          result = [];
        }
        var count = 0;
        var length = cartesians.length;
        for (var i = 0; i < length; i++) {
          var p = this.projectPointOntoPlane(cartesians[i], result[count]);
          if (defined(p)) {
            result[count] = p;
            count++;
          }
        }
        result.length = count;
        return result;
      };
      EllipsoidTangentPlane.prototype.projectPointToNearestOnPlane = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required.');
        }
        if (!defined(result)) {
          result = new Cartesian2();
        }
        var ray = scratchProjectPointOntoPlaneRay;
        ray.origin = cartesian;
        Cartesian3.clone(this._plane.normal, ray.direction);
        var intersectionPoint = IntersectionTests.rayPlane(ray, this._plane, scratchProjectPointOntoPlaneCartesian3);
        if (!defined(intersectionPoint)) {
          Cartesian3.negate(ray.direction, ray.direction);
          intersectionPoint = IntersectionTests.rayPlane(ray, this._plane, scratchProjectPointOntoPlaneCartesian3);
        }
        var v = Cartesian3.subtract(intersectionPoint, this._origin, intersectionPoint);
        var x = Cartesian3.dot(this._xAxis, v);
        var y = Cartesian3.dot(this._yAxis, v);
        result.x = x;
        result.y = y;
        return result;
      };
      EllipsoidTangentPlane.prototype.projectPointsToNearestOnPlane = function(cartesians, result) {
        if (!defined(cartesians)) {
          throw new DeveloperError('cartesians is required.');
        }
        if (!defined(result)) {
          result = [];
        }
        var length = cartesians.length;
        result.length = length;
        for (var i = 0; i < length; i++) {
          result[i] = this.projectPointToNearestOnPlane(cartesians[i], result[i]);
        }
        return result;
      };
      var projectPointsOntoEllipsoidScratch = new Cartesian3();
      EllipsoidTangentPlane.prototype.projectPointsOntoEllipsoid = function(cartesians, result) {
        if (!defined(cartesians)) {
          throw new DeveloperError('cartesians is required.');
        }
        var length = cartesians.length;
        if (!defined(result)) {
          result = new Array(length);
        } else {
          result.length = length;
        }
        var ellipsoid = this._ellipsoid;
        var origin = this._origin;
        var xAxis = this._xAxis;
        var yAxis = this._yAxis;
        var tmp = projectPointsOntoEllipsoidScratch;
        for (var i = 0; i < length; ++i) {
          var position = cartesians[i];
          Cartesian3.multiplyByScalar(xAxis, position.x, tmp);
          if (!defined(result[i])) {
            result[i] = new Cartesian3();
          }
          var point = Cartesian3.add(origin, tmp, result[i]);
          Cartesian3.multiplyByScalar(yAxis, position.y, tmp);
          Cartesian3.add(point, tmp, point);
          ellipsoid.scaleToGeocentricSurface(point, point);
        }
        return result;
      };
      return EllipsoidTangentPlane;
    });
    define('Core/PolylineVolumeGeometryLibrary', ['./Cartesian2', './Cartesian3', './Cartesian4', './Cartographic', './CornerType', './EllipsoidTangentPlane', './Math', './Matrix3', './Matrix4', './PolylinePipeline', './Quaternion', './Transforms'], function(Cartesian2, Cartesian3, Cartesian4, Cartographic, CornerType, EllipsoidTangentPlane, CesiumMath, Matrix3, Matrix4, PolylinePipeline, Quaternion, Transforms) {
      'use strict';
      var scratch2Array = [new Cartesian3(), new Cartesian3()];
      var scratchCartesian1 = new Cartesian3();
      var scratchCartesian2 = new Cartesian3();
      var scratchCartesian3 = new Cartesian3();
      var scratchCartesian4 = new Cartesian3();
      var scratchCartesian5 = new Cartesian3();
      var scratchCartesian6 = new Cartesian3();
      var scratchCartesian7 = new Cartesian3();
      var scratchCartesian8 = new Cartesian3();
      var scratchCartesian9 = new Cartesian3();
      var scratch1 = new Cartesian3();
      var scratch2 = new Cartesian3();
      var PolylineVolumeGeometryLibrary = {};
      var cartographic = new Cartographic();
      function scaleToSurface(positions, ellipsoid) {
        var heights = new Array(positions.length);
        for (var i = 0; i < positions.length; i++) {
          var pos = positions[i];
          cartographic = ellipsoid.cartesianToCartographic(pos, cartographic);
          heights[i] = cartographic.height;
          positions[i] = ellipsoid.scaleToGeodeticSurface(pos, pos);
        }
        return heights;
      }
      function subdivideHeights(points, h0, h1, granularity) {
        var p0 = points[0];
        var p1 = points[1];
        var angleBetween = Cartesian3.angleBetween(p0, p1);
        var numPoints = Math.ceil(angleBetween / granularity);
        var heights = new Array(numPoints);
        var i;
        if (h0 === h1) {
          for (i = 0; i < numPoints; i++) {
            heights[i] = h0;
          }
          heights.push(h1);
          return heights;
        }
        var dHeight = h1 - h0;
        var heightPerVertex = dHeight / (numPoints);
        for (i = 1; i < numPoints; i++) {
          var h = h0 + i * heightPerVertex;
          heights[i] = h;
        }
        heights[0] = h0;
        heights.push(h1);
        return heights;
      }
      function computeRotationAngle(start, end, position, ellipsoid) {
        var tangentPlane = new EllipsoidTangentPlane(position, ellipsoid);
        var next = tangentPlane.projectPointOntoPlane(Cartesian3.add(position, start, nextScratch), nextScratch);
        var prev = tangentPlane.projectPointOntoPlane(Cartesian3.add(position, end, prevScratch), prevScratch);
        var angle = Cartesian2.angleBetween(next, prev);
        return (prev.x * next.y - prev.y * next.x >= 0.0) ? -angle : angle;
      }
      var negativeX = new Cartesian3(-1, 0, 0);
      var transform = new Matrix4();
      var translation = new Matrix4();
      var rotationZ = new Matrix3();
      var scaleMatrix = Matrix3.IDENTITY.clone();
      var westScratch = new Cartesian3();
      var finalPosScratch = new Cartesian4();
      var heightCartesian = new Cartesian3();
      function addPosition(center, left, shape, finalPositions, ellipsoid, height, xScalar, repeat) {
        var west = westScratch;
        var finalPosition = finalPosScratch;
        transform = Transforms.eastNorthUpToFixedFrame(center, ellipsoid, transform);
        west = Matrix4.multiplyByPointAsVector(transform, negativeX, west);
        west = Cartesian3.normalize(west, west);
        var angle = computeRotationAngle(west, left, center, ellipsoid);
        rotationZ = Matrix3.fromRotationZ(angle, rotationZ);
        heightCartesian.z = height;
        transform = Matrix4.multiplyTransformation(transform, Matrix4.fromRotationTranslation(rotationZ, heightCartesian, translation), transform);
        var scale = scaleMatrix;
        scale[0] = xScalar;
        for (var j = 0; j < repeat; j++) {
          for (var i = 0; i < shape.length; i += 3) {
            finalPosition = Cartesian3.fromArray(shape, i, finalPosition);
            finalPosition = Matrix3.multiplyByVector(scale, finalPosition, finalPosition);
            finalPosition = Matrix4.multiplyByPoint(transform, finalPosition, finalPosition);
            finalPositions.push(finalPosition.x, finalPosition.y, finalPosition.z);
          }
        }
        return finalPositions;
      }
      var centerScratch = new Cartesian3();
      function addPositions(centers, left, shape, finalPositions, ellipsoid, heights, xScalar) {
        for (var i = 0; i < centers.length; i += 3) {
          var center = Cartesian3.fromArray(centers, i, centerScratch);
          finalPositions = addPosition(center, left, shape, finalPositions, ellipsoid, heights[i / 3], xScalar, 1);
        }
        return finalPositions;
      }
      function convertShapeTo3DDuplicate(shape2D, boundingRectangle) {
        var length = shape2D.length;
        var shape = new Array(length * 6);
        var index = 0;
        var xOffset = boundingRectangle.x + boundingRectangle.width / 2;
        var yOffset = boundingRectangle.y + boundingRectangle.height / 2;
        var point = shape2D[0];
        shape[index++] = point.x - xOffset;
        shape[index++] = 0.0;
        shape[index++] = point.y - yOffset;
        for (var i = 1; i < length; i++) {
          point = shape2D[i];
          var x = point.x - xOffset;
          var z = point.y - yOffset;
          shape[index++] = x;
          shape[index++] = 0.0;
          shape[index++] = z;
          shape[index++] = x;
          shape[index++] = 0.0;
          shape[index++] = z;
        }
        point = shape2D[0];
        shape[index++] = point.x - xOffset;
        shape[index++] = 0.0;
        shape[index++] = point.y - yOffset;
        return shape;
      }
      function convertShapeTo3D(shape2D, boundingRectangle) {
        var length = shape2D.length;
        var shape = new Array(length * 3);
        var index = 0;
        var xOffset = boundingRectangle.x + boundingRectangle.width / 2;
        var yOffset = boundingRectangle.y + boundingRectangle.height / 2;
        for (var i = 0; i < length; i++) {
          shape[index++] = shape2D[i].x - xOffset;
          shape[index++] = 0;
          shape[index++] = shape2D[i].y - yOffset;
        }
        return shape;
      }
      var quaterion = new Quaternion();
      var startPointScratch = new Cartesian3();
      var rotMatrix = new Matrix3();
      function computeRoundCorner(pivot, startPoint, endPoint, cornerType, leftIsOutside, ellipsoid, finalPositions, shape, height, duplicatePoints) {
        var angle = Cartesian3.angleBetween(Cartesian3.subtract(startPoint, pivot, scratch1), Cartesian3.subtract(endPoint, pivot, scratch2));
        var granularity = (cornerType === CornerType.BEVELED) ? 0 : Math.ceil(angle / CesiumMath.toRadians(5));
        var m;
        if (leftIsOutside) {
          m = Matrix3.fromQuaternion(Quaternion.fromAxisAngle(Cartesian3.negate(pivot, scratch1), angle / (granularity + 1), quaterion), rotMatrix);
        } else {
          m = Matrix3.fromQuaternion(Quaternion.fromAxisAngle(pivot, angle / (granularity + 1), quaterion), rotMatrix);
        }
        var left;
        var surfacePoint;
        startPoint = Cartesian3.clone(startPoint, startPointScratch);
        if (granularity > 0) {
          var repeat = duplicatePoints ? 2 : 1;
          for (var i = 0; i < granularity; i++) {
            startPoint = Matrix3.multiplyByVector(m, startPoint, startPoint);
            left = Cartesian3.subtract(startPoint, pivot, scratch1);
            left = Cartesian3.normalize(left, left);
            if (!leftIsOutside) {
              left = Cartesian3.negate(left, left);
            }
            surfacePoint = ellipsoid.scaleToGeodeticSurface(startPoint, scratch2);
            finalPositions = addPosition(surfacePoint, left, shape, finalPositions, ellipsoid, height, 1, repeat);
          }
        } else {
          left = Cartesian3.subtract(startPoint, pivot, scratch1);
          left = Cartesian3.normalize(left, left);
          if (!leftIsOutside) {
            left = Cartesian3.negate(left, left);
          }
          surfacePoint = ellipsoid.scaleToGeodeticSurface(startPoint, scratch2);
          finalPositions = addPosition(surfacePoint, left, shape, finalPositions, ellipsoid, height, 1, 1);
          endPoint = Cartesian3.clone(endPoint, startPointScratch);
          left = Cartesian3.subtract(endPoint, pivot, scratch1);
          left = Cartesian3.normalize(left, left);
          if (!leftIsOutside) {
            left = Cartesian3.negate(left, left);
          }
          surfacePoint = ellipsoid.scaleToGeodeticSurface(endPoint, scratch2);
          finalPositions = addPosition(surfacePoint, left, shape, finalPositions, ellipsoid, height, 1, 1);
        }
        return finalPositions;
      }
      PolylineVolumeGeometryLibrary.removeDuplicatesFromShape = function(shapePositions) {
        var length = shapePositions.length;
        var cleanedPositions = [];
        for (var i0 = length - 1,
            i1 = 0; i1 < length; i0 = i1++) {
          var v0 = shapePositions[i0];
          var v1 = shapePositions[i1];
          if (!Cartesian2.equals(v0, v1)) {
            cleanedPositions.push(v1);
          }
        }
        return cleanedPositions;
      };
      var nextScratch = new Cartesian3();
      var prevScratch = new Cartesian3();
      PolylineVolumeGeometryLibrary.angleIsGreaterThanPi = function(forward, backward, position, ellipsoid) {
        var tangentPlane = new EllipsoidTangentPlane(position, ellipsoid);
        var next = tangentPlane.projectPointOntoPlane(Cartesian3.add(position, forward, nextScratch), nextScratch);
        var prev = tangentPlane.projectPointOntoPlane(Cartesian3.add(position, backward, prevScratch), prevScratch);
        return ((prev.x * next.y) - (prev.y * next.x)) >= 0.0;
      };
      var scratchForwardProjection = new Cartesian3();
      var scratchBackwardProjection = new Cartesian3();
      PolylineVolumeGeometryLibrary.computePositions = function(positions, shape2D, boundingRectangle, geometry, duplicatePoints) {
        var ellipsoid = geometry._ellipsoid;
        var heights = scaleToSurface(positions, ellipsoid);
        var granularity = geometry._granularity;
        var cornerType = geometry._cornerType;
        var shapeForSides = duplicatePoints ? convertShapeTo3DDuplicate(shape2D, boundingRectangle) : convertShapeTo3D(shape2D, boundingRectangle);
        var shapeForEnds = duplicatePoints ? convertShapeTo3D(shape2D, boundingRectangle) : undefined;
        var heightOffset = boundingRectangle.height / 2;
        var width = boundingRectangle.width / 2;
        var length = positions.length;
        var finalPositions = [];
        var ends = duplicatePoints ? [] : undefined;
        var forward = scratchCartesian1;
        var backward = scratchCartesian2;
        var cornerDirection = scratchCartesian3;
        var surfaceNormal = scratchCartesian4;
        var pivot = scratchCartesian5;
        var start = scratchCartesian6;
        var end = scratchCartesian7;
        var left = scratchCartesian8;
        var previousPosition = scratchCartesian9;
        var position = positions[0];
        var nextPosition = positions[1];
        surfaceNormal = ellipsoid.geodeticSurfaceNormal(position, surfaceNormal);
        forward = Cartesian3.subtract(nextPosition, position, forward);
        forward = Cartesian3.normalize(forward, forward);
        left = Cartesian3.cross(surfaceNormal, forward, left);
        left = Cartesian3.normalize(left, left);
        var h0 = heights[0];
        var h1 = heights[1];
        if (duplicatePoints) {
          ends = addPosition(position, left, shapeForEnds, ends, ellipsoid, h0 + heightOffset, 1, 1);
        }
        previousPosition = Cartesian3.clone(position, previousPosition);
        position = nextPosition;
        backward = Cartesian3.negate(forward, backward);
        var subdividedHeights;
        var subdividedPositions;
        for (var i = 1; i < length - 1; i++) {
          var repeat = duplicatePoints ? 2 : 1;
          nextPosition = positions[i + 1];
          forward = Cartesian3.subtract(nextPosition, position, forward);
          forward = Cartesian3.normalize(forward, forward);
          cornerDirection = Cartesian3.add(forward, backward, cornerDirection);
          cornerDirection = Cartesian3.normalize(cornerDirection, cornerDirection);
          surfaceNormal = ellipsoid.geodeticSurfaceNormal(position, surfaceNormal);
          var forwardProjection = Cartesian3.multiplyByScalar(surfaceNormal, Cartesian3.dot(forward, surfaceNormal), scratchForwardProjection);
          Cartesian3.subtract(forward, forwardProjection, forwardProjection);
          Cartesian3.normalize(forwardProjection, forwardProjection);
          var backwardProjection = Cartesian3.multiplyByScalar(surfaceNormal, Cartesian3.dot(backward, surfaceNormal), scratchBackwardProjection);
          Cartesian3.subtract(backward, backwardProjection, backwardProjection);
          Cartesian3.normalize(backwardProjection, backwardProjection);
          var doCorner = !CesiumMath.equalsEpsilon(Math.abs(Cartesian3.dot(forwardProjection, backwardProjection)), 1.0, CesiumMath.EPSILON7);
          if (doCorner) {
            cornerDirection = Cartesian3.cross(cornerDirection, surfaceNormal, cornerDirection);
            cornerDirection = Cartesian3.cross(surfaceNormal, cornerDirection, cornerDirection);
            cornerDirection = Cartesian3.normalize(cornerDirection, cornerDirection);
            var scalar = 1 / Math.max(0.25, (Cartesian3.magnitude(Cartesian3.cross(cornerDirection, backward, scratch1))));
            var leftIsOutside = PolylineVolumeGeometryLibrary.angleIsGreaterThanPi(forward, backward, position, ellipsoid);
            if (leftIsOutside) {
              pivot = Cartesian3.add(position, Cartesian3.multiplyByScalar(cornerDirection, scalar * width, cornerDirection), pivot);
              start = Cartesian3.add(pivot, Cartesian3.multiplyByScalar(left, width, start), start);
              scratch2Array[0] = Cartesian3.clone(previousPosition, scratch2Array[0]);
              scratch2Array[1] = Cartesian3.clone(start, scratch2Array[1]);
              subdividedHeights = subdivideHeights(scratch2Array, h0 + heightOffset, h1 + heightOffset, granularity);
              subdividedPositions = PolylinePipeline.generateArc({
                positions: scratch2Array,
                granularity: granularity,
                ellipsoid: ellipsoid
              });
              finalPositions = addPositions(subdividedPositions, left, shapeForSides, finalPositions, ellipsoid, subdividedHeights, 1);
              left = Cartesian3.cross(surfaceNormal, forward, left);
              left = Cartesian3.normalize(left, left);
              end = Cartesian3.add(pivot, Cartesian3.multiplyByScalar(left, width, end), end);
              if (cornerType === CornerType.ROUNDED || cornerType === CornerType.BEVELED) {
                computeRoundCorner(pivot, start, end, cornerType, leftIsOutside, ellipsoid, finalPositions, shapeForSides, h1 + heightOffset, duplicatePoints);
              } else {
                cornerDirection = Cartesian3.negate(cornerDirection, cornerDirection);
                finalPositions = addPosition(position, cornerDirection, shapeForSides, finalPositions, ellipsoid, h1 + heightOffset, scalar, repeat);
              }
              previousPosition = Cartesian3.clone(end, previousPosition);
            } else {
              pivot = Cartesian3.add(position, Cartesian3.multiplyByScalar(cornerDirection, scalar * width, cornerDirection), pivot);
              start = Cartesian3.add(pivot, Cartesian3.multiplyByScalar(left, -width, start), start);
              scratch2Array[0] = Cartesian3.clone(previousPosition, scratch2Array[0]);
              scratch2Array[1] = Cartesian3.clone(start, scratch2Array[1]);
              subdividedHeights = subdivideHeights(scratch2Array, h0 + heightOffset, h1 + heightOffset, granularity);
              subdividedPositions = PolylinePipeline.generateArc({
                positions: scratch2Array,
                granularity: granularity,
                ellipsoid: ellipsoid
              });
              finalPositions = addPositions(subdividedPositions, left, shapeForSides, finalPositions, ellipsoid, subdividedHeights, 1);
              left = Cartesian3.cross(surfaceNormal, forward, left);
              left = Cartesian3.normalize(left, left);
              end = Cartesian3.add(pivot, Cartesian3.multiplyByScalar(left, -width, end), end);
              if (cornerType === CornerType.ROUNDED || cornerType === CornerType.BEVELED) {
                computeRoundCorner(pivot, start, end, cornerType, leftIsOutside, ellipsoid, finalPositions, shapeForSides, h1 + heightOffset, duplicatePoints);
              } else {
                finalPositions = addPosition(position, cornerDirection, shapeForSides, finalPositions, ellipsoid, h1 + heightOffset, scalar, repeat);
              }
              previousPosition = Cartesian3.clone(end, previousPosition);
            }
            backward = Cartesian3.negate(forward, backward);
          } else {
            finalPositions = addPosition(previousPosition, left, shapeForSides, finalPositions, ellipsoid, h0 + heightOffset, 1, 1);
            previousPosition = position;
          }
          h0 = h1;
          h1 = heights[i + 1];
          position = nextPosition;
        }
        scratch2Array[0] = Cartesian3.clone(previousPosition, scratch2Array[0]);
        scratch2Array[1] = Cartesian3.clone(position, scratch2Array[1]);
        subdividedHeights = subdivideHeights(scratch2Array, h0 + heightOffset, h1 + heightOffset, granularity);
        subdividedPositions = PolylinePipeline.generateArc({
          positions: scratch2Array,
          granularity: granularity,
          ellipsoid: ellipsoid
        });
        finalPositions = addPositions(subdividedPositions, left, shapeForSides, finalPositions, ellipsoid, subdividedHeights, 1);
        if (duplicatePoints) {
          ends = addPosition(position, left, shapeForEnds, ends, ellipsoid, h1 + heightOffset, 1, 1);
        }
        length = finalPositions.length;
        var posLength = duplicatePoints ? length + ends.length : length;
        var combinedPositions = new Float64Array(posLength);
        combinedPositions.set(finalPositions);
        if (duplicatePoints) {
          combinedPositions.set(ends, length);
        }
        return combinedPositions;
      };
      return PolylineVolumeGeometryLibrary;
    });
    define('Core/CorridorGeometryLibrary', ['./Cartesian3', './CornerType', './defined', './isArray', './Math', './Matrix3', './PolylinePipeline', './PolylineVolumeGeometryLibrary', './Quaternion'], function(Cartesian3, CornerType, defined, isArray, CesiumMath, Matrix3, PolylinePipeline, PolylineVolumeGeometryLibrary, Quaternion) {
      'use strict';
      var CorridorGeometryLibrary = {};
      var scratch1 = new Cartesian3();
      var scratch2 = new Cartesian3();
      var scratch3 = new Cartesian3();
      var scratch4 = new Cartesian3();
      var scaleArray2 = [new Cartesian3(), new Cartesian3()];
      var cartesian1 = new Cartesian3();
      var cartesian2 = new Cartesian3();
      var cartesian3 = new Cartesian3();
      var cartesian4 = new Cartesian3();
      var cartesian5 = new Cartesian3();
      var cartesian6 = new Cartesian3();
      var cartesian7 = new Cartesian3();
      var cartesian8 = new Cartesian3();
      var cartesian9 = new Cartesian3();
      var cartesian10 = new Cartesian3();
      var quaterion = new Quaternion();
      var rotMatrix = new Matrix3();
      function computeRoundCorner(cornerPoint, startPoint, endPoint, cornerType, leftIsOutside) {
        var angle = Cartesian3.angleBetween(Cartesian3.subtract(startPoint, cornerPoint, scratch1), Cartesian3.subtract(endPoint, cornerPoint, scratch2));
        var granularity = (cornerType === CornerType.BEVELED) ? 1 : Math.ceil(angle / CesiumMath.toRadians(5)) + 1;
        var size = granularity * 3;
        var array = new Array(size);
        array[size - 3] = endPoint.x;
        array[size - 2] = endPoint.y;
        array[size - 1] = endPoint.z;
        var m;
        if (leftIsOutside) {
          m = Matrix3.fromQuaternion(Quaternion.fromAxisAngle(Cartesian3.negate(cornerPoint, scratch1), angle / granularity, quaterion), rotMatrix);
        } else {
          m = Matrix3.fromQuaternion(Quaternion.fromAxisAngle(cornerPoint, angle / granularity, quaterion), rotMatrix);
        }
        var index = 0;
        startPoint = Cartesian3.clone(startPoint, scratch1);
        for (var i = 0; i < granularity; i++) {
          startPoint = Matrix3.multiplyByVector(m, startPoint, startPoint);
          array[index++] = startPoint.x;
          array[index++] = startPoint.y;
          array[index++] = startPoint.z;
        }
        return array;
      }
      function addEndCaps(calculatedPositions) {
        var cornerPoint = cartesian1;
        var startPoint = cartesian2;
        var endPoint = cartesian3;
        var leftEdge = calculatedPositions[1];
        startPoint = Cartesian3.fromArray(calculatedPositions[1], leftEdge.length - 3, startPoint);
        endPoint = Cartesian3.fromArray(calculatedPositions[0], 0, endPoint);
        cornerPoint = Cartesian3.multiplyByScalar(Cartesian3.add(startPoint, endPoint, cornerPoint), 0.5, cornerPoint);
        var firstEndCap = computeRoundCorner(cornerPoint, startPoint, endPoint, CornerType.ROUNDED, false);
        var length = calculatedPositions.length - 1;
        var rightEdge = calculatedPositions[length - 1];
        leftEdge = calculatedPositions[length];
        startPoint = Cartesian3.fromArray(rightEdge, rightEdge.length - 3, startPoint);
        endPoint = Cartesian3.fromArray(leftEdge, 0, endPoint);
        cornerPoint = Cartesian3.multiplyByScalar(Cartesian3.add(startPoint, endPoint, cornerPoint), 0.5, cornerPoint);
        var lastEndCap = computeRoundCorner(cornerPoint, startPoint, endPoint, CornerType.ROUNDED, false);
        return [firstEndCap, lastEndCap];
      }
      function computeMiteredCorner(position, leftCornerDirection, lastPoint, leftIsOutside) {
        var cornerPoint = scratch1;
        if (leftIsOutside) {
          cornerPoint = Cartesian3.add(position, leftCornerDirection, cornerPoint);
        } else {
          leftCornerDirection = Cartesian3.negate(leftCornerDirection, leftCornerDirection);
          cornerPoint = Cartesian3.add(position, leftCornerDirection, cornerPoint);
        }
        return [cornerPoint.x, cornerPoint.y, cornerPoint.z, lastPoint.x, lastPoint.y, lastPoint.z];
      }
      function addShiftedPositions(positions, left, scalar, calculatedPositions) {
        var rightPositions = new Array(positions.length);
        var leftPositions = new Array(positions.length);
        var scaledLeft = Cartesian3.multiplyByScalar(left, scalar, scratch1);
        var scaledRight = Cartesian3.negate(scaledLeft, scratch2);
        var rightIndex = 0;
        var leftIndex = positions.length - 1;
        for (var i = 0; i < positions.length; i += 3) {
          var pos = Cartesian3.fromArray(positions, i, scratch3);
          var rightPos = Cartesian3.add(pos, scaledRight, scratch4);
          rightPositions[rightIndex++] = rightPos.x;
          rightPositions[rightIndex++] = rightPos.y;
          rightPositions[rightIndex++] = rightPos.z;
          var leftPos = Cartesian3.add(pos, scaledLeft, scratch4);
          leftPositions[leftIndex--] = leftPos.z;
          leftPositions[leftIndex--] = leftPos.y;
          leftPositions[leftIndex--] = leftPos.x;
        }
        calculatedPositions.push(rightPositions, leftPositions);
        return calculatedPositions;
      }
      CorridorGeometryLibrary.addAttribute = function(attribute, value, front, back) {
        var x = value.x;
        var y = value.y;
        var z = value.z;
        if (defined(front)) {
          attribute[front] = x;
          attribute[front + 1] = y;
          attribute[front + 2] = z;
        }
        if (defined(back)) {
          attribute[back] = z;
          attribute[back - 1] = y;
          attribute[back - 2] = x;
        }
      };
      function scaleToSurface(positions, ellipsoid) {
        for (var i = 0; i < positions.length; i++) {
          positions[i] = ellipsoid.scaleToGeodeticSurface(positions[i], positions[i]);
        }
        return positions;
      }
      var scratchForwardProjection = new Cartesian3();
      var scratchBackwardProjection = new Cartesian3();
      CorridorGeometryLibrary.computePositions = function(params) {
        var granularity = params.granularity;
        var positions = params.positions;
        var ellipsoid = params.ellipsoid;
        positions = scaleToSurface(positions, ellipsoid);
        var width = params.width / 2;
        var cornerType = params.cornerType;
        var saveAttributes = params.saveAttributes;
        var normal = cartesian1;
        var forward = cartesian2;
        var backward = cartesian3;
        var left = cartesian4;
        var cornerDirection = cartesian5;
        var startPoint = cartesian6;
        var previousPos = cartesian7;
        var rightPos = cartesian8;
        var leftPos = cartesian9;
        var center = cartesian10;
        var calculatedPositions = [];
        var calculatedLefts = (saveAttributes) ? [] : undefined;
        var calculatedNormals = (saveAttributes) ? [] : undefined;
        var position = positions[0];
        var nextPosition = positions[1];
        forward = Cartesian3.normalize(Cartesian3.subtract(nextPosition, position, forward), forward);
        normal = ellipsoid.geodeticSurfaceNormal(position, normal);
        left = Cartesian3.normalize(Cartesian3.cross(normal, forward, left), left);
        if (saveAttributes) {
          calculatedLefts.push(left.x, left.y, left.z);
          calculatedNormals.push(normal.x, normal.y, normal.z);
        }
        previousPos = Cartesian3.clone(position, previousPos);
        position = nextPosition;
        backward = Cartesian3.negate(forward, backward);
        var subdividedPositions;
        var corners = [];
        var i;
        var length = positions.length;
        for (i = 1; i < length - 1; i++) {
          normal = ellipsoid.geodeticSurfaceNormal(position, normal);
          nextPosition = positions[i + 1];
          forward = Cartesian3.normalize(Cartesian3.subtract(nextPosition, position, forward), forward);
          cornerDirection = Cartesian3.normalize(Cartesian3.add(forward, backward, cornerDirection), cornerDirection);
          var forwardProjection = Cartesian3.multiplyByScalar(normal, Cartesian3.dot(forward, normal), scratchForwardProjection);
          Cartesian3.subtract(forward, forwardProjection, forwardProjection);
          Cartesian3.normalize(forwardProjection, forwardProjection);
          var backwardProjection = Cartesian3.multiplyByScalar(normal, Cartesian3.dot(backward, normal), scratchBackwardProjection);
          Cartesian3.subtract(backward, backwardProjection, backwardProjection);
          Cartesian3.normalize(backwardProjection, backwardProjection);
          var doCorner = !CesiumMath.equalsEpsilon(Math.abs(Cartesian3.dot(forwardProjection, backwardProjection)), 1.0, CesiumMath.EPSILON7);
          if (doCorner) {
            cornerDirection = Cartesian3.cross(cornerDirection, normal, cornerDirection);
            cornerDirection = Cartesian3.cross(normal, cornerDirection, cornerDirection);
            cornerDirection = Cartesian3.normalize(cornerDirection, cornerDirection);
            var scalar = width / Math.max(0.25, Cartesian3.magnitude(Cartesian3.cross(cornerDirection, backward, scratch1)));
            var leftIsOutside = PolylineVolumeGeometryLibrary.angleIsGreaterThanPi(forward, backward, position, ellipsoid);
            cornerDirection = Cartesian3.multiplyByScalar(cornerDirection, scalar, cornerDirection);
            if (leftIsOutside) {
              rightPos = Cartesian3.add(position, cornerDirection, rightPos);
              center = Cartesian3.add(rightPos, Cartesian3.multiplyByScalar(left, width, center), center);
              leftPos = Cartesian3.add(rightPos, Cartesian3.multiplyByScalar(left, width * 2, leftPos), leftPos);
              scaleArray2[0] = Cartesian3.clone(previousPos, scaleArray2[0]);
              scaleArray2[1] = Cartesian3.clone(center, scaleArray2[1]);
              subdividedPositions = PolylinePipeline.generateArc({
                positions: scaleArray2,
                granularity: granularity,
                ellipsoid: ellipsoid
              });
              calculatedPositions = addShiftedPositions(subdividedPositions, left, width, calculatedPositions);
              if (saveAttributes) {
                calculatedLefts.push(left.x, left.y, left.z);
                calculatedNormals.push(normal.x, normal.y, normal.z);
              }
              startPoint = Cartesian3.clone(leftPos, startPoint);
              left = Cartesian3.normalize(Cartesian3.cross(normal, forward, left), left);
              leftPos = Cartesian3.add(rightPos, Cartesian3.multiplyByScalar(left, width * 2, leftPos), leftPos);
              previousPos = Cartesian3.add(rightPos, Cartesian3.multiplyByScalar(left, width, previousPos), previousPos);
              if (cornerType === CornerType.ROUNDED || cornerType === CornerType.BEVELED) {
                corners.push({leftPositions: computeRoundCorner(rightPos, startPoint, leftPos, cornerType, leftIsOutside)});
              } else {
                corners.push({leftPositions: computeMiteredCorner(position, Cartesian3.negate(cornerDirection, cornerDirection), leftPos, leftIsOutside)});
              }
            } else {
              leftPos = Cartesian3.add(position, cornerDirection, leftPos);
              center = Cartesian3.add(leftPos, Cartesian3.negate(Cartesian3.multiplyByScalar(left, width, center), center), center);
              rightPos = Cartesian3.add(leftPos, Cartesian3.negate(Cartesian3.multiplyByScalar(left, width * 2, rightPos), rightPos), rightPos);
              scaleArray2[0] = Cartesian3.clone(previousPos, scaleArray2[0]);
              scaleArray2[1] = Cartesian3.clone(center, scaleArray2[1]);
              subdividedPositions = PolylinePipeline.generateArc({
                positions: scaleArray2,
                granularity: granularity,
                ellipsoid: ellipsoid
              });
              calculatedPositions = addShiftedPositions(subdividedPositions, left, width, calculatedPositions);
              if (saveAttributes) {
                calculatedLefts.push(left.x, left.y, left.z);
                calculatedNormals.push(normal.x, normal.y, normal.z);
              }
              startPoint = Cartesian3.clone(rightPos, startPoint);
              left = Cartesian3.normalize(Cartesian3.cross(normal, forward, left), left);
              rightPos = Cartesian3.add(leftPos, Cartesian3.negate(Cartesian3.multiplyByScalar(left, width * 2, rightPos), rightPos), rightPos);
              previousPos = Cartesian3.add(leftPos, Cartesian3.negate(Cartesian3.multiplyByScalar(left, width, previousPos), previousPos), previousPos);
              if (cornerType === CornerType.ROUNDED || cornerType === CornerType.BEVELED) {
                corners.push({rightPositions: computeRoundCorner(leftPos, startPoint, rightPos, cornerType, leftIsOutside)});
              } else {
                corners.push({rightPositions: computeMiteredCorner(position, cornerDirection, rightPos, leftIsOutside)});
              }
            }
            backward = Cartesian3.negate(forward, backward);
          }
          position = nextPosition;
        }
        normal = ellipsoid.geodeticSurfaceNormal(position, normal);
        scaleArray2[0] = Cartesian3.clone(previousPos, scaleArray2[0]);
        scaleArray2[1] = Cartesian3.clone(position, scaleArray2[1]);
        subdividedPositions = PolylinePipeline.generateArc({
          positions: scaleArray2,
          granularity: granularity,
          ellipsoid: ellipsoid
        });
        calculatedPositions = addShiftedPositions(subdividedPositions, left, width, calculatedPositions);
        if (saveAttributes) {
          calculatedLefts.push(left.x, left.y, left.z);
          calculatedNormals.push(normal.x, normal.y, normal.z);
        }
        var endPositions;
        if (cornerType === CornerType.ROUNDED) {
          endPositions = addEndCaps(calculatedPositions);
        }
        return {
          positions: calculatedPositions,
          corners: corners,
          lefts: calculatedLefts,
          normals: calculatedNormals,
          endPositions: endPositions
        };
      };
      return CorridorGeometryLibrary;
    });
    define('Core/GeometryType', ['./freezeObject'], function(freezeObject) {
      'use strict';
      var GeometryType = {
        NONE: 0,
        TRIANGLES: 1,
        LINES: 2,
        POLYLINES: 3
      };
      return freezeObject(GeometryType);
    });
    define('Core/PrimitiveType', ['../Renderer/WebGLConstants', './freezeObject'], function(WebGLConstants, freezeObject) {
      'use strict';
      var PrimitiveType = {
        POINTS: WebGLConstants.POINTS,
        LINES: WebGLConstants.LINES,
        LINE_LOOP: WebGLConstants.LINE_LOOP,
        LINE_STRIP: WebGLConstants.LINE_STRIP,
        TRIANGLES: WebGLConstants.TRIANGLES,
        TRIANGLE_STRIP: WebGLConstants.TRIANGLE_STRIP,
        TRIANGLE_FAN: WebGLConstants.TRIANGLE_FAN,
        validate: function(primitiveType) {
          return primitiveType === PrimitiveType.POINTS || primitiveType === PrimitiveType.LINES || primitiveType === PrimitiveType.LINE_LOOP || primitiveType === PrimitiveType.LINE_STRIP || primitiveType === PrimitiveType.TRIANGLES || primitiveType === PrimitiveType.TRIANGLE_STRIP || primitiveType === PrimitiveType.TRIANGLE_FAN;
        }
      };
      return freezeObject(PrimitiveType);
    });
    define('Core/Geometry', ['./defaultValue', './defined', './DeveloperError', './GeometryType', './PrimitiveType'], function(defaultValue, defined, DeveloperError, GeometryType, PrimitiveType) {
      'use strict';
      function Geometry(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        if (!defined(options.attributes)) {
          throw new DeveloperError('options.attributes is required.');
        }
        this.attributes = options.attributes;
        this.indices = options.indices;
        this.primitiveType = defaultValue(options.primitiveType, PrimitiveType.TRIANGLES);
        this.boundingSphere = options.boundingSphere;
        this.geometryType = defaultValue(options.geometryType, GeometryType.NONE);
        this.boundingSphereCV = undefined;
      }
      Geometry.computeNumberOfVertices = function(geometry) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        var numberOfVertices = -1;
        for (var property in geometry.attributes) {
          if (geometry.attributes.hasOwnProperty(property) && defined(geometry.attributes[property]) && defined(geometry.attributes[property].values)) {
            var attribute = geometry.attributes[property];
            var num = attribute.values.length / attribute.componentsPerAttribute;
            if ((numberOfVertices !== num) && (numberOfVertices !== -1)) {
              throw new DeveloperError('All attribute lists must have the same number of attributes.');
            }
            numberOfVertices = num;
          }
        }
        return numberOfVertices;
      };
      return Geometry;
    });
    define('Core/GeometryAttribute', ['./defaultValue', './defined', './DeveloperError'], function(defaultValue, defined, DeveloperError) {
      'use strict';
      function GeometryAttribute(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        if (!defined(options.componentDatatype)) {
          throw new DeveloperError('options.componentDatatype is required.');
        }
        if (!defined(options.componentsPerAttribute)) {
          throw new DeveloperError('options.componentsPerAttribute is required.');
        }
        if (options.componentsPerAttribute < 1 || options.componentsPerAttribute > 4) {
          throw new DeveloperError('options.componentsPerAttribute must be between 1 and 4.');
        }
        if (!defined(options.values)) {
          throw new DeveloperError('options.values is required.');
        }
        this.componentDatatype = options.componentDatatype;
        this.componentsPerAttribute = options.componentsPerAttribute;
        this.normalize = defaultValue(options.normalize, false);
        this.values = options.values;
      }
      return GeometryAttribute;
    });
    define('Core/GeometryAttributes', ['./defaultValue'], function(defaultValue) {
      'use strict';
      function GeometryAttributes(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        this.position = options.position;
        this.normal = options.normal;
        this.st = options.st;
        this.binormal = options.binormal;
        this.tangent = options.tangent;
        this.color = options.color;
      }
      return GeometryAttributes;
    });
    define('Core/IndexDatatype', ['../Renderer/WebGLConstants', './defined', './DeveloperError', './freezeObject', './Math'], function(WebGLConstants, defined, DeveloperError, freezeObject, CesiumMath) {
      'use strict';
      var IndexDatatype = {
        UNSIGNED_BYTE: WebGLConstants.UNSIGNED_BYTE,
        UNSIGNED_SHORT: WebGLConstants.UNSIGNED_SHORT,
        UNSIGNED_INT: WebGLConstants.UNSIGNED_INT
      };
      IndexDatatype.getSizeInBytes = function(indexDatatype) {
        switch (indexDatatype) {
          case IndexDatatype.UNSIGNED_BYTE:
            return Uint8Array.BYTES_PER_ELEMENT;
          case IndexDatatype.UNSIGNED_SHORT:
            return Uint16Array.BYTES_PER_ELEMENT;
          case IndexDatatype.UNSIGNED_INT:
            return Uint32Array.BYTES_PER_ELEMENT;
        }
        throw new DeveloperError('indexDatatype is required and must be a valid IndexDatatype constant.');
      };
      IndexDatatype.validate = function(indexDatatype) {
        return defined(indexDatatype) && (indexDatatype === IndexDatatype.UNSIGNED_BYTE || indexDatatype === IndexDatatype.UNSIGNED_SHORT || indexDatatype === IndexDatatype.UNSIGNED_INT);
      };
      IndexDatatype.createTypedArray = function(numberOfVertices, indicesLengthOrArray) {
        if (!defined(numberOfVertices)) {
          throw new DeveloperError('numberOfVertices is required.');
        }
        if (numberOfVertices >= CesiumMath.SIXTY_FOUR_KILOBYTES) {
          return new Uint32Array(indicesLengthOrArray);
        }
        return new Uint16Array(indicesLengthOrArray);
      };
      IndexDatatype.createTypedArrayFromArrayBuffer = function(numberOfVertices, sourceArray, byteOffset, length) {
        if (!defined(numberOfVertices)) {
          throw new DeveloperError('numberOfVertices is required.');
        }
        if (!defined(sourceArray)) {
          throw new DeveloperError('sourceArray is required.');
        }
        if (!defined(byteOffset)) {
          throw new DeveloperError('byteOffset is required.');
        }
        if (numberOfVertices >= CesiumMath.SIXTY_FOUR_KILOBYTES) {
          return new Uint32Array(sourceArray, byteOffset, length);
        }
        return new Uint16Array(sourceArray, byteOffset, length);
      };
      return freezeObject(IndexDatatype);
    });
    define('Core/barycentricCoordinates', ['./Cartesian2', './Cartesian3', './defined', './DeveloperError'], function(Cartesian2, Cartesian3, defined, DeveloperError) {
      'use strict';
      var scratchCartesian1 = new Cartesian3();
      var scratchCartesian2 = new Cartesian3();
      var scratchCartesian3 = new Cartesian3();
      function barycentricCoordinates(point, p0, p1, p2, result) {
        if (!defined(point) || !defined(p0) || !defined(p1) || !defined(p2)) {
          throw new DeveloperError('point, p0, p1, and p2 are required.');
        }
        if (!defined(result)) {
          result = new Cartesian3();
        }
        var v0,
            v1,
            v2;
        var dot00,
            dot01,
            dot02,
            dot11,
            dot12;
        if (!defined(p0.z)) {
          v0 = Cartesian2.subtract(p1, p0, scratchCartesian1);
          v1 = Cartesian2.subtract(p2, p0, scratchCartesian2);
          v2 = Cartesian2.subtract(point, p0, scratchCartesian3);
          dot00 = Cartesian2.dot(v0, v0);
          dot01 = Cartesian2.dot(v0, v1);
          dot02 = Cartesian2.dot(v0, v2);
          dot11 = Cartesian2.dot(v1, v1);
          dot12 = Cartesian2.dot(v1, v2);
        } else {
          v0 = Cartesian3.subtract(p1, p0, scratchCartesian1);
          v1 = Cartesian3.subtract(p2, p0, scratchCartesian2);
          v2 = Cartesian3.subtract(point, p0, scratchCartesian3);
          dot00 = Cartesian3.dot(v0, v0);
          dot01 = Cartesian3.dot(v0, v1);
          dot02 = Cartesian3.dot(v0, v2);
          dot11 = Cartesian3.dot(v1, v1);
          dot12 = Cartesian3.dot(v1, v2);
        }
        var q = 1.0 / (dot00 * dot11 - dot01 * dot01);
        result.y = (dot11 * dot02 - dot01 * dot12) * q;
        result.z = (dot00 * dot12 - dot01 * dot02) * q;
        result.x = 1.0 - result.y - result.z;
        return result;
      }
      return barycentricCoordinates;
    });
    define('Core/pointInsideTriangle', ['./barycentricCoordinates', './Cartesian3'], function(barycentricCoordinates, Cartesian3) {
      'use strict';
      var coords = new Cartesian3();
      function pointInsideTriangle(point, p0, p1, p2) {
        barycentricCoordinates(point, p0, p1, p2, coords);
        return (coords.x > 0.0) && (coords.y > 0.0) && (coords.z > 0);
      }
      return pointInsideTriangle;
    });
    define('Core/Queue', ['../Core/defineProperties'], function(defineProperties) {
      'use strict';
      function Queue() {
        this._array = [];
        this._offset = 0;
        this._length = 0;
      }
      defineProperties(Queue.prototype, {length: {get: function() {
            return this._length;
          }}});
      Queue.prototype.enqueue = function(item) {
        this._array.push(item);
        this._length++;
      };
      Queue.prototype.dequeue = function() {
        if (this._length === 0) {
          return undefined;
        }
        var array = this._array;
        var offset = this._offset;
        var item = array[offset];
        array[offset] = undefined;
        offset++;
        if ((offset > 10) && (offset * 2 > array.length)) {
          this._array = array.slice(offset);
          offset = 0;
        }
        this._offset = offset;
        this._length--;
        return item;
      };
      Queue.prototype.peek = function() {
        if (this._length === 0) {
          return undefined;
        }
        return this._array[this._offset];
      };
      Queue.prototype.contains = function(item) {
        return this._array.indexOf(item) !== -1;
      };
      Queue.prototype.clear = function() {
        this._array.length = this._offset = this._length = 0;
      };
      Queue.prototype.sort = function(compareFunction) {
        if (this._offset > 0) {
          this._array = this._array.slice(this._offset);
          this._offset = 0;
        }
        this._array.sort(compareFunction);
      };
      return Queue;
    });
    define('Core/WindingOrder', ['../Renderer/WebGLConstants', './freezeObject'], function(WebGLConstants, freezeObject) {
      'use strict';
      var WindingOrder = {
        CLOCKWISE: WebGLConstants.CW,
        COUNTER_CLOCKWISE: WebGLConstants.CCW,
        validate: function(windingOrder) {
          return windingOrder === WindingOrder.CLOCKWISE || windingOrder === WindingOrder.COUNTER_CLOCKWISE;
        }
      };
      return freezeObject(WindingOrder);
    });
    define('Core/PolygonPipeline', ['./Cartesian2', './Cartesian3', './ComponentDatatype', './defaultValue', './defined', './DeveloperError', './Ellipsoid', './EllipsoidTangentPlane', './Geometry', './GeometryAttribute', './Math', './pointInsideTriangle', './PolylinePipeline', './PrimitiveType', './Queue', './WindingOrder'], function(Cartesian2, Cartesian3, ComponentDatatype, defaultValue, defined, DeveloperError, Ellipsoid, EllipsoidTangentPlane, Geometry, GeometryAttribute, CesiumMath, pointInsideTriangle, PolylinePipeline, PrimitiveType, Queue, WindingOrder) {
      'use strict';
      var uScratch = new Cartesian2();
      var vScratch = new Cartesian2();
      function isTipConvex(p0, p1, p2) {
        var u = Cartesian2.subtract(p1, p0, uScratch);
        var v = Cartesian2.subtract(p2, p1, vScratch);
        return ((u.x * v.y) - (u.y * v.x)) >= 0.0;
      }
      function getRightmostPositionIndex(positions) {
        var maximumX = positions[0].x;
        var rightmostPositionIndex = 0;
        for (var i = 0; i < positions.length; i++) {
          if (positions[i].x > maximumX) {
            maximumX = positions[i].x;
            rightmostPositionIndex = i;
          }
        }
        return rightmostPositionIndex;
      }
      function getRightmostRingIndex(rings) {
        var rightmostX = rings[0][0].x;
        var rightmostRingIndex = 0;
        for (var ring = 0; ring < rings.length; ring++) {
          var maximumX = rings[ring][getRightmostPositionIndex(rings[ring])].x;
          if (maximumX > rightmostX) {
            rightmostX = maximumX;
            rightmostRingIndex = ring;
          }
        }
        return rightmostRingIndex;
      }
      function getReflexVertices(polygon) {
        var reflexVertices = [];
        for (var i = 0; i < polygon.length; i++) {
          var p0 = polygon[((i - 1) + polygon.length) % polygon.length];
          var p1 = polygon[i];
          var p2 = polygon[(i + 1) % polygon.length];
          if (!isTipConvex(p0, p1, p2)) {
            reflexVertices.push(p1);
          }
        }
        return reflexVertices;
      }
      function isVertex(positions, point) {
        for (var i = 0; i < positions.length; i++) {
          if (Cartesian2.equals(point, positions[i])) {
            return i;
          }
        }
        return -1;
      }
      var distScratch = new Cartesian2();
      function intersectPointWithRing(point, ring, edgeIndices) {
        edgeIndices = defaultValue(edgeIndices, []);
        var minDistance = Number.MAX_VALUE;
        var rightmostVertexIndex = getRightmostPositionIndex(ring);
        var intersection = new Cartesian2(ring[rightmostVertexIndex].x, point.y);
        edgeIndices.push(rightmostVertexIndex);
        edgeIndices.push((rightmostVertexIndex + 1) % ring.length);
        var boundaryMinX = ring[0].x;
        var boundaryMaxX = boundaryMinX;
        for (var i = 1; i < ring.length; ++i) {
          if (ring[i].x < boundaryMinX) {
            boundaryMinX = ring[i].x;
          } else if (ring[i].x > boundaryMaxX) {
            boundaryMaxX = ring[i].x;
          }
        }
        boundaryMaxX += (boundaryMaxX - boundaryMinX);
        var point2 = new Cartesian3(boundaryMaxX, point.y, 0.0);
        for (i = 0; i < ring.length; i++) {
          var v1 = ring[i];
          var v2 = ring[(i + 1) % ring.length];
          if (((v1.x >= point.x) || (v2.x >= point.x)) && (((v1.y >= point.y) && (v2.y <= point.y)) || ((v1.y <= point.y) && (v2.y >= point.y)))) {
            var temp = ((v2.y - v1.y) * (point2.x - point.x)) - ((v2.x - v1.x) * (point2.y - point.y));
            if (temp !== 0.0) {
              temp = 1.0 / temp;
              var ua = (((v2.x - v1.x) * (point.y - v1.y)) - ((v2.y - v1.y) * (point.x - v1.x))) * temp;
              var ub = (((point2.x - point.x) * (point.y - v1.y)) - ((point2.y - point.y) * (point.x - v1.x))) * temp;
              if ((ua >= 0.0) && (ua <= 1.0) && (ub >= 0.0) && (ub <= 1.0)) {
                var tempIntersection = new Cartesian2(point.x + ua * (point2.x - point.x), point.y + ua * (point2.y - point.y));
                var dist = Cartesian2.subtract(tempIntersection, point, distScratch);
                temp = Cartesian2.magnitudeSquared(dist);
                if (temp < minDistance) {
                  intersection = tempIntersection;
                  minDistance = temp;
                  edgeIndices[0] = i;
                  edgeIndices[1] = (i + 1) % ring.length;
                }
              }
            }
          }
        }
        return intersection;
      }
      var v1Scratch = new Cartesian2(1.0, 0.0);
      var v2Scratch = new Cartesian2();
      function getMutuallyVisibleVertexIndex(outerRing, innerRings) {
        var innerRingIndex = getRightmostRingIndex(innerRings);
        var innerRing = innerRings[innerRingIndex];
        var innerRingVertexIndex = getRightmostPositionIndex(innerRing);
        var innerRingVertex = innerRing[innerRingVertexIndex];
        var edgeIndices = [];
        var intersection = intersectPointWithRing(innerRingVertex, outerRing, edgeIndices);
        var visibleVertex = isVertex(outerRing, intersection);
        if (visibleVertex !== -1) {
          return visibleVertex;
        }
        var d1 = Cartesian2.magnitudeSquared(Cartesian2.subtract(outerRing[edgeIndices[0]], innerRingVertex, v1Scratch));
        var d2 = Cartesian2.magnitudeSquared(Cartesian2.subtract(outerRing[edgeIndices[1]], innerRingVertex, v1Scratch));
        var p = (d1 < d2) ? outerRing[edgeIndices[0]] : outerRing[edgeIndices[1]];
        var reflexVertices = getReflexVertices(outerRing);
        var reflexIndex = reflexVertices.indexOf(p);
        if (reflexIndex !== -1) {
          reflexVertices.splice(reflexIndex, 1);
        }
        var pointsInside = [];
        for (var i = 0; i < reflexVertices.length; i++) {
          var vertex = reflexVertices[i];
          if (pointInsideTriangle(vertex, innerRingVertex, intersection, p)) {
            pointsInside.push(vertex);
          }
        }
        var minAngle = Number.MAX_VALUE;
        if (pointsInside.length > 0) {
          var v1 = Cartesian2.fromElements(1.0, 0.0, v1Scratch);
          for (i = 0; i < pointsInside.length; i++) {
            var v2 = Cartesian2.subtract(pointsInside[i], innerRingVertex, v2Scratch);
            var denominator = Cartesian2.magnitude(v1) * Cartesian2.magnitudeSquared(v2);
            if (denominator !== 0) {
              var angle = Math.abs(CesiumMath.acosClamped(Cartesian2.dot(v1, v2) / denominator));
              if (angle < minAngle) {
                minAngle = angle;
                p = pointsInside[i];
              }
            }
          }
        }
        return outerRing.indexOf(p);
      }
      function eliminateHole(outerRing, innerRings, ellipsoid) {
        var windingOrder = PolygonPipeline.computeWindingOrder2D(outerRing);
        for (var i = 0; i < innerRings.length; i++) {
          var ring = innerRings[i];
          if (!Cartesian3.equals(ring[0], ring[ring.length - 1])) {
            ring.push(ring[0]);
          }
          var innerWindingOrder = PolygonPipeline.computeWindingOrder2D(ring);
          if (innerWindingOrder === windingOrder) {
            ring.reverse();
          }
        }
        var tangentPlane = EllipsoidTangentPlane.fromPoints(outerRing, ellipsoid);
        var tangentOuterRing = tangentPlane.projectPointsOntoPlane(outerRing);
        var tangentInnerRings = [];
        for (i = 0; i < innerRings.length; i++) {
          tangentInnerRings.push(tangentPlane.projectPointsOntoPlane(innerRings[i]));
        }
        var visibleVertexIndex = getMutuallyVisibleVertexIndex(tangentOuterRing, tangentInnerRings);
        var innerRingIndex = getRightmostRingIndex(tangentInnerRings);
        var innerRingVertexIndex = getRightmostPositionIndex(tangentInnerRings[innerRingIndex]);
        var innerRing = innerRings[innerRingIndex];
        var newPolygonVertices = [];
        for (i = 0; i < outerRing.length; i++) {
          newPolygonVertices.push(outerRing[i]);
        }
        var j;
        var holeVerticesToAdd = [];
        if (innerRingVertexIndex !== 0) {
          for (j = 0; j <= innerRing.length; j++) {
            var index = (j + innerRingVertexIndex) % innerRing.length;
            if (index !== 0) {
              holeVerticesToAdd.push(innerRing[index]);
            }
          }
        } else {
          for (j = 0; j < innerRing.length; j++) {
            holeVerticesToAdd.push(innerRing[(j + innerRingVertexIndex) % innerRing.length]);
          }
        }
        var lastVisibleVertexIndex = newPolygonVertices.lastIndexOf(outerRing[visibleVertexIndex]);
        holeVerticesToAdd.push(outerRing[lastVisibleVertexIndex]);
        var front = newPolygonVertices.slice(0, lastVisibleVertexIndex + 1);
        var back = newPolygonVertices.slice(lastVisibleVertexIndex + 1);
        newPolygonVertices = front.concat(holeVerticesToAdd, back);
        innerRings.splice(innerRingIndex, 1);
        return newPolygonVertices;
      }
      function getRandomIndex(length) {
        var random = CesiumMath.nextRandomNumber();
        var i = Math.floor(random * length);
        if (i === length) {
          i--;
        }
        return i;
      }
      function indexedEdgeCrossZ(p0Index, p1Index, vertexIndex, array) {
        var p0 = array[p0Index].position;
        var p1 = array[p1Index].position;
        var v = array[vertexIndex].position;
        var vx = v.x;
        var vy = v.y;
        var leftX = p0.x - vx;
        var leftY = p0.y - vy;
        var rightX = p1.x - vx;
        var rightY = p1.y - vy;
        return leftX * rightY - leftY * rightX;
      }
      function crossZ(p0, p1) {
        return p0.x * p1.y - p0.y * p1.x;
      }
      function validateVertex(index, pArray) {
        var length = pArray.length;
        var before = CesiumMath.mod(index - 1, length);
        var after = CesiumMath.mod(index + 1, length);
        if (indexedEdgeCrossZ(before, after, index, pArray) === 0.0) {
          return false;
        }
        return true;
      }
      function isInternalToParallelSide(side, cut) {
        return Cartesian2.magnitudeSquared(cut) < Cartesian2.magnitudeSquared(side);
      }
      var INTERNAL = -1;
      var EXTERNAL = -2;
      var s1Scratch = new Cartesian3();
      var s2Scratch = new Cartesian3();
      var cutScratch = new Cartesian3();
      function internalCut(a1i, a2i, pArray) {
        if (!validateVertex(a1i, pArray)) {
          return a1i;
        }
        var a1Position = pArray[a1i].position;
        var a2Position = pArray[a2i].position;
        var length = pArray.length;
        var before = CesiumMath.mod(a1i - 1, length);
        if (!validateVertex(before, pArray)) {
          return before;
        }
        var after = CesiumMath.mod(a1i + 1, length);
        if (!validateVertex(after, pArray)) {
          return after;
        }
        var s1 = Cartesian2.subtract(pArray[before].position, a1Position, s1Scratch);
        var s2 = Cartesian2.subtract(pArray[after].position, a1Position, s2Scratch);
        var cut = Cartesian2.subtract(a2Position, a1Position, cutScratch);
        var leftEdgeCutZ = crossZ(s1, cut);
        var rightEdgeCutZ = crossZ(s2, cut);
        if (leftEdgeCutZ === 0.0) {
          return isInternalToParallelSide(s1, cut) ? INTERNAL : EXTERNAL;
        } else if (rightEdgeCutZ === 0.0) {
          return isInternalToParallelSide(s2, cut) ? INTERNAL : EXTERNAL;
        } else {
          var z = crossZ(s1, s2);
          if (z < 0.0) {
            return leftEdgeCutZ < 0.0 && rightEdgeCutZ > 0.0 ? INTERNAL : EXTERNAL;
          } else if (z > 0.0) {
            return leftEdgeCutZ > 0.0 && rightEdgeCutZ < 0.0 ? EXTERNAL : INTERNAL;
          }
        }
      }
      function isBetween(number, n1, n2) {
        return ((number > n1 || number > n2) && (number < n1 || number < n2)) || (n1 === n2 && n1 === number);
      }
      var sqrEpsilon = CesiumMath.EPSILON14;
      var eScratch = new Cartesian2();
      function linesIntersection(p0, d0, p1, d1) {
        var e = Cartesian2.subtract(p1, p0, eScratch);
        var cross = d0.x * d1.y - d0.y * d1.x;
        var sqrCross = cross * cross;
        var sqrLen0 = Cartesian2.magnitudeSquared(d0);
        var sqrLen1 = Cartesian2.magnitudeSquared(d1);
        if (sqrCross > sqrEpsilon * sqrLen0 * sqrLen1) {
          var s = (e.x * d1.y - e.y * d1.x) / cross;
          return Cartesian2.add(p0, Cartesian2.multiplyByScalar(d0, s, eScratch), eScratch);
        }
        return undefined;
      }
      var aDirectionScratch = new Cartesian2();
      var bDirectionScratch = new Cartesian2();
      function intersectsSide(a1, a2, pArray) {
        var aDirection = Cartesian2.subtract(a2, a1, aDirectionScratch);
        var length = pArray.length;
        for (var i = 0; i < length; i++) {
          var b1 = pArray[i].position;
          var b2 = pArray[CesiumMath.mod(i + 1, length)].position;
          if (Cartesian2.equals(a1, b1) || Cartesian2.equals(a2, b2) || Cartesian2.equals(a1, b2) || Cartesian2.equals(a2, b1)) {
            continue;
          }
          var bDirection = Cartesian2.subtract(b2, b1, bDirectionScratch);
          var intersection = linesIntersection(a1, aDirection, b1, bDirection);
          if (!defined(intersection)) {
            continue;
          }
          if (Cartesian2.equals(intersection, a1) || Cartesian2.equals(intersection, a2) || Cartesian2.equals(intersection, b1) || Cartesian2.equals(intersection, b2)) {
            continue;
          }
          var intX = intersection.x;
          var intY = intersection.y;
          var intersects = isBetween(intX, a1.x, a2.x) && isBetween(intY, a1.y, a2.y) && isBetween(intX, b1.x, b2.x) && isBetween(intY, b1.y, b2.y);
          if (intersects) {
            return true;
          }
        }
        return false;
      }
      var CLEAN_CUT = -1;
      var INVALID_CUT = -2;
      function cleanCut(a1i, a2i, pArray) {
        var internalCut12 = internalCut(a1i, a2i, pArray);
        if (internalCut12 >= 0) {
          return internalCut12;
        }
        var internalCut21 = internalCut(a2i, a1i, pArray);
        if (internalCut21 >= 0) {
          return internalCut21;
        }
        if (internalCut12 === INTERNAL && internalCut21 === INTERNAL && !intersectsSide(pArray[a1i].position, pArray[a2i].position, pArray) && !Cartesian2.equals(pArray[a1i].position, pArray[a2i].position)) {
          return CLEAN_CUT;
        }
        return INVALID_CUT;
      }
      function triangleInLine(pArray) {
        return indexedEdgeCrossZ(1, 2, 0, pArray) === 0.0;
      }
      function randomChop(nodeArray) {
        var numVertices = nodeArray.length;
        if (numVertices === 3) {
          if (!triangleInLine(nodeArray)) {
            return [nodeArray[0].index, nodeArray[1].index, nodeArray[2].index];
          }
          return [];
        } else if (nodeArray.length < 3) {
          throw new DeveloperError('Invalid polygon: must have at least three vertices.');
        }
        var tries = 0;
        var maxTries = nodeArray.length * 10;
        var cutResult = INVALID_CUT;
        var index1;
        var index2;
        while (cutResult < CLEAN_CUT && tries++ < maxTries) {
          index1 = getRandomIndex(nodeArray.length);
          index2 = index1 + 1;
          while (Math.abs(index1 - index2) < 2 || Math.abs(index1 - index2) > nodeArray.length - 2) {
            index2 = getRandomIndex(nodeArray.length);
          }
          if (index1 > index2) {
            var index = index1;
            index1 = index2;
            index2 = index;
          }
          cutResult = cleanCut(index1, index2, nodeArray);
        }
        if (cutResult === CLEAN_CUT) {
          var nodeArray2 = nodeArray.splice(index1, (index2 - index1 + 1), nodeArray[index1], nodeArray[index2]);
          return randomChop(nodeArray).concat(randomChop(nodeArray2));
        } else if (cutResult >= 0) {
          nodeArray.splice(cutResult, 1);
          return randomChop(nodeArray);
        }
        return [];
      }
      var scaleToGeodeticHeightN = new Cartesian3();
      var scaleToGeodeticHeightP = new Cartesian3();
      var PolygonPipeline = {};
      PolygonPipeline.removeDuplicates = function(positions) {
        if (!defined(positions)) {
          throw new DeveloperError('positions is required.');
        }
        var cleanedPositions = PolylinePipeline.removeDuplicates(positions);
        if (Cartesian3.equals(cleanedPositions[0], cleanedPositions[cleanedPositions.length - 1])) {
          return cleanedPositions.slice(1);
        }
        return cleanedPositions;
      };
      PolygonPipeline.computeArea2D = function(positions) {
        if (!defined(positions)) {
          throw new DeveloperError('positions is required.');
        }
        if (positions.length < 3) {
          throw new DeveloperError('At least three positions are required.');
        }
        var length = positions.length;
        var area = 0.0;
        for (var i0 = length - 1,
            i1 = 0; i1 < length; i0 = i1++) {
          var v0 = positions[i0];
          var v1 = positions[i1];
          area += (v0.x * v1.y) - (v1.x * v0.y);
        }
        return area * 0.5;
      };
      PolygonPipeline.computeWindingOrder2D = function(positions) {
        var area = PolygonPipeline.computeArea2D(positions);
        return (area > 0.0) ? WindingOrder.COUNTER_CLOCKWISE : WindingOrder.CLOCKWISE;
      };
      PolygonPipeline.triangulate = function(positions) {
        if (!defined(positions)) {
          throw new DeveloperError('positions is required.');
        }
        if (positions.length < 3) {
          throw new DeveloperError('At least three positions are required.');
        }
        var length = positions.length;
        var nodeArray = [];
        for (var i = 0; i < length; ++i) {
          nodeArray[i] = {
            position: positions[i],
            index: i
          };
        }
        return randomChop(nodeArray);
      };
      var subdivisionV0Scratch = new Cartesian3();
      var subdivisionV1Scratch = new Cartesian3();
      var subdivisionV2Scratch = new Cartesian3();
      var subdivisionS0Scratch = new Cartesian3();
      var subdivisionS1Scratch = new Cartesian3();
      var subdivisionS2Scratch = new Cartesian3();
      var subdivisionMidScratch = new Cartesian3();
      PolygonPipeline.computeSubdivision = function(ellipsoid, positions, indices, granularity) {
        granularity = defaultValue(granularity, CesiumMath.RADIANS_PER_DEGREE);
        if (!defined(ellipsoid)) {
          throw new DeveloperError('ellipsoid is required.');
        }
        if (!defined(positions)) {
          throw new DeveloperError('positions is required.');
        }
        if (!defined(indices)) {
          throw new DeveloperError('indices is required.');
        }
        if (indices.length < 3) {
          throw new DeveloperError('At least three indices are required.');
        }
        if (indices.length % 3 !== 0) {
          throw new DeveloperError('The number of indices must be divisable by three.');
        }
        if (granularity <= 0.0) {
          throw new DeveloperError('granularity must be greater than zero.');
        }
        var triangles = indices.slice(0);
        var i;
        var length = positions.length;
        var subdividedPositions = new Array(length * 3);
        var q = 0;
        for (i = 0; i < length; i++) {
          var item = positions[i];
          subdividedPositions[q++] = item.x;
          subdividedPositions[q++] = item.y;
          subdividedPositions[q++] = item.z;
        }
        var subdividedIndices = [];
        var edges = {};
        var radius = ellipsoid.maximumRadius;
        var minDistance = CesiumMath.chordLength(granularity, radius);
        var minDistanceSqrd = minDistance * minDistance;
        while (triangles.length > 0) {
          var i2 = triangles.pop();
          var i1 = triangles.pop();
          var i0 = triangles.pop();
          var v0 = Cartesian3.fromArray(subdividedPositions, i0 * 3, subdivisionV0Scratch);
          var v1 = Cartesian3.fromArray(subdividedPositions, i1 * 3, subdivisionV1Scratch);
          var v2 = Cartesian3.fromArray(subdividedPositions, i2 * 3, subdivisionV2Scratch);
          var s0 = Cartesian3.multiplyByScalar(Cartesian3.normalize(v0, subdivisionS0Scratch), radius, subdivisionS0Scratch);
          var s1 = Cartesian3.multiplyByScalar(Cartesian3.normalize(v1, subdivisionS1Scratch), radius, subdivisionS1Scratch);
          var s2 = Cartesian3.multiplyByScalar(Cartesian3.normalize(v2, subdivisionS2Scratch), radius, subdivisionS2Scratch);
          var g0 = Cartesian3.magnitudeSquared(Cartesian3.subtract(s0, s1, subdivisionMidScratch));
          var g1 = Cartesian3.magnitudeSquared(Cartesian3.subtract(s1, s2, subdivisionMidScratch));
          var g2 = Cartesian3.magnitudeSquared(Cartesian3.subtract(s2, s0, subdivisionMidScratch));
          var max = Math.max(g0, g1, g2);
          var edge;
          var mid;
          if (max > minDistanceSqrd) {
            if (g0 === max) {
              edge = Math.min(i0, i1) + ' ' + Math.max(i0, i1);
              i = edges[edge];
              if (!defined(i)) {
                mid = Cartesian3.add(v0, v1, subdivisionMidScratch);
                Cartesian3.multiplyByScalar(mid, 0.5, mid);
                subdividedPositions.push(mid.x, mid.y, mid.z);
                i = subdividedPositions.length / 3 - 1;
                edges[edge] = i;
              }
              triangles.push(i0, i, i2);
              triangles.push(i, i1, i2);
            } else if (g1 === max) {
              edge = Math.min(i1, i2) + ' ' + Math.max(i1, i2);
              i = edges[edge];
              if (!defined(i)) {
                mid = Cartesian3.add(v1, v2, subdivisionMidScratch);
                Cartesian3.multiplyByScalar(mid, 0.5, mid);
                subdividedPositions.push(mid.x, mid.y, mid.z);
                i = subdividedPositions.length / 3 - 1;
                edges[edge] = i;
              }
              triangles.push(i1, i, i0);
              triangles.push(i, i2, i0);
            } else if (g2 === max) {
              edge = Math.min(i2, i0) + ' ' + Math.max(i2, i0);
              i = edges[edge];
              if (!defined(i)) {
                mid = Cartesian3.add(v2, v0, subdivisionMidScratch);
                Cartesian3.multiplyByScalar(mid, 0.5, mid);
                subdividedPositions.push(mid.x, mid.y, mid.z);
                i = subdividedPositions.length / 3 - 1;
                edges[edge] = i;
              }
              triangles.push(i2, i, i1);
              triangles.push(i, i0, i1);
            }
          } else {
            subdividedIndices.push(i0);
            subdividedIndices.push(i1);
            subdividedIndices.push(i2);
          }
        }
        return new Geometry({
          attributes: {position: new GeometryAttribute({
              componentDatatype: ComponentDatatype.DOUBLE,
              componentsPerAttribute: 3,
              values: subdividedPositions
            })},
          indices: subdividedIndices,
          primitiveType: PrimitiveType.TRIANGLES
        });
      };
      PolygonPipeline.scaleToGeodeticHeight = function(positions, height, ellipsoid, scaleToSurface) {
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        var n = scaleToGeodeticHeightN;
        var p = scaleToGeodeticHeightP;
        height = defaultValue(height, 0.0);
        scaleToSurface = defaultValue(scaleToSurface, true);
        if (defined(positions)) {
          var length = positions.length;
          for (var i = 0; i < length; i += 3) {
            Cartesian3.fromArray(positions, i, p);
            if (scaleToSurface) {
              p = ellipsoid.scaleToGeodeticSurface(p, p);
            }
            if (height !== 0) {
              n = ellipsoid.geodeticSurfaceNormal(p, n);
              Cartesian3.multiplyByScalar(n, height, n);
              Cartesian3.add(p, n, p);
            }
            positions[i] = p.x;
            positions[i + 1] = p.y;
            positions[i + 2] = p.z;
          }
        }
        return positions;
      };
      PolygonPipeline.eliminateHoles = function(outerRing, innerRings, ellipsoid) {
        if (!defined(outerRing)) {
          throw new DeveloperError('outerRing is required.');
        }
        if (outerRing.length === 0) {
          throw new DeveloperError('outerRing must not be empty.');
        }
        if (!defined(innerRings)) {
          throw new DeveloperError('innerRings is required.');
        }
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        var innerRingsCopy = [];
        for (var i = 0; i < innerRings.length; i++) {
          var innerRing = [];
          for (var j = 0; j < innerRings[i].length; j++) {
            innerRing.push(Cartesian3.clone(innerRings[i][j]));
          }
          innerRingsCopy.push(innerRing);
        }
        var newPolygonVertices = outerRing;
        while (innerRingsCopy.length > 0) {
          newPolygonVertices = eliminateHole(newPolygonVertices, innerRingsCopy, ellipsoid);
        }
        return newPolygonVertices;
      };
      return PolygonPipeline;
    });
    define('Core/CorridorOutlineGeometry', ['./BoundingSphere', './Cartesian3', './ComponentDatatype', './CornerType', './CorridorGeometryLibrary', './defaultValue', './defined', './DeveloperError', './Ellipsoid', './Geometry', './GeometryAttribute', './GeometryAttributes', './IndexDatatype', './Math', './PolylinePipeline', './PolygonPipeline', './PrimitiveType'], function(BoundingSphere, Cartesian3, ComponentDatatype, CornerType, CorridorGeometryLibrary, defaultValue, defined, DeveloperError, Ellipsoid, Geometry, GeometryAttribute, GeometryAttributes, IndexDatatype, CesiumMath, PolylinePipeline, PolygonPipeline, PrimitiveType) {
      'use strict';
      var cartesian1 = new Cartesian3();
      var cartesian2 = new Cartesian3();
      var cartesian3 = new Cartesian3();
      function combine(computedPositions, cornerType) {
        var wallIndices = [];
        var positions = computedPositions.positions;
        var corners = computedPositions.corners;
        var endPositions = computedPositions.endPositions;
        var attributes = new GeometryAttributes();
        var corner;
        var leftCount = 0;
        var rightCount = 0;
        var i;
        var indicesLength = 0;
        var length;
        for (i = 0; i < positions.length; i += 2) {
          length = positions[i].length - 3;
          leftCount += length;
          indicesLength += length / 3 * 4;
          rightCount += positions[i + 1].length - 3;
        }
        leftCount += 3;
        rightCount += 3;
        for (i = 0; i < corners.length; i++) {
          corner = corners[i];
          var leftSide = corners[i].leftPositions;
          if (defined(leftSide)) {
            length = leftSide.length;
            leftCount += length;
            indicesLength += length / 3 * 2;
          } else {
            length = corners[i].rightPositions.length;
            rightCount += length;
            indicesLength += length / 3 * 2;
          }
        }
        var addEndPositions = defined(endPositions);
        var endPositionLength;
        if (addEndPositions) {
          endPositionLength = endPositions[0].length - 3;
          leftCount += endPositionLength;
          rightCount += endPositionLength;
          endPositionLength /= 3;
          indicesLength += endPositionLength * 4;
        }
        var size = leftCount + rightCount;
        var finalPositions = new Float64Array(size);
        var front = 0;
        var back = size - 1;
        var UL,
            LL,
            UR,
            LR;
        var rightPos,
            leftPos;
        var halfLength = endPositionLength / 2;
        var indices = IndexDatatype.createTypedArray(size / 3, indicesLength + 4);
        var index = 0;
        indices[index++] = front / 3;
        indices[index++] = (back - 2) / 3;
        if (addEndPositions) {
          wallIndices.push(front / 3);
          leftPos = cartesian1;
          rightPos = cartesian2;
          var firstEndPositions = endPositions[0];
          for (i = 0; i < halfLength; i++) {
            leftPos = Cartesian3.fromArray(firstEndPositions, (halfLength - 1 - i) * 3, leftPos);
            rightPos = Cartesian3.fromArray(firstEndPositions, (halfLength + i) * 3, rightPos);
            CorridorGeometryLibrary.addAttribute(finalPositions, rightPos, front);
            CorridorGeometryLibrary.addAttribute(finalPositions, leftPos, undefined, back);
            LL = front / 3;
            LR = LL + 1;
            UL = (back - 2) / 3;
            UR = UL - 1;
            indices[index++] = UL;
            indices[index++] = UR;
            indices[index++] = LL;
            indices[index++] = LR;
            front += 3;
            back -= 3;
          }
        }
        var posIndex = 0;
        var rightEdge = positions[posIndex++];
        var leftEdge = positions[posIndex++];
        finalPositions.set(rightEdge, front);
        finalPositions.set(leftEdge, back - leftEdge.length + 1);
        length = leftEdge.length - 3;
        wallIndices.push(front / 3, (back - 2) / 3);
        for (i = 0; i < length; i += 3) {
          LL = front / 3;
          LR = LL + 1;
          UL = (back - 2) / 3;
          UR = UL - 1;
          indices[index++] = UL;
          indices[index++] = UR;
          indices[index++] = LL;
          indices[index++] = LR;
          front += 3;
          back -= 3;
        }
        for (i = 0; i < corners.length; i++) {
          var j;
          corner = corners[i];
          var l = corner.leftPositions;
          var r = corner.rightPositions;
          var start;
          var outsidePoint = cartesian3;
          if (defined(l)) {
            back -= 3;
            start = UR;
            wallIndices.push(LR);
            for (j = 0; j < l.length / 3; j++) {
              outsidePoint = Cartesian3.fromArray(l, j * 3, outsidePoint);
              indices[index++] = start - j - 1;
              indices[index++] = start - j;
              CorridorGeometryLibrary.addAttribute(finalPositions, outsidePoint, undefined, back);
              back -= 3;
            }
            wallIndices.push(start - Math.floor(l.length / 6));
            if (cornerType === CornerType.BEVELED) {
              wallIndices.push((back - 2) / 3 + 1);
            }
            front += 3;
          } else {
            front += 3;
            start = LR;
            wallIndices.push(UR);
            for (j = 0; j < r.length / 3; j++) {
              outsidePoint = Cartesian3.fromArray(r, j * 3, outsidePoint);
              indices[index++] = start + j;
              indices[index++] = start + j + 1;
              CorridorGeometryLibrary.addAttribute(finalPositions, outsidePoint, front);
              front += 3;
            }
            wallIndices.push(start + Math.floor(r.length / 6));
            if (cornerType === CornerType.BEVELED) {
              wallIndices.push(front / 3 - 1);
            }
            back -= 3;
          }
          rightEdge = positions[posIndex++];
          leftEdge = positions[posIndex++];
          rightEdge.splice(0, 3);
          leftEdge.splice(leftEdge.length - 3, 3);
          finalPositions.set(rightEdge, front);
          finalPositions.set(leftEdge, back - leftEdge.length + 1);
          length = leftEdge.length - 3;
          for (j = 0; j < leftEdge.length; j += 3) {
            LR = front / 3;
            LL = LR - 1;
            UR = (back - 2) / 3;
            UL = UR + 1;
            indices[index++] = UL;
            indices[index++] = UR;
            indices[index++] = LL;
            indices[index++] = LR;
            front += 3;
            back -= 3;
          }
          front -= 3;
          back += 3;
          wallIndices.push(front / 3, (back - 2) / 3);
        }
        if (addEndPositions) {
          front += 3;
          back -= 3;
          leftPos = cartesian1;
          rightPos = cartesian2;
          var lastEndPositions = endPositions[1];
          for (i = 0; i < halfLength; i++) {
            leftPos = Cartesian3.fromArray(lastEndPositions, (endPositionLength - i - 1) * 3, leftPos);
            rightPos = Cartesian3.fromArray(lastEndPositions, i * 3, rightPos);
            CorridorGeometryLibrary.addAttribute(finalPositions, leftPos, undefined, back);
            CorridorGeometryLibrary.addAttribute(finalPositions, rightPos, front);
            LR = front / 3;
            LL = LR - 1;
            UR = (back - 2) / 3;
            UL = UR + 1;
            indices[index++] = UL;
            indices[index++] = UR;
            indices[index++] = LL;
            indices[index++] = LR;
            front += 3;
            back -= 3;
          }
          wallIndices.push(front / 3);
        } else {
          wallIndices.push(front / 3, (back - 2) / 3);
        }
        indices[index++] = front / 3;
        indices[index++] = (back - 2) / 3;
        attributes.position = new GeometryAttribute({
          componentDatatype: ComponentDatatype.DOUBLE,
          componentsPerAttribute: 3,
          values: finalPositions
        });
        return {
          attributes: attributes,
          indices: indices,
          wallIndices: wallIndices
        };
      }
      function computePositionsExtruded(params) {
        var ellipsoid = params.ellipsoid;
        var computedPositions = CorridorGeometryLibrary.computePositions(params);
        var attr = combine(computedPositions, params.cornerType);
        var wallIndices = attr.wallIndices;
        var height = params.height;
        var extrudedHeight = params.extrudedHeight;
        var attributes = attr.attributes;
        var indices = attr.indices;
        var positions = attributes.position.values;
        var length = positions.length;
        var extrudedPositions = new Float64Array(length);
        extrudedPositions.set(positions);
        var newPositions = new Float64Array(length * 2);
        positions = PolygonPipeline.scaleToGeodeticHeight(positions, height, ellipsoid);
        extrudedPositions = PolygonPipeline.scaleToGeodeticHeight(extrudedPositions, extrudedHeight, ellipsoid);
        newPositions.set(positions);
        newPositions.set(extrudedPositions, length);
        attributes.position.values = newPositions;
        length /= 3;
        var i;
        var iLength = indices.length;
        var newIndices = IndexDatatype.createTypedArray(newPositions.length / 3, (iLength + wallIndices.length) * 2);
        newIndices.set(indices);
        var index = iLength;
        for (i = 0; i < iLength; i += 2) {
          var v0 = indices[i];
          var v1 = indices[i + 1];
          newIndices[index++] = v0 + length;
          newIndices[index++] = v1 + length;
        }
        var UL,
            LL;
        for (i = 0; i < wallIndices.length; i++) {
          UL = wallIndices[i];
          LL = UL + length;
          newIndices[index++] = UL;
          newIndices[index++] = LL;
        }
        return {
          attributes: attributes,
          indices: newIndices
        };
      }
      function CorridorOutlineGeometry(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var positions = options.positions;
        var width = options.width;
        if (!defined(positions)) {
          throw new DeveloperError('options.positions is required.');
        }
        if (!defined(width)) {
          throw new DeveloperError('options.width is required.');
        }
        this._positions = positions;
        this._ellipsoid = Ellipsoid.clone(defaultValue(options.ellipsoid, Ellipsoid.WGS84));
        this._width = width;
        this._height = defaultValue(options.height, 0);
        this._extrudedHeight = defaultValue(options.extrudedHeight, this._height);
        this._cornerType = defaultValue(options.cornerType, CornerType.ROUNDED);
        this._granularity = defaultValue(options.granularity, CesiumMath.RADIANS_PER_DEGREE);
        this._workerName = 'createCorridorOutlineGeometry';
        this.packedLength = 1 + positions.length * Cartesian3.packedLength + Ellipsoid.packedLength + 5;
      }
      CorridorOutlineGeometry.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        var positions = value._positions;
        var length = positions.length;
        array[startingIndex++] = length;
        for (var i = 0; i < length; ++i, startingIndex += Cartesian3.packedLength) {
          Cartesian3.pack(positions[i], array, startingIndex);
        }
        Ellipsoid.pack(value._ellipsoid, array, startingIndex);
        startingIndex += Ellipsoid.packedLength;
        array[startingIndex++] = value._width;
        array[startingIndex++] = value._height;
        array[startingIndex++] = value._extrudedHeight;
        array[startingIndex++] = value._cornerType;
        array[startingIndex] = value._granularity;
      };
      var scratchEllipsoid = Ellipsoid.clone(Ellipsoid.UNIT_SPHERE);
      var scratchOptions = {
        positions: undefined,
        ellipsoid: scratchEllipsoid,
        width: undefined,
        height: undefined,
        extrudedHeight: undefined,
        cornerType: undefined,
        granularity: undefined
      };
      CorridorOutlineGeometry.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        var length = array[startingIndex++];
        var positions = new Array(length);
        for (var i = 0; i < length; ++i, startingIndex += Cartesian3.packedLength) {
          positions[i] = Cartesian3.unpack(array, startingIndex);
        }
        var ellipsoid = Ellipsoid.unpack(array, startingIndex, scratchEllipsoid);
        startingIndex += Ellipsoid.packedLength;
        var width = array[startingIndex++];
        var height = array[startingIndex++];
        var extrudedHeight = array[startingIndex++];
        var cornerType = array[startingIndex++];
        var granularity = array[startingIndex];
        if (!defined(result)) {
          scratchOptions.positions = positions;
          scratchOptions.width = width;
          scratchOptions.height = height;
          scratchOptions.extrudedHeight = extrudedHeight;
          scratchOptions.cornerType = cornerType;
          scratchOptions.granularity = granularity;
          return new CorridorOutlineGeometry(scratchOptions);
        }
        result._positions = positions;
        result._ellipsoid = Ellipsoid.clone(ellipsoid, result._ellipsoid);
        result._width = width;
        result._height = height;
        result._extrudedHeight = extrudedHeight;
        result._cornerType = cornerType;
        result._granularity = granularity;
        return result;
      };
      CorridorOutlineGeometry.createGeometry = function(corridorOutlineGeometry) {
        var positions = corridorOutlineGeometry._positions;
        var height = corridorOutlineGeometry._height;
        var width = corridorOutlineGeometry._width;
        var extrudedHeight = corridorOutlineGeometry._extrudedHeight;
        var extrude = (height !== extrudedHeight);
        var cleanPositions = PolylinePipeline.removeDuplicates(positions);
        if ((cleanPositions.length < 2) || (width <= 0)) {
          return;
        }
        var ellipsoid = corridorOutlineGeometry._ellipsoid;
        var params = {
          ellipsoid: ellipsoid,
          positions: cleanPositions,
          width: width,
          cornerType: corridorOutlineGeometry._cornerType,
          granularity: corridorOutlineGeometry._granularity,
          saveAttributes: false
        };
        var attr;
        if (extrude) {
          var h = Math.max(height, extrudedHeight);
          extrudedHeight = Math.min(height, extrudedHeight);
          height = h;
          params.height = height;
          params.extrudedHeight = extrudedHeight;
          attr = computePositionsExtruded(params);
        } else {
          var computedPositions = CorridorGeometryLibrary.computePositions(params);
          attr = combine(computedPositions, params.cornerType);
          attr.attributes.position.values = PolygonPipeline.scaleToGeodeticHeight(attr.attributes.position.values, height, ellipsoid);
        }
        var attributes = attr.attributes;
        var boundingSphere = BoundingSphere.fromVertices(attributes.position.values, undefined, 3);
        return new Geometry({
          attributes: attributes,
          indices: attr.indices,
          primitiveType: PrimitiveType.LINES,
          boundingSphere: boundingSphere
        });
      };
      return CorridorOutlineGeometry;
    });
    define('Workers/createCorridorOutlineGeometry', ['../Core/CorridorOutlineGeometry', '../Core/defined', '../Core/Ellipsoid'], function(CorridorOutlineGeometry, defined, Ellipsoid) {
      'use strict';
      function createCorridorOutlineGeometry(corridorOutlineGeometry, offset) {
        if (defined(offset)) {
          corridorOutlineGeometry = CorridorOutlineGeometry.unpack(corridorOutlineGeometry, offset);
        }
        corridorOutlineGeometry._ellipsoid = Ellipsoid.clone(corridorOutlineGeometry._ellipsoid);
        return CorridorOutlineGeometry.createGeometry(corridorOutlineGeometry);
      }
      return createCorridorOutlineGeometry;
    });
  }());
})(require('process'));
