/* ---------- Password Gate ---------- */
const PASSWORD = 'teacher123';
let authenticated = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm').addEventListener('submit', login);
  if (!authenticated) document.getElementById('loginModal').classList.remove('hidden');
});

function login(e){
  e.preventDefault();
  const pw = document.getElementById('loginPassword').value;
  if (pw === PASSWORD){
    authenticated = true;
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  } else {
    document.getElementById('loginError').classList.remove('hidden');
  }
}

/* ---------- Data ---------- */
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
let currentDate = today();

/* ---------- Init after login ---------- */
function initApp(){
  setupNavigation();
  setupCalendarControls();
  setupClassModal();
  renderAll();
}

/* Navigation */
function setupNavigation(){
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      document.getElementById(btn.dataset.view+'View').classList.add('active');
    };
  });
}

/* Dashboard */
function renderDashboard(){
  const week = lessons.filter(l=>l.date>=today()).length;
  document.getElementById('quickStats').innerHTML = `
    <div class="stat-card">Lessons<br>${lessons.length}</div>
    <div class="stat-card">This Week<br>${week}</div>
    <div class="stat-card">Classes<br>${classes.length}</div>`;
  document.getElementById('recentLessons').innerHTML =
    lessons.slice(-5).reverse().map(l=>{
      const c=classes.find(cls=>cls.id===l.classId);
      return `<li>${l.title} – <span style="color:${c.color}">${c.name}</span></li>`;
    }).join('');
}

/* Calendar */
function setupCalendarControls(){
  const dp=document.getElementById('datePicker');
  dp.value=currentDate;
  dp.onchange=e=>{currentDate=e.target.value;renderCalendar();};
  document.getElementById('prevDayBtn').onclick=()=>shiftDate(-1);
  document.getElementById('nextDayBtn').onclick=()=>shiftDate(1);
}
function shiftDate(offset){
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
    const h=document.createElement('div');h.textContent=d;h.className='calendar-day-header';grid.appendChild(h);
  });
  // period labels + empty cells
  periodLabels.forEach((pl,idx)=>{
    const lbl=document.createElement('div');lbl.textContent=pl;grid.appendChild(lbl);
    for(let c=0;c<5;c++)grid.appendChild(document.createElement('div'));
  });
  // today’s lessons (Monday column demo)
  lessons.filter(l=>l.date===currentDate).forEach(l=>{
    const row=l.period-1;
    const cellIdx=1+0+row*6+1; // Monday column
    const cell=grid.children[cellIdx];
    if(cell){
      const cls=classes.find(c=>c.id===l.classId);
      const div=document.createElement('div');
      div.className='lesson';div.textContent=l.title;div.style.background=cls.color;
      cell.appendChild(div);
    }
  });
}

/* Classes */
function setupClassModal(){
  const modal=document.getElementById('classModal');
  document.getElementById('addClassBtn').onclick=()=>modal.classList.remove('hidden');
  document.getElementById('cancelClassBtn').onclick=()=>modal.classList.add('hidden');
  document.getElementById('saveClassBtn').onclick=()=>{
    const name=document.getElementById('className').value.trim();
    if(!name)return alert('Enter name');
    classes.push({
      id:'cls_'+Date.now(),
      name,
      color:document.getElementById('classColor').value,
      period:+document.getElementById('classPeriod').value
    });
    modal.classList.add('hidden');
    renderClasses();renderCalendar();renderDashboard();
  };
}
function renderClasses(){
  const ul=document.getElementById('classList');
  ul.innerHTML=classes.map(c=>`<li class="class-item">
    <span style="color:${c.color}">${c.name} (P${c.period})</span>
    <button class="delete-btn" data-id="${c.id}">✖</button></li>`).join('');
  ul.querySelectorAll('.delete-btn').forEach(btn=>{
    btn.onclick=()=>{classes=classes.filter(c=>c.id!==btn.dataset.id);
      renderClasses();renderCalendar();renderDashboard();}
  });
}

/* Render all */
function renderAll(){renderDashboard();renderCalendar();renderClasses();}
