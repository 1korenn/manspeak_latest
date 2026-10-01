/* ============================================================
   BOOKING FLOW — the #book view: day → time → details → confirm.
   Availability comes from lib/availability.js; the booking itself
   goes through lib/api.js (on-device mock, or /api → Supabase).
   ============================================================ */
import { CONFIG, peso } from '../config.js';
import { CUTS } from '../data/cuts.js';
import { portrait } from '../lib/portrait.js';
import { dayKey, fmtTime, fmtDateLong } from '../lib/schedule.js';
import { slotsFor, refreshAvailability, markTaken, onAvailabilityChange } from '../lib/availability.js';
import { createBooking, API_MODE } from '../lib/api.js';
import { normalizePhonePH, validEmail } from '../lib/validate.js';

const BOOK = { day: null, time: null, cutSlug: null };
function populateCutSelect(){
  const sel = document.getElementById('fCut');
  if (!sel) return;
  sel.innerHTML = '<option value="">Pick a cut…</option>' +
    CUTS.map(c=> '<option value="' + c.slug + '">' + c.name + ' · ' + peso() + '</option>').join('') +
    '<option value="__unsure">Not sure yet — I\'ll decide in the chair</option>';
}
function renderBookDays(){
  const wrap = document.getElementById('bkDays');
  if (!wrap) return;
  wrap.innerHTML = '';
  const dfmt = new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, weekday:'short'});
  const mfmt = new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, month:'short'});
  for (let i=0;i<CONFIG.daysAhead;i++){
    const d = dayKey(i);
    const s = slotsFor(d);
    const b = document.createElement('button');
    b.type='button';
    b.className='opt day' + (s.length ? '' : ' unavail');
    b.disabled = !s.length;
    b.setAttribute('data-key', d.key);
    b.setAttribute('aria-pressed', d.key === BOOK.day ? 'true' : 'false');
    b.innerHTML = '<span class="opt-t">' + (i===0 ? 'Today' : i===1 ? 'Tomorrow' : dfmt.format(d.date)) + '</span>' +
                  '<span class="opt-b">' + mfmt.format(d.date) + ' ' + d.d + '</span>' +
                  '<span class="opt-n">' + (s.length ? (s.length + ' open') : 'Full') + '</span>';
    b.addEventListener('click', ()=>{
      BOOK.day = d.key; BOOK.time = null;
      wrap.querySelectorAll('.day').forEach(x=> x.setAttribute('aria-pressed', x===b ? 'true':'false'));
      renderBookTimes();
      updateBookSummary();
      clearErr('errDate');
      // on small screens, scroll to time step
      if (window.innerWidth < 900){
        setTimeout(()=> document.getElementById('stTime').scrollIntoView({behavior:'smooth', block:'start'}), 60);
      }
    });
    wrap.appendChild(b);
  }
}
function renderBookTimes(){
  const wrap = document.getElementById('bkTimes');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!BOOK.day){
    wrap.innerHTML = '<p class="hint">Pick a day first.</p>';
    return;
  }
  const d = { key: BOOK.day, date: new Date(BOOK.day + 'T12:00:00Z') };
  const slots = slotsFor(d);
  if (!slots.length){
    // find next open day
    let next = null;
    for (let i=0;i<CONFIG.daysAhead;i++){
      const dd = dayKey(i);
      if (dd.key > BOOK.day && slotsFor(dd).length){ next = dd; break; }
    }
    wrap.innerHTML = '<p class="hint">No open slots on this day.' +
      (next ? ' <button type="button" class="linkish inline" id="nextOpenBtn">Try ' + new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, weekday:'long', month:'short', day:'numeric'}).format(next.date) + '</button>' : '') +
      '</p>';
    if (next){
      document.getElementById('nextOpenBtn').addEventListener('click', ()=>{
        BOOK.day = next.key; BOOK.time = null;
        renderBookDays(); renderBookTimes(); updateBookSummary();
      });
    }
    return;
  }
  // group Morning / Afternoon / Evening
  const groups = { Morning: [], Afternoon: [], Evening: [] };
  slots.forEach(m=>{
    const h = Math.floor(m/60);
    if (h < 12) groups.Morning.push(m);
    else if (h < 17) groups.Afternoon.push(m);
    else groups.Evening.push(m);
  });
  Object.keys(groups).forEach(g=>{
    if (!groups[g].length) return;
    const sec = document.createElement('div');
    sec.className = 'tgroup';
    sec.innerHTML = '<h4>' + g + '</h4><div class="slots"></div>';
    const slotsWrap = sec.querySelector('.slots');
    groups[g].forEach(m=>{
      const b = document.createElement('button');
      b.type='button';
      b.className = 'opt slot';
      b.setAttribute('data-min', String(m));
      b.setAttribute('aria-pressed', BOOK.time===m ? 'true':'false');
      b.textContent = fmtTime(m);
      b.addEventListener('click', ()=>{
        BOOK.time = m;
        wrap.querySelectorAll('.slot').forEach(x=> x.setAttribute('aria-pressed', x===b ? 'true':'false'));
        updateBookSummary();
        clearErr('errTime');
        if (window.innerWidth < 900){
          setTimeout(()=> document.getElementById('stDetails').scrollIntoView({behavior:'smooth', block:'start'}), 60);
        }
      });
      slotsWrap.appendChild(b);
    });
    wrap.appendChild(sec);
  });
}
function updateBookSummary(){
  const sumCut = document.getElementById('sumCut');
  const sumPic = document.getElementById('sumPic');
  const sumDate = document.getElementById('sumDate');
  const sumTime = document.getElementById('sumTime');
  const cut = BOOK.cutSlug && BOOK.cutSlug !== '__unsure' ? CUTS.find(c=>c.slug===BOOK.cutSlug) : null;
  const cutpick = document.getElementById('fCutPic');
  if (sumCut) sumCut.textContent = cut ? cut.name : (BOOK.cutSlug === '__unsure' ? 'Decide in the chair' : 'Not sure yet');
  if (sumPic) sumPic.src = cut ? portrait(cut,'front') : portrait(CUTS[0],'front');
  if (cutpick) cutpick.src = cut ? portrait(cut,'front') : portrait(CUTS[0],'front');
  if (sumDate){
    if (BOOK.day){
      const d = new Date(BOOK.day + 'T12:00:00Z');
      const f = new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, weekday:'long', month:'short', day:'numeric'});
      sumDate.textContent = f.format(d);
      sumDate.classList.remove('unset');
    } else {
      sumDate.textContent = 'Pick a day'; sumDate.classList.add('unset');
    }
  }
  if (sumTime){
    if (BOOK.time != null){ sumTime.textContent = fmtTime(BOOK.time); sumTime.classList.remove('unset'); }
    else { sumTime.textContent = 'Pick a time'; sumTime.classList.add('unset'); }
  }
}
export function prefillBooking(q){
  BOOK.day = q.date || null;
  BOOK.time = q.time != null && q.time !== '' ? +q.time : null;
  BOOK.cutSlug = q.cut || null;
  // restore prior contact details
  try {
    const prior = JSON.parse(localStorage.getItem('mp:me') || '{}');
    if (prior.name)  document.getElementById('fName').value = prior.name;
    if (prior.phone) document.getElementById('fPhone').value = prior.phone;
    if (prior.email) document.getElementById('fEmail').value = prior.email;
  } catch(e){}
  populateCutSelect();
  const sel = document.getElementById('fCut');
  if (BOOK.cutSlug && sel){
    for (let i=0;i<sel.options.length;i++){ if (sel.options[i].value === BOOK.cutSlug){ sel.selectedIndex = i; break; } }
  }
  renderBookDays();
  renderBookTimes();
  updateBookSummary();
  document.getElementById('bookDone').hidden = true;
  document.getElementById('bookFlow').hidden = false;
  // re-check what's free now; days/times re-render when it lands
  refreshAvailability();
  ['errDate','errTime','errSubmit'].forEach(clearErr);
  Object.keys(FIELD_ERR).forEach(clearFieldErr);
}

function clearErr(id){ const e = document.getElementById(id); if (e) e.textContent=''; }
function showErr(id, msg){ const e = document.getElementById(id); if (e) e.textContent = msg; }


/* field id → its error element; keeps aria-invalid in sync */
const FIELD_ERR = { fName:'errName', fPhone:'errPhone', fEmail:'errEmail', fCut:'errCut' };
function fieldErr(fieldId, msg){
  showErr(FIELD_ERR[fieldId], msg);
  const el = document.getElementById(fieldId);
  if (el) el.setAttribute('aria-invalid', 'true');
}
function clearFieldErr(fieldId){
  clearErr(FIELD_ERR[fieldId]);
  const el = document.getElementById(fieldId);
  if (el) el.removeAttribute('aria-invalid');
}

async function submitBooking(){
  let ok = true;
  if (!BOOK.day){ showErr('errDate','Pick a day for your cut.'); ok = false; }
  if (BOOK.time == null){ showErr('errTime','Pick a time.'); ok = false; }
  const name = document.getElementById('fName').value.trim();
  if (!name){ fieldErr('fName','Tell us who to call in from the waiting bench.'); ok = false; }
  const rawPhone = document.getElementById('fPhone').value;
  const phone = normalizePhonePH(rawPhone);
  if (!phone){ fieldErr('fPhone','A PH mobile number so we can text your confirmation. Try 0912 345 6789.'); ok = false; }
  const email = document.getElementById('fEmail').value.trim();
  if (!validEmail(email)){ fieldErr('fEmail','Double-check the email. We send a receipt there too.'); ok = false; }
  const cut = document.getElementById('fCut').value;
  if (!cut){ fieldErr('fCut','Pick a cut, or choose "Not sure yet".'); ok = false; }
  if (!ok){ showErr('errSubmit','A few things need a look above.'); return; }

  if (slotsFor({ key: BOOK.day }).indexOf(BOOK.time) === -1){
    showErr('errTime','That time was just taken. Pick another slot.');
    showErr('errSubmit','That slot filled up while you were filling this out.');
    renderBookTimes();
    return;
  }

  const btn = document.getElementById('bkSubmit');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Booking…';
  clearErr('errSubmit');

  const notes = document.getElementById('fNotes').value.trim();
  const cutObj = cut === '__unsure' ? { slug:'__unsure', name:'To decide in the chair' } : CUTS.find(c=>c.slug===cut);
  const date = BOOK.day, time = BOOK.time;

  try {
    const res = await createBooking({ name, phone: phone.e164, email, cut: cutObj.slug, date, time, notes });
    markTaken(date, time);
    try { localStorage.setItem('mp:me', JSON.stringify({ name, phone: rawPhone, email })); } catch(e){}
    showDone({
      ref: res.ref, name, cut: cutObj.slug, cutName: cutObj.name,
      date, time, dateStr: fmtDateLong(date), timeStr: fmtTime(time),
      price: res.price != null ? res.price : CONFIG.price
    }, phone, !!res.smsSent);
  } catch(err){
    if (err.code === 'slot_taken'){
      showErr('errTime','That time was just taken. Pick another slot.');
      showErr('errSubmit','Someone booked that slot a moment ago.');
      refreshAvailability();
    } else if (err.code === 'invalid'){
      Object.keys(err.fields || {}).forEach(k=>{
        const map = { name:'fName', phone:'fPhone', email:'fEmail', cut:'fCut' };
        if (map[k]) fieldErr(map[k], err.fields[k]);
        if (k === 'date') showErr('errDate', err.fields[k]);
        if (k === 'time') showErr('errTime', err.fields[k]);
      });
      showErr('errSubmit', err.message || 'A few things need a look above.');
    } else {
      showErr('errSubmit','We couldn\'t reach the booking system. Try again, or text us at ' + CONFIG.phoneDisplay + '.');
    }
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Confirm booking';
  }
}

function showDone(p, phone, smsSent){
  document.getElementById('bookFlow').hidden = true;
  const done = document.getElementById('bookDone');
  done.hidden = false;
  document.getElementById('doneLead').textContent = 'See you ' + p.dateStr + ' at ' + p.timeStr + '.';
  const cutObj = p.cut === '__unsure' ? null : CUTS.find(c=>c.slug===p.cut);
  document.getElementById('donePic').src = portrait(cutObj || CUTS[0], 'front');
  document.getElementById('dCut').textContent = p.cutName + ' · ' + peso(p.price);
  document.getElementById('dDate').textContent = p.dateStr;
  document.getElementById('dTime').textContent = p.timeStr;
  document.getElementById('dRef').textContent = p.ref;

  document.getElementById('smsText').textContent =
    'Hi ' + p.name.split(' ')[0] + '! Your ' + CONFIG.business + ' booking is confirmed for ' + p.dateStr + ' at ' + p.timeStr +
    '. Cut: ' + p.cutName + '. Ref: ' + p.ref + '. Reply here if plans change.';
  const st = document.getElementById('smsState');
  if (smsSent){ st.textContent = 'Sent to ' + phone.disp; st.className = 'st ok'; }
  else { st.textContent = 'Screenshot this or add it to your calendar'; st.className = 'st'; }
  if (API_MODE === 'mock') console.info('MansPeak: on-device demo, no text sent. Set VITE_API_MODE=live to use /api.');

  document.getElementById('icsBtn').onclick = ()=> downloadIcs(p);
  document.getElementById('againBtn').onclick = ()=>{
    BOOK.day = null; BOOK.time = null; BOOK.cutSlug = null;
    location.hash = '#book';
  };
  const t = document.getElementById('doneTitle');
  if (t) t.focus();
}

function downloadIcs(p){
  // build UTC start/end from the local wall time
  const [y,m,d] = p.date.split('-').map(Number);
  const startH = Math.floor(p.time/60), startM = p.time%60;
  const durMin = (CUTS.find(c=>c.slug===p.cut) || {mins:30}).mins;
  // shop wall-clock → UTC (CONFIG.utcOffsetHours; Manila has no DST)
  const startUTC = Date.UTC(y, m-1, d, startH - CONFIG.utcOffsetHours, startM);
  const endUTC = startUTC + durMin*60000;
  const fmt = (t)=>{
    const dt = new Date(t);
    return dt.getUTCFullYear() + String(dt.getUTCMonth()+1).padStart(2,'0') + String(dt.getUTCDate()).padStart(2,'0') +
      'T' + String(dt.getUTCHours()).padStart(2,'0') + String(dt.getUTCMinutes()).padStart(2,'0') + '00Z';
  };
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MansPeak//Booking//EN',
    'BEGIN:VEVENT',
    'UID:' + p.ref + '@manspeak',
    'DTSTAMP:' + fmt(Date.now()),
    'DTSTART:' + fmt(startUTC),
    'DTEND:' + fmt(endUTC),
    'SUMMARY:Haircut at ' + CONFIG.business + ' — ' + p.cutName,
    'DESCRIPTION:Ref ' + p.ref + '. ' + CONFIG.address + '. ' + CONFIG.phoneDisplay,
    'LOCATION:' + CONFIG.address,
    'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type:'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'manspeak-' + p.ref + '.ics';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 250);
}

export function initBookingForm(){
  const form = document.getElementById('bookForm');
  if (!form) return;
  form.addEventListener('submit', (e)=>{ e.preventDefault(); submitBooking(); });
  const back = document.querySelector('.bookv .back');
  if (back) back.addEventListener('click', (e)=>{ e.preventDefault(); history.length > 1 ? history.back() : (location.hash = ''); });
  const sel = document.getElementById('fCut');
  sel.addEventListener('change', ()=>{ BOOK.cutSlug = sel.value; updateBookSummary(); clearFieldErr('fCut'); });
  document.getElementById('fPhone').addEventListener('blur', (e)=>{
    const n = normalizePhonePH(e.target.value);
    if (n){ e.target.value = n.disp; clearFieldErr('fPhone'); }
  });
  document.getElementById('fName').addEventListener('input', ()=> clearFieldErr('fName'));
  document.getElementById('fEmail').addEventListener('input', ()=> clearFieldErr('fEmail'));
  // fresh availability while the booking view is open → redraw days + times
  onAvailabilityChange(()=>{
    if (document.getElementById('view-book').hidden) return;
    renderBookDays(); renderBookTimes();
  });
}
