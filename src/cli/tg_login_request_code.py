import os
import sys
import json
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Required environment variable is missing: {name}")
    return value

API_ID = int(required_env("TG_API_ID"))
API_HASH = required_env("TG_API_HASH")
PHONE = required_env("TG_PHONE")
SESSION_FILE = "pentimento_user.session"

async def test_connection():
    print("[*] Attempting to connect to Telegram MTProto with environment-provided credentials...")
    
    # Try connecting without proxy first, and if needed with socks5
    proxies_to_try = [
        None,
        ("socks5", "127.0.0.1", 10808),
        ("http", "127.0.0.1", 10809),
        ("socks5", "127.0.0.1", 1080),
    ]

    for proxy in proxies_to_try:
        proxy_desc = f"{proxy[0]}://{proxy[1]}:{proxy[2]}" if proxy else "Direct"
        print(f"[*] Trying connection mode: {proxy_desc}...")
        try:
            client = TelegramClient(SESSION_FILE, API_ID, API_HASH, proxy=proxy)
            await asyncio.wait_for(client.connect(), timeout=10.0)
            print(f"[+] Successfully connected to Telegram via {proxy_desc}!")
            
            is_auth = await client.is_user_authorized()
            if is_auth:
                me = await client.get_me()
                print(f"[+] Already authorized as: {me.first_name} (@{me.username}) [ID: {me.id}]")
                await client.disconnect()
                return {"status": "already_authorized", "user_id": me.id, "username": me.username}
            else:
                print("[*] Requesting a Telegram login code...")
                sent_code = await client.send_code_request(PHONE)
                print(f"[+] Code successfully sent! phone_code_hash: {sent_code.phone_code_hash}")
                
                # Save state for the second step
                with open("tg_auth_state.json", "w", encoding="utf-8") as f:
                    json.dump({
                        "phone": PHONE,
                        "phone_code_hash": sent_code.phone_code_hash,
                        "proxy": proxy,
                    }, f)
                
                await client.disconnect()
                return {"status": "code_sent", "phone_code_hash": sent_code.phone_code_hash, "proxy": proxy_desc}
        except Exception as e:
            print(f"[-] Connection via {proxy_desc} failed: {e}")
            try:
                await client.disconnect()
            except Exception:
                pass
    
    return {"status": "all_failed"}

if __name__ == "__main__":
    result = asyncio.run(test_connection())
    print("\nRESULT_JSON:", json.dumps(result))
