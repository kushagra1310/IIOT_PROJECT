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
  
      setTimeout(() => {
        landingPage.style.display = "none";
        modeSelection.style.display = "flex";
        modeSelection.style.opacity = "0";
    });
  
    // --- Manual Mode ---
    document.getElementById("manual-mode").addEventListener("click", function () {
      modeSelection.style.opacity = "0";
  
      setTimeout(() => {
        modeSelection.style.display = "none";
        circleNav.style.display = "block";
        circleNav.style.opacity = "0";
        circleNav.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
        void circleNav.offsetWidth;
        circleNav.style.opacity = "1";
        animateNavLinks();
      }, 500);
    });
  
    // --- Auto Mode ---
    document.getElementById("auto-mode").addEventListener("click", function () {
      modeSelection.style.opacity = "0";
  
      setTimeout(() => {
        modeSelection.style.display = "none";
        const autoSection = document.getElementById("automated-mode");
        autoSection.style.display = "block";
        autoSection.style.opacity = "0";
        void autoSection.offsetWidth;
        autoSection.style.opacity = "1";
      }, 500);
    });
  
    // --- Circle Nav Buttons ---
    navLinks.forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const sectionId = this.getAttribute("data-section");
  
        circleNav.style.opacity = "0";
        circleNav.style.transform = "translate(-50%, -50%) scale(0.5) rotate(180deg)";
  
        setTimeout(() => {
          circleNav.style.display = "none";
          const targetSection = document.getElementById(sectionId);
          targetSection.style.display = "block";
          targetSection.style.opacity = "0";
          void targetSection.offsetWidth;
          targetSection.style.opacity = "1";
        }, 500);
      });
    });
  
    // --- Back Buttons ---
    backButtons.forEach(button => {
<<<<<<< HEAD
      button.addEventListener("click", function () {
=======
        button.addEventListener("click", function() {
            const currentSection = this.closest(".section");
            currentSection.style.opacity = "0";

            setTimeout(() => {
                currentSection.style.display = "none";
                circleNav.style.display = "block";
                
                // Reset transform fully to initial state
                circleNav.style.transform = "translate(-50%, -50%)";
                circleNav.style.opacity = "0";
                
                // Force reflow
                void circleNav.offsetWidth;
                
                circleNav.style.opacity = "1";
                animateNavLinks();
            }, 500);
        });
    });

    autoBackButton.addEventListener("click", function() {
>>>>>>> eea770d8e96730458e61ff7bb7be58024c9aa3b0
        const currentSection = this.closest(".section");
        currentSection.style.opacity = "0";
  
        setTimeout(() => {
          currentSection.style.display = "none";
          circleNav.style.display = "block";
          circleNav.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
          circleNav.style.opacity = "0";
          void circleNav.offsetWidth;
          circleNav.style.opacity = "1";
          animateNavLinks();
        }, 500);
      });
    });
  
    autoBackButton.addEventListener("click", function () {
      const currentSection = this.closest(".section");
      currentSection.style.opacity = "0";
  
      setTimeout(() => {
        currentSection.style.display = "none";
        modeSelection.style.display = "flex";
        modeSelection.style.opacity = "0";
        void modeSelection.offsetWidth;
        modeSelection.style.opacity = "1";
      }, 500);
    });
  
    // --- Animate Circle Nav Links ---
    function animateNavLinks() {
<<<<<<< HEAD
      navLinks.forEach((link, index) => {
        link.style.transform = "scale(0)";
        link.style.opacity = "0";
  
        setTimeout(() => {
          link.style.animation = `linkAppear 0.8s ease forwards ${index * 0.15}s`;
        }, 10);
  
        link.addEventListener("mouseenter", () => {
          link.style.transform = "scale(1.1)";
          if (link.querySelector("span")) {
            link.querySelector("span").style.transform = "scale(1.2)";
          }
=======
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
>>>>>>> eea770d8e96730458e61ff7bb7be58024c9aa3b0
        });
  
        link.addEventListener("mouseleave", () => {
          link.style.transform = "scale(1)";
          if (link.querySelector("span")) {
            link.querySelector("span").style.transform = "scale(1)";
          }
        });
      });
    }
<<<<<<< HEAD
  
    // --- MQTT Integration ---
    const mqttBrokerUrl = "ws://192.168.22.225:1883"; // Replace with your IP
    const mqttClient = mqtt.connect(mqttBrokerUrl);
  
    mqttClient.on("connect", function () {
      console.log("Connected to MQTT broker at " + mqttBrokerUrl);
  
      // Subscribe to all relevant sensor topics
      const topics = [
        "sensors/temperature",
        "sensors/humidity",
        "sensors/co2",
        "sensors/occupancy"
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
      } else if (topic === "sensors/co2") {
        document.getElementById("stat-co2").innerText = value + " ppm";
      } else if (topic === "sensors/occupancy") {
        document.getElementById("stat-occupancy").innerText = value + " people";
      }
    });
  
    // --- Optional: Direct Section Button Handlers (if outside circle nav) ---
    function setupSectionButton(buttonId, sectionId) {
      const btn = document.getElementById(buttonId);
      const section = document.getElementById(sectionId);
  
      if (btn && section) {
        btn.addEventListener("click", () => {
          circleNav.style.opacity = "0";
          circleNav.style.transform = "translate(-50%, -50%) scale(0.5) rotate(180deg)";
  
          setTimeout(() => {
            circleNav.style.display = "none";
            section.style.display = "block";
            section.style.opacity = "0";
            void section.offsetWidth;
            section.style.opacity = "1";
          }, 500);
        });
      }
    }
  
    // If you have direct buttons:
    setupSectionButton("ac-button", "ac-section");
    setupSectionButton("fan-button", "fan-section");
    setupSectionButton("light-button", "light-section");
    // Add more if needed
  });
  
=======

    // Add event listeners for sliders and toggles for a more interactive demo
    
    // Temperature slider
    const tempSlider = document.getElementById("temp-slider");
    const tempValue = document.getElementById("temp-value");
    if (tempSlider && tempValue) {
        tempSlider.addEventListener("input", function() {
            tempValue.textContent = this.value + "°C";
        });
    }
    
    // Fan speed slider
    const fanSpeedSlider = document.getElementById("fan-speed-slider");
    const fanSpeedValue = document.getElementById("fan-speed-value");
    if (fanSpeedSlider && fanSpeedValue) {
        fanSpeedSlider.addEventListener("input", function() {
            const value = this.value;
            let speedText = "Medium";
            if (value <= 2) speedText = "Low";
            else if (value >= 4) speedText = "High";
            fanSpeedValue.textContent = `${speedText} (${value})`;
        });
    }
    
    // Window slider
    const windowSlider = document.getElementById("window-slider");
    const windowValue = document.getElementById("window-value");
    if (windowSlider && windowValue) {
        windowSlider.addEventListener("input", function() {
            windowValue.textContent = this.value + "%";
        });
    }
    
    // Auto temperature slider
    const autoTempSlider = document.getElementById("auto-temp-slider");
    const autoTempValue = document.getElementById("auto-temp-value");
    if (autoTempSlider && autoTempValue) {
        autoTempSlider.addEventListener("input", function() {
            autoTempValue.textContent = this.value + "°C";
        });
    }
    
    // Toggle buttons
    const toggleButtons = document.querySelectorAll(".cool-toggle");
    toggleButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Get all siblings in the toggle container
            const container = this.closest(".toggle-container");
            const siblings = container.querySelectorAll(".cool-toggle");
            
            // Remove 'on' class and add 'off' class to all siblings
            siblings.forEach(sibling => {
                sibling.classList.remove("on");
                sibling.classList.add("off");
            });
            
            // Add 'on' class and remove 'off' class from the clicked button
            this.classList.add("on");
            this.classList.remove("off");
        });
    });
});
>>>>>>> eea770d8e96730458e61ff7bb7be58024c9aa3b0
