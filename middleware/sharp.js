const sharp = require("sharp");

module.exports = (req, res, next) => {
  if (req.file) {
    const refImg = `${req.file.filename.split(".")[0]}.webp`;
    sharp(req.file.path)
      .webp({ quality: 20 })
      .resize({ width: 250, height: 250, fit: "contain" })
      .toFile(`images/${refImg}`, (err) => {
        if (err) {
          res
            .status(500)
            .json({ error: "Erreur lors de la conversion de l'image" });
        }
      });
    delete req.file.filename;
    req.file.filename = refImg;
    next();
  }
  next();
};
