import client from './client';

export const authApi = {
  login: async (email, password) => {
    // OAuth2 password flow expects form data
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const data = await client.post('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return data;
  },

  register: async (email, password) => {
    const data = await client.post('/api/v1/auth/register', {
      email,
      password
    });
    return data;
  }
};
