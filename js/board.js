/* ===== 练习画板：铅笔 / 炭笔 / 毛笔 / 橡皮 ===== */
(function () {
  const canvas = document.getElementById("draw-canvas");
  const ctx = canvas.getContext("2d");
  const ghostCanvas = document.getElementById("ghost-canvas");

  const state = {
    tool: "pencil",
    size: 6,
    opacity: 0.6,
    drawing: false,
    lastX: 0, lastY: 0, lastTime: 0,
    history: [],
    maxHistory: 25
  };

  // 白底
  function fillWhite() {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  fillWhite();

  function pushHistory() {
    try {
      state.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (state.history.length > state.maxHistory) state.history.shift();
    } catch (e) { /* ignore */ }
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  }

  /* --- 笔触实现 --- */
  // 铅笔：细颗粒的多条微线
  function pencilStamp(x, y, angle, speed) {
    const n = Math.max(2, Math.round(state.size * 0.8));
    ctx.save();
    ctx.strokeStyle = "#2f2f2f";
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = state.opacity * (0.12 + Math.random() * 0.22);
      ctx.lineWidth = 0.7 + Math.random() * 0.8;
      const off = (Math.random() - 0.5) * state.size;
      const ox = Math.cos(angle + Math.PI / 2) * off;
      const oy = Math.sin(angle + Math.PI / 2) * off;
      ctx.beginPath();
      ctx.moveTo(x + ox - Math.cos(angle) * 2, y + oy - Math.sin(angle) * 2);
      ctx.lineTo(x + ox + Math.cos(angle) * 2, y + oy + Math.sin(angle) * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  // 炭笔：宽而糙的方向性涂抹
  function charcoalStamp(x, y, angle) {
    ctx.save();
    const r = state.size * 1.2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(20,20,20," + state.opacity * 0.5 + ")");
    g.addColorStop(1, "rgba(20,20,20,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, angle, 0, 7);
    ctx.fill();
    // 颗粒
    ctx.fillStyle = "rgba(15,15,15," + state.opacity * 0.35 + ")";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(x + (Math.random() - .5) * r * 1.6, y + (Math.random() - .5) * r * 1.2, 1.4, 1.4);
    }
    ctx.restore();
  }
  // 毛笔：速度越快越细、带洇墨软边
  function brushStamp(x, y, speed) {
    const base = state.size * 1.4;
    const rw = Math.max(1.5, base * (1 - Math.min(speed / 26, 0.72)));
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, rw);
    g.addColorStop(0, "rgba(15,18,22," + Math.min(1, state.opacity * 1.05) + ")");
    g.addColorStop(0.65, "rgba(15,18,22," + state.opacity * 0.55 + ")");
    g.addColorStop(1, "rgba(15,18,22,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, rw, 0, 7); ctx.fill();
    ctx.restore();
  }
  function eraserStamp(x, y) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x, y, state.size * 1.6, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawSegment(x1, y1, x2, y2, speed) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const step = state.tool === "pencil" ? 2 : Math.max(1.5, state.size * 0.35);
    for (let d = 0; d <= dist; d += step) {
      const t = dist === 0 ? 0 : d / dist;
      const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      if (state.tool === "pencil") pencilStamp(x, y, angle, speed);
      else if (state.tool === "charcoal") charcoalStamp(x, y, angle);
      else if (state.tool === "brush") brushStamp(x, y, speed);
      else eraserStamp(x, y);
    }
  }

  function start(e) {
    e.preventDefault();
    pushHistory();
    state.drawing = true;
    const p = getPos(e);
    state.lastX = p.x; state.lastY = p.y; state.lastTime = performance.now();
    drawSegment(p.x, p.y, p.x + 0.1, p.y + 0.1, 0);
  }
  function move(e) {
    if (!state.drawing) return;
    e.preventDefault();
    const p = getPos(e);
    const now = performance.now();
    const speed = Math.hypot(p.x - state.lastX, p.y - state.lastY) / Math.max(1, now - state.lastTime) * 10;
    drawSegment(state.lastX, state.lastY, p.x, p.y, speed);
    state.lastX = p.x; state.lastY = p.y; state.lastTime = now;
  }
  function end() { state.drawing = false; }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);

  /* --- 工具与滑杆 --- */
  document.getElementById("tool-group").addEventListener("click", e => {
    const btn = e.target.closest(".tool-btn");
    if (!btn) return;
    document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.tool = btn.dataset.tool;
  });
  const sizeInput = document.getElementById("brush-size");
  const opacityInput = document.getElementById("brush-opacity");
  sizeInput.addEventListener("input", () => {
    state.size = +sizeInput.value;
    document.getElementById("size-val").textContent = sizeInput.value;
  });
  opacityInput.addEventListener("input", () => {
    state.opacity = +opacityInput.value / 100;
    document.getElementById("opacity-val").textContent = opacityInput.value;
  });

  document.getElementById("undo-btn").addEventListener("click", () => {
    const img = state.history.pop();
    if (img) ctx.putImageData(img, 0, 0);
  });
  document.getElementById("clear-btn").addEventListener("click", () => {
    pushHistory();
    fillWhite();
  });
  document.getElementById("save-btn").addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "我的练习_" + new Date().toISOString().slice(0, 10) + ".png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  });

  const ghostOpacityInput = document.getElementById("ghost-opacity");
  ghostOpacityInput.addEventListener("input", () => {
    document.getElementById("ghost-val").textContent = ghostOpacityInput.value;
    ghostCanvas.style.opacity = +ghostOpacityInput.value / 100;
  });
  ghostCanvas.style.opacity = 0.45;

  // 供 demos.js 使用
  window.Board = {
    canvas, ctx, ghostCanvas,
    ghostCtx: ghostCanvas.getContext("2d"),
    clearGhost() {
      this.ghostCtx.clearRect(0, 0, ghostCanvas.width, ghostCanvas.height);
    },
    setTool(tool) {
      const btn = document.querySelector('.tool-btn[data-tool="' + tool + '"]');
      if (btn) btn.click();
    }
  };
})();
