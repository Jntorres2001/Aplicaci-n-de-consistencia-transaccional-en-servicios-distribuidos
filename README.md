#  Maceta Inteligente — Sistema IoT Distribuido

> **Práctica Universitaria: Sistemas Distribuidos**  
> Simulación completa de un sistema IoT con ESP32 virtual, REST API, WebSocket y React.

---

##  Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura)
2. [Tecnologías Utilizadas](#tecnologías)
3. [Requisitos Previos](#requisitos)
4. [Instalación Paso a Paso](#instalación)
5. [Ejecutar el Proyecto](#ejecutar)
6. [Estructura de Carpetas](#estructura)
7. [API REST — Endpoints](#api-rest)
8. [WebSocket — Eventos](#websocket-eventos)
9. [Conceptos de Sistemas Distribuidos](#conceptos)
10. [Aplicación de SOLID](#solid)
11. [Diagrama de Arquitectura](#diagrama)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    SISTEMA DISTRIBUIDO                    │
│                                                           │
│  ┌──────────────┐   WebSocket    ┌──────────────────────┐│
│  │   CLIENTE 1  │◄──────────────►│                      ││
│  │  React App   │                │   BACKEND Node.js    ││
│  └──────────────┘   WebSocket    │   (Express + WS)     ││
│  ┌──────────────┐◄──────────────►│                      ││
│  │   CLIENTE 2  │                │  ┌─────────────────┐ ││
│  │  React App   │   REST API     │  │ SensorSimulator │ ││
│  └──────────────┘◄──────────────►│  │  (ESP32 Virtual)│ ││
│  ┌──────────────┐                │  └────────┬────────┘ ││
│  │   CLIENTE N  │                │           │ persiste  ││
│  │  React App   │                │  ┌────────▼────────┐ ││
│  └──────────────┘                │  │   MySQL DB      │ ││
│                                  │  └─────────────────┘ ││
│                                  └──────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Tecnologías

| Capa        | Tecnología         | Versión  |
|-------------|--------------------|----------|
| Frontend    | React + Vite       | 18 / 5   |
| Gráficos    | Recharts           | 2.x      |
| Backend     | Node.js + Express  | 18+ / 4  |
| WebSocket   | Socket.IO          | 4.x      |
| Base datos  | MySQL              | 8+       |
| HTTP Client | Axios              | 1.x      |

---

## Requisitos Previos

- **Node.js** ≥ 18.x  (`node -v`)
- **npm** ≥ 9.x       (`npm -v`)
- **MySQL** ≥ 8.x corriendo localmente
- **Visual Studio Code** (recomendado)

---

## Instalación

### 1. Clonar / descomprimir el proyecto

```bash
# Si tienes git:
git clone <url-del-repo> maceta-inteligente
cd maceta-inteligente

# O simplemente abre la carpeta en VS Code
```

### 2. Crear la base de datos MySQL

Abre MySQL Workbench o cualquier cliente MySQL y ejecuta:

```bash
mysql -u root -p < database.sql
```

O pega el contenido de `database.sql` en MySQL Workbench y ejecuta.

### 3. Configurar el Backend

```bash
cd backend
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de MySQL:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_AQUI
DB_NAME=maceta_inteligente
PORT=3001
SENSOR_INTERVAL_MS=4000
HUMIDITY_ALERT_THRESHOLD=30
HUMIDITY_HEALTHY_THRESHOLD=60
FRONTEND_URL=http://localhost:5173
```

Instala dependencias del backend:

```bash
npm install
```

### 4. Configurar el Frontend

```bash
cd ../frontend
npm install
```

Opcionalmente crea `.env` en frontend:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

---

## Ejecutar

### Opción A: Dos terminales en VS Code

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Verás:
```
 Conexión a MySQL establecida correctamente.
 Servidor HTTP  → http://localhost:3001
 API REST       → http://localhost:3001/api
 WebSocket      → ws://localhost:3001
 Simulador ESP32 iniciado. Intervalo: 4000ms
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Abre: **http://localhost:5173**

### Opción B: Script único (desde la raíz)

```bash
# Instalar concurrently
npm install -g concurrently

# Ejecutar ambos
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## Estructura de Carpetas

```
maceta-inteligente/
├── database.sql                  # Script SQL completo
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js             # Punto de entrada
│       ├── app.js                # Configuración Express
│       ├── config/
│       │   └── database.js       # Pool de conexiones MySQL
│       ├── controllers/
│       │   └── ReadingController.js  # Manejo HTTP
│       ├── services/
│       │   ├── ReadingService.js     # Lógica de negocio
│       │   └── SensorSimulator.js   # ESP32 simulado ← CLAVE
│       ├── models/
│       │   └── ReadingModel.js       # Acceso a BD
│       ├── routes/
│       │   └── index.js              # Definición de rutas
│       ├── socket/
│       │   └── socketHandler.js      # Eventos WebSocket
│       └── middlewares/
│           └── errorHandler.js       # Manejo de errores
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── SocketContext.jsx     # Estado global WS
        ├── services/
        │   ├── socketService.js      # Singleton Socket.IO
        │   └── apiService.js         # Cliente REST API
        └── components/
            ├── Dashboard.jsx         # Pantalla principal
            ├── HumidityGauge.jsx     # Indicador circular SVG
            ├── HumidityChart.jsx     # Gráfico en tiempo real
            ├── StatusCard.jsx        # Estado de la planta
            ├── StatsPanel.jsx        # Estadísticas
            ├── AlertBanner.jsx       # Alertas
            ├── HistoryTable.jsx      # Tabla de lecturas
            └── ConnectionStatus.jsx  # Indicador WS
```

---

## API REST — Endpoints

| Método | Ruta                  | Descripción                        |
|--------|-----------------------|------------------------------------|
| GET    | `/api/health`         | Estado del servidor                |
| GET    | `/api/readings`       | Historial reciente (`?limit=50`)   |
| GET    | `/api/readings/latest`| Última lectura                     |
| GET    | `/api/readings/stats` | Estadísticas agregadas             |
| GET    | `/api/sensor/status`  | Estado del simulador ESP32         |
| POST   | `/api/sensor/start`   | Iniciar simulación                 |
| POST   | `/api/sensor/stop`    | Detener simulación                 |

**Ejemplo de respuesta** (`GET /api/readings/latest`):
```json
{
  "success": true,
  "data": {
    "id": 42,
    "humidity": 47.3,
    "status": "needs_water",
    "deviceId": "ESP32-SIM-001",
    "timestamp": "2025-01-15T14:23:05.000Z"
  }
}
```

---

## WebSocket — Eventos

### Del servidor al cliente

| Evento           | Descripción                                      |
|------------------|--------------------------------------------------|
| `sensor:init`    | Estado inicial al conectarse (lecturas + estado) |
| `sensor:reading` | Nueva lectura (broadcast a todos los clientes)   |
| `sensor:alert`   | Alerta de humedad crítica                        |
| `sensor:recovery`| Recuperación de estado crítico                   |
| `system:clients` | Número de clientes conectados                    |
| `system:info`    | Mensaje informativo del sistema                  |

### Del cliente al servidor

| Evento                  | Descripción                  |
|-------------------------|------------------------------|
| `client:requestHistory` | Solicitar historial          |
| `client:startSimulator` | Iniciar simulador            |
| `client:stopSimulator`  | Detener simulador            |
| `client:ping`           | Medir latencia               |

---

## Conceptos de Sistemas Distribuidos

###  WebSocket y Comunicación en Tiempo Real

Socket.IO mantiene una conexión persistente entre servidor y clientes.
Cuando el simulador genera una lectura:
1. La persiste en MySQL (garantía de durabilidad)
2. Emite `io.emit('sensor:reading', data)` → todos los clientes la reciben simultáneamente

Esto elimina el polling y garantiza **consistencia de vista**: todos ven los mismos datos al mismo tiempo.

###  Cliente-Servidor

Arquitectura de dos capas separadas:
- **Cliente** (React): solo renderiza y escucha eventos, nunca manipula la BD directamente.
- **Servidor** (Node.js): única fuente de verdad. Controla el sensor, persiste datos, distribuye lecturas.

###  Teorema CAP

En este sistema priorizamos:

- **Consistencia (C)**: Los clientes siempre ven el mismo dato — la BD se actualiza antes de emitir el WebSocket. Sin embargo, puede haber un pequeño retraso entre que un cliente se conecta y recibe la primera lectura.

- **Disponibilidad (A)**: El servidor usa manejo de errores resiliente (`try/catch`) en el simulador para no caerse ante fallos individuales. El cliente reintenta la conexión WebSocket automáticamente.

- **Tolerancia a Particiones (P)**: Ante desconexión de red, Socket.IO reintenta automáticamente. El backend maneja graceful shutdown para no perder datos.

**Prioridad elegida: CA** (Consistencia + Disponibilidad).  
Ante una partición de red, el sistema prefiere mostrar el último dato conocido y reconectar, antes que mostrar datos inconsistentes.

###  Concurrencia y Consistencia Transaccional

- El pool MySQL usa hasta 10 conexiones simultáneas.
- Cada `INSERT` usa `BEGIN TRANSACTION / COMMIT / ROLLBACK` explícito.
- `io.emit()` es atómico desde la perspectiva de Node.js (event loop single-thread): todos los clientes reciben el mismo broadcast antes de que llegue la siguiente lectura.

---

## Aplicación de SOLID

| Principio | Dónde se aplica |
|-----------|----------------|
| **S** — Single Responsibility | Cada clase tiene una sola razón para cambiar: `ReadingModel` solo accede a BD, `ReadingService` solo tiene lógica de negocio, `ReadingController` solo maneja HTTP. |
| **O** — Open/Closed | `SensorSimulator` puede extenderse con nuevos patrones de generación sin modificar el código existente. |
| **L** — Liskov Substitution | Los servicios retornan objetos con la misma forma, intercambiables entre sí. |
| **I** — Interface Segregation | Los eventos WS están divididos por responsabilidad (`sensor:reading`, `sensor:alert`, `system:clients`). |
| **D** — Dependency Inversion | `SensorSimulator.init(io, readingService)` — recibe sus dependencias, no las crea. El `server.js` es el único lugar que las conecta. |

---

## Diagrama de Arquitectura

```
                    ┌────────────────────────────┐
                    │        BACKEND             │
                    │    Node.js / Express        │
                    │                            │
   REST API ──────► │  ┌─────────────────────┐  │
   (HTTP/JSON)      │  │   Routes/Controllers │  │ ◄── MySQL Pool
                    │  └─────────┬───────────┘  │       │
                    │            │               │  ┌────▼────┐
   WebSocket ──────►│  ┌─────────▼───────────┐  │  │  MySQL  │
   (Socket.IO)      │  │    Services Layer    │  │  │   DB    │
                    │  │  ┌──────────────────┐│  │  └─────────┘
   Todos los        │  │  │ SensorSimulator  ││  │
   clientes         │  │  │  (ESP32 Virtual) ││  │
   reciben el       │  │  │  setInterval 4s  ││  │
   mismo dato       │  │  └──────────────────┘│  │
                    │  └─────────────────────┘  │
                    └────────────────────────────┘
                              ▲    ▲    ▲
                              │    │    │
                         WebSocket broadcast
                              │    │    │
                    ┌─────────┘    │    └──────────┐
                    │              │               │
               ┌────┴────┐   ┌────┴────┐   ┌─────┴────┐
               │React App│   │React App│   │React App │
               │Cliente 1│   │Cliente 2│   │Cliente N │
               └─────────┘   └─────────┘   └──────────┘
```

---
