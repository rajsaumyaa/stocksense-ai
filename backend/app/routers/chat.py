from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ChatRequest, ChatResponse
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="", tags=["Gemini AI Assistant"])

@router.post("/chat", response_model=ChatResponse)
def chat_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Accepts user prompts, retrieves RAG context from the SQL database,
    and runs it through Gemini (or local template fallback).
    """
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in req.history]
    
    reply = gemini_service.chat_assistant(req.message, history_dicts, db)
    
    # Generate dynamic suggested prompts based on user query
    suggested_prompts = [
        "Which products should I reorder tomorrow?",
        "Show products with highest stockout risk.",
        "How can I reduce overstock?",
        "Explain the overall inventory health."
    ]
    
    return ChatResponse(
        response=reply,
        suggested_prompts=suggested_prompts
    )
