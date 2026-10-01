/* ============================================================
   CONTENT BINDING — contact details, prices, JSON-LD, portraits.
   Everything editable lives in src/config.js; the HTML carries
   placeholders that are filled from it here.
   ============================================================ */
import { CONFIG, peso } from '../config.js';
import { CUTS } from '../data/cuts.js';
import { portrait } from '../lib/portrait.js';

export function bindContact(){
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.mapQuery || CONFIG.business + ' ' + CONFIG.address);
  const smsMsg = encodeURIComponent("Hi MansPeak, I'd like to book a haircut.");
  const links = {
    map: mapUrl,
    tel: 'tel:' + CONFIG.phone,
    sms: 'sms:' + CONFIG.phone + '?body=' + smsMsg,
    mail: 'mailto:' + CONFIG.email,
    facebook: CONFIG.social.facebook || '',
    instagram: CONFIG.social.instagram || '',
    tiktok: CONFIG.social.tiktok || ''
  };
  const binds = {
    address: CONFIG.address,
    phone: CONFIG.phoneDisplay,
    email: CONFIG.email,
    owner: CONFIG.owner,
    hours: CONFIG.hours,
    business: CONFIG.business
  };
  document.querySelectorAll('[data-bind]').forEach(el=>{
    const k = el.getAttribute('data-bind');
    if (binds[k] != null) el.textContent = binds[k];
  });
  document.querySelectorAll('[data-link]').forEach(el=>{
    const k = el.getAttribute('data-link');
    if (links[k] != null){
      if (links[k]) el.setAttribute('href', links[k]);
      else el.setAttribute('href', '#'); // graceful when a social URL is blank
    }
  });
}

export function injectJsonLd(){
  const j = {
    "@context":"https://schema.org", "@type":"BarberShop",
    "name": CONFIG.business,
    "description": CONFIG.tagline,
    "telephone": CONFIG.phone,
    "email": CONFIG.email,
    "address": { "@type":"PostalAddress", "streetAddress": CONFIG.address },
    "openingHours": "Mo-Su " + String(CONFIG.openHour).padStart(2,'0') + ":00-" + String(CONFIG.closeHour).padStart(2,'0') + ":00",
    "priceRange": peso()
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(j);
  document.head.appendChild(s);
}


/** Every [data-price] element shows the one flat price. */
export function fillPrices(){
  document.querySelectorAll('[data-price]').forEach(el=> el.textContent = peso());
}

/** Owner portrait in About (illustrative until a real photo is supplied). */
export function fillAboutPortrait(){
  const bp = document.getElementById('barberPic');
  if (bp) bp.src = portrait(CUTS[7], 'front');
}
