import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { LogOut, Plus, Trash2, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ description: "", amount: "", type: "expense", category: "outros" });

  // Escuta o banco de dados em Tempo Real
  useEffect(() => {
    // DICA SENIOR: Para compartilhar com a mãe, removemos o filtro de 'userId'.
    // Assim, todos que tiverem login verão os mesmos dados (Família).
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });

    return unsubscribe;
  }, []);

  // Cálculos
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  // Adicionar Transação
  async function handleAdd(e) {
    e.preventDefault();
    if(!form.description || !form.amount) return;

    await addDoc(collection(db, "transactions"), {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date().toISOString(),
      createdAt: new Date(),
      userEmail: user.email // Apenas para registro de quem criou
    });
    setForm({ description: "", amount: "", type: "expense", category: "outros" });
  }

  // Deletar Transação
  async function handleDelete(id) {
    if (confirm("Tem certeza que deseja apagar?")) {
      await deleteDoc(doc(db, "transactions", id));
    }
  }

  // Dados do Gráfico
  const chartData = {
    labels: ['Receitas', 'Despesas'],
    datasets: [{
      data: [income, expense],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 0
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FinanceTracker</h1>
              <p className="text-indigo-100 text-xs">Família Conectada</p>
            </div>
          </div>
          <button onClick={logout} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition flex items-center gap-2 text-sm">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard title="Entradas" value={income} color="bg-green-500" icon={<TrendingUp />} />
          <SummaryCard title="Saídas" value={expense} color="bg-red-500" icon={<TrendingDown />} />
          <SummaryCard title="Saldo Total" value={balance} color="bg-blue-600" icon={<Wallet />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Formulário + Gráfico */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                <Plus size={20} className="text-indigo-600"/> Nova Movimentação
              </h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    className="p-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-indigo-500"
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                  <input 
                    type="number" 
                    placeholder="R$ 0,00" 
                    className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    required
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Descrição (ex: Mercado)" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  required
                />
                <select 
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-indigo-500"
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                  >
                    <option value="alimentacao">🍽️ Alimentação</option>
                    <option value="moradia">🏠 Moradia</option>
                    <option value="transporte">🚗 Transporte</option>
                    <option value="lazer">🎮 Lazer</option>
                    <option value="educacao">📚 Educação</option>
                    <option value="outros">📦 Outros</option>
                </select>
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md">
                  Adicionar
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex justify-center items-center min-h-[250px]">
                 <div className="w-48">
                    <Doughnut data={chartData} options={{ plugins: { legend: { display: false } } }} />
                 </div>
            </div>
          </div>

          {/* Coluna Direita: Lista de Histórico */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">Histórico Recente</h2>
            </div>
            <div className="overflow-y-auto max-h-[600px] p-4 space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Nenhuma movimentação ainda.</p>
                </div>
              ) : (
                transactions.map(t => (
                  <div key={t.id} className="group flex justify-between items-center p-4 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-100`}>
                        {t.category === 'alimentacao' ? '🍽️' : 
                         t.category === 'transporte' ? '🚗' : '📦'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{t.description}</h4>
                        <p className="text-xs text-gray-500">
                          {new Date(t.date).toLocaleDateString()} • {t.userEmail?.split('@')[0]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </span>
                      <button 
                        onClick={() => handleDelete(t.id)} 
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, color, icon }) {
  return (
    <div className={`${color} rounded-xl p-6 text-white shadow-lg relative overflow-hidden`}>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <p className="text-white/90 text-sm font-medium">{title}</p>
          <div className="bg-white/20 p-2 rounded-lg">{icon}</div>
        </div>
        <p className="text-3xl font-bold">R$ {value.toFixed(2)}</p>
      </div>
      {/* Efeito de fundo */}
      <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
        <Wallet size={100} />
      </div>
    </div>
  )
}