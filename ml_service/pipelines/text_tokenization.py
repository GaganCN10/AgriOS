import re

# Forbidden words or combinations that suggest dangerous chemical mixes or off-topic prompts
HAZARDOUS_PATTERNS = [
    (r"paraquat\s*\+\s*glyphosate", "Combining Paraquat and Glyphosate is highly hazardous and can cause toxic soil locking and severe human respiratory risk. Do not mix these herbicides."),
    (r"monocrotophos\s*\+\s*pesticide", "Monocrotophos is extremely toxic and banned on many food crops. Mixing it with other pesticides is highly dangerous for farm workers."),
    (r"mix\s+chemical\s+without\s+water", "Applying agricultural chemical concentrates directly without water dilution violates agronomic safety guidelines and burns crops."),
    (r"(bomb|weapon|hack|exploit|malware)", "This query falls outside agricultural domains. AgriOS GenAI advisor can only respond to agronomic or farming-related inquiries.")
]

def analyze_prompt_safety(prompt_text: str) -> tuple:
    """
    Checks if a prompt violates safety parameters or attempts toxic chemical blends.
    Returns: (is_safe, error_message)
    """
    normalized = prompt_text.lower()
    
    for pattern, warning in HAZARDOUS_PATTERNS:
        if re.search(pattern, normalized):
            return False, warning
            
    return True, None
