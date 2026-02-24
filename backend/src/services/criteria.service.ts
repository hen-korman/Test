import { HiBobEmployee, CriteriaGroup, Criterion, MatchedEmployee } from '../types';

export class CriteriaService {
  matchEmployees(employees: HiBobEmployee[], criteriaGroup: CriteriaGroup): MatchedEmployee[] {
    const matched = employees.filter((emp) => this.evaluateCriteriaGroup(emp, criteriaGroup));
    return matched.map((emp) => this.toMatchedEmployee(emp));
  }

  private evaluateCriteriaGroup(employee: HiBobEmployee, group: CriteriaGroup): boolean {
    if (group.criteria.length === 0) return true;

    if (group.logic === 'AND') {
      return group.criteria.every((c) => this.evaluateCriterion(employee, c));
    }
    return group.criteria.some((c) => this.evaluateCriterion(employee, c));
  }

  private evaluateCriterion(employee: HiBobEmployee, criterion: Criterion): boolean {
    const fieldValue = this.getFieldValue(employee, criterion.fieldId);
    const normalizedFieldValue = String(fieldValue ?? '').toLowerCase().trim();
    const criterionValue = Array.isArray(criterion.value)
      ? criterion.value.map((v) => v.toLowerCase().trim())
      : criterion.value.toLowerCase().trim();

    switch (criterion.operator) {
      case 'equals':
        return normalizedFieldValue === criterionValue;

      case 'not_equals':
        return normalizedFieldValue !== criterionValue;

      case 'contains':
        return normalizedFieldValue.includes(criterionValue as string);

      case 'not_contains':
        return !normalizedFieldValue.includes(criterionValue as string);

      case 'starts_with':
        return normalizedFieldValue.startsWith(criterionValue as string);

      case 'ends_with':
        return normalizedFieldValue.endsWith(criterionValue as string);

      case 'in':
        return Array.isArray(criterionValue) && criterionValue.includes(normalizedFieldValue);

      case 'not_in':
        return Array.isArray(criterionValue) && !criterionValue.includes(normalizedFieldValue);

      case 'is_empty':
        return normalizedFieldValue === '';

      case 'is_not_empty':
        return normalizedFieldValue !== '';

      default:
        return false;
    }
  }

  private getFieldValue(employee: HiBobEmployee, fieldId: string): unknown {
    const pathMap: Record<string, (emp: HiBobEmployee) => unknown> = {
      'work.department': (e) => e.work?.department,
      'work.title': (e) => e.work?.title,
      'work.site': (e) => e.work?.site,
      'work.team': (e) => e.work?.team,
      'root.displayName': (e) => e.displayName,
      'root.firstName': (e) => e.firstName,
      'root.surname': (e) => e.surname,
      'root.email': (e) => e.email,
    };

    if (pathMap[fieldId]) {
      return pathMap[fieldId](employee);
    }

    // Fallback: traverse by dot notation
    const parts = fieldId.replace('root.', '').split('.');
    let current: any = employee;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }

  private toMatchedEmployee(emp: HiBobEmployee): MatchedEmployee {
    return {
      id: emp.id,
      displayName: emp.displayName,
      email: emp.email,
      department: emp.work?.department,
      title: emp.work?.title,
      site: emp.work?.site,
      slackId: emp.about?.socialData?.slack || emp.personal?.communication?.slackUsername,
      slackUsername: emp.about?.socialData?.slack,
    };
  }
}
