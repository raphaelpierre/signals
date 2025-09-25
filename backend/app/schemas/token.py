from typing import Union
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Union[str, None] = None
    exp: Union[int, None] = None
    iat: Union[int, None] = None
