const express = require("express");
const { Review, ReviewImage, User, Spot } = require("../../db/models");
// const { check } = require("express-validator");
// const { handleValidationErrors } = require("../../utils/validation");
const { requireAuth } = require("../../utils/auth");
const router = express.Router();

router.get("/current", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const reviews = await Review.findAll({
    where: {
      userId: currentUser
      },
    include: {
        model: User
      }
  });

  return res.json(reviews);
});

router.post("/:reviewId/images", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const { reviewId } = req.params;
  const { url } = req.body;
  const target = await Review.findByPk(reviewId);
  const images = await ReviewImage.findAll({
    where: {
      reviewId,
    },
  });

  if (target) {
    if (images.length < 10) {
      if (currentUser === target.id) {
        const newImage = await ReviewImage.create({
          reviewId: Number(reviewId),
          url,
        });
      } else {
        return res.status(403).json({ message: "You are not authorized." });
      }
      return res.json(newImage);
    } else {
      return res.status(403).json({
        message: "Maximum number of images for this resource was reached",
      });
    }
  }
  return res.status(404).json({
    message: "Review couldn't be found",
  });
});

router.put("/:reviewId", requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { review, stars } = req.body;
  const currentUser = req.user.id;
  const reviews = await Review.findByPk(reviewId);

  if (reviews) {
    if (currentUser === reviews.userId) {
      reviews.review = review || reviews.review;
      reviews.stars = stars || reviews.stars;
      await reviews.save();
      return res.json(reviews);
    }
  }
  res.status(404).json({
    message: "Review couldn't be found",
  });
});

router.delete("/:reviewId", requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const currentUser = req.user.id;

  const reviews = await Review.findByPk(reviewId);
  if (!reviews) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }
  if (reviews.userId !== currentUser) {
    return res.status(403).json({ message: "You are not authorized." });
  }
  await reviews.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
});

module.exports = router;
