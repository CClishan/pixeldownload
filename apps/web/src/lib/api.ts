import {
  apiErrorSchema,
  archiveRequestSchema,
  healthResponseSchema,
  resolveRequestSchema,
  resolveResponseSchema,
  type ArchiveRequest,
  type HealthResponse,
  type ResolveRequest,
  type ResolveResponse
} from '@pixel/contracts';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const parseError = async (response: Response) => {
  try {
    const payload = apiErrorSchema.parse(await response.json());
    return payload.message;
  } catch {
    return `Request failed with ${response.status}.`;
  }
};

export const getApiBaseUrl = () => apiBaseUrl;

export const getHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${apiBaseUrl}/v1/health`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return healthResponseSchema.parse(await response.json());
};

export const resolveLink = async (payload: ResolveRequest): Promise<ResolveResponse> => {
  const body = resolveRequestSchema.parse(payload);
  const response = await fetch(`${apiBaseUrl}/v1/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return resolveResponseSchema.parse(await response.json());
};

export const downloadArchive = async (payload: ArchiveRequest) => {
  const body = archiveRequestSchema.parse(payload);
  const response = await fetch(`${apiBaseUrl}/v1/archive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.blob();
};

export const buildFileDownloadUrl = (token: string) => `${apiBaseUrl}/v1/file/${token}`;
