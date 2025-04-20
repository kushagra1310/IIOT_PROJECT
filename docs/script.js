document.addEventListener("DOMContentLoaded", function () {
  // --- Element Selectors ---
  const startButton = document.getElementById("start-button");
  const landingPage = document.getElementById("landing-page");
  const modeSelection = document.getElementById("mode-selection");
  const circleNav = document.getElementById("circle-nav");
  const navLinks = document.querySelectorAll(".circle-link");
  const sections = document.querySelectorAll(".section");
  const backButtons = document.querySelectorAll(".back-button");
  const autoBackButton = document.querySelector(".auto-back-button");
  // --- Initial Visibility ---
  modeSelection.style.display = "none";
  circleNav.style.display = "none";
  sections.forEach(section => section.style.display = "none");

  // --- Start Button Logic ---
  startButton.addEventListener("click", function () {
  console.log("Start button clicked"); // Debug log
    startButton.disabled = true;
    landingPage.style.opacity = "0";
  landingPage.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      landingPage.style.display = "none";
      modeSelection.style.display = "flex";
      modeSelection.style.opacity = "0";
    modeSelection.style.transition = "opacity 0.5s ease";
    
    // Force reflow
    void modeSelection.offsetWidth;
    
    // Set opacity to 1 in the next frame
    requestAnimationFrame(() => {
      modeSelection.style.opacity = "1";
    });
  }, 500);
  });

  // --- Manual Mode ---
  document.getElementById("manual-mode").addEventListener("click", function () {
    isAutomaticMode = false;
    if (mqttClient) mqttClient.publish('controls/mode', 'MANUAL');
    modeSelection.style.opacity = "0";
  modeSelection.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      modeSelection.style.display = "none";
      circleNav.style.display = "block";
      circleNav.style.opacity = "0";
      circleNav.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
    circleNav.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    
    // Force reflow
      void circleNav.offsetWidth;
    
    requestAnimationFrame(() => {
      circleNav.style.opacity = "1";
      animateNavLinks();
    });
    }, 500);
  });

  // --- Auto Mode ---
  document.getElementById("auto-mode").addEventListener("click", function () {
    isAutomaticMode = true; // Add this line
    if (mqttClient) mqttClient.publish('controls/mode', 'AUTO'); // Add this line
    modeSelection.style.opacity = "0";
  modeSelection.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      modeSelection.style.display = "none";
      const autoSection = document.getElementById("automated-mode");
      autoSection.style.display = "block";
      autoSection.style.opacity = "0";
    autoSection.style.transition = "opacity 0.5s ease";
    
    // Force reflow
      void autoSection.offsetWidth;
    
    requestAnimationFrame(() => {
      autoSection.style.opacity = "1";
    });
    }, 500);
  });

  // --- Circle Nav Buttons ---
  navLinks.forEach(link => {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      const sectionId = this.getAttribute("data-section");
      
      // Hide circle nav with simple fade
      circleNav.style.opacity = "0";
      circleNav.style.transition = "opacity 0.3s ease";
      
      setTimeout(() => {
        circleNav.style.display = "none";
        
        if (this.classList.contains('menu-back-button')) {
          // Special handling for menu back button
          modeSelection.style.display = "flex";
          modeSelection.style.opacity = "0";
          modeSelection.style.transition = "opacity 0.3s ease";
          
          void modeSelection.offsetWidth;
          modeSelection.style.opacity = "1";
        } else {
          // Normal section handling
          const targetSection = document.getElementById(sectionId);
          targetSection.style.display = "block";
          targetSection.style.opacity = "0";
          targetSection.style.transition = "opacity 0.3s ease";
          
          void targetSection.offsetWidth;
          targetSection.style.opacity = "1";
        }
      }, 300);
    });
  });

  // --- Back Buttons ---
  backButtons.forEach(button => {
    button.addEventListener("click", function() {
      const currentSection = this.closest(".section");
      currentSection.style.opacity = "0";
      currentSection.style.transition = "opacity 0.5s ease";
  
      setTimeout(() => {
        currentSection.style.display = "none";
        
        // Reset circleNav transforms FIRST
        circleNav.style.display = "block";
        circleNav.style.transform = "translate(-50%, -50%) scale(0.95)"; // Start slightly smaller
        circleNav.style.opacity = "0";
        
        // Force reflow to apply initial state
        void circleNav.offsetWidth;
        
        // Animate to final state
        circleNav.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
        circleNav.style.opacity = "1";
        circleNav.style.transform = "translate(-50%, -50%) scale(1)";
        
        animateNavLinks();
      }, 500);
    });
  });

  autoBackButton.addEventListener("click", function () {
    const currentSection = this.closest(".section");
    currentSection.style.opacity = "0";
  currentSection.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      currentSection.style.display = "none";
      modeSelection.style.display = "flex";
      modeSelection.style.opacity = "0";
    modeSelection.style.transition = "opacity 0.5s ease";
    
    // Force reflow
      void modeSelection.offsetWidth;
    
    requestAnimationFrame(() => {
      modeSelection.style.opacity = "1";
    });
    }, 500);
  });

  // --- Animate Circle Nav Links ---
  function animateNavLinks() {
      navLinks.forEach((link, index) => {
        link.style.transform = "translate(-50%, -50%) scale(0)";
          link.style.opacity = "0";
          
          setTimeout(() => {
              link.style.animation = `linkAppear 0.8s ease forwards ${index * 0.15}s`;
          }, 10);
          
          // Reset any previous inline styles that might interfere
          link.addEventListener('animationend', function() {
              // Once animation completes, ensure we're at the right scale
              link.style.transform = "scale(1)";
              link.style.opacity = "1";
          }, {once: true});
          
          // Add hover effects directly
          link.addEventListener('mouseenter', () => {
              link.style.transform = 'scale(1.1)';
              if (link.querySelector('span')) {
                  link.querySelector('span').style.transform = 'scale(1.2)';
              }
          });

          link.addEventListener('mouseleave', () => {
              link.style.transform = 'scale(1)';
              if (link.querySelector('span')) {
                  link.querySelector('span').style.transform = 'scale(1)';
              }
          });
  });
}

// --- MQTT Integration ---
const mqttBrokerUrl = "wss://iot-team46.duckdns.org:9001:9001"; // Replace with your IP
let mqttClient;

try {
  const options = {
    keepalive: 60,  // Seconds between ping packets (default: 60)
    reconnectPeriod: 5000,  // Milliseconds between reconnection attempts
    connectTimeout: 30 * 1000  // 30 second connection timeout
  };
  
  mqttClient = mqtt.connect(mqttBrokerUrl, {
    username: 'team46',
    password: 'iotisthebestmqttisthebest!'
  });
  console.log("Attempting to connect to MQTT broker");
  
  mqttClient.on("connect", function () {
    console.log("Connected to MQTT broker");
  });
  
  mqttClient.on("error", function (error) {
    console.error("MQTT Error:", error);
  });
  
  mqttClient.on("close", function () {
    console.log("MQTT connection closed");
  });
} catch (error) {
  console.error("Error initializing MQTT client:", error);
}

// Current mode (manual or automatic)
let isAutomaticMode = false;

// Button event listeners for AC
const acPowerOnBtn = document.querySelector('#ac-control .cool-toggle.on');
const acPowerOffBtn = document.querySelector('#ac-control .cool-toggle.off');
const acTempSlider = document.getElementById("temp-slider");
const autoacTempSlider = document.getElementById("auto-temp-slider");

// Button event listeners for Fan
const fanPowerOnBtn = document.querySelector('#fan-control .cool-toggle.on');
const fanPowerOffBtn = document.querySelector('#fan-control .cool-toggle.off');

// Button event listeners for Window
const windowOpenBtn = document.querySelector('#window-control .cool-toggle.on');
const windowCloseBtn = document.querySelector('#window-control .cool-toggle.off');

// Toggle buttons in automated mode
const autoActiveBtn = document.querySelector('#automated-mode .cool-toggle.on');
const autoStandbyBtn = document.querySelector('#automated-mode .cool-toggle.off');

// Add event listeners for Manual Mode controls
if (acPowerOnBtn) {
  acPowerOnBtn.addEventListener('click', function() {
    if (!isAutomaticMode) {
      if (mqttClient) mqttClient.publish('controls/ac', acTempSlider.value);
      updateLEDDisplay(acTempSlider.value);
    }
  });
}

if (acPowerOffBtn) {
  acPowerOffBtn.addEventListener('click', function() {
    if (!isAutomaticMode) {
      if (mqttClient) mqttClient.publish('controls/ac', '0');
      updateLEDDisplay('off');
    }
  });
}

// if (acTempSlider) {
//   acTempSlider.addEventListener('input', function() {
//     if (!isAutomaticMode && acPowerOnBtn.classList.contains('on')) {
//       // Keep only within range 19-25
//       const value = Math.min(Math.max(parseInt(this.value), 19), 25);
//       document.getElementById("temp-value").textContent = value + "°C";
//       console.log("value of ac temperature changed to: " + value);
//       if (mqttClient) mqttClient.publish('controls/ac/temp', value.toString());
//       updateLEDDisplay(value);
//     }
//   });

//   // Adjust the temperature slider range
//   acTempSlider.min = "19";
//   acTempSlider.max = "25";
//   acTempSlider.value = "22";
//   document.getElementById("temp-value").textContent = "22°C";
// }
// if (autoacTempSlider) {
//   acTempSlider.addEventListener('input', function() {
//     if (isAutomaticMode) {
//       // Keep only within range 19-25
//       const value = Math.min(Math.max(parseInt(this.value), 19), 25);
//       document.getElementById("auto-temp-value").textContent = value + "°C";
//       console.log("value of ac temperature changed to: " + value);
//       if (mqttClient) mqttClient.publish('controls/ac/temp', value.toString());
//       updateLEDDisplay(value);
//     }
//   });

//   // Adjust the temperature slider range
//   acTempSlider.min = "19";
//   acTempSlider.max = "25";
//   acTempSlider.value = "22";
//   document.getElementById("temp-value").textContent = "22°C";
// }
if (fanPowerOnBtn) {
  fanPowerOnBtn.addEventListener('click', function() {
    if (!isAutomaticMode) {
      if (mqttClient) mqttClient.publish('controls/fan', 'on');
    }
  });
}

if (fanPowerOffBtn) {
  fanPowerOffBtn.addEventListener('click', function() {
    if (!isAutomaticMode) {
      if (mqttClient) mqttClient.publish('controls/fan', 'off');
    }
  });
}

if (windowOpenBtn) {
  windowOpenBtn.addEventListener('click', function() {
    if (!isAutomaticMode) {
      if (mqttClient) mqttClient.publish('controls/window', 'open');
    }
  });
}

if (windowCloseBtn) {
  windowCloseBtn.addEventListener('click', function() {
    if (!isAutomaticMode) {
      if (mqttClient) mqttClient.publish('controls/window', 'close');
    }
  });
}
// auto mode control
if (autoActiveBtn) {
  autoActiveBtn.addEventListener('click', function() {
    isAutomaticMode = true;
    if (mqttClient) {
      mqttClient.publish('controls/mode', 'AUTO'); // Changed to uppercase
      this.classList.add('on');
      this.classList.remove('off');
      autoStandbyBtn.classList.add('off');
      autoStandbyBtn.classList.remove('on');
    }
  });
}

if (autoStandbyBtn) {
  autoStandbyBtn.addEventListener('click', function() {
    isAutomaticMode = false;
    if (mqttClient) {
      mqttClient.publish('controls/mode', 'MANUAL'); // Changed from 'standby' to 'MANUAL'
      this.classList.add('on');
      this.classList.remove('off');
      autoActiveBtn.classList.add('off');
      autoActiveBtn.classList.remove('on');
      // Turn everything off in standby mode
      mqttClient.publish('controls/ac', '0');
      mqttClient.publish('controls/fan', 'off');
      mqttClient.publish('controls/window', 'close');
    }
    updateLEDDisplay('off');
  });
}

// Stats section standby button
const statsStandbyBtn = document.querySelector('#stats .cool-toggle.off');
if (statsStandbyBtn) {
  statsStandbyBtn.addEventListener('click', function() {
    if (mqttClient) {
      mqttClient.publish('controls/mode', 'standby');
      // Turn everything off in standby mode
      mqttClient.publish('controls/ac', '0');
      mqttClient.publish('controls/fan', 'off');
      mqttClient.publish('controls/window', 'close');
    }
    updateLEDDisplay('off');
  });
}

// Function to update LED display based on AC temperature
function updateLEDDisplay(temp) {
  const leds = document.querySelectorAll('.led-display .led');
  
  if (temp === 'off') {
    leds.forEach(led => led.classList.remove('active'));
    return;
  }
  
  // Convert temperature to binary representation (19-25 degrees => 001-111)
  const tempValue = parseInt(temp);
  const binaryValue = (tempValue - 19).toString(2).padStart(3, '0');
  
  // Update LEDs based on binary value
  leds.forEach((led, index) => {
    if (binaryValue[index] === '1') {
      led.classList.add('active');
    } else {
      led.classList.remove('active');
    }
  });
}

// Only set up MQTT if client exists
if (mqttClient) {
  mqttClient.on("connect", function () {
    console.log("Connected to MQTT broker at " + mqttBrokerUrl);

    // Subscribe to all relevant sensor topics
    const topics = [
      "controls/mode",          // Add this for mode changes
      "controls/fan",           // Add this for fan control
      "controls/ac",            // Add this for AC control
      "controls/ac/temp",
      "controls/window",        // Add this for window control
      "temphumid_code/temp_humidity",
      "sensor/co2",
      "room/peopleCount",
      "room/ac_control",
      "temphumid_code/fan_control",
      "temphumid_code/window_control"
    ];

    topics.forEach(topic => {
      mqttClient.subscribe(topic, function (err) {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`Subscribed to topic: ${topic}`);
        }
      });
    });
  });
  function updateSensorDisplay(elementId, value, unit) {
    const element = typeof elementId === 'string' && elementId.startsWith('#') 
      ? document.querySelector(elementId)
      : document.getElementById(elementId);
    
    if (element) {
      element.textContent = (value !== undefined && value !== null)
        ? `${value} ${unit || ''}` 
        : 'N/A';
        // : `-- ${unit}`;
    }
  }
  mqttClient.on("message", function (topic, message) {
const value = message.toString();
console.log(`Received message on ${topic}: ${value}`);

// 1. Handle sensor data
if (topic === "sensor/co2") {
  updateSensorDisplay("stats-co2", value, "ppm");
  updateSensorDisplay("#automated-mode .sensor-item:nth-child(3) .sensor-value", value, "ppm");
} 
else if (topic === "temphumid_code/temp_humidity") {
  try {
    const data = JSON.parse(value);
    updateSensorDisplay("stats-temperature", data.temperature, "°C");
    updateSensorDisplay("stats-humidity", data.humidity, "%");
    updateSensorDisplay("#automated-mode .sensor-item:nth-child(1) .sensor-value", data.temperature, "°C");
    updateSensorDisplay("#automated-mode .sensor-item:nth-child(2) .sensor-value", data.humidity, "%");
  } catch (e) {
    console.error("Error parsing temp/humidity data:", e);
  }
}
else if (topic === "room/peopleCount") {
  updateSensorDisplay("stats-occupancy", value, "people");
  updateSensorDisplay("automated-occupancy", value, "people");
}

// 2. Handle device status updates
else if (topic === "room/ac_control") {
  // AC sends "22" for ON, "0" for OFF
  updateDeviceStatus('ac', value === "0" ? "OFF" : "ON");
} 
else if (topic === "temphumid_code/fan_control") {
  // Fan sends "ON"/"OFF" in uppercase
  updateDeviceStatus('fan', value === "ON" ? "ON" : "OFF");
} 
else if (topic === "temphumid_code/window_control") {
  // Window sends JSON payload like {"window": "OPEN"} 
  try {
    const windowData = JSON.parse(value);
    updateDeviceStatus('window', windowData.window === "OPEN" ? "OPEN" : "CLOSED");
  } catch (e) {
    console.error("Error parsing window status:", e);
  }
}

// 3. Keep your existing mode/control handling
else if (topic === "controls/mode") {
  const mode = value.toUpperCase();
  isAutomaticMode = (mode === "AUTO");
  
  // if (mode === "AUTO") {
  //   // document.querySelector('#auto-active').classList.add('on');
  //   // document.querySelector('#auto-active').classList.remove('off');
  //   // document.querySelector('#auto-standby').classList.add('off');
  //   // document.querySelector('#auto-standby').classList.remove('on');
  // } else {
  //   document.querySelector('#auto-active').classList.add('off');
  //   document.querySelector('#auto-active').classList.remove('on');
  //   document.querySelector('#auto-standby').classList.add('on');
  //   document.querySelector('#auto-standby').classList.remove('off');
  // }
}
});

// Add this helper function BELOW the message handler
function updateDeviceStatus(device, status) {
// Update stats section
const statIndex = { ac: 1, fan: 2, window: 3 }[device];
const statElement = document.querySelector(`#stats .device-status .status-item:nth-child(${statIndex})`);

if (statElement) {
  statElement.querySelector('.status-indicator').className = 
    `status-indicator ${status === 'ON' || status === 'OPEN' ? 'on' : 'off'} small`;
  statElement.querySelector('span').textContent = 
    `${device.toUpperCase()}: ${status}`;
}

// Update automated mode section
const autoIndex = { ac: 1, fan: 2, window: 3 }[device];
const autoElement = document.querySelector(`#automated-mode .sensor-grid:nth-of-type(2) .sensor-item:nth-child(${autoIndex})`);

if (autoElement) {
  autoElement.querySelector('.status-indicator').className = 
    `status-indicator ${status === 'ON' || status === 'OPEN' ? 'on' : 'off'} small`;
  autoElement.querySelector('.sensor-value').textContent = status;
}
}
  // mqttClient.on("message", function (topic, message) {
  //   const value = message.toString();
  //   console.log(`Received message on ${topic}: ${value}`);
  //   if (topic === "sensor/co2") {
  //     updateSensorDisplay("stats-co2", value, "ppm");
  //     updateSensorDisplay("#automated-mode .sensor-item:nth-child(3) .sensor-value", value, "ppm");
  //   } 
  //   else if (topic === "temphumid_code/temp_humidity") {
  //     try {
  //       const data = JSON.parse(value);
  //       updateSensorDisplay("stats-temperature", data.temperature, "°C");
  //       updateSensorDisplay("stats-humidity", data.humidity, "%");
  //       updateSensorDisplay("#automated-mode .sensor-item:nth-child(1) .sensor-value", data.temperature, "°C");
  //       updateSensorDisplay("#automated-mode .sensor-item:nth-child(2) .sensor-value", data.humidity, "%");
  //     } catch (e) {
  //       console.error("Error parsing temp/humidity data:", e);
  //     }
  //   }
  //   else if (topic === "room/peopleCount") {
  //     updateSensorDisplay("stats-occupancy", value, "people");
  //     updateSensorDisplay("automated-occupancy", value, "people");
  //   }
    // function updateSensorDisplay(elementId, value, unit) {
    //   const element = typeof elementId === 'string' && elementId.startsWith('#') 
    //     ? document.querySelector(elementId)
    //     : document.getElementById(elementId);
      
    //   if (element) {
    //     element.textContent = value !== undefined && value !== null 
    //       ? `${value} ${unit}` 
    //       : `-- ${unit}`;
    //   }
    // }
  //   if (topic === "sensors/temperature") {
  //     document.getElementById("stat-temperature").innerText = value + "°C";
  //   } else if (topic === "sensors/humidity") {
  //     document.getElementById("stat-humidity").innerText = value + "%";
  //   } else if (topic === "sensors/air_quality") {
  //     document.getElementById("stat-co2").innerText = value + " ppm";
  //   } else if (topic === "sensors/occupancy") {
  //     document.getElementById("stat-occupancy").innerText = value + " people";
  //   } else if (topic === "actuators/ac") {
  //     const acStatusElem = document.querySelector("#stats .device-status .status-item:nth-child(1) span");
  //     const acIndicator = document.querySelector("#stats .device-status .status-item:nth-child(1) .status-indicator");
      
  //     if (value === "on") {
  //       acStatusElem.innerText = "AC: ON";
  //       acIndicator.classList.add("on");
  //       acIndicator.classList.remove("off");
  //     } else {
  //       acStatusElem.innerText = "AC: OFF";
  //       acIndicator.classList.add("off");
  //       acIndicator.classList.remove("on");
  //     }
  //   } else if (topic === "actuators/fan") {
  //     const fanStatusElem = document.querySelector("#stats .device-status .status-item:nth-child(2) span");
  //     const fanIndicator = document.querySelector("#stats .device-status .status-item:nth-child(2) .status-indicator");
      
  //     if (value === "on") {
  //       fanStatusElem.innerText = "Fan: ON";
  //       fanIndicator.classList.add("on");
  //       fanIndicator.classList.remove("off");
  //     } else {
  //       fanStatusElem.innerText = "Fan: OFF";
  //       fanIndicator.classList.add("off");
  //       fanIndicator.classList.remove("on");
  //     }
  //   } else if (topic === "actuators/window") {
  //     const windowStatusElem = document.querySelector("#stats .device-status .status-item:nth-child(3) span");
  //     const windowIndicator = document.querySelector("#stats .device-status .status-item:nth-child(3) .status-indicator");
      
  //     if (value === "open") {
  //       windowStatusElem.innerText = "Window: OPEN";
  //       windowIndicator.classList.add("on");
  //       windowIndicator.classList.remove("off");
  //     } else {
  //       windowStatusElem.innerText = "Window: CLOSED";
  //       windowIndicator.classList.add("off");
  //       windowIndicator.classList.remove("on");
  //     }
  //   }
  // });

  mqttClient.on("error", function(error) {
    console.error("MQTT client error:", error);
  });
} else {
  console.log("MQTT client not initialized - functionality limited");
}

console.log("DOM Content Loaded - Smart Home Climate System initialized");
});