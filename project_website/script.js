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
    startButton.disabled = true;
    landingPage.style.opacity = "0";
    landingPage.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      landingPage.style.display = "none";
      modeSelection.style.display = "flex";
      modeSelection.style.opacity = "0";
      modeSelection.style.transition = "opacity 0.5s ease";
    
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
          
          link.addEventListener('animationend', function() {
              link.style.transform = "scale(1)";
              link.style.opacity = "1";
          }, {once: true});
          
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
  const mqttBrokerUrl = "ws://192.168.22.225:1883";
  let mqttClient;
  let isAutomaticMode = false;

  try {
      mqttClient = mqtt.connect(mqttBrokerUrl);
      console.log("Attempting to connect to MQTT broker");
      
      mqttClient.on("connect", function () {
          console.log("Connected to MQTT broker");
      });
      
      mqttClient.on("error", function (error) {
          console.error("MQTT Error:", error);
      });
      
  } catch (error) {
      console.error("Error initializing MQTT client:", error);
  }

  // --- Fan Control Logic ---
  const fanPowerOnBtn = document.querySelector('#fan-control .cool-toggle.on');
  const fanPowerOffBtn = document.querySelector('#fan-control .cool-toggle.off');

  if (fanPowerOnBtn) {
      fanPowerOnBtn.addEventListener('click', function() {
          if (!isAutomaticMode && mqttClient) {
              mqttClient.publish('temphumid_code/fan_control', 'ON');
              console.log("Fan ON command sent");
          }
      });
  }

  if (fanPowerOffBtn) {
      fanPowerOffBtn.addEventListener('click', function() {
          if (!isAutomaticMode && mqttClient) {
              mqttClient.publish('temphumid_code/fan_control', 'OFF');
              console.log("Fan OFF command sent");
          }
      });
  }

  // --- Window Control Logic ---
  const windowOpenBtn = document.querySelector('#window-control .cool-toggle.on');
  const windowCloseBtn = document.querySelector('#window-control .cool-toggle.off');

  if (windowOpenBtn) {
      windowOpenBtn.addEventListener('click', function() {
          if (!isAutomaticMode && mqttClient) {
              mqttClient.publish('temphumid_code/window_control', 'OPEN');
              console.log("Window OPEN command sent");
          }
      });
  }

  if (windowCloseBtn) {
      windowCloseBtn.addEventListener('click', function() {
          if (!isAutomaticMode && mqttClient) {
              mqttClient.publish('temphumid_code/window_control', 'CLOSE');
              console.log("Window CLOSE command sent");
          }
      });
  }

  // --- Status Updates (Optional: Add if ESP32s publish status) ---
  if (mqttClient) {
      mqttClient.subscribe('actuators/fan');
      mqttClient.subscribe('actuators/window');
      
      mqttClient.on("message", function (topic, message) {
          const value = message.toString();
          console.log(`Received message on ${topic}: ${value}`);
          
          // Update fan status indicator
          if (topic === 'actuators/fan') {
              const fanIndicator = document.querySelector("#stats .device-status .status-item:nth-child(2) .status-indicator");
              if (value === "ON") {
                  fanIndicator.classList.add("on");
                  fanIndicator.classList.remove("off");
              } else {
                  fanIndicator.classList.add("off");
                  fanIndicator.classList.remove("on");
              }
          }
          
          // Update window status indicator
          if (topic === 'actuators/window') {
              const windowIndicator = document.querySelector("#stats .device-status .status-item:nth-child(3) .status-indicator");
              if (value === "OPEN") {
                  windowIndicator.classList.add("on");
                  windowIndicator.classList.remove("off");
              } else {
                  windowIndicator.classList.add("off");
                  windowIndicator.classList.remove("on");
              }
          }
      });
  }
});