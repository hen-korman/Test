import axios, { AxiosInstance } from 'axios';
import { HiBobEmployee, HiBobField } from '../types';
import { logger } from '../middleware/logger';

export class HiBobService {
  private client: AxiosInstance;

  constructor() {
    const apiUrl = process.env.HIBOB_API_URL || 'https://api.hibob.com/v1';
    const userId = process.env.HIBOB_SERVICE_USER_ID;
    const token = process.env.HIBOB_SERVICE_USER_TOKEN;

    if (!userId || !token) {
      logger.warn('HiBob credentials not configured - using mock data mode');
    }

    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        Authorization: `Basic ${Buffer.from(`${userId}:${token}`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  async getEmployees(): Promise<HiBobEmployee[]> {
    try {
      const response = await this.client.post('/people/search', {
        fields: [
          'root.id',
          'root.displayName',
          'root.firstName',
          'root.surname',
          'root.email',
          'work.department',
          'work.title',
          'work.site',
          'work.siteId',
          'work.reportsTo',
          'work.team',
          'about.socialData.slack',
        ],
        filters: [
          {
            fieldPath: 'root.status',
            operator: 'equals',
            values: ['Active'],
          },
        ],
      });

      return response.data.employees || [];
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.error('HiBob authentication failed - check credentials');
        throw new Error('HiBob authentication failed. Please check your API credentials.');
      }
      logger.error('Failed to fetch employees from HiBob', { error: error.message });
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
  }

  async getCompanyFields(): Promise<HiBobField[]> {
    try {
      const response = await this.client.get('/company/people/fields');
      const rawFields = response.data || [];

      return this.normalizeFields(rawFields);
    } catch (error: any) {
      logger.error('Failed to fetch company fields from HiBob', { error: error.message });
      throw new Error(`Failed to fetch fields: ${error.message}`);
    }
  }

  async getFieldListValues(listId: string): Promise<Array<{ id: string | number; value: string }>> {
    try {
      const response = await this.client.get(`/company/named-lists/${listId}`);
      return (response.data?.values || []).map((v: any) => ({
        id: v.id,
        value: v.name || v.value,
      }));
    } catch (error: any) {
      logger.error(`Failed to fetch list values for ${listId}`, { error: error.message });
      return [];
    }
  }

  private normalizeFields(rawFields: any[]): HiBobField[] {
    const fields: HiBobField[] = [];

    for (const field of rawFields) {
      if (field.children) {
        for (const child of field.children) {
          fields.push({
            id: child.id || `${field.id}.${child.name}`,
            name: child.name || child.id,
            category: field.name || field.id,
            type: child.type || 'text',
            description: child.description,
            jsonPath: child.jsonPath || `${field.id}.${child.id || child.name}`,
          });
        }
      } else {
        fields.push({
          id: field.id,
          name: field.name || field.id,
          category: field.category || 'General',
          type: field.type || 'text',
          description: field.description,
          jsonPath: field.jsonPath || field.id,
        });
      }
    }

    return fields;
  }
}

export function getMockEmployees(): HiBobEmployee[] {
  return [
    {
      id: 'emp-001',
      displayName: 'Sarah Cohen',
      firstName: 'Sarah',
      surname: 'Cohen',
      email: 'sarah.cohen@company.com',
      work: { department: 'Engineering', title: 'Senior Developer', site: 'Tel Aviv', team: 'Backend' },
      about: { socialData: { slack: 'U01SARAH' } },
    },
    {
      id: 'emp-002',
      displayName: 'David Levi',
      firstName: 'David',
      surname: 'Levi',
      email: 'david.levi@company.com',
      work: { department: 'Engineering', title: 'Frontend Developer', site: 'Tel Aviv', team: 'Frontend' },
      about: { socialData: { slack: 'U02DAVID' } },
    },
    {
      id: 'emp-003',
      displayName: 'Maya Goldberg',
      firstName: 'Maya',
      surname: 'Goldberg',
      email: 'maya.goldberg@company.com',
      work: { department: 'Product', title: 'Product Manager', site: 'New York', team: 'Core Product' },
      about: { socialData: { slack: 'U03MAYA' } },
    },
    {
      id: 'emp-004',
      displayName: 'Amit Shapira',
      firstName: 'Amit',
      surname: 'Shapira',
      email: 'amit.shapira@company.com',
      work: { department: 'Engineering', title: 'DevOps Engineer', site: 'Tel Aviv', team: 'Infrastructure' },
      about: { socialData: { slack: 'U04AMIT' } },
    },
    {
      id: 'emp-005',
      displayName: 'Noa Friedman',
      firstName: 'Noa',
      surname: 'Friedman',
      email: 'noa.friedman@company.com',
      work: { department: 'Design', title: 'UX Designer', site: 'London', team: 'Design' },
      about: { socialData: { slack: 'U05NOA' } },
    },
    {
      id: 'emp-006',
      displayName: 'Yossi Katz',
      firstName: 'Yossi',
      surname: 'Katz',
      email: 'yossi.katz@company.com',
      work: { department: 'Engineering', title: 'Tech Lead', site: 'Tel Aviv', team: 'Backend' },
      about: { socialData: { slack: 'U06YOSSI' } },
    },
    {
      id: 'emp-007',
      displayName: 'Rachel Green',
      firstName: 'Rachel',
      surname: 'Green',
      email: 'rachel.green@company.com',
      work: { department: 'HR', title: 'HR Manager', site: 'New York', team: 'People' },
      about: { socialData: { slack: 'U07RACHEL' } },
    },
    {
      id: 'emp-008',
      displayName: 'Omer Stern',
      firstName: 'Omer',
      surname: 'Stern',
      email: 'omer.stern@company.com',
      work: { department: 'Marketing', title: 'Marketing Lead', site: 'London', team: 'Growth' },
      about: { socialData: { slack: 'U08OMER' } },
    },
    {
      id: 'emp-009',
      displayName: 'Tamar Ben-David',
      firstName: 'Tamar',
      surname: 'Ben-David',
      email: 'tamar.bendavid@company.com',
      work: { department: 'Engineering', title: 'QA Engineer', site: 'Tel Aviv', team: 'Quality' },
      about: { socialData: { slack: 'U09TAMAR' } },
    },
    {
      id: 'emp-010',
      displayName: 'Daniel Rosenberg',
      firstName: 'Daniel',
      surname: 'Rosenberg',
      email: 'daniel.rosenberg@company.com',
      work: { department: 'Sales', title: 'Account Executive', site: 'New York', team: 'Enterprise Sales' },
      about: { socialData: { slack: 'U10DANIEL' } },
    },
    {
      id: 'emp-011',
      displayName: 'Shira Mizrahi',
      firstName: 'Shira',
      surname: 'Mizrahi',
      email: 'shira.mizrahi@company.com',
      work: { department: 'Product', title: 'Product Designer', site: 'Tel Aviv', team: 'Core Product' },
      about: { socialData: { slack: 'U11SHIRA' } },
    },
    {
      id: 'emp-012',
      displayName: 'Eyal Barak',
      firstName: 'Eyal',
      surname: 'Barak',
      email: 'eyal.barak@company.com',
      work: { department: 'Engineering', title: 'Full Stack Developer', site: 'London', team: 'Frontend' },
      about: { socialData: { slack: 'U12EYAL' } },
    },
  ];
}

export function getMockFields(): HiBobField[] {
  return [
    { id: 'work.department', name: 'Department', category: 'Work', type: 'list', jsonPath: 'work.department', values: [
      { id: 1, value: 'Engineering' }, { id: 2, value: 'Product' }, { id: 3, value: 'Design' },
      { id: 4, value: 'HR' }, { id: 5, value: 'Marketing' }, { id: 6, value: 'Sales' },
    ]},
    { id: 'work.title', name: 'Job Title', category: 'Work', type: 'text', jsonPath: 'work.title' },
    { id: 'work.site', name: 'Site / Office', category: 'Work', type: 'list', jsonPath: 'work.site', values: [
      { id: 1, value: 'Tel Aviv' }, { id: 2, value: 'New York' }, { id: 3, value: 'London' },
    ]},
    { id: 'work.team', name: 'Team', category: 'Work', type: 'list', jsonPath: 'work.team', values: [
      { id: 1, value: 'Backend' }, { id: 2, value: 'Frontend' }, { id: 3, value: 'Core Product' },
      { id: 4, value: 'Infrastructure' }, { id: 5, value: 'Design' }, { id: 6, value: 'People' },
      { id: 7, value: 'Growth' }, { id: 8, value: 'Quality' }, { id: 9, value: 'Enterprise Sales' },
    ]},
    { id: 'root.displayName', name: 'Full Name', category: 'Basic Info', type: 'text', jsonPath: 'displayName' },
    { id: 'root.firstName', name: 'First Name', category: 'Basic Info', type: 'text', jsonPath: 'firstName' },
    { id: 'root.surname', name: 'Last Name', category: 'Basic Info', type: 'text', jsonPath: 'surname' },
    { id: 'root.email', name: 'Email', category: 'Basic Info', type: 'text', jsonPath: 'email' },
  ];
}
