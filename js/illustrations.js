/* ===== 课程插图（Canvas 程序化绘制）===== */
(function () {
  const ILLU = {};

  // 小工具
  function pencilLine(ctx, x1, y1, x2, y2, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.75 : alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    // 轻微抖动模拟手绘
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 2;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 2;
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  function label(ctx, text, x, y, color) {
    ctx.save();
    ctx.fillStyle = color || "#8a6d3b";
    ctx.font = "13px 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* --- 排线示例 --- */
  ILLU.hatching = function (ctx, w, h) {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.2;
    // 1 平行排线
    for (let i = 0; i < 14; i++) {
      const x = 30 + i * 7;
      pencilLine(ctx, x, 40, x + 22, 130, 0.55 + Math.random() * 0.2);
    }
    label(ctx, "平行排线", 90, 165);
    // 2 交叉排线
    for (let i = 0; i < 13; i++) {
      const x = 200 + i * 7;
      pencilLine(ctx, x, 40, x + 22, 130, 0.5);
    }
    for (let i = 0; i < 13; i++) {
      const x = 196 + i * 7;
      pencilLine(ctx, x + 30, 40, x, 130, 0.45);
    }
    label(ctx, "交叉排线（45°叠加）", 260, 165);
    // 3 转折排线（弧形）
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      const cx = 430, cy = 150;
      const a1 = -1.9 + t * 0.9, r = 100;
      ctx.arc(cx, cy, r - i * 1.5, a1, a1 + 0.75);
      ctx.stroke();
      ctx.restore();
    }
    label(ctx, "顺结构的转折排线", 440, 165);
    // 4 错误示范
    ctx.save();
    ctx.strokeStyle = "#b5542d";
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    let px = 540, py = 60;
    ctx.moveTo(px, py);
    for (let i = 0; i < 40; i++) {
      px += (Math.random() - 0.42) * 22;
      py += Math.random() * 4;
      px = Math.max(525, Math.min(615, px));
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
    label(ctx, "✕ 来回蹭的死结线", 575, 165, "#b5542d");
  };

  /* --- 透视示例 --- */
  ILLU.perspective = function (ctx, w, h) {
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    // 一点透视
    const hy = 120;
    ctx.save();
    ctx.strokeStyle = "#b8b0a0";
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(20, hy); ctx.lineTo(300, hy); ctx.stroke();
    ctx.restore();
    const vp = { x: 160, y: hy };
    // 盒子正面
    const f = { x: 60, y: 150, w: 80, h: 60 };
    ctx.strokeRect(f.x, f.y, f.w, f.h);
    // 汇聚线
    function toVP(x, y, t) { return { x: x + (vp.x - x) * t, y: y + (vp.y - y) * t }; }
    const t = 0.35;
    const corners = [[f.x, f.y], [f.x + f.w, f.y], [f.x + f.w, f.y + f.h], [f.x, f.y + f.h]];
    const backs = corners.map(c => toVP(c[0], c[1], t));
    ctx.save();
    ctx.strokeStyle = "#c96";
    ctx.setLineDash([3, 3]);
    corners.forEach((c, i) => { ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(vp.x, vp.y); ctx.stroke(); });
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(backs[0].x, backs[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(backs[i].x, backs[i].y);
    ctx.closePath(); ctx.stroke();
    corners.forEach((c, i) => { ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(backs[i].x, backs[i].y); ctx.stroke(); });
    ctx.fillStyle = "#b5542d";
    ctx.beginPath(); ctx.arc(vp.x, vp.y, 3.5, 0, 7); ctx.fill();
    label(ctx, "一点透视：消失点在视平线上", 160, 250);
    // 两点透视
    const hy2 = 110, vpl = { x: 330, y: hy2 }, vpr = { x: 620, y: hy2 };
    ctx.save();
    ctx.strokeStyle = "#b8b0a0"; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(320, hy2); ctx.lineTo(630, hy2); ctx.stroke();
    ctx.restore();
    const ex = 475, eyT = 140, eyB = 215; // 近棱
    ctx.beginPath(); ctx.moveTo(ex, eyT); ctx.lineTo(ex, eyB); ctx.stroke();
    function edge(vp2, tt) {
      const xT = ex + (vp2.x - ex) * tt, yT = eyT + (vp2.y - eyT) * tt;
      const xB = ex + (vp2.x - ex) * tt, yB = eyB + (vp2.y - eyB) * tt;
      ctx.beginPath(); ctx.moveTo(ex, eyT); ctx.lineTo(xT, yT); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex, eyB); ctx.lineTo(xB, yB); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xT, yT); ctx.lineTo(xB, yB); ctx.stroke();
      return { xT, yT, xB, yB };
    }
    edge(vpl, 0.42); edge(vpr, 0.4);
    ctx.fillStyle = "#3d5a5b";
    ctx.beginPath(); ctx.arc(vpl.x, vpl.y, 3.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(vpr.x, vpr.y, 3.5, 0, 7); ctx.fill();
    label(ctx, "两点透视：左右各一个消失点", 475, 250);
  };

  /* --- 结构素描 --- */
  ILLU.structure = function (ctx, w, h) {
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1.4;
    // 立方体（含内部虚线）
    const p = [[120,70],[220,95],[190,190],[90,160],[60,95],[160,55],[255,120],[155,225]];
    // 外轮廓
    function seg(a, b, dash) {
      ctx.save();
      if (dash) { ctx.setLineDash([5, 5]); ctx.globalAlpha = 0.45; }
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.restore();
    }
    const A=[90,80],B=[210,60],C=[260,110],D=[140,135],E=[95,200],F=[215,180],G=[262,225];
    const Dh=[145,255];
    seg(A,B);seg(B,C);seg(C,G);seg(G,F);seg(F,E);seg(E,A);
    seg(B,F);seg(A,E,false);
    seg(A,D,true);seg(D,C,true);seg(D,Dh,true);seg(E,Dh,true);seg(Dh,G,true);
    label(ctx, "立方体：内部结构线（虚线）也要交代", 175, 250);
    // 圆柱
    ctx.save();
    ctx.beginPath(); ctx.ellipse(450, 80, 60, 18, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(390, 80); ctx.lineTo(390, 200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(510, 80); ctx.lineTo(510, 200); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(450, 200, 60, 24, 0, 0, Math.PI); ctx.stroke();
    ctx.setLineDash([5,5]); ctx.globalAlpha = .45;
    ctx.beginPath(); ctx.ellipse(450, 200, 60, 24, 0, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(450, 62); ctx.lineTo(450, 224); ctx.stroke();
    ctx.restore();
    label(ctx, "圆柱：下椭圆比上椭圆更圆", 450, 250);
  };

  /* --- 五调子球体 --- */
  ILLU.fivetones = function (ctx, w, h) {
    const cx = 240, cy = 140, r = 90;
    // 投影
    ctx.save();
    const shGrad = ctx.createRadialGradient(cx + 55, cy + r - 8, 6, cx + 65, cy + r - 4, 120);
    shGrad.addColorStop(0, "rgba(30,30,30,.75)");
    shGrad.addColorStop(1, "rgba(30,30,30,0)");
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(cx + 60, cy + r - 6, 115, 26, 0.06, 0, 7);
    ctx.fill();
    ctx.restore();
    // 球体渐变（光源左上）
    const g = ctx.createRadialGradient(cx - r * .45, cy - r * .5, r * .1, cx, cy, r * 1.15);
    g.addColorStop(0, "#fdfdfd");
    g.addColorStop(0.32, "#d8d8d8");
    g.addColorStop(0.62, "#8f8f8f");
    g.addColorStop(0.78, "#4c4c4c");
    g.addColorStop(0.92, "#6e6e6e"); // 反光
    g.addColorStop(1, "#5c5c5c");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    // 标注
    ctx.strokeStyle = "#b5542d"; ctx.fillStyle = "#b5542d";
    ctx.font = "13px 'Noto Serif SC', serif"; ctx.lineWidth = 1;
    function callout(x1, y1, x2, y2, text, align) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.textAlign = align || "left";
      ctx.fillText(text, x2 + (align === "right" ? -4 : 4), y2 + 4);
    }
    callout(cx - r * .45, cy - r * .5, 80, 40, "① 高光", "right");
    callout(cx - r * .1, cy - r * .15, 90, 95, "② 亮部", "right");
    callout(cx + r * .42, cy + r * .38, 420, 200, "③ 明暗交界线");
    callout(cx - r * .25, cy + r * .82, 120, 250, "④ 反光", "right");
    callout(cx + 100, cy + r - 4, 430, 255, "⑤ 投影");
    label(ctx, "光源 ☀", 90, 22, "#8a6d3b");
    ctx.save();
    ctx.strokeStyle = "#c9a86a";
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(105, 30); ctx.lineTo(cx - r * .5, cy - r * .6); ctx.stroke();
    ctx.restore();
  };

  /* --- 笔法 --- */
  ILLU.bifa = function (ctx, w, h) {
    ctx.lineCap = "round";
    // 中锋：圆润粗线
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 7; ctx.globalAlpha = .9;
    ctx.beginPath(); ctx.moveTo(40, 60);
    ctx.bezierCurveTo(90, 40, 110, 110, 160, 90); ctx.stroke();
    label(ctx, "中锋：圆劲如锥画沙", 100, 160);
    // 侧锋：一边毛
    ctx.globalAlpha = 1;
    for (let i = 0; i < 22; i++) {
      ctx.save();
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.globalAlpha = 0.15 + Math.random() * 0.4;
      ctx.beginPath();
      const t = i / 22;
      ctx.moveTo(210 + t * 110, 55 + Math.sin(t * 3) * 8 + i * 0.8);
      ctx.lineTo(224 + t * 110, 62 + Math.sin(t * 3 + 0.4) * 8 + i * 0.8);
      ctx.stroke();
      ctx.restore();
    }
    label(ctx, "侧锋：一边光一边毛", 280, 160);
    // 逆锋：苍涩断续
    ctx.strokeStyle = "#111";
    for (let i = 0; i < 30; i++) {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.random() * 0.5;
      ctx.lineWidth = 1.5 + Math.random() * 3;
      const x = 400 + i * 4.2;
      ctx.beginPath();
      ctx.moveTo(x, 75 + (Math.random() - .5) * 10);
      ctx.lineTo(x + 3 + Math.random() * 4, 72 + (Math.random() - .5) * 10);
      ctx.stroke();
      ctx.restore();
    }
    label(ctx, "逆锋：苍老斑驳", 460, 160);
    // 拖笔
    ctx.save();
    ctx.strokeStyle = "#333"; ctx.lineWidth = 4; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.moveTo(545, 50);
    ctx.bezierCurveTo(600, 70, 560, 110, 620, 125);
    ctx.stroke(); ctx.restore();
    label(ctx, "拖笔：轻快流畅", 585, 160);
  };

  /* --- 墨分五色 --- */
  ILLU.mose = function (ctx, w, h) {
    const names = ["焦", "浓", "重", "淡", "清"];
    const alphas = [1, 0.85, 0.6, 0.32, 0.13];
    for (let i = 0; i < 5; i++) {
      const x = 45 + i * 120;
      // 墨块（带毛边）
      ctx.save();
      ctx.fillStyle = "#0a0a0a";
      ctx.globalAlpha = alphas[i];
      ctx.beginPath();
      const bx = x, by = 40, bw = 82, bh = 82;
      ctx.moveTo(bx + 6, by);
      for (let k = 0; k <= 20; k++) ctx.lineTo(bx + (bw / 20) * k, by + (Math.random() - .5) * 5);
      for (let k = 0; k <= 20; k++) ctx.lineTo(bx + bw + (Math.random() - .5) * 5, by + (bh / 20) * k);
      for (let k = 20; k >= 0; k--) ctx.lineTo(bx + (bw / 20) * k, by + bh + (Math.random() - .5) * 5);
      for (let k = 20; k >= 0; k--) ctx.lineTo(bx + (Math.random() - .5) * 5, by + (bh / 20) * k);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      label(ctx, names[i] + "墨", x + 41, 155, "#5a5348");
    }
  };

  /* --- 皴法 --- */
  ILLU.cunfa = function (ctx, w, h) {
    ctx.lineCap = "round";
    // 披麻皴：长弧线
    ctx.strokeStyle = "#2a2a2a";
    // 山形轮廓
    function hill(x0, topx, topy, x1, base) {
      ctx.save(); ctx.lineWidth = 2; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.moveTo(x0, base);
      ctx.quadraticCurveTo(topx - 30, topy + 10, topx, topy);
      ctx.quadraticCurveTo(topx + 40, topy + 20, x1, base);
      ctx.stroke(); ctx.restore();
    }
    hill(25, 110, 55, 200, 200);
    for (let i = 0; i < 26; i++) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25 + Math.random() * 0.35;
      const sx = 55 + Math.random() * 95, sy = 80 + Math.random() * 40;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx - 8 + Math.random() * 6, sy + 45, sx - 18 + Math.random() * 8, sy + 85 + Math.random() * 20);
      ctx.stroke(); ctx.restore();
    }
    label(ctx, "披麻皴（土山圆缓）", 112, 232);
    // 斧劈皴：侧锋楔形
    hill(240, 330, 45, 420, 200);
    for (let i = 0; i < 20; i++) {
      ctx.save();
      const sx = 275 + Math.random() * 100, sy = 70 + Math.random() * 70;
      const len = 22 + Math.random() * 30;
      const g = ctx.createLinearGradient(sx, sy, sx + len * .4, sy + len);
      g.addColorStop(0, "rgba(20,20,20,.8)");
      g.addColorStop(1, "rgba(20,20,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 7 + Math.random() * 5, sy + 2);
      ctx.lineTo(sx + len * .35, sy + len);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    label(ctx, "斧劈皴（石山峭拔）", 330, 232);
    // 雨点皴：短竖点
    hill(455, 545, 50, 630, 200);
    for (let i = 0; i < 130; i++) {
      ctx.save();
      ctx.globalAlpha = 0.2 + Math.random() * 0.5;
      ctx.lineWidth = 1.6;
      const sx = 488 + Math.random() * 115, sy = 72 + Math.random() * 105;
      // 山形内简单裁剪：靠近山顶收窄
      if (sy < 110 && Math.abs(sx - 545) > (sy - 45) * 1.1) { ctx.restore(); continue; }
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 1, sy + 5 + Math.random() * 5); ctx.stroke();
      ctx.restore();
    }
    label(ctx, "雨点皴（苍厚密集）", 545, 232);
  };

  /* --- 树法 --- */
  ILLU.shufa = function (ctx, w, h) {
    ctx.lineCap = "round"; ctx.strokeStyle = "#1c1c1c";
    // 鹿角枝
    function branch(x, y, ang, len, wdt, depth, up) {
      if (depth <= 0 || len < 4) return;
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      ctx.save(); ctx.lineWidth = wdt; ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(ang + .3) * len * .5, y + Math.sin(ang + .3) * len * .5, x2, y2);
      ctx.stroke(); ctx.restore();
      const spread = up ? -0.55 : 0.55;
      branch(x2, y2, ang + spread * (0.6 + Math.random() * .5), len * .68, wdt * .65, depth - 1, up);
      branch(x2, y2, ang - spread * (0.4 + Math.random() * .4) * .5, len * .7, wdt * .65, depth - 1, up);
    }
    branch(90, 215, -Math.PI / 2, 55, 5, 5, true);
    label(ctx, "鹿角枝（上挺）", 95, 245);
    branch(250, 215, -Math.PI / 2 + .08, 50, 5, 5, false);
    label(ctx, "蟹爪枝（下屈）", 250, 245);
    // 介字点
    ctx.lineWidth = 2.4;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = 385 + c * 28 + (r % 2) * 12, y = 70 + r * 42;
      ctx.save(); ctx.globalAlpha = .55 + Math.random() * .35;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 17); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 3, y + 6); ctx.lineTo(x - 11, y + 18); ctx.stroke();
      ctx.restore();
    }
    label(ctx, "介字点", 435, 245);
    // 个字点
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = 545 + c * 30 + (r % 2) * 14, y = 72 + r * 42;
      ctx.save(); ctx.globalAlpha = .55 + Math.random() * .35;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y + 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 18); ctx.stroke();
      ctx.restore();
    }
    label(ctx, "个字点", 580, 245);
  };

  /* --- 三远 --- */
  ILLU.sanyuan = function (ctx, w, h) {
    ctx.strokeStyle = "#22303a";
    function peak(x, baseY, topY, half, alpha) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.lineWidth = 1.6;
      ctx.fillStyle = "rgba(50,70,80," + alpha * 0.35 + ")";
      ctx.beginPath();
      ctx.moveTo(x - half, baseY);
      ctx.quadraticCurveTo(x - half * .3, topY + (baseY - topY) * .35, x, topY);
      ctx.quadraticCurveTo(x + half * .4, topY + (baseY - topY) * .4, x + half, baseY);
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    // 高远：主峰高耸
    peak(110, 210, 25, 70, 0.95);
    peak(55, 210, 130, 45, 0.6);
    peak(170, 210, 150, 40, 0.5);
    label(ctx, "高远：仰望主峰", 110, 235);
    // 深远：层峦推深
    for (let i = 0; i < 5; i++) {
      peak(300 + i * 22, 205 - i * 26, 130 - i * 22, 62 - i * 6, 0.85 - i * 0.15);
    }
    label(ctx, "深远：层峦叠嶂", 345, 235);
    // 平远：一河两岸
    ctx.save();
    ctx.lineWidth = 1.6; ctx.globalAlpha = .9;
    // 近坡
    ctx.beginPath(); ctx.moveTo(480, 205); ctx.quadraticCurveTo(540, 188, 640, 200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(500, 205); ctx.quadraticCurveTo(530, 196, 560, 202); ctx.stroke();
    // 小树
    for (let i = 0; i < 4; i++) {
      const tx = 505 + i * 22;
      ctx.beginPath(); ctx.moveTo(tx, 200); ctx.lineTo(tx, 182); ctx.stroke();
      ctx.beginPath(); ctx.arc(tx, 178, 5, 0, 7); ctx.stroke();
    }
    ctx.restore();
    // 远山
    peak(545, 120, 82, 55, 0.35);
    peak(600, 120, 95, 40, 0.25);
    ctx.save(); ctx.globalAlpha = .3; ctx.beginPath();
    ctx.moveTo(480, 150); ctx.lineTo(645, 150); ctx.stroke(); ctx.restore();
    label(ctx, "平远：一河两岸", 560, 235);
  };

  /* --- 首页水墨装饰画 --- */
  ILLU.hero = function (ctx, w, h) {
    // 纸底
    ctx.fillStyle = "#fdfcf8";
    ctx.fillRect(0, 0, w, h);
    // 远山（淡墨）
    function inkPeak(cx, baseY, topY, half, alpha) {
      const g = ctx.createLinearGradient(0, topY, 0, baseY);
      g.addColorStop(0, "rgba(45,55,65," + alpha + ")");
      g.addColorStop(1, "rgba(45,55,65,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - half, baseY);
      ctx.quadraticCurveTo(cx - half * .25, topY + 20, cx, topY);
      ctx.quadraticCurveTo(cx + half * .35, topY + 30, cx + half, baseY);
      ctx.fill();
    }
    inkPeak(300, 190, 30, 150, 0.55);
    inkPeak(160, 195, 80, 120, 0.35);
    inkPeak(390, 200, 95, 110, 0.28);
    inkPeak(80, 205, 130, 90, 0.18);
    // 水面留白 + 水纹
    ctx.strokeStyle = "rgba(60,70,80,.25)"; ctx.lineWidth = 1;
    [225, 238, 254].forEach((y, i) => {
      ctx.beginPath();
      ctx.moveTo(40 + i * 40, y);
      ctx.quadraticCurveTo(210, y - 3, 380 - i * 30, y);
      ctx.stroke();
    });
    // 近景坡石 + 树
    ctx.strokeStyle = "rgba(25,30,35,.85)"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 275); ctx.quadraticCurveTo(80, 250, 165, 268); ctx.quadraticCurveTo(200, 276, 230, 292); ctx.stroke();
    // 树
    function tree(x, base, hgt) {
      ctx.beginPath(); ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x - 4, base - hgt * .5, x + 3, base - hgt); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const t = 0.35 + i * 0.14;
        const bx = x + (i % 2 ? 3 : -2), by = base - hgt * t;
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.lineTo(bx + (i % 2 ? 14 : -13), by - 8 - Math.random() * 4); ctx.stroke();
      }
      // 混点叶
      ctx.save(); ctx.fillStyle = "rgba(25,30,35,.6)";
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 20;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * r * 1.2, base - hgt + 4 + Math.sin(a) * r * .6, 3.2, 1.8, a, 0, 7);
        ctx.fill();
      }
      ctx.restore();
    }
    tree(70, 268, 55); tree(105, 265, 42);
    // 小舟
    ctx.save(); ctx.strokeStyle = "rgba(25,30,35,.8)"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(285, 244); ctx.quadraticCurveTo(300, 250, 318, 243); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(299, 244); ctx.lineTo(299, 232); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(299, 233); ctx.lineTo(291, 240); ctx.stroke();
    ctx.restore();
    // 焦墨点苔
    ctx.fillStyle = "rgba(10,10,10,.85)";
    [[150, 262], [162, 266], [40, 262], [55, 258], [180, 272]].forEach(p => {
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 2.6, 1.6, .4, 0, 7); ctx.fill();
    });
    // 印章
    ctx.fillStyle = "rgba(178,60,40,.85)";
    ctx.fillRect(374, 250, 26, 26);
    ctx.fillStyle = "#fdfcf8";
    ctx.font = "12px 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.fillText("绘", 387, 262);
    ctx.fillText("境", 387, 273);
  };

  // 渲染页面中所有 data-illu 的 canvas
  window.renderIllustrations = function (root) {
    (root || document).querySelectorAll("canvas[data-illu]").forEach(cv => {
      if (cv.dataset.done) return;
      const fn = ILLU[cv.dataset.illu];
      if (!fn) return;
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, cv.width, cv.height);
      fn(ctx, cv.width, cv.height);
      cv.dataset.done = "1";
    });
  };
  window.ILLU = ILLU;
})();
