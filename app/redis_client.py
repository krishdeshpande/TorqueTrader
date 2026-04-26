import fakeredis
from fastapi import Request

# In-memory mock for Redis
redis_client = fakeredis.FakeRedis(decode_responses=True)

def get_redis():
    return redis_client
