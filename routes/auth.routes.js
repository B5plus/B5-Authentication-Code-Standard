const express = require("express");
const authController = require("../controller/auth.controller");
const authRouter = express.Router();

//create user route
authRouter.post("/register", authController.register);

//user-login route
authRouter.post("/login", authController.login);

//get user information route
authRouter.get("/get-me", authController.getUserInformation);

//get refresh token
authRouter.get("/refresh-token", authController.refreshtoken);

//logout user
authRouter.get("/logout", authController.logout);

//logout All
authRouter.get("/logout-all", authController.logoutAll);

module.exports = authRouter;
