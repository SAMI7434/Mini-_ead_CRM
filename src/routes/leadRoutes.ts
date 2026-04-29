import { Router, Request, Response } from 'express';
import type { Lead, Status, CreateLeadRequest, UpdateLeadRequest, StatusTransitionRequest } from '../app2';
import { leads, isValidEmail, validStatuses, isValidTransition, generateId, formatTimestamp, setCache, getCache, deleteCache } from '../app2';

const router = Router();

// POST /leads - Create lead
router.post('/', (req: Request<unknown, unknown, CreateLeadRequest>, res: Response<Lead | { error: string }>) => {
  const { name, email, phone, source } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

  const lead: Lead = {
    id: generateId(), name, email, phone: phone || '', status: 'NEW',
    source: source || '', created_at: formatTimestamp(), updated_at: formatTimestamp(),
  };
  leads.set(lead.id, lead);
  setCache(lead.id, lead).catch(console.error);
  res.status(201).json(lead);
});

// GET /leads - List leads (with optional status filter)
router.get('/', (req: Request, res: Response<Lead[] | { error: string }>) => {
  const { status } = req.query;
  let list = Array.from(leads.values());
  if (typeof status === 'string') {
    if (!validStatuses.includes(status as Status)) return res.status(400).json({ error: 'Invalid status filter' });
    list = list.filter(l => l.status === status);
  }
  res.status(200).json(list);
});

// GET /leads/:id - Get single lead (with cache)
router.get('/:id', async (req: Request<{ id: string }>, res: Response<Lead | { error: string }>) => {
  const id = req.params.id;
  const cached = await getCache(id);
  if (cached) return res.status(200).json(cached);

  const lead = leads.get(id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  setCache(id, lead).catch(console.error);
  res.status(200).json(lead);
});

// PUT /leads/:id - Update lead (full update)
router.put('/:id', (req: Request<{ id: string }, unknown, UpdateLeadRequest>, res: Response<Lead | { error: string }>) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if ('status' in req.body) return res.status(400).json({ error: 'Status changes must be made via PATCH /leads/:id/status endpoint' });

  const { name, email, phone, source } = req.body;
  if (name !== undefined && !name) return res.status(400).json({ error: 'Name cannot be empty' });
  if (email !== undefined) {
    if (!email) return res.status(400).json({ error: 'Email cannot be empty' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
  }

  if (name !== undefined) lead.name = name;
  if (email !== undefined) lead.email = email;
  if (phone !== undefined) lead.phone = phone;
  if (source !== undefined) lead.source = source;
  lead.updated_at = formatTimestamp();

  deleteCache(req.params.id);
  setCache(req.params.id, lead).catch(console.error);
  res.status(200).json(lead);
});

// PATCH /leads/:id/status - Update lead status
router.patch('/:id/status', (req: Request<{ id: string }, unknown, StatusTransitionRequest>, res: Response<Lead | { error: string }>) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { status } = req.body;
  if (!status || !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status value' });
  if (!isValidTransition(lead.status, status)) return res.status(400).json({ error: `Invalid status transition from ${lead.status} to ${status}` });

  lead.status = status;
  lead.updated_at = formatTimestamp();

  deleteCache(req.params.id);
  setCache(req.params.id, lead).catch(console.error);
  res.status(200).json(lead);
});

// DELETE /leads/:id - Delete lead
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  if (!leads.has(req.params.id)) return res.status(404).json({ error: 'Lead not found' });
  leads.delete(req.params.id);
  deleteCache(req.params.id);
  res.status(204).send();
});

export default router;
