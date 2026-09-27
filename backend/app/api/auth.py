from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role,
        name=user.name
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department=user.department
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-users")
def get_demo_users():
    return [
        {
            "role": "admin",
            "title": "Hospital Administrator",
            "name": "Dr. Sarah Chen",
            "email": "admin@mediflow.health",
            "password": "admin123",
            "description": "Full access to dashboard, capacity, beds, audit logs, and surge simulation"
        },
        {
            "role": "doctor",
            "title": "Attending Physician / Intensivist",
            "name": "Dr. Marcus Smith, MD",
            "email": "dr.smith@mediflow.health",
            "password": "doctor123",
            "description": "Clinical assessment, priority overrides, and recommendation approval"
        },
        {
            "role": "nurse",
            "title": "Triage & Bed Flow Nurse",
            "name": "Clara Evans, BSN RN",
            "email": "nurse.clara@mediflow.health",
            "password": "nurse123",
            "description": "Bed status updates, patient intakes, admissions, and discharge workflow"
        }
    ]
