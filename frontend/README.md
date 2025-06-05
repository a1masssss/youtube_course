# YouTube Playlist Viewer - Frontend

React frontend для просмотра YouTube плейлистов и транскриптов видео.

## Функциональность

- **Главная страница**: Ввод URL YouTube плейлиста
- **Страница плейлиста**: Сетка карточек с превью всех видео
- **Страница видео**: Детальная информация о видео и его транскрипт

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Запустите development сервер:
```bash
npm start
```

3. Откройте [http://localhost:3000](http://localhost:3000) в браузере

## API Endpoints

Приложение ожидает следующие API endpoints на `http://localhost:8001`:

- `POST /api/playlists/` - Создание плейлиста
- `GET /api/playlists/{id}/` - Получение плейлиста с видео
- `GET /api/videos/{id}/` - Получение информации о видео

## Структура проекта

```
src/
├── components/
│   ├── HomePage.js          # Главная страница
│   ├── PlaylistPage.js      # Страница плейлиста
│   ├── VideoPage.js         # Страница видео
│   ├── VideoCard.js         # Карточка видео
│   └── *.css               # Стили компонентов
├── App.js                  # Основной компонент с роутингом
└── App.css                 # Основные стили
```

## Технологии

- React 18
- React Router DOM
- Axios
- CSS Grid/Flexbox
