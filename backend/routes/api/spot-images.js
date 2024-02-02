const express = require("express");
const bcrypt = require("bcryptjs");
const { setTokenCookie } = require("../../utils/auth");
const { SpotImage, Spot } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { requireAuth } = require("../../utils/auth");
const router = express.Router();

router.delete("/:imageId", requireAuth, async (req, res) => {
    const { imageId } = req.params;
    const currentUser = req.user.id;
    const spotCheck = await Spot.findByPk(imageId);
    const images = await SpotImage.findByPk(imageId);

    if (!images) {
      return res.status(404).json({ message: "Spot image couldn't be found" });
    };
    if(spotCheck.ownerId !== currentUser){
      return res.status(403).json({ message: "You are not authorized."});
  };
  await images.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
  });

module.exports = router;
