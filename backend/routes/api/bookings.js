const express = require("express");
const { Op } = require("sequelize");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { Booking, Spot, SpotImage } = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const router = express.Router();

//VALIDATE
const validateBooking = [
  check("startDate")
    .exists({ checkFalsy: true })
    .withMessage("Start date is required"),
  check("endDate")
    .exists({ checkFalsy: true })
    .custom((endDate, { req }) => {
      if (
        new Date(req.body.startDate).getTime() >= new Date(endDate).getTime()
      ) {
        throw new Error("endDate cannot be on or before startDate");
      }
      return true;
    }),
  handleValidationErrors,
];

//Endpoints

//GET Current Booking
router.get("/current", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const Bookings = await Booking.findAll({
    attribuites: ["id", "spotId", "userId", "startDate", "endDate", "createdAt", "updatedAt"],
    where: {
      userId: currentUser,
    },
    include: [
      {
        model: Spot,
        attributes: {
          exclude: ["description", "createdAt", "updatedAt"],
        },
      },
    ],
  });

  for (let i = 0; i < Bookings.length; i++) {
    let json = Bookings[i].toJSON();

    const previewimage = await SpotImage.findOne({
      where: {
        spotId: json.Spot.id,
        preview: true,
      },
    });

    if (previewimage) {
      json.Spot.previewImage = previewimage.url;
    } else {
      json.Spot.previewImage = null;
    }
    if (json.Spot.lat) {
      json.Spot.lat = parseFloat(json.Spot.lat);
    }
    if (json.Spot.lng) {
      json.Spot.lng = parseFloat(json.Spot.lng);
    }
    if (json.Spot.lat) {
      json.Spot.lat = parseFloat(json.Spot.lat);
    }
    Bookings[i] = json;
  }

  res.json({
    Bookings,
  });
});

//PUT Using bookingId
router.put("/:bookingId", [requireAuth, validateBooking], async (req, res) => {
  const { bookingId } = req.params;
  const { startDate, endDate } = req.body;
  const currentUser = req.user.id;
  const bookings = await Booking.findByPk(bookingId);
  const checkIn = new Date(startDate);
  const checkOut = new Date(endDate);
  let current = new Date();

  if (!bookings) {
    return res.status(404).json({
      message: "Booking couldn't be found",
    });
  }
  if (checkIn < current || checkOut < current) {
    return res.status(403).json({
      message: "Past bookings can't be modified",
    });
  }
  const bookingCheck = await Booking.findOne({
    where: {
      id: {
        [Op.ne]: bookingId,
      },
      spotId: bookings.spotId,
      [Op.and]: [
        {
          startDate: {
            [Op.lte]: new Date(endDate),
          },
        },
        {
          endDate: {
            [Op.gte]: new Date(startDate),
          },
        },
      ],
    },
  });
  if (bookingCheck) {
    return res.status(403).json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors: {
        startDate: "Start date conflicts with an existing booking",
        endDate: "End date conflicts with an existing booking",
      },
    });
  }

  if (currentUser !== bookings.userId) {
    return res.status(403).json({
      message: "forbidden",
    });
  }

  bookings.startDate = startDate;
  bookings.endDate = endDate;
  await bookings.save();

  return res.json(bookings);
});

//DELETE Booking by bookingId
router.delete("/:bookingId", requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  const currentUser = req.user.id;
  const current = new Date();

  const bookings = await Booking.findByPk(bookingId);
  if (!bookings) {
    return res.status(404).json({ message: "Booking couldn't be found" });
  }
  if (bookings.userId !== currentUser) {
    return res.status(403).json({ message: "You are not authorized." });
  }
  if (
    Date.parse(bookings.startDate) <= Date.parse(current) &&
    Date.parse(current) <= Date.parse(bookings.endDate)
  ) {
    return res.status(403).json({
      message: "Bookings that have been started can't be deleted",
    });
  }
  await bookings.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
});
module.exports = router;
