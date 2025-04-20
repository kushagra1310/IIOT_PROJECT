#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <Stepper.h>

#define STEPS_PER_REV 2048
#define MQ135_PIN 34
#define DHT_PIN 15
#define DHT_TYPE DHT22
// current code on c type wala
Stepper myStepper(STEPS_PER_REV, 19, 18, 5, 17); // IN1, IN2, IN3, IN4
const char *ssid = "A35";
const char *password = "ghephukat";
const char *mqtt_server = "iot-team46.duckdns.org";
const char *FAN_CONTROL_TOPIC = "temphumid_code/fan_control";
const char *thingspeak_api_key = "A16L3833TPH0H3JF";
const char *thingspeak_server = "http://api.thingspeak.com/update";

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

bool fanRunning = false;
unsigned long previousFanMillis = 0;
const long fanInterval = 50; // Fan step interval
unsigned long lastSensorRead = 0;

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

void callback(char *topic, byte *payload, unsigned int length)
{
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  char message[length + 1];
  for (int i = 0; i < length; i++)
  {
    message[i] = (char)payload[i];
  }
  message[length] = '\0';
  Serial.println(message);

  if (strcmp(topic, FAN_CONTROL_TOPIC) == 0)
  {
    if (strcmp(message, "ON") == 0)
    {
      Serial.println("Fan status set to ON");
      fanRunning = true;
    }
    else if (strcmp(message, "OFF") == 0)
    {
      Serial.println("Fan status set to OFF");
      fanRunning = false;
    }
  }
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32Client"))
    {
      Serial.println("Connected!");
      client.subscribe(FAN_CONTROL_TOPIC);
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
  myStepper.setSpeed(30); // RPM
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  dht.begin();
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  unsigned long currentMillis = millis();

  if (fanRunning && currentMillis - previousFanMillis >= fanInterval)
  {
    previousFanMillis = currentMillis;
    myStepper.step(1); // Continuous rotation
  }

  if (currentMillis - lastSensorRead >= 5000)
  {
    lastSensorRead = currentMillis;

    int sensorValue = analogRead(MQ135_PIN);
    float voltage = sensorValue * (3.3 / 4095.0);
    float co2_ppm = voltage * 200; // Calibration dependent

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
  }
}