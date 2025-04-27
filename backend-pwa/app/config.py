"""
Configuration settings for the application
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "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")
# DB_PATH = os.getenv("DB_PATH", "./data")
IMAGES_PATH = os.getenv("IMAGES_PATH", "./images")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:sam1127@localhost:5433/ai-database" )

# Create directories if they don't exist
# os.makedirs(DB_PATH, exist_ok=True)
os.makedirs(IMAGES_PATH, exist_ok=True)

# Define available models
class ModelConfig:
    CHAT_MODEL = "gpt-4o"
    SEARCH_MODEL = "gpt-4o-search-preview"
    MINI_MODEL = "gpt-4o-mini"
    IMAGE_MODEL = "dall-e-3"
    MODEL_CLASSIFIER = "gpt-4o"  # For classifying query type
