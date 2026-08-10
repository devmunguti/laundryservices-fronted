import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function Authcleaners({ children }) {
  const [user, setUser] = useState(null);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.cleaners value={{ user, login, logout }}>
      {children}
    </AuthContext.cleaners>
  );
}

export const useAuth = () => useContext(AuthContext);
