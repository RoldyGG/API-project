const express = require("express");
const { Booking, Spot, SpotImage } = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const router = express.Router();

router.get("/current", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const userBookings = await Booking.findAll({
    where: {
      userId: currentUser,
    },
  });
  const bookingSpot = await Spot.findByPk(userBookings[0].spotId);
  const previewImg = await SpotImage.findAll({
    where: {
      spotId: bookingSpot.id,
    },
  });

  const bookingObj = {
    Bookings: [
      {
        id: bookingSpot.id,
        spotId: userBookings[0].spotId,
        Spot: {
          id: bookingSpot.id,
          ownerId: bookingSpot.ownerId,
          address: bookingSpot.address,
          city: bookingSpot.address,
          state: bookingSpot.state,
          country: bookingSpot.country,
          lat: bookingSpot.lat,
          lng: bookingSpot.lng,
          name: bookingSpot.name,
          price: bookingSpot.price,
          previewImage: previewImg[0].preview,
        },
        userId: userBookings[0].userId,
        startDate: userBookings[0].startDate,
        endDate: userBookings[0].endDate,
        createdAt: userBookings[0].createdAt,
        updatedAt: userBookings[0].updatedAt,
      },
    ],
  };
  res.json(bookingObj);
});

router.put("/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  const { startDate, endDate } = req.body;
  const currentUser = req.user.id;
  const bookings = await Booking.findByPk(bookingId);

  if (bookings) {
    if (currentUser === bookings.userId) {
      bookings.startDate = startDate || bookings.startDate;
      bookings.endDate = endDate || bookings.endDate;
      await bookings.save();
      return res.json(bookings);
    }
  }
  res.status(404).json({
    message: "Booking couldn't be found",
  });
});

router.delete("/:bookingId", requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  const currentUser = req.user.id;

  const bookings = await Booking.findByPk(bookingId);
  if (!bookings) {
    return res.status(404).json({ message: "Booking couldn't be found" });
  }
  if (bookings.userId !== currentUser) {
    return res.status(403).json({ message: "You are not authorized." });
  }
  await bookings.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
});
module.exports = router;
