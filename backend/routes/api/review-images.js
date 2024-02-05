const express = require("express");
const { Review, ReviewImage } = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const router = express.Router();

//DELETE A review image
router.delete("/:imageId", requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const currentUser = req.user.id;
  const reviewCheck = await Review.findByPk(imageId);
  const images = await ReviewImage.findByPk(imageId);

  if (!images) {
    return res.status(404).json({ message: "Spot image couldn't be found" });
  }
  if (reviewCheck.userId !== currentUser) {
    return res.status(403).json({ message: "You are not authorized." });
  }
  await images.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
});

module.exports = router;
