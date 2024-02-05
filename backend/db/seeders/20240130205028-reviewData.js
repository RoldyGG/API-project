"use strict";
const { Op } = require("sequelize");
const { Review } = require("../models");
let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await Review.bulkCreate([
      {
        spotId: 1,
        userId: 1,
        review: "What a cool place, definitely would visit again",
        stars: 4,
      },
      {
        spotId: 2,
        userId: 2,
        review: "I think I'm a huge fan of New York now",
        stars: 5,
      },
      {
        spotId: 3,
        userId: 3,
        review: "The beach was amazing, I can't wait to visit again!",
        stars: 5,
      },
      {
        spotId: 6,
        userId: 6,
        review:
          "Um I don't know what happened but I'm pretty sure I was abducted by aliens at night. Would not recommend bringing children here.",
        stars: 4,
      },
      {
        spotId: 6,
        userId: 2,
        review: "Beware the shadow people...",
        stars: 5,
      },
      {
        spotId: 5,
        userId: 1,
        review: "Me encanto tanto, espero ir otra vez",
        stars: 5,
      },
      {
        spotId: 4,
        userId: 5,
        review:
          "They had flying chairs, and ai that keeps you company. Would recommend.",
        stars: 5,
      },
      {
        spotId: 6,
        userId: 8,
        review: "This is the bad place!",
        stars: 1,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = "Reviews";
    await queryInterface.bulkDelete(
      options,
      {
        spotId: { [Op.in]: [1, 2, 3, 4, 5, 6] },
      },
      {}
    );
  },
};
