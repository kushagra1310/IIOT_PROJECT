# mqtt_client.py

# This script will do the following:
# 1. Connect to a local Mosquitto broker
# 2. Subscribe to a topic. Topics would be for example one of the following: 
#       home/sensors/esp32-1/temp
#       home/sensors/esp32-2/humidity
#       home/actuators/esp32-1
# 3. Receive messages, ie the sensor data from ESP32
# 4. Process them using functions (from logic.py)
# 5. Publish a command to an actuator topic (eg. home/actuators/esp32-1)

import paho.mqtt.client as mqtt
    import json
    from logic import process_sensor_data  # Function to process incoming data
    
    # MQTT broker configuration
    BROKER = "localhost"       # Assuming broker is running locally
    PORT = 1883                # Default MQTT port
    
    # Subscribe to all sensor topics using wildcard
    SENSOR_TOPIC = "home/sensors/#"       # # means "anything after this"
    ACTUATOR_TOPIC_BASE = "home/actuators"  # Base topic to send actuator commands
    
    # Create an MQTT client instance
    client = mqtt.Client()
    
    # Called when the client successfully connects to the broker
    def on_connect(client, userdata, flags, rc):
        print(f"[MQTT] Connected with result code {rc}")
        
        # Subscribe to all sensor data topics
        client.subscribe(SENSOR_TOPIC)
        print(f"[MQTT] Subscribed to topic: {SENSOR_TOPIC}")
    
    # Called when a message is received from the broker
    def on_message(client, userdata, msg):
        print(f"[MQTT] Received on {msg.topic}: {msg.payload.decode()}")
        
        try:
            # Parse the incoming message (assumed to be JSON)
            data = json.loads(msg.payload.decode())
            device_id = data.get("device_id", "unknown")
    
            # Process the sensor data to determine what command to send
            command = process_sensor_data(data)
    
            # Create the actuator topic for this device (e.g. home/actuators/esp32-1)
            actuator_topic = f"{ACTUATOR_TOPIC_BASE}/{device_id}"
    
            # Publish the command back to the corresponding ESP32
            client.publish(actuator_topic, json.dumps({"command": command}))
            print(f"[MQTT] Published command to {actuator_topic}: {command}")
    
        except Exception as e:
            print("[ERROR] Processing message failed:", e)
    
    # Starts the MQTT client loop (non-blocking)
    def start_mqtt():
        # Set callback functions for connect and message
        client.on_connect = on_connect
        client.on_message = on_message
    
        # Connect to the MQTT broker
        client.connect(BROKER, PORT, 60)
    
        # Start the background loop to listen for messages
        client.loop_start()

