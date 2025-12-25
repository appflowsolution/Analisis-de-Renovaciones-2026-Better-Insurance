import React, { useState, useMemo } from 'react';
import { Users, UserCheck, UserMinus, ArrowRightLeft, AlertTriangle, Search, TrendingUp, TrendingDown, LayoutDashboard, ClipboardList, ChevronRight, Target, Medal, DollarSign, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import logo from './assets/logo.jpg';
import { DATA_2025, DATA_2026 } from './data';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const mergedData = useMemo(() => {
    return DATA_2025.map(p25 => {
      const p26 = DATA_2026.find(p => p['ID-BI'] === p25['ID-BI']);
      return {
        ...p25,
        compania2026: p26 ? p26.COMPANIA : 'No Renovó',
        miembros2026: p26 ? p26.MIEMBROS : 0,
        comision2026: p26 ? p26.COMISION : 0,
        renovado: !!p26,
        diffMiembros: p26 ? p26.MIEMBROS - p25.MIEMBROS : 0
      };
    });
  }, []);

  const stats = useMemo(() => {
    const total2025 = DATA_2025.length;
    const miembros2025 = DATA_2025.reduce((acc, curr) => acc + curr.MIEMBROS, 0);
    const comision2025 = DATA_2025.reduce((acc, curr) => acc + curr.COMISION, 0);
    const renovadas = mergedData.filter(d => d.renovado).length;
    const noRenovadas = total2025 - renovadas;
    const polizas2026 = DATA_2026.length;
    const miembros2026 = DATA_2026.reduce((acc, curr) => acc + curr.MIEMBROS, 0);
    const comision2026 = DATA_2026.reduce((acc, curr) => acc + curr.COMISION, 0);
    return { total2025, miembros2025, comision2025, renovadas, noRenovadas, miembros2026, polizas2026, comision2026 };
  }, [mergedData]);

  const StatCard = ({ icon: Icon, title, value, subtitle, colorClass }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow ${colorClass}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Better Insurance" className="h-12 object-contain" />
              <div className="border-l border-slate-300 pl-4">
                <h1 className="text-xl font-bold text-slate-800">Análisis de Renovaciones</h1>
                <p className="text-xs text-slate-500 font-medium">Período 2025-2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-xl shadow-sm border border-slate-200">
          {[
            { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
            { id: 'migracion', label: 'Migración', icon: ArrowRightLeft },
            { id: 'registros', label: 'Registros', icon: ClipboardList }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                ? 'bg-bi-primary text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={Users} title="Base 2025" value={stats.total2025} subtitle={`${stats.miembros2025} miembros`} colorClass="bg-bi-secondary" />
              <StatCard icon={UserCheck} title="Renovadas" value={stats.renovadas} subtitle={`${Math.round((stats.renovadas / stats.total2025) * 100)}% retención`} colorClass="bg-emerald-500" />
              <StatCard icon={UserMinus} title="Pérdidas" value={stats.noRenovadas} subtitle={`${Math.round((stats.noRenovadas / stats.total2025) * 100)}% churn`} colorClass="bg-rose-500" />
              <StatCard icon={TrendingUp} title="Base 2026" value={stats.polizas2026} subtitle={`${stats.miembros2026} miembros`} colorClass="bg-bi-primary" />
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <DollarSign className="text-bi-primary" size={28} />
                Análisis Financiero
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Comisión 2025</p>
                  <p className="text-3xl font-bold text-slate-800">${stats.comision2025.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-bi-light/20 rounded-xl border-2 border-bi-primary">
                  <p className="text-xs font-bold text-bi-primary uppercase mb-2">Proyección 2026</p>
                  <p className="text-3xl font-bold text-bi-secondary">${stats.comision2026.toLocaleString()}</p>
                </div>
                <div className={`p-6 rounded-xl ${stats.comision2026 >= stats.comision2025 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Variación</p>
                  <div className="flex items-center gap-2">
                    {stats.comision2026 >= stats.comision2025 ? <ArrowUpRight className="text-emerald-600" size={24} /> : <TrendingDown className="text-rose-600" size={24} />}
                    <p className={`text-3xl font-bold ${stats.comision2026 >= stats.comision2025 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {Math.abs(Math.round(((stats.comision2026 - stats.comision2025) / stats.comision2025) * 100))}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'migracion' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <ArrowRightLeft className="text-bi-primary" size={28} />
                Matriz de Migración por Compañía
              </h3>
              <p className="text-sm text-slate-500">Flujo de pólizas entre compañías 2025 → 2026</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Origen (2025)</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Destino (2026)</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Pólizas</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Miembros</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {useMemo(() => {
                    const groups = {};
                    mergedData.forEach(item => {
                      const key = `${item.COMPANIA}|${item.compania2026}`;
                      if (!groups[key]) {
                        groups[key] = { origin: item.COMPANIA, dest: item.compania2026, pol: 0, miem: 0 };
                      }
                      groups[key].pol += 1;
                      groups[key].miem += item.renovado ? item.miembros2026 : item.MIEMBROS;
                    });
                    return Object.values(groups).sort((a, b) => {
                      if (a.origin !== b.origin) return a.origin.localeCompare(b.origin);
                      if (a.dest === 'No Renovó') return -1;
                      return a.dest.localeCompare(b.dest);
                    });
                  }, [mergedData]).map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">{m.origin}</td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center gap-2 text-sm font-bold ${m.dest === 'No Renovó' ? 'text-rose-600' : 'text-bi-primary'}`}>
                          {m.dest === 'No Renovó' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                          {m.dest}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-lg font-bold text-slate-800">{m.pol}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-600">{m.miem}</td>
                      <td className="px-6 py-4 text-center">
                        {m.origin === m.dest ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase rounded-lg border border-emerald-200">Fidelizado</span>
                        ) : m.dest === 'No Renovó' ? (
                          <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold uppercase rounded-lg border border-rose-200">Baja</span>
                        ) : (
                          <span className="px-3 py-1 bg-bi-light/30 text-bi-secondary text-xs font-bold uppercase rounded-lg border border-bi-primary/20">Migrado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {activeTab === 'registros' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o ID..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bi-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Titular</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">2025</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">2026</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mergedData
                    .filter(item =>
                      item.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.APELLIDOS.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item['ID-BI'].toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-xs font-mono text-bi-primary">{item['ID-BI']}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">{item.NOMBRE} {item.APELLIDOS}</p>
                          <p className="text-xs text-slate-500">{item.CAPTADOR}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">{item.COMPANIA}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg ${item.renovado ? 'bg-bi-light/30 text-bi-secondary' : 'bg-rose-100 text-rose-700'}`}>
                            {item.compania2026}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;