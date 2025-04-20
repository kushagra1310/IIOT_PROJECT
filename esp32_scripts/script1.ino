#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ESP32Servo.h>

// WiFi credentials
const char *ssid = "YourWiFiSSID";
const char *password = "YourWiFiPassword";

// MQTT Broker
const char *mqtt_broker = "iot-team46.duckdns.org";
const int mqtt_port = 1883;
const char *mqtt_client_id = "esp32_sensor";

// Pin definitions
#define DHT_PIN 4
#define MQ135_PIN 34
#define ULTRASONIC_TRIG_PIN 5
#define ULTRASONIC_ECHO_PIN 18
#define IR_SENSOR_PIN 19

// Initialize components
DHT dht(DHT_PIN, DHT22);
WiFiClient espClient;
PubSubClient client(espClient);

// Global variables
unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL = 30000; // 30 seconds

void setup()
{
  Serial.begin(115200);

  // Initialize sensors
  dht.begin();
  pinMode(MQ135_PIN, INPUT);
  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  pinMode(IR_SENSOR_PIN, INPUT);

  // Connect to WiFi
  setup_wifi();

  // Setup MQTT
  client.setServer(mqtt_broker, mqtt_port);
}

void setup_wifi()
{
  delay(10);
  Serial.println("Connecting to WiFi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mqtt_client_id))
    {
      Serial.println("connected");
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

float readTemperature()
{
  float temp = dht.readTemperature();
  if (isnan(temp))
  {
    Serial.println("Failed to read temperature from DHT sensor!");
    return -1;
  }
  return temp;
}

float readHumidity()
{
  float humidity = dht.readHumidity();
  if (isnan(humidity))
  {
    Serial.println("Failed to read humidity from DHT sensor!");
    return -1;
  }
  return humidity;
}

int readAirQuality()
{
  int rawValue = analogRead(MQ135_PIN);
  // Convert raw value to PPM (this is a simplified conversion)
  // You might need to calibrate this based on your specific sensor
  int ppm = map(rawValue, 0, 4095, 0, 1000);
  return ppm;
}

bool detectPeople()
{
  // Read IR sensor
  bool irDetected = digitalRead(IR_SENSOR_PIN) == LOW;

  // Read ultrasonic sensor
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2;

  // Consider someone present if either sensor detects
  return irDetected || (distance > 0 && distance < 200);
}

void publishSensorData()
{
  float temperature = readTemperature();
  float humidity = readHumidity();
  int airQuality = readAirQuality();
  bool peoplePresent = detectPeople();

  // Publish sensor data
  client.publish("sensors/temperature", String(temperature).c_str());
  client.publish("sensors/humidity", String(humidity).c_str());
  client.publish("sensors/air_quality", String(airQuality).c_str());
  client.publish("sensors/occupancy", String(peoplePresent ? 1 : 0).c_str());

  Serial.println("Published sensor data:");
  Serial.print("Temperature: ");
  Serial.println(temperature);
  Serial.print("Humidity: ");
  Serial.println(humidity);
  Serial.print("Air Quality: ");
  Serial.println(airQuality);
  Serial.print("People Present: ");
  Serial.println(peoplePresent ? "Yes" : "No");
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= PUBLISH_INTERVAL)
  {
    publishSensorData();
    lastPublishTime = currentTime;
  }

  delay(100); // Small delay to prevent overwhelming the system
}
