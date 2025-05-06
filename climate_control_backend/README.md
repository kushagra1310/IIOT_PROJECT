# Backend

This is the backend software for **Personalised Climate Control System**

This backend is responsible for:
- Receiving sensor data from ESP32s via MQTT
- Processing it using rule-based logic
- Sending appropriate commands back to actuators (e.g., fan, window motor)

## Usage Instructions (For Linux / MacOS)

### 1. Clone the Repository
```git clone git@github.com:kushagra1310/IIOT_Project```

### 2. Create and activate a python virtual environment
```python3 -m venv venv
source venv/bin/activate```

### 3. Install Dependencies
```pip instal -r requirements.txt```

### 4. Run the script
```python3 main.py```
