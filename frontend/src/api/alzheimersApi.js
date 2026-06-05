import client from './client';

/**
 * Send cognitive scores and optional fMRI features for Alzheimer's risk prediction.
 * @param {Object} payload - { cognitive_scores: {...}, fmri_features?: number[] }
 * @returns {Promise<Object>} API response with combined risk data
 */
export const predictAlzheimers = (payload) =>
  client.post('/predict/alzheimers', payload);
