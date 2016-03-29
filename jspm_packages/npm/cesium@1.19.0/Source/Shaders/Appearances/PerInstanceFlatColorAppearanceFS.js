/* */ 
"format cjs";
(function(process) {
  define(function() {
    'use strict';
    return "varying vec4 v_color;\n\
\n\
void main()\n\
{\n\
    gl_FragColor = v_color;\n\
}\n\
";
  });
})(require('process'));
