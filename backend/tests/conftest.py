import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.compiler import compiles
from httpx import ASGITransport, AsyncClient

from app.db.base import Base
from app.main import app as fastapi_app
from app.api.deps import get_db
from app.core.auth import create_access_token
from app.core.rate_limiter import public_submission_limiter
import app.models  # Register all models
import pytest


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    public_submission_limiter.reset()
    yield
    public_submission_limiter.reset()


@compiles(ARRAY, "sqlite")
def compile_array(element, compiler, **kw):
    return "JSON"


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_db
    access_token = create_access_token({
        "sub": "test-admin",
        "email": "admin@example.com",
        "role": "admin",
    })
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": "Bearer test-admin-token"}
    ) as ac:
        ac.headers["Authorization"] = f"Bearer {access_token}"
        yield ac
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def unauthenticated_client(db_session):
    async def override_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_db
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()
