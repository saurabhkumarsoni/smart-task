import builtins
import importlib
import sys


def test_app_import_does_not_fail_when_redis_is_unavailable(monkeypatch):
    original_import = builtins.__import__

    def fake_import(name, *args, **kwargs):
        if name == "redis" or name.startswith("redis."):
            raise ModuleNotFoundError("No module named 'redis'")
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", fake_import)

    for module_name in ["app", "app.redis", "app.redis.client", "app.redis.service"]:
        sys.modules.pop(module_name, None)

    app_module = importlib.import_module("app")

    assert app_module.get_redis_client() is None
