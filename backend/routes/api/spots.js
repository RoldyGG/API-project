const express = require("express");
const {
  Spot,
  Review,
  User,
  ReviewImage,
  SpotImage,
  Booking,
  sequelize
} = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const { OP } = require("sequelize");
const router = express.Router();

router.get("/:spotId/bookings", requireAuth, async (req, res,) => {
  const { spotId } = req.params;
  const spotCheck = Spot.findByPk(spotId);
  const currentUser = req.user.id;

  if(spotCheck) {
    if(spotCheck.ownerId === currentUser) {
      const userBookings = await Booking.findAll({
        where: {
          spotId: Number(spotId)
        },
        include: {
          Model: User,
          attributes : {
            exclude: [
              "username",
              "hashedPassword",
              "email",
              "createdAt",
              "updatedAt",
            ],
          }
        }
      })

      return res.json(userBookings)
    } else {
      const userlessBookings = await Booking.findAll({
        where: {
          spotId: Number(spotId)
        },
        attributes: {
          exclude: ["userId", "createdAt", "updatedAt"]
        }
      })

      return res.json(userlessBookings)
    }
  }

  return res.status(404).json({
    message: "Spot couldn't be found"
  })
});

router.get("/:spotId/reviews", async (req, res) => {
  const { spotId } = req.params;
  const spotCheck = await Review.findByPk(spotId);

  if (spotCheck) {
    const reviewPics = await ReviewImage.findAll({
      attributes: ["id", "url"],
      where: {
        reviewId: spotId,
      },
    });
    const reviewsInfo = await Review.findAll({
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
        spotId,
      },
      include: {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
    });

    const resObj = {
      Reviews: [
        {
          id: reviewsInfo[0].id,
          userId: reviewsInfo[0].userId,
          spotId: reviewsInfo[0].spotId,
          review: reviewsInfo[0].review,
          stars: reviewsInfo[0].stars,
          createdAt: reviewsInfo[0].createdAt,
          updatedAt: reviewsInfo[0].updatedAt,
          User: reviewsInfo[0].User,

          ReviewImages: [...reviewPics],
        },
      ],
    };

    return res.json(resObj);
  } else {
    return res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

router.get("/current", async (req, res) => {
  const { user } = req;
  let spotsObj = {};

  if (user) {
    const payload = await Spot.findAll({
      where: {
        ownerId: user.id,
      },
    });
    spotsObj.Spots = payload;
    res.json(spotsObj);
  }
});

router.get("/:spotId", async (req, res) => {
  const { spotId } = req.params;
  const spotDetails = await Spot.findByPk(spotId);

  if (spotDetails) {
    const ownerDetails = await User.findByPk(spotDetails.ownerId);
    const images = await SpotImage.findAll({
      attributes: ['id', 'url', 'preview'],
      where: {
        spotId,
      },
    });
    const reviews = await Review.findAll({
      where: {
        spotId,
      },
    });
    const totalReviews = reviews.length;
    let starCount = 0;
    reviews.forEach((review) => {
      starCount += review.stars;
    });
    const avgStars = starCount / totalReviews;
    const payload = {
      id: spotDetails.id,
      ownerId: spotDetails.ownerId,
      address: spotDetails.address,
      city: spotDetails.city,
      state: spotDetails.state,
      country: spotDetails.country,
      lat: spotDetails.lat,
      lng: spotDetails.lng,
      name: spotDetails.name,
      description: spotDetails.description,
      price: spotDetails.price,
      createdAt: spotDetails.createdAt,
      updatedAt: spotDetails.updatedAt,
      numReviews: totalReviews,
      avgStarRating: avgStars,
      SpotImages: images,
      Owner: {
        id: ownerDetails.id,
        firstName: ownerDetails.firstName,
        lastName: ownerDetails.lastName,
      },
    };
    return res.json(payload);
  } else {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

router.get("/", async (req, res) => {
  let spotsObj = {};
  const payload = await Spot.findAll();

  spotsObj.Spots = payload;
  return res.json(spotsObj);
});

router.post("/:spotId/reviews", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const { spotId } = req.params;
  const { review, stars } = req.body;
  const findReviews = await Review.findAll({
    where: {
      spotId,
    },
  });

  if (findReviews.length) {
    findReviews.forEach((obj) => {
      if (obj.userId === currentUser) {
        return res.status(500).json({
          message: "User already has a review for this spot",
        });
      }
    });
    const newReview = await Review.create({
      spotId: Number(spotId),
      userId: currentUser,
      review,
      stars,
    });
    return res.status(201).json(newReview);
  } else {
    return res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

router.post("/:spotId/images", requireAuth, async (req, res) => {
  const providedId = req.params.spotId;
  const { url, preview } = req.body;
  const findSpot = await Spot.findByPk(providedId);
  const currentUser = req.user.id;

  if (findSpot) {
    if (currentUser === findSpot.ownerId) {
      const newSpotImage = await SpotImage.create({
        spotId: providedId,
        url,
        preview,
      });

      const payload = {
        id: newSpotImage.id,
        url: newSpotImage.url,
        preview: newSpotImage.preview,
      };

      return res.json(payload);
    }
    return res.status(403).json({ message: "You are not authorized." });
  } else {
    return res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

router.put("/:spotId", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const { spotId } = req.params;
  const {
    ownerId,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  } = req.body;
  const spotUpdate = await Spot.findByPk(spotId);
  if (spotUpdate) {
    if (spotUpdate.ownerId === currentUser) {
      spotUpdate.ownerId = ownerId || spotUpdate.ownerId;
      spotUpdate.address = address || spotUpdate.address;
      spotUpdate.city = city || spotUpdate.city;
      spotUpdate.state = state || spotUpdate.state;
      spotUpdate.country = country || spotUpdate.country;
      spotUpdate.lat = lat || spotUpdate.lat;
      spotUpdate.lng = lng || spotUpdate.lng;
      spotUpdate.name = name || spotUpdate.name;
      spotUpdate.description = description || spotUpdate.description;
      spotUpdate.price = price || spotUpdate.price;

      await spotUpdate.save();
      return res.json(spotUpdate);
    } else {
      return res.status(403).json({ message: "You are not authorized." });
    }
  }
  res.status(404).json({
    message: "Spot couldn't be found",
  });
});

router.post("/", requireAuth, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const currentUser = req.user.id

  const newSpot = await Spot.create({
    ownerId: currentUser,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });

  res.json(newSpot);
});

router.delete("/:spotId", requireAuth, async (req, res) => {
  const { imageId } = req.params;
  const currentUser = req.user.id;
  const spotCheck = await Spot.findByPk(imageId);

  if (!spotCheck) {
    return res.status(404).json({ message: "Spot image couldn't be found" });
  }
  if (spotCheck.ownerId !== currentUser) {
    return res.status(403).json({ message: "You are not authorized." });
  }
  await spotCheck.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
});

module.exports = router;
