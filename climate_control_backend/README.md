# Personalised Climate Control Backend - Team 46

This is the backend software for **Personalised Climate Control System**

This backend is responsible for:
- Receiving sensor data from ESP32s via MQTT
- Processing it using rule-based logic
- Sending appropriate commands back to actuators (e.g., fan, window motor)


## Project Structure

There are 3 python files - main.py, mqtt_client.py and logic.py:
- main.py – Starts the FastAPI server and initializes the MQTT client on startup.
- mqtt_client.py – Handles all MQTT communication: subscribing to sensor data and publishing actuator commands.
- logic.py – Contains rule-based logic to process sensor inputs and decide the appropriate actuator response.


## Requirements

- Python 3.9+
- Mosquitto MQTT broker running locally (port 1883)
- `paho-mqtt`, `fastapi`, `uvicorn`


## Installation Instructions

### Linux

Run the following commands to install Mosquitto. Mosquitto is an open source message broker we are using to implement MQTT.
- `sudo apt install mosquitto mosquitto-clients`
- `sudo systemctl enable mosquitto`
- `sudo systemctl start mosquitto`

Run the following commands to install python & pip
- `sudo apt install python3 python3-pip`

Install python packages
- `pip3 install paho-mqtt fastapi uvicorn`


### MacOS

- Ensure `Homebrew` is installed

Run the following commands to install Mosquitto. Mosquitto is an open source message broker we are using to implement MQTT.
- `brew install mosquitto`
- `brew services start mosquitto`

Ensure python is installed
- Run `python --version`

Install python packages
- `pip install paho-mqtt fastapi uvicorn`


## How to run the server

1. Make sure you are in this directory (i.e. `climate_control_backed`) which has the main.py, mqtt_client.py and logic.py
2. Run `uvicorn main:app --reload`:
	- You should see a message that FastAPI is running at http://127.0.0.1:8000 or something of the such
	- And in the logs:
		- [FASTAPI] Starting MQTT client...
		- [MQTT] Connected with result code 0
		- [MQTT] Subscribed to topic: home/sensors/#
		

## Important note regarding data formatting

 The backend expects the sensor input to be in the following format (json):<br>
 {  <br>
   "device_id": "esp32-1",  <br>
   "temp": 30,  <br>
   "humidity": 55,  <br>
   "air_quality": 180,  <br>
   "occupied": true  <br>
}  
