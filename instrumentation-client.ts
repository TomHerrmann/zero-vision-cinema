import { initBotId } from 'botid/client/core';
import { BOT_PROTECTED_ROUTES } from '@/lib/botProtectedRoutes';

// Attach the BotID challenge to requests to the public endpoints the server
// checks with blockBots(). Invisible to visitors.
initBotId({ protect: [...BOT_PROTECTED_ROUTES] });
