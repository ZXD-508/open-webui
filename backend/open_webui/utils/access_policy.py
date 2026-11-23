"""Runtime access policy for admin-key sharing.

Both switches live in the admin config (``ui.admin_key_shared`` and
``ui.free_chat_enabled``). Normal users may use the admin-configured model
connections — and therefore the admin's API key — only while both are on.
When either switch is off, users fall back to their own connections.
"""

from open_webui.models.config import Config

ADMIN_KEY_SHARED_KEY = 'ui.admin_key_shared'
FREE_CHAT_ENABLED_KEY = 'ui.free_chat_enabled'


async def admin_key_shared_for_users() -> bool:
    values = await Config.get_many(ADMIN_KEY_SHARED_KEY, FREE_CHAT_ENABLED_KEY)
    return bool(values.get(ADMIN_KEY_SHARED_KEY)) and bool(values.get(FREE_CHAT_ENABLED_KEY))
