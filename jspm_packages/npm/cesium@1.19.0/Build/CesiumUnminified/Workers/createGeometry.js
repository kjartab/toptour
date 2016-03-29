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
    define('Core/Color', ['./defaultValue', './defined', './DeveloperError', './FeatureDetection', './freezeObject', './Math'], function(defaultValue, defined, DeveloperError, FeatureDetection, freezeObject, CesiumMath) {
      'use strict';
      function hue2rgb(m1, m2, h) {
        if (h < 0) {
          h += 1;
        }
        if (h > 1) {
          h -= 1;
        }
        if (h * 6 < 1) {
          return m1 + (m2 - m1) * 6 * h;
        }
        if (h * 2 < 1) {
          return m2;
        }
        if (h * 3 < 2) {
          return m1 + (m2 - m1) * (2 / 3 - h) * 6;
        }
        return m1;
      }
      function Color(red, green, blue, alpha) {
        this.red = defaultValue(red, 1.0);
        this.green = defaultValue(green, 1.0);
        this.blue = defaultValue(blue, 1.0);
        this.alpha = defaultValue(alpha, 1.0);
      }
      Color.fromCartesian4 = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          return new Color(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
        }
        result.red = cartesian.x;
        result.green = cartesian.y;
        result.blue = cartesian.z;
        result.alpha = cartesian.w;
        return result;
      };
      Color.fromBytes = function(red, green, blue, alpha, result) {
        red = Color.byteToFloat(defaultValue(red, 255.0));
        green = Color.byteToFloat(defaultValue(green, 255.0));
        blue = Color.byteToFloat(defaultValue(blue, 255.0));
        alpha = Color.byteToFloat(defaultValue(alpha, 255.0));
        if (!defined(result)) {
          return new Color(red, green, blue, alpha);
        }
        result.red = red;
        result.green = green;
        result.blue = blue;
        result.alpha = alpha;
        return result;
      };
      Color.fromAlpha = function(color, alpha, result) {
        if (!defined(color)) {
          throw new DeveloperError('color is required');
        }
        if (!defined(alpha)) {
          throw new DeveloperError('alpha is required');
        }
        if (!defined(result)) {
          return new Color(color.red, color.green, color.blue, alpha);
        }
        result.red = color.red;
        result.green = color.green;
        result.blue = color.blue;
        result.alpha = alpha;
        return result;
      };
      var scratchArrayBuffer;
      var scratchUint32Array;
      var scratchUint8Array;
      if (FeatureDetection.supportsTypedArrays()) {
        scratchArrayBuffer = new ArrayBuffer(4);
        scratchUint32Array = new Uint32Array(scratchArrayBuffer);
        scratchUint8Array = new Uint8Array(scratchArrayBuffer);
      }
      Color.fromRgba = function(rgba) {
        scratchUint32Array[0] = rgba;
        return Color.fromBytes(scratchUint8Array[0], scratchUint8Array[1], scratchUint8Array[2], scratchUint8Array[3]);
      };
      Color.fromHsl = function(hue, saturation, lightness, alpha) {
        hue = defaultValue(hue, 0.0) % 1.0;
        saturation = defaultValue(saturation, 0.0);
        lightness = defaultValue(lightness, 0.0);
        alpha = defaultValue(alpha, 1.0);
        var red = lightness;
        var green = lightness;
        var blue = lightness;
        if (saturation !== 0) {
          var m2;
          if (lightness < 0.5) {
            m2 = lightness * (1 + saturation);
          } else {
            m2 = lightness + saturation - lightness * saturation;
          }
          var m1 = 2.0 * lightness - m2;
          red = hue2rgb(m1, m2, hue + 1 / 3);
          green = hue2rgb(m1, m2, hue);
          blue = hue2rgb(m1, m2, hue - 1 / 3);
        }
        return new Color(red, green, blue, alpha);
      };
      Color.fromRandom = function(options, result) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var red = options.red;
        if (!defined(red)) {
          var minimumRed = defaultValue(options.minimumRed, 0);
          var maximumRed = defaultValue(options.maximumRed, 1.0);
          if (minimumRed > maximumRed) {
            throw new DeveloperError("minimumRed must be less than or equal to maximumRed");
          }
          red = minimumRed + (CesiumMath.nextRandomNumber() * (maximumRed - minimumRed));
        }
        var green = options.green;
        if (!defined(green)) {
          var minimumGreen = defaultValue(options.minimumGreen, 0);
          var maximumGreen = defaultValue(options.maximumGreen, 1.0);
          if (minimumGreen > maximumGreen) {
            throw new DeveloperError("minimumGreen must be less than or equal to maximumGreen");
          }
          green = minimumGreen + (CesiumMath.nextRandomNumber() * (maximumGreen - minimumGreen));
        }
        var blue = options.blue;
        if (!defined(blue)) {
          var minimumBlue = defaultValue(options.minimumBlue, 0);
          var maximumBlue = defaultValue(options.maximumBlue, 1.0);
          if (minimumBlue > maximumBlue) {
            throw new DeveloperError("minimumBlue must be less than or equal to maximumBlue");
          }
          blue = minimumBlue + (CesiumMath.nextRandomNumber() * (maximumBlue - minimumBlue));
        }
        var alpha = options.alpha;
        if (!defined(alpha)) {
          var minimumAlpha = defaultValue(options.minimumAlpha, 0);
          var maximumAlpha = defaultValue(options.maximumAlpha, 1.0);
          if (minimumAlpha > maximumAlpha) {
            throw new DeveloperError("minimumAlpha must be less than or equal to maximumAlpha");
          }
          alpha = minimumAlpha + (CesiumMath.nextRandomNumber() * (maximumAlpha - minimumAlpha));
        }
        if (!defined(result)) {
          return new Color(red, green, blue, alpha);
        }
        result.red = red;
        result.green = green;
        result.blue = blue;
        result.alpha = alpha;
        return result;
      };
      var rgbMatcher = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
      var rrggbbMatcher = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
      var rgbParenthesesMatcher = /^rgba?\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)(?:\s*,\s*([0-9.]+))?\s*\)$/i;
      var hslParenthesesMatcher = /^hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+%)\s*,\s*([0-9.]+%)(?:\s*,\s*([0-9.]+))?\s*\)$/i;
      Color.fromCssColorString = function(color) {
        if (!defined(color)) {
          throw new DeveloperError('color is required');
        }
        var namedColor = Color[color.toUpperCase()];
        if (defined(namedColor)) {
          return Color.clone(namedColor);
        }
        var matches = rgbMatcher.exec(color);
        if (matches !== null) {
          return new Color(parseInt(matches[1], 16) / 15.0, parseInt(matches[2], 16) / 15.0, parseInt(matches[3], 16) / 15.0);
        }
        matches = rrggbbMatcher.exec(color);
        if (matches !== null) {
          return new Color(parseInt(matches[1], 16) / 255.0, parseInt(matches[2], 16) / 255.0, parseInt(matches[3], 16) / 255.0);
        }
        matches = rgbParenthesesMatcher.exec(color);
        if (matches !== null) {
          return new Color(parseFloat(matches[1]) / ('%' === matches[1].substr(-1) ? 100.0 : 255.0), parseFloat(matches[2]) / ('%' === matches[2].substr(-1) ? 100.0 : 255.0), parseFloat(matches[3]) / ('%' === matches[3].substr(-1) ? 100.0 : 255.0), parseFloat(defaultValue(matches[4], '1.0')));
        }
        matches = hslParenthesesMatcher.exec(color);
        if (matches !== null) {
          return Color.fromHsl(parseFloat(matches[1]) / 360.0, parseFloat(matches[2]) / 100.0, parseFloat(matches[3]) / 100.0, parseFloat(defaultValue(matches[4], '1.0')));
        }
        return undefined;
      };
      Color.packedLength = 4;
      Color.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        array[startingIndex++] = value.red;
        array[startingIndex++] = value.green;
        array[startingIndex++] = value.blue;
        array[startingIndex] = value.alpha;
      };
      Color.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
          throw new DeveloperError('array is required');
        }
        startingIndex = defaultValue(startingIndex, 0);
        if (!defined(result)) {
          result = new Color();
        }
        result.red = array[startingIndex++];
        result.green = array[startingIndex++];
        result.blue = array[startingIndex++];
        result.alpha = array[startingIndex];
        return result;
      };
      Color.byteToFloat = function(number) {
        return number / 255.0;
      };
      Color.floatToByte = function(number) {
        return number === 1.0 ? 255.0 : (number * 256.0) | 0;
      };
      Color.clone = function(color, result) {
        if (!defined(color)) {
          return undefined;
        }
        if (!defined(result)) {
          return new Color(color.red, color.green, color.blue, color.alpha);
        }
        result.red = color.red;
        result.green = color.green;
        result.blue = color.blue;
        result.alpha = color.alpha;
        return result;
      };
      Color.equals = function(left, right) {
        return (left === right) || (defined(left) && defined(right) && left.red === right.red && left.green === right.green && left.blue === right.blue && left.alpha === right.alpha);
      };
      Color.equalsArray = function(color, array, offset) {
        return color.red === array[offset] && color.green === array[offset + 1] && color.blue === array[offset + 2] && color.alpha === array[offset + 3];
      };
      Color.prototype.clone = function(result) {
        return Color.clone(this, result);
      };
      Color.prototype.equals = function(other) {
        return Color.equals(this, other);
      };
      Color.prototype.equalsEpsilon = function(other, epsilon) {
        return (this === other) || ((defined(other)) && (Math.abs(this.red - other.red) <= epsilon) && (Math.abs(this.green - other.green) <= epsilon) && (Math.abs(this.blue - other.blue) <= epsilon) && (Math.abs(this.alpha - other.alpha) <= epsilon));
      };
      Color.prototype.toString = function() {
        return '(' + this.red + ', ' + this.green + ', ' + this.blue + ', ' + this.alpha + ')';
      };
      Color.prototype.toCssColorString = function() {
        var red = Color.floatToByte(this.red);
        var green = Color.floatToByte(this.green);
        var blue = Color.floatToByte(this.blue);
        if (this.alpha === 1) {
          return 'rgb(' + red + ',' + green + ',' + blue + ')';
        }
        return 'rgba(' + red + ',' + green + ',' + blue + ',' + this.alpha + ')';
      };
      Color.prototype.toBytes = function(result) {
        var red = Color.floatToByte(this.red);
        var green = Color.floatToByte(this.green);
        var blue = Color.floatToByte(this.blue);
        var alpha = Color.floatToByte(this.alpha);
        if (!defined(result)) {
          return [red, green, blue, alpha];
        }
        result[0] = red;
        result[1] = green;
        result[2] = blue;
        result[3] = alpha;
        return result;
      };
      Color.prototype.toRgba = function() {
        scratchUint8Array[0] = Color.floatToByte(this.red);
        scratchUint8Array[1] = Color.floatToByte(this.green);
        scratchUint8Array[2] = Color.floatToByte(this.blue);
        scratchUint8Array[3] = Color.floatToByte(this.alpha);
        return scratchUint32Array[0];
      };
      Color.prototype.brighten = function(magnitude, result) {
        if (!defined(magnitude)) {
          throw new DeveloperError('magnitude is required.');
        }
        if (magnitude < 0.0) {
          throw new DeveloperError('magnitude must be positive.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        magnitude = (1.0 - magnitude);
        result.red = 1.0 - ((1.0 - this.red) * magnitude);
        result.green = 1.0 - ((1.0 - this.green) * magnitude);
        result.blue = 1.0 - ((1.0 - this.blue) * magnitude);
        result.alpha = this.alpha;
        return result;
      };
      Color.prototype.darken = function(magnitude, result) {
        if (!defined(magnitude)) {
          throw new DeveloperError('magnitude is required.');
        }
        if (magnitude < 0.0) {
          throw new DeveloperError('magnitude must be positive.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        magnitude = (1.0 - magnitude);
        result.red = this.red * magnitude;
        result.green = this.green * magnitude;
        result.blue = this.blue * magnitude;
        result.alpha = this.alpha;
        return result;
      };
      Color.prototype.withAlpha = function(alpha, result) {
        return Color.fromAlpha(this, alpha, result);
      };
      Color.add = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.red = left.red + right.red;
        result.green = left.green + right.green;
        result.blue = left.blue + right.blue;
        result.alpha = left.alpha + right.alpha;
        return result;
      };
      Color.subtract = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.red = left.red - right.red;
        result.green = left.green - right.green;
        result.blue = left.blue - right.blue;
        result.alpha = left.alpha - right.alpha;
        return result;
      };
      Color.multiply = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.red = left.red * right.red;
        result.green = left.green * right.green;
        result.blue = left.blue * right.blue;
        result.alpha = left.alpha * right.alpha;
        return result;
      };
      Color.divide = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.red = left.red / right.red;
        result.green = left.green / right.green;
        result.blue = left.blue / right.blue;
        result.alpha = left.alpha / right.alpha;
        return result;
      };
      Color.mod = function(left, right, result) {
        if (!defined(left)) {
          throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
          throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.red = left.red % right.red;
        result.green = left.green % right.green;
        result.blue = left.blue % right.blue;
        result.alpha = left.alpha % right.alpha;
        return result;
      };
      Color.multiplyByScalar = function(color, scalar, result) {
        if (!defined(color)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.red = color.red * scalar;
        result.green = color.green * scalar;
        result.blue = color.blue * scalar;
        result.alpha = color.alpha * scalar;
        return result;
      };
      Color.divideByScalar = function(color, scalar, result) {
        if (!defined(color)) {
          throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
          throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required');
        }
        result.red = color.red / scalar;
        result.green = color.green / scalar;
        result.blue = color.blue / scalar;
        result.alpha = color.alpha / scalar;
        return result;
      };
      Color.ALICEBLUE = freezeObject(Color.fromCssColorString('#F0F8FF'));
      Color.ANTIQUEWHITE = freezeObject(Color.fromCssColorString('#FAEBD7'));
      Color.AQUA = freezeObject(Color.fromCssColorString('#00FFFF'));
      Color.AQUAMARINE = freezeObject(Color.fromCssColorString('#7FFFD4'));
      Color.AZURE = freezeObject(Color.fromCssColorString('#F0FFFF'));
      Color.BEIGE = freezeObject(Color.fromCssColorString('#F5F5DC'));
      Color.BISQUE = freezeObject(Color.fromCssColorString('#FFE4C4'));
      Color.BLACK = freezeObject(Color.fromCssColorString('#000000'));
      Color.BLANCHEDALMOND = freezeObject(Color.fromCssColorString('#FFEBCD'));
      Color.BLUE = freezeObject(Color.fromCssColorString('#0000FF'));
      Color.BLUEVIOLET = freezeObject(Color.fromCssColorString('#8A2BE2'));
      Color.BROWN = freezeObject(Color.fromCssColorString('#A52A2A'));
      Color.BURLYWOOD = freezeObject(Color.fromCssColorString('#DEB887'));
      Color.CADETBLUE = freezeObject(Color.fromCssColorString('#5F9EA0'));
      Color.CHARTREUSE = freezeObject(Color.fromCssColorString('#7FFF00'));
      Color.CHOCOLATE = freezeObject(Color.fromCssColorString('#D2691E'));
      Color.CORAL = freezeObject(Color.fromCssColorString('#FF7F50'));
      Color.CORNFLOWERBLUE = freezeObject(Color.fromCssColorString('#6495ED'));
      Color.CORNSILK = freezeObject(Color.fromCssColorString('#FFF8DC'));
      Color.CRIMSON = freezeObject(Color.fromCssColorString('#DC143C'));
      Color.CYAN = freezeObject(Color.fromCssColorString('#00FFFF'));
      Color.DARKBLUE = freezeObject(Color.fromCssColorString('#00008B'));
      Color.DARKCYAN = freezeObject(Color.fromCssColorString('#008B8B'));
      Color.DARKGOLDENROD = freezeObject(Color.fromCssColorString('#B8860B'));
      Color.DARKGRAY = freezeObject(Color.fromCssColorString('#A9A9A9'));
      Color.DARKGREEN = freezeObject(Color.fromCssColorString('#006400'));
      Color.DARKGREY = Color.DARKGRAY;
      Color.DARKKHAKI = freezeObject(Color.fromCssColorString('#BDB76B'));
      Color.DARKMAGENTA = freezeObject(Color.fromCssColorString('#8B008B'));
      Color.DARKOLIVEGREEN = freezeObject(Color.fromCssColorString('#556B2F'));
      Color.DARKORANGE = freezeObject(Color.fromCssColorString('#FF8C00'));
      Color.DARKORCHID = freezeObject(Color.fromCssColorString('#9932CC'));
      Color.DARKRED = freezeObject(Color.fromCssColorString('#8B0000'));
      Color.DARKSALMON = freezeObject(Color.fromCssColorString('#E9967A'));
      Color.DARKSEAGREEN = freezeObject(Color.fromCssColorString('#8FBC8F'));
      Color.DARKSLATEBLUE = freezeObject(Color.fromCssColorString('#483D8B'));
      Color.DARKSLATEGRAY = freezeObject(Color.fromCssColorString('#2F4F4F'));
      Color.DARKSLATEGREY = Color.DARKSLATEGRAY;
      Color.DARKTURQUOISE = freezeObject(Color.fromCssColorString('#00CED1'));
      Color.DARKVIOLET = freezeObject(Color.fromCssColorString('#9400D3'));
      Color.DEEPPINK = freezeObject(Color.fromCssColorString('#FF1493'));
      Color.DEEPSKYBLUE = freezeObject(Color.fromCssColorString('#00BFFF'));
      Color.DIMGRAY = freezeObject(Color.fromCssColorString('#696969'));
      Color.DIMGREY = Color.DIMGRAY;
      Color.DODGERBLUE = freezeObject(Color.fromCssColorString('#1E90FF'));
      Color.FIREBRICK = freezeObject(Color.fromCssColorString('#B22222'));
      Color.FLORALWHITE = freezeObject(Color.fromCssColorString('#FFFAF0'));
      Color.FORESTGREEN = freezeObject(Color.fromCssColorString('#228B22'));
      Color.FUSCHIA = freezeObject(Color.fromCssColorString('#FF00FF'));
      Color.GAINSBORO = freezeObject(Color.fromCssColorString('#DCDCDC'));
      Color.GHOSTWHITE = freezeObject(Color.fromCssColorString('#F8F8FF'));
      Color.GOLD = freezeObject(Color.fromCssColorString('#FFD700'));
      Color.GOLDENROD = freezeObject(Color.fromCssColorString('#DAA520'));
      Color.GRAY = freezeObject(Color.fromCssColorString('#808080'));
      Color.GREEN = freezeObject(Color.fromCssColorString('#008000'));
      Color.GREENYELLOW = freezeObject(Color.fromCssColorString('#ADFF2F'));
      Color.GREY = Color.GRAY;
      Color.HONEYDEW = freezeObject(Color.fromCssColorString('#F0FFF0'));
      Color.HOTPINK = freezeObject(Color.fromCssColorString('#FF69B4'));
      Color.INDIANRED = freezeObject(Color.fromCssColorString('#CD5C5C'));
      Color.INDIGO = freezeObject(Color.fromCssColorString('#4B0082'));
      Color.IVORY = freezeObject(Color.fromCssColorString('#FFFFF0'));
      Color.KHAKI = freezeObject(Color.fromCssColorString('#F0E68C'));
      Color.LAVENDER = freezeObject(Color.fromCssColorString('#E6E6FA'));
      Color.LAVENDAR_BLUSH = freezeObject(Color.fromCssColorString('#FFF0F5'));
      Color.LAWNGREEN = freezeObject(Color.fromCssColorString('#7CFC00'));
      Color.LEMONCHIFFON = freezeObject(Color.fromCssColorString('#FFFACD'));
      Color.LIGHTBLUE = freezeObject(Color.fromCssColorString('#ADD8E6'));
      Color.LIGHTCORAL = freezeObject(Color.fromCssColorString('#F08080'));
      Color.LIGHTCYAN = freezeObject(Color.fromCssColorString('#E0FFFF'));
      Color.LIGHTGOLDENRODYELLOW = freezeObject(Color.fromCssColorString('#FAFAD2'));
      Color.LIGHTGRAY = freezeObject(Color.fromCssColorString('#D3D3D3'));
      Color.LIGHTGREEN = freezeObject(Color.fromCssColorString('#90EE90'));
      Color.LIGHTGREY = Color.LIGHTGRAY;
      Color.LIGHTPINK = freezeObject(Color.fromCssColorString('#FFB6C1'));
      Color.LIGHTSEAGREEN = freezeObject(Color.fromCssColorString('#20B2AA'));
      Color.LIGHTSKYBLUE = freezeObject(Color.fromCssColorString('#87CEFA'));
      Color.LIGHTSLATEGRAY = freezeObject(Color.fromCssColorString('#778899'));
      Color.LIGHTSLATEGREY = Color.LIGHTSLATEGRAY;
      Color.LIGHTSTEELBLUE = freezeObject(Color.fromCssColorString('#B0C4DE'));
      Color.LIGHTYELLOW = freezeObject(Color.fromCssColorString('#FFFFE0'));
      Color.LIME = freezeObject(Color.fromCssColorString('#00FF00'));
      Color.LIMEGREEN = freezeObject(Color.fromCssColorString('#32CD32'));
      Color.LINEN = freezeObject(Color.fromCssColorString('#FAF0E6'));
      Color.MAGENTA = freezeObject(Color.fromCssColorString('#FF00FF'));
      Color.MAROON = freezeObject(Color.fromCssColorString('#800000'));
      Color.MEDIUMAQUAMARINE = freezeObject(Color.fromCssColorString('#66CDAA'));
      Color.MEDIUMBLUE = freezeObject(Color.fromCssColorString('#0000CD'));
      Color.MEDIUMORCHID = freezeObject(Color.fromCssColorString('#BA55D3'));
      Color.MEDIUMPURPLE = freezeObject(Color.fromCssColorString('#9370DB'));
      Color.MEDIUMSEAGREEN = freezeObject(Color.fromCssColorString('#3CB371'));
      Color.MEDIUMSLATEBLUE = freezeObject(Color.fromCssColorString('#7B68EE'));
      Color.MEDIUMSPRINGGREEN = freezeObject(Color.fromCssColorString('#00FA9A'));
      Color.MEDIUMTURQUOISE = freezeObject(Color.fromCssColorString('#48D1CC'));
      Color.MEDIUMVIOLETRED = freezeObject(Color.fromCssColorString('#C71585'));
      Color.MIDNIGHTBLUE = freezeObject(Color.fromCssColorString('#191970'));
      Color.MINTCREAM = freezeObject(Color.fromCssColorString('#F5FFFA'));
      Color.MISTYROSE = freezeObject(Color.fromCssColorString('#FFE4E1'));
      Color.MOCCASIN = freezeObject(Color.fromCssColorString('#FFE4B5'));
      Color.NAVAJOWHITE = freezeObject(Color.fromCssColorString('#FFDEAD'));
      Color.NAVY = freezeObject(Color.fromCssColorString('#000080'));
      Color.OLDLACE = freezeObject(Color.fromCssColorString('#FDF5E6'));
      Color.OLIVE = freezeObject(Color.fromCssColorString('#808000'));
      Color.OLIVEDRAB = freezeObject(Color.fromCssColorString('#6B8E23'));
      Color.ORANGE = freezeObject(Color.fromCssColorString('#FFA500'));
      Color.ORANGERED = freezeObject(Color.fromCssColorString('#FF4500'));
      Color.ORCHID = freezeObject(Color.fromCssColorString('#DA70D6'));
      Color.PALEGOLDENROD = freezeObject(Color.fromCssColorString('#EEE8AA'));
      Color.PALEGREEN = freezeObject(Color.fromCssColorString('#98FB98'));
      Color.PALETURQUOISE = freezeObject(Color.fromCssColorString('#AFEEEE'));
      Color.PALEVIOLETRED = freezeObject(Color.fromCssColorString('#DB7093'));
      Color.PAPAYAWHIP = freezeObject(Color.fromCssColorString('#FFEFD5'));
      Color.PEACHPUFF = freezeObject(Color.fromCssColorString('#FFDAB9'));
      Color.PERU = freezeObject(Color.fromCssColorString('#CD853F'));
      Color.PINK = freezeObject(Color.fromCssColorString('#FFC0CB'));
      Color.PLUM = freezeObject(Color.fromCssColorString('#DDA0DD'));
      Color.POWDERBLUE = freezeObject(Color.fromCssColorString('#B0E0E6'));
      Color.PURPLE = freezeObject(Color.fromCssColorString('#800080'));
      Color.RED = freezeObject(Color.fromCssColorString('#FF0000'));
      Color.ROSYBROWN = freezeObject(Color.fromCssColorString('#BC8F8F'));
      Color.ROYALBLUE = freezeObject(Color.fromCssColorString('#4169E1'));
      Color.SADDLEBROWN = freezeObject(Color.fromCssColorString('#8B4513'));
      Color.SALMON = freezeObject(Color.fromCssColorString('#FA8072'));
      Color.SANDYBROWN = freezeObject(Color.fromCssColorString('#F4A460'));
      Color.SEAGREEN = freezeObject(Color.fromCssColorString('#2E8B57'));
      Color.SEASHELL = freezeObject(Color.fromCssColorString('#FFF5EE'));
      Color.SIENNA = freezeObject(Color.fromCssColorString('#A0522D'));
      Color.SILVER = freezeObject(Color.fromCssColorString('#C0C0C0'));
      Color.SKYBLUE = freezeObject(Color.fromCssColorString('#87CEEB'));
      Color.SLATEBLUE = freezeObject(Color.fromCssColorString('#6A5ACD'));
      Color.SLATEGRAY = freezeObject(Color.fromCssColorString('#708090'));
      Color.SLATEGREY = Color.SLATEGRAY;
      Color.SNOW = freezeObject(Color.fromCssColorString('#FFFAFA'));
      Color.SPRINGGREEN = freezeObject(Color.fromCssColorString('#00FF7F'));
      Color.STEELBLUE = freezeObject(Color.fromCssColorString('#4682B4'));
      Color.TAN = freezeObject(Color.fromCssColorString('#D2B48C'));
      Color.TEAL = freezeObject(Color.fromCssColorString('#008080'));
      Color.THISTLE = freezeObject(Color.fromCssColorString('#D8BFD8'));
      Color.TOMATO = freezeObject(Color.fromCssColorString('#FF6347'));
      Color.TURQUOISE = freezeObject(Color.fromCssColorString('#40E0D0'));
      Color.VIOLET = freezeObject(Color.fromCssColorString('#EE82EE'));
      Color.WHEAT = freezeObject(Color.fromCssColorString('#F5DEB3'));
      Color.WHITE = freezeObject(Color.fromCssColorString('#FFFFFF'));
      Color.WHITESMOKE = freezeObject(Color.fromCssColorString('#F5F5F5'));
      Color.YELLOW = freezeObject(Color.fromCssColorString('#FFFF00'));
      Color.YELLOWGREEN = freezeObject(Color.fromCssColorString('#9ACD32'));
      Color.TRANSPARENT = freezeObject(new Color(0, 0, 0, 0));
      return Color;
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
    define('Core/AttributeCompression', ['./Cartesian2', './Cartesian3', './defined', './DeveloperError', './Math'], function(Cartesian2, Cartesian3, defined, DeveloperError, CesiumMath) {
      'use strict';
      var AttributeCompression = {};
      AttributeCompression.octEncode = function(vector, result) {
        if (!defined(vector)) {
          throw new DeveloperError('vector is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var magSquared = Cartesian3.magnitudeSquared(vector);
        if (Math.abs(magSquared - 1.0) > CesiumMath.EPSILON6) {
          throw new DeveloperError('vector must be normalized.');
        }
        result.x = vector.x / (Math.abs(vector.x) + Math.abs(vector.y) + Math.abs(vector.z));
        result.y = vector.y / (Math.abs(vector.x) + Math.abs(vector.y) + Math.abs(vector.z));
        if (vector.z < 0) {
          var x = result.x;
          var y = result.y;
          result.x = (1.0 - Math.abs(y)) * CesiumMath.signNotZero(x);
          result.y = (1.0 - Math.abs(x)) * CesiumMath.signNotZero(y);
        }
        result.x = CesiumMath.toSNorm(result.x);
        result.y = CesiumMath.toSNorm(result.y);
        return result;
      };
      AttributeCompression.octDecode = function(x, y, result) {
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        if (x < 0 || x > 255 || y < 0 || y > 255) {
          throw new DeveloperError('x and y must be a signed normalized integer between 0 and 255');
        }
        result.x = CesiumMath.fromSNorm(x);
        result.y = CesiumMath.fromSNorm(y);
        result.z = 1.0 - (Math.abs(result.x) + Math.abs(result.y));
        if (result.z < 0.0) {
          var oldVX = result.x;
          result.x = (1.0 - Math.abs(result.y)) * CesiumMath.signNotZero(oldVX);
          result.y = (1.0 - Math.abs(oldVX)) * CesiumMath.signNotZero(result.y);
        }
        return Cartesian3.normalize(result, result);
      };
      AttributeCompression.octPackFloat = function(encoded) {
        if (!defined(encoded)) {
          throw new DeveloperError('encoded is required.');
        }
        return 256.0 * encoded.x + encoded.y;
      };
      var scratchEncodeCart2 = new Cartesian2();
      AttributeCompression.octEncodeFloat = function(vector) {
        AttributeCompression.octEncode(vector, scratchEncodeCart2);
        return AttributeCompression.octPackFloat(scratchEncodeCart2);
      };
      AttributeCompression.octDecodeFloat = function(value, result) {
        if (!defined(value)) {
          throw new DeveloperError('value is required.');
        }
        var temp = value / 256.0;
        var x = Math.floor(temp);
        var y = (temp - x) * 256.0;
        return AttributeCompression.octDecode(x, y, result);
      };
      AttributeCompression.octPack = function(v1, v2, v3, result) {
        if (!defined(v1)) {
          throw new DeveloperError('v1 is required.');
        }
        if (!defined(v2)) {
          throw new DeveloperError('v2 is required.');
        }
        if (!defined(v3)) {
          throw new DeveloperError('v3 is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var encoded1 = AttributeCompression.octEncodeFloat(v1);
        var encoded2 = AttributeCompression.octEncodeFloat(v2);
        var encoded3 = AttributeCompression.octEncode(v3, scratchEncodeCart2);
        result.x = 65536.0 * encoded3.x + encoded1;
        result.y = 65536.0 * encoded3.y + encoded2;
        return result;
      };
      AttributeCompression.octUnpack = function(packed, v1, v2, v3) {
        if (!defined(packed)) {
          throw new DeveloperError('packed is required.');
        }
        if (!defined(v1)) {
          throw new DeveloperError('v1 is required.');
        }
        if (!defined(v2)) {
          throw new DeveloperError('v2 is required.');
        }
        if (!defined(v3)) {
          throw new DeveloperError('v3 is required.');
        }
        var temp = packed.x / 65536.0;
        var x = Math.floor(temp);
        var encodedFloat1 = (temp - x) * 65536.0;
        temp = packed.y / 65536.0;
        var y = Math.floor(temp);
        var encodedFloat2 = (temp - y) * 65536.0;
        AttributeCompression.octDecodeFloat(encodedFloat1, v1);
        AttributeCompression.octDecodeFloat(encodedFloat2, v2);
        AttributeCompression.octDecode(x, y, v3);
      };
      AttributeCompression.compressTextureCoordinates = function(textureCoordinates) {
        if (!defined(textureCoordinates)) {
          throw new DeveloperError('textureCoordinates is required.');
        }
        var x = textureCoordinates.x === 1.0 ? 4095.0 : (textureCoordinates.x * 4096.0) | 0;
        var y = textureCoordinates.y === 1.0 ? 4095.0 : (textureCoordinates.y * 4096.0) | 0;
        return 4096.0 * x + y;
      };
      AttributeCompression.decompressTextureCoordinates = function(compressed, result) {
        if (!defined(compressed)) {
          throw new DeveloperError('compressed is required.');
        }
        if (!defined(result)) {
          throw new DeveloperError('result is required.');
        }
        var temp = compressed / 4096.0;
        result.x = Math.floor(temp) / 4096.0;
        result.y = temp - Math.floor(temp);
        return result;
      };
      return AttributeCompression;
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
    define('Core/EncodedCartesian3', ['./Cartesian3', './defined', './DeveloperError'], function(Cartesian3, defined, DeveloperError) {
      'use strict';
      function EncodedCartesian3() {
        this.high = Cartesian3.clone(Cartesian3.ZERO);
        this.low = Cartesian3.clone(Cartesian3.ZERO);
      }
      EncodedCartesian3.encode = function(value, result) {
        if (!defined(value)) {
          throw new DeveloperError('value is required');
        }
        if (!defined(result)) {
          result = {
            high: 0.0,
            low: 0.0
          };
        }
        var doubleHigh;
        if (value >= 0.0) {
          doubleHigh = Math.floor(value / 65536.0) * 65536.0;
          result.high = doubleHigh;
          result.low = value - doubleHigh;
        } else {
          doubleHigh = Math.floor(-value / 65536.0) * 65536.0;
          result.high = -doubleHigh;
          result.low = value + doubleHigh;
        }
        return result;
      };
      var scratchEncode = {
        high: 0.0,
        low: 0.0
      };
      EncodedCartesian3.fromCartesian = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
          result = new EncodedCartesian3();
        }
        var high = result.high;
        var low = result.low;
        EncodedCartesian3.encode(cartesian.x, scratchEncode);
        high.x = scratchEncode.high;
        low.x = scratchEncode.low;
        EncodedCartesian3.encode(cartesian.y, scratchEncode);
        high.y = scratchEncode.high;
        low.y = scratchEncode.low;
        EncodedCartesian3.encode(cartesian.z, scratchEncode);
        high.z = scratchEncode.high;
        low.z = scratchEncode.low;
        return result;
      };
      var encodedP = new EncodedCartesian3();
      EncodedCartesian3.writeElements = function(cartesian, cartesianArray, index) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        if (!defined(cartesianArray)) {
          throw new DeveloperError('cartesianArray is required');
        }
        if (typeof index !== 'number' || index < 0) {
          throw new DeveloperError('index must be a number greater than or equal to 0.');
        }
        EncodedCartesian3.fromCartesian(cartesian, encodedP);
        var high = encodedP.high;
        var low = encodedP.low;
        cartesianArray[index] = high.x;
        cartesianArray[index + 1] = high.y;
        cartesianArray[index + 2] = high.z;
        cartesianArray[index + 3] = low.x;
        cartesianArray[index + 4] = low.y;
        cartesianArray[index + 5] = low.z;
      };
      return EncodedCartesian3;
    });
    define('Core/GeometryInstance', ['./defaultValue', './defined', './DeveloperError', './Matrix4'], function(defaultValue, defined, DeveloperError, Matrix4) {
      'use strict';
      function GeometryInstance(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        if (!defined(options.geometry)) {
          throw new DeveloperError('options.geometry is required.');
        }
        this.geometry = options.geometry;
        this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
        this.id = options.id;
        this.pickPrimitive = options.pickPrimitive;
        this.attributes = defaultValue(options.attributes, {});
        this.westHemisphereGeometry = undefined;
        this.eastHemisphereGeometry = undefined;
      }
      return GeometryInstance;
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
    define('Core/Tipsify', ['./defaultValue', './defined', './DeveloperError'], function(defaultValue, defined, DeveloperError) {
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
    define('Core/GeometryPipeline', ['./AttributeCompression', './barycentricCoordinates', './BoundingSphere', './Cartesian2', './Cartesian3', './Cartesian4', './Cartographic', './ComponentDatatype', './defaultValue', './defined', './DeveloperError', './EncodedCartesian3', './GeographicProjection', './Geometry', './GeometryAttribute', './GeometryInstance', './GeometryType', './IndexDatatype', './Intersect', './IntersectionTests', './Math', './Matrix3', './Matrix4', './Plane', './PrimitiveType', './Tipsify'], function(AttributeCompression, barycentricCoordinates, BoundingSphere, Cartesian2, Cartesian3, Cartesian4, Cartographic, ComponentDatatype, defaultValue, defined, DeveloperError, EncodedCartesian3, GeographicProjection, Geometry, GeometryAttribute, GeometryInstance, GeometryType, IndexDatatype, Intersect, IntersectionTests, CesiumMath, Matrix3, Matrix4, Plane, PrimitiveType, Tipsify) {
      'use strict';
      var GeometryPipeline = {};
      function addTriangle(lines, index, i0, i1, i2) {
        lines[index++] = i0;
        lines[index++] = i1;
        lines[index++] = i1;
        lines[index++] = i2;
        lines[index++] = i2;
        lines[index] = i0;
      }
      function trianglesToLines(triangles) {
        var count = triangles.length;
        var size = (count / 3) * 6;
        var lines = IndexDatatype.createTypedArray(count, size);
        var index = 0;
        for (var i = 0; i < count; i += 3, index += 6) {
          addTriangle(lines, index, triangles[i], triangles[i + 1], triangles[i + 2]);
        }
        return lines;
      }
      function triangleStripToLines(triangles) {
        var count = triangles.length;
        if (count >= 3) {
          var size = (count - 2) * 6;
          var lines = IndexDatatype.createTypedArray(count, size);
          addTriangle(lines, 0, triangles[0], triangles[1], triangles[2]);
          var index = 6;
          for (var i = 3; i < count; ++i, index += 6) {
            addTriangle(lines, index, triangles[i - 1], triangles[i], triangles[i - 2]);
          }
          return lines;
        }
        return new Uint16Array();
      }
      function triangleFanToLines(triangles) {
        if (triangles.length > 0) {
          var count = triangles.length - 1;
          var size = (count - 1) * 6;
          var lines = IndexDatatype.createTypedArray(count, size);
          var base = triangles[0];
          var index = 0;
          for (var i = 1; i < count; ++i, index += 6) {
            addTriangle(lines, index, base, triangles[i], triangles[i + 1]);
          }
          return lines;
        }
        return new Uint16Array();
      }
      GeometryPipeline.toWireframe = function(geometry) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        var indices = geometry.indices;
        if (defined(indices)) {
          switch (geometry.primitiveType) {
            case PrimitiveType.TRIANGLES:
              geometry.indices = trianglesToLines(indices);
              break;
            case PrimitiveType.TRIANGLE_STRIP:
              geometry.indices = triangleStripToLines(indices);
              break;
            case PrimitiveType.TRIANGLE_FAN:
              geometry.indices = triangleFanToLines(indices);
              break;
            default:
              throw new DeveloperError('geometry.primitiveType must be TRIANGLES, TRIANGLE_STRIP, or TRIANGLE_FAN.');
          }
          geometry.primitiveType = PrimitiveType.LINES;
        }
        return geometry;
      };
      GeometryPipeline.createLineSegmentsForVectors = function(geometry, attributeName, length) {
        attributeName = defaultValue(attributeName, 'normal');
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        if (!defined(geometry.attributes.position)) {
          throw new DeveloperError('geometry.attributes.position is required.');
        }
        if (!defined(geometry.attributes[attributeName])) {
          throw new DeveloperError('geometry.attributes must have an attribute with the same name as the attributeName parameter, ' + attributeName + '.');
        }
        length = defaultValue(length, 10000.0);
        var positions = geometry.attributes.position.values;
        var vectors = geometry.attributes[attributeName].values;
        var positionsLength = positions.length;
        var newPositions = new Float64Array(2 * positionsLength);
        var j = 0;
        for (var i = 0; i < positionsLength; i += 3) {
          newPositions[j++] = positions[i];
          newPositions[j++] = positions[i + 1];
          newPositions[j++] = positions[i + 2];
          newPositions[j++] = positions[i] + (vectors[i] * length);
          newPositions[j++] = positions[i + 1] + (vectors[i + 1] * length);
          newPositions[j++] = positions[i + 2] + (vectors[i + 2] * length);
        }
        var newBoundingSphere;
        var bs = geometry.boundingSphere;
        if (defined(bs)) {
          newBoundingSphere = new BoundingSphere(bs.center, bs.radius + length);
        }
        return new Geometry({
          attributes: {position: new GeometryAttribute({
              componentDatatype: ComponentDatatype.DOUBLE,
              componentsPerAttribute: 3,
              values: newPositions
            })},
          primitiveType: PrimitiveType.LINES,
          boundingSphere: newBoundingSphere
        });
      };
      GeometryPipeline.createAttributeLocations = function(geometry) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        var semantics = ['position', 'positionHigh', 'positionLow', 'position3DHigh', 'position3DLow', 'position2DHigh', 'position2DLow', 'pickColor', 'normal', 'st', 'binormal', 'tangent', 'compressedAttributes'];
        var attributes = geometry.attributes;
        var indices = {};
        var j = 0;
        var i;
        var len = semantics.length;
        for (i = 0; i < len; ++i) {
          var semantic = semantics[i];
          if (defined(attributes[semantic])) {
            indices[semantic] = j++;
          }
        }
        for (var name in attributes) {
          if (attributes.hasOwnProperty(name) && (!defined(indices[name]))) {
            indices[name] = j++;
          }
        }
        return indices;
      };
      GeometryPipeline.reorderForPreVertexCache = function(geometry) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        var numVertices = Geometry.computeNumberOfVertices(geometry);
        var indices = geometry.indices;
        if (defined(indices)) {
          var indexCrossReferenceOldToNew = new Int32Array(numVertices);
          for (var i = 0; i < numVertices; i++) {
            indexCrossReferenceOldToNew[i] = -1;
          }
          var indicesIn = indices;
          var numIndices = indicesIn.length;
          var indicesOut = IndexDatatype.createTypedArray(numVertices, numIndices);
          var intoIndicesIn = 0;
          var intoIndicesOut = 0;
          var nextIndex = 0;
          var tempIndex;
          while (intoIndicesIn < numIndices) {
            tempIndex = indexCrossReferenceOldToNew[indicesIn[intoIndicesIn]];
            if (tempIndex !== -1) {
              indicesOut[intoIndicesOut] = tempIndex;
            } else {
              tempIndex = indicesIn[intoIndicesIn];
              indexCrossReferenceOldToNew[tempIndex] = nextIndex;
              indicesOut[intoIndicesOut] = nextIndex;
              ++nextIndex;
            }
            ++intoIndicesIn;
            ++intoIndicesOut;
          }
          geometry.indices = indicesOut;
          var attributes = geometry.attributes;
          for (var property in attributes) {
            if (attributes.hasOwnProperty(property) && defined(attributes[property]) && defined(attributes[property].values)) {
              var attribute = attributes[property];
              var elementsIn = attribute.values;
              var intoElementsIn = 0;
              var numComponents = attribute.componentsPerAttribute;
              var elementsOut = ComponentDatatype.createTypedArray(attribute.componentDatatype, nextIndex * numComponents);
              while (intoElementsIn < numVertices) {
                var temp = indexCrossReferenceOldToNew[intoElementsIn];
                if (temp !== -1) {
                  for (i = 0; i < numComponents; i++) {
                    elementsOut[numComponents * temp + i] = elementsIn[numComponents * intoElementsIn + i];
                  }
                }
                ++intoElementsIn;
              }
              attribute.values = elementsOut;
            }
          }
        }
        return geometry;
      };
      GeometryPipeline.reorderForPostVertexCache = function(geometry, cacheCapacity) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        var indices = geometry.indices;
        if ((geometry.primitiveType === PrimitiveType.TRIANGLES) && (defined(indices))) {
          var numIndices = indices.length;
          var maximumIndex = 0;
          for (var j = 0; j < numIndices; j++) {
            if (indices[j] > maximumIndex) {
              maximumIndex = indices[j];
            }
          }
          geometry.indices = Tipsify.tipsify({
            indices: indices,
            maximumIndex: maximumIndex,
            cacheSize: cacheCapacity
          });
        }
        return geometry;
      };
      function copyAttributesDescriptions(attributes) {
        var newAttributes = {};
        for (var attribute in attributes) {
          if (attributes.hasOwnProperty(attribute) && defined(attributes[attribute]) && defined(attributes[attribute].values)) {
            var attr = attributes[attribute];
            newAttributes[attribute] = new GeometryAttribute({
              componentDatatype: attr.componentDatatype,
              componentsPerAttribute: attr.componentsPerAttribute,
              normalize: attr.normalize,
              values: []
            });
          }
        }
        return newAttributes;
      }
      function copyVertex(destinationAttributes, sourceAttributes, index) {
        for (var attribute in sourceAttributes) {
          if (sourceAttributes.hasOwnProperty(attribute) && defined(sourceAttributes[attribute]) && defined(sourceAttributes[attribute].values)) {
            var attr = sourceAttributes[attribute];
            for (var k = 0; k < attr.componentsPerAttribute; ++k) {
              destinationAttributes[attribute].values.push(attr.values[(index * attr.componentsPerAttribute) + k]);
            }
          }
        }
      }
      GeometryPipeline.fitToUnsignedShortIndices = function(geometry) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        if ((defined(geometry.indices)) && ((geometry.primitiveType !== PrimitiveType.TRIANGLES) && (geometry.primitiveType !== PrimitiveType.LINES) && (geometry.primitiveType !== PrimitiveType.POINTS))) {
          throw new DeveloperError('geometry.primitiveType must equal to PrimitiveType.TRIANGLES, PrimitiveType.LINES, or PrimitiveType.POINTS.');
        }
        var geometries = [];
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        if (defined(geometry.indices) && (numberOfVertices >= CesiumMath.SIXTY_FOUR_KILOBYTES)) {
          var oldToNewIndex = [];
          var newIndices = [];
          var currentIndex = 0;
          var newAttributes = copyAttributesDescriptions(geometry.attributes);
          var originalIndices = geometry.indices;
          var numberOfIndices = originalIndices.length;
          var indicesPerPrimitive;
          if (geometry.primitiveType === PrimitiveType.TRIANGLES) {
            indicesPerPrimitive = 3;
          } else if (geometry.primitiveType === PrimitiveType.LINES) {
            indicesPerPrimitive = 2;
          } else if (geometry.primitiveType === PrimitiveType.POINTS) {
            indicesPerPrimitive = 1;
          }
          for (var j = 0; j < numberOfIndices; j += indicesPerPrimitive) {
            for (var k = 0; k < indicesPerPrimitive; ++k) {
              var x = originalIndices[j + k];
              var i = oldToNewIndex[x];
              if (!defined(i)) {
                i = currentIndex++;
                oldToNewIndex[x] = i;
                copyVertex(newAttributes, geometry.attributes, x);
              }
              newIndices.push(i);
            }
            if (currentIndex + indicesPerPrimitive >= CesiumMath.SIXTY_FOUR_KILOBYTES) {
              geometries.push(new Geometry({
                attributes: newAttributes,
                indices: newIndices,
                primitiveType: geometry.primitiveType,
                boundingSphere: geometry.boundingSphere,
                boundingSphereCV: geometry.boundingSphereCV
              }));
              oldToNewIndex = [];
              newIndices = [];
              currentIndex = 0;
              newAttributes = copyAttributesDescriptions(geometry.attributes);
            }
          }
          if (newIndices.length !== 0) {
            geometries.push(new Geometry({
              attributes: newAttributes,
              indices: newIndices,
              primitiveType: geometry.primitiveType,
              boundingSphere: geometry.boundingSphere,
              boundingSphereCV: geometry.boundingSphereCV
            }));
          }
        } else {
          geometries.push(geometry);
        }
        return geometries;
      };
      var scratchProjectTo2DCartesian3 = new Cartesian3();
      var scratchProjectTo2DCartographic = new Cartographic();
      GeometryPipeline.projectTo2D = function(geometry, attributeName, attributeName3D, attributeName2D, projection) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        if (!defined(attributeName)) {
          throw new DeveloperError('attributeName is required.');
        }
        if (!defined(attributeName3D)) {
          throw new DeveloperError('attributeName3D is required.');
        }
        if (!defined(attributeName2D)) {
          throw new DeveloperError('attributeName2D is required.');
        }
        if (!defined(geometry.attributes[attributeName])) {
          throw new DeveloperError('geometry must have attribute matching the attributeName argument: ' + attributeName + '.');
        }
        if (geometry.attributes[attributeName].componentDatatype !== ComponentDatatype.DOUBLE) {
          throw new DeveloperError('The attribute componentDatatype must be ComponentDatatype.DOUBLE.');
        }
        var attribute = geometry.attributes[attributeName];
        projection = (defined(projection)) ? projection : new GeographicProjection();
        var ellipsoid = projection.ellipsoid;
        var values3D = attribute.values;
        var projectedValues = new Float64Array(values3D.length);
        var index = 0;
        for (var i = 0; i < values3D.length; i += 3) {
          var value = Cartesian3.fromArray(values3D, i, scratchProjectTo2DCartesian3);
          var lonLat = ellipsoid.cartesianToCartographic(value, scratchProjectTo2DCartographic);
          if (!defined(lonLat)) {
            throw new DeveloperError('Could not project point (' + value.x + ', ' + value.y + ', ' + value.z + ') to 2D.');
          }
          var projectedLonLat = projection.project(lonLat, scratchProjectTo2DCartesian3);
          projectedValues[index++] = projectedLonLat.x;
          projectedValues[index++] = projectedLonLat.y;
          projectedValues[index++] = projectedLonLat.z;
        }
        geometry.attributes[attributeName3D] = attribute;
        geometry.attributes[attributeName2D] = new GeometryAttribute({
          componentDatatype: ComponentDatatype.DOUBLE,
          componentsPerAttribute: 3,
          values: projectedValues
        });
        delete geometry.attributes[attributeName];
        return geometry;
      };
      var encodedResult = {
        high: 0.0,
        low: 0.0
      };
      GeometryPipeline.encodeAttribute = function(geometry, attributeName, attributeHighName, attributeLowName) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        if (!defined(attributeName)) {
          throw new DeveloperError('attributeName is required.');
        }
        if (!defined(attributeHighName)) {
          throw new DeveloperError('attributeHighName is required.');
        }
        if (!defined(attributeLowName)) {
          throw new DeveloperError('attributeLowName is required.');
        }
        if (!defined(geometry.attributes[attributeName])) {
          throw new DeveloperError('geometry must have attribute matching the attributeName argument: ' + attributeName + '.');
        }
        if (geometry.attributes[attributeName].componentDatatype !== ComponentDatatype.DOUBLE) {
          throw new DeveloperError('The attribute componentDatatype must be ComponentDatatype.DOUBLE.');
        }
        var attribute = geometry.attributes[attributeName];
        var values = attribute.values;
        var length = values.length;
        var highValues = new Float32Array(length);
        var lowValues = new Float32Array(length);
        for (var i = 0; i < length; ++i) {
          EncodedCartesian3.encode(values[i], encodedResult);
          highValues[i] = encodedResult.high;
          lowValues[i] = encodedResult.low;
        }
        var componentsPerAttribute = attribute.componentsPerAttribute;
        geometry.attributes[attributeHighName] = new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: componentsPerAttribute,
          values: highValues
        });
        geometry.attributes[attributeLowName] = new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: componentsPerAttribute,
          values: lowValues
        });
        delete geometry.attributes[attributeName];
        return geometry;
      };
      var scratchCartesian3 = new Cartesian3();
      function transformPoint(matrix, attribute) {
        if (defined(attribute)) {
          var values = attribute.values;
          var length = values.length;
          for (var i = 0; i < length; i += 3) {
            Cartesian3.unpack(values, i, scratchCartesian3);
            Matrix4.multiplyByPoint(matrix, scratchCartesian3, scratchCartesian3);
            Cartesian3.pack(scratchCartesian3, values, i);
          }
        }
      }
      function transformVector(matrix, attribute) {
        if (defined(attribute)) {
          var values = attribute.values;
          var length = values.length;
          for (var i = 0; i < length; i += 3) {
            Cartesian3.unpack(values, i, scratchCartesian3);
            Matrix3.multiplyByVector(matrix, scratchCartesian3, scratchCartesian3);
            scratchCartesian3 = Cartesian3.normalize(scratchCartesian3, scratchCartesian3);
            Cartesian3.pack(scratchCartesian3, values, i);
          }
        }
      }
      var inverseTranspose = new Matrix4();
      var normalMatrix = new Matrix3();
      GeometryPipeline.transformToWorldCoordinates = function(instance) {
        if (!defined(instance)) {
          throw new DeveloperError('instance is required.');
        }
        var modelMatrix = instance.modelMatrix;
        if (Matrix4.equals(modelMatrix, Matrix4.IDENTITY)) {
          return instance;
        }
        var attributes = instance.geometry.attributes;
        transformPoint(modelMatrix, attributes.position);
        transformPoint(modelMatrix, attributes.prevPosition);
        transformPoint(modelMatrix, attributes.nextPosition);
        if ((defined(attributes.normal)) || (defined(attributes.binormal)) || (defined(attributes.tangent))) {
          Matrix4.inverse(modelMatrix, inverseTranspose);
          Matrix4.transpose(inverseTranspose, inverseTranspose);
          Matrix4.getRotation(inverseTranspose, normalMatrix);
          transformVector(normalMatrix, attributes.normal);
          transformVector(normalMatrix, attributes.binormal);
          transformVector(normalMatrix, attributes.tangent);
        }
        var boundingSphere = instance.geometry.boundingSphere;
        if (defined(boundingSphere)) {
          instance.geometry.boundingSphere = BoundingSphere.transform(boundingSphere, modelMatrix, boundingSphere);
        }
        instance.modelMatrix = Matrix4.clone(Matrix4.IDENTITY);
        return instance;
      };
      function findAttributesInAllGeometries(instances, propertyName) {
        var length = instances.length;
        var attributesInAllGeometries = {};
        var attributes0 = instances[0][propertyName].attributes;
        var name;
        for (name in attributes0) {
          if (attributes0.hasOwnProperty(name) && defined(attributes0[name]) && defined(attributes0[name].values)) {
            var attribute = attributes0[name];
            var numberOfComponents = attribute.values.length;
            var inAllGeometries = true;
            for (var i = 1; i < length; ++i) {
              var otherAttribute = instances[i][propertyName].attributes[name];
              if ((!defined(otherAttribute)) || (attribute.componentDatatype !== otherAttribute.componentDatatype) || (attribute.componentsPerAttribute !== otherAttribute.componentsPerAttribute) || (attribute.normalize !== otherAttribute.normalize)) {
                inAllGeometries = false;
                break;
              }
              numberOfComponents += otherAttribute.values.length;
            }
            if (inAllGeometries) {
              attributesInAllGeometries[name] = new GeometryAttribute({
                componentDatatype: attribute.componentDatatype,
                componentsPerAttribute: attribute.componentsPerAttribute,
                normalize: attribute.normalize,
                values: ComponentDatatype.createTypedArray(attribute.componentDatatype, numberOfComponents)
              });
            }
          }
        }
        return attributesInAllGeometries;
      }
      var tempScratch = new Cartesian3();
      function combineGeometries(instances, propertyName) {
        var length = instances.length;
        var name;
        var i;
        var j;
        var k;
        var m = instances[0].modelMatrix;
        var haveIndices = (defined(instances[0][propertyName].indices));
        var primitiveType = instances[0][propertyName].primitiveType;
        for (i = 1; i < length; ++i) {
          if (!Matrix4.equals(instances[i].modelMatrix, m)) {
            throw new DeveloperError('All instances must have the same modelMatrix.');
          }
          if ((defined(instances[i][propertyName].indices)) !== haveIndices) {
            throw new DeveloperError('All instance geometries must have an indices or not have one.');
          }
          if (instances[i][propertyName].primitiveType !== primitiveType) {
            throw new DeveloperError('All instance geometries must have the same primitiveType.');
          }
        }
        var attributes = findAttributesInAllGeometries(instances, propertyName);
        var values;
        var sourceValues;
        var sourceValuesLength;
        for (name in attributes) {
          if (attributes.hasOwnProperty(name)) {
            values = attributes[name].values;
            k = 0;
            for (i = 0; i < length; ++i) {
              sourceValues = instances[i][propertyName].attributes[name].values;
              sourceValuesLength = sourceValues.length;
              for (j = 0; j < sourceValuesLength; ++j) {
                values[k++] = sourceValues[j];
              }
            }
          }
        }
        var indices;
        if (haveIndices) {
          var numberOfIndices = 0;
          for (i = 0; i < length; ++i) {
            numberOfIndices += instances[i][propertyName].indices.length;
          }
          var numberOfVertices = Geometry.computeNumberOfVertices(new Geometry({
            attributes: attributes,
            primitiveType: PrimitiveType.POINTS
          }));
          var destIndices = IndexDatatype.createTypedArray(numberOfVertices, numberOfIndices);
          var destOffset = 0;
          var offset = 0;
          for (i = 0; i < length; ++i) {
            var sourceIndices = instances[i][propertyName].indices;
            var sourceIndicesLen = sourceIndices.length;
            for (k = 0; k < sourceIndicesLen; ++k) {
              destIndices[destOffset++] = offset + sourceIndices[k];
            }
            offset += Geometry.computeNumberOfVertices(instances[i][propertyName]);
          }
          indices = destIndices;
        }
        var center = new Cartesian3();
        var radius = 0.0;
        var bs;
        for (i = 0; i < length; ++i) {
          bs = instances[i][propertyName].boundingSphere;
          if (!defined(bs)) {
            center = undefined;
            break;
          }
          Cartesian3.add(bs.center, center, center);
        }
        if (defined(center)) {
          Cartesian3.divideByScalar(center, length, center);
          for (i = 0; i < length; ++i) {
            bs = instances[i][propertyName].boundingSphere;
            var tempRadius = Cartesian3.magnitude(Cartesian3.subtract(bs.center, center, tempScratch)) + bs.radius;
            if (tempRadius > radius) {
              radius = tempRadius;
            }
          }
        }
        return new Geometry({
          attributes: attributes,
          indices: indices,
          primitiveType: primitiveType,
          boundingSphere: (defined(center)) ? new BoundingSphere(center, radius) : undefined
        });
      }
      GeometryPipeline.combineInstances = function(instances) {
        if ((!defined(instances)) || (instances.length < 1)) {
          throw new DeveloperError('instances is required and must have length greater than zero.');
        }
        var instanceGeometry = [];
        var instanceSplitGeometry = [];
        var length = instances.length;
        for (var i = 0; i < length; ++i) {
          var instance = instances[i];
          if (defined(instance.geometry)) {
            instanceGeometry.push(instance);
          } else {
            instanceSplitGeometry.push(instance);
          }
        }
        var geometries = [];
        if (instanceGeometry.length > 0) {
          geometries.push(combineGeometries(instanceGeometry, 'geometry'));
        }
        if (instanceSplitGeometry.length > 0) {
          geometries.push(combineGeometries(instanceSplitGeometry, 'westHemisphereGeometry'));
          geometries.push(combineGeometries(instanceSplitGeometry, 'eastHemisphereGeometry'));
        }
        return geometries;
      };
      var normal = new Cartesian3();
      var v0 = new Cartesian3();
      var v1 = new Cartesian3();
      var v2 = new Cartesian3();
      GeometryPipeline.computeNormal = function(geometry) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        if (!defined(geometry.attributes.position) || !defined(geometry.attributes.position.values)) {
          throw new DeveloperError('geometry.attributes.position.values is required.');
        }
        if (!defined(geometry.indices)) {
          throw new DeveloperError('geometry.indices is required.');
        }
        if (geometry.indices.length < 2 || geometry.indices.length % 3 !== 0) {
          throw new DeveloperError('geometry.indices length must be greater than 0 and be a multiple of 3.');
        }
        if (geometry.primitiveType !== PrimitiveType.TRIANGLES) {
          throw new DeveloperError('geometry.primitiveType must be PrimitiveType.TRIANGLES.');
        }
        var indices = geometry.indices;
        var attributes = geometry.attributes;
        var vertices = attributes.position.values;
        var numVertices = attributes.position.values.length / 3;
        var numIndices = indices.length;
        var normalsPerVertex = new Array(numVertices);
        var normalsPerTriangle = new Array(numIndices / 3);
        var normalIndices = new Array(numIndices);
        for (var i = 0; i < numVertices; i++) {
          normalsPerVertex[i] = {
            indexOffset: 0,
            count: 0,
            currentCount: 0
          };
        }
        var j = 0;
        for (i = 0; i < numIndices; i += 3) {
          var i0 = indices[i];
          var i1 = indices[i + 1];
          var i2 = indices[i + 2];
          var i03 = i0 * 3;
          var i13 = i1 * 3;
          var i23 = i2 * 3;
          v0.x = vertices[i03];
          v0.y = vertices[i03 + 1];
          v0.z = vertices[i03 + 2];
          v1.x = vertices[i13];
          v1.y = vertices[i13 + 1];
          v1.z = vertices[i13 + 2];
          v2.x = vertices[i23];
          v2.y = vertices[i23 + 1];
          v2.z = vertices[i23 + 2];
          normalsPerVertex[i0].count++;
          normalsPerVertex[i1].count++;
          normalsPerVertex[i2].count++;
          Cartesian3.subtract(v1, v0, v1);
          Cartesian3.subtract(v2, v0, v2);
          normalsPerTriangle[j] = Cartesian3.cross(v1, v2, new Cartesian3());
          j++;
        }
        var indexOffset = 0;
        for (i = 0; i < numVertices; i++) {
          normalsPerVertex[i].indexOffset += indexOffset;
          indexOffset += normalsPerVertex[i].count;
        }
        j = 0;
        var vertexNormalData;
        for (i = 0; i < numIndices; i += 3) {
          vertexNormalData = normalsPerVertex[indices[i]];
          var index = vertexNormalData.indexOffset + vertexNormalData.currentCount;
          normalIndices[index] = j;
          vertexNormalData.currentCount++;
          vertexNormalData = normalsPerVertex[indices[i + 1]];
          index = vertexNormalData.indexOffset + vertexNormalData.currentCount;
          normalIndices[index] = j;
          vertexNormalData.currentCount++;
          vertexNormalData = normalsPerVertex[indices[i + 2]];
          index = vertexNormalData.indexOffset + vertexNormalData.currentCount;
          normalIndices[index] = j;
          vertexNormalData.currentCount++;
          j++;
        }
        var normalValues = new Float32Array(numVertices * 3);
        for (i = 0; i < numVertices; i++) {
          var i3 = i * 3;
          vertexNormalData = normalsPerVertex[i];
          if (vertexNormalData.count > 0) {
            Cartesian3.clone(Cartesian3.ZERO, normal);
            for (j = 0; j < vertexNormalData.count; j++) {
              Cartesian3.add(normal, normalsPerTriangle[normalIndices[vertexNormalData.indexOffset + j]], normal);
            }
            Cartesian3.normalize(normal, normal);
            normalValues[i3] = normal.x;
            normalValues[i3 + 1] = normal.y;
            normalValues[i3 + 2] = normal.z;
          } else {
            normalValues[i3] = 0.0;
            normalValues[i3 + 1] = 0.0;
            normalValues[i3 + 2] = 1.0;
          }
        }
        geometry.attributes.normal = new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: 3,
          values: normalValues
        });
        return geometry;
      };
      var normalScratch = new Cartesian3();
      var normalScale = new Cartesian3();
      var tScratch = new Cartesian3();
      GeometryPipeline.computeBinormalAndTangent = function(geometry) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        var attributes = geometry.attributes;
        var indices = geometry.indices;
        if (!defined(attributes.position) || !defined(attributes.position.values)) {
          throw new DeveloperError('geometry.attributes.position.values is required.');
        }
        if (!defined(attributes.normal) || !defined(attributes.normal.values)) {
          throw new DeveloperError('geometry.attributes.normal.values is required.');
        }
        if (!defined(attributes.st) || !defined(attributes.st.values)) {
          throw new DeveloperError('geometry.attributes.st.values is required.');
        }
        if (!defined(indices)) {
          throw new DeveloperError('geometry.indices is required.');
        }
        if (indices.length < 2 || indices.length % 3 !== 0) {
          throw new DeveloperError('geometry.indices length must be greater than 0 and be a multiple of 3.');
        }
        if (geometry.primitiveType !== PrimitiveType.TRIANGLES) {
          throw new DeveloperError('geometry.primitiveType must be PrimitiveType.TRIANGLES.');
        }
        var vertices = geometry.attributes.position.values;
        var normals = geometry.attributes.normal.values;
        var st = geometry.attributes.st.values;
        var numVertices = geometry.attributes.position.values.length / 3;
        var numIndices = indices.length;
        var tan1 = new Array(numVertices * 3);
        for (var i = 0; i < tan1.length; i++) {
          tan1[i] = 0;
        }
        var i03;
        var i13;
        var i23;
        for (i = 0; i < numIndices; i += 3) {
          var i0 = indices[i];
          var i1 = indices[i + 1];
          var i2 = indices[i + 2];
          i03 = i0 * 3;
          i13 = i1 * 3;
          i23 = i2 * 3;
          var i02 = i0 * 2;
          var i12 = i1 * 2;
          var i22 = i2 * 2;
          var ux = vertices[i03];
          var uy = vertices[i03 + 1];
          var uz = vertices[i03 + 2];
          var wx = st[i02];
          var wy = st[i02 + 1];
          var t1 = st[i12 + 1] - wy;
          var t2 = st[i22 + 1] - wy;
          var r = 1.0 / ((st[i12] - wx) * t2 - (st[i22] - wx) * t1);
          var sdirx = (t2 * (vertices[i13] - ux) - t1 * (vertices[i23] - ux)) * r;
          var sdiry = (t2 * (vertices[i13 + 1] - uy) - t1 * (vertices[i23 + 1] - uy)) * r;
          var sdirz = (t2 * (vertices[i13 + 2] - uz) - t1 * (vertices[i23 + 2] - uz)) * r;
          tan1[i03] += sdirx;
          tan1[i03 + 1] += sdiry;
          tan1[i03 + 2] += sdirz;
          tan1[i13] += sdirx;
          tan1[i13 + 1] += sdiry;
          tan1[i13 + 2] += sdirz;
          tan1[i23] += sdirx;
          tan1[i23 + 1] += sdiry;
          tan1[i23 + 2] += sdirz;
        }
        var binormalValues = new Float32Array(numVertices * 3);
        var tangentValues = new Float32Array(numVertices * 3);
        for (i = 0; i < numVertices; i++) {
          i03 = i * 3;
          i13 = i03 + 1;
          i23 = i03 + 2;
          var n = Cartesian3.fromArray(normals, i03, normalScratch);
          var t = Cartesian3.fromArray(tan1, i03, tScratch);
          var scalar = Cartesian3.dot(n, t);
          Cartesian3.multiplyByScalar(n, scalar, normalScale);
          Cartesian3.normalize(Cartesian3.subtract(t, normalScale, t), t);
          tangentValues[i03] = t.x;
          tangentValues[i13] = t.y;
          tangentValues[i23] = t.z;
          Cartesian3.normalize(Cartesian3.cross(n, t, t), t);
          binormalValues[i03] = t.x;
          binormalValues[i13] = t.y;
          binormalValues[i23] = t.z;
        }
        geometry.attributes.tangent = new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: 3,
          values: tangentValues
        });
        geometry.attributes.binormal = new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: 3,
          values: binormalValues
        });
        return geometry;
      };
      var scratchCartesian2 = new Cartesian2();
      var toEncode1 = new Cartesian3();
      var toEncode2 = new Cartesian3();
      var toEncode3 = new Cartesian3();
      GeometryPipeline.compressVertices = function(geometry) {
        if (!defined(geometry)) {
          throw new DeveloperError('geometry is required.');
        }
        var normalAttribute = geometry.attributes.normal;
        var stAttribute = geometry.attributes.st;
        if (!defined(normalAttribute) && !defined(stAttribute)) {
          return geometry;
        }
        var tangentAttribute = geometry.attributes.tangent;
        var binormalAttribute = geometry.attributes.binormal;
        var normals;
        var st;
        var tangents;
        var binormals;
        if (defined(normalAttribute)) {
          normals = normalAttribute.values;
        }
        if (defined(stAttribute)) {
          st = stAttribute.values;
        }
        if (defined(tangentAttribute)) {
          tangents = tangentAttribute.values;
        }
        if (binormalAttribute) {
          binormals = binormalAttribute.values;
        }
        var length = defined(normals) ? normals.length : st.length;
        var numComponents = defined(normals) ? 3.0 : 2.0;
        var numVertices = length / numComponents;
        var compressedLength = numVertices;
        var numCompressedComponents = defined(st) && defined(normals) ? 2.0 : 1.0;
        numCompressedComponents += defined(tangents) || defined(binormals) ? 1.0 : 0.0;
        compressedLength *= numCompressedComponents;
        var compressedAttributes = new Float32Array(compressedLength);
        var normalIndex = 0;
        for (var i = 0; i < numVertices; ++i) {
          if (defined(st)) {
            Cartesian2.fromArray(st, i * 2.0, scratchCartesian2);
            compressedAttributes[normalIndex++] = AttributeCompression.compressTextureCoordinates(scratchCartesian2);
          }
          var index = i * 3.0;
          if (defined(normals) && defined(tangents) && defined(binormals)) {
            Cartesian3.fromArray(normals, index, toEncode1);
            Cartesian3.fromArray(tangents, index, toEncode2);
            Cartesian3.fromArray(binormals, index, toEncode3);
            AttributeCompression.octPack(toEncode1, toEncode2, toEncode3, scratchCartesian2);
            compressedAttributes[normalIndex++] = scratchCartesian2.x;
            compressedAttributes[normalIndex++] = scratchCartesian2.y;
          } else {
            if (defined(normals)) {
              Cartesian3.fromArray(normals, index, toEncode1);
              compressedAttributes[normalIndex++] = AttributeCompression.octEncodeFloat(toEncode1);
            }
            if (defined(tangents)) {
              Cartesian3.fromArray(tangents, index, toEncode1);
              compressedAttributes[normalIndex++] = AttributeCompression.octEncodeFloat(toEncode1);
            }
            if (defined(binormals)) {
              Cartesian3.fromArray(binormals, index, toEncode1);
              compressedAttributes[normalIndex++] = AttributeCompression.octEncodeFloat(toEncode1);
            }
          }
        }
        geometry.attributes.compressedAttributes = new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: numCompressedComponents,
          values: compressedAttributes
        });
        if (defined(normals)) {
          delete geometry.attributes.normal;
        }
        if (defined(st)) {
          delete geometry.attributes.st;
        }
        if (defined(tangents)) {
          delete geometry.attributes.tangent;
        }
        if (defined(binormals)) {
          delete geometry.attributes.binormal;
        }
        return geometry;
      };
      function indexTriangles(geometry) {
        if (defined(geometry.indices)) {
          return geometry;
        }
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        if (numberOfVertices < 3) {
          throw new DeveloperError('The number of vertices must be at least three.');
        }
        if (numberOfVertices % 3 !== 0) {
          throw new DeveloperError('The number of vertices must be a multiple of three.');
        }
        var indices = IndexDatatype.createTypedArray(numberOfVertices, numberOfVertices);
        for (var i = 0; i < numberOfVertices; ++i) {
          indices[i] = i;
        }
        geometry.indices = indices;
        return geometry;
      }
      function indexTriangleFan(geometry) {
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        if (numberOfVertices < 3) {
          throw new DeveloperError('The number of vertices must be at least three.');
        }
        var indices = IndexDatatype.createTypedArray(numberOfVertices, (numberOfVertices - 2) * 3);
        indices[0] = 1;
        indices[1] = 0;
        indices[2] = 2;
        var indicesIndex = 3;
        for (var i = 3; i < numberOfVertices; ++i) {
          indices[indicesIndex++] = i - 1;
          indices[indicesIndex++] = 0;
          indices[indicesIndex++] = i;
        }
        geometry.indices = indices;
        geometry.primitiveType = PrimitiveType.TRIANGLES;
        return geometry;
      }
      function indexTriangleStrip(geometry) {
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        if (numberOfVertices < 3) {
          throw new DeveloperError('The number of vertices must be at least 3.');
        }
        var indices = IndexDatatype.createTypedArray(numberOfVertices, (numberOfVertices - 2) * 3);
        indices[0] = 0;
        indices[1] = 1;
        indices[2] = 2;
        if (numberOfVertices > 3) {
          indices[3] = 0;
          indices[4] = 2;
          indices[5] = 3;
        }
        var indicesIndex = 6;
        for (var i = 3; i < numberOfVertices - 1; i += 2) {
          indices[indicesIndex++] = i;
          indices[indicesIndex++] = i - 1;
          indices[indicesIndex++] = i + 1;
          if (i + 2 < numberOfVertices) {
            indices[indicesIndex++] = i;
            indices[indicesIndex++] = i + 1;
            indices[indicesIndex++] = i + 2;
          }
        }
        geometry.indices = indices;
        geometry.primitiveType = PrimitiveType.TRIANGLES;
        return geometry;
      }
      function indexLines(geometry) {
        if (defined(geometry.indices)) {
          return geometry;
        }
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        if (numberOfVertices < 2) {
          throw new DeveloperError('The number of vertices must be at least two.');
        }
        if (numberOfVertices % 2 !== 0) {
          throw new DeveloperError('The number of vertices must be a multiple of 2.');
        }
        var indices = IndexDatatype.createTypedArray(numberOfVertices, numberOfVertices);
        for (var i = 0; i < numberOfVertices; ++i) {
          indices[i] = i;
        }
        geometry.indices = indices;
        return geometry;
      }
      function indexLineStrip(geometry) {
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        if (numberOfVertices < 2) {
          throw new DeveloperError('The number of vertices must be at least two.');
        }
        var indices = IndexDatatype.createTypedArray(numberOfVertices, (numberOfVertices - 1) * 2);
        indices[0] = 0;
        indices[1] = 1;
        var indicesIndex = 2;
        for (var i = 2; i < numberOfVertices; ++i) {
          indices[indicesIndex++] = i - 1;
          indices[indicesIndex++] = i;
        }
        geometry.indices = indices;
        geometry.primitiveType = PrimitiveType.LINES;
        return geometry;
      }
      function indexLineLoop(geometry) {
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        if (numberOfVertices < 2) {
          throw new DeveloperError('The number of vertices must be at least two.');
        }
        var indices = IndexDatatype.createTypedArray(numberOfVertices, numberOfVertices * 2);
        indices[0] = 0;
        indices[1] = 1;
        var indicesIndex = 2;
        for (var i = 2; i < numberOfVertices; ++i) {
          indices[indicesIndex++] = i - 1;
          indices[indicesIndex++] = i;
        }
        indices[indicesIndex++] = numberOfVertices - 1;
        indices[indicesIndex] = 0;
        geometry.indices = indices;
        geometry.primitiveType = PrimitiveType.LINES;
        return geometry;
      }
      function indexPrimitive(geometry) {
        switch (geometry.primitiveType) {
          case PrimitiveType.TRIANGLE_FAN:
            return indexTriangleFan(geometry);
          case PrimitiveType.TRIANGLE_STRIP:
            return indexTriangleStrip(geometry);
          case PrimitiveType.TRIANGLES:
            return indexTriangles(geometry);
          case PrimitiveType.LINE_STRIP:
            return indexLineStrip(geometry);
          case PrimitiveType.LINE_LOOP:
            return indexLineLoop(geometry);
          case PrimitiveType.LINES:
            return indexLines(geometry);
        }
        return geometry;
      }
      function offsetPointFromXZPlane(p, isBehind) {
        if (Math.abs(p.y) < CesiumMath.EPSILON6) {
          if (isBehind) {
            p.y = -CesiumMath.EPSILON6;
          } else {
            p.y = CesiumMath.EPSILON6;
          }
        }
      }
      function offsetTriangleFromXZPlane(p0, p1, p2) {
        if (p0.y !== 0.0 && p1.y !== 0.0 && p2.y !== 0.0) {
          offsetPointFromXZPlane(p0, p0.y < 0.0);
          offsetPointFromXZPlane(p1, p1.y < 0.0);
          offsetPointFromXZPlane(p2, p2.y < 0.0);
          return;
        }
        var p0y = Math.abs(p0.y);
        var p1y = Math.abs(p1.y);
        var p2y = Math.abs(p2.y);
        var sign;
        if (p0y > p1y) {
          if (p0y > p2y) {
            sign = CesiumMath.sign(p0.y);
          } else {
            sign = CesiumMath.sign(p2.y);
          }
        } else if (p1y > p2y) {
          sign = CesiumMath.sign(p1.y);
        } else {
          sign = CesiumMath.sign(p2.y);
        }
        var isBehind = sign < 0.0;
        offsetPointFromXZPlane(p0, isBehind);
        offsetPointFromXZPlane(p1, isBehind);
        offsetPointFromXZPlane(p2, isBehind);
      }
      var c3 = new Cartesian3();
      function getXZIntersectionOffsetPoints(p, p1, u1, v1) {
        Cartesian3.add(p, Cartesian3.multiplyByScalar(Cartesian3.subtract(p1, p, c3), p.y / (p.y - p1.y), c3), u1);
        Cartesian3.clone(u1, v1);
        offsetPointFromXZPlane(u1, true);
        offsetPointFromXZPlane(v1, false);
      }
      var u1 = new Cartesian3();
      var u2 = new Cartesian3();
      var q1 = new Cartesian3();
      var q2 = new Cartesian3();
      var splitTriangleResult = {
        positions: new Array(7),
        indices: new Array(3 * 3)
      };
      function splitTriangle(p0, p1, p2) {
        if ((p0.x >= 0.0) || (p1.x >= 0.0) || (p2.x >= 0.0)) {
          return undefined;
        }
        offsetTriangleFromXZPlane(p0, p1, p2);
        var p0Behind = p0.y < 0.0;
        var p1Behind = p1.y < 0.0;
        var p2Behind = p2.y < 0.0;
        var numBehind = 0;
        numBehind += p0Behind ? 1 : 0;
        numBehind += p1Behind ? 1 : 0;
        numBehind += p2Behind ? 1 : 0;
        var indices = splitTriangleResult.indices;
        if (numBehind === 1) {
          indices[1] = 3;
          indices[2] = 4;
          indices[5] = 6;
          indices[7] = 6;
          indices[8] = 5;
          if (p0Behind) {
            getXZIntersectionOffsetPoints(p0, p1, u1, q1);
            getXZIntersectionOffsetPoints(p0, p2, u2, q2);
            indices[0] = 0;
            indices[3] = 1;
            indices[4] = 2;
            indices[6] = 1;
          } else if (p1Behind) {
            getXZIntersectionOffsetPoints(p1, p2, u1, q1);
            getXZIntersectionOffsetPoints(p1, p0, u2, q2);
            indices[0] = 1;
            indices[3] = 2;
            indices[4] = 0;
            indices[6] = 2;
          } else if (p2Behind) {
            getXZIntersectionOffsetPoints(p2, p0, u1, q1);
            getXZIntersectionOffsetPoints(p2, p1, u2, q2);
            indices[0] = 2;
            indices[3] = 0;
            indices[4] = 1;
            indices[6] = 0;
          }
        } else if (numBehind === 2) {
          indices[2] = 4;
          indices[4] = 4;
          indices[5] = 3;
          indices[7] = 5;
          indices[8] = 6;
          if (!p0Behind) {
            getXZIntersectionOffsetPoints(p0, p1, u1, q1);
            getXZIntersectionOffsetPoints(p0, p2, u2, q2);
            indices[0] = 1;
            indices[1] = 2;
            indices[3] = 1;
            indices[6] = 0;
          } else if (!p1Behind) {
            getXZIntersectionOffsetPoints(p1, p2, u1, q1);
            getXZIntersectionOffsetPoints(p1, p0, u2, q2);
            indices[0] = 2;
            indices[1] = 0;
            indices[3] = 2;
            indices[6] = 1;
          } else if (!p2Behind) {
            getXZIntersectionOffsetPoints(p2, p0, u1, q1);
            getXZIntersectionOffsetPoints(p2, p1, u2, q2);
            indices[0] = 0;
            indices[1] = 1;
            indices[3] = 0;
            indices[6] = 2;
          }
        }
        var positions = splitTriangleResult.positions;
        positions[0] = p0;
        positions[1] = p1;
        positions[2] = p2;
        positions.length = 3;
        if (numBehind === 1 || numBehind === 2) {
          positions[3] = u1;
          positions[4] = u2;
          positions[5] = q1;
          positions[6] = q2;
          positions.length = 7;
        }
        return splitTriangleResult;
      }
      function updateGeometryAfterSplit(geometry, computeBoundingSphere) {
        var attributes = geometry.attributes;
        if (attributes.position.values.length === 0) {
          return undefined;
        }
        for (var property in attributes) {
          if (attributes.hasOwnProperty(property) && defined(attributes[property]) && defined(attributes[property].values)) {
            var attribute = attributes[property];
            attribute.values = ComponentDatatype.createTypedArray(attribute.componentDatatype, attribute.values);
          }
        }
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        geometry.indices = IndexDatatype.createTypedArray(numberOfVertices, geometry.indices);
        if (computeBoundingSphere) {
          geometry.boundingSphere = BoundingSphere.fromVertices(attributes.position.values);
        }
        return geometry;
      }
      function copyGeometryForSplit(geometry) {
        var attributes = geometry.attributes;
        var copiedAttributes = {};
        for (var property in attributes) {
          if (attributes.hasOwnProperty(property) && defined(attributes[property]) && defined(attributes[property].values)) {
            var attribute = attributes[property];
            copiedAttributes[property] = new GeometryAttribute({
              componentDatatype: attribute.componentDatatype,
              componentsPerAttribute: attribute.componentsPerAttribute,
              normalize: attribute.normalize,
              values: []
            });
          }
        }
        return new Geometry({
          attributes: copiedAttributes,
          indices: [],
          primitiveType: geometry.primitiveType
        });
      }
      function updateInstanceAfterSplit(instance, westGeometry, eastGeometry) {
        var computeBoundingSphere = defined(instance.geometry.boundingSphere);
        westGeometry = updateGeometryAfterSplit(westGeometry, computeBoundingSphere);
        eastGeometry = updateGeometryAfterSplit(eastGeometry, computeBoundingSphere);
        if (defined(eastGeometry) && !defined(westGeometry)) {
          instance.geometry = eastGeometry;
        } else if (!defined(eastGeometry) && defined(westGeometry)) {
          instance.geometry = westGeometry;
        } else {
          instance.westHemisphereGeometry = westGeometry;
          instance.eastHemisphereGeometry = eastGeometry;
          instance.geometry = undefined;
        }
      }
      var p0Scratch = new Cartesian3();
      var p1Scratch = new Cartesian3();
      var p2Scratch = new Cartesian3();
      var barycentricScratch = new Cartesian3();
      var s0Scratch = new Cartesian2();
      var s1Scratch = new Cartesian2();
      var s2Scratch = new Cartesian2();
      function computeTriangleAttributes(i0, i1, i2, point, positions, normals, binormals, tangents, texCoords, currentAttributes, insertedIndex) {
        if (!defined(normals) && !defined(binormals) && !defined(tangents) && !defined(texCoords)) {
          return;
        }
        var p0 = Cartesian3.fromArray(positions, i0 * 3, p0Scratch);
        var p1 = Cartesian3.fromArray(positions, i1 * 3, p1Scratch);
        var p2 = Cartesian3.fromArray(positions, i2 * 3, p2Scratch);
        var coords = barycentricCoordinates(point, p0, p1, p2, barycentricScratch);
        if (defined(normals)) {
          var n0 = Cartesian3.fromArray(normals, i0 * 3, p0Scratch);
          var n1 = Cartesian3.fromArray(normals, i1 * 3, p1Scratch);
          var n2 = Cartesian3.fromArray(normals, i2 * 3, p2Scratch);
          Cartesian3.multiplyByScalar(n0, coords.x, n0);
          Cartesian3.multiplyByScalar(n1, coords.y, n1);
          Cartesian3.multiplyByScalar(n2, coords.z, n2);
          var normal = Cartesian3.add(n0, n1, n0);
          Cartesian3.add(normal, n2, normal);
          Cartesian3.normalize(normal, normal);
          Cartesian3.pack(normal, currentAttributes.normal.values, insertedIndex * 3);
        }
        if (defined(binormals)) {
          var b0 = Cartesian3.fromArray(binormals, i0 * 3, p0Scratch);
          var b1 = Cartesian3.fromArray(binormals, i1 * 3, p1Scratch);
          var b2 = Cartesian3.fromArray(binormals, i2 * 3, p2Scratch);
          Cartesian3.multiplyByScalar(b0, coords.x, b0);
          Cartesian3.multiplyByScalar(b1, coords.y, b1);
          Cartesian3.multiplyByScalar(b2, coords.z, b2);
          var binormal = Cartesian3.add(b0, b1, b0);
          Cartesian3.add(binormal, b2, binormal);
          Cartesian3.normalize(binormal, binormal);
          Cartesian3.pack(binormal, currentAttributes.binormal.values, insertedIndex * 3);
        }
        if (defined(tangents)) {
          var t0 = Cartesian3.fromArray(tangents, i0 * 3, p0Scratch);
          var t1 = Cartesian3.fromArray(tangents, i1 * 3, p1Scratch);
          var t2 = Cartesian3.fromArray(tangents, i2 * 3, p2Scratch);
          Cartesian3.multiplyByScalar(t0, coords.x, t0);
          Cartesian3.multiplyByScalar(t1, coords.y, t1);
          Cartesian3.multiplyByScalar(t2, coords.z, t2);
          var tangent = Cartesian3.add(t0, t1, t0);
          Cartesian3.add(tangent, t2, tangent);
          Cartesian3.normalize(tangent, tangent);
          Cartesian3.pack(tangent, currentAttributes.tangent.values, insertedIndex * 3);
        }
        if (defined(texCoords)) {
          var s0 = Cartesian2.fromArray(texCoords, i0 * 2, s0Scratch);
          var s1 = Cartesian2.fromArray(texCoords, i1 * 2, s1Scratch);
          var s2 = Cartesian2.fromArray(texCoords, i2 * 2, s2Scratch);
          Cartesian2.multiplyByScalar(s0, coords.x, s0);
          Cartesian2.multiplyByScalar(s1, coords.y, s1);
          Cartesian2.multiplyByScalar(s2, coords.z, s2);
          var texCoord = Cartesian2.add(s0, s1, s0);
          Cartesian2.add(texCoord, s2, texCoord);
          Cartesian2.pack(texCoord, currentAttributes.st.values, insertedIndex * 2);
        }
      }
      function insertSplitPoint(currentAttributes, currentIndices, currentIndexMap, indices, currentIndex, point) {
        var insertIndex = currentAttributes.position.values.length / 3;
        if (currentIndex !== -1) {
          var prevIndex = indices[currentIndex];
          var newIndex = currentIndexMap[prevIndex];
          if (newIndex === -1) {
            currentIndexMap[prevIndex] = insertIndex;
            currentAttributes.position.values.push(point.x, point.y, point.z);
            currentIndices.push(insertIndex);
            return insertIndex;
          }
          currentIndices.push(newIndex);
          return newIndex;
        }
        currentAttributes.position.values.push(point.x, point.y, point.z);
        currentIndices.push(insertIndex);
        return insertIndex;
      }
      function splitLongitudeTriangles(instance) {
        var geometry = instance.geometry;
        var attributes = geometry.attributes;
        var positions = attributes.position.values;
        var normals = (defined(attributes.normal)) ? attributes.normal.values : undefined;
        var binormals = (defined(attributes.binormal)) ? attributes.binormal.values : undefined;
        var tangents = (defined(attributes.tangent)) ? attributes.tangent.values : undefined;
        var texCoords = (defined(attributes.st)) ? attributes.st.values : undefined;
        var indices = geometry.indices;
        var eastGeometry = copyGeometryForSplit(geometry);
        var westGeometry = copyGeometryForSplit(geometry);
        var currentAttributes;
        var currentIndices;
        var currentIndexMap;
        var insertedIndex;
        var i;
        var westGeometryIndexMap = [];
        westGeometryIndexMap.length = positions.length / 3;
        var eastGeometryIndexMap = [];
        eastGeometryIndexMap.length = positions.length / 3;
        for (i = 0; i < westGeometryIndexMap.length; ++i) {
          westGeometryIndexMap[i] = -1;
          eastGeometryIndexMap[i] = -1;
        }
        var len = indices.length;
        for (i = 0; i < len; i += 3) {
          var i0 = indices[i];
          var i1 = indices[i + 1];
          var i2 = indices[i + 2];
          var p0 = Cartesian3.fromArray(positions, i0 * 3);
          var p1 = Cartesian3.fromArray(positions, i1 * 3);
          var p2 = Cartesian3.fromArray(positions, i2 * 3);
          var result = splitTriangle(p0, p1, p2);
          if (defined(result) && result.positions.length > 3) {
            var resultPositions = result.positions;
            var resultIndices = result.indices;
            var resultLength = resultIndices.length;
            for (var j = 0; j < resultLength; ++j) {
              var resultIndex = resultIndices[j];
              var point = resultPositions[resultIndex];
              if (point.y < 0.0) {
                currentAttributes = westGeometry.attributes;
                currentIndices = westGeometry.indices;
                currentIndexMap = westGeometryIndexMap;
              } else {
                currentAttributes = eastGeometry.attributes;
                currentIndices = eastGeometry.indices;
                currentIndexMap = eastGeometryIndexMap;
              }
              insertedIndex = insertSplitPoint(currentAttributes, currentIndices, currentIndexMap, indices, resultIndex < 3 ? i + resultIndex : -1, point);
              computeTriangleAttributes(i0, i1, i2, point, positions, normals, binormals, tangents, texCoords, currentAttributes, insertedIndex);
            }
          } else {
            if (defined(result)) {
              p0 = result.positions[0];
              p1 = result.positions[1];
              p2 = result.positions[2];
            }
            if (p0.y < 0.0) {
              currentAttributes = westGeometry.attributes;
              currentIndices = westGeometry.indices;
              currentIndexMap = westGeometryIndexMap;
            } else {
              currentAttributes = eastGeometry.attributes;
              currentIndices = eastGeometry.indices;
              currentIndexMap = eastGeometryIndexMap;
            }
            insertedIndex = insertSplitPoint(currentAttributes, currentIndices, currentIndexMap, indices, i, p0);
            computeTriangleAttributes(i0, i1, i2, p0, positions, normals, binormals, tangents, texCoords, currentAttributes, insertedIndex);
            insertedIndex = insertSplitPoint(currentAttributes, currentIndices, currentIndexMap, indices, i + 1, p1);
            computeTriangleAttributes(i0, i1, i2, p1, positions, normals, binormals, tangents, texCoords, currentAttributes, insertedIndex);
            insertedIndex = insertSplitPoint(currentAttributes, currentIndices, currentIndexMap, indices, i + 2, p2);
            computeTriangleAttributes(i0, i1, i2, p2, positions, normals, binormals, tangents, texCoords, currentAttributes, insertedIndex);
          }
        }
        updateInstanceAfterSplit(instance, westGeometry, eastGeometry);
      }
      var xzPlane = Plane.fromPointNormal(Cartesian3.ZERO, Cartesian3.UNIT_Y);
      var offsetScratch = new Cartesian3();
      var offsetPointScratch = new Cartesian3();
      function splitLongitudeLines(instance) {
        var geometry = instance.geometry;
        var attributes = geometry.attributes;
        var positions = attributes.position.values;
        var indices = geometry.indices;
        var eastGeometry = copyGeometryForSplit(geometry);
        var westGeometry = copyGeometryForSplit(geometry);
        var i;
        var length = indices.length;
        var westGeometryIndexMap = [];
        westGeometryIndexMap.length = positions.length / 3;
        var eastGeometryIndexMap = [];
        eastGeometryIndexMap.length = positions.length / 3;
        for (i = 0; i < westGeometryIndexMap.length; ++i) {
          westGeometryIndexMap[i] = -1;
          eastGeometryIndexMap[i] = -1;
        }
        for (i = 0; i < length; i += 2) {
          var i0 = indices[i];
          var i1 = indices[i + 1];
          var p0 = Cartesian3.fromArray(positions, i0 * 3, p0Scratch);
          var p1 = Cartesian3.fromArray(positions, i1 * 3, p1Scratch);
          if (Math.abs(p0.y) < CesiumMath.EPSILON6) {
            if (p0.y < 0.0) {
              p0.y = -CesiumMath.EPSILON6;
            } else {
              p0.y = CesiumMath.EPSILON6;
            }
          }
          if (Math.abs(p1.y) < CesiumMath.EPSILON6) {
            if (p1.y < 0.0) {
              p1.y = -CesiumMath.EPSILON6;
            } else {
              p1.y = CesiumMath.EPSILON6;
            }
          }
          var p0Attributes = eastGeometry.attributes;
          var p0Indices = eastGeometry.indices;
          var p0IndexMap = eastGeometryIndexMap;
          var p1Attributes = westGeometry.attributes;
          var p1Indices = westGeometry.indices;
          var p1IndexMap = westGeometryIndexMap;
          var intersection = IntersectionTests.lineSegmentPlane(p0, p1, xzPlane, p2Scratch);
          if (defined(intersection)) {
            var offset = Cartesian3.multiplyByScalar(Cartesian3.UNIT_Y, 5.0 * CesiumMath.EPSILON9, offsetScratch);
            if (p0.y < 0.0) {
              Cartesian3.negate(offset, offset);
              p0Attributes = westGeometry.attributes;
              p0Indices = westGeometry.indices;
              p0IndexMap = westGeometryIndexMap;
              p1Attributes = eastGeometry.attributes;
              p1Indices = eastGeometry.indices;
              p1IndexMap = eastGeometryIndexMap;
            }
            var offsetPoint = Cartesian3.add(intersection, offset, offsetPointScratch);
            insertSplitPoint(p0Attributes, p0Indices, p0IndexMap, indices, i, p0);
            insertSplitPoint(p0Attributes, p0Indices, p0IndexMap, indices, -1, offsetPoint);
            Cartesian3.negate(offset, offset);
            Cartesian3.add(intersection, offset, offsetPoint);
            insertSplitPoint(p1Attributes, p1Indices, p1IndexMap, indices, -1, offsetPoint);
            insertSplitPoint(p1Attributes, p1Indices, p1IndexMap, indices, i + 1, p1);
          } else {
            var currentAttributes;
            var currentIndices;
            var currentIndexMap;
            if (p0.y < 0.0) {
              currentAttributes = westGeometry.attributes;
              currentIndices = westGeometry.indices;
              currentIndexMap = westGeometryIndexMap;
            } else {
              currentAttributes = eastGeometry.attributes;
              currentIndices = eastGeometry.indices;
              currentIndexMap = eastGeometryIndexMap;
            }
            insertSplitPoint(currentAttributes, currentIndices, currentIndexMap, indices, i, p0);
            insertSplitPoint(currentAttributes, currentIndices, currentIndexMap, indices, i + 1, p1);
          }
        }
        updateInstanceAfterSplit(instance, westGeometry, eastGeometry);
      }
      var cartesian2Scratch0 = new Cartesian2();
      var cartesian2Scratch1 = new Cartesian2();
      var cartesian3Scratch0 = new Cartesian3();
      var cartesian3Scratch1 = new Cartesian3();
      var cartesian3Scratch2 = new Cartesian3();
      var cartesian3Scratch3 = new Cartesian3();
      var cartesian3Scratch4 = new Cartesian3();
      var cartesian3Scratch5 = new Cartesian3();
      var cartesian3Scratch6 = new Cartesian3();
      var cartesian4Scratch0 = new Cartesian4();
      function splitLongitudePolyline(instance) {
        var geometry = instance.geometry;
        var attributes = geometry.attributes;
        var positions = attributes.position.values;
        var prevPositions = attributes.prevPosition.values;
        var nextPositions = attributes.nextPosition.values;
        var expandAndWidths = attributes.expandAndWidth.values;
        var texCoords = (defined(attributes.st)) ? attributes.st.values : undefined;
        var colors = (defined(attributes.color)) ? attributes.color.values : undefined;
        var eastGeometry = copyGeometryForSplit(geometry);
        var westGeometry = copyGeometryForSplit(geometry);
        var i;
        var j;
        var index;
        var length = positions.length / 3;
        for (i = 0; i < length; i += 4) {
          var i0 = i;
          var i1 = i + 1;
          var i2 = i + 2;
          var i3 = i + 3;
          var p0 = Cartesian3.fromArray(positions, i0 * 3, cartesian3Scratch0);
          var p1 = Cartesian3.fromArray(positions, i1 * 3, cartesian3Scratch1);
          var p2 = Cartesian3.fromArray(positions, i2 * 3, cartesian3Scratch2);
          var p3 = Cartesian3.fromArray(positions, i3 * 3, cartesian3Scratch3);
          if (Math.abs(p0.y) < CesiumMath.EPSILON6) {
            p0.y = CesiumMath.EPSILON6 * (p2.y < 0.0 ? -1.0 : 1.0);
            p1.y = p0.y;
          }
          if (Math.abs(p2.y) < CesiumMath.EPSILON6) {
            p2.y = CesiumMath.EPSILON6 * (p0.y < 0.0 ? -1.0 : 1.0);
            p3.y = p2.y;
          }
          var p0Attributes = eastGeometry.attributes;
          var p0Indices = eastGeometry.indices;
          var p2Attributes = westGeometry.attributes;
          var p2Indices = westGeometry.indices;
          var intersection = IntersectionTests.lineSegmentPlane(p0, p2, xzPlane, cartesian3Scratch4);
          if (defined(intersection)) {
            var offset = Cartesian3.multiplyByScalar(Cartesian3.UNIT_Y, 5.0 * CesiumMath.EPSILON9, cartesian3Scratch5);
            if (p0.y < 0.0) {
              Cartesian3.negate(offset, offset);
              p0Attributes = westGeometry.attributes;
              p0Indices = westGeometry.indices;
              p2Attributes = eastGeometry.attributes;
              p2Indices = eastGeometry.indices;
            }
            var offsetPoint = Cartesian3.add(intersection, offset, cartesian3Scratch6);
            p0Attributes.position.values.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
            p0Attributes.position.values.push(offsetPoint.x, offsetPoint.y, offsetPoint.z);
            p0Attributes.position.values.push(offsetPoint.x, offsetPoint.y, offsetPoint.z);
            Cartesian3.negate(offset, offset);
            Cartesian3.add(intersection, offset, offsetPoint);
            p2Attributes.position.values.push(offsetPoint.x, offsetPoint.y, offsetPoint.z);
            p2Attributes.position.values.push(offsetPoint.x, offsetPoint.y, offsetPoint.z);
            p2Attributes.position.values.push(p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
            for (j = i0 * 3; j < i0 * 3 + 2 * 3; ++j) {
              p0Attributes.prevPosition.values.push(prevPositions[j]);
            }
            p0Attributes.prevPosition.values.push(p0.x, p0.y, p0.z, p0.x, p0.y, p0.z);
            p2Attributes.prevPosition.values.push(p0.x, p0.y, p0.z, p0.x, p0.y, p0.z);
            for (j = i2 * 3; j < i2 * 3 + 2 * 3; ++j) {
              p2Attributes.prevPosition.values.push(prevPositions[j]);
            }
            for (j = i0 * 3; j < i0 * 3 + 2 * 3; ++j) {
              p0Attributes.nextPosition.values.push(nextPositions[j]);
            }
            p0Attributes.nextPosition.values.push(p2.x, p2.y, p2.z, p2.x, p2.y, p2.z);
            p2Attributes.nextPosition.values.push(p2.x, p2.y, p2.z, p2.x, p2.y, p2.z);
            for (j = i2 * 3; j < i2 * 3 + 2 * 3; ++j) {
              p2Attributes.nextPosition.values.push(nextPositions[j]);
            }
            var ew0 = Cartesian2.fromArray(expandAndWidths, i0 * 2, cartesian2Scratch0);
            var width = Math.abs(ew0.y);
            p0Attributes.expandAndWidth.values.push(-1, width, 1, width);
            p0Attributes.expandAndWidth.values.push(-1, -width, 1, -width);
            p2Attributes.expandAndWidth.values.push(-1, width, 1, width);
            p2Attributes.expandAndWidth.values.push(-1, -width, 1, -width);
            var t = Cartesian3.magnitudeSquared(Cartesian3.subtract(intersection, p0, cartesian3Scratch3));
            t /= Cartesian3.magnitudeSquared(Cartesian3.subtract(p2, p0, cartesian3Scratch3));
            if (defined(colors)) {
              var c0 = Cartesian4.fromArray(colors, i0 * 4, cartesian4Scratch0);
              var c2 = Cartesian4.fromArray(colors, i2 * 4, cartesian4Scratch0);
              var r = CesiumMath.lerp(c0.x, c2.x, t);
              var g = CesiumMath.lerp(c0.y, c2.y, t);
              var b = CesiumMath.lerp(c0.z, c2.z, t);
              var a = CesiumMath.lerp(c0.w, c2.w, t);
              for (j = i0 * 4; j < i0 * 4 + 2 * 4; ++j) {
                p0Attributes.color.values.push(colors[j]);
              }
              p0Attributes.color.values.push(r, g, b, a);
              p0Attributes.color.values.push(r, g, b, a);
              p2Attributes.color.values.push(r, g, b, a);
              p2Attributes.color.values.push(r, g, b, a);
              for (j = i2 * 4; j < i2 * 4 + 2 * 4; ++j) {
                p2Attributes.color.values.push(colors[j]);
              }
            }
            if (defined(texCoords)) {
              var s0 = Cartesian2.fromArray(texCoords, i0 * 2, cartesian2Scratch0);
              var s3 = Cartesian2.fromArray(texCoords, (i + 3) * 2, cartesian2Scratch1);
              var sx = CesiumMath.lerp(s0.x, s3.x, t);
              for (j = i0 * 2; j < i0 * 2 + 2 * 2; ++j) {
                p0Attributes.st.values.push(texCoords[j]);
              }
              p0Attributes.st.values.push(sx, s0.y);
              p0Attributes.st.values.push(sx, s3.y);
              p2Attributes.st.values.push(sx, s0.y);
              p2Attributes.st.values.push(sx, s3.y);
              for (j = i2 * 2; j < i2 * 2 + 2 * 2; ++j) {
                p2Attributes.st.values.push(texCoords[j]);
              }
            }
            index = p0Attributes.position.values.length / 3 - 4;
            p0Indices.push(index, index + 2, index + 1);
            p0Indices.push(index + 1, index + 2, index + 3);
            index = p2Attributes.position.values.length / 3 - 4;
            p2Indices.push(index, index + 2, index + 1);
            p2Indices.push(index + 1, index + 2, index + 3);
          } else {
            var currentAttributes;
            var currentIndices;
            if (p0.y < 0.0) {
              currentAttributes = westGeometry.attributes;
              currentIndices = westGeometry.indices;
            } else {
              currentAttributes = eastGeometry.attributes;
              currentIndices = eastGeometry.indices;
            }
            currentAttributes.position.values.push(p0.x, p0.y, p0.z);
            currentAttributes.position.values.push(p1.x, p1.y, p1.z);
            currentAttributes.position.values.push(p2.x, p2.y, p2.z);
            currentAttributes.position.values.push(p3.x, p3.y, p3.z);
            for (j = i * 3; j < i * 3 + 4 * 3; ++j) {
              currentAttributes.prevPosition.values.push(prevPositions[j]);
              currentAttributes.nextPosition.values.push(nextPositions[j]);
            }
            for (j = i * 2; j < i * 2 + 4 * 2; ++j) {
              currentAttributes.expandAndWidth.values.push(expandAndWidths[j]);
              if (defined(texCoords)) {
                currentAttributes.st.values.push(texCoords[j]);
              }
            }
            if (defined(colors)) {
              for (j = i * 4; j < i * 4 + 4 * 4; ++j) {
                currentAttributes.color.values.push(colors[j]);
              }
            }
            index = currentAttributes.position.values.length / 3 - 4;
            currentIndices.push(index, index + 2, index + 1);
            currentIndices.push(index + 1, index + 2, index + 3);
          }
        }
        updateInstanceAfterSplit(instance, westGeometry, eastGeometry);
      }
      GeometryPipeline.splitLongitude = function(instance) {
        if (!defined(instance)) {
          throw new DeveloperError('instance is required.');
        }
        var geometry = instance.geometry;
        var boundingSphere = geometry.boundingSphere;
        if (defined(boundingSphere)) {
          var minX = boundingSphere.center.x - boundingSphere.radius;
          if (minX > 0 || BoundingSphere.intersectPlane(boundingSphere, Plane.ORIGIN_ZX_PLANE) !== Intersect.INTERSECTING) {
            return instance;
          }
        }
        if (geometry.geometryType !== GeometryType.NONE) {
          switch (geometry.geometryType) {
            case GeometryType.POLYLINES:
              splitLongitudePolyline(instance);
              break;
            case GeometryType.TRIANGLES:
              splitLongitudeTriangles(instance);
              break;
            case GeometryType.LINES:
              splitLongitudeLines(instance);
              break;
          }
        } else {
          indexPrimitive(geometry);
          if (geometry.primitiveType === PrimitiveType.TRIANGLES) {
            splitLongitudeTriangles(instance);
          } else if (geometry.primitiveType === PrimitiveType.LINES) {
            splitLongitudeLines(instance);
          }
        }
        return instance;
      };
      return GeometryPipeline;
    });
    define('Core/WebMercatorProjection', ['./Cartesian3', './Cartographic', './defaultValue', './defined', './defineProperties', './DeveloperError', './Ellipsoid', './Math'], function(Cartesian3, Cartographic, defaultValue, defined, defineProperties, DeveloperError, Ellipsoid, CesiumMath) {
      'use strict';
      function WebMercatorProjection(ellipsoid) {
        this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        this._semimajorAxis = this._ellipsoid.maximumRadius;
        this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
      }
      defineProperties(WebMercatorProjection.prototype, {ellipsoid: {get: function() {
            return this._ellipsoid;
          }}});
      WebMercatorProjection.mercatorAngleToGeodeticLatitude = function(mercatorAngle) {
        return CesiumMath.PI_OVER_TWO - (2.0 * Math.atan(Math.exp(-mercatorAngle)));
      };
      WebMercatorProjection.geodeticLatitudeToMercatorAngle = function(latitude) {
        if (latitude > WebMercatorProjection.MaximumLatitude) {
          latitude = WebMercatorProjection.MaximumLatitude;
        } else if (latitude < -WebMercatorProjection.MaximumLatitude) {
          latitude = -WebMercatorProjection.MaximumLatitude;
        }
        var sinLatitude = Math.sin(latitude);
        return 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
      };
      WebMercatorProjection.MaximumLatitude = WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI);
      WebMercatorProjection.prototype.project = function(cartographic, result) {
        var semimajorAxis = this._semimajorAxis;
        var x = cartographic.longitude * semimajorAxis;
        var y = WebMercatorProjection.geodeticLatitudeToMercatorAngle(cartographic.latitude) * semimajorAxis;
        var z = cartographic.height;
        if (!defined(result)) {
          return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
      };
      WebMercatorProjection.prototype.unproject = function(cartesian, result) {
        if (!defined(cartesian)) {
          throw new DeveloperError('cartesian is required');
        }
        var oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
        var longitude = cartesian.x * oneOverEarthSemimajorAxis;
        var latitude = WebMercatorProjection.mercatorAngleToGeodeticLatitude(cartesian.y * oneOverEarthSemimajorAxis);
        var height = cartesian.z;
        if (!defined(result)) {
          return new Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
      };
      return WebMercatorProjection;
    });
    define('Scene/PrimitivePipeline', ['../Core/BoundingSphere', '../Core/Color', '../Core/ComponentDatatype', '../Core/defaultValue', '../Core/defined', '../Core/DeveloperError', '../Core/Ellipsoid', '../Core/FeatureDetection', '../Core/GeographicProjection', '../Core/Geometry', '../Core/GeometryAttribute', '../Core/GeometryAttributes', '../Core/GeometryPipeline', '../Core/IndexDatatype', '../Core/Matrix4', '../Core/WebMercatorProjection'], function(BoundingSphere, Color, ComponentDatatype, defaultValue, defined, DeveloperError, Ellipsoid, FeatureDetection, GeographicProjection, Geometry, GeometryAttribute, GeometryAttributes, GeometryPipeline, IndexDatatype, Matrix4, WebMercatorProjection) {
      'use strict';
      if (!FeatureDetection.supportsTypedArrays()) {
        return {};
      }
      function transformToWorldCoordinates(instances, primitiveModelMatrix, scene3DOnly) {
        var toWorld = !scene3DOnly;
        var length = instances.length;
        var i;
        if (!toWorld && (length > 1)) {
          var modelMatrix = instances[0].modelMatrix;
          for (i = 1; i < length; ++i) {
            if (!Matrix4.equals(modelMatrix, instances[i].modelMatrix)) {
              toWorld = true;
              break;
            }
          }
        }
        if (toWorld) {
          for (i = 0; i < length; ++i) {
            GeometryPipeline.transformToWorldCoordinates(instances[i]);
          }
        } else {
          Matrix4.multiplyTransformation(primitiveModelMatrix, instances[0].modelMatrix, primitiveModelMatrix);
        }
      }
      function addGeometryPickColor(geometry, pickColor) {
        var attributes = geometry.attributes;
        var positionAttr = attributes.position;
        var numberOfComponents = 4 * (positionAttr.values.length / positionAttr.componentsPerAttribute);
        attributes.pickColor = new GeometryAttribute({
          componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
          componentsPerAttribute: 4,
          normalize: true,
          values: new Uint8Array(numberOfComponents)
        });
        var red = Color.floatToByte(pickColor.red);
        var green = Color.floatToByte(pickColor.green);
        var blue = Color.floatToByte(pickColor.blue);
        var alpha = Color.floatToByte(pickColor.alpha);
        var values = attributes.pickColor.values;
        for (var j = 0; j < numberOfComponents; j += 4) {
          values[j] = red;
          values[j + 1] = green;
          values[j + 2] = blue;
          values[j + 3] = alpha;
        }
      }
      function addPickColorAttribute(instances, pickIds) {
        var length = instances.length;
        for (var i = 0; i < length; ++i) {
          var instance = instances[i];
          var pickColor = pickIds[i];
          if (defined(instance.geometry)) {
            addGeometryPickColor(instance.geometry, pickColor);
          } else {
            addGeometryPickColor(instance.westHemisphereGeometry, pickColor);
            addGeometryPickColor(instance.eastHemisphereGeometry, pickColor);
          }
        }
      }
      function getCommonPerInstanceAttributeNames(instances) {
        var length = instances.length;
        var attributesInAllInstances = [];
        var attributes0 = instances[0].attributes;
        var name;
        for (name in attributes0) {
          if (attributes0.hasOwnProperty(name)) {
            var attribute = attributes0[name];
            var inAllInstances = true;
            for (var i = 1; i < length; ++i) {
              var otherAttribute = instances[i].attributes[name];
              if (!defined(otherAttribute) || (attribute.componentDatatype !== otherAttribute.componentDatatype) || (attribute.componentsPerAttribute !== otherAttribute.componentsPerAttribute) || (attribute.normalize !== otherAttribute.normalize)) {
                inAllInstances = false;
                break;
              }
            }
            if (inAllInstances) {
              attributesInAllInstances.push(name);
            }
          }
        }
        return attributesInAllInstances;
      }
      function addPerInstanceAttributesToGeometry(instanceAttributes, geometry, names) {
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        var namesLength = names.length;
        for (var j = 0; j < namesLength; ++j) {
          var name = names[j];
          var attribute = instanceAttributes[name];
          var componentDatatype = attribute.componentDatatype;
          var value = attribute.value;
          var componentsPerAttribute = value.length;
          var buffer = ComponentDatatype.createTypedArray(componentDatatype, numberOfVertices * componentsPerAttribute);
          for (var k = 0; k < numberOfVertices; ++k) {
            buffer.set(value, k * componentsPerAttribute);
          }
          geometry.attributes[name] = new GeometryAttribute({
            componentDatatype: componentDatatype,
            componentsPerAttribute: componentsPerAttribute,
            normalize: attribute.normalize,
            values: buffer
          });
        }
      }
      function addPerInstanceAttributes(instances, names) {
        var length = instances.length;
        for (var i = 0; i < length; ++i) {
          var instance = instances[i];
          var instanceAttributes = instance.attributes;
          if (defined(instance.geometry)) {
            addPerInstanceAttributesToGeometry(instanceAttributes, instance.geometry, names);
          } else {
            addPerInstanceAttributesToGeometry(instanceAttributes, instance.westHemisphereGeometry, names);
            addPerInstanceAttributesToGeometry(instanceAttributes, instance.eastHemisphereGeometry, names);
          }
        }
      }
      function geometryPipeline(parameters) {
        var instances = parameters.instances;
        var pickIds = parameters.pickIds;
        var projection = parameters.projection;
        var uintIndexSupport = parameters.elementIndexUintSupported;
        var scene3DOnly = parameters.scene3DOnly;
        var allowPicking = parameters.allowPicking;
        var vertexCacheOptimize = parameters.vertexCacheOptimize;
        var compressVertices = parameters.compressVertices;
        var modelMatrix = parameters.modelMatrix;
        var i;
        var geometry;
        var length = instances.length;
        var primitiveType = instances[0].geometry.primitiveType;
        for (i = 1; i < length; ++i) {
          if (instances[i].geometry.primitiveType !== primitiveType) {
            throw new DeveloperError('All instance geometries must have the same primitiveType.');
          }
        }
        transformToWorldCoordinates(instances, modelMatrix, scene3DOnly);
        if (!scene3DOnly) {
          for (i = 0; i < length; ++i) {
            GeometryPipeline.splitLongitude(instances[i]);
          }
        }
        if (allowPicking) {
          addPickColorAttribute(instances, pickIds);
        }
        var perInstanceAttributeNames = getCommonPerInstanceAttributeNames(instances);
        addPerInstanceAttributes(instances, perInstanceAttributeNames);
        if (vertexCacheOptimize) {
          for (i = 0; i < length; ++i) {
            var instance = instances[i];
            if (defined(instance.geometry)) {
              GeometryPipeline.reorderForPostVertexCache(instance.geometry);
              GeometryPipeline.reorderForPreVertexCache(instance.geometry);
            } else {
              GeometryPipeline.reorderForPostVertexCache(instance.westHemisphereGeometry);
              GeometryPipeline.reorderForPreVertexCache(instance.westHemisphereGeometry);
              GeometryPipeline.reorderForPostVertexCache(instance.eastHemisphereGeometry);
              GeometryPipeline.reorderForPreVertexCache(instance.eastHemisphereGeometry);
            }
          }
        }
        var geometries = GeometryPipeline.combineInstances(instances);
        length = geometries.length;
        for (i = 0; i < length; ++i) {
          geometry = geometries[i];
          var attributes = geometry.attributes;
          var name;
          if (!scene3DOnly) {
            for (name in attributes) {
              if (attributes.hasOwnProperty(name) && attributes[name].componentDatatype === ComponentDatatype.DOUBLE) {
                var name3D = name + '3D';
                var name2D = name + '2D';
                GeometryPipeline.projectTo2D(geometry, name, name3D, name2D, projection);
                if (defined(geometry.boundingSphere) && name === 'position') {
                  geometry.boundingSphereCV = BoundingSphere.fromVertices(geometry.attributes.position2D.values);
                }
                GeometryPipeline.encodeAttribute(geometry, name3D, name3D + 'High', name3D + 'Low');
                GeometryPipeline.encodeAttribute(geometry, name2D, name2D + 'High', name2D + 'Low');
              }
            }
          } else {
            for (name in attributes) {
              if (attributes.hasOwnProperty(name) && attributes[name].componentDatatype === ComponentDatatype.DOUBLE) {
                GeometryPipeline.encodeAttribute(geometry, name, name + '3DHigh', name + '3DLow');
              }
            }
          }
          if (compressVertices) {
            GeometryPipeline.compressVertices(geometry);
          }
        }
        if (!uintIndexSupport) {
          var splitGeometries = [];
          length = geometries.length;
          for (i = 0; i < length; ++i) {
            geometry = geometries[i];
            splitGeometries = splitGeometries.concat(GeometryPipeline.fitToUnsignedShortIndices(geometry));
          }
          geometries = splitGeometries;
        }
        return geometries;
      }
      function createPerInstanceVAAttributes(geometry, attributeLocations, names) {
        var vaAttributes = [];
        var attributes = geometry.attributes;
        var length = names.length;
        for (var i = 0; i < length; ++i) {
          var name = names[i];
          var attribute = attributes[name];
          var componentDatatype = attribute.componentDatatype;
          if (componentDatatype === ComponentDatatype.DOUBLE) {
            componentDatatype = ComponentDatatype.FLOAT;
          }
          var typedArray = ComponentDatatype.createTypedArray(componentDatatype, attribute.values);
          vaAttributes.push({
            index: attributeLocations[name],
            componentDatatype: componentDatatype,
            componentsPerAttribute: attribute.componentsPerAttribute,
            normalize: attribute.normalize,
            values: typedArray
          });
          delete attributes[name];
        }
        return vaAttributes;
      }
      function computePerInstanceAttributeLocationsForGeometry(instanceIndex, geometry, instanceAttributes, names, attributeLocations, vertexArrays, indices, offsets, vaIndices) {
        var numberOfVertices = Geometry.computeNumberOfVertices(geometry);
        if (!defined(indices[instanceIndex])) {
          indices[instanceIndex] = {
            boundingSphere: geometry.boundingSphere,
            boundingSphereCV: geometry.boundingSphereCV
          };
        }
        var namesLength = names.length;
        for (var j = 0; j < namesLength; ++j) {
          var name = names[j];
          var index = attributeLocations[name];
          var tempVertexCount = numberOfVertices;
          while (tempVertexCount > 0) {
            var vaIndex = defaultValue(vaIndices[name], 0);
            var va = vertexArrays[vaIndex];
            var vaLength = va.length;
            var attribute;
            for (var k = 0; k < vaLength; ++k) {
              attribute = va[k];
              if (attribute.index === index) {
                break;
              }
            }
            if (!defined(indices[instanceIndex][name])) {
              indices[instanceIndex][name] = {
                dirty: false,
                valid: true,
                value: instanceAttributes[name].value,
                indices: []
              };
            }
            var size = attribute.values.length / attribute.componentsPerAttribute;
            var offset = defaultValue(offsets[name], 0);
            var count;
            if (offset + tempVertexCount < size) {
              count = tempVertexCount;
              indices[instanceIndex][name].indices.push({
                attribute: attribute,
                offset: offset,
                count: count
              });
              offsets[name] = offset + tempVertexCount;
            } else {
              count = size - offset;
              indices[instanceIndex][name].indices.push({
                attribute: attribute,
                offset: offset,
                count: count
              });
              offsets[name] = 0;
              vaIndices[name] = vaIndex + 1;
            }
            tempVertexCount -= count;
          }
        }
      }
      function computePerInstanceAttributeLocations(instances, invalidInstances, vertexArrays, attributeLocations, names) {
        var indices = [];
        var length = instances.length;
        var offsets = {};
        var vaIndices = {};
        var i;
        var instance;
        var attributes;
        for (i = 0; i < length; ++i) {
          instance = instances[i];
          attributes = instance.attributes;
          if (defined(instance.geometry)) {
            computePerInstanceAttributeLocationsForGeometry(i, instance.geometry, attributes, names, attributeLocations, vertexArrays, indices, offsets, vaIndices);
          }
        }
        for (i = 0; i < length; ++i) {
          instance = instances[i];
          attributes = instance.attributes;
          if (defined(instance.westHemisphereGeometry)) {
            computePerInstanceAttributeLocationsForGeometry(i, instance.westHemisphereGeometry, attributes, names, attributeLocations, vertexArrays, indices, offsets, vaIndices);
          }
        }
        for (i = 0; i < length; ++i) {
          instance = instances[i];
          attributes = instance.attributes;
          if (defined(instance.eastHemisphereGeometry)) {
            computePerInstanceAttributeLocationsForGeometry(i, instance.eastHemisphereGeometry, attributes, names, attributeLocations, vertexArrays, indices, offsets, vaIndices);
          }
        }
        length = invalidInstances.length;
        for (i = 0; i < length; ++i) {
          instance = invalidInstances[i];
          attributes = instance.attributes;
          var instanceAttributes = {};
          indices.push(instanceAttributes);
          var namesLength = names.length;
          for (var j = 0; j < namesLength; ++j) {
            var name = names[j];
            instanceAttributes[name] = {
              dirty: false,
              valid: false,
              value: attributes[name].value,
              indices: []
            };
          }
        }
        return indices;
      }
      function createPickOffsets(instances, geometryName, geometries, pickOffsets) {
        var offset;
        var indexCount;
        var geometryIndex;
        var offsetIndex = pickOffsets.length - 1;
        if (offsetIndex >= 0) {
          var pickOffset = pickOffsets[offsetIndex];
          offset = pickOffset.offset + pickOffset.count;
          geometryIndex = pickOffset.index;
          indexCount = geometries[geometryIndex].indices.length;
        } else {
          offset = 0;
          geometryIndex = 0;
          indexCount = geometries[geometryIndex].indices.length;
        }
        var length = instances.length;
        for (var i = 0; i < length; ++i) {
          var instance = instances[i];
          var geometry = instance[geometryName];
          if (!defined(geometry)) {
            continue;
          }
          var count = geometry.indices.length;
          if (offset + count > indexCount) {
            offset = 0;
            indexCount = geometries[++geometryIndex].indices.length;
          }
          pickOffsets.push({
            index: geometryIndex,
            offset: offset,
            count: count
          });
          offset += count;
        }
      }
      function createInstancePickOffsets(instances, geometries) {
        var pickOffsets = [];
        createPickOffsets(instances, 'geometry', geometries, pickOffsets);
        createPickOffsets(instances, 'westHemisphereGeometry', geometries, pickOffsets);
        createPickOffsets(instances, 'eastHemisphereGeometry', geometries, pickOffsets);
        return pickOffsets;
      }
      var PrimitivePipeline = {};
      PrimitivePipeline.combineGeometry = function(parameters) {
        var geometries;
        var attributeLocations;
        var perInstanceAttributes;
        var perInstanceAttributeNames;
        var length;
        var instances = parameters.instances;
        var invalidInstances = parameters.invalidInstances;
        if (instances.length > 0) {
          geometries = geometryPipeline(parameters);
          attributeLocations = GeometryPipeline.createAttributeLocations(geometries[0]);
          perInstanceAttributeNames = getCommonPerInstanceAttributeNames(instances);
          perInstanceAttributes = [];
          length = geometries.length;
          for (var i = 0; i < length; ++i) {
            var geometry = geometries[i];
            perInstanceAttributes.push(createPerInstanceVAAttributes(geometry, attributeLocations, perInstanceAttributeNames));
          }
        }
        perInstanceAttributeNames = defined(perInstanceAttributeNames) ? perInstanceAttributeNames : getCommonPerInstanceAttributeNames(invalidInstances);
        var indices = computePerInstanceAttributeLocations(instances, invalidInstances, perInstanceAttributes, attributeLocations, perInstanceAttributeNames);
        var pickOffsets;
        if (parameters.createPickOffsets && defined(geometries)) {
          pickOffsets = createInstancePickOffsets(instances, geometries);
        }
        return {
          geometries: geometries,
          modelMatrix: parameters.modelMatrix,
          attributeLocations: attributeLocations,
          vaAttributes: perInstanceAttributes,
          vaAttributeLocations: indices,
          validInstancesIndices: parameters.validInstancesIndices,
          invalidInstancesIndices: parameters.invalidInstancesIndices,
          pickOffsets: pickOffsets
        };
      };
      function transferGeometry(geometry, transferableObjects) {
        var attributes = geometry.attributes;
        for (var name in attributes) {
          if (attributes.hasOwnProperty(name)) {
            var attribute = attributes[name];
            if (defined(attribute) && defined(attribute.values)) {
              transferableObjects.push(attribute.values.buffer);
            }
          }
        }
        if (defined(geometry.indices)) {
          transferableObjects.push(geometry.indices.buffer);
        }
      }
      function transferGeometries(geometries, transferableObjects) {
        var length = geometries.length;
        for (var i = 0; i < length; ++i) {
          transferGeometry(geometries[i], transferableObjects);
        }
      }
      function transferPerInstanceAttributes(perInstanceAttributes, transferableObjects) {
        var length = perInstanceAttributes.length;
        for (var i = 0; i < length; ++i) {
          var vaAttributes = perInstanceAttributes[i];
          var vaLength = vaAttributes.length;
          for (var j = 0; j < vaLength; ++j) {
            transferableObjects.push(vaAttributes[j].values.buffer);
          }
        }
      }
      function countCreateGeometryResults(items) {
        var count = 1;
        var length = items.length;
        for (var i = 0; i < length; i++) {
          var geometry = items[i];
          ++count;
          if (!defined(geometry)) {
            continue;
          }
          var attributes = geometry.attributes;
          count += 6 + 2 * BoundingSphere.packedLength + (defined(geometry.indices) ? geometry.indices.length : 0);
          for (var property in attributes) {
            if (attributes.hasOwnProperty(property) && defined(attributes[property])) {
              var attribute = attributes[property];
              count += 5 + attribute.values.length;
            }
          }
        }
        return count;
      }
      PrimitivePipeline.packCreateGeometryResults = function(items, transferableObjects) {
        var packedData = new Float64Array(countCreateGeometryResults(items));
        var stringTable = [];
        var stringHash = {};
        var length = items.length;
        var count = 0;
        packedData[count++] = length;
        for (var i = 0; i < length; i++) {
          var geometry = items[i];
          var validGeometry = defined(geometry);
          packedData[count++] = validGeometry ? 1.0 : 0.0;
          if (!validGeometry) {
            continue;
          }
          packedData[count++] = geometry.primitiveType;
          packedData[count++] = geometry.geometryType;
          var validBoundingSphere = defined(geometry.boundingSphere) ? 1.0 : 0.0;
          packedData[count++] = validBoundingSphere;
          if (validBoundingSphere) {
            BoundingSphere.pack(geometry.boundingSphere, packedData, count);
          }
          count += BoundingSphere.packedLength;
          var validBoundingSphereCV = defined(geometry.boundingSphereCV) ? 1.0 : 0.0;
          packedData[count++] = validBoundingSphereCV;
          if (validBoundingSphereCV) {
            BoundingSphere.pack(geometry.boundingSphereCV, packedData, count);
          }
          count += BoundingSphere.packedLength;
          var attributes = geometry.attributes;
          var attributesToWrite = [];
          for (var property in attributes) {
            if (attributes.hasOwnProperty(property) && defined(attributes[property])) {
              attributesToWrite.push(property);
              if (!defined(stringHash[property])) {
                stringHash[property] = stringTable.length;
                stringTable.push(property);
              }
            }
          }
          packedData[count++] = attributesToWrite.length;
          for (var q = 0; q < attributesToWrite.length; q++) {
            var name = attributesToWrite[q];
            var attribute = attributes[name];
            packedData[count++] = stringHash[name];
            packedData[count++] = attribute.componentDatatype;
            packedData[count++] = attribute.componentsPerAttribute;
            packedData[count++] = attribute.normalize ? 1 : 0;
            packedData[count++] = attribute.values.length;
            packedData.set(attribute.values, count);
            count += attribute.values.length;
          }
          var indicesLength = defined(geometry.indices) ? geometry.indices.length : 0;
          packedData[count++] = indicesLength;
          if (indicesLength > 0) {
            packedData.set(geometry.indices, count);
            count += indicesLength;
          }
        }
        transferableObjects.push(packedData.buffer);
        return {
          stringTable: stringTable,
          packedData: packedData
        };
      };
      PrimitivePipeline.unpackCreateGeometryResults = function(createGeometryResult) {
        var stringTable = createGeometryResult.stringTable;
        var packedGeometry = createGeometryResult.packedData;
        var i;
        var result = new Array(packedGeometry[0]);
        var resultIndex = 0;
        var packedGeometryIndex = 1;
        while (packedGeometryIndex < packedGeometry.length) {
          var valid = packedGeometry[packedGeometryIndex++] === 1.0;
          if (!valid) {
            result[resultIndex++] = undefined;
            continue;
          }
          var primitiveType = packedGeometry[packedGeometryIndex++];
          var geometryType = packedGeometry[packedGeometryIndex++];
          var boundingSphere;
          var boundingSphereCV;
          var validBoundingSphere = packedGeometry[packedGeometryIndex++] === 1.0;
          if (validBoundingSphere) {
            boundingSphere = BoundingSphere.unpack(packedGeometry, packedGeometryIndex);
          }
          packedGeometryIndex += BoundingSphere.packedLength;
          var validBoundingSphereCV = packedGeometry[packedGeometryIndex++] === 1.0;
          if (validBoundingSphereCV) {
            boundingSphereCV = BoundingSphere.unpack(packedGeometry, packedGeometryIndex);
          }
          packedGeometryIndex += BoundingSphere.packedLength;
          var length;
          var values;
          var componentsPerAttribute;
          var attributes = new GeometryAttributes();
          var numAttributes = packedGeometry[packedGeometryIndex++];
          for (i = 0; i < numAttributes; i++) {
            var name = stringTable[packedGeometry[packedGeometryIndex++]];
            var componentDatatype = packedGeometry[packedGeometryIndex++];
            componentsPerAttribute = packedGeometry[packedGeometryIndex++];
            var normalize = packedGeometry[packedGeometryIndex++] !== 0;
            length = packedGeometry[packedGeometryIndex++];
            values = ComponentDatatype.createTypedArray(componentDatatype, length);
            for (var valuesIndex = 0; valuesIndex < length; valuesIndex++) {
              values[valuesIndex] = packedGeometry[packedGeometryIndex++];
            }
            attributes[name] = new GeometryAttribute({
              componentDatatype: componentDatatype,
              componentsPerAttribute: componentsPerAttribute,
              normalize: normalize,
              values: values
            });
          }
          var indices;
          length = packedGeometry[packedGeometryIndex++];
          if (length > 0) {
            var numberOfVertices = values.length / componentsPerAttribute;
            indices = IndexDatatype.createTypedArray(numberOfVertices, length);
            for (i = 0; i < length; i++) {
              indices[i] = packedGeometry[packedGeometryIndex++];
            }
          }
          result[resultIndex++] = new Geometry({
            primitiveType: primitiveType,
            geometryType: geometryType,
            boundingSphere: boundingSphere,
            indices: indices,
            attributes: attributes
          });
        }
        return result;
      };
      function packPickIds(pickIds, transferableObjects) {
        var length = pickIds.length;
        var packedPickIds = new Uint32Array(pickIds.length);
        for (var i = 0; i < length; ++i) {
          packedPickIds[i] = pickIds[i].toRgba();
        }
        transferableObjects.push(packedPickIds.buffer);
        return packedPickIds;
      }
      function unpackPickIds(packedPickIds) {
        var length = packedPickIds.length;
        var pickIds = new Array(length);
        for (var i = 0; i < length; i++) {
          pickIds[i] = Color.fromRgba(packedPickIds[i]);
        }
        return pickIds;
      }
      function countInstancesForCombine(instances) {
        var length = instances.length;
        var count = 1 + (length * 17);
        for (var i = 0; i < length; i++) {
          var attributes = instances[i].attributes;
          for (var property in attributes) {
            if (attributes.hasOwnProperty(property) && defined(attributes[property])) {
              var attribute = attributes[property];
              count += 5 + attribute.value.length;
            }
          }
        }
        return count;
      }
      function packInstancesForCombine(instances, transferableObjects) {
        var packedData = new Float64Array(countInstancesForCombine(instances));
        var stringHash = {};
        var stringTable = [];
        var length = instances.length;
        var count = 0;
        packedData[count++] = length;
        for (var i = 0; i < length; i++) {
          var instance = instances[i];
          Matrix4.pack(instance.modelMatrix, packedData, count);
          count += Matrix4.packedLength;
          var attributes = instance.attributes;
          var attributesToWrite = [];
          for (var property in attributes) {
            if (attributes.hasOwnProperty(property) && defined(attributes[property])) {
              attributesToWrite.push(property);
              if (!defined(stringHash[property])) {
                stringHash[property] = stringTable.length;
                stringTable.push(property);
              }
            }
          }
          packedData[count++] = attributesToWrite.length;
          for (var q = 0; q < attributesToWrite.length; q++) {
            var name = attributesToWrite[q];
            var attribute = attributes[name];
            packedData[count++] = stringHash[name];
            packedData[count++] = attribute.componentDatatype;
            packedData[count++] = attribute.componentsPerAttribute;
            packedData[count++] = attribute.normalize;
            packedData[count++] = attribute.value.length;
            packedData.set(attribute.value, count);
            count += attribute.value.length;
          }
        }
        transferableObjects.push(packedData.buffer);
        return {
          stringTable: stringTable,
          packedData: packedData
        };
      }
      function unpackInstancesForCombine(data) {
        var packedInstances = data.packedData;
        var stringTable = data.stringTable;
        var result = new Array(packedInstances[0]);
        var count = 0;
        var i = 1;
        while (i < packedInstances.length) {
          var modelMatrix = Matrix4.unpack(packedInstances, i);
          i += Matrix4.packedLength;
          var attributes = {};
          var numAttributes = packedInstances[i++];
          for (var x = 0; x < numAttributes; x++) {
            var name = stringTable[packedInstances[i++]];
            var componentDatatype = packedInstances[i++];
            var componentsPerAttribute = packedInstances[i++];
            var normalize = packedInstances[i++] !== 0;
            var length = packedInstances[i++];
            var value = ComponentDatatype.createTypedArray(componentDatatype, length);
            for (var valueIndex = 0; valueIndex < length; valueIndex++) {
              value[valueIndex] = packedInstances[i++];
            }
            attributes[name] = {
              componentDatatype: componentDatatype,
              componentsPerAttribute: componentsPerAttribute,
              normalize: normalize,
              value: value
            };
          }
          result[count++] = {
            attributes: attributes,
            modelMatrix: modelMatrix
          };
        }
        return result;
      }
      function countAttributeLocations(attributeLocations) {
        var length = attributeLocations.length;
        var count = 1 + length;
        for (var i = 0; i < length; i++) {
          var instance = attributeLocations[i];
          count += 2;
          count += defined(instance.boundingSphere) ? BoundingSphere.packedLength : 0.0;
          count += defined(instance.boundingSphereCV) ? BoundingSphere.packedLength : 0.0;
          for (var propertyName in instance) {
            if (instance.hasOwnProperty(propertyName) && defined(instance[propertyName]) && propertyName !== 'boundingSphere' && propertyName !== 'boundingSphereCV') {
              var property = instance[propertyName];
              count += 4 + (property.indices.length * 3) + property.value.length;
            }
          }
        }
        return count;
      }
      function packAttributeLocations(attributeLocations, transferableObjects) {
        var packedData = new Float64Array(countAttributeLocations(attributeLocations));
        var stringTable = [];
        var attributeTable = [];
        var stringHash = {};
        var length = attributeLocations.length;
        var count = 0;
        packedData[count++] = length;
        for (var i = 0; i < length; i++) {
          var instance = attributeLocations[i];
          var boundingSphere = instance.boundingSphere;
          var hasBoundingSphere = defined(boundingSphere);
          packedData[count++] = hasBoundingSphere ? 1.0 : 0.0;
          if (hasBoundingSphere) {
            BoundingSphere.pack(boundingSphere, packedData, count);
            count += BoundingSphere.packedLength;
          }
          boundingSphere = instance.boundingSphereCV;
          hasBoundingSphere = defined(boundingSphere);
          packedData[count++] = hasBoundingSphere ? 1.0 : 0.0;
          if (hasBoundingSphere) {
            BoundingSphere.pack(boundingSphere, packedData, count);
            count += BoundingSphere.packedLength;
          }
          var propertiesToWrite = [];
          for (var propertyName in instance) {
            if (instance.hasOwnProperty(propertyName) && defined(instance[propertyName]) && propertyName !== 'boundingSphere' && propertyName !== 'boundingSphereCV') {
              propertiesToWrite.push(propertyName);
              if (!defined(stringHash[propertyName])) {
                stringHash[propertyName] = stringTable.length;
                stringTable.push(propertyName);
              }
            }
          }
          packedData[count++] = propertiesToWrite.length;
          for (var q = 0; q < propertiesToWrite.length; q++) {
            var name = propertiesToWrite[q];
            var property = instance[name];
            packedData[count++] = stringHash[name];
            packedData[count++] = property.valid ? 1.0 : 0.0;
            var indices = property.indices;
            var indicesLength = indices.length;
            packedData[count++] = indicesLength;
            for (var x = 0; x < indicesLength; x++) {
              var index = indices[x];
              packedData[count++] = index.count;
              packedData[count++] = index.offset;
              var tableIndex = attributeTable.indexOf(index.attribute);
              if (tableIndex === -1) {
                tableIndex = attributeTable.length;
                attributeTable.push(index.attribute);
              }
              packedData[count++] = tableIndex;
            }
            packedData[count++] = property.value.length;
            packedData.set(property.value, count);
            count += property.value.length;
          }
        }
        transferableObjects.push(packedData.buffer);
        return {
          stringTable: stringTable,
          packedData: packedData,
          attributeTable: attributeTable
        };
      }
      function unpackAttributeLocations(packedAttributeLocations, vaAttributes) {
        var stringTable = packedAttributeLocations.stringTable;
        var attributeTable = packedAttributeLocations.attributeTable;
        var packedData = packedAttributeLocations.packedData;
        var attributeLocations = new Array(packedData[0]);
        var attributeLocationsIndex = 0;
        var i = 1;
        var packedDataLength = packedData.length;
        while (i < packedDataLength) {
          var instance = {};
          var hasBoundingSphere = packedData[i++] === 1.0;
          if (hasBoundingSphere) {
            instance.boundingSphere = BoundingSphere.unpack(packedData, i);
            i += BoundingSphere.packedLength;
          }
          hasBoundingSphere = packedData[i++] === 1.0;
          if (hasBoundingSphere) {
            instance.boundingSphereCV = BoundingSphere.unpack(packedData, i);
            i += BoundingSphere.packedLength;
          }
          var numAttributes = packedData[i++];
          for (var x = 0; x < numAttributes; x++) {
            var name = stringTable[packedData[i++]];
            var valid = packedData[i++] === 1.0;
            var indicesLength = packedData[i++];
            var indices = indicesLength > 0 ? new Array(indicesLength) : undefined;
            for (var indicesIndex = 0; indicesIndex < indicesLength; indicesIndex++) {
              var index = {};
              index.count = packedData[i++];
              index.offset = packedData[i++];
              index.attribute = attributeTable[packedData[i++]];
              indices[indicesIndex] = index;
            }
            var valueLength = packedData[i++];
            var value = valid ? ComponentDatatype.createTypedArray(indices[0].attribute.componentDatatype, valueLength) : new Array(valueLength);
            for (var valueIndex = 0; valueIndex < valueLength; valueIndex++) {
              value[valueIndex] = packedData[i++];
            }
            instance[name] = {
              dirty: false,
              valid: valid,
              indices: indices,
              value: value
            };
          }
          attributeLocations[attributeLocationsIndex++] = instance;
        }
        return attributeLocations;
      }
      PrimitivePipeline.packCombineGeometryParameters = function(parameters, transferableObjects) {
        var createGeometryResults = parameters.createGeometryResults;
        var length = createGeometryResults.length;
        for (var i = 0; i < length; i++) {
          transferableObjects.push(createGeometryResults[i].packedData.buffer);
        }
        var packedPickIds;
        if (parameters.allowPicking) {
          packedPickIds = packPickIds(parameters.pickIds, transferableObjects);
        }
        return {
          createGeometryResults: parameters.createGeometryResults,
          packedInstances: packInstancesForCombine(parameters.instances, transferableObjects),
          packedPickIds: packedPickIds,
          ellipsoid: parameters.ellipsoid,
          isGeographic: parameters.projection instanceof GeographicProjection,
          elementIndexUintSupported: parameters.elementIndexUintSupported,
          scene3DOnly: parameters.scene3DOnly,
          allowPicking: parameters.allowPicking,
          vertexCacheOptimize: parameters.vertexCacheOptimize,
          compressVertices: parameters.compressVertices,
          modelMatrix: parameters.modelMatrix,
          createPickOffsets: parameters.createPickOffsets
        };
      };
      PrimitivePipeline.unpackCombineGeometryParameters = function(packedParameters) {
        var instances = unpackInstancesForCombine(packedParameters.packedInstances);
        var allowPicking = packedParameters.allowPicking;
        var pickIds = allowPicking ? unpackPickIds(packedParameters.packedPickIds) : undefined;
        var createGeometryResults = packedParameters.createGeometryResults;
        var length = createGeometryResults.length;
        var instanceIndex = 0;
        var validInstances = [];
        var invalidInstances = [];
        var validInstancesIndices = [];
        var invalidInstancesIndices = [];
        var validPickIds = [];
        for (var resultIndex = 0; resultIndex < length; resultIndex++) {
          var geometries = PrimitivePipeline.unpackCreateGeometryResults(createGeometryResults[resultIndex]);
          var geometriesLength = geometries.length;
          for (var geometryIndex = 0; geometryIndex < geometriesLength; geometryIndex++) {
            var geometry = geometries[geometryIndex];
            var instance = instances[instanceIndex];
            if (defined(geometry)) {
              instance.geometry = geometry;
              validInstances.push(instance);
              validInstancesIndices.push(instanceIndex);
              if (allowPicking) {
                validPickIds.push(pickIds[instanceIndex]);
              }
            } else {
              invalidInstances.push(instance);
              invalidInstancesIndices.push(instanceIndex);
            }
            ++instanceIndex;
          }
        }
        var ellipsoid = Ellipsoid.clone(packedParameters.ellipsoid);
        var projection = packedParameters.isGeographic ? new GeographicProjection(ellipsoid) : new WebMercatorProjection(ellipsoid);
        return {
          instances: validInstances,
          invalidInstances: invalidInstances,
          validInstancesIndices: validInstancesIndices,
          invalidInstancesIndices: invalidInstancesIndices,
          pickIds: validPickIds,
          ellipsoid: ellipsoid,
          projection: projection,
          elementIndexUintSupported: packedParameters.elementIndexUintSupported,
          scene3DOnly: packedParameters.scene3DOnly,
          allowPicking: packedParameters.allowPicking,
          vertexCacheOptimize: packedParameters.vertexCacheOptimize,
          compressVertices: packedParameters.compressVertices,
          modelMatrix: Matrix4.clone(packedParameters.modelMatrix),
          createPickOffsets: packedParameters.createPickOffsets
        };
      };
      PrimitivePipeline.packCombineGeometryResults = function(results, transferableObjects) {
        if (defined(results.geometries)) {
          transferGeometries(results.geometries, transferableObjects);
          transferPerInstanceAttributes(results.vaAttributes, transferableObjects);
        }
        return {
          geometries: results.geometries,
          attributeLocations: results.attributeLocations,
          vaAttributes: results.vaAttributes,
          packedVaAttributeLocations: packAttributeLocations(results.vaAttributeLocations, transferableObjects),
          modelMatrix: results.modelMatrix,
          validInstancesIndices: results.validInstancesIndices,
          invalidInstancesIndices: results.invalidInstancesIndices,
          pickOffsets: results.pickOffsets
        };
      };
      PrimitivePipeline.unpackCombineGeometryResults = function(packedResult) {
        return {
          geometries: packedResult.geometries,
          attributeLocations: packedResult.attributeLocations,
          vaAttributes: packedResult.vaAttributes,
          perInstanceAttributeLocations: unpackAttributeLocations(packedResult.packedVaAttributeLocations, packedResult.vaAttributes),
          modelMatrix: packedResult.modelMatrix,
          pickOffsets: packedResult.pickOffsets
        };
      };
      return PrimitivePipeline;
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
    define('Core/formatError', ['./defined'], function(defined) {
      'use strict';
      function formatError(object) {
        var result;
        var name = object.name;
        var message = object.message;
        if (defined(name) && defined(message)) {
          result = name + ': ' + message;
        } else {
          result = object.toString();
        }
        var stack = object.stack;
        if (defined(stack)) {
          result += '\n' + stack;
        }
        return result;
      }
      return formatError;
    });
    define('Workers/createTaskProcessorWorker', ['../Core/defaultValue', '../Core/defined', '../Core/formatError'], function(defaultValue, defined, formatError) {
      'use strict';
      function createTaskProcessorWorker(workerFunction) {
        var postMessage;
        var transferableObjects = [];
        var responseMessage = {
          id: undefined,
          result: undefined,
          error: undefined
        };
        return function(event) {
          var data = event.data;
          transferableObjects.length = 0;
          responseMessage.id = data.id;
          responseMessage.error = undefined;
          responseMessage.result = undefined;
          try {
            responseMessage.result = workerFunction(data.parameters, transferableObjects);
          } catch (e) {
            if (e instanceof Error) {
              responseMessage.error = {
                name: e.name,
                message: e.message,
                stack: e.stack
              };
            } else {
              responseMessage.error = e;
            }
          }
          if (!defined(postMessage)) {
            postMessage = defaultValue(self.webkitPostMessage, self.postMessage);
          }
          if (!data.canTransferArrayBuffer) {
            transferableObjects.length = 0;
          }
          try {
            postMessage(responseMessage, transferableObjects);
          } catch (e) {
            responseMessage.result = undefined;
            responseMessage.error = 'postMessage failed with error: ' + formatError(e) + '\n  with responseMessage: ' + JSON.stringify(responseMessage);
            postMessage(responseMessage);
          }
        };
      }
      return createTaskProcessorWorker;
    });
    define('Workers/createGeometry', ['../Core/defined', '../Scene/PrimitivePipeline', '../ThirdParty/when', './createTaskProcessorWorker', 'require'], function(defined, PrimitivePipeline, when, createTaskProcessorWorker, require) {
      'use strict';
      var moduleCache = {};
      function getModule(moduleName) {
        var module = moduleCache[moduleName];
        if (!defined(module)) {
          if (typeof exports === 'object') {
            moduleCache[module] = module = require('Workers/' + moduleName);
          } else {
            require(['./' + moduleName], function(f) {
              module = f;
              moduleCache[module] = f;
            });
          }
        }
        return module;
      }
      function createGeometry(parameters, transferableObjects) {
        var subTasks = parameters.subTasks;
        var length = subTasks.length;
        var results = new Array(length);
        for (var i = 0; i < length; i++) {
          var task = subTasks[i];
          var geometry = task.geometry;
          var moduleName = task.moduleName;
          if (defined(moduleName)) {
            var createFunction = getModule(moduleName);
            results[i] = createFunction(geometry, task.offset);
          } else {
            results[i] = geometry;
          }
        }
        return PrimitivePipeline.packCreateGeometryResults(results, transferableObjects);
      }
      return createTaskProcessorWorker(createGeometry);
    });
  }());
})(require('process'));
