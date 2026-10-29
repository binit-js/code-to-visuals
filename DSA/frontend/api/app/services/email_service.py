import os
import json
import smtplib
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Dict, Any, Tuple
from dotenv import load_dotenv

from ..models.feedback import FeedbackRequest

# Load environment variables from backend directory or project root
load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')
load_dotenv()

# Safe serverless directory handling (Vercel/AWS Lambda only permits writes to /tmp)
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DATA_DIR = Path("/tmp/data")
else:
    DATA_DIR = Path(__file__).resolve().parent.parent.parent / 'data'

try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

FEEDBACK_FILE = DATA_DIR / 'feedbacks.jsonl'

DEFAULT_ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'b33022659@gmail.com')


def save_feedback_locally(feedback: FeedbackRequest, feedback_id: str) -> None:
    """Safely append feedback record to local JSONL storage."""
    record = {
        'id': feedback_id,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'category': feedback.category,
        'name': feedback.name,
        'email': feedback.email,
        'subject': feedback.subject,
        'message': feedback.message,
        'rating': feedback.rating,
        'current_code': feedback.current_code,
        'step_info': feedback.step_info,
    }
    try:
        with open(FEEDBACK_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    except Exception as e:
        print(f"Warning: could not write feedback locally: {e}")


def generate_mailto_url(feedback: FeedbackRequest, recipient_email: str) -> str:
    """Construct a clean pre-filled mailto URL as client fallback."""
    subject = f"[CodeFlow {feedback.category.upper()}] {feedback.subject}"
    body_lines = [
        f"Category: {feedback.category.upper()}",
        f"Rating: {feedback.rating}/5 stars",
        f"From: {feedback.name} <{feedback.email or 'N/A'}>",
        "",
        "Message / Complaint:",
        feedback.message,
    ]
    if feedback.step_info:
        body_lines.extend(["", "Runtime Step Info:", feedback.step_info])
    if feedback.current_code:
        body_lines.extend(["", "Code Snippet:", feedback.current_code[:1000]])

    body = "\n".join(body_lines)
    params = urllib.parse.urlencode({'subject': subject, 'body': body}, quote_via=urllib.parse.quote)
    return f"mailto:{recipient_email}?{params}"


def send_via_smtp(feedback: FeedbackRequest, recipient_email: str) -> Tuple[bool, str]:
    """Send feedback via configured SMTP server (Gmail, Outlook, AWS SES, etc.)."""
    host = os.getenv('SMTP_HOST')
    port = int(os.getenv('SMTP_PORT', '587'))
    user = os.getenv('SMTP_USER')
    password = os.getenv('SMTP_PASSWORD')
    use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() in ('true', '1', 'yes')

    if not host or not user or not password:
        return False, "SMTP credentials not configured"

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"[CodeFlow {feedback.category.upper()}] {feedback.subject}"
    msg['From'] = f"CodeFlow Feedback <{user}>"
    msg['To'] = recipient_email
    if feedback.email:
        msg['Reply-To'] = feedback.email

    # Plain text version
    text_content = f"""New CodeFlow Feedback / Complaint Received
----------------------------------------------
Category: {feedback.category.upper()}
Rating: {feedback.rating}/5 Stars
Sender: {feedback.name} ({feedback.email or 'No email provided'})
Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}

Subject: {feedback.subject}

Message:
{feedback.message}

{f"Step Info: {feedback.step_info}" if feedback.step_info else ""}
{f"Code Snippet:\n{feedback.current_code}" if feedback.current_code else ""}
"""

    # HTML version
    category_colors = {
        'bug': '#ef4444',
        'complaint': '#f97316',
        'feature': '#3b82f6',
        'appreciation': '#10b981',
        'general': '#8b5cf6',
    }
    badge_color = category_colors.get(feedback.category, '#10b981')

    code_html = ""
    if feedback.current_code:
        escaped_code = feedback.current_code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        code_html = f"""
        <div style="margin-top: 15px;">
            <strong style="color: #cbd5e1; font-size: 13px;">Attached Code:</strong>
            <pre style="background: #090d16; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; color: #38bdf8; font-family: monospace; font-size: 12px; overflow-x: auto;">{escaped_code}</pre>
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="background-color: #0c0f17; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 25px; margin: 0;">
        <div style="max-width: 620px; margin: auto; background: #131722; border: 1px solid #27272a; border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #ffffff; font-size: 20px;">⚡ CodeFlow Feedback Received</h2>
                <span style="background: {badge_color}; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase;">
                    {feedback.category}
                </span>
            </div>

            <div style="background: #181d2a; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
                <div><strong style="color: #94a3b8;">From:</strong> <span style="color: #ffffff;">{feedback.name}</span> &lt;<a href="mailto:{feedback.email}" style="color: #10b981;">{feedback.email or 'N/A'}</a>&gt;</div>
                <div><strong style="color: #94a3b8;">Rating:</strong> <span style="color: #fbbf24;">{'★' * (feedback.rating or 5)}{'☆' * (5 - (feedback.rating or 5))}</span> ({feedback.rating}/5)</div>
                <div><strong style="color: #94a3b8;">Subject:</strong> <span style="color: #ffffff; font-weight: 600;">{feedback.subject}</span></div>
            </div>

            <div style="font-size: 14px; line-height: 1.7; color: #e2e8f0; background: #0f131c; padding: 18px; border-radius: 10px; border-left: 4px solid {badge_color}; white-space: pre-wrap;">{feedback.message}</div>

            {code_html}

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #27272a; font-size: 11px; color: #64748b; text-align: center;">
                Delivered securely directly from CodeFlow Visualizer • {datetime.now(timezone.utc).strftime('%b %d, %Y %H:%M UTC')}
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(text_content, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))

    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls()

        server.login(user, password)
        server.send_message(msg)
        server.quit()
        return True, "Email sent successfully via SMTP"
    except Exception as e:
        return False, f"SMTP Error: {str(e)}"


def send_via_web3forms(feedback: FeedbackRequest, recipient_email: str) -> Tuple[bool, str]:
    """Send feedback via Web3Forms API if access key is provided."""
    access_key = os.getenv('WEB3FORMS_ACCESS_KEY')
    if not access_key:
        return False, "WEB3FORMS_ACCESS_KEY not configured"

    payload = {
        'access_key': access_key,
        'subject': f"[CodeFlow {feedback.category.upper()}] {feedback.subject}",
        'from_name': f"{feedback.name} via CodeFlow",
        'email': feedback.email or 'noreply@codeflow.dev',
        'message': f"Category: {feedback.category}\nRating: {feedback.rating}/5\n\n{feedback.message}\n\nCode:\n{feedback.current_code or 'None'}",
        'to': recipient_email,
    }

    try:
        req = urllib.request.Request(
            'https://api.web3forms.com/submit',
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'User-Agent': 'CodeFlow-Visualizer'},
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('success'):
                return True, "Email sent via Web3Forms"
            return False, data.get('message', 'Web3Forms error')
    except Exception as e:
        return False, f"Web3Forms exception: {str(e)}"


def process_feedback(feedback: FeedbackRequest) -> Dict[str, Any]:
    """Central processor for user feedback & complaints."""
    recipient_email = os.getenv('ADMIN_EMAIL', DEFAULT_ADMIN_EMAIL)
    feedback_id = f"fb_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{os.urandom(3).hex()}"

    # Always persist locally first so feedback is never lost
    save_feedback_locally(feedback, feedback_id)

    # Try SMTP first
    smtp_ok, smtp_msg = send_via_smtp(feedback, recipient_email)
    if smtp_ok:
        return {
            'success': True,
            'message': f"Feedback delivered directly to {recipient_email} via SMTP!",
            'method': 'smtp',
            'feedback_id': feedback_id,
            'mailto_url': None,
        }

    # Try Web3Forms next if access key present
    w3_ok, w3_msg = send_via_web3forms(feedback, recipient_email)
    if w3_ok:
        return {
            'success': True,
            'message': f"Feedback delivered directly to {recipient_email}!",
            'method': 'web3forms',
            'feedback_id': feedback_id,
            'mailto_url': None,
        }

    # If neither external service is configured, it is safely stored locally and we provide the direct mailto URL
    mailto_url = generate_mailto_url(feedback, recipient_email)
    return {
        'success': True,
        'message': f"Feedback safely received and logged for {recipient_email}. You can also send directly via your email client.",
        'method': 'saved_locally_and_mailto',
        'feedback_id': feedback_id,
        'mailto_url': mailto_url,
    }
