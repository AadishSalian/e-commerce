'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface LiquidShaderImageProps {
  src: string;
  hoverSrc?: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  intensity?: number;
}

// GLSL Vertex Shader
const VS_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    v_uv.y = 1.0 - v_uv.y;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// GLSL Fragment Shader
// Engineered for MATTE brand: highly restrained liquid displacement & subtle surface tension
const FS_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform sampler2D u_texture1;
  uniform sampler2D u_texture2;
  uniform float u_hasTexture2;
  uniform vec2 u_resolution;
  uniform vec2 u_imageResolution1;
  uniform vec2 u_imageResolution2;
  uniform vec2 u_mouse;
  uniform vec2 u_mouseVelocity;
  uniform float u_hover;
  uniform float u_time;
  uniform float u_intensity;

  varying vec2 v_uv;

  vec2 getCoverUv(vec2 uv, vec2 containerRes, vec2 imageRes) {
    if (imageRes.x <= 0.0 || imageRes.y <= 0.0) return uv;
    float containerAspect = containerRes.x / containerRes.y;
    float imageAspect = imageRes.x / imageRes.y;
    vec2 ratio = vec2(
      min(containerAspect / imageAspect, 1.0),
      min((1.0 / containerAspect) / (1.0 / imageAspect), 1.0)
    );
    return vec2(
      uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
  }

  void main() {
    float containerAspect = u_resolution.x / u_resolution.y;
    
    // Normalized vector from mouse cursor with aspect-ratio correction
    vec2 mouseDelta = v_uv - u_mouse;
    vec2 distVec = mouseDelta;
    distVec.x *= containerAspect;
    float dist = length(distVec);

    // Refined falloff radius around cursor
    float radius = 0.45;
    float influence = smoothstep(radius, 0.0, dist);

    // Subtle liquid ripples (two harmonics)
    float wave = sin(dist * 20.0 - u_time * 3.2) * 0.65 + sin(dist * 34.0 - u_time * 4.4) * 0.35;
    
    vec2 dir = normalize(distVec + vec2(0.0001));
    dir.x /= containerAspect;
    dir = normalize(dir + vec2(0.0001));

    // Very subtle displacement: max ~1.2% offset (delicate displacement, never funhouse mirror)
    float dispStrength = wave * influence * (0.013 * u_intensity * u_hover);
    vec2 velocityPush = u_mouseVelocity * influence * (0.02 * u_intensity * u_hover);
    vec2 displacement = dir * dispStrength + velocityPush;

    // Displaced UVs
    vec2 uv1 = clamp(getCoverUv(v_uv + displacement, u_resolution, u_imageResolution1), 0.001, 0.999);

    // Optical chromatic refraction for tactile lens depth
    float ca = 0.0015 * influence * u_hover * u_intensity;
    vec4 col1_r = texture2D(u_texture1, clamp(uv1 + dir * ca, 0.001, 0.999));
    vec4 col1_g = texture2D(u_texture1, uv1);
    vec4 col1_b = texture2D(u_texture1, clamp(uv1 - dir * ca, 0.001, 0.999));
    vec4 col1 = vec4(col1_r.r, col1_g.g, col1_b.b, col1_g.a);

    vec4 finalColor = col1;

    // Smooth liquid morph to hover image if present
    if (u_hasTexture2 > 0.5) {
      vec2 uv2 = clamp(getCoverUv(v_uv + displacement, u_resolution, u_imageResolution2), 0.001, 0.999);
      vec4 col2_r = texture2D(u_texture2, clamp(uv2 + dir * ca, 0.001, 0.999));
      vec4 col2_g = texture2D(u_texture2, uv2);
      vec4 col2_b = texture2D(u_texture2, clamp(uv2 - dir * ca, 0.001, 0.999));
      vec4 col2 = vec4(col2_r.r, col2_g.g, col2_b.b, col2_g.a);

      float blend = smoothstep(0.1, 0.9, u_hover);
      finalColor = mix(col1, col2, blend);
    }

    // Micro matte sheen along ripple crests
    float sheen = pow(max(0.0, wave), 3.5) * influence * u_hover * 0.045;
    finalColor.rgb += vec3(sheen);

    gl_FragColor = finalColor;
  }
`;

// Helper to create shader
function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Global texture cache to prevent reloading across re-renders
const textureImageCache = new Map<string, HTMLImageElement>();

function loadCachedImage(url: string): Promise<HTMLImageElement> {
  if (textureImageCache.has(url)) {
    const cached = textureImageCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      textureImageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function LiquidShaderImage({
  src,
  hoverSrc,
  alt,
  fill = true,
  width,
  height,
  className = '',
  imageClassName = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  placeholder,
  blurDataURL,
  intensity = 1.0,
}: LiquidShaderImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isSupported, setIsSupported] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [canvasOpacity, setCanvasOpacity] = useState(0);

  // Animation & WebGL state
  const stateRef = useRef({
    gl: null as WebGLRenderingContext | null,
    program: null as WebGLProgram | null,
    texture1: null as WebGLTexture | null,
    texture2: null as WebGLTexture | null,
    img1: null as HTMLImageElement | null,
    img2: null as HTMLImageElement | null,
    animFrameId: 0,
    startTime: 0,
    isHovered: false,
    hover: 0,
    targetHover: 0,
    mouse: { x: 0.5, y: 0.5 },
    targetMouse: { x: 0.5, y: 0.5 },
    prevMouse: { x: 0.5, y: 0.5 },
    mouseVelocity: { x: 0, y: 0 },
    uniforms: {} as Record<string, WebGLUniformLocation | null>,
  });

  // Check WebGL and reduced motion on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    // Check pointer hover capability (avoid on pure touch devices)
    const canHover = window.matchMedia('(hover: hover)').matches;
    if (!canHover) return;

    // Test WebGL support
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (gl) {
      setIsSupported(true);
    }
  }, []);

  // WebGL initialization
  const initWebGL = useCallback(async () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return false;

    const gl = canvas.getContext('webgl', { 
      alpha: true, 
      antialias: true, 
      preserveDrawingBuffer: false,
      powerPreference: 'low-power'
    });
    if (!gl) return false;

    // Compile program
    const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return false;

    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return false;
    }

    gl.useProgram(program);

    // Geometry quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uniforms = {
      u_texture1: gl.getUniformLocation(program, 'u_texture1'),
      u_texture2: gl.getUniformLocation(program, 'u_texture2'),
      u_hasTexture2: gl.getUniformLocation(program, 'u_hasTexture2'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_imageResolution1: gl.getUniformLocation(program, 'u_imageResolution1'),
      u_imageResolution2: gl.getUniformLocation(program, 'u_imageResolution2'),
      u_mouse: gl.getUniformLocation(program, 'u_mouse'),
      u_mouseVelocity: gl.getUniformLocation(program, 'u_mouseVelocity'),
      u_hover: gl.getUniformLocation(program, 'u_hover'),
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_intensity: gl.getUniformLocation(program, 'u_intensity'),
    };

    // Load Image 1
    let img1: HTMLImageElement;
    try {
      img1 = await loadCachedImage(src);
    } catch {
      return false;
    }

    const texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img1);
    gl.uniform1i(uniforms.u_texture1, 0);

    // Load Image 2 if hoverSrc is provided
    let img2: HTMLImageElement | null = null;
    let texture2: WebGLTexture | null = null;
    if (hoverSrc) {
      try {
        img2 = await loadCachedImage(hoverSrc);
        texture2 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
        gl.uniform1i(uniforms.u_texture2, 1);
        gl.uniform1f(uniforms.u_hasTexture2, 1.0);
      } catch {
        gl.uniform1f(uniforms.u_hasTexture2, 0.0);
      }
    } else {
      gl.uniform1f(uniforms.u_hasTexture2, 0.0);
    }

    stateRef.current.gl = gl;
    stateRef.current.program = program;
    stateRef.current.texture1 = texture1;
    stateRef.current.texture2 = texture2;
    stateRef.current.img1 = img1;
    stateRef.current.img2 = img2;
    stateRef.current.uniforms = uniforms;
    stateRef.current.startTime = performance.now();

    return true;
  }, [src, hoverSrc]);

  // Render loop
  const renderLoop = useCallback(() => {
    const s = stateRef.current;
    const gl = s.gl;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;

    // Resize canvas if needed
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    // Lerp hover value
    const hoverSpeed = s.isHovered ? 0.12 : 0.08;
    s.hover += (s.targetHover - s.hover) * hoverSpeed;

    // Lerp mouse coordinates towards target
    s.mouse.x += (s.targetMouse.x - s.mouse.x) * 0.14;
    s.mouse.y += (s.targetMouse.y - s.mouse.y) * 0.14;

    // Calculate smoothed velocity
    const vx = (s.targetMouse.x - s.prevMouse.x);
    const vy = (s.targetMouse.y - s.prevMouse.y);
    s.prevMouse.x = s.targetMouse.x;
    s.prevMouse.y = s.targetMouse.y;
    s.mouseVelocity.x = s.mouseVelocity.x * 0.85 + vx * 0.15;
    s.mouseVelocity.y = s.mouseVelocity.y * 0.85 + vy * 0.15;

    const time = (performance.now() - s.startTime) * 0.001;

    // Pass uniforms
    gl.uniform2f(s.uniforms.u_resolution, canvas.width, canvas.height);
    if (s.img1) {
      gl.uniform2f(s.uniforms.u_imageResolution1, s.img1.naturalWidth, s.img1.naturalHeight);
    }
    if (s.img2) {
      gl.uniform2f(s.uniforms.u_imageResolution2, s.img2.naturalWidth, s.img2.naturalHeight);
    }
    gl.uniform2f(s.uniforms.u_mouse, s.mouse.x, s.mouse.y);
    gl.uniform2f(s.uniforms.u_mouseVelocity, s.mouseVelocity.x, s.mouseVelocity.y);
    gl.uniform1f(s.uniforms.u_hover, s.hover);
    gl.uniform1f(s.uniforms.u_time, time);
    gl.uniform1f(s.uniforms.u_intensity, intensity);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // If completely rested after unhover, stop loop to preserve GPU
    if (!s.isHovered && s.hover < 0.005 && Math.abs(s.mouseVelocity.x) < 0.001 && Math.abs(s.mouseVelocity.y) < 0.001) {
      s.hover = 0;
      setCanvasOpacity(0);
      cancelAnimationFrame(s.animFrameId);
      s.animFrameId = 0;
      return;
    }

    s.animFrameId = requestAnimationFrame(renderLoop);
  }, [intensity]);

  // Pointer event handlers
  const handlePointerEnter = useCallback(async (e: React.PointerEvent) => {
    if (!isSupported) return;
    const s = stateRef.current;
    s.isHovered = true;
    s.targetHover = 1.0;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      s.targetMouse = { x: mx, y: my };
      s.mouse = { x: mx, y: my };
      s.prevMouse = { x: mx, y: my };
    }

    if (!canvasActive) {
      setCanvasActive(true);
    }

    // Initialize WebGL if not already
    if (!s.gl) {
      const ok = await initWebGL();
      if (!ok) return;
    }

    setCanvasOpacity(1);

    if (!s.animFrameId) {
      s.animFrameId = requestAnimationFrame(renderLoop);
    }
  }, [isSupported, canvasActive, initWebGL, renderLoop]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isSupported) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      stateRef.current.targetMouse = { x: mx, y: my };
    }
  }, [isSupported]);

  const handlePointerLeave = useCallback(() => {
    if (!isSupported) return;
    const s = stateRef.current;
    s.isHovered = false;
    s.targetHover = 0.0;
  }, [isSupported]);

  // Clean up on unmount
  useEffect(() => {
    const s = stateRef.current;
    return () => {
      if (s.animFrameId) {
        cancelAnimationFrame(s.animFrameId);
      }
      if (s.gl) {
        const ext = s.gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''} ${className}`}
    >
      {/* Base Next.js Image (SSR, LCP, blur placeholder, fallback) */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${imageClassName}`}
        sizes={sizes}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
      />

      {/* WebGL Canvas Overlay */}
      {isSupported && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
          style={{
            opacity: canvasOpacity,
            willChange: canvasOpacity > 0 ? 'opacity' : 'auto',
          }}
        />
      )}
    </div>
  );
}

export default LiquidShaderImage;
