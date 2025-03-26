#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Servo.h>

// WiFi credentials
const char* ssid = "Samarth's iPhone";
const char* password = "abcdef123";

// MQTT broker details
const char* mqtt_server = "172.20.10.2";
const char* mqtt_topic = "climate_control/temp_humidity";
const char* actuator_topic = "climate_control/fan_cmd";  // New actuator command topic

WiFiClient espClient;
PubSubClient client(espClient);

// DHT Sensor settings
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Servo settings
#define SERVO_PIN 5
Servo fanServo;

// Handle MQTT messages (Fan control)
void callback(char* topic, byte* payload, unsigned int length) {
    String message = "";
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.print("Received command: ");
    Serial.println(message);

    if (message == "FAN_ON") {
        fanServo.write(90);
    } else if (message == "FAN_OFF") {
        fanServo.write(0);
    }
}

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
    client.setCallback(callback);
    reconnect();

    dht.begin();
    fanServo.attach(SERVO_PIN);
    fanServo.write(0);  // Default to OFF
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
            client.subscribe(actuator_topic);
        } else {
            Serial.print(" failed, rc=");
            Serial.print(client.state());
            Serial.println(" trying again in 5 seconds");
            delay(5000);
        }
    }
}
