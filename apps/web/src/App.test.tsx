import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const fetchMock = vi.fn(async () =>
  new Response(
    JSON.stringify({
      status: 'ok',
      providers: {
        cobalt: { status: 'ok' },
        threads: { status: 'ok' }
      },
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
);

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockClear();
});

describe('App', () => {
  it('adds deduplicated links to the queue', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textbox = screen.getByPlaceholderText(/instagram\.com/i);
    await user.type(textbox, 'https://www.instagram.com/p/demo/\nhttps://www.instagram.com/p/demo/');
    await user.click(screen.getByRole('button', { name: /添加队列/i }));

    expect(screen.getAllByText('1 ITEMS')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /instagram\.com\/p\/demo/i })).toBeInTheDocument();
  });
});
