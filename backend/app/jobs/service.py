import threading
import time
from collections import deque
from typing import Any, Callable


class JobService:
    def __init__(self):
        self._jobs: dict[str, Callable[..., None]] = {}
        self._queue: deque[tuple[str, tuple[Any, ...], dict[str, Any]]] = deque()
        self._worker_thread: threading.Thread | None = None
        self._stop_event: threading.Event | None = None
        self._lock = threading.Lock()

    def register(self, name: str, func: Callable[..., None]) -> None:
        self._jobs[name] = func

    def enqueue(self, name: str, *args: Any, **kwargs: Any) -> None:
        if name not in self._jobs:
            raise KeyError(f"Job '{name}' is not registered")
        with self._lock:
            self._queue.append((name, args, kwargs))

    def run_pending(self) -> None:
        while True:
            with self._lock:
                if not self._queue:
                    break
                name, args, kwargs = self._queue.popleft()
            self._jobs[name](*args, **kwargs)

    def start_worker(self, interval: float = 0.1) -> None:
        if self._worker_thread and self._worker_thread.is_alive():
            return

        self._stop_event = threading.Event()
        self._worker_thread = threading.Thread(
            target=self._worker_loop,
            args=(interval,),
            daemon=True,
        )
        self._worker_thread.start()

    def stop_worker(self) -> None:
        if self._stop_event:
            self._stop_event.set()
        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=1.0)
        self._worker_thread = None
        self._stop_event = None

    def _worker_loop(self, interval: float) -> None:
        while True:
            if self._stop_event and self._stop_event.is_set():
                break
            self.run_pending()
            if self._stop_event and self._stop_event.is_set():
                break
            time.sleep(interval)
