import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='.')

# --- РАБОТА С БАЗОЙ ДАННЫХ ---
DB_NAME = 'mindfocus.db'

def init_db():
    """Создает таблицы, если их нет"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Таблица экспертов
    c.execute('''CREATE TABLE IF NOT EXISTS experts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, role TEXT, category TEXT, 
        price INTEGER, rating REAL, 
        img TEXT, about TEXT
    )''')
    # Таблица записей
    c.execute('''CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT, expert_id INTEGER, 
        price INTEGER, date TEXT
    )''')
    
    # Если экспертов нет, добавим тестовых (чтобы не было пусто)
    c.execute('SELECT count(*) FROM experts')
    if c.fetchone()[0] == 0:
        experts = [
            ('Анна Смирнова', 'Психолог', 'psychology', 5000, 4.9, 'https://randomuser.me/api/portraits/women/44.jpg', 'Гештальт-терапевт. Работаю с тревогой.'),
            ('Марк Стивенс', 'Бизнес-коуч', 'business', 15000, 5.0, 'https://randomuser.me/api/portraits/men/32.jpg', 'Масштабирование бизнеса и выход из операционки.'),
            ('Алина Громова', 'Нутрициолог', 'nutrition', 3500, 4.8, 'https://randomuser.me/api/portraits/women/68.jpg', 'Здоровое питание без диет.')
        ]
        c.executemany('INSERT INTO experts (name, role, category, price, rating, img, about) VALUES (?,?,?,?,?,?,?)', experts)
        conn.commit()
        print("База данных инициализирована тестовыми данными.")
    
    conn.close()

# Запускаем создание БД при старте
init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row # Чтобы обращаться к полям по имени
    return conn

# --- API (РУЧКИ, ЗА КОТОРЫЕ ДЕРГАЕТ САЙТ) ---

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/experts')
def get_experts():
    conn = get_db_connection()
    experts = conn.execute('SELECT * FROM experts').fetchall()
    conn.close()
    # Конвертируем данные из БД в JSON для JS
    return jsonify([dict(ix) for ix in experts])

@app.route('/api/book', methods=['POST'])
def book_expert():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO bookings (user_name, expert_id, price, date) VALUES (?, ?, ?, ?)',
                 ('Test User', data['expertId'], data['price'], data['date']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Запись сохранена в БД'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))