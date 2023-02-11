const MongoClient = require('mongodb').MongoClient;
// const connectionString = process.env.MongoDBURI;
const connectionString = 'mongodb://localhost:27017/mydb';

let dbConnection;

module.exports = {
  connectToServer: async function (callback) {
    try{
      client = await MongoClient.connect(connectionString);
      dbConnection = client.db('technology-radar');
      await callback();
    } catch(err) {
      await callback(err);
      console.log(err);
    } finally {
      client.close();
    }
  },

  getDb: function () {
    return dbConnection;
  },
};