/* */ 
"format cjs";
(function(process) {
  define(function() {
    'use strict';
    return "uniform vec4 highlightColor;\n\
\n\
varying vec3 v_color;\n\
\n\
void main()\n\
{\n\
    gl_FragColor = vec4(v_color * highlightColor.rgb, highlightColor.a);\n\
}\n\
";
  });
})(require('process'));
