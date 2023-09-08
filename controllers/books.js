const { log } = require("console");
const Book = require("../models/Book");
const fs = require("fs");
// const sharp = require("sharp");

exports.createBook = (req, res, next) => {
  // récupérer les informations de la requête
  const bookObject = JSON.parse(req.body.book);
  // supprimer l'Id pour en générer un nouveau par mangoDB
  delete bookObject._id;
  // supprimer l'userId pour récupérer user_Id authentifié
  delete bookObject._userId;

  // création d'un nouveau livre
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  // sauvegarde dans le base de données
  book
    .save()
    .then(() => res.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  //vérifier si nouvelle image
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
      //vérifier si le user ID actuel correspond au user ID du livre
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
        //extraire le nom du fichier
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
        book.save();
        return book;
      } else {
        return Promise.reject(new Error("Echec de l'ajout de la note"));
      }
    })
    .then((book) => {
      return res.status(200).json(book);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.bestRatingBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) // trier par moyenne décroissante
    .limit(3) //limiter le résultat à 3
    .then((bestBooks) => {
      res.status(200).json(bestBooks);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};
