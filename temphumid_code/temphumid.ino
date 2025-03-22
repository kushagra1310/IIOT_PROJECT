#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// Wi-Fi credentials
const char* ssid = "A35";
const char* password = "ghephukat";

// ThingSpeak API
String apiKey = "QBPN6Z90QFJIEZGE";
const char* server = "http://api.thingspeak.com/update";


// DHT22 setup
#define DHTPIN 4       // GPIO pin for DHT22 data
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  
  dht.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // --- DHT22 Sensor Read ---
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
      humidity = 0;
      temperature = 0;
    }

    // Print to Serial for debugging
    Serial.println("----------- DATA -----------");
    Serial.print("Temperature (°C): "); Serial.println(temperature);
    Serial.print("Humidity (%): "); Serial.println(humidity);
    Serial.println("----------------------------");

    // --- Send to ThingSpeak ---
    HTTPClient http;
    String url = server;
    url += "?api_key=" + apiKey;
    url += "&field1=" + String(temperature);      // Temperature
    url += "&field2=" + String(humidity);         // Humidity

    http.begin(url);
    int httpCode = http.GET();

    if (httpCode > 0) {
      Serial.println("Data sent to ThingSpeak!");
    } else {
      Serial.print("Error sending data: ");
      Serial.println(httpCode);
    }

    http.end();
  } else {
    Serial.println("Wi-Fi disconnected!");
  }

  delay(15000); // ThingSpeak free account updates every 15s
}
