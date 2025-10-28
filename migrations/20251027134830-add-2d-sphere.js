/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */

module.exports = {
  async up(db, client) {
    try {
      console.log("🔁 Creating 2dsphere index on businessLocation...");
      await db.collection('businessprofiles').createIndex(
        { businessLocation: "2dsphere" },
        { name: "businessLocation_2dsphere" }
      );

      // Replace getIndexes() with listIndexes().toArray()
      const indexes = await db.collection('businessprofiles').listIndexes().toArray();
      console.log('✅ Indexes after creation:', indexes);
    } catch (err) {
      console.error("❌ Error creating 2dsphere index:", err);
    }
  },

  async down(db, client) {

  },
};
