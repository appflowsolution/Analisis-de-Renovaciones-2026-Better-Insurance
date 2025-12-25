// Este archivo carga los datos desde los archivos JSON en la carpeta public
// Cada vez que actualices polizas-2025.json o polizas-2026.json, 
// la aplicación se actualizará automáticamente

let cachedData2025 = null;
let cachedData2026 = null;

export async function loadData2025() {
    if (cachedData2025) return cachedData2025;

    try {
        const response = await fetch('/polizas-2025.json');
        if (!response.ok) throw new Error('Error cargando datos 2025');
        const jsonData = await response.json();

        // El JSON tiene un wrapper "Polizas 2025", extraer el array
        const rawData = jsonData[0]["Polizas 2025"];

        // Normalizar los nombres de campos
        cachedData2025 = rawData.map(item => ({
            'ID-BI': item['ID-BI'],
            'CAPTADOR': item['CAPTADOR'],
            'NOMBRE': item['NOMBRE PRINCIPAL'],
            'APELLIDOS': item['APELLIDOS'],
            'MIEMBROS': item['NUMERO DE MIEMBROS'],
            'COMPANIA': item['COMPANIA'],
            'COMISION': item['TOTAL COMISION ESTIMADA']
        }));

        return cachedData2025;
    } catch (error) {
        console.error('Error al cargar polizas-2025.json:', error);
        return [];
    }
}

export async function loadData2026() {
    if (cachedData2026) return cachedData2026;

    try {
        const response = await fetch('/polizas-2026.json');
        if (!response.ok) throw new Error('Error cargando datos 2026');
        const jsonData = await response.json();

        // El JSON tiene un wrapper "Polizas 2026", extraer el array
        const rawData = jsonData[0]["Polizas 2026"];

        // Normalizar los nombres de campos
        cachedData2026 = rawData.map(item => ({
            'ID-BI': item['ID-BI'],
            'CAPTADOR': item['CAPTADOR'],
            'NOMBRE': item['NOMBRE PRINCIPAL'],
            'APELLIDOS': item['APELLIDOS'],
            'ESTADO': item['ESTADO'],
            'NPN': item['NPN'],
            'MIEMBROS': item['NUMERO DE MIEMBROS'],
            'COMPANIA': item['COMPANIA'],
            'COMISION': item['TOTAL COMISION ESTIMADA'],
            'NEW_REN': item['New /REN'] // Campo adicional en 2026
        }));

        return cachedData2026;
    } catch (error) {
        console.error('Error al cargar polizas-2026.json:', error);
        return [];
    }
}

// Función para recargar los datos (útil si actualizas los archivos)
export function reloadData() {
    cachedData2025 = null;
    cachedData2026 = null;
}
