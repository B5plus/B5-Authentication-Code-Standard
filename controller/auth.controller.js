//import model
const User = require("../models/user");
const Sessions = require("../models/session");

//required jwt
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { config } = require("dotenv");
require("dotenv").config();

//resgister user
async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "name, email and password are required",
    });
  }

  const UserAlreadyRegister = await User.findOne({
    where: {
      email: email,
    },
  });

  if (UserAlreadyRegister) {
    return res.status(409).json({
      message: "user already register with this email",
    });
  }

  const newUser = await User.create({
    name: name,
    email: email,
    password: password,
  });

  //create token when creating a user and and send in response that token
  const token = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  //refresh token generation
  const refreshtoken = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("refreshToken", refreshtoken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  //send reponse to the user after resgitration

  return res.status(201).json({
    message: "User register successfully",
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    },
  });
}

//get user information
async function getUserInformation(req, res) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "token is required" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  console.log(decoded);

  const user = await User.findAll({
    where: {
      id: decoded.id,
    },
    attributes: ["id", "name", "email", "created_at"],
  });

  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }

  return res.status(200).json({ user });
}

//refresh token code
async function refreshtoken(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "refresh token not found" });
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

  const accessToken = jwt.sign(
    {
      id: decoded.id,
      email: decoded.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  //here will aslo re-regenerate the refresh token beacuse if someone steel the
  // refresh token we can use the refresh token to generate new access token
  //this is why we have generated the refresh token here again and this is indutry standard

  const newRefreshToken = jwt.sign(
    {
      id: decoded.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  //added new  refresh token to cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  //creating a new session with new refresh token
  await Sessions.create({
    userId: decoded.id,
    refreshTokenHash: newRefreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    message: "Access token refresh successfully",
    accessToken,
  });
}

//logout controller code
async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "refresh token not found",
    });
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await Sessions.findOne({
    where: { refreshTokenHash, revoked: false },
  });

  if (!session) {
    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }

  //revoke the session so this refresh token can never be used again
  session.revoked = true;
  await session.save();

  //clear the refresh token cookie from the browser
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
}

//logout from all devices
async function logoutAll(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found",
    });
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

  //revoke every active session belonging to this user
  await Sessions.update(
    { revoked: true },
    { where: { userId: decoded.id, revoked: false } },
  );

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return res.status(200).json({
    message: "Logged out from all devices successfully",
  });
}

//user login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required",
    });
  }

  const user = await User.findOne({ where: { email } });

  if (!user || user.password !== password) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  //generate refresh token (raw JWT goes to the cookie)
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  //hash the refresh token before storing it in DB
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  //create a session row for this login
  const session = await Sessions.create({
    userId: user.id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  //access token tied to this session
  const accessToken = jwt.sign(
    { id: user.id, sessionId: session.id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  //set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "Login successful",
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
module.exports = {
  register,
  getUserInformation,
  refreshtoken,
  logout,
  logoutAll,
  login,
};
