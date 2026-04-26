from pydantic import BaseModel

class RevealPhoneRequest(BaseModel):
    listing_id: int

class WhatsappClickRequest(BaseModel):
    listing_id: int
