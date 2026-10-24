import re

with open('planner.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace main content
main_html = '''
<main class="app">
  <!-- HEADER -->
  <header class="header glass">
    <div style="display:flex; flex-direction:column;">
      <div class="logo-text">Günlük Planlama</div>
      <div class="logo-sub">Gününüzü planlayýn ve takip edin</div>
    </div>
    <div class="profile-cluster">
      <div class="user-badge" id="userBadge" style="display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border2);border-radius:50px;padding:5px 12px 5px 7px;">
        <div class="user-av" id="userAv" style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;">?</div>
        <span class="user-name" id="userName" style="font-size:13px;font-weight:700;">Yükleniyor...</span>
      </div>
    </div>
  </header>

  <div class="glass" style="border-radius:var(--r); padding:20px;">
    <!-- Date Navigation -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 20px;">
      <button class="btn-edit" id="btnPrevDay" style="padding:10px 15px;">&larr; Önceki Gün</button>
      <div style="text-align:center;">
        <h2 id="plannerDateDisplay" style="font-size:20px; font-weight:800;">Bugün</h2>
        <div id="plannerDateSub" style="font-size:12px; color:var(--text2); margin-top:4px;">10 Ekim 2026, Pazartesi</div>
      </div>
      <button class="btn-edit" id="btnNextDay" style="padding:10px 15px;">Sonraki Gün &rarr;</button>
    </div>

    <!-- Progress -->
    <div style="margin-bottom: 20px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="font-size:12px; font-weight:700; color:var(--text2);">Görev Ýlerlemesi</span>
        <span id="plannerProgressText" style="font-size:12px; font-weight:800; color:var(--accent);">0/0 Tamamlandý</span>
      </div>
      <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden;">
        <div id="plannerProgressBar" style="height:100%; width:0%; background:linear-gradient(90deg, var(--accent), var(--cyan)); transition:width 0.3s ease; border-radius:10px;"></div>
      </div>
    </div>

    <!-- Task Input -->
    <div style="display:flex; gap:10px; margin-bottom:20px;">
      <input type="text" id="plannerTaskInput" placeholder="Yeni görev ekle..." style="flex:1; background:var(--surface); border:1px solid var(--border); color:var(--text); padding:12px 16px; border-radius:var(--rx); font-family:inherit; outline:none; transition:border-color 0.2s;">
      <button id="plannerAddTaskBtn" style="background:var(--accent); color:#fff; border:none; border-radius:var(--rx); padding:0 20px; font-weight:700; cursor:pointer; font-family:inherit;">Ekle</button>
    </div>

    <!-- Task List -->
    <div id="plannerTaskList" style="display:flex; flex-direction:column; gap:8px; min-height:200px;">
      <!-- Tasks will be rendered here -->
    </div>
  </div>

</main>
'''

content = re.sub(r'<main class="app">.*?</main>', main_html, content, flags=re.DOTALL)

# Replace Javascript logic
script_html = '''
<script>
const SK_PROF = 'gtk_profile';
const SK_SC   = 'gtk_scores';
const ALL_MONTHS = [
  {m:0,  label:'Ocak',    short:'Oca'}, {m:1,  label:'Þubat',   short:'Þub'},
  {m:2,  label:'Mart',    short:'Mar'}, {m:3,  label:'Nisan',   short:'Nis'},
  {m:4,  label:'Mayýs',   short:'May'}, {m:5,  label:'Haziran', short:'Haz'},
  {m:6,  label:'Temmuz',  short:'Tem'}, {m:7,  label:'Aðustos', short:'Aðu'},
  {m:8,  label:'Eylül',   short:'Eyl'}, {m:9,  label:'Ekim',    short:'Eki'},
  {m:10, label:'Kasým',   short:'Kas'}, {m:11, label:'Aralýk',  short:'Ara'}
];
const WD = ['Pazar','Pazartesi','Salý','Çarþamba','Perþembe','Cuma','Cumartesi'];

let profile = JSON.parse(localStorage.getItem(SK_PROF) || 'null');
let scores  = JSON.parse(localStorage.getItem(SK_SC)   || '{}');
let currentDate = new Date();
currentDate.setHours(0,0,0,0);

function saveSc() { localStorage.setItem(SK_SC, JSON.stringify(scores)); }
function dk(y,m,d) { return ${y}--; }
function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

function fmtDate(d) {
    const today = new Date(); today.setHours(0,0,0,0);
    const tmrw = new Date(today); tmrw.setDate(tmrw.getDate()+1);
    const yest = new Date(today); yest.setDate(yest.getDate()-1);
    
    if (d.getTime() === today.getTime()) return "Bugün";
    if (d.getTime() === tmrw.getTime()) return "Yarýn";
    if (d.getTime() === yest.getTime()) return "Dün";
    return "Tarih";
}

function updateUI() {
    if(profile){
        document.getElementById('userName').textContent = profile.name || 'Ýsimsiz';
        document.getElementById('userAv').textContent = (profile.name?profile.name.charAt(0):'?').toUpperCase();
    }
    
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const d = currentDate.getDate();
    const dateKey = dk(y, m, d);
    
    document.getElementById('plannerDateDisplay').textContent = fmtDate(currentDate);
    document.getElementById('plannerDateSub').textContent = ${d}  , ;
    
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
        listEl.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text3); font-size:13px;">Bu gün için planlanmýþ görev yok.</div>';
    } else {
        tasks.forEach(t => {
            if(t.status === 'done') doneCount++;
            
            const item = document.createElement('div');
            item.style.cssText = display:flex; align-items:center; gap:12px; padding:12px 16px; background:rgba(255,255,255,0.02); border:1px solid var(--border2); border-radius:var(--rx); transition:border-color 0.2s;;
            
            const chkBtn = document.createElement('button');
            chkBtn.style.cssText = width:22px; height:22px; border-radius:6px; border:2px solid ; background:; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; font-size:12px;;
            chkBtn.innerHTML = t.status==='done' ? '?' : '';
            chkBtn.onclick = () => {
                t.status = t.status==='done' ? 'open' : 'done';
                saveSc();
                renderTasks();
                updateSidebarStats();
            };
            
            const textEl = document.createElement('span');
            textEl.style.cssText = lex:1; font-size:14px; font-weight:500; color:; text-decoration:; transition:all 0.2s; word-break:break-word;;
            textEl.textContent = t.text;
            
            const delBtn = document.createElement('button');
            delBtn.style.cssText = ackground:none; border:none; color:var(--red); font-size:18px; cursor:pointer; padding:0 5px; opacity:0.5; transition:opacity 0.2s;;
            delBtn.innerHTML = '×';
            delBtn.onclick = () => {
                scores[dateKey].tasks = scores[dateKey].tasks.filter(xt => xt.id !== t.id);
                saveSc();
                renderTasks();
                updateSidebarStats();
            };
            item.onmouseenter = () => delBtn.style.opacity = '1';
            item.onmouseleave = () => delBtn.style.opacity = '0.5';
            
            item.appendChild(chkBtn);
            item.appendChild(textEl);
            item.appendChild(delBtn);
            listEl.appendChild(item);
        });
    }
    
    // Update progress bar
    const total = tasks.length;
    document.getElementById('plannerProgressText').textContent = ${doneCount}/ Tamamlandý;
    document.getElementById('plannerProgressBar').style.width = total > 0 ? ${(doneCount/total)*100}% : '0%';
}

document.getElementById('plannerAddTaskBtn').onclick = () => {
    const inp = document.getElementById('plannerTaskInput');
    const val = inp.value.trim();
    if(!val) return;
    
    const y = currentDate.getFullYear(), m = currentDate.getMonth(), d = currentDate.getDate();
    const dateKey = dk(y, m, d);
    if(!scores[dateKey]) scores[dateKey] = { score:'0', tasks:[] };
    scores[dateKey].tasks.push({ id:uid(), text:val, status:'open' });
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
        document.getElementById('sbScoreSub').textContent = kayýtlý gün;
        let pct = total>0 ? Math.round((plus/total)*100) : 0;
        document.getElementById('sbScorePct').textContent = %;
    }
}

// Sidebar toggle logic
let _sbOpen = false;
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sbBackdrop');
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
document.getElementById('hamburgerBtn')?.addEventListener('click', toggleSidebar);
document.getElementById('sbCloseBtn')?.addEventListener('click', toggleSidebar);
document.getElementById('sbBackdrop')?.addEventListener('click', toggleSidebar);

updateUI();
</script>
</body>
</html>
'''

content = re.sub(r'<script>.*?</script>\s*</body>', script_html, content, flags=re.DOTALL)

with open('planner.html', 'w', encoding='utf-8') as f:
    f.write(content)
