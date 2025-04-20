#ESP32 Script 3 : Automatic Climate Control System
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

// WiFi credentials
const char *ssid = "YourWiFiSSID";
const char *password = "YourWiFiPassword";

// MQTT Broker
const char *mqtt_broker = "team46.duckdns.org";
const int mqtt_port = 1883;
const char *mqtt_client_id = "esp32_climate_auto";

// Pin definitions
#define FAN_SERVO_PIN 12
#define WINDOW_SERVO_PIN 13
#define AC_LED1_PIN 14
#define AC_LED2_PIN 15
#define AC_LED3_PIN 16

// Initialize components
Servo fanServo;
Servo windowServo;
WiFiClient espClient;
PubSubClient client(espClient);

// System state
String currentMode = "auto";
String acState = "off";
int acTemperature = 22;
String fanState = "off";
String windowState = "closed";

// Sensor data
float currentTemperature = 0;
float currentHumidity = 0;
int currentAirQuality = 0;
int currentOccupancy = 0;

// Control thresholds
const float TEMP_THRESHOLD_HIGH = 25.0;
const float TEMP_THRESHOLD_LOW = 20.0;
const float HUMIDITY_THRESHOLD_HIGH = 70.0;
const float HUMIDITY_THRESHOLD_LOW = 30.0;
const int AIR_QUALITY_THRESHOLD = 100;

void setup()
{
  Serial.begin(115200);

  // Initialize actuators
  fanServo.attach(FAN_SERVO_PIN);
  windowServo.attach(WINDOW_SERVO_PIN);
  pinMode(AC_LED1_PIN, OUTPUT);
  pinMode(AC_LED2_PIN, OUTPUT);
  pinMode(AC_LED3_PIN, OUTPUT);

  // Connect to WiFi
  setup_wifi();

  // Setup MQTT
  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(callback);

  // Subscribe to sensor topics
  client.subscribe("sensors/temperature");
  client.subscribe("sensors/humidity");
  client.subscribe("sensors/air_quality");
  client.subscribe("sensors/occupancy");
  client.subscribe("controls/mode");
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

void callback(char *topic, byte *payload, unsigned int length)
{
  String message = "";
  for (int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  String topicStr = String(topic);

  if (topicStr == "controls/mode")
  {
    currentMode = message;
    if (message == "standby")
    {
      controlAC("off");
      controlFan("off");
      controlWindow("closed");
    }
  }

  if (currentMode == "auto")
  {
    if (topicStr == "sensors/temperature")
    {
      currentTemperature = message.toFloat();
    }
    else if (topicStr == "sensors/humidity")
    {
      currentHumidity = message.toFloat();
    }
    else if (topicStr == "sensors/air_quality")
    {
      currentAirQuality = message.toInt();
    }
    else if (topicStr == "sensors/occupancy")
    {
      currentOccupancy = message.toInt();
    }

    // Update controls based on new sensor data
    updateControls();
  }
}

void updateControls()
{
  // Temperature control
  if (currentTemperature > TEMP_THRESHOLD_HIGH)
  {
    controlAC("on", 22);
    controlFan("on");
    controlWindow("open");
  }
  else if (currentTemperature < TEMP_THRESHOLD_LOW)
  {
    controlAC("on", 25);
    controlFan("off");
    controlWindow("closed");
  }
  else
  {
    controlAC("off");
    controlFan("off");
    controlWindow("open");
  }

  // Humidity control
  if (currentHumidity > HUMIDITY_THRESHOLD_HIGH)
  {
    controlWindow("open");
    controlFan("on");
  }
  else if (currentHumidity < HUMIDITY_THRESHOLD_LOW)
  {
    controlWindow("closed");
    controlFan("off");
  }

  // Air quality control
  if (currentAirQuality > AIR_QUALITY_THRESHOLD)
  {
    controlWindow("open");
    controlFan("on");
  }

  // Occupancy-based control
  if (currentOccupancy > 0)
  {
    if (currentTemperature > TEMP_THRESHOLD_HIGH)
    {
      controlAC("on", 22);
    }
  }
  else
  {
    controlAC("off");
    controlFan("off");
    controlWindow("closed");
  }
}

void updateACLEDs(int temperature)
{
  if (acState == "off")
  {
    digitalWrite(AC_LED1_PIN, LOW);
    digitalWrite(AC_LED2_PIN, LOW);
    digitalWrite(AC_LED3_PIN, LOW);
    return;
  }

  // Convert temperature to binary (19-25 degrees => 001-111)
  int binaryValue = temperature - 19;
  digitalWrite(AC_LED1_PIN, (binaryValue & 4) ? HIGH : LOW);
  digitalWrite(AC_LED2_PIN, (binaryValue & 2) ? HIGH : LOW);
  digitalWrite(AC_LED3_PIN, (binaryValue & 1) ? HIGH : LOW);
}

void controlFan(String state)
{
  fanState = state;

  if (state == "on")
  {
    fanServo.write(90); // 90 degrees
  }
  else
  {
    fanServo.write(0); // 0 degrees
  }

  client.publish("actuators/fan", state.c_str());
}

void controlWindow(String state)
{
  windowState = state;

  if (state == "open")
  {
    windowServo.write(180); // 180 degrees
  }
  else
  {
    windowServo.write(0); // 0 degrees
  }

  client.publish("actuators/window", state.c_str());
}

void controlAC(String state, int temperature = -1)
{
  acState = state;

  if (temperature != -1 && temperature >= 19 && temperature <= 25)
  {
    acTemperature = temperature;
  }

  updateACLEDs(acTemperature);

  client.publish("actuators/ac", state.c_str());
  if (state == "on")
  {
    client.publish("actuators/ac/temp", String(acTemperature).c_str());
  }
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mqtt_client_id))
    {
      Serial.println("connected");
      // Resubscribe to topics
      client.subscribe("sensors/temperature");
      client.subscribe("sensors/humidity");
      client.subscribe("sensors/air_quality");
      client.subscribe("sensors/occupancy");
      client.subscribe("controls/mode");
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

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  // Send current states to update the UI
  client.publish("actuators/ac", acState.c_str());
  client.publish("actuators/fan", fanState.c_str());
  client.publish("actuators/window", windowState.c_str());

  delay(1000);
}