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
SESSION_FILE = "pentimento_user.session"
BOT_TOKEN = required_env("TELEGRAM_BOT_TOKEN")

async def get_bot_info():
    client = TelegramClient(SESSION_FILE, API_ID, API_HASH)
    await client.connect()
    
    me = await client.get_me()
    print(f"[User Client] Logged in as: {me.first_name} (@{me.username}) [ID: {me.id}]")
    
    # Resolve the bot entity from the configured bot token ID.
    bot_id = int(BOT_TOKEN.split(":")[0])
    try:
        bot_entity = await client.get_entity(bot_id)
        print(f"[Bot Target] Found bot entity: {bot_entity.first_name} (@{bot_entity.username}) [ID: {bot_entity.id}]")
    except Exception as e:
        print(f"[-] Could not get entity by ID: {e}")
        bot_entity = None
    
    await client.disconnect()
    return {
        "user_id": me.id,
        "user_name": me.first_name,
        "user_username": me.username,
        "bot_id": bot_entity.id if bot_entity else bot_id,
        "bot_username": bot_entity.username if bot_entity else None,
        "bot_title": bot_entity.first_name if bot_entity else None,
    }

if __name__ == "__main__":
    res = asyncio.run(get_bot_info())
    print("\nRESULT_JSON:", json.dumps(res))
