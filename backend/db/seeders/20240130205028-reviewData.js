"use strict";
const { Review } = require("../models");

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
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("Reviews", null, {});
  },
};
