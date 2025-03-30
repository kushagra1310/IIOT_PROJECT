#include <WiFi.h>
#include <PubSubClient.h>
#include <Stepper.h>

// WiFi & MQTT Configuration
const char* ssid = "A35";
const char* password = "ghephukat";
const char* mqtt_server = "192.168.22.225";
const char* WINDOW_CONTROL_TOPIC = "temphumid_code/window_control";

// Stepper Motor Configuration
#define STEPS_PER_REV 200  // Adjust based on motor specs
#define STEP_PIN_1 13
#define STEP_PIN_2 12
#define STEP_PIN_3 14
#define STEP_PIN_4 27

Stepper stepper(STEPS_PER_REV, STEP_PIN_1, STEP_PIN_3, STEP_PIN_2, STEP_PIN_4);
WiFiClient espClient;
PubSubClient client(espClient);

bool window_open = false; // Track window status

// WiFi Connection
void setup_wifi() {
    Serial.print("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
}

// MQTT Reconnect
void reconnect() {
    while (!client.connected()) {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32_Window")) {
            Serial.println("connected!");
            client.subscribe(WINDOW_CONTROL_TOPIC);
        } else {
            Serial.print("failed, retrying in 5s...");
            delay(5000);
        }
    }
}

// MQTT Callback - Handles Incoming Messages
void callback(char* topic, byte* payload, unsigned int length) {
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.print("Received message: ");
    Serial.println(message);

    if (message.indexOf("OPEN") != -1 && !window_open) {
        Serial.println("Opening window...");
        stepper.setSpeed(10);  // Adjust speed
        stepper.step(1000);    // Adjust steps to fully open
        window_open = true;
    } else if (message.indexOf("CLOSE") != -1 && window_open) {
        Serial.println("Closing window...");
        stepper.setSpeed(10);
        stepper.step(-1000);   // Reverse steps to close
        window_open = false;
    }
}

void setup() {
    Serial.begin(115200);
    setup_wifi();

    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);

    stepper.setSpeed(10);  // Set initial speed
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();
}
