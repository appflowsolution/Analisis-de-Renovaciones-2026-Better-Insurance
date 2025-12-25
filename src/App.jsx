import React, { useState, useMemo, useEffect } from 'react';
import { Users, UserCheck, UserMinus, ArrowRightLeft, Search, TrendingUp, TrendingDown, LayoutDashboard, ClipboardList, DollarSign, ArrowUpRight, Target, X } from 'lucide-react';
import logo from './assets/logo.jpg';
import { loadData2025, loadData2026 } from './data';
import SankeyDiagram from './SankeyDiagram';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [migrationTab, setMigrationTab] = useState('detalle'); // 'detalle' or 'grafico'
  const [searchTerm, setSearchTerm] = useState('');
  const [DATA_2025, setData2025] = useState([]);
  const [DATA_2026, setData2026] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedSankeyCompanies, setSelectedSankeyCompanies] = useState([]); // Para filtro de Sankey
  const [sankeyFilterOpen, setSankeyFilterOpen] = useState(false); // Para dropdown de Sankey
  const [filterOpen, setFilterOpen] = useState(false);
  const [renewalFilter, setRenewalFilter] = useState('all'); // 'all', 'renewed', 'not-renewed', 'new'

  // Estado para el modal de detalles
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);

  // Función para abrir el modal con datos filtrados
  const openModal = (title, filterFn) => {
    const data = mergedData.filter(filterFn);
    setModalTitle(title);
    setModalData(data);
    setModalOpen(true);
  };

  // Cargar datos al iniciar
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [data2025, data2026] = await Promise.all([
        loadData2025(),
        loadData2026()
      ]);
      setData2025(data2025);
      setData2026(data2026);
      setLoading(false);
    }
    fetchData();
  }, []);

  const mergedData = useMemo(() => {
    if (DATA_2025.length === 0 && DATA_2026.length === 0) return [];

    // Primero, mapear todas las pólizas de 2025 con sus renovaciones
    const from2025 = DATA_2025.map(p25 => {
      const p26 = DATA_2026.find(p => p['ID-BI'] === p25['ID-BI']);
      return {
        ...p25,
        CAPTADOR_2025: p25.CAPTADOR, // Guardar captador original de 2025
        CAPTADOR: p26 ? p26.CAPTADOR : p25.CAPTADOR, // Usar captador de 2026 si existe
        ESTADO: p26 ? p26.ESTADO : null,
        NPN: p26 ? p26.NPN : null,
        compania2026: p26 ? p26.COMPANIA : 'No Renovó',
        miembros2026: p26 ? p26.MIEMBROS : 0,
        comision2026: p26 ? p26.COMISION : 0,
        renovado: !!p26,
        nuevo: false,
        diffMiembros: p26 ? p26.MIEMBROS - p25.MIEMBROS : 0,
        newRen: p26 ? p26.NEW_REN : null
      };
    });

    // Luego, agregar las pólizas NUEVAS de 2026 (que no existen en 2025)
    const nuevas2026 = DATA_2026
      .filter(p26 => !DATA_2025.find(p25 => p25['ID-BI'] === p26['ID-BI']))
      .map(p26 => ({
        'ID-BI': p26['ID-BI'],
        CAPTADOR: p26.CAPTADOR,
        NOMBRE: p26.NOMBRE,
        APELLIDOS: p26.APELLIDOS,
        ESTADO: p26.ESTADO,
        NPN: p26.NPN,
        MIEMBROS: 0, // No tenía miembros en 2025
        COMPANIA: 'Nueva Póliza', // No tenía compañía en 2025
        COMISION: 0, // No tenía comisión en 2025
        compania2026: p26.COMPANIA,
        miembros2026: p26.MIEMBROS,
        comision2026: p26.COMISION,
        renovado: false,
        nuevo: true, // Marca como nueva póliza
        diffMiembros: p26.MIEMBROS,
        newRen: p26.NEW_REN
      }));

    return [...from2025, ...nuevas2026];
  }, [DATA_2025, DATA_2026]);

  const stats = useMemo(() => {
    if (DATA_2025.length === 0) return { total2025: 0, miembros2025: 0, comision2025: 0, renovadas: 0, noRenovadas: 0, miembros2026: 0, polizas2026: 0, comision2026: 0 };

    const total2025 = DATA_2025.length;
    const miembros2025 = DATA_2025.reduce((acc, curr) => acc + curr.MIEMBROS, 0);
    const comision2025 = DATA_2025.reduce((acc, curr) => acc + curr.COMISION, 0);
    const renovadas = DATA_2026.filter(p => p.NEW_REN === 'Renewal').length;
    const noRenovadas = total2025 - renovadas;
    const polizas2026 = DATA_2026.length;
    const miembros2026 = DATA_2026.reduce((acc, curr) => acc + curr.MIEMBROS, 0);
    const comision2026 = DATA_2026.reduce((acc, curr) => acc + curr.COMISION, 0);
    return { total2025, miembros2025, comision2025, renovadas, noRenovadas, miembros2026, polizas2026, comision2026 };
  }, [DATA_2025, DATA_2026, mergedData]);

  const migrationMatrix = useMemo(() => {
    if (mergedData.length === 0) return [];

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
  }, [mergedData]);

  const captadorStats = useMemo(() => {
    if (mergedData.length === 0) return [];

    const captadores = {};
    mergedData.forEach(item => {
      // Usar CAPTADOR de 2026 para datos de 2026, CAPTADOR_2025 para datos de 2025
      const captador2026 = item.CAPTADOR;
      const captador2025 = item.CAPTADOR_2025 || item.CAPTADOR;

      // Inicializar captador de 2025 si no existe
      if (!captadores[captador2025]) {
        captadores[captador2025] = {
          nombre: captador2025,
          polizas2025: 0,
          miembros2025: 0,
          renovadas: 0,
          miembrosRenovados: 0,
          perdidas: 0,
          miembrosPerdidos: 0,
          nuevas: 0,
          miembrosNuevos: 0,
          polizas2026: 0,
          miembros2026: 0,
          comision2025: 0,
          comisionRenovadas: 0,
          comisionPerdidas: 0,
          comisionNuevas: 0,
          comision2026: 0
        };
      }

      // Inicializar captador de 2026 si es diferente y no existe
      if (captador2026 !== captador2025 && !captadores[captador2026]) {
        captadores[captador2026] = {
          nombre: captador2026,
          polizas2025: 0,
          miembros2025: 0,
          renovadas: 0,
          miembrosRenovados: 0,
          perdidas: 0,
          miembrosPerdidos: 0,
          nuevas: 0,
          miembrosNuevos: 0,
          polizas2026: 0,
          miembros2026: 0,
          comision2025: 0,
          comisionRenovadas: 0,
          comisionPerdidas: 0,
          comisionNuevas: 0,
          comision2026: 0
        };
      }

      // Contar en 2025 usando captador de 2025 - solo si existía en 2025
      if (item.MIEMBROS > 0 || item.COMISION > 0) {
        captadores[captador2025].polizas2025 += 1;
        captadores[captador2025].miembros2025 += item.MIEMBROS;
        captadores[captador2025].comision2025 += item.COMISION;
      }

      // Contar en 2026 usando captador de 2026
      if ((item.miembros2026 > 0 || item.compania2026) && item.compania2026 !== 'No Renovó') {
        captadores[captador2026].polizas2026 += 1;
        captadores[captador2026].miembros2026 += item.miembros2026;
        captadores[captador2026].comision2026 += item.comision2026;

        if (item.newRen === 'Renewal') {
          captadores[captador2026].renovadas += 1;
          captadores[captador2026].miembrosRenovados += item.miembros2026;
          captadores[captador2026].comisionRenovadas += item.comision2026;
        } else if (item.newRen === 'New') {
          captadores[captador2026].nuevas += 1;
          captadores[captador2026].miembrosNuevos += item.miembros2026;
          captadores[captador2026].comisionNuevas += item.comision2026;
        }
      } else {
        // Póliza perdida - usar captador de 2025
        captadores[captador2025].perdidas += 1;
        captadores[captador2025].miembrosPerdidos += item.MIEMBROS;
        captadores[captador2025].comisionPerdidas += item.COMISION;
      }
    });

    return Object.values(captadores).sort((a, b) => b.polizas2026 - a.polizas2026);
  }, [mergedData]);

  const StatCard = ({ icon: Icon, title, value, members, colorClass, badge, percentage }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="text-white" size={24} />
          </div>
          {badge && (
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{badge}</span>
          )}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-5xl font-black text-slate-900">{value}</h3>
        <p className="text-base font-bold text-slate-600">{title}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">{members} miembros</p>
        {percentage !== undefined && (
          <p className="text-sm text-slate-600 font-bold">{percentage}%</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-6">
            <img src={logo} alt="Better Insurance" className="h-20 object-contain" />
            <div className="border-l-2 border-teal-500 pl-6">
              <h1 className="text-3xl font-black text-slate-900 mb-1">Análisis de Renovaciones</h1>
              <p className="text-sm text-slate-600 font-semibold">Período 2025-2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-xl shadow-sm border border-slate-200">
          {[
            { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
            { id: 'migracion', label: 'Migración', icon: ArrowRightLeft },
            { id: 'registros', label: 'Registros', icon: ClipboardList },
            { id: 'inside2026', label: 'Inside 2026', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-slate-800 bg-white hover:bg-slate-100'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <StatCard icon={Users} title="pólizas" value={stats.total2025} members={stats.miembros2025} colorClass="bg-slate-700" badge="Base 2025" />
              <StatCard
                icon={UserCheck}
                title="renovadas"
                value={DATA_2026.filter(p => p.NEW_REN === 'Renewal').length}
                members={DATA_2026.filter(p => p.NEW_REN === 'Renewal').reduce((acc, curr) => acc + curr.MIEMBROS, 0)}
                colorClass="bg-emerald-500"
                percentage={stats.total2025 > 0 ? Math.round((DATA_2026.filter(p => p.NEW_REN === 'Renewal').length / stats.total2025) * 100) : 0}
              />
              <StatCard
                icon={UserMinus}
                title="no renovadas"
                value={stats.noRenovadas}
                members={mergedData.filter(d => !d.renovado && !d.nuevo).reduce((acc, curr) => acc + curr.MIEMBROS, 0)}
                colorClass="bg-rose-500"
                percentage={stats.total2025 > 0 ? Math.round((stats.noRenovadas / stats.total2025) * 100) : 0}
              />
              <StatCard icon={TrendingUp} title="nuevas" value={DATA_2026.filter(p => p.NEW_REN === 'New').length} members={DATA_2026.filter(p => p.NEW_REN === 'New').reduce((acc, curr) => acc + curr.MIEMBROS, 0)} colorClass="bg-blue-500" />
              <StatCard icon={TrendingUp} title="pólizas" value={stats.polizas2026} members={stats.miembros2026} colorClass="bg-teal-500" badge="Base 2026" />
            </div>

            {/* Análisis por Captador */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Target className="text-teal-500" size={28} />
                Análisis por Captador
              </h3>
              <div className="space-y-6">
                {captadorStats.map((captador, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">{captador.nombre}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-baseline justify-center gap-2 mb-1">
                          <p className="text-3xl font-black text-slate-900">{captador.polizas2025}</p>
                          <p className="text-sm font-bold text-slate-600">pólizas</p>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{captador.miembros2025} miembros</p>
                        <p className="text-xs text-slate-400 mt-1">Base 2025</p>
                      </div>
                      <div className="text-center p-4 bg-emerald-50 rounded-lg">
                        <div className="flex items-baseline justify-center gap-2 mb-1">
                          <p className="text-3xl font-black text-emerald-700">{captador.renovadas}</p>
                          <p className="text-sm font-bold text-emerald-600">renovadas</p>
                        </div>
                        <p className="text-xs text-emerald-600 font-medium">{captador.miembrosRenovados} miembros</p>
                        <p className="text-xs text-emerald-500 mt-1">{captador.polizas2025 > 0 ? Math.round((captador.renovadas / captador.polizas2025) * 100) : 0}% retención</p>
                      </div>
                      <div className="text-center p-4 bg-rose-50 rounded-lg">
                        <div className="flex items-baseline justify-center gap-2 mb-1">
                          <p className="text-3xl font-black text-rose-700">{captador.perdidas}</p>
                          <p className="text-sm font-bold text-rose-600">no renovadas</p>
                        </div>
                        <p className="text-xs text-rose-600 font-medium">{captador.miembrosPerdidos} miembros</p>
                        <p className="text-xs text-rose-500 mt-1">{captador.polizas2025 > 0 ? Math.round((captador.perdidas / captador.polizas2025) * 100) : 0}% pérdida</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-baseline justify-center gap-2 mb-1">
                          <p className="text-3xl font-black text-blue-700">{captador.nuevas}</p>
                          <p className="text-sm font-bold text-blue-600">nuevas</p>
                        </div>
                        <p className="text-xs text-blue-600 font-medium">{captador.miembrosNuevos} miembros</p>
                        <p className="text-xs text-blue-500 mt-1">Pólizas 2026</p>
                      </div>
                      <div className="text-center p-4 bg-teal-50 rounded-lg">
                        <div className="flex items-baseline justify-center gap-2 mb-1">
                          <p className="text-3xl font-black text-teal-700">{captador.polizas2026}</p>
                          <p className="text-sm font-bold text-teal-600">pólizas</p>
                        </div>
                        <p className="text-xs text-teal-600 font-medium">{captador.miembros2026} miembros</p>
                        <p className="text-xs text-teal-500 mt-1">Base 2026</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Análisis Financiero */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <DollarSign className="text-teal-500" size={28} />
                Análisis Financiero - Comisiones
              </h3>

              {/* KPIs de Comisión */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-slate-50 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="text-slate-700" size={20} />
                    <span className="text-xs font-bold text-slate-500 uppercase">Base 2025</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-4xl font-black text-slate-900">${Math.round(stats.comision2025).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-slate-500">Comisión total</p>
                </div>

                <div className="bg-emerald-50 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="text-emerald-700" size={20} />
                    <span className="text-xs font-bold text-emerald-600 uppercase">Renovadas</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-4xl font-black text-emerald-700">${Math.round(DATA_2026.filter(p => p.NEW_REN === 'Renewal').reduce((acc, curr) => acc + curr.COMISION, 0)).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-emerald-600">{DATA_2026.filter(p => p.NEW_REN === 'Renewal').length} pólizas</p>
                  <p className="text-xs text-emerald-500">{stats.total2025 > 0 ? Math.round((DATA_2026.filter(p => p.NEW_REN === 'Renewal').length / stats.total2025) * 100) : 0}% retención</p>
                </div>

                <div className="bg-rose-50 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="text-rose-700" size={20} />
                    <span className="text-xs font-bold text-rose-600 uppercase">No Renovadas</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-4xl font-black text-rose-700">${Math.round(mergedData.filter(d => !d.renovado && !d.nuevo).reduce((acc, curr) => acc + curr.COMISION, 0)).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-rose-600">{stats.noRenovadas} pólizas</p>
                  <p className="text-xs text-rose-500">{stats.total2025 > 0 ? Math.round((stats.noRenovadas / stats.total2025) * 100) : 0}% pérdida</p>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="text-blue-700" size={20} />
                    <span className="text-xs font-bold text-blue-600 uppercase">Nuevas</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-4xl font-black text-blue-700">${Math.round(DATA_2026.filter(p => p.NEW_REN === 'New').reduce((acc, curr) => acc + curr.COMISION, 0)).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-blue-600">{DATA_2026.filter(p => p.NEW_REN === 'New').length} pólizas</p>
                </div>

                <div className="bg-teal-50 p-6 rounded-xl border-2 border-teal-500">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="text-teal-700" size={20} />
                    <span className="text-xs font-bold text-teal-600 uppercase">Base 2026</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-4xl font-black text-teal-700">${Math.round(stats.comision2026).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-teal-600">{stats.polizas2026} pólizas</p>
                </div>
              </div>

              {/* Análisis por Captador - Comisiones */}
              <h4 className="text-xl font-bold text-slate-800 mb-4">Comisiones por Captador</h4>
              <div className="space-y-6">
                {captadorStats.map((captador, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <h5 className="text-lg font-bold text-slate-800 mb-4">{captador.nombre}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Base 2025</p>
                        <p className="text-2xl font-black text-slate-900">${Math.round(captador.comision2025).toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">{captador.polizas2025} pólizas</p>
                      </div>
                      <div className="text-center p-4 bg-emerald-50 rounded-lg">
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Renovadas</p>
                        <p className="text-2xl font-black text-emerald-700">${Math.round(captador.comisionRenovadas).toLocaleString()}</p>
                        <p className="text-xs text-emerald-600 mt-1">{captador.renovadas} pólizas</p>
                        <p className="text-xs text-emerald-500 mt-1">{captador.polizas2025 > 0 ? Math.round((captador.renovadas / captador.polizas2025) * 100) : 0}% retención</p>
                      </div>
                      <div className="text-center p-4 bg-rose-50 rounded-lg">
                        <p className="text-xs font-bold text-rose-600 uppercase mb-2">No Renovadas</p>
                        <p className="text-2xl font-black text-rose-700">${Math.round(captador.comisionPerdidas).toLocaleString()}</p>
                        <p className="text-xs text-rose-600 mt-1">{captador.perdidas} pólizas</p>
                        <p className="text-xs text-rose-500 mt-1">{captador.polizas2025 > 0 ? Math.round((captador.perdidas / captador.polizas2025) * 100) : 0}% pérdida</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs font-bold text-blue-600 uppercase mb-2">Nuevas</p>
                        <p className="text-2xl font-black text-blue-700">${Math.round(captador.comisionNuevas).toLocaleString()}</p>
                        <p className="text-xs text-blue-600 mt-1">{captador.nuevas} pólizas</p>
                      </div>
                      <div className="text-center p-4 bg-teal-50 rounded-lg">
                        <p className="text-xs font-bold text-teal-600 uppercase mb-2">Base 2026</p>
                        <p className="text-2xl font-black text-teal-700">${Math.round(captador.comision2026).toLocaleString()}</p>
                        <p className="text-xs text-teal-600 mt-1">{captador.polizas2026} pólizas</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'migracion' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <ArrowRightLeft className="text-teal-500" size={28} />
                    Matriz de Migración por Compañía
                  </h3>
                  <p className="text-sm text-slate-500">Flujo de pólizas entre compañías 2025 → 2026</p>
                </div>

                {/* Filtro de compañías - solo en pestaña Detalle */}
                {migrationTab === 'detalle' && (
                  <div className="relative">
                    <button
                      onClick={() => setFilterOpen(!filterOpen)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Search size={16} className="text-slate-600" />
                      <span className="text-sm font-semibold text-slate-700">
                        {selectedCompanies.length === 0
                          ? 'Todas las compañías'
                          : `${selectedCompanies.length} seleccionada${selectedCompanies.length > 1 ? 's' : ''}`}
                      </span>
                    </button>

                    {filterOpen && (
                      <>
                        {/* Overlay para cerrar al hacer clic fuera */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setFilterOpen(false)}
                        />

                        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                          <div className="p-3 border-b border-slate-200">
                            <button
                              onClick={() => {
                                setSelectedCompanies([]);
                                setFilterOpen(false);
                              }}
                              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                            >
                              Limpiar filtro
                            </button>
                          </div>
                          <div className="p-2">
                            {(() => {
                              const companies = [...new Set(migrationMatrix.map(m => m.origin))].sort();
                              return companies.map(company => (
                                <label key={company} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedCompanies.includes(company)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCompanies([...selectedCompanies, company]);
                                      } else {
                                        setSelectedCompanies(selectedCompanies.filter(c => c !== company));
                                      }
                                    }}
                                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                                  />
                                  <span className="text-sm text-slate-700">{company}</span>
                                </label>
                              ));
                            })()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Filtro de compañías - solo en pestaña Gráfico */}
                {migrationTab === 'grafico' && (
                  <div className="relative">
                    <button
                      onClick={() => setSankeyFilterOpen(!sankeyFilterOpen)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Search size={16} className="text-slate-600" />
                      <span className="text-sm font-semibold text-slate-700">
                        {selectedSankeyCompanies.length === 0
                          ? 'Todas las compañías'
                          : `${selectedSankeyCompanies.length} seleccionada${selectedSankeyCompanies.length > 1 ? 's' : ''}`}
                      </span>
                    </button>

                    {sankeyFilterOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setSankeyFilterOpen(false)}
                        />

                        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                          <div className="p-3 border-b border-slate-200">
                            <button
                              onClick={() => setSelectedSankeyCompanies([])}
                              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                            >
                              Limpiar filtro
                            </button>
                          </div>
                          <div className="p-2">
                            {(() => {
                              const companies = [...new Set(migrationMatrix.map(m => m.origin).filter(o => o !== 'Nueva Póliza'))].sort();
                              return companies.map(company => (
                                <label
                                  key={company}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSankeyCompanies.includes(company)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (e.target.checked) {
                                        setSelectedSankeyCompanies([...selectedSankeyCompanies, company]);
                                      } else {
                                        setSelectedSankeyCompanies(selectedSankeyCompanies.filter(c => c !== company));
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                                  />
                                  <span className="text-sm text-slate-700">{company}</span>
                                </label>
                              ));
                            })()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setMigrationTab('detalle')}
                  className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${migrationTab === 'detalle'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Detalle
                </button>
                <button
                  onClick={() => setMigrationTab('grafico')}
                  className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${migrationTab === 'grafico'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Gráfico
                </button>
              </div>
            </div>

            {/* Detalle Tab - Existing migration cards */}
            {migrationTab === 'detalle' && (
              <div className="space-y-6">
                {(() => {
                  // Agrupar por compañía de origen (excluir "Nueva Póliza")
                  const grouped = {};
                  migrationMatrix.forEach(m => {
                    // No mostrar "Nueva Póliza" como compañía de origen
                    if (m.origin === 'Nueva Póliza') return;

                    if (!grouped[m.origin]) {
                      grouped[m.origin] = [];
                    }
                    grouped[m.origin].push(m);
                  });

                  // Agregar compañías que solo aparecen en 2026 (como destino de nuevas pólizas o migraciones)
                  const allDestinations = new Set(migrationMatrix.map(m => m.dest).filter(d => d !== 'No Renovó'));
                  allDestinations.forEach(dest => {
                    if (!grouped[dest]) {
                      // Esta compañía no existía en 2025, crear entrada vacía
                      grouped[dest] = [];
                    }
                  });



                  // Filtrar por compañías seleccionadas
                  const filteredEntries = selectedCompanies.length === 0
                    ? Object.entries(grouped)
                    : Object.entries(grouped).filter(([origin]) => selectedCompanies.includes(origin));

                  return filteredEntries.map(([origin, destinations]) => {
                    // Verificar si esta compañía existía en 2025 (tiene pólizas de origen)
                    const existedIn2025 = migrationMatrix.some(m => m.origin === origin && m.origin !== m.dest);

                    const totalPol = existedIn2025 ? destinations.reduce((acc, d) => acc + d.pol, 0) : 0;
                    const totalMiem = existedIn2025 ? destinations.reduce((acc, d) => acc + d.miem, 0) : 0;

                    // Calcular total 2026: TODAS las pólizas que esta compañía tiene en 2026
                    // Esto incluye: fidelizadas + las que llegaron de otras compañías
                    const total2026Pol = migrationMatrix.filter(m => m.dest === origin).reduce((acc, m) => acc + m.pol, 0);
                    const total2026Miem = migrationMatrix.filter(m => m.dest === origin).reduce((acc, m) => acc + m.miem, 0);

                    return (
                      <div key={origin} className="border border-slate-200 rounded-xl overflow-hidden">
                        {/* Header de la compañía */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-bold text-slate-800">{origin}</h4>
                            <div className="flex items-center gap-6">
                              <div className="text-left">
                                <p className="text-xs text-slate-500 uppercase font-bold">Total 2025</p>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-2xl font-black text-slate-900">{totalPol}</p>
                                  <p className="text-sm font-bold text-slate-600">pólizas</p>
                                </div>
                                <p className="text-xs text-slate-500">{totalMiem} miembros</p>
                              </div>
                              <ArrowRightLeft className="text-slate-400" size={24} />
                              <div className="text-left">
                                <p className="text-xs text-teal-600 uppercase font-bold">Total 2026</p>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-2xl font-black text-teal-700">{total2026Pol}</p>
                                  <p className="text-sm font-bold text-teal-600">pólizas</p>
                                </div>
                                <p className="text-xs text-teal-600">{total2026Miem} miembros</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Destinos */}
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Pólizas que SALEN de esta compañía */}
                            {destinations.sort((a, b) => {
                              // Orden: No Renovó, Fidelizado, Migrado (alfabético)
                              if (a.dest === 'No Renovó') return -1;
                              if (b.dest === 'No Renovó') return 1;
                              if (a.origin === a.dest) return -1;
                              if (b.origin === b.dest) return 1;
                              return a.dest.localeCompare(b.dest);
                            }).map((m, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (m.dest === 'No Renovó') {
                                    openModal(
                                      `Bajas de ${m.origin}`,
                                      item => item.COMPANIA === m.origin && !item.renovado && !item.nuevo
                                    );
                                  } else {
                                    openModal(
                                      `${m.origin === m.dest ? 'Fidelizados en' : 'Migrados a'} ${m.dest}`,
                                      item => item.COMPANIA === m.origin && item.compania2026 === m.dest
                                    );
                                  }
                                }}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-transform hover:scale-105 ${m.origin === m.dest
                                  ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                  : m.dest === 'No Renovó'
                                    ? 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                  }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {m.dest === 'No Renovó' ? (
                                      <TrendingDown className="text-rose-600" size={20} />
                                    ) : (
                                      <TrendingUp className={m.origin === m.dest ? 'text-emerald-600' : 'text-blue-600'} size={20} />
                                    )}
                                    <span className={`text-xs font-bold uppercase ${m.origin === m.dest
                                      ? 'text-emerald-700'
                                      : m.dest === 'No Renovó'
                                        ? 'text-rose-700'
                                        : 'text-blue-700'
                                      }`}>
                                      {m.origin === m.dest ? 'Fidelizado' : m.dest === 'No Renovó' ? 'Baja' : 'Migrado'}
                                    </span>
                                  </div>
                                </div>

                                <p className={`text-sm font-bold mb-1 ${m.origin === m.dest
                                  ? 'text-emerald-800'
                                  : m.dest === 'No Renovó'
                                    ? 'text-rose-800'
                                    : 'text-blue-800'
                                  }`}>
                                  {m.dest === 'No Renovó' ? 'No Renovó' : `→ ${m.dest}`}
                                </p>

                                <div className="flex items-baseline gap-2 mb-1">
                                  <p className={`text-2xl font-black ${m.origin === m.dest
                                    ? 'text-emerald-900'
                                    : m.dest === 'No Renovó'
                                      ? 'text-rose-900'
                                      : 'text-blue-900'
                                    }`}>{m.pol}</p>
                                  <p className="text-sm font-bold text-slate-600">pólizas</p>
                                </div>
                                <p className="text-xs text-slate-600">{m.miem} miembros</p>
                              </div>
                            ))}

                            {/* Pólizas que LLEGAN desde otras compañías (migraciones) */}
                            {(() => {
                              const migrations = migrationMatrix.filter(m => m.dest === origin && m.origin !== origin && m.origin !== 'Nueva Póliza');
                              if (migrations.length === 0) return null;

                              const totalMigrations = migrations.reduce((acc, m) => acc + m.pol, 0);
                              const totalMiemMigrations = migrations.reduce((acc, m) => acc + m.miem, 0);

                              return (
                                <div
                                  onClick={() => openModal(
                                    `Migraciones hacia ${origin}`,
                                    item => item.compania2026 === origin && item.COMPANIA !== origin && !item.nuevo
                                  )}
                                  className="p-3 rounded-lg border-2 bg-indigo-50 border-indigo-200 cursor-pointer transition-transform hover:scale-105 hover:bg-indigo-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="text-indigo-600" size={20} />
                                      <span className="text-xs font-bold uppercase text-indigo-700">Migraciones</span>
                                    </div>
                                  </div>

                                  <p className="text-sm font-bold mb-1 text-indigo-800">← Desde otras compañías</p>

                                  <div className="flex items-baseline gap-2 mb-1">
                                    <p className="text-2xl font-black text-indigo-900">{totalMigrations}</p>
                                    <p className="text-sm font-bold text-slate-600">pólizas</p>
                                  </div>
                                  <p className="text-xs text-slate-600">{totalMiemMigrations} miembros</p>
                                </div>
                              );
                            })()}

                            {/* Pólizas completamente NUEVAS */}
                            {(() => {
                              const newPolicies = migrationMatrix.filter(m => m.dest === origin && m.origin === 'Nueva Póliza');
                              if (newPolicies.length === 0) return null;

                              const totalNew = newPolicies.reduce((acc, m) => acc + m.pol, 0);
                              const totalMiemNew = newPolicies.reduce((acc, m) => acc + m.miem, 0);

                              return (
                                <div
                                  onClick={() => openModal(
                                    `Nuevas Pólizas en ${origin}`,
                                    item => item.compania2026 === origin && item.nuevo
                                  )}
                                  className="p-3 rounded-lg border-2 bg-amber-50 border-amber-200 cursor-pointer transition-transform hover:scale-105 hover:bg-amber-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="text-amber-600" size={20} />
                                      <span className="text-xs font-bold uppercase text-amber-700">Nuevas</span>
                                    </div>
                                  </div>

                                  <p className="text-sm font-bold mb-1 text-amber-800">← Pólizas nuevas 2026</p>

                                  <div className="flex items-baseline gap-2 mb-1">
                                    <p className="text-2xl font-black text-amber-900">{totalNew}</p>
                                    <p className="text-sm font-bold text-slate-600">pólizas</p>
                                  </div>
                                  <p className="text-xs text-slate-600">{totalMiemNew} miembros</p>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}


            {/* Gráfico Tab - Sankey Diagram */}
            {migrationTab === 'grafico' && (
              <div className="mt-8">
                <SankeyDiagram
                  migrationMatrix={migrationMatrix}
                  selectedCompanies={selectedSankeyCompanies}
                  onCompaniesChange={setSelectedSankeyCompanies}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'registros' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o ID..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={renewalFilter}
                  onChange={(e) => setRenewalFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="renewed">Renovadas</option>
                  <option value="not-renewed">No Renovadas</option>
                  <option value="new">Nuevas</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Titular</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Compañía 2025</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Compañía 2026</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Miembros 2025</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Miembros 2026</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mergedData
                    .filter(item => {
                      // Filtro de búsqueda
                      const matchesSearch = item.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.APELLIDOS.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item['ID-BI'].toLowerCase().includes(searchTerm.toLowerCase());

                      // Filtro de renovación
                      if (renewalFilter === 'renewed') return matchesSearch && item.renovado;
                      if (renewalFilter === 'not-renewed') return matchesSearch && !item.renovado && !item.nuevo;
                      if (renewalFilter === 'new') return matchesSearch && item.nuevo;
                      return matchesSearch;
                    })
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-xs font-mono text-teal-600">{item['ID-BI']}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">{item.NOMBRE} {item.APELLIDOS}</p>
                          <p className="text-xs text-slate-500">{item.CAPTADOR}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">{item.COMPANIA}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg ${item.renovado ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-rose-100 text-rose-700'}`}>
                            {item.compania2026}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm text-slate-700">{item.MIEMBROS}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-sm ${item.renovado ? 'text-teal-700' : 'text-rose-700'}`}>{item.miembros2026}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {(() => {
                            const variation = item.miembros2026 - item.MIEMBROS;
                            if (variation === 0) return <span className="text-sm text-slate-500">-</span>;
                            return (
                              <div className="flex items-center justify-center gap-1">
                                {variation > 0 ? (
                                  <TrendingUp size={16} className="text-emerald-600" />
                                ) : (
                                  <TrendingDown size={16} className="text-rose-600" />
                                )}
                                <span className={`text-sm font-medium ${variation > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {variation > 0 ? '+' : ''}{variation}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inside2026' && (() => {
          // Calcular estadísticas de 2026
          const stats2026 = {
            totalPolicies: DATA_2026.length,
            totalMembers: DATA_2026.reduce((sum, p) => sum + p.MIEMBROS, 0),
            totalCommission: DATA_2026.reduce((sum, p) => sum + p.COMISION, 0),
            renovados: DATA_2026.filter(p => p.NEW_REN === 'Renewal').length,
            nuevos: DATA_2026.filter(p => p.NEW_REN === 'New').length
          };

          // Agrupar por Captador
          const byCaptador = {};
          DATA_2026.forEach(p => {
            const captador = p.CAPTADOR;
            if (!byCaptador[captador]) byCaptador[captador] = { members: 0, policies: 0, renovados: 0, nuevos: 0 };
            const miembros = p.MIEMBROS;
            byCaptador[captador].members += miembros;
            byCaptador[captador].policies += 1;
            if (p.NEW_REN === 'New') byCaptador[captador].nuevos += miembros;
            else byCaptador[captador].renovados += miembros;
          });
          const captadorData = Object.entries(byCaptador)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.members - a.members);

          // Agrupar por Compañía
          const byCompania = {};
          DATA_2026.forEach(p => {
            const compania = p.COMPANIA;
            if (!byCompania[compania]) byCompania[compania] = { members: 0, policies: 0, renovados: 0, nuevos: 0 };
            const miembros = p.MIEMBROS;
            byCompania[compania].members += miembros;
            byCompania[compania].policies += 1;
            if (p.NEW_REN === 'New') byCompania[compania].nuevos += miembros;
            else byCompania[compania].renovados += miembros;
          });
          const companiaData = Object.entries(byCompania)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.members - a.members);

          // Agrupar por Estado
          const byEstado = {};
          DATA_2026.forEach(p => {
            const estado = p.ESTADO;
            if (!estado) return; // Skip si no tiene estado
            if (!byEstado[estado]) byEstado[estado] = { members: 0, policies: 0, renovados: 0, nuevos: 0 };
            const miembros = p.MIEMBROS;
            byEstado[estado].members += miembros;
            byEstado[estado].policies += 1;
            if (p.NEW_REN === 'New') byEstado[estado].nuevos += miembros;
            else byEstado[estado].renovados += miembros;
          });
          const estadoData = Object.entries(byEstado)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.members - a.members);

          // Agrupar por NPN
          const byNPN = {};
          DATA_2026.forEach(p => {
            const npn = p.NPN;
            if (!npn) return; // Skip si no tiene NPN
            if (!byNPN[npn]) byNPN[npn] = { members: 0, policies: 0, renovados: 0, nuevos: 0 };
            const miembros = p.MIEMBROS;
            byNPN[npn].members += miembros;
            byNPN[npn].policies += 1;
            if (p.NEW_REN === 'New') byNPN[npn].nuevos += miembros;
            else byNPN[npn].renovados += miembros;
          });
          const npnData = Object.entries(byNPN)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.members - a.members);

          const BarChart = ({ data, title, color }) => {
            const maxMembers = Math.max(...data.map(d => d.members));
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <div className={`w-1 h-6 rounded-full ${color}`}></div>
                  {title}
                </h3>
                <div className="space-y-6">
                  {data.map((item, idx) => (
                    <div key={idx} className="group relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{item.policies} pólizas</span>
                          <span className="text-sm font-bold text-slate-900">{item.members} miembros</span>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full rounded-l-full flex transition-all duration-700 ease-out"
                          style={{ width: `${(item.members / maxMembers) * 100}%` }}
                        >
                          {/* Parte Renovados (Color principal) */}
                          <div
                            className={`h-full ${color}`}
                            style={{ width: `${(item.renovados / item.members) * 100}%` }}
                          />
                          {/* Parte Nuevos (Color Ámbar) */}
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${(item.nuevos / item.members) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Tooltip personalizado */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                        <div className="font-bold text-sm mb-2 border-b border-slate-600 pb-1">{item.name}</div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${color}`}></span>
                              Renovados
                            </span>
                            <span className="font-mono font-bold">{item.renovados} ({Math.round((item.renovados / item.members) * 100)}%)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Nuevos
                            </span>
                            <span className="font-mono font-bold">{item.nuevos} ({Math.round((item.nuevos / item.members) * 100)}%)</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-600 mt-1">
                            <span>Total</span>
                            <span className="font-mono font-bold">{item.members}</span>
                          </div>
                        </div>
                        {/* Flecha del tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            );
          };

          const DonutChart = ({ renovados, nuevos }) => {
            const total = renovados + nuevos;
            const renovadosPercent = (renovados / total) * 100;
            const nuevosPercent = (nuevos / total) * 100;
            const circumference = 2 * Math.PI * 90;

            // Para el primer arco (Renovados): empieza en 0
            const renovadosLength = (renovadosPercent / 100) * circumference;
            const renovadosOffset = 0;

            // Para el segundo arco (Nuevos): empieza donde termina el primero
            const nuevosLength = (nuevosPercent / 100) * circumference;
            const nuevosOffset = -renovadosLength;

            return (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución Renovados vs Nuevos</h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-64 h-64">
                    <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 200 200">
                      {/* Background circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="20"
                      />
                      {/* Renovados arc */}
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="url(#gradientRenovados)"
                        strokeWidth="20"
                        strokeDasharray={`${renovadosLength} ${circumference - renovadosLength}`}
                        strokeDashoffset={renovadosOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      {/* Nuevos arc */}
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="url(#gradientNuevos)"
                        strokeWidth="20"
                        strokeDasharray={`${nuevosLength} ${circumference - nuevosLength}`}
                        strokeDashoffset={nuevosOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradientRenovados" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#0d9488" />
                        </linearGradient>
                        <linearGradient id="gradientNuevos" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-slate-900">{total}</p>
                      <p className="text-sm font-semibold text-slate-500">Pólizas Totales</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                        <TrendingUp className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900">{renovados}</p>
                        <p className="text-sm font-semibold text-slate-600">Renovados ({Math.round(renovadosPercent)}%)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                        <TrendingUp className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900">{nuevos}</p>
                        <p className="text-sm font-semibold text-slate-600">Nuevos ({Math.round(nuevosPercent)}%)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-8">
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <ClipboardList size={24} />
                    </div>
                    <p className="text-sm font-semibold opacity-90">Pólizas 2026</p>
                  </div>
                  <p className="text-5xl font-black mb-1">{stats2026.totalPolicies}</p>
                  <p className="text-sm opacity-75">{stats2026.totalMembers} miembros totales</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <TrendingUp size={24} />
                    </div>
                    <p className="text-sm font-semibold opacity-90">Renovados</p>
                  </div>
                  <p className="text-5xl font-black mb-1">{stats2026.renovados}</p>
                  <p className="text-sm opacity-75">{Math.round((stats2026.renovados / stats2026.totalPolicies) * 100)}% del total</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <TrendingUp size={24} />
                    </div>
                    <p className="text-sm font-semibold opacity-90">Nuevos</p>
                  </div>
                  <p className="text-5xl font-black mb-1">{stats2026.nuevos}</p>
                  <p className="text-sm opacity-75">{Math.round((stats2026.nuevos / stats2026.totalPolicies) * 100)}% del total</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <TrendingUp size={24} />
                    </div>
                    <p className="text-sm font-semibold opacity-90">Comisiones</p>
                  </div>
                  <p className="text-5xl font-black mb-1">${Math.round(stats2026.totalCommission).toLocaleString()}</p>
                  <p className="text-sm opacity-75">Total estimado</p>
                </div>
              </div>

              {/* Donut Chart */}
              <DonutChart renovados={stats2026.renovados} nuevos={stats2026.nuevos} />

              {/* Bar Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChart data={captadorData} title="Miembros por Captador" color="bg-gradient-to-r from-blue-500 to-blue-600" />
                <BarChart data={npnData} title="Miembros por NPN" color="bg-gradient-to-r from-indigo-500 to-indigo-600" />
                <BarChart data={companiaData} title="Miembros por Compañía" color="bg-gradient-to-r from-purple-500 to-purple-600" />
                <BarChart data={estadoData} title="Miembros por Estado" color="bg-gradient-to-r from-pink-500 to-pink-600" />
              </div>
            </div>
          );
        })()}

        {/* Modal de Detalles */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">{modalTitle}</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Titular</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Miembros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modalData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs font-mono text-teal-600">{item['ID-BI']}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 text-sm">{item.NOMBRE} {item.APELLIDOS}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>{item.COMPANIA}</span>
                            <span className="text-slate-300">→</span>
                            <span>{item.compania2026}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-lg ${item.nuevo ? 'bg-amber-50 text-amber-700' : item.renovado ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                            {item.nuevo ? 'Póliza Nueva' : item.renovado ? 'Renovado' : 'No Renovó'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{item.miembros2026 || item.MIEMBROS}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">{modalData.length} registros encontrados</span>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div >
  );
};

export default App;