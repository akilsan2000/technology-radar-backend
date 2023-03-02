const MongoClient = require('mongodb').MongoClient;
const config = process.env;

let dbConnection;

module.exports = {
  connectToServer: async function (callback) {
    let client;
    try {
      client = await MongoClient.connect(config.ConnectionStringDB);
      dbConnection = client.db('technology-radar');
      await callback(dbConnection);
    } catch (err) {
      await callback(dbConnection, err);
      console.log(err);
    } finally {
      if(client)
        client.close();
    }
  },
  getDb: function () {
    return dbConnection;
  },
  initDb: async function () {
    await this.connectToServer(async function (db, err) {
      if (!err) {
        let existingusers = await db.collection("users").find({ username: { $in: ["admin", "mitarbeiter1"] } }, { projection: { username: 1, _id: 0 } }).toArray();
        existingusers = existingusers.map(user => user.username);
        let newUsers = [];
        if (existingusers.indexOf("admin") === -1) {
          newUsers.push({
            username: 'admin',
            role: 'CTO',
            password: '$2a$12$DMFfQM.K6NuJ3ksY.B.eH.f7t9F/WzkUjBkDCzePmdIjYt2S7GUMW'
          });
        }
        if (existingusers.indexOf("mitarbeiter1") === -1) {
          newUsers.push({
            username: 'mitarbeiter1',
            role: 'Mitarbeiter',
            password: '$2a$12$1OrKmF4sxwVHsB9jOET5B.qdUR5.XqI6wgoKhJqpF08Z0lJJkWciu'
          });
        }
        if (newUsers.length > 0) {
          await db.collection("users").insertMany(newUsers);
        }
      }
    });
  }
};