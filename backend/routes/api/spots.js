const express = require("express");
const { Spot } = require("../../db/models");
const { Review } = require("../../db/models");
const { User } = require("../../db/models");
const { ReviewImage } = require("../../db/models");
const router = express.Router();

router.get("/", async (req, res) => {
  const payload = await Spot.findAll();

  return res.json(payload);
});

router.get("/current", async (req, res) => {
  const { user } = req;

  if (user) {
    const payload = await Spot.findAll({
      where: {
        ownerId: user.id,
      },
    });
    res.json(payload);
  }
});

router.get("/:spotId/reviews", async (req, res) => {
  const { spotId } = req.params;

  const spotReviews = await Review.findAll({
    attributes: ['id'],
    where: {
      spotId
    },
    include: {
      model: User,
      attributes: ['id', 'firstName', 'lastName']
    }
  });

  if (spotReviews) {
    res.json(spotReviews);
  } else {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

router.get("/:spotId", async (req, res) => {
  const { spotId } = req.params;

  const spotDetails = await Spot.findByPk(spotId);

  if (spotDetails) {
    return res.json(spotDetails);
  } else {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
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
