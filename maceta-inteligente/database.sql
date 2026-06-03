-- ============================================================
-- MACETA INTELIGENTE — Script SQL
-- Práctica: Sistemas Distribuidos
-- ============================================================
-- Ejecutar con: mysql -u root -p < database.sql
-- O desde MySQL Workbench: File > Open SQL Script
-- ============================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS maceta_inteligente
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE maceta_inteligente;

-- ── Tabla principal: lecturas del sensor ─────────────────────────────────────
-- Almacena cada lectura generada por el simulador ESP32.
-- Esta tabla crece ~900 registros/hora con intervalo de 4 segundos.
-- La limpieza automática (ReadingModel.cleanup) mantiene máx 1000 registros.

DROP TABLE IF EXISTS readings;

CREATE TABLE readings (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  humidity    DECIMAL(5,2) NOT NULL COMMENT 'Porcentaje de humedad (0.00 - 100.00)',
  status      ENUM('healthy', 'needs_water', 'alert') NOT NULL DEFAULT 'healthy'
                COMMENT 'Estado calculado según umbral',
  device_id   VARCHAR(50)  NOT NULL DEFAULT 'ESP32-SIM-001'
                COMMENT 'Identificador del dispositivo IoT',
  recorded_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                COMMENT 'Timestamp con precisión de milisegundos',

  PRIMARY KEY (id),

  -- Índice para consultas de historial reciente (ORDER BY recorded_at DESC)
  INDEX idx_recorded_at (recorded_at DESC),

  -- Índice para filtrar por estado (alertas)
  INDEX idx_status (status),

  -- Índice compuesto para consultas por dispositivo + tiempo
  INDEX idx_device_time (device_id, recorded_at DESC),

  -- Constraint de rango de humedad
  CONSTRAINT chk_humidity CHECK (humidity >= 0 AND humidity <= 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Lecturas del sensor de humedad de la Maceta Inteligente';


-- ── Vista: últimas 50 lecturas ────────────────────────────────────────────────
-- Útil para debug y consultas rápidas desde MySQL Workbench

CREATE OR REPLACE VIEW v_recent_readings AS
SELECT
  id,
  humidity,
  status,
  device_id,
  recorded_at,
  CASE
    WHEN humidity < 30 THEN '🚨 ALERTA'
    WHEN humidity < 60 THEN '⚠️  NECESITA AGUA'
    ELSE '✅ SALUDABLE'
  END AS status_label
FROM readings
ORDER BY recorded_at DESC
LIMIT 50;


-- ── Vista: estadísticas del sistema ──────────────────────────────────────────

CREATE OR REPLACE VIEW v_stats AS
SELECT
  COUNT(*)                                            AS total_readings,
  ROUND(AVG(humidity), 2)                             AS avg_humidity,
  MAX(humidity)                                       AS max_humidity,
  MIN(humidity)                                       AS min_humidity,
  SUM(CASE WHEN status = 'alert' THEN 1 ELSE 0 END)  AS total_alerts,
  SUM(CASE WHEN status = 'needs_water' THEN 1 ELSE 0 END) AS total_needs_water,
  MIN(recorded_at)                                    AS first_reading,
  MAX(recorded_at)                                    AS last_reading
FROM readings;


-- ── Datos iniciales de ejemplo ────────────────────────────────────────────────
-- Insertar algunas lecturas de prueba para que el historial no esté vacío al arrancar

INSERT INTO readings (humidity, status, device_id, recorded_at) VALUES
  (72.5, 'healthy',     'ESP32-SIM-001', NOW() - INTERVAL 5 MINUTE),
  (68.3, 'healthy',     'ESP32-SIM-001', NOW() - INTERVAL 4 MINUTE),
  (61.1, 'healthy',     'ESP32-SIM-001', NOW() - INTERVAL 3 MINUTE),
  (55.8, 'needs_water', 'ESP32-SIM-001', NOW() - INTERVAL 2 MINUTE),
  (42.4, 'needs_water', 'ESP32-SIM-001', NOW() - INTERVAL 90 SECOND),
  (35.0, 'needs_water', 'ESP32-SIM-001', NOW() - INTERVAL 60 SECOND),
  (27.3, 'alert',       'ESP32-SIM-001', NOW() - INTERVAL 30 SECOND),
  (18.9, 'alert',       'ESP32-SIM-001', NOW() - INTERVAL 15 SECOND);


-- ── Verificación ──────────────────────────────────────────────────────────────
SELECT 'Base de datos creada correctamente ✅' AS resultado;
SELECT COUNT(*) AS registros_iniciales FROM readings;
