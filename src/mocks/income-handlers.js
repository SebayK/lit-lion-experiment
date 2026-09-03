import { http, HttpResponse } from 'msw';

export const incomeHandlers = [
  http.post('/api/income', async ({ request }) => {
    const body = await request.json();
    console.log('️ [MSW Mock] POST /api/income received:', body);

    // Symulacja opóźnienia sieciowego (400ms) dla lepszego odczucia UI
    await new Promise((resolve) => setTimeout(resolve, 400));

    const savedIncome = {
      id: body.id || `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    console.log(' [MSW Mock] Returning saved income:', savedIncome);

    return HttpResponse.json(savedIncome, { status: 201 });
  }),
];

export const handlers = [
  ...incomeHandlers,
];
