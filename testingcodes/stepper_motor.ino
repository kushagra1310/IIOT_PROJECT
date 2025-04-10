#include <Stepper.h>

#define STEPS_PER_REV 2048  // Full steps per revolution

Stepper myStepper(STEPS_PER_REV, 33, 25, 26, 12); // IN1, IN2, IN3, IN4

void setup() {
  myStepper.setSpeed(10);  // Speed in RPM
  Serial.begin(115200);
}

void loop() {
  Serial.println("Moving Forward");
  myStepper.step(512); // Move 1/4 rotation
  delay(1000);

  Serial.println("Moving Backward");
  myStepper.step(-512); // Move back 1/4 rotation
  delay(1000);
}
