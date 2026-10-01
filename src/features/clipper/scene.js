/* ============================================================
   THE GLASS CLIPPER — full-hero canvas, model centred (as in the
   reference stage). Slow continuous spin + smooth mouse-follow.
   prefers-reduced-motion: renders still.
   ============================================================ */
import * as THREE from 'three';
import { buildClipperGeometry } from './geometry.js';
import { glassVertexShader, glassFragmentShader, bgVertexShader, bgFragmentShader } from './shaders.js';

const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* the refracted backdrop: palette amber fading into --void */
const BG_STOPS = [[0, '#6b4615'], [0.45, '#33261a'], [1, '#1e1d1d']];

export function mountClipper(canvas, stage){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  const scene = new THREE.Scene();
  const pivot = new THREE.Group();     // fitting + scroll tilt
  const spinner = new THREE.Group();   // drag + idle drift
  pivot.add(spinner); scene.add(pivot);
  const mesh = new THREE.Mesh(buildClipperGeometry());
  spinner.add(mesh);
  spinner.rotation.set(-0.25, 0.45, 0.15);

  /* full-screen quad that paints the gradient into the refraction targets */
  const bgScene = new THREE.Scene();
  const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bgCanvas = document.createElement('canvas');
  const bgTexture = new THREE.CanvasTexture(bgCanvas);
  bgTexture.colorSpace = THREE.SRGBColorSpace;
  bgTexture.minFilter = bgTexture.magFilter = THREE.LinearFilter;
  bgTexture.generateMipmaps = false;
  const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { uTex: { value: bgTexture } },
    vertexShader: bgVertexShader, fragmentShader: bgFragmentShader,
    depthTest: false, depthWrite: false
  }));
  bgQuad.frustumCulled = false;
  bgScene.add(bgQuad);

  const uniforms = {
    uTexture: { value: null }, uResolution: { value: new THREE.Vector2() }, uBackside: { value: 0 },
    uIorR: { value: 1.15 }, uIorY: { value: 1.16 }, uIorG: { value: 1.18 },
    uIorC: { value: 1.22 }, uIorB: { value: 1.22 }, uIorP: { value: 1.22 },
    uRefractPower: { value: 0.30 }, uChromatic: { value: 0.5 }, uSaturation: { value: 1.08 },
    uShininess: { value: 90 }, uDiffuseness: { value: 0.02 }, uFresnelPower: { value: 5.0 },
    uLight: { value: new THREE.Vector3(-1, 1, 1) }
  };
  const frontMat = new THREE.ShaderMaterial({ vertexShader: glassVertexShader, fragmentShader: glassFragmentShader, uniforms: THREE.UniformsUtils.clone(uniforms), side: THREE.FrontSide });
  const backMat  = new THREE.ShaderMaterial({ vertexShader: glassVertexShader, fragmentShader: glassFragmentShader, uniforms: THREE.UniformsUtils.clone(uniforms), side: THREE.BackSide });
  backMat.uniforms.uBackside.value = 1;
  backMat.uniforms.uRefractPower.value = 0.22;

  let rtBack = null, rtFront = null, lastW = 0, lastH = 0;

  function resize(){
    const w = Math.max(1, Math.round(stage.clientWidth));
    const h = Math.max(1, Math.round(stage.clientHeight));
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    const W = Math.floor(w*dpr), H = Math.floor(h*dpr);

    if (rtBack) rtBack.dispose();
    if (rtFront) rtFront.dispose();
    rtBack  = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
    rtFront = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
    backMat.uniforms.uTexture.value = rtBack.texture;
    frontMat.uniforms.uTexture.value = rtFront.texture;
    frontMat.uniforms.uResolution.value.set(W, H);
    backMat.uniforms.uResolution.value.set(W, H);

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    bgCanvas.width = W; bgCanvas.height = H;
    const ctx = bgCanvas.getContext('2d');
    const grd = ctx.createRadialGradient(W/2, H*0.45, 0, W/2, H*0.45, Math.max(W, H));
    BG_STOPS.forEach(([o, c])=> grd.addColorStop(o, c));
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    bgTexture.needsUpdate = true;

    // reference sizing; centred horizontally, ~48.8% down (45% on phones)
    const visH = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z;
    const phone = w < 768 || w / h < 1;
    pivot.position.set(0, (0.5 - (phone ? 0.45 : 0.488)) * visH, 0);
    const px = Math.min(h * 0.44, w * (phone ? 0.45 : 0.29));
    pivot.scale.setScalar((px / h) * visH * 1.5);
    render();
  }

  function render(){
    renderer.setRenderTarget(rtBack);  renderer.clear(); renderer.render(bgScene, bgCamera);
    renderer.setRenderTarget(rtFront); renderer.clear(); renderer.render(bgScene, bgCamera);
    renderer.autoClear = false;
    mesh.material = backMat;  renderer.render(scene, camera);   // back faces into rtFront
    renderer.setRenderTarget(null); renderer.clear();
    mesh.material = frontMat; renderer.render(scene, camera);   // front faces to screen
    renderer.autoClear = true;
  }

  /* ---------------- mouse follow ---------------- */
  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e)=>{
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------------- loop ---------------- */
  let running = false, raf = 0, lastT = 0;
  function tick(now){
    raf = requestAnimationFrame(tick);
    const dt = Math.min((now - lastT) / 1000, 0.1);
    lastT = now;
    spinner.rotation.y += 0.15 * dt;                                     // slow spin
    mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, mx * 1.0, 5 * dt);  // follow the cursor
    mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, my * 0.5, 5 * dt);
    render();
  }

  function start(){
    if (REDUCED){ render(); return; }   // still image
    if (running) return;
    running = true; lastT = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function stop(){ running = false; cancelAnimationFrame(raf); }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  resize();
  return { start, stop, resize };
}
