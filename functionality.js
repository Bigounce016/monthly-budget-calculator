// write logic to show / hide elements based on the step


function init() {
    const steps = document.querySelectorAll(".step a"); // Select all step circles
    const content = document.querySelectorAll(".step-content"); // Select all content sections
    steps.forEach((step, index) => {
        step.addEventListener("click", () => {
            // Remove active class from all steps
            document.querySelectorAll(".step").forEach(step => step.classList.remove("active"));
            // Add active class to clicked step
            step.parentElement.classList.add("active");

            // add logic to hide / reveal elements based on the step
            content.forEach((section, i) => {
                if (i === index) {
                    section.classList.add("active");
                } else {
                    section.classList.remove("active");
                }
            });

        });
    });
}





document.addEventListener("DOMContentLoaded", init);