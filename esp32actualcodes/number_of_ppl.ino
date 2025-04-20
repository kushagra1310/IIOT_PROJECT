#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>

// WiFi credentials
const char *ssid = "A35";           // Replace with your WiFi SSID
const char *password = "ghephukat"; // Replace with your WiFi Password

// ThingSpeak configuration
const char *thingspeak_server = "http://api.thingspeak.com/update";
const char *thingspeak_api_key = "A16L3833TPH0H3JF";
const int field_number = 4;

// MQTT Broker configuration
const char *mqtt_server = "iot-team46.duckdns.org";
const char *mqtt_topic = "room/peopleCount";

// Sensor pins
const int trigPin = 12; // HC-SR04 Trigger
const int echoPin = 13; // HC-SR04 Echo
const int irPin = 14;   // IR Sensor

// Speed of sound in cm/us
const float speedOfSound = 0.0343;

// People count
int peopleInRoom = 0;

// WiFi & MQTT clients
WiFiClient espClient;
PubSubClient client(espClient);

// WiFi connection setup
void setup_wifi()
{
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
}

// MQTT connection setup
void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32_PeopleCounter"))
        {
            Serial.println("connected!");
        }
        else
        {
            Serial.print("failed, retrying in 5s. Error: ");
            Serial.println(client.state());
            delay(5000);
        }
    }
}

// Get distance from ultrasonic sensor
float getDistance()
{
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
    if (duration == 0)
        return 999;                       // Return large value if timeout
    return (duration * speedOfSound) / 2; // Convert to cm
}

// Send count to MQTT
void publishCount(int count)
{
    if (client.connected())
    {
        String payload = String(count);
        client.publish(mqtt_topic, payload.c_str());
        Serial.println("Published to MQTT: " + payload);
    }
    else
    {
        Serial.println("MQTT not connected, skipping publish.");
    }
}

// Send count to ThingSpeak
void sendToThingSpeak(int count)
{
    if (WiFi.status() == WL_CONNECTED)
    {
        HTTPClient http;
        String url = String(thingspeak_server) + "?api_key=" + thingspeak_api_key + "&field" + String(field_number) + "=" + String(count);

        http.begin(url);
        int httpCode = http.GET();
        if (httpCode > 0)
        {
            Serial.println("ThingSpeak Response Code: " + String(httpCode));
        }
        else
        {
            Serial.println("ThingSpeak Error: " + http.errorToString(httpCode));
        }
        http.end();
    }
    else
    {
        Serial.println("WiFi not connected, can't send to ThingSpeak");
    }
}

void setup()
{
    Serial.begin(115200);
    setup_wifi();

    client.setServer(mqtt_server, 1883);

    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(irPin, INPUT);
}

void loop()
{
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();

    int irStatus = digitalRead(irPin);
    float initialDistance = getDistance();

    if (irStatus == LOW)
    { // IR motion detected
        Serial.println("IR Sensor Triggered!");
        delay(500);

        float newDistance = getDistance();
        if (newDistance < 50)
        { // Close enough to be a person
            Serial.println("Person detected!");

            delay(500);
            if (initialDistance > newDistance)
            {
                peopleInRoom++;
                Serial.println("Person Entered! Total: " + String(peopleInRoom));
            }
            else if (peopleInRoom > 0)
            {
                peopleInRoom--;
                Serial.println("Person Exited! Total: " + String(peopleInRoom));
            }

            publishCount(peopleInRoom);
            sendToThingSpeak(peopleInRoom);
        }
    }

    delay(100); // Loop delay
}