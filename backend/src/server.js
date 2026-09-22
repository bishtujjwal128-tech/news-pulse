const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());


// ==========================================
// PYTHON SUMMARIZER
// ==========================================

const PYTHON_PATH = path.join(
  __dirname,
  "../../scraper/venv/bin/python"
);

const SUMMARIZER_PATH = path.join(
  __dirname,
  "../../scraper/summarize_api.py"
);


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "News Pulse API is running",
  });
});


// ==========================================
// DATABASE TEST
// ==========================================

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      database_time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// ==========================================
// DEBUG DATABASE
// ==========================================

app.get("/debug-db", async (req, res) => {
  try {
    const dbResult = await pool.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name
    `);

    const tablesResult = await pool.query(`
      SELECT
        table_schema,
        table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    res.json({
      database: dbResult.rows[0],
      tables: tablesResult.rows,
    });
  } catch (error) {
    console.error("Debug database error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});


// ==========================================
// GET ALL CLUSTERS
// ==========================================

app.get("/clusters", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          c.id,
          c.label,
          COUNT(a.id)::int AS article_count,
          MIN(a.published_at) AS start_time,
          MAX(a.published_at) AS end_time,
  
          COALESCE(
            STRING_AGG(
              DISTINCT a.source,
              ', '
              ORDER BY a.source
            ),
            ''
          ) AS source
  
        FROM public.clusters c
  
        LEFT JOIN public.articles a
          ON a.cluster_id = c.id
  
        GROUP BY
          c.id,
          c.label
  
        ORDER BY
          start_time DESC
      `);
  
      res.json(result.rows);
  
    } catch (error) {
  
      console.error(
        "Error fetching clusters:",
        error
      );
  
      res.status(500).json({
        error: "Failed to fetch clusters",
      });
    }
  });