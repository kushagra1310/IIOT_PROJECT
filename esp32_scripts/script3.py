# ESP32 Script 3: Automatic Climate Control System
import machine
import time
import network
from umqtt.simple import MQTTClient

# Configuration
WIFI_SSID = "YourWiFiSSID"
WIFI_PASSWORD = "YourWiFiPassword"
MQTT_BROKER = "iot-team46.duckdns.org"
MQTT_CLIENT_ID = "esp32_climate_auto"

# Actuator pins (same as script2)
FAN_SERVO_PIN = 12      # GPIO12 for fan servo
WINDOW_SERVO_PIN = 13   # GPIO13 for window servo 
AC_LED1_PIN = 14        # GPIO14 for AC LED 1
AC_LED2_PIN = 15        # GPIO15 for AC LED 2
AC_LED3_PIN = 16        # GPIO16 for AC LED 3

# Setup actuators
fan_servo = machine.PWM(machine.Pin(FAN_SERVO_PIN), freq=50)  # 50Hz for servo
window_servo = machine.PWM(machine.Pin(WINDOW_SERVO_PIN), freq=50)  # 50Hz for servo
ac_led1 = machine.Pin(AC_LED1_PIN, machine.Pin.OUT)
ac_led2 = machine.Pin(AC_LED2_PIN, machine.Pin.OUT)
ac_led3 = machine.Pin(AC_LED3_PIN, machine.Pin.OUT)

# System state (global variables)
current_mode = "manual"  # "manual" or "auto"
ac_state = "off"  # "on" or "off"
ac_temperature = 22  # Default temperature
fan_state = "off"  # "on" or "off"
window_state = "closed"  # "open" or "closed"
last_auto_control_time = 0  # Time of last auto control decision

# Sensor data (updated by MQTT messages)
current_temperature = 22.0
current_humidity = 45.0
current_air_quality = 650  # ppm
current_occupancy = 0  # Number of people

# Connect to WiFi
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('Connecting to WiFi...')
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        while not wlan.isconnected():
            time.sleep(0.5)
    print('WiFi connected, IP:', wlan.ifconfig()[0])

# Connect to MQTT broker
def connect_mqtt():
    client = MQTTClient(MQTT_CLIENT_ID, MQTT_BROKER)
    client.set_callback(on_message)
    client.connect()
    
    # Subscribe to control topics and sensor data
    topics = [
        "controls/mode",
        "sensors/temperature",
        "sensors/humidity",
        "sensors/air_quality",
        "sensors/occupancy"
    ]
    
    for topic in topics:
        client.subscribe(topic)
    
    print('Connected to MQTT broker and subscribed to topics')
    return client

# Update AC LEDs based on temperature
def update_ac_leds(temperature):
    if ac_state == "off":
        ac_led1.value(0)
        ac_led2.value(0)
        ac_led3.value(0)
        return
    
    # Convert temperature to binary (19-25 degrees => 001-111)
    binary_value = bin(temperature - 19)[2:].zfill(3)
    ac_led1.value(int(binary_value[0]))
    ac_led2.value(int(binary_value[1]))
    ac_led3.value(int(binary_value[2]))

# Control fan servo
def control_fan(state):
    global fan_state
    fan_state = state
    
    if state == "on":
        # Set servo to "on" position
        fan_servo.duty(77)  # Approximately 90 degrees
    else:
        # Set servo to "off" position
        fan_servo.duty(26)  # Approximately 0 degrees
        
    # Publish state update
    mqtt_client.publish("actuators/fan", state)

# Control window servo
def control_window(state):
    global window_state
    window_state = state
    
    if state == "open":
        # Set servo to "open" position
        window_servo.duty(103)  # Approximately 180 degrees
    else:
        # Set servo to "closed" position
        window_servo.duty(26)   # Approximately 0 degrees
        
    # Publish state update
    mqtt_client.publish("actuators/window", state)

# Control AC LEDs
def control_ac(state, temperature=None):
    global ac_state, ac_temperature
    
    ac_state = state
    
    if temperature is not None and 19 <= temperature <= 25:
        ac_temperature = temperature
    
    update_ac_leds(ac_temperature)
    
    # Publish state update
    mqtt_client.publish("actuators/ac", state)
    if state == "on":
        mqtt_client.publish("actuators/ac/temp", str(ac_temperature))

# Implement automatic control logic based on sensor data
def automatic_control():
    global current_temperature, current_humidity, current_air_quality, current_occupancy
    
    print("Running automatic control logic...")
    print(f"Temperature: {current_temperature}°C, Humidity: {current_humidity}%")
    print(f"Air Quality: {current_air_quality} ppm, Occupancy: {current_occupancy} people")
    
    # Temperature-based control
    if current_temperature > 26:
        control_ac("on", 22)
        if current_occupancy > 0 and current_air_quality < 800:
            control_window("open")
        control_fan("on")
    elif 23 <= current_temperature <= 26:
        if current_occupancy > 0:
            control_ac("on", 23)
        else:
            control_ac("off")
        control_fan("on")
    elif 19 <= current_temperature <= 22:
        control_ac("off")
        control_fan("off")
        if current_air_quality > 1000:
            control_window("open")
        else:
            control_window("closed")
    else:  # Temperature < 19
        control_ac("off")
        control_fan("off")
        control_window("closed")
    
    # Air quality override
    if current_air_quality > 1200:
        # Only override window if temperature isn't too cold
        if current_temperature >= 19:
            control_window("open")
        control_fan("on")
    elif 800 <= current_air_quality <= 1200:
        if current_temperature >= 19:
            control_window("open")
        control_fan("on")
    
    # Occupancy control - special case for energy saving
    if current_occupancy == 0:
        # If room has been empty, prefer energy saving
        if current_temperature < 28:  # Don't let it get too hot
            control_ac("off")
        control_fan("off")

# MQTT callback for receiving messages
def on_message(topic, msg):
    topic = topic.decode()
    msg = msg.decode()
    print(f"Received message: {msg} on topic: {topic}")
    
    global current_mode, current_temperature, current_humidity
    global current_air_quality, current_occupancy
    
    # Process mode changes
    if topic == "controls/mode":
        current_mode = msg
        
        if msg == "standby":
            # Turn everything off in standby mode
            control_ac("off")
            control_fan("off")
            control_window("closed")
    
    # Update sensor data based on MQTT messages
    if topic == "sensors/temperature":
        try:
            current_temperature = float(msg)
        except ValueError:
            print("Invalid temperature value received")
    
    elif topic == "sensors/humidity":
        try:
            current_humidity = float(msg)
        except ValueError:
            print("Invalid humidity value received")
    
    elif topic == "sensors/air_quality":
        try:
            current_air_quality = float(msg)
        except ValueError:
            print("Invalid air quality value received")
    
    elif topic == "sensors/occupancy":
        try:
            current_occupancy = int(msg)
        except ValueError:
            print("Invalid occupancy value received")

# Main function
def main():
    try:
        # Connect to WiFi and MQTT
        connect_wifi()
        global mqtt_client
        mqtt_client = connect_mqtt()
        
        # Initialize actuators to default state
        control_ac("off")
        control_fan("off")
        control_window("closed")
        
        # Main loop
        while True:
            # Check for new messages
            mqtt_client.check_msg()
            
            # Run automatic control logic every 2 minutes if in auto mode
            current_time = time.time()
            if current_mode == "auto" and (current_time - last_auto_control_time >= 120):  # 120 seconds = 2 minutes
                automatic_control()
                global last_auto_control_time
                last_auto_control_time = current_time
            
            time.sleep(1)
    
    except Exception as e:
        print("Error in main loop:", e)
        # Reset the device on error
        machine.reset()

if __name__ == "__main__":
    main() 