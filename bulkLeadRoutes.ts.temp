import { Router, Request, Response } from 'express';
import type { Lead, BulkCreateRequest, BulkUpdateRequest, BulkResponse, BulkResultItem } from '../app2';
import { leads, isValidEmail, generateId, formatTimestamp, setCache, deleteCache } from '../app2';

const router = Router();

// POST /leads/bulk - Bulk create leads
router.post('/bulk', (req: Request<unknown, unknown, BulkCreateRequest[]>, res: Response<BulkResponse | { error: string }>) => {
  if (!Array.isArray(req.body)) return res.status(400).json({
    total: 0, successful: 0, failed: 1,
    results: [{ index: 0, success: false, error: 'Request body must be an array' }],
  });

  const results: BulkResultItem[] = [];
  let successful = 0, failed = 0;

  req.body.forEach((data, idx) => {
    if (!data.name || !data.email) { results.push({ index: idx, success: false, error: 'Name and email are required' }); failed++; return; }
    if (!isValidEmail(data.email)) { results.push({ index: idx, success: false, error: 'Invalid email format' }); failed++; return; }

    const lead: Lead = {
      id: generateId(), name: data.name, email: data.email,
      phone: data.phone || '', status: 'NEW', source: data.source || '',
      created_at: formatTimestamp(), updated_at: formatTimestamp(),
    };
    leads.set(lead.id, lead);
    setCache(lead.id, lead).catch(console.error);
    results.push({ index: idx, success: true, lead });
    successful++;
  });

  res.status(201).json({ total: req.body.length, successful, failed, results });
});

// PUT /leads/bulk - Bulk update leads
router.put('/bulk', (req: Request<unknown, unknown, BulkUpdateRequest[]>, res: Response<BulkResponse | { error: string }>) => {
  if (!Array.isArray(req.body)) return res.status(400).json({
    total: 0, successful: 0, failed: 1,
    results: [{ index: 0, success: false, error: 'Request body must be an array' }],
  });

  const results: BulkResultItem[] = [];
  let successful = 0, failed = 0;

  req.body.forEach((update, idx) => {
    if (!update.id) { results.push({ index: idx, success: false, error: 'Lead ID is required' }); failed++; return; }

    const lead = leads.get(update.id);
    if (!lead) { results.push({ index: idx, success: false, error: 'Lead not found' }); failed++; return; }

    if (update.name !== undefined && !update.name) { results.push({ index: idx, success: false, error: 'Name cannot be empty' }); failed++; return; }

    if (update.email !== undefined) {
      if (!update.email) { results.push({ index: idx, success: false, error: 'Email cannot be empty' }); failed++; return; }
      if (!isValidEmail(update.email)) { results.push({ index: idx, success: false, error: 'Invalid email format' }); failed++; return; }
    }

    if ('status' in update) { results.push({ index: idx, success: false, error: 'Status changes must be made via PATCH /leads/:id/status endpoint' }); failed++; return; }

    if (update.name !== undefined) lead.name = update.name;
    if (update.email !== undefined) lead.email = update.email;
    if (update.phone !== undefined) lead.phone = update.phone;
    if (update.source !== undefined) lead.source = update.source;
    lead.updated_at = formatTimestamp();

    deleteCache(update.id);
    setCache(update.id, lead).catch(console.error);
    results.push({ index: idx, success: true, lead: { ...lead } });
    successful++;
  });

  res.status(200).json({ total: req.body.length, successful, failed, results });
});

export default router;
