from rq import Connection, Worker

from app.workers.tasks import queue, redis_conn


def run_worker() -> None:
    with Connection(redis_conn):
        worker = Worker([queue.name])
        worker.work()


if __name__ == "__main__":
    run_worker()
