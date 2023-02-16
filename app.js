const bodyParser = require("body-parser");
const express = require("express");
const server = express();
const { v4: uuidv4 } = require("uuid");
const MongoClient = require("mongodb").MongoClient;
var cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const middleware = require("./middleware");
const validation = require("./validation");
const { validationResult } = require('express-validator');

require('dotenv').config()
server.use(bodyParser.json());
server.use(cors({ origin: "http://localhost:4200" }));

const config = process.env;
const connectionString = config.ConnectionStringDB;

server.get("/technologies", middleware.verifyToken, async (req, res) => {
  search = {}
  if(req.user.role=='Mitarbeiter'){
    search = {isPublished:true}
  }
  try {
    client = await MongoClient.connect(connectionString);
    const db = client.db("technology-radar");
    let r = await db.collection("technologies").find(search).toArray();
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
    if(req.query.expand==="history"){
      let history = await db.collection("technology_revision").find({ id: req.params.id }).sort({"revision":-1}).toArray();
      r["history"] = history;
    }
    res.status(200).send(r);
  } catch (err) {
    console.log(err);
    res.status(400).send();
  } finally {
    client.close();
  }
  res.end;
});

server.post("/technologies", middleware.verifyToken, validation.technologyValidation, async (req, res) => {
  if(req.user.role=='CTO'){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    let techID = uuidv4();
    let technology = req.body;
    technology["id"] = techID;
    technology["createdDate"] = new Date();
    technology["createdBy"] = req.user.username;
    try {
      client = await MongoClient.connect(connectionString);
      const db = client.db("technology-radar");
      let r = await db
        .collection("technologies")
        .insertOne(technology);
      console.log(`Added a new technology with id ${techID}`);
      res.status(201).send({ id: techID });
    } catch (err) {
      console.log(err);
      res.status(400).send();
    } finally {
      client.close();
    }
  } else {
    return res.status(403).json({success: false, message: 'Only Admins allowed'});
  }
  res.end;
});

server.put("/technologies/:id", middleware.verifyToken, validation.technologyValidation, async (req, res) => {
  if(req.user.role=='CTO'){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    let technology = req.body;
    technology["lastModifiedDate"] = new Date();
    technology["lastModifiedBy"] = req.user.username;
    if(technology.isPublished){
      technology["publishDate"] = new Date();
    }
    try {
      client = await MongoClient.connect(connectionString);
      const db = client.db("technology-radar");
      let oldTechnology = await db.collection("technologies").findOne({ id: req.params.id });
      delete oldTechnology._id;
      let r = await db
        .collection("technologies")
        .updateOne({id: req.params.id}, {$set: technology, $inc: {revision: 1}});
      await db
          .collection("technology_revision")
          .insertOne(oldTechnology);
      console.log(`Updated technology with id ${req.params.id}`);
      res.status(204).send();
    } catch (err) {
      console.log(err);
      res.status(400).send();
    } finally {
      client.close();
    }
  } else {
    return res.status(403).json({success: false, message: 'Only Admins allowed'});
  }
  res.end;
});

server.patch("/technologies/:id", middleware.verifyToken, validation.technologyPatchValidation, async (req, res) => {
  if(req.user.role=='CTO'){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    let technology = req.body;
    technology["lastModifiedDate"] = new Date();
    technology["lastModifiedBy"] = req.user.username;
    try {
      client = await MongoClient.connect(connectionString);
      const db = client.db("technology-radar");
      let oldTechnology = await db.collection("technologies").findOne({ id: req.params.id });
      delete oldTechnology._id;
      let r = await db
        .collection("technologies")
        .updateOne({id: req.params.id}, {$set: technology});
      await db
          .collection("technology_revision")
          .insertOne(oldTechnology);
      console.log(`Updated technology with id ${req.params.id}`);
      res.status(204).send();
    } catch (err) {
      console.log(err);
      res.status(400).send();
    } finally {
      client.close();
    }
  } else {
    return res.status(403).json({success: false, message: 'Only Admins allowed'});
  }
  res.end;
});

server.delete("/technologies/:id", middleware.verifyToken, async (req, res) => {
  if(req.user.role=='CTO'){
    try {
      client = await MongoClient.connect(connectionString);
      const db = client.db("technology-radar");
      let r = await db
        .collection("technologies")
        .deleteOne({id: req.params.id});
      console.log(`Deleted technology with id ${req.params.id}`);
      res.status(204).send();
    } catch (err) {
      console.log(err);
      res.status(400).send();
    } finally {
      client.close();
    }
  } else {
    return res.status(403).json({success: false, message: 'Only Admins allowed'});
  }
  res.end;
});

server.get("/loginhistory", middleware.verifyToken, async (req, res) => {
  if(req.user.role=='CTO'){
    try {
      client = await MongoClient.connect(connectionString);
      const db = client.db("technology-radar");
      let r = await db.collection("login_history").find({}).sort({"logindatetime":-1}).toArray();
      res.status(200).send(r);
    } catch (err) {
      console.log(err);
      res.status(400).send();
    } finally {
      client.close();
    }
  } else {
    return res.status(403).json({success: false, message: 'Only Admins allowed'});
  }
  res.end;
});

server.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!(username && password)) {
      res.status(400).send("Invalid Credentials");
    }
    client = await MongoClient.connect(connectionString);
    const db = client.db("technology-radar");
    let user = await db
      .collection("users")
      .findOne({ username: username});

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { username: user.username, role: user.role },
        config.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      await db
      .collection("login_history")
      .insertOne({ userid: user._id, username: username, logindatetime: new Date()});

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
