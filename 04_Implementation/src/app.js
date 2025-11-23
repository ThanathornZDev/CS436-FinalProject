const STORAGE_KEY = "bmi_records";

const heightInput = document.getElementById("height");
const weightInput = document.getElementById("weight");
const calculateBtn = document.getElementById("calculate-btn");
const clearAllBtn = document.getElementById("clear-all-btn");

const bmiValueSpan = document.getElementById("bmi-value");
const bmiCategorySpan = document.getElementById("bmi-category");
const errorMsg = document.getElementById("error-msg");

const exAdvice = document.getElementById("exercise-advice");
const dietAdvice = document.getElementById("diet-advice");

const historyBody = document.getElementById("history-body");
let chartInstance = null;

// Load
function loadRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function calculateBmi(weight, height) {
  const m = height / 100;
  return weight / (m * m);
}

function getCategory(bmi) {
  if (bmi < 18.5) return { label: "น้ำหนักน้อย", className: "status-underweight" };
  if (bmi < 25) return { label: "ปกติ", className: "status-normal" };
  if (bmi < 30) return { label: "น้ำหนักเกิน", className: "status-overweight" };
  return { label: "อ้วน", className: "status-obese" };
}

function getAdvice(bmi) {
  if (bmi < 18.5) {
    return {
      ex: "เน้นเวทเทรนนิ่ง สร้างกล้ามเนื้อ",
      diet: "เพิ่มโปรตีนและคาร์โบไฮเดรตคุณภาพดี"
    };
  } else if (bmi < 25) {
    return {
      ex: "รักษาระดับกิจกรรม เวทเทรนนิ่งสลับคาร์ดิโอ",
      diet: "ทานอาหารครบ 5 หมู่ ในปริมาณที่เหมาะสม"
    };
  } else if (bmi < 30) {
    return {
      ex: "เน้นคาร์ดิโอเผาผลาญไขมัน 30 นาที/วัน",
      diet: "ลดของทอด ของหวาน เน้นผักผลไม้"
    };
  } else {
    return {
      ex: "เริ่มจากการเดินเร็ว หรือว่ายน้ำเพื่อถนอมเข่า",
      diet: "ควบคุมแคลอรี่อย่างเคร่งครัด ปรึกษาแพทย์"
    };
  }
}

function renderHistory() {
  const records = loadRecords().sort((a, b) => new Date(b.date) - new Date(a.date));
  historyBody.innerHTML = "";

  records.forEach((r) => {
    const tr = document.createElement("tr");
    const cat = getCategory(r.bmi); // Recalculate style based on BMI

    tr.innerHTML = `
      <td style="color: #86868b;">${new Date(r.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</td>
      <td>${r.weightKg}</td>
      <td>${r.heightCm}</td>
      <td style="font-weight: 600;">${r.bmi.toFixed(1)}</td>
      <td><span style="font-size:12px; padding:4px 8px; border-radius:12px;" class="${cat.className}">${cat.label}</span></td>
      <td><button onclick="deleteRecord('${r.id}')">✕</button></td>
    `;

    historyBody.appendChild(tr);
  });

  renderChart(records);
}

// Attach deleteRecord to window so it works with inline onclick
window.deleteRecord = function(id) {
  const records = loadRecords().filter((r) => r.id !== id);
  saveRecords(records);
  renderHistory();
}

function addRecord(weight, height, bmi, category) {
  const records = loadRecords();
  records.push({
    id: Date.now().toString(),
    date: new Date().toISOString(), // Save full ISO string for sorting
    weightKg: weight,
    heightCm: height,
    bmi,
    category
  });
  saveRecords(records);
  renderHistory();
}

calculateBtn.addEventListener("click", () => {
  errorMsg.textContent = "";

  const height = Number(heightInput.value);
  const weight = Number(weightInput.value);

  if (!height || !weight) {
    errorMsg.textContent = "กรุณากรอกข้อมูลให้ครบ";
    return;
  }

  if (height < 50 || height > 220 || weight < 20 || weight > 300) {
    errorMsg.textContent = "ค่าที่ระบุไม่สมเหตุสมผล";
    return;
  }

  const bmi = calculateBmi(weight, height);
  const cat = getCategory(bmi);
  const adv = getAdvice(bmi);

  // Update Result Display
  bmiValueSpan.textContent = bmi.toFixed(1); // Apple prefers clean numbers
  bmiCategorySpan.textContent = cat.label;
  
  // Reset class and add the new one
  bmiCategorySpan.className = ""; 
  bmiCategorySpan.classList.add(cat.className);

  exAdvice.textContent = adv.ex;
  dietAdvice.textContent = adv.diet;

  addRecord(weight, height, bmi, cat.label);
});

clearAllBtn.addEventListener("click", () => {
  if (confirm("ต้องการล้างประวัติทั้งหมดใช่หรือไม่?")) {
    saveRecords([]);
    renderHistory();
  }
});

function renderChart(records) {
  const ctx = document.getElementById("bmi-chart").getContext('2d');
  
  // Create Gradient
  let gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(0, 113, 227, 0.2)'); // Apple Blue Fade
  gradient.addColorStop(1, 'rgba(0, 113, 227, 0.0)');

  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (chartInstance) chartInstance.destroy();

  // Chart Config: Minimalist Apple Style
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: sorted.map((r) => new Date(r.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })),
      datasets: [
        {
          label: "BMI",
          data: sorted.map((r) => r.bmi),
          borderColor: "#0071E3",
          backgroundColor: gradient,
          borderWidth: 3,
          pointRadius: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: "#0071E3",
          pointBorderWidth: 2,
          fill: true,
          tension: 0.4 // Smooth curves
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          cornerRadius: 8,
        }
      },
      scales: {
        x: {
          grid: { display: false }, // Hide X grid
          ticks: { color: '#86868B', font: { size: 11 } }
        },
        y: {
          grid: { borderDash: [5, 5], color: '#E5E5EA' }, // Dotted Y grid
          ticks: { color: '#86868B', font: { size: 11 } },
          beginAtZero: false
        }
      }
    }
  });
}

// Initial Render
renderHistory();