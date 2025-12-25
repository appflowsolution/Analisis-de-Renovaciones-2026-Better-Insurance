import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';

const SankeyDiagram = ({ migrationMatrix }) => {
    // Preparar datos para el gráfico Sankey
    const sankeyData = useMemo(() => {
        const data = [['From', 'To', 'Policies']];

        migrationMatrix.forEach(m => {
            // Solo agregar flujos con al menos 1 póliza
            if (m.count > 0) {
                // Agregar sufijo para diferenciar 2025 de 2026
                const from = m.origin === 'Nueva Póliza' ? m.origin : `${m.origin} (2025)`;
                const to = m.dest === 'No Renovó' ? m.dest : `${m.dest} (2026)`;
                data.push([from, to, m.count]);
            }
        });

        return data;
    }, [migrationMatrix]);

    const options = {
        sankey: {
            node: {
                colors: ['#14b8a6', '#3b82f6', '#f43f5e', '#f59e0b'],
                label: {
                    fontName: 'Inter',
                    fontSize: 14,
                    color: '#1e293b',
                    bold: true
                },
                nodePadding: 40,
                width: 20
            },
            link: {
                colorMode: 'gradient',
                colors: ['#14b8a6', '#3b82f6', '#f43f5e', '#f59e0b']
            }
        },
        tooltip: {
            textStyle: {
                fontName: 'Inter',
                fontSize: 13
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-2">
                    Flujo de Pólizas 2025 → 2026
                </h4>
                <p className="text-sm text-slate-500">
                    El ancho de las bandas representa la cantidad de pólizas que fluyen entre compañías
                </p>
            </div>

            <div className="w-full" style={{ height: '600px' }}>
                <Chart
                    chartType="Sankey"
                    width="100%"
                    height="100%"
                    data={sankeyData}
                    options={options}
                />
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500"></div>
                    <span className="text-sm text-slate-600">Fidelizadas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-sm text-slate-600">Migraciones</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-rose-500"></div>
                    <span className="text-sm text-slate-600">No Renovadas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500"></div>
                    <span className="text-sm text-slate-600">Nuevas</span>
                </div>
            </div>
        </div>
    );
};

export default SankeyDiagram;
