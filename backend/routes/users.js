const { celebrate, Joi } = require('celebrate');
const router = require('express').Router();

const regularExp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)/;

const {
  getUsers,
  getUserId,
  updateProfile,
  updateAvatar,
  getMe,
} = require('../controllers/users');

router.get('/users', getUsers);

router.get('/users/me', getMe);
router.get(
  '/users/:userId',
  celebrate({
    params: Joi.object().keys({
      userId: Joi.string().length(24).hex().required(),
    }),
  }),
  getUserId,
);

router.patch(
  '/users/me',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      about: Joi.string().required().min(2).max(30),
    }),
  }),
  updateProfile,
);

router.patch(
  '/users/me/avatar',
  celebrate({
    body: Joi.object().keys({
      avatar: Joi.string().required().pattern(regularExp),
    }),
  }),
  updateAvatar,
);

module.exports = router;
