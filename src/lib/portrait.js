/* ============================================================
   PORTRAIT — SVG portrait generator, cached, view-mode aware.
   view: 'front' | 'detail' | 'back' | 'tall' | 'avatar'
   Each cut may supply optional `photos: {front, detail, back, ...}`
   with real image URLs that override the generator entirely.
   ============================================================ */
const _pcache = new Map();
export function portrait(c, view){
  const V = view || 'front';
  // real-photo override
  if (c.photos && c.photos[V]) return c.photos[V];
  const key = c.slug + '|' + V;
  if (_pcache.has(key)) return _pcache.get(key);

  const p = c.pal, h = c.hair;
  const skin = p.skin, hair = p.hair;
  const shade = (hex, amt)=>{
    const n = parseInt(hex.slice(1),16); let r=n>>16, g=(n>>8)&255, b=n&255;
    const t = amt<0?0:255, a=Math.abs(amt);
    r=Math.round(r+(t-r)*a); g=Math.round(g+(t-g)*a); b=Math.round(b+(t-b)*a);
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  };
  const FADE = { none:[999,1], low:[138,0.06], mid:[126,0.04], high:[114,0.02],
                 taper:[140,0.34], burst:[124,0.03], even:[0,0.62] };
  const BACK = { none:[999,1], low:[182,0.06], mid:[166,0.04], high:[148,0.03],
                 taper:[186,0.34], burst:[176,0.05], even:[0,0.62] };
  const f = FADE[h.fade] || FADE.even, fb = BACK[h.fade] || BACK.even;
  const sb = h.sb || 150;
  const grad = (gid, y1, y2, fd) => {
    if (fd[0] === 0) return `<linearGradient id="${gid}" x1="0" y1="${y1}" x2="0" y2="${y2}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${hair}" stop-opacity="${fd[1]}"/><stop offset="1" stop-color="${hair}" stop-opacity="${fd[1]}"/></linearGradient>`;
    const o = Math.min(0.98, Math.max(0.02, (fd[0]-y1)/(y2-y1)));
    return `<linearGradient id="${gid}" x1="0" y1="${y1}" x2="0" y2="${y2}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${hair}"/><stop offset="${o.toFixed(3)}" stop-color="${hair}" stop-opacity="${h.fade==='taper'?0.92:0.9}"/><stop offset="1" stop-color="${hair}" stop-opacity="${fd[1]}"/></linearGradient>`;
  };
  let seed = c.seed || 7;
  const rnd = ()=> (seed = (seed*9301+49297)%233280)/233280;

  const fringe = (xr, xl, fy) => {
    const t = h.fringe;
    if (t === 'hairline') return `Q 120 ${fy-9} ${xl} ${fy+3}`;
    if (t === 'swoop')    return `C 138 ${fy-2} 110 ${fy+6} ${xl} ${fy+12}`;
    if (t === 'curtain')  return `C 142 ${fy+4} 128 ${fy-10} 120 ${fy-20} C 112 ${fy-10} 98 ${fy+4} ${xl} ${fy+10}`;
    const n = t==='blunt' ? 11 : 8, amp = t==='blunt' ? 3.2 : 8;
    let d = '';
    for (let i=1;i<=n;i++){
      const x = xr + (xl-xr)*i/n;
      const tip = (i%2) ? fy + amp*(0.6+rnd()*0.6) : fy - amp*0.25*rnd();
      d += `L ${x.toFixed(1)} ${tip.toFixed(1)} `;
    }
    return d;
  };

  // viewBox + bg rect per view
  let vb, bgR;
  if (V==='detail')      { vb='58 44 124 165'; bgR='<rect x="40" y="20" width="180" height="220" fill="url(#bg)"/>'; }
  else if (V==='avatar') { vb='62 62 116 116'; bgR='<rect x="40" y="40" width="180" height="180" fill="url(#bg)"/>'; }
  else if (V==='tall')   { vb='10 -60 220 380'; bgR='<rect x="-40" y="-80" width="320" height="440" fill="url(#bg)"/>'; }
  else                    { vb='0 0 240 320'; bgR='<rect x="-20" y="-20" width="280" height="360" fill="url(#bg)"/>'; }

  const rim = p.rim;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">`;
  s += `<defs>
    <radialGradient id="bg" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${rim}" stop-opacity=".30"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></radialGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(skin,.10)}"/><stop offset=".65" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin,-.28)}"/></linearGradient>
    <linearGradient id="neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(skin,-.38)}"/><stop offset=".5" stop-color="${shade(skin,-.16)}"/></linearGradient>
    <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(p.shirt,.12)}"/><stop offset="1" stop-color="${shade(p.shirt,-.35)}"/></linearGradient>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hair,.10)}"/><stop offset="1" stop-color="${hair}"/></linearGradient>
    <linearGradient id="rimG" x1="0" y1="0" x2="1" y2="0"><stop offset=".35" stop-color="${rim}" stop-opacity="0"/><stop offset="1" stop-color="${rim}" stop-opacity=".75"/></linearGradient>
    ${grad('sides', 82, sb+4, f)}
    ${grad('backg', h.top, 204, fb)}
  </defs>`;
  s += bgR;
  s += `<ellipse cx="${V==='back'?120:132}" cy="138" rx="120" ry="120" fill="url(#glow)"/>`;

  const torso = `<path d="M14 330 C18 284 50 262 94 254 L146 254 C190 262 222 284 226 330 Z" fill="url(#shirt)"/>`;
  const neck  = `<path d="M100 192 L100 250 C108 263 132 263 140 250 L140 192 Z" fill="url(#neck)"/>`;
  const ears  = `<ellipse cx="73" cy="148" rx="7.5" ry="14" fill="${shade(skin,-.12)}"/><ellipse cx="167" cy="148" rx="7.5" ry="14" fill="${shade(skin,-.2)}"/>`;

  if (V === 'back'){
    const top = h.top, t = 3;
    if (h.back) s += `<path d="M84 170 C82 206 86 236 96 252 L144 252 C154 236 158 206 156 170 Z" fill="${hair}"/>`;
    s += torso + neck + ears;
    s += `<path d="M120 84 C150 84 167 106 167 140 C167 168 158 192 144 204 Q120 214 96 204 C82 192 73 168 73 140 C73 106 90 84 120 84 Z" fill="url(#skin)"/>`;
    s += `<path d="M${73-t} 150 C${73-t} ${top+26} 94 ${top} 120 ${top} C146 ${top} ${167+t} ${top+26} ${167+t} 150 C${167+t} 176 157 196 146 202 Q120 210 94 202 C83 196 ${73-t} 176 ${73-t} 150 Z" fill="url(#backg)"/>`;
    const wx = h.wx||0, tb = (h.tbBack||h.tb) + 4;
    if (h.fade !== 'none') s += `<path d="M${74-wx} ${tb} C${74-wx} ${top+22} ${96-wx} ${top} 120 ${top} C${144+wx} ${top} ${166+wx} ${top+22} ${166+wx} ${tb} C150 ${tb+10} 90 ${tb+10} ${74-wx} ${tb} Z" fill="url(#top)"/>`;
    // crown whorl
    s += `<circle cx="120" cy="${top+18}" r="2.4" fill="none" stroke="${shade(hair,.35)}" stroke-width="1" opacity=".55"/><circle cx="120" cy="${top+18}" r="5.2" fill="none" stroke="${shade(hair,.28)}" stroke-width=".8" opacity=".4"/>`;
    if (h.back) s += `<path d="M86 176 C84 204 90 230 98 246 L110 236 L118 250 L126 236 L136 248 L146 234 C152 214 156 196 154 176 Z" fill="${hair}"/>`;
    s += `<path d="M${74-wx} ${tb} C${74-wx} ${top+22} ${96-wx} ${top} 120 ${top} C${144+wx} ${top} ${166+wx} ${top+22} ${166+wx} ${tb}" fill="none" stroke="url(#rimG)" stroke-width="1.6"/>`;
  } else {
    if (h.back) s += `<path d="M78 150 C74 196 80 228 92 250 L148 250 C160 228 166 196 162 150 Z" fill="${shade(hair,-.1)}"/>`;
    s += torso;
    s += `<path d="M92 254 C104 272 136 272 148 254" fill="none" stroke="${shade(p.shirt,-.45)}" stroke-width="5" stroke-linecap="round"/>`;
    s += neck + ears;
    s += `<path d="M120 84 C148 84 166 104 166 138 C166 166 159 188 147 202 C138 212 130 218 120 218 C110 218 102 212 93 202 C81 188 74 166 74 138 C74 104 92 84 120 84 Z" fill="url(#skin)"/>`;
    s += `<path d="M93 202 C102 212 110 218 120 218 C130 218 138 212 147 202 C140 206 130 209 120 209 C110 209 100 206 93 202 Z" fill="${shade(skin,-.3)}" opacity=".55"/>`;
    s += `<path d="M94 ${h.brow||140} q10 -4 19 -1" stroke="${hair}" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"/><path d="M127 ${(h.brow||140)-1} q9 -3 19 1" stroke="${hair}" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"/>`;
    s += `<path d="M71 ${sb} C71 118 86 84 120 80 C154 84 169 118 169 ${sb} L160 ${sb} C160 128 154 112 140 106 L100 106 C86 112 80 128 80 ${sb} Z" fill="url(#sides)"/>`;
    const top = h.top, tb = h.tb, wx = h.wx||0, sk = h.skew||0, fy = h.fy;
    const nx = h.narrow||0, L = 74 - wx + nx, R = 166 + wx - nx;
    const xr = 152 - nx*0.4, xl = 88 + nx*0.4;
    const d = `M${L} ${tb} C${L} ${top+22} ${96-wx+nx} ${top} ${120+sk} ${top} C${144+wx-nx} ${top} ${R} ${top+22} ${R} ${tb} C${R-4} ${tb+4} ${xr+4} ${fy-6} ${xr} ${fy} ${fringe(xr, xl, fy)} C${xl-4} ${fy-6} ${L+4} ${tb+4} ${L} ${tb} Z`;
    s += `<path d="${d}" fill="url(#top)"/>`;
    const st = (dd,o)=> `<path d="${dd}" fill="none" stroke="${shade(hair,.28)}" stroke-width="1.4" stroke-linecap="round" opacity="${o||.45}"/>`;
    if (h.tex==='crop')   { for (let i=0;i<7;i++){ const x=92+i*9; s+=st(`M${x} ${top+14+rnd()*6} q${2+rnd()*3} 10 ${1+rnd()*2} ${fy-top-20}`); } }
    if (h.tex==='flow')   { s+=st(`M${140+sk} ${top+6} C120 ${top+14} 104 ${fy-14} 92 ${fy}`)+st(`M${148} ${top+14} C132 ${top+24} 116 ${fy-6} 104 ${fy+4}`)+st(`M128 ${top+4} C112 ${top+10} 96 ${top+26} 84 ${tb-4}`,.3); }
    if (h.tex==='curtain'){ s+=st(`M120 ${top+4} C122 ${top+22} 132 ${fy-12} 150 ${fy+2}`)+st(`M120 ${top+4} C118 ${top+22} 108 ${fy-12} 90 ${fy+2}`)+st(`M128 ${top+10} C140 ${top+26} 156 ${fy-10} 162 ${tb-2}`,.3)+st(`M112 ${top+10} C100 ${top+26} 84 ${fy-10} 78 ${tb-2}`,.3); }
    if (h.tex==='swoop')  { s+=st(`M92 ${fy-2} C98 ${top+12} 128 ${top-2} ${150} ${top+16}`)+st(`M100 ${fy} C106 ${top+18} 130 ${top+6} ${154} ${top+24}`)+st(`M110 ${fy} C116 ${top+24} 134 ${top+14} ${158} ${top+30}`,.3); }
    if (h.tex==='messy')  { for (let i=0;i<6;i++){ const x=90+i*12; s+=st(`M${x} ${top+10+rnd()*8} q${-4+rnd()*8} 12 ${-2+rnd()*6} ${fy-top-16}`); } }
    s += `<path d="M${L} ${tb} C${L} ${top+22} ${96-wx+nx} ${top} ${120+sk} ${top} C${144+wx-nx} ${top} ${R} ${top+22} ${R} ${tb}" fill="none" stroke="url(#rimG)" stroke-width="1.6"/>`;
    s += `<path d="M158 110 C166 124 167 150 162 172 C159 186 153 196 147 202" fill="none" stroke="${rim}" stroke-width="1.4" opacity=".45"/>`;
  }
  s += `</svg>`;
  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  _pcache.set(key, uri);
  return uri;
}

