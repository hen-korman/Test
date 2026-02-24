import { Router, Request, Response } from 'express';
import { SyncService } from '../services/sync.service';

const router = Router();
const syncService = new SyncService();

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: syncService.getAll() });
});

router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const sync = syncService.getById(id);
  if (!sync) {
    return res.status(404).json({ success: false, error: 'Sync not found' });
  }
  res.json({ success: true, data: sync });
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, targetType, targetId, targetName, criteriaGroup, intervalMinutes, enforceExclusive } = req.body;

    if (!name || !targetType || !targetId || !criteriaGroup || !intervalMinutes) {
      return res.status(400).json({
        success: false,
        error: 'name, targetType, targetId, criteriaGroup, and intervalMinutes are required',
      });
    }

    const sync = syncService.create({
      name,
      targetType,
      targetId,
      targetName: targetName || targetId,
      criteriaGroup,
      intervalMinutes: Math.max(5, intervalMinutes),
      enforceExclusive: enforceExclusive ?? false,
    });

    res.status(201).json({ success: true, data: sync });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sync = syncService.update(id, req.body);
    res.json({ success: true, data: sync });
  } catch (error: any) {
    res.status(error.message === 'Sync not found' ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    syncService.delete(id);
    res.json({ success: true, message: 'Sync deleted' });
  } catch (error: any) {
    res.status(error.message === 'Sync not found' ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await syncService.runSync(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.message === 'Sync not found' ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
