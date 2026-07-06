import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth, data, forecast, recommendations, chat, simulator

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="StockSense AI – AI Powered Retail Inventory Decision Intelligence Platform Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# Allow all origins in local docker dev, but restrict if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under prefix /api (and we can bind root redirects if helpful)
app.include_router(auth.router, prefix="/api")
app.include_router(data.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(simulator.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    print("[Database] Initializing tables and views...")
    try:
        init_db()
        print("[Database] Successfully initialized database.")
    except Exception as e:
        print(f"[Database] Error initializing database: {e}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
