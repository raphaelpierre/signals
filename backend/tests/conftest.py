"""Pytest configuration and fixtures."""
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fakeredis import FakeRedis

from app.main import app
from app.db.base_class import Base
from app.db.session import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.core.security import get_password_hash

# Test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def fake_redis():
    """Provide a fake Redis instance for testing."""
    return FakeRedis()


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        stripe_customer_id="cus_test123"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_user_with_subscription(db: Session, test_user: User) -> User:
    """Create a test user with an active subscription."""
    subscription = Subscription(
        user_id=test_user.id,
        stripe_subscription_id="sub_test123",
        status="active",
        current_period_start=None,
        current_period_end=None
    )
    db.add(subscription)
    db.commit()
    db.refresh(test_user)
    return test_user


@pytest.fixture
def auth_headers(client: TestClient, test_user_with_subscription: User) -> dict:
    """Get authentication headers for test user."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user_with_subscription.email,
            "password": "testpassword"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
