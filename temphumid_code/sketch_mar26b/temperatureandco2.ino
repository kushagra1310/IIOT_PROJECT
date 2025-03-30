#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define MQ135_PIN 34  // Use an ADC pin for ESP32
#define DHT_PIN 4      // GPIO4 for DHT sensor
#define DHT_TYPE DHT22 // Change to DHT22 if using that model

const char* ssid = "A35";
const char* password = "ghephukat";
const char* mqtt_server = "192.168.22.225";  // Replace with Mosquitto broker IP

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

void setup_wifi() {
    Serial.print("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
}

void reconnect() {
    while (!client.connected()) {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32Client")) {
            Serial.println("Connected!");
        } else {
            Serial.print("Failed, retrying in 5s...");
            delay(5000);
        }
    }
}

void setup() {
    Serial.begin(115200);
    setup_wifi();
    client.setServer(mqtt_server, 1883);
    dht.begin();
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    // Read CO₂ Sensor (MQ135)
    int sensorValue = analogRead(MQ135_PIN);
    float voltage = sensorValue * (3.3 / 4095.0);  // Convert to voltage
    float co2_ppm = voltage * 200;  // Adjust based on calibration

    Serial.print("CO2 Level: ");
    Serial.print(co2_ppm);
    Serial.println(" ppm");

    char co2_msg[10];
    dtostrf(co2_ppm, 6, 2, co2_msg);
    client.publish("sensor/co2", co2_msg);

    // Read Temperature & Humidity (DHT)
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (!isnan(temperature) && !isnan(humidity)) {
        Serial.print("Temperature: ");
        Serial.print(temperature);
        Serial.print("°C, Humidity: ");
        Serial.print(humidity);
        Serial.println("%");

        char temp_humid_msg[50];
        snprintf(temp_humid_msg, sizeof(temp_humid_msg), "{\"temperature\": %.2f, \"humidity\": %.2f}", temperature, humidity);
        client.publish("temphumid_code/temp_humidity", temp_humid_msg);
    } else {
        Serial.println("Failed to read from DHT sensor!");
    }

    delay(5000);  // Publish every 5 seconds
}
