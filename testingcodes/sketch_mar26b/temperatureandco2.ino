#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <HTTPClient.h> // For ThingSpeak

#define MQ135_PIN 34
#define DHT_PIN 4
#define DHT_TYPE DHT22

const char *ssid = "A35";
const char *password = "ghephukat";
const char *mqtt_server = "team46.duckdns.org";

// Replace with your ThingSpeak Write API Key
const char *thingspeak_api_key = "A16L3833TPH0H3JF";
const char *thingspeak_server = "http://api.thingspeak.com/update";

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

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

void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Connecting to MQTT...");
        if (client.connect("ESP32Client"))
        {
            Serial.println("Connected!");
        }
        else
        {
            Serial.print("Failed, retrying in 5s...");
            delay(5000);
        }
    }
}

void setup()
{
    Serial.begin(115200);
    setup_wifi();
    client.setServer(mqtt_server, 1883);
    dht.begin();
}

void loop()
{
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();

    int sensorValue = analogRead(MQ135_PIN);
    float voltage = sensorValue * (3.3 / 4095.0);
    float co2_ppm = voltage * 200; // Adjust based on your calibration

    Serial.print("CO2 Level: ");
    Serial.print(co2_ppm);
    Serial.println(" ppm");

    char co2_msg[10];
    dtostrf(co2_ppm, 6, 2, co2_msg);
    client.publish("sensor/co2", co2_msg);

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (!isnan(temperature) && !isnan(humidity))
    {
        Serial.print("Temperature: ");
        Serial.print(temperature);
        Serial.print("°C, Humidity: ");
        Serial.print(humidity);
        Serial.println("%");

        char temp_humid_msg[50];
        snprintf(temp_humid_msg, sizeof(temp_humid_msg),
                 "{\"temperature\": %.2f, \"humidity\": %.2f}", temperature, humidity);
        client.publish("temphumid_code/temp_humidity", temp_humid_msg);

        // ---- ThingSpeak Update ----
        if (WiFi.status() == WL_CONNECTED)
        {
            HTTPClient http;
            String url = String(thingspeak_server) + "?api_key=" + thingspeak_api_key +
                         "&field1=" + String(temperature) +
                         "&field2=" + String(humidity) +
                         "&field3=" + String(co2_ppm);
            http.begin(url);
            int httpResponseCode = http.GET();
            if (httpResponseCode > 0)
            {
                Serial.print("ThingSpeak response: ");
                Serial.println(httpResponseCode);
            }
            else
            {
                Serial.print("Error sending to ThingSpeak: ");
                Serial.println(httpResponseCode);
            }
            http.end();
        }
    }
    else
    {
        Serial.println("Failed to read from DHT sensor!");
    }

    delay(5000);
}
