function init() {
  const steps = document.querySelectorAll('.step a');
  const content = document.querySelectorAll('.step-content');
  const canvas = document.getElementById('myChart');
  const calculator = document.getElementById('Calculator');

  const onSummaryPage = document.querySelectorAll('.expense').length === 0 && !calculator;


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

  function createExpenseInput(expenseType) {
    const expenseContainer = document.getElementById(`${expenseType}-expenses`);
    if (!expenseContainer) return null;

    const input = document.createElement('input');
    const classMap = { edu: 'education' };
    const canonical = classMap[expenseType] || expenseType;
    input.classList.add('expense', canonical);

    const uniqueId = `${expenseType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    input.id = uniqueId;
    input.name = uniqueId;
    input.type = 'number';
    input.step = '0.01';
    input.min = '0';
    input.placeholder = `Enter ${canonical} expense amount`;

    input.addEventListener('input', () => {
      try { calcSaveChart(); } catch (e) { console.warn(e); }
      try { updateSummaryAndTotals(); } catch (e) { console.warn(e); }
    });

    expenseContainer.appendChild(input);
    input.focus();
    return input;
  }

  document.querySelectorAll('.add-category').forEach(btn => btn.addEventListener('click', () => {
    createExpenseInput(btn.id.split('-')[0]);
  }));

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      calcSaveChart();
      window.location.href = 'summary.html';
    });
  }

  async function getCareers() {
    try {
      const resp = await fetch('https://eecu-data-server.vercel.app/data');
      const jobs = await resp.json();
      populateDropdown(jobs || []);
    } catch (err) {
      console.error('Error fetching careers:', err);
      populateDropdown([]);
    }
  }

  function populateDropdown(careers) {
    const dropdown = document.getElementById('career');
    if (!dropdown) return;
    window._eecuJobs = {};
    careers.forEach((career, i) => {
      const opt = document.createElement('option');
      opt.textContent = `${career.Occupation}: $${career.Salary}`;
      opt.value = i;
      window._eecuJobs[i] = career;
      dropdown.appendChild(opt);
    });
  }

  let currentChart = null;
  if (!onSummaryPage && canvas && window.Chart) {
    currentChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['House', 'Transport', 'Education', 'Food', 'Savings'],
        datasets: [{
          label: '$',
          data: [0, 0, 0, 0, 0],
          backgroundColor: ['#1a56a0', '#2e9e4f', '#3ecfcf', '#8a3fc7', '#e0197d']
        }]
      },
      options: { plugins: { title: { display: true, text: 'Expenses by Category' } } }
    });
  }

  // Only fetch careers on the calculator page
  if (!onSummaryPage) getCareers();

  const careerDropdown = document.getElementById('career');
  if (careerDropdown) {
    careerDropdown.addEventListener('change', function () {
      const job = window._eecuJobs && window._eecuJobs[this.value];
      if (!job) return;
      const annual = Number(job.Salary) || 0;

      // Flat taxes
      const medicare  = annual * 0.0145;
      const socialSec = annual * 0.062;
      const state     = annual * 0.04;

      // Custom federal income tax brackets
      const brackets = [
        { rate: 0.10, upTo: 12400 },
        { rate: 0.12, upTo: 50400 },
        { rate: 0.22, upTo: Infinity }
      ];

      let federal = 0;
      let prev = 0;
      let topRate = 0.10;
      for (const bracket of brackets) {
        if (annual <= prev) break;
        const taxable = Math.min(annual, bracket.upTo) - prev;
        federal += taxable * bracket.rate;
        topRate = bracket.rate;
        prev = bracket.upTo;
        if (annual <= bracket.upTo) break;
      }

      // Effective rate for display (used in net income tooltip if needed)
      const effectiveRate = annual > 0 ? ((federal / annual) * 100).toFixed(1) : '0';

      const fmt = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setText('tax-medicare',        fmt(medicare));
      setText('tax-social-security', fmt(socialSec));
      setText('tax-federal',         fmt(federal));
      setText('tax-state',           fmt(state));

      const totalTaxes = medicare + socialSec + state + federal;
      const netAnnual  = annual - totalTaxes;
      const netMonthly = netAnnual / 12;

      setText('tax-net-annual',  fmt(netAnnual));
      setText('tax-net-monthly', fmt(netMonthly));

      try {
        localStorage.setItem('netMonthlyIncome', netMonthly.toFixed(2));
        localStorage.setItem('selectedJobTitle', job.Occupation);
      } catch(e) {}

      updateSummaryAndTotals();
    });
  }

  function calcSaveChart() {
    // Guard: never run this on the summary page
    if (onSummaryPage) return;

    const inputs = document.querySelectorAll('.expense');
    const savedExpenses = {};
    const savedClasses  = {};
    const savedLabels   = {};
    let house = 0, transport = 0, education = 0, food = 0, savings = 0;

    inputs.forEach(input => {
      const v = Number(input.value) || 0;
      savedExpenses[input.id] = v;
      if (input.placeholder) savedLabels[input.id] = input.placeholder;

      if      (input.classList.contains('house'))      { savedClasses[input.id] = 'house';      house     += v; }
      else if (input.classList.contains('transport'))  { savedClasses[input.id] = 'transport';  transport += v; }
      else if (input.classList.contains('education'))  { savedClasses[input.id] = 'education';  education += v; }
      else if (input.classList.contains('food'))       { savedClasses[input.id] = 'food';       food      += v; }
      else if (input.classList.contains('savings'))    { savedClasses[input.id] = 'savings';    savings   += v; }
    });

    try {
      localStorage.setItem('savedExpenses', JSON.stringify(savedExpenses));
      localStorage.setItem('savedClasses',  JSON.stringify(savedClasses));
      localStorage.setItem('savedLabels',   JSON.stringify(savedLabels));
    } catch (e) {}

    if (currentChart) {
      currentChart.data.datasets[0].data = [house, transport, education, food, savings];
      currentChart.update();
    }
  }


  function restoreInputs() {
    if (onSummaryPage) return;
    const saved = JSON.parse(localStorage.getItem('savedExpenses') || '{}');
    document.querySelectorAll('.expense').forEach(input => {
      if (saved[input.id] !== undefined) input.value = saved[input.id];
    });
    calcSaveChart();
  }

  if (calculator) calculator.addEventListener('input', () => { calcSaveChart(); updateSummaryAndTotals(); });


  const summaryMap = {
    'rent':             's-rent',
    'home-insurance':   's-home-insurance',
    'water':            's-water',
    'electric':         's-electric',
    'gas':              's-gas',
    'TV':               's-TV',
    'cable':            's-cable',
    'internet':         's-internet',
    'phone':            's-phone',
    'car-pay':          's-car-pay',
    'car-insurance':    's-car-insurance',
    'gasoline':         's-gasoline',
    'car-repair':       's-car-repair',
    'supplies':         's-supplies',
    'edu-loan':         's-edu-loan',
    'tuition':          's-tuition',
    'groceries':        's-groceries',
    'clothes':          's-clothes',
    'entertainment':    's-entertainment',
    'pet':              's-pet',
    'savings-emergency':'s-savings-emergency',
    'invest':           's-invest',
    'retire':           's-retire'
  };


  function updateSummaryAndTotals() {
    let data       = {};
    let classesMap = {};
    let labelsMap  = {};

    if (onSummaryPage) {
      // Summary page: always read from localStorage
      data       = JSON.parse(localStorage.getItem('savedExpenses') || '{}');
      classesMap = JSON.parse(localStorage.getItem('savedClasses')  || '{}');
      labelsMap  = JSON.parse(localStorage.getItem('savedLabels')   || '{}');
    } else {
      // Calculator page: read from live inputs
      document.querySelectorAll('.expense').forEach(input => {
        data[input.id] = Number(input.value) || 0;
      });
    }

    let house = 0, transport = 0, education = 0, food = 0, savingsTotal = 0, total = 0;

    const dynamicList    = document.getElementById('dynamic-expenses-list');
    const dynamicSection = document.getElementById('dynamic-expenses-section');
    let dynamicCount = 0;
    if (dynamicList) dynamicList.innerHTML = '';

    Object.keys(data).forEach(id => {
      const val = Number(data[id]) || 0;
      total += val;

      // Update known static summary cells
      const summaryId = summaryMap[id];
      if (summaryId) {
        const el = document.getElementById(summaryId);
        if (el) el.textContent = '$' + val.toFixed(2);
      } else if (dynamicList) {
        // Dynamic / added expense
        const li = document.createElement('li');
        let label = id.replace(/-\d{13,}-\d+$/, '').replace(/-/g, ' ');
        if (labelsMap[id]) {
          label = labelsMap[id].replace('Enter ', '').replace(' expense amount', '');
        }
        li.innerHTML = `<span>${label}:</span> <span class="sval">$${val.toFixed(2)}</span>`;
        dynamicList.appendChild(li);
        dynamicCount++;
      }

      // Resolve category for chart totals
      let cls = classesMap[id] || null;
      if (!onSummaryPage) {
        const el = document.getElementById(id);
        if (el) {
          cls = el.classList.contains('house')     ? 'house'
              : el.classList.contains('transport') ? 'transport'
              : el.classList.contains('education') ? 'education'
              : el.classList.contains('food')      ? 'food'
              : el.classList.contains('savings')   ? 'savings' : null;
        }
      }
      if      (cls === 'house')     house        += val;
      else if (cls === 'transport') transport    += val;
      else if (cls === 'education') education    += val;
      else if (cls === 'food')      food         += val;
      else if (cls === 'savings')   savingsTotal += val;
    });

    if (dynamicSection) dynamicSection.style.display = dynamicCount > 0 ? '' : 'none';

    // Build / update the chart
    if (onSummaryPage) {
      const summaryCanvas = document.getElementById('myChart');
      if (summaryCanvas && window.Chart) {
        const existing = Chart.getChart(summaryCanvas);
        if (existing) existing.destroy();
        new Chart(summaryCanvas, {
          type: 'doughnut',
          data: {
            labels: ['House', 'Transport', 'Education', 'Food', 'Savings'],
            datasets: [{
              label: '$',
              data: [house, transport, education, food, savingsTotal],
              backgroundColor: ['#1a56a0', '#2e9e4f', '#3ecfcf', '#8a3fc7', '#e0197d']
            }]
          },
          options: { plugins: { title: { display: true, text: 'Expenses by Category' } } }
        });
      }
    } else if (currentChart) {
      currentChart.data.datasets[0].data = [house, transport, education, food, savingsTotal];
      currentChart.update();
    }


    const spentEl   = document.getElementById('total-spent-display');
    const leftEl    = document.getElementById('total-left-display');
    const leftBox   = leftEl ? leftEl.closest('.total-box') : null;
    const leftLabel = leftBox ? leftBox.querySelector('.total-label') : null;

    const netMonthly = parseFloat(localStorage.getItem('netMonthlyIncome') || '0');
    const remaining  = netMonthly > 0 ? netMonthly - total : -total;

    if (spentEl) spentEl.textContent = '$' + total.toFixed(2);

    if (leftEl) {
      leftEl.textContent = '$' + Math.abs(remaining).toFixed(2);
      const overBudget = netMonthly > 0 && remaining < 0;
      leftEl.style.color      = overBudget ? '#ff2222' : '';
      leftEl.style.fontWeight = overBudget ? '900'     : '';
      if (leftBox)   leftBox.style.backgroundColor = overBudget ? '#7a0000' : '';
      if (leftLabel) leftLabel.textContent = netMonthly > 0
        ? (overBudget ? '⚠️ Over Budget!' : 'Monthly Remaining')
        : 'Select a job to see remaining';
    }
  }


  if (onSummaryPage) {
    const tips = [
      "Try to save at least 3–6 months of expenses as an emergency fund before making big purchases.",
      "The 50/30/20 rule: spend 50% on needs, 30% on wants, and save 20% of your income.",
      "Paying yourself first — putting money into savings before spending — is one of the most effective habits you can build.",
      "Even saving $25 a week adds up to $1,300 a year. Small amounts compound over time.",
      "A credit union like EECU often offers lower loan rates and higher savings rates than big banks.",
      "Avoid lifestyle inflation — when your income goes up, try to save the difference rather than spend it.",
      "Interest on debt works against you the same way compound interest on savings works for you. Pay off high-interest debt first.",
      "Automating your savings means you never have to think about it — it just happens.",
      "Renter's insurance typically costs less than $20/month and covers way more than most people realize.",
      "A budget isn't about restricting yourself — it's about making sure your money goes where you actually want it to go.",
      "Check your subscriptions every few months. Most people are paying for at least one they forgot about.",
      "Investing even a small amount early beats investing a large amount late, thanks to compound growth.",
      "If your job offers a 401(k) match, contribute enough to get the full match — it's free money.",
      "Building good credit early opens doors: better loan rates, easier apartment approvals, and more.",
      "Needs vs. wants: before a purchase, ask yourself which category it falls into. It changes how you feel about spending."
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    const tipEl = document.getElementById('wise-tip-text');
    if (tipEl) tipEl.textContent = tip;
  }

  if (!onSummaryPage) {
    restoreInputs(); // restore saved values into calculator inputs
  }
  updateSummaryAndTotals(); // populate summary display (works on both pages)
}

document.addEventListener('DOMContentLoaded', init);