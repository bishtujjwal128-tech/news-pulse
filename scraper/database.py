import psycopg2

from config import DATABASE_URL


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def save_clusters(clusters):
    """
    Save clusters and articles to PostgreSQL.

    Existing article URLs are not duplicated.
    Existing cluster labels are reused.
    """

    connection = get_connection()

    try:
        cursor = connection.cursor()

        saved_articles = 0

        for cluster in clusters:

            # Check whether this cluster already exists
            cursor.execute(
                """
                SELECT id
                FROM clusters
                WHERE label = %s
                LIMIT 1;
                """,
                (cluster["label"],)
            )

            existing_cluster = cursor.fetchone()

            if existing_cluster:
                cluster_id = existing_cluster[0]
            else:
                cursor.execute(
                    """
                    INSERT INTO clusters (label)
                    VALUES (%s)
                    RETURNING id;
                    """,
                    (cluster["label"],)
                )

                cluster_id = cursor.fetchone()[0]

            # Save articles
            for article in cluster["articles"]:

                cursor.execute(
                    """
                    INSERT INTO articles (
                        title,
                        summary,
                        content,
                        url,
                        source,
                        published_at,
                        cluster_id
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (url)
                    DO UPDATE SET
                        title = EXCLUDED.title,
                        summary = EXCLUDED.summary,
                        content = EXCLUDED.content,
                        published_at = EXCLUDED.published_at,
                        cluster_id = EXCLUDED.cluster_id;
                    """,
                    (
                        article.get("title"),
                        article.get("summary"),
                        article.get("content"),
                        article.get("url"),
                        article.get("source"),
                        article.get("published_at"),
                        cluster_id
                    )
                )

                saved_articles += 1

        connection.commit()

        print(
            f"Saved/updated {len(clusters)} clusters "
            f"and {saved_articles} articles."
        )

    except Exception as error:

        connection.rollback()

        print(f"Database save failed: {error}")

        raise

    finally:

        cursor.close()
        connection.close()


def test_connection():

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("SELECT NOW();")

        result = cursor.fetchone()

        print("Database connection successful!")
        print(f"Database time: {result[0]}")

        cursor.close()

    finally:
        connection.close()


if __name__ == "__main__":
    test_connection()