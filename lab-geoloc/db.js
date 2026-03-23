import initSqlJs from 'sql.js';
import fs from 'fs';

let db;
let SQL;
const DB_FILE = './database.sqlite';

export async function initDB() {
    SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE);
        db = new SQL.Database(data);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS historial (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            origen_lat REAL,
            origen_lon REAL,
            destino_lat REAL,
            destino_lon REAL,
            distancia REAL,
            duracion REAL,
            fecha TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    guardarArchivo();
    console.log("DB lista (sql.js)");
}

function guardarArchivo() {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
}

export async function guardarHistorial({ oLat, oLon, dLat, dLon, distancia, duracion }) {
    db.run(
        `INSERT INTO historial 
        (origen_lat, origen_lon, destino_lat, destino_lon, distancia, duracion)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [oLat, oLon, dLat, dLon, distancia, duracion]
    );
    guardarArchivo();
}

export async function obtenerHistorial() {
    const res = db.exec(`SELECT * FROM historial ORDER BY fecha DESC`);

    if (!res.length) return [];

    const cols = res[0].columns;

    return res[0].values.map(row =>
        Object.fromEntries(row.map((v, i) => [cols[i], v]))
    );
}
