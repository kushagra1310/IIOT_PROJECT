#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
// #include <Stepper.h>

// #define STEPS_PER_REV 2048  // Full steps per revolution

// Stepper myStepper(STEPS_PER_REV, 33, 25, 26, 12); // IN1, IN2, IN3, IN4

#define DHTPIN 4  // Change this to the pin connected to the DHT sensor
#define DHTTYPE DHT22  // Use DHT22 depending on your sensor
DHT dht(DHTPIN, DHTTYPE);

const char* ssid = "A35";
const char* password = "ghephukat";
const char* mqtt_broker = "192.168.22.225";
const char* temp_humid_topic = "temphumid_code/temp_humidity";
const char* fan_control_topic = "temphumid_code/fan_control";

WiFiClient espClient;
PubSubClient client(espClient);

const int LED_PIN = 2;  // Change to your LED pin

void connectWiFi() {
    Serial.print("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
}

void connectMQTT() {
    client.setServer(mqtt_broker, 1883);
    // client.setCallback(callback);
    
    while (!client.connected()) {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32_Client")) {
            Serial.println("Connected to MQTT broker!");
            client.subscribe(fan_control_topic);
            Serial.println("Subscribed to fan control topic.");
        } else {
            Serial.print("Failed, rc=");
            Serial.print(client.state());
            Serial.println(" Retrying in 5 seconds...");
            delay(5000);
        }
    }
}

// void callback(char* topic, byte* payload, unsigned int length) {
//     Serial.println("=== CALLBACK FUNCTION TRIGGERED ===");
//     Serial.print("Message received on topic: ");
//     Serial.println(topic);

//     char message[length + 1];
//     memcpy(message, payload, length);
//     message[length] = '\0';

//     Serial.print("Payload: ");
//     Serial.println(message);

//     StaticJsonDocument<200> doc;
//     DeserializationError error = deserializeJson(doc, message);

//     if (!error && doc.containsKey("fan")) {
//         String fanStatus = doc["fan"].as<String>();
//         Serial.print("Fan Status: ");
//         Serial.println(fanStatus);

//         if (fanStatus == "ON") {
//             digitalWrite(LED_PIN, HIGH);
//             Serial.println("LED turned ON");
//         } else {
//             digitalWrite(LED_PIN, LOW);
//             Serial.println("LED turned OFF");
//         }
//     } else {
//         Serial.println("JSON parsing failed.");
//     }
// }

void publishSensorData() {
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }

    StaticJsonDocument<200> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    
    char buffer[256];
    serializeJson(doc, buffer);
    
    Serial.print("Publishing: ");
    Serial.println(buffer);
    
    client.publish(temp_humid_topic, buffer);
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_PIN, OUTPUT);
    dht.begin();
    connectWiFi();
    connectMQTT();
}

void loop() {
    if (!client.connected()) {
        connectMQTT();
    }
    client.loop();
    
    // Publish sensor data every 5 seconds
    publishSensorData();
    delay(3000);
}
