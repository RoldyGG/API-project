const express = require("express");
const { Review, ReviewImage, User, Spot } = require("../../db/models");
// const { check } = require("express-validator");
// const { handleValidationErrors } = require("../../utils/validation");
const { requireAuth } = require("../../utils/auth");
const router = express.Router();

router.get("/current", requireAuth, async (req, res) => {
  const reviews = await Review.findAll({
    include: [
      {
        model: User,
        attributes: {
          exclude: [
            "username",
            "hashedPassword",
            "email",
            "createdAt",
            "updatedAt",
          ],
        },
      },
      {
        model: Spot,
        attributes: {
          exclude: ["description", "createdAt", "updatedAt"],
        },
      },
      {
        model: ReviewImage,
        attributes: {
          exclude: ["reviewId", "createdAt", "updatedAt"],
        },
      },
    ],
    where: { userId: req.user.id },
    attributes: { exclude: ["userId"] },
  });
  const reviewArray = [];

  reviews.forEach((item) => {
    const reviewObj = item.toJSON();
    reviewArray.push(reviewObj);
  });
  for (let i = 0; i < reviewArray.length; i++) {
    let spotId = reviewsArr[i]["Spot"]["id"];
    const spotImages = await SpotImage.findOne({
      where: {
        spotId: spotId,
        preview: true,
      },
      attributes: ["url", "preview"],
    });
    if (spotImages) {
      const previewImg = spotImg.toJSON();

      const spot = reviewsArr[i]["Spot"];
      spot.previewImage = previewImg.url;

      reviewsArr[i].Spot = spot;
    } else {
      reviewsArr[i]["Spot"].previewImage = "no preview image set";
    }
  }
  const currentUserObj = {};
  currentUserObj.Reviews = reviewArray;

  return res.json(currentUserObj);
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

      if (currentUser === target.userId) {

        const newImage = await ReviewImage.create({
          reviewId: Number(reviewId),
          url,
        });
        return res.json(newImage);

      } else {
        return res.status(403).json({ message: "You are not authorized." });
      }
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
