# main.py

# This is the entry point of your backend server.
# It uses FastAPI to provide a basic web interface,
# and it starts the MQTT client to listen for sensor data.

import paho.mqtt.client as mqtt
import json
from logic import process_sensor_data  # Assuming you have this function in logic.py

MQTT_BROKER = "YOUR_MQTT_BROKER_IP"
MQTT_TOPIC = "climate_control/temp_humidity"

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        temperature = data.get("temperature")
        humidity = data.get("humidity")
        print(f"Received -> Temperature: {temperature}°C, Humidity: {humidity}%")
        process_sensor_data(temperature, humidity)
    except Exception as e:
        print("Error processing message:", e)

client = mqtt.Client()
client.on_message = on_message

print("Connecting to MQTT broker...")
client.connect(MQTT_BROKER, 1883, 60)
client.subscribe(MQTT_TOPIC)

print("Listening for sensor data...")
client.loop_forever()
