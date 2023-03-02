const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require("uuid");
const dbo = require('./db');
const config = process.env;

module.exports = {
    getAllTechnologies: async (req, res) => {
        let search = {}
        if (req.user.role == 'Mitarbeiter') {
            search = { isPublished: true }
        }
        await dbo.connectToServer(async function (db, err) {
            if (!err) {
                let r = await db.collection("technologies").find(search).toArray();
                res.status(200).send(r);
            } else {
                res.status(400).send();
            }
        });
        res.end;
    },
    getOneTechnology: async (req, res) => {
        await dbo.connectToServer(async function (db, err) {
            if (!err) {
                let r = await db.collection("technologies").findOne({ id: req.params.id });
                if (req.query.expand === "history") {
                    let history = await db.collection("technology_revision").find({ id: req.params.id }).sort({ "revision": -1 }).toArray();
                    r["history"] = history;
                }
                res.status(200).send(r);
            } else {
                res.status(400).send();
            }
        });
        res.end;
    },
    postTechnology: async (req, res) => {
        if (req.user.role == 'CTO') {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            let techID = uuidv4();
            let technology = req.body;
            technology["id"] = techID;
            technology["createdDate"] = new Date();
            technology["createdBy"] = req.user.username;
            await dbo.connectToServer(async function (db, err) {
                if (!err) {
                    let r = await db
                        .collection("technologies")
                        .insertOne(technology);
                    console.log(`Added a new technology with id ${techID}`);
                    res.status(200).send(r);
                } else {
                    res.status(400).send();
                }
            });
        } else {
            return res.status(403).json({ success: false, message: 'Only Admins allowed' });
        }
        res.end;
    },
    putTechnology: async (req, res) => {
        if (req.user.role == 'CTO') {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            let technology = req.body;
            technology["lastModifiedDate"] = new Date();
            technology["lastModifiedBy"] = req.user.username;
            if (technology.isPublished) {
                technology["publishDate"] = new Date();
            }
            await dbo.connectToServer(async function (db, err) {
                if (!err) {
                    let oldTechnology = await db.collection("technologies").findOne({ id: req.params.id });
                    delete oldTechnology._id;
                    let r = await db
                        .collection("technologies")
                        .updateOne({ id: req.params.id }, { $set: technology, $inc: { revision: 1 } });
                    await db
                        .collection("technology_revision")
                        .insertOne(oldTechnology);
                    console.log(`Updated technology with id ${req.params.id}`);
                    res.status(204).send();
                } else {
                    res.status(400).send();
                }
            });
        } else {
            return res.status(403).json({ success: false, message: 'Only Admins allowed' });
        }
        res.end;
    },
    patchTechnology: async (req, res) => {
        if (req.user.role == 'CTO') {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            let technology = req.body;
            technology["lastModifiedDate"] = new Date();
            technology["lastModifiedBy"] = req.user.username;
            await dbo.connectToServer(async function (db, err) {
                if (!err) {
                    let oldTechnology = await db.collection("technologies").findOne({ id: req.params.id });
                    delete oldTechnology._id;
                    let r = await db
                        .collection("technologies")
                        .updateOne({ id: req.params.id }, { $set: technology });
                    await db
                        .collection("technology_revision")
                        .insertOne(oldTechnology);
                    console.log(`Updated technology with id ${req.params.id}`);
                    res.status(204).send();
                } else {
                    res.status(400).send();
                }
            });
        } else {
            return res.status(403).json({ success: false, message: 'Only Admins allowed' });
        }
        res.end;
    },
    deleteTechnology: async (req, res) => {
        if (req.user.role == 'CTO') {
            await dbo.connectToServer(async function (db, err) {
                if (!err) {
                    let r = await db
                        .collection("technologies")
                        .deleteOne({ id: req.params.id });
                    console.log(`Deleted technology with id ${req.params.id}`);
                    res.status(204).send();
                } else {
                    res.status(400).send();
                }
            });
        } else {
            return res.status(403).json({ success: false, message: 'Only Admins allowed' });
        }
        res.end;
    },
    getLoginHistory: async (req, res) => {
        if (req.user.role == 'CTO') {
            await dbo.connectToServer(async function (db, err) {
                if (!err) {
                    let r = await db.collection("login_history").find({}).sort({ "logindatetime": -1 }).toArray();
                    res.status(200).send(r);
                } else {
                    res.status(400).send();
                }
            });
        } else {
            return res.status(403).json({ success: false, message: 'Only Admins allowed' });
        }
        res.end;
    },
    login: async (req, res) => {
        const { username, password } = req.body;

        if (!(username && password)) {
            res.status(400).send("Invalid Credentials");
        }

        await dbo.connectToServer(async function (db, err) {
            if (!err) {
                let user = await db
                    .collection("users")
                    .findOne({ username: username });

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
                        .insertOne({ userid: user._id, username: username, logindatetime: new Date() });

                    res.status(200).json({ success: true, message: 'Authentication successful', user: { username: user.username, role: user.role, token: token } });
                } else {
                    res.status(400).json({ success: false, message: 'Authentication failed' });
                }
            } else {
                res.status(400).send();
            }
        });


    }
};