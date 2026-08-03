/** Lightweight decorative WebGL2 aurora with a CSS-only fallback. */
export class AtmosphereRenderer {
  private frame = 0;
  private startedAt = 0;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private readonly onVisibility = () => this.sync();
  private readonly onMotionChange = () => this.sync();

  constructor(private readonly canvas: HTMLCanvasElement) {}

  start(): void {
    const gl = this.canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;
    const program = this.createProgram(gl);
    const buffer = gl.createBuffer();
    if (!program || !buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const time = gl.getUniformLocation(program, 'time');
    const resolution = gl.getUniformLocation(program, 'resolution');
    const draw = (now: number) => {
      this.resize(gl);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.uniform1f(time, (now - this.startedAt) / 1000);
      gl.uniform2f(resolution, this.canvas.width, this.canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!document.hidden && !this.reducedMotion.matches) this.frame = requestAnimationFrame(draw);
    };
    this.startedAt = performance.now();
    this.sync = () => {
      cancelAnimationFrame(this.frame);
      if (!document.hidden && !this.reducedMotion.matches) this.frame = requestAnimationFrame(draw);
      else draw(this.startedAt);
    };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.reducedMotion.addEventListener('change', this.onMotionChange);
    this.sync();
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.reducedMotion.removeEventListener('change', this.onMotionChange);
  }

  private sync(): void { /* assigned after WebGL initialization */ }

  private resize(gl: WebGL2RenderingContext): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.round(innerWidth * ratio);
    const height = Math.round(innerHeight * ratio);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.clearColor(0, 0, 0, 0);
    }
  }

  private createProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
    const vertex = `#version 300 es\nin vec2 position; out vec2 uv;\nvoid main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }`;
    const fragment = `#version 300 es\nprecision mediump float; in vec2 uv; out vec4 color; uniform vec2 resolution; uniform float time;\nfloat n(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(n(i),n(i+vec2(1.,0.)),f.x),mix(n(i+vec2(0.,1.)),n(i+vec2(1.,1.)),f.x),f.y);}\nvoid main(){vec2 p=uv;float h=smoothstep(.76,.2,p.y);float r=sin(p.x*8.-time*.14+noise(p*3.+time*.02)*3.)*.055+.54;float e=1.-smoothstep(.0,.18,abs(p.y-r));vec3 c=vec3(.05,.77,1.),b=vec3(.12,.30,1.),v=vec3(.37,.13,.9);vec3 g=mix(v,c,smoothstep(.18,.82,p.x))*e*h;g+=b*pow(max(0.,1.-distance(p,vec2(.64,.48))*1.7),5.);float s=step(.9978,n(floor(p*vec2(340.,190.))))*smoothstep(.68,.05,p.y);color=vec4(g+c*s,clamp(max(max(g.r,g.g),g.b)*.72+s,0.,.64));}`;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex); const fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
  }
}
