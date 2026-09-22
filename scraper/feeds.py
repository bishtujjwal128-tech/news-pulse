import feedparser
import requests
from datetime import datetime
from email.utils import parsedate_to_datetime


RSS_FEEDS = {
    "BBC": "https://feeds.bbci.co.uk/news/rss.xml",
    "NPR": "https://feeds.npr.org/1001/rss.xml",
    "Guardian": "https://www.theguardian.com/world/rss",
}


HEADERS = {
    "User-Agent": "NewsPulse/1.0 (student assessment project)"
}


def parse_date(entry):
    date_value = (
        entry.get("published")
        or entry.get("updated")
        or entry.get("pubDate")
    )

    if not date_value:
        return None

    try:
        return parsedate_to_datetime(date_value)
    except (TypeError, ValueError):
        pass

    try:
        if entry.get("published_parsed"):
            return datetime(*entry.published_parsed[:6])
    except (TypeError, ValueError):
        pass

    return None


def normalize_entry(entry, source):
    title = entry.get("title", "").strip()

    summary = (
        entry.get("summary")
        or entry.get("description")
        or ""
    ).strip()

    url = entry.get("link", "").strip()

    return {
        "title": title,
        "summary": summary,
        "url": url,
        "source": source,
        "published_at": parse_date(entry),
    }


def fetch_feed(source, feed_url):
    print(f"\nFetching {source}...")
    print(f"URL: {feed_url}")

    try:
        response = requests.get(
            feed_url,
            headers=HEADERS,
            timeout=15
        )

        print(f"HTTP status: {response.status_code}")

        response.raise_for_status()

        feed = feedparser.parse(response.content)

        if feed.bozo:
            print(f"Feed parsing warning: {feed.bozo_exception}")

        articles = []

        for entry in feed.entries:
            article = normalize_entry(entry, source)

            if not article["title"] or not article["url"]:
                continue

            articles.append(article)

        print(f"{source}: {len(articles)} articles found.")

        return articles

    except requests.RequestException as error:
        print(f"Request error for {source}: {error}")
        return []

    except Exception as error:
        print(f"Unexpected error for {source}: {error}")
        return []


def fetch_all_feeds():
    all_articles = []

    for source, feed_url in RSS_FEEDS.items():
        articles = fetch_feed(source, feed_url)
        all_articles.extend(articles)

    return all_articles