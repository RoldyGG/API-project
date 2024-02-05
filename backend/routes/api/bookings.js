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
  let Bookings = await Booking.findAll({
    where: {
      userId: currentUser,
    },
    include: [
      {
        model: Spot,
        attributes: {
          exclude: ["createdAt", "updatedAt", "description"],
        },
        include: [
          {
            model: SpotImage,
            attributes: ["url"],
            where: {
              preview: true,
            },
            required: false,
          },
        ],
      },
    ],
  });

  Bookings = Bookings.map((booking) => {
    let url = null;

    if (booking.Spot.SpotImages.length > 0) {
      url = booking.Spot.SpotImages[0].url;
    }
    booking = booking.toJSON();
    booking.Spot.previewImage = url;
    delete booking.Spot.SpotImages;

    return booking;
  });
  res.json({ Bookings });
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
