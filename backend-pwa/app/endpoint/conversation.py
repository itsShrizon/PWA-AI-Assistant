"""
Conversation endpoints for the application
"""
import os
import json
from typing import List
from fastapi import APIRouter, HTTPException, Query

from ..models import Conversation
from ..database import (
    get_conversation,
    get_user_conversations,
    get_user_conversations_count
)
# from ..config import DB_PATH

# Create router
router = APIRouter()

@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation_endpoint(conversation_id: str, user_id: str = Query(...)):
    print(f"Getting conversation {conversation_id} for user {user_id}")
    conversation = get_conversation(conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.get("/conversations", response_model=List[Conversation])
async def list_conversations(
    user_id: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    try:
        print(f"Fetching conversations for user: {user_id}")
        conversations = get_user_conversations(user_id, skip, limit)
        print(f"Found {len(conversations)} conversations")
        return conversations
    except Exception as e:
        print(f"Error fetching conversations: {str(e)}")
        # Return an empty list instead of raising an error
        return []

@router.delete("/conversations/{conversation_id}")
async def delete_conversation_endpoint(conversation_id: str, user_id: str = Query(...)):
    from ..database import delete_user_conversation

    # First check if conversation exists and belongs to user
    conversation = get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this conversation")

    # Delete the conversation
    success = delete_user_conversation(conversation_id, user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete conversation")

    return {"message": "Conversation deleted successfully"}

# Debug endpoint
# @router.get("/debug/conversation-file/{file_name}")
# async def debug_conversation_file(file_name: str):
#     """Debug endpoint to check the structure of a conversation file"""
#     try:
#         file_path = os.path.join(DB_PATH, file_name)
#         if not os.path.exists(file_path):
#             return {"error": "File not found"}

#         with open(file_path, "r") as file:
#             data = json.load(file)

#         return {
#             "file_exists": True,
#             "data": data,
#             "has_id": "id" in data,
#             "has_user_id": "user_id" in data,
#             "has_messages": "messages" in data,
#         }
#     except Exception as e:
#         return {"error": str(e)}
