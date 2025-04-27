"""
Data models for the application
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# Models
class Message(BaseModel):
    role: str
    content: str
    name: Optional[str] = None
    content_type: Optional[str] = "text"  # text, image
    # New field to store image URL when content_type is image
    image_url: Optional[str] = None

class Conversation(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = "New Conversation"
    messages: List[Message] = []
    created_at: str
    updated_at: str

class User(BaseModel):
    user_id: str
    name: str
    email: str
    picture: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    picture: Optional[str] = None
    conversations_count: int = 0
    created_at: str
    updated_at: str

class ChatRequest(BaseModel):
    messages: List[Message]
    user_id: str
    conversation_id: Optional[str] = None
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    model_override: Optional[str] = None
    force_type: Optional[str] = None  # chat, search, image

class UnifiedResponse(BaseModel):
    conversation_id: str
    message: Message
    model_used: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
