import client from './client';

export const historyApi = {
  getHistory: async () => {
    const data = await client.get('/api/v1/history/');
    return data;
  }
};
