import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;

export async function initDB() {
    db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS historial (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            origen_lat REAL,
            origen_lon REAL,
            destino_lat REAL,
            destino_lon REAL,
            distancia REAL,
            duracion REAL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('DB lista');
}

// ── Guardar historial ──
export async function guardarHistorial(data) {
    const { oLat, oLon, dLat, dLon, distancia, duracion } = data;

    await db.run(`
        INSERT INTO historial 
        (origen_lat, origen_lon, destino_lat, destino_lon, distancia, duracion)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [oLat, oLon, dLat, dLon, distancia, duracion]);
}

// ── Obtener historial ──
export async function obtenerHistorial() {
    return await db.all(`
        SELECT * FROM historial
        ORDER BY fecha DESC
    `);
}