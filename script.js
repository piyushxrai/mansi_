/* ============================================================
   ELEMENTS
   ============================================================ */
const screens        = document.querySelectorAll('.screen');
const welcomeScreen  = document.getElementById('welcomeScreen');
const cakeScreen     = document.getElementById('cakeScreen');
const fireworkScreen = document.getElementById('fireworkScreen');
const gardenScreen   = document.getElementById('gardenScreen');
const finalScreen    = document.getElementById('finalScreen');

const startBtn        = document.getElementById('startBtn');
const cakeContinue    = document.getElementById('cakeContinue');
const fireworkContinue= document.getElementById('fireworkContinue');
const gardenContinue  = document.getElementById('gardenContinue');

const birthdayHeading = document.getElementById('birthdayHeading');
const gardenText      = document.getElementById('gardenText');
const finalText       = document.getElementById('finalText');
const finalLove       = document.getElementById('finalLove');

/* ============================================================
   HELPERS
   ============================================================ */
function hideAllScreens() {
  screens.forEach(s => s.classList.remove('active'));
}

function showScreen(screen) {
  hideAllScreens();
  screen.classList.add('active');
}

function typeWriter(element, text, speed = 45, onDone) {
  element.innerHTML = '';
  let i = 0;
  const timer = setInterval(() => {
    element.innerHTML += text.charAt(i);
    i++;
    if (i >= text.length) {
      clearInterval(timer);
      if (onDone) onDone();
    }
  }, speed);
}

/* ============================================================
   WELCOME — floating hearts
   ============================================================ */
const heartEmojis = ['❤️','🩷','💕','💖','💗','💓','🌸','✨'];
const floatingHeartsContainer = document.getElementById('floatingHearts');

function spawnHeart() {
  const el = document.createElement('span');
  el.classList.add('heart-particle');
  el.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
  el.style.left    = Math.random() * 100 + 'vw';
  el.style.fontSize = (0.9 + Math.random() * 1.2) + 'rem';
  const dur = 6 + Math.random() * 7;
  el.style.animationDuration = dur + 's';
  el.style.animationDelay   = Math.random() * 3 + 's';
  floatingHeartsContainer.appendChild(el);
  setTimeout(() => el.remove(), (dur + 3) * 1000);
}

setInterval(spawnHeart, 600);

/* ============================================================
   WELCOME → CAKE
   ============================================================ */
startBtn.addEventListener('click', () => {
  showScreen(cakeScreen);
});

/* ============================================================
   CAKE LOGIC — easy blow-out with large hover/touch zone
   ============================================================ */
const flames = document.querySelectorAll('.flame');
let blownCount = 0;

function blowFlame(flame) {
  if (flame.classList.contains('blown')) return;
  flame.classList.add('blown');

  // Add smoke puff on the candle
  const candle = flame.closest('.candle');
  const smoke = document.createElement('div');
  smoke.classList.add('smoke');
  candle.appendChild(smoke);
  setTimeout(() => smoke.remove(), 1100);

  blownCount++;
  if (blownCount === flames.length) {
    setTimeout(() => {
      document.getElementById('wishText').classList.remove('hidden');
      cakeContinue.classList.remove('hidden');
    }, 500);
  }
}

/* Desktop — mouseenter fires on a large invisible area via ::before pseudo */
flames.forEach(flame => {
  flame.addEventListener('mouseenter', () => blowFlame(flame));
  /* Also blow on mousemove so a gentle pass triggers it */
  flame.addEventListener('mousemove', () => blowFlame(flame));
});

/* Mobile — touchstart & touchmove so a gentle rub counts */
flames.forEach(flame => {
  flame.addEventListener('touchstart', e => {
    e.preventDefault();
    blowFlame(flame);
  }, { passive: false });
});

/* touchmove across multiple flames */
document.addEventListener('touchmove', e => {
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (el && el.classList.contains('flame')) blowFlame(el);
}, { passive: true });

/* ============================================================
   CAKE → FIREWORKS
   ============================================================ */
cakeContinue.addEventListener('click', () => {
  showScreen(fireworkScreen);
  startFireworkSequence();
});

/* ============================================================
   FIREWORKS ENGINE  (adapted from original code)
   ============================================================ */
const canvas = document.getElementById('fireworksCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let particles = [];

/* ------ Particle class ------ */
class Particle {
  constructor(x, y, color, angle, speed, options = {}) {
    this.x     = x;
    this.y     = y;
    this.color = color;
    this.alpha = 1;
    this.radius = options.radius || (Math.random() * 3 + 1.2);
    this.trail  = options.trail  || false; // willow trail

    const spd = options.willow
      ? speed * (0.4 + Math.random() * 0.6)   // slower for willows
      : speed;

    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;

    /* Willows droop heavily downward */
    this.gravity = options.willow ? 0.055 : 0.028;
    this.decay   = options.willow ? 0.013 : 0.010;

    /* sparkle twinkle */
    this.twinkle = options.twinkle || false;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.twinkle && Math.random() < 0.15) {
      ctx.globalAlpha = this.alpha * (0.3 + Math.random() * 0.7);
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.x  += this.vx;
    this.y  += this.vy;
    this.vy += this.gravity;
    /* Willows drift slightly sideways */
    if (this.trail) this.vx *= 0.995;
    this.alpha -= this.decay;
  }
}

/* ------ Rocket trail particle ------ */
class RocketTrail {
  constructor(x, startY, targetY, color, onBurst) {
    this.x       = x;
    this.y       = startY;
    this.targetY = targetY;
    this.color   = color;
    this.onBurst = onBurst;
    this.speed   = (startY - targetY) / 28; // steps to reach target
    this.done    = false;
    this.trail   = [];
  }

  update() {
    if (this.done) return;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.shift();

    /* Draw trail */
    this.trail.forEach((pt, i) => {
      ctx.save();
      ctx.globalAlpha = (i / this.trail.length) * 0.6;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur  = 6;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    });

    /* Draw rocket head */
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur  = 12;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();

    this.y -= this.speed;

    if (this.y <= this.targetY) {
      this.done = true;
      this.onBurst(this.x, this.targetY);
    }
  }
}

let rockets = [];

/* ------ Normal burst ------ */
function launchFirework(forcedX, forcedY, forceColor) {
  const x       = forcedX !== undefined ? forcedX : (0.1 + Math.random() * 0.8) * canvas.width;
  const targetY = forcedY !== undefined ? forcedY : (0.08 + Math.random() * 0.38) * canvas.height;
  const startY  = canvas.height + 10;

  const palette = [
    ['#ff0055','#ff4488','#ff99bb'],
    ['#ffd700','#ffec80','#fff5c0'],
    ['#00ffee','#80fff7','#ccfffc'],
    ['#ff66ff','#ffaaff','#ffe0ff'],
    ['#ff8800','#ffaa44','#ffd090'],
    ['#aaffaa','#66ff66','#00ff44'],
    ['#ffffff','#ffe0e0','#ffd0ff'],
  ];

  const group     = forceColor ? [forceColor] : palette[Math.floor(Math.random() * palette.length)];
  const rocketCol = group[0];
  const isWillow  = Math.random() < 0.42;

  rockets.push(new RocketTrail(x, startY, targetY, rocketCol, (bx, by) => {
    /* Core burst */
    const count = isWillow ? 90 : 110;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = isWillow ? (1.8 + Math.random() * 3.5) : (2.5 + Math.random() * 5.5);
      const color = group[Math.floor(Math.random() * group.length)];
      particles.push(new Particle(bx, by, color, angle, speed, {
        willow: isWillow,
        trail:  isWillow,
        twinkle: !isWillow && Math.random() < 0.4,
      }));
    }
    /* Ring of sparks */
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      particles.push(new Particle(bx, by, '#ffffff', angle, 1.2 + Math.random() * 2, {
        radius: 1.5, twinkle: true,
      }));
    }
  }));
}

/* ------ Heart burst (red heart firecracker from bottom centre) ------ */
function launchHeart() {
  const cx      = canvas.width  * 0.5;
  const targetY = canvas.height * 0.38;
  const startY  = canvas.height + 10;

  rockets.push(new RocketTrail(cx, startY, targetY, '#ff2255', (bx, by) => {
    /* Big flash */
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      particles.push(new Particle(bx, by, '#ffffff', angle, 1 + Math.random() * 3, {
        radius: 1.5, twinkle: true,
      }));
    }
    /* Heart shape */
    for (let t = 0; t < Math.PI * 2; t += 0.08) {
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
      particles.push({ x: bx, y: by, vx: hx * 0.14, vy: hy * 0.14, alpha: 1, color: '#ff2255', radius: 2.5, heart: true, gravity: 0.018, decay: 0.008 });
    }
    /* Secondary heart */
    for (let t = 0; t < Math.PI * 2; t += 0.12) {
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
      particles.push({ x: bx, y: by, vx: hx * 0.19, vy: hy * 0.19, alpha: 1, color: '#ff6699', radius: 1.8, heart: true, gravity: 0.016, decay: 0.007 });
    }
  }));
}

/* ------ Animation loop ------ */
function animateFireworks() {
  requestAnimationFrame(animateFireworks);

  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* Update rockets */
  for (let i = rockets.length - 1; i >= 0; i--) {
    rockets[i].update();
    if (rockets[i].done) rockets.splice(i, 1);
  }

  /* Update particles */
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.heart) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
    } else {
      p.update();
    }
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

animateFireworks();

/* ============================================================
   FIREWORK SEQUENCE
   Slow, synchronized — one firework every ~700ms
   Heart fires after 4th burst (~2.8 s)
   Message at ~4 s
   ============================================================ */
function startFireworkSequence() {
  let launched = 0;
  let heartDone = false;

  const launcher = setInterval(() => {
    launchFirework();
    launched++;

    /* After 4 bursts, fire the heart firecracker */
    if (launched === 4 && !heartDone) {
      heartDone = true;
      setTimeout(launchHeart, 350);
    }
  }, 700);

  /* Birthday message typewriter after ~3 s */
  setTimeout(() => {
    typeWriter(
      birthdayHeading,
      'Happy Birthday\nMansi ❤️',
      90
    );
  }, 3000);

  /* Show continue button at ~9 s */
  setTimeout(() => {
    fireworkContinue.classList.remove('hidden');
  }, 9000);

  fireworkContinue.addEventListener('click', () => {
    clearInterval(launcher);
    showGarden();
  }, { once: true });
}

/* ============================================================
   GARDEN SCREEN
   ============================================================ */
function buildTulips() {
  const field = document.getElementById('tulipField');
  field.innerHTML = '';

  // Each group: array of { emoji, size } where size is 'tall'|'med'|'short'
  const groups = [
    [ {e:'🌷',s:'short'}, {e:'🌷',s:'tall'}, {e:'🌸',s:'med'} ],
    [ {e:'🌷',s:'med'},   {e:'🌷',s:'tall'}, {e:'🌷',s:'med'}, {e:'🌸',s:'short'} ],
    [ {e:'🌸',s:'short'}, {e:'🌷',s:'tall'}, {e:'🌷',s:'short'} ],
    [ {e:'🌷',s:'med'},   {e:'🌸',s:'tall'}, {e:'🌷',s:'med'} ],
    [ {e:'🌷',s:'short'}, {e:'🌷',s:'tall'}, {e:'🌸',s:'med'}, {e:'🌷',s:'short'} ],
    [ {e:'🌸',s:'med'},   {e:'🌷',s:'tall'}, {e:'🌷',s:'short'} ],
  ];

  let globalIdx = 0;

  groups.forEach((groupDef, gi) => {
    const groupEl = document.createElement('div');
    groupEl.classList.add('tulip-group');

    groupDef.forEach(({ e, s }) => {
      const tulip = document.createElement('div');
      tulip.classList.add('tulip', s);

      const head = document.createElement('div');
      head.classList.add('tulip-head');
      head.textContent = e;

      const stem = document.createElement('div');
      stem.classList.add('tulip-stem');

      tulip.appendChild(head);
      tulip.appendChild(stem);

      const delay = globalIdx * 0.11;
      tulip.style.animationDelay = delay + 's';

      /* After grow animation finishes, add sway */
      setTimeout(() => {
        tulip.style.animation = `sway ${2.4 + Math.random() * 1.2}s ease-in-out infinite`;
        tulip.style.animationDelay = (Math.random() * 0.8) + 's';
      }, (1300 + delay * 1000));

      groupEl.appendChild(tulip);
      globalIdx++;
    });

    field.appendChild(groupEl);
  });
}

function buildPetals() {
  const layer = document.querySelector('.petals-layer');
  layer.innerHTML = '';
  const petalEmoji = ['🌸','🌺','🌼','🌷','✿'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span');
    p.classList.add('petal');
    p.textContent = petalEmoji[Math.floor(Math.random() * petalEmoji.length)];
    p.style.left            = Math.random() * 100 + 'vw';
    p.style.fontSize        = (0.9 + Math.random() * 1.3) + 'rem';
    p.style.animationDuration = (8 + Math.random() * 10) + 's';
    p.style.animationDelay    = (Math.random() * 8) + 's';
    layer.appendChild(p);
  }
}

function showGarden() {
  showScreen(gardenScreen);
  buildTulips();
  buildPetals();

  const msg =
`If flowers could choose a queen,
the tulips would step aside for you.

They may have beautiful colors,
but none carry the grace you do. 🌷`;

  typeWriter(gardenText, msg, 38, () => {
    setTimeout(() => gardenContinue.classList.remove('hidden'), 2500);
  });
}

/* ============================================================
   FINAL SCREEN
   ============================================================ */
function showFinal() {
  showScreen(finalScreen);

  const msg =
`If life ever lets me gift you something,

I would place my eyes in your hands.

Not flowers that fade, not even words,

But the sight itself —

Look at yourself through them
and you will understand

how flawless you really are `;

  // Emoji appended separately as non-italic span after typewriter finishes
  typeWriter(finalText, msg, 48, () => {
    const emojiSpan = document.createElement('span');
    emojiSpan.style.fontStyle = 'normal';
    emojiSpan.textContent = '👀🤧';
    finalText.appendChild(emojiSpan);
    setTimeout(() => finalLove.classList.remove('hidden'), 800);
  });
}

gardenContinue.addEventListener('click', showFinal);