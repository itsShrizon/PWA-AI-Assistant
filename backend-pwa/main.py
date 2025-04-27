"""
Main application entry point
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import routers
from app.endpoint.chat import router as chat_router
from app.endpoint.conversation import router as conversation_router
from app.endpoint.images import router as images_router

# Import user endpoints
from app.models import User, UserResponse
from app.database import save_user, get_user, get_user_conversations_count

# Context manager to initialize resources
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This is where we would initialize any global resources
    yield
    # Clean up resources if needed

app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(conversation_router)
app.include_router(images_router)

# User endpoints
@app.post("/users", response_model=UserResponse)
async def create_or_update_user(user: User):
    saved_user = save_user(user.model_dump())
    # Add conversations count to response
    saved_user["conversations_count"] = get_user_conversations_count(user.user_id)
    return saved_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user_endpoint(user_id: str):
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add conversations count to response
    user["conversations_count"] = get_user_conversations_count(user_id)
    return user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)