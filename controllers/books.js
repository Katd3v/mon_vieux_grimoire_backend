const { log } = require("console");
const Book = require("../models/Book");
const fs = require("fs");
const sharp = require("sharp");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  // Gestion de la conversion de l'image
  const refImg = `${req.file.filename.split(".")[0]}.webp`;
  sharp(req.file.path)
    .webp({ quality: 20 })
    .toFile(`images/${refImg}`, (err) => {
      if (err) {
        res
          .status(500)
          .json({ error: "Erreur lors de la conversion de l'image" });
      }
    });

  // Lorsque la conversion est terminée => sauvegarde avec le lien vers l'image optimisée
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${refImg}`,
  });

  book
    .save()
    .then(() => res.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: "Not authorized" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(400).json({ error }));
};

exports.ratingBook = (req, res, next) => {
  const userId = req.auth.userId;
  const grade = req.body.rating;
  Book.findById(req.params.id)
    .then((book) => {
      // Vérifier si l'utilisateur a déjà noté ce livre
      if (book.ratings.find((rating) => rating.userId === userId)) {
        res.status(401).json({ message: "Not authorized" });
      }

      const lengthRating = book.ratings.length;
      book.ratings.push({ userId, grade });

      if (book.ratings.length === lengthRating + 1) {
        // calcul de la nouvelle moyenne
        const totalRatings = book.ratings.length;
        const totalGrade = book.ratings.reduce(
          (sum, rating) => sum + rating.grade,
          0
        );
        book.averageRating = totalGrade / totalRatings;
        // sauvegarde du livre
        return book.save();
      } else {
        return Promise.reject(new Error("Echec de l'ajout de la note"));
      }
    })
    .then(() =>
      res.status(200).json({ message: "Votre note est enregistré !" })
    )
    .catch((error) => {
      res
        .status(500)
        .json({ error: "Impossible de trouver le livre dans la bdd" });
    });
};
