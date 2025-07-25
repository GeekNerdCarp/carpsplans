// EduPlan - Lesson Planning Application
class EduPlanApp {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.currentSection = 'dashboard';
        
        // Sample data
        this.sampleClasses = [
            {"id": 1, "name": "Mathematics", "color": "#4CAF50", "description": "Algebra, Geometry, Statistics"},
            {"id": 2, "name": "English Language Arts", "color": "#2196F3", "description": "Reading, Writing, Literature"},
            {"id": 3, "name": "Science", "color": "#FF9800", "description": "Biology, Chemistry, Physics"},
            {"id": 4, "name": "Social Studies", "color": "#9C27B0", "description": "History, Geography, Civics"},
            {"id": 5, "name": "Physical Education", "color": "#F44336", "description": "Fitness, Sports, Health"}
        ];
        
        this.samplePeriods = [
            {"id": 1, "name": "1st Period", "startTime": "08:00", "endTime": "08:50"},
            {"id": 2, "name": "2nd Period", "startTime": "09:00", "endTime": "09:50"},
            {"id": 3, "name": "3rd Period", "startTime": "10:00", "endTime": "10:50"},
            {"id": 4, "name": "4th Period", "startTime": "11:00", "endTime": "11:50"},
            {"id": 5, "name": "5th Period", "startTime": "13:00", "endTime": "13:50"},
            {"id": 6, "name": "6th Period", "startTime": "14:00", "endTime": "14:50"},
            {"id": 7, "name": "7th Period", "startTime": "15:00", "endTime": "15:50"}
        ];
    }
    
    async init() {
        try {
            await this.initDB();
            this.initEventListeners();
            this.checkAuthStatus();
            this.updateCurrentDate();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }
    
    // Database Management
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EduPlanDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create stores
                if (!db.objectStoreNames.contains('classes')) {
                    const classStore = db.createObjectStore('classes', { keyPath: 'id', autoIncrement: true });
                    classStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('periods')) {
                    const periodStore = db.createObjectStore('periods', { keyPath: 'id', autoIncrement: true });
                    periodStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('lessons')) {
                    const lessonStore = db.createObjectStore('lessons', { keyPath: 'id', autoIncrement: true });
                    lessonStore.createIndex('date', 'date', { unique: false });
                    lessonStore.createIndex('classId', 'classId', { unique: false });
                    lessonStore.createIndex('periodId', 'periodId', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }
    
    async initializeDefaultData() {
        try {
            const classCount = await this.getDataCount('classes');
            const periodCount = await this.getDataCount('periods');
            
            if (classCount === 0) {
                for (const cls of this.sampleClasses) {
                    await this.saveData('classes', cls);
                }
            }
            
            if (periodCount === 0) {
                for (const period of this.samplePeriods) {
                    await this.saveData('periods', period);
                }
            }
        } catch (error) {
            console.error('Failed to initialize default data:', error);
        }
    }
    
    async getDataCount(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getData(storeName, id = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            if (id) {
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            }
        });
    }
    
    async deleteData(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    // Authentication
    checkAuthStatus() {
        const isLoggedIn = localStorage.getItem('eduplan_logged_in');
        if (isLoggedIn === 'true') {
            this.showMainApp();
        } else {
            this.showLogin();
        }
    }
    
    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }
    
    async showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        await this.initializeDefaultData();
        await this.loadDashboard();
    }
    
    login(password) {
        if (password === 'W@nker007!') {
            localStorage.setItem('eduplan_logged_in', 'true');
            this.showMainApp();
            return true;
        }
        return false;
    }
    
    logout() {
        localStorage.removeItem('eduplan_logged_in');
        this.showLogin();
    }
    
    // Event Listeners
    initEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const password = document.getElementById('password').value;
                const errorElement = document.getElementById('loginError');
                
                if (this.login(password)) {
                    errorElement.classList.add('hidden');
                    document.getElementById('password').value = '';
                } else {
                    errorElement.classList.remove('hidden');
                }
            });
        }
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });
        
        // Header actions
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.showSearchModal());
        }
        
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportModal());
        }
        
        // Calendar controls
        const prevMonth = document.getElementById('prevMonth');
        if (prevMonth) {
            prevMonth.addEventListener('click', () => this.navigateMonth(-1));
        }
        
        const nextMonth = document.getElementById('nextMonth');
        if (nextMonth) {
            nextMonth.addEventListener('click', () => this.navigateMonth(1));
        }
        
        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.goToToday());
        }
        
        // Class management
        const addClassBtn = document.getElementById('addClassBtn');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', () => this.showClassModal());
        }
        
        const classForm = document.getElementById('classForm');
        if (classForm) {
            classForm.addEventListener('submit', (e) => this.handleClassForm(e));
        }
        
        // Period management
        const addPeriodBtn = document.getElementById('addPeriodBtn');
        if (addPeriodBtn) {
            addPeriodBtn.addEventListener('click', () => this.showPeriodModal());
        }
        
        const periodForm = document.getElementById('periodForm');
        if (periodForm) {
            periodForm.addEventListener('submit', (e) => this.handlePeriodForm(e));
        }
        
        // Lesson management
        const newLessonBtn = document.getElementById('newLessonBtn');
        if (newLessonBtn) {
            newLessonBtn.addEventListener('click', () => this.showLessonModal());
        }
        
        const lessonForm = document.getElementById('lessonForm');
        if (lessonForm) {
            lessonForm.addEventListener('submit', (e) => this.handleLessonForm(e));
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });
        
        // Filter listeners
        const filterClass = document.getElementById('filterClass');
        if (filterClass) {
            filterClass.addEventListener('change', () => this.filterLessons());
        }
        
        const filterPeriod = document.getElementById('filterPeriod');
        if (filterPeriod) {
            filterPeriod.addEventListener('change', () => this.filterLessons());
        }
        
        const filterDate = document.getElementById('filterDate');
        if (filterDate) {
            filterDate.addEventListener('change', () => this.filterLessons());
        }
        
        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        // Export
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.exportData());
        }
    }
    
    // Navigation
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Show section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(`${sectionName}Section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Load section data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'calendar':
                this.loadCalendar();
                break;
            case 'classes':
                this.loadClasses();
                break;
            case 'periods':
                this.loadPeriods();
                break;
            case 'lessons':
                this.loadLessons();
                break;
        }
    }
    
    // Dashboard
    async loadDashboard() {
        await this.updateStats();
        await this.loadTodaySchedule();
        await this.loadRecentLessons();
    }
    
    async updateStats() {
        try {
            const classes = await this.getData('classes');
            const lessons = await this.getData('lessons');
            const periods = await this.getData('periods');
            
            const totalClassesEl = document.getElementById('totalClasses');
            const totalLessonsEl = document.getElementById('totalLessons');
            const totalPeriodsEl = document.getElementById('totalPeriods');
            
            if (totalClassesEl) totalClassesEl.textContent = classes.length;
            if (totalLessonsEl) totalLessonsEl.textContent = lessons.length;
            if (totalPeriodsEl) totalPeriodsEl.textContent = periods.length;
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }
    
    async loadTodaySchedule() {
        try {
            const today = this.formatDate(new Date());
            const lessons = await this.getData('lessons');
            const todayLessons = lessons.filter(lesson => lesson.date === today);
            
            const scheduleElement = document.getElementById('todaySchedule');
            if (!scheduleElement) return;
            
            if (todayLessons.length === 0) {
                scheduleElement.innerHTML = '<p>No lessons scheduled for today</p>';
                return;
            }
            
            const classes = await this.getData('classes');
            const periods = await this.getData('periods');
            
            const scheduleHTML = todayLessons.map(lesson => {
                const cls = classes.find(c => c.id === lesson.classId);
                const period = periods.find(p => p.id === lesson.periodId);
                
                return `
                    <div class="schedule-item">
                        <strong>${period ? period.name : 'Unknown Period'}</strong> - 
                        ${cls ? cls.name : 'Unknown Class'}: ${lesson.title}
                    </div>
                `;
            }).join('');
            
            scheduleElement.innerHTML = scheduleHTML;
        } catch (error) {
            console.error('Failed to load today schedule:', error);
        }
    }
    
    async loadRecentLessons() {
        try {
            const lessons = await this.getData('lessons');
            const recentLessons = lessons
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
                
            const recentElement = document.getElementById('recentLessons');
            if (!recentElement) return;
            
            if (recentLessons.length === 0) {
                recentElement.innerHTML = '<p>No recent lessons</p>';
                return;
            }
            
            const classes = await this.getData('classes');
            
            const recentHTML = recentLessons.map(lesson => {
                const cls = classes.find(c => c.id === lesson.classId);
                return `
                    <div class="recent-lesson-item">
                        <strong>${lesson.title}</strong><br>
                        <small>${cls ? cls.name : 'Unknown Class'} - ${this.formatDate(new Date(lesson.date))}</small>
                    </div>
                `;
            }).join('');
            
            recentElement.innerHTML = recentHTML;
        } catch (error) {
            console.error('Failed to load recent lessons:', error);
        }
    }
    
    updateCurrentDate() {
        const currentDateEl = document.getElementById('currentDate');
        if (currentDateEl) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
        }
    }
    
    // Calendar
    async loadCalendar() {
        this.updateCalendarHeader();
        await this.renderCalendar();
    }
    
    updateCalendarHeader() {
        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) {
            const options = { year: 'numeric', month: 'long' };
            currentMonthEl.textContent = this.currentDate.toLocaleDateString('en-US', options);
        }
    }
    
    async renderCalendar() {
        try {
            const lessons = await this.getData('lessons');
            const calendarGrid = document.getElementById('calendarGrid');
            if (!calendarGrid) return;
            
            // Clear previous calendar
            calendarGrid.innerHTML = '';
            
            // Add day headers
            const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayHeaders.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day-header';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });
            
            // Get first day of month and number of days
            const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            // Generate calendar days
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = date.getDate();
                
                const dateStr = this.formatDate(date);
                const dayLessons = lessons.filter(lesson => lesson.date === dateStr);
                
                // Add classes based on date
                if (date.getMonth() !== this.currentDate.getMonth()) {
                    dayElement.classList.add('other-month');
                }
                
                if (this.isToday(date)) {
                    dayElement.classList.add('today');
                }
                
                if (dayLessons.length > 0) {
                    dayElement.classList.add('has-lessons');
                    const indicator = document.createElement('div');
                    indicator.className = 'lesson-indicator';
                    dayElement.appendChild(indicator);
                }
                
                if (this.selectedDate && this.formatDate(this.selectedDate) === dateStr) {
                    dayElement.classList.add('selected');
                }
                
                dayElement.addEventListener('click', () => this.selectDate(date));
                calendarGrid.appendChild(dayElement);
            }
        } catch (error) {
            console.error('Failed to render calendar:', error);
        }
    }
    
    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
        this.showSelectedDateLessons();
    }
    
    async showSelectedDateLessons() {
        if (!this.selectedDate) return;
        
        try {
            const dateStr = this.formatDate(this.selectedDate);
            const lessons = await this.getData('lessons');
            const dateLessons = lessons.filter(lesson => lesson.date === dateStr);
            
            const titleElement = document.getElementById('selectedDateTitle');
            const lessonsElement = document.getElementById('selectedDateLessons');
            
            if (!titleElement || !lessonsElement) return;
            
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            titleElement.textContent = `Lessons for ${this.selectedDate.toLocaleDateString('en-US', options)}`;
            
            if (dateLessons.length === 0) {
                lessonsElement.innerHTML = `
                    <p>No lessons scheduled for this date.</p>
                    <button class="btn btn--primary btn--sm" onclick="app.createLessonForDate('${dateStr}')">
                        Create Lesson
                    </button>
                `;
                return;
            }
            
            const classes = await this.getData('classes');
            const periods = await this.getData('periods');
            
            const lessonsHTML = dateLessons.map(lesson => {
                const cls = classes.find(c => c.id === lesson.classId);
                const period = periods.find(p => p.id === lesson.periodId);
                
                return `
                    <div class="lesson-card">
                        <div class="lesson-header">
                            <div>
                                <h4 class="lesson-title">${lesson.title}</h4>
                                <div class="lesson-meta">
                                    <span>${cls ? cls.name : 'Unknown Class'}</span>
                                    <span>${period ? period.name : 'Unknown Period'}</span>
                                </div>
                            </div>
                            <div class="lesson-actions">
                                <button class="btn btn--outline btn--sm" onclick="app.editLesson(${lesson.id})">Edit</button>
                                <button class="btn btn--danger btn--sm" onclick="app.deleteLesson(${lesson.id})">Delete</button>
                            </div>
                        </div>
                        ${lesson.objectives ? `<p><strong>Objectives:</strong> ${lesson.objectives}</p>` : ''}
                    </div>
                `;
            }).join('');
            
            lessonsElement.innerHTML = lessonsHTML;
        } catch (error) {
            console.error('Failed to show selected date lessons:', error);
        }
    }
    
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.loadCalendar();
    }
    
    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.loadCalendar();
    }
    
    // Classes Management
    async loadClasses() {
        try {
            const classes = await this.getData('classes');
            const classesGrid = document.getElementById('classesGrid');
            if (!classesGrid) return;
            
            if (classes.length === 0) {
                classesGrid.innerHTML = '<div class="empty-state">No classes found. Add your first class to get started!</div>';
                return;
            }
            
            const classesHTML = classes.map(cls => `
                <div class="class-card">
                    <div class="class-color-bar" style="background-color: ${cls.color}"></div>
                    <h3>${cls.name}</h3>
                    <p class="class-description">${cls.description || 'No description'}</p>
                    <div class="class-actions">
                        <button class="btn btn--outline btn--sm" onclick="app.editClass(${cls.id})">Edit</button>
                        <button class="btn btn--danger btn--sm" onclick="app.deleteClass(${cls.id})">Delete</button>
                    </div>
                </div>
            `).join('');
            
            classesGrid.innerHTML = classesHTML;
        } catch (error) {
            console.error('Failed to load classes:', error);
        }
    }
    
    showClassModal(classId = null) {
        const modal = document.getElementById('classModal');
        const title = document.getElementById('classModalTitle');
        const form = document.getElementById('classForm');
        
        if (!modal || !title || !form) return;
        
        if (classId) {
            title.textContent = 'Edit Class';
            this.populateClassForm(classId);
        } else {
            title.textContent = 'Add New Class';
            form.reset();
        }
        
        form.dataset.classId = classId || '';
        this.showModal('classModal');
    }
    
    async populateClassForm(classId) {
        try {
            const cls = await this.getData('classes', classId);
            if (cls) {
                const classNameEl = document.getElementById('className');
                const classDescEl = document.getElementById('classDescription');
                const classColorEl = document.getElementById('classColor');
                
                if (classNameEl) classNameEl.value = cls.name;
                if (classDescEl) classDescEl.value = cls.description || '';
                if (classColorEl) classColorEl.value = cls.color;
            }
        } catch (error) {
            console.error('Failed to populate class form:', error);
        }
    }
    
    async handleClassForm(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            const classId = form.dataset.classId;
            
            const classNameEl = document.getElementById('className');
            const classDescEl = document.getElementById('classDescription');
            const classColorEl = document.getElementById('classColor');
            
            const classData = {
                name: classNameEl ? classNameEl.value : '',
                description: classDescEl ? classDescEl.value : '',
                color: classColorEl ? classColorEl.value : '#4CAF50'
            };
            
            if (classId) {
                classData.id = parseInt(classId);
            }
            
            await this.saveData('classes', classData);
            this.closeModal('classModal');
            this.loadClasses();
            this.updateClassSelects();
            this.updateStats();
        } catch (error) {
            console.error('Failed to handle class form:', error);
        }
    }
    
    async editClass(classId) {
        this.showClassModal(classId);
    }
    
    async deleteClass(classId) {
        if (confirm('Are you sure you want to delete this class? This will also delete all associated lessons.')) {
            try {
                await this.deleteData('classes', classId);
                
                // Delete associated lessons
                const lessons = await this.getData('lessons');
                const associatedLessons = lessons.filter(lesson => lesson.classId === classId);
                for (const lesson of associatedLessons) {
                    await this.deleteData('lessons', lesson.id);
                }
                
                this.loadClasses();
                this.updateClassSelects();
                this.updateStats();
            } catch (error) {
                console.error('Failed to delete class:', error);
            }
        }
    }
    
    // Periods Management
    async loadPeriods() {
        try {
            const periods = await this.getData('periods');
            const periodsList = document.getElementById('periodsList');
            if (!periodsList) return;
            
            if (periods.length === 0) {
                periodsList.innerHTML = '<div class="empty-state">No periods configured. Add your first period to get started!</div>';
                return;
            }
            
            // Sort periods by start time
            periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            const periodsHTML = periods.map(period => `
                <div class="period-item">
                    <div class="period-info">
                        <h4>${period.name}</h4>
                        <div class="period-time">${period.startTime} - ${period.endTime}</div>
                    </div>
                    <div class="period-actions">
                        <button class="btn btn--outline btn--sm" onclick="app.editPeriod(${period.id})">Edit</button>
                        <button class="btn btn--danger btn--sm" onclick="app.deletePeriod(${period.id})">Delete</button>
                    </div>
                </div>
            `).join('');
            
            periodsList.innerHTML = periodsHTML;
        } catch (error) {
            console.error('Failed to load periods:', error);
        }
    }
    
    showPeriodModal(periodId = null) {
        const modal = document.getElementById('periodModal');
        const title = document.getElementById('periodModalTitle');
        const form = document.getElementById('periodForm');
        
        if (!modal || !title || !form) return;
        
        if (periodId) {
            title.textContent = 'Edit Period';
            this.populatePeriodForm(periodId);
        } else {
            title.textContent = 'Add New Period';
            form.reset();
        }
        
        form.dataset.periodId = periodId || '';
        this.showModal('periodModal');
    }
    
    async populatePeriodForm(periodId) {
        try {
            const period = await this.getData('periods', periodId);
            if (period) {
                const periodNameEl = document.getElementById('periodName');
                const startTimeEl = document.getElementById('startTime');
                const endTimeEl = document.getElementById('endTime');
                
                if (periodNameEl) periodNameEl.value = period.name;
                if (startTimeEl) startTimeEl.value = period.startTime;
                if (endTimeEl) endTimeEl.value = period.endTime;
            }
        } catch (error) {
            console.error('Failed to populate period form:', error);
        }
    }
    
    async handlePeriodForm(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            const periodId = form.dataset.periodId;
            
            const periodNameEl = document.getElementById('periodName');
            const startTimeEl = document.getElementById('startTime');
            const endTimeEl = document.getElementById('endTime');
            
            const periodData = {
                name: periodNameEl ? periodNameEl.value : '',
                startTime: startTimeEl ? startTimeEl.value : '',
                endTime: endTimeEl ? endTimeEl.value : ''
            };
            
            if (periodId) {
                periodData.id = parseInt(periodId);
            }
            
            await this.saveData('periods', periodData);
            this.closeModal('periodModal');
            this.loadPeriods();
            this.updatePeriodSelects();
            this.updateStats();
        } catch (error) {
            console.error('Failed to handle period form:', error);
        }
    }
    
    async editPeriod(periodId) {
        this.showPeriodModal(periodId);
    }
    
    async deletePeriod(periodId) {
        if (confirm('Are you sure you want to delete this period? This will also delete all associated lessons.')) {
            try {
                await this.deleteData('periods', periodId);
                
                // Delete associated lessons
                const lessons = await this.getData('lessons');
                const associatedLessons = lessons.filter(lesson => lesson.periodId === periodId);
                for (const lesson of associatedLessons) {
                    await this.deleteData('lessons', lesson.id);
                }
                
                this.loadPeriods();
                this.updatePeriodSelects();
                this.updateStats();
            } catch (error) {
                console.error('Failed to delete period:', error);
            }
        }
    }
    
    // Lessons Management
    async loadLessons() {
        await this.updateClassSelects();
        await this.updatePeriodSelects();
        await this.renderLessons();
    }
    
    async renderLessons() {
        try {
            const lessons = await this.getData('lessons');
            const lessonsList = document.getElementById('lessonsList');
            if (!lessonsList) return;
            
            if (lessons.length === 0) {
                lessonsList.innerHTML = '<div class="empty-state">No lesson plans found. Create your first lesson plan to get started!</div>';
                return;
            }
            
            // Sort lessons by date (newest first)
            lessons.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const classes = await this.getData('classes');
            const periods = await this.getData('periods');
            
            const lessonsHTML = lessons.map(lesson => {
                const cls = classes.find(c => c.id === lesson.classId);
                const period = periods.find(p => p.id === lesson.periodId);
                
                return `
                    <div class="lesson-card">
                        <div class="lesson-header">
                            <div>
                                <h3 class="lesson-title">${lesson.title}</h3>
                                <div class="lesson-meta">
                                    <span>${this.formatDate(new Date(lesson.date))}</span>
                                    <span>${cls ? cls.name : 'Unknown Class'}</span>
                                    <span>${period ? period.name : 'Unknown Period'}</span>
                                </div>
                            </div>
                            <div class="lesson-actions">
                                <button class="btn btn--outline btn--sm" onclick="app.editLesson(${lesson.id})">Edit</button>
                                <button class="btn btn--secondary btn--sm" onclick="app.copyLesson(${lesson.id})">Copy</button>
                                <button class="btn btn--danger btn--sm" onclick="app.deleteLesson(${lesson.id})">Delete</button>
                            </div>
                        </div>
                        <div class="lesson-content">
                            ${lesson.objectives ? `
                                <div class="lesson-field">
                                    <div class="lesson-field-label">Objectives</div>
                                    <div class="lesson-field-content">${lesson.objectives}</div>
                                </div>
                            ` : ''}
                            ${lesson.activities ? `
                                <div class="lesson-field">
                                    <div class="lesson-field-label">Activities</div>
                                    <div class="lesson-field-content">${lesson.activities}</div>
                                </div>
                            ` : ''}
                            ${lesson.materials ? `
                                <div class="lesson-field">
                                    <div class="lesson-field-label">Materials</div>
                                    <div class="lesson-field-content">${lesson.materials}</div>
                                </div>
                            ` : ''}
                            ${lesson.homework ? `
                                <div class="lesson-field">
                                    <div class="lesson-field-label">Homework</div>
                                    <div class="lesson-field-content">${lesson.homework}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            lessonsList.innerHTML = lessonsHTML;
        } catch (error) {
            console.error('Failed to render lessons:', error);
        }
    }
    
    async updateClassSelects() {
        try {
            const classes = await this.getData('classes');
            const selects = ['lessonClass', 'filterClass'];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (!select) return;
                
                const currentValue = select.value;
                
                // Clear existing options (except first one for filters)
                if (selectId.startsWith('filter')) {
                    select.innerHTML = '<option value="">All Classes</option>';
                } else {
                    select.innerHTML = '<option value="">Select Class</option>';
                }
                
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.name;
                    select.appendChild(option);
                });
                
                select.value = currentValue;
            });
        } catch (error) {
            console.error('Failed to update class selects:', error);
        }
    }
    
    async updatePeriodSelects() {
        try {
            const periods = await this.getData('periods');
            const selects = ['lessonPeriod', 'filterPeriod'];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (!select) return;
                
                const currentValue = select.value;
                
                // Clear existing options (except first one for filters)
                if (selectId.startsWith('filter')) {
                    select.innerHTML = '<option value="">All Periods</option>';
                } else {
                    select.innerHTML = '<option value="">Select Period</option>';
                }
                
                periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
                periods.forEach(period => {
                    const option = document.createElement('option');
                    option.value = period.id;
                    option.textContent = period.name;
                    select.appendChild(option);
                });
                
                select.value = currentValue;
            });
        } catch (error) {
            console.error('Failed to update period selects:', error);
        }
    }
    
    showLessonModal(lessonId = null) {
        const modal = document.getElementById('lessonModal');
        const title = document.getElementById('lessonModalTitle');
        const form = document.getElementById('lessonForm');
        
        if (!modal || !title || !form) return;
        
        if (lessonId) {
            title.textContent = 'Edit Lesson Plan';
            this.populateLessonForm(lessonId);
        } else {
            title.textContent = 'New Lesson Plan';
            form.reset();
            // Set today's date as default
            const lessonDateEl = document.getElementById('lessonDate');
            if (lessonDateEl) {
                lessonDateEl.value = this.formatDate(new Date());
            }
        }
        
        form.dataset.lessonId = lessonId || '';
        this.showModal('lessonModal');
    }
    
    async populateLessonForm(lessonId) {
        try {
            const lesson = await this.getData('lessons', lessonId);
            if (lesson) {
                const fields = [
                    'lessonDate', 'lessonClass', 'lessonPeriod', 'lessonTitle',
                    'lessonObjectives', 'lessonActivities', 'lessonMaterials',
                    'lessonHomework', 'lessonNotes'
                ];
                
                fields.forEach(fieldId => {
                    const element = document.getElementById(fieldId);
                    if (element) {
                        const fieldName = fieldId.replace('lesson', '').toLowerCase();
                        if (fieldName === 'class') {
                            element.value = lesson.classId;
                        } else if (fieldName === 'period') {
                            element.value = lesson.periodId;
                        } else {
                            element.value = lesson[fieldName] || '';
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to populate lesson form:', error);
        }
    }
    
    async handleLessonForm(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            const lessonId = form.dataset.lessonId;
            
            const lessonData = {
                date: document.getElementById('lessonDate')?.value || '',
                classId: parseInt(document.getElementById('lessonClass')?.value || '0'),
                periodId: parseInt(document.getElementById('lessonPeriod')?.value || '0'),
                title: document.getElementById('lessonTitle')?.value || '',
                objectives: document.getElementById('lessonObjectives')?.value || '',
                activities: document.getElementById('lessonActivities')?.value || '',
                materials: document.getElementById('lessonMaterials')?.value || '',
                homework: document.getElementById('lessonHomework')?.value || '',
                notes: document.getElementById('lessonNotes')?.value || '',
                status: 'planned'
            };
            
            if (lessonId) {
                lessonData.id = parseInt(lessonId);
            }
            
            await this.saveData('lessons', lessonData);
            this.closeModal('lessonModal');
            
            if (this.currentSection === 'lessons') {
                this.renderLessons();
            }
            if (this.currentSection === 'calendar') {
                this.renderCalendar();
                this.showSelectedDateLessons();
            }
            
            this.updateStats();
        } catch (error) {
            console.error('Failed to handle lesson form:', error);
        }
    }
    
    async editLesson(lessonId) {
        this.showLessonModal(lessonId);
    }
    
    async copyLesson(lessonId) {
        try {
            const lesson = await this.getData('lessons', lessonId);
            if (lesson) {
                // Remove id to create a new lesson
                delete lesson.id;
                lesson.title = `Copy of ${lesson.title}`;
                
                // Set to tomorrow's date
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                lesson.date = this.formatDate(tomorrow);
                
                await this.saveData('lessons', lesson);
                this.renderLessons();
                this.updateStats();
            }
        } catch (error) {
            console.error('Failed to copy lesson:', error);
        }
    }
    
    async deleteLesson(lessonId) {
        if (confirm('Are you sure you want to delete this lesson plan?')) {
            try {
                await this.deleteData('lessons', lessonId);
                
                if (this.currentSection === 'lessons') {
                    this.renderLessons();
                }
                if (this.currentSection === 'calendar') {
                    this.renderCalendar();
                    this.showSelectedDateLessons();
                }
                
                this.updateStats();
            } catch (error) {
                console.error('Failed to delete lesson:', error);
            }
        }
    }
    
    async filterLessons() {
        try {
            const classFilter = document.getElementById('filterClass')?.value;
            const periodFilter = document.getElementById('filterPeriod')?.value;
            const dateFilter = document.getElementById('filterDate')?.value;
            
            const lessons = await this.getData('lessons');
            let filteredLessons = lessons;
            
            if (classFilter) {
                filteredLessons = filteredLessons.filter(lesson => lesson.classId == classFilter);
            }
            
            if (periodFilter) {
                filteredLessons = filteredLessons.filter(lesson => lesson.periodId == periodFilter);
            }
            
            if (dateFilter) {
                filteredLessons = filteredLessons.filter(lesson => lesson.date === dateFilter);
            }
            
            // Render filtered lessons
            this.renderFilteredLessons(filteredLessons);
        } catch (error) {
            console.error('Failed to filter lessons:', error);
        }
    }
    
    async renderFilteredLessons(lessons) {
        try {
            const lessonsList = document.getElementById('lessonsList');
            if (!lessonsList) return;
            
            if (lessons.length === 0) {
                lessonsList.innerHTML = '<div class="empty-state">No lessons match the current filters.</div>';
                return;
            }
            
            // Sort lessons by date (newest first)
            lessons.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const classes = await this.getData('classes');
            const periods = await this.getData('periods');
            
            const lessonsHTML = lessons.map(lesson => {
                const cls = classes.find(c => c.id === lesson.classId);
                const period = periods.find(p => p.id === lesson.periodId);
                
                return `
                    <div class="lesson-card">
                        <div class="lesson-header">
                            <div>
                                <h3 class="lesson-title">${lesson.title}</h3>
                                <div class="lesson-meta">
                                    <span>${this.formatDate(new Date(lesson.date))}</span>
                                    <span>${cls ? cls.name : 'Unknown Class'}</span>
                                    <span>${period ? period.name : 'Unknown Period'}</span>
                                </div>
                            </div>
                            <div class="lesson-actions">
                                <button class="btn btn--outline btn--sm" onclick="app.editLesson(${lesson.id})">Edit</button>
                                <button class="btn btn--secondary btn--sm" onclick="app.copyLesson(${lesson.id})">Copy</button>
                                <button class="btn btn--danger btn--sm" onclick="app.deleteLesson(${lesson.id})">Delete</button>
                            </div>
                        </div>
                        <div class="lesson-content">
                            ${lesson.objectives ? `
                                <div class="lesson-field">
                                    <div class="lesson-field-label">Objectives</div>
                                    <div class="lesson-field-content">${lesson.objectives}</div>
                                </div>
                            ` : ''}
                            ${lesson.activities ? `
                                <div class="lesson-field">
                                    <div class="lesson-field-label">Activities</div>
                                    <div class="lesson-field-content">${lesson.activities}</div>
                                </div>
                            ` : ''}
                            ${lesson.materials ? `
                                <div class="lesson-field">
                                    <div class="lesson-field-label">Materials</div>
                                    <div class="lesson-field-content">${lesson.materials}</div>
                                </div>
                            ` : ''}
                            ${lesson.homework ? `
                                <div class="lesson-field">
                                    <div class="lesson-field-label">Homework</div>
                                    <div class="lesson-field-content">${lesson.homework}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            lessonsList.innerHTML = lessonsHTML;
        } catch (error) {
            console.error('Failed to render filtered lessons:', error);
        }
    }
    
    createLessonForDate(dateStr) {
        this.showLessonModal();
        const lessonDateEl = document.getElementById('lessonDate');
        if (lessonDateEl) {
            lessonDateEl.value = dateStr;
        }
    }
    
    // Search functionality
    showSearchModal() {
        this.showModal('searchModal');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    async handleSearch(query) {
        try {
            const searchResults = document.getElementById('searchResults');
            if (!searchResults) return;
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }
            
            const lessons = await this.getData('lessons');
            const classes = await this.getData('classes');
            const periods = await this.getData('periods');
            
            const results = lessons.filter(lesson => {
                const cls = classes.find(c => c.id === lesson.classId);
                const period = periods.find(p => p.id === lesson.periodId);
                
                return (
                    lesson.title.toLowerCase().includes(query.toLowerCase()) ||
                    (lesson.objectives && lesson.objectives.toLowerCase().includes(query.toLowerCase())) ||
                    (lesson.activities && lesson.activities.toLowerCase().includes(query.toLowerCase())) ||
                    (cls && cls.name.toLowerCase().includes(query.toLowerCase())) ||
                    (period && period.name.toLowerCase().includes(query.toLowerCase()))
                );
            });
            
            if (results.length === 0) {
                searchResults.innerHTML = '<div class="empty-state">No lessons found matching your search.</div>';
                return;
            }
            
            const resultsHTML = results.map(lesson => {
                const cls = classes.find(c => c.id === lesson.classId);
                const period = periods.find(p => p.id === lesson.periodId);
                
                return `
                    <div class="search-result-item" onclick="app.openLessonFromSearch(${lesson.id})">
                        <div class="search-result-title">${lesson.title}</div>
                        <div class="search-result-meta">
                            ${this.formatDate(new Date(lesson.date))} • 
                            ${cls ? cls.name : 'Unknown Class'} • 
                            ${period ? period.name : 'Unknown Period'}
                        </div>
                    </div>
                `;
            }).join('');
            
            searchResults.innerHTML = resultsHTML;
        } catch (error) {
            console.error('Failed to handle search:', error);
        }
    }
    
    openLessonFromSearch(lessonId) {
        this.closeModal('searchModal');
        this.editLesson(lessonId);
    }
    
    // Export functionality
    showExportModal() {
        this.showModal('exportModal');
    }
    
    async exportData() {
        try {
            const data = {
                classes: await this.getData('classes'),
                periods: await this.getData('periods'),
                lessons: await this.getData('lessons'),
                exportDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `eduplan-backup-${this.formatDate(new Date())}.json`;
            link.click();
            
            this.closeModal('exportModal');
        } catch (error) {
            console.error('Failed to export data:', error);
        }
    }
    
    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
        }
    }
    
    // Utility functions
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
}

// Global functions for onclick handlers
window.showSection = function(section) {
    if (window.app) {
        window.app.showSection(section);
    }
};

window.closeModal = function(modalId) {
    if (window.app) {
        window.app.closeModal(modalId);
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EduPlanApp();
    window.app.init();
});