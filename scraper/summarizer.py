import re
from sklearn.feature_extraction.text import TfidfVectorizer


def split_sentences(text):
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return []

    sentences = re.split(r"(?<=[.!?])\s+", text)

    return [
        sentence.strip()
        for sentence in sentences
        if len(sentence.strip()) > 40
    ]


def generate_summary(text):
    if not text:
        return "No content available for summarization."

    try:
        sentences = split_sentences(text)

        if not sentences:
            return text[:500]

        if len(sentences) <= 3:
            return " ".join(sentences)

        vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=5000
        )

        matrix = vectorizer.fit_transform(sentences)

        scores = matrix.sum(axis=1).A1

        ranked = sorted(
            range(len(sentences)),
            key=lambda i: scores[i],
            reverse=True
        )

        sentence_count = min(3, len(sentences))

        selected = sorted(
            ranked[:sentence_count]
        )

        summary = " ".join(
            sentences[i]
            for i in selected
        )

        return summary

    except Exception as error:
        print(f"Summarization error: {error}")

        return text[:500]


if __name__ == "__main__":
    test_text = """
    A major technology company announced a new artificial intelligence
    product today. The company said the product will improve productivity
    and help businesses automate common tasks. The new system is expected
    to be available to businesses later this year.
    """

    print("Generated Summary:")
    print(generate_summary(test_text))