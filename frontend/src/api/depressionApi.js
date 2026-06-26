import client from './client';

/**
 * Send demographic/lifestyle metrics and receive depression risk profile.
 * @param {Object} metrics - DepressionInput fields
 * @returns {Promise<Object>} API response with risk data
 */
export const predictDepression = (metrics) =>
  client.post('/predict/depression', metrics);

export const predictDepressionStudent = (metrics) =>
  client.post('/predict/depression/student', metrics);

export const predictDepressionProfessional = (metrics) =>
  client.post('/predict/depression/professional', metrics);
