import { Income } from '../types.js';

/**
 * Saves income data to the backend API via POST /api/income.
 */
export async function saveIncomeApi(income: Income): Promise<Income> {
  const response = await fetch('/api/income', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(income),
  });

  if (!response.ok) {
    throw new Error(`Failed to save income: ${response.statusText} (${response.status})`);
  }

  return response.json();
}
