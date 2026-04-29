import express, { Request, Response } from 'express';
import leadRoutes from './routes/leadRoutes';
import bulkLeadRoutes from './routes/bulkLeadRoutes';

type ApiResponse<T> = Response<T | { error: string }>;

const app = express();
app.use(express.json());

const leads = new Map<string, Lead>();
let idCounter = 1;

export type Status = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: Status;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  source?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
}

export interface StatusTransitionRequest {
  status: Status;
}

export interface BulkResultItem {
  index: number;
  success: boolean;
  lead?: Lead;
  error?: string;
}

export interface BulkResponse {
  total: number;
  successful: number;
  failed: number;
  results: BulkResultItem[];
}

export interface BulkCreateRequest extends Omit<CreateLeadRequest, 'id'> {}
export interface BulkUpdateRequest extends UpdateLeadRequest { id: string; }

let cache: Map<string, Lead> | any = new Map<string, Lead>();
let useRedis = false;

async function initCache() {
  try {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      connectTimeout: 10000,
    });
    await redis.ping();
    cache = redis;
    useRedis = true;
    console.log('✓ Redis cache enabled');
  } catch {
    console.log('✓ Redis unavailable — using in-memory cache');
    cache = new Map<string, Lead>();
  }
}

async function setCache(key: string, value: Lead): Promise<void> {
  if (useRedis) {
    await cache.setex(key, 3600, JSON.stringify(value));
  } else {
    (cache as Map<string, Lead>).set(key, value);
  }
}

async function getCache(key: string): Promise<Lead | undefined> {
  if (useRedis) {
    const data = await cache.get(key);
    return data ? JSON.parse(data) : undefined;
  }
  return (cache as Map<string, Lead>).get(key);
}

function deleteCache(key: string): void {
  if (useRedis) {
    cache.del(key);
  } else {
    (cache as Map<string, Lead>).delete(key);
  }
}

initCache().catch(console.error);

// ─── Validation helpers ─────────────────────────────────────────────────────
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validStatuses: Status[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

const isValidTransition = (current: Status, next: Status): boolean => {
  if (current === 'CONVERTED' || current === 'LOST') return false;
  const path: Status[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'];
  const curIdx = path.indexOf(current);
  const nextIdx = path.indexOf(next);
  if (next === 'LOST') return true;
  return nextIdx === curIdx + 1;
};

// ─── Utility ─────────────────────────────────────────────────────────────────
const generateId = (): string => String(idCounter++);
const formatTimestamp = (): string => new Date().toISOString();

// Mount route modules
app.use('/leads', leadRoutes);

app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✓ Lead management API running on http://localhost:${PORT}`);
  });
}

export { leads, generateId, formatTimestamp, cache, isValidEmail, validStatuses, isValidTransition, setCache, getCache, deleteCache };
export default app;
