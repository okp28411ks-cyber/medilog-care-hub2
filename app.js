// ============================================================
// 個人用 健康・お薬管理アプリ
// app.js
// ============================================================

"use strict";

// ============================================================
// ① データ保存設定
// ============================================================

const STORAGE_KEY = "medilog_personal_data_v1";

const defaultData = {
    profile: {
        gender: "",
        age: "",
        height: "",
        weight: ""
    },

    healthLogs: [],

    selfRecords: {
        allergies: [],
        diseases: [],
        visits: []
    },

    medications: [],

    medicationLogs: [],

    alarms: [],

    appointments: [],

    notificationHistory: [],

    settings: {
        healthReminder: true,
        medicationReminder: true,
        lowStockReminder: true
    }
};

let appData = loadData();

let currentHealthDate = getDateString(new Date());
let currentStatsRange = "7";
let currentMedicationFilter = "all";

// ============================================================
// ② 共通ユーティリティ
// ============================================================

function createId(prefix = "id") {
    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).substring(2, 9)
    );
}

function getDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}

function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatDateTime(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function numberValue(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const n = Number(value);

    return Number.isFinite(n) ? n : null;
}

function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appData)
    );
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return structuredClone(defaultData);
        }

        const parsed = JSON.parse(raw);

        return {
            ...structuredClone(defaultData),
            ...parsed,
            profile: {
                ...defaultData.profile,
                ...(parsed.profile || {})
            },
            selfRecords: {
                ...defaultData.selfRecords,
                ...(parsed.selfRecords || {})
            },
            settings: {
                ...defaultData.settings,
                ...(parsed.settings || {})
            }
        };
    } catch (error) {
        console.error("データ読み込みエラー:", error);

        return structuredClone(defaultData);
    }
}

function todayHealthLog() {
    return appData.healthLogs.find(
        log => log.date === currentHealthDate
    );
}

function getOrCreateHealthLog(date = currentHealthDate) {
    let log = appData.healthLogs.find(
        item => item.date === date
    );

    if (!log) {
        log = {
            id: createId("health"),
            date,

            headache: {
                level: "",
                location: "",
                duration: "",
                note: ""
            },

            bloodPressure: {
                morning: {
                    systolic: "",
                    diastolic: "",
                    pulse: ""
                },
                noon: {
                    systolic: "",
                    diastolic: "",
                    pulse: ""
                },
                evening: {
                    systolic: "",
                    diastolic: "",
                    pulse: ""
                }
            },

            lifestyle: {
                wakeTime: "",
                sleepTime: "",
                sleepQuality: "",
                mealQuality: "",
                alcohol: false,
                alcoholAmount: "",
                smoking: false,
                cigarettes: ""
            },

            meals: {
                breakfast: {
                    time: "",
                    content: ""
                },
                lunch: {
                    time: "",
                    content: ""
                },
                dinner: {
                    time: "",
                    content: ""
                }
            },

            mental: {
                level: "",
                note: ""
            },

            diary: "",

            hourly: {}
        };

        appData.healthLogs.push(log);
    }

    return log;
}

// ============================================================
// ③ 初期化
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    initializeApp();

});

function initializeApp() {

    setupNavigation();

    setupGlobalButtons();

    setupProfile();

    setupHealthManagement();

    setupSelfRecords();

    setupMedications();

    setupMedicationLogs();

    setupMedicationAlarms();

    setupAppointments();

    setupStatistics();

    setupNotifications();

    renderAll();

    startNotificationScheduler();

    requestNotificationPermission();

}

// ============================================================
// ④ ナビゲーション
// ============================================================

function setupNavigation() {

    const buttons = document.querySelectorAll(".nav-btn");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const target = button.dataset.view;

            if (!target) return;

            showView(target);

        });

    });
}

function showView(viewName) {

    document.querySelectorAll(".view-section").forEach(section => {

        section.classList.add("hidden");

    });

    const target = document.getElementById(viewName);

    if (target) {
        target.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-btn").forEach(button => {

        button.classList.remove("active-nav");

        if (button.dataset.view === viewName) {
            button.classList.add("active-nav");
        }

    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    renderView(viewName);
}

function renderView(viewName) {

    switch (viewName) {

        case "dashboard":
            renderDashboard();
            break;

        case "health":
            renderHealth();
            break;

        case "self-record":
            renderSelfRecords();
            break;

        case "medications":
            renderMedications();
            break;

        case "medication-log":
            renderMedicationLogs();
            break;

        case "alarms":
            renderAlarms();
            break;

        case "appointments":
            renderAppointments();
            break;

        case "statistics":
            renderStatistics();
            break;

        case "notifications":
            renderNotifications();
            break;

    }
}

// ============================================================
// ⑤ 全体再描画
// ============================================================

function renderAll() {

    renderDashboard();

    renderProfile();

    renderHealth();

    renderSelfRecords();

    renderMedications();

    renderMedicationLogs();

    renderMedicationSelects();

    renderAlarms();

    renderAppointments();

    renderStatistics();

    renderNotifications();

}

// ============================================================
// ⑥ ダッシュボード
// ============================================================

function renderDashboard() {

    const log = todayHealthLog();

    const medicationCount =
        appData.medications.length;

    const lowStockCount =
        appData.medications.filter(
            medication => isLowStock(medication)
        ).length;

    const todayMedicationCount =
        getMedicationLogsForDate(
            getDateString()
        ).length;

    const nextAppointment =
        getNextAppointment();

    setText(
        "dashboard-med-count",
        medicationCount
    );

    setText(
        "dashboard-low-stock",
        lowStockCount
    );

    setText(
        "dashboard-today-med",
        todayMedicationCount
    );

    setText(
        "dashboard-next-appointment",
        nextAppointment
            ? formatDateTime(nextAppointment.datetime)
            : "予定なし"
    );

    if (log) {

        const headache =
            log.headache?.level;

        setText(
            "dashboard-headache",
            headache
                ? `${headache}/10`
                : "未記録"
        );

    } else {

        setText(
            "dashboard-headache",
            "未記録"
        );

    }

    renderLowStockDashboard();

    renderTodaySchedule();

}

// ============================================================
// ⑦ プロフィール
// ============================================================

function setupProfile() {

    const form =
        document.getElementById("profile-form");

    if (!form) return;

    form.addEventListener("submit", event => {

        event.preventDefault();

        const gender =
            document.getElementById("profile-gender")?.value || "";

        const age =
            document.getElementById("profile-age")?.value || "";

        const height =
            document.getElementById("profile-height")?.value || "";

        const weight =
            document.getElementById("profile-weight")?.value || "";

        appData.profile = {
            gender,
            age,
            height,
            weight
        };

        saveData();

        showToast("基本情報を保存しました。");

        renderProfile();

    });

}

function renderProfile() {

    const gender =
        document.getElementById("profile-gender");

    const age =
        document.getElementById("profile-age");

    const height =
        document.getElementById("profile-height");

    const weight =
        document.getElementById("profile-weight");

    if (gender) {
        gender.value =
            appData.profile.gender || "";
    }

    if (age) {
        age.value =
            appData.profile.age || "";
    }

    if (height) {
        height.value =
            appData.profile.height || "";
    }

    if (weight) {
        weight.value =
            appData.profile.weight || "";
    }

    const bmiElement =
        document.getElementById("profile-bmi");

    if (bmiElement) {

        const h =
            numberValue(appData.profile.height);

        const w =
            numberValue(appData.profile.weight);

        if (h && w) {

            const meters = h / 100;

            const bmi =
                w / (meters * meters);

            bmiElement.textContent =
                bmi.toFixed(1);

        } else {

            bmiElement.textContent =
                "-";

        }

    }

}

// ============================================================
// ⑧ 体調管理
// ============================================================

function setupHealthManagement() {

    const dateInput =
        document.getElementById("health-date");

    if (dateInput) {

        dateInput.value =
            currentHealthDate;

        dateInput.addEventListener("change", () => {

            currentHealthDate =
                dateInput.value ||
                getDateString();

            renderHealth();

        });

    }

    const saveButton =
        document.getElementById("save-health-btn");

    if (saveButton) {

        saveButton.addEventListener("click", saveHealthLog);

    }

    const previousButton =
        document.getElementById("health-prev-day");

    if (previousButton) {

        previousButton.addEventListener("click", () => {

            const date =
                new Date(currentHealthDate);

            date.setDate(
                date.getDate() - 1
            );

            currentHealthDate =
                getDateString(date);

            updateHealthDateInput();

            renderHealth();

        });

    }

    const nextButton =
        document.getElementById("health-next-day");

    if (nextButton) {

        nextButton.addEventListener("click", () => {

            const date =
                new Date(currentHealthDate);

            date.setDate(
                date.getDate() + 1
            );

            currentHealthDate =
                getDateString(date);

            updateHealthDateInput();

            renderHealth();

        });

    }

}

function updateHealthDateInput() {

    const input =
        document.getElementById("health-date");

    if (input) {
        input.value =
            currentHealthDate;
    }

}

function renderHealth() {

    const log =
        getOrCreateHealthLog(
            currentHealthDate
        );

    fillHealthForm(log);

    renderHourlyHealth(log);

}

function fillHealthForm(log) {

    setInputValue(
        "headache-level",
        log.headache?.level
    );

    setInputValue(
        "headache-location",
        log.headache?.location
    );

    setInputValue(
        "headache-duration",
        log.headache?.duration
    );

    setInputValue(
        "headache-note",
        log.headache?.note
    );

    const bloodPressure =
        log.bloodPressure || {};

    fillBloodPressure(
        "morning",
        bloodPressure.morning
    );

    fillBloodPressure(
        "noon",
        bloodPressure.noon
    );

    fillBloodPressure(
        "evening",
        bloodPressure.evening
    );

    setInputValue(
        "wake-time",
        log.lifestyle?.wakeTime
    );

    setInputValue(
        "sleep-time",
        log.lifestyle?.sleepTime
    );

    setInputValue(
        "sleep-quality",
        log.lifestyle?.sleepQuality
    );

    setInputValue(
        "meal-quality",
        log.lifestyle?.mealQuality
    );

    setCheckboxValue(
        "alcohol-check",
        log.lifestyle?.alcohol
    );

    setInputValue(
        "alcohol-amount",
        log.lifestyle?.alcoholAmount
    );

    setCheckboxValue(
        "smoking-check",
        log.lifestyle?.smoking
    );

    setInputValue(
        "cigarettes",
        log.lifestyle?.cigarettes
    );

    fillMeal(
        "breakfast",
        log.meals?.breakfast
    );

    fillMeal(
        "lunch",
        log.meals?.lunch
    );

    fillMeal(
        "dinner",
        log.meals?.dinner
    );

    setInputValue(
        "mental-level",
        log.mental?.level
    );

    setInputValue(
        "mental-note",
        log.mental?.note
    );

    setInputValue(
        "daily-diary",
        log.diary
    );

}

function fillBloodPressure(period, data = {}) {

    setInputValue(
        `bp-${period}-systolic`,
        data.systolic
    );

    setInputValue(
        `bp-${period}-diastolic`,
        data.diastolic
    );

    setInputValue(
        `bp-${period}-pulse`,
        data.pulse
    );

}

function fillMeal(type, data = {}) {

    setInputValue(
        `meal-${type}-time`,
        data.time
    );

    setInputValue(
        `meal-${type}-content`,
        data.content
    );

}

function saveHealthLog() {

    const log =
        getOrCreateHealthLog(
            currentHealthDate
        );

    log.headache = {

        level:
            getInputValue("headache-level"),

        location:
            getInputValue("headache-location"),

        duration:
            getInputValue("headache-duration"),

        note:
            getInputValue("headache-note")

    };

    log.bloodPressure = {

        morning:
            readBloodPressure("morning"),

        noon:
            readBloodPressure("noon"),

        evening:
            readBloodPressure("evening")

    };

    log.lifestyle = {

        wakeTime:
            getInputValue("wake-time"),

        sleepTime:
            getInputValue("sleep-time"),

        sleepQuality:
            getInputValue("sleep-quality"),

        mealQuality:
            getInputValue("meal-quality"),

        alcohol:
            getCheckboxValue("alcohol-check"),

        alcoholAmount:
            getInputValue("alcohol-amount"),

        smoking:
            getCheckboxValue("smoking-check"),

        cigarettes:
            getInputValue("cigarettes")

    };

    log.meals = {

        breakfast: {
            time:
                getInputValue(
                    "meal-breakfast-time"
                ),

            content:
                getInputValue(
                    "meal-breakfast-content"
                )
        },

        lunch: {
            time:
                getInputValue(
                    "meal-lunch-time"
                ),

            content:
                getInputValue(
                    "meal-lunch-content"
                )
        },

        dinner: {
            time:
                getInputValue(
                    "meal-dinner-time"
                ),

            content:
                getInputValue(
                    "meal-dinner-content"
                )
        }

    };

    log.mental = {

        level:
            getInputValue("mental-level"),

        note:
            getInputValue("mental-note")

    };

    log.diary =
        getInputValue("daily-diary");

    saveData();

    showToast("体調記録を保存しました。");

    renderDashboard();

    renderHealth();

}

function readBloodPressure(period) {

    return {

        systolic:
            getInputValue(
                `bp-${period}-systolic`
            ),

        diastolic:
            getInputValue(
                `bp-${period}-diastolic`
            ),

        pulse:
            getInputValue(
                `bp-${period}-pulse`
            )

    };

}

// ============================================================
// ⑨ 1時間ごとの体調記録
// ============================================================

function renderHourlyHealth(log) {

    const container =
        document.getElementById(
            "hourly-health-container"
        );

    if (!container) return;

    const hourly =
        log.hourly || {};

    let html = "";

    for (let hour = 0; hour < 24; hour++) {

        const key =
            String(hour).padStart(2, "0");

        const item =
            hourly[key] || {};

        html += `

            <div class="hourly-item">

                <div class="hourly-time">
                    ${key}:00
                </div>

                <select
                    class="input hourly-condition"
                    data-hour="${key}"
                >

                    <option value="">
                        体調
                    </option>

                    <option value="1"
                        ${item.condition === "1" ? "selected" : ""}>
                        とても悪い
                    </option>

                    <option value="2"
                        ${item.condition === "2" ? "selected" : ""}>
                        悪い
                    </option>

                    <option value="3"
                        ${item.condition === "3" ? "selected" : ""}>
                        普通
                    </option>

                    <option value="4"
                        ${item.condition === "4" ? "selected" : ""}>
                        良い
                    </option>

                    <option value="5"
                        ${item.condition === "5" ? "selected" : ""}>
                        とても良い
                    </option>

                </select>

                <input
                    type="number"
                    min="0"
                    max="10"
                    class="input hourly-headache"
                    data-hour="${key}"
                    placeholder="頭痛 0-10"
                    value="${escapeHtml(
                        item.headache || ""
                    )}"
                >

                <input
                    type="text"
                    class="input hourly-note"
                    data-hour="${key}"
                    placeholder="メモ"
                    value="${escapeHtml(
                        item.note || ""
                    )}"
                >

            </div>

        `;

    }

    container.innerHTML = html;

    container
        .querySelectorAll(".hourly-condition")
        .forEach(input => {

            input.addEventListener(
                "change",
                saveHourlyHealth
            );

        });

    container
        .querySelectorAll(".hourly-headache")
        .forEach(input => {

            input.addEventListener(
                "change",
                saveHourlyHealth
            );

        });

    container
        .querySelectorAll(".hourly-note")
        .forEach(input => {

            input.addEventListener(
                "change",
                saveHourlyHealth
            );

        });

}

function saveHourlyHealth() {

    const log =
        getOrCreateHealthLog(
            currentHealthDate
        );

    if (!log.hourly) {
        log.hourly = {};
    }

    for (let hour = 0; hour < 24; hour++) {

        const key =
            String(hour).padStart(2, "0");

        const condition =
            document.querySelector(
                `.hourly-condition[data-hour="${key}"]`
            )?.value || "";

        const headache =
            document.querySelector(
                `.hourly-headache[data-hour="${key}"]`
            )?.value || "";

        const note =
            document.querySelector(
                `.hourly-note[data-hour="${key}"]`
            )?.value || "";

        if (
            condition ||
            headache ||
            note
        ) {

            log.hourly[key] = {
                condition,
                headache,
                note
            };

        } else {

            delete log.hourly[key];

        }

    }

    saveData();

    updateHealthCharts();

}

// ============================================================
// ⑩ 自身記録
// ============================================================

function setupSelfRecords() {

    const allergyForm =
        document.getElementById(
            "allergy-form"
        );

    if (allergyForm) {

        allergyForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const input =
                    document.getElementById(
                        "allergy-input"
                    );

                const value =
                    input?.value.trim();

                if (!value) return;

                appData.selfRecords.allergies.push({

                    id: createId("allergy"),

                    name: value,

                    createdAt:
                        new Date().toISOString()

                });

                input.value = "";

                saveData();

                renderSelfRecords();

            }
        );

    }

    const diseaseForm =
        document.getElementById(
            "disease-form"
        );

    if (diseaseForm) {

        diseaseForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const input =
                    document.getElementById(
                        "disease-input"
                    );

                const value =
                    input?.value.trim();

                if (!value) return;

                appData.selfRecords.diseases.push({

                    id: createId("disease"),

                    name: value,

                    createdAt:
                        new Date().toISOString()

                });

                input.value = "";

                saveData();

                renderSelfRecords();

            }
        );

    }

    const visitForm =
        document.getElementById(
            "visit-form"
        );

    if (visitForm) {

        visitForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                addVisitRecord();

            }
        );

    }

}

function renderSelfRecords() {

    renderAllergyList();

    renderDiseaseList();

    renderVisitList();

}

function renderAllergyList() {

    const container =
        document.getElementById(
            "allergy-list"
        );

    if (!container) return;

    if (
        !appData.selfRecords.allergies.length
    ) {

        container.innerHTML =
            `<div class="text-slate-400 text-sm">
                登録されているアレルギーはありません。
            </div>`;

        return;

    }

    container.innerHTML =
        appData.selfRecords.allergies
            .map(item => `

                <div class="record-item">

                    <span>
                        ${escapeHtml(item.name)}
                    </span>

                    <button
                        class="icon-btn danger"
                        onclick="deleteAllergy('${item.id}')"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            `)
            .join("");

}

function renderDiseaseList() {

    const container =
        document.getElementById(
            "disease-list"
        );

    if (!container) return;

    if (
        !appData.selfRecords.diseases.length
    ) {

        container.innerHTML =
            `<div class="text-slate-400 text-sm">
                登録されている病名はありません。
            </div>`;

        return;

    }

    container.innerHTML =
        appData.selfRecords.diseases
            .map(item => `

                <div class="record-item">

                    <span>
                        ${escapeHtml(item.name)}
                    </span>

                    <button
                        class="icon-btn danger"
                        onclick="deleteDisease('${item.id}')"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            `)
            .join("");

}

function addVisitRecord() {

    const date =
        getInputValue("visit-date");

    const hospital =
        getInputValue("visit-hospital");

    const department =
        getInputValue("visit-department");

    const doctor =
        getInputValue("visit-doctor");

    const note =
        getInputValue("visit-note");

    if (!date && !hospital) {

        showToast(
            "受診日または医療機関名を入力してください。"
        );

        return;

    }

    appData.selfRecords.visits.unshift({

        id: createId("visit"),

        date,

        hospital,

        department,

        doctor,

        note,

        createdAt:
            new Date().toISOString()

    });

    saveData();

    clearInputs([
        "visit-date",
        "visit-hospital",
        "visit-department",
        "visit-doctor",
        "visit-note"
    ]);

    renderSelfRecords();

    showToast("受診記録を追加しました。");

}

function renderVisitList() {

    const container =
        document.getElementById(
            "visit-list"
        );

    if (!container) return;

    if (
        !appData.selfRecords.visits.length
    ) {

        container.innerHTML =
            `<div class="text-slate-400 text-sm">
                受診記録はありません。
            </div>`;

        return;

    }

    container.innerHTML =
        appData.selfRecords.visits
            .map(item => `

                <div class="record-card">

                    <div class="record-card-header">

                        <div>
                            <strong>
                                ${escapeHtml(
                                    item.hospital || "医療機関未入力"
                                )}
                            </strong>

                            <div class="text-sm text-slate-500">
                                ${escapeHtml(
                                    item.date || ""
                                )}
                            </div>
                        </div>

                        <button
                            class="icon-btn danger"
                            onclick="deleteVisit('${item.id}')"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                    <div class="record-details">

                        ${
                            item.department
                                ? `<span>
                                    診療科：
                                    ${escapeHtml(item.department)}
                                   </span>`
                                : ""
                        }

                        ${
                            item.doctor
                                ? `<span>
                                    医師：
                                    ${escapeHtml(item.doctor)}
                                   </span>`
                                : ""
                        }

                    </div>

                    ${
                        item.note
                            ? `<div class="record-note">
                                ${escapeHtml(item.note)}
                               </div>`
                            : ""
                    }

                </div>

            `)
            .join("");

}

function deleteAllergy(id) {

    appData.selfRecords.allergies =
        appData.selfRecords.allergies.filter(
            item => item.id !== id
        );

    saveData();

    renderSelfRecords();

}

function deleteDisease(id) {

    appData.selfRecords.diseases =
        appData.selfRecords.diseases.filter(
            item => item.id !== id
        );

    saveData();

    renderSelfRecords();

}

function deleteVisit(id) {

    appData.selfRecords.visits =
        appData.selfRecords.visits.filter(
            item => item.id !== id
        );

    saveData();

    renderSelfRecords();

}

// ============================================================
// ⑪ お薬在庫
// ============================================================

function setupMedications() {

    const form =
        document.getElementById(
            "medication-form"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            addMedication();

        }
    );

    const classification =
        document.getElementById(
            "med-classification"
        );

    if (classification) {

        classification.addEventListener(
            "change",
            togglePrescriptionFields
        );

    }

    const imageInput =
        document.getElementById(
            "med-image"
        );

    if (imageInput) {

        imageInput.addEventListener(
            "change",
            previewMedicationImage
        );

    }

    const filter =
        document.getElementById(
            "medication-filter"
        );

    if (filter) {

        filter.addEventListener(
            "change",
            () => {

                currentMedicationFilter =
                    filter.value;

                renderMedications();

            }
        );

    }

}

function addMedication() {

    const name =
        getInputValue("med-name");

    if (!name) {

        showToast(
            "おくすりの名前を入力してください。"
        );

        return;

    }

    const medication = {

        id: createId("med"),

        name,

        image: "",

        imageUrl:
            getInputValue("med-image-url"),

        strength:
            getInputValue("med-strength"),

        company:
            getInputValue("med-company"),

        type:
            getInputValue("med-type"),

        classification:
            getInputValue("med-classification"),

        stock:
            numberValue(
                getInputValue("med-stock")
            ) ?? 0,

        lowStockThreshold:
            numberValue(
                getInputValue(
                    "med-low-stock"
                )
            ) ?? 0,

        hospital:
            getInputValue("med-hospital"),

        department:
            getInputValue("med-department"),

        doctor:
            getInputValue("med-doctor"),

        expiry:
            getInputValue("med-expiry"),

        dispensingDate:
            getInputValue(
                "med-dispensing-date"
            ),

        dose:
            getInputValue("med-dose"),

        frequency:
            getInputValue("med-frequency"),

        unit:
            getInputValue("med-unit"),

        status:
            getInputValue("med-status"),

        timing:
            getInputValue("med-timing"),

        pharmacy:
            getInputValue("med-pharmacy"),

        memo:
            getInputValue("med-memo"),

        createdAt:
            new Date().toISOString()

    };

    const imageInput =
        document.getElementById(
            "med-image"
        );

    if (
        imageInput &&
        imageInput.files &&
        imageInput.files[0]
    ) {

        const file =
            imageInput.files[0];

        const reader =
            new FileReader();

        reader.onload = event => {

            medication.image =
                event.target.result;

            appData.medications.push(
                medication
            );

            saveData();

            resetMedicationForm();

            renderAll();

            showToast(
                "おくすりを登録しました。"
            );

        };

        reader.readAsDataURL(file);

        return;

    }

    appData.medications.push(
        medication
    );

    saveData();

    resetMedicationForm();

    renderAll();

    showToast(
        "おくすりを登録しました。"
    );

}

function renderMedications() {

    const container =
        document.getElementById(
            "medication-list"
        );

    if (!container) return;

    let medications =
        [...appData.medications];

    if (
        currentMedicationFilter !== "all"
    ) {

        medications =
            medications.filter(
                medication =>
                    medication.classification ===
                    currentMedicationFilter
            );

    }

    if (!medications.length) {

        container.innerHTML =
            `<div class="text-center text-slate-400 py-10">
                登録されているおくすりはありません。
            </div>`;

        return;

    }

    container.innerHTML =
        medications
            .map(renderMedicationCard)
            .join("");

}

function renderMedicationCard(medication) {

    const lowStock =
        isLowStock(medication);

    const image =
        medication.image ||
        medication.imageUrl;

    const stock =
        Number(medication.stock) || 0;

    const threshold =
        Number(
            medication.lowStockThreshold
        ) || 0;

    let stockPercent = 100;

    if (threshold > 0) {

        stockPercent =
            Math.min(
                100,
                Math.max(
                    0,
                    (stock /
                        Math.max(
                            threshold * 3,
                            stock,
                            1
                        )) *
                        100
                )
            );

    }

    return `

        <div class="med-card">

            <div class="med-card-img">

                ${
                    image
                        ? `<img
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(medication.name)}"
                           >`
                        : `<div class="placeholder-icon">
                            <i class="fa-solid fa-pills"></i>
                           </div>`
                }

            </div>

            <div class="med-card-body">

                <div class="med-card-main">

                    <div class="med-card-name">

                        ${escapeHtml(
                            medication.name
                        )}

                        ${
                            lowStock
                                ? `<span class="badge badge-red">
                                    <i class="fa-solid fa-triangle-exclamation"></i>
                                    在庫少
                                   </span>`
                                : ""
                        }

                    </div>

                    <div class="med-card-sub">

                        ${
                            medication.strength
                                ? escapeHtml(
                                    medication.strength
                                  ) + " "
                                : ""
                        }

                        ${
                            medication.company
                                ? escapeHtml(
                                    medication.company
                                  )
                                : ""
                        }

                    </div>

                </div>

                <div class="med-card-stock">

                    <div class="med-card-label">
                        在庫
                    </div>

                    <div class="med-card-value">
                        ${stock}
                        ${escapeHtml(
                            medication.unit || "錠"
                        )}
                    </div>

                    <div class="stock-bar-track">

                        <div
                            class="stock-bar-fill"
                            style="width:${stockPercent}%"
                        ></div>

                    </div>

                </div>

                <div class="med-card-expiry">

                    <div class="med-card-label">
                        使用期限
                    </div>

                    <div class="med-card-value">

                        ${
                            medication.expiry
                                ? escapeHtml(
                                    medication.expiry
                                  )
                                : "-"
                        }

                    </div>

                </div>

                <div class="med-card-source">

                    <div class="med-card-label">
                        分類
                    </div>

                    <div class="med-card-value">

                        ${escapeHtml(
                            medication.classification ||
                            "-"
                        )}

                    </div>

                </div>

                <div class="med-card-memo">

                    <div class="med-card-label">
                        メモ
                    </div>

                    <div class="med-card-value">

                        ${escapeHtml(
                            medication.memo || "-"
                        )}

                    </div>

                </div>

            </div>

            <div class="med-card-actions">

                <button
                    class="icon-btn"
                    title="編集"
                    onclick="editMedication('${medication.id}')"
                >
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button
                    class="icon-btn"
                    title="服用記録"
                    onclick="quickMedicationLog('${medication.id}')"
                >
                    <i class="fa-solid fa-check"></i>
                </button>

                <button
                    class="icon-btn danger"
                    title="削除"
                    onclick="deleteMedication('${medication.id}')"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>

        </div>

    `;

}

function isLowStock(medication) {

    const stock =
        Number(medication.stock) || 0;

    const threshold =
        Number(
            medication.lowStockThreshold
        ) || 0;

    return (
        threshold > 0 &&
        stock <= threshold
    );

}

function deleteMedication(id) {

    const medication =
        appData.medications.find(
            item => item.id === id
        );

    if (!medication) return;

    const confirmed =
        confirm(
            `「${medication.name}」を削除しますか？`
        );

    if (!confirmed) return;

    appData.medications =
        appData.medications.filter(
            item => item.id !== id
        );

    saveData();

    renderAll();

    showToast(
        "おくすりを削除しました。"
    );

}

function quickMedicationLog(id) {

    const select =
        document.getElementById(
            "med-log-medication"
        );

    if (!select) return;

    select.value = id;

    showView("medication-log");

}

function editMedication(id) {

    const medication =
        appData.medications.find(
            item => item.id === id
        );

    if (!medication) return;

    setInputValue(
        "med-name",
        medication.name
    );

    setInputValue(
        "med-image-url",
        medication.imageUrl
    );

    setInputValue(
        "med-strength",
        medication.strength
    );

    setInputValue(
        "med-company",
        medication.company
    );

    setInputValue(
        "med-type",
        medication.type
    );

    setInputValue(
        "med-classification",
        medication.classification
    );

    setInputValue(
        "med-stock",
        medication.stock
    );

    setInputValue(
        "med-low-stock",
        medication.lowStockThreshold
    );

    setInputValue(
        "med-hospital",
        medication.hospital
    );

    setInputValue(
        "med-department",
        medication.department
    );

    setInputValue(
        "med-doctor",
        medication.doctor
    );

    setInputValue(
        "med-expiry",
        medication.expiry
    );

    setInputValue(
        "med-dispensing-date",
        medication.dispensingDate
    );

    setInputValue(
        "med-dose",
        medication.dose
    );

    setInputValue(
        "med-frequency",
        medication.frequency
    );

    setInputValue(
        "med-unit",
        medication.unit
    );

    setInputValue(
        "med-status",
        medication.status
    );

    setInputValue(
        "med-timing",
        medication.timing
    );

    setInputValue(
        "med-pharmacy",
        medication.pharmacy
    );

    setInputValue(
        "med-memo",
        medication.memo
    );

    const form =
        document.getElementById(
            "medication-form"
        );

    if (form) {

        form.dataset.editingId =
            id;

        const button =
            form.querySelector(
                '[type="submit"]'
            );

        if (button) {
            button.innerHTML =
                `<i class="fa-solid fa-save"></i>
                 更新する`;
        }

    }

    togglePrescriptionFields();

    showView("medications");

}

function resetMedicationForm() {

    const form =
        document.getElementById(
            "medication-form"
        );

    if (!form) return;

    form.reset();

    delete form.dataset.editingId;

    const button =
        form.querySelector(
            '[type="submit"]'
        );

    if (button) {

        button.innerHTML =
            `<i class="fa-solid fa-plus"></i>
             おくすりを登録`;

    }

}

function togglePrescriptionFields() {

    const classification =
        getInputValue(
            "med-classification"
        );

    const prescriptionFields =
        document.querySelectorAll(
            ".prescription-only"
        );

    prescriptionFields.forEach(field => {

        if (
            classification === "処方"
        ) {

            field.style.display =
                "";

        } else {

            field.style.display =
                "none";

        }

    });

}

function previewMedicationImage() {

    const input =
        document.getElementById(
            "med-image"
        );

    const preview =
        document.getElementById(
            "med-image-preview"
        );

    if (
        !input ||
        !preview ||
        !input.files ||
        !input.files[0]
    ) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload = event => {

        preview.src =
            event.target.result;

        preview.style.display =
            "block";

    };

    reader.readAsDataURL(
        input.files[0]
    );

}

// ============================================================
// ⑫ 服薬記録
// ============================================================

function setupMedicationLogs() {

    const form =
        document.getElementById(
            "medication-log-form"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            addMedicationLog();

        }
    );

}

function renderMedicationSelects() {

    const select =
        document.getElementById(
            "med-log-medication"
        );

    const alarmSelect =
        document.getElementById(
            "alarm-medication"
        );

    const options =
        appData.medications
            .map(
                medication =>
                    `<option value="${medication.id}">
                        ${escapeHtml(medication.name)}
                    </option>`
            )
            .join("");

    if (select) {

        const current =
            select.value;

        select.innerHTML =
            `<option value="">
                おくすりを選択
            </option>` +
            options;

        if (current) {
            select.value =
                current;
        }

    }

    if (alarmSelect) {

        const current =
            alarmSelect.value;

        alarmSelect.innerHTML =
            `<option value="">
                おくすりを選択
            </option>` +
            options;

        if (current) {
            alarmSelect.value =
                current;
        }

    }

}

function addMedicationLog(
    medicationId = null
) {

    const id =
        medicationId ||
        getInputValue(
            "med-log-medication"
        );

    if (!id) {

        showToast(
            "おくすりを選択してください。"
        );

        return;

    }

    const medication =
        appData.medications.find(
            item => item.id === id
        );

    if (!medication) return;

    const dose =
        getInputValue(
            "med-log-dose"
        ) ||
        medication.dose ||
        "";

    const datetime =
        getInputValue(
            "med-log-datetime"
        ) ||
        new Date().toISOString();

    const timing =
        getInputValue(
            "med-log-timing"
        );

    const memo =
        getInputValue(
            "med-log-memo"
        );

    appData.medicationLogs.unshift({

        id: createId("medlog"),

        medicationId: id,

        medicationName:
            medication.name,

        dose,

        datetime,

        timing,

        memo,

        createdAt:
            new Date().toISOString()

    });

    const numericDose =
        parseDoseNumber(dose);

    if (
        numericDose !== null &&
        Number.isFinite(
            Number(medication.stock)
        )
    ) {

        medication.stock =
            Math.max(
                0,
                Number(medication.stock) -
                numericDose
            );

    }

    saveData();

    clearInputs([
        "med-log-dose",
        "med-log-datetime",
        "med-log-timing",
        "med-log-memo"
    ]);

    renderAll();

    showToast(
        `${medication.name}の服薬を記録しました。`
    );

}

function parseDoseNumber(value) {

    if (!value) return null;

    const match =
        String(value).match(
            /-?\d+(?:\.\d+)?/
        );

    if (!match) return null;

    const number =
        Number(match[0]);

    return Number.isFinite(number)
        ? number
        : null;

}

function renderMedicationLogs() {

    const container =
        document.getElementById(
            "medication-log-list"
        );

    if (!container) return;

    if (
        !appData.medicationLogs.length
    ) {

        container.innerHTML =
            `<div class="text-center text-slate-400 py-8">
                服薬記録はありません。
            </div>`;

        return;

    }

    const grouped =
        groupMedicationLogsByDate();

    let html = "";

    Object.keys(grouped)
        .sort()
        .reverse()
        .forEach(date => {

            html += `

                <div class="log-day-group">

                    <div class="log-day-title">
                        ${escapeHtml(
                            formatDate(date)
                        )}
                    </div>

            `;

            grouped[date].forEach(log => {

                html += `

                    <div class="log-entry">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    log.medicationName
                                )}
                            </strong>

                            <div class="text-sm text-slate-500">

                                ${escapeHtml(
                                    formatDateTime(
                                        log.datetime
                                    )
                                )}

                                ${
                                    log.timing
                                        ? " / " +
                                          escapeHtml(
                                              log.timing
                                          )
                                        : ""
                                }

                            </div>

                            ${
                                log.memo
                                    ? `<div class="text-sm text-slate-500">
                                        ${escapeHtml(log.memo)}
                                       </div>`
                                    : ""
                            }

                        </div>

                        <div class="flex items-center gap-2">

                            <span class="badge badge-blue">
                                ${escapeHtml(
                                    log.dose || "-"
                                )}
                            </span>

                            <button
                                class="icon-btn danger"
                                onclick="deleteMedicationLog('${log.id}')"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>

                    </div>

                `;

            });

            html += `</div>`;

        });

    container.innerHTML =
        html;

}

function groupMedicationLogsByDate() {

    const result = {};

    appData.medicationLogs.forEach(log => {

        const date =
            getDateString(
                new Date(log.datetime)
            );

        if (!result[date]) {
            result[date] = [];
        }

        result[date].push(log);

    });

    return result;

}

function deleteMedicationLog(id) {

    const log =
        appData.medicationLogs.find(
            item => item.id === id
        );

    if (!log) return;

    const medication =
        appData.medications.find(
            item =>
                item.id === log.medicationId
        );

    if (medication) {

        const dose =
            parseDoseNumber(log.dose);

        if (dose !== null) {

            medication.stock =
                Number(medication.stock || 0) +
                dose;

        }

    }

    appData.medicationLogs =
        appData.medicationLogs.filter(
            item => item.id !== id
        );

    saveData();

    renderAll();

    showToast(
        "服薬記録を削除しました。"
    );

}

// ============================================================
// ⑬ 服薬アラーム
// ============================================================

function setupMedicationAlarms() {

    const form =
        document.getElementById(
            "alarm-form"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            addAlarm();

        }
    );

}

function addAlarm() {

    const medicationId =
        getInputValue(
            "alarm-medication"
        );

    const time =
        getInputValue(
            "alarm-time"
        );

    const timing =
        getInputValue(
            "alarm-timing"
        );

    const dose =
        getInputValue(
            "alarm-dose"
        );

    const repeat =
        getInputValue(
            "alarm-repeat"
        ) || "daily";

    if (
        !medicationId ||
        !time
    ) {

        showToast(
            "おくすりと時刻を入力してください。"
        );

        return;

    }

    const medication =
        appData.medications.find(
            item =>
                item.id === medicationId
        );

    if (!medication) return;

    appData.alarms.push({

        id: createId("alarm"),

        medicationId,

        medicationName:
            medication.name,

        time,

        timing,

        dose:
            dose ||
            medication.dose ||
            "",

        repeat,

        enabled: true,

        lastTriggered: null,

        createdAt:
            new Date().toISOString()

    });

    saveData();

    clearInputs([
        "alarm-time",
        "alarm-timing",
        "alarm-dose"
    ]);

    renderAlarms();

    showToast(
        "服薬アラームを登録しました。"
    );

}

function renderAlarms() {

    const container =
        document.getElementById(
            "alarm-list"
        );

    if (!container) return;

    if (!appData.alarms.length) {

        container.innerHTML =
            `<div class="text-center text-slate-400 py-8">
                登録されている服薬アラームはありません。
            </div>`;

        return;

    }

    container.innerHTML =
        appData.alarms
            .sort(
                (a, b) =>
                    a.time.localeCompare(
                        b.time
                    )
            )
            .map(alarm => `

                <div class="schedule-item">

                    <div class="text-xl font-bold text-blue-600">
                        ${escapeHtml(
                            alarm.time
                        )}
                    </div>

                    <div class="flex-1">

                        <strong>
                            ${escapeHtml(
                                alarm.medicationName
                            )}
                        </strong>

                        <div class="text-sm text-slate-500">

                            ${
                                alarm.dose
                                    ? "服用量: " +
                                      escapeHtml(
                                          alarm.dose
                                      )
                                    : ""
                            }

                            ${
                                alarm.timing
                                    ? " / " +
                                      escapeHtml(
                                          alarm.timing
                                      )
                                    : ""
                            }

                        </div>

                    </div>

                    <button
                        class="icon-btn"
                        onclick="toggleAlarm('${alarm.id}')"
                    >
                        ${
                            alarm.enabled
                                ? `<i class="fa-solid fa-bell"></i>`
                                : `<i class="fa-solid fa-bell-slash"></i>`
                        }
                    </button>

                    <button
                        class="icon-btn danger"
                        onclick="deleteAlarm('${alarm.id}')"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            `)
            .join("");

}

function toggleAlarm(id) {

    const alarm =
        appData.alarms.find(
            item => item.id === id
        );

    if (!alarm) return;

    alarm.enabled =
        !alarm.enabled;

    saveData();

    renderAlarms();

}

function deleteAlarm(id) {

    appData.alarms =
        appData.alarms.filter(
            item => item.id !== id
        );

    saveData();

    renderAlarms();

    showToast(
        "服薬アラームを削除しました。"
    );

}

// ============================================================
// ⑭ 通院予定
// ============================================================

function setupAppointments() {

    const form =
        document.getElementById(
            "appointment-form"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            addAppointment();

        }
    );

}

function addAppointment() {

    const datetime =
        getInputValue(
            "appointment-datetime"
        );

    const hospital =
        getInputValue(
            "appointment-hospital"
        );

    const department =
        getInputValue(
            "appointment-department"
        );

    const doctor =
        getInputValue(
            "appointment-doctor"
        );

    const note =
        getInputValue(
            "appointment-note"
        );

    if (!datetime) {

        showToast(
            "通院日時を入力してください。"
        );

        return;

    }

    appData.appointments.push({

        id: createId("appointment"),

        datetime,

        hospital,

        department,

        doctor,

        note,

        createdAt:
            new Date().toISOString()

    });

    saveData();

    clearInputs([
        "appointment-datetime",
        "appointment-hospital",
        "appointment-department",
        "appointment-doctor",
        "appointment-note"
    ]);

    renderAll();

    showToast(
        "次回通院予定を登録しました。"
    );

}

function getNextAppointment() {

    const now =
        Date.now();

    return (
        appData.appointments
            .filter(
                item =>
                    new Date(
                        item.datetime
                    ).getTime() >= now
            )
            .sort(
                (a, b) =>
                    new Date(a.datetime) -
                    new Date(b.datetime)
            )[0] ||
        null
    );

}

function renderAppointments() {

    const container =
        document.getElementById(
            "appointment-list"
        );

    if (!container) return;

    const appointments =
        [...appData.appointments]
            .sort(
                (a, b) =>
                    new Date(a.datetime) -
                    new Date(b.datetime)
            );

    if (!appointments.length) {

        container.innerHTML =
            `<div class="text-center text-slate-400 py-8">
                通院予定はありません。
            </div>`;

        return;

    }

    container.innerHTML =
        appointments
            .map(item => `

                <div class="record-card">

                    <div class="record-card-header">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    item.hospital ||
                                    "医療機関未入力"
                                )}
                            </strong>

                            <div class="text-blue-600 font-semibold">
                                ${escapeHtml(
                                    formatDateTime(
                                        item.datetime
                                    )
                                )}
                            </div>

                        </div>

                        <button
                            class="icon-btn danger"
                            onclick="deleteAppointment('${item.id}')"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                    <div class="record-details">

                        ${
                            item.department
                                ? `<span>
                                    診療科：
                                    ${escapeHtml(item.department)}
                                   </span>`
                                : ""
                        }

                        ${
                            item.doctor
                                ? `<span>
                                    主治医：
                                    ${escapeHtml(item.doctor)}
                                   </span>`
                                : ""
                        }

                    </div>

                    ${
                        item.note
                            ? `<div class="record-note">
                                主治医への伝達メモ：
                                ${escapeHtml(item.note)}
                               </div>`
                            : ""
                    }

                </div>

            `)
            .join("");

}

function deleteAppointment(id) {

    appData.appointments =
        appData.appointments.filter(
            item => item.id !== id
        );

    saveData();

    renderAll();

    showToast(
        "通院予定を削除しました。"
    );

}

// ============================================================
// ⑮ 統計
// ============================================================

function setupStatistics() {

    document
        .querySelectorAll(
            "[data-stats-range]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentStatsRange =
                        button.dataset.statsRange;

                    renderStatistics();

                }
            );

        });

}

function renderStatistics() {

    renderMedicationStatistics();

    renderMedicationCategoryStatistics();

    renderMedicationRanking();

    renderLowStockStatistics();

    updateHealthCharts();

}

function getDateRangeDays(days) {

    const now =
        new Date();

    const start =
        new Date(now);

    start.setHours(
        0,
        0,
        0,
        0
    );

    start.setDate(
        start.getDate() -
        (days - 1)
    );

    return {
        start,
        end: now
    };

}

function getMedicationLogsForRange(days) {

    const range =
        getDateRangeDays(days);

    return appData.medicationLogs.filter(
        log => {

            const time =
                new Date(
                    log.datetime
                ).getTime();

            return (
                time >=
                    range.start.getTime() &&
                time <=
                    range.end.getTime()
            );

        }
    );

}

function renderMedicationStatistics() {

    const element =
        document.getElementById(
            "stats-medication-count"
        );

    if (!element) return;

    let days =
        Number(currentStatsRange);

    if (
        !Number.isFinite(days) ||
        days <= 0
    ) {

        days = 7;

    }

    const count =
        getMedicationLogsForRange(
            days
        ).length;

    element.textContent =
        count;

}

function renderMedicationCategoryStatistics() {

    const container =
        document.getElementById(
            "stats-category-list"
        );

    if (!container) return;

    const counts = {};

    appData.medications.forEach(
        medication => {

            const category =
                medication.classification ||
                "その他";

            counts[category] =
                (counts[category] || 0) +
                1;

        }
    );

    const entries =
        Object.entries(counts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );

    if (!entries.length) {

        container.innerHTML =
            `<div class="text-slate-400 text-sm">
                データがありません。
            </div>`;

        return;

    }

    container.innerHTML =
        entries
            .map(
                ([name, count]) => `

                    <div class="flex justify-between items-center py-2">

                        <span>
                            ${escapeHtml(name)}
                        </span>

                        <span class="badge badge-blue">
                            ${count}
                        </span>

                    </div>

                `
            )
            .join("");

}

function renderMedicationRanking() {

    const container =
        document.getElementById(
            "stats-ranking-list"
        );

    if (!container) return;

    let days =
        Number(currentStatsRange);

    if (
        !Number.isFinite(days) ||
        days <= 0
    ) {

        days = 7;

    }

    const logs =
        getMedicationLogsForRange(
            days
        );

    const counts = {};

    logs.forEach(log => {

        const name =
            log.medicationName ||
            "不明";

        counts[name] =
            (counts[name] || 0) +
            1;

    });

    const ranking =
        Object.entries(counts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );

    if (!ranking.length) {

        container.innerHTML =
            `<div class="text-slate-400 text-sm">
                データがありません。
            </div>`;

        return;

    }

    container.innerHTML =
        ranking
            .map(
                ([name, count], index) => `

                    <div class="flex items-center gap-3 py-2">

                        <div class="font-bold text-slate-400">
                            ${index + 1}
                        </div>

                        <div class="flex-1">
                            ${escapeHtml(name)}
                        </div>

                        <div class="badge badge-purple">
                            ${count}回
                        </div>

                    </div>

                `
            )
            .join("");

}

function renderLowStockStatistics() {

    const container =
        document.getElementById(
            "stats-low-stock-list"
        );

    if (!container) return;

    const medications =
        appData.medications.filter(
            medication =>
                isLowStock(medication)
        );

    if (!medications.length) {

        container.innerHTML =
            `<div class="text-slate-400 text-sm">
                在庫が少ないおくすりはありません。
            </div>`;

        return;

    }

    container.innerHTML =
        medications
            .map(
                medication => `

                    <div class="warning-item">

                        <i class="fa-solid fa-triangle-exclamation text-red-500"></i>

                        <div class="flex-1">

                            <strong>
                                ${escapeHtml(
                                    medication.name
                                )}
                            </strong>

                            <div class="text-sm text-slate-500">

                                残り
                                ${Number(
                                    medication.stock || 0
                                )}
                                ${escapeHtml(
                                    medication.unit ||
                                    "錠"
                                )}

                            </div>

                        </div>

                    </div>

                `
            )
            .join("");

}

// ============================================================
// ⑯ 通知
// ============================================================

function setupNotifications() {

    const healthToggle =
        document.getElementById(
            "health-notification-toggle"
        );

    if (healthToggle) {

        healthToggle.checked =
            appData.settings.healthReminder;

        healthToggle.addEventListener(
            "change",
            () => {

                appData.settings.healthReminder =
                    healthToggle.checked;

                saveData();

            }
        );

    }

    const medicationToggle =
        document.getElementById(
            "medication-notification-toggle"
        );

    if (medicationToggle) {

        medicationToggle.checked =
            appData.settings.medicationReminder;

        medicationToggle.addEventListener(
            "change",
            () => {

                appData.settings.medicationReminder =
                    medicationToggle.checked;

                saveData();

            }
        );

    }

    const stockToggle =
        document.getElementById(
            "stock-notification-toggle"
        );

    if (stockToggle) {

        stockToggle.checked =
            appData.settings.lowStockReminder;

        stockToggle.addEventListener(
            "change",
            () => {

                appData.settings.lowStockReminder =
                    stockToggle.checked;

                saveData();

            }
        );

    }

}

function renderNotifications() {

    const container =
        document.getElementById(
            "notification-history"
        );

    if (!container) return;

    if (
        !appData.notificationHistory.length
    ) {

        container.innerHTML =
            `<div class="text-slate-400 text-sm">
                通知履歴はありません。
            </div>`;

        return;

    }

    container.innerHTML =
        appData.notificationHistory
            .slice(0, 100)
            .map(
                notification => `

                    <div class="notification-item">

                        <div class="font-semibold">
                            ${escapeHtml(
                                notification.title
                            )}
                        </div>

                        <div class="text-sm text-slate-500">
                            ${escapeHtml(
                                notification.body
                            )}
                        </div>

                        <div class="text-xs text-slate-400">
                            ${escapeHtml(
                                formatDateTime(
                                    notification.createdAt
                                )
                            )}
                        </div>

                    </div>

                `
            )
            .join("");

}

// ============================================================
// ⑰ 通知スケジューラー
// ============================================================

let notificationSchedulerStarted =
    false;

function startNotificationScheduler() {

    if (notificationSchedulerStarted) {
        return;
    }

    notificationSchedulerStarted =
        true;

    checkScheduledNotifications();

    setInterval(
        checkScheduledNotifications,
        30 * 1000
    );

}

function checkScheduledNotifications() {

    const now =
        new Date();

    checkHealthReminder(now);

    checkMedicationAlarms(now);

    checkLowStockReminder(now);

}

function checkHealthReminder(now) {

    if (
        !appData.settings.healthReminder
    ) {
        return;
    }

    const hours = [
        6,
        12,
        18
    ];

    const hour =
        now.getHours();

    const minute =
        now.getMinutes();

    if (
        hours.includes(hour) &&
        minute === 0
    ) {

        const key =
            `health_${getDateString(now)}_${hour}`;

        if (
            alreadyNotified(key)
        ) {
            return;
        }

        sendAppNotification(
            "体調管理の時間です",
            "今日の体調・血圧・食事などを記録しましょう。",
            key
        );

    }

}

function checkMedicationAlarms(now) {

    if (
        !appData.settings.medicationReminder
    ) {
        return;
    }

    const currentTime =
        `${String(
            now.getHours()
        ).padStart(2, "0")}:${String(
            now.getMinutes()
        ).padStart(2, "0")}`;

    appData.alarms
        .filter(
            alarm =>
                alarm.enabled
        )
        .forEach(alarm => {

            if (
                alarm.time !==
                currentTime
            ) {
                return;
            }

            if (
                !shouldAlarmRunToday(
                    alarm,
                    now
                )
            ) {
                return;
            }

            const key =
                `alarm_${alarm.id}_${getDateString(now)}`;

            if (
                alreadyNotified(key)
            ) {
                return;
            }

            sendAppNotification(
                "服薬のお時間です",
                `${alarm.medicationName}${
                    alarm.dose
                        ? ` ${alarm.dose}`
                        : ""
                }${
                    alarm.timing
                        ? `（${alarm.timing}）`
                        : ""
                }`,
                key
            );

            alarm.lastTriggered =
                now.toISOString();

            saveData();

        });

}

function shouldAlarmRunToday(
    alarm,
    date
) {

    switch (alarm.repeat) {

        case "weekday":
            return (
                date.getDay() >= 1 &&
                date.getDay() <= 5
            );

        case "weekend":
            return (
                date.getDay() === 0 ||
                date.getDay() === 6
            );

        case "daily":
        default:
            return true;

    }

}

function checkLowStockReminder(now) {

    if (
        !appData.settings.lowStockReminder
    ) {
        return;
    }

    if (
        now.getHours() !== 9 ||
        now.getMinutes() !== 0
    ) {
        return;
    }

    const day =
        now.getDate();

    if (
        day % 2 !== 0
    ) {
        return;
    }

    const lowStock =
        appData.medications.filter(
            medication =>
                isLowStock(medication)
        );

    if (!lowStock.length) {
        return;
    }

    const key =
        `lowstock_${getDateString(now)}`;

    if (
        alreadyNotified(key)
    ) {
        return;
    }

    const names =
        lowStock
            .map(
                medication =>
                    medication.name
            )
            .join("、");

    sendAppNotification(
        "在庫が少ないおくすりがあります",
        names,
        key
    );

}

function alreadyNotified(key) {

    return appData.notificationHistory.some(
        item =>
            item.key === key
    );

}

function sendAppNotification(
    title,
    body,
    key
) {

    appData.notificationHistory.unshift({

        id: createId("notification"),

        key,

        title,

        body,

        createdAt:
            new Date().toISOString()

    });

    appData.notificationHistory =
        appData.notificationHistory.slice(
            0,
            200
        );

    saveData();

    renderNotifications();

    if (
        "Notification" in window &&
        Notification.permission ===
            "granted"
    ) {

        try {

            new Notification(
                title,
                {
                    body
                }
            );

        } catch (error) {

            console.warn(
                "通知表示エラー:",
                error
            );

        }

    }

}

function requestNotificationPermission() {

    if (
        !("Notification" in window)
    ) {
        return;
    }

    if (
        Notification.permission ===
        "default"
    ) {

        Notification.requestPermission()
            .catch(
                error =>
                    console.warn(
                        error
                    )
            );

    }

}

// ============================================================
// ⑱ ダッシュボード補助
// ============================================================

function renderLowStockDashboard() {

    const container =
        document.getElementById(
            "dashboard-low-stock-list"
        );

    if (!container) return;

    const medications =
        appData.medications.filter(
            medication =>
                isLowStock(medication)
        );

    if (!medications.length) {

        container.innerHTML =
            `<div class="text-sm text-slate-400">
                在庫の少ないおくすりはありません。
            </div>`;

        return;

    }

    container.innerHTML =
        medications
            .map(
                medication => `

                    <div class="warning-item">

                        <i class="fa-solid fa-triangle-exclamation text-red-500"></i>

                        <div class="flex-1">
                            <strong>
                                ${escapeHtml(
                                    medication.name
                                )}
                            </strong>

                            <div class="text-xs text-slate-500">

                                残り
                                ${Number(
                                    medication.stock || 0
                                )}
                                ${escapeHtml(
                                    medication.unit ||
                                    "錠"
                                )}

                            </div>
                        </div>

                    </div>

                `
            )
            .join("");

}

function renderTodaySchedule() {

    const container =
        document.getElementById(
            "dashboard-schedule"
        );

    if (!container) return;

    const alarms =
        appData.alarms
            .filter(
                alarm =>
                    alarm.enabled
            )
            .sort(
                (a, b) =>
                    a.time.localeCompare(
                        b.time
                    )
            );

    if (!alarms.length) {

        container.innerHTML =
            `<div class="text-sm text-slate-400">
                今日の服薬予定はありません。
            </div>`;

        return;

    }

    container.innerHTML =
        alarms
            .map(
                alarm => `

                    <div class="schedule-item">

                        <div class="font-bold text-blue-600">
                            ${escapeHtml(
                                alarm.time
                            )}
                        </div>

                        <div class="flex-1">

                            ${escapeHtml(
                                alarm.medicationName
                            )}

                        </div>

                        ${
                            alarm.dose
                                ? `<span class="badge badge-blue">
                                    ${escapeHtml(
                                        alarm.dose
                                    )}
                                   </span>`
                                : ""
                        }

                    </div>

                `
            )
            .join("");

}

// ============================================================
// ⑲ ヘルスチャート
// ============================================================

let headacheChart = null;
let bloodPressureChart = null;

function updateHealthCharts() {

    renderHeadacheChart();

    renderBloodPressureChart();

}

function getRecentHealthLogs(days = 14) {

    const result = [];

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    for (
        let i = days - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date(today);

        date.setDate(
            date.getDate() - i
        );

        const dateString =
            getDateString(date);

        const log =
            appData.healthLogs.find(
                item =>
                    item.date ===
                    dateString
            );

        result.push({

            date: dateString,

            log: log || null

        });

    }

    return result;

}

function renderHeadacheChart() {

    const canvas =
        document.getElementById(
            "headache-chart"
        );

    if (!canvas) return;

    if (
        typeof Chart ===
        "undefined"
    ) {
        return;
    }

    const data =
        getRecentHealthLogs(14);

    const labels =
        data.map(
            item =>
                item.date.substring(5)
        );

    const values =
        data.map(
            item =>
                numberValue(
                    item.log?.headache?.level
                )
        );

    if (headacheChart) {

        headacheChart.destroy();

    }

    headacheChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "頭痛",

                            data:
                                values,

                            tension:
                                0.3,

                            spanGaps:
                                true

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            min: 0,

                            max: 10

                        }

                    }

                }

            }
        );

}

function renderBloodPressureChart() {

    const canvas =
        document.getElementById(
            "blood-pressure-chart"
        );

    if (!canvas) return;

    if (
        typeof Chart ===
        "undefined"
    ) {
        return;
    }

    const data =
        getRecentHealthLogs(14);

    const labels =
        data.map(
            item =>
                item.date.substring(5)
        );

    const systolic =
        data.map(
            item =>
                numberValue(
                    item.log
                        ?.bloodPressure
                        ?.morning
                        ?.systolic
                )
        );

    const diastolic =
        data.map(
            item =>
                numberValue(
                    item.log
                        ?.bloodPressure
                        ?.morning
                        ?.diastolic
                )
        );

    if (bloodPressureChart) {

        bloodPressureChart.destroy();

    }

    bloodPressureChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "収縮期",

                            data:
                                systolic,

                            tension:
                                0.3,

                            spanGaps:
                                true

                        },

                        {

                            label:
                                "拡張期",

                            data:
                                diastolic,

                            tension:
                                0.3,

                            spanGaps:
                                true

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                false

                        }

                    }

                }

            }
        );

}

// ============================================================
// ⑳ 共通DOM関数
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value ?? "";

}

function getInputValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value ?? "";

}

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.value =
        value ?? "";

}

function getCheckboxValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return false;
    }

    return !!element.checked;

}

function setCheckboxValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.checked =
        !!value;

}

function clearInputs(ids) {

    ids.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) return;

        if (
            element.type ===
            "checkbox"
        ) {

            element.checked =
                false;

        } else {

            element.value =
                "";

        }

    });

}

function showToast(message) {

    let toast =
        document.getElementById(
            "app-toast"
        );

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "app-toast";

        toast.style.position =
            "fixed";

        toast.style.bottom =
            "24px";

        toast.style.left =
            "50%";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.zIndex =
            "99999";

        toast.style.padding =
            "12px 18px";

        toast.style.borderRadius =
            "12px";

        toast.style.background =
            "#1e293b";

        toast.style.color =
            "#fff";

        toast.style.fontSize =
            "14px";

        toast.style.fontWeight =
            "600";

        toast.style.boxShadow =
            "0 8px 30px rgba(0,0,0,.2)";

        document.body.appendChild(
            toast
        );

    }

    toast.textContent =
        message;

    toast.style.opacity =
        "1";

    clearTimeout(
        toast._timer
    );

    toast._timer =
        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

            },
            2500
        );

}

// ============================================================
// ㉑ グローバルボタン
// ============================================================

function setupGlobalButtons() {

    const exportButton =
        document.getElementById(
            "export-data-btn"
        );

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportData
        );

    }

    const importInput =
        document.getElementById(
            "import-data-input"
        );

    if (importInput) {

        importInput.addEventListener(
            "change",
            importData
        );

    }

    const resetButton =
        document.getElementById(
            "reset-data-btn"
        );

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetAllData
        );

    }

}

// ============================================================
// ㉒ データバックアップ
// ============================================================

function exportData() {

    const json =
        JSON.stringify(
            appData,
            null,
            2
        );

    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const anchor =
        document.createElement(
            "a"
        );

    anchor.href =
        url;

    anchor.download =
        `medilog-backup-${getDateString()}.json`;

    document.body.appendChild(
        anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
        url
    );

    showToast(
        "バックアップを作成しました。"
    );

}

function importData(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload = () => {

        try {

            const imported =
                JSON.parse(
                    reader.result
                );

            if (
                !imported ||
                typeof imported !==
                    "object"
            ) {

                throw new Error(
                    "invalid"
                );

            }

            const confirmed =
                confirm(
                    "現在のデータをバックアップデータで置き換えますか？"
                );

            if (!confirmed) {
                return;
            }

            appData = {

                ...structuredClone(
                    defaultData
                ),

                ...imported,

                profile: {

                    ...defaultData.profile,

                    ...(imported.profile || {})

                },

                selfRecords: {

                    ...defaultData.selfRecords,

                    ...(imported.selfRecords || {})

                },

                settings: {

                    ...defaultData.settings,

                    ...(imported.settings || {})

                }

            };

            saveData();

            renderAll();

            showToast(
                "データを復元しました。"
            );

        } catch (error) {

            console.error(
                error
            );

            alert(
                "バックアップファイルを読み込めませんでした。"
            );

        }

    };

    reader.readAsText(
        file
    );

    event.target.value =
        "";

}

function resetAllData() {

    const confirmed =
        confirm(
            "すべてのデータを削除します。本当によろしいですか？"
        );

    if (!confirmed) return;

    const second =
        confirm(
            "この操作は元に戻せません。すべて削除しますか？"
        );

    if (!second) return;

    appData =
        structuredClone(
            defaultData
        );

    saveData();

    renderAll();

    showToast(
        "すべてのデータを削除しました。"
    );

}

// ============================================================
// ㉓ 補助：現在日時を服薬記録欄へ設定
// ============================================================

function setCurrentDateTimeToMedicationLog() {

    const input =
        document.getElementById(
            "med-log-datetime"
        );

    if (!input) return;

    const now =
        new Date();

    const local =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() *
                60000
        )
            .toISOString()
            .slice(
                0,
                16
            );

    input.value =
        local;

}

// ============================================================
// ㉔ ページ表示時の初期値
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setCurrentDateTimeToMedicationLog();

        const appointmentInput =
            document.getElementById(
                "appointment-datetime"
            );

        if (
            appointmentInput &&
            !appointmentInput.value
        ) {

            const now =
                new Date();

            const local =
                new Date(
                    now.getTime() -
                    now.getTimezoneOffset() *
                        60000
                )
                    .toISOString()
                    .slice(
                        0,
                        16
                    );

            appointmentInput.value =
                local;

        }

    }
);

// ============================================================
// ㉕ 外部から呼び出せる関数
// ============================================================

window.showView =
    showView;

window.deleteMedication =
    deleteMedication;

window.editMedication =
    editMedication;

window.quickMedicationLog =
    quickMedicationLog;

window.deleteMedicationLog =
    deleteMedicationLog;

window.toggleAlarm =
    toggleAlarm;

window.deleteAlarm =
    deleteAlarm;

window.deleteAppointment =
    deleteAppointment;

window.deleteAllergy =
    deleteAllergy;

window.deleteDisease =
    deleteDisease;

window.deleteVisit =
    deleteVisit;

window.saveHourlyHealth =
    saveHourlyHealth;

window.addMedicationLog =
    addMedicationLog;

window.exportData =
    exportData;

// ============================================================
// END
// ============================================================
