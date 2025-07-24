// LessonPlan Pro - Professional Lesson Planning Application
// Note: Local storage usage removed to comply with sandbox restrictions

class LessonPlanApp {
  constructor() {
    // Static period labels shared across the app
    this.periodLabels = [
      '1st Period',
      '2nd Period',
      '3rd Period',
      '4th Period',
      '5th Period',
      '6th Period',
      '7th Period'
    ];

    // Core in-memory data model
    this.data = {
      classes: [],
      lessons: [],
      templates: [],
      standards: [],
      settings: {
        theme: 'light',
        startOfWeek: 'sunday'
      }
    };

    // UI state helpers
    this.currentView = 'dashboard';
    this.currentCalendarView = 'week';
    this.currentCalendarDate = new Date();
    this.currentEditingLesson = null;
    this.searchIndex = new Map();

    // Initialize the app
    this.init();
  }

  init() {
    this.loadSampleData();
    this.initializeEventListeners();
    this.applySettings();
    this.showMainApp();
    this.renderAllViews();
  }

  /* --------------------------------------------------
     Data & Sample Seed
  -------------------------------------------------- */
  loadSampleData() {
    this.data.classes = [
      {
        id: 'cls_math_001',
        name: 'Algebra I',
        color: '#3498db',
        subject: 'Mathematics',
        gradeLevel: '9th Grade',
        room: 'Room 201',
        periods: [1]
      },
      {
        id: 'cls_eng_001',
        name: 'English 9',
        color: '#27ae60',
        subject: 'English Language Arts',
        gradeLevel: '9th Grade',
        room: 'Room 105',
        periods: [2]
      },
      {
        id: 'cls_sci_001',
        name: 'Physical Science',
        color: '#e67e22',
        subject: 'Science',
        gradeLevel: '9th Grade',
        room: 'Lab 3',
        periods: [3]
      }
    ];

    this.data.lessons = [
      {
        id: 'les_001',
        classId: 'cls_math_001',
        title: 'Solving Linear Equations',
        date: '2025-07-24',
        period: 1,
        status: 'ready',
        sections: {
          objective: 'Students will solve one-step and two-step linear equations.',
          materials: 'Textbook, whiteboard',
          instruction: 'Direct instruction followed by guided practice',
          assessment: 'Exit ticket with 3 problems',
          notes: 'Focus on inverse operations'
        },
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      },
      {
        id: 'les_002',
        classId: 'cls_eng_001',
        title: 'Character Analysis',
        date: '2025-07-24',
        period: 2,
        status: 'draft',
        sections: {
          objective: 'Analyze protagonist traits using textual evidence.',
          materials: 'Novel excerpt, character analysis worksheet',
          instruction: 'Read passage together, identify character traits',
          assessment: 'Character trait graphic organizer',
          notes: 'Provide scaffolding for struggling readers'
        },
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    ];

    this.data.templates = [
      {
        id: 'tpl_001',
        name: 'Standard Lesson Template',
        category: 'General',
        sections: {
          objective: 'Students will be able to...',
          materials: 'List materials needed',
          instruction: 'Lesson plan steps',
          assessment: 'How to assess learning',
          notes: 'Additional notes'
        }
      }
    ];

    this.data.standards = [
      {
        id: 'std_001',
        code: 'MATH.9.A.1',
        description: 'Solve linear equations in one variable',
        subject: 'Mathematics',
        gradeLevel: '9th Grade'
      }
    ];
  }

  /* --------------------------------------------------
     Initialisation & Event Hooks
  -------------------------------------------------- */
  initializeEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this.switchView(link.dataset.view);
      });
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.data.settings.theme = this.data.settings.theme === 'light' ? 'dark' : 'light';
        this.applySettings();
      });
    }

    // Search modal
    const searchBtn = document.getElementById('search-btn');
    const closeSearch = document.getElementById('close-search');
    const globalSearch = document.getElementById('global-search');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        document.getElementById('search-modal').classList.remove('hidden');
        if (globalSearch) globalSearch.focus();
      });
    }
    
    if (closeSearch) {
      closeSearch.addEventListener('click', () => {
        document.getElementById('search-modal').classList.add('hidden');
      });
    }
    
    if (globalSearch) {
      globalSearch.addEventListener('input', e => this.performSearch(e.target.value));
    }

    // Calendar controls
    const prevPeriod = document.getElementById('prev-period');
    const nextPeriod = document.getElementById('next-period');
    
    if (prevPeriod) {
      prevPeriod.addEventListener('click', () => this.navigateCalendar(-1));
    }
    
    if (nextPeriod) {
      nextPeriod.addEventListener('click', () => this.navigateCalendar(1));
    }

    document.querySelectorAll('.calendar-view-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.currentCalendarView = e.target.dataset.view;
        this.updateCalendarViewButtons();
        this.renderCalendar();
      });
    });

    // Lesson editor controls - Multiple buttons that should open the lesson editor
    const lessonButtons = [
      'new-lesson-btn',
      'create-lesson-btn', 
      'add-lesson-btn'
    ];
    
    lessonButtons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showLessonEditor();
        });
      }
    });

    // Lesson editor modal controls
    const closeLessonEditor = document.getElementById('close-lesson-editor');
    const cancelLesson = document.getElementById('cancel-lesson');
    const saveLesson = document.getElementById('save-lesson');
    const saveDraftLesson = document.getElementById('save-draft-lesson');

    if (closeLessonEditor) {
      closeLessonEditor.addEventListener('click', () => this.hideLessonEditor());
    }
    
    if (cancelLesson) {
      cancelLesson.addEventListener('click', () => this.hideLessonEditor());
    }
    
    if (saveLesson) {
      saveLesson.addEventListener('click', () => this.saveLessonFromEditor('ready'));
    }
    
    if (saveDraftLesson) {
      saveDraftLesson.addEventListener('click', () => this.saveLessonFromEditor('draft'));
    }

    // Lesson editor tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.switchLessonSection(e.target.dataset.section);
      });
    });

    // Settings controls
    const applySettingsBtn = document.getElementById('apply-settings-btn');
    if (applySettingsBtn) {
      applySettingsBtn.addEventListener('click', () => this.applySettingsFromForm());
    }

    // Modal background click close helper
    document.addEventListener('click', e => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
      }
    });

    // User menu dropdown
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });
      
      document.addEventListener('click', () => {
        userDropdown.classList.add('hidden');
      });
    }
  }

  /* --------------------------------------------------
     Settings / Theme helpers
  -------------------------------------------------- */
  applySettings() {
    document.documentElement.setAttribute('data-color-scheme', this.data.settings.theme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = this.data.settings.theme === 'dark' ? '☀️' : '🌙';
    }
    
    // Update settings form if present
    const settingsThemeSelect = document.getElementById('settings-theme-select');
    if (settingsThemeSelect) {
      settingsThemeSelect.value = this.data.settings.theme;
    }
  }

  applySettingsFromForm() {
    const settingsThemeSelect = document.getElementById('settings-theme-select');
    if (settingsThemeSelect) {
      this.data.settings.theme = settingsThemeSelect.value;
      this.applySettings();
      this.showNotification('Settings applied successfully!', 'success');
    }
  }

  /* --------------------------------------------------
     Main App Display
  -------------------------------------------------- */
  showMainApp() {
    const setupWizard = document.getElementById('setup-wizard');
    const mainApp = document.getElementById('main-app');
    
    if (setupWizard) setupWizard.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    
    this.switchView('dashboard');
  }

  /* --------------------------------------------------
     Navigation & View Rendering
  -------------------------------------------------- */
  switchView(view) {
    this.currentView = view;
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.view === view);
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
      targetView.classList.add('active');
    }
    
    // Update breadcrumb
    const currentViewEl = document.getElementById('current-view');
    if (currentViewEl) {
      currentViewEl.textContent = this.getViewTitle(view);
    }
    
    this.renderView(view);
  }

  renderView(view) {
    switch (view) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'calendar':
        this.renderCalendar();
        break;
      case 'lessons':
        this.renderLessons();
        break;
      case 'templates':
        this.renderTemplates();
        break;
      case 'classes':
        this.renderClasses();
        break;
      case 'standards':
        this.renderStandards();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
  }

  renderAllViews() {
    this.renderDashboard();
    this.renderLessons();
    this.renderTemplates();
    this.renderClasses();
    this.renderStandards();
    this.renderSettings();
    this.populateLessonFormSelects();
  }

  getViewTitle(key) {
    const map = {
      dashboard: 'Dashboard',
      calendar: 'Calendar',
      lessons: 'Plans',
      templates: 'Templates',
      classes: 'Classes',
      standards: 'Standards',
      settings: 'Settings'
    };
    return map[key] || key;
  }

  /* --------------------------------------------------
     Dashboard
  -------------------------------------------------- */
  renderDashboard() {
    this.updateStats();
    this.renderTodaysSchedule();
    this.renderRecentLessons();
  }

  updateStats() {
    const totalLessons = this.data.lessons.length;
    const totalTemplates = this.data.templates.length;
    const totalClasses = this.data.classes.length;

    const today = new Date();
    const start = this.getStartOfWeek(today);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const lessonsThisWeek = this.data.lessons.filter(l => {
      const d = new Date(l.date);
      return d >= start && d <= end;
    }).length;

    const elements = {
      'total-lessons': totalLessons,
      'lessons-this-week': lessonsThisWeek,
      'total-templates': totalTemplates,
      'total-classes': totalClasses
    };

    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  }

  renderTodaysSchedule() {
    const container = document.getElementById('todays-schedule');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lessons = this.data.lessons.filter(l => l.date === todayStr).sort((a, b) => a.period - b.period);

    if (!lessons.length) {
      container.innerHTML = '<div class="empty-state">No lessons scheduled for today</div>';
      return;
    }

    container.innerHTML = lessons.map(l => {
      const cls = this.data.classes.find(c => c.id === l.classId)?.name || '';
      return `<div class="schedule-item">
        <div>
          <div class="lesson-title">${l.title}</div>
          <div class="lesson-class">${cls}</div>
        </div>
        <div class="schedule-period">${this.periodLabels[l.period - 1]}</div>
      </div>`;
    }).join('');
  }

  renderRecentLessons() {
    const container = document.getElementById('recent-lessons');
    if (!container) return;

    const recent = [...this.data.lessons].sort((a, b) => new Date(b.modified) - new Date(a.modified)).slice(0, 5);

    if (!recent.length) {
      container.innerHTML = '<div class="empty-state">No recent lessons</div>';
      return;
    }

    container.innerHTML = recent.map(l => {
      const cls = this.data.classes.find(c => c.id === l.classId)?.name || '';
      return `<div class="lesson-item">
        <div>
          <div class="lesson-title">${l.title}</div>
          <div class="lesson-class">${cls}</div>
        </div>
        <div class="lesson-status lesson-status--${l.status}">${l.status}</div>
      </div>`;
    }).join('');
  }

  /* --------------------------------------------------
     Calendar
  -------------------------------------------------- */
  renderCalendar() {
    this.updateCalendarTitle();
    this.updateCalendarViewButtons();
    
    if (this.currentCalendarView === 'week') {
      this.renderWeekCalendar();
    } else {
      this.renderMonthCalendar();
    }
  }

  updateCalendarTitle() {
    const titleEl = document.getElementById('calendar-title');
    if (!titleEl) return;

    const opts = this.currentCalendarView === 'week' ? 
      { month: 'long', day: 'numeric', year: 'numeric' } : 
      { month: 'long', year: 'numeric' };
    
    titleEl.textContent = this.currentCalendarDate.toLocaleDateString('en-US', opts);
  }

  updateCalendarViewButtons() {
    document.querySelectorAll('.calendar-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.currentCalendarView);
    });
  }

  getStartOfWeek(date) {
    const d = new Date(date);
    const diff = d.getDate() - d.getDay() + (this.data.settings.startOfWeek === 'monday' ? 1 : 0);
    d.setDate(diff);
    return d;
  }

  navigateCalendar(step) {
    if (this.currentCalendarView === 'week') {
      this.currentCalendarDate.setDate(this.currentCalendarDate.getDate() + step * 7);
    } else {
      this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + step);
    }
    this.renderCalendar();
  }

  renderWeekCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const start = this.getStartOfWeek(this.currentCalendarDate);

    let html = '<div class="week-calendar">';

    // Header row
    html += '<div class="week-period-slot">Period</div>'; // header corner
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      html += `<div class="calendar-header-day">${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}</div>`;
    }

    // Period rows
    for (let p = 1; p <= 7; p++) {
      html += `<div class="week-period-slot">${this.periodLabels[p - 1]}</div>`;
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + i);
        const dayStr = dayDate.toISOString().split('T')[0];
        const lessons = this.data.lessons.filter(l => l.date === dayStr && l.period === p);
        html += '<div class="week-day-slot">';
        lessons.forEach(l => {
          html += `<div class="calendar-lesson" onclick="app.editLesson('${l.id}')">${l.title}</div>`;
        });
        html += '</div>';
      }
    }

    html += '</div>';
    container.innerHTML = html;
  }

  renderMonthCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    let html = '<div class="calendar-grid">';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(d => html += `<div class="calendar-header-day">${d}</div>`);

    // prev month filler
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      html += `<div class="calendar-day calendar-day--other-month"><div class="calendar-day-number">${prevMonthDays - i}</div></div>`;
    }

    const todayStr = new Date().toDateString();
    // current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStrISO = dateObj.toISOString().split('T')[0];
      const lessons = this.data.lessons.filter(l => l.date === dateStrISO);
      const isToday = dateObj.toDateString() === todayStr;
      html += `<div class="calendar-day ${isToday ? 'calendar-day--today' : ''}">`;
      html += `<div class="calendar-day-number">${d}</div>`;
      lessons.forEach(l => {
        html += `<div class="calendar-lesson" onclick="app.editLesson('${l.id}')">P${l.period}: ${l.title}</div>`;
      });
      html += '</div>';
    }

    // next month filler
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
    const remainder = totalCells - (startDay + daysInMonth);
    for (let i = 1; i <= remainder; i++) {
      html += `<div class="calendar-day calendar-day--other-month"><div class="calendar-day-number">${i}</div></div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /* --------------------------------------------------
     Lessons View
  -------------------------------------------------- */
  renderLessons() {
    const container = document.getElementById('lessons-grid');
    if (!container) return;

    const lessons = this.data.lessons;
    if (!lessons.length) {
      container.innerHTML = '<div class="empty-state"><h3>No lessons yet</h3><p>Create your first lesson to get started.</p></div>';
      return;
    }

    container.innerHTML = lessons.map(l => {
      const cls = this.data.classes.find(c => c.id === l.classId)?.name || '';
      const dateStr = new Date(l.date).toLocaleDateString();
      return `<div class="lesson-card">
        <div class="lesson-card-header">
          <div class="lesson-card-title">${l.title}</div>
          <div class="lesson-card-meta"><span>${cls}</span><span>${dateStr}</span><span>${this.periodLabels[l.period - 1]}</span></div>
        </div>
        <div class="lesson-card-body"><p>${l.sections.objective || 'No objective set'}</p></div>
        <div class="lesson-card-footer">
          <div class="lesson-status lesson-status--${l.status}">${l.status}</div>
          <div class="card-actions">
            <button class="card-action-btn" onclick="app.editLesson('${l.id}')" title="Edit">✏️</button>
            <button class="card-action-btn" onclick="app.duplicateLesson('${l.id}')" title="Duplicate">📋</button>
            <button class="card-action-btn" onclick="app.deleteLesson('${l.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  /* --------------------------------------------------
     Other Views (Templates, Classes, Standards, Settings)
  -------------------------------------------------- */
  renderTemplates() {
    const container = document.getElementById('templates-grid');
    if (!container) return;
    container.innerHTML = '<div class="empty-state"><h3>No templates yet</h3><p>Create your first template to get started.</p></div>';
  }

  renderClasses() {
    const container = document.getElementById('classes-grid');
    if (!container) return;
    
    const classes = this.data.classes;
    if (!classes.length) {
      container.innerHTML = '<div class="empty-state"><h3>No classes yet</h3><p>Add your first class to get started.</p></div>';
      return;
    }

    container.innerHTML = classes.map(c => {
      const lessonCount = this.data.lessons.filter(l => l.classId === c.id).length;
      return `<div class="class-card">
        <div class="class-card-header">
          <div class="class-card-title">
            <span class="class-color" style="background-color: ${c.color}"></span>
            ${c.name}
          </div>
          <div class="class-card-meta"><span>${c.subject}</span><span>${c.gradeLevel}</span><span>${c.room}</span></div>
        </div>
        <div class="class-card-body">
          <p><strong>Lessons:</strong> ${lessonCount}</p>
        </div>
      </div>`;
    }).join('');
  }

  renderStandards() {
    const container = document.getElementById('standards-list');
    if (!container) return;
    container.innerHTML = '<div class="empty-state">No standards loaded</div>';
  }

  renderSettings() {
    // Settings view is already rendered in HTML, just make sure form is populated
    this.applySettings();
  }

  /* --------------------------------------------------
     Lesson Editor
  -------------------------------------------------- */
  showLessonEditor(id = null) {
    this.currentEditingLesson = id;
    const modal = document.getElementById('lesson-editor');
    const titleEl = document.getElementById('lesson-editor-title');

    if (!modal || !titleEl) return;

    if (id) {
      titleEl.textContent = 'Edit Lesson';
      const lesson = this.data.lessons.find(l => l.id === id);
      this.populateLessonForm(lesson);
    } else {
      titleEl.textContent = 'Create Lesson';
      this.clearLessonForm();
    }

    this.populateLessonFormSelects();
    modal.classList.remove('hidden');
  }

  hideLessonEditor() {
    const modal = document.getElementById('lesson-editor');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.currentEditingLesson = null;
  }

  populateLessonForm(lesson) {
    if (!lesson) return;
    
    const fields = {
      'lesson-title': lesson.title,
      'lesson-class': lesson.classId,
      'lesson-date': lesson.date,
      'lesson-period': lesson.period,
      'lesson-objective': lesson.sections.objective,
      'lesson-materials': lesson.sections.materials,
      'lesson-instruction': lesson.sections.instruction,
      'lesson-assessment': lesson.sections.assessment,
      'lesson-notes': lesson.sections.notes
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    });
  }

  clearLessonForm() {
    const form = document.getElementById('lesson-form');
    if (form) {
      form.reset();
      const dateField = document.getElementById('lesson-date');
      if (dateField) {
        dateField.value = new Date().toISOString().split('T')[0];
      }
    }
  }

  populateLessonFormSelects() {
    // Classes
    const classSelect = document.getElementById('lesson-class');
    if (classSelect) {
      classSelect.innerHTML = '<option value="">Select Class</option>' + 
        this.data.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // Periods
    const periodSelect = document.getElementById('lesson-period');
    if (periodSelect) {
      periodSelect.innerHTML = '<option value="">Select Period</option>' + 
        this.periodLabels.map((lbl, idx) => `<option value="${idx + 1}">${lbl}</option>`).join('');
    }
  }

  switchLessonSection(sec) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sec);
    });
    document.querySelectorAll('.section').forEach(div => {
      div.classList.toggle('active', div.dataset.section === sec);
    });
  }

  saveLessonFromEditor(status) {
    const getData = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const lessonData = {
      title: getData('lesson-title'),
      classId: getData('lesson-class'),
      date: getData('lesson-date'),
      period: parseInt(getData('lesson-period'), 10),
      status,
      sections: {
        objective: getData('lesson-objective'),
        materials: getData('lesson-materials'),
        instruction: getData('lesson-instruction'),
        assessment: getData('lesson-assessment'),
        notes: getData('lesson-notes')
      },
      modified: new Date().toISOString()
    };

    if (!lessonData.title || !lessonData.classId || !lessonData.date || !lessonData.period) {
      alert('Please fill all required fields');
      return;
    }

    if (this.currentEditingLesson) {
      const idx = this.data.lessons.findIndex(l => l.id === this.currentEditingLesson);
      if (idx !== -1) {
        this.data.lessons[idx] = { ...this.data.lessons[idx], ...lessonData };
      }
    } else {
      this.data.lessons.push({ 
        ...lessonData, 
        id: this.generateId('les'), 
        created: new Date().toISOString() 
      });
    }

    this.hideLessonEditor();
    this.renderAllViews();
    this.showNotification('Lesson saved successfully!', 'success');
  }

  editLesson(id) {
    this.showLessonEditor(id);
  }

  duplicateLesson(id) {
    const lesson = this.data.lessons.find(l => l.id === id);
    if (!lesson) return;
    
    const copy = { 
      ...lesson, 
      id: this.generateId('les'), 
      title: lesson.title + ' (Copy)', 
      status: 'draft', 
      created: new Date().toISOString(), 
      modified: new Date().toISOString() 
    };
    
    this.data.lessons.push(copy);
    this.renderLessons();
    this.showNotification('Lesson duplicated successfully!', 'success');
  }

  deleteLesson(id) {
    if (confirm('Delete this lesson?')) {
      this.data.lessons = this.data.lessons.filter(l => l.id !== id);
      this.renderLessons();
      this.renderDashboard(); // Update dashboard stats
      this.showNotification('Lesson deleted successfully!', 'success');
    }
  }

  /* --------------------------------------------------
     Search
  -------------------------------------------------- */
  performSearch(query) {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;

    if (!query.trim()) {
      resultsEl.innerHTML = '';
      return;
    }
    
    const q = query.toLowerCase();
    const matches = this.data.lessons.filter(l => 
      l.title.toLowerCase().includes(q) || 
      l.sections.objective.toLowerCase().includes(q)
    );
    
    if (!matches.length) {
      resultsEl.innerHTML = '<div class="empty-state">No results found</div>';
      return;
    }
    
    resultsEl.innerHTML = matches.map(l => {
      const cls = this.data.classes.find(c => c.id === l.classId)?.name || '';
      return `<div class="search-result" onclick="app.editLesson('${l.id}')">
        <div class="search-result-title">${l.title}</div>
        <div class="search-result-meta">Lesson • ${cls} • ${this.periodLabels[l.period - 1]}</div>
      </div>`;
    }).join('');
  }

  /* --------------------------------------------------
     Utilities
  -------------------------------------------------- */
  generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
      color: white;
      border-radius: 6px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      notification.style.transition = 'all 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Instantiate global app object
const app = new LessonPlanApp();