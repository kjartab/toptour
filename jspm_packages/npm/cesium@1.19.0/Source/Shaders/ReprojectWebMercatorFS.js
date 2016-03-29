/* */ 
"format cjs";
(function(process) {
  define(function() {
    'use strict';
    return "uniform sampler2D u_texture;\n\
\n\
varying vec2 v_textureCoordinates;\n\
\n\
void main()\n\
{\n\
    gl_FragColor = texture2D(u_texture, v_textureCoordinates);\n\
}\n\
";
  });
})(require('process'));
