'use strict';
const { Booking } = require('../models')
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await Booking.bulkCreate([
    {
      spotId: 1,
      userId: 1,
      startDate: '2023-07-26',
      endDate: '2023-07-29'
    },
    {
      spotId: 2,
      userId: 2,
      startDate: '2023-05-12',
      endDate: '2023-05-15'
    },
    {
      spotId: 3,
      userId: 3,
      startDate: '2023-04-20',
      endDate: '2023-04-22'
    }
  ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Bookings', null, {})
  }
};
