const express = require("express");
const {
  Spot,
  Review,
  User,
  ReviewImage,
  SpotImage,
  Booking,
} = require("../../db/models");
const { Op } = require("sequelize");
const { requireAuth } = require("../../utils/auth");
const { check, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const router = express.Router();

const validateSpot = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required."),
  check("city").exists({ checkFalsy: true }).withMessage("City is required."),
  check("state").exists({ checkFalsy: true }).withMessage("State is required."),
  check("country")
    .exists({ checkFalsy: true })
    .withMessage("Country is required."),
  check("lat")
    .exists({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude is not valid."),
  check("lng")
    .exists({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude is not valid."),
  check("name")
    .exists({ checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage("Name must be less than 50 characters."),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required."),
  check("price")
    .exists({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Price per day is required."),
  handleValidationErrors,
];
const validateQuery = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Page must be greater than or equal to 1"),
  query("size")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Size must be greater than or equal to 1"),
  query("maxLat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Maximum latitude is invalid"),
  query("minLat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Minimum latitude is invalid"),
  query("maxLng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Maximum longitude is invalid"),
  query("minLng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Minimum longitude is invalid"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be greater than or equal to 0"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be greater than or equal to 0"),
  handleValidationErrors,
];

const validateReviews = [
  check("review")
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage("Review text is required"),
  check("stars")
    .exists({ checkFalsy: true })
    .notEmpty()
    .isInt({ min: 1, max: 5 })
    .withMessage("Stars must be an integer from 1 to 5"),
  handleValidationErrors,
];

router.get("/current", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const Spots = await Spot.findAll({
    where: { ownerId: currentUser },
  });

  for (const spot of Spots) {
    const reviewCount = await Review.count({
      where: { spotId: spot.id },
    });
    const sumRating = await Review.sum("stars", {
      where: { spotId: spot.id },
    });
    const avgRating = sumRating / reviewCount || 0;
    spot.setDataValue("avgRating", avgRating);

    const spotImage = await SpotImage.findOne({
      where: {
        spotId: spot.id,
        preview: true,
      },
    });
    if (spotImage instanceof SpotImage) {
      spot.setDataValue("previewImage", spotImage.url);
    } else {
      spot.setDataValue("previewImage", null);
    }
  }

  return res.json({ Spots });
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
          model: Booking,
        },
      });

      bookingObj.Bookings = userBookings;
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
        return res.status(403).json({
          message: "Sorry, this spot is already booked for the specified dates",
        });
      }
      if (checkIn >= openStartDate && checkOut <= openEndDate) {
        return res.status(403).json({
          message: "Sorry, this spot is already booked for the specified dates",
        });
      }
      if (checkIn <= openStartDate && endDateData >= openEndDate) {
        return res.status(403).json({
          message: "Sorry, this spot is already booked for the specified dates",
        });
      }
    }
    const spotIdNum = Number(spotId);
    const newBooking = await Booking.create({
      spotId: spotIdNum,
      userId: currentUser,
      ...req.body,
    });

    return res.json(newBooking);
  }
});

router.get("/:spotId/reviews", async (req, res) => {
  const { spotId } = req.params;
  const reviews = await Spot.findByPk(spotId, {
    attributes: [],
    include: [
      {
        model: Review,
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName"],
          },
          {
            model: ReviewImage,
            attributes: ["id", "url"],
          },
        ],
      },
    ],
  });
  return res.json(reviews);
});

router.post(
  "/:spotId/reviews",
  [requireAuth, validateReviews],
  async (req, res) => {
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
  }
);

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

router.delete("/:spotId", [requireAuth, validateSpot], async (req, res) => {
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

router.get("/", validateQuery, async (req, res) => {
  let { size, page, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } =
    req.query;

  if (!size) size = 20;
  page = page || 1;

  const queryObj = { where: {} };
  const pagination = {
    limit: size,
    offset: size * (page - 1),
  };

  if (minLat) {
    queryObj.where.lat = { [Op.gte]: minLat };
  }
  if (maxLat) {
    queryObj.where.lat = { ...queryObj.where.lat, [Op.lte]: maxLat };
  }
  if (minLng) {
    queryObj.where.lng = { [Op.gte]: minLng };
  }
  if (maxLng) {
    queryObj.where.lng = { ...queryObj.where.lng, [Op.lte]: maxLng };
  }
  if (minPrice) {
    queryObj.where.price = { [Op.gte]: minPrice };
  }
  if (maxPrice) {
    queryObj.where.price = { ...queryObj.where.price, [Op.lte]: maxPrice };
  }

  const Spots = await Spot.findAll({ ...queryObj, ...pagination });

  for (const spot of Spots) {
    spot.lat = parseFloat(spot.lat);
    spot.lng = parseFloat(spot.lng);
    spot.price = parseFloat(spot.price);

    const reviewCount = await Review.count({
      where: { spotId: spot.id },
    });
    const sumRating = await Review.sum("stars", {
      where: { spotId: spot.id },
    });
    const avgRating = sumRating / reviewCount || 0;
    spot.setDataValue("avgRating", avgRating);

    const spotImage = await SpotImage.findOne({
      where: {
        spotId: spot.id,
        preview: true,
      },
    });
    if (spotImage instanceof SpotImage) {
      spot.setDataValue("previewImage", spotImage.url);
    } else {
      spot.setDataValue("previewImage", null);
    }
  }

  return res.json({
    Spots,
    page,
    size,
  });
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

router.post("/", [requireAuth, validateSpot], async (req, res) => {
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

module.exports = router;
