import paho.mqtt.client as mqtt
import json

# Threshold for CO2
CO2_THRESHOLD = 150

# MQTT Broker Details
MQTT_BROKER = "192.168.22.225"
MQTT_PORT = 1883

# MQTT Topics
CO2_TOPIC = "sensor/co2"
TEMP_HUMID_TOPIC = "temphumid_code/temp_humidity"
WINDOW_CONTROL_TOPIC = "temphumid_code/window_control"
FAN_CONTROL_TOPIC = "temphumid_code/fan_control"
PEOPLE_TOPIC = "room/peopleCount"
AC_TOPIC = "room/ac_control"

# Store readings
last_co2_ppm = 0
number_of_people = 0  # Initialize people count to zero
ac_status = 0
# Callback when the client connects to the broker
def on_connect(client, userdata, flags, rc):
    print(f"Connection Status: {mqtt.connack_string(rc)}")
    if rc == 0:
        print(f"Connected to MQTT Broker: {MQTT_BROKER}")
        print(f"Subscribing to: {CO2_TOPIC}, {TEMP_HUMID_TOPIC}, and {PEOPLE_TOPIC}")
        client.subscribe([(CO2_TOPIC, 0), (TEMP_HUMID_TOPIC, 0), (PEOPLE_TOPIC, 0)])
    else:
        print("Connection failed")

# Callback when a message is received
def on_message(client, userdata, msg):
    global last_co2_ppm, number_of_people, ac_status  # Use global variables for state tracking

    print("=" * 50)
    print(f"Message Received! Topic: {msg.topic}")
    print(f"Raw Payload: {msg.payload}")

    try:
        decoded_payload = msg.payload.decode('utf-8')
        print(f"Decoded Payload: {decoded_payload}")

        # Process CO₂ messages
        if msg.topic == CO2_TOPIC:
            last_co2_ppm = float(decoded_payload)
            print(f"Updated CO₂ Level: {last_co2_ppm} ppm")

            if last_co2_ppm > 1000:
                print("⚠ Warning: High CO₂ Level Detected!")
        
        # Process people count messages
        elif msg.topic == PEOPLE_TOPIC:
            number_of_people = int(decoded_payload)
            print(f"Number of people: {number_of_people}")
            
            # Immediately update fan and window status if people count changes to zero
            if number_of_people == 0:
                print("Room is empty - shutting down systems")
                # Turn off fan
                client.publish(FAN_CONTROL_TOPIC, "OFF")
                print("Fan status set to: OFF (room empty)")
                
                # Close window
                window_message = json.dumps({"window": "CLOSE"})
                client.publish(WINDOW_CONTROL_TOPIC, window_message)
                print("Window status set to: CLOSE (room empty)")
        
        # Process Temperature & Humidity messages
        elif msg.topic == TEMP_HUMID_TOPIC:
            parsed_data = json.loads(decoded_payload)

            if "temperature" in parsed_data and "humidity" in parsed_data:
                temperature = float(parsed_data["temperature"])
                humidity = float(parsed_data["humidity"])

                print(f"Temperature: {temperature}°C, Humidity: {humidity}%")

                # Check occupancy first - overrides all other conditions
                if number_of_people == 0:
                    window_status = "CLOSE"
                    fan_status = "OFF"
                    print("Room is empty - systems will remain off")
                else:
                    # Normal control logic when room is occupied
                    # Window control logic remember to change
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

                    # Fan control logic
                    if temperature >= 23 and temperature < 28:
                        fan_status = "ON"
                    else:
                        fan_status = "OFF"
                    # AC control logic
                    print(temperature)
                    if temperature >=28:
                        ac_status = "22"
                    else:
                        ac_status = "0"
                # Publish window status
                window_message = json.dumps({"window": window_status})
                client.publish(WINDOW_CONTROL_TOPIC, window_message)
                print(f"Window status set to: {window_status}")
                
                # Publish fan status
                client.publish(FAN_CONTROL_TOPIC, fan_status)
                print(f"Fan status set to: {fan_status}")

                #Publish ac status
                client.publish(AC_TOPIC, ac_status)
                print(f"AC status set to: {ac_status}")

    except Exception as e:
        print(f"Error processing message: {e}")
        import traceback
        traceback.print_exc()  # For more detailed error information

    print("=" * 50)

# Callback for subscription confirmation
def on_subscribe(client, userdata, mid, granted_qos):
    print(f"Subscribed successfully!")

# Set up MQTT client
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.on_subscribe = on_subscribe

# Attempt to connect to MQTT broker
print("Attempting to connect to MQTT broker...")
try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()
except Exception as e:
    print(f"Connection Error: {e}")