/* ============================================================
   CATEGORIES + CUTS — the menu. Shared with /api for validation.
   `photos: {front, detail, back, tall, avatar}` on a cut overrides
   the illustrated portraits with real image URLs.
   ============================================================ */
export const CATS = {
  all:'All cuts', fade:'Fades', kstyle:'K-style', short:'Short & easy', statement:'Statement'
};

export const CUTS = [
  { slug:'low-taper-fade', name:'Low Taper Fade', cats:['fade'], mins:35, lasts:'3 weeks', tag:'Most booked',
    lede:'Clean at the ears, blends up soft, keeps the length on top. The safe answer that never looks safe.',
    ask:'Low taper starting right above the ear, guard 1 on the sides fading into scissor length on top. Textured, natural finish — no shine.',
    bestFor:'Straight or wavy hair, oval or round faces, uniform students',
    seed:3,
    pal:{bg1:'#0f3350',bg2:'#030a12',skin:'#c58b62',hair:'#15100f',shirt:'#e9edf2',rim:'#7fe3ff'},
    hair:{top:66,tb:124,wx:4,fy:112,fringe:'textured',fade:'taper',tex:'crop'} },

  { slug:'mid-burst-fade', name:'Mid Burst Fade', cats:['fade','statement'], mins:45, lasts:'3 weeks', tag:'Trending',
    lede:'Circular fade that curves around your ear like a comet. Loud on purpose.',
    ask:'Mid burst fade wrapping the ear, drop at the back, skin at the base blending up to guard 2. Leave two fingers of length on top.',
    bestFor:'Statement-first students, curly to coily hair, TikTok-ready looks',
    seed:11,
    pal:{bg1:'#3a1344',bg2:'#0b040d',skin:'#a8704a',hair:'#120e10',shirt:'#1d1d22',rim:'#ff8ad8'},
    hair:{top:58,tb:118,wx:0,narrow:10,fy:108,fringe:'textured',fade:'burst',tex:'messy'} },

  { slug:'two-block', name:'Two-Block', cats:['kstyle'], mins:45, lasts:'4–5 weeks', tag:'Trending',
    lede:'The K-drama classic: short sides hidden under a longer, softer top. Two layers, one silhouette.',
    ask:'Two-block: clipper the sides and back down to guard 1, but keep the top mushroom-length so it falls over and covers the transition. Blunt fringe brushed forward.',
    bestFor:'Straight-haired students, K-pop and streetwear looks, first-time growers',
    seed:5,
    pal:{bg1:'#10332c',bg2:'#030b09',skin:'#d7a37c',hair:'#1a1412',shirt:'#2b3a52',rim:'#7affc8'},
    hair:{top:62,tb:136,tbBack:132,wx:8,fy:124,fringe:'swoop',fade:'even',tex:'flow',sb:152,brow:143} },

  { slug:'curtain-cut', name:'Curtain Cut', cats:['kstyle','statement'], mins:45, lasts:'5–6 weeks',
    lede:'A soft middle-part that frames your face like drapes. Grown-out on purpose.',
    ask:'Curtain cut with a middle part, length past the brow line, sides scissor-cut to blend. Point-cut ends so it moves. Keep the weight.',
    bestFor:'Straight or wavy hair, longer face shapes, patient growers',
    seed:9,
    pal:{bg1:'#2a2238',bg2:'#07060b',skin:'#cf9a70',hair:'#2a1d16',shirt:'#c9b8a4',rim:'#ffc27a'},
    hair:{top:64,tb:142,wx:7,fy:124,fringe:'curtain',fade:'taper',tex:'curtain',brow:143} },

  { slug:'french-crop', name:'French Crop', cats:['fade','short'], mins:35, lasts:'3 weeks',
    lede:'Short, textured, forward. Zero effort in the mirror before class.',
    ask:'French crop, high fade on the sides, cropped top around 3 cm, blunt textured fringe pushed forward. Should look done straight out of the shower.',
    bestFor:'Everyone in a rush, thicker hair, receding hairlines',
    seed:21,
    pal:{bg1:'#1b2a3e',bg2:'#04070c',skin:'#b98059',hair:'#110d0d',shirt:'#8a1f24',rim:'#9fd8ff'},
    hair:{top:76,tb:118,wx:2,fy:114,fringe:'blunt',fade:'high',tex:'crop',sb:146} },

  { slug:'modern-mullet', name:'Modern Mullet', cats:['statement'], mins:50, lasts:'4 weeks',
    lede:'Short on the sides, party in the back — but tailored, not costume. Grown-in on purpose.',
    ask:'Modern mullet: burst fade on the sides, top left long and messy, back grown out about 2–3 inches past the collar with a soft point.',
    bestFor:'Straight or wavy hair, anyone tired of the same fade, statement-first',
    seed:15,
    pal:{bg1:'#3b1d0f',bg2:'#0c0503',skin:'#b77b52',hair:'#3b271b',shirt:'#101114',rim:'#ffb070'},
    hair:{top:62,tb:128,wx:6,fy:118,fringe:'textured',fade:'burst',tex:'messy',back:true} },

  { slug:'buzz-cut', name:'Buzz Cut', cats:['short'], mins:25, lasts:'2 weeks',
    lede:'One guard, one direction, done. The reset button.',
    ask:'Buzz all over, guard 2 on top blending to guard 1 on the sides. Clean line-up at the front and neck.',
    bestFor:'Any hair type, low-maintenance students, mid-semester resets',
    seed:2,
    pal:{bg1:'#20262e',bg2:'#05060a',skin:'#8f5b3a',hair:'#141011',shirt:'#f2f2f0',rim:'#bfe9ff'},
    hair:{top:80,tb:114,wx:1,fy:104,fringe:'hairline',fade:'even',tex:'none'} },

  { slug:'textured-quiff', name:'Textured Quiff', cats:['statement','fade'], mins:45, lasts:'3–4 weeks',
    lede:'Height in the front, tight on the sides. A little polish for the same student price.',
    ask:'Mid fade on the sides, length on top of about 4–5 cm swept up and back. Point-cut for texture, not slick. Style with matte clay.',
    bestFor:'Straight to wavy hair, oval faces, first dates and photo day',
    seed:31,
    pal:{bg1:'#0a2d49',bg2:'#020912',skin:'#c48d63',hair:'#16110f',shirt:'#3c4a3a',rim:'#6fd6ff'},
    hair:{top:50,skew:10,tb:120,wx:3,fy:104,fringe:'hairline',fade:'mid',tex:'swoop'} }
];

