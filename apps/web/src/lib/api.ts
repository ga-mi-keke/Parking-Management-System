import { env } from '$env/dynamic/public';

const configuredBase = env.PUBLIC_API_URL;

export const API_BASE =
  configuredBase && configuredBase.trim().length > 0
    ? configuredBase
    : 'http://localhost:3000';

export const spotsEndpoint = `${API_BASE}/spots`;
