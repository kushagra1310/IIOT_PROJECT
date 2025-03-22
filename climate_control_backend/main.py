# main.py

# This is the entry point of your backend server.
# It uses FastAPI to provide a basic web interface,
# and it starts the MQTT client to listen for sensor data.

from fastapi import FastAPI
from mqtt_client import start_mqtt

app = FastAPI()

# This function runs when the server starts
@app.on_event("startup")
async def startup_event():
    print("[FASTAPI] Starting MQTT client...")
    start_mqtt()

# Basic health check endpoint
@app.get("/")
def root():
    return {"status": "MQTT backend running", "detail": "Listening for sensor data."}
