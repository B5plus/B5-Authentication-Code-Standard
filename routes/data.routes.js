const express = require("express");
const authController = require("../controller/data.controller");
const dataRouter = express.Router();

//create user route
dataRouter.post("/received-data", authController.getReceivedata);

module.exports = dataRouter;
