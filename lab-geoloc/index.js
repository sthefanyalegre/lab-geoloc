import express from 'express';
import dotenv from 'dotenv';
import { initDB, guardarHistorial, obtenerHistorial } from './db.js';

dotenv.config();

console.log("PORT:", process.env.PORT);
console.log("UA:", process.env.USER_AGENT);

const app = express();
const PORT = process.env.PORT || 3000;
const UA = process.env.USER_AGENT;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Inicializar DB
initDB();

// Helper
const osmFetch = url =>
    fetch(url, { headers: { 'User-Agent': UA } }).then(r => r.json());

// ── Geocode ──
app.get('/api/geocode', async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon)
        return res.status(400).json({ error: 'Se requieren lat y lon' });

    try {
        const url = `https://nominatim.openstreetmap.org/reverse`
            + `?lat=${lat}&lon=${lon}&format=json`;

        const data = await osmFetch(url);

        res.json({
            direccion: data.display_name,
            ciudad: data.address?.city || data.address?.town,
            pais: data.address?.country,
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Ruta ──
app.get('/api/ruta', async (req, res) => {
    const { oLat, oLon, dLat, dLon } = req.query;

    if (!oLat || !oLon || !dLat || !dLon)
        return res.status(400).json({ error: 'Faltan coordenadas' });

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/`
            + `${oLon},${oLat};${dLon},${dLat}?overview=false`;

        const data = await osmFetch(url);

        if (data.code !== 'Ok')
            return res.status(502).json({ error: data.code });

        const ruta = data.routes[0];

        const distancia = (ruta.distance / 1000).toFixed(2);
        const duracion = (ruta.duration / 60).toFixed(1);

        // Guardar usando db.js
        await guardarHistorial({
            oLat, oLon, dLat, dLon,
            distancia: ruta.distance,
            duracion: ruta.duration
        });

        res.json({
            distancia_km: distancia,
            duracion_min: duracion,
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Historial ──
app.get('/api/historial', async (req, res) => {
    try {
        const data = await obtenerHistorial();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Servidor
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});