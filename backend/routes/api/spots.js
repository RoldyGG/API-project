const express = require("express");
const {
  Spot,
  Review,
  User,
  ReviewImage,
  SpotImage,
  Booking,
  sequelize,
} = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const { OP } = require("sequelize");
const router = express.Router();

router.get("/current", async (req, res) => {
  const currentUser = req.user.id;

  if (currentUser) {
    const userSpots = await Spot.findAll({
      where: { ownerId: currentUser },
    });
    const spotsArray = [];
    userSpots.forEach((spot) => {
      const spotObj = spot.toJSON();

      spotsArray.push(spotObj);
    });

    for (let i = 0; i < spotsArray.length; i++) {
      let spotId = spotsArray[i]["id"];
      const starRating = await Review.findOne({
        where: { spotId: spotId },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("stars")), "avgStarRating"],
        ],
      });

      let reviewJson = starRating.toJSON();

      spotsArray[i].avgRating = reviewJson.avgStarRating;
    }

    for (let i = 0; i < spotsArray.length; i++) {
      let spotId = spotsArray[i]["id"];
      const spotImg = await SpotImage.findOne({
        where: {
          spotId: spotId,
          preview: true,
        },
        attributes: ["url", "preview"],
      });

      if (spotImg) {
        let previewImg = spotImg.toJSON();
        spotsArray[i].previewImage = previewImg.url;
      } else {
        spotsArray[i].previewImage = "no preview image set";
      }
    }
    let spots = {};
    spots.Spots = spotsArray;
    res.json(spots);
  }
});

router.get("/:spotId/bookings", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const spotCheck = await Spot.findByPk(spotId);
  const currentUser = req.user.id;
  const bookingObj = {};

  if (spotCheck) {
    if (spotCheck.ownerId === currentUser) {
      const userBookings = await User.findAll({
        attributes: ["id", "firstName", "lastName"],
        where: { id: currentUser },
        include: {
          model: Booking
        },
      });

      bookingObj.Bookings = userBookings
      return res.json(bookingObj);
    } else {
      const userlessBookings = await Booking.findAll({
        where: {
          spotId: Number(spotId),
        },
        attributes: {
          exclude: ["userId", "createdAt", "updatedAt"],
        },
      });

      return res.json(userlessBookings);
    }
  }

  return res.status(404).json({
    message: "Spot couldn't be found",
  });
});

router.get("/:spotId/reviews", async (req, res) => {
  const { spotId } = req.params;
  const spotCheck = await Spot.findByPk(spotId);

  if (spotCheck) {
    const reviews = await Review.findAll({
      where: { spotId },
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
          model: ReviewImage,
          attributes: {
            exclude: ["reviewId", "createdAt", "updatedAt"],
          },
        },
      ],
    });

    const newguy = [];
    reviews.forEach((rev) => {
      const review = rev.toJSON();
      newguy.push(review);
    });

    reviewObj = {};
    reviewObj.Reviews = newguy;

    return res.json(reviewObj);
  }

  return res.status(400).json({
    message: "Spot couldn't be found",
  });
});

router.get("/:spotId", async (req, res) => {
  const { spotId } = req.params;
  const spotDetails = await Spot.findByPk(spotId);

  if (spotDetails) {
    const ownerDetails = await User.findByPk(spotDetails.ownerId);
    const images = await SpotImage.findAll({
      attributes: ["id", "url", "preview"],
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

router.post("/:spotId/bookings", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const spotCheck = await Spot.findByPk(spotId);
  const currentUser = req.user.id;
  const { startDate, endDate } = req.body;

  if (spotCheck) {
    if (spotCheck.ownerId === currentUser) {
      return res.status(400).json({
        message: "Owner cannot book their own spot",
      });
    }
    const checkIn = new Date(startDate);
    const checkOut = new Date(endDate);
    if (checkOut.getTime() - checkIn.getTime() < 0) {
      return res.status(400).json({
        message: "endDate cannot be on or before startDate",
      });
    }

    const openBookings = await Spot.findByPk(spotId, {
      include: { model: Booking },
    });

    const openBookingsPojo = openBookings.toJSON();
    const bookingArr = openBookingsPojo.Bookings;
    for (i = 0; i < bookingArr.length; i++) {
      let openStartDate = bookingArr[i].startDate;
      let openEndDate = bookingArr[i].endDate;

      if (checkIn >= openStartDate && checkIn <= openEndDate) {
        return res
          .status(403)
          .json({
            message:
              "Sorry, this spot is already booked for the specified dates",
          });
      }
      if (checkIn >= openStartDate && checkOut <= openEndDate) {
        return res
          .status(403)
          .json({
            message:
              "Sorry, this spot is already booked for the specified dates",
          });
      }
      if (checkIn <= openStartDate && endDateData >= openEndDate) {
        return res
          .status(403)
          .json({
            message:
              "Sorry, this spot is already booked for the specified dates",
          });
      }
    }
  const spotIdNum = Number(spotId);
  const newBooking = await Booking.create({
    spotId: spotIdNum,
    userId: currentUser,
    ...req.body,
  });

  return res.json(newBooking)
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



router.post("/", requireAuth, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const currentUser = req.user.id;

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

router.delete("/:spotId", requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const currentUser = req.user.id;
  const spotCheck = await Spot.findByPk(spotId);

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
