import paho.mqtt.client as mqtt
import json
import os

# Threshold for CO2
CO2_THRESHOLD = 130  # CHANGE ACCORDING TO CONDITIONS

# MQTT Broker Details
MQTT_BROKER = os.getenv("MQTT_BROKER","iot-team46.duckdns.org")
MQTT_PORT = 1883

# MQTT Topics
CO2_TOPIC = "sensor/co2"
TEMP_HUMID_TOPIC = "temphumid_code/temp_humidity"
WINDOW_CONTROL_TOPIC = "temphumid_code/window_control"
FAN_CONTROL_TOPIC = "temphumid_code/fan_control"
PEOPLE_TOPIC = "room/peopleCount"
AC_TOPIC = "room/ac_control"   

# Control Topics
MODE_TOPIC = "controls/mode"
MANUAL_FAN_TOPIC = "controls/fan"
MANUAL_AC_TOPIC = "controls/ac"
MANUAL_WINDOW_TOPIC = "controls/window"
AC_TEMPERATURE_CONTROL= "controls/ac/temp"

# State
last_co2_ppm = 0
number_of_people = 0
ac_status = 0
ac_current_temp = 0
# Persisted mode
MODE_FILE = "current_mode.txt"

def save_mode(mode):
    with open(MODE_FILE, "w") as f:
        f.write(mode)

def load_mode():
    if os.path.exists(MODE_FILE):
        with open(MODE_FILE, "r") as f:
            return f.read().strip().upper()
    return "AUTO"

current_mode = load_mode()

def is_manual():
    return current_mode == "MANUAL"

# MQTT connect callback
def on_connect(client, userdata, flags, rc):
    print(f"Connection Status: {mqtt.connack_string(rc)}")
    if rc == 0:
        print(f"Connected to MQTT Broker: {MQTT_BROKER}")
        client.subscribe([
            (CO2_TOPIC, 0),
            (TEMP_HUMID_TOPIC, 0),
            (PEOPLE_TOPIC, 0),
            (MODE_TOPIC, 0),
            (MANUAL_FAN_TOPIC, 0),
            (MANUAL_AC_TOPIC, 0),
            (MANUAL_WINDOW_TOPIC, 0),
            (AC_TEMPERATURE_CONTROL, 0)
        ])
    else:
        print("Connection failed")

# MQTT message callback
def on_message(client, userdata, msg):
    global last_co2_ppm, number_of_people, ac_status, current_mode, ac_current_temp

    print("=" * 50)
    print(f"Message Received! Topic: {msg.topic}")
    print(f"Raw Payload: {msg.payload}")

    try:
        decoded_payload = msg.payload.decode('utf-8')
        print(f"Decoded Payload: {decoded_payload}")

        # Handle mode switch
        if msg.topic == MODE_TOPIC:
            mode = decoded_payload.strip().upper()
            if mode in ["AUTO", "MANUAL"]:
                current_mode = mode
                save_mode(current_mode)
                print(f"🔄 Mode changed to: {current_mode}")

        # Manual controls (if in MANUAL mode)
        elif is_manual():
            if msg.topic == MANUAL_FAN_TOPIC:
                client.publish(FAN_CONTROL_TOPIC, decoded_payload.upper())
                print(f"🔧 Manual fan control: {decoded_payload}")
            elif msg.topic == MANUAL_AC_TOPIC:
                client.publish(AC_TOPIC, decoded_payload)
                print(f"🔧 Manual AC control: {decoded_payload}")
            elif msg.topic == MANUAL_WINDOW_TOPIC:
                window_message = json.dumps({"window": decoded_payload.upper()})
                client.publish(WINDOW_CONTROL_TOPIC, window_message)
                print(f"🔧 Manual window control: {decoded_payload}")

        # AUTO mode logic
        elif current_mode == "AUTO":

            if msg.topic == CO2_TOPIC:
                last_co2_ppm = float(decoded_payload)
                print(f"Updated CO₂ Level: {last_co2_ppm} ppm")
            elif msg.topic == AC_TEMPERATURE_CONTROL:
                ac_current_temp = int(decoded_payload)
                print(f"Updated AC temperature: {ac_current_temp} °C")
                if int(ac_status) != 0:
                    ac_status = ac_current_temp
                    client.publish(AC_TOPIC, ac_status)
                    print(f"AC status set to: {ac_status}")

            elif msg.topic == PEOPLE_TOPIC:
                number_of_people = int(decoded_payload)
                print(f"Number of people: {number_of_people}")

                if number_of_people == 0:
                    print("Room is empty - shutting down systems")
                    client.publish(FAN_CONTROL_TOPIC, "OFF")
                    print("Fan status set to: OFF (room empty)")

                    window_message = json.dumps({"window": "CLOSE"})
                    client.publish(WINDOW_CONTROL_TOPIC, window_message)
                    print("Window status set to: CLOSE (room empty)")

            elif msg.topic == TEMP_HUMID_TOPIC:
                parsed_data = json.loads(decoded_payload)
                if "temperature" in parsed_data and "humidity" in parsed_data:
                    temperature = float(parsed_data["temperature"])
                    humidity = float(parsed_data["humidity"])

                    print(f"Temperature: {temperature}°C, Humidity: {humidity}%")

                    if number_of_people == 0:
                        window_status = "CLOSE"
                        fan_status = "OFF"
                        ac_status = "0"
                        print("Room is empty - systems will remain off")
                    else:
                        if temperature >= 28:
                            window_status = "CLOSE"
                        elif 20 <= temperature < 28 and last_co2_ppm <= CO2_THRESHOLD:
                            window_status = "CLOSE"
                        elif 20 <= temperature < 28 and last_co2_ppm > CO2_THRESHOLD:
                            window_status = "OPEN"
                        elif temperature < 20 and last_co2_ppm > CO2_THRESHOLD:
                            window_status = "OPEN"
                        else:
                            window_status = "CLOSE"

                        # Fan control
                        if temperature >= 23 and temperature < 28:
                            fan_status = "ON"
                        else:
                            fan_status = "OFF"

                        # AC control
                        ac_status = str(ac_current_temp) if temperature >= 28 else "0"

                    # Publish decisions
                    window_message = json.dumps({"window": window_status})
                    client.publish(WINDOW_CONTROL_TOPIC, window_message)
                    print(f"Window status set to: {window_status}")

                    client.publish(FAN_CONTROL_TOPIC, fan_status)
                    print(f"Fan status set to: {fan_status}")

                    client.publish(AC_TOPIC, ac_status)
                    print(f"AC status set to: {ac_status}")
                    

    except Exception as e:
        print(f"Error processing message: {e}")
        import traceback
        traceback.print_exc()

    print("=" * 50)

# MQTT subscription confirmation
def on_subscribe(client, userdata, mid, granted_qos):
    print("Subscribed successfully!")

# Start client
client = mqtt.Client()
client.username = 'team46'
client.password = 'iotisthebestmqttisthebest!'
client.on_connect = on_connect
client.on_message = on_message
client.on_subscribe = on_subscribe

print("Attempting to connect to MQTT broker...")
try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()
except Exception as e:
    print(f"Connection Error: {e}")
