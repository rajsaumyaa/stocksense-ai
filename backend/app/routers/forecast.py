from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.forecast_service import forecast_service
from app.routers.auth import get_current_user

router = APIRouter(prefix="", tags=["ML Demand Forecasting"])

@router.post("/train", status_code=status.HTTP_200_OK)
def train_forecasting_model(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Triggers XGBoost model training on historical sales records.
    Outputs evaluation R2 metric and saves the joblib binary.
    """
    res = forecast_service.train_model(db)
    if res["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res["message"]
        )
    return res

@router.get("/forecast")
def get_demand_forecast(db: Session = Depends(get_db)):
    """
    Retrieves the tomorrow/next week demand forecast.
    Automatically returns a rolling baseline if the model isn't trained yet.
    """
    return forecast_service.get_forecasts(db)
