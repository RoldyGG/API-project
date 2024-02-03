"use strict";

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}
const { Spot } = require("../models");

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
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: "123 Disney Lane",
        city: "San Fransisco",
        state: "California",
        country: "United States of America",
        lat: 37.6945358,
        lng: -122.4730327,
        name: "App Academy",
        description: "Place where web developers are created",
        price: 123,
      },
      {
        ownerId: 2,
        address: "234 Disco Lane",
        city: "Albany",
        state: "New York",
        country: "United States of America",
        lat: 42.0478532,
        lng: -102.4756399,
        name: "Rebel's Roost",
        description: "A nice city loft with plenty of space",
        price: 255,
      },
      {
        ownerId: 1,
        address: "1038 Rose Blvd",
        city: "San Bernandino",
        state: "California",
        country: "United States of America",
        lat: 30.7483645,
        lng: -111.7565756,
        name: "The Beachfront",
        description:
          "A beautiful beach front property for those looking for something more tropical",
        price: 300,
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
    options.tableName = "Spots"
    await queryInterface.bulkDelete(options, null, {});
  },
};
