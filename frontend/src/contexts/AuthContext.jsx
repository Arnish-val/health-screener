import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Initialize user synchronously from localStorage to avoid
    // calling setState inside useEffect (react-hooks/set-state-in-effect).
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          return null;
        }
        return {
          email: decoded.sub,
          name: decoded.name || null,
          pictureUrl: decoded.picture_url || null
        };
      } catch {
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  });

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser({
      email: decoded.sub,
      name: decoded.name || null,
      pictureUrl: decoded.picture_url || null
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}
