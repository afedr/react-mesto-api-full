const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { celebrate, Joi, errors } = require('celebrate');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const auth = require('./middlewares/auth');
const { createUser, login } = require('./controllers/users');
const NotFoundError = require('./errors/NotFoundError');

const regularExp = /https:?\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const { PORT = 3000 } = process.env;

const app = express();

// Массив доменов, с которых разрешены кросс-доменные запросы
const allowedCors = [
  'http://domainname.students.nomoredomains.icu',
  'https://domainname.students.nomoredomains.icu',
  'localhost:3000',
];

app.use((req, res, next) => {
  const { origin } = req.headers; // Сохраняем источник запроса в переменную origin

  // проверяем, что источник запроса есть среди разрешённых
  if (allowedCors.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  const { method } = req; // Сохраняем тип запроса (HTTP-метод) в соответствующую переменную

  // Значение для заголовка Access-Control-Allow-Methods по умолчанию (разрешены все типы запросов)
  const DEFAULT_ALLOWED_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE';
  // сохраняем список заголовков исходного запроса
  const requestHeaders = req.headers['access-control-request-headers'];

  // Если это предварительный запрос, добавляем нужные заголовки
  if (method === 'OPTIONS') {
    // разрешаем кросс-доменные запросы любых типов (по умолчанию)
    res.header('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);
    // разрешаем кросс-доменные запросы с этими заголовками
    res.header('Access-Control-Allow-Headers', requestHeaders);
    // завершаем обработку запроса и возвращаем результат клиенту
    return res.end();
  }

  next();
});

app.use(requestLogger); // подключаем логгер запросов

app.use(bodyParser.json()); // для собирания JSON-формата
app.use(bodyParser.urlencoded({ extended: true })); // для приёма веб-страниц внутри POST-запроса

mongoose.connect('mongodb://localhost:27017/mestodb', {
  useNewUrlParser: true,
  // useCreateIndex: true,
  // useFindAndModify: false,
});

app.post(
  '/signin',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),
  login,
);

app.post(
  '/signup',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().min(2).max(30),
      about: Joi.string().min(2).max(30),
      avatar: Joi.string().pattern(regularExp),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),
  createUser,
);

app.use(auth);

app.use('/', require('./routes/users'));
app.use('/', require('./routes/cards'));

app.use('*', (req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
});

app.use(errorLogger); // подключаем логгер ошибок

app.use(errors()); // обработчик ошибок celebrate

app.use((err, req, res, next) => {
  if (!err.statusCode) {
    res.status(500).send({ message: 'На сервере произошла ошибка' });
  } else {
    res.status(err.statusCode).send({ message: err.message });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
