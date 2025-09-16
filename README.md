# Къде да ме откриеш? (Where to Find Me?)

Детска образователна игра на български език, която помага на децата да учат чрез интерактивни среди. Играчите избират елементи от списък с възможности и ги поставят на правилните места в тематични игрове дъски, с визуална обратна връзка и система за точкуване за насърчаване на ученето.

## 🚀 Бърз старт

### Предварителни изисквания

- Node.js 18+
- npm или yarn

### Инсталация

1. Клонирайте репозиторията:
```bash
git clone https://github.com/papybg/Kid-Game-1.git
cd Kid-Game-1
```

2. Инсталирайте зависимостите:
```bash
npm install
```

3. Стартирайте приложението:
```bash
npm run dev
```

4. Отворете браузъра на адрес: `http://localhost:8080`

## 🏗️ Архитектура

### Frontend Архитектура
- **Framework**: React 18 с TypeScript за безопасност на типовете и модерно разработване
- **Build Tool**: Vite за бързо разработване и оптимизирани production builds
- **UI Library**: Shadcn/ui компоненти, базирани на Radix UI primitives за достъпност
- **Styling**: Tailwind CSS с персонализирани design tokens и поддръжка на светла/тъмна тема
- **State Management**: React hooks с персонализирано управление на game state чрез `useGameState`
- **Data Fetching**: TanStack Query за управление на server state и кеширане
- **Routing**: Single-page application с component-based screen navigation

### Backend Архитектура
- **Runtime**: Node.js с Express.js REST API server
- **Database ORM**: Drizzle ORM с PostgreSQL schema definitions
- **Development Storage**: In-memory storage implementation за бързо прототипиране
- **API Design**: RESTful endpoints за portals, game items, layouts, progress, и settings
- **Static Assets**: Vite development server integration с Express за unified serving

### Game Logic Архитектура
- **Game Flow**: Welcome → Portal Selection → Game Play → Win Screen progression
- **Game State**: Централизирано state управление за active slots, choices, scoring, и progress
- **Audio System**: Web Audio API integration с Tone.js за интерактивни sound effects
- **Responsive Design**: Mobile-first approach с adaptive layouts за различни screen sizes

## 📁 Структура на проекта

```
kidgame1/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   │   ├── audio/         # Game sounds
│   │   ├── data/          # Game data (portals, themes, layouts)
│   │   └── images/        # Game images
│   └── src/
│       ├── components/    # React components
│       │   ├── game/      # Game-specific components
│       │   └── ui/        # Reusable UI components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utility libraries
│       ├── pages/         # Page components
│       └── types/         # TypeScript type definitions
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── server.ts          # Server configuration
│   ├── storage.ts         # Data storage layer
│   └── utils.ts           # Server utilities
├── shared/                # Shared code between client and server
│   ├── schema.ts          # Database schemas and types
│   └── types.ts           # Shared TypeScript types
└── docs/                  # Documentation
```

## 🎮 Как се играе

1. **Добре дошли**: Играта започва с приветствен екран
2. **Избор на портал**: Изберете тематична среда (животни, превозни средства и др.)
3. **Игра**: Поставете елементите на правилните места в игровото поле
4. **Обратна връзка**: Получавате визуална и звукова обратна връзка за всяко действие
5. **Победа**: Когато всички елементи са правилно поставени

## 🔧 Development Scripts

```bash
# Стартиране на development server (клиент + сървър)
npm run dev

# Само клиент
npm run dev:client

# Само сървър
npm run dev:server

# Build за production
npm run build

# TypeScript проверки
npm run type-check

# Линтиране
npm run lint
```

## 🎨 Персонализиране

### Добавяне на нови теми
1. Добавете изображения в `client/public/images/`
2. Обновете `client/public/data/themes.json`
3. Добавете звукови файлове в `client/public/audio/`

### Добавяне на нови елементи
1. Обновете `server/storage.ts` с нови game items
2. Добавете съответните изображения и звуци
3. Обновете layout файловете в `client/public/data/layouts/`

## 🚀 Deployment

Проектът е конфигуриран за deployment на:
- **Vercel**: Frontend + Backend
- **Render**: Backend API
- **Netlify**: Static frontend

### Environment Variables

Създайте `.env` файл в root директорията:

```env
# Database
DATABASE_URL=postgresql://...

# Server
PORT=3005

# Development
NODE_ENV=development
```

## 📚 Технологии

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- TanStack Query
- Tone.js (за аудио)

### Backend
- Node.js
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL

### Development Tools
- ESLint
- Prettier
- Husky (Git hooks)
- Commitlint

## 🤝 Contributing

1. Fork проекта
2. Създайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit-нете промените (`git commit -m 'Add some AmazingFeature'`)
4. Push-нете към branch-a (`git push origin feature/AmazingFeature`)
5. Отворете Pull Request

## 📄 License

Този проект е лицензиран под MIT License - вижте [LICENSE](LICENSE) файла за детайли.

## 📞 Контакт

- **Автор**: [papybg](https://github.com/papybg)
- **Проект**: [Kid-Game-1](https://github.com/papybg/Kid-Game-1)

---

**Забележка**: Това е образователна игра, създадена специално за български деца. Всички текстове и аудио файлове са на български език.</content>
<parameter name="filePath">c:\dev\kidgame1\README.md