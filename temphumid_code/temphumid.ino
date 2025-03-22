// temp-humidity.ino

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT broker details
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
const char* mqtt_topic = "climate_control/temp_humidity";

WiFiClient espClient;
PubSubClient client(espClient);

// DHT Sensor settings
#define DHTPIN 4  // GPIO where DHT sensor is connected
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);

    Serial.print("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" Connected!");

    client.setServer(mqtt_server, 1883);
    reconnect();
    
    dht.begin();
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }

    // Publish temperature and humidity as JSON
    String payload = "{\"temperature\":" + String(temperature) + ", \"humidity\":" + String(humidity) + "}";
    client.publish(mqtt_topic, payload.c_str());

    Serial.println("Published: " + payload);
    
    delay(5000);  // Send data every 5 seconds
}

void reconnect() {
    while (!client.connected()) {
        Serial.print("Attempting MQTT connection...");
        if (client.connect("ESP32_Client")) {
            Serial.println(" connected!");
        } else {
            Serial.print(" failed, rc=");
            Serial.print(client.state());
            Serial.println(" trying again in 5 seconds");
            delay(5000);
        }
    }
}
