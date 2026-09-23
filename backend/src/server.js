const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");
const dotenv = require("dotenv");

const pool = require("./db");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: path.join(__dirname, "..", ".env"),
  });
}

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());


// --------------------------------------------------
// ROOT
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "News Pulse backend is running",
  });
});


// --------------------------------------------------
// DATABASE TEST
// --------------------------------------------------

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// --------------------------------------------------
// DEBUG DATABASE
// --------------------------------------------------

app.get("/debug-db", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS user,
        inet_server_addr() AS server
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Debug DB error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});


// --------------------------------------------------
// CLUSTERS
// --------------------------------------------------

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


// --------------------------------------------------
// ARTICLES FOR A CLUSTER
// --------------------------------------------------

app.get("/clusters/:id/articles", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        title,
        summary,
        content,
        url,
        source,
        published_at
      FROM public.articles
      WHERE cluster_id = $1
      ORDER BY published_at DESC
      `,
      [id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(
      "Error fetching cluster articles:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch cluster articles",
    });
  }
});


// --------------------------------------------------
// AI SUMMARY
// --------------------------------------------------

const PYTHON_PATH = "python3";

const SUMMARIZER_PATH = path.join(
  __dirname,
  "../../scraper/summarize_api.py"
);

app.get("/clusters/:id/summary", async (req, res) => {
  try {
    const { id } = req.params;

    // Get cluster
    const clusterResult = await pool.query(
      `
      SELECT
        id,
        label
      FROM public.clusters
      WHERE id = $1
      `,
      [id]
    );

    if (clusterResult.rows.length === 0) {
      return res.status(404).json({
        error: "Cluster not found",
      });
    }

    const cluster = clusterResult.rows[0];

    // Get articles
    const articlesResult = await pool.query(
      `
      SELECT
        title,
        summary,
        content,
        source,
        published_at
      FROM public.articles
      WHERE cluster_id = $1
      ORDER BY published_at DESC
      `,
      [id]
    );

    const articles = articlesResult.rows;

    if (articles.length === 0) {
      return res.json({
        cluster_id: id,
        cluster_label: cluster.label,
        summary: "No articles are available for this cluster.",
        article_count: 0,
      });
    }

    // Combine article information
    const articleText = articles
      .map((article, index) => {
        return `
Article ${index + 1}

Title:
${article.title || "Unknown"}

Source:
${article.source || "Unknown"}

Published:
${article.published_at || "Unknown"}

Summary:
${article.summary || ""}

Content:
${article.content || ""}
`;
      })
      .join("\n");

    // Start Python summarizer
    const python = spawn(
      PYTHON_PATH,
      [SUMMARIZER_PATH],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("error", (error) => {
      console.error(
        "Failed to start Python:",
        error
      );
    });

    python.stdin.write(articleText);
    python.stdin.end();

    python.on("close", (code) => {
      console.log(
        "Python summarizer exited with code:",
        code
      );

      if (errorOutput) {
        console.log(
          "Python output:",
          errorOutput
        );
      }

      try {
        const result = JSON.parse(output);

        if (!result.success) {
          return res.status(500).json({
            error: "AI summarization failed",
            details: result.error,
          });
        }

        res.json({
          cluster_id: id,
          cluster_label: cluster.label,
          summary: result.summary,
          article_count: articles.length,
        });

      } catch (error) {
        console.error(
          "Invalid Python response:",
          output
        );

        res.status(500).json({
          error: "Invalid summarizer response",
          details: output,
        });
      }
    });

  } catch (error) {
    console.error(
      "AI summary error:",
      error
    );

    res.status(500).json({
      error: "Failed to generate AI summary",
      details: error.message,
    });
  }
});


// --------------------------------------------------
// SERVER
// --------------------------------------------------

const PORT = process.env.PORT || 5050;

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `News Pulse backend running on port ${PORT}`
    );
  }
);