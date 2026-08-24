import os
import sys
import json
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Required environment variable is missing: {name}")
    return value

API_ID = int(required_env("TG_API_ID"))
API_HASH = required_env("TG_API_HASH")
SESSION_FILE = "pentimento_user"
BOT_USERNAME = os.getenv("PENTIMENTO_BOT_USERNAME", "pentix2bot")

async def test_ping():
    print("[1] Connecting to Telegram...", flush=True)
    async with TelegramClient(SESSION_FILE, API_ID, API_HASH) as client:
        me = await client.get_me()
        print(f"[2] Authenticated: {me.first_name} (@{me.username}) ID={me.id}", flush=True)

        bot = await client.get_entity(BOT_USERNAME)
        print(f"[3] Found bot: {bot.first_name} (@{bot.username}) ID={bot.id}", flush=True)

        print("[4] Sending /restart...", flush=True)
        sent = await client.send_message(bot, "/restart")
        print(f"[5] Sent message ID={sent.id} date={sent.date}", flush=True)

        print("[6] Waiting for response...", flush=True)
        for i in range(20):
            await asyncio.sleep(1)
            msgs = await client.get_messages(bot, limit=3)
            for m in msgs:
                if m.id > sent.id:
                    print(f"[7] Received response ID={m.id} date={m.date}:\n{m.text}", flush=True)
                    return
        print("[-] No response received after 20s", flush=True)

if __name__ == "__main__":
    asyncio.run(test_ping())
