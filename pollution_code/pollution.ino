#include <WiFi.h>
#include <HTTPClient.h>

// Wi-Fi credentials
const char* ssid = "A35";
const char* password = "ghephukat";

// ThingSpeak settings
String apiKey = "C8H3GS99YV98IPBO";  // Replace with your ThingSpeak API Key
const char* server = "http://api.thingspeak.com/update";

// MQ-135 analog pin
const int mq135Pin = 34;

void setup() {
  Serial.begin(115200);

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
    // Step 1: Read raw analog value
    int rawValue = analogRead(mq135Pin);

    // Step 2: Convert to voltage (0 - 3.3V)
    float voltage = rawValue * (3.3 / 4095.0);

    // Step 3: Estimate CO2 PPM (VERY basic estimate for demonstration!)
    // This is NOT accurate without calibration!
    float ppm = voltage * 1000; // e.g., 1.5V = 1500 ppm

    // Step 4: Air Quality Status (simplified thresholds)
    int airQualityStatus = 0;
    if (rawValue < 1200) {
      airQualityStatus = 0;  // Good
    } else if (rawValue < 1500) {
      airQualityStatus = 1;  // Moderate
    } else if (rawValue < 3000) {
      airQualityStatus = 2;  // Bad
    } else {
      airQualityStatus = 3;  // Very Bad
    }

    // Print values for debugging
    Serial.print("Raw ADC: ");
    Serial.print(rawValue);
    Serial.print(" | Voltage: ");
    Serial.print(voltage);
    Serial.print(" V | CO2: ");
    Serial.print(ppm);
    Serial.print(" ppm | Air Quality Status: ");
    Serial.println(airQualityStatus);

    // Step 5: Send data to ThingSpeak
    HTTPClient http;
    String url = server;
    url += "?api_key=" + apiKey;
    url += "&field1=" + String(ppm);               // CO2 PPM
    url += "&field2=" + String(rawValue);          // Raw ADC Value
    url += "&field3=" + String(airQualityStatus);  // Air Quality Index (optional)

    http.begin(url);
    int httpCode = http.GET();

    if (httpCode > 0) {
      Serial.println("Data sent successfully!");
    } else {
      Serial.print("Failed to send data. Error code: ");
      Serial.println(httpCode);
    }

    http.end();
  } else {
    Serial.println("Wi-Fi disconnected!");
  }

  delay(15000);  // ThingSpeak free version updates every 15 seconds
}
