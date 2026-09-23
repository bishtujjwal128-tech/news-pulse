import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Newspaper,
  BarChart3,
  Layers3,
} from "lucide-react";

import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5050";

function App() {
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [articles, setArticles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [aiSummary, setAiSummary] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] =
    useState("All Sources");

  const [lastUpdated, setLastUpdated] = useState(null);

  // --------------------------------------------------
  // FETCH CLUSTERS
  // --------------------------------------------------

  const fetchClusters = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `${API_URL}/clusters`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch clusters"
        );
      }

      const data = await response.json();

      setClusters(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Error fetching clusters:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    fetchClusters();
  }, []);

  // --------------------------------------------------
  // AUTO REFRESH EVERY 5 MINUTES
  // --------------------------------------------------

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchClusters(true);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // --------------------------------------------------
  // TOTAL ARTICLES
  // --------------------------------------------------

  const totalArticles = useMemo(() => {
    return clusters.reduce(
      (sum, cluster) =>
        sum + Number(cluster.article_count || 0),
      0
    );
  }, [clusters]);

  // --------------------------------------------------
  // AVAILABLE SOURCES
  // --------------------------------------------------

  const availableSources = useMemo(() => {
    const sources = clusters.flatMap((cluster) =>
      (cluster.source || "")
        .split(",")
        .map((source) => source.trim())
        .filter(Boolean)
    );

    return [...new Set(sources)].sort();
  }, [clusters]);

  // --------------------------------------------------
  // FILTERED CLUSTERS
  // --------------------------------------------------

  const filteredClusters = useMemo(() => {
    return clusters.filter((cluster) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        cluster.label
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const clusterSources = (
        cluster.source || ""
      )
        .split(",")
        .map((source) => source.trim());

      const matchesSource =
        selectedSource === "All Sources" ||
        clusterSources.includes(
          selectedSource
        );

      return (
        matchesSearch &&
        matchesSource
      );
    });
  }, [
    clusters,
    searchTerm,
    selectedSource,
  ]);

  // --------------------------------------------------
  // ANALYTICS
  // --------------------------------------------------

  const analytics = useMemo(() => {
    const sourceCounts = {};

    clusters.forEach((cluster) => {
      if (!cluster.source) return;

      const sources = cluster.source
        .split(",")
        .map((source) => source.trim())
        .filter(Boolean);

      sources.forEach((source) => {
        sourceCounts[source] =
          (sourceCounts[source] || 0) + 1;
      });
    });

    const topSources = Object.entries(
      sourceCounts
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const largestClusters = [...clusters]
      .sort(
        (a, b) =>
          Number(b.article_count || 0) -
          Number(a.article_count || 0)
      )
      .slice(0, 5);

    return {
      sourceCount:
        Object.keys(sourceCounts).length,

      averageArticles:
        clusters.length > 0
          ? (
              totalArticles /
              clusters.length
            ).toFixed(1)
          : "0.0",

      topSources,

      largestClusters,
    };
  }, [clusters, totalArticles]);

  // --------------------------------------------------
  // OPEN CLUSTER
  // --------------------------------------------------

  const openCluster = async (cluster) => {
    try {
      setSelectedCluster(cluster);
      setArticles([]);
      setAiSummary("");

      setArticlesLoading(true);
      setSummaryLoading(true);

      const articlesResponse =
        await fetch(
          `${API_URL}/clusters/${cluster.id}/articles`
        );

      if (!articlesResponse.ok) {
        throw new Error(
          "Failed to fetch articles"
        );
      }

      const articlesData =
        await articlesResponse.json();

      setArticles(articlesData);
      setArticlesLoading(false);

      const summaryResponse =
        await fetch(
          `${API_URL}/clusters/${cluster.id}/summary`
        );

      if (!summaryResponse.ok) {
        throw new Error(
          "Failed to fetch AI summary"
        );
      }

      const summaryData =
        await summaryResponse.json();

      setAiSummary(
        summaryData.summary || ""
      );
    } catch (error) {
      console.error(
        "Error opening cluster:",
        error
      );

      setAiSummary(
        "Unable to generate AI summary."
      );
    } finally {
      setArticlesLoading(false);
      setSummaryLoading(false);
    }
  };

  // --------------------------------------------------
  // CLOSE CLUSTER
  // --------------------------------------------------

  const closeCluster = () => {
    setSelectedCluster(null);
    setArticles([]);
    setAiSummary("");
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    try {
      return new Date(date).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
    } catch {
      return date;
    }
  };

  // --------------------------------------------------
  // LAST UPDATED
  // --------------------------------------------------

  const formattedLastUpdated =
    lastUpdated
      ? lastUpdated.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        )
      : "Not yet";

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <RefreshCw
            size={30}
            className="spinning"
          />

          <p>
            Loading News Pulse...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ARTICLE DETAIL PAGE
  // --------------------------------------------------

  if (selectedCluster) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div className="brand">
              <div className="brand-icon">
                <Newspaper size={22} />
              </div>

              <div>
                <h1>News Pulse</h1>

                <p>
                  AI-powered news intelligence
                </p>
              </div>
            </div>

            <button
              className="refresh-button"
              onClick={() =>
                fetchClusters(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "spinning"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </header>

        <main className="main-container">
          <button
            className="back-button"
            onClick={closeCluster}
          >
            <ArrowLeft size={18} />
            Back to News
          </button>

          <section className="cluster-detail-header">
            <div className="cluster-detail-icon">
              <Layers3 size={26} />
            </div>

            <div>
              <h1>
                {selectedCluster.label}
              </h1>

              <div className="cluster-meta">
                <span>
                  {selectedCluster.article_count ||
                    0}{" "}
                  articles
                </span>

                <span>•</span>

                <span>
                  {selectedCluster.source ||
                    "Unknown source"}
                </span>
              </div>
            </div>
          </section>

          {/* AI SUMMARY */}

          <section className="ai-summary-card">
            <div className="ai-summary-header">
              <div className="ai-summary-icon">
                <Sparkles size={22} />
              </div>

              <div>
                <h2>AI Summary</h2>

                <p>
                  Generated from the articles
                  in this cluster
                </p>
              </div>
            </div>

            {summaryLoading ? (
              <div className="ai-summary-loading">
                <RefreshCw
                  size={20}
                  className="spinning"
                />

                <span>
                  Generating AI summary...
                </span>
              </div>
            ) : aiSummary ? (
              <p className="ai-summary-text">
                {aiSummary}
              </p>
            ) : (
              <p className="ai-summary-empty">
                AI summary is currently
                unavailable.
              </p>
            )}
          </section>

          {/* ARTICLES */}

          <section className="articles-section">
            <div className="section-heading">
              <div>
                <h2>Articles</h2>

                <p>
                  {articles.length} articles
                  covering this story
                </p>
              </div>
            </div>

            {articlesLoading ? (
              <div className="articles-loading">
                <RefreshCw
                  size={24}
                  className="spinning"
                />

                <span>
                  Loading articles...
                </span>
              </div>
            ) : articles.length === 0 ? (
              <div className="empty-state">
                <Newspaper size={30} />

                <p>
                  No articles found.
                </p>
              </div>
            ) : (
              <div className="articles-list">
                {articles.map((article) => (
                  <article
                    className="article-card"
                    key={article.id}
                  >
                    <div className="article-card-top">
                      <span className="article-source">
                        {article.source ||
                          "Unknown source"}
                      </span>

                      <span className="article-date">
                        {formatDate(
                          article.published_at
                        )}
                      </span>
                    </div>

                    <h3>
                      {article.title}
                    </h3>

                    {article.summary && (
                      <p>
                        {article.summary}
                      </p>
                    )}

                    <div className="article-footer">
                      <span>
                        {article.source ||
                          "News source"}
                      </span>

                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="read-article"
                        >
                          Read Article
                          <ExternalLink
                            size={15}
                          />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN DASHBOARD
  // --------------------------------------------------

  return (
    <div className="app">
      {/* HEADER */}

      <header className="header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-icon">
              <Newspaper size={22} />
            </div>

            <div>
              <h1>News Pulse</h1>

              <p>
                AI-powered news intelligence
              </p>
            </div>
          </div>

          <div className="header-right">
            <div className="header-stats">
              <div className="header-stat">
                <strong>
                  {clusters.length}
                </strong>

                <span>Clusters</span>
              </div>

              <div className="header-stat">
                <strong>
                  {totalArticles}
                </strong>

                <span>Articles</span>
              </div>
            </div>

            <button
              className="refresh-button"
              onClick={() =>
                fetchClusters(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "spinning"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="main-container">
        {/* HERO */}

        <section className="hero-section">
          <div>
            <span className="eyebrow">
              NEWS INTELLIGENCE
            </span>

            <h2>
              Stay ahead of
              <br />
              the news cycle.
            </h2>

            <p>
              Discover emerging stories,
              explore related articles, and
              get AI-generated summaries from
              multiple news sources.
            </p>
          </div>

          <div className="hero-icon">
            <BarChart3 size={52} />
          </div>
        </section>

        {/* REFRESH STATUS */}

        <div className="refresh-status">
          <span>
            Last updated:{" "}
            <strong>
              {formattedLastUpdated}
            </strong>
          </span>

          <span>
            Auto-refresh: every 5 minutes
          </span>
        </div>

        {/* ANALYTICS */}

        <section className="analytics-section">
          <div className="analytics-header">
            <div>
              <h2>News Analytics</h2>

              <p>
                Overview of processed news
                data
              </p>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-card-title">
                <span>
                  News Sources
                </span>
              </div>

              <h3>
                {analytics.sourceCount}
              </h3>

              <p>
                Unique sources detected
              </p>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-title">
                <span>
                  Avg. Articles / Cluster
                </span>
              </div>

              <h3>
                {analytics.averageArticles}
              </h3>

              <p>
                Average article density
              </p>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-title">
                <span>
                  Largest Cluster
                </span>
              </div>

              <h3>
                {analytics
                  .largestClusters[0]
                  ?.article_count || 0}
              </h3>

              <p>
                Articles in largest cluster
              </p>
            </div>
          </div>

          <div className="analytics-panels">
            <div className="analytics-panel">
              <h3>
                Top News Sources
              </h3>

              {analytics.topSources
                .length === 0 ? (
                <p className="analytics-empty">
                  No source data
                  available.
                </p>
              ) : (
                <div className="source-list">
                  {analytics.topSources.map(
                    ([source, count]) => (
                      <div
                        className="source-row"
                        key={source}
                      >
                        <span>
                          {source}
                        </span>

                        <strong>
                          {count}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="analytics-panel">
              <h3>
                Largest News Clusters
              </h3>

              {analytics
                .largestClusters.length ===
              0 ? (
                <p className="analytics-empty">
                  No cluster data
                  available.
                </p>
              ) : (
                <div className="largest-cluster-list">
                  {analytics.largestClusters.map(
                    (cluster) => (
                      <div
                        className="largest-cluster-row"
                        key={cluster.id}
                      >
                        <span>
                          {cluster.label}
                        </span>

                        <strong>
                          {cluster.article_count}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEARCH + FILTER */}

        <section className="search-section">
          <div className="search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search news clusters..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

            {searchTerm && (
              <button
                className="clear-search"
                onClick={() =>
                  setSearchTerm("")
                }
              >
                <X size={17} />
              </button>
            )}
          </div>

          <select
            className="source-filter"
            value={selectedSource}
            onChange={(e) =>
              setSelectedSource(
                e.target.value
              )
            }
          >
            <option>
              All Sources
            </option>

            {availableSources.map(
              (source) => (
                <option
                  key={source}
                  value={source}
                >
                  {source}
                </option>
              )
            )}
          </select>
        </section>

        {/* RESULTS HEADER */}

        <section className="results-header">
          <div>
            <h2>
              News Clusters
            </h2>

            <p>
              Showing{" "}
              {filteredClusters.length}{" "}
              of {clusters.length} clusters
            </p>
          </div>
        </section>

        {/* CLUSTERS */}

        {filteredClusters.length === 0 ? (
          <div className="empty-state">
            <Search size={32} />

            <h3>
              No clusters found
            </h3>

            <p>
              Try changing your search or
              source filter.
            </p>
          </div>
        ) : (
          <section className="clusters-grid">
            {filteredClusters.map(
              (cluster) => (
                <button
                  className="cluster-card"
                  key={cluster.id}
                  onClick={() =>
                    openCluster(cluster)
                  }
                >
                  <div className="cluster-card-header">
                    <div className="cluster-icon">
                      <Layers3
                        size={20}
                      />
                    </div>

                    <span className="cluster-count">
                      {cluster.article_count ||
                        0}{" "}
                      articles
                    </span>
                  </div>

                  <h3>
                    {cluster.label}
                  </h3>

                  <div className="cluster-card-footer">
                    <span>
                      {cluster.source ||
                        "Unknown source"}
                    </span>

                    <span>
                      {formatDate(
                        cluster.start_time
                      )}
                    </span>
                  </div>
                </button>
              )
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;