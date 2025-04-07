const int binaryLEDs[] = {14, 12, 13}; // LSB to MSB
bool acPower = false;
int temp = 1; // Temperature value from 1 to 7

void setup() {
  Serial.begin(115200);
  
  // Setup LED pins
  for (int i = 0; i < 3; i++) {
    pinMode(binaryLEDs[i], OUTPUT);
    digitalWrite(binaryLEDs[i], LOW);
  }
  
  Serial.println("Type 'on' to power ON AC");
  Serial.println("Type 'off' to power OFF AC");
  Serial.println("When ON, type 'up' or 'down' to adjust temperature");
}

void loop() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim(); // remove spaces and newlines
    
    if (command.equalsIgnoreCase("on")) {
      acPower = true;
      Serial.println("AC ON | Temp: " + String(temp));
      displayBinary(temp);
    } else if (command.equalsIgnoreCase("off")) {
      acPower = false;
      Serial.println("AC OFF");
      clearLEDs();
    } else if (acPower && command.equalsIgnoreCase("up")) {
      if (temp < 7) temp++;
      Serial.println("AC ON | Temp: " + String(temp));
      displayBinary(temp);
    } else if (acPower && command.equalsIgnoreCase("down")) {
      if (temp > 1) temp--;
      Serial.println("AC ON | Temp: " + String(temp));
      displayBinary(temp);
    } else {
      Serial.println("Unknown command. Use: on, off, up, down");
    }
  }
}

void displayBinary(int value) {
  for (int i = 0; i < 3; i++) {
    digitalWrite(binaryLEDs[i], (value >> i) & 1);
  }
}

void clearLEDs() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(binaryLEDs[i], LOW);
  }
}
