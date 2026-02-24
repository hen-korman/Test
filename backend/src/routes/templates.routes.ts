import { Router, Request, Response } from 'express';
import { TemplateService } from '../services/template.service';

const router = Router();
const templateService = new TemplateService();

router.get('/', (_req: Request, res: Response) => {
  const templates = templateService.getAll();
  res.json({ success: true, data: templates });
});

router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const template = templateService.getById(id);
  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  res.json({ success: true, data: template });
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, criteriaGroup } = req.body;
    if (!name || !criteriaGroup) {
      return res.status(400).json({ success: false, error: 'name and criteriaGroup are required' });
    }
    const template = templateService.create(name, description || '', criteriaGroup);
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const template = templateService.update(id, req.body);
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(error.message === 'Template not found' ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    templateService.delete(id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    res.status(error.message === 'Template not found' ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
