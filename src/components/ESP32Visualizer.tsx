import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  Cpu, 
  ArrowRight, 
  Terminal, 
  Radio, 
  Copy, 
  Check, 
  Layers, 
  ShieldCheck, 
  Globe, 
  Server,
  Zap,
  Play,
  Pause,
  Trash2,
  Share2,
  Code2
} from 'lucide-react';

interface ESP32VisualizerProps {
  voltage: number;
  rawIW64: number;
  engFilt: number;
  roc: number;
  shockAlm: boolean;
  pumpCmd: boolean;
  temperature: number;
  sampleTimeMs: number;
  onFlickFast: () => void;
}

export const ESP32Visualizer: React.FC<ESP32VisualizerProps> = ({
  voltage,
  rawIW64,
  engFilt,
  roc,
  shockAlm,
  pumpCmd,
  temperature,
  sampleTimeMs,
  onFlickFast,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'settimino' | 'modbus' | 'mqtt'>('settimino');
  const [copied, setCopied] = useState<boolean>(false);
  const [isConsoleActive, setIsConsoleActive] = useState<boolean>(true);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Simulated ESP32 Serial Monitor Feed
  useEffect(() => {
    if (!isConsoleActive) return;

    const interval = window.setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const absRoc = Math.abs(roc);

      let logMsg = '';
      if (shockAlm) {
        logMsg = `[${timeStr}] ⚠️ [ALERT] SHOCK TRIGGERED! RoC: ${roc > 0 ? '+' : ''}${roc.toFixed(1)} %/s > 30.0 %/s | Q0.1 = HIGH | MQTT Pub: topic="hcmut/s7_1200/alarm" payload={"shock": true, "roc": ${roc.toFixed(1)}}`;
      } else {
        logMsg = `[${timeStr}] [POLL 102] AI0_RAW: ${rawIW64} | Volt: ${voltage.toFixed(2)}V | Level: ${engFilt.toFixed(1)}% | RoC: ${roc.toFixed(1)} %/s | Pump: ${pumpCmd ? 'ON' : 'OFF'} | Temp: ${temperature.toFixed(1)}°C`;
      }

      setSerialLogs(prev => {
        const next = [...prev, logMsg];
        return next.slice(-60); // keep last 60 lines
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isConsoleActive, voltage, rawIW64, engFilt, roc, shockAlm, pumpCmd, temperature]);

  useEffect(() => {
    if (consoleEndRef.current && isConsoleActive) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, isConsoleActive]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Code Snippets for ESP32
  const SETTIMINO_CODE = `/*
 * HCMUT MECHATRONICS - S7-1200 to ESP32 Gateway via Settimino (S7comm Port 102)
 * Thư viện: Settimino by Davide Nardella
 * Hỗ trợ: ESP32 WiFi trực tiếp đọc bộ nhớ %MD, %MW, DB của PLC Siemens
 */
#include <WiFi.h>
#include "Settimino.h"

// 1. Cấu hình mạng Wi-Fi
const char* ssid     = "HCMUT_LAB_WIFI";
const char* password = "Mechatronics2026";

// 2. Cấu hình IP PLC S7-1200
IPAddress plcIp(192, 168, 0, 1); // Địa chỉ IP của CPU S7-1200
S7Client Client;

// Biến lưu dữ liệu đọc được từ S7-1200
float current_RoC = 0.0;
bool shockAlarm = false;
float tankLevel = 0.0;
int rawADC = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Kết nối Wi-Fi
  Serial.print("Đang kết nối WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! ESP32 IP: " + WiFi.localIP().toString());

  // Kết nối giao thức S7 Communication tới PLC S7-1200 (Rack 0, Slot 1)
  Client.SetConnectionType(CONNTYPE_BASIC);
  int res = Client.ConnectTo(plcIp, 0, 1);
  if (res == 0) {
    Serial.println(">>> Kết nối PLC Siemens S7-1200 THÀNH CÔNG! <<<");
  } else {
    Serial.print("Lỗi kết nối S7-1200, mã lỗi: ");
    Serial.println(res);
  }
}

void loop() {
  if (!Client.Connected) {
    Serial.println("Mất kết nối S7-1200, đang thử kết nối lại...");
    Client.ConnectTo(plcIp, 0, 1);
    delay(2000);
    return;
  }

  // 1. Đọc giá trị RoC (%MD32 - kiểu REAL 32-bit float)
  // S7AreaMK = Vùng nhớ Merker (M)
  byte bufferMD32[4];
  int readRoC = Client.ReadArea(S7AreaMK, 0, 32, 4, bufferMD32);
  if (readRoC == 0) {
    // Đảo byte từ Big-Endian (Siemens) sang Little-Endian (ESP32)
    uint32_t rawDWord = (bufferMD32[0] << 24) | (bufferMD32[1] << 16) | (bufferMD32[2] << 8) | bufferMD32[3];
    memcpy(&current_RoC, &rawDWord, sizeof(float));
  }

  // 2. Đọc cờ cảnh báo sốc ShockAlm (%Q0.1)
  byte bufferQ[1];
  int readQ = Client.ReadArea(S7AreaPA, 0, 0, 1, bufferQ); // S7AreaPA = Process Outputs (%Q)
  if (readQ == 0) {
    shockAlarm = (bufferQ[0] & 0x02) != 0; // Bit 1 của byte 0 (%Q0.1)
  }

  // 3. Hiển thị lên Serial Monitor
  Serial.printf("[S7-1200] RoC: %.2f %%/s | ShockAlm: %s\\n", 
                current_RoC, shockAlarm ? "TRIP (ALARM ON!)" : "NORMAL");

  // Xử lý khi có sốc
  if (shockAlarm) {
    // Kích hoạt còi chíp trên ESP32 hoặc gửi thông báo Push Notification
    Serial.println(">>> PHÁT HIỆN SỐC/RUNG CHẤN TỪ S7-1200! <<<");
  }

  delay(50); // Chu kỳ lấy mẫu 50ms
}`;

  const MODBUS_CODE = `/*
 * HCMUT MECHATRONICS - S7-1200 to ESP32 via Modbus TCP (Port 502)
 * Thư viện: Modbus-esp8266 by Alexander Emelianov
 * S7-1200 chạy khối MB_SERVER, ESP32 đóng vai trò Modbus TCP Client
 */
#include <WiFi.h>
#include <ModbusIP_ESP8266.h>

const char* ssid     = "HCMUT_LAB_WIFI";
const char* password = "Mechatronics2026";
IPAddress plcIp(192, 168, 0, 1); // IP của S7-1200

ModbusIP mb;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi connected! IP: " + WiFi.localIP().toString());

  mb.client(); // Khởi tạo ESP32 làm Modbus Master/Client
}

void loop() {
  mb.task(); // Duy trì tác vụ Modbus TCP

  // Kết nối tới PLC S7-1200 nếu chưa kết nối
  if (!mb.isConnected(plcIp)) {
    mb.connect(plcIp, 502);
    delay(500);
    return;
  }

  // Đọc 2 thanh ghi Holding Register bắt đầu từ địa chỉ 40001 (chứa giá trị RoC)
  uint16_t regBuffer[2];
  if (mb.readHreg(plcIp, 0, regBuffer, 2)) {
    // Chuyển 2 thanh ghi 16-bit thành 1 số thực 32-bit (Float)
    uint32_t dword = ((uint32_t)regBuffer[0] << 16) | regBuffer[1];
    float rocVal;
    memcpy(&rocVal, &dword, sizeof(float));

    Serial.printf("[Modbus TCP] Đọc từ S7-1200: RoC = %.2f %%/s\\n", rocVal);
  }

  delay(100);
}`;

  const MQTT_CODE = `/*
 * HCMUT MECHATRONICS - ESP32 IoT Gateway: S7-1200 -> MQTT Cloud / Dashboard
 * Thư viện: PubSubClient by Nick O'Leary
 * Chức năng: Đọc từ S7-1200 và đẩy lên Broker (Mosquitto/HiveMQ/ThingsBoard)
 */
#include <WiFi.h>
#include <PubSubClient.h>

const char* mqtt_server = "broker.emqx.io";
const int   mqtt_port   = 1883;
const char* mqtt_topic  = "hcmut/lab3/s7_1200/telemetry";

WiFiClient espClient;
PubSubClient client(espClient);

void setup_mqtt() {
  client.setServer(mqtt_server, mqtt_port);
}

void publish_telemetry(float roc, bool shock, float level, float temp) {
  if (!client.connected()) {
    client.connect("ESP32_S71200_Gateway");
  }

  // Đóng gói JSON payload
  char jsonBuffer[256];
  snprintf(jsonBuffer, sizeof(jsonBuffer), 
    "{\\"roc\\":%.2f,\\"shock\\":%s,\\"tank_level\\":%.1f,\\"temperature\\":%.1f,\\"device\\":\\"S7-1200\\"}",
    roc, shock ? "true" : "false", level, temp
  );

  client.publish(mqtt_topic, jsonBuffer);
  Serial.print("[MQTT PUB] ");
  Serial.println(jsonBuffer);
}`;

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/30">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  GIAO TIẾP ONLINE PLC SIEMENS S7-1200 VỚI ESP32 (IoT GATEWAY)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono border border-indigo-800">
                  TCP/IP &amp; Wi-Fi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hoàn toàn CÓ THỂ truyền nhận online theo thời gian thực giữa S7-1200 và ESP32 qua Wi-Fi / Ethernet LAN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onFlickFast}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Thử Xoay Nhanh Núm (Xem ESP32 Báo Động)</span>
            </button>
          </div>
        </div>

        {/* 4 Architecture Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-teal-400" />
              <span>Giao thức S7comm (Settimino)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ESP32 đọc trực tiếp vùng nhớ <code>%MD32</code>, <code>%MW10</code>, <code>%Q</code> của S7-1200 qua cổng <strong>TCP 102</strong>. Không cần viết thêm code truyền thông trên PLC!
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Modbus TCP (Port 502)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              S7-1200 chạy khối <code>MB_SERVER</code>, ESP32 đóng vai trò Client đọc các thanh ghi Holding Registers. Chuẩn công nghiệp mở, ổn định cao.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Cầu nối IoT Cloud &amp; MQTT</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ESP32 đóng vai trò <strong>IoT Gateway</strong>: Vừa đọc dữ liệu từ PLC vừa đẩy lên ThingsBoard, Blynk, AWS hoặc điện thoại di động qua Wi-Fi.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Tốc độ đáp ứng &lt; 20 ms</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Đủ nhanh để giám sát các sự kiện sốc/rung chấn của Task 10 (Ts = 10ms) mà không bị nghẽn mạng.
            </p>
          </div>
        </div>
      </div>

      {/* Network Topology & Live Architecture Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-400" />
            <span>Sơ đồ Kết nối Mạng Truyền Thông Thực Tế (Network Topology)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Dải mạng: 192.168.0.x / 24</span>
        </div>

        {/* SVG Network Schematic */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto">
          <svg viewBox="0 0 840 230" className="w-full h-auto min-w-[700px] font-mono">
            {/* Box 1: S7-1200 */}
            <rect x="30" y="40" width="200" height="150" rx="10" fill="#090d16" stroke="#14b8a6" strokeWidth="2" />
            <text x="130" y="70" fill="#2dd4bf" fontSize="13" fontWeight="bold" textAnchor="middle">SIEMENS S7-1200</text>
            <text x="130" y="90" fill="#94a3b8" fontSize="11" textAnchor="middle">CPU 1214C DC/DC/DC</text>
            <rect x="50" y="105" width="160" height="30" rx="4" fill="#1e293b" />
            <text x="130" y="125" fill="#38bdf8" fontSize="11" textAnchor="middle">IP: 192.168.0.1</text>
            <text x="130" y="165" fill="#f59e0b" fontSize="10" textAnchor="middle">Port 102 (S7comm) / 502</text>

            {/* Box 2: Wi-Fi Router / Switch */}
            <rect x="340" y="60" width="160" height="110" rx="10" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <text x="420" y="90" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">ROUTER WI-FI / SWITCH</text>
            <text x="420" y="110" fill="#94a3b8" fontSize="10" textAnchor="middle">DHCP / LAN Subnet</text>
            <text x="420" y="145" fill="#34d399" fontSize="11" textAnchor="middle">LAN &amp; Wi-Fi 2.4GHz</text>

            {/* Box 3: ESP32 */}
            <rect x="610" y="40" width="200" height="150" rx="10" fill="#090d16" stroke="#6366f1" strokeWidth="2" />
            <text x="710" y="70" fill="#818cf8" fontSize="13" fontWeight="bold" textAnchor="middle">ESP32 Dev Module</text>
            <text x="710" y="90" fill="#94a3b8" fontSize="11" textAnchor="middle">Dual Core 240MHz + WiFi</text>
            <rect x="630" y="105" width="160" height="30" rx="4" fill="#1e293b" />
            <text x="710" y="125" fill="#a5b4fc" fontSize="11" textAnchor="middle">IP: 192.168.0.50</text>
            <text x="710" y="165" fill="#34d399" fontSize="10" textAnchor="middle">Settimino / Modbus Client</text>

            {/* Connection Lines */}
            {/* S7-1200 to Router (Ethernet Cable) */}
            <line x1="230" y1="115" x2="340" y2="115" stroke="#38bdf8" strokeWidth="3" strokeDasharray="4 2" />
            <text x="285" y="105" fill="#38bdf8" fontSize="10" textAnchor="middle">RJ45 Cat5e</text>

            {/* Router to ESP32 (Wireless / Wi-Fi Waves) */}
            <line x1="500" y1="115" x2="610" y2="115" stroke="#818cf8" strokeWidth="3" strokeDasharray="4 2" />
            <text x="555" y="105" fill="#818cf8" fontSize="10" textAnchor="middle">Wi-Fi (802.11 b/g/n)</text>
          </svg>
        </div>
      </div>

      {/* Live ESP32 Serial Monitor & Packet Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Mô Phỏng Cổng Nối Tiếp ESP32 (Serial Monitor @ 115200 Baud)
            </span>
            <span className={`w-2 h-2 rounded-full ${isConsoleActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsConsoleActive(!isConsoleActive)}
              className={`px-3 py-1 rounded-lg border font-semibold transition-all ${
                isConsoleActive ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isConsoleActive ? 'Tạm Dừng Feed' : 'Tiếp Tục Feed'}
            </button>
            <button
              onClick={() => setSerialLogs([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Xóa màn hình Serial"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Console Box */}
        <div className="bg-black/90 rounded-xl p-4 border border-slate-800 font-mono text-xs max-h-56 overflow-y-auto space-y-1 select-text">
          {serialLogs.length === 0 ? (
            <div className="text-slate-500 py-4 text-center font-sans">
              Đang chờ dữ liệu gói tin từ CPU S7-1200...
            </div>
          ) : (
            serialLogs.map((log, index) => (
              <div 
                key={index} 
                className={`${
                  log.includes('[ALERT]') 
                    ? 'text-rose-400 font-bold bg-rose-950/40 px-1 py-0.5 rounded' 
                    : 'text-emerald-300/90'
                }`}
              >
                {log}
              </div>
            ))
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>

      {/* Code Repository for ESP32 & TIA Portal Configuration Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Mã Nguồn C++ Hoàn Chỉnh Cho ESP32 (Arduino IDE / PlatformIO)
            </span>
          </div>

          {/* Subtabs for Code */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveCodeTab('settimino')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeCodeTab === 'settimino' 
                  ? 'bg-teal-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Settimino (S7comm - Khuyên Dùng)
            </button>
            <button
              onClick={() => setActiveCodeTab('modbus')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeCodeTab === 'modbus' 
                  ? 'bg-teal-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Modbus TCP (Port 502)
            </button>
            <button
              onClick={() => setActiveCodeTab('mqtt')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeCodeTab === 'mqtt' 
                  ? 'bg-teal-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Cầu Nối MQTT Cloud
            </button>
          </div>
        </div>

        {/* Code Content Box with Copy Button */}
        <div className="relative bg-slate-950">
          <button
            onClick={() => {
              const codeToCopy = 
                activeCodeTab === 'settimino' ? SETTIMINO_CODE :
                activeCodeTab === 'modbus' ? MODBUS_CODE : MQTT_CODE;
              handleCopyCode(codeToCopy);
            }}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-md"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép mã C++'}</span>
          </button>

          <pre className="p-5 text-xs font-mono text-teal-200 overflow-x-auto leading-relaxed max-h-96 overflow-y-auto selection:bg-teal-900 selection:text-white">
            <code>
              {activeCodeTab === 'settimino' && SETTIMINO_CODE}
              {activeCodeTab === 'modbus' && MODBUS_CODE}
              {activeCodeTab === 'mqtt' && MQTT_CODE}
            </code>
          </pre>
        </div>

        {/* Critical TIA Portal Settings for ESP32 */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 space-y-3 leading-relaxed">
          <div className="font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>2 BƯỚC BẮT BUỘC TRONG TIA PORTAL ĐỂ ESP32 KẾT NỐI ĐƯỢC:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-amber-300 block">Bước 1: Bật quyền truy cập PUT/GET</strong>
              <p className="text-slate-400 text-[11px]">
                Trong TIA Portal → Mở <strong>Device configuration</strong> → Chọn CPU S7-1200 → Tab <strong>Properties</strong> → <strong>Protection &amp; Security</strong> → <strong>Connection mechanisms</strong> → Đánh dấu tích vào ô:
                <br />
                <span className="text-teal-300 font-mono font-bold">"Permit access with PUT/GET communication from remote partner"</span>.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-amber-300 block">Bước 2: Tắt Optimized Block Access (nếu dùng DB)</strong>
              <p className="text-slate-400 text-[11px]">
                Nếu ESP32 đọc từ khối Data Block (DB), nhấp chuột phải vào DB → <strong>Properties</strong> → <strong>Attributes</strong> → Bỏ dấu chọn ở mục:
                <br />
                <span className="text-teal-300 font-mono font-bold">"Optimized block access"</span> (để chuyển sang chuẩn địa chỉ Offset chuẩn).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
