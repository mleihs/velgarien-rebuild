from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.config import settings
from backend.middleware.rate_limit import limiter
from backend.middleware.security import SecurityHeadersMiddleware
from backend.routers import health, simulations, users

app = FastAPI(
    title="Velgarien Platform API",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# --- Middleware (applied in reverse order) ---

# Security headers
app.add_middleware(SecurityHeadersMiddleware)

# CORS
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate Limiting ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Routers ---
app.include_router(health.router)
app.include_router(users.router)
app.include_router(simulations.router)
