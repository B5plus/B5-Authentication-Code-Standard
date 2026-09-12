const express = require("express");
const ratelimit = require("express-rate-limit");

//create rate limiter for role back access controll here
const apiLimiter = ratelimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many request. Please try again later.",
  },
});

module.exports = apiLimiter;
