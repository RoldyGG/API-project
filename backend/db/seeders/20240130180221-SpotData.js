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
        ownerId: 3,
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
      {
        ownerId: 5,
        address: "1 Infinite Loop Road",
        city: "Silicone Valley",
        state: "California",
        country: "United States of America",
        lat: 344.7483645,
        lng: -11.7565756,
        name: "Tech Hideaway",
        description: "For those who love technology",
        price: 1200,
      },
      {
        ownerId: 6,
        address: "76 Calle De Raza",
        city: "Villalobos",
        state: "Michoacan",
        country: "Mexico",
        lat: 789.7483579,
        lng: -11.7235756,
        name: "Venga a gozar en la playa!",
        description:
          "Propiedad en frente del mar para los que le encanta la playa.",
        price: 300,
      },
      {
        ownerId: 4,
        address: "3333 Weird Lane",
        city: "Amarillo",
        state: "Texas",
        country: "United States of America",
        lat: 333.7483645,
        lng: -333.7565756,
        name: "The Weird Place",
        description: "Weird things happen here...",
        price: 666,
      },
      {
        ownerId: 7,
        address: "86753 Beverly Hills Street",
        city: "East Lost Angeles",
        state: "California",
        country: "United States of America",
        lat: 33.74856745,
        lng: -201.7565756,
        name: "The Snooty Stay",
        description: "Treat yourself like a celeberty for a day or more!",
        price: 1000,
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
    options.tableName = "Spots";
    await queryInterface.bulkDelete(
      options,
      {
        address: {
          [Op.in]: [
            "123 Disney Lane",
            "234 Disco Lane",
            "14755 Ventura Boulevard",
            "1038 Rose Blvd",
            "1 Infinite Loop Road",
            "76 Calle De Raza",
            "3333 Weird Lane",
            "86753 Beverly Hills Street",
          ],
        },
      },
      {}
    );
  },
};
