/* ===== AI 素描：Claude Opus 5.5 设计素描方案，浏览器用铅笔笔触逐笔画出 =====
 *
 * 流程：用户一句话 → Claude 以结构化 JSON（SKETCH_SCHEMA）输出「素描绘制方案」
 *       → 边流式接收边解析出元素 → SketchRenderer 用排线 / 擦笔 / 橡皮逐笔绘制。
 * 修改：保留多轮对话历史，用户每提一次修改，Claude 输出完整的新版本。
 */
(function () {
  const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm";
  const MODEL = "claude-opus-5-5";
  const VW = 800, VH = 600;              // 方案坐标系
  const LS_KEY = "huijing.ai.apiKey";
  const LS_EFFORT = "huijing.ai.effort";

  /* ================= 结构化输出 Schema ================= */
  const SKETCH_SCHEMA = {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      light: { type: "string" },
      elements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            stage: { type: "string", enum: ["构图", "线稿", "铺调子", "深入", "高光"] },
            kind: { type: "string", enum: ["guide", "line", "tone", "smudge", "highlight"] },
            label: { type: "string" },
            value: { type: "integer" },
            angle: { type: "number" },
            d: { type: "string" }
          },
          required: ["stage", "kind", "label", "value", "angle", "d"],
          additionalProperties: false
        }
      },
      tips: { type: "array", items: { type: "string" } }
    },
    required: ["title", "summary", "light", "elements", "tips"],
    additionalProperties: false
  };

  const SYSTEM_PROMPT = `你是一位素描大师，也是耐心的绘画老师，为「绘境学堂」网页的 AI 素描功能出图。用户会用一句话描述想画的内容，之后可能继续提出修改。你要把画面设计成一份「素描绘制方案」JSON，网页会按数组顺序，用铅笔笔触把它一笔一笔画出来，学习者可以看着整个过程临摹。

【画布】宽 800、高 600 的坐标系，原点在左上角，x 向右、y 向下。每个元素的 d 是一条 SVG path 数据（只用绝对坐标命令 M L C Q A Z），坐标取整数或一位小数，全部落在画布内。

【元素类型 kind】
- guide 构图辅助线：极浅的直线，用于定位大形、中轴线、透视线、地平线。每幅 3~10 条。value 填 1。
- line 线条：外轮廓、结构线、明暗交界线、细节线。value 是用笔力度 1~5（1 极轻、若有若无；3 普通轮廓；5 最重的暗部轮廓、物体与台面的接触处）。轮廓要有虚实：受光一侧轻而断续，背光一侧和转折处重；同一物体的轮廓应拆成几段不同力度的 line。
- tone 排线调子：封闭路径（以 Z 结尾），网页在区域内用排线填充。value 是明度等级 1~5：1 亮灰，2 中间灰，3 暗灰（背光面），4 明暗交界线与重暗部，5 最暗（投影紧贴物体的根部、深洞、缝隙）。value 越大，叠加的交叉排线层数越多。angle 是排线方向，单位度，0 为水平，正值为逆时针倾斜（常用 30~60 或 -30~-60），排线要顺着形体结构走，同一个面保持一致。
- smudge 擦笔：封闭路径，网页用纸笔揉擦出柔和灰调，value 1~5 表示深浅。用于背景氛围、柔和过渡、投影的虚边、远处景物。
- highlight 高光：封闭路径，网页用橡皮把该区域提亮。用于高光点、反光边缘。value 填 1。
非 tone 元素的 angle 填 0。label 用中文简短说明这一笔画的是什么（如「苹果外轮廓-背光侧」「桌面投影」）。

【作画顺序 stage】elements 必须按真实作画顺序排列：构图(guide) → 线稿(line) → 铺调子(大面积 tone 与 smudge，先浅后深) → 深入(小块重色 tone、细节 line、加重明暗交界线和投影) → 高光(highlight)。

【素描要求】
1. 统一光源（通常左上方），light 字段用中文写明。所有物体遵守同一光源，五大调子齐全：高光、亮灰、明暗交界线、反光、投影。明暗交界线是暗部最重的地方，在形体转折处；反光比明暗交界线亮；投影靠近物体处最深，向外逐渐变虚变浅。
2. 先整体后局部：主体约占画面 50%~70%，构图稳定、留有呼吸空间。背景用淡的 smudge 或少量排线衬托，不要抢主体。
3. 用多个 tone 区域叠加塑造体积。例如球体的暗部 = 背光面 value 3 + 明暗交界线带 value 4 + 投影 value 4~5，反光区留浅（value 1~2），不要一整块平涂。相邻调子区域可以重叠。
4. 形要准：比例、透视、结构正确。有机形体用 C/Q 贝塞尔曲线画得流畅自然，不要用生硬的折线。
5. 复杂度：一般 40~160 个元素，题材复杂可以更多；单个 d 不超过约 60 个命令。
6. title 是作品名（中文，10 字以内）；summary 用 2~3 句中文说明构图与明暗安排；tips 给 3~5 条这幅画的素描技法要点（中文，每条一句话），帮助学习者临摹。

【修改】用户提出修改时，在指定版本的基础上改：没被要求改动的部分（构图、元素、坐标）尽量保持不变，只改需要改的地方，然后输出完整的新版本 JSON（不是差量）。summary 第一句说明这次改了什么。

如果描述含糊，或不太适合素描表现，也请给出最合理的画面诠释，而不是拒绝作画。`;

  /* ================= 工具函数 ================= */
  const $ = id => document.getElementById(id);
  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function lsGet(k) { try { return store("localStorage").getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { store("localStorage").setItem(k, v); } catch (e) { /* 隐私模式等 */ } }
  function lsDel(k) { try { store("localStorage").removeItem(k); } catch (e) { /* ignore */ } }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function makeRng(seed) {
    let a = seed >>> 0;
    const r = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.n = () => (r() + r() + r() - 1.5) / 1.5;   // 近似正态，范围约 [-1,1]
    return r;
  }

  /* ---------- SVG 路径测量（取点 / 包围盒） ---------- */
  const SVG_NS = "http://www.w3.org/2000/svg";
  const measureSvg = document.createElementNS(SVG_NS, "svg");
  measureSvg.setAttribute("width", "0");
  measureSvg.setAttribute("height", "0");
  measureSvg.setAttribute("aria-hidden", "true");
  measureSvg.style.cssText = "position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;visibility:hidden";
  const measurePath = document.createElementNS(SVG_NS, "path");
  measureSvg.appendChild(measurePath);
  document.body.appendChild(measureSvg);

  function measure(d) {
    measurePath.setAttribute("d", d);
    let len = 0, bb = null;
    try { len = measurePath.getTotalLength(); bb = measurePath.getBBox(); } catch (e) { /* 非法路径 */ }
    return { len: isFinite(len) ? len : 0, bb };
  }
  function samplePath(d, step) {
    const { len } = measure(d);
    if (!(len > 0)) return [];
    const n = Math.max(2, Math.min(1500, Math.ceil(len / step)));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const p = measurePath.getPointAtLength(len * i / n);
      pts.push({ x: p.x, y: p.y });
    }
    return pts;
  }

  /* ---------- 纸张与石墨颗粒纹理 ---------- */
  const PAPER_COLOR = "#fbfaf5";
  const paperCache = {};
  function getPaper(w, h) {
    const key = w + "x" + h;
    if (paperCache[key]) return paperCache[key];
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = PAPER_COLOR;
    g.fillRect(0, 0, w, h);
    const rng = makeRng(20240723);
    const n = Math.round(w * h * 0.03);
    for (let i = 0; i < n; i++) {
      g.fillStyle = rng() < 0.5 ? "rgba(90,80,60,0.045)" : "rgba(255,255,255,0.5)";
      g.fillRect(rng() * w, rng() * h, 1 + rng(), 1 + rng());
    }
    g.strokeStyle = "rgba(120,105,80,0.035)";
    for (let i = 0; i < 160; i++) {          // 纸纤维
      const x = rng() * w, y = rng() * h, a = rng() * Math.PI, l = 6 + rng() * 18;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    paperCache[key] = c;
    return c;
  }
  let grainTile = null;
  function getGrainTile() {
    if (grainTile) return grainTile;
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    const g = c.getContext("2d");
    const img = g.createImageData(96, 96);
    const rng = makeRng(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const gap = rng() < 0.14;            // 纸纹凹处，石墨挂不上
      img.data[i] = 42; img.data[i + 1] = 42; img.data[i + 2] = 48;
      img.data[i + 3] = gap ? 25 : 150 + rng() * 105;
    }
    g.putImageData(img, 0, 0);
    grainTile = c;
    return c;
  }

  /* ================= 素描渲染器 ================= */
  // 不同明度对应的排线层数、间距、浓度
  const HATCH_LAYERS = [1, 2, 2, 3, 4];
  const HATCH_SPACING = [5.2, 4.4, 3.8, 3.3, 2.9];
  const HATCH_ALPHA = [0.42, 0.5, 0.58, 0.68, 0.78];
  const LAYER_ROT = [0, 42, -38, 80, 18];   // 每层交叉排线相对主方向的偏转

  class SketchRenderer {
    constructor(canvas, opts) {
      this.cv = canvas;
      this.ctx = canvas.getContext("2d");
      this.paper = !!(opts && opts.paper);
      this.s = canvas.width / VW;
      this.off = document.createElement("canvas");
      this.off.width = canvas.width; this.off.height = canvas.height;
      this.octx = this.off.getContext("2d");
      const inv = new DOMMatrix([1 / this.s, 0, 0, 1 / this.s, 0, 0]);
      this.grain = this.ctx.createPattern(getGrainTile(), "repeat");
      this.grain.setTransform(inv);
      this.ograin = this.octx.createPattern(getGrainTile(), "repeat");
      this.ograin.setTransform(inv);
      if (this.paper) {
        this.paperPat = this.ctx.createPattern(getPaper(canvas.width, canvas.height), "no-repeat");
        this.paperPat.setTransform(inv);
      }
      this.reset();
    }

    reset() {
      const { ctx, cv } = this;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.filter = "none";
      if (this.paper) ctx.drawImage(getPaper(cv.width, cv.height), 0, 0);
      else ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(this.s, 0, 0, this.s, 0, 0);
    }

    // 把一个元素编译成若干绘制步骤（每步是一个小函数，便于逐帧动画）
    compile(el, idx) {
      const rng = makeRng(hashStr(el.d) ^ (idx * 2654435761));
      switch (el.kind) {
        case "guide": return this.guideOps(el, rng);
        case "line": return this.lineOps(el, rng);
        case "tone": return this.toneOps(el, rng);
        case "smudge": return this.smudgeOps(el, rng);
        case "highlight": return this.highlightOps(el);
        default: return [];
      }
    }

    guideOps(el, rng) {
      const pts = samplePath(el.d, 4);
      if (pts.length < 2) return [];
      return [ctx => {
        ctx.save();
        ctx.strokeStyle = "rgb(80,80,90)";
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 0.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x + rng.n() * 0.15, pts[i].y + rng.n() * 0.15);
        ctx.stroke();
        ctx.restore();
      }];
    }

    lineOps(el, rng) {
      const pts = samplePath(el.d, 2.2);
      if (pts.length < 2) return [];
      const v = el.value;
      const w = 0.55 + v * 0.3, a = 0.3 + v * 0.13;
      const p1 = pts.map(p => ({ x: p.x + rng.n() * 0.25, y: p.y + rng.n() * 0.25 }));
      const dx = rng.n() * 0.5, dy = rng.n() * 0.5;
      const p2 = pts.map(p => ({ x: p.x + dx + rng.n() * 0.35, y: p.y + dy + rng.n() * 0.35 }));
      const N = pts.length - 1, CH = 6, ops = [];
      for (let st = 0; st < N; st += CH) {
        const en = Math.min(N, st + CH);
        const t = ((st + en) / 2) / N;
        const taper = Math.min(1, 0.35 + Math.min(t, 1 - t) * 5);   // 起笔收笔轻
        ops.push(ctx => {
          ctx.save();
          ctx.strokeStyle = this.grain;
          ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.globalAlpha = a * taper;
          ctx.lineWidth = w * (0.75 + 0.25 * taper);
          ctx.beginPath(); ctx.moveTo(p1[st].x, p1[st].y);
          for (let i = st + 1; i <= en; i++) ctx.lineTo(p1[i].x, p1[i].y);
          ctx.stroke();
          ctx.globalAlpha = a * taper * 0.4;     // 第二遍复描，带出铅笔的毛糙感
          ctx.lineWidth = w * 0.55;
          ctx.beginPath(); ctx.moveTo(p2[st].x, p2[st].y);
          for (let i = st + 1; i <= en; i++) ctx.lineTo(p2[i].x, p2[i].y);
          ctx.stroke();
          ctx.restore();
        });
      }
      return ops;
    }

    // 计算元素包围盒对应的设备像素矩形
    devRect(bb, pad) {
      const s = this.s, W = this.cv.width, H = this.cv.height;
      const x = Math.max(0, Math.floor((bb.x - pad) * s));
      const y = Math.max(0, Math.floor((bb.y - pad) * s));
      const x2 = Math.min(W, Math.ceil((bb.x + bb.width + pad) * s));
      const y2 = Math.min(H, Math.ceil((bb.y + bb.height + pad) * s));
      return { x, y, w: x2 - x, h: y2 - y };
    }

    blit(r, mode) {
      if (r.w <= 0 || r.h <= 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      if (mode) ctx.globalCompositeOperation = mode;
      ctx.drawImage(this.off, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
      ctx.restore();
    }

    toneOps(el, rng) {
      const { bb } = measure(el.d);
      if (!bb || bb.width < 0.5 || bb.height < 0.5) return [];
      const path = new Path2D(el.d);
      const v = el.value, layers = HATCH_LAYERS[v - 1];
      const r = this.devRect(bb, 6);
      const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
      const R = Math.hypot(bb.width, bb.height) / 2 + 4;
      const ops = [];
      for (let L = 0; L < layers; L++) {
        const ang = (el.angle + LAYER_ROT[L] + rng.n() * 4) * Math.PI / 180;
        const ux = Math.cos(ang), uy = -Math.sin(ang);     // 正角度 = 屏幕上逆时针
        const nx = -uy, ny = ux;
        const lines = [];
        const sp = HATCH_SPACING[v - 1] * (L === 0 ? 1 : 1.15);
        for (let o = -R; o <= R; o += sp * (0.8 + rng() * 0.4)) {
          const t0 = -R * (0.82 + rng() * 0.18), t1 = R * (0.82 + rng() * 0.18);
          const bend = rng.n() * 1.4, tm = (t0 + t1) / 2;
          lines.push([
            cx + ux * t0 + nx * o, cy + uy * t0 + ny * o,
            cx + ux * tm + nx * (o + bend), cy + uy * tm + ny * (o + bend),
            cx + ux * t1 + nx * o, cy + uy * t1 + ny * o,
            HATCH_ALPHA[v - 1] * (0.65 + rng() * 0.35), 0.65 + rng() * 0.6
          ]);
        }
        ops.push(() => {
          const o = this.octx;
          o.setTransform(1, 0, 0, 1, 0, 0);
          o.globalCompositeOperation = "source-over";
          o.clearRect(r.x, r.y, r.w, r.h);
          o.setTransform(this.s, 0, 0, this.s, 0, 0);
          o.strokeStyle = this.ograin;
          o.lineCap = "round";
          for (const l of lines) {
            o.globalAlpha = l[6];
            o.lineWidth = l[7];
            o.beginPath(); o.moveTo(l[0], l[1]); o.quadraticCurveTo(l[2], l[3], l[4], l[5]); o.stroke();
          }
          // 用柔化后的区域形状做遮罩，排线边缘自然收虚
          o.globalAlpha = 1;
          o.globalCompositeOperation = "destination-in";
          o.filter = "blur(1.3px)";
          o.fillStyle = "#000";
          o.fill(path);
          o.filter = "none";
          o.globalCompositeOperation = "source-over";
          this.blit(r);
        });
      }
      return ops;
    }

    smudgeOps(el) {
      const { bb } = measure(el.d);
      if (!bb || bb.width < 0.5 || bb.height < 0.5) return [];
      const path = new Path2D(el.d);
      const blur = Math.min(16, 4 + Math.min(bb.width, bb.height) * 0.05);   // 区域越大揉得越开
      const r = this.devRect(bb, blur * 2.5);
      const alpha = 0.06 + el.value * 0.07;
      return [() => {
        const o = this.octx;
        o.setTransform(1, 0, 0, 1, 0, 0);
        o.globalCompositeOperation = "source-over";
        o.clearRect(r.x, r.y, r.w, r.h);
        o.setTransform(this.s, 0, 0, this.s, 0, 0);
        o.globalAlpha = 1;
        o.filter = `blur(${blur * this.s}px)`;
        o.fillStyle = `rgba(55,55,62,${alpha})`;
        o.fill(path);
        o.filter = "none";
        // 擦出来的调子也带纸纹
        o.globalCompositeOperation = "destination-in";
        o.fillStyle = this.ograin;
        o.globalAlpha = 1;
        o.fillRect(bb.x - blur * 2.5, bb.y - blur * 2.5, bb.width + blur * 5, bb.height + blur * 5);
        o.globalCompositeOperation = "source-over";
        this.blit(r, "multiply");
      }];
    }

    highlightOps(el) {
      const path = new Path2D(el.d);
      return [ctx => {
        ctx.save();
        ctx.filter = "blur(2.2px)";
        ctx.globalAlpha = 0.88;
        if (this.paper) {
          ctx.fillStyle = this.paperPat;
        } else {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "#000";
        }
        ctx.fill(path);
        ctx.restore();
      }];
    }

    // 立即画完整幅
    renderAll(elements) {
      this.reset();
      elements.forEach((el, i) => this.compile(el, i).forEach(op => op(this.ctx)));
    }
  }

  /* ---------- 元素校验 ---------- */
  const KINDS = new Set(["guide", "line", "tone", "smudge", "highlight"]);
  function cleanElement(el) {
    if (!el || typeof el !== "object" || !KINDS.has(el.kind)) return null;
    if (typeof el.d !== "string" || !el.d.trim() || el.d.length > 30000) return null;
    let v = Math.round(Number(el.value));
    if (!isFinite(v)) v = 2;
    v = Math.min(5, Math.max(1, v));
    const angle = isFinite(Number(el.angle)) ? Number(el.angle) : 45;
    return {
      stage: String(el.stage || ""), kind: el.kind, label: String(el.label || ""),
      value: v, angle, d: el.d
    };
  }
  function cleanDoc(doc) {
    if (!doc || !Array.isArray(doc.elements)) throw new Error("返回的方案缺少 elements");
    return {
      title: String(doc.title || "未命名"),
      summary: String(doc.summary || ""),
      light: String(doc.light || ""),
      elements: doc.elements.map(cleanElement).filter(Boolean),
      tips: Array.isArray(doc.tips) ? doc.tips.map(String) : []
    };
  }

  /* ---------- 流式 JSON：边接收边取出完整的 element 对象 ---------- */
  class ElementStreamParser {
    constructor(onElement) { this.onElement = onElement; this.reset(); }
    reset() {
      this.buf = ""; this.pos = 0; this.inArr = false; this.done = false;
      this.depth = 0; this.inStr = false; this.esc = false; this.start = -1;
    }
    feed(delta) {
      this.buf += delta;
      if (this.done) return;
      if (!this.inArr) {
        const k = this.buf.indexOf('"elements"');
        if (k < 0) return;
        const b = this.buf.indexOf("[", k);
        if (b < 0) return;
        this.inArr = true; this.pos = b + 1;
      }
      const s = this.buf;
      for (let i = this.pos; i < s.length; i++) {
        const c = s[i];
        if (this.inStr) {
          if (this.esc) this.esc = false;
          else if (c === "\\") this.esc = true;
          else if (c === '"') this.inStr = false;
          continue;
        }
        if (c === '"') this.inStr = true;
        else if (c === "{") { if (this.depth === 0) this.start = i; this.depth++; }
        else if (c === "}") {
          this.depth--;
          if (this.depth === 0 && this.start >= 0) {
            try { this.onElement(JSON.parse(s.slice(this.start, i + 1))); } catch (e) { /* 跳过坏对象 */ }
            this.start = -1;
          }
        } else if (c === "]" && this.depth === 0) { this.done = true; this.pos = i + 1; return; }
      }
      this.pos = s.length;
    }
    title() {
      const m = this.buf.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (!m) return "";
      try { return JSON.parse('"' + m[1] + '"'); } catch (e) { return ""; }
    }
  }

  /* ================= 页面状态 ================= */
  const canvas = $("ai-canvas");
  if (!canvas) return;
  const renderer = new SketchRenderer(canvas, { paper: true });

  const S = {
    history: [],        // 发给 API 的多轮消息
    versions: [],       // { doc, prompt, usage }
    current: -1,
    busy: false,
    stream: null,
    client: null, clientKey: null,
    sessionKey: ""      // 未勾选「记住」时只放在内存
  };

  /* ---------- 绘制动画调度 ---------- */
  const SPEED_OPS = [1, 3, 6, 14, 40];
  const anim = { queue: [], i: 0, raf: 0, live: false, drawnEls: 0, lastEl: null };
  const stageEl = $("ai-stage");

  function animReset() {
    cancelAnimationFrame(anim.raf);
    anim.raf = 0; anim.queue = []; anim.i = 0; anim.drawnEls = 0; anim.lastEl = null;
    renderer.reset();
  }
  function animEnqueue(el, idx) {
    const ops = renderer.compile(el, idx);
    ops.forEach(op => anim.queue.push({ op, el }));
    if (!ops.length) anim.drawnEls++;
    if (!anim.raf) anim.raf = requestAnimationFrame(pump);
  }
  const STAGE_ORDER = ["构图", "线稿", "铺调子", "深入", "高光"];
  function showStage(el) {
    const n = STAGE_ORDER.indexOf(el.stage);
    stageEl.textContent = (n >= 0 ? `第 ${n + 1} 步 · ${el.stage}` : el.stage) + (el.label ? ` — ${el.label}` : "");
    stageEl.hidden = false;
  }
  function pump() {
    anim.raf = 0;
    const per = SPEED_OPS[(+$("ai-speed").value || 3) - 1];
    const t0 = performance.now();
    let n = 0;
    while (anim.i < anim.queue.length && n < per && performance.now() - t0 < 14) {
      const item = anim.queue[anim.i++];
      if (item.el !== anim.lastEl) { anim.lastEl = item.el; anim.drawnEls++; showStage(item.el); }
      item.op(renderer.ctx);
      n++;
    }
    if (anim.i < anim.queue.length) anim.raf = requestAnimationFrame(pump);
    else if (!anim.live) stageEl.hidden = true;
  }
  function animFinishNow() {
    cancelAnimationFrame(anim.raf); anim.raf = 0;
    while (anim.i < anim.queue.length) anim.queue[anim.i++].op(renderer.ctx);
    if (!anim.live) stageEl.hidden = true;
  }
  function playDoc(doc) {
    animReset();
    anim.live = false;
    doc.elements.forEach((el, i) => animEnqueue(el, i));
  }
  function showDocInstant(doc) {
    cancelAnimationFrame(anim.raf); anim.raf = 0; anim.queue = []; anim.i = 0;
    renderer.renderAll(doc ? doc.elements : []);
    stageEl.hidden = true;
  }

  /* ---------- 状态栏 / 对话区 ---------- */
  const statusEl = $("ai-status");
  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "ai-status" + (kind ? " " + kind : "");
  }
  const chatEl = $("ai-chat");
  function addBubble(role, html, opts) {
    const empty = chatEl.querySelector(".ai-empty");
    if (empty) empty.remove();
    const b = document.createElement("div");
    b.className = "ai-msg " + role;
    b.innerHTML = html;
    if (opts && opts.version != null) {
      b.dataset.version = opts.version;
      b.title = "点击查看这一版";
    }
    chatEl.appendChild(b);
    chatEl.scrollTop = chatEl.scrollHeight;
    return b;
  }
  function renderEmptyChat() {
    chatEl.innerHTML = `
      <div class="ai-empty">
        <p>用一句话告诉 Claude 你想画什么，它会先设计构图与明暗，再用<strong>素描排线</strong>一笔笔画出来。画完还可以继续说「哪里要改」。</p>
        <div class="ai-chips">
          ${["桌上的一个苹果和一只陶罐", "窗台上晒太阳的猫", "江南水乡的石拱桥", "一只握着铅笔的手", "石膏几何体组合：球体、立方体和圆锥"]
            .map(t => `<button type="button" class="ai-chip">${esc(t)}</button>`).join("")}
        </div>
      </div>`;
  }
  renderEmptyChat();

  function updateNotes() {
    const notes = $("ai-notes");
    const v = S.versions[S.current];
    if (!v) { notes.hidden = true; return; }
    const d = v.doc;
    notes.hidden = false;
    notes.innerHTML = `
      <h3>「${esc(d.title)}」<small>第 ${S.current + 1} 版</small></h3>
      <p>${esc(d.summary)}</p>
      ${d.light ? `<p class="ai-light">光源：${esc(d.light)}</p>` : ""}
      ${d.tips.length ? `<h4>临摹要点</h4><ul>${d.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}`;
  }
  function updateControls() {
    const has = S.versions.length > 0;
    $("ai-ver-label").textContent = has ? `第 ${S.current + 1} / ${S.versions.length} 版` : "—";
    $("ai-ver-prev").disabled = S.busy || S.current <= 0;
    $("ai-ver-next").disabled = S.busy || S.current >= S.versions.length - 1;
    ["ai-replay", "ai-download", "ai-to-board"].forEach(id => { $(id).disabled = S.busy || !has; });
    $("ai-new").disabled = S.busy;
    const send = $("ai-send");
    send.textContent = S.busy ? "■ 停止" : (has ? "修改" : "开始画");
    send.classList.toggle("stop", S.busy);
    $("ai-prompt").placeholder = has
      ? "说说要怎么改，例如：猫换成侧卧的姿势，背景加一扇窗"
      : "用一句话描述想画的内容，例如：窗台上晒太阳的猫";
    chatEl.querySelectorAll(".ai-msg[data-version]").forEach(b =>
      b.classList.toggle("active", +b.dataset.version === S.current));
  }
  function selectVersion(i) {
    if (S.busy || i < 0 || i >= S.versions.length) return;
    S.current = i;
    showDocInstant(S.versions[i].doc);
    updateNotes(); updateControls();
    setStatus(`正在查看第 ${i + 1} 版 · 「${S.versions[i].doc.title}」`);
  }

  /* ---------- API Key 设置 ---------- */
  const keyInput = $("ai-key-input"), keyRemember = $("ai-key-remember");
  function currentKey() { return lsGet(LS_KEY) || S.sessionKey; }
  function refreshKeyStatus() {
    const k = currentKey();
    $("ai-key-status").textContent = k ? "✓ 已设置" : "未设置";
    $("ai-key-status").className = k ? "ok" : "warn";
  }
  (function initKey() {
    const saved = lsGet(LS_KEY);
    if (saved) { keyInput.value = saved; keyRemember.checked = true; $("ai-key-box").open = false; }
    const eff = lsGet(LS_EFFORT);
    if (eff && ["low", "medium", "high"].includes(eff)) $("ai-effort").value = eff;
    refreshKeyStatus();
  })();
  $("ai-key-save").addEventListener("click", () => {
    const k = keyInput.value.trim();
    if (!k) { setStatus("请先粘贴 API Key", "err"); keyInput.focus(); return; }
    S.sessionKey = k;
    if (keyRemember.checked) lsSet(LS_KEY, k); else lsDel(LS_KEY);
    S.client = null;
    refreshKeyStatus();
    $("ai-key-box").open = false;
    setStatus(keyRemember.checked ? "API Key 已保存在本机浏览器" : "API Key 已设置（仅本次打开有效）", "ok");
  });
  $("ai-key-clear").addEventListener("click", () => {
    keyInput.value = ""; S.sessionKey = ""; S.client = null;
    lsDel(LS_KEY); keyRemember.checked = false;
    refreshKeyStatus();
    setStatus("已清除 API Key");
  });
  $("ai-effort").addEventListener("change", e => lsSet(LS_EFFORT, e.target.value));

  /* ---------- Anthropic SDK ---------- */
  let sdkPromise = null;
  function loadSdk() {
    if (!sdkPromise) {
      sdkPromise = import(SDK_URL).then(m => m.default || m.Anthropic).catch(e => {
        sdkPromise = null; throw e;
      });
    }
    return sdkPromise;
  }
  async function getClient() {
    const Anthropic = await loadSdk();
    const key = currentKey();
    if (!S.client || S.clientKey !== key) {
      S.client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
      S.clientKey = key;
    }
    return { client: S.client, Anthropic };
  }
  function explainError(e, Anthropic) {
    if (Anthropic) {
      if (e instanceof Anthropic.APIUserAbortError) return "已停止生成。";
      if (e instanceof Anthropic.AuthenticationError) return "API Key 无效或已失效，请检查后重新填写。";
      if (e instanceof Anthropic.PermissionDeniedError) return "这个 API Key 没有调用 Claude Opus 5.5 的权限。";
      if (e instanceof Anthropic.NotFoundError) return "找不到模型 claude-opus-5-5，请确认账户可以使用该模型。";
      if (e instanceof Anthropic.RateLimitError) return "请求过于频繁或额度不足，请稍后再试。";
      if (e instanceof Anthropic.BadRequestError) return "请求被拒绝：" + (e.message || "参数错误");
      if (e instanceof Anthropic.APIConnectionError) return "连接 api.anthropic.com 失败，请检查网络或代理。";
      if (e instanceof Anthropic.APIError) return `API 出错（${e.status || "?"}）：${e.message}`;
    }
    return e && e.message ? e.message : String(e);
  }

  /* ---------- 生成 / 修改 ---------- */
  async function submit(text) {
    if (S.busy) return;
    text = text.trim();
    if (!text) { $("ai-prompt").focus(); return; }
    if (!currentKey()) {
      $("ai-key-box").open = true;
      keyInput.focus();
      setStatus("请先填写 Claude API Key", "err");
      return;
    }

    const isEdit = S.versions.length > 0;
    const base = S.versions[S.current];
    const userContent = isEdit
      ? `修改要求（在第 ${S.current + 1} 版「${base.doc.title}」的基础上修改）：${text}`
      : `请用素描画：${text}`;
    S.history.push({ role: "user", content: userContent });
    addBubble("user", esc(text));
    $("ai-prompt").value = "";

    S.busy = true;
    updateControls();
    const started = Date.now();
    let gotText = false;
    const streamed = [];
    const parser = new ElementStreamParser(raw => {
      const el = cleanElement(raw);
      if (!el) return;
      animEnqueue(el, streamed.length);
      streamed.push(el);
    });
    animReset();
    anim.live = true;
    setStatus("正在连接 Claude…", "busy");
    const timer = setInterval(() => {
      const sec = Math.round((Date.now() - started) / 1000);
      if (!gotText) setStatus(`Claude 正在构思构图与明暗… ${sec}s`, "busy");
      else setStatus(`边想边画中… 已落笔 ${anim.drawnEls}/${streamed.length} 个元素 · ${sec}s`, "busy");
    }, 500);

    let Anthropic = null;
    try {
      let got;
      try { got = await getClient(); } catch (e) {
        throw new Error("无法加载 Anthropic SDK（需要能访问 cdn.jsdelivr.net）");
      }
      Anthropic = got.Anthropic;
      const stream = got.client.beta.messages.stream({
        model: MODEL,
        max_tokens: 64000,
        // 遇到安全分类器误判时，由服务器自动换用后备模型继续，而不是直接失败
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        cache_control: { type: "ephemeral" },
        system: SYSTEM_PROMPT,
        output_config: {
          effort: $("ai-effort").value,
          format: { type: "json_schema", schema: SKETCH_SCHEMA }
        },
        messages: S.history
      });
      S.stream = stream;
      stream.on("streamEvent", ev => {
        // 发生模型切换时，之前的半截输出作废，重新开始画
        if (ev.type === "content_block_start" && ev.content_block && ev.content_block.type === "fallback") {
          parser.reset(); streamed.length = 0; animReset();
        }
      });
      stream.on("text", delta => {
        gotText = true;
        parser.feed(delta);
        const t = parser.title();
        if (t) stageEl.dataset.title = t;
      });

      const msg = await stream.finalMessage();
      if (msg.stop_reason === "refusal") {
        const why = msg.stop_details && msg.stop_details.explanation;
        throw new Error("Claude 没有完成这幅画" + (why ? "：" + why : "，请换一种描述试试。"));
      }
      if (msg.stop_reason === "max_tokens") throw new Error("画面太复杂，输出被截断了。请把描述写得简单一些再试。");

      // 取最后一个后备切换点之后的文本
      let lastFallback = -1;
      msg.content.forEach((b, i) => { if (b.type === "fallback") lastFallback = i; });
      const json = msg.content.slice(lastFallback + 1)
        .filter(b => b.type === "text").map(b => b.text).join("");
      const doc = cleanDoc(JSON.parse(json));
      if (!doc.elements.length) throw new Error("没有得到可绘制的笔画，请换个说法再试。");

      S.history.push({ role: "assistant", content: msg.content });
      S.versions.push({ doc, prompt: text, usage: msg.usage });
      S.current = S.versions.length - 1;

      // 流式过程中漏掉/多出的元素，以最终结果为准
      if (streamed.length !== doc.elements.length) playDoc(doc);
      anim.live = false;
      if (anim.i >= anim.queue.length) stageEl.hidden = true;

      const n = S.current + 1;
      addBubble("assistant",
        `<b>第 ${n} 版 ·「${esc(doc.title)}」</b><span>${esc(doc.summary)}</span>`,
        { version: S.current });
      const sec = Math.round((Date.now() - started) / 1000);
      const outTok = msg.usage && msg.usage.output_tokens;
      setStatus(`完成第 ${n} 版 · ${doc.elements.length} 个笔画元素 · 用时 ${sec}s` +
        (outTok ? ` · 输出 ${outTok} tokens` : "") + (msg.model && msg.model !== MODEL ? ` · 由 ${msg.model} 完成` : ""), "ok");
      updateNotes();
    } catch (e) {
      S.history.pop();                     // 撤回这次没完成的请求
      anim.live = false;
      const text2 = e instanceof SyntaxError ? "返回内容不是完整的 JSON，请重试。" : explainError(e, Anthropic);
      addBubble("error", esc(text2));
      setStatus(text2, "err");
      showDocInstant(S.versions[S.current] && S.versions[S.current].doc);
    } finally {
      clearInterval(timer);
      S.busy = false; S.stream = null;
      updateControls();
    }
  }

  /* ---------- 事件绑定 ---------- */
  $("ai-form").addEventListener("submit", e => {
    e.preventDefault();
    if (S.busy) { if (S.stream) S.stream.abort(); return; }
    submit($("ai-prompt").value);
  });
  $("ai-prompt").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      $("ai-form").requestSubmit();
    }
  });
  chatEl.addEventListener("click", e => {
    const chip = e.target.closest(".ai-chip");
    if (chip) { $("ai-prompt").value = chip.textContent; $("ai-prompt").focus(); return; }
    const msg = e.target.closest(".ai-msg[data-version]");
    if (msg) selectVersion(+msg.dataset.version);
  });
  $("ai-new").addEventListener("click", () => {
    if (S.busy) return;
    if (S.versions.length && !confirm("开始新的一幅画？当前作品的修改记录会清空（可以先点「保存」下载）。")) return;
    S.history = []; S.versions = []; S.current = -1;
    animReset(); stageEl.hidden = true;
    renderEmptyChat(); updateNotes(); updateControls();
    setStatus("还没有作品 · 在左侧输入一句话开始");
    $("ai-prompt").focus();
  });
  $("ai-ver-prev").addEventListener("click", () => selectVersion(S.current - 1));
  $("ai-ver-next").addEventListener("click", () => selectVersion(S.current + 1));
  $("ai-replay").addEventListener("click", () => {
    const v = S.versions[S.current];
    if (v && !S.busy) playDoc(v.doc);
  });
  $("ai-skip").addEventListener("click", animFinishNow);
  $("ai-download").addEventListener("click", () => {
    const v = S.versions[S.current];
    if (!v) return;
    animFinishNow();
    const a = document.createElement("a");
    a.download = `AI素描-${v.doc.title}-第${S.current + 1}版.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  });
  $("ai-to-board").addEventListener("click", () => {
    const v = S.versions[S.current];
    if (!v || !window.Board) return;
    // 透明底重画一遍作底稿，避免纸色盖住画板上的笔迹
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width; tmp.height = canvas.height;
    new SketchRenderer(tmp, { paper: false }).renderAll(v.doc.elements);
    const g = window.Board.ghostCanvas, gctx = window.Board.ghostCtx;
    window.Board.clearGhost();
    const k = Math.min(g.width / tmp.width, g.height / tmp.height);
    const w = tmp.width * k, h = tmp.height * k;
    gctx.drawImage(tmp, (g.width - w) / 2, (g.height - h) / 2, w, h);
    const guide = $("demo-guide");
    if (guide) guide.hidden = true;
    document.querySelectorAll(".demo-item").forEach(el => el.classList.remove("active"));
    window.showView("board");
    window.Board.setTool("pencil");
  });

  updateControls();

  // 供调试与本地预览使用：直接渲染一份方案
  window.AISketch = {
    renderDoc: doc => { const d = cleanDoc(doc); playDoc(d); return d.elements.length; },
    StreamParser: ElementStreamParser
  };
})();
