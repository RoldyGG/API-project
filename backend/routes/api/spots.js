const express = require("express");
const {
  Spot,
  Review,
  User,
  ReviewImage,
  SpotImage,
  Booking
} = require("../../db/models");

const router = express.Router();

router.get("/:spotId/bookings", async (req, res) => {
  const { spotId } = req.params;
  const currentUser = req.user.id;
  const getBookings = await Booking.findAll({
    attributes: ["id", "spotId", "userId", "startDate", "endDate", "createdAt", "updatedAt"],
    where: {
      spotId
    }
  })
  const getUser = await User.findByPk(currentUser);

  if(getBookings.length) {
    if(currentUser === getBookings[0].userId) {
      const bookingObj = {
        Bookings: [
          {
            User:{
              id: getUser.id,
              firstName: getUser.firstName,
              lastName: getUser.lastName,
            },
            id: getBookings[0].id,
            spotId: getBookings[0].spotId,
            userId: currentUser,
            startDate: getBookings[0].startDate,
            endDate: getBookings[0].endDate,
            createdAt: getBookings[0].createdAt,
            updatedAt: getBookings[0].updatedAt
          }
        ]
      }
      return res.json(bookingObj)
    } else {
      bookingObj = {
        Bookings: [
          {
            spotId: getBookings[0].spotId,
            startDate: getBookings[0].startDate,
            endDate: getBookings[0].endDate
          }
        ]
      }
      return res.json(bookingObj)
    }
  }
  return res.status(404).json({
    message: "Spot couldn't be found"
  })
})

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

router.post("/:spotId/reviews", async (req, res) => {
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
        res.status(500).json({
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
    res.json(newReview);
  } else {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

router.post("/:spotId/images", async (req, res) => {
  const providedId = req.params.spotId;
  const { url, preview } = req.body;
  const findSpot = await Spot.findByPk(providedId);

  if (findSpot) {
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
    res.json(payload);
  } else {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

router.put("/:spotId", async (req, res) => {
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
  } else {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  res.json(spotUpdate);
});

router.post("/", async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  const newSpot = await Spot.create({
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

router.delete("/:spotId", async (req, res) => {
  const { spotId } = req.params;
  const target = await Spot.findByPk(spotId);

  if (target) {
    await target.destroy();
    res.json({
      message: "Successfully deleted",
    });
  } else {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

module.exports = router;
