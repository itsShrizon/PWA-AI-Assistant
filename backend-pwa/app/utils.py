"""
Utility functions for the application
"""
import os
import base64
from typing import List, Dict, Any, Optional

from .models import Message
from langchain.schema import HumanMessage, AIMessage, SystemMessage

# Class to track image context
class ImageContext:
    last_image_id: str = None
    last_prompt: str = None
    revision_count: int = 0
    history: List[Dict[str, str]] = []  # Track all image generations

    def add_image(self, image_id: str, prompt: str, is_modification: bool = False):
        """Add an image to the history"""
        self.last_image_id = image_id
        self.last_prompt = prompt
        if is_modification:
            self.revision_count += 1
        else:
            self.revision_count = 0

        # Add to history
        from datetime import datetime
        self.history.append({
            "image_id": image_id,
            "prompt": prompt,
            "is_modification": is_modification,
            "created_at": datetime.now().isoformat()
        })



def convert_to_langchain_messages(messages: List[Message]):
    """Convert our Message objects to LangChain message objects"""
    lc_messages = []
    for msg in messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))
        elif msg.role == "system":
            lc_messages.append(SystemMessage(content=msg.content))
    return lc_messages

async def save_image(image_data: str, image_id: str) -> str:
    """Save base64 image data to a file and return the path"""
    if "base64," in image_data:
        image_data = image_data.split("base64,")[1]

    image_bytes = base64.b64decode(image_data)
    from .config import IMAGES_PATH
    image_path = os.path.join(IMAGES_PATH, f"{image_id}.png")

    with open(image_path, "wb") as image_file:
        image_file.write(image_bytes)

    return image_path
