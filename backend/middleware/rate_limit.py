from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limiter instance using client IP as key
limiter = Limiter(key_func=get_remote_address)

# Rate limit constants
RATE_LIMIT_AI_GENERATION = "30/hour"
RATE_LIMIT_STANDARD = "100/minute"
