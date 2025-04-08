document.addEventListener("DOMContentLoaded", function() {
    const startButton = document.getElementById("start-button");
    const landingPage = document.getElementById("landing-page");
    const modeSelection = document.getElementById("mode-selection");
    const circleNav = document.getElementById("circle-nav");
    const navLinks = document.querySelectorAll(".circle-link");
    const sections = document.querySelectorAll(".section");
    const backButtons = document.querySelectorAll(".back-button");
    const autoBackButton = document.querySelector(".auto-back-button");

    // Make sure everything is properly hidden at the start
    modeSelection.style.display = "none";
    circleNav.style.display = "none";
    sections.forEach(section => section.style.display = "none");

    startButton.addEventListener("click", function() {
        startButton.disabled = true;
        landingPage.style.opacity = "0";

        setTimeout(() => {
            landingPage.style.display = "none";
            modeSelection.style.display = "flex";
            modeSelection.style.opacity = "0";
            
            // Force reflow to ensure the opacity transition works
            void modeSelection.offsetWidth;
            
            modeSelection.style.opacity = "1";
        }, 800);
    });

    document.getElementById("manual-mode").addEventListener("click", function() {
        modeSelection.style.opacity = "0";

        setTimeout(() => {
            modeSelection.style.display = "none";
            circleNav.style.display = "block";
            
            // Reset the transform properly before showing
            circleNav.style.transform = "translate(-50%, -50%)";
            circleNav.style.opacity = "0";
            
            // Force reflow
            void circleNav.offsetWidth;
            
            circleNav.style.opacity = "1";
            animateNavLinks();
        }, 500);
    });

    document.getElementById("auto-mode").addEventListener("click", function() {
        modeSelection.style.opacity = "0";
        
        setTimeout(() => {
            modeSelection.style.display = "none";
            const autoSection = document.getElementById("automated-mode");
            autoSection.style.display = "block";
            autoSection.style.opacity = "0";
            
            // Force reflow
            void autoSection.offsetWidth;
            
            autoSection.style.opacity = "1";
        }, 500);
    });

    // Fix the circle link click handlers
    navLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute("data-section");
            
            circleNav.style.opacity = "0";
            circleNav.style.transform = "translate(-50%, -50%) scale(0.5) rotate(180deg)";

            setTimeout(() => {
                circleNav.style.display = "none";
                const activeSection = document.getElementById(sectionId);
                activeSection.style.display = "block";
                activeSection.style.opacity = "0";
                
                // Force reflow
                void activeSection.offsetWidth;
                
                activeSection.style.opacity = "1";
            }, 500);
        });
    });

    backButtons.forEach(button => {
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
        const currentSection = this.closest(".section");
        currentSection.style.opacity = "0";

        setTimeout(() => {
            currentSection.style.display = "none";
            modeSelection.style.display = "flex";
            modeSelection.style.opacity = "0";
            
            // Force reflow
            void modeSelection.offsetWidth;
            
            modeSelection.style.opacity = "1";
        }, 500);
    });

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