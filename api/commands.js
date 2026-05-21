import { Redis } from '@upstash/redis';

// Upstash Redis credentials are automatically injected by Vercel
// when you connect Upstash from the Marketplace (UPSTASH_REDIS_REST_URL + TOKEN)
const redis = Redis.fromEnv();

const SECRET = process.env.COMMANDS_SECRET;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ==================== GET ====================
  if (req.method === 'GET') {
    try {
      const data = await redis.get('zne-commands');

      if (data && Array.isArray(data.commands)) {
        return res.status(200).json(data);
      }

      // No data yet
      return res.status(200).json({ commands: [] });
    } catch (error) {
      console.error('Redis GET error:', error);
      return res.status(500).json({ error: 'Failed to fetch commands from Redis' });
    }
  }

  // ==================== POST (from bot) ====================
  if (req.method === 'POST') {
    const { commands, secret } = req.body || {};

    if (!SECRET || secret !== SECRET) {
      return res.status(401).json({ error: 'Unauthorized: Invalid secret key' });
    }

    if (!Array.isArray(commands)) {
      return res.status(400).json({ error: 'Bad Request: "commands" must be an array' });
    }

    try {
      await redis.set('zne-commands', { commands });

      return res.status(200).json({
        success: true,
        message: 'Command list updated successfully',
        count: commands.length
      });
    } catch (error) {
      console.error('Redis SET error:', error);
      return res.status(500).json({ error: 'Failed to save commands to Redis' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
