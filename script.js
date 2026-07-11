// ---------- Loader ----------
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 500);
});

// ---------- Nav scroll state ----------
const nav = document.getElementById('siteNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, {passive:true});

// ---------- Mobile nav ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// ---------- Reveal on scroll ----------
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.classList.add('in-view');
      io.unobserve(e.target);
    }
  });
}, {threshold:0.15});
revealEls.forEach(el => io.observe(el));

// ---------- Counters ----------
const counters = document.querySelectorAll('.count');
const cIo = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const dur = 1400;
      const start = performance.now();
      function tick(now){
        const p = Math.min(1, (now - start) / dur);
        el.textContent = Math.floor(p * target);
        if(p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
      cIo.unobserve(el);
    }
  });
}, {threshold:0.5});
counters.forEach(el => cIo.observe(el));

// ---------- Rating bars ----------
const bars = document.querySelectorAll('.rbar-fill');
const bIo = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.style.width = e.target.dataset.pct + '%';
      bIo.unobserve(e.target);
    }
  });
}, {threshold:0.4});
bars.forEach(b => bIo.observe(b));

// ---------- Rain canvas ----------
const canvas = document.getElementById('rainCanvas');
const ctx = canvas.getContext('2d');
let drops = [];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resizeCanvas(){
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
function initDrops(){
  drops = [];
  const count = Math.floor((canvas.width * canvas.height) / 22000);
  for(let i=0;i<count;i++){
    drops.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      len: 14 + Math.random()*22,
      speed: 4 + Math.random()*5,
      opacity: 0.08 + Math.random()*0.18
    });
  }
}
function drawRain(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = 'rgba(216,198,140,0.5)';
  ctx.lineWidth = 1;
  drops.forEach(d => {
    ctx.beginPath();
    ctx.globalAlpha = d.opacity;
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - 2, d.y + d.len);
    ctx.stroke();
    d.y += d.speed;
    d.x -= 0.6;
    if(d.y > canvas.height){ d.y = -20; d.x = Math.random()*canvas.width; }
  });
  ctx.globalAlpha = 1;
  if(!reduceMotion) requestAnimationFrame(drawRain);
}
resizeCanvas();
initDrops();
if(!reduceMotion){ drawRain(); }
window.addEventListener('resize', () => { resizeCanvas(); initDrops(); });

// ---------- Gallery Lightbox ----------
const figures = Array.from(document.querySelectorAll('.gallery-grid figure'));
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCaption = document.getElementById('lbCaption');
let lbIndex = 0;

function openLightbox(i){
  lbIndex = i;
  const f = figures[lbIndex];
  lbImg.src = f.dataset.full;
  lbImg.alt = f.dataset.caption;
  lbCaption.textContent = f.dataset.caption;
  lightbox.classList.add('open');
}
function closeLightbox(){ lightbox.classList.remove('open'); }
function shiftLightbox(dir){
  lbIndex = (lbIndex + dir + figures.length) % figures.length;
  openLightbox(lbIndex);
}
figures.forEach((f,i) => f.addEventListener('click', () => openLightbox(i)));
document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => shiftLightbox(-1));
document.getElementById('lbNext').addEventListener('click', () => shiftLightbox(1));
lightbox.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowLeft') shiftLightbox(-1);
  if(e.key === 'ArrowRight') shiftLightbox(1);
});

// ---------- Feedback: star picker ----------
const starPicker = document.getElementById('starPicker');
const fbRatingInput = document.getElementById('fbRating');
let currentRating = 0;
starPicker.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    currentRating = parseInt(btn.dataset.val, 10);
    fbRatingInput.value = currentRating;
    starPicker.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.val,10) <= currentRating);
    });
  });
});

// ---------- Feedback storage (persistent, shared) ----------
const feedbackList = document.getElementById('feedbackList');
const wallAvg = document.getElementById('wallAvg');
const FEEDBACK_KEY = 'harshavardhan-villa-feedback';
let feedbackData = [];

function starsSVG(n){
  let out = '';
  for(let i=0;i<5;i++){
    out += `<svg viewBox="0 0 24 24" style="${i < n ? '' : 'fill:none;stroke:var(--line);'}"><polygon points="12 2 15 9 22 9.5 16.5 14.5 18 22 12 18 6 22 7.5 14.5 2 9.5 9 9"/></svg>`;
  }
  return out;
}
function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
}
function renderFeedback(){
  if(!feedbackData.length){
    feedbackList.innerHTML = '<div class="wall-empty">No feedback yet — be the first guest to share how your stay went.</div>';
    wallAvg.textContent = 'No ratings yet';
    return;
  }
  const sorted = [...feedbackData].sort((a,b) => new Date(b.date) - new Date(a.date));
  feedbackList.innerHTML = sorted.map(fb => `
    <div class="fb-card">
      <div class="fb-top">
        <div>
          <div class="fb-name">${fb.name}</div>
          <div class="fb-date">${formatDate(fb.date)}</div>
        </div>
        <div class="fb-stars">${starsSVG(fb.rating)}</div>
      </div>
      <div class="fb-msg">${fb.message}</div>
    </div>
  `).join('');
  const avg = (feedbackData.reduce((s,f) => s + f.rating, 0) / feedbackData.length).toFixed(2);
  wallAvg.innerHTML = `<span class="avg">${avg} ★</span> average from ${feedbackData.length} guest${feedbackData.length===1?'':'s'}`;
}

function escapeHTML(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadFeedback(){
  try{
    const result = await window.storage.get(FEEDBACK_KEY, true);
    feedbackData = result && result.value ? JSON.parse(result.value) : [];
  }catch(err){
    feedbackData = [];
  }
  renderFeedback();
}

async function saveFeedback(entry){
  feedbackData.push(entry);
  renderFeedback();
  try{
    await window.storage.set(FEEDBACK_KEY, JSON.stringify(feedbackData), true);
  }catch(err){
    console.error('Could not persist feedback', err);
  }
}

const feedbackForm = document.getElementById('feedbackForm');
feedbackForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('fbName').value.trim();
  const msg = document.getElementById('fbMsg').value.trim();
  const rating = currentRating;
  if(!name || !msg || rating === 0){
    if(rating === 0){ starPicker.style.animation = 'none'; starPicker.offsetHeight; starPicker.style.animation = 'shake 0.4s'; }
    return;
  }
  const entry = { name: escapeHTML(name), message: escapeHTML(msg), rating, date: new Date().toISOString() };
  await saveFeedback(entry);
  feedbackForm.reset();
  currentRating = 0;
  fbRatingInput.value = 0;
  starPicker.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  const btn = feedbackForm.querySelector('.submit-btn');
  const original = btn.innerHTML;
  btn.innerHTML = 'Thank you ✓';
  setTimeout(() => btn.innerHTML = original, 1800);
});

loadFeedback();

// shake keyframe injected for validation nudge
const styleTag = document.createElement('style');
styleTag.textContent = `@keyframes shake{10%,90%{transform:translateX(-2px);}20%,80%{transform:translateX(3px);}30%,50%,70%{transform:translateX(-5px);}40%,60%{transform:translateX(5px);}}`;
document.head.appendChild(styleTag);
// ---------- Sticky bottom bar ----------
const stickyBar = document.getElementById('stickyBar');
const heroEl = document.querySelector('.hero');
const sbIo = new IntersectionObserver((entries) => {
  entries.forEach(e => stickyBar.classList.toggle('show', !e.isIntersecting));
}, {threshold:0});
sbIo.observe(heroEl);

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
  });
});

// ---------- Guest stepper ----------
const guestState = { adults: 2, children: 0 };
document.querySelectorAll('.step-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    const dir = parseInt(btn.dataset.dir, 10);
    const min = target === 'adults' ? 1 : 0;
    const totalOther = target === 'adults' ? guestState.children : guestState.adults;
    let next = guestState[target] + dir;
    next = Math.max(min, Math.min(8 - totalOther, next));
    guestState[target] = next;
    document.getElementById(target === 'adults' ? 'adultsCount' : 'childrenCount').textContent = next;
    updateSummary();
  });
});

// ---------- Booking date + price logic ----------
const NIGHTLY_RATE = 9500; // indicative rate — replace with the host's confirmed nightly price
const bkCheckin = document.getElementById('bkCheckin');
const bkCheckout = document.getElementById('bkCheckout');
const todayISO = new Date().toISOString().split('T')[0];
bkCheckin.min = todayISO;
bkCheckout.min = todayISO;

function fmtDate(iso){
  if(!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {day:'numeric', month:'short'});
}
function fmtINR(n){
  return '₹' + n.toLocaleString('en-IN');
}
function updateSummary(){
  const ciVal = bkCheckin.value, coVal = bkCheckout.value;
  const sumDates = document.getElementById('sumDates');
  const sumNights = document.getElementById('sumNights');
  const sumGuests = document.getElementById('sumGuests');
  const sumTotal = document.getElementById('sumTotal');

  let nights = 0;
  if(ciVal && coVal){
    const ci = new Date(ciVal), co = new Date(coVal);
    nights = Math.round((co - ci) / 86400000);
  }
  if(ciVal && coVal && nights > 0){
    sumDates.textContent = `${fmtDate(ciVal)} → ${fmtDate(coVal)}`;
    sumNights.textContent = nights + (nights === 1 ? ' night' : ' nights');
    sumTotal.textContent = fmtINR(nights * NIGHTLY_RATE);
  } else {
    sumDates.textContent = ciVal ? fmtDate(ciVal) + ' → select checkout' : 'Select dates';
    sumNights.textContent = '—';
    sumTotal.textContent = '—';
  }
  const g = guestState.adults + guestState.children;
  sumGuests.textContent = `${guestState.adults} adult${guestState.adults===1?'':'s'}` + (guestState.children ? `, ${guestState.children} child${guestState.children===1?'':'ren'}` : '');
}
bkCheckin.addEventListener('change', () => {
  bkCheckout.min = bkCheckin.value || todayISO;
  if(bkCheckout.value && bkCheckout.value <= bkCheckin.value){ bkCheckout.value = ''; }
  updateSummary();
});
bkCheckout.addEventListener('change', updateSummary);
updateSummary();

// ---------- Booking inquiry submit (private, per-visitor storage) ----------
const BOOKING_KEY = 'harshavardhan-villa-inquiries';
const bookingForm = document.getElementById('bookingForm');
const bookingConfirm = document.getElementById('bookingConfirm');
const confirmRef = document.getElementById('confirmRef');

function genRef(){
  return 'HV-' + Math.random().toString(36).slice(2,7).toUpperCase();
}

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(bkCheckout.value && bkCheckin.value && bkCheckout.value <= bkCheckin.value){
    bkCheckout.setCustomValidity('Checkout must be after check-in');
    bkCheckout.reportValidity();
    return;
  }
  bkCheckout.setCustomValidity('');

  const ref = genRef();
  const inquiry = {
    ref,
    name: document.getElementById('bkName').value.trim(),
    email: document.getElementById('bkEmail').value.trim(),
    phone: document.getElementById('bkPhone').value.trim(),
    checkin: bkCheckin.value,
    checkout: bkCheckout.value,
    adults: guestState.adults,
    children: guestState.children,
    notes: document.getElementById('bkNotes').value.trim(),
    submittedAt: new Date().toISOString()
  };

  try{
    const existing = await window.storage.get(BOOKING_KEY, false).catch(() => null);
    const list = existing && existing.value ? JSON.parse(existing.value) : [];
    list.push(inquiry);
    await window.storage.set(BOOKING_KEY, JSON.stringify(list), false);
  }catch(err){
    console.error('Could not persist booking inquiry', err);
  }

  confirmRef.textContent = ref;
  bookingForm.hidden = true;
  bookingConfirm.hidden = false;
  bookingConfirm.scrollIntoView({behavior:'smooth', block:'center'});
});

document.getElementById('confirmClose').addEventListener('click', () => {
  bookingForm.reset();
  bookingForm.hidden = false;
  bookingConfirm.hidden = true;
  guestState.adults = 2; guestState.children = 0;
  document.getElementById('adultsCount').textContent = '2';
  document.getElementById('childrenCount').textContent = '0';
  updateSummary();
});

// ---------- Cursor cat companion ----------
const cursorCat = document.getElementById('cursorCat');
if(cursorCat){
  let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
  let catX = mouseX, catY = mouseY;
  let lastX = catX;
  let idleTimer = null;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursorCat.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => cursorCat.classList.add('idle'), 700);
  });

  function animateCat(){
    const dx = mouseX - catX;
    const dy = mouseY - catY;
    catX += dx * 0.14;
    catY += dy * 0.14;

    if(Math.abs(catX - lastX) > 0.4){
      cursorCat.classList.toggle('flip', catX < lastX);
    }
    lastX = catX;

    cursorCat.style.transform = `translate(${catX}px, ${catY + 26}px) translate(-50%,-50%)`;
    requestAnimationFrame(animateCat);
  }
  requestAnimationFrame(animateCat);
}
