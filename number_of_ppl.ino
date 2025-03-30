#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials
const char* ssid = "D's S23 FE";      // Replace with your WiFi SSID
const char* password = "Vyas@0101";   // Replace with your WiFi Password

// ThingSpeak API details
const char* server = "http://api.thingspeak.com/update";
const char* apiKey = "A16L3833TPH0H3JF";  // ThingSpeak API Key

// Define pins for sensors
const int trigPin = 12;  // HC-SR04 Trigger
const int echoPin = 13;  // HC-SR04 Echo
const int irPin = 14;    // IR Sensor

// Speed of sound in cm/us
const float speedOfSound = 0.0343; 

// People count variable
int peopleInRoom = 0;

void setup() {
    Serial.begin(115200);

    // Connect to Wi-Fi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi...");
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    // Set sensor pins
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(irPin, INPUT);
}

// Function to get distance from HC-SR04 in cm
float getDistance() {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    
    long duration = pulseIn(echoPin, HIGH);
    
    return (duration * speedOfSound) / 2; // Distance in cm
}

// Function to send data to ThingSpeak
void sendToThingSpeak(int count) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        
        String url = String(server) + "?api_key=" + apiKey +
                     "&field4=" + String(count);
        
        http.begin(url);
        int httpResponseCode = http.GET();
        
        if (httpResponseCode > 0) {
            Serial.print("ThingSpeak Response: ");
            Serial.println(httpResponseCode);
        } else {
            Serial.print("Error sending data to ThingSpeak: ");
            Serial.println(httpResponseCode);
        }
        
        http.end();
    } else {
        Serial.println("WiFi not connected. Skipping ThingSpeak update.");
    }
}

void loop() {
    int irStatus = digitalRead(irPin);
    float distance = getDistance();

    if (irStatus == LOW) { // IR detects motion
        Serial.println("IR Sensor Triggered!");

        delay(500); // Avoid multiple triggers

        float newDistance = getDistance();
        if (newDistance < 50) { // If distance decreases, a person is passing
            Serial.println("Person detected!");

            delay(500);
            if (distance > newDistance) {
                peopleInRoom++;
                Serial.println("Person Entered! Total: " + String(peopleInRoom));
            } else if (peopleInRoom > 0) { // Prevent negative count
                peopleInRoom--;
                Serial.println("Person Exited! Total: " + String(peopleInRoom));
            }

            // Send updated count to ThingSpeak
            sendToThingSpeak(peopleInRoom);
        }
    }

    delay(100); // Delay before next reading
}
