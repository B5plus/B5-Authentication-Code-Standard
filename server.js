const express = require("express");
const morgan = require("morgan");
const cookiparser = require("cookie-parser");
const db = require("./config/database");
const ratelimiting = require("./middleware/rateLimiter");

//import routes
const authRouter = require("./routes/auth.routes");
const dataRouter = require("./routes/data.routes");

const app = express();

app.use(express.json());
//logger to store which api was hit
app.use(morgan("dev"));
app.use(cookiparser());

//rate limiting
app.use("/api", ratelimiting);

//base routes url
app.use("/api/app/auth", authRouter);
app.use("/api/data", dataRouter);

app.get("/", (req, res) => {
  console.log("your api is running on port 8080");
  res.send("api health");
});

app.listen(8080, () => {
  console.log("server is running on 8080");
});

async function testConnection() {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    console.log(rows);
  } catch (err) {
    console.error("Database error:", err.message);
  }
}

testConnection();
