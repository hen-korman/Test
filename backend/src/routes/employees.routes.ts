import { Router, Request, Response } from 'express';
import { HiBobService, getMockEmployees, getMockFields } from '../services/hibob.service';
import { CriteriaService } from '../services/criteria.service';
import { CriteriaGroup } from '../types';

const router = Router();
const hibobService = new HiBobService();
const criteriaService = new CriteriaService();

const useMock = !process.env.HIBOB_SERVICE_USER_ID || !process.env.HIBOB_SERVICE_USER_TOKEN;

router.get('/fields', async (_req: Request, res: Response) => {
  try {
    if (useMock) {
      return res.json({ success: true, data: getMockFields() });
    }
    const fields = await hibobService.getCompanyFields();
    res.json({ success: true, data: fields });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    if (useMock) {
      const employees = getMockEmployees();
      return res.json({ success: true, data: employees, count: employees.length });
    }
    const employees = await hibobService.getEmployees();
    res.json({ success: true, data: employees, count: employees.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/match', async (req: Request, res: Response) => {
  try {
    const criteriaGroup: CriteriaGroup = req.body.criteriaGroup;
    if (!criteriaGroup) {
      return res.status(400).json({ success: false, error: 'criteriaGroup is required' });
    }

    const employees = useMock ? getMockEmployees() : await hibobService.getEmployees();
    const matched = criteriaService.matchEmployees(employees, criteriaGroup);

    res.json({
      success: true,
      data: matched,
      count: matched.length,
      totalEmployees: employees.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
