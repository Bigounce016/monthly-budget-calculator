// write logic to show / hide elements based on the step


function init() {
    const steps = document.querySelectorAll(".step a"); // Select all step circles
    const content = document.querySelectorAll(".step-content"); // Select all content sections
    const inputs = document.querySelectorAll(".expense"); //grab all input boxes
    const canvas = document.getElementById("myChart");
    const calculator = document.getElementById("Calculator");

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
        const url = "https://eecu-data-server.vercel.app/data"; //grab url
        try {
            const response = await fetch(url); //wait to grab array of objects
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
        const option = document.createElement("option"); //creatng options for dropdown

         option.innerHTML = `${career.Occupation}: $${career.Salary}`;
         option.setAttribute("id", `${index}`); //assigning ids
         option.addEventListener("click", () => {
            console.log(career.Salary);
         })

        dropdown.appendChild(option);
        });
    }

    let currentChart = new Chart(canvas, 
        {
           type: "doughnut",
           data: {
             labels: ["House", "Transport", "Education", "Food", "Savings"],
             datasets: [{ label: "$", data: [0, 0, 0, 0, 0] }]
           },
           options: {
             plugins: {
               title: { display: true, text: `Expenses by Catagory` }
             }
           }
         }
   )

    getCareers();
    save();
    function calcSaveChart() {

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
        });
        localStorage.setItem("savedExpenses", JSON.stringify(savedExpenses)); //saving object

        if (currentChart) currentChart.destroy(); //destroy chart
        currentChart = new Chart(canvas, //new chart
            {
               type: "doughnut",
               data: {
                 labels: ["House", "Transport", "Education", "Food", "Savings"],
                 datasets: [{ label: "$", data: [house, transport, education, food, savings] }]
               },
               options: {
                 plugins: {
                   title: { display: true, text: `Expenses by Catagory` }
                 }
               }
             }
       )
    }

    function save() {
        const pullExpenses = JSON.parse(localStorage.getItem("savedExpenses")); //grab object
        inputs.forEach(input => {
        if(pullExpenses){
            if(pullExpenses[input.id]){
                input.value = pullExpenses[input.id] //grab object and insert saved values in textbox
            }
        }
        calcSaveChart();
        })   
    }
    calculator.addEventListener("input", ()=>{
        calcSaveChart(); //for any input, run calculations, save, and chart
    })

}





document.addEventListener("DOMContentLoaded", init); //will run upon page loading