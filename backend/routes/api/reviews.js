const express = require("express");
const {
  Review,
  ReviewImage,
  User,
  Spot,
  SpotImage,
} = require("../../db/models");
const router = express.Router();

router.get("/current", async (req, res) => {
  const { user } = req;

  if (user) {
    const payload = await Review.findAll({
      attributes: [
        "id",
        "userId",
        "spotId",
        "review",
        "stars",
        "createdAt",
        "updatedAt",
      ],
      where: {
        userId: user.id,
      },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });
    const payload2 = await Spot.findAll({
      attributes: [
        "id",
        "ownerId",
        "address",
        "city",
        "state",
        "country",
        "lat",
        "lng",
        "name",
        "price",
      ],
    });
    const preview = await SpotImage.findAll({
      attributes: ["url"],
      where: {
        spotId: payload[0].spotId,
      },
    });
    const preview2 = await ReviewImage.findAll({
      attributes: ["id", "url"],
      where: {
        reviewId: payload[0].spotId,
      },
    });

    let reviewObj = {
      Reviews: [
        {
          id: payload[0].id,
          userId: payload[0].userId,
          spotId: payload[0].spotId,
          review: payload[0].review,
          stars: payload[0].stars,
          createdAt: payload[0].createdAt,
          updatedAt: payload[0].updatedAt,
          User: payload[0].User,
          Spot: {
            id: payload2[0].id,
            ownerId: payload2[0].ownerId,
            address: payload2[0].address,
            city: payload2[0].city,
            state: payload2[0].state,
            country: payload2[0].country,
            lat: payload2[0].lat,
            lng: payload2[0].lng,
            name: payload2[0].name,
            price: payload2[0].price,
            previewImage: preview[0].url,
          },
          ReviewImages: preview2,
        },
      ],
    };

    res.json(reviewObj);
  }
});

router.post("/:reviewId/images", async (req, res) => {
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
      const newImage = await ReviewImage.create({
        reviewId: Number(reviewId),
        url,
      });

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

router.put("/:reviewId", async (req, res) => {
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

// router.delete("/:reviewId", async (req, res) => {
//   const { reviewId } = req.params;
//   const target = await Review.findByPk(reviewId);

//   console.log(target.userId)
//   // if (target) {
//   //   await target.destroy();
//   //   return res.json({
//   //     message: "Successfully deleted",
//   //   });
//   // }
//   // return res.status(404).json({
//   //   message: "Review could not be found",
//   // });
// });

module.exports = router;
