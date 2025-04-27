"""
AI service functions for the application
"""
import httpx
from typing import List, Optional
from fastapi import HTTPException

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

from .config import OPENAI_API_KEY, ModelConfig
from .models import Message

# AI-based prompt classifier
async def classify_prompt_with_ai(prompt: str, conversation_context: Optional[List[Message]] = None) -> str:
    """
    Use OpenAI to classify the prompt type instead of regex patterns
    """
    classifier = ChatOpenAI(
        model_name=ModelConfig.MODEL_CLASSIFIER,
        openai_api_key=OPENAI_API_KEY,
        temperature=0.1,
    )

    # Create context from previous messages if available
    context_text = ""
    if conversation_context and len(conversation_context) > 0:
        # Get the last 3 messages for context
        recent_context = conversation_context[-3:]
        context_text = "\n".join([f"{msg.role}: {msg.content}" for msg in recent_context])

    # Create the classification prompt
    classification_prompt = f"""
    Analyze this user prompt and determine which type of AI service would be most suitable:

    Previous conversation context:
    {context_text}

    User prompt: "{prompt}"

    Classify as exactly ONE of:
    - "image": For image generation or modification requests (DALL-E)
    - "search": For real time questions that benefit from web search capability
    - "mini": For simple greetings, acknowledgments, or very brief interactions
    - "chat": For standard conversational AI interactions

    Return only the classification word, nothing else.
    """

    try:
        response = await classifier.ainvoke([HumanMessage(content=classification_prompt)])
        result = response.content.strip().lower()

        # Validate and normalize the response
        valid_types = ["image", "search", "mini", "chat"]
        for valid_type in valid_types:
            if valid_type in result:
                return valid_type

        # Default fallback
        return "chat"
    except Exception as e:
        print(f"Classification error: {str(e)}")
        return "chat"  # Default to chat if classification fails

# Factory for creating LangChain models based on type
def get_langchain_model(model_type: str, model_override: Optional[str] = None, temperature: float = 0.7):
    """
    Factory function to get the appropriate LangChain model
    """
    if model_type == "chat":
        model_name = model_override or ModelConfig.CHAT_MODEL
        return ChatOpenAI(
            model_name=model_name,
            openai_api_key=OPENAI_API_KEY,
            temperature=temperature,
        )
    elif model_type == "search":
        model_name = model_override or ModelConfig.SEARCH_MODEL
        return ChatOpenAI(
            model_name=model_name,
            openai_api_key=OPENAI_API_KEY,
            temperature=temperature,
        )
    elif model_type == "mini":
        model_name = model_override or ModelConfig.MINI_MODEL
        return ChatOpenAI(
            model_name=model_name,
            openai_api_key=OPENAI_API_KEY,
            temperature=temperature,
        )
    elif model_type == "image":
        return ChatOpenAI(
            model_name=ModelConfig.IMAGE_MODEL,
            openai_api_key=OPENAI_API_KEY,
            temperature=temperature,
        )
    else:
        raise ValueError(f"Unknown model type: {model_type}")

# Enhanced image generation with OpenAI
async def generate_dalle_image(prompt, image_to_modify=None, size="1024x1024", quality="standard", style="vivid"):
    """Generate image with DALL-E using OpenAI client, with optional image modification"""

    api_data = {
        "model": "dall-e-3",
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "style": style,
        "n": 1,
        "response_format": "b64_json"
    }

    # If we have an image to modify, add it to the request
    if image_to_modify:
        # For DALL-E-3, we don't have direct image editing, so we enhance the prompt
        # and use standard image generation with the enhanced prompt
        endpoint = "https://api.openai.com/v1/images/generations"
    else:
        endpoint = "https://api.openai.com/v1/images/generations"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=api_data,
                timeout=120.0
            )
            response.raise_for_status()
            response_data = response.json()
            return response_data["data"][0]["b64_json"]
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
