const express = require("express");
const { Spot } = require("../../db/models");
const router = express.Router();

router.get("/spots", async (req, res) => {
  const payload = await Spot.findAll();

  res.json(payload);
});

router.get("/spots/:spotId", async (req, res) => {
  const { spotId } = req.params;

  const spotDetails = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (spotDetails) {
    return res.json(spotDetails);
  } else {
    res.status(404).json({
      message: "Spot couldn't be found",
    });
  }
});

router.post("/spots", async (req, res) => {
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

router.put("/spots/:spotId", async (req, res) => {
  const { spotId } = req.params;
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const spotUpdate = await Spot.findByPk(spotId);
  if (spotUpdate) {
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

router.delete("spots/:spotId", async (req, res) => {
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
