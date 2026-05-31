import client from './client';

/**
 * Send symptom data and receive top-3 disease predictions.
 * @param {Object} symptoms - Dictionary of { symptom_name: 0 | 1 }
 * @returns {Promise<Object>} API response with prediction data
 */
export const predictDisease = (symptoms) =>
  client.post('/predict/disease', { symptoms });
