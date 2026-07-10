import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app.api import deps
from app.core import security
from app.config import settings
from app.models.user import User
from app.schemas.auth import UserCreate, UserOut, Token, GoogleToken
from app.schemas.common import APIResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=APIResponse[UserOut])
def register(user_in: UserCreate, db: Session = Depends(deps.get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )
    
    # Create new user
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(email=user_in.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return APIResponse(
        success=True,
        data=UserOut.model_validate(db_user)
    )

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(deps.get_db)):
    # Standard OAuth2 endpoint for getting the token
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account. Sign up as a new user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={
            "sub": user.email,
            "name": user.name,
            "picture_url": user.picture_url
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
def google_auth(token_in: GoogleToken, db: Session = Depends(deps.get_db)):
    try:
        # Verify the Google ID token.
        # Specify the CLIENT_ID if configured. Otherwise, verify general token validity.
        idinfo = id_token.verify_oauth2_token(
            token_in.id_token,
            requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
        )
        
        # Verify issuer
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValueError("Wrong issuer.")
            
        email = idinfo.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token does not contain an email address."
            )
            
        name = idinfo.get("name")
        picture_url = idinfo.get("picture")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Google ID token: {str(e)}"
        )

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create new user if they don't exist
        # Generate a random password since they authenticate via Google
        random_password = secrets.token_urlsafe(32)
        hashed_password = security.get_password_hash(random_password)
        
        user = User(
            email=email,
            hashed_password=hashed_password,
            name=name,
            picture_url=picture_url
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update profile info if changed
        updated = False
        if user.name != name:
            user.name = name
            updated = True
        if user.picture_url != picture_url:
            user.picture_url = picture_url
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    # Create our application's access token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={
            "sub": user.email,
            "name": user.name,
            "picture_url": user.picture_url
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
