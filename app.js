const bodyParser = require("body-parser");
const express = require("express");
const server = express();
const { v4: uuidv4 } = require("uuid");
const MongoClient = require("mongodb").MongoClient;
var cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const middleware = require("./middleware");

require('dotenv').config()
server.use(bodyParser.json());
server.use(cors({ origin: "http://localhost:4200" }));

const config = process.env;
const connectionString = config.ConnectionStringDB;

server.get("/technologies", middleware.verifyToken, async (req, res) => {
  try {
    client = await MongoClient.connect(connectionString);
    const db = client.db("technology-radar");
    let r = await db.collection("technologies").find({}).toArray();
    res.status(200).send(r);
  } catch (err) {
    console.log(err);
    res.status(400).send();
  } finally {
    client.close();
  }
  res.end;
});

server.get("/technologies/:id", middleware.verifyToken, async (req, res) => {
  try {
    client = await MongoClient.connect(connectionString);
    const db = client.db("technology-radar");
    let r = await db.collection("technologies").findOne({ id: req.params.id });
    res.status(200).send(r);
  } catch (err) {
    console.log(err);
    res.status(400).send();
  } finally {
    client.close();
  }
  res.end;
});

server.post("/technologies", middleware.verifyToken, async (req, res) => {
  try {
    client = await MongoClient.connect(connectionString);
    const db = client.db("technology-radar");
    let r = await db
      .collection("technologies")
      .insertOne({ ...req.body, id: uuidv4() });
    console.log(`Added a new technology with id ${r.insertedId}`);
    res.status(201).send();
  } catch (err) {
    console.log(err);
    res.status(400).send();
  } finally {
    client.close();
  }
  res.end;
});

server.post("/login", async (req, res) => {
  // Our login logic starts here
  try {
    // Get user input
    const { username, password } = req.body;

    // Validate user input
    if (!(username && password)) {
      res.status(400).send("Invalid Credentials");
    }
    // Validate if user exist in our database
    client = await MongoClient.connect(connectionString);
    const db = client.db("technology-radar");
    let user = await db
      .collection("users")
      .findOne({ username: username});

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { username: user.username, role: user.role },
        config.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // user
      res.status(200).json({success: true, message: 'Authentication successful', user: {username: user.username, role: user.role, token: token}});
    } else {
        res.status(400).json({success: false, message: 'Authentication failed'});
    }
  } catch (err) {
    console.log(err);
  }
});

server.listen(4566, () => {
  console.log("Tech-Radar is running....");
});
