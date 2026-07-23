/* ===== 山水画课程数据 ===== */
window.SHANSHUI_LESSONS = [
{
  id: "m1",
  title: "第一课 · 文房与执笔",
  sub: "笔墨纸砚，工欲善其事",
  html: `
  <h3>认识文房四宝</h3>
  <ul>
    <li><strong>笔</strong>：山水画常备大中小三支。<strong>狼毫</strong>硬而弹，宜勾线、皴擦；<strong>羊毫</strong>软而蓄水，宜渲染、点苔；<strong>兼毫</strong>居中，初学首选。</li>
    <li><strong>墨</strong>：墨汁（一得阁等）方便，研墨更有层次。宿墨易脏，初学用新墨。</li>
    <li><strong>纸</strong>：<strong>生宣</strong>吸水洇墨，见笔见墨但难控制；<strong>熟宣</strong>不洇，宜工细；初学山水可用<strong>半生熟</strong>（如煮硾宣）过渡。</li>
    <li><strong>砚与水盂</strong>：调墨分浓淡。另备两只水盂，一洗笔、一取清水。</li>
  </ul>

  <h3>执笔五字法</h3>
  <p>古人执笔讲究「<strong>擫、押、钩、格、抵</strong>」五字：拇指、食指捏管，中指钩住，无名指与小指抵格。要领是<strong>指实掌虚</strong>——手指握实，掌心空虚能容一枚鸡蛋，运笔才灵活。</p>
  <ul>
    <li><strong>悬腕</strong>：手腕离纸，画中等笔画；<strong>悬肘</strong>：整条手臂悬空，画大画、长线。</li>
    <li>笔杆直立为<strong>中锋</strong>，笔杆倾斜、笔毫侧扫为<strong>侧锋</strong>。</li>
  </ul>

  <h3>中锋与侧锋</h3>
  <canvas class="illu" data-illu="bifa" width="640" height="220"></canvas>
  <p class="illu-caption">中锋线（圆劲）/ 侧锋线（毛涩）/ 逆锋（苍老）/ 拖笔（流畅）</p>
  <ul>
    <li><strong>中锋用笔</strong>：笔尖藏在笔画中央，线条圆浑厚重，如「锥画沙」。勾轮廓、画树干主枝多用中锋。</li>
    <li><strong>侧锋用笔</strong>：笔腹着纸，线条一边光一边毛，宜皴山石、扫坡面。</li>
    <li><strong>逆锋</strong>：逆着行笔方向推进，线条苍涩老辣，画老树枯藤。</li>
  </ul>
  <div class="tip">💡 每日练习：中锋画「永」字或画长横线、竖线、圆圈各二十遍，力求粗细均匀、笔笔送到。</div>
  `,
  demo: "bamboo"
},
{
  id: "m2",
  title: "第二课 · 墨分五色",
  sub: "以水调墨，一墨生万彩",
  html: `
  <h3>什么是墨分五色</h3>
  <p>中国画不靠颜色靠墨色。清水调墨，浓淡之间生出「<strong>焦、浓、重、淡、清</strong>」五个层次：</p>
  <canvas class="illu" data-illu="mose" width="640" height="200"></canvas>
  <p class="illu-caption">焦墨 → 浓墨 → 重墨 → 淡墨 → 清墨</p>
  <ol>
    <li><strong>焦墨</strong>：原墨不加水，乌黑发亮，用于最后提神点睛（点苔、醒线）。</li>
    <li><strong>浓墨</strong>：略加水，画近景轮廓、树干。</li>
    <li><strong>重墨</strong>：水墨各半，画中景山石。</li>
    <li><strong>淡墨</strong>：水多墨少，画远山、渲染。</li>
    <li><strong>清墨</strong>：几乎是清水微带墨意，罩染云气、天光水色。</li>
  </ol>

  <h3>用墨七法</h3>
  <ul>
    <li><strong>破墨法</strong>：前一遍墨未干时叠加另一浓度——浓破淡则苍润，淡破浓则空灵。山水画树石常用。</li>
    <li><strong>积墨法</strong>：干后层层叠加，愈积愈厚，黄宾虹山水的浑厚正来于此。</li>
    <li><strong>泼墨法</strong>：大笔饱蘸水墨挥洒，一气呵成，画云山雾景。</li>
    <li><strong>枯笔（渴笔）</strong>：笔中水少，扫出飞白，表现山石苍毛、老木枯枝。</li>
  </ul>

  <h3>水是墨的生命</h3>
  <p>初学者最该练的不是墨而是<strong>水</strong>：调一碟淡墨，在废宣纸上画渐变条——从浓到淡一笔过渡不断线；再练「笔根清水、笔尖蘸浓墨」的<strong>一笔分浓淡</strong>，一笔下去自带深浅，这是画远山、花瓣的核心技巧。</p>
  <div class="tip">💡 判断纸上墨色是否合适：宣纸干后墨色会变浅约两成，落笔时要比想要的效果略深一点。</div>
  `,
  demo: "mountain"
},
{
  id: "m3",
  title: "第三课 · 皴法详解",
  sub: "皴出山石的筋骨",
  html: `
  <h3>什么是皴法</h3>
  <p>「皴」原指皮肤皲裂的纹理。山水画中，先用中锋<strong>勾</strong>出山石轮廓，再用干笔在结构处画出纹理表现凹凸质感，就是<strong>皴</strong>。皴法是历代画家观察真山真水提炼出的程式语言。</p>

  <h3>三大类经典皴法</h3>
  <canvas class="illu" data-illu="cunfa" width="640" height="260"></canvas>
  <p class="illu-caption">披麻皴 / 斧劈皴 / 雨点皴 示意</p>
  <ul>
    <li><strong>披麻皴</strong>（董源、黄公望）：中锋长线如披散的麻缕，线条松柔略带弧度，表现<strong>江南土质山</strong>的圆缓浑厚。《富春山居图》即以长披麻为骨。</li>
    <li><strong>斧劈皴</strong>（李唐、马远）：侧锋横扫，如刀砍斧劈，棱角分明，表现<strong>北方石质山</strong>的坚硬峭拔。大斧劈阔大，小斧劈细碎。</li>
    <li><strong>雨点皴 / 豆瓣皴</strong>（范宽）：短促的中锋竖点密集攒聚，如雨打墙头，表现秦陇山石的苍厚，《溪山行旅图》是典范。</li>
    <li>其他常见：<strong>荷叶皴</strong>（赵孟頫，脉络如荷叶筋）、<strong>折带皴</strong>（倪瓒，横拖后折笔下按，画太湖石坡）、<strong>牛毛皴</strong>（王蒙，细密如牛毛）。</li>
  </ul>

  <h3>画山石口诀：石分三面</h3>
  <ol>
    <li><strong>勾</strong>：中锋勾出轮廓，用笔要有顿挫方折，一块石头至少表现出顶面与左右两个侧面——「石分三面」方有体积。</li>
    <li><strong>皴</strong>：在暗面、结构转折处皴擦，亮面留白。皴笔要"毛"，忌光滑。</li>
    <li><strong>擦</strong>：极干的笔侧锋轻擦，模糊皴笔痕迹，使石面浑然。</li>
    <li><strong>染</strong>：淡墨湿笔渲染暗部，加强整体。</li>
    <li><strong>点</strong>：焦墨点苔，如石上生草木，最提精神。</li>
  </ol>
  <div class="tip">💡 <strong>勾皴擦染点</strong>五字就是画山石的全流程。大石间小石，小石垒大山——石块要有大小相间、聚散呼应。</div>
  `,
  demo: "mountain"
},
{
  id: "m4",
  title: "第四课 · 树法与点景",
  sub: "树是山之衣",
  html: `
  <h3>画树四步：干、枝、叶、根</h3>
  <ol>
    <li><strong>树干</strong>：中锋自上而下（或自下而上）两笔画出，左右两条线不平行——「树无寸直」，要有曲折粗细变化。双钩画干后略皴树皮纹理。</li>
    <li><strong>出枝</strong>：古法有「<strong>鹿角</strong>」（枝向上挺，如鹿角，画秋冬寒林）与「<strong>蟹爪</strong>」（枝向下屈，如蟹爪，画枯树霜木）两大类。出枝要「一波三折」，忌对称如鱼骨。</li>
    <li><strong>树叶</strong>：分<strong>点叶</strong>与<strong>夹叶</strong>。点叶用笔直接点出——介字点、个字点、混点、胡椒点；夹叶双钩轮廓后可填色。一树一种点法，数树相邻则点法相异，浓淡相间。</li>
    <li><strong>树根</strong>：露根显苍老，土坡处以短线交代根脚，切忌树干如插在纸上。</li>
  </ol>
  <canvas class="illu" data-illu="shufa" width="640" height="260"></canvas>
  <p class="illu-caption">鹿角枝 / 蟹爪枝 / 介字点 / 个字点</p>

  <h3>丛树的穿插</h3>
  <ul>
    <li>两树相交，一俯一仰、一浓一淡、一高一低，谓之「二株分形」。</li>
    <li>三树以上，主树居中挺立，客树左右揖让，忌等高等距如电线杆。</li>
    <li>近树画叶清晰，远树只点树形，再远只剩横点——「远树无枝，远山无皴」。</li>
  </ul>

  <h3>点景：亭台、舟桥、人物</h3>
  <p>山水中的小亭、渔舟、板桥、行人称为<strong>点景</strong>，寥寥数笔却是画眼所在。点景宜简不宜繁，用笔要与全画一致；人物只勾衣势不画五官，所谓「远人无目」。点景位置常在开阔处、水口边、山径尽头，引导观者「可行、可望、可游、可居」。</p>
  <div class="tip">💡 练习：临摹《芥子园画谱》树谱一页。先练单株鹿角枝，再练三株穿插。</div>
  `,
  demo: "bamboo"
},
{
  id: "m5",
  title: "第五课 · 云水与留白",
  sub: "计白当黑，虚实相生",
  html: `
  <h3>留白是中国画的呼吸</h3>
  <p>西画以颜料画云画水，中国画常常<strong>以不画为画</strong>——纸上的空白既是云、是水、是天光，也是气的流动。所谓「<strong>计白当黑</strong>」，空白处要像笔墨一样经营。</p>

  <h3>云的两种画法</h3>
  <ul>
    <li><strong>留白法（挤云）</strong>：不画云本身，而是画云周围的山——山脚虚掉、山腰断开，白处自然成云。要点是云的边缘忌整齐，要有大小、聚散。</li>
    <li><strong>勾云法</strong>：淡墨中锋以流畅的弧线勾出云头卷曲之势，如行云流水，多用于工细青绿山水。</li>
    <li><strong>染云法</strong>：清墨湿笔在云的暗面轻染，趁湿以清水笔晕开，云更显厚度。</li>
  </ul>

  <h3>水的表现</h3>
  <ul>
    <li><strong>静水</strong>：大片留白，只在岸脚、石根画几条极淡的横线水纹。</li>
    <li><strong>流水 / 溪涧</strong>：顺流势用中锋画「之」字形水纹，石阻处水纹分开再合。</li>
    <li><strong>瀑布</strong>：两侧山石重皴压暗，中间留出白练，顶部水口画几笔分水线，底部以「乱柴」笔意画溅花，白处愈白靠黑处愈黑。</li>
  </ul>

  <h3>虚实经营的法则</h3>
  <ul>
    <li><strong>密不透风，疏可走马</strong>：密处笔墨扎实，疏处大胆放空。</li>
    <li>全画至少留一处「气眼」，让画面透气。</li>
    <li>虚不是空：远山虽淡，形要交代；云虽白，边缘要有笔意。</li>
  </ul>
  <div class="tip">💡 检查留白：将画倒过来看，如果空白的形状本身好看（有大小、有节奏），留白就成功了。</div>
  `,
  demo: "mountain"
},
{
  id: "m6",
  title: "第六课 · 三远构图与完整创作",
  sub: "咫尺之内，见千里之遥",
  html: `
  <h3>郭熙「三远法」</h3>
  <canvas class="illu" data-illu="sanyuan" width="640" height="240"></canvas>
  <p class="illu-caption">高远 / 深远 / 平远 示意</p>
  <ul>
    <li><strong>高远</strong>：自山下仰望山巅，主峰高耸、气势逼人。构图纵向，主峰占画面三分之二，如范宽《溪山行旅图》。</li>
    <li><strong>深远</strong>：自山前窥山后，层峦叠嶂、曲径通幽。靠云气与山体的遮挡推出纵深。</li>
    <li><strong>平远</strong>：自近山望远山，冲淡平和、意境旷远。近坡、中水、远山三段式，如倪瓒「一河两岸」。</li>
  </ul>

  <h3>经营位置的要诀</h3>
  <ul>
    <li><strong>宾主</strong>：一幅画只有一个主峰（主体），余山皆宾，宾不夺主。</li>
    <li><strong>开合</strong>：起手一开（近景坡石树木），中段一合（主山），远景再开（远山余脉）。有开有合，气脉才通。</li>
    <li><strong>龙脉</strong>：山势要有连贯的走向，如龙蜿蜒，忌东一块西一块。</li>
    <li><strong>之字形</strong>：山径、河流按「之」字迂回，引导视线深入。</li>
  </ul>

  <h3>一幅平远小品的完整步骤</h3>
  <ol>
    <li><strong>立意</strong>：先想好画什么境——秋江远岫？溪山访友？意在笔先。</li>
    <li><strong>布局</strong>：淡墨轻定近坡、中景主山、远山三段位置，留出水面与天空。</li>
    <li><strong>勾</strong>：浓墨中锋勾近景树石、坡岸，重墨勾主山轮廓。</li>
    <li><strong>皴擦</strong>：披麻皴皴出山石纹理，干笔擦出苍润。</li>
    <li><strong>点叶点苔</strong>：画近景树叶，山头、石隙点苔。</li>
    <li><strong>染</strong>：淡墨染山石暗面，清墨染远山（一笔带过，趁湿让它自然洇开）。</li>
    <li><strong>点景题款</strong>：水口置一小舟或岸边小亭；干后以焦墨提点精神；最后题款钤印——款字位置也是构图的一部分。</li>
  </ol>
  <div class="tip">💡 完成本课后，到<strong>「练习画板」</strong>选择「远山平远」示范逐步临摹，或在<strong>「上传解析」</strong>上传一幅山水名作，用「水墨画法」模式查看它的分步解析。</div>
  `,
  demo: "mountain"
}
];
