import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify"; // Notificações bonitas

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast.error("As senhas não conferem!");
    }

    if (password.length < 6) {
      return toast.warning("A senha precisa ter pelo menos 6 caracteres.");
    }

    try {
      setLoading(true);
      await signup(email, password);
      toast.success("Conta criada com sucesso! Bem-vindo(a).");
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error("Este email já está cadastrado.");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Crie sua conta</h1>
          <p className="text-gray-500 mt-2">Comece a organizar suas finanças</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              value={email} onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              type="password" required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)} 
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
            <input 
              type="password" required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Repita a senha"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
          >
            {loading ? "Criando..." : "Cadastrar"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Faça Login
          </Link>
        </div>
      </div>
    </div>
  );
}