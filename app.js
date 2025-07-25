// ----------------------
// LessonPlan Pro - Main JS
// ----------------------

/*
  STRICT INSTRUCTIONS NOTE:
  localStorage/sessionStorage usage is prohibited in this environment.
  Authentication state will live only in-memory for the current session.
*/

let isAuthenticated = false; // In-memory auth flag (resets on page reload)

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated) {
    showLoginModal();
  } else {
    showMainApp();
    initializeApp();
  }

  initializeLogin();
});

// ----------------------
// Authentication helpers
// ----------------------
function showLoginModal() {
  const loginModal = document.getElementById('loginModal');
  const mainAppContainer = document.getElementById('mainAppContainer');

  loginModal?.classList.remove('hidden');
  mainAppContainer?.classList.add('hidden');

  // Auto-focus password input
  setTimeout(() => document.getElementById('loginPassword')?.focus(), 100);
}

function hideLoginModal() {
  document.getElementById('loginModal')?.classList.add('hidden');
}

function showMainApp() {
  document.getElementById('mainAppContainer')?.classList.remove('hidden');
}

function initializeLogin() {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const passwordInput = document.getElementById('loginPassword');
    const entered = passwordInput.value;

    if (entered === 'teacher123') {
      isAuthenticated = true; // set flag for session

      hideLoginModal();
      showMainApp();
      loginError.classList.add('hidden');
      passwordInput.value = '';

      initializeApp();
    } else {
      loginError.classList.remove('hidden');
      passwordInput.value = '';
      passwordInput.focus();
    }
  });
}

// ----------------------
// Sample data (initial)
// ----------------------
let sampleClasses = [
  { id: 'cls_math_001', name: 'Algebra I', color: '#3498db', period: 1 },
  { id: 'cls_eng_001', name: 'English 9', color: '#27ae60', period: 2 },
  { id: 'cls_sci_001', name: 'Physical Science', color: '#e67e22', period: 3 }
];

let sampleLessons = [
  { id: 'lesson_001', classId: 'cls_math_001', title: 'Quadratic Equations', date: '2025-07-25' },
  { id: 'lesson_002', classId: 'cls_eng_001', title: 'Shakespeare Introduction', date: '2025-07-24' },
  { id: 'lesson_003', classId: 'cls_sci_001', title: "Newton's Laws", date: '2025-07-23' },
  { id: 'lesson_004', classId: 'cls_math_001', title: 'Graphing Functions', date: '2025-07-22' },
  { id: 'lesson_005', classId: 'cls_eng_001', title: 'Essay Writing', date: '2025-07-21' }
];

const periodLabels = [
  '1st Period',
  '2nd Period',
  '3rd Period',
  '4th Period',
  '5th Period',
  '6th Period',
  '7th Period'
];

// ----------------------
// Main initialisation
// ----------------------
function initializeApp() {
  console.log('Initialising app…');

  createScheduleGrid();
  initializeNavigation();
  initializeClassModal();

  // Initial renders
  renderDashboard();
  renderSchedule();
  renderClassesList();
  updateLessonClassDropdown();
}

// ----------------------
// UI: Navigation
// ----------------------
function initializeNavigation() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');

      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      document.getElementById(`${view}-view`)?.classList.add('active');

      document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
      link.classList.add('active');

      if (view === 'dashboard') renderDashboard();
    });
  });
}

// ----------------------
// Schedule grid
// ----------------------
function createScheduleGrid() {
  const grid = document.querySelector('.schedule-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (let i = 1; i <= 7; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'period-slot';
    wrapper.innerHTML = `
      <div class="period-header">${periodLabels[i - 1]}</div>
      <div id="period-${i}" class="period-content">
        <span style="color: var(--color-text-secondary);">No class assigned</span>
      </div>
    `;
    grid.appendChild(wrapper);
  }
}

// ----------------------
// Dashboard
// ----------------------
function renderDashboard() {
  renderTodaysSchedule();
  renderQuickStats();
  renderRecentLessons();
}

function renderTodaysSchedule() {
  const listEl = document.getElementById('todays-schedule-list');
  if (!listEl) return;

  if (sampleClasses.length === 0) {
    listEl.innerHTML = `<div class="empty-dashboard-state"><h4>No classes today</h4><p>Add classes to view schedule.</p></div>`;
    return;
  }

  const sorted = [...sampleClasses].sort((a, b) => a.period - b.period);
  listEl.innerHTML = sorted
    .map(
      (cls) => `
      <li>
        <div class="schedule-item-info">
          <div class="schedule-item-color" style="background-color:${cls.color}"></div>
          <div class="schedule-item-details">
            <h5>${cls.name}</h5>
            <p>${periodLabels[cls.period - 1]}</p>
          </div>
        </div>
        <div class="schedule-time">${getPeriodTime(cls.period)}</div>
      </li>`
    )
    .join('');
}

function renderQuickStats() {
  const container = document.getElementById('statsGrid');
  if (!container) return;

  const totalLessons = sampleLessons.length;
  const thisWeek = countLessonsThisWeek();
  const templates = Math.floor(totalLessons * 0.6);

  container.innerHTML = `
    <div class="stats-card"><h4>Total Lessons</h4><p class="stats-number">${totalLessons}</p></div>
    <div class="stats-card"><h4>This Week</h4><p class="stats-number">${thisWeek}</p></div>
    <div class="stats-card"><h4>Templates</h4><p class="stats-number">${templates}</p></div>
    <div class="stats-card"><h4>Classes</h4><p class="stats-number">${sampleClasses.length}</p></div>`;
}

function renderRecentLessons() {
  const list = document.getElementById('recent-lessons-list');
  if (!list) return;

  if (sampleLessons.length === 0) {
    list.innerHTML = `<div class="empty-dashboard-state"><h4>No lessons yet</h4><p>Create a lesson to see it here.</p></div>`;
    return;
  }

  const recent = [...sampleLessons]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  list.innerHTML = recent
    .map((lesson) => {
      const cls = sampleClasses.find((c) => c.id === lesson.classId) || {};
      return `
        <li>
          <div class="lesson-item-info">
            <div class="schedule-item-color" style="background-color:${cls.color || '#ccc'}"></div>
            <div class="lesson-item-details">
              <h5>${lesson.title}</h5>
              <p>${cls.name || 'Unknown Class'} • ${formatDate(lesson.date)}</p>
            </div>
          </div>
        </li>`;
    })
    .join('');
}

// ----------------------
// Class modal & CRUD
// ----------------------
function initializeClassModal() {
  const addBtn = document.getElementById('add-class-btn');
  const modal = document.getElementById('classModal');
  const overlay = document.getElementById('classModalOverlay');
  const closeBtn = document.getElementById('closeClassModal');
  const cancelBtn = document.getElementById('cancelClass');
  const form = document.getElementById('classForm');

  addBtn?.addEventListener('click', () => openClassModal());
  overlay?.addEventListener('click', () => closeClassModal());
  closeBtn?.addEventListener('click', () => closeClassModal());
  cancelBtn?.addEventListener('click', () => closeClassModal());

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleClassSubmit();
  });

  // Esc key close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeClassModal();
  });
}

function openClassModal() {
  document.getElementById('classModal')?.classList.remove('hidden');
  setTimeout(() => document.getElementById('className')?.focus(), 100);
}

function closeClassModal() {
  const modal = document.getElementById('classModal');
  const form = document.getElementById('classForm');
  modal?.classList.add('hidden');
  form?.reset();
}

function handleClassSubmit() {
  const name = document.getElementById('className').value.trim();
  const period = parseInt(document.getElementById('classPeriod').value, 10);
  const color = document.getElementById('classColor').value;

  if (!name || !period) {
    alert('Please fill in all required fields.');
    return;
  }

  const exists = sampleClasses.find((c) => c.period === period);
  if (exists) {
    const proceed = confirm(`Period ${period} already has "${exists.name}". Replace it?`);
    if (!proceed) return;
    deleteClass(exists.id, false);
  }

  addClass(name, period, color);
  closeClassModal();
}

function addClass(name, period, color) {
  const newCls = {
    id: `cls_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    period,
    color
  };
  sampleClasses.push(newCls);
  refreshAfterClassChange();
}

function deleteClass(id, confirmPrompt = true) {
  const found = sampleClasses.find((c) => c.id === id);
  if (!found) return;
  if (confirmPrompt && !confirm(`Delete "${found.name}"?`)) return;
  sampleClasses = sampleClasses.filter((c) => c.id !== id);
  refreshAfterClassChange();
}

function refreshAfterClassChange() {
  renderClassesList();
  renderSchedule();
  updateLessonClassDropdown();
  renderDashboard();
}

// List rendering helpers
function renderClassesList() {
  const container = document.getElementById('classes-list');
  if (!container) return;

  if (sampleClasses.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No classes yet</h3><p>Click "Add Class" to get started.</p></div>`;
    return;
  }

  const sorted = [...sampleClasses].sort((a, b) => a.period - b.period);
  container.innerHTML = sorted
    .map(
      (cls) => `
    <div class="class-item">
      <div class="class-info">
        <div class="class-color" style="background-color:${cls.color}"></div>
        <div class="class-details">
          <h3>${cls.name}</h3>
          <p>${periodLabels[cls.period - 1]}</p>
        </div>
      </div>
      <div class="class-actions">
        <button class="delete-btn" onclick="handleDeleteClick('${cls.id}')" title="Delete class">✖</button>
      </div>
    </div>`
    )
    .join('');
}

function renderSchedule() {
  for (let i = 1; i <= 7; i++) {
    const cell = document.getElementById(`period-${i}`);
    if (!cell) continue;
    cell.classList.remove('has-class');
    cell.innerHTML = '<span style="color: var(--color-text-secondary);">No class assigned</span>';
    cell.style.backgroundColor = '';
    cell.style.borderLeft = '';
  }

  sampleClasses.forEach((cls) => {
    const cell = document.getElementById(`period-${cls.period}`);
    if (!cell) return;
    cell.classList.add('has-class');
    cell.style.backgroundColor = `${cls.color}20`;
    cell.style.borderLeft = `4px solid ${cls.color}`;
    cell.innerHTML = `<div style="text-align:center;"><div style="font-weight:var(--font-weight-semibold);margin-bottom:var(--space-4);">${cls.name}</div><div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">${periodLabels[cls.period - 1]}</div></div>`;
  });
}

function updateLessonClassDropdown() {
  const select = document.getElementById('lesson-class');
  if (!select) return;
  select.innerHTML = '<option value="">Choose a class...</option>';
  const sorted = [...sampleClasses].sort((a, b) => a.period - b.period);
  sorted.forEach((cls) => {
    const opt = document.createElement('option');
    opt.value = cls.id;
    opt.textContent = `${cls.name} (${periodLabels[cls.period - 1]})`;
    select.appendChild(opt);
  });
}

// ----------------------
// Misc helpers
// ----------------------
function getPeriodTime(period) {
  const times = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'];
  return times[period - 1] || '';
}

function countLessonsThisWeek() {
  const today = new Date();
  const first = today.getDate() - today.getDay();
  const start = new Date(today.setDate(first));
  const end = new Date(today.setDate(first + 6));

  return sampleLessons.filter((l) => {
    const d = new Date(l.date);
    return d >= start && d <= end;
  }).length;
}

function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Expose delete handler globally
window.handleDeleteClick = (id) => deleteClass(id, true);
