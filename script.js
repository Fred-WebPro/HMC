const tg = window.Telegram.WebApp;
tg.expand();

// === MOCK DATABASE (Имитация Бэкенда) ===
// В реальности эти данные прилетают по API из базы данных Python
const DB = {
    experts: [
        {
            id: 101,
            name: "Елена Власова",
            spec: "Клинический психолог",
            category: "psychology",
            price: 5000,
            rating: 4.9,
            reviews_count: 84,
            exp: "8 лет",
            about: "Специализируюсь на тревожных расстройствах и выгорании. Помогаю вернуть вкус к жизни. Работаю в когнитивно-поведенческом подходе.",
            img: "https://randomuser.me/api/portraits/women/44.jpg",
            tags: ["Тревога", "Депрессия", "Отношения"]
        },
        {
            id: 102,
            name: "Марк Стивенс",
            spec: "Бизнес-коуч",
            category: "business",
            price: 15000,
            rating: 5.0,
            reviews_count: 210,
            exp: "12 лет",
            about: "Помогаю предпринимателям масштабировать бизнес и выходить из операционки. Работал с топ-менеджерами Google.",
            img: "https://randomuser.me/api/portraits/men/32.jpg",
            tags: ["Стартапы", "Лидерство", "Масштабирование"]
        },
        {
            id: 103,
            name: "Алина Громова",
            spec: "Нутрициолог",
            category: "nutrition",
            price: 3500,
            rating: 4.8,
            reviews_count: 45,
            exp: "4 года",
            about: "Составлю рацион без голодовок. Коррекция веса через любовь к себе и научный подход.",
            img: "https://randomuser.me/api/portraits/women/68.jpg",
            tags: ["Похудение", "Здоровье", "БАДы"]
        }
    ],
    bookings: [] // Сюда будем сохранять записи
};

// === ЛОГИКА ИНТЕРФЕЙСА ===

// 1. Инициализация и рендер списка
function renderExperts(filter = 'all') {
    const container = document.getElementById('expertsList');
    container.innerHTML = '';

    const filtered = filter === 'all' 
        ? DB.experts 
        : DB.experts.filter(e => e.category === filter);

    filtered.forEach(expert => {
        const div = document.createElement('div');
        div.className = 'expert-card';
        div.onclick = () => openExpertDetails(expert.id);
        div.innerHTML = `
            <img src="${expert.img}" class="expert-img">
            <div class="expert-info">
                <div class="expert-name">${expert.name} <i class="fas fa-check-circle verified-badge"></i></div>
                <div class="expert-spec">${expert.spec}</div>
                <div class="expert-meta">
                    <span><i class="fas fa-star" style="color:#ffc107"></i> ${expert.rating}</span>
                    <span>${expert.price} ₽</span>
                </div>
            </div>
            <i class="fas fa-chevron-right" style="color:var(--hint); align-self:center;"></i>
        `;
        container.appendChild(div);
    });
}

// 2. Открытие профиля эксперта
let currentExpert = null;

function openExpertDetails(id) {
    currentExpert = DB.experts.find(e => e.id === id);
    const content = document.getElementById('expertDetailsContent');
    
    // Генерируем теги
    const tagsHtml = currentExpert.tags.map(t => `<span style="background:#eee; padding:4px 8px; border-radius:6px; font-size:12px; margin-right:5px;">${t}</span>`).join('');

    content.innerHTML = `
        <img src="${currentExpert.img}" class="details-cover">
        <div class="details-body">
            <h1 style="margin:0">${currentExpert.name} <i class="fas fa-check-circle verified-badge"></i></h1>
            <p style="color:var(--primary); font-weight:600">${currentExpert.spec}</p>
            
            <div style="display:flex; justify-content:space-between; margin:20px 0; padding:15px; background:var(--secondary-bg); border-radius:12px;">
                <div style="text-align:center">
                    <div style="font-weight:700">${currentExpert.rating}</div>
                    <div style="font-size:11px; color:var(--hint)">Рейтинг</div>
                </div>
                <div style="text-align:center">
                    <div style="font-weight:700">${currentExpert.exp}</div>
                    <div style="font-size:11px; color:var(--hint)">Опыт</div>
                </div>
                <div style="text-align:center">
                    <div style="font-weight:700">${currentExpert.reviews_count}</div>
                    <div style="font-size:11px; color:var(--hint)">Отзывов</div>
                </div>
            </div>

            <h3>Обо мне</h3>
            <p style="font-size:14px; line-height:1.5; color:var(--hint)">${currentExpert.about}</p>
            
            <div style="margin:15px 0">${tagsHtml}</div>

            <button class="main-btn" onclick="openBookingSheet()">Записаться за ${currentExpert.price} ₽</button>
        </div>
    `;
    switchView('view-expert');
}

// 3. Календарь и Бронирование
function openBookingSheet() {
    document.getElementById('overlay').style.display = 'block';
    setTimeout(() => document.getElementById('overlay').style.opacity = '1', 10);
    document.getElementById('bookingSheet').style.transform = 'translateY(0)';
    
    renderCalendarDates();
    renderTimeSlots();
}

function closeBookingSheet() {
    document.getElementById('bookingSheet').style.transform = 'translateY(100%)';
    document.getElementById('overlay').style.opacity = '0';
    setTimeout(() => document.getElementById('overlay').style.display = 'none', 300);
}

function renderCalendarDates() {
    const strip = document.getElementById('calendarStrip');
    strip.innerHTML = '';
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const today = new Date();
    
    for(let i=0; i<10; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        
        const el = document.createElement('div');
        el.className = `date-card ${i===0 ? 'selected' : ''}`;
        el.innerHTML = `
            <span class="day-name">${days[d.getDay()]}</span>
            <span class="day-num">${d.getDate()}</span>
        `;
        el.onclick = () => {
            document.querySelectorAll('.date-card').forEach(c => c.classList.remove('selected'));
            el.classList.add('selected');
        };
        strip.appendChild(el);
    }
}

function renderTimeSlots() {
    const grid = document.getElementById('timeGrid');
    grid.innerHTML = '';
    const times = ['10:00', '11:30', '14:00', '16:15', '19:00'];
    
    times.forEach(t => {
        const el = document.createElement('div');
        el.className = 'time-slot';
        el.innerText = t;
        el.onclick = () => {
            document.querySelectorAll('.time-slot').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            tg.MainButton.setText(`Оплатить ${currentExpert.price} ₽`);
            tg.MainButton.show();
        };
        grid.appendChild(el);
    });
}

// Обработка оплаты и записи
tg.MainButton.onClick(() => {
    tg.MainButton.showProgress();
    
    // Имитация задержки сервера
    setTimeout(() => {
        tg.MainButton.hideProgress();
        tg.MainButton.hide();
        closeBookingSheet();
        
        // Сохраняем в "Базу"
        DB.bookings.push({
            expert: currentExpert.name,
            price: currentExpert.price,
            date: new Date().toLocaleDateString()
        });
        
        tg.showPopup({
            title: 'Успешно!',
            message: 'Вы записаны на консультацию.',
            buttons: [{type: 'ok'}]
        }, () => {
            switchView('view-profile');
            renderMyBookings();
        });
    }, 1000);
});

// Рендер личного кабинета
function renderMyBookings() {
    const list = document.getElementById('myBookingsList');
    if (DB.bookings.length === 0) return;
    
    list.innerHTML = '';
    DB.bookings.forEach(b => {
        list.innerHTML += `
            <div class="expert-card">
                <div class="expert-info">
                    <div class="expert-name">${b.expert}</div>
                    <div class="expert-spec">Запись подтверждена</div>
                    <div class="expert-meta">${b.date} • Оплачено ${b.price} ₽</div>
                </div>
            </div>
        `;
    });
}

// Утилиты
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    // Обновляем таббар
    if (viewId === 'view-home') updateTabs(0);
    if (viewId === 'view-profile') updateTabs(1);
    
    window.scrollTo(0,0);
}

function updateTabs(index) {
    document.querySelectorAll('.tab-item').forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}

document.getElementById('overlay').onclick = closeBookingSheet;

// Фильтры
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', function() {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        renderExperts(this.dataset.cat);
    });
});

// Старт
renderExperts();