"use strict";
const { Op } = require("sequelize");
let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}
const { SpotImage } = require("../models");

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
    await SpotImage.bulkCreate([
      {
        spotId: 1,
        url: "image url",
        preview: true,
      },
      {
        spotId: 2,
        url: "image url",
        preview: false,
      },
      {
        spotId: 2,
        url: "image url",
        preview: false,
      },
      {
        spotId: 1,
        url: "image url",
        preview: true,
      },
      {
        spotId: 1,
        url: "image url",
        preview: true,
      },
      {
        spotId: 1,
        url: "image url",
        preview: true,
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
    options.tableName = "SpotImages";
    await queryInterface.bulkDelete(
      options,
      {
        preview: { [Op.in]: [true, false] },
      },
      {}
    );
  },
};
