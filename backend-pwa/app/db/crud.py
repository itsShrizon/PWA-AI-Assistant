"""
CRUD operations for the database
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from . import models
from ..models import User as UserSchema
from ..models import Conversation as ConversationSchema
from ..models import Message as MessageSchema

# User operations
def create_or_update_user(db: Session, user: UserSchema) -> Dict[str, Any]:
    """Create or update a user in the database"""
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.user_id == user.user_id).first()
    
    if db_user:
        # Update existing user
        db_user.name = user.name
        db_user.email = user.email
        db_user.picture = user.picture
        db_user.given_name = user.given_name
        db_user.family_name = user.family_name
    else:
        # Create new user
        db_user = models.User(
            user_id=user.user_id,
            name=user.name,
            email=user.email,
            picture=user.picture,
            given_name=user.given_name,
            family_name=user.family_name
        )
        db.add(db_user)
    
    db.commit()
    db.refresh(db_user)
    
    # Convert to dict for response
    user_dict = {
        "user_id": db_user.user_id,
        "name": db_user.name,
        "email": db_user.email,
        "picture": db_user.picture,
        "given_name": db_user.given_name,
        "family_name": db_user.family_name,
        "created_at": db_user.created_at.isoformat(),
        "updated_at": db_user.updated_at.isoformat()
    }
    
    return user_dict

def get_user_by_id(db: Session, user_id: str) -> Optional[Dict[str, Any]]:
    """Get a user by ID"""
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    
    if not db_user:
        return None
    
    # Convert to dict for response
    user_dict = {
        "user_id": db_user.user_id,
        "name": db_user.name,
        "email": db_user.email,
        "picture": db_user.picture,
        "given_name": db_user.given_name,
        "family_name": db_user.family_name,
        "created_at": db_user.created_at.isoformat(),
        "updated_at": db_user.updated_at.isoformat()
    }
    
    return user_dict

def get_user_conversations_count(db: Session, user_id: str) -> int:
    """Get the number of conversations for a user"""
    return db.query(func.count(models.Conversation.id)).filter(models.Conversation.user_id == user_id).scalar() or 0

# Conversation operations
def create_conversation(db: Session, conversation: ConversationSchema) -> models.Conversation:
    """Create a new conversation"""
    db_conversation = models.Conversation(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    
    # Add messages if any
    if conversation.messages:
        for i, message in enumerate(conversation.messages):
            db_message = models.Message(
                conversation_id=db_conversation.id,
                role=message.role,
                content=message.content,
                name=message.name,
                content_type=message.content_type,
                image_url=message.image_url,
                sequence_number=i
            )
            db.add(db_message)
        
        db.commit()
    
    return db_conversation

def update_conversation(db: Session, conversation: ConversationSchema) -> models.Conversation:
    """Update an existing conversation"""
    db_conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation.id).first()
    
    if not db_conversation:
        return create_conversation(db, conversation)
    
    # Update conversation title
    db_conversation.title = conversation.title
    db.commit()
    
    # Get existing messages
    existing_messages = db.query(models.Message).filter(models.Message.conversation_id == conversation.id).all()
    
    # If the number of messages is different, delete all and recreate
    if len(existing_messages) != len(conversation.messages):
        # Delete all existing messages
        db.query(models.Message).filter(models.Message.conversation_id == conversation.id).delete()
        
        # Add all messages
        for i, message in enumerate(conversation.messages):
            db_message = models.Message(
                conversation_id=db_conversation.id,
                role=message.role,
                content=message.content,
                name=message.name,
                content_type=message.content_type,
                image_url=message.image_url,
                sequence_number=i
            )
            db.add(db_message)
    else:
        # Update existing messages
        for i, (existing, new) in enumerate(zip(existing_messages, conversation.messages)):
            existing.role = new.role
            existing.content = new.content
            existing.name = new.name
            existing.content_type = new.content_type
            existing.image_url = new.image_url
            existing.sequence_number = i
    
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

def get_conversation_by_id(db: Session, conversation_id: str) -> Optional[ConversationSchema]:
    """Get a conversation by ID"""
    db_conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    
    if not db_conversation:
        return None
    
    # Get messages
    db_messages = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.sequence_number).all()
    
    # Convert to Pydantic model
    messages = []
    for msg in db_messages:
        messages.append(MessageSchema(
            role=msg.role,
            content=msg.content,
            name=msg.name,
            content_type=msg.content_type,
            image_url=msg.image_url
        ))
    
    return ConversationSchema(
        id=db_conversation.id,
        user_id=db_conversation.user_id,
        title=db_conversation.title,
        messages=messages,
        created_at=db_conversation.created_at.isoformat(),
        updated_at=db_conversation.updated_at.isoformat()
    )

def get_user_conversations(db: Session, user_id: str, skip: int = 0, limit: int = 10) -> List[ConversationSchema]:
    """Get all conversations for a user"""
    db_conversations = db.query(models.Conversation).filter(
        models.Conversation.user_id == user_id
    ).order_by(desc(models.Conversation.updated_at)).offset(skip).limit(limit).all()
    
    conversations = []
    for conv in db_conversations:
        # Get messages for this conversation
        db_messages = db.query(models.Message).filter(
            models.Message.conversation_id == conv.id
        ).order_by(models.Message.sequence_number).all()
        
        # Convert messages to Pydantic models
        messages = []
        for msg in db_messages:
            messages.append(MessageSchema(
                role=msg.role,
                content=msg.content,
                name=msg.name,
                content_type=msg.content_type,
                image_url=msg.image_url
            ))
        
        # Create conversation schema
        conversations.append(ConversationSchema(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title,
            messages=messages,
            created_at=conv.created_at.isoformat(),
            updated_at=conv.updated_at.isoformat()
        ))
    
    return conversations

def delete_conversation(db: Session, conversation_id: str, user_id: str) -> bool:
    """Delete a conversation"""
    db_conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == user_id
    ).first()
    
    if not db_conversation:
        return False
    
    db.delete(db_conversation)
    db.commit()
    return True

# Helper function to get conversation title from messages
def get_conversation_title(messages: List[MessageSchema]) -> str:
    """Extract title from the first user message in conversation"""
    if not messages:
        return "New Conversation"

    # Find the first user message
    for msg in messages:
        if msg.role == "user":
            # Truncate long messages
            title = msg.content[:50]
            if len(msg.content) > 50:
                title += "..."
            return title

    return "New Conversation"
