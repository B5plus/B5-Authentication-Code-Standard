# Authentication API

This is a simple backend project that lets users **sign up**, **log in**, and stay
logged in safely using tokens. It also has one endpoint to **add a product**.

Think of it as the "login system" part of a website.

## What it uses

- **Node.js + Express** – runs the server and handles requests
- **MySQL** – the database where users and products are saved
- **Sequelize** – helps talk to the database using JavaScript instead of raw SQL
- **JWT (JSON Web Tokens)** – used to keep users logged in securely

## Before you start

Make sure these are installed on your computer:

1. **Node.js** – download from https://nodejs.org (version 18 or newer)
2. **MySQL** – a running database server

You can check Node is installed by running:

```bash
node -v
```

## How to set it up (step by step)

### Step 1 – Get the code and install packages

```bash
git clone <your-repo-url>
cd Authentication
npm install
```

`npm install` downloads everything the project needs. You only do this once.

### Step 2 – Create a `.env` file

In the main project folder, create a file named `.env`.
This file stores your secret settings. Paste this inside and change the values:

```env
# Your database details
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=authentication
DB_PORT=3306

# A secret word used to sign login tokens (make it long and random)
JWT_SECRET=your_long_random_secret
```

### Step 3 – Set up the database

First, create the database in MySQL:

```sql
CREATE DATABASE authentication;
```

Then create the tables. This project does **not** create them automatically, so run the
SQL below once:

```sql
USE authentication;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  refreshTokenHash VARCHAR(255) NOT NULL,
  ip VARCHAR(255) NOT NULL,
  userAgent VARCHAR(255) NOT NULL,
  revoked BOOLEAN DEFAULT false,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  image_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4 – Start the server

```bash
# Normal start
node server.js

# OR auto-restart when you edit files (better for development)
npx nodemon server.js
```

The server runs on **port 8080**. To check it works, open your browser at:

```
http://localhost:8080/
```

You should see a health message.

## The available endpoints

An "endpoint" is just a URL you send requests to.

### Login & user endpoints – start with `/api/app/auth`

| What you do        | Method | URL              | Login needed?      |
| ------------------ | ------ | ---------------- | ------------------ |
| Create an account  | POST   | `/register`      | No                 |
| Log in             | POST   | `/login`         | No                 |
| See my own info    | GET    | `/get-me`        | Yes (access token) |
| Get a fresh token  | GET    | `/refresh-token` | Yes (cookie)       |
| Log out            | GET    | `/logout`        | Yes (cookie)       |
| Log out everywhere | GET    | `/logout-all`    | Yes (cookie)       |

### Product endpoint – starts with `/api/data`

| What you do    | Method | URL              | Login needed?      |
| -------------- | ------ | ---------------- | ------------------ |
| Add a product  | POST   | `/received-data` | Yes (access token) |

**How login is checked:**

- For endpoints that need an access token, send it in the request header like this:
  `Authorization: Bearer YOUR_TOKEN`
- The refresh token is saved automatically in a secure cookie. Because it is marked
  "secure", you may need **HTTPS** to test logout/refresh (or change the cookie settings).

## Folder guide

```
config/       Connects the app to the database
controller/   The actual logic for each request
models/       Describes the database tables (User, Session, Product)
routes/       Lists the URLs and links them to the logic
server.js     Where the app starts
```

## Important note

Right now, passwords are saved as plain text (not scrambled). This is fine for learning,
but **before using this for real**, you should hash passwords with a tool like `bcrypt`
so they stay safe.
