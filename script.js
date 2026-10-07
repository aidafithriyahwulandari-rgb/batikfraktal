/* ===== Pengaturan awal ===== */
const $ = id => document.getElementById(id);
const canvas = $('canvas'), ctx = canvas.getContext('2d');
const AKSEN = '#1E3A5F';                       // warna aksen biru indigo
const DEFAULTS = {motif:'kawung', iter:5, scale:0.65, angle:45, branch:4, size:60, spacing:130,
                  rot:0, bg:'#F3E2C7', c1:'#5B2C1B', c2:'#A56A3A', lw:2, mode:'combo'};
const IDS = Object.keys(DEFAULTS);
const NAMA = {kawung:'Kawung Fraktal', parang:'Parang Fraktal', ceplok:'Ceplok Fraktal', flower:'Bunga Fraktal',
              tree:'Pohon Batik Fraktal', sierpinski:'Sierpinski Batik', spiral:'Spiral Batik', mandelbrot:'Mandelbrot Batik'};
let P = {...DEFAULTS};          // parameter aktif
let animating = false, animId = null, lastTs = 0;
let depthOverride = null;       // iterasi sementara saat animasi
let rotExtra = 0;               // tambahan rotasi saat animasi (derajat)
let budget = 150000;            // batas jumlah pemanggilan rekursi agar browser tidak hang

/* ===== Fungsi bantu ===== */
// Mengisi bentuk sesuai mode tampilan (outline / filled / kombinasi)
function paint(fill) {
  if (P.mode !== 'outline') {
    ctx.globalAlpha = (P.mode === 'combo') ? 0.6 : 1;
    ctx.fillStyle = fill || P.c2;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (P.mode !== 'filled') ctx.stroke();
}
function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); paint(fill); }
function ellipse(x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); paint(fill); }
// Membatasi kedalaman rekursi: total simpul b^0 + b^1 + ... tidak melebihi jatah per sel
function capDepth(b, depth, cells) {
  const per = Math.max(1, budget / cells);
  let total = 1, n = 1, k = 1;
  while (k < depth) { n *= b; if (total + n > per) break; total += n; k++; }
  return k;
}
function hex2rgb(h) { return [parseInt(h.substr(1,2),16), parseInt(h.substr(3,2),16), parseInt(h.substr(5,2),16)]; }

/* ===== 1. Kawung ===== */
// Empat oval simetris (atas, kanan, bawah, kiri) mengelilingi titik pusat
function drawKawung(x, y, s, depth) {
  if (depth <= 0) return;                       // BASE CASE: berhenti jika iterasi habis
  ctx.save();
  ctx.translate(x, y);                          // pindahkan titik asal ke pusat motif
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 2);                // sudut 0°, 90°, 180°, 270°
    ellipse(0, -s * 0.5, s * 0.3, s * 0.5, depth % 2 ? P.c2 : AKSEN);
    // LANGKAH REKURSIF: Kawung kecil di tengah oval, ukuran dikali rasio
    // (dikali 0,5 tambahan agar muat di dalam oval)
    drawKawung(0, -s * 0.5, s * P.scale * 0.5, depth - 1);
    ctx.restore();
  }
  circle(0, 0, s * 0.1, AKSEN);                 // lingkaran kecil di pusat
  ctx.restore();
}

/* ===== 2. Parang ===== */
// Pita berbentuk huruf S memanjang, diputar -45° sehingga miring dari kiri bawah ke kanan atas
function drawParang(x, y, s, depth) {
  if (depth <= 0) return;                       // base case
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 4);                     // arah diagonal
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.bezierCurveTo(-s*.6, -s*.55, -s*.15, -s*.55, 0, 0);   // lengkung atas
  ctx.bezierCurveTo(s*.15, s*.55, s*.6, s*.55, s, 0);        // lengkung bawah (membentuk S)
  ctx.lineTo(s, s*.3);
  ctx.bezierCurveTo(s*.6, s*.85, s*.15, s*.85, 0, s*.3);
  ctx.bezierCurveTo(-s*.15, -s*.25, -s*.6, -s*.25, -s, s*.3);
  ctx.closePath();
  paint(depth % 2 ? P.c2 : AKSEN);
  circle(0, s * 0.15, s * 0.07, P.c1);
  // REKURSI: dua Parang kecil di dalam pita, ukuran dikali rasio
  drawParang(-s * 0.5, -s * 0.1, s * P.scale * 0.5, depth - 1);
  drawParang(s * 0.5, s * 0.2, s * P.scale * 0.5, depth - 1);
  ctx.restore();
}

/* ===== 3. Ceplok ===== */
// Bintang radial + kelopak + segitiga; tiap ujung memiliki Ceplok kecil
function drawCeplok(x, y, s, depth) {
  if (depth <= 0) return;                       // base case
  const n = P.branch;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();                              // bintang dengan 2n titik (jari-jari dalam & luar bergantian)
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / n * i - Math.PI / 2, r = (i % 2 === 0) ? s : s * 0.45;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  paint(depth % 2 ? P.c2 : AKSEN);
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i;        // rumus sudut rotasi tiap cabang
    ctx.save();
    ctx.rotate(angle);
    ellipse(0, -s * 0.7, s * 0.13, s * 0.27, P.c1);                  // kelopak
    ctx.beginPath();                                                  // segitiga di ujung
    ctx.moveTo(-s * 0.12, -s); ctx.lineTo(0, -s * 1.22); ctx.lineTo(s * 0.12, -s);
    ctx.closePath(); paint(AKSEN);
    ctx.translate(0, -s * 1.25);                // pindah ke ujung cabang
    ctx.rotate((P.angle - 45) * Math.PI / 180); // sudut percabangan memutar motif anak
    drawCeplok(0, 0, s * P.scale * 0.5, depth - 1);   // REKURSI pada tiap cabang
    ctx.restore();
  }
  circle(0, 0, s * 0.2, P.bg);
  circle(0, 0, s * 0.08, P.c1);
  ctx.restore();
}

/* ===== 4. Bunga ===== */
function drawFlower(x, y, s, depth) {
  if (depth <= 0) return;                       // base case
  const n = P.branch;
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 / n) * i);          // putar tiap kelopak
    ellipse(0, -s * 0.5, s * 0.2, s * 0.5, depth % 2 ? P.c2 : AKSEN);
    ctx.beginPath(); ctx.arc(0, -s * 0.55, s * 0.06, 0, Math.PI * 2); paint(P.bg);   // titik hias kelopak
    ctx.translate(0, -s);                       // ujung kelopak
    ctx.rotate((P.angle - 45) * Math.PI / 180);
    drawFlower(0, 0, s * P.scale * 0.5, depth - 1);   // bunga kecil di ujung kelopak (rekursi)
    ctx.restore();
  }
  circle(0, 0, s * 0.22, P.c1);
  circle(0, 0, s * 0.1, P.bg);
  ctx.restore();
}

/* ===== 5. Pohon Batik ===== */
// Setiap batang bercabang ke kiri dan kanan; ujung cabang diberi ornamen daun
function drawTree(x, y, len, ang, depth) {
  if (depth <= 0) return;                       // base case
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);                              // putar sesuai sudut cabang
  ctx.lineWidth = Math.max(1, P.lw * depth / 3);
  ctx.strokeStyle = P.c1;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();   // gambar batang
  if (depth === 1) {                            // ujung cabang: daun/bunga kecil ala batik
    ctx.lineWidth = P.lw;
    ellipse(0, -len, len * 0.35, len * 0.6, P.c2);
    circle(0, -len, len * 0.15, AKSEN);
  }
  const a = P.angle * Math.PI / 180, newLen = len * P.scale;   // panjang baru = panjang x skala
  drawTree(0, -len, newLen, -a, depth - 1);     // cabang kiri  (sudut - a)
  drawTree(0, -len, newLen,  a, depth - 1);     // cabang kanan (sudut + a)
  ctx.restore();
}

/* ===== 6. Sierpinski Batik ===== */
// (x,y) = pusat kotak pembatas segitiga; s = panjang sisi
function drawSierpinski(x, y, s, depth) {
  if (depth <= 0) return;                       // base case
  const h = s * Math.sqrt(3) / 2;
  if (depth === 1) {                            // iterasi terakhir: segitiga + hiasan titik/garis
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2); ctx.lineTo(x - s / 2, y + h / 2); ctx.lineTo(x + s / 2, y + h / 2);
    ctx.closePath(); paint(P.c2);
    const r = Math.max(1, s * 0.07);
    circle(x, y - h / 2 + r * 2.5, r, AKSEN);   // titik di tiga sudut
    circle(x - s / 2 + r * 3, y + h / 2 - r * 2, r, AKSEN);
    circle(x + s / 2 - r * 3, y + h / 2 - r * 2, r, AKSEN);
    ctx.beginPath();                            // garis hias segitiga tengah
    ctx.moveTo(x - s / 4, y); ctx.lineTo(x + s / 4, y); ctx.lineTo(x, y + h / 2); ctx.closePath(); ctx.stroke();
    return;
  }
  // Tiga cabang rekursif, ukuran separuh: atas, kiri bawah, kanan bawah
  drawSierpinski(x, y - h / 4, s / 2, depth - 1);
  drawSierpinski(x - s / 4, y + h / 4, s / 2, depth - 1);
  drawSierpinski(x + s / 4, y + h / 4, s / 2, depth - 1);
}

/* ===== 7. Spiral Batik ===== */
function drawSpiral(cx, cy, s, depth) {
  const N = 10 * depth + 6;                     // jumlah titik bertambah dengan iterasi
  const step = P.angle * Math.PI / 180;         // perubahan sudut per titik
  const pts = [];
  for (let k = 1; k <= N; k++) {
    const radius = s * k / N;                   // perubahan radius (spiral Archimedes)
    const angle = k * step;
    pts.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);   // koordinat polar -> kartesius
  }
  ctx.beginPath(); ctx.moveTo(cx, cy);
  pts.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.stroke();
  const od = Math.min(2, depth);                // kedalaman ornamen pada tiap titik
  pts.forEach((p, k) => {
    const os = s * 0.16 * (0.4 + k / N);        // ornamen makin besar ke arah luar
    if (k % 2) drawKawung(p[0], p[1], os, od); else drawFlower(p[0], p[1], os, od);
  });
}

/* ===== 8. Mandelbrot Batik ===== */
function drawMandelbrot(depth) {
  const w = canvas.width, h = canvas.height;
  const img = ctx.createImageData(w, h);
  const maxIt = Math.min(40 + depth * 18, 200);          // iterasi menentukan detail
  const viewW = 3.4 / (1 + P.size / 50);                 // ukuran motif = zoom
  const step = viewW / w;
  const th = (P.rot + rotExtra) * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const pal = [P.bg, P.c2, P.c1, AKSEN, P.c2].map(hex2rgb);   // palet warna batik
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - w / 2) * step, dy = (py - h / 2) * step;
      const cx = -0.6 + dx * cs - dy * sn, cy = dx * sn + dy * cs;   // titik c (diputar)
      let zx = 0, zy = 0, i = 0;
      while (i < maxIt && zx * zx + zy * zy <= 4) {
        const zx2 = zx * zx - zy * zy + cx;       // z = z*z + c (bagian real)
        zy = 2 * zx * zy + cy;                    // bagian imajiner
        zx = zx2; i++;
      }
      let r = 26, g = 14, b = 8;                  // di dalam himpunan: cokelat sangat tua
      if (i < maxIt) {
        const t = (i % 24) / 24 * 4, k = Math.floor(t), f = t - k;   // interpolasi antar warna palet
        const c1 = pal[k], c2 = pal[k + 1];
        r = c1[0] + (c2[0] - c1[0]) * f; g = c1[1] + (c2[1] - c1[1]) * f; b = c1[2] + (c2[2] - c1[2]) * f;
      }
      const idx = (py * w + px) * 4;
      img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/* ===== Pola pengulangan (grid) ===== */
// Cabang per motif dipakai untuk membatasi kedalaman rekursi
function branchCount(m) {
  return {kawung:4, parang:2, ceplok:P.branch, flower:P.branch, tree:2, sierpinski:3, spiral:1}[m];
}
function drawPattern() {
  const w = canvas.width, h = canvas.height;
  const depth = depthOverride || P.iter;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);          // latar belakang
  ctx.strokeStyle = P.c1; ctx.lineWidth = P.lw; ctx.lineJoin = 'round';
  if (P.motif === 'mandelbrot') { drawMandelbrot(depth); $('note').textContent = ''; return; }
  const sp = P.spacing, cells = Math.ceil(w / sp + 1) * Math.ceil(h / sp + 1);
  const eff = capDepth(branchCount(P.motif), depth, cells);
  $('note').textContent = eff < depth ? 'Iterasi digambar dibatasi menjadi ' + eff + ' agar tetap ringan (jarak antar motif lebih besar = iterasi lebih tinggi).' : '';
  const s = P.size, rad = (P.rot + rotExtra) * Math.PI / 180;
  // Pola grid: baris (y) dan kolom (x) dengan jarak 'spacing'
  for (let y = sp / 2, r = 0; y < h + sp / 2; y += sp, r++) {
    // Parang: baris ganjil digeser setengah jarak -> susunan diagonal
    for (let x = (P.motif === 'parang' && r % 2) ? 0 : sp / 2; x < w + sp / 2; x += sp) {
      ctx.save();
      ctx.translate(x, y);                      // translasi ke pusat sel
      ctx.rotate(rad);                          // rotasi motif
      switch (P.motif) {
        case 'kawung': drawKawung(0, 0, s, eff); break;
        case 'parang': drawParang(0, 0, s * 0.9, eff); break;
        case 'ceplok': drawCeplok(0, 0, s * 0.6, eff); break;
        case 'flower': drawFlower(0, 0, s * 0.7, eff); break;
        case 'tree': drawTree(0, s * 0.9, s * 0.5, 0, eff); break;
        case 'sierpinski': drawSierpinski(0, 0, s * 1.6, eff); break;
        case 'spiral': drawSpiral(0, 0, s * 1.3, eff); break;
      }
      ctx.restore();
    }
  }
}

/* ===== Parameter & kontrol ===== */
function updateParameters() {
  IDS.forEach(id => {
    const v = $(id).value;
    P[id] = (typeof DEFAULTS[id] === 'number') ? parseFloat(v) : v;
  });
  document.querySelectorAll('.ctrl .val').forEach(sp => {
    sp.textContent = sp.closest('.ctrl').querySelector('input').value;
  });
  $('iM').textContent = NAMA[P.motif]; $('iI').textContent = P.iter; $('iS').textContent = P.scale.toFixed(2);
  $('iA').textContent = P.angle + '°'; $('iB').textContent = P.branch; $('iR').textContent = P.rot + '°';
  $('iZ').textContent = P.size;
}
function setControls(obj) { IDS.forEach(id => { $(id).value = obj[id]; }); updateParameters(); }
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function randomizeParameters() {
  const bgs = ['#F3E2C7', '#EAD3A8', '#F7ECD6', '#E8D5B5', '#1B2A41'];
  const darks = ['#5B2C1B', '#3B1F12', '#1E3A5F', '#2B2B2B', '#6B3A1E'];
  const mids = ['#A56A3A', '#C08A4F', '#8B5A2B', '#3C6E8F', '#B07B52'];
  setControls({
    motif: pick(Object.keys(NAMA)), iter: Math.floor(rand(2, 7)), scale: +rand(0.4, 0.8).toFixed(2),
    angle: Math.floor(rand(15, 120)), branch: Math.floor(rand(2, 9)), size: Math.floor(rand(40, 100)),
    spacing: Math.floor(rand(110, 200)), rot: Math.floor(rand(0, 360)), lw: Math.floor(rand(1, 5)),
    mode: P.mode, bg: pick(bgs), c1: pick(darks), c2: pick(mids)
  });
  drawPattern();
}
function resetParameters() {
  if (animating) stopAnimation();
  setControls(DEFAULTS); drawPattern();
}
function downloadCanvas() {
  const link = document.createElement('a');
  link.download = 'fractal-batik.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ===== Animasi ===== */
// Rotasi pelan + iterasi naik bertahap (1 sampai nilai iterasi). Digambar ~7 kali/detik agar ringan.
function animate(ts) {
  if (!animating) return;
  if (ts - lastTs > 150) {
    rotExtra = (ts / 1000 * 6) % 360;                     // 6° per detik
    depthOverride = 1 + Math.floor(ts / 1200) % P.iter;   // ganti iterasi tiap 1,2 detik
    drawPattern(); lastTs = ts;
  }
  animId = requestAnimationFrame(animate);
}
function startAnimation() {
  if (animating) return;
  animating = true; budget = 40000;
  animId = requestAnimationFrame(animate);
}
function stopAnimation() {
  animating = false; cancelAnimationFrame(animId);
  rotExtra = 0; depthOverride = null; budget = 150000;
  drawPattern();
}

/* ===== Event ===== */
IDS.forEach(id => $(id).addEventListener('input', () => { updateParameters(); if (!animating) drawPattern(); }));
$('btnGen').onclick = () => { updateParameters(); drawPattern(); };
$('btnRand').onclick = randomizeParameters;
$('btnReset').onclick = resetParameters;
$('btnDl').onclick = downloadCanvas;
$('btnStart').onclick = startAnimation;
$('btnStop').onclick = stopAnimation;
setControls(DEFAULTS); drawPattern();