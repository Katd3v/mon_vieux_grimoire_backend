const express = require("express");
const auth = require("../middleware/auth");
const bookCtrl = require("../controllers/books");

const router = express.Router();

router.post("/", auth, bookCtrl.createThing);
router.put("/:id", auth, bookCtrl.modifyThing);
router.delete("/:id", auth, bookCtrl.deleteThing);
router.get("/:id", bookCtrl.getOneThing);
router.get("/", bookCtrl.getAllBook);

module.exports = router;
