# BackIOT_Sensores — SlideWatch Backend 

Backend del sistema **SlideWatch**, una solución de alerta temprana de deslizamientos de tierra. Expone una API REST + WebSockets para recibir datos de sensores ESP32 (humedad de suelo, lluvia, vibración, acelerómetro/giroscopio), calcular niveles de riesgo, generar alertas, gestionar reportes ciudadanos georreferenciados y notificar vía Telegram. Incluye un microservicio en Python con un modelo **LSTM** que predice el riesgo futuro de deslizamiento.

## Stack

- **Node.js + Express 5** — API REST
- **Socket.IO** — actualizaciones en tiempo real (dashboard, mapa)
- **PostgreSQL (Neon)** — base de datos
- **JWT + bcryptjs** — autenticación
- **Cloudinary + Multer** — almacenamiento de fotos de reportes ciudadanos
- **Telegram Bot API** — notificaciones de alertas a administradores
- **Groq SDK** — chatbot
- **Python + Flask + TensorFlow/Keras (LSTM)** — microservicio de predicción de riesgo

## Estructura del proyecto

BackIOT_Sensores/

├── src/

│   ├── app.js                  # Configuración de Express y montaje de rutas

│   ├── server.js                # Arranque del servidor HTTP + Socket.IO + bot Telegram

│   ├── config/                  # Conexión a DB (Neon) y Cloudinary

│   ├── constants/                # Mapeo de métricas a sensores físicos

│   ├── controllers/              # Lógica de cada endpoint

│   ├── middlewares/               # Auth, validación de payloads, manejo de errores

│   ├── routes/                    # Definición de rutas por módulo

│   ├── services/                  # Lógica de negocio y acceso a datos

│   ├── sockets/                    # Socket.IO y bot de Telegram

│   ├── utils/                       # Helpers (JWT, respuestas, rangos de tiempo)

│   └── validators/                   # Validación de inputs

├── predict_service.py            # Microservicio Flask con el modelo LSTM

├── lstm_riesgo_deslizamiento.keras / .h5 / lstm_weights.weights.h5

├── lstm_metadata.json             # Metadata del modelo (features, ventana, scaler)

├── scaler_lstm.pkl                # Scaler usado para normalizar las lecturas

├── package.json

└── .gitignore

## Requisitos previos

- Node.js ≥ 18
- Python ≥ 3.10 (para el microservicio LSTM)
- Una base de datos PostgreSQL (este proyecto está pensado para [Neon](https://neon.tech))
- Cuenta de Cloudinary (para fotos de reportes)
- Bot de Telegram (opcional, para notificaciones)
- API key de Groq (opcional, para el chatbot)

## Instalación

### 1. Backend Node.js

```bash
git clone https://github.com/DilanMamani/BackIOT_Sensores.git
cd BackIOT_Sensores
npm install
```

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
# Servidor
PORT=3000
CLIENT_URL=http://localhost:5173

# Base de datos
DATABASE_URL=postgresql://usuario:password@host/db?sslmode=require

# Autenticación
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=7d

# Cloudinary (fotos de reportes ciudadanos)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Telegram Bot (notificación de alertas)
TELEGRAM_BOT_TOKEN=tu_token_de_botfather

# Chatbot (Groq)
GROK_API_KEY=tu_groq_api_key

# Microservicio LSTM
LSTM_SERVICE_URL=http://localhost:5001
```

Levanta el servidor:

```bash
npm run dev    # con nodemon, modo desarrollo
npm start      # producción
```

El servidor corre por defecto en `http://localhost:3000`.

### 2. Microservicio LSTM (predicción de riesgo)

```bash
pip install tf-keras flask joblib psycopg2-binary pandas numpy python-dotenv
python predict_service.py
```

Corre en `http://localhost:5001` y usa el mismo `DATABASE_URL` del `.env`. El modelo evalúa una ventana de **30 lecturas** (≈15s) sobre 9 features (humedad de suelo, lluvia, vibración, magnitudes de acelerómetro/giroscopio) para predecir si habrá riesgo alto en los próximos **120 segundos**.

## Endpoints principales

Todas las rutas cuelgan de `/api`.

| Módulo | Método | Ruta | Descripción | Auth |
|---|---|---|---|---|
| Health | GET | `/health` | Estado del servicio | No |
| IoT | POST | `/iot/samples` | Recibe una muestra de sensores (ESP32) | No |
| Dashboard | GET | `/dashboard/snapshot` | Último estado por dispositivo | No |
| Dashboard | GET | `/dashboard/series` | Series históricas para gráficos | No |
| History | GET | `/history` | Historial de lecturas | No |
| Risk History | GET | `/risk-history` | Historial de niveles de riesgo | No |
| Alerts | GET | `/alerts` | Listado de alertas | No |
| Alerts | GET | `/alerts/open` | Alertas abiertas | No |
| Alerts | PATCH | `/alerts/:alertId/resolve` | Resolver una alerta | No |
| Devices | GET/POST | `/devices` | Listar / crear dispositivos | No |
| Devices | GET | `/devices/:deviceCode` | Detalle de un dispositivo | No |
| Devices | GET/POST | `/devices/:deviceCode/sensors` | Sensores de un dispositivo | No |
| Locations | POST | `/locations` | Crear ubicación | No |
| Auth | POST | `/auth/login` | Iniciar sesión | No |
| Auth | POST | `/auth/register` | Registro de usuario | No |
| Auth | GET | `/auth/me` | Usuario autenticado | Sí |
| Users | GET | `/users` | Listado de usuarios | Sí |
| Reports | POST | `/reports` | Crear reporte ciudadano (con foto) | Sí |
| Reports | GET | `/reports/my` | Mis reportes | Sí |
| Reports | GET | `/reports` | Todos los reportes (admin) | Sí |
| Reports | PATCH | `/reports/:id/status` | Cambiar estado de reporte (admin) | Sí |
| Map | GET | `/map/reports` `/map/devices` `/map/alerts` | Datos georreferenciados para el mapa | Sí |
| Telegram | POST/DELETE | `/telegram/link` | Vincular / desvincular chat de Telegram | Sí |
| Telegram | GET | `/telegram/status` | Estado de vinculación | Sí |
| Chatbot | POST | `/chatbot/mensaje` | Enviar mensaje al chatbot | Sí |

> Nota: las rutas `lstm.routes.js`, `thresholds.routes.js` y `metricTypes.routes.js` existen en el código pero aún no están montadas en `app.js`.

### Ejemplo de payload — `POST /api/iot/samples`

```json
{
  "deviceCode": "ESP32-001",
  "sampledAt": "2026-06-19T10:00:00Z",
  "metrics": {
    "soilPercent": 45.2,
    "rainPercent": 12.0,
    "vibrationDetected": 1,
    "vibrationCount": 3,
    "accelX": -0.18,
    "accelY": -0.11,
    "accelZ": -0.68,
    "accelMagnitude": 1.02,
    "gyroX": 0.5,
    "gyroY": 1.2,
    "gyroZ": 0.3,
    "gyroMagnitude": 7.8
  }
}
```

## WebSockets (Socket.IO)

El servidor emite el evento `snapshot:update` cada vez que llega una nueva muestra IoT, y eventos en `mapSocket.js` para actualizaciones en tiempo real del mapa.

## Autenticación

JWT vía header `Authorization: Bearer <token>`. Los tokens se obtienen en `/api/auth/login` o `/api/auth/register` y expiran según `JWT_EXPIRES_IN` (7 días por defecto).
