#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "A35";      // Replace with your WiFi SSID
const char* password = "ghephukat";   // Replace with your WiFi Password

// MQTT Broker settings
const char* mqtt_server = "192.168.22.225";
const char* mqtt_topic = "room/peopleCount";

WiFiClient espClient;
PubSubClient client(espClient);

// Sensor pins
const int trigPin = 12;  // HC-SR04 Trigger
const int echoPin = 13;  // HC-SR04 Echo
const int irPin = 14;    // IR Sensor

// Speed of sound in cm/us
const float speedOfSound = 0.0343;

// People count
int peopleInRoom = 0;

// WiFi Connection
void setup_wifi() {
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
}

// MQTT Reconnection Logic
void reconnect() {
    while (!client.connected()) {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32_PeopleCounter")) {
            Serial.println("connected!");
        } else {
            Serial.print("failed, retrying in 5s...");
            delay(5000);
        }
    }
}

// Get distance from ultrasonic sensor
float getDistance() {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    long duration = pulseIn(echoPin, HIGH);
    return (duration * speedOfSound) / 2; // cm
}

// Publish data to MQTT
void publishCount(int count) {
    if (client.connected()) {
        String payload = String(count);
        client.publish(mqtt_topic, payload.c_str());
        Serial.println("Published to MQTT: " + payload);
    } else {
        Serial.println("MQTT not connected, skipping publish.");
    }
}

void setup() {
    Serial.begin(115200);
    setup_wifi();

    client.setServer(mqtt_server, 1883);

    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(irPin, INPUT);
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    int irStatus = digitalRead(irPin);
    float distance = getDistance();

    if (irStatus == LOW) {  // IR motion detected
        Serial.println("IR Sensor Triggered!");
        delay(500);

        float newDistance = getDistance();
        if (newDistance < 50) {  // Close enough to be a person
            Serial.println("Person detected!");

            delay(500);
            if (distance > newDistance) {
                peopleInRoom++;
                Serial.println("Person Entered! Total: " + String(peopleInRoom));
            } else if (peopleInRoom > 0) {
                peopleInRoom--;
                Serial.println("Person Exited! Total: " + String(peopleInRoom));
            }

            // Send to MQTT
            publishCount(peopleInRoom);
        }
    }

    delay(100); // Small loop delay
}
