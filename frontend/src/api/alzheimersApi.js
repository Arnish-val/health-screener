import client from './client';

/**
 * Send cognitive scores and optional raw scan file for Alzheimer's risk prediction.
 * @param {FormData} formData - cognitive_scores JSON plus optional scan_file
 * @returns {Promise<Object>} API response with combined risk data
 */
export const predictAlzheimers = (formData) =>
  client.post('/predict/alzheimers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
  });

