import sys
import json

from summarizer import generate_summary


def main():
    try:
        input_text = sys.stdin.read()

        if not input_text.strip():
            print(
                json.dumps({
                    "success": False,
                    "error": "No text provided"
                })
            )
            return

        summary = generate_summary(input_text)

        print(
            json.dumps({
                "success": True,
                "summary": summary
            })
        )

    except Exception as error:
        print(
            json.dumps({
                "success": False,
                "error": str(error)
            })
        )


if __name__ == "__main__":
    main()