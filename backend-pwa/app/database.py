"""
Database operations for the application

This module provides a compatibility layer between the old JSON-based storage
and the new PostgreSQL database. It imports and uses the new database operations
but maintains the same function signatures for backward compatibility.
"""
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import Depends
from sqlalchemy.orm import Session

# from .config import DB_PATH, DATABASE_URL
from .models import Message, Conversation, User, UserResponse
from .db.database import get_db
from .db.crud import (
    get_conversation_title as db_get_conversation_title,
    create_or_update_user,
    get_user_by_id,
    get_user_conversations_count as db_get_user_conversations_count,
    create_conversation,
    update_conversation,
    get_conversation_by_id,
    get_user_conversations as db_get_user_conversations,
    delete_conversation
)

# Initialize database tables
from .db.database import Base, engine
Base.metadata.create_all(bind=engine)

# Get a database session
def get_session():
    return next(get_db())

def get_conversation_title(messages: List[Message]) -> str:
    """Extract title from the first user message in conversation"""
    return db_get_conversation_title(messages)

# User database operations
def save_user(user: Dict[str, Any]):
    """Save a user to the database"""
    db = get_session()
    user_schema = User(**user)
    return create_or_update_user(db, user_schema)

def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Get a user from the database"""
    db = get_session()
    return get_user_by_id(db, user_id)

def get_user_conversations_count(user_id: str) -> int:
    """Get the number of conversations for a user"""
    db = get_session()
    return db_get_user_conversations_count(db, user_id)

# Conversation database operations
def save_conversation(conversation: Conversation):
    """Save a conversation to the database"""
    db = get_session()

    # Set the conversation title based on first message if not set
    if conversation.title == "New Conversation" and conversation.messages:
        conversation.title = get_conversation_title(conversation.messages)

    # Check if conversation exists
    existing = get_conversation_by_id(db, conversation.id)
    if existing:
        update_conversation(db, conversation)
    else:
        create_conversation(db, conversation)

def get_conversation(conversation_id: str) -> Optional[Conversation]:
    """Get a conversation from the database"""
    db = get_session()
    return get_conversation_by_id(db, conversation_id)

def get_user_conversations(user_id: str, skip: int = 0, limit: int = 10) -> List[Conversation]:
    """Get all conversations for a user"""
    db = get_session()
    return db_get_user_conversations(db, user_id, skip, limit)

def delete_user_conversation(conversation_id: str, user_id: str) -> bool:
    """Delete a conversation"""
    db = get_session()
    return delete_conversation(db, conversation_id, user_id)
