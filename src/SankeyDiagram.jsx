import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { Search } from 'lucide-react';

const SankeyDiagram = ({
    migrationMatrix,
    selectedCompanies = [],
    onCompaniesChange,
    filterOpen,
    onFilterToggle
}) => {
    // Preparar datos para el gráfico Sankey
    const sankeyData = useMemo(() => {
        const data = [['From', 'To', 'Policies']];

        migrationMatrix.forEach(m => {
            // Excluir "Nueva Póliza" del lado izquierdo (no existían en 2025)
            if (m.origin === 'Nueva Póliza') return;

            // Solo agregar flujos con al menos 1 póliza
            if (m.pol > 0) {
                // Necesitamos sufijos para evitar ciclos en Google Charts
                // Usamos '25 y '26 para ser más cortos
                const from = `${m.origin} '25`;
                const to = m.dest === 'No Renovó' ? 'No Renovaron' : `${m.dest} '26`;
                data.push([from, to, m.pol]);
            }
        });

        return data;
    }, [migrationMatrix]);

    const options = {
        height: 700,
        sankey: {
            node: {
                colors: ['#14b8a6', '#3b82f6', '#f43f5e', '#f59e0b'],
                label: {
                    fontName: 'Arial',
                    fontSize: 12,
                    color: '#1e293b',
                    bold: true
                },
                nodePadding: 15,
                width: 8,
                interactivity: true
            },
            link: {
                colorMode: 'gradient',
                colors: ['#14b8a6', '#3b82f6', '#f43f5e', '#f59e0b']
            },
            iterations: 0
        },
        tooltip: {
            textStyle: {
                fontName: 'Arial',
                fontSize: 12
            },
            isHtml: false
        }
    };

    // Obtener lista de compañías para el filtro
    const allCompanies = useMemo(() => {
        return [...new Set(migrationMatrix.map(m => m.origin).filter(o => o !== 'Nueva Póliza'))].sort();
    }, [migrationMatrix]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">
                        Flujo de Pólizas 2025 → 2026
                    </h4>
                    <p className="text-sm text-slate-500">
                        El ancho de las bandas representa la cantidad de pólizas que fluyen entre compañías
                    </p>
                </div>

                {/* Filtro de compañías */}
                <div className="relative">
                    <button
                        onClick={onFilterToggle}
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
                            <div
                                className="fixed inset-0 z-10"
                                onClick={onFilterToggle}
                            />

                            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                                <div className="p-3 border-b border-slate-200">
                                    <button
                                        onClick={() => {
                                            onCompaniesChange([]);
                                            onFilterToggle();
                                        }}
                                        className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                                    >
                                        Limpiar filtro
                                    </button>
                                </div>
                                <div className="p-2">
                                    {allCompanies.map(company => (
                                        <label key={company} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedCompanies.includes(company)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        onCompaniesChange([...selectedCompanies, company]);
                                                    } else {
                                                        onCompaniesChange(selectedCompanies.filter(c => c !== company));
                                                    }
                                                }}
                                                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                                            />
                                            <span className="text-sm text-slate-700">{company}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Year Headers */}
            <div className="flex justify-between mb-2 px-4">
                <div className="text-left">
                    <span className="text-2xl font-black text-slate-700">2025</span>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-slate-700">2026</span>
                </div>
            </div>

            <div className="w-full bg-slate-50 rounded-lg p-4" style={{ height: '700px' }}>
                <Chart
                    chartType="Sankey"
                    width="100%"
                    height="100%"
                    data={sankeyData}
                    options={options}
                />
            </div>
        </div>
    );
};

export default SankeyDiagram;
