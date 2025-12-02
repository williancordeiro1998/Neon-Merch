import os
import json
import logging
from typing import Optional, Any

# Redis oficial agora suporta async nativo
import redis.asyncio as redis

logger = logging.getLogger("uvicorn")

class CacheService:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
        self.local_cache = {}
        self.use_redis = os.getenv("USE_REDIS", "1") == "1"
        self.redis_url = os.getenv("REDIS_URL", "redis://redis:6379")

    async def connect(self):
        if self.use_redis:
            try:
                self.redis = redis.from_url(self.redis_url, decode_responses=True)
                await self.redis.ping()
                logger.info("✅ Conectado ao Redis.")
            except Exception as e:
                logger.warning(f"⚠️ Falha ao conectar no Redis ({e}). Usando memória local.")
                self.redis = None

    async def get(self, key: str) -> Optional[Any]:
        try:
            if self.redis:
                data = await self.redis.get(key)
                return json.loads(data) if data else None
        except Exception:
            pass # Fail silently para fallback
        return self.local_cache.get(key)

    async def set(self, key: str, value: Any, ex: int = 300):
        json_val = json.dumps(value)
        try:
            if self.redis:
                await self.redis.set(key, json_val, ex=ex)
                return
        except Exception:
            pass
        self.local_cache[key] = json.loads(json_val) # Simula comportamento de serialização

cache_service = CacheService()