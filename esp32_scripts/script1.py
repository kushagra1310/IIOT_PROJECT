# ESP32 Script 1: Sensor Data Collection and Publishing
import machine
import dht
import time
import network
from umqtt.simple import MQTTClient
import ultrasonic
import ir_sensor

# Configuration
WIFI_SSID = "YourWiFiSSID"
WIFI_PASSWORD = "YourWiFiPassword"
MQTT_BROKER = "139.59.68.181"
MQTT_CLIENT_ID = "esp32_climate_system"

# Sensor pins
DHT22_PIN = 4        # GPIO4 for DHT22 sensor
MQ135_PIN = 32       # GPIO32 for MQ135 air quality sensor
ULTRASONIC_TRIG = 26 # GPIO26 for ultrasonic sensor trigger
ULTRASONIC_ECHO = 27 # GPIO27 for ultrasonic sensor echo
IR_SENSOR_PIN = 25   # GPIO25 for IR sensor

# Setup sensors
dht_sensor = dht.DHT22(machine.Pin(DHT22_PIN))
mq135_sensor = machine.ADC(machine.Pin(MQ135_PIN))
mq135_sensor.atten(machine.ADC.ATTN_11DB)  # Full range: 0-3.3V

# Set up ultrasonic sensor
ultrasonic_sensor = ultrasonic.UltrasonicSensor(ULTRASONIC_TRIG, ULTRASONIC_ECHO)

# Set up IR sensor
ir_sensor = ir_sensor.IRSensor(IR_SENSOR_PIN)

# Person counter (global variable)
person_count = 0

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
    client.connect()
    print('Connected to MQTT broker')
    return client

# Read DHT22 sensor
def read_dht22():
    try:
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
        humidity = dht_sensor.humidity()
        return temperature, humidity
    except Exception as e:
        print("Error reading DHT22:", e)
        return None, None

# Read MQ135 sensor (air quality)
def read_mq135():
    try:
        raw_value = mq135_sensor.read()
        # Convert raw value to ppm (approximate calculation)
        # This is a simplified conversion - calibration needed for accurate values
        ppm = raw_value / 10
        return ppm
    except Exception as e:
        print("Error reading MQ135:", e)
        return None

# Detect people using ultrasonic and IR sensors
def detect_people():
    global person_count
    
    # Check if somebody is passing through the doorway
    distance = ultrasonic_sensor.measure_distance()
    ir_detected = ir_sensor.detect_motion()
    
    # If someone passes within range and IR detects motion
    if distance < 100 and ir_detected:  # 100 cm threshold
        # Check direction - this is simplified logic
        # In real implementation, you would need two sets of sensors
        # and sequence detection to determine direction
        if distance < 50:  # Even closer - entering
            person_count += 1
        else:  # Exiting
            person_count = max(0, person_count - 1)  # Ensure non-negative count
    
    return person_count

# Main function
def main():
    try:
        # Connect to WiFi and MQTT
        connect_wifi()
        mqtt_client = connect_mqtt()
        
        while True:
            # Read sensor data
            temperature, humidity = read_dht22()
            air_quality = read_mq135()
            occupancy = detect_people()
            
            # Publish data if valid
            if temperature is not None:
                mqtt_client.publish("sensors/temperature", str(temperature))
            if humidity is not None:
                mqtt_client.publish("sensors/humidity", str(humidity))
            if air_quality is not None:
                mqtt_client.publish("sensors/air_quality", str(air_quality))
            if occupancy is not None:
                mqtt_client.publish("sensors/occupancy", str(occupancy))
            
            # Wait for next reading (30 seconds)
            time.sleep(30)
    
    except Exception as e:
        print("Error in main loop:", e)
        # Reset the device on error
        machine.reset()

if __name__ == "__main__":
    main()
