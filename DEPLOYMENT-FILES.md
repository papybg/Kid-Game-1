# Структура на файлове за качване - Kid Game 1

## 📁 Основни папки и файлове

### 🔧 Коренни файлове (трябва да се качват)
```
/
├── package.json                 # Основни зависимости на проекта
├── package-lock.json           # Lock файл за точни версии
├── tsconfig.json              # TypeScript конфигурация
├── vite.config.ts             # Vite конфигурация
├── tailwind.config.ts         # Tailwind CSS конфигурация
├── postcss.config.js          # PostCSS конфигурация
├── components.json            # shadcn/ui компоненти конфигурация
├── drizzle.config.ts          # Drizzle ORM конфигурация
├── render.yaml                # Render deployment конфигурация
├── vercel.json                # Vercel deployment конфигурация
├── netlify.toml               # Netlify deployment конфигурация
└── README.md                  # Документация на проекта
```

### 🎮 Клиентска част (Frontend)

#### 📁 client/
```
client/
├── package.json               # Frontend зависимости
├── index.html                # Главен HTML файл
├── vite.config.ts            # Vite клиент конфигурация
├── tailwind.config.cjs       # Tailwind клиент конфигурация
└── public/                   # Статични файлове
    ├── audio/                # Аудио файлове
    │   ├── animals/          # Звуци на животни
    │   │   ├── cat.mp3       # Котка
    │   │   ├── dog.mp3       # Куче
    │   │   ├── chicken.mp3   # Кокошка
    │   │   ├── cow.mp3       # Крава
    │   │   └── crow.mp3      # Врана
    │   ├── vehicles/         # Звуци на превозни средства
    │   │   ├── bus.mp3       # Автобус
    │   │   ├── train.mp3     # Влак
    │   │   └── airplane.mp3  # Самолет
    │   └── voices/           # Гласови файлове
    │       ├── bravo.wav     # "Браво!" звук
    │       └── try-again.wav # "Опитай пак!" звук
    ├── images/               # Изображения
    │   ├── backgrounds/      # Фонови изображения
    │   ├── cat.png           # Котка
    │   ├── dog.png           # Куче
    │   ├── chicken.png       # Кокошка
    │   ├── cow.png           # Крава
    │   ├── crow.png          # Врана
    │   ├── bus.png           # Автобус
    │   ├── train.png         # Влак
    │   └── airplane.png      # Самолет
    └── data/                 # Данни
        ├── portals.json      # Портали/нива
        ├── themes.json       # Теми
        ├── questions.json    # Въпроси
        └── layouts/          # Layout файлове
            └── d1.json       # Layout за ниво 1
```

#### 📁 client/src/
```
client/src/
├── main.tsx                  # Точка на вход
├── index.css                # Основни стилове
├── App.tsx                  # Главен компонент
├── components/              # React компоненти
│   ├── ui/                  # UI компоненти (shadcn/ui)
│   ├── game/                # Игрови компоненти
│   ├── audio-manager.tsx    # Управление на аудио
│   ├── theme-provider.tsx   # Теми
│   └── ...
├── hooks/                   # React hooks
├── lib/                     # Помощни библиотеки
├── pages/                   # Страници/компоненти
└── types/                   # TypeScript типове
```

### 🖥️ Сървърна част (Backend)

#### 📁 server/
```
server/
├── index.ts                 # Главен сървър файл
├── server.ts               # Express сървър конфигурация
├── routes.ts               # API маршрути
├── storage.ts              # Управление на данни
├── db.ts                   # База данни връзка
├── db-storage.ts           # DB storage логика
├── utils.ts                # Помощни функции
└── vite.ts                 # Vite интеграция
```

### 📊 Споделени файлове

#### 📁 shared/
```
shared/
├── schema.ts               # База данни схема
└── types.ts                # Споделени TypeScript типове
```

## 🎵 Аудио файлове - задължителни

### 📁 client/public/audio/voices/
- **bravo.wav** - Гласов файл "Браво!" (използва се в 4+ режим)
- **try-again.wav** - Гласов файл "Опитай пак!" (използва се в 4+ режим)

### 📁 client/public/audio/animals/
- **cat.mp3** - Звук на котка
- **dog.mp3** - Звук на куче
- **chicken.mp3** - Звук на кокошка
- **cow.mp3** - Звук на крава
- **crow.mp3** - Звук на врана

### 📁 client/public/audio/vehicles/
- **bus.mp3** - Звук на автобус
- **train.mp3** - Звук на влак
- **airplane.mp3** - Звук на самолет

## 🖼️ Изображения - задължителни

### 📁 client/public/images/
- **cat.png** - Изображение на котка
- **dog.png** - Изображение на куче
- **chicken.png** - Изображение на кокошка
- **cow.png** - Изображение на крава
- **crow.png** - Изображение на врана
- **bus.png** - Изображение на автобус
- **train.png** - Изображение на влак
- **airplane.png** - Изображение на самолет

### 📁 client/public/images/backgrounds/
- Фонови изображения за различните нива/теми

## 📋 Данни - задължителни

### 📁 client/public/data/
- **portals.json** - Конфигурация на порталите/нивата
- **themes.json** - Конфигурация на темите
- **questions.json** - Въпроси за играта
- **layouts/d1.json** - Layout конфигурация за ниво 1

## 🚀 Deployment файлове

### За различни платформи:
- **render.yaml** - За Render.com
- **vercel.json** - За Vercel
- **netlify.toml** - За Netlify
- **docker-compose.dev.yml** - За локално development с Docker

## 📝 Важни забележки

### ✅ Трябва да се качват:
- Всички `.ts`, `.tsx`, `.js`, `.json` файлове
- Всички изображения (`.png`, `.jpg`, `.jpeg`)
- Всички аудио файлове (`.mp3`, `.wav`)
- Всички конфигурационни файлове
- `package.json` и `package-lock.json`

### ❌ Не трябва да се качват:
- `node_modules/` папки (генерират се с `npm install`)
- `.git/` папка (Git история)
- `dist/` папка (генерира се при build)
- Лог файлове
- Временни файлове

### 🔧 Build процес:
1. Инсталирай зависимости: `npm install`
2. Build на проекта: `npm run build`
3. Стартирай: `npm start` или deploy на платформата

### 🌐 Environment variables:
- Създай `.env` файл с необходимите променливи
- Не качвай `.env` файла в Git (вече е в `.gitignore`)

---

**Дата на генериране:** 16 септември 2025 г.
**Версия:** 1.0.0
**Проект:** Kid Game 1