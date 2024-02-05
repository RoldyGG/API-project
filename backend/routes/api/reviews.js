const express = require("express");
const {
  Review,
  ReviewImage,
  User,
  Spot,
  SpotImage,
} = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { requireAuth } = require("../../utils/auth");
const router = express.Router();
const validateReview = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("Review text is required."),
  check("stars")
    .exists({ checkFalsy: true })
    .isInt({ min: 1 }, { max: 5 })
    .withMessage("Stars must be an integer from 1 to 5."),
  handleValidationErrors,
];

router.get("/current", requireAuth, async (req, res) => {
  const currentUser = req.user.id;

  let Reviews = await Review.findAll({
    where: { userId: currentUser },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: Spot,
        attributes: {
          exclude: ["description", "createdAt", "updatedAt"],
        },
        include: {
          model: SpotImage,
          attributes: ["url"],
          where: {
            preview: true,
          },
          required: false,
        },
      },
      {
        model: ReviewImage,
        attributes: ["id", "url"],
      },
    ],
  });

  Reviews = Reviews.map((review) => {
    let url = null;

    if (review.Spot.SpotImages.length > 0) {
      url = review.Spot.SpotImages[0].url;
    }
    review = review.toJSON();
    review.Spot.previewImage = url;
    delete review.Spot.SpotImages;

    return review;
  });
  return res.json({ Reviews });
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

router.put("/:reviewId", [requireAuth, validateReview], async (req, res) => {
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
    return res.status(404).json({
      message: "Forbidden",
    });
  }
  return res.status(404).json({
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
