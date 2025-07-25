/**************  Auth **************/
const PASSWORD = 'teacher123';

document.addEventListener('DOMContentLoaded', () => {
  if (!sessionStorage.getItem('auth')) showLogin(); else initApp();
  document.getElementById('loginForm').addEventListener('submit', login);
});
function showLogin() { document.getElementById('loginModal').classList.remove('hidden'); }
function hideLogin() { document.getElementById('loginModal').classList.add('hidden'); }
function login(e){
  e.preventDefault();
  const pw = document.getElementById('loginPassword').value;
  if (pw === PASSWORD){ sessionStorage.setItem('auth','1'); hideLogin(); initApp(); }
  else document.getElementById('loginError').classList.remove('hidden');
}

/**************  Data  **************/
const periodLabels=['1st','2nd','3rd','4th','5th','6th','7th'];
let classes=[
  {id:'cls_math',name:'Algebra I',color:'#3498db',period:1},
  {id:'cls_eng', name:'English 9',color:'#27ae60',period:2}
];
let lessons=[
  {id:'les1',classId:'cls_math',title:'Linear Equations',date:today(),period:1},
  {id:'les2',classId:'cls_eng', title:'Character Analysis',date:today(),period:2}
];
function today(){return new Date().toISOString().split('T')[0];}
let currentDate=today();

/**************  Init after login **************/
function initApp(){
  document.getElementById('app').classList.remove('hidden');
  setupNav();
  setupCalendarNav();
  setupClassModal();
  renderAll();
}

/**************  Navigation **************/
function setupNav(){
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.onclick=()=>{document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      document.getElementById(btn.dataset.view+'View').classList.add('active');
    };
  });
}

/**************  Dashboard **************/
function renderDashboard(){
  // quick stats
  const statsEl=document.getElementById('quickStats');
  const weekLessons=lessons.filter(l=>l.date>=today()).length;
  statsEl.innerHTML=`
    <div class="stat-card">Total Lessons<br>${lessons.length}</div>
    <div class="stat-card">This Week<br>${weekLessons}</div>
    <div class="stat-card">Classes<br>${classes.length}</div>
  `;
  // recent lessons
  const recent=document.getElementById('recentLessons');
  recent.innerHTML=lessons.slice(-5).reverse().map(l=>{
    const cls=classes.find(c=>c.id===l.classId);
    return `<li>${l.title} – <span style="color:${cls.color}">${cls.name}</span></li>`;
  }).join('');
}

/**************  Calendar **************/
function setupCalendarNav(){
  const dp=document.getElementById('datePicker');
  dp.value=currentDate;
  dp.onchange=e=>{currentDate=e.target.value;renderCalendar();}
  document.getElementById('prevDayBtn').onclick=()=>{shiftDay(-1);};
  document.getElementById('nextDayBtn').onclick=()=>{shiftDay(1);};
}
function shiftDay(offset){
  const d=new Date(currentDate);d.setDate(d.getDate()+offset);
  currentDate=d.toISOString().split('T')[0];
  document.getElementById('datePicker').value=currentDate;
  renderCalendar();
}
function renderCalendar(){
  const grid=document.getElementById('calendarGrid');
  grid.innerHTML='';
  // headers
  grid.appendChild(document.createElement('div'));
  ['Mon','Tue','Wed','Thu','Fri'].forEach(d=>{
    const h=document.createElement('div');h.textContent=d;grid.appendChild(h);
  });
  // periods
  periodLabels.forEach((pl,idx)=>{
    const label=document.createElement('div');label.textContent=pl;grid.appendChild(label);
    for(let c=0;c<5;c++)grid.appendChild(document.createElement('div'));
  });
  // lessons today
  lessons.filter(l=>l.date===currentDate).forEach(l=>{
    const col=0;const row=l.period-1; // Mon only for demo
    const cellIdx=1+col+(row*6)+1;
    const cell=grid.children[cellIdx];
    const cls=classes.find(c=>c.id===l.classId);
    const div=document.createElement('div');
    div.className='lesson';div.style.background=cls.color;div.textContent=l.title;
    cell.appendChild(div);
  });
}

/**************  Class Management **************/
function setupClassModal(){
  const modal=document.getElementById('classModal');
  document.getElementById('addClassBtn').onclick=()=>{modal.classList.remove('hidden');};
  document.getElementById('cancelClassBtn').onclick=()=>{modal.classList.add('hidden');};
  document.getElementById('saveClassBtn').onclick=()=>{
    const name=document.getElementById('className').value.trim();
    if(!name)return alert('Enter name');
    classes.push({id:'cls_'+Date.now(),name,
      color:document.getElementById('classColor').value,
      period:+document.getElementById('classPeriod').value});
    modal.classList.add('hidden');
    renderClassList();renderCalendar();renderDashboard();
  };
}
function renderClassList(){
  const ul=document.getElementById('classList');
  ul.innerHTML=classes.map(c=>`<li class="class-item">
    <span style="color:${c.color}">${c.name} (P${c.period})</span>
    <button class="delete-btn" data-id="${c.id}">✖</button></li>`).join('');
  ul.querySelectorAll('.delete-btn').forEach(btn=>{
    btn.onclick=()=>{classes=classes.filter(c=>c.id!==btn.dataset.id);
      renderClassList();renderCalendar();renderDashboard();}
  });
}

/**************  Render All **************/
function renderAll(){renderDashboard();renderCalendar();renderClassList();}
