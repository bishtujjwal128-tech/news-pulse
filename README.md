# 📰 News Pulse

### AI-Powered News Intelligence & Story Clustering Platform

News Pulse is a full-stack news intelligence platform that collects news articles, organizes related stories into clusters, and generates concise summaries for each news event.

Instead of making users read multiple articles covering the same event, News Pulse brings related coverage together in one place and provides a quick summary of the available information.

## 🚀 Live Demo

**Frontend:** https://news-pulse-frontend-3qir.onrender.com

**Backend API:** https://news-pulseproject.onrender.com

**GitHub:** https://github.com/bishtujjwal128-tech/news-pulse

---

## ✨ Features

* 📰 News article ingestion
* 🔗 Related-story clustering
* 🗂️ Cluster-based news organization
* 🔍 Article-level viewing
* 🤖 Automatic extractive summarization
* 📊 News cluster analytics
* 🔎 Search and filtering
* 📰 Source filtering
* 🔄 Automatic refresh
* 🕐 Last-updated information
* 🐳 Dockerized backend
* ☁️ Render deployment
* 🗄️ Supabase PostgreSQL database
* ⚡ REST API using Node.js and Express
* ⚛️ React + Vite frontend

---

## 🧠 Problem

News events are frequently covered by multiple publishers.

A user interested in a particular event may need to open several articles to understand:

* What happened?
* Which sources are reporting it?
* When was it reported?
* What information is common across the coverage?

News Pulse addresses this by grouping related articles into a single news cluster.

### Traditional workflow

```text
News Source A → Article
News Source B → Article
News Source C → Article
News Source D → Article

User must read everything separately
```

### News Pulse workflow

```text
News Source A ─┐
News Source B ─┤
News Source C ─┼──→ News Cluster → Concise Summary
News Source D ─┘
```

---

## 🏗️ Architecture

```text
                     NEWS SOURCES
                          │
                          ▼
                  Python Data Pipeline
                          │
                          ▼
                 Article Processing
                          │
                          ▼
                    Story Clustering
                          │
                          ▼
                 Supabase PostgreSQL
                    │             │
                    │             │
                    ▼             ▼
                Clusters       Articles
                    │
                    ▼
              Node.js + Express
                    │
             ┌──────┴──────┐
             │             │
             ▼             ▼
        Article API    Summary API
             │             │
             └──────┬──────┘
                    ▼
              React + Vite
                    │
                    ▼
             News Pulse UI
```

---

## 🛠️ Technology Stack

| Layer               | Technology            |
| ------------------- | --------------------- |
| Frontend            | React + Vite          |
| Backend             | Node.js + Express     |
| Data Processing     | Python                |
| Database            | PostgreSQL            |
| Database Hosting    | Supabase              |
| NLP                 | Scikit-learn / TF-IDF |
| Containerization    | Docker                |
| Backend Deployment  | Render                |
| Frontend Deployment | Render                |
| Version Control     | Git + GitHub          |

---

## 📂 Project Structure

```text
news-pulse/
│
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   └── db.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── scraper/
│   ├── summarizer.py
│   ├── summarize_api.py
│   └── requirements.txt
│
├── Dockerfile
├── .gitignore
└── README.md
```

---

## 🔄 How the System Works

### 1. Article ingestion

The Python pipeline collects and processes news articles.

Each article contains information such as:

* Title
* Summary
* Content
* Source
* Published time
* URL

### 2. Article processing

The incoming article data is cleaned and prepared for storage and clustering.

### 3. Story clustering

Related articles are associated with a common cluster.

A cluster represents a news event/topic and can contain articles from multiple sources.

### 4. Database storage

Processed data is stored in PostgreSQL through Supabase.

The primary relationship is:

```text
clusters
    │
    │ 1 → many
    ▼
articles
```

### 5. Backend API

The Express backend exposes REST endpoints for the frontend.

### 6. Frontend

The React application retrieves cluster and article information through the API and presents it through the dashboard.

### 7. Summary generation

When a user requests a summary, the backend collects the articles belonging to the selected cluster and sends their content to the Python summarization service.

---

# 🤖 AI / NLP Summarization

News Pulse currently uses a lightweight **TF-IDF-based extractive summarizer**.

The system does not generate new facts. Instead, it identifies important sentences from the available article content.

### Process

```text
Article Content
      │
      ▼
Sentence Splitting
      │
      ▼
TF-IDF Vectorization
      │
      ▼
Sentence Relevance Scores
      │
      ▼
Rank Sentences
      │
      ▼
Select Top Sentences
      │
      ▼
Final Summary
```

TF-IDF is used to identify terms that are important within the article's sentence set.

The highest-scoring sentences are selected while preserving their original order.

---

## 🧩 Why a Lightweight Summarizer?

The first deployment approach used a heavier transformer-based model.

During deployment, the Render environment had a memory limitation and the heavier inference process exceeded the available resources.

Instead of increasing infrastructure requirements, the summarization layer was redesigned using lightweight NLP.

This resulted in:

* Lower memory consumption
* Faster startup
* Simpler deployment
* No large model download
* A functional production summarization feature

This is an example of adapting the architecture to deployment constraints.

---

# 🗄️ Database

The PostgreSQL database contains two core entities:

### `clusters`

Stores information about news clusters.

### `articles`

Stores individual news articles.

Important article fields include:

```text
id
title
summary
content
url
source
published_at
cluster_id
created_at
```

`cluster_id` connects an article to its corresponding cluster.

---

# 🔌 API Documentation

## GET `/`

Checks whether the backend is running.

### Response

```json
{
  "message": "News Pulse backend is running"
}
```

---

## GET `/clusters`

Returns the available news clusters.

Example response:

```json
[
  {
    "id": 26,
    "label": "Example News Event",
    "article_count": 5,
    "start_time": "...",
    "end_time": "...",
    "source": "BBC, Reuters"
  }
]
```

---

## GET `/clusters/:id/articles`

Returns all articles belonging to a specific cluster.

Example:

```text
GET /clusters/26/articles
```

Response:

```json
[
  {
    "id": 28,
    "title": "Example Article",
    "summary": "Article summary",
    "content": "Article content",
    "url": "https://example.com/article",
    "source": "BBC",
    "published_at": "2026-09-22T14:20:01.000Z"
  }
]
```

---

## GET `/clusters/:id/summary`

Generates a summary for all articles belonging to the selected cluster.

Example:

```text
GET /clusters/26/summary
```

Response:

```json
{
  "cluster_id": 26,
  "cluster_label": "Example News Event",
  "summary": "Generated summary...",
  "article_count": 5
}
```

---

# 🐳 Docker

The backend is containerized using Docker.

The Docker image contains:

* Node.js
* Python
* Python dependencies
* Node dependencies
* Express backend
* Summarization code

The container exposes port `5050`.

Example local execution:

```bash
docker build -t news-pulse-backend .
```

```bash
docker run -d \
  --name news-pulse-test \
  -p 5051:5050 \
  --env-file backend/.env \
  -e NODE_ENV=production \
  news-pulse-backend
```

---

# ☁️ Deployment

## Backend

The backend is deployed on Render as a Docker-based service.

Production flow:

```text
GitHub
   ↓
Render
   ↓
Docker Build
   ↓
Node + Python Environment
   ↓
Express API
   ↓
Supabase PostgreSQL
```

## Frontend

The React/Vite frontend is deployed separately on Render.

The production frontend communicates with the backend using:

```text
VITE_API_URL
```

---

# 🔐 Environment Variables

Sensitive credentials are not committed to GitHub.

Example local configuration:

```env
DATABASE_URL=your_database_connection_string
```

Frontend:

```env
VITE_API_URL=your_backend_url
```

Production environment variables are configured through Render.

---

# 📈 Future Improvements

Potential improvements include:

* Semantic embeddings for stronger clustering
* Better duplicate detection
* Incremental article ingestion
* Pagination
* Authentication
* User-specific topic tracking
* Source reliability metadata
* More advanced analytics
* LLM-based abstractive summarization
* Background processing queues
* Caching
* Monitoring and logging
* Automated scheduled ingestion

---

# 🎯 Project Goal

News Pulse demonstrates how a complete data product can combine:

```text
Data Collection
      +
NLP Processing
      +
Database Design
      +
REST APIs
      +
React UI
      +
Docker
      +
Cloud Deployment
```

into a production-style news intelligence application.

---

## 👨‍💻 Author

**Ujjwal Bisht**

B.Tech — Artificial Intelligence & Machine Learning

GitHub: https://github.com/bishtujjwal128-tech


                  ┌─────────────────┐
                  │   News Sources  │
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │ Python Pipeline │
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │   Clustering    │
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │ Supabase / SQL  │
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │ Express Backend │
                  └───────┬─────────┘
                          / \
                         /   \
                        ↓     ↓
                 Articles    Summary
                        \     /
                         \   /
                          ↓ ↓
                  ┌─────────────────┐
                  │ React Dashboard │
                  └─────────────────┘
