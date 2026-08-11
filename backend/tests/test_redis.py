from unittest.mock import Mock

from app.redis.service import RedisService


def test_redis_service_sets_and_gets_values():
    client = Mock()
    service = RedisService(client)

    service.set("demo", "value")
    service.get("demo")

    client.set.assert_called_once_with("demo", "value")
    client.get.assert_called_once_with("demo")
