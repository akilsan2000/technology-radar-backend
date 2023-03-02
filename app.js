const bodyParser = require("body-parser");
const express = require("express");
const server = express();
var cors = require("cors");
const middleware = require("./middleware");
const validation = require("./validation");
const routes = require("./routes");
const dbo = require('./db');

require('dotenv').config()
server.use(bodyParser.json());
server.use(cors({ origin: "http://localhost:4200" }));

dbo.initDb();

server.get("/api/v1/technologies", middleware.verifyToken, routes.getAllTechnologies);

server.get("/api/v1/technologies/:id", middleware.verifyToken, routes.getOneTechnology);

server.post("/api/v1/technologies", middleware.verifyToken, validation.technologyValidation, routes.postTechnology);

server.put("/api/v1/technologies/:id", middleware.verifyToken, validation.technologyValidation, routes.putTechnology);

server.patch("/api/v1/technologies/:id", middleware.verifyToken, validation.technologyPatchValidation, routes.patchTechnology);

server.delete("/api/v1/technologies/:id", middleware.verifyToken, routes.deleteTechnology);

server.get("/api/v1/loginhistory", middleware.verifyToken, routes.getLoginHistory);

server.post("/api/v1/login", routes.login);

server.listen(4566, () => {
  console.log("Tech-Radar is running....");
});
