/* */ 
"format cjs";
(function(process) {
  define(function() {
    'use strict';
    return "/** DOC_TBA\n\
 *\n\
 * @name czm_ellipsoid\n\
 * @glslStruct\n\
 */\n\
struct czm_ellipsoid\n\
{\n\
    vec3 center;\n\
    vec3 radii;\n\
    vec3 inverseRadii;\n\
    vec3 inverseRadiiSquared;\n\
};";
  });
})(require('process'));
