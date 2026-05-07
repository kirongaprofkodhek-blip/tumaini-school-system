import base64
import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass

from ..config import settings


@dataclass
class SmsSendResult:
    success: bool
    provider: str
    message: str


class SmsService:
    """
    Supports console mode for local development and real provider modes for
    Twilio and Africa's Talking, selected through environment variables.
    """

    def __init__(self) -> None:
        self.provider = settings.sms_provider.strip().lower()

    def send(self, phone_number: str, message_body: str) -> SmsSendResult:
        if self.provider == "console":
            return SmsSendResult(
                success=True,
                provider="console",
                message=f"SMS queued for {phone_number}: {message_body}",
            )
        if self.provider == "twilio":
            return self._send_twilio(phone_number, message_body)
        if self.provider == "africastalking":
            return self._send_africastalking(phone_number, message_body)
        return SmsSendResult(
            success=False,
            provider=self.provider,
            message="Unsupported SMS provider configured.",
        )

    def _send_twilio(self, phone_number: str, message_body: str) -> SmsSendResult:
        if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_from_number:
            return SmsSendResult(False, "twilio", "Twilio credentials are not configured.")

        url = (
            f"https://api.twilio.com/2010-04-01/Accounts/"
            f"{settings.twilio_account_sid}/Messages.json"
        )
        payload = urllib.parse.urlencode(
            {
                "To": phone_number,
                "From": settings.twilio_from_number,
                "Body": message_body,
            }
        ).encode("utf-8")
        auth_raw = f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode("utf-8")
        auth_value = base64.b64encode(auth_raw).decode("utf-8")
        request = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Basic {auth_value}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method="POST",
        )
        return self._perform_request(request, "twilio")

    def _send_africastalking(self, phone_number: str, message_body: str) -> SmsSendResult:
        if not settings.africastalking_username or not settings.africastalking_api_key:
            return SmsSendResult(False, "africastalking", "Africa's Talking credentials are not configured.")

        payload = urllib.parse.urlencode(
            {
                "username": settings.africastalking_username,
                "to": phone_number,
                "message": message_body,
                "from": settings.sms_sender_id,
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            "https://api.africastalking.com/version1/messaging",
            data=payload,
            headers={
                "apiKey": settings.africastalking_api_key,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            method="POST",
        )
        return self._perform_request(request, "africastalking")

    def _perform_request(self, request: urllib.request.Request, provider: str) -> SmsSendResult:
        try:
            with urllib.request.urlopen(request, timeout=settings.sms_timeout_seconds) as response:
                body = response.read().decode("utf-8", errors="replace")
                status_ok = 200 <= response.status < 300
                message = body
                try:
                    parsed = json.loads(body)
                    message = json.dumps(parsed)
                except json.JSONDecodeError:
                    pass
                return SmsSendResult(status_ok, provider, message)
        except urllib.error.HTTPError as exc:
            try:
                body = exc.read().decode("utf-8", errors="replace")
            except Exception:
                body = str(exc)
            return SmsSendResult(False, provider, body)
        except Exception as exc:
            return SmsSendResult(False, provider, str(exc))
