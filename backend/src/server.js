const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());


// ==========================================
// PYTHON SUMMARIZER
// ==========================================

const PYTHON_PATH = "python3";

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
  });// ==========================================
  // AI CLUSTER SUMMARY
  // ==========================================
  
  app.get("/clusters/:id/summary", async (req, res) => {
    try {
      const { id } = req.params;
  
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
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `News Pulse backend running on port ${PORT}`
    );
  });