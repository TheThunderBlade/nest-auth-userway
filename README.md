## Моя конфігурація:
    1. NodeJS: v18.17.1
    2. Для докеру використав образ node:18.17-alpine
    3. Docker version 24.0.6, build ed223bc

## nvm:
    1. Для контролю версій NodeJS використовува nvm.
    2. Якщо версія NodeJS відрізняється, то можна встановити за допомогою => nvm install 18.17.1
    3. Перейти на версію можна за допомогою команди => nvm use 18.17.1

## Кроки для запуску програми:
    1. Створити .prod.env файл. Приклад у файлі .env.example
    2. Встановити всі пакети => npm install
    3. Забілдити проект для генерації div-папки => npm run build
    4. Забілдити Docker => docker-compose build
    5. Підняти контейнери. Разом з цим запуститься сервер та можна протестувати роути => docker-compose up
    6. Postman. Імпортувати колекцію з репозиторія зі всіма роутами

## .env
    1. Це звичайний енв файл, де потрібно вказати данні БД, порт та PRIVATE_KEY для jwt
    2. В поле POSTGRES_HOST заноситься назва процесу БД з services в docker-compose файла(В нашому випадку -  postgres)

## Postman:
    1. Роути, захищені гвардом([Guarded]), мають хедер authorization. В ньому має бути access jwt-токен з приставкою Bearer. Частини розділено пробілом. 
    2. Цей токен можна дістати з реквесту SignIn. Він повертається у вигляді строки.
    3. Користувача можна створити на роуті SignUp.

## Приклад .prod.env файлу
    PORT=500
    POSTGRES_HOST=postgres
    POSTGRESS_PORT=5432
    POSTGRES_USER=postgres
    POSTGRESS_PASSWORD=1111
    POSTGRES_DB=userway-auth
    PRIVATE_KEY=some-key