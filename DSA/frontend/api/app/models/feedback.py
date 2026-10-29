from pydantic import BaseModel, EmailStr
from typing import Optional, Literal

class FeedbackRequest(BaseModel):
    category: Literal["bug", "complaint", "feature", "general", "appreciation"] = "general"
    name: Optional[str] = "Anonymous"
    email: Optional[str] = ""
    subject: str
    message: str
    rating: Optional[int] = 5
    current_code: Optional[str] = None
    step_info: Optional[str] = None

class FeedbackResponse(BaseModel):
    success: bool
    message: str
    method: str
    feedback_id: Optional[str] = None
    mailto_url: Optional[str] = None
