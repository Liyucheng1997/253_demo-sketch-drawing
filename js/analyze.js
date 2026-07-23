/* ===== 上传画作 → 分步绘制解析 =====
   纯浏览器端图像处理：灰度 / 模糊 / 分层(色调分离) / Sobel 边缘。
   把一幅画还原成「构图 → 线稿 → 铺调 → 深入 → 完成」的过程图。 */
(function () {
  const MAXW = 560;

  /* ---------- 基础图像操作 ---------- */
  function toGrayArray(imgData) {
    const d = imgData.data, n = d.length / 4;
    const g = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      g[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    }
    return g;
  }

  function boxBlur(gray, w, h, radius, passes) {
    let src = gray;
    for (let p = 0; p < (passes || 3); p++) {
      const out = new Float32Array(src.length);
      // 水平
      for (let y = 0; y < h; y++) {
        let sum = 0;
        const row = y * w;
        for (let x = -radius; x <= radius; x++) sum += src[row + Math.min(w - 1, Math.max(0, x))];
        const cnt = radius * 2 + 1;
        for (let x = 0; x < w; x++) {
          out[row + x] = sum / cnt;
          const add = Math.min(w - 1, x + radius + 1), sub = Math.max(0, x - radius);
          sum += src[row + add] - src[row + sub];
        }
      }
      // 垂直
      const out2 = new Float32Array(src.length);
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let y = -radius; y <= radius; y++) sum += out[Math.min(h - 1, Math.max(0, y)) * w + x];
        const cnt = radius * 2 + 1;
        for (let y = 0; y < h; y++) {
          out2[y * w + x] = sum / cnt;
          const add = Math.min(h - 1, y + radius + 1), sub = Math.max(0, y - radius);
          sum += out[add * w + x] - out[sub * w + x];
        }
      }
      src = out2;
    }
    return src;
  }

  function sobel(gray, w, h) {
    const mag = new Float32Array(w * h);
    let max = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1]
                 + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
        const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1]
                 + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
        const m = Math.sqrt(gx * gx + gy * gy);
        mag[i] = m;
        if (m > max) max = m;
      }
    }
    return { mag, max };
  }

  // 直方图均衡的分位点：把灰度分成 n 档，返回每档的阈值（按像素占比均分）
  function quantileLevels(gray, n) {
    const hist = new Float32Array(256);
    for (let i = 0; i < gray.length; i++) hist[Math.min(255, Math.max(0, gray[i] | 0))]++;
    const total = gray.length;
    const thresholds = [];
    let acc = 0, target = 1;
    for (let v = 0; v < 256 && target < n; v++) {
      acc += hist[v];
      if (acc >= (total * target) / n) { thresholds.push(v); target++; }
    }
    while (thresholds.length < n - 1) thresholds.push(255);
    return thresholds;
  }

  function grayToCanvas(gray, w, h, mapFn) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const c = cv.getContext("2d");
    const out = c.createImageData(w, h);
    const d = out.data;
    for (let i = 0; i < gray.length; i++) {
      const rgb = mapFn(gray[i], i);
      d[i * 4] = rgb[0]; d[i * 4 + 1] = rgb[1]; d[i * 4 + 2] = rgb[2]; d[i * 4 + 3] = 255;
    }
    c.putImageData(out, 0, 0);
    return cv;
  }

  // 素描纸色 / 宣纸色
  const PAPER = { sketch: [250, 249, 245], ink: [248, 244, 232] };
  function tone(v, paper, inkColor) {
    // v: 0(黑)~255(白) 的目标灰度，映射到纸色与墨色之间
    const t = v / 255;
    return [
      inkColor[0] + (paper[0] - inkColor[0]) * t,
      inkColor[1] + (paper[1] - inkColor[1]) * t,
      inkColor[2] + (paper[2] - inkColor[2]) * t
    ];
  }

  /* ---------- 画面统计（用于摘要与建议） ---------- */
  function analyzeStats(imgData, gray, w, h) {
    const d = imgData.data;
    let colorSum = 0, briSum = 0;
    for (let i = 0; i < gray.length; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      colorSum += Math.max(r, g, b) - Math.min(r, g, b);
      briSum += gray[i];
    }
    const colorfulness = colorSum / gray.length;      // 0~255
    const brightness = briSum / gray.length;
    // 对比度（标准差）
    let varSum = 0;
    for (let i = 0; i < gray.length; i++) { const dv = gray[i] - brightness; varSum += dv * dv; }
    const contrast = Math.sqrt(varSum / gray.length);
    // 明暗重心：找最暗 1/4 区域位置（判断光源方向）
    let dark = { x: 0, y: 0, n: 0 }, light = { x: 0, y: 0, n: 0 };
    const thDark = brightness - contrast * 0.7, thLight = brightness + contrast * 0.7;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const v = gray[y * w + x];
      if (v < thDark) { dark.x += x; dark.y += y; dark.n++; }
      else if (v > thLight) { light.x += x; light.y += y; light.n++; }
    }
    let lightDir = "";
    if (dark.n > 40 && light.n > 40) {
      const dx = light.x / light.n - dark.x / dark.n;
      const dy = light.y / light.n - dark.y / dark.n;
      const hDir = dx < -w * 0.06 ? "左" : dx > w * 0.06 ? "右" : "";
      const vDir = dy < -h * 0.06 ? "上" : dy > h * 0.06 ? "下" : "";
      lightDir = (hDir || vDir) ? (hDir + vDir + "方") : "正面";
    }
    return { colorfulness, brightness, contrast, lightDir };
  }

  /* ---------- 步骤生成 ---------- */
  function buildSteps(mode, ctxData) {
    const { gray, w, h, stats } = ctxData;
    const paper = PAPER[mode];
    const inkC = mode === "ink" ? [30, 36, 42] : [40, 40, 40];
    const steps = [];

    // ---- 第 1 步：构图 ----
    const blurBig = boxBlur(gray, w, h, Math.max(6, Math.round(w / 40)), 3);
    const th2 = quantileLevels(blurBig, 3);
    const compCv = grayToCanvas(blurBig, w, h, v => {
      const lv = v < th2[0] ? 70 : v < th2[1] ? 165 : 240;
      return tone(lv, paper, inkC);
    });
    // 三分线
    const cc = compCv.getContext("2d");
    cc.strokeStyle = "rgba(181,84,45,.65)"; cc.lineWidth = 1.5; cc.setLineDash([7, 6]);
    [1, 2].forEach(k => {
      cc.beginPath(); cc.moveTo((w * k) / 3, 0); cc.lineTo((w * k) / 3, h); cc.stroke();
      cc.beginPath(); cc.moveTo(0, (h * k) / 3); cc.lineTo(w, (h * k) / 3); cc.stroke();
    });
    steps.push({
      title: mode === "ink" ? "第 1 步 · 立意布局" : "第 1 步 · 构图与大形",
      canvas: compCv,
      desc: mode === "ink"
        ? "眯起眼睛只看大块面：画面被归纳为深、中、浅三个大层次。先在心中定下宾主与开合——哪一块是主体（最深最实的一块），哪里留白作云水。"
        : "起稿前先眯眼观察：整幅画其实只有三大块明暗。用 2B 铅笔侧锋、极轻的长直线把这几个大形的位置框出来，不画任何细节。",
      tips: mode === "ink" ? [
        "对照红色三分线检查主体位置：主峰/主体宜在三分线交点附近，忌居正中",
        "此阶段用淡墨或炭条轻标位置即可，「意在笔先」",
        "留白的形状也要经营——空白处大小要有变化"
      ] : [
        "用长直线切形，宁方勿圆",
        "对照红色三分线检查构图：主体物落在三分线附近最稳",
        "同时量好大的比例关系（高比宽），此时改最容易"
      ]
    });

    // ---- 第 2 步：线稿 / 勾勒 ----
    const preBlur = boxBlur(gray, w, h, 1, 2);
    const { mag, max } = sobel(preBlur, w, h);
    const edgeTh = max * (mode === "ink" ? 0.14 : 0.1);
    const edgeCv = grayToCanvas(gray, w, h, (v, i) => {
      const e = mag[i];
      if (e > edgeTh) {
        const strength = Math.min(1, (e - edgeTh) / (max * 0.35));
        return tone(200 - strength * 170, paper, inkC);
      }
      return paper;
    });
    steps.push({
      title: mode === "ink" ? "第 2 步 · 中锋勾勒" : "第 2 步 · 确立线稿",
      canvas: edgeCv,
      desc: mode === "ink"
        ? "以中锋勾出主要轮廓与结构线。近景用浓墨、行笔顿挫有力；远景用淡墨、一笔带过。上图提取的就是这幅画的「骨架」——勾线阶段只追这些主线。"
        : "在大形框架内画出准确的轮廓线与主要结构转折线。上图是从原画提取的线稿参考：注意哪些线实、哪些线虚——外轮廓和明暗交界处的线最密集。",
      tips: mode === "ink" ? [
        "「石分三面」：勾山石时每块至少交代顶面与两个侧面",
        "线条要一波三折，忌光滑的「铁丝线」",
        "被遮挡处笔断意连，不必每根线都封死"
      ] : [
        "先画大轮廓再画内部结构，被遮挡的结构线也轻轻带出",
        "近实远虚：前景轮廓加重，远景轮廓放虚",
        "此阶段结束时，擦淡起稿的辅助线"
      ]
    });

    // ---- 第 3 步：铺大调子 / 皴擦 ----
    const blurMid = boxBlur(gray, w, h, 2, 2);
    const th3 = quantileLevels(blurMid, 3);
    if (mode === "ink") {
      // 皴擦：只画中间调与暗部，亮部留白，暗部加边缘纹理
      const cunCv = grayToCanvas(blurMid, w, h, (v, i) => {
        const e = mag[i] / max;
        if (v < th3[0]) {
          const texture = 30 + e * 120 + Math.random() * 26;
          return tone(Math.min(200, 60 + texture * 0.5), paper, inkC);
        }
        if (v < th3[1]) return tone(185 + Math.random() * 14, paper, inkC);
        return paper;
      });
      steps.push({
        title: "第 3 步 · 皴擦定质",
        canvas: cunCv,
        desc: "在暗面与结构转折处皴擦：干笔侧锋，顺着山石纹理见笔见墨。亮面坚决留白。上图显示了原画中需要「皴」出来的区域——最深的部位就是皴笔最密的地方。",
        tips: [
          "先皴后擦：皴笔要毛、要松，擦笔极干、若有若无",
          "根据对象选皴法：土山披麻、石山斧劈、密点雨点",
          "皴完退远看：暗部是否连成整体？碎了就用擦笔统一"
        ]
      });
    } else {
      const bigToneCv = grayToCanvas(blurMid, w, h, v => {
        const lv = v < th3[0] ? 65 : v < th3[1] ? 150 : 235;
        return tone(lv, paper, inkC);
      });
      steps.push({
        title: "第 3 步 · 铺大调子",
        canvas: bigToneCv,
        desc: "眯起眼睛，用 4B–6B 铅笔大胆铺出所有暗部与投影。此时画面只分黑、灰、白三档（如上图）——不抠任何细节，只求大关系成立。" +
          (stats.lightDir ? "本画光源大致来自" + stats.lightDir + "，所有暗面应统一朝向另一侧。" : ""),
        tips: [
          "从明暗交界线下笔，向暗部推开，留出反光",
          "所有暗部一起铺，保持整体——不要画完一个再画下一个",
          "侧锋宽排线，两三层即可，忌一次涂死"
        ]
      });
    }

    // ---- 第 4 步：分层深入 / 渲染 ----
    const th6 = quantileLevels(gray, 6);
    if (mode === "ink") {
      const blurSoft = boxBlur(gray, w, h, 2, 1);
      const ranCv = grayToCanvas(blurSoft, w, h, v => {
        let lv;
        if (v < th6[0]) lv = 40; else if (v < th6[1]) lv = 85;
        else if (v < th6[2]) lv = 130; else if (v < th6[3]) lv = 175;
        else if (v < th6[4]) lv = 215; else lv = 248;
        return tone(lv, paper, inkC);
      });
      steps.push({
        title: "第 4 步 · 淡墨渲染",
        canvas: ranCv,
        desc: "羊毫饱蘸淡墨，分层渲染暗面与远景，让皴笔浑然一体。上图把原画归纳为「焦浓重淡清」多个墨阶——渲染就是把这些层次染出来，一遍不够干后再积一遍（积墨法）。",
        tips: [
          "渲染趁湿衔接，边缘让水自然洇开",
          "远山一遍淡墨扫过即可，「远山无皴」",
          "宁可淡了再积，不可一次染死——纸干后墨色会浅两成"
        ]
      });
    } else {
      const midCv = grayToCanvas(gray, w, h, (v, i) => {
        let lv;
        if (v < th6[0]) lv = 45; else if (v < th6[1]) lv = 90;
        else if (v < th6[2]) lv = 135; else if (v < th6[3]) lv = 180;
        else if (v < th6[4]) lv = 218; else lv = 246;
        return tone(lv, paper, inkC);
      });
      steps.push({
        title: "第 4 步 · 分层深入",
        canvas: midCv,
        desc: "把三大调细分为五到六个层次（如上图）：加重明暗交界线与投影根部，画出灰面的微妙过渡，拉开前后空间。从主体物、视觉中心开始深入。",
        tips: [
          "五调子检查：反光永远不能亮过灰面",
          "用交叉排线叠加层次，软铅打底、硬铅收紧",
          "次要部位主动放松，「有的放矢」比面面俱到更高级"
        ]
      });
    }

    // ---- 第 5 步：完成对比 ----
    const finalCv = grayToCanvas(gray, w, h, (v, i) => {
      // 轻微对比增强 + 纸色
      const c = Math.min(255, Math.max(0, (v - stats.brightness) * 1.08 + stats.brightness));
      return tone(c, paper, inkC);
    });
    steps.push({
      title: mode === "ink" ? "第 5 步 · 点苔提神，题款完成" : "第 5 步 · 刻画细节，调整完成",
      canvas: finalCv,
      original: true,
      desc: mode === "ink"
        ? "最后以焦墨点苔、醒线：在山头、石隙、树根处点上最重的墨点，全画立刻精神。检查虚实呼应后题款钤印。上图为完成效果（已转为墨色示意），可与你的临作对比。"
        : "最后阶段：刻画主体细节与质感，用可塑橡皮提出高光，压掉抢眼的次要细节。退后两米与上图（完成稿灰度示意）对比整体关系，签名完成。",
      tips: mode === "ink" ? [
        "点苔要「攒三聚五」，有聚有散，切忌均匀撒点",
        "题款位置是构图的一部分，选在气眼空白处",
        "对照第 1 步的布局图检查：宾主、开合是否依然清晰"
      ] : [
        "眯眼对比原作：黑白灰分布是否一致？",
        "边缘虚实是否有节奏？高光是否干净？",
        "对照第 1 步的构图图检查：大关系没垮，细节才有意义"
      ]
    });

    return steps;
  }

  /* ---------- UI 流程 ---------- */
  const zone = document.getElementById("upload-zone");
  const fileInput = document.getElementById("file-input");
  const resultEl = document.getElementById("analyze-result");
  const loadingEl = document.getElementById("analyze-loading");
  const summaryEl = document.getElementById("analyze-summary");
  const stepsEl = document.getElementById("steps-container");

  let currentData = null; // { gray, w, h, stats, srcCanvas }
  let currentMode = "sketch";

  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault(); zone.classList.remove("dragover");
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });
  document.getElementById("reanalyze-btn").addEventListener("click", () => {
    resultEl.hidden = true; zone.hidden = false; fileInput.value = "";
  });
  document.getElementById("style-choice").addEventListener("click", e => {
    const btn = e.target.closest("[data-mode]");
    if (!btn || !currentData) return;
    currentMode = btn.dataset.mode;
    document.querySelectorAll("#style-choice [data-mode]").forEach(b =>
      b.classList.toggle("active", b === btn));
    renderSteps();
  });

  function handleFile(file) {
    if (!file.type.startsWith("image/")) { alert("请选择图片文件"); return; }
    zone.hidden = true; resultEl.hidden = true; loadingEl.hidden = false;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // 缩放
      const scale = Math.min(1, MAXW / img.width, MAXW / img.height);
      const w = Math.max(2, Math.round(img.width * scale));
      const h = Math.max(2, Math.round(img.height * scale));
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const c = cv.getContext("2d");
      c.drawImage(img, 0, 0, w, h);
      const imgData = c.getImageData(0, 0, w, h);
      const gray = toGrayArray(imgData);
      const stats = analyzeStats(imgData, gray, w, h);
      currentData = { gray, w, h, stats, srcCanvas: cv };
      // 自动判断模式：低饱和 + 中低对比 → 可能是水墨
      currentMode = stats.colorfulness < 28 && stats.brightness > 120 ? guessInk(stats) : "sketch";
      document.querySelectorAll("#style-choice [data-mode]").forEach(b =>
        b.classList.toggle("active", b.dataset.mode === currentMode));
      // 稍延迟让 loading 可见
      setTimeout(() => {
        renderSummary(file.name);
        renderSteps();
        loadingEl.hidden = true;
        resultEl.hidden = false;
      }, 400);
    };
    img.onerror = () => { loadingEl.hidden = true; zone.hidden = false; alert("图片加载失败，请换一张试试"); };
    img.src = url;
  }

  function guessInk(stats) {
    // 亮底 + 低饱和 + 对比适中，接近水墨特征
    return (stats.colorfulness < 20 && stats.contrast < 70) ? "ink" : "sketch";
  }

  function renderSummary(name) {
    const s = currentData.stats;
    const briDesc = s.brightness > 170 ? "高调（明亮）" : s.brightness > 100 ? "中调" : "低调（深沉）";
    const conDesc = s.contrast > 62 ? "强对比" : s.contrast > 38 ? "中等对比" : "弱对比（柔和）";
    const colDesc = s.colorfulness < 15 ? "近乎单色（水墨/素描特征）" : s.colorfulness < 45 ? "低饱和" : "色彩丰富";
    summaryEl.innerHTML = `
      <h3>📋 画面分析报告 <small style="color:#888;font-size:13px">${name.replace(/[<>&"]/g, "")}</small></h3>
      <div class="summary-tags">
        <span class="summary-tag">影调：${briDesc}</span>
        <span class="summary-tag">对比：${conDesc}</span>
        <span class="summary-tag">色彩：${colDesc}</span>
        ${s.lightDir ? `<span class="summary-tag">光源方向：约${s.lightDir}</span>` : ""}
      </div>
      <p style="font-size:14.5px;color:#55524b">系统已把这幅画分解为 5 个绘制阶段。每一步都附有该阶段的画面参考图与技法要点——
      按顺序临摹，就是从空白纸面到完成这幅画的完整路径。可切换「素描画法 / 水墨画法」查看两种不同的实现思路。</p>`;
  }

  function renderSteps() {
    stepsEl.innerHTML = "";
    const steps = buildSteps(currentMode, currentData);
    steps.forEach((st, i) => {
      const card = document.createElement("div");
      card.className = "step-card";
      const vis = document.createElement("div");
      vis.className = "step-visual";
      st.canvas.style.width = "100%";
      vis.appendChild(st.canvas);
      const info = document.createElement("div");
      info.className = "step-info";
      info.innerHTML = `
        <span class="step-num">STEP ${i + 1} / ${steps.length}</span>
        <h3>${st.title}</h3>
        <p>${st.desc}</p>
        <ul>${st.tips.map(t => `<li>${t}</li>`).join("")}</ul>`;
      card.appendChild(vis);
      card.appendChild(info);
      stepsEl.appendChild(card);
    });
  }
})();
