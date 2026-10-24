
<script>
const SK_PROF = 'gtk_profile';
const SK_SC   = 'gtk_scores';
const ALL_MONTHS = [
  {m:0,  label:'Ocak',    short:'Oca'}, {m:1,  label:'Şubat',   short:'Şub'},
  {m:2,  label:'Mart',    short:'Mar'}, {m:3,  label:'Nisan',   short:'Nis'},
  {m:4,  label:'Mayıs',   short:'May'}, {m:5,  label:'Haziran', short:'Haz'},
  {m:6,  label:'Temmuz',  short:'Tem'}, {m:7,  label:'Ağustos', short:'Ağu'},
  {m:8,  label:'Eylül',   short:'Eyl'}, {m:9,  label:'Ekim',    short:'Eki'},
  {m:10, label:'Kasım',   short:'Kas'}, {m:11, label:'Aralık',  short:'Ara'}
];
const WD = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

let profile = JSON.parse(localStorage.getItem(SK_PROF) || 'null');
let scores  = JSON.parse(localStorage.getItem(SK_SC)   || '{}');
let currentDate = new Date();
currentDate.setHours(0,0,0,0);

function saveSc() { localStorage.setItem(SK_SC, JSON.stringify(scores)); }
function dk(y,m,d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

function fmtDate(d) {
    const today = new Date(); today.setHours(0,0,0,0);
    const tmrw = new Date(today); tmrw.setDate(tmrw.getDate()+1);
    const yest = new Date(today); yest.setDate(yest.getDate()-1);
    
    if (d.getTime() === today.getTime()) return "Bugün";
    if (d.getTime() === tmrw.getTime()) return "Yarın";
    if (d.getTime() === yest.getTime()) return "Dün";
    return `${d.getDate()} ${ALL_MONTHS[d.getMonth()].label} ${d.getFullYear()}`;
}

function updateUI() {
    if(profile){
        document.getElementById('userName').textContent = profile.name || 'İsimsiz';
        document.getElementById('userAv').textContent = (profile.name?profile.name.charAt(0):'?').toUpperCase();
    }
    
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const d = currentDate.getDate();
    const dateKey = dk(y, m, d);
    
    document.getElementById('plannerDateDisplay').textContent = fmtDate(currentDate);
    document.getElementById('plannerDateSub').textContent = `${d} ${ALL_MONTHS[m].label} ${y}, ${WD[currentDate.getDay()]}`;
    
    if(!scores[dateKey]) scores[dateKey] = { tasks: [], score: '0' };
    const tasks = scores[dateKey].tasks || [];
    scores[dateKey].tasks = tasks; // Ensure array exists
    
    renderTasks();
    updateSidebarStats();
}

function renderTasks() {
    const y = currentDate.getFullYear(), m = currentDate.getMonth(), d = currentDate.getDate();
    const dateKey = dk(y, m, d);
    const tasks = scores[dateKey].tasks || [];
    
    const listEl = document.getElementById('plannerTaskList');
    listEl.innerHTML = '';
    
    let doneCount = 0;
    
    if(tasks.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:40px 20px; color:var(--text3); font-size:14px; background:rgba(255,255,255,0.01); border-radius:var(--rs); border:1px dashed var(--border2);"><div style="font-size:32px; margin-bottom:12px;">📋</div>Bu gün için planlanmış görev yok.<br><span style="font-size:12px; opacity:0.7;">Yeni bir görev ekleyerek planlamaya başlayın.</span></div>';
    } else {
        tasks.forEach(t => {
            if(t.status === 'done') doneCount++;
            
            const item = document.createElement('div');
            item.style.cssText = `display:flex; align-items:center; gap:12px; padding:14px 16px; background:rgba(255,255,255,0.02); border:1px solid var(--border2); border-radius:var(--rx); transition:border-color 0.2s, background 0.2s, transform 0.15s;`;
            item.onmouseenter = () => { item.style.borderColor = 'var(--border3)'; item.style.transform = 'translateX(2px)'; };
            item.onmouseleave = () => { item.style.borderColor = 'var(--border2)'; item.style.transform = 'translateX(0)'; };
            
            const isDone = t.status === 'done';
            
            const chkBtn = document.createElement('button');
            chkBtn.style.cssText = `width:24px; height:24px; border-radius:6px; border:2px solid ${isDone?'var(--green)':'var(--border3)'}; background:${isDone?'var(--green)':'transparent'}; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; font-size:14px; transition:all 0.2s;`;
            chkBtn.innerHTML = isDone ? '✓' : '';
            chkBtn.onclick = () => {
                t.status = t.status === 'done' ? 'pending' : 'done';
                saveSc();
                renderTasks();
                updateSidebarStats();
            };
            
            const textEl = document.createElement('span');
            textEl.style.cssText = `flex:1; font-size:14px; font-weight:500; color:${isDone?'var(--text2)':'var(--text)'}; text-decoration:${isDone?'line-through':'none'}; transition:all 0.2s; word-break:break-word;`;
            textEl.textContent = t.text;
            
            const delBtn = document.createElement('button');
            delBtn.style.cssText = `background:none; border:none; color:var(--red); font-size:20px; cursor:pointer; padding:0 5px; opacity:0; transition:opacity 0.2s; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--rx);`;
            delBtn.innerHTML = '×';
            delBtn.onmouseenter = () => { delBtn.style.background = 'var(--red-bg)'; };
            delBtn.onmouseleave = () => { delBtn.style.background = 'none'; };
            delBtn.onclick = () => {
                scores[dateKey].tasks = scores[dateKey].tasks.filter(xt => xt.id !== t.id);
                saveSc();
                renderTasks();
                updateSidebarStats();
            };
            item.addEventListener('mouseenter', () => delBtn.style.opacity = '1');
            item.addEventListener('mouseleave', () => delBtn.style.opacity = '0');
            
            item.appendChild(chkBtn);
            item.appendChild(textEl);
            item.appendChild(delBtn);
            listEl.appendChild(item);
        });
    }
    
    // Update progress bar
    const total = tasks.length;
    document.getElementById('plannerProgressText').textContent = `${doneCount}/${total} Tamamlandı`;
    document.getElementById('plannerProgressBar').style.width = total > 0 ? `${(doneCount/total)*100}%` : '0%';
}

document.getElementById('plannerAddTaskBtn').onclick = () => {
    const inp = document.getElementById('plannerTaskInput');
    const val = inp.value.trim();
    if(!val) return;
    
    const y = currentDate.getFullYear(), m = currentDate.getMonth(), d = currentDate.getDate();
    const dateKey = dk(y, m, d);
    if(!scores[dateKey]) scores[dateKey] = { score:'0', tasks:[] };
    scores[dateKey].tasks.push({ id:uid(), text:val, status:'pending' });
    saveSc();
    inp.value = '';
    renderTasks();
    updateSidebarStats();
};

document.getElementById('plannerTaskInput').addEventListener('keydown', e => {
    if(e.key === 'Enter') document.getElementById('plannerAddTaskBtn').click();
});

document.getElementById('btnPrevDay').onclick = () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateUI();
};

document.getElementById('btnNextDay').onclick = () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateUI();
};

// Sidebar Stats
function updateSidebarStats() {
    let plus=0, minus=0, zero=0;
    for(const k in scores) {
        if(scores[k].score==='+') plus++;
        else if(scores[k].score==='-') minus++;
        else if(scores[k].score==='0') zero++;
    }
    const total = plus+minus+zero;
    
    const sd = document.getElementById('sbScoreDisplay');
    if(sd){
        document.getElementById('sbScoreVal').textContent = total;
        document.getElementById('sbScoreSub').textContent = `kayıtlı gün`;
        let pct = total>0 ? Math.round((plus/total)*100) : 0;
        document.getElementById('sbScorePct').textContent = `%${pct}`;
    }
}

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
document.querySelector('.hamburger')?.addEventListener('click', toggleSidebar);
document.querySelector('.sb-close')?.addEventListener('click', toggleSidebar);
document.querySelector('.sb-backdrop')?.addEventListener('click', toggleSidebar);

updateUI();
