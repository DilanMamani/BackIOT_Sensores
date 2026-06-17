# predict_service.py — Microservicio LSTM para predicción de riesgo futuro
# Integración con servidor Node.js via HTTP en puerto 5001
#
# INSTALACIÓN:
#   pip install tf-keras flask joblib psycopg2-binary pandas numpy python-dotenv
#
# USO:
#   python predict_service.py
#
# ENDPOINTS:
#   GET /health                        → estado del servicio
#   GET /predict/<device_code>         → predicción de riesgo futuro

from flask import Flask, jsonify
import numpy as np
import joblib
import psycopg2
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

# ── Cargar Keras sin TensorFlow completo (compatible con Apple Silicon)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tf_keras as keras

app = Flask(__name__)

# ════════════════════════════════════════════════════════════
# PARÁMETROS DEL MODELO
# Deben coincidir exactamente con los usados en el notebook
# ════════════════════════════════════════════════════════════
WINDOW     = 60   # lecturas de contexto (30 segundos a 500ms/lectura)
N_FEATURES = 9
THRESHOLD  = 0.35 # umbral para clasificar como riesgo

FEATURES = [
    'soil_percent',      # humedad del suelo (%)
    'rain_percent',      # lluvia (%)
    'vibration_detected',# vibración detectada (0/1)
    'vibration_count',   # conteo de vibraciones
    'accel_magnitude',   # magnitud del acelerómetro
    'gyro_magnitude',    # magnitud del giroscopio
    'accel_x',           # aceleración X
    'accel_y',           # aceleración Y
    'accel_z',           # aceleración Z
]

# ════════════════════════════════════════════════════════════
# CARGAR MODELO Y SCALER
# ════════════════════════════════════════════════════════════

# Reconstruir arquitectura (evita problemas de compatibilidad con .h5)
model = keras.Sequential([
    keras.layers.LSTM(64, return_sequences=True,
                      input_shape=(WINDOW, N_FEATURES),
                      dropout=0.2, recurrent_dropout=0.2),
    keras.layers.BatchNormalization(),
    keras.layers.LSTM(32, return_sequences=False,
                      dropout=0.2, recurrent_dropout=0.2),
    keras.layers.BatchNormalization(),
    keras.layers.Dense(16, activation='relu'),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(1, activation='sigmoid')
])

model.build(input_shape=(None, WINDOW, N_FEATURES))
model.load_weights('lstm_weights.weights.h5')
print("✅ Modelo LSTM cargado")

scaler = joblib.load('scaler_lstm.pkl')
print("✅ Scaler cargado")

# ════════════════════════════════════════════════════════════
# CONEXIÓN A BASE DE DATOS
# ════════════════════════════════════════════════════════════
NEON_URL = os.environ.get('DATABASE_URL')
if not NEON_URL:
    raise ValueError("DATABASE_URL no encontrada en .env")

def get_last_readings(device_code):
    """
    Obtiene las últimas WINDOW lecturas del dispositivo desde Neon.
    Solo lecturas de los últimos 5 minutos para garantizar continuidad temporal.
    """
    conn = psycopg2.connect(NEON_URL)
    query = """
        SELECT
            MAX(CASE WHEN mt.code = 'soilPercent'       THEN sm.numeric_value END) AS soil_percent,
            MAX(CASE WHEN mt.code = 'rainPercent'       THEN sm.numeric_value END) AS rain_percent,
            MAX(CASE WHEN mt.code = 'vibrationDetected' THEN sm.numeric_value END) AS vibration_detected,
            MAX(CASE WHEN mt.code = 'vibrationCount'    THEN sm.numeric_value END) AS vibration_count,
            MAX(CASE WHEN mt.code = 'accelMagnitude'    THEN sm.numeric_value END) AS accel_magnitude,
            MAX(CASE WHEN mt.code = 'gyroMagnitude'     THEN sm.numeric_value END) AS gyro_magnitude,
            MAX(CASE WHEN mt.code = 'accelX'            THEN sm.numeric_value END) AS accel_x,
            MAX(CASE WHEN mt.code = 'accelY'            THEN sm.numeric_value END) AS accel_y,
            MAX(CASE WHEN mt.code = 'accelZ'            THEN sm.numeric_value END) AS accel_z
        FROM (
            SELECT id FROM device_samples
            WHERE device_id = (SELECT id FROM devices WHERE code = %s)
              AND sampled_at > NOW() - INTERVAL '5 minutes'
            ORDER BY sampled_at DESC LIMIT %s
        ) recent
        JOIN sample_metrics sm ON sm.sample_id = recent.id
        JOIN metric_types mt   ON mt.id = sm.metric_type_id
        GROUP BY recent.id
        ORDER BY recent.id ASC
    """
    df = pd.read_sql(query, conn, params=[device_code, WINDOW])
    conn.close()
    return df

# ════════════════════════════════════════════════════════════
# ENDPOINTS
# ════════════════════════════════════════════════════════════

@app.route('/health', methods=['GET'])
def health():
    """Verificar que el servicio está activo."""
    return jsonify({
        'status':    'ok',
        'modelo':    'LSTM v1',
        'window':    WINDOW,
        'threshold': THRESHOLD
    })

@app.route('/predict/<device_code>', methods=['GET'])
def predict(device_code):
    """
    Predice si habrá riesgo en las próximas 30 segundos
    basándose en las últimas WINDOW lecturas del dispositivo.
    """
    try:
        df = get_last_readings(device_code)

        # Verificar que hay suficientes lecturas
        if len(df) < WINDOW:
            return jsonify({
                'disponible': False,
                'mensaje':    f'Solo {len(df)} lecturas disponibles, se necesitan {WINDOW}',
                'lecturas':   len(df)
            }), 200

        # Construir ventana y normalizar
        ventana        = df[FEATURES].fillna(0).values
        ventana_scaled = scaler.transform(ventana).reshape(1, WINDOW, N_FEATURES)

        # Inferencia
        proba = float(model.predict(ventana_scaled, verbose=0)[0][0])
        nivel = ('danger'  if proba >= 0.60    else
                 'warning' if proba >= THRESHOLD else
                 'normal')

        return jsonify({
            'disponible':          True,
            'proba_riesgo_futuro': round(proba, 4),
            'nivel_predicho':      nivel,
            'horizonte_segundos':  30,
            'lecturas_usadas':     len(df)
        })

    except Exception as e:
        print(f"Error en /predict/{device_code}: {e}")
        return jsonify({'error': str(e)}), 500


# ════════════════════════════════════════════════════════════
# INICIO
# ════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("🚀 Microservicio LSTM corriendo en http://localhost:5001")
    print("   GET /health")
    print("   GET /predict/<device_code>")
    app.run(port=5001, debug=False)