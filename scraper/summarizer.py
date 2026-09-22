from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "sshleifer/distilbart-cnn-12-6"

tokenizer = None
model = None


def load_model():
    global tokenizer, model

    if tokenizer is None or model is None:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)


def generate_summary(text):
    if not text:
        return "No content available for summarization."

    try:
        load_model()

        text = text[:6000]

        inputs = tokenizer(
            text,
            return_tensors="pt",
            max_length=1024,
            truncation=True
        )

        summary_ids = model.generate(
            inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=120,
            min_length=40,
            num_beams=4,
            early_stopping=True
        )

        summary = tokenizer.decode(
            summary_ids[0],
            skip_special_tokens=True
        )

        return summary

    except Exception as error:
        print(f"Summarization error: {error}")
        return "Unable to generate summary."


if __name__ == "__main__":
    print("Loading AI summarization model...")

    test_text = """
    Four people have died following a house fire.
    A fifth person was taken to hospital after the fire.
    Firefighters entered the property to search for people inside.
    Police are investigating the cause of the fire.
    """

    print("AI summarization model loaded!")
    print("\nGenerated Summary:")
    print(generate_summary(test_text))