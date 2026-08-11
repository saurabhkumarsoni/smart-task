from typing import Any


class RedisService:
    def __init__(self, client: Any):
        self.client = client

    def set(self, key: str, value: str, ttl: int | None = None) -> None:
        if ttl is None:
            self.client.set(key, value)
        else:
            self.client.set(key, value, ex=ttl)

    def get(self, key: str):
        return self.client.get(key)

    def delete(self, key: str) -> None:
        self.client.delete(key)
