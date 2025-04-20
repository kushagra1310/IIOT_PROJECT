#include <WiFi.h>
#include <PubSubClient.h>
#include <Servo.h> // Include the Servo library

// WiFi & MQTT Configuration
const char *ssid = "A35";
const char *password = "ghephukat";
const char *mqtt_server = "team46.duckdns.org";
const char *WINDOW_CONTROL_TOPIC = "temphumid_code/window_control";

// Servo Motor Configuration
#define SERVO_PIN 33 // Servo signal pin

Servo windowServo;
bool window_open = false; // Track window status

WiFiClient espClient;
PubSubClient client(espClient);

// WiFi Connection
void setup_wifi()
{
    Serial.print("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
}

// MQTT Reconnect
void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32_Window"))
        {
            Serial.println("connected!");
            client.subscribe(WINDOW_CONTROL_TOPIC);
        }
        else
        {
            Serial.print("failed, retrying in 5s...");
            delay(5000);
        }
    }
}

// MQTT Callback - Handles Incoming Messages
void callback(char *topic, byte *payload, unsigned int length)
{
    String message;
    for (int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }

    Serial.print("Received message: ");
    Serial.println(message);

    if (message.indexOf("OPEN") != -1 && !window_open)
    {
        Serial.println("Opening window...");
        windowServo.write(90); // Adjust to desired open angle
        window_open = true;
    }
    else if (message.indexOf("CLOSE") != -1 && window_open)
    {
        Serial.println("Closing window...");
        windowServo.write(0); // Adjust to desired closed angle
        window_open = false;
    }
}

void setup()
{
    Serial.begin(115200);
    setup_wifi();

    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);

    windowServo.attach(SERVO_PIN); // Attach servo to pin 33
    windowServo.write(0);          // Start in closed position
}

void loop()
{
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();
}
