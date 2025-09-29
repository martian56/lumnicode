import google.generativeai as genai

def generate_text(prompt: str, max_output_tokens: int = 1024, api_key: str) -> str:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_text(
        prompt=prompt,
        max_output_tokens=max_output_tokens,
    )
    return response.text