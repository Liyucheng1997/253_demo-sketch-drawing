/* ===== 内置分步临摹示范 ===== */
(function () {
  const W = 900, H = 620;

  /* ---------- 绘制辅助 ---------- */
  function hatch(ctx, cx, cy, rx, ry, rot, angle, count, alpha, len) {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1.1;
    for (let i = 0; i < count; i++) {
      ctx.globalAlpha = alpha * (0.6 + Math.random() * 0.4);
      const px = (Math.random() - 0.5) * rx * 2;
      const py = (Math.random() - 0.5) * ry * 2;
      if ((px * px) / (rx * rx) + (py * py) / (ry * ry) > 1) continue;
      const l = len || 16;
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(angle) * l / 2, py - Math.sin(angle) * l / 2);
      ctx.lineTo(px + Math.cos(angle) * l / 2, py + Math.sin(angle) * l / 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function line(ctx, x1, y1, x2, y2, w, alpha) {
    ctx.save();
    ctx.strokeStyle = "#2b2b2b";
    ctx.lineWidth = w || 1.5;
    ctx.globalAlpha = alpha == null ? 0.8 : alpha;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  function inkStroke(ctx, pts, width, alpha) {
    ctx.save();
    ctx.strokeStyle = "#1a1e24";
    ctx.lineWidth = width; ctx.globalAlpha = alpha;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i][0] + pts[i + 1][0]) / 2, yc = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 示范定义 ----------
     每个 demo: { name, icon(小缩略图), steps: [{tip, draw(ctx)}] }
     draw 为增量绘制：进入第 n 步时依次执行 0..n 的 draw。 */

  const DEMOS = {};

  /* --- 排线练习 --- */
  DEMOS.lines = {
    name: "排线基本功",
    tool: "pencil",
    steps: [
      {
        tip: "第 1 步 · 平行排线：跟随底稿方向，练习一组组两头轻中间重的平行线。手臂带动，一根线一笔完成，不要来回蹭。",
        draw(ctx) {
          for (let g = 0; g < 3; g++) {
            for (let i = 0; i < 16; i++) {
              const x = 80 + g * 130 + i * 7;
              line(ctx, x, 80 + g * 20, x + 30, 200 + g * 20, 1.2, 0.5);
            }
          }
        }
      },
      {
        tip: "第 2 步 · 交叉排线：在第一层上以约 40° 夹角叠第二层，调子变深但仍透气。注意避免 90° 直角交叉。",
        draw(ctx) {
          for (let i = 0; i < 30; i++) {
            const x = 560 + i * 8;
            line(ctx, x, 90, x + 26, 210, 1.2, 0.45);
          }
          for (let i = 0; i < 30; i++) {
            const x = 552 + i * 8;
            line(ctx, x + 34, 96, x, 204, 1.2, 0.4);
          }
        }
      },
      {
        tip: "第 3 步 · 渐变排线：从左到右由重到轻，靠下笔力度与线距变化做出渐变。这是铺调子的核心能力。",
        draw(ctx) {
          for (let i = 0; i < 60; i++) {
            const t = i / 60;
            const x = 90 + i * 12;
            line(ctx, x, 300, x + 22, 430, 1.3, 0.75 * (1 - t) + 0.05);
          }
        }
      },
      {
        tip: "第 4 步 · 弧形排线：顺着假想圆柱的表面画弧线，线条方向随形体转动——记住「排线跟着结构走」。",
        draw(ctx) {
          for (let i = 0; i < 24; i++) {
            ctx.save();
            ctx.strokeStyle = "#333"; ctx.lineWidth = 1.2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(450, 700, 200 + i * 6, 190 + i * 6, 0, -2.1, -1.05);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    ]
  };

  /* --- 素描球体 --- */
  DEMOS.sphere = {
    name: "素描球体（五调子）",
    tool: "pencil",
    steps: [
      {
        tip: "第 1 步 · 起形：先用轻直线画正方形定位，再切八边形，最后修成圆。所有辅助线都画轻一点（对应口诀「宁方勿圆」）。",
        draw(ctx) {
          const cx = 430, cy = 280, r = 150;
          ctx.save(); ctx.globalAlpha = 0.35;
          ctx.strokeStyle = "#555"; ctx.lineWidth = 1;
          ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
          // 切角八边形
          const k = r * 0.42;
          ctx.beginPath();
          ctx.moveTo(cx - r + k, cy - r); ctx.lineTo(cx + r - k, cy - r);
          ctx.lineTo(cx + r, cy - r + k); ctx.lineTo(cx + r, cy + r - k);
          ctx.lineTo(cx + r - k, cy + r); ctx.lineTo(cx - r + k, cy + r);
          ctx.lineTo(cx - r, cy + r - k); ctx.lineTo(cx - r, cy - r + k);
          ctx.closePath(); ctx.stroke();
          ctx.restore();
          ctx.save(); ctx.globalAlpha = 0.7; ctx.strokeStyle = "#333"; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); ctx.restore();
        }
      },
      {
        tip: "第 2 步 · 定明暗交界线与投影：光从左上来，交界线是一条弧形的「带」，位于球体偏右下；同时轻轻框出台面投影的椭圆。",
        draw(ctx) {
          const cx = 430, cy = 280, r = 150;
          ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = "#333"; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 0.62, r * 0.97, -0.62, -1.4, 1.5);
          ctx.stroke();
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.ellipse(cx + 105, cy + r + 18, 190, 42, 0.05, 0, 7);
          ctx.stroke();
          ctx.restore();
        }
      },
      {
        tip: "第 3 步 · 铺暗部大调子：从明暗交界线开始向右下排线，暗部整体压下去，注意底部留出一条反光。投影近实远虚。",
        draw(ctx) {
          const cx = 430, cy = 280, r = 150;
          // 暗部
          hatch(ctx, cx + 45, cy + 42, r * 0.72, r * 0.72, 0, -0.9, 700, 0.32, 20);
          hatch(ctx, cx + 62, cy + 30, r * 0.5, r * 0.62, 0, -0.5, 400, 0.3, 18);
          // 投影
          hatch(ctx, cx + 60, cy + r + 16, 130, 34, 0.05, 0.1, 500, 0.4, 22);
          hatch(ctx, cx + 190, cy + r + 18, 90, 30, 0.05, 0.1, 200, 0.18, 22);
        }
      },
      {
        tip: "第 4 步 · 过渡灰面：从交界线向亮部方向画中间调，排线顺球面弧转。保住左上方高光区域，一根线也不要画进去。",
        draw(ctx) {
          const cx = 430, cy = 280, r = 150;
          hatch(ctx, cx - 12, cy - 5, r * 0.85, r * 0.85, 0, -0.7, 480, 0.14, 17);
          hatch(ctx, cx + 20, cy + 15, r * 0.8, r * 0.8, 0, -1.1, 300, 0.12, 16);
        }
      },
      {
        tip: "第 5 步 · 深入与收尾：加重明暗交界线中段（最重处），交叉排线压实暗部；轻扫亮灰面；检查——反光不能亮过灰面，高光是否干净？",
        draw(ctx) {
          const cx = 430, cy = 280, r = 150;
          hatch(ctx, cx + 40, cy + 45, r * 0.45, r * 0.6, -0.5, 0.4, 500, 0.3, 15);
          hatch(ctx, cx + 30, cy + 35, r * 0.35, r * 0.5, -0.5, -0.9, 300, 0.28, 14);
          // 背景衬托
          hatch(ctx, cx - r - 60, cy - 40, 55, 130, 0, -0.85, 260, 0.16, 22);
        }
      }
    ]
  };

  /* --- 立方体 --- */
  DEMOS.cube = {
    name: "两点透视立方体",
    tool: "pencil",
    steps: [
      {
        tip: "第 1 步 · 视平线与近棱：轻轻画一条水平的视平线，在中下方画出立方体最近的一条垂直棱线。",
        draw(ctx) {
          ctx.save(); ctx.setLineDash([6, 6]);
          line(ctx, 60, 180, 840, 180, 1, 0.3);
          ctx.restore();
          line(ctx, 430, 240, 430, 430, 1.8, 0.7);
        }
      },
      {
        tip: "第 2 步 · 向两个消失点连线：近棱上下端点分别向视平线左右两端的消失点(VP)引线，形成左右两个面的透视框架。",
        draw(ctx) {
          const vpl = [95, 180], vpr = [805, 180];
          [[430, 240], [430, 430]].forEach(p => {
            line(ctx, p[0], p[1], vpl[0], vpl[1], 1, 0.3);
            line(ctx, p[0], p[1], vpr[0], vpr[1], 1, 0.3);
          });
          ctx.save(); ctx.fillStyle = "#b5542d";
          ctx.beginPath(); ctx.arc(95, 180, 5, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(805, 180, 5, 0, 7); ctx.fill();
          ctx.restore();
        }
      },
      {
        tip: "第 3 步 · 确定宽度、立起后棱：在左右透视线上截取合适宽度，画两条垂直的侧棱，再把顶部连回对侧消失点，立方体框架完成。",
        draw(ctx) {
          function onLine(p, vp, t) { return [p[0] + (vp[0] - p[0]) * t, p[1] + (vp[1] - p[1]) * t]; }
          const vpl = [95, 180], vpr = [805, 180];
          const tl = onLine([430, 240], vpl, 0.42), bl = onLine([430, 430], vpl, 0.42);
          const tr = onLine([430, 240], vpr, 0.36), br = onLine([430, 430], vpr, 0.36);
          line(ctx, tl[0], tl[1], bl[0], bl[1], 1.8, 0.75);
          line(ctx, tr[0], tr[1], br[0], br[1], 1.8, 0.75);
          line(ctx, tl[0], tl[1], vpr[0], vpr[1], 1, 0.25);
          line(ctx, tr[0], tr[1], vpl[0], vpl[1], 1, 0.25);
          // 顶面交点(近似)
          line(ctx, tl[0], tl[1], 430, 152, 1.6, 0.7);
          line(ctx, tr[0], tr[1], 430, 152, 1.6, 0.7);
        }
      },
      {
        tip: "第 4 步 · 强调轮廓：加重外轮廓与近处棱线，擦淡辅助线（底稿中辅助线已变淡）。近实远虚，近处的棱最重。",
        draw(ctx) {
          line(ctx, 430, 240, 430, 430, 2.6, 0.95);
          line(ctx, 430, 240, 430, 152, 0, 0);
          line(ctx, 289, 299, 289, 430 - 71, 2, 0.8); // 左侧棱近似
          line(ctx, 565, 293, 565, 352, 2, 0.8);
        }
      },
      {
        tip: "第 5 步 · 三大面铺调子：设定光源在左上——顶面最亮少画，左面灰调排线，右面暗部交叉排线，最后加投影。",
        draw(ctx) {
          // 右暗面
          hatch(ctx, 500, 330, 68, 85, 0.15, -1.0, 420, 0.3, 16);
          hatch(ctx, 500, 330, 66, 82, 0.15, -0.4, 300, 0.25, 15);
          // 左灰面
          hatch(ctx, 358, 330, 70, 80, -0.1, -0.75, 260, 0.14, 16);
          // 投影
          hatch(ctx, 610, 400, 110, 30, 0.12, 0.1, 320, 0.35, 20);
        }
      }
    ]
  };

  /* --- 山水远山 --- */
  DEMOS.mountain = {
    name: "平远山水小品",
    tool: "brush",
    steps: [
      {
        tip: "第 1 步 · 布局勾近坡：意在笔先——近坡、中景主山、远山三段。先以中锋浓墨勾出近景坡石轮廓，用笔要有顿挫。",
        draw(ctx) {
          inkStroke(ctx, [[60, 520], [150, 495], [250, 505], [320, 522], [380, 540]], 3.4, 0.9);
          inkStroke(ctx, [[110, 520], [170, 508], [230, 514]], 2.2, 0.75);
          inkStroke(ctx, [[60, 555], [180, 542], [300, 552], [400, 568]], 2.6, 0.8);
        }
      },
      {
        tip: "第 2 步 · 画近景树：树干中锋两笔，出枝一波三折（鹿角式），介字点点叶。两树一高一低、一浓一淡。",
        draw(ctx) {
          // 主树
          inkStroke(ctx, [[180, 512], [176, 460], [182, 400], [178, 360]], 4, 0.9);
          inkStroke(ctx, [[180, 430], [206, 408], [226, 400]], 2.2, 0.85);
          inkStroke(ctx, [[179, 400], [156, 380], [140, 374]], 2.2, 0.85);
          inkStroke(ctx, [[178, 372], [196, 352], [212, 346]], 2, 0.8);
          // 介字点叶
          ctx.save(); ctx.strokeStyle = "#1a1e24"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
          for (let i = 0; i < 46; i++) {
            const a = Math.random() * Math.PI * 2, rr = Math.random() * 55;
            const x = 182 + Math.cos(a) * rr * 1.1, y = 372 + Math.sin(a) * rr * 0.75 - 8;
            ctx.globalAlpha = 0.35 + Math.random() * 0.45;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 9); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y + 9); ctx.stroke();
          }
          ctx.restore();
          // 客树（淡）
          inkStroke(ctx, [[248, 512], [252, 462], [246, 424]], 3, 0.55);
          ctx.save(); ctx.fillStyle = "#1a1e24";
          for (let i = 0; i < 30; i++) {
            const a = Math.random() * Math.PI * 2, rr = Math.random() * 34;
            ctx.globalAlpha = 0.2 + Math.random() * 0.3;
            ctx.beginPath();
            ctx.ellipse(248 + Math.cos(a) * rr, 420 + Math.sin(a) * rr * 0.7, 4, 2.2, a, 0, 7);
            ctx.fill();
          }
          ctx.restore();
        }
      },
      {
        tip: "第 3 步 · 勾主山、皴石纹：重墨中锋勾中景主山轮廓（主峰居中偏左，宾主分明），再以披麻皴顺山势皴出纹理，亮面留白。",
        draw(ctx) {
          inkStroke(ctx, [[300, 460], [370, 330], [430, 250], [500, 210], [560, 260], [620, 340], [680, 430]], 3, 0.85);
          inkStroke(ctx, [[380, 460], [430, 380], [478, 330], [520, 350], [560, 420]], 2.2, 0.7);
          // 披麻皴
          ctx.save(); ctx.strokeStyle = "#1a1e24"; ctx.lineWidth = 1.3;
          for (let i = 0; i < 60; i++) {
            const sx = 380 + Math.random() * 230, sy = 260 + Math.random() * 130;
            if (sy < 210 + Math.abs(sx - 500) * 0.8) continue;
            ctx.globalAlpha = 0.15 + Math.random() * 0.3;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx - 6 + Math.random() * 6, sy + 40, sx - 14 + Math.random() * 10, sy + 75 + Math.random() * 25);
            ctx.stroke();
          }
          ctx.restore();
        }
      },
      {
        tip: "第 4 步 · 淡墨远山与水纹：清淡的墨一笔画出远山（远山无皴），水面大片留白，只在岸脚添两三条水纹。山脚虚掉，白处即云气。",
        draw(ctx) {
          ctx.save();
          ctx.fillStyle = "rgba(40,55,70,.22)";
          ctx.beginPath();
          ctx.moveTo(560, 210);
          ctx.quadraticCurveTo(640, 120, 720, 150);
          ctx.quadraticCurveTo(790, 175, 850, 205);
          ctx.lineTo(850, 225); ctx.quadraticCurveTo(700, 235, 560, 222);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = "rgba(40,55,70,.13)";
          ctx.beginPath();
          ctx.moveTo(620, 190); ctx.quadraticCurveTo(700, 130, 780, 160);
          ctx.quadraticCurveTo(830, 180, 860, 195); ctx.lineTo(860, 210);
          ctx.quadraticCurveTo(740, 215, 620, 205); ctx.closePath(); ctx.fill();
          ctx.restore();
          inkStroke(ctx, [[430, 585], [520, 580], [610, 584]], 1.4, 0.3);
          inkStroke(ctx, [[480, 598], [560, 594], [640, 598]], 1.4, 0.22);
        }
      },
      {
        tip: "第 5 步 · 点苔点景：焦墨在山头石隙点苔提神；水面添一叶小舟作点景画眼。最后检查虚实：密处够密，疏处敢空。",
        draw(ctx) {
          ctx.save(); ctx.fillStyle = "rgba(8,10,12,.9)";
          [[430, 254], [452, 240], [500, 214], [520, 222], [370, 335], [396, 310], [160, 496], [214, 502], [300, 512]].forEach(p => {
            ctx.beginPath();
            ctx.ellipse(p[0], p[1], 3.4, 2, 0.5, 0, 7);
            ctx.fill();
          });
          ctx.restore();
          // 小舟
          inkStroke(ctx, [[690, 560], [710, 566], [736, 559]], 2, 0.8);
          inkStroke(ctx, [[712, 560], [712, 540]], 1.6, 0.8);
          inkStroke(ctx, [[712, 542], [702, 552]], 1.4, 0.8);
        }
      }
    ]
  };

  /* --- 竹枝 --- */
  DEMOS.bamboo = {
    name: "墨竹一枝",
    tool: "brush",
    steps: [
      {
        tip: "第 1 步 · 画竿：中锋自下而上，一节一顿——每节之间留一点空隙，节间下短上长。竿要挺中带弹，不可笔直如尺。",
        draw(ctx) {
          const segs = [[470, 560, 462, 470], [461, 458, 452, 360], [451, 348, 446, 250], [446, 238, 444, 150]];
          segs.forEach(s => inkStroke(ctx, [[s[0], s[1]], [(s[0] + s[2]) / 2 - 3, (s[1] + s[3]) / 2], [s[2], s[3]]], 9, 0.75));
        }
      },
      {
        tip: "第 2 步 · 点节：浓墨在每节之间写「乙」字或「八」字形节，笔断意连。节是竹的骨气所在。",
        draw(ctx) {
          [[461, 464], [451, 354], [445, 244]].forEach(p => {
            inkStroke(ctx, [[p[0] - 8, p[1] + 2], [p[0], p[1] - 3], [p[0] + 9, p[1] + 1]], 3, 0.95);
          });
        }
      },
      {
        tip: "第 3 步 · 出细枝：从节处出枝，如鹊爪，一波三折。枝从节生，不可从节间凭空长出。",
        draw(ctx) {
          inkStroke(ctx, [[451, 354], [500, 320], [548, 300]], 2.4, 0.85);
          inkStroke(ctx, [[520, 308], [560, 285]], 1.8, 0.8);
          inkStroke(ctx, [[445, 244], [392, 210], [352, 196]], 2.4, 0.85);
          inkStroke(ctx, [[410, 216], [380, 190]], 1.8, 0.8);
          inkStroke(ctx, [[444, 150], [470, 110], [500, 88]], 2.4, 0.85);
        }
      },
      {
        tip: "第 4 步 · 撇叶：叶如「个」字「介」字组合，起笔按、行笔快、收笔尖——一笔撇出，忌描。叶叶交叠，浓淡相破。",
        draw(ctx) {
          function leaf(x, y, ang, len, alpha) {
            ctx.save();
            ctx.translate(x, y); ctx.rotate(ang);
            ctx.fillStyle = "rgba(15,20,26," + alpha + ")";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(len * 0.4, -len * 0.09, len, 0);
            ctx.quadraticCurveTo(len * 0.4, len * 0.11, 0, 0);
            ctx.fill();
            ctx.restore();
          }
          // 每处枝梢一组「个/介」字叶
          const groups = [
            [548, 300], [560, 285], [352, 196], [380, 190], [500, 88], [470, 110]
          ];
          groups.forEach((g, gi) => {
            const n = 3 + (gi % 2);
            for (let i = 0; i < n; i++) {
              const ang = 0.5 + (i - n / 2) * 0.5 + (Math.random() - 0.5) * 0.25 + (g[0] < 450 ? 1.9 : 0);
              leaf(g[0], g[1], ang, 55 + Math.random() * 30, 0.55 + Math.random() * 0.35);
            }
          });
        }
      },
      {
        tip: "第 5 步 · 补淡叶与题款：淡墨在浓叶后补几笔远叶（淡破浓），最后留白处可题款钤印。竹之精神，全在疏密浓淡之间。",
        draw(ctx) {
          function leaf(x, y, ang, len, alpha) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
            ctx.fillStyle = "rgba(40,55,70," + alpha + ")";
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(len * 0.4, -len * 0.09, len, 0);
            ctx.quadraticCurveTo(len * 0.4, len * 0.11, 0, 0);
            ctx.fill(); ctx.restore();
          }
          [[540, 310], [370, 205], [488, 100], [560, 292]].forEach(g => {
            for (let i = 0; i < 3; i++) {
              leaf(g[0] + 8, g[1] + 6, 0.7 + i * 0.5 + (g[0] < 450 ? 1.8 : 0), 45 + Math.random() * 22, 0.22);
            }
          });
          // 印章
          ctx.save();
          ctx.fillStyle = "rgba(178,60,40,.85)";
          ctx.fillRect(150, 120, 30, 30);
          ctx.fillStyle = "#fff";
          ctx.font = "13px serif"; ctx.textAlign = "center";
          ctx.fillText("习", 165, 133); ctx.fillText("竹", 165, 146);
          ctx.restore();
        }
      }
    ]
  };

  /* ---------- 示范运行时 ---------- */
  const demoState = { key: null, step: 0 };
  const guideEl = document.getElementById("demo-guide");
  const titleEl = document.getElementById("demo-title");
  const tipEl = document.getElementById("demo-tip");
  const stepLabelEl = document.getElementById("demo-step-label");

  function renderGhost() {
    const demo = DEMOS[demoState.key];
    if (!demo) return;
    Board.clearGhost();
    const ctx = Board.ghostCtx;
    for (let i = 0; i <= demoState.step; i++) demo.steps[i].draw(ctx);
    titleEl.textContent = "示范 · " + demo.name;
    tipEl.textContent = demo.steps[demoState.step].tip;
    stepLabelEl.textContent = (demoState.step + 1) + " / " + demo.steps.length;
    document.getElementById("demo-prev").disabled = demoState.step === 0;
    document.getElementById("demo-next").disabled = demoState.step === demo.steps.length - 1;
  }

  window.startDemo = function (key) {
    if (!DEMOS[key]) return;
    demoState.key = key; demoState.step = 0;
    guideEl.hidden = false;
    document.querySelectorAll(".demo-item").forEach(el =>
      el.classList.toggle("active", el.dataset.demo === key));
    Board.setTool(DEMOS[key].tool);
    renderGhost();
  };

  document.getElementById("demo-prev").addEventListener("click", () => {
    if (demoState.step > 0) { demoState.step--; renderGhost(); }
  });
  document.getElementById("demo-next").addEventListener("click", () => {
    const demo = DEMOS[demoState.key];
    if (demo && demoState.step < demo.steps.length - 1) { demoState.step++; renderGhost(); }
  });
  document.getElementById("demo-exit").addEventListener("click", () => {
    demoState.key = null;
    guideEl.hidden = true;
    Board.clearGhost();
    document.querySelectorAll(".demo-item").forEach(el => el.classList.remove("active"));
  });

  // 生成左侧示范列表（带缩略图）
  const listEl = document.getElementById("demo-list");
  Object.keys(DEMOS).forEach(key => {
    const demo = DEMOS[key];
    const item = document.createElement("div");
    item.className = "demo-item";
    item.dataset.demo = key;
    const thumb = document.createElement("canvas");
    thumb.width = 132; thumb.height = 102;
    const span = document.createElement("span");
    span.textContent = demo.name;
    item.appendChild(thumb); item.appendChild(span);
    item.addEventListener("click", () => window.startDemo(key));
    listEl.appendChild(item);
    // 画缩略图：全部步骤缩放绘制
    const tctx = thumb.getContext("2d");
    tctx.fillStyle = "#fff"; tctx.fillRect(0, 0, 132, 102);
    tctx.save();
    tctx.scale(132 / W, 102 / H);
    demo.steps.forEach(s => s.draw(tctx));
    tctx.restore();
  });

  window.DEMOS = DEMOS;
})();
