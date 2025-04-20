#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

// WiFi credentials
const char *ssid = "YourWiFiSSID";
const char *password = "YourWiFiPassword";

// MQTT Broker
const char *mqtt_broker = "team46.duckdns.org";
const int mqtt_port = 1883;
const char *mqtt_client_id = "esp32_climate_manual";

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
String currentMode = "manual";
String acState = "off";
int acTemperature = 22;
String fanState = "off";
String windowState = "closed";

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

  // Subscribe to control topics
  client.subscribe("controls/mode");
  client.subscribe("controls/ac");
  client.subscribe("controls/ac/temp");
  client.subscribe("controls/fan");
  client.subscribe("controls/window");
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

  if (currentMode == "manual")
  {
    if (topicStr == "controls/ac")
    {
      controlAC(message);
    }
    else if (topicStr == "controls/ac/temp")
    {
      int temp = message.toInt();
      if (temp >= 19 && temp <= 25)
      {
        controlAC(acState, temp);
      }
    }
    else if (topicStr == "controls/fan")
    {
      controlFan(message);
    }
    else if (topicStr == "controls/window")
    {
      controlWindow(message);
    }
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
      client.subscribe("controls/mode");
      client.subscribe("controls/ac");
      client.subscribe("controls/ac/temp");
      client.subscribe("controls/fan");
      client.subscribe("controls/window");
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