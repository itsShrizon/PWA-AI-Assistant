"""
Image endpoints for the application
"""
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..config import IMAGES_PATH

# Create router
router = APIRouter()

@router.get("/images/{image_id}.png")
async def get_image(image_id: str):
    image_path = os.path.join(IMAGES_PATH, f"{image_id}.png")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image_path)
