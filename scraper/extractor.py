import trafilatura
import requests


HEADERS = {
    "User-Agent": "NewsPulse/1.0 (student assessment project)"
}


def extract_article(url):
    """
    Extract the main article text from a webpage.
    Returns an empty string if extraction fails.
    """

    try:
        response = requests.get(
            url,
            headers=HEADERS,
            timeout=15
        )

        response.raise_for_status()

        text = trafilatura.extract(
            response.text,
            include_comments=False,
            include_tables=False,
            no_fallback=False
        )

        if text:
            return text.strip()

        return ""

    except requests.RequestException as error:
        print(f"Request failed for {url}: {error}")
        return ""

    except Exception as error:
        print(f"Extraction failed for {url}: {error}")
        return ""