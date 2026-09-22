const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", ".env")
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    database: "postgres",
    ssl: false
});

module.exports = pool;