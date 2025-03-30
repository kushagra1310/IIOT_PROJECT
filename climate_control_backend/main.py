import paho.mqtt.client as mqtt
import json

MQTT_BROKER = "192.168.51.225"
TEMP_HUMID_TOPIC = "temphumid_code/temp_humidity"
FAN_CONTROL_TOPIC = "temphumid_code/fan_control"

def on_connect(client, userdata, flags, rc):
    print(f"Connection Status: {mqtt.connack_string(rc)}")
    if rc == 0:
        print(f"Successfully connected to broker {MQTT_BROKER}")
        print(f"Subscribing to topic: {TEMP_HUMID_TOPIC}")
        client.subscribe(TEMP_HUMID_TOPIC)
    else:
        print("Connection failed")

def on_message(client, userdata, msg):
    print("=" * 50)
    print(f"Message Received!")
    print(f"Topic: {msg.topic}")
    print(f"Raw Payload: {msg.payload}")

    try:
        decoded_payload = msg.payload.decode('utf-8')
        print(f"Decoded Payload: {decoded_payload}")

        parsed_data = json.loads(decoded_payload)
        if "temperature" in parsed_data:
            temperature = float(parsed_data["temperature"])
            humidity = float(parsed_data["humidity"])

            print(f"Temperature: {temperature}°C, Humidity: {humidity}%")

            fan_status = "ON" if temperature <= 25 and temperature>=18 else "OFF"
            
            fan_message = json.dumps({"fan": fan_status})
            client.publish(FAN_CONTROL_TOPIC, fan_message)
            print(f"Fan status set to: {fan_status}")

    except Exception as e:
        print(f"Error processing message: {e}")
    
    print("=" * 50)

def on_subscribe(client, userdata, mid, granted_qos):
    print(f"Subscribed to topic {TEMP_HUMID_TOPIC}")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.on_subscribe = on_subscribe

print("Attempting to connect to MQTT broker...")
try:
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_forever()
except Exception as e:
    print(f"Connection Error: {e}")
