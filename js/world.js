/* 世界：场景 + 人物 + 水 */
window.WORLD = (function () {
  'use strict';
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const W = 1600, H = 900;

  const C = {
    ink: '#010202',
    wall: '#0C1412',
    wall2: '#101B18',
    bone: '226,232,224',
    cold: '156,208,190',
    warm: '255,199,136',
    water: '8,40,38',
    waterHi: '120,200,180'
  };

  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rgba = (c, a) => 'rgba(' + c + ',' + a + ')';

  function bg(t, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c1 || '#070C0A');
    g.addColorStop(1, c2 || '#030605');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function haze(cx, cy, r, col, a) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgba(col, a));
    g.addColorStop(0.45, rgba(col, a * 0.3));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  /* ---------------- 人物 ---------------- */
  function person(x, footY, h, o) {
    const p = o || {};
    const crouch = clamp(p.crouch || 0);
    const kneel = clamp(p.kneel || 0);
    const arms = clamp(p.arms || 0);
    const lean = (p.lean || 0) * h * 0.05;
    const headDown = clamp(p.headDown || 0);
    const col = p.color || C.ink;
    const alpha = p.alpha === undefined ? 1 : p.alpha;

    let hipH = 0.47;
    hipH = hipH - crouch * 0.17 - kneel * 0.13;
    const hipY = footY - h * hipH;
    const shY = hipY - h * (0.30 - 0.02 * crouch);
    const headR = h * 0.068;
    const headY = shY - h * 0.06 - headDown * h * 0.03;
    const nx = x + lean;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 腿
    const sw = h * (0.058 + 0.015 * (1 - crouch));
    const swing = p.walk ? Math.sin(p.walk * Math.PI * 2) * h * 0.06 : 0;
    ctx.lineWidth = h * 0.095;
    if (kneel > 0.05) {
      ctx.beginPath();
      ctx.moveTo(x - sw * 0.4, hipY);
      ctx.lineTo(x + h * 0.06, footY - h * 0.02);
      ctx.lineTo(x - h * 0.05, footY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + sw * 0.4, hipY);
      ctx.lineTo(x + h * 0.02, footY - h * 0.01);
      ctx.lineTo(x + h * 0.09, footY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - sw * 0.5, hipY);
      ctx.quadraticCurveTo(x - sw * 0.9 - swing, (hipY + footY) / 2, x - sw - swing, footY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + sw * 0.5, hipY);
      ctx.quadraticCurveTo(x + sw * 0.9 + swing, (hipY + footY) / 2, x + sw + swing, footY);
      ctx.stroke();
    }

    // 躯干
    ctx.lineWidth = h * 0.225;
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(nx, shY);
    ctx.stroke();

    // 肩
    ctx.lineWidth = h * 0.195;
    ctx.beginPath();
    ctx.moveTo(nx - h * 0.072, shY + h * 0.01);
    ctx.lineTo(nx + h * 0.072, shY + h * 0.01);
    ctx.stroke();

    // 手臂
    ctx.lineWidth = h * 0.068;
    const handX = h * (0.10 + 0.18 * arms);
    const handY = shY + h * (0.30 - 0.10 * arms);
    ctx.beginPath();
    ctx.moveTo(nx - h * 0.068, shY);
    ctx.quadraticCurveTo(nx - handX * 0.9, shY + h * 0.15, nx - handX, handY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(nx + h * 0.068, shY);
    ctx.quadraticCurveTo(nx + handX * 0.9, shY + h * 0.15, nx + handX, handY);
    ctx.stroke();

    // 头
    ctx.beginPath();
    ctx.ellipse(nx, headY - headR * 0.5, headR * 0.9, headR, 0.06, 0, Math.PI * 2);
    ctx.fill();

    // 颈
    ctx.lineWidth = headR * 0.6;
    ctx.beginPath();
    ctx.moveTo(nx, headY + headR * 0.35);
    ctx.lineTo(nx, shY);
    ctx.stroke();

    ctx.restore();
    return { head: [nx, headY], sh: [nx, shY], hip: [x, hipY], foot: footY };
  }

  /* 轮廓光：让剪影在暗背景里能被看见 */
  function rim(x, footY, h, o) {
    const p = o || {};
    const crouch = clamp(p.crouch || 0);
    const hipY = footY - h * (0.47 - crouch * 0.17);
    const shY = hipY - h * 0.30;
    ctx.save();
    ctx.strokeStyle = rgba('200,240,225', 0.5);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + h * 0.075, shY + h * 0.02);
    ctx.quadraticCurveTo(x + h * 0.09, hipY - h * 0.04, x + h * 0.055, hipY + h * 0.02);
    ctx.stroke();
    // 头顶边
    ctx.strokeStyle = rgba('200,240,225', 0.42);
    ctx.beginPath();
    ctx.arc(x, shY - h * 0.06 - h * 0.058 * 0.5, h * 0.058, -1.2, 0.9);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------- 场景 ---------------- */
  function bedroom(t, lv) {
    bg('#070D0B', '#030605');
    // 墙
    ctx.fillStyle = '#16261F';
    ctx.fillRect(0, 0, W, H * 0.70);

    // 窗（右上）
    const wx = W * 0.62, wy = H * 0.14, ww = W * 0.20, wh = H * 0.40;
    const wg = ctx.createLinearGradient(wx, wy, wx, wy + wh);
    wg.addColorStop(0, rgba(C.cold, 0.75));
    wg.addColorStop(1, rgba(C.cold, 0.25));
    ctx.fillStyle = wg;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#0A1210';
    ctx.fillRect(wx + ww * 0.48, wy, 5, wh);
    ctx.fillRect(wx, wy + wh * 0.46, ww, 5);
    haze(wx + ww / 2, wy + wh / 2, W * 0.30, C.cold, 0.10);

    // 窗光落在地上
    const lg = ctx.createLinearGradient(0, H * 0.70, 0, H);
    lg.addColorStop(0, rgba(C.cold, 0.10));
    lg.addColorStop(1, rgba(C.cold, 0));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(wx, H * 0.70);
    ctx.lineTo(wx + ww, H * 0.70);
    ctx.lineTo(wx + ww * 1.4, H);
    ctx.lineTo(wx - ww * 0.5, H);
    ctx.closePath();
    ctx.fill();

    // 床（左侧）
    ctx.fillStyle = '#080F0D';
    ctx.fillRect(0, H * 0.66, W * 0.34, H * 0.34);
    ctx.fillRect(0, H * 0.64, W * 0.34, H * 0.02);
    // 被子
    ctx.fillStyle = '#0E1815';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.70);
    ctx.quadraticCurveTo(W * 0.10, H * 0.66, W * 0.20, H * 0.72);
    ctx.lineTo(W * 0.20, H * 0.80);
    ctx.lineTo(0, H * 0.80);
    ctx.closePath();
    ctx.fill();

    // 门（左下角，水从这里进来）
    ctx.fillStyle = '#050A09';
    ctx.fillRect(W * 0.34, H * 0.30, W * 0.10, H * 0.40);
    ctx.fillStyle = rgba(C.warm, 0.10);
    ctx.fillRect(W * 0.34, H * 0.30, 4, H * 0.40);

    // 地板线
    ctx.strokeStyle = rgba(C.cold, 0.05);
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = H * 0.70 + i * H * 0.06;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function street(t, lv) {
    bg('#060B09', '#020403');
    const HOR = H * 0.62;

    // 建筑
    const blocks = [[0.00, 0.26, 0.16, 0.36], [0.18, 0.18, 0.12, 0.44], [0.32, 0.30, 0.14, 0.32],
      [0.48, 0.22, 0.13, 0.40], [0.63, 0.14, 0.18, 0.48], [0.83, 0.26, 0.17, 0.36]];
    blocks.forEach(([x, y, w, h]) => {
      ctx.fillStyle = '#101D19';
      ctx.fillRect(W * x, HOR - H * (y + h), W * w, H * h);
    });
    // 窗
    for (let i = 0; i < 70; i++) {
      if (rnd(i * 9.1) > 0.76) {
        ctx.fillStyle = rgba(C.warm, 0.05 + rnd(i) * 0.14);
        ctx.fillRect(rnd(i * 2.7) * W, HOR - rnd(i * 5.3) * H * 0.34, 3, 4);
      }
    }

    // 远处的窗光
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = rgba(C.warm, 0.08 + rnd(i * 3.3) * 0.16);
      ctx.fillRect(W * rnd(i * 2.9), HOR - H * (0.12 + rnd(i * 4.4) * 0.34), 4, 5);
    }
    // 路灯
    const LX = W * 0.74, LY = HOR - H * 0.34;
    ctx.strokeStyle = '#050908';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(LX, LY); ctx.lineTo(LX, HOR + 10); ctx.stroke();
    haze(LX, LY, W * 0.24, C.warm, 0.55);

    // 地面
    ctx.fillStyle = '#07100C';
    ctx.fillRect(0, HOR, W, H - HOR);

    // 行人（脚是干的，各自走路）
    const walkers = [
      { x: 0.18, s: 0.16, ph: 0.2 },
      { x: 0.36, s: 0.14, ph: 0.6 },
      { x: 0.86, s: 0.15, ph: 0.4 },
      { x: 0.62, s: 0.12, ph: 0.8 }
    ];
    // 行人改到水面之上绘制
  }

  function elevator(t, lv) {
    bg('#070C0A', '#020403');
    // 轿厢
    const lx = W * 0.20, ly = H * 0.08, lw = W * 0.60, lh = H * 0.84;
    const g = ctx.createLinearGradient(lx, ly, lx, ly + lh);
    g.addColorStop(0, '#182722');
    g.addColorStop(1, '#0B1411');
    ctx.fillStyle = g;
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = rgba(C.cold, 0.14);
    ctx.lineWidth = 3;
    ctx.strokeRect(lx, ly, lw, lh);

    // 顶灯
    haze(lx + lw / 2, ly + h0(0.06), W * 0.26, '220,235,225', 0.16);
    function h0(k) { return lh * k; }

    // 楼层数字
    const n = 1 + Math.floor(t / 3.1) % 12;
    ctx.font = '600 ' + (H * 0.05) + 'px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(C.warm, 0.75);
    ctx.fillText(String(n), lx + lw / 2, ly + lh * 0.10);

    // 四个人（他站中间）
    // 其他人画在水面之上（见 draw 里的 standers）
  }

  function busstop(t, lv) {
    bg('#060B09', '#020403');
    const HOR = H * 0.60;
    ctx.fillStyle = '#040807';
    ctx.fillRect(0, HOR, W, H - HOR);

    // 站牌
    const sx = W * 0.66, sy = H * 0.30, sw = W * 0.16, sh = H * 0.34;
    ctx.fillStyle = '#0A1210';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = rgba(C.cold, 0.18);
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, sw, sh);
    // 寻人启事
    ctx.fillStyle = 'rgba(210,210,200,.10)';
    ctx.fillRect(sx + sw * 0.18, sy + sh * 0.16, sw * 0.64, sh * 0.44);
    // 一个模糊的人形
    ctx.fillStyle = 'rgba(210,210,200,.13)';
    ctx.beginPath();
    ctx.ellipse(sx + sw * 0.5, sy + sh * 0.28, sw * 0.08, sh * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(sx + sw * 0.40, sy + sh * 0.36, sw * 0.20, sh * 0.22);
    // 杆
    ctx.strokeStyle = '#050908';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(sx + sw * 0.08, sy + sh); ctx.lineTo(sx + sw * 0.08, HOR + 20); ctx.stroke();

    haze(sx + sw * 0.5, sy + sh * 0.5, W * 0.20, C.cold, 0.06);

    // 远景
    ctx.fillStyle = '#050A08';
    for (let i = 0; i < 6; i++) {
      const w = W * (0.08 + rnd(i) * 0.10);
      const h = H * (0.14 + rnd(i * 3) * 0.24);
      ctx.fillRect(W * (i * 0.17), HOR - h, w, h);
    }
  }

  function stairs(t, lv) {
    bg('#070C0A', '#020403');
    // 楼梯：一阶阶往上
    for (let i = 0; i < 9; i++) {
      const y = H * (0.16 + i * 0.085);
      const w = W * (0.26 + i * 0.035);
      ctx.fillStyle = i % 2 ? '#14231D' : '#0E1A16';
      ctx.fillRect(W * 0.5 - w / 2, y, w, H * 0.085);
      ctx.strokeStyle = rgba(C.cold, 0.08);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(W * 0.5 - w / 2, y); ctx.lineTo(W * 0.5 + w / 2, y); ctx.stroke();
    }
    // 小窗
    const wx = W * 0.78, wy = H * 0.18, ww = W * 0.09, wh = H * 0.20;
    const wg = ctx.createLinearGradient(wx, wy, wx, wy + wh);
    wg.addColorStop(0, rgba(C.cold, 0.55));
    wg.addColorStop(1, rgba(C.cold, 0.12));
    ctx.fillStyle = wg;
    ctx.fillRect(wx, wy, ww, wh);
    haze(wx + ww / 2, wy + wh / 2, W * 0.22, C.cold, 0.10);
  }

  function underwater(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0A1E1C');
    g.addColorStop(0.45, '#061312');
    g.addColorStop(1, '#020706');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 上方水面的光
    const k = smooth(clamp((t - 240) / 55));
    haze(W * 0.5, H * 0.06, W * (0.5 + k * 0.6), '190,235,220', 0.10 + k * 0.35);

    // 光柱（斜的）
    for (let i = 0; i < 5; i++) {
      const x = W * (0.22 + i * 0.14);
      const g2 = ctx.createLinearGradient(x, 0, x - W * 0.06, H);
      g2.addColorStop(0, rgba('200,240,225', 0.06 + k * 0.10));
      g2.addColorStop(1, rgba('200,240,225', 0));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.moveTo(x - W * 0.02, 0);
      ctx.lineTo(x + W * 0.02, 0);
      ctx.lineTo(x + W * 0.06, H);
      ctx.lineTo(x - W * 0.10, H);
      ctx.closePath();
      ctx.fill();
    }

    // 悬浮颗粒
    for (let i = 0; i < 120; i++) {
      const x = rnd(i * 3.1) * W;
      const y = ((rnd(i * 7.7) + t * 0.006) % 1) * H;
      ctx.fillStyle = rgba('180,230,210', 0.05 + rnd(i) * 0.16);
      ctx.beginPath(); ctx.arc(x, y, 0.6 + rnd(i * 2.2) * 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ---------------- 水 ---------------- */
  function waterSurface(t, wy, level, alpha) {
    // 水面亮线
    const g = ctx.createLinearGradient(0, wy - 26, 0, wy + 10);
    g.addColorStop(0, rgba(C.waterHi, 0));
    g.addColorStop(0.55, rgba(C.waterHi, 0.30 * alpha));
    g.addColorStop(1, rgba('210,250,235', 0.62 * alpha));
    ctx.fillStyle = g;
    ctx.fillRect(0, wy - 26, W, 36);

    // 波纹（三层，相位不同）
    for (let k = 0; k < 3; k++) {
      const yy = wy + k * 5;
      ctx.strokeStyle = rgba('190,245,225', (0.55 - k * 0.13) * alpha);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = yy + Math.sin(x * 0.008 + t * 1.6 + k) * (2.4 - k * 0.5)
          + Math.sin(x * 0.021 + t * 2.7 + k * 2) * 1.3;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }

    // 水面碎光
    for (let i = 0; i < 60; i++) {
      const x = rnd(i * 4.4) * W;
      const ph = (t * 0.6 + rnd(i)) % 1;
      if (ph > 0.35) continue;
      const y = wy + (rnd(i * 2.2) - 0.3) * 8;
      ctx.fillStyle = rgba(C.bone, (0.20 + rnd(i) * 0.5) * (1 - ph / 0.35) * alpha);
      ctx.fillRect(x, y, 3 + rnd(i * 3.3) * 12, 1.4);
    }
  }

  function waterBody(t, wy, level) {
    const g = ctx.createLinearGradient(0, wy, 0, H);
    g.addColorStop(0, rgba(C.water, 0.38));
    g.addColorStop(0.35, rgba(C.water, 0.62));
    g.addColorStop(1, rgba('2,12,11', 0.86));
    ctx.fillStyle = g;
    ctx.fillRect(0, wy, W, H - wy);

    // 水下折射的横向扰动
    for (let i = 0; i < 22; i++) {
      const y = wy + (i / 22) * (H - wy);
      ctx.strokeStyle = rgba(C.waterHi, 0.03 + rnd(i) * 0.03);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        const yy = y + Math.sin(x * 0.012 + t * 1.2 + i * 0.7) * (1.6 + i * 0.12);
        x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      }
      ctx.stroke();
    }

    // 气泡
    for (let i = 0; i < 26; i++) {
      const x = rnd(i * 5.5) * W;
      const ph = ((rnd(i * 3.3) + t * 0.10) % 1);
      const y = H - ph * (H - wy);
      const r = 1 + rnd(i * 2.1) * 3;
      ctx.strokeStyle = rgba('200,240,230', 0.10 + rnd(i) * 0.18);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    }
  }

  /* ---------------- 主绘制 ---------------- */
  function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const ph = phaseAt(t);
    const lv = clamp(waterLevel(t), 0, 2.2);

    // 场景
    if (ph.id === 'seep' || ph.id === 'ankle') bedroom(t, lv);
    else if (ph.id === 'knee') street(t, lv);
    else if (ph.id === 'waist') elevator(t, lv);
    else if (ph.id === 'chest') busstop(t, lv);
    else if (ph.id === 'neck') stairs(t, lv);
    else underwater(t);

    // 人物（每段都有）
    let py = H * 0.85, phh = H * 0.52;
    let pose = {};
    if (ph.id === 'seep') { py = H * 0.86; pose = { crouch: 0.0 }; }
    else if (ph.id === 'ankle') { py = H * 0.85; pose = { lean: 0.2 }; }
    else if (ph.id === 'knee') { py = H * 0.85; pose = { walk: t * 1.5 }; }
    else if (ph.id === 'waist') { py = H * 0.86; }
    else if (ph.id === 'chest') { py = H * 0.85; pose = { arms: 0.4, lean: 0.3 }; }
    else if (ph.id === 'neck') { py = H * 0.85; pose = { headDown: -0.6 }; }
    else { py = H * 0.80; pose = { arms: smooth(clamp((t - 200) / 60)) }; }

    if (ph.id === 'seep') {
      // 还躺在床上：用横躺的剪影
      ctx.save();
      ctx.translate(W * 0.16, H * 0.74);
      ctx.scale(1, 0.9);
      person(0, 0, H * 0.16, { crouch: 0.9, color: C.ink, alpha: 0.9 });
      ctx.restore();
    } else {
      person(W * 0.5, py, phh, Object.assign({ color: C.ink }, pose));
      rim(W * 0.5, py, phh, pose);
    }

    // 水
    if (lv > 0.01) {
      let wy = H * 0.88 - lv * H * 0.38;
      if (ph.id === 'under' || ph.id === 'light') wy = H * 0.10 - (lv - 1) * H * 0.40;
      wy = clamp(wy, -H * 0.4, H * 0.95);
      waterBody(t, Math.max(wy, 0), lv);
      if (wy > 0) waterSurface(t, wy, lv, 1);

      // 别人站在水面上（脚是干的）
      if (ph.id === 'waist' && wy > 0) {
        [[0.315, 0.30], [0.655, 0.30], [0.735, 0.29]].forEach(([px, ps]) => {
          person(W * px, wy - 2, H * ps, { color: C.ink, alpha: 0.95 });
          rim(W * px, wy - 2, H * ps, {});
        });
      }
      if (ph.id === 'knee' && wy > 0) {
        [[0.20, 0.17], [0.40, 0.15], [0.80, 0.16]].forEach(([px, ps], i) => {
          person(W * px + Math.sin(t * 0.35 + i) * 12, wy - 2, H * ps, { walk: t * 1.6 + i, color: C.ink, alpha: 0.95 });
          rim(W * px + Math.sin(t * 0.35 + i) * 12, wy - 2, H * ps, {});
        });
      }
    }

    // 结尾过曝
    if (t > 268) {
      const k = smooth(clamp((t - 268) / 24));
      ctx.fillStyle = rgba('240,250,246', k * 0.92);
      ctx.fillRect(0, 0, W, H);
    }

    // 暗角
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.30, W / 2, H / 2, H * 1.0);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.62)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  return { draw: draw, W: W, H: H, person: person };
})();
