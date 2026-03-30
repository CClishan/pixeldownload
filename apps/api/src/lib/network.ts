import { Agent, fetch } from 'undici';

const dispatcher = new Agent({
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 10_000,
  connections: 50
});

export const request = (input: string | URL, init?: RequestInit) =>
  fetch(input, {
    ...init,
    dispatcher
  });
