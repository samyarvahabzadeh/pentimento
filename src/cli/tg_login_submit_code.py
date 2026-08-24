import os
import sys
import json
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

load_dotenv()

def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Required environment variable is missing: {name}")
    return value

API_ID = int(required_env("TG_API_ID"))
API_HASH = required_env("TG_API_HASH")
SESSION_FILE = "pentimento_user.session"

async def sign_in_with_code(code: str, password: str = None):
    if not os.path.exists("tg_auth_state.json"):
        print("[-] Error: tg_auth_state.json not found. Request code first.")
        return {"status": "error", "message": "auth_state_not_found"}
    
    with open("tg_auth_state.json", "r", encoding="utf-8") as f:
        auth_state = json.load(f)
    
    phone = auth_state["phone"]
    phone_code_hash = auth_state["phone_code_hash"]
    proxy = auth_state.get("proxy")
    
    print("[*] Submitting the Telegram login code without logging sensitive values...")
    client = TelegramClient(SESSION_FILE, API_ID, API_HASH, proxy=proxy)
    await client.connect()
    
    try:
        await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
        me = await client.get_me()
        print(f"[+] Successfully logged in as: {me.first_name} (@{me.username}) [ID: {me.id}]")
        
        # Also generate string session if needed
        from telethon.sessions import StringSession
        string_client = TelegramClient(StringSession(), API_ID, API_HASH)
        # Session file is automatically saved by Telethon
        
        await client.disconnect()
        return {
            "status": "success",
            "user_id": me.id,
            "first_name": me.first_name,
            "username": me.username
        }
    except SessionPasswordNeededError:
        print("[!] 2FA Password is required!")
        if password:
            print("[*] Submitting 2FA password...")
            await client.sign_in(password=password)
            me = await client.get_me()
            print(f"[+] Successfully logged in with 2FA as: {me.first_name} (@{me.username}) [ID: {me.id}]")
            await client.disconnect()
            return {
                "status": "success",
                "user_id": me.id,
                "first_name": me.first_name,
                "username": me.username,
                "phone": me.phone
            }
        else:
            await client.disconnect()
            return {"status": "2fa_password_needed"}
    except Exception as e:
        print(f"[-] Login failed: {e}")
        await client.disconnect()
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tg_login_submit_code.py <CODE> [2FA_PASSWORD]")
        sys.exit(1)
    
    code_arg = sys.argv[1].strip()
    pwd_arg = sys.argv[2].strip() if len(sys.argv) > 2 else None
    
    result = asyncio.run(sign_in_with_code(code_arg, pwd_arg))
    print("\nRESULT_JSON:", json.dumps(result))
