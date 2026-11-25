'use strict';

/**
 * GlowRenderer — draws the ambient light with WebGL.
 *
 * Input: a tiny copy of the current video frame (uploaded as a texture).
 * Output: the light for the whole page. For every pixel outside the video,
 * the shader casts a ray from the video's center through that pixel and reads
 * the colors of the video's edge band along that ray. Edge colors are thereby
 * stretched outwards, then darkened with distance ("spread"). The result is
 * blurred by CSS on the (small) canvas and scaled up to the viewport.
 */
(() => {
  const VERTEX_SHADER = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5); // y down
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    varying vec2 vUv;

    uniform sampler2D uFrame;
    uniform vec4 uArea;    // area covered by the canvas, CSS px (x, y, w, h)
    uniform vec4 uVideo;   // video rectangle, CSS px (x, y, w, h)
    uniform float uEdge;   // depth of the sampled edge band (0..0.5 of the video)
    uniform float uSpread; // distance (in video heights) before the light fades
    uniform float uFar;    // brightness kept far away from the video (0..1)

    void main() {
      vec2 px = uArea.xy + vUv * uArea.zw;
      vec2 p = (px - uVideo.xy) / uVideo.zw; // 0..1 inside the video
      vec2 d = p - 0.5;
      float m = max(abs(d.x), abs(d.y));      // 0.5 on the video border

      // Distance outside the video, in video heights.
      vec2 outside = max(max(uVideo.xy - px, px - (uVideo.xy + uVideo.zw)), 0.0);
      float dist = length(outside) / uVideo.w;

      vec3 color;
      if (m <= 0.5) {
        color = texture2D(uFrame, p).rgb; // Hidden behind the video itself.
      } else {
        // Point on the video border along the ray from the center.
        vec2 border = d * (0.5 / m);
        float blurBias = clamp(dist * 3.0, 0.0, 4.0);
        color =
          texture2D(uFrame, 0.5 + border * 0.98, blurBias).rgb * 0.45 +
          texture2D(uFrame, 0.5 + border * (1.0 - uEdge * 0.5), blurBias).rgb * 0.35 +
          texture2D(uFrame, 0.5 + border * (1.0 - uEdge), blurBias + 1.0).rgb * 0.20;
      }

      float fade = mix(1.0, uFar, smoothstep(0.0, uSpread, dist));
      gl_FragColor = vec4(color * fade, 1.0);
    }
  `;

  // The frame texture is a power of two so mipmaps also work with WebGL 1.
  const FRAME_WIDTH = 128;
  const FRAME_HEIGHT = 64;

  class GlowRenderer {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
      this.canvas = canvas;
      this.lost = false;
      this.onContextLost = (event) => {
        event.preventDefault(); // Allows the browser to restore the context.
        this.lost = true;
      };
      this.onContextRestored = () => {
        this.init();
        this.lost = false;
      };
      canvas.addEventListener('webglcontextlost', this.onContextLost);
      canvas.addEventListener('webglcontextrestored', this.onContextRestored);
      this.init();
    }

    static get FRAME_WIDTH() {
      return FRAME_WIDTH;
    }

    static get FRAME_HEIGHT() {
      return FRAME_HEIGHT;
    }

    init() {
      const gl = this.canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power',
      });
      if (!gl) throw new Error('WebGL is not available');
      this.gl = gl;

      const program = gl.createProgram();
      for (const [type, source] of [
        [gl.VERTEX_SHADER, VERTEX_SHADER],
        [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
      ]) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
          throw new Error(`Shader error: ${gl.getShaderInfoLog(shader)}`);
        }
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
        throw new Error(`Program error: ${gl.getProgramInfoLog(program)}`);
      }
      gl.useProgram(program);

      // Full-screen quad (two triangles).
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGB, FRAME_WIDTH, FRAME_HEIGHT, 0, gl.RGB, gl.UNSIGNED_BYTE,
        new Uint8Array(FRAME_WIDTH * FRAME_HEIGHT * 3),
      );
      gl.generateMipmap(gl.TEXTURE_2D);

      this.uniforms = {};
      for (const name of ['uFrame', 'uArea', 'uVideo', 'uEdge', 'uSpread', 'uFar']) {
        this.uniforms[name] = gl.getUniformLocation(program, name);
      }
      gl.uniform1i(this.uniforms.uFrame, 0);
    }

    /** Uploads the downscaled frame (a FRAME_WIDTH × FRAME_HEIGHT canvas). */
    upload(source) {
      if (this.lost) return;
      const { gl } = this;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    /**
     * @param {{area: number[], video: number[], edge: number, spread: number, far: number}} params
     *   area/video: [x, y, width, height] in CSS pixels.
     */
    draw({ area, video, edge, spread, far }) {
      if (this.lost) return;
      const { gl, uniforms } = this;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.uniform4fv(uniforms.uArea, area);
      gl.uniform4fv(uniforms.uVideo, video);
      gl.uniform1f(uniforms.uEdge, edge);
      gl.uniform1f(uniforms.uSpread, spread);
      gl.uniform1f(uniforms.uFar, far);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    destroy() {
      this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
      this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
      this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }

  globalThis.AmbiTube.GlowRenderer = GlowRenderer;
})();
