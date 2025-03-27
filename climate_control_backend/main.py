# main.py

# This is the entry point of your backend server.
# It uses FastAPI to provide a basic web interface,
# and it starts the MQTT client to listen for sensor data.

import paho.mqtt.client as mqtt
import json
from logic import process_sensor_data  # Decision-making logic

# MQTT Configuration
MQTT_BROKER = "172.20.10.2"  # Your broker IP
SENSOR_TOPIC = "climate_control/temp_humidity"  # ESP32 publishes sensor data here
ACTUATOR_TOPIC = "climate_control/fan_cmd"  # Commands for the ESP32 actuators

# MQTT Callback for receiving sensor data
def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        print(f"Received Sensor Data: {data}")

        # Process sensor data using logic.py
        command = process_sensor_data(data)

        # Publish actuator command if necessary
        client.publish(ACTUATOR_TOPIC, command)
        print(f"Sent Actuator Command: {command}")

    except Exception as e:
        print(f"Error processing message: {e}")

# Set up MQTT client
client = mqtt.Client()
client.on_message = on_message

print("Connecting to MQTT broker...")
client.connect(MQTT_BROKER, 1883, 60)
client.subscribe(SENSOR_TOPIC)

print("Listening for sensor data...")
client.loop_forever()
