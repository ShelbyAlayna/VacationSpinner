(function () {
  const STARTERS = ["New York", "Arizona", "Colorado", "Utah", "Joshua Tree", "Washington"];
  const COLORS = ["#9CAF88", "#E6D3B3", "#C9876A", "#9DB8C9", "#8A9A6E", "#D4A59A"];
  const EMOJIS = ["🏜️", "🌵", "🏔️", "🗽", "🌲", "⛰️", "🏕️", "🚗", "🌄", "🎒"];
  const STORE_KEY = "vacation-wheel-places";

  let places = load();
  let rotation = 0;
  let spinning = false;
  let lastWinner = -1;

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const chips = document.getElementById("chips");
  const msg = document.getElementById("msg");
  const input = document.getElementById("placeInput");
  const spinBtn = document.getElementById("spinBtn");
  const overlay = document.getElementById("overlay");
  const pointer = document.getElementById("pointer");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (Array.isArray(saved) && saved.length >= 2) return saved;
    } catch (e) {}
    return STARTERS.slice();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(places)); } catch (e) {}
  }

  function colorFor(i) {
    // avoid two neighbours sharing a color when the count wraps around
    let c = COLORS[i % COLORS.length];
    if (i === places.length - 1 && i % COLORS.length === 0 && i > 0) c = COLORS[2];
    return c;
  }

  function sizeCanvas() {
    const size = canvas.getBoundingClientRect().width;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const size = canvas.getBoundingClientRect().width;
    const r = size / 2;
    const arc = (Math.PI * 2) / places.length;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(rotation);
    places.forEach((place, i) => {
      const start = i * arc;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, start + arc);
      ctx.closePath();
      ctx.fillStyle = colorFor(i);
      ctx.fill();
      ctx.strokeStyle = "#FFFDF8";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + arc / 2);
      ctx.fillStyle = "#1F3A5F";
      const fontSize = Math.max(11, Math.min(17, size / 26, (arc * r) / 2.4));
      ctx.font = `700 ${fontSize}px Quicksand, system-ui, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      let label = place;
      const maxW = r * 0.62;
      while (ctx.measureText(label).width > maxW && label.length > 3) label = label.slice(0, -2);
      if (label !== place) label = label.trimEnd() + "…";
      ctx.fillText(label, r - 16, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  function renderChips() {
    chips.innerHTML = "";
    places.forEach((p, i) => {
      const li = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = colorFor(i);
      const text = document.createElement("span");
      text.textContent = p;
      const x = document.createElement("button");
      x.type = "button";
      x.textContent = "✕";
      x.setAttribute("aria-label", "Remove " + p);
      x.onclick = () => removePlace(i);
      li.append(dot, text, x);
      chips.append(li);
    });
    draw();
  }

  function addPlace() {
    const val = input.value.trim();
    msg.textContent = "";
    if (!val) { msg.textContent = "Type a place first."; return; }
    if (places.length >= 16) { msg.textContent = "The wheel holds 16 spots max. Remove one to add another."; return; }
    if (places.some(p => p.toLowerCase() === val.toLowerCase())) { msg.textContent = val + " is already on the wheel."; return; }
    places.push(val);
    input.value = "";
    save(); renderChips();
  }

  function removePlace(i) {
    msg.textContent = "";
    if (places.length <= 2) { msg.textContent = "Keep at least 2 places so there's something to spin."; return; }
    places.splice(i, 1);
    save(); renderChips();
  }

  function indexAtPointer() {
    const arc = (Math.PI * 2) / places.length;
    const TAU = Math.PI * 2;
    const rel = ((-Math.PI / 2 - rotation) % TAU + TAU) % TAU;
    return Math.floor(rel / arc) % places.length;
  }

  function spin() {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    msg.textContent = "";
    const startRot = rotation;
    const extra = (reduceMotion ? 1 : 5 + Math.random() * 3) * Math.PI * 2 + Math.random() * Math.PI * 2;
    const duration = reduceMotion ? 600 : 4800 + Math.random() * 800;
    const t0 = performance.now();
    let lastIdx = indexAtPointer();

    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      rotation = startRot + extra * eased;
      draw();
      const idx = indexAtPointer();
      if (idx !== lastIdx && !reduceMotion) {
        lastIdx = idx;
        pointer.classList.remove("wiggle");
        void pointer.offsetWidth;
        pointer.classList.add("wiggle");
      }
      if (t < 1) requestAnimationFrame(frame);
      else finish();
    }
    requestAnimationFrame(frame);
  }

  function finish() {
    rotation = rotation % (Math.PI * 2);
    spinning = false;
    spinBtn.disabled = false;
    lastWinner = indexAtPointer();
    showPass(places[lastWinner]);
  }

  function showPass(place) {
    const rand = n => Math.floor(Math.random() * n);
    document.getElementById("destName").textContent = place;
    const code = place.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
    document.getElementById("destCode").textContent = code;
    document.getElementById("flightNo").textContent = "VW " + (100 + rand(900));
    document.getElementById("gate").textContent = "ABCD"[rand(4)] + (1 + rand(30));
    document.getElementById("seat").textContent = (1 + rand(32)) + "ABCDEF"[rand(6)];
    document.getElementById("stubEmoji").textContent = EMOJIS[rand(EMOJIS.length)];
    overlay.classList.add("show");
    document.getElementById("againBtn").focus();
    confetti();
  }

  function closePass() { overlay.classList.remove("show"); spinBtn.focus(); }

  function confetti() {
    if (reduceMotion) return;
    const bits = ["🌸", "✨", "🌴", "💗", "☀️", "✈️"];
    for (let i = 0; i < 28; i++) {
      const s = document.createElement("span");
      s.className = "confetti";
      s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDuration = 2 + Math.random() * 2 + "s";
      s.style.animationDelay = Math.random() * 0.4 + "s";
      document.body.append(s);
      setTimeout(() => s.remove(), 4600);
    }
  }

  document.getElementById("addForm").addEventListener("submit", addPlace);
  spinBtn.addEventListener("click", spin);
  document.getElementById("resetBtn").addEventListener("click", () => {
    places = STARTERS.slice(); msg.textContent = ""; save(); renderChips();
  });
  document.getElementById("againBtn").addEventListener("click", () => { closePass(); spin(); });
  document.getElementById("removeBtn").addEventListener("click", () => {
    closePass();
    if (places.length <= 2) { msg.textContent = "Only 2 left, so that one stays. Add more or spin again."; return; }
    places.splice(lastWinner, 1); save(); renderChips(); spin();
  });
  overlay.addEventListener("click", e => { if (e.target === overlay) closePass(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && overlay.classList.contains("show")) closePass(); });
  window.addEventListener("resize", sizeCanvas);

  renderChips();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(sizeCanvas);
  sizeCanvas();
})();
