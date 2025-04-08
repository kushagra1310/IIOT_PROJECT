document.addEventListener("DOMContentLoaded", function() {
    const startButton = document.getElementById("start-button");
    const landingPage = document.getElementById("landing-page");
    const modeSelection = document.getElementById("mode-selection");
    const circleNav = document.getElementById("circle-nav");
    const navLinks = document.querySelectorAll(".circle-link");
    const sections = document.querySelectorAll(".section");
    const backButtons = document.querySelectorAll(".back-button");

    modeSelection.style.display = "none";
    circleNav.style.display = "none";
    sections.forEach(section => section.style.display = "none");

    startButton.addEventListener("click", function() {
        startButton.disabled = true;
        landingPage.style.opacity = "0";

        setTimeout(() => {
            landingPage.style.display = "none";
            modeSelection.style.display = "flex";
            modeSelection.style.animation = "fadeIn 0.8s ease forwards";
        }, 1000);
    });

    document.getElementById("manual-mode").addEventListener("click", function() {
        modeSelection.style.animation = "fadeOut 0.5s ease forwards";

        setTimeout(() => {
            modeSelection.style.display = "none";
            circleNav.style.display = "block";
            animateNavLinks();
        }, 500);
    });

    document.getElementById("auto-mode").addEventListener("click", function() {
        alert("Automated mode selected!");
    });

    navLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute("data-section");

            circleNav.style.transition = "all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
            circleNav.style.opacity = "0";
            circleNav.style.transform = "translate(-50%, -50%) scale(0.5) rotate(180deg)";

            setTimeout(() => {
                circleNav.style.display = "none";
                const activeSection = document.getElementById(sectionId);
                activeSection.style.display = "block";
                activeSection.style.animation = "fadeIn 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards";
            }, 500);
        });
    });

    backButtons.forEach(button => {
        button.addEventListener("click", function() {
            const currentSection = this.closest(".section");
            currentSection.style.animation = "fadeOut 0.5s ease forwards";

            setTimeout(() => {
                currentSection.style.display = "none";
                circleNav.style.display = "block";
                circleNav.style.animation = "scaleIn 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards";
                animateNavLinks();
            }, 500);
        });
    });

    function animateNavLinks() {
        navLinks.forEach((link, index) => {
            link.style.animation = `linkAppear 0.8s ease forwards ${index * 0.15}s`;

            link.addEventListener('mouseenter', () => {
                link.style.transform = 'scale(1.1)';
                link.querySelector('span').style.transform = 'scale(1.2)';
            });

            link.addEventListener('mouseleave', () => {
                link.style.transform = 'scale(1)';
                link.querySelector('span').style.transform = 'scale(1)';
            });
        });
    }
});
