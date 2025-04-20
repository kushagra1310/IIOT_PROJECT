# ESP32 Script 2: Manual Control Mode Handler
import machine
import time
import network
from umqtt.simple import MQTTClient

# Configuration
WIFI_SSID = "YourWiFiSSID"
WIFI_PASSWORD = "YourWiFiPassword"
MQTT_BROKER = "139.59.68.181"
MQTT_CLIENT_ID = "esp32_climate_manual"

# Actuator pins
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

# Current system state (global variables)
current_mode = "manual"  # "manual" or "auto"
ac_state = "off"  # "on" or "off"
ac_temperature = 22  # Default temperature
fan_state = "off"  # "on" or "off"
window_state = "closed"  # "open" or "closed"

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
    
    # Subscribe to control topics
    control_topics = [
        "controls/mode",
        "controls/ac",
        "controls/ac/temp",
        "controls/fan",
        "controls/window"
    ]
    
    for topic in control_topics:
        client.subscribe(topic)
    
    print('Connected to MQTT broker and subscribed to control topics')
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
        # Set servo to "on" position (adjust duty cycle as needed)
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

# MQTT callback for receiving messages
def on_message(topic, msg):
    topic = topic.decode()
    msg = msg.decode()
    print(f"Received message: {msg} on topic: {topic}")
    
    global current_mode
    
    # Process messages only if in manual mode or for mode changes
    if topic == "controls/mode":
        current_mode = msg
        
        if msg == "standby":
            # Turn everything off in standby mode
            control_ac("off")
            control_fan("off")
            control_window("closed")
    
    # Only process control commands if in manual mode
    if current_mode == "manual":
        if topic == "controls/ac":
            control_ac(msg)
        elif topic == "controls/ac/temp":
            try:
                temperature = int(msg)
                if 19 <= temperature <= 25:
                    control_ac(ac_state, temperature)
            except ValueError:
                print("Invalid temperature value received")
        elif topic == "controls/fan":
            control_fan(msg)
        elif topic == "controls/window":
            control_window(msg)

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
            
            # Send current states to update the UI
            mqtt_client.publish("actuators/ac", ac_state)
            mqtt_client.publish("actuators/fan", fan_state)
            mqtt_client.publish("actuators/window", window_state)
            
            time.sleep(1)
    
    except Exception as e:
        print("Error in main loop:", e)
        # Reset the device on error
        machine.reset()

if __name__ == "__main__":
    main() 