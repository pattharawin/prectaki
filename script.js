const POINTS = {
  sex: { female: 0, male: 1 },
  setting: { opd: 0, nonicu: 4, icu: 11 },
};

const PREVALENCE = {
  "<5":   { any: 3.8, s23: 1.7, krt: 0.0 },
  "5-10": { any: 7.8, s23: 2.9, krt: 0.4 },
  "11-15":{ any: 21.6, s23: 10.5, krt: 3.2 },
  ">15":  { any: 48.7, s23: 34.9, krt: 16.5 }
};

function getEl(id){ return document.getElementById(id); }

function parseNumber(id, min, max){
  const raw = getEl(id).value.trim();
  if (raw === "") return null;
  const v = Number(raw);
  if (!Number.isFinite(v)) return null;
  return Math.min(Math.max(v, min), max);
}

function parseHb(){
  const hb = parseNumber("hb", 0, 25);
  if (hb === null) return { hbLow: null };
  return { hbLow: hb < 10 };
}

function egfrToCategory(egfr){
  if (egfr === null) return { label: "—", points: null };
  if (egfr >= 90) return { label: "≥ 90", points: 0 };
  if (egfr >= 60) return { label: "≥ 60 to < 90", points: 1 };
  if (egfr >= 45) return { label: "≥ 45 to < 60", points: 2 };
  if (egfr >= 30) return { label: "≥ 30 to < 45", points: 5 };
  if (egfr >= 15) return { label: "≥ 15 to < 30", points: 9 };
  return { label: "< 15 (not in score table)", points: null };
}

function updateInlinePoints(){
  const sex = getEl("sex").value;
  const setting = getEl("setting").value;

  getEl("sexPts").textContent = `Points: ${POINTS.sex[sex]}`;
  getEl("settingPts").textContent = `Points: ${POINTS.setting[setting]}`;

  const { hbLow } = parseHb();
  getEl("hbPts").textContent = hbLow === null ? "Points: —" : `Points: ${hbLow ? 3 : 0}`;

  const egfrVal = parseNumber("egfrNum", 0, 200);
  const egfrCat = egfrToCategory(egfrVal);
  getEl("egfrCatHelp").textContent = `Category: ${egfrCat.label}`;
  getEl("egfrPts").textContent = egfrCat.points === null ? "Points: —" : `Points: ${egfrCat.points}`;
}

function scoreToGroup(score){
  if (score < 5) return "<5";
  if (score <= 10) return "5-10";
  if (score <= 15) return "11-15";
  return ">15";
}

function formatPct(x){
  if (Number.isNaN(x)) return "—";
  if (Math.abs(x - Math.round(x)) < 1e-9) return `${Math.round(x)}%`;
  return `${x.toFixed(1)}%`;
}

function calculate(){
  const sex = getEl("sex").value;
  const setting = getEl("setting").value;

  const { hbLow } = parseHb();
  const egfrVal = parseNumber("egfrNum", 0, 200);
  const egfrCat = egfrToCategory(egfrVal);

  if (hbLow === null){
    getEl("note").textContent = "Please enter hemoglobin (g/dL) to calculate the score.";
    return;
  }
  if (egfrVal === null){
    getEl("note").textContent = "Please enter eGFR (mL/min/1.73 m²) to calculate the score.";
    return;
  }
  if (egfrCat.points === null){
    getEl("note").textContent = "eGFR < 15 is not included in the published score table. Please verify the input or refer to the original publication.";
    return;
  }

  const score = POINTS.sex[sex] + POINTS.setting[setting] + (hbLow ? 3 : 0) + egfrCat.points;
  const group = scoreToGroup(score);
  const p = PREVALENCE[group];

  getEl("totalScore").textContent = String(score);
  getEl("riskGroup").querySelector("span:last-child").textContent = `Risk group: ${group} points`;

  getEl("p_any").textContent = formatPct(p.any);
  getEl("p_s23").textContent = formatPct(p.s23);
  getEl("p_krt").textContent = formatPct(p.krt);

  getEl("note").textContent = "";
}

function resetAll(){
  getEl("sex").value = "female";
  getEl("setting").value = "opd";
  getEl("hb").value = "";
  getEl("egfrNum").value = "";

  updateInlinePoints();

  getEl("totalScore").textContent = "—";
  getEl("riskGroup").querySelector("span:last-child").textContent = "Risk group: —";
  getEl("p_any").textContent = "—";
  getEl("p_s23").textContent = "—";
  getEl("p_krt").textContent = "—";
  getEl("note").textContent = "";
}

function printPdf(){ window.print(); }

["sex","setting"].forEach(id => getEl(id).addEventListener("change", updateInlinePoints));
getEl("hb").addEventListener("input", updateInlinePoints);
getEl("egfrNum").addEventListener("input", updateInlinePoints);

getEl("calcBtn").addEventListener("click", calculate);
getEl("resetBtn").addEventListener("click", resetAll);
getEl("printBtn").addEventListener("click", printPdf);

updateInlinePoints();
