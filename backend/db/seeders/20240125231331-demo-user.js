"use strict";

const { User } = require("../models");
const bcrypt = require("bcryptjs");
let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await User.bulkCreate(
      [
        {
          firstName: "John",
          lastName: "Dudeson",
          email: "demo@user.io",
          username: "Demo-lition",
          hashedPassword: bcrypt.hashSync("password"),
        },
        {
          firstName: "Ron",
          lastName: "Rando",
          email: "user1@user.io",
          username: "FakeUser1",
          hashedPassword: bcrypt.hashSync("password2"),
        },
        {
          firstName: "Brenda",
          lastName: "Brendason",
          email: "user2@user.io",
          username: "FakeUser2",
          hashedPassword: bcrypt.hashSync("password3"),
        },
        {
          firstName: "Ron",
          lastName: "Brando",
          email: "user3@user.io",
          username: "FakeUser3",
          hashedPassword: bcrypt.hashSync("password4"),
        },
        {
          firstName: "Brenda",
          lastName: "Song",
          email: "user4@user.io",
          username: "FakeUser4",
          hashedPassword: bcrypt.hashSync("password5"),
        },
        {
          firstName: "Julius",
          lastName: "Smalls",
          email: "user5@user.io",
          username: "FakeUser5",
          hashedPassword: bcrypt.hashSync("password6"),
        },
        {
          firstName: "Darwin",
          lastName: "Jackson",
          email: "user6@user.io",
          username: "FakeUser6",
          hashedPassword: bcrypt.hashSync("password7"),
        },
        {
          firstName: "Elenore",
          lastName: "Stropp",
          email: "user7@user.io",
          username: "FakeUser7",
          hashedPassword: bcrypt.hashSync("password8"),
        },
        {
          firstName: "Finn",
          lastName: "Hughman",
          email: "user8@user.io",
          username: "FakeUser8",
          hashedPassword: bcrypt.hashSync("password9"),
        },
      ],
      { validate: true }
    );
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Users";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        username: {
          [Op.in]: [
            "Demo-lition",
            "FakeUser1",
            "FakeUser2",
            "FakeUser3",
            "FakeUser4",
            "FakeUser5",
            "FakeUser6",
            "FakeUser7",
            "FakeUser8",
          ],
        },
      },
      {}
    );
  },
};
