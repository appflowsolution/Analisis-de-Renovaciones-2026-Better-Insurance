import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';

const SankeyDiagram = ({ migrationMatrix }) => {
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
                const to = m.dest === 'No Renovó' ? m.dest : `${m.dest} '26`;
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
