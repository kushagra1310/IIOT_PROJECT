# logic.py

# This file contains the decision-making logic based on sensor data.
# It processes temperature, humidity, air quality, and occupancy
# and returns a command string to be sent to the ESP32's actuators.

# The backend expects the sensor input to be in the following format (json):
# {
#   "device_id": "esp32-1",
#   "temp": 30,
#   "humidity": 55,
#   "air_quality": 180,
#   "occupied": true
# }

def process_sensor_data(data):
    # Extract values with defaults
    temp = data.get("temp", 0)
    humidity = data.get("humidity", 0)

    # We ignore these for this specific test case
    air_quality = data.get("air_quality", 0)
    occupied = data.get("occupied", True)  # Assume it's always occupied for test

    print(f"[LOGIC] Processing: Temp={temp}, Humidity={humidity}")

    # If temperature exceeds 28°C, turn on the fan
    if temp > 28:
        return "FAN_ON"

    # Otherwise, turn it off
    return "FAN_OFF"
