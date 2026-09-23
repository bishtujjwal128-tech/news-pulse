const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "production") {
    dotenv.config({
        path: path.join(__dirname, "..", ".env")
    });
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
}

const dbUrl = new URL(databaseUrl);

const pool = new Pool({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace("/", "") || "postgres",
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;