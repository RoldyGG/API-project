"use strict";
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "Spots",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        ownerId: {
          type: Sequelize.INTEGER,
          references: {
            model: "Users",
            key: "id",
          },
        },
        address: {
          type: Sequelize.STRING(225),
        },
        city: {
          type: Sequelize.STRING(50),
        },
        state: {
          type: Sequelize.STRING(30),
        },
        country: {
          type: Sequelize.STRING(60),
        },
        lat: {
          type: Sequelize.DECIMAL(8, 7),
        },
        lng: {
          type: Sequelize.DECIMAL(7, 6),
        },
        name: {
          type: Sequelize.STRING(60),
          allowNull: false,
          unique: true,
        },
        description: {
          type: Sequelize.STRING(225),
          allowNull: false,
          unique: true,
        },
        price: {
          type: Sequelize.DECIMAL(6, 2),
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      options
    );
  },
  async down(queryInterface, Sequelize) {
    options.tableName = "Spots";
    return queryInterface.dropTable(options);
  },
};
