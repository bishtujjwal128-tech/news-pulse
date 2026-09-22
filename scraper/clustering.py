import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def prepare_text(article):
    """
    Combine title, summary and article content.

    The title is repeated to give it more importance.
    """

    title = article.get("title", "")
    summary = article.get("summary", "")
    content = article.get("content", "")

    return f"{title} {title} {summary} {content}"


def clean_title(title):
    """
    Clean a headline so it can be used as a cluster label.
    """

    # Remove numbers
    title = re.sub(r"\b\d+\b", "", title)

    # Remove punctuation
    title = re.sub(r"[^a-zA-Z\s]", " ", title)

    # Normalize spaces
    title = re.sub(r"\s+", " ", title).strip()

    words = title.split()

    # Remove very common headline words
    stop_words = {
        "the", "a", "an", "and", "or", "but",
        "for", "to", "of", "in", "on", "at",
        "as", "is", "are", "was", "were",
        "has", "have", "had", "from", "with",
        "this", "that", "how", "why", "what",
        "after", "before", "over", "new",
        "says", "say", "will", "could",
        "would", "its", "their", "they",
        "you", "your"
    }

    cleaned_words = [
        word for word in words
        if word.lower() not in stop_words
        and len(word) > 2
    ]

    # Remove duplicate words while preserving order
    unique_words = []

    for word in cleaned_words:
        if word.lower() not in {
            existing.lower() for existing in unique_words
        }:
            unique_words.append(word)

    return " ".join(unique_words[:5]).title()


def generate_cluster_label(cluster_articles):
    """
    Generate a readable label.

    For a single article, use a cleaned version of its headline.
    For multiple articles, use the most representative headline.
    """

    if not cluster_articles:
        return "General News"

    # Single article cluster
    if len(cluster_articles) == 1:
        label = clean_title(
            cluster_articles[0].get("title", "")
        )

        return label or "General News"

    # Multiple article cluster
    titles = [
        article.get("title", "")
        for article in cluster_articles
    ]

    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2)
        )

        matrix = vectorizer.fit_transform(titles)

        similarities = cosine_similarity(matrix)

        # Calculate how representative each article is
        average_similarity = similarities.mean(axis=1)

        representative_index = average_similarity.argmax()

        representative_title = titles[representative_index]

        label = clean_title(representative_title)

        return label or "General News"

    except ValueError:
        return clean_title(titles[0]) or "General News"


def cluster_articles(articles, similarity_threshold=0.15):

    if not articles:
        return []

    texts = [
        prepare_text(article)
        for article in articles
    ]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_df=0.95,
        min_df=1
    )

    matrix = vectorizer.fit_transform(texts)

    similarity_matrix = cosine_similarity(matrix)

    clusters = []
    assigned = set()

    for i in range(len(articles)):

        if i in assigned:
            continue

        cluster_indices = {i}

        for j in range(i + 1, len(articles)):

            if j in assigned:
                continue

            similarity = similarity_matrix[i][j]

            if similarity >= similarity_threshold:
                cluster_indices.add(j)

        assigned.update(cluster_indices)

        cluster_articles_list = [
            articles[index]
            for index in sorted(cluster_indices)
        ]

        label = generate_cluster_label(
            cluster_articles_list
        )

        clusters.append({
            "id": len(clusters) + 1,
            "label": label,
            "articles": cluster_articles_list
        })

    return clusters