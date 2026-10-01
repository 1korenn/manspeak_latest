/* ============================================================
   THE GLASS CLIPPER — "3D Clipper Drift & Render", ported into the hero.

   - Renders into its own small canvas (#clipper) inside .clipper-stage,
     transparent everywhere except the clipper, so the ring shows around it.
   - The glass refracts a warm amber gradient rather than the real page.
   - Drag to spin (desktop, fine pointer); it keeps its momentum, then
     eases back into a slow idle drift.
   - Scroll parallax: as the hero scrolls away the clipper tilts back.
   - prefers-reduced-motion: no idle drift, no scroll tilt; it renders
     still, and drag still works.
   ============================================================ */
import * as THREE from 'three';
import { buildClipperGeometry } from './geometry.js';
import { glassVertexShader, glassFragmentShader, bgVertexShader, bgFragmentShader } from './shaders.js';

const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* the refracted backdrop: palette amber fading into --void */
const BG_STOPS = [[0, '#6b4615'], [0.45, '#33261a'], [1, '#1e1d1d']];

export function mountClipper(canvas, stage, hero){
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

    // fit: the model is normalised to 1 unit on its longest side (its height)
    const visH = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z;
    const fit = Math.min(visH, visH * camera.aspect) * 0.84;
    pivot.scale.setScalar(fit);
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

  /* ---------------- drag to spin ---------------- */
  const Y = new THREE.Vector3(0,1,0), X = new THREE.Vector3(1,0,0);
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  const turn = (dx, dy)=>{
    spinner.quaternion.premultiply(qa.setFromAxisAngle(Y, dx)).premultiply(qb.setFromAxisAngle(X, dy));
  };
  let dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0, lastDragTime = performance.now();
  stage.addEventListener('pointerdown', (e)=>{
    dragging = true; stage.setPointerCapture(e.pointerId);
    lastX = e.clientX; lastY = e.clientY; velX = velY = 0;
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove', (e)=>{
    if (!dragging) return;
    velX = (e.clientX - lastX) * 0.008; velY = (e.clientY - lastY) * 0.008;
    lastX = e.clientX; lastY = e.clientY;
    turn(velX, velY);
    lastDragTime = performance.now();
    if (!running) render();
  });
  const endDrag = ()=>{ dragging = false; stage.classList.remove('dragging'); lastDragTime = performance.now(); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  /* ---------------- scroll tilt (part of the hero parallax) ---------------- */
  let tilt = 0;
  const scrollProgress = ()=>{
    if (!hero || REDUCED) return 0;
    const r = hero.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  };

  /* ---------------- loop ---------------- */
  let running = false, raf = 0, lastT = 0;
  function tick(now){
    raf = requestAnimationFrame(tick);
    const dt60 = Math.min((now - lastT) / 1000, 0.1) * 60;
    lastT = now;

    if (!dragging){
      if (Math.abs(velX) > 0.0001 || Math.abs(velY) > 0.0001){
        turn(velX, velY);                              // momentum after a flick
        const damp = Math.pow(0.94, dt60); velX *= damp; velY *= damp;
      }
      const idle = (now - lastDragTime) / 1000;
      if (idle > 0.6 && !REDUCED){                     // ease back into the drift
        const blend = Math.min(1, idle - 0.6);
        turn(0.0035 * blend * dt60, 0.0012 * blend * dt60);
      }
    }
    // tilt back as the hero leaves, smoothed so it never snaps
    tilt += (scrollProgress() - tilt) * Math.min(1, 0.12 * dt60);
    pivot.rotation.set(tilt * 0.75, 0, -tilt * 0.3);
    render();
  }

  function start(){
    if (REDUCED){ render(); return; }   // still image; drag re-renders on demand
    if (running) return;
    running = true; lastT = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function stop(){ running = false; cancelAnimationFrame(raf); }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  resize();
  return { start, stop, resize };
}
