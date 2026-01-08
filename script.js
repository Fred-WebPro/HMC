const tg = window.Telegram.WebApp;

// === НАСТРОЙКА ТЕЛЕГРАМ ===
tg.expand(); // На весь экран
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#3390ec'; // Фирменный синий цвет

// Глобальные переменные для хранения данных
let expertsData = []; // Сюда придут данные из Python
let currentExpert = null; // Какой эксперт сейчас открыт
let selectedDate = null; // Какую дату выбрал юзер
let localBookings = []; // Временное хранение записей для отображения в этом сеансе

// === 1. СВЯЗЬ С СЕРВЕРОМ (МОЗГИ) ===

// Функция получения списка экспертов из БД
async function fetchExperts() {
    // Показываем пользователю, что идет загрузка, пока сервер думает
    const container = document.getElementById('expertsList');
    container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Загрузка списка экспертов...</div>';

    try {
        // Делаем запрос к твоему файлу app.py
        const response = await fetch('/api/experts');
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        // Превращаем ответ сервера в JSON
        expertsData = await response.json();
        
        // Рисуем полученные данные
        renderExperts();
        
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        container.innerHTML = '<div style="text-align:center; color:red;">Ошибка подключения к серверу.<br>Попробуйте позже.</div>';
        tg.showAlert("Не удалось связаться с сервером");
    }
}

// Запускаем получение данных сразу при старте приложения
fetchExperts();


// === 2. ЛОГИКА ОТОБРАЖЕНИЯ (РЕНДЕР) ===

function renderExperts(filter = 'all') {
    const container = document.getElementById('expertsList');
    container.innerHTML = ''; // Очищаем экран

    // Фильтруем данные (если нажаты кнопки фильтров)
    const filtered = filter === 'all' 
        ? expertsData 
        : expertsData.filter(e => e.category === filter);

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Нет специалистов в этой категории</div>';
        return;
    }

    filtered.forEach(expert => {
        const div = document.createElement('div');
        div.className = 'expert-card';
        div.onclick = () => openExpertDetails(expert.id);
        
        // ВНИМАНИЕ: Поля (expert.name, expert.role) должны совпадать с тем, как они названы в Python базе
        div.innerHTML = `
            <img src="${expert.img || 'https://via.placeholder.com/70'}" class="expert-img">
            <div class="expert-info">
                <div class="expert-name">${expert.name} <i class="fas fa-check-circle verified-badge"></i></div>
                <div class="expert-spec">${expert.role}</div>
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

// Открытие карточки эксперта
function openExpertDetails(id) {
    currentExpert = expertsData.find(e => e.id === id);
    if (!currentExpert) return;

    const content = document.getElementById('expertDetailsContent');
    
    content.innerHTML = `
        <img src="${currentExpert.img}" class="details-cover">
        <div class="details-body">
            <h1 style="margin:0">${currentExpert.name} <i class="fas fa-check-circle verified-badge"></i></h1>
            <p style="color:var(--primary); font-weight:600">${currentExpert.role}</p>
            
            <div style="display:flex; justify-content:space-between; margin:20px 0; padding:15px; background:var(--secondary-bg); border-radius:12px;">
                <div style="text-align:center">
                    <div style="font-weight:700">${currentExpert.rating}</div>
                    <div style="font-size:11px; color:var(--hint)">Рейтинг</div>
                </div>
                <div style="text-align:center">
                    <div style="font-weight:700">5+ лет</div>
                    <div style="font-size:11px; color:var(--hint)">Опыт</div>
                </div>
                <div style="text-align:center">
                    <div style="font-weight:700">100+</div>
                    <div style="font-size:11px; color:var(--hint)">Отзывов</div>
                </div>
            </div>

            <h3>Обо мне</h3>
            <p style="font-size:14px; line-height:1.5; color:var(--hint)">${currentExpert.about || 'Описание не указано'}</p>
            
            <button class="main-btn" onclick="openBookingSheet()">Записаться за ${currentExpert.price} ₽</button>
        </div>
    `;
    switchView('view-expert');
}


// === 3. КАЛЕНДАРЬ И ЗАПИСЬ ===

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
    tg.MainButton.hide();
}

function renderCalendarDates() {
    const strip = document.getElementById('calendarStrip');
    strip.innerHTML = '';
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const today = new Date();
    
    for(let i=0; i<10; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        
        const dateString = d.toLocaleDateString(); // Для сохранения
        
        const el = document.createElement('div');
        el.className = `date-card ${i===0 ? 'selected' : ''}`;
        if (i===0) selectedDate = dateString; // По умолчанию сегодня

        el.innerHTML = `
            <span class="day-name">${days[d.getDay()]}</span>
            <span class="day-num">${d.getDate()}</span>
        `;
        el.onclick = () => {
            document.querySelectorAll('.date-card').forEach(c => c.classList.remove('selected'));
            el.classList.add('selected');
            selectedDate = dateString;
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
            
            // Показываем главную кнопку Telegram
            tg.MainButton.setText(`Оплатить ${currentExpert.price} ₽`);
            tg.MainButton.show();
        };
        grid.appendChild(el);
    });
}

// === 4. ОТПРАВКА ДАННЫХ НА СЕРВЕР (POST) ===

tg.MainButton.onClick(async () => {
    tg.MainButton.showProgress(); // Крутится колесико загрузки на кнопке

    const bookingData = {
        expertId: currentExpert.id,
        price: currentExpert.price,
        date: selectedDate
    };

    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Успех!
            tg.MainButton.hideProgress();
            tg.MainButton.hide();
            closeBookingSheet();
            
            // Добавляем запись в локальный список, чтобы показать юзеру прямо сейчас
            localBookings.push({
                expert: currentExpert.name,
                role: currentExpert.role,
                date: selectedDate,
                price: currentExpert.price
            });

            tg.showPopup({
                title: 'Оплата прошла!',
                message: 'Вы успешно записаны. Менеджер свяжется с вами.',
                buttons: [{type: 'ok'}]
            }, () => {
                switchView('view-profile');
                renderMyBookings();
            });
        } else {
            throw new Error('Server returned error');
        }

    } catch (error) {
        console.error('Ошибка записи:', error);
        tg.MainButton.hideProgress();
        tg.showAlert("Ошибка при создании записи. Попробуйте еще раз.");
    }
});


// === 5. ЛИЧНЫЙ КАБИНЕТ ===

function renderMyBookings() {
    const list = document.getElementById('myBookingsList');
    
    if (localBookings.length === 0) {
        list.innerHTML = '<div class="empty-state">У вас пока нет активных записей</div>';
        return;
    }
    
    list.innerHTML = '';
    localBookings.forEach(b => {
        list.innerHTML += `
            <div class="expert-card">
                <div class="expert-info">
                    <div class="expert-name">${b.expert}</div>
                    <div class="expert-spec">${b.role}</div>
                    <div class="expert-meta" style="color:#3390ec;">
                        <i class="fas fa-check-circle"></i> ${b.date} • Оплачено ${b.price} ₽
                    </div>
                </div>
            </div>
        `;
    });
}


// === 6. НАВИГАЦИЯ И УТИЛИТЫ ===

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if (viewId === 'view-home') updateTabs(0);
    if (viewId === 'view-profile') {
        updateTabs(1);
        renderMyBookings();
    }
    window.scrollTo(0,0);
}

function updateTabs(index) {
    document.querySelectorAll('.tab-item').forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}

// Закрытие по клику на фон
document.getElementById('overlay').onclick = closeBookingSheet;

// Обработка кликов по фильтрам (тегам)
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', function() {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        renderExperts(this.dataset.cat);
    });
});
