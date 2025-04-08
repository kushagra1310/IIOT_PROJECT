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
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const sectionId = this.getAttribute("data-section");

      circleNav.style.opacity = "0";
      circleNav.style.transform = "translate(-50%, -50%) scale(0.5) rotate(180deg)";
      circleNav.style.transition = "opacity 0.5s ease, transform 0.5s ease";

      setTimeout(() => {
        circleNav.style.display = "none";
        const targetSection = document.getElementById(sectionId);
        targetSection.style.display = "block";
        targetSection.style.opacity = "0";
        targetSection.style.transition = "opacity 0.5s ease";
        
        // Force reflow
        void targetSection.offsetWidth;
        
        requestAnimationFrame(() => {
          targetSection.style.opacity = "1";
        });
      }, 500);
    });
  });

  // --- Back Buttons ---
  backButtons.forEach(button => {
    button.addEventListener("click", function () {
      const currentSection = this.closest(".section");
      currentSection.style.opacity = "0";
      currentSection.style.transition = "opacity 0.5s ease";

      setTimeout(() => {
        currentSection.style.display = "none";
        circleNav.style.display = "block";
        circleNav.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
        circleNav.style.opacity = "0";
        circleNav.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        
        // Force reflow
        void circleNav.offsetWidth;
        
        requestAnimationFrame(() => {
          circleNav.style.opacity = "1";
          animateNavLinks();
        });
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
      link.style.transform = "scale(0)";
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
  const mqttBrokerUrl = "ws://192.168.22.225:1883"; // Replace with your IP
  let mqttClient;
  
  try {
    mqttClient = mqtt.connect(mqttBrokerUrl);
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
        if (mqttClient) mqttClient.publish('controls/ac', 'on');
        updateLEDDisplay(acTempSlider.value);
      }
    });
  }
  
  if (acPowerOffBtn) {
    acPowerOffBtn.addEventListener('click', function() {
      if (!isAutomaticMode) {
        if (mqttClient) mqttClient.publish('controls/ac', 'off');
        updateLEDDisplay('off');
      }
    });
  }
  
  if (acTempSlider) {
    acTempSlider.addEventListener('input', function() {
      if (!isAutomaticMode && acPowerOnBtn.classList.contains('on')) {
        // Keep only within range 19-25
        const value = Math.min(Math.max(parseInt(this.value), 19), 25);
        document.getElementById("temp-value").textContent = value + "°C";
        if (mqttClient) mqttClient.publish('controls/ac/temp', value.toString());
        updateLEDDisplay(value);
      }
    });
  
    // Adjust the temperature slider range
    acTempSlider.min = "19";
    acTempSlider.max = "25";
    acTempSlider.value = "22";
    document.getElementById("temp-value").textContent = "22°C";
  }
  
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
  
  // Auto mode control
  if (autoActiveBtn) {
    autoActiveBtn.addEventListener('click', function() {
      isAutomaticMode = true;
      if (mqttClient) mqttClient.publish('controls/mode', 'auto');
    });
  }
  
  if (autoStandbyBtn) {
    autoStandbyBtn.addEventListener('click', function() {
      isAutomaticMode = false;
      if (mqttClient) mqttClient.publish('controls/mode', 'standby');
      // Turn everything off in standby mode
      if (mqttClient) {
        mqttClient.publish('controls/ac', 'off');
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
        mqttClient.publish('controls/ac', 'off');
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
        "sensors/temperature",
        "sensors/humidity",
        "sensors/air_quality",
        "sensors/occupancy",
        "actuators/ac",
        "actuators/fan",
        "actuators/window"
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

    mqttClient.on("message", function (topic, message) {
      const value = message.toString();
      console.log(`Received message on ${topic}: ${value}`);

      if (topic === "sensors/temperature") {
        document.getElementById("stat-temperature").innerText = value + "°C";
      } else if (topic === "sensors/humidity") {
        document.getElementById("stat-humidity").innerText = value + "%";
      } else if (topic === "sensors/air_quality") {
        document.getElementById("stat-co2").innerText = value + " ppm";
      } else if (topic === "sensors/occupancy") {
        document.getElementById("stat-occupancy").innerText = value + " people";
      } else if (topic === "actuators/ac") {
        const acStatusElem = document.querySelector("#stats .device-status .status-item:nth-child(1) span");
        const acIndicator = document.querySelector("#stats .device-status .status-item:nth-child(1) .status-indicator");
        
        if (value === "on") {
          acStatusElem.innerText = "AC: ON";
          acIndicator.classList.add("on");
          acIndicator.classList.remove("off");
        } else {
          acStatusElem.innerText = "AC: OFF";
          acIndicator.classList.add("off");
          acIndicator.classList.remove("on");
        }
      } else if (topic === "actuators/fan") {
        const fanStatusElem = document.querySelector("#stats .device-status .status-item:nth-child(2) span");
        const fanIndicator = document.querySelector("#stats .device-status .status-item:nth-child(2) .status-indicator");
        
        if (value === "on") {
          fanStatusElem.innerText = "Fan: ON";
          fanIndicator.classList.add("on");
          fanIndicator.classList.remove("off");
        } else {
          fanStatusElem.innerText = "Fan: OFF";
          fanIndicator.classList.add("off");
          fanIndicator.classList.remove("on");
        }
      } else if (topic === "actuators/window") {
        const windowStatusElem = document.querySelector("#stats .device-status .status-item:nth-child(3) span");
        const windowIndicator = document.querySelector("#stats .device-status .status-item:nth-child(3) .status-indicator");
        
        if (value === "open") {
          windowStatusElem.innerText = "Window: OPEN";
          windowIndicator.classList.add("on");
          windowIndicator.classList.remove("off");
        } else {
          windowStatusElem.innerText = "Window: CLOSED";
          windowIndicator.classList.add("off");
          windowIndicator.classList.remove("on");
        }
      }
    });

    mqttClient.on("error", function(error) {
      console.error("MQTT client error:", error);
    });
  } else {
    console.log("MQTT client not initialized - functionality limited");
  }

  console.log("DOM Content Loaded - Smart Home Climate System initialized");
});