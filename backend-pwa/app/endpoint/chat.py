"""
Chat endpoints for the application
"""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body

from ..models import Message, Conversation, ChatRequest, UnifiedResponse
from ..database import get_conversation, save_conversation
from ..utils import convert_to_langchain_messages, ImageContext
from ..ai_service import classify_prompt_with_ai, get_langchain_model, generate_dalle_image
from ..config import ModelConfig

# Global instance to track image context
image_context = ImageContext()

# Create router
router = APIRouter()

@router.post("/unified-chat", response_model=UnifiedResponse)
async def unified_chat(request: ChatRequest):
    global image_context

    # Debug print request
    print(f"Received chat request from user: {request.user_id}")

    # Get or create conversation
    conversation = None
    if request.conversation_id:
        conversation = get_conversation(request.conversation_id)
        if not conversation or conversation.user_id != request.user_id:
            raise HTTPException(status_code=404, detail="Conversation not found")

    if not conversation:
        conversation_id = str(uuid.uuid4())
        now = datetime.now().isoformat()

        # Get title from the first user message if available
        title = "New Conversation"
        if request.messages:
            for msg in request.messages:
                if msg.role == "user":
                    title = msg.content[:50]
                    if len(msg.content) > 50:
                        title += "..."
                    break

        conversation = Conversation(
            id=conversation_id,
            user_id=request.user_id,
            title=title,  # Set the title here
            messages=[],
            created_at=now,
            updated_at=now
        )

    # Determine the last user message
    last_user_message = None
    for msg in reversed(request.messages):
        if msg.role == "user":
            last_user_message = msg.content
            break

    if not last_user_message:
        raise HTTPException(status_code=400, detail="No user message found")

    # Determine which model type to use - use AI-based classification
    prompt_type = request.force_type
    if not prompt_type:
        prompt_type = await classify_prompt_with_ai(last_user_message, conversation.messages)

    print(f"Detected prompt type: {prompt_type}")

    # Set model based on detected type
    if prompt_type == "image":
        # Check if this is a modification request and we have a previous image
        is_modification = False
        image_to_modify = None

        # Look for modification intent in the message
        modification_indicators = [
            "modify", "change", "update", "edit", "revise", "adjust", "alter",
            "instead", "rather", "different", "tweak", "fix", "improve", "add", "remove",
            "make it", "try again", "another", "version", "iteration", "retry",
            "better", "more", "less", "change the", "different style", "with"
        ]

        # Clear decision logic for modifications
        is_modification = False
        image_to_modify = None
        enhanced_prompt = last_user_message

        # If we have a previous image and there are modification indicators
        if image_context.last_image_id and (
            any(indicator in last_user_message.lower() for indicator in modification_indicators) or
            len(last_user_message.split()) < 5  # Short messages after an image are likely modification requests
        ):
            is_modification = True
            from ..config import IMAGES_PATH
            import os
            image_to_modify = os.path.join(IMAGES_PATH, f"{image_context.last_image_id}.png")

            # Update the prompt to reference the previous image
            enhanced_prompt = f"Modify the previous image that was described as '{image_context.last_prompt}'. The modification request is: {last_user_message}"

            # If it doesn't exist, fallback to regular generation
            if not os.path.exists(image_to_modify):
                is_modification = False
                enhanced_prompt = last_user_message
        else:
            enhanced_prompt = last_user_message

        # Process image generation
        try:
            if is_modification:
                print(f"Modifying existing image: {image_context.last_image_id}")
                # Increment revision count
                image_context.revision_count += 1

                # For modifications, we use the enhanced prompt
                image_data = await generate_dalle_image(
                    enhanced_prompt,
                    size="1024x1024",
                    quality="standard",
                    style="vivid"
                )
            else:
                # New image generation
                image_context.revision_count = 0
                image_data = await generate_dalle_image(
                    last_user_message,
                    size="1024x1024",
                    quality="standard",
                    style="vivid"
                )

            image_id = str(uuid.uuid4())
            from ..utils import save_image
            image_path = await save_image(image_data, image_id)
            image_url = f"/images/{image_id}.png"

            # Update image context
            image_context.last_image_id = image_id
            image_context.last_prompt = last_user_message if not is_modification else f"{image_context.last_prompt} + {last_user_message}"

            # Create assistant message with image reference
            response_message = "I've generated an image based on your request"
            is_same_conversation = request.conversation_id and conversation.id == request.conversation_id

            # Create appropriate response message
            if is_modification and is_same_conversation:
                response_message = "I've created a new image based on your modifications to the previous one"
            elif is_modification:
                response_message = "I've created a new image similar to your previous request, but in a new conversation"
            elif is_same_conversation:
                response_message = "I've generated another image in this conversation"
            else:
                response_message = "I've generated an image based on your request"

            assistant_message = Message(
                role="assistant",
                content=response_message,
                content_type="image",
                image_url=image_url
            )

            model_used = ModelConfig.IMAGE_MODEL

        except Exception as e:
            print(f"Image generation error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Image generation error: {str(e)}")
    else:
        # Handle text chat or search
        if prompt_type == "search":
            model_used = ModelConfig.SEARCH_MODEL
        elif prompt_type == "mini":
            model_used = ModelConfig.MINI_MODEL
        else:  # Default to standard chat
            model_used = ModelConfig.CHAT_MODEL

        # Override with user specified model if provided
        if request.model_override:
            model_used = request.model_override

        # Get appropriate LangChain model
        llm = get_langchain_model(prompt_type, model_used, request.temperature)

        # Convert messages to LangChain format
        lc_messages = convert_to_langchain_messages(request.messages)

        # Make request using LangChain
        try:
            response = await llm.ainvoke(lc_messages)
            assistant_message = Message(
                role="assistant",
                content=response.content,
                content_type="text"
            )
        except Exception as e:
            print(f"AI model error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"AI model error: {str(e)}")

    # Update conversation with new messages
    user_message = Message(role="user", content=last_user_message, content_type="text")

    # Only add the last user message if it's not already in the conversation
    if not conversation.messages or conversation.messages[-1].role != "user" or conversation.messages[-1].content != last_user_message:
        conversation.messages.append(user_message)

    conversation.messages.append(assistant_message)
    conversation.updated_at = datetime.now().isoformat()
    save_conversation(conversation)

    print(f"Saved conversation: {conversation.id}")

    return UnifiedResponse(
        conversation_id=conversation.id,
        message=assistant_message,
        model_used=model_used,
        created_at=datetime.now().isoformat()
    )
