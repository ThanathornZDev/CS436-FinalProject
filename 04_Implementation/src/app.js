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
      ex: "เน้นเวทเทรนนิ่ง 3–4 วัน/สัปดาห์",
      diet: "เพิ่มพลังงาน 300–500 kcal/วัน เน้นโปรตีน เช่น ไข่ ถั่ว อกไก่"
    };
  } else if (bmi < 25) {
    return {
      ex: "เวทเทรนนิ่ง + คาร์ดิโอ อย่างละ 2–3 วัน/สัปดาห์",
      diet: "กินครบ 3 หมู่ ลดน้ำหวาน"
    };
  } else if (bmi < 30) {
    return {
      ex: "คาร์ดิโอ 30–40 นาที 4–5 วัน/สัปดาห์",
      diet: "ลดของทอด เพิ่มผัก เน้นโปรตีนไขมันต่ำ"
    };
  } else {
    return {
      ex: "เดินเร็ว 20–30 นาทีทุกวัน, เวท 2–3 วัน",
      diet: "ลดแคล 500–700 kcal/วัน ลดน้ำหวาน"
    };
  }
}

function renderHistory() {
  const records = loadRecords().sort((a, b) => new Date(b.date) - new Date(a.date));
  historyBody.innerHTML = "";

  records.forEach((r) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.weightKg}</td>
      <td>${r.heightCm}</td>
      <td>${r.bmi.toFixed(2)}</td>
      <td class="${getCategory(r.bmi).className}">${r.category}</td>
      <td><button onclick="deleteRecord('${r.id}')">ลบ</button></td>
    `;

    historyBody.appendChild(tr);
  });

  renderChart(records);
}

function deleteRecord(id) {
  const records = loadRecords().filter((r) => r.id !== id);
  saveRecords(records);
  renderHistory();
}

function addRecord(weight, height, bmi, category) {
  const records = loadRecords();
  records.push({
    id: Date.now().toString(),
    date: new Date().toISOString().split("T")[0],
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

  if (height < 100 || height > 250 || weight < 20 || weight > 250) {
    errorMsg.textContent = "ค่าส่วนสูง/น้ำหนักผิดปกติ";
    return;
  }

  const bmi = calculateBmi(weight, height);
  const cat = getCategory(bmi);
  const adv = getAdvice(bmi);

  bmiValueSpan.textContent = bmi.toFixed(2);
  bmiCategorySpan.textContent = cat.label;
  bmiCategorySpan.className = cat.className;

  exAdvice.textContent = "🏋️ ออกกำลังกาย: " + adv.ex;
  dietAdvice.textContent = "🍽️ อาหาร: " + adv.diet;

  addRecord(weight, height, bmi, cat.label);
});

clearAllBtn.addEventListener("click", () => {
  if (confirm("ล้างประวัติทั้งหมด?")) {
    saveRecords([]);
    renderHistory();
  }
});

function renderChart(records) {
  const ctx = document.getElementById("bmi-chart");
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: sorted.map((r) => r.date),
      datasets: [
        {
          label: "BMI",
          data: sorted.map((r) => r.bmi),
          borderWidth: 2
        }
      ]
    }
  });
}

renderHistory();
