/* Procedural hair clipper: shaped body, cap, hanging loop, face plate,
   power switch, taper lever, blade stack with 37 teeth, and screws.
   Merged into one position-only geometry, centred and scaled to 1 unit. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildClipperGeometry(){
  const parts = [];
  const pushClean = (geom)=>{
    let g = geom.clone(); if (g.index) g = g.toNonIndexed();
    const clean = new THREE.BufferGeometry();
    clean.setAttribute('position', g.attributes.position);
    parts.push(clean);
  };

  // body: narrow at the base, widest at 60%, tapering to the blades; belly on the back
  let body = new RoundedBoxGeometry(0.6, 1.3, 0.28, 32, 0.08);
  if (body.index) body = body.toNonIndexed();
  const pos = body.attributes.position;
  for (let i = 0; i < pos.count; i++){
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const normY = (y + 0.65) / 1.3;
    let widthScale;
    if (normY < 0.6){ const t = normY / 0.6; widthScale = 0.5 + 0.5 * (1.0 - Math.pow(1.0 - t, 2)); }
    else { const t = (normY - 0.6) / 0.4; widthScale = 1.0 - 0.25 * t; }
    x *= widthScale;
    z *= 0.7 + 0.3 * Math.sin(normY * Math.PI);
    if (z < 0) z -= Math.sin(normY * Math.PI) * 0.05;
    pos.setX(i, x); pos.setZ(i, z);
  }
  pushClean(body);

  let cap = new RoundedBoxGeometry(0.35, 0.25, 0.22, 16, 0.04);
  if (cap.index) cap = cap.toNonIndexed();
  const cPos = cap.attributes.position;
  for (let i = 0; i < cPos.count; i++){
    const nY = (cPos.getY(i) + 0.125) / 0.25;
    cPos.setX(i, cPos.getX(i) * (0.8 + 0.2 * nY));
  }
  cap.translate(0, -0.75, 0); pushClean(cap);

  const loop = new THREE.TorusGeometry(0.06, 0.02, 12, 24); loop.translate(0, -0.92, 0); pushClean(loop);

  let plate = new RoundedBoxGeometry(0.48, 0.85, 0.06, 16, 0.02);
  if (plate.index) plate = plate.toNonIndexed();
  const pPos = plate.attributes.position;
  for (let i = 0; i < pPos.count; i++){
    const nY = (pPos.getY(i) + 0.425) / 0.85;
    pPos.setX(i, pPos.getX(i) * (nY < 0.5 ? 0.6 + 0.4 * Math.sin(nY * Math.PI) : 1.0 - 0.15 * ((nY - 0.5) / 0.5)));
  }
  plate.translate(0, -0.05, 0.14); pushClean(plate);

  const switchGroove = new RoundedBoxGeometry(0.05, 0.2, 0.06, 4, 0.01); switchGroove.translate(-0.25, -0.15, 0); pushClean(switchGroove);
  const switchBtn = new RoundedBoxGeometry(0.04, 0.1, 0.07, 4, 0.01); switchBtn.translate(-0.27, -0.18, 0); pushClean(switchBtn);
  const leverHub = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 24); leverHub.rotateZ(Math.PI/2); leverHub.translate(0.25, 0.25, 0.03); pushClean(leverHub);
  const leverArm = new RoundedBoxGeometry(0.02, 0.18, 0.04, 4, 0.005); leverArm.rotateX(-Math.PI/5); leverArm.translate(0.28, 0.15, 0.06); pushClean(leverArm);
  const leverThumb = new RoundedBoxGeometry(0.04, 0.06, 0.06, 4, 0.01); leverThumb.rotateX(-Math.PI/5); leverThumb.translate(0.29, 0.08, 0.09); pushClean(leverThumb);
  const bladeBase = new RoundedBoxGeometry(0.5, 0.15, 0.1, 4, 0.02); bladeBase.rotateX(Math.PI/12); bladeBase.translate(0, 0.65, 0.02); pushClean(bladeBase);
  const statBlade = new THREE.BoxGeometry(0.55, 0.15, 0.015); statBlade.rotateX(Math.PI/12); statBlade.translate(0, 0.74, 0.04); pushClean(statBlade);
  const movBlade = new THREE.BoxGeometry(0.48, 0.1, 0.015); movBlade.rotateX(Math.PI/12); movBlade.translate(0, 0.76, 0.025); pushClean(movBlade);
  for (let i = -18; i <= 18; i++){
    const tooth = new THREE.BoxGeometry(0.007, 0.03, 0.015); tooth.rotateX(Math.PI/12); tooth.translate(i * 0.014, 0.81, 0.022); pushClean(tooth);
  }
  const botScrew = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16); botScrew.rotateX(Math.PI/2); botScrew.translate(0, -0.4, 0.17); pushClean(botScrew);
  const topScrew1 = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24); topScrew1.rotateX(Math.PI/2); topScrew1.translate(-0.1, 0.66, 0.1); pushClean(topScrew1);
  const topScrew2 = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24); topScrew2.rotateX(Math.PI/2); topScrew2.translate(0.1, 0.66, 0.1); pushClean(topScrew2);
  const leverScrew = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 16); leverScrew.rotateZ(Math.PI/2); leverScrew.translate(0.3, 0.25, 0.03); pushClean(leverScrew);

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  const box = merged.boundingBox;
  const center = new THREE.Vector3(); box.getCenter(center);
  const size = new THREE.Vector3(); box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  merged.translate(-center.x, -center.y, -center.z);
  merged.scale(1/maxDim, 1/maxDim, 1/maxDim);
  return merged;
}
