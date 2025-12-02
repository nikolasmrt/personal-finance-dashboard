import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword // <--- Importamos isso
} from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função de Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Função de Registro (NOVA)
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Função de Sair
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);