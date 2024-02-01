const express = require("express");
const { Review } = require("../../db/models");
const { Spot } = require("../../db/models");
const router = express.Router();

router.get("/current", async (req, res) => {
    const { user } = req;
    let reviewObj = {};

    if (user) {
      const payload = await Review.findAll({
        where: {
          userId: user.id,
        },
        include: [
            {
                model: Spot
            }
        ]
      });

      reviewObj.Reviews = payload
      res.json(reviewObj);
    }
  });



module.exports = router;
