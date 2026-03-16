
function init() {
  const steps = document.querySelectorAll('.step a');
  const content = document.querySelectorAll('.step-content');
  const canvas = document.getElementById('myChart');
  const calculator = document.getElementById('Calculator');

  // Step navigation
  steps.forEach((step, index) => {
    step.addEventListener('click', () => {
      document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
      step.parentElement.classList.add('active');
      content.forEach((section, i) => {
        if (i === index) section.classList.add('active');
        else section.classList.remove('active');
      });
    });
  });

  // Create dynamic expense input
  function createExpenseInput(expenseType) {
    const expenseContainer = document.getElementById(`${expenseType}-expenses`);
    if (!expenseContainer) return null;

    const input = document.createElement('input');

    // map shorthands to canonical classes
    const classMap = { edu: 'education' };
    const canonical = classMap[expenseType] || expenseType;
    input.classList.add('expense', canonical);

    // unique id
    const uniqueId = `${expenseType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    input.id = uniqueId;
    input.name = uniqueId;
    input.type = 'number';
    input.step = '0.01';
    input.min = '0';
    input.placeholder = `Enter ${canonical} expense amount`;

    // When value changes update chart & summary
    input.addEventListener('input', () => {
      try { calcSaveChart(); } catch (e) { console.warn(e); }
      try { updateSummaryAndTotals(); } catch (e) { console.warn(e); }
    });

    expenseContainer.appendChild(input);
    input.focus();
    return input;
  }

  // Wire add-category buttons
  const addButtons = document.querySelectorAll('.add-category');
  addButtons.forEach(btn => btn.addEventListener('click', () => {
    const expenseType = btn.id.split('-')[0];
    createExpenseInput(expenseType);
  }));

  // Save / Finish button navigates to summary (also trigger save/update first)
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try { calcSaveChart(); } catch (err) { console.warn(err); }
      try { updateSummaryAndTotals(); } catch (err) { console.warn(err); }
      window.location.href = 'summary.html';
    });
  }

  // Load careers data and populate dropdown
  async function getCareers() {
    const url = 'https://eecu-data-server.vercel.app/data';
    try {
      const resp = await fetch(url);
      const jobs = await resp.json();
      createOptions(jobs || []);
      return jobs;
    } catch (err) {
      console.error('Error fetching careers data:', err);
      createOptions([]);
      return [];
    }
  }

  function createOptions(careers) {
    const dropdown = document.getElementById('career');
    if (!dropdown) return;
    window._eecuJobs = {};
    careers.forEach((career, i) => {
      const option = document.createElement('option');
      option.textContent = `${career.Occupation}: $${career.Salary}`;
      option.value = i;
      window._eecuJobs[i] = career;
      dropdown.appendChild(option);
    });
  }

  // Chart (guard if canvas missing)
  let currentChart = null;
  if (canvas && window.Chart) {
    currentChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['House', 'Transport', 'Education', 'Food', 'Savings'],
        datasets: [{ label: '$', data: [0, 0, 0, 0, 0] }]
      },
      options: { plugins: { title: { display: true, text: 'Expenses by Category' } } }
    });
  }

  getCareers();

  const careerDropdown = document.getElementById('career');
  if (careerDropdown) {
    careerDropdown.addEventListener('change', function () {
      const idx = this.value;
      const job = window._eecuJobs && window._eecuJobs[idx];
      if (!job) return;
      const annual = Number(job.Salary) || 0;
      const medicare = (annual * 0.0145).toFixed(2);
      const socialSec = (annual * 0.062).toFixed(2);
      const state = (annual * 0.04).toFixed(2);
        let fedRate = 0.10;
         if (annual > 50400) fedRate = 0.22;
        else if (annual > 12400) fedRate = 0.12;
        const federal = (annual * fedRate).toFixed(2);
      const fedEl = document.getElementById('fed-rate');
      if (fedEl) fedEl.textContent = (fedRate * 100) + '%';
      const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
      setText('tax-medicare', '$' + Number(medicare).toLocaleString());
      setText('tax-social-security', '$' + Number(socialSec).toLocaleString());
      setText('tax-federal', '$' + Number(federal).toLocaleString());
      setText('tax-state', '$' + Number(state).toLocaleString());
    });
  }

  // Chart & save logic
  function calcSaveChart() {
    const inputs = document.querySelectorAll('.expense');
    const savedExpenses = {};
    let house = 0, transport = 0, education = 0, food = 0, savings = 0;
    let total = 0;
    inputs.forEach(input => {
      const v = Number(input.value) || 0;
      total += v;
      savedExpenses[input.id] = v;
      if (input.classList.contains('house')) house += v;
      else if (input.classList.contains('transport')) transport += v;
      else if (input.classList.contains('education')) education += v;
      else if (input.classList.contains('food')) food += v;
      else if (input.classList.contains('savings')) savings += v;
    });
    try { localStorage.setItem('savedExpenses', JSON.stringify(savedExpenses)); } catch (e) {}
    if (currentChart) {
      currentChart.data.datasets[0].data = [house, transport, education, food, savings];
      currentChart.update();
    }
  }

  function save() {
    const pull = JSON.parse(localStorage.getItem('savedExpenses') || '{}');
    const inputs = Array.from(document.querySelectorAll('.expense'));
    inputs.forEach(input => {
      if (pull && pull[input.id] !== undefined) input.value = pull[input.id];
    });
    calcSaveChart();
  }

  if (calculator) calculator.addEventListener('input', () => { calcSaveChart(); updateSummaryAndTotals(); });

  // Summary mapping and update
  const summaryMap = {
    'rent': 's-rent', 'home-insurance': 's-home-insurance', 'water': 's-water',
    'electric': 's-electric', 'gas': 's-gas', 'TV': 's-TV', 'cable': 's-cable',
    'internet': 's-internet', 'phone': 's-phone',
    'car-pay': 's-car-pay', 'car-insurance': 's-car-insurance', 'gasoline': 's-gasoline', 'car-repair': 's-car-repair',
    'supplies': 's-supplies', 'edu-loan': 's-edu-loan', 'tuition': 's-tuition',
    'groceries': 's-groceries', 'clothes': 's-clothes', 'entertainment': 's-entertainment', 'pet': 's-pet',
    'savings-emergency': 's-savings-emergency', 'invest': 's-invest', 'retire': 's-retire'
  };

  function updateSummaryAndTotals() {
    const inputs = document.querySelectorAll('.expense');
    let house = 0, transport = 0, education = 0, food = 0, savingsTotal = 0, total = 0;
    inputs.forEach(input => {
      const val = Number(input.value) || 0;
      total += val;
      const summaryId = summaryMap[input.id];
      if (summaryId) {
        const el = document.getElementById(summaryId);
        if (el) el.textContent = val.toFixed(2) + '$';
      }
      if (input.classList.contains('house')) house += val;
      else if (input.classList.contains('transport')) transport += val;
      else if (input.classList.contains('education')) education += val;
      else if (input.classList.contains('food')) food += val;
      else if (input.classList.contains('savings')) savingsTotal += val;
    });
    const spentEl = document.getElementById('total-spent-display');
    const leftEl = document.getElementById('total-left-display');
    if (spentEl) spentEl.textContent = total.toFixed(2) + '$';
    if (leftEl) leftEl.textContent = (0 - total).toFixed(2) + '$';
    const cats = [house, transport, education, food, savingsTotal];
    const ids = ['pct-house', 'pct-transport', 'pct-education', 'pct-food', 'pct-savings'];
    cats.forEach((val, i) => { const el = document.getElementById(ids[i]); if (el) el.textContent = total > 0 ? Math.round((val / total) * 100) + '%' : '0%'; });
  }

  // initial run
  save();
  updateSummaryAndTotals();
}

document.addEventListener('DOMContentLoaded', init);
