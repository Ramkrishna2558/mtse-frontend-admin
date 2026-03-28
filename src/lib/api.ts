import { createApiClient, createApiService } from 'mtse-shared/api';
import { env } from '../config/env';

const client = createApiClient({
  baseURL: env.apiUrl,
  timeout: 15_000,
});

export const api = createApiService(client);
export { client as axiosClient };
