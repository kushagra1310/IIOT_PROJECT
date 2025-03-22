Once the sensor loop is stable

- Add MQTT subscribe support on ESP32 for actuator commands (e.g., climate_control/fan_cmd)
- Update Python logic.py to send commands like "FAN_ON" or "ALL_OFF" based on readings
- Modify .ino to toggle GPIOs based on command received
- When you're ready for that, just let me know — I can help set up that two-way MQTT bridge too.

