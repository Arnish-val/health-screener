from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class AssessmentHistory(Base):
    __tablename__ = "assessment_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_type = Column(String, index=True, nullable=False) # 'disease' or 'depression'
    result_data = Column(JSON, nullable=False) # Store the full output dict
    created_at = Column(DateTime(timezone=True), server_default=func.now())
