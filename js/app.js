/* ===== 主控：导航 + 课程渲染 ===== */
(function () {
  /* ---------- 视图切换 ---------- */
  function showView(name) {
    document.querySelectorAll(".view").forEach(v =>
      v.classList.toggle("active", v.id === "view-" + name));
    document.querySelectorAll(".nav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.view === name));
    window.scrollTo({ top: 0 });
    // 渲染当前视图中的插图
    requestAnimationFrame(() => window.renderIllustrations());
  }
  window.showView = showView;

  document.getElementById("mainnav").addEventListener("click", e => {
    const btn = e.target.closest(".nav-btn");
    if (btn) showView(btn.dataset.view);
  });
  document.body.addEventListener("click", e => {
    const el = e.target.closest("[data-goto]");
    if (el) showView(el.dataset.goto);
  });

  /* ---------- 课程渲染 ---------- */
  const DEMO_NAMES = {
    lines: "排线基本功", sphere: "素描球体", cube: "两点透视立方体",
    mountain: "平远山水小品", bamboo: "墨竹一枝"
  };

  function setupCourse(lessons, listId, contentId) {
    const listEl = document.getElementById(listId);
    const contentEl = document.getElementById(contentId);
    let current = 0;

    function render(idx) {
      current = idx;
      const l = lessons[idx];
      listEl.querySelectorAll(".lesson-item").forEach((el, i) =>
        el.classList.toggle("active", i === idx));
      const demoBand = l.demo ? `
        <div class="try-demo-band">
          <p>🖌️ 本课配套练习：<strong>${DEMO_NAMES[l.demo] || "示范"}</strong> —— 到练习画板跟着底稿一步步临摹。</p>
          <button class="btn primary" data-demo-launch="${l.demo}">去画板练习</button>
        </div>` : "";
      const nav = `
        <div class="lesson-nav-bottom">
          <button class="btn ghost" ${idx === 0 ? "disabled" : ""} data-lesson-nav="-1">◀ 上一课</button>
          <button class="btn ghost" ${idx === lessons.length - 1 ? "disabled" : ""} data-lesson-nav="1">下一课 ▶</button>
        </div>`;
      contentEl.innerHTML = `<h2>${l.title}</h2><p class="lesson-sub">${l.sub}</p>${l.html}${demoBand}${nav}`;
      window.renderIllustrations(contentEl);
      contentEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    lessons.forEach((l, i) => {
      const item = document.createElement("div");
      item.className = "lesson-item";
      item.innerHTML = `${l.title}<small>${l.sub}</small>`;
      item.addEventListener("click", () => render(i));
      listEl.appendChild(item);
    });

    contentEl.addEventListener("click", e => {
      const nav = e.target.closest("[data-lesson-nav]");
      if (nav && !nav.disabled) { render(current + (+nav.dataset.lessonNav)); return; }
      const demo = e.target.closest("[data-demo-launch]");
      if (demo) {
        showView("board");
        window.startDemo(demo.dataset.demoLaunch);
      }
    });

    render(0);
  }

  setupCourse(window.SKETCH_LESSONS, "sketch-lessons", "sketch-content");
  setupCourse(window.SHANSHUI_LESSONS, "shanshui-lessons", "shanshui-content");

  /* ---------- 首页水墨画 ---------- */
  const hero = document.getElementById("hero-canvas");
  window.ILLU.hero(hero.getContext("2d"), hero.width, hero.height);

  /* ---------- 首页插图渲染 ---------- */
  window.renderIllustrations();
})();
