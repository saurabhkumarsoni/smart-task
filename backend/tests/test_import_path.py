import importlib


def test_app_module_importable_from_project_root():
    module = importlib.import_module("app.main")
    assert module is not None
