"""Email sending with SendGrid primary, Gmail SMTP fallback"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_sendgrid(to_email: str, subject: str, html_body: str) -> bool:
    """Send email using SendGrid (Primary)"""
    try:
        from_email = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@yourcompany.com')
        
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_body
        )
        
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        response = sg.send(message)
        
        print(f"[SUCCESS] SendGrid email sent to {to_email}, status: {response.status_code}")
        return response.status_code == 202
        
    except Exception as e:
        print(f"[ERROR] SendGrid failed: {e}")
        return False

def send_email_gmail(to_email: str, subject: str, html_body: str) -> bool:
    """Send email using Gmail SMTP (Fallback)"""
    try:
        from_email = os.getenv('GMAIL_EMAIL')
        from_password = os.getenv('GMAIL_APP_PASSWORD')
        
        if not from_email or not from_password:
            print("[ERROR] Gmail credentials not configured")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email
        
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(from_email, from_password)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        
        print(f"[SUCCESS] Gmail SMTP email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Gmail SMTP failed: {e}")
        return False

def send_interview_email(to_email: str, subject: str, html_body: str) -> dict:
    """
    Send email with fallback logic
    
    1. Try SendGrid first (primary)
    2. Fallback to Gmail SMTP if SendGrid fails
    
    Returns:
        dict: {
            'success': bool,
            'provider': 'sendgrid' | 'gmail' | None,
            'error': str | None
        }
    """
    # Try SendGrid first
    print(f"[INFO] Attempting to send email to {to_email} via SendGrid...")
    if send_email_sendgrid(to_email, subject, html_body):
        return {
            'success': True,
            'provider': 'sendgrid',
            'error': None
        }
    
    print("[INFO] SendGrid failed, trying Gmail SMTP fallback...")
    
    # Fallback to Gmail
    if send_email_gmail(to_email, subject, html_body):
        return {
            'success': True,
            'provider': 'gmail',
            'error': None
        }
    
    # Both failed
    return {
        'success': False,
        'provider': None,
        'error': 'Both SendGrid and Gmail SMTP failed'
    }
