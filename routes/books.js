const express = require("express");
const router = express.Router();

const bookCtrl = require("../controllers/books");

router.post("/", bookCtrl.createThing);
router.put("/:id", bookCtrl.modifyThing);
router.delete("/:id", bookCtrl.deleteThing);
router.get("/:id", bookCtrl.getOneThing);
router.get("/", bookCtrl.getAllBook);

module.exports = router;
