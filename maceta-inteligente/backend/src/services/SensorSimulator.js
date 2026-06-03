// src/services/SensorSimulator.js
// Principio SOLID:
//   - Single Responsibility: sólo simula el hardware ESP32
//   - Open/Closed: se puede extender con nuevos patrones sin modificar el núcleo
//   - Dependency Inversion: recibe el socket como dependencia (no lo instancia aquí)

require('dotenv').config();

/**
 * SensorSimulator
 * ================
 * Simula el comportamiento de un ESP32 con un sensor de humedad capacitivo.
 *
 * El sensor real enviaría datos por MQTT o WebSocket; aquí usamos un setInterval
 * que genera valores con variación realista y los emite por Socket.IO.
 *
 * ALGORITMO DE SIMULACIÓN:
 * - La humedad oscila entre 10% y 95%.
 * - Cada ciclo aplica un delta aleatorio (±5%) con sesgo descendente
 *   para simular que la planta consume agua.
 * - Cuando llega a valores muy bajos se "riega" (rebote hacia arriba).
 */
class SensorSimulator {
  constructor() {
    this.humidity = 65;           // Valor inicial (%)
    this.intervalId = null;
    this.isRunning = false;
    this.deviceId = 'ESP32-SIM-001';
    this.intervalMs = parseInt(process.env.SENSOR_INTERVAL_MS) || 4000;
    this.alertThreshold = parseInt(process.env.HUMIDITY_ALERT_THRESHOLD) || 30;
    this.healthyThreshold = parseInt(process.env.HUMIDITY_HEALTHY_THRESHOLD) || 60;

    // Referencia al servicio de readings — se inyecta después de instanciar
    this.readingService = null;
    // Referencia al objeto io de Socket.IO
    this.io = null;

    // Estado de la última lectura (para detectar cambios de estado)
    this.lastStatus = 'healthy';
    // Contador de ciclos para limpiezas periódicas
    this.cycleCount = 0;
  }

  /**
   * Inyecta las dependencias externas.
   * Principio de Inversión de Dependencias (SOLID-D).
   */
  init(io, readingService) {
    this.io = io;
    this.readingService = readingService;
    console.log('🌱 SensorSimulator inicializado con dependencias.');
  }

  /**
   * Inicia la simulación.
   */
  start() {
    if (this.isRunning) {
      console.warn('⚠️  El simulador ya está en ejecución.');
      return;
    }

    console.log(`🚀 Simulador ESP32 iniciado. Intervalo: ${this.intervalMs}ms`);
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      await this._tick();
    }, this.intervalMs);
  }

  /**
   * Detiene la simulación.
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Simulador ESP32 detenido.');
  }

  /**
   * Devuelve el estado actual del simulador (para clientes que se conectan tarde).
   */
  getCurrentState() {
    return {
      humidity: this.humidity,
      status: this._calculateStatus(this.humidity),
      deviceId: this.deviceId,
      isRunning: this.isRunning,
      alertThreshold: this.alertThreshold,
    };
  }

  // ─── Métodos privados ─────────────────────────────────────────────────────

  /**
   * Un "tick" del sensor: genera la lectura, la persiste y la emite por WS.
   * CONCURRENCIA: el await encadena las operaciones — la lectura se guarda
   * ANTES de emitir el WebSocket, garantizando que la BD siempre está
   * actualizada antes que los clientes reciban el dato.
   */
  async _tick() {
    try {
      // 1. Generar nuevo valor de humedad
      this.humidity = this._generateNextHumidity(this.humidity);
      const status = this._calculateStatus(this.humidity);
      const timestamp = new Date().toISOString();

      // 2. Persistir en base de datos
      let savedReading = null;
      if (this.readingService) {
        savedReading = await this.readingService.saveReading({
          humidity: this.humidity,
          status,
          deviceId: this.deviceId,
        });
      }

      // 3. Construir payload para WebSocket
      const payload = {
        id: savedReading?.id || null,
        humidity: this.humidity,
        status,
        deviceId: this.deviceId,
        timestamp: savedReading?.recorded_at || timestamp,
        alertThreshold: this.alertThreshold,
      };

      // 4. Emitir a TODOS los clientes conectados (broadcast)
      //    Esto asegura consistencia: todos reciben el mismo dato simultáneamente.
      if (this.io) {
        this.io.emit('sensor:reading', payload);

        // Si el estado cambió a alerta, emitir evento especial
        if (status === 'alert' && this.lastStatus !== 'alert') {
          this.io.emit('sensor:alert', {
            message: `⚠️ Humedad crítica: ${this.humidity}% — ¡La planta necesita agua!`,
            humidity: this.humidity,
            timestamp,
          });
          console.log(`🚨 ALERTA emitida: ${this.humidity}%`);
        }

        // Si se recuperó de una alerta
        if (status !== 'alert' && this.lastStatus === 'alert') {
          this.io.emit('sensor:recovery', {
            message: `✅ Humedad normalizada: ${this.humidity}%`,
            humidity: this.humidity,
            timestamp,
          });
        }
      }

      this.lastStatus = status;
      this.cycleCount++;

      // Limpieza periódica de BD cada 200 ciclos (~13 min con 4s de intervalo)
      if (this.cycleCount % 200 === 0 && this.readingService) {
        await this.readingService.cleanup();
      }

      console.log(
        `📡 Lectura #${this.cycleCount} | Humedad: ${this.humidity}% | Estado: ${status}`
      );
    } catch (error) {
      console.error('❌ Error en tick del simulador:', error.message);
      // El simulador NO se detiene ante errores individuales — resiliente por diseño
    }
  }

  /**
   * Genera el siguiente valor de humedad con comportamiento realista.
   *
   * Lógica:
   * - Delta aleatorio entre -5 y +3 (sesgo descendente → la planta "consume" agua)
   * - Si baja de 15%, "se riega" y sube bruscamente (rebote realista)
   * - Si sube de 95%, inicia descenso natural
   * - Ruido gaussiano leve para mayor realismo
   */
  _generateNextHumidity(current) {
    // Rebote: si la planta está muy seca, simular riego
    if (current <= 15) {
      const newVal = current + Math.random() * 40 + 20; // Sube entre 20 y 60%
      return Math.min(95, Math.round(newVal * 10) / 10);
    }

    // Delta con sesgo descendente (planta consume agua)
    const delta = (Math.random() * 8) - 5; // Entre -5 y +3
    // Añadir pequeño ruido gaussiano
    const noise = (Math.random() - 0.5) * 1.5;
    const newVal = current + delta + noise;

    // Clamp entre 10% y 95%
    return Math.max(10, Math.min(95, Math.round(newVal * 10) / 10));
  }

  /**
   * Determina el estado de la planta según el porcentaje de humedad.
   * @returns {'healthy' | 'needs_water' | 'alert'}
   */
  _calculateStatus(humidity) {
    if (humidity < this.alertThreshold) return 'alert';
    if (humidity < this.healthyThreshold) return 'needs_water';
    return 'healthy';
  }
}

// Singleton: toda la app comparte la misma instancia del simulador
module.exports = new SensorSimulator();
