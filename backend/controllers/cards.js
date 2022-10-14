const Card = require('../models/card');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

module.exports.getCard = (req, res, next) => {
  Card.find({})
    .then((card) => res.send(card))
    .catch(next);
};

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;
  const owner = req.user._id;
  Card.create({ name, link, owner })
    .then((card) => {
      res.send(card);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

module.exports.deleteCard = (req, res, next) => {
  Card.findById(req.params.cardId)
    .then((card) => {
      if (!card) {
        return next(new NotFoundError('Запрашиваемая карточка не найдена'));
      }
      if (String(card.owner) !== String(req.user._id)) {
        return next(new ForbiddenError('Попытка удалить чужую карточку'));
      }
      return card.remove()
        .then(() => res.send({ message: 'Карточка успешно удалена' }));
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new ValidationError('Переданы некорретные данные'));
      } else {
        next(err);
      }
    });
};

module.exports.likeCard = (req, res, next) => Card.findByIdAndUpdate(
  req.params.cardId,
  { $addToSet: { likes: req.user._id } },
  { new: true },
)
  .orFail(() => {
    next(new NotFoundError('Карточка не найдена'));
  })
  .then((card) => {
    res.send(card);
  })
  .catch((err) => {
    if (err.message === 'NotFound') {
      next(new NotFoundError('Передан неверный id карточки'));
    } else if (err.name === 'CastError') {
      next(new ValidationError('Переданы некорретные данные'));
    } else {
      next(err);
    }
  });

module.exports.dislikeCard = (req, res, next) => Card.findByIdAndUpdate(
  req.params.cardId,
  { $pull: { likes: req.user._id } },
  { new: true },
)
  .orFail(() => {
    next(new NotFoundError('Карточка не найдена'));
  })
  .then((card) => {
    res.send(card);
  })
  .catch((err) => {
    if (err.message === 'NotFound') {
      next(new NotFoundError('Передан несуществующий id карточки'));
    } else if (err.name === 'CastError') {
      next(new ValidationError('Переданы некорретные данные'));
    } else {
      next(err);
    }
  });
