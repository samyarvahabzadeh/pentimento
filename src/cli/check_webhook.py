import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv()
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

req = urllib.request.Request(f"https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo")
try:
    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode())
        print("WEBHOOK_INFO:", json.dumps(data))
except Exception as e:
    print("WEBHOOK_ERROR:", e)
