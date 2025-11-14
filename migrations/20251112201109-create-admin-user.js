const bcrypt = require("bcryptjs");

module.exports = {
  async up(db, client) {
    const email = "crownityadmin@yopmail.com";

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      console.log("Admin user already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash("12345678", 10);

    const newUser = {
      name: "Admin",
      email: email,
      password: hashedPassword,
      roleType: 2,
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("users").insertOne(newUser);
    console.log("Admin user created successfully.");
  },

  async down(db, client) {

  },
};
