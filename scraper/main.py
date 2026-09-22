from feeds import fetch_all_feeds
from extractor import extract_article
from clustering import cluster_articles
from database import save_clusters


def main():

    print("\nStarting News Pulse ingestion...\n")

    # -----------------------------------
    # STEP 1: Fetch RSS articles
    # -----------------------------------

    articles = fetch_all_feeds()

    print("\n" + "=" * 80)
    print(f"RSS ARTICLES FOUND: {len(articles)}")
    print("=" * 80)

    # -----------------------------------
    # STEP 2: Extract article content
    # -----------------------------------

    articles = articles[:20]

    successful_articles = []

    for index, article in enumerate(articles, start=1):

        print(
            f"\n[{index}/{len(articles)}] "
            f"Extracting: {article['title']}"
        )

        content = extract_article(article["url"])

        article["content"] = content

        if content:
            successful_articles.append(article)

            print(
                f"✓ Extracted {len(content)} characters"
            )

        else:
            print("✗ Extraction failed")

    print("\n" + "=" * 80)
    print(
        f"SUCCESSFULLY EXTRACTED: "
        f"{len(successful_articles)}"
    )
    print("=" * 80)

    # -----------------------------------
    # STEP 3: Cluster articles
    # -----------------------------------

    print("\nRunning TF-IDF topic clustering...\n")

    clusters = cluster_articles(
        successful_articles,
        similarity_threshold=0.15
    )

    print("=" * 80)
    print(f"CLUSTERS CREATED: {len(clusters)}")
    print("=" * 80)

    # -----------------------------------
    # STEP 4: Display clusters
    # -----------------------------------

    for cluster in clusters:

        print("\n")
        print(f"CLUSTER {cluster['id']}")
        print(f"LABEL: {cluster['label']}")
        print(
            f"ARTICLES: "
            f"{len(cluster['articles'])}"
        )

        print("-" * 80)

        for article in cluster["articles"]:

            print(
                f"• [{article['source']}] "
                f"{article['title']}"
            )

    # -----------------------------------
    # STEP 5: Save to Supabase
    # -----------------------------------

    print("\nSaving data to Supabase...")

    save_clusters(clusters)

    print("\nNews Pulse ingestion completed successfully!")


if __name__ == "__main__":
    main()