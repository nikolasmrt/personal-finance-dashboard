import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, where } from "firebase/firestore";
import { LogOut, Plus, Trash2, Wallet, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import SummaryCard from "../components/SummaryCard";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ description: "", amount: "", type: "expense", category: "outros" });

  useEffect(() => {
    // SEGURANÇA: Só busca dados se tiver um usuário logado
    if (!user) return;

    // CONSULTA: Filtra onde 'uid' é igual ao ID do usuário logado
    const q = query(
      collection(db, "transactions"), 
      where("uid", "==", user.uid), // <--- O FILTRO MÁGICO
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    }, (error) => {
      console.error("Erro ao buscar dados:", error);
    });

    return unsubscribe;
  }, [user]); // <--- Recarrega se o usuário mudar

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  async function handleAdd(e) {
    e.preventDefault();
    if(!form.description || !form.amount) return;

    // SALVAR: Adicionamos o uid para saber de quem é essa conta
    await addDoc(collection(db, "transactions"), {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date().toISOString(),
      createdAt: new Date(),
      uid: user.uid, // <--- VINCULA AO USUÁRIO
      userEmail: user.email
    });
    setForm({ description: "", amount: "", type: "expense", category: "outros" });
  }

  async function handleDelete(id) {
    if (confirm("Tem certeza que deseja apagar?")) {
      await deleteDoc(doc(db, "transactions", id));
    }
  }

  const chartData = {
    labels: ['Receitas', 'Despesas'],
    datasets: [{
      data: [income, expense],
      backgroundColor: ['#10b981', '#ef4444'],
      hoverOffset: 4
    }]
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-10">
      <header className="bg-indigo-700 text-white py-4 shadow-lg mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Wallet size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">FinanceTracker</h1>
              <p className="text-indigo-200 text-xs">Olá, {user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm bg-indigo-800 hover:bg-indigo-900 px-4 py-2 rounded-lg transition">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard title="Entradas" value={income} color="bg-emerald-500" icon={<TrendingUp className="text-emerald-100" />} />
          <SummaryCard title="Saídas" value={expense} color="bg-rose-500" icon={<TrendingDown className="text-rose-100" />} />
          <SummaryCard title="Saldo Atual" value={balance} color="bg-blue-600" icon={<Wallet className="text-blue-100" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Plus size={18} /></div>
                Nova Transação
              </h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition shadow-sm"
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                  >
                    <option value="expense">Saída 🔴</option>
                    <option value="income">Entrada 🟢</option>
                  </select>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 font-semibold">R$</span>
                    <input 
                      type="number" 
                      placeholder="0,00" 
                      className="w-full pl-10 p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold shadow-sm"
                      value={form.amount}
                      onChange={e => setForm({...form, amount: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="Descrição (ex: Mercado)" 
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  required
                />
                <select 
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                  >
                    <option value="outros">📦 Categoria: Outros</option>
                    <option value="alimentacao">🍽️ Alimentação</option>
                    <option value="moradia">🏠 Moradia</option>
                    <option value="transporte">🚗 Transporte</option>
                    <option value="lazer">🎮 Lazer</option>
                    <option value="educacao">📚 Educação</option>
                    <option value="saude">🏥 Saúde</option>
                </select>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-200 transform active:scale-95">
                  Adicionar
                </button>
              </form>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-full text-purple-600"><PieChart size={18} /></div>
                Visão Geral
              </h3>
               <div className="h-48 flex items-center justify-center">
                  {transactions.length > 0 ? (
                    <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                  ) : (
                    <p className="text-gray-400 text-sm">Adicione dados para ver o gráfico</p>
                  )}
               </div>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg">Histórico de Movimentações</h2>
                <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">{transactions.length} registros</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Wallet size={64} className="text-gray-300 mb-4"/>
                    <p className="text-gray-500">Nenhuma movimentação ainda.</p>
                  </div>
                ) : (
                  transactions.map(t => (
                    <div key={t.id} className="p-4 hover:bg-indigo-50/30 transition flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          t.category === 'alimentacao' ? 'bg-orange-100' : 
                          t.category === 'transporte' ? 'bg-blue-100' : 
                          t.category === 'lazer' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          {t.category === 'alimentacao' ? '🍽️' : 
                           t.category === 'transporte' ? '🚗' : 
                           t.category === 'moradia' ? '🏠' :
                           t.category === 'lazer' ? '🎮' : '📦'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span className="capitalize">{t.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                        </span>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}