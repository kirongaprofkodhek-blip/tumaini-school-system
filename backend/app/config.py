from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Tumaini School System API"
    environment: str = "development"
    database_url: str = "sqlite:///./tumaini_school.db"
    frontend_url: str = "http://localhost:5173"
    sms_provider: str = "console"
    sms_sender_id: str = "Tumaini"
    sms_timeout_seconds: int = 20
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    africastalking_username: str = ""
    africastalking_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="TUMAINI_")


settings = Settings()
