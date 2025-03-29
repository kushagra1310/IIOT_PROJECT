#include <WiFi.h>
#include <PubSubClient.h>

// WiFi Credentials
const char* ssid = "Samarth's iPhone"; 
const char* password = "abcdef123"; 

// ThingSpeak MQTT Credentials
const char* mqtt_server = "mqtt3.thingspeak.com";  // ThingSpeak MQTT Broker
const char* mqtt_api_key = "DW5V6U9DQ2KBKC2H";  // Your ThingSpeak MQTT API Key
const char* channel_write_api_key = "A16L3833TPH0H3JF"; // Replace with your channel's write API key
const char* channel_id = "2895649";  // Replace with your ThingSpeak Channel ID

// Topics for ThingSpeak
String publish_topic = "channels/" + String(channel_id) + "/publish";  // Where data is sent
String subscribe_topic = "channels/" + String(channel_id) + "/subscribe"; // Where actuator commands come in

// WiFi and MQTT Clients
WiFiClient espClient;
PubSubClient client(espClient);

// Sensor & Actuator Pins
#define MQ135_PIN 34  // Air Quality Sensor (Analog)
#define LED_PIN 2      // LED for indication

void setup() {
    Serial.begin(115200);

    // Connect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" Connected!");

    // MQTT Setup
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);
    reconnect();

    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW); // LED OFF by default
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    // Read Air Quality Sensor
    int air_quality = analogRead(MQ135_PIN);
    Serial.print("Air Quality: ");
    Serial.println(air_quality);

    // Publish to ThingSpeak
    String payload = "field1=" + String(air_quality) + "&api_key=" + String(channel_write_api_key);
    client.publish(publish_topic.c_str(), payload.c_str());

    // Auto Control: Turn LED ON if air quality is bad
    if (air_quality > 400) {
        digitalWrite(LED_PIN, HIGH);  // Turn LED ON
    } else {
        digitalWrite(LED_PIN, LOW);   // Turn LED OFF
    }

    delay(5000); // Send data every 5 seconds
}

// Handle incoming MQTT messages (for actuator control)
void callback(char* topic, byte* payload, unsigned int length) {
    String message = "";
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    Serial.print("Received command: ");
    Serial.println(message);

    if (message == "LED_ON") {
        digitalWrite(LED_PIN, HIGH);
    } else if (message == "LED_OFF") {
        digitalWrite(LED_PIN, LOW);
    }
}

// Reconnect to MQTT broker
void reconnect() {
    while (!client.connected()) {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32_Client", "MQTT_USERNAME", mqtt_api_key)) { // Change "MQTT_USERNAME" to your ThingSpeak username
            Serial.println(" connected!");
            client.subscribe(subscribe_topic.c_str());
        } else {
            Serial.print(" failed, rc=");
            Serial.print(client.state());
            Serial.println(" trying again in 5 seconds");
            delay(5000);
        }
    }
}
