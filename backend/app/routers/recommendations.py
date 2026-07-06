from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.recommendation import recommendation_service

router = APIRouter(prefix="", tags=["Decision Recommendations"])

@router.get("/recommendations")
def get_inventory_recommendations(db: Session = Depends(get_db)):
    """
    Evaluates current inventory levels and future forecast trends
    to output restocking suggestions, priority ranks, and estimated revenue impact.
    """
    return recommendation_service.generate_recommendations(db)
