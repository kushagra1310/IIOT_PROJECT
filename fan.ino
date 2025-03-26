#include <Stepper.h>

#define STEPS_PER_REV 2048  // Full steps per revolution

Stepper myStepper(STEPS_PER_REV, 33, 25, 26, 12); // IN1, IN2, IN3, IN4

void setup() {
  myStepper.setSpeed(10);  // Reduce speed for smooth operation
  Serial.begin(115200);
}

void loop() {
  Serial.println("Fan Running...");
  myStepper.step(STEPS_PER_REV); // Complete one revolution
}
