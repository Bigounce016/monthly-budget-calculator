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

    async function getCareers() {
        const url = "https://eecu-data-server.vercel.app/data";
        try {
            const response = await fetch(url);
            const jobs = await response.json();
            createOptions(jobs);
            return jobs;
        }
        catch (error) {
            console.error("Error fetching careers data:", error);
            return [];
        }
    }

    function createOptions(careers) {
        const dropdown = document.getElementById("career");

        careers.forEach((career, index) => {
        const option = document.createElement("option");

         option.innerHTML = `${career.Occupation}: $${career.Salary}`;
         option.setAttribute("id", `${index}`);

        dropdown.appendChild(option);
        });

        dropdown.addEventListener("input", (input) => { //maybe replace with "options.addEventListener"?
            console.log(input); //figure out a way to grab necessary information based off which option was clicked
        })
    }
    getCareers();

    function calcSaveChart() {
        const inputs = document.getElementsByClassName("expense"); //grab all input boxes
        const savedExpenses = {};
        let house = 0;
        let transport = 0; //variables for chart and totals
        let education = 0;
        let food = 0;
        let savings = 0;

        let total = 0;
        inputs.forEach(input => {
            total += Number(input.value.replace(/[^0-9]/g, '')) || 0; //adds input value to sum, only takes integers
            savedExpenses[input.id] = Number(input.value.replace(/[^0-9]/g, '')) || 0; //adds input to object

            if(input.classList.contains("house")) {
                house += Number(input.value.replace(/[^0-9]/g, '')) || 0; //checks class list, if match, add to class total
            }
            else if(input.classList.contains("transport")) {
                transport += Number(input.value.replace(/[^0-9]/g, '')) || 0;
            }
            else if(input.classList.contains("education")) {
                education += Number(input.value.replace(/[^0-9]/g, '')) || 0;
            }
            else if(input.classList.contains("food")) {
                food += Number(input.value.replace(/[^0-9]/g, '')) || 0;
            }
            else if(input.classList.contains("savings")) {
                savings += Number(input.value.replace(/[^0-9]/g, '')) || 0;
            }

            localStorage.setItem("savedExpenses", JSON.stringify(savedExpenses)); //saving object
        });
    }
}





document.addEventListener("DOMContentLoaded", init);