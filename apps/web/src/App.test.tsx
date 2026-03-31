import { render, screen, waitFor } from '@testing-library/react';
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
  window.localStorage.clear();
});

afterEach(() => {
  fetchMock.mockClear();
});

describe('App', () => {
  it('adds deduplicated links to the queue', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textbox = screen.getByRole('textbox');
    await user.type(textbox, 'https://www.instagram.com/p/demo/\nhttps://www.instagram.com/p/demo/');
    await user.click(screen.getByRole('button', { name: /添加队列/i }));

    expect(screen.getByText('1 ITEMS')).toBeInTheDocument();
    expect(screen.getByText('https://www.instagram.com/p/demo/')).toBeInTheDocument();
  });

  it('switches resolver target and warms render backup', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /备用 render|render backup/i }));
    await user.click(screen.getByRole('button', { name: /唤醒 render|wake render/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/cobalt/warm'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Cobalt-Target': 'render'
          })
        })
      );
    });

    expect(window.localStorage.getItem('pixel-cobalt-target')).toBe('render');
  });
});
