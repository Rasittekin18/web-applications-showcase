function escHtml(s){if(!s)return'';return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));}
    const sessionUser = localStorage.getItem('gtk_session');
    function doLogout() {
        if (window.doFirebaseLogout) window.doFirebaseLogout();
        else {
            localStorage.removeItem('gtk_session');
            localStorage.removeItem('gtk_profile');
            window.location.href = 'auth.html';
        }
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       CONSTANTS
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    const SK_PROF = 'gtk_profile';
    const SK_SC = 'gtk_scores_' + sessionUser;

    const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

    const MONTH_LONG = ['Ocak', 'Åubat', 'Mart', 'Nisan', 'MayÄ±s', 'Haziran', 'Temmuz', 'AÄŸustos', 'EylÃ¼l', 'Ekim', 'KasÄ±m', 'AralÄ±k'];
    const MONTH_SHORT = ['Oca', 'Åub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'AÄŸu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const DAY_NAMES = ['Pazar', 'Pazartesi', 'SalÄ±', 'Ã‡arÅŸamba', 'PerÅŸembe', 'Cuma', 'Cumartesi'];

    const FILTER_DAYS = { '1H': 7, '1A': 30, '3A': 90, '6A': 180, '1Y': 365, 'all': null };

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       STATE
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    let profile = JSON.parse(localStorage.getItem(SK_PROF) || 'null');
    let scores = JSON.parse(localStorage.getItem(SK_SC) || '{}');

    let _currentFilter = '1A';
    let _sortDesc = true; // newest first
    let _filteredEntries = [];
    let _chartPoints = [];
    let _animFrame = null;
    let _eventsAttached = false;

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       HELPERS
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function dk(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
    function fmtDate(y, m, d) { return `${DAY_NAMES[new Date(y, m, d).getDay()]}, ${d} ${MONTH_LONG[m]} ${y}`; }
    function fmtShort(key) {
      const [y, m, d] = key.split('-').map(Number);
      return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
    }

    function getFilteredEntries(filter) {
      const days = FILTER_DAYS[filter];
      const all = Object.entries(scores)
        .filter(([, v]) => v.score)
        .sort(([a], [b]) => a.localeCompare(b));
      if (!days) return all;
      const cutoff = new Date(TODAY);
      cutoff.setDate(cutoff.getDate() - days + 1);
      const cutStr = dk(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate());
      return all.filter(([k]) => k >= cutStr);
    }

    function buildChartPoints(entries) {
      // Cumulative starting from 0 at the beginning of the filter period
      const pts = [{ cum: 0, _start: true }];
      let cum = 0;
      entries.forEach(([key, entry]) => {
        const delta = entry.score === '+' ? 1 : entry.score === '-' ? -1 : 0;
        cum += delta;
        const [y, m, d] = key.split('-').map(Number);
        pts.push({
          date: new Date(y, m - 1, d),
          key, score: entry.score, delta, cum,
          label: fmtShort(key),
          fullDate: fmtDate(y, m - 1, d),
          note: entry.note || '',
          tasks: entry.tasks || []
        });
      });
      return pts;
    }

    function computePeriodBestStreak(entries) {
      if (!entries.length) return 0;
      let best = 0, cur = 0;
      entries.forEach(([, e]) => {
        if (e.score === '+') { cur++; best = Math.max(best, cur); }
        else cur = 0;
      });
      return best;
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       UI UPDATE
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function setFilter(f) {
      _currentFilter = f;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === f);
      });
      
    // Sidebar toggle logic

    function toggleSort() {
      _sortDesc = !_sortDesc;
      document.getElementById('sortBtn').textContent = _sortDesc ? 'â¬‡ Yeniden eskiye' : 'â¬† Eskiden yeniye';
      renderDayList(_filteredEntries);
    }

    function updateAll() {
      _filteredEntries = getFilteredEntries(_currentFilter);
      _chartPoints = buildChartPoints(_filteredEntries);
      updatePeriodRange(_filteredEntries);
      updateSummary(_filteredEntries);
      updateStatsStrip(_filteredEntries);
      animateChart(_chartPoints);
      renderDayList(_filteredEntries);
    }

    function updatePeriodRange(entries) {
      const el = document.getElementById('periodRange');
      if (!entries.length) { el.textContent = 'Bu dÃ¶nemde kayÄ±t yok'; return; }
      const first = fmtShort(entries[0][0]);
      const last = fmtShort(entries[entries.length - 1][0]);
      el.textContent = first === last ? first : `${first} â€” ${last}`;
    }

    function updateSummary(entries) {
      let plus = 0, minus = 0, zero = 0;
      entries.forEach(([, e]) => {
        if (e.score === '+') plus++; else if (e.score === '-') minus++; else zero++;
      });
      const total = entries.length;
      const cum = plus - minus;
      const pct = total > 0 ? Math.round((plus / total) * 100) : 0;

      const cumEl = document.getElementById('csCum');
      cumEl.textContent = cum > 0 ? '+' + cum : String(cum);
      cumEl.className = 'cs-val ' + (cum > 0 ? 'pos' : cum < 0 ? 'neg' : 'neu');

      document.getElementById('csPlus').textContent = plus;
      document.getElementById('csMinus').textContent = minus;
      document.getElementById('csZero').textContent = zero;
      document.getElementById('csPct').textContent = total > 0 ? `%${pct}` : 'â€”';
    }

    function updateStatsStrip(entries) {
      const total = entries.length;
      const bestStreak = computePeriodBestStreak(entries);

      let taskDone = 0, taskTotal = 0;
      entries.forEach(([, e]) => {
        if (e.tasks) {
          taskTotal += e.tasks.length;
          taskDone += e.tasks.filter(t => t.status === 'done').length;
        }
      });

      const plus = entries.filter(([, e]) => e.score === '+').length;
      const minus = entries.filter(([, e]) => e.score === '-').length;
      const cum = plus - minus;
      const avg = total > 0 ? (cum / total).toFixed(2) : 'â€”';
      const avgEl = document.getElementById('ssAvg');
      avgEl.textContent = typeof avg === 'string' ? avg : (parseFloat(avg) > 0 ? '+' : '') + avg;
      avgEl.className = 'sc-val ' + (parseFloat(avg) > 0 ? 'clr-g' : parseFloat(avg) < 0 ? 'clr-r' : '');

      document.getElementById('ssTot').textContent = total;
      document.getElementById('ssBestStr').textContent = bestStreak;
      document.getElementById('ssTasks').textContent = `${taskDone}/${taskTotal}`;
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       DAY LIST
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function renderDayList(entries) {
      const list = document.getElementById('dayList');
      const count = document.getElementById('dlsCount');
      count.textContent = `${entries.length} gÃ¼n`;

      if (!entries.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">ğŸ“‹</div>Bu dÃ¶nemde kayÄ±t yok.<br><a href="index.html" style="color:var(--accent);text-decoration:none;font-weight:700;margin-top:8px;display:inline-block;">Takvime git â†’</a></div>`;
        return;
      }

      const sorted = _sortDesc ? [...entries].reverse() : [...entries];

      list.innerHTML = sorted.map(([key, entry]) => {
        const [y, m, d] = key.split('-').map(Number);
        const dateStr = fmtDate(y, m - 1, d);
        const scoreClass = entry.score === '+' ? 'plus' : entry.score === '-' ? 'minus' : 'zero';
        const scoreIcon = entry.score === '+' ? 'ï¼‹' : entry.score === '-' ? 'âˆ’' : 'â—‹';
        const scoreLbl = entry.score === '+' ? 'Ä°yi GÃ¼n' : entry.score === '-' ? 'KÃ¶tÃ¼ GÃ¼n' : 'Normal';
        const tasks = entry.tasks || [];
        const tDone = tasks.filter(t => t.status === 'done').length;
        const isToday = key === dk(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
        const isFut = new Date(y, m - 1, d) > TODAY;

        const taskPct = tasks.length > 0 ? Math.round((tDone / tasks.length) * 100) : 0;
        const noteHtml = entry.note
          ? `<div class="de-note">"${escHtml(entry.note.length > 100 ? entry.note.slice(0, 100) + '…' : entry.note)}"</div>`
          : '';
        const taskHtml = tasks.length
          ? `<div class="de-tasks">
          <span>ğŸ“‹ ${tDone}/${tasks.length}</span>
          <div class="de-task-bar"><div class="de-task-fill" style="width:${taskPct}%"></div></div>
        </div>`
          : '';
        const todayBadge = isToday ? `<span style="font-size:9px;background:rgba(0,212,255,.15);color:var(--cyan);padding:2px 7px;border-radius:50px;font-weight:800;margin-left:6px;">BUGÃœN</span>` : '';
        const futBadge = isFut ? `<span style="font-size:9px;background:rgba(78,140,255,.15);color:var(--accent2);padding:2px 7px;border-radius:50px;font-weight:800;margin-left:6px;">GELECEK</span>` : '';

        return `<div class="day-entry glass">
      <div class="de-left">
        <div class="de-date">${dateStr}${todayBadge}${futBadge}</div>
        ${noteHtml}
        ${taskHtml}
      </div>
      <div class="de-score-badge ${scoreClass}">${scoreIcon} ${scoreLbl}</div>
    </div>`;
      }).join('');
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       CHART â€” DRAW
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function animateChart(points) {
      if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
      const start = performance.now();
      const dur = 650;

      function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        drawChart(points, ease, null);
        if (t < 1) _animFrame = requestAnimationFrame(frame);
        else { _animFrame = null; if (!_eventsAttached) { attachChartEvents(); _eventsAttached = true; } }
      }
      _animFrame = requestAnimationFrame(frame);
    }

    function drawChart(points, progress, hoveredIdx) {
      const canvas = document.getElementById('mainChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.parentElement.clientWidth || 880;
      const H = canvas.clientHeight || 360;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      if (points.length < 2) {
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.font = '14px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Bu dÃ¶nemde puanlanmÄ±ÅŸ gÃ¼n yok', W / 2, H / 2 - 14);
        ctx.font = '11px Inter,sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        ctx.fillText('Takvimden gÃ¼nlere puan ekleyebilirsin', W / 2, H / 2 + 14);
        return;
      }

      const PAD = { top: 26, right: 20, bottom: 42, left: 48 };
      const CW = W - PAD.left - PAD.right;
      const CH = H - PAD.top - PAD.bottom;

      const N = points.length - 1;
      const cums = points.map(p => p.cum);
      const maxC = Math.max(...cums, 1);
      const minC = Math.min(...cums, -1);
      const rng = maxC - minC;
      const padV = rng * 0.13;
      const vMax = maxC + padV, vMin = minC - padV, vRng = vMax - vMin;

      const xOf = i => PAD.left + (i / N) * CW;
      const yOf = v => PAD.top + CH - ((v - vMin) / vRng) * CH;
      const zY = yOf(0);

      /* â”€â”€ Grid â”€â”€ */
      ctx.strokeStyle = 'rgba(255,255,255,.03)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const gy = PAD.top + (CH / 5) * i;
        ctx.beginPath(); ctx.moveTo(PAD.left, gy); ctx.lineTo(PAD.left + CW, gy); ctx.stroke();
      }

      /* â”€â”€ Zero line â”€â”€ */
      if (zY >= PAD.top && zY <= PAD.top + CH) {
        ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.setLineDash([5, 6]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PAD.left, zY); ctx.lineTo(PAD.left + CW, zY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.font = '9px Inter,sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText('0', PAD.left - 6, zY);
      }

      /* â”€â”€ Y-axis labels â”€â”€ */
      const yTicks = 5;
      for (let i = 0; i <= yTicks; i++) {
        const v = vMin + (vRng / yTicks) * i;
        const vy = yOf(v);
        const vRnd = Math.round(v);
        if (vy < PAD.top || vy > PAD.top + CH) continue;
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.font = '9px Inter,sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(vRnd > 0 ? '+' + vRnd : String(vRnd), PAD.left - 6, vy);
      }

      /* â”€â”€ Month separator markers â”€â”€ */
      let lastMonth = points[1] ? points[1].date?.getMonth() : -1;
      points.slice(2).forEach((p, rawI) => {
        const i = rawI + 2;
        if (!p.date) return;
        const m = p.date.getMonth();
        if (m !== lastMonth) {
          lastMonth = m;
          const x = xOf(i);
          ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1; ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + CH); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.font = '9px Inter,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(MONTH_SHORT[m], x, PAD.top - 4);
        }
      });

      /* â”€â”€ Animated clip â”€â”€ */
      const clipW = CW * progress;

      /* Green fill (above zero) */
      const gradG = ctx.createLinearGradient(0, PAD.top, 0, zY);
      gradG.addColorStop(0, 'rgba(0,229,160,.28)'); gradG.addColorStop(1, 'rgba(0,229,160,.02)');
      ctx.save(); ctx.beginPath();
      ctx.rect(PAD.left - 1, PAD.top, clipW + 1, Math.max(0, zY - PAD.top)); ctx.clip();
      ctx.beginPath();
      points.forEach((p, i) => { const x = xOf(i), y = yOf(p.cum); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.lineTo(xOf(N), zY); ctx.lineTo(xOf(0), zY); ctx.closePath();
      ctx.fillStyle = gradG; ctx.fill(); ctx.restore();

      /* Red fill (below zero) */
      const gradR = ctx.createLinearGradient(0, zY, 0, PAD.top + CH);
      gradR.addColorStop(0, 'rgba(255,77,109,.02)'); gradR.addColorStop(1, 'rgba(255,77,109,.28)');
      ctx.save(); ctx.beginPath();
      ctx.rect(PAD.left - 1, zY, clipW + 1, Math.max(0, PAD.top + CH - zY)); ctx.clip();
      ctx.beginPath();
      points.forEach((p, i) => { const x = xOf(i), y = yOf(p.cum); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.lineTo(xOf(N), yOf(points[N].cum)); ctx.lineTo(xOf(0), zY); ctx.closePath();
      ctx.fillStyle = gradR; ctx.fill(); ctx.restore();

      /* Glow line */
      ctx.save(); ctx.beginPath(); ctx.rect(PAD.left - 1, PAD.top, clipW + 1, CH + 2); ctx.clip();
      ctx.beginPath();
      points.forEach((p, i) => { const x = xOf(i), y = yOf(p.cum); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      const lastC = points[N].cum;
      ctx.strokeStyle = lastC > 0 ? 'rgba(0,229,160,.18)' : lastC < 0 ? 'rgba(255,77,109,.18)' : 'rgba(124,92,252,.18)';
      ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke();

      /* Main line */
      ctx.beginPath();
      points.forEach((p, i) => { const x = xOf(i), y = yOf(p.cum); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.strokeStyle = lastC > 0 ? 'rgba(0,229,160,.9)' : lastC < 0 ? 'rgba(255,77,109,.9)' : 'rgba(124,92,252,.9)';
      ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();

      /* Dots */
      points.forEach((p, i) => {
        if (p._start) return;
        const x = xOf(i), y = yOf(p.cum);
        if (x > PAD.left + clipW + 3) return; // don't draw past clip
        const isHov = hoveredIdx === i;
        const r = isHov ? 6 : 3.5;
        const dc = p.score === '+' ? '#00e5a0' : p.score === '-' ? '#ff4d6d' : '#ffcd47';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = dc; ctx.fill();
        ctx.strokeStyle = 'rgba(8,8,18,.8)'; ctx.lineWidth = isHov ? 2 : 1.5; ctx.stroke();

        if (isHov) {
          // Outer ring
          ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = dc + '66'; ctx.lineWidth = 2; ctx.stroke();
        }
      });

      /* Crosshair */
      if (hoveredIdx !== null && hoveredIdx > 0 && hoveredIdx < points.length) {
        const x = xOf(hoveredIdx);
        ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + CH); ctx.stroke();
        ctx.setLineDash([]);
      }

      /* Current value badge (shown after animation) */
      if (progress > 0.95 && points.length > 1) {
        const lp = points[N];
        const x = xOf(N);
        const y = yOf(lp.cum);
        const vc = lp.cum >= 0 ? '#00e5a0' : '#ff4d6d';
        const vs = lp.cum > 0 ? '+' + lp.cum : String(lp.cum);
        const bw = 36, bh = 20, bx = Math.min(x - bw / 2, PAD.left + CW - bw), by = Math.max(y - bh - 8, PAD.top);
        ctx.fillStyle = vc; ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 5); ctx.fill();
        ctx.fillStyle = '#0a0a1e'; ctx.font = 'bold 11px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(vs, bx + bw / 2, by + bh / 2);
      }

      /* X-axis labels */
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.font = '9px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const maxLabels = Math.floor(CW / 60);
      const step = Math.max(1, Math.ceil(N / maxLabels));
      points.forEach((p, i) => {
        if (p._start || i % step !== 0) return;
        const x = xOf(i);
        if (x > PAD.left + clipW + 5) return;
        // Very short label: d/m
        const parts = p.key.split('-');
        ctx.fillText(`${parseInt(parts[2])}/${parseInt(parts[1])}`, x, PAD.top + CH + 6);
      });
      // Always show last label if not start
      if (!points[N]._start && N > 0) {
        const x = xOf(N);
        if (x <= PAD.left + clipW + 5) {
          const parts = points[N].key.split('-');
          ctx.fillText(`${parseInt(parts[2])}/${parseInt(parts[1])}`, x, PAD.top + CH + 6);
        }
      }

      // Store canvas meta for hover
      canvas._PAD = PAD; canvas._N = N; canvas._xOf = xOf; canvas._yOf = yOf;
      canvas._points = points;
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       CHART â€” HOVER EVENTS
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function attachChartEvents() {
      const canvas = document.getElementById('mainChart');
      if (!canvas) return;

      canvas.addEventListener('mousemove', function (e) {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left);
        const PAD = canvas._PAD; if (!PAD) return;
        const N = canvas._N || 0;
        const points = canvas._points || [];
        if (!points.length) return;

        const CW = canvas.clientWidth - PAD.left - PAD.right;
        const xOf = i => PAD.left + (i / N) * CW;

        let nearest = -1, minD = 35;
        points.forEach((p, i) => {
          if (p._start) return;
          const x = xOf(i);
          const d = Math.abs(x - mx);
          if (d < minD) { minD = d; nearest = i; }
        });

        drawChart(points, 1, nearest >= 0 ? nearest : null);

        if (nearest >= 0 && minD < 35) {
          const p = points[nearest];
          const icon = p.score === '+' ? 'ï¼‹ Ä°yi GÃ¼n' : p.score === '-' ? 'âˆ’ KÃ¶tÃ¼ GÃ¼n' : 'â—‹ Normal GÃ¼n';
          const clr = p.score === '+' ? '#00e5a0' : p.score === '-' ? '#ff4d6d' : '#ffcd47';
          const cumStr = p.cum >= 0 ? '+' + p.cum : String(p.cum);

          document.getElementById('ctDate').textContent = p.fullDate;
          document.getElementById('ctScore').textContent = icon;
          document.getElementById('ctScore').style.color = clr;
          document.getElementById('ctCum').textContent = 'DÃ¶nem toplamÄ±: ' + cumStr;

          const noteEl = document.getElementById('ctNote');
          if (p.note) { noteEl.textContent = '"' + p.note.slice(0, 80) + (p.note.length > 80 ? 'â€¦' : '') + '"'; noteEl.style.display = 'block'; }
          else noteEl.style.display = 'none';

          const tasksEl = document.getElementById('ctTasks');
          if (p.tasks.length) {
            const done = p.tasks.filter(t => t.status === 'done').length;
            tasksEl.textContent = `ğŸ“‹ ${done}/${p.tasks.length} gÃ¶rev tamamlandÄ±`;
            tasksEl.style.display = 'block';
          } else tasksEl.style.display = 'none';

          const tip = document.getElementById('chartTooltip');
          const wrapR = document.querySelector('.chart-wrap').getBoundingClientRect();
          let tx = e.clientX - wrapR.left + 16;
          let ty = e.clientY - wrapR.top - 40;
          const tipW = 170;
          const wrapW = wrapR.width;
          if (tx + tipW > wrapW - 10) tx -= (tipW + 32);
          if (ty < 4) ty = 4;
          tip.style.left = tx + 'px'; tip.style.top = ty + 'px'; tip.style.display = 'block';
        } else {
          document.getElementById('chartTooltip').style.display = 'none';
        }
      });

      canvas.addEventListener('mouseleave', function () {
        drawChart(canvas._points || [], 1, null);
        document.getElementById('chartTooltip').style.display = 'none';
      });
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       USER BADGE
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function initUserBadge() {
      if (!profile) {
        document.getElementById('userName').textContent = 'Profil yok';
        document.getElementById('userAv').textContent = '?';
        return;
      }
      const ini = (profile.fn[0] || '') + (profile.ln[0] || '');
      document.getElementById('userAv').textContent = ini.toUpperCase();
      document.getElementById('userName').textContent = `${profile.fn} ${profile.ln}`;
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       TOAST
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    let _tt = null;
    function toast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg; el.classList.add('show');
      if (_tt) clearTimeout(_tt);
      _tt = setTimeout(() => el.classList.remove('show'), 2800);
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       INIT
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    window.addEventListener('resize', () => {
      if (_chartPoints.length > 1) drawChart(_chartPoints, 1, null);
    });

    initUserBadge();
    
    // Sidebar toggle logic
    let _sbOpen = false;
    function toggleSidebar() {
      const sb = document.querySelector('.sidebar');
      const bd = document.querySelector('.sb-backdrop');
      if(!sb) return;
      _sbOpen = !_sbOpen;
      if(_sbOpen) {
        sb.classList.add('open');
        if(bd) bd.classList.add('open');
      } else {
        sb.classList.remove('open');
        if(bd) bd.classList.remove('open');
      }
    }
    function closeSidebar() {
        if(_sbOpen) toggleSidebar();
    }
    
    // Sidebar Stats
    function updateSidebarStats() {
        const scores = JSON.parse(localStorage.getItem('gtk_scores') || '{}');
        let plus=0, minus=0, zero=0;
        for(const k in scores) {
            if(scores[k].score==='+') plus++;
            else if(scores[k].score==='-') minus++;
            else if(scores[k].score==='0') zero++;
        }
        const total = plus+minus+zero;
        
        const sd = document.getElementById('sbScoreVal');
        if(sd){
            sd.textContent = total;
            document.getElementById('sbScoreSub').textContent = `kayÄ±tlÄ± gÃ¼n`;
            let pct = total>0 ? Math.round((plus/total)*100) : 0;
            document.getElementById('sbScorePct').textContent = `%${pct}`;
        }
    }

    updateSidebarStats();
    updateAll(); // default: 1A
  
