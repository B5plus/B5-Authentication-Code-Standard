const User = require("../models/user");
const Product = require("../models/product");

//required jwt
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function getReceivedata(req, res) {
  const {
    name,
    sku,
    description,
    price,
    discount_price,
    stock,
    category,
    brand,
    image_url,
    is_active,
  } = req.body;

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "token is required" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findOne({
    where: { id: decoded.id },
    attributes: ["id", "name", "email", "created_at"],
  });

  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }

  if (!name || !sku || price == null || !category) {
    return res.status(400).json({
      message: "name, sku, price and category are required",
    });
  }

  const savedata = await Product.create({
    name,
    sku,
    description,
    price,
    discount_price,
    stock,
    category,
    brand,
    image_url,
    is_active,
  });

  return res.status(201).json({
    message: "Product created successfully",
    product: savedata,
  });
}

//get data by user

module.exports = {
  getReceivedata,
};
