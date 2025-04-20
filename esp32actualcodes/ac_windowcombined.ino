#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h> // Use ESP32-compatible servo library

// WiFi & MQTT Configuration
const char *ssid = "A35";
const char *password = "ghephukat";
const char *mqtt_server = "iot-team46.duckdns.org";

const char *WINDOW_CONTROL_TOPIC = "temphumid_code/window_control";
const char *AC_CONTROL_TOPIC = "room/ac_control";

WiFiClient espClient;
PubSubClient client(espClient);

// Servo setup
#define SERVO_PIN 33
Servo windowServo;
bool window_open = false;

// AC LED Pins
const int binaryLEDs[] = {14, 12, 13}; // LSB to MSB
int ac_status = 0;                     // 0 = off

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
    if (client.connect("ESP32_Controller"))
    {
      Serial.println("connected!");
      client.subscribe(WINDOW_CONTROL_TOPIC);
      client.subscribe(AC_CONTROL_TOPIC);
    }
    else
    {
      Serial.print("failed, retrying in 5s...");
      delay(5000);
    }
  }
}

// LED Binary Display
void displayBinary(int value)
{
  for (int i = 0; i < 3; i++)
  {
    digitalWrite(binaryLEDs[i], (value >> i) & 1);
  }
}

// MQTT Callback
void callback(char *topic, byte *payload, unsigned int length)
{
  String message;
  for (int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  Serial.print("Received on [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  if (String(topic) == WINDOW_CONTROL_TOPIC)
  {
    if (message.indexOf("OPEN") != -1 && !window_open)
    {
      Serial.println("Opening window...");
      windowServo.write(0); // Adjust angle if needed
      window_open = true;
    }
    else if (message.indexOf("CLOSE") != -1 && window_open)
    {
      Serial.println("Closing window...");
      windowServo.write(90); // Adjust angle if needed
      window_open = false;
    }
  }

  else if (String(topic) == AC_CONTROL_TOPIC)
  {
    // if (message.indexOf("0") == -1 && ac_status == 0 )
    // {
    //   int temp=message.toInt();
    //   Serial.println("Turning on AC...");
    //   displayBinary(temp - 18);
    //   ac_status = temp;
    // }
    // else if (message.indexOf("0") != -1 && ac_status != 0)
    // {
    //   Serial.println("Turning off AC...");
    //   displayBinary(0);
    //   ac_status = 0;
    // }
      int temp=message.toInt();
      Serial.println("Turning on AC...");
      if(temp>18)
      displayBinary(temp - 18);
      else
      displayBinary(0);
      ac_status = temp;
  }
}

void setup()
{
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  // Setup Servo
  windowServo.setPeriodHertz(50);           // 50 Hz for analog servo
  windowServo.attach(SERVO_PIN, 500, 2400); // pulse width range for typical servos
  windowServo.write(90);                    // Start closed

  // Setup AC LEDs
  for (int i = 0; i < 3; i++)
  {
    pinMode(binaryLEDs[i], OUTPUT);
    digitalWrite(binaryLEDs[i], LOW);
  }
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();
}
