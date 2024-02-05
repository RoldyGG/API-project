const express = require("express");
const { SpotImage, Spot } = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const router = express.Router();

//DELETE A spot image using imageId
router.delete("/:imageId", requireAuth, async (req, res) => {
    const { imageId } = req.params;
    const currentUser = req.user.id;
    const spotCheck = await Spot.findByPk(imageId);
    const images = await SpotImage.findByPk(imageId);

    if (!images) {
      return res.status(404).json({ message: "Spot image couldn't be found" });
    };
    if(spotCheck.ownerId !== currentUser){
      return res.status(403).json({ message: "Forbidden" });
  };
  await images.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
  });

module.exports = router;
