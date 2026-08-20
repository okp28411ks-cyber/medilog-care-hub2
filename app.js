// ============================================================
// まいへるす
// app.js
// ============================================================


// ============================================================
// ① Supabase設定
// ============================================================

const SUPABASE_URL = "https://ufmcloqjcolpvzhnobgg.supabase.co";

// Supabase Dashboard
// Settings → API
// Publishable key をここへ入れてください
const SUPABASE_ANON_KEY = "sb_publishable_mxebX3u8pw2XfPGwtzQmyg_aB2fUSWy";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ============================================================
// ② グローバル状態
// ============================================================

let currentUser = null;
let currentProfile = null;

let currentView = "dashboard";

let selectedDmFriend = null;

let medicationChart = null;
let classificationChart = null;


// ============================================================
// ③ 初期化
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await initializeApp();

    } catch (error) {

        console.error("Initialization error:", error);

        showToast(
            "アプリの初期化に失敗しました。",
            "error"
        );

    }

});


// ============================================================
// ④ アプリ初期化
// ============================================================

async function initializeApp() {

    showLoading(true);


    // 現在のログイン状態を確認

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(error);

        showLoading(false);

        showAuthScreen();

        return;
    }


    if (data.session) {

        currentUser = data.session.user;

        await loadCurrentUser();

        showAppScreen();

    } else {

        showAuthScreen();

    }


    // 認証状態の変更を監視

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                currentUser = session.user;

                await loadCurrentUser();

                showAppScreen();

            } else {

                currentUser = null;

                currentProfile = null;

                showAuthScreen();

            }

        }
    );


    showLoading(false);
}


// ============================================================
// ⑤ 現在ユーザー取得
// ============================================================

async function loadCurrentUser() {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();


        if (error) {

            console.error(
                "Profile load error:",
                error
            );

            return;
        }


        currentProfile = data;


        if (currentProfile) {

            updateUserUI();

        }

    } catch (error) {

        console.error(error);

    }

}


// ============================================================
// ⑥ ユーザーUI更新
// ============================================================

function updateUserUI() {

    if (!currentProfile) {
        return;
    }


    const username =
        currentProfile.username ||
        "ユーザー";


    const avatar =
        document.getElementById(
            "user-avatar"
        );


    const headerUsername =
        document.getElementById(
            "header-username"
        );


    const welcomeUsername =
        document.getElementById(
            "welcome-username"
        );


    const settingsUsername =
        document.getElementById(
            "settings-username"
        );


    const profileUsername =
        document.getElementById(
            "profile-username"
        );


    const settingsEmail =
        document.getElementById(
            "settings-email"
        );


    if (avatar) {

        avatar.textContent =
            username
                .trim()
                .charAt(0)
                .toUpperCase() || "U";

    }


    if (headerUsername) {

        headerUsername.textContent =
            username;

    }


    if (welcomeUsername) {

        welcomeUsername.textContent =
            `${username}さん、今日も健康管理を続けましょう`;

    }


    if (settingsUsername) {

        settingsUsername.textContent =
            username;

    }


    if (profileUsername) {

        profileUsername.value =
            username;

    }


    if (settingsEmail) {

        settingsEmail.textContent =
            currentUser?.email || "-";

    }


    // 基本情報

    const gender =
        document.getElementById(
            "profile-gender"
        );

    const age =
        document.getElementById(
            "profile-age"
        );

    const height =
        document.getElementById(
            "profile-height"
        );

    const weight =
        document.getElementById(
            "profile-weight"
        );


    if (gender) {

        gender.value =
            currentProfile.gender || "";

    }


    if (age) {

        age.value =
            currentProfile.age ?? "";

    }


    if (height) {

        height.value =
            currentProfile.height ?? "";

    }


    if (weight) {

        weight.value =
            currentProfile.weight ?? "";

    }

}


// ============================================================
// ⑦ Loading
// ============================================================

function showLoading(show) {

    const loading =
        document.getElementById(
            "loading-screen"
        );


    if (!loading) {
        return;
    }


    if (show) {

        loading.classList.remove(
            "hidden"
        );

    } else {

        loading.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// ⑧ 認証画面
// ============================================================

function showAuthScreen() {

    const auth =
        document.getElementById(
            "auth-screen"
        );

    const app =
        document.getElementById(
            "app-screen"
        );


    if (auth) {

        auth.classList.remove(
            "hidden"
        );

    }


    if (app) {

        app.classList.add(
            "hidden"
        );

    }

}


function showAppScreen() {

    const auth =
        document.getElementById(
            "auth-screen"
        );

    const app =
        document.getElementById(
            "app-screen"
        );


    if (auth) {

        auth.classList.add(
            "hidden"
        );

    }


    if (app) {

        app.classList.remove(
            "hidden"
        );

    }


    showView("dashboard");


    loadDashboard();

}


// ============================================================
// ⑨ ログイン
// ============================================================

async function login() {

    const email =
        document
            .getElementById("login-email")
            ?.value
            .trim();


    const password =
        document
            .getElementById("login-password")
            ?.value;


    const errorBox =
        document.getElementById(
            "login-error"
        );


    if (!email || !password) {

        showAuthError(
            errorBox,
            "メールアドレスとパスワードを入力してください。"
        );

        return;
    }


    setButtonLoading(
        "login-button",
        true
    );


    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });


    setButtonLoading(
        "login-button",
        false
    );


    if (error) {

        console.error(error);

        showAuthError(
            errorBox,
            translateAuthError(
                error.message
            )
        );

        return;
    }


    currentUser =
        data.user;


    await loadCurrentUser();

    showAppScreen();

}


// ============================================================
// ⑩ 会員登録
// ============================================================

async function register() {

    const email =
        document
            .getElementById("register-email")
            ?.value
            .trim();


    const username =
        document
            .getElementById("register-username")
            ?.value
            .trim();


    const password =
        document
            .getElementById("register-password")
            ?.value;


    const errorBox =
        document.getElementById(
            "register-error"
        );


    if (!email || !username || !password) {

        showAuthError(
            errorBox,
            "すべての項目を入力してください。"
        );

        return;
    }


    if (username.length < 2) {

        showAuthError(
            errorBox,
            "ユーザー名は2文字以上で入力してください。"
        );

        return;
    }


    if (password.length < 6) {

        showAuthError(
            errorBox,
            "パスワードは6文字以上にしてください。"
        );

        return;
    }


    const {
        data: existingProfile,
        error: usernameCheckError
    } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();


    if (usernameCheckError) {

        console.error(
            usernameCheckError
        );

        showAuthError(
            errorBox,
            "ユーザー名を確認できませんでした。"
        );

        return;
    }


    if (existingProfile) {

        showAuthError(
            errorBox,
            "そのユーザー名はすでに使用されています。"
        );

        return;
    }


    const {
        data,
        error
    } = await supabaseClient.auth.signUp({

        email,

        password,

        options: {

            data: {

                username

            }

        }

    });


    if (error) {

        console.error(error);

        showAuthError(
            errorBox,
            translateAuthError(
                error.message
            )
        );

        return;
    }


    /*
        Supabase側でメール確認が有効の場合、
        sessionがnullになる場合があります。
    */


    if (!data.user) {

        showAuthError(
            errorBox,
            "登録に失敗しました。"
        );

        return;
    }


    // セッションがある場合はprofilesを作成

    if (data.session) {

        await createProfile(
            data.user.id,
            username
        );

        currentUser =
            data.user;

        await loadCurrentUser();

        showAppScreen();

        showToast(
            "会員登録が完了しました。",
            "success"
        );

    } else {

        showAuthError(
            errorBox,
            "登録しました。メールアドレスに確認メールが届いている場合は、メールを確認してからログインしてください。"
        );

    }

}


// ============================================================
// ⑪ profiles作成
// ============================================================

async function createProfile(
    userId,
    username
) {

    const {
        error
    } = await supabaseClient
        .from("profiles")
        .upsert({

            id: userId,

            username: username

        });


    if (error) {

        console.error(
            "Profile creation error:",
            error
        );

    }

}


// ============================================================
// ⑫ ログアウト
// ============================================================

async function logout() {

    const confirmed =
        confirm(
            "ログアウトしますか？"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabaseClient.auth.signOut();


    if (error) {

        console.error(error);

        showToast(
            "ログアウトに失敗しました。",
            "error"
        );

        return;
    }


    currentUser = null;
    currentProfile = null;

}


// ============================================================
// ⑬ 認証フォーム切り替え
// ============================================================

function showRegisterForm() {

    document
        .getElementById("login-form")
        ?.classList
        .add("hidden");


    document
        .getElementById("register-form")
        ?.classList
        .remove("hidden");

}


function showLoginForm() {

    document
        .getElementById("register-form")
        ?.classList
        .add("hidden");


    document
        .getElementById("login-form")
        ?.classList
        .remove("hidden");

}


// ============================================================
// ⑭ 認証エラー
// ============================================================

function showAuthError(
    element,
    message
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "hidden"
    );

}


function translateAuthError(
    message
) {

    if (!message) {

        return "エラーが発生しました。";

    }


    const lower =
        message.toLowerCase();


    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return "メールアドレスまたはパスワードが正しくありません。";

    }


    if (
        lower.includes(
            "email not confirmed"
        )
    ) {

        return "メールアドレスの確認が完了していません。確認メールをご確認ください。";

    }


    if (
        lower.includes(
            "user already registered"
        )
    ) {

        return "このメールアドレスはすでに登録されています。";

    }


    if (
        lower.includes(
            "password"
        ) &&
        lower.includes(
            "6"
        )
    ) {

        return "パスワードは6文字以上にしてください。";

    }


    return message;

}


// ============================================================
// ⑮ Button loading
// ============================================================

function setButtonLoading(
    buttonId,
    loading
) {

    const button =
        document.getElementById(
            buttonId
        );


    if (!button) {
        return;
    }


    if (loading) {

        button.disabled = true;

        button.dataset.originalText =
            button.innerHTML;

        button.innerHTML =
            `
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                処理中...
            `;

    } else {

        button.disabled = false;

        if (
            button.dataset.originalText
        ) {

            button.innerHTML =
                button.dataset.originalText;

        }

    }

}


// ============================================================
// ⑯ View切り替え
// ============================================================

function showView(viewName) {

    currentView =
        viewName;


    const sections =
        document.querySelectorAll(
            ".view-section"
        );


    sections.forEach(
        section => {

            section.classList.add(
                "hidden"
            );

        }
    );


    const target =
        document.getElementById(
            `view-${viewName}`
        );


    if (target) {

        target.classList.remove(
            "hidden"
        );

    }


    const navButtons =
        document.querySelectorAll(
            ".nav-btn"
        );


    navButtons.forEach(
        button => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.view ===
                viewName
            ) {

                button.classList.add(
                    "active"
                );

            }

        }
    );


    updatePageHeader(
        viewName
    );


    // 各画面のデータ読み込み

    switch (viewName) {

        case "dashboard":
            loadDashboard();
            break;

        case "health":
            loadHealthRecords();
            break;

        case "medications":
            loadMedications();
            break;

        case "medication-logs":
            loadMedicationLogs();
            break;

        case "reminders":
            loadReminders();
            break;

        case "statistics":
            loadStatistics();
            break;

        case "profile":
            loadProfile();
            break;

        case "records":
            loadPersonalRecords();
            break;

        case "appointments":
            loadAppointments();
            break;

        case "friends":
            loadFriends();
            break;

        case "messages":
            loadDmFriends();
            break;

        case "notifications":
            loadNotifications();
            break;

        case "settings":
            loadSettings();
            break;

    }


    closeMobileSidebar();

}


// ============================================================
// ⑰ ページタイトル
// ============================================================

function updatePageHeader(
    viewName
) {

    const titles = {

        dashboard: [
            "ホーム",
            "今日の健康状態を確認しましょう"
        ],

        health: [
            "体調管理",
            "毎日の体調を記録しましょう"
        ],

        medications: [
            "おくすり在庫",
            "おくすりの在庫を管理します"
        ],

        "medication-logs": [
            "服薬記録",
            "服用したおくすりを記録します"
        ],

        reminders: [
            "服薬アラーム",
            "服薬時間を管理します"
        ],

        statistics: [
            "統計",
            "服薬状況を確認します"
        ],

        profile: [
            "基本情報",
            "あなたの基本情報を管理します"
        ],

        records: [
            "自身記録",
            "健康・医療情報を管理します"
        ],

        appointments: [
            "通院予定",
            "次回の通院を管理します"
        ],

        friends: [
            "フレンド",
            "フレンドを管理します"
        ],

        messages: [
            "DM",
            "フレンドとメッセージをやり取りします"
        ],

        notifications: [
            "通知",
            "重要なお知らせを確認します"
        ],

        settings: [
            "設定",
            "アプリの設定を管理します"
        ]

    };


    const data =
        titles[viewName] ||
        titles.dashboard;


    const title =
        document.getElementById(
            "page-title"
        );


    const subtitle =
        document.getElementById(
            "page-subtitle"
        );


    if (title) {

        title.textContent =
            data[0];

    }


    if (subtitle) {

        subtitle.textContent =
            data[1];

    }

}


// ============================================================
// ⑱ Mobile sidebar
// ============================================================

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    sidebar?.classList.toggle(
        "mobile-open"
    );

}


function closeMobileSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    sidebar?.classList.remove(
        "mobile-open"
    );

}


// ============================================================
// ⑲ Profile保存
// ============================================================

async function saveProfile() {

    if (!currentUser) {

        showToast(
            "ログインしてください。",
            "error"
        );

        return;
    }


    const username =
        document
            .getElementById(
                "profile-username"
            )
            ?.value
            .trim();


    const gender =
        document.getElementById(
            "profile-gender"
        )?.value;


    const age =
        document.getElementById(
            "profile-age"
        )?.value;


    const height =
        document.getElementById(
            "profile-height"
        )?.value;


    const weight =
        document.getElementById(
            "profile-weight"
        )?.value;


    if (!username) {

        showToast(
            "ユーザー名を入力してください。",
            "error"
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("profiles")
        .update({

            username,

            gender:
                gender || null,

            age:
                age
                    ? Number(age)
                    : null,

            height:
                height
                    ? Number(height)
                    : null,

            weight:
                weight
                    ? Number(weight)
                    : null

        })
        .eq(
            "id",
            currentUser.id
        );


    if (error) {

        console.error(error);

        showToast(
            "基本情報の保存に失敗しました。",
            "error"
        );

        return;
    }


    await loadCurrentUser();


    showToast(
        "基本情報を保存しました。",
        "success"
    );

}


// ============================================================
// ⑳ Profile読み込み
// ============================================================

async function loadProfile() {

    if (!currentUser) {
        return;
    }


    await loadCurrentUser();

}


// ============================================================
// ㉑ Settings
// ============================================================

function loadSettings() {

    updateUserUI();

}


// ============================================================
// ㉒ Dashboard
// ============================================================

async function loadDashboard() {

    if (!currentUser) {
        return;
    }


    await Promise.all([

        loadDashboardMedicationCount(),

        loadDashboardTodayMedicationCount(),

        loadDashboardFriendCount(),

        loadDashboardLowStock(),

        loadDashboardAppointment()

    ]);

}


// ============================================================
// ㉓ 薬数
// ============================================================

async function loadDashboardMedicationCount() {

    const {
        count,
        error
    } = await supabaseClient
        .from("medications")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(error);

        return;
    }


    setText(
        "dashboard-medication-count",
        count ?? 0
    );

}


// ============================================================
// ㉔ 今日の服薬数
// ============================================================

async function loadDashboardTodayMedicationCount() {

    const now =
        new Date();


    const start =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );


    const end =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );


    const {
        count,
        error
    } = await supabaseClient
        .from("medication_logs")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .gte(
            "taken_at",
            start.toISOString()
        )
        .lt(
            "taken_at",
            end.toISOString()
        );


    if (error) {

        console.error(error);

        return;
    }


    setText(
        "dashboard-today-medications",
        count ?? 0
    );

}


// ============================================================
// ㉕ フレンド数
// ============================================================

async function loadDashboardFriendCount() {

    const {
        count,
        error
    } = await supabaseClient
        .from("friends")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .or(
            `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
        );


    if (error) {

        console.error(error);

        return;
    }


    setText(
        "dashboard-friend-count",
        count ?? 0
    );

}


// ============================================================
// ㉖ 在庫少
// ============================================================

async function loadDashboardLowStock() {

    const {
        data,
        error
    } = await supabaseClient
        .from("medications")
        .select(
            "stock, low_stock_threshold"
        )
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(error);

        return;
    }


    const lowStock =
        (data || []).filter(
            medication =>
                Number(
                    medication.stock ?? 0
                ) <=
                Number(
                    medication.low_stock_threshold ?? 5
                )
        );


    setText(
        "dashboard-low-stock-count",
        lowStock.length
    );

}


// ============================================================
// ㉗ 次回通院
// ============================================================

async function loadDashboardAppointment() {

    const {
        data,
        error
    } = await supabaseClient
        .from("next_appointments")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .gte(
            "appointment_at",
            new Date().toISOString()
        )
        .order(
            "appointment_at",
            {
                ascending: true
            }
        )
        .limit(1)
        .maybeSingle();


    if (error) {

        console.error(error);

        return;
    }


    const container =
        document.getElementById(
            "dashboard-appointment"
        );


    if (!container) {
        return;
    }


    if (!data) {

        container.innerHTML =
            `
            <div class="empty-state">
                <i class="fa-solid fa-hospital"></i>
                <p>次回の通院予定はありません</p>
            </div>
            `;

        return;
    }


    const date =
        new Date(
            data.appointment_at
        );


    container.innerHTML =
        `
        <div class="appointment-card">

            <div class="appointment-date">

                <span class="appointment-date-day">
                    ${date.getDate()}
                </span>

                <span class="appointment-date-month">
                    ${date.getMonth() + 1}月
                </span>

            </div>

            <div>

                <div class="font-bold text-slate-800">
                    ${escapeHtml(
                        data.hospital_name ||
                        "医療機関"
                    )}
                </div>

                <div class="text-sm text-slate-500 mt-1">
                    ${escapeHtml(
                        data.department ||
                        ""
                    )}
                </div>

                <div class="text-xs text-slate-400 mt-2">
                    ${formatDateTime(
                        data.appointment_at
                    )}
                </div>

            </div>

        </div>
        `;

}


// ============================================================
// ㉘ 体調管理
// ============================================================

async function loadHealthRecords() {

    const container =
        document.getElementById(
            "health-records-container"
        );


    if (!container) {
        return;
    }


    if (!currentUser) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("health_records")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "recorded_at",
            {
                ascending: false
            }
        )
        .limit(30);


    if (error) {

        console.error(error);

        container.innerHTML =
            `
            <div class="content-card text-red-500">
                体調記録を読み込めませんでした。
            </div>
            `;

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
            <div class="content-card">
                <div class="empty-state">
                    <i class="fa-solid fa-heart-pulse"></i>
                    <p>まだ体調記録がありません。</p>
                </div>
            </div>
            `;

        return;
    }


    container.innerHTML =
        data.map(
            record =>
                renderHealthRecord(
                    record
                )
        ).join("");

}


// ============================================================
// ㉙ 体調記録表示
// ============================================================

function renderHealthRecord(
    record
) {

    return `
        <div class="health-record-card">

            <div class="flex items-center justify-between mb-4">

                <div>
                    <div class="font-bold text-slate-800">
                        ${formatDate(
                            record.recorded_at
                        )}
                    </div>

                    <div class="text-xs text-slate-400 mt-1">
                        ${formatDateTime(
                            record.recorded_at
                        )}
                    </div>
                </div>

            </div>


            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

                ${healthMetric(
                    "朝の血圧",
                    formatBloodPressure(
                        record.morning_systolic,
                        record.morning_diastolic
                    )
                )}

                ${healthMetric(
                    "昼の血圧",
                    formatBloodPressure(
                        record.noon_systolic,
                        record.noon_diastolic
                    )
                )}

                ${healthMetric(
                    "夜の血圧",
                    formatBloodPressure(
                        record.evening_systolic,
                        record.evening_diastolic
                    )
                )}

                ${healthMetric(
                    "こころの状態",
                    record.mood ||
                    "-"
                )}

            </div>


            ${
                record.diary
                    ? `
                    <div class="mt-4 p-4 rounded-xl bg-slate-50">
                        <div class="text-xs text-slate-400 mb-1">
                            プチ日記
                        </div>
                        <div class="text-sm text-slate-600 whitespace-pre-wrap">
                            ${escapeHtml(
                                record.diary
                            )}
                        </div>
                    </div>
                    `
                    : ""
            }

        </div>
    `;

}


// ============================================================
// ㉚ おくすり
// ============================================================

async function loadMedications() {

    const container =
        document.getElementById(
            "medications-container"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("medications")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        container.innerHTML =
            `
            <div class="content-card text-red-500 md:col-span-2 xl:col-span-3">
                おくすりを読み込めませんでした。
            </div>
            `;

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
            <div class="content-card md:col-span-2 xl:col-span-3">

                <div class="empty-state">

                    <i class="fa-solid fa-pills"></i>

                    <p>
                        おくすりが登録されていません。
                    </p>

                </div>

            </div>
            `;

        return;
    }


    container.innerHTML =
        data.map(
            medication =>
                renderMedicationCard(
                    medication
                )
        ).join("");

}


// ============================================================
// ㉛ 薬カード
// ============================================================

function renderMedicationCard(
    medication
) {

    const stock =
        Number(
            medication.stock ?? 0
        );


    const threshold =
        Number(
            medication.low_stock_threshold ?? 5
        );


    const percentage =
        Math.min(
            100,
            Math.max(
                5,
                threshold > 0
                    ? (
                        stock /
                        Math.max(
                            threshold * 2,
                            10
                        )
                    ) * 100
                    : 100
            )
        );


    let stockClass =
        "stock-normal";


    if (stock <= threshold) {

        stockClass =
            "stock-danger";

    } else if (
        stock <= threshold * 2
    ) {

        stockClass =
            "stock-warning";

    }


    return `
        <div class="medication-card">

            <div class="medication-photo">

                ${
                    medication.photo_url
                        ? `
                        <img
                            src="${escapeAttribute(
                                medication.photo_url
                            )}"
                            alt="${escapeAttribute(
                                medication.name
                            )}"
                        >
                        `
                        : `
                        <div class="medication-photo-placeholder">
                            <i class="fa-solid fa-pills"></i>
                        </div>
                        `
                }

            </div>


            <div class="medication-card-body">

                <div class="flex items-start justify-between gap-3">

                    <div>

                        <div class="medication-name">
                            ${escapeHtml(
                                medication.name
                            )}
                        </div>

                        <div class="medication-strength">
                            ${
                                medication.strength
                                    ? `${medication.strength}${medication.unit || "mg"}`
                                    : ""
                            }
                        </div>

                    </div>


                    <span class="status-badge ${
                        medication.status ===
                        "服用中"
                            ? "status-active"
                            : medication.status ===
                              "休止中"
                            ? "status-paused"
                            : "status-stopped"
                    }">

                        ${escapeHtml(
                            medication.status ||
                            "服用中"
                        )}

                    </span>

                </div>


                <div class="mt-5">

                    <div class="flex justify-between text-xs">

                        <span class="text-slate-400">
                            在庫
                        </span>

                        <span class="font-bold ${
                            stock <= threshold
                                ? "text-red-500"
                                : "text-slate-700"
                        }">

                            ${stock}
                            ${escapeHtml(
                                medication.unit ||
                                "錠"
                            )}

                        </span>

                    </div>


                    <div class="stock-bar">

                        <div
                            class="stock-bar-fill ${stockClass}"
                            style="width:${percentage}%"
                        ></div>

                    </div>

                </div>


                <div class="flex gap-2 mt-5">

                    <button
                        onclick="openMedicationLogModal('${medication.id}')"
                        class="secondary-button flex-1"
                    >
                        <i class="fa-solid fa-check"></i>
                        服薬
                    </button>

                    <button
                        onclick="editMedication('${medication.id}')"
                        class="secondary-button"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                </div>

            </div>

        </div>
    `;

}


// ============================================================
// ㉜ 服薬記録
// ============================================================

async function loadMedicationLogs() {

    const container =
        document.getElementById(
            "medication-logs-container"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("medication_logs")
        .select(
            `
            *,
            medications (
                name,
                strength,
                unit
            )
            `
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "taken_at",
            {
                ascending: false
            }
        )
        .limit(100);


    if (error) {

        console.error(error);

        container.innerHTML =
            `
            <div class="text-red-500">
                服薬記録を読み込めませんでした。
            </div>
            `;

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-check"></i>
                <p>服薬記録がありません。</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        data.map(
            log =>
                `
                <div class="data-row">

                    <div>

                        <div class="data-row-title">

                            ${escapeHtml(
                                log.medications?.name ||
                                "おくすり"
                            )}

                        </div>

                        <div class="data-row-subtitle">

                            ${formatDateTime(
                                log.taken_at
                            )}

                            ${
                                log.timing
                                    ? ` ・ ${escapeHtml(
                                        log.timing
                                    )}`
                                    : ""
                            }

                        </div>

                    </div>


                    <div class="text-sm font-bold text-slate-700">

                        ${
                            log.dose ??
                            "-"
                        }

                        ${escapeHtml(
                            log.unit ||
                            log.medications?.unit ||
                            ""
                        )}

                    </div>

                </div>
                `
        ).join("");

}


// ============================================================
// ㉝ アラーム
// ============================================================

async function loadReminders() {

    const container =
        document.getElementById(
            "reminders-container"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("medication_reminders")
        .select(
            `
            *,
            medications (
                name
            )
            `
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "reminder_time"
        );


    if (error) {

        console.error(error);

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
            <div class="content-card">
                <div class="empty-state">
                    <i class="fa-solid fa-bell"></i>
                    <p>服薬アラームがありません。</p>
                </div>
            </div>
            `;

        return;
    }


    container.innerHTML =
        data.map(
            reminder =>
                `
                <div class="content-card flex items-center justify-between">

                    <div class="flex items-center gap-4">

                        <div class="dashboard-icon bg-blue-50 text-blue-600">

                            <i class="fa-solid fa-clock"></i>

                        </div>

                        <div>

                            <div class="font-bold text-slate-800">

                                ${escapeHtml(
                                    reminder.medications?.name ||
                                    "おくすり"
                                )}

                            </div>

                            <div class="text-sm text-slate-400">

                                ${reminder.reminder_time}

                                ${
                                    reminder.timing
                                        ? ` ・ ${escapeHtml(
                                            reminder.timing
                                        )}`
                                        : ""
                                }

                            </div>

                        </div>

                    </div>


                    <div>

                        <span class="status-badge ${
                            reminder.enabled
                                ? "status-active"
                                : "status-stopped"
                        }">

                            ${
                                reminder.enabled
                                    ? "有効"
                                    : "無効"
                            }

                        </span>

                    </div>

                </div>
                `
        ).join("");

}


// ============================================================
// ㉞ 通院予定
// ============================================================

async function loadAppointments() {

    const container =
        document.getElementById(
            "appointments-container"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("next_appointments")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "appointment_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
            <div class="content-card">
                <div class="empty-state">
                    <i class="fa-solid fa-hospital"></i>
                    <p>通院予定がありません。</p>
                </div>
            </div>
            `;

        return;
    }


    container.innerHTML =
        data.map(
            appointment =>
                `
                <div class="appointment-card">

                    <div class="appointment-date">

                        <span class="appointment-date-day">

                            ${new Date(
                                appointment.appointment_at
                            ).getDate()}

                        </span>

                        <span class="appointment-date-month">

                            ${
                                new Date(
                                    appointment.appointment_at
                                ).getMonth() + 1
                            }月

                        </span>

                    </div>


                    <div class="flex-1">

                        <div class="font-bold text-slate-800">

                            ${escapeHtml(
                                appointment.hospital_name ||
                                "医療機関"
                            )}

                        </div>

                        <div class="text-sm text-slate-500 mt-1">

                            ${escapeHtml(
                                appointment.department ||
                                ""
                            )}

                        </div>

                        <div class="text-sm text-blue-600 font-medium mt-2">

                            ${formatDateTime(
                                appointment.appointment_at
                            )}

                        </div>


                        ${
                            appointment.memo
                                ? `
                                <div class="text-sm text-slate-500 mt-3">
                                    ${escapeHtml(
                                        appointment.memo
                                    )}
                                </div>
                                `
                                : ""
                        }

                    </div>

                </div>
                `
        ).join("");

}


// ============================================================
// ㉟ フレンド
// ============================================================

async function loadFriends() {

    const container =
        document.getElementById(
            "friends-list"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("friends")
        .select("*")
        .or(
            `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
        );


    if (error) {

        console.error(error);

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <i class="fa-solid fa-user-group"></i>
                <p>まだフレンドがいません。</p>
            </div>
            `;

    } else {

        const friendIds =
            data.map(
                friendship =>
                    friendship.user_id ===
                    currentUser.id
                        ? friendship.friend_id
                        : friendship.user_id
            );


        const {
            data: profiles
        } = await supabaseClient
            .from("profiles")
            .select(
                "id, username"
            )
            .in(
                "id",
                friendIds
            );


        container.innerHTML =
            (profiles || [])
                .map(
                    profile =>
                        `
                        <div class="friend-card">

                            <div class="friend-avatar">

                                ${escapeHtml(
                                    (
                                        profile.username ||
                                        "U"
                                    )
                                        .charAt(0)
                                )}

                            </div>


                            <div class="flex-1">

                                <div class="font-bold text-slate-700">

                                    ${escapeHtml(
                                        profile.username ||
                                        "ユーザー"
                                    )}

                                </div>

                            </div>


                            <button
                                onclick="openDm('${profile.id}')"
                                class="secondary-button"
                            >

                                <i class="fa-solid fa-comment"></i>

                            </button>

                        </div>
                        `
                )
                .join("");

    }


    await loadFriendRequests();

}


// ============================================================
// ㊱ フレンド申請
// ============================================================

async function loadFriendRequests() {

    const container =
        document.getElementById(
            "friend-requests"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("friend_requests")
        .select("*")
        .eq(
            "receiver_id",
            currentUser.id
        )
        .eq(
            "status",
            "pending"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <i class="fa-solid fa-user-plus"></i>
                <p>新しいフレンド申請はありません。</p>
            </div>
            `;

        return;
    }


    const senderIds =
        data.map(
            request =>
                request.sender_id
        );


    const {
        data: profiles
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, username"
        )
        .in(
            "id",
            senderIds
        );


    container.innerHTML =
        data.map(
            request => {

                const profile =
                    profiles?.find(
                        item =>
                            item.id ===
                            request.sender_id
                    );


                return `
                    <div class="friend-card">

                        <div class="friend-avatar">

                            ${escapeHtml(
                                (
                                    profile?.username ||
                                    "U"
                                ).charAt(0)
                            )}

                        </div>


                        <div class="flex-1">

                            <div class="font-bold text-slate-700">

                                ${escapeHtml(
                                    profile?.username ||
                                    "ユーザー"
                                )}

                            </div>

                            <div class="text-xs text-slate-400">
                                フレンド申請
                            </div>

                        </div>


                        <button
                            onclick="respondFriendRequest('${request.id}', 'accepted')"
                            class="primary-button"
                        >
                            承認
                        </button>


                        <button
                            onclick="respondFriendRequest('${request.id}', 'rejected')"
                            class="secondary-button"
                        >
                            拒否
                        </button>

                    </div>
                `;

            }
        ).join("");

}


// ============================================================
// ㊲ フレンド検索
// ============================================================

async function searchFriends() {

    const input =
        document.getElementById(
            "friend-search-input"
        );


    const results =
        document.getElementById(
            "friend-search-results"
        );


    if (!input || !results) {
        return;
    }


    const keyword =
        input.value.trim();


    if (!keyword) {

        results.innerHTML =
            "";

        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, username"
        )
        .ilike(
            "username",
            `%${keyword}%`
        )
        .neq(
            "id",
            currentUser.id
        )
        .limit(20);


    if (error) {

        console.error(error);

        results.innerHTML =
            `
            <div class="text-sm text-red-500">
                検索に失敗しました。
            </div>
            `;

        return;
    }


    if (!data?.length) {

        results.innerHTML =
            `
            <div class="text-sm text-slate-400 py-4">
                該当するユーザーが見つかりません。
            </div>
            `;

        return;
    }


    results.innerHTML =
        data.map(
            profile =>
                `
                <div class="friend-card">

                    <div class="friend-avatar">

                        ${escapeHtml(
                            (
                                profile.username ||
                                "U"
                            ).charAt(0)
                        )}

                    </div>


                    <div class="flex-1">

                        <div class="font-bold text-slate-700">

                            ${escapeHtml(
                                profile.username ||
                                "ユーザー"
                            )}

                        </div>

                    </div>


                    <button
                        onclick="sendFriendRequest('${profile.id}')"
                        class="primary-button"
                    >

                        <i class="fa-solid fa-user-plus"></i>

                        申請

                    </button>

                </div>
                `
        ).join("");

}


// ============================================================
// ㊳ フレンド申請送信
// ============================================================

async function sendFriendRequest(
    receiverId
) {

    if (
        !currentUser ||
        !receiverId
    ) {
        return;
    }


    if (
        receiverId ===
        currentUser.id
    ) {

        showToast(
            "自分自身には申請できません。",
            "warning"
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("friend_requests")
        .insert({

            sender_id:
                currentUser.id,

            receiver_id:
                receiverId,

            status:
                "pending"

        });


    if (error) {

        console.error(error);


        if (
            error.code ===
            "23505"
        ) {

            showToast(
                "すでに申請済みです。",
                "warning"
            );

        } else {

            showToast(
                "フレンド申請に失敗しました。",
                "error"
            );

        }

        return;
    }


    // 通知作成

    await createNotification(

        receiverId,

        "friend_request",

        "フレンド申請",

        `${
            currentProfile?.username ||
            "ユーザー"
        }さんからフレンド申請が届きました。`

    );


    showToast(
        "フレンド申請を送りました。",
        "success"
    );

}


// ============================================================
// ㊴ フレンド申請への回答
// ============================================================

async function respondFriendRequest(
    requestId,
    status
) {

    if (!currentUser) {
        return;
    }


    const {
        data: request,
        error: requestError
    } = await supabaseClient
        .from("friend_requests")
        .select("*")
        .eq(
            "id",
            requestId
        )
        .eq(
            "receiver_id",
            currentUser.id
        )
        .single();


    if (
        requestError ||
        !request
    ) {

        showToast(
            "申請を取得できませんでした。",
            "error"
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("friend_requests")
        .update({

            status

        })
        .eq(
            "id",
            requestId
        );


    if (error) {

        console.error(error);

        showToast(
            "処理に失敗しました。",
            "error"
        );

        return;
    }


    if (
        status ===
        "accepted"
    ) {

        await supabaseClient
            .from("friends")
            .upsert({

                user_id:
                    currentUser.id,

                friend_id:
                    request.sender_id

            });


        await supabaseClient
            .from("friends")
            .upsert({

                user_id:
                    request.sender_id,

                friend_id:
                    currentUser.id

            });


        await createNotification(

            request.sender_id,

            "friend_accepted",

            "フレンド申請が承認されました",

            `${
                currentProfile?.username ||
                "ユーザー"
            }さんとフレンドになりました。`

        );


        showToast(
            "フレンド申請を承認しました。",
            "success"
        );

    } else {

        showToast(
            "フレンド申請を拒否しました。",
            "info"
        );

    }


    await loadFriends();

}


// ============================================================
// ㊵ DMフレンド
// ============================================================

async function loadDmFriends() {

    const container =
        document.getElementById(
            "dm-friend-list"
        );


    if (!container) {
        return;
    }


    const {
        data: friendships,
        error
    } = await supabaseClient
        .from("friends")
        .select("*")
        .or(
            `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
        );


    if (error) {

        console.error(error);

        return;
    }


    const friendIds =
        (friendships || [])
            .map(
                friendship =>
                    friendship.user_id ===
                    currentUser.id
                        ? friendship.friend_id
                        : friendship.user_id
            );


    if (!friendIds.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <i class="fa-solid fa-comments"></i>
                <p>DMできるフレンドがいません。</p>
            </div>
            `;

        return;
    }


    const {
        data: profiles
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, username"
        )
        .in(
            "id",
            friendIds
        );


    container.innerHTML =
        (profiles || [])
            .map(
                profile =>
                    `
                    <button
                        onclick="openDm('${profile.id}')"
                        class="friend-card w-full text-left"
                    >

                        <div class="friend-avatar">

                            ${escapeHtml(
                                (
                                    profile.username ||
                                    "U"
                                ).charAt(0)
                            )}

                        </div>

                        <div>

                            <div class="font-bold text-slate-700">

                                ${escapeHtml(
                                    profile.username ||
                                    "ユーザー"
                                )}

                            </div>

                            <div class="text-xs text-slate-400">
                                DMを開く
                            </div>

                        </div>

                    </button>
                    `
            )
            .join("");

}


// ============================================================
// ㊶ DMを開く
// ============================================================

async function openDm(
    friendId
) {

    selectedDmFriend =
        friendId;


    const {
        data: profile
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, username"
        )
        .eq(
            "id",
            friendId
        )
        .maybeSingle();


    const header =
        document.getElementById(
            "dm-header"
        );


    if (header) {

        header.innerHTML =
            `
            <div class="flex items-center gap-3">

                <div class="friend-avatar">

                    ${escapeHtml(
                        (
                            profile?.username ||
                            "U"
                        ).charAt(0)
                    )}

                </div>

                <div>

                    <div class="font-bold text-slate-800">

                        ${escapeHtml(
                            profile?.username ||
                            "ユーザー"
                        )}

                    </div>

                    <div class="text-xs text-slate-400">
                        フレンド
                    </div>

                </div>

            </div>
            `;

    }


    await loadMessages();

}


// ============================================================
// ㊷ メッセージ読み込み
// ============================================================

async function loadMessages() {

    if (
        !currentUser ||
        !selectedDmFriend
    ) {
        return;
    }


    const container =
        document.getElementById(
            "messages-container"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("direct_messages")
        .select("*")
        .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedDmFriend}),and(sender_id.eq.${selectedDmFriend},receiver_id.eq.${currentUser.id})`
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        return;
    }


    container.innerHTML =
        (data || [])
            .map(
                message => {

                    const sent =
                        message.sender_id ===
                        currentUser.id;


                    return `
                        <div>

                            <div class="message-bubble ${
                                sent
                                    ? "message-sent"
                                    : "message-received"
                            }">

                                ${escapeHtml(
                                    message.message
                                )}

                            </div>

                            <div class="message-time">

                                ${formatDateTime(
                                    message.created_at
                                )}

                            </div>

                        </div>
                    `;

                }
            )
            .join("");


    container.scrollTop =
        container.scrollHeight;


    // 未読を既読にする

    await supabaseClient
        .from("direct_messages")
        .update({

            is_read: true

        })
        .eq(
            "sender_id",
            selectedDmFriend
        )
        .eq(
            "receiver_id",
            currentUser.id
        )
        .eq(
            "is_read",
            false
        );

}


// ============================================================
// ㊸ DM送信
// ============================================================

async function sendMessage() {

    if (
        !currentUser ||
        !selectedDmFriend
    ) {

        showToast(
            "送信先のフレンドを選択してください。",
            "warning"
        );

        return;
    }


    const input =
        document.getElementById(
            "message-input"
        );


    const message =
        input?.value.trim();


    if (!message) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("direct_messages")
        .insert({

            sender_id:
                currentUser.id,

            receiver_id:
                selectedDmFriend,

            message

        });


    if (error) {

        console.error(error);

        showToast(
            "メッセージを送信できませんでした。",
            "error"
        );

        return;
    }


    input.value =
        "";


    await createNotification(

        selectedDmFriend,

        "dm",

        "新しいDM",

        `${
            currentProfile?.username ||
            "ユーザー"
        }さんからメッセージが届きました。`

    );


    await loadMessages();

}


// ============================================================
// ㊹ EnterでDM送信
// ============================================================

function handleMessageKeydown(
    event
) {

    if (
        event.key ===
        "Enter"
    ) {

        event.preventDefault();

        sendMessage();

    }

}


// ============================================================
// ㊺ 通知
// ============================================================

async function createNotification(
    userId,
    type,
    title,
    message,
    relatedId = null
) {

    if (!userId) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("notifications")
        .insert({

            user_id:
                userId,

            notification_type:
                type,

            title,

            message,

            related_id:
                relatedId

        });


    if (error) {

        console.error(
            "Notification error:",
            error
        );

    }

}


// ============================================================
// ㊻ 通知読み込み
// ============================================================

async function loadNotifications() {

    const container =
        document.getElementById(
            "notifications-container"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(100);


    if (error) {

        console.error(error);

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <i class="fa-regular fa-bell"></i>
                <p>通知はありません。</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        data.map(
            notification =>
                `
                <div class="notification-item ${
                    notification.is_read
                        ? ""
                        : "unread"
                }">

                    <div class="notification-icon">

                        <i class="fa-solid ${
                            notification.notification_type ===
                            "dm"
                                ? "fa-comments"
                                : notification.notification_type ===
                                  "friend_request"
                                ? "fa-user-plus"
                                : "fa-bell"
                        }"></i>

                    </div>


                    <div class="flex-1">

                        <div class="font-bold text-slate-700">

                            ${escapeHtml(
                                notification.title ||
                                "通知"
                            )}

                        </div>

                        <div class="text-sm text-slate-500 mt-1">

                            ${escapeHtml(
                                notification.message ||
                                ""
                            )}

                        </div>

                        <div class="text-xs text-slate-400 mt-2">

                            ${formatDateTime(
                                notification.created_at
                            )}

                        </div>

                    </div>

                </div>
                `
        ).join("");


    updateNotificationBadge(
        data
    );

}


// ============================================================
// ㊼ 通知バッジ
// ============================================================

async function updateNotificationBadge(
    notifications = null
) {

    if (!currentUser) {
        return;
    }


    let unreadCount = 0;


    if (notifications) {

        unreadCount =
            notifications.filter(
                item =>
                    !item.is_read
            ).length;

    } else {

        const {
            count
        } = await supabaseClient
            .from("notifications")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .eq(
                "is_read",
                false
            );

        unreadCount =
            count || 0;

    }


    const badge =
        document.getElementById(
            "notification-badge"
        );


    const dot =
        document.getElementById(
            "header-notification-dot"
        );


    if (badge) {

        badge.textContent =
            unreadCount;


        badge.classList.toggle(
            "hidden",
            unreadCount === 0
        );

    }


    if (dot) {

        dot.classList.toggle(
            "hidden",
            unreadCount === 0
        );

    }

}


// ============================================================
// ㊽ 全通知既読
// ============================================================

async function markAllNotificationsRead() {

    if (!currentUser) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("notifications")
        .update({

            is_read: true

        })
        .eq(
            "user_id",
            currentUser.id
        )
        .eq(
            "is_read",
            false
        );


    if (error) {

        console.error(error);

        return;
    }


    await loadNotifications();

    await updateNotificationBadge();


    showToast(
        "すべて既読にしました。",
        "success"
    );

}


// ============================================================
// ㊾ 統計
// ============================================================

async function loadStatistics() {

    if (!currentUser) {
        return;
    }


    const periodElement =
        document.getElementById(
            "statistics-period"
        );


    const days =
        Number(
            periodElement?.value ||
            7
        );


    const start =
        new Date();


    start.setDate(
        start.getDate() -
        (days - 1)
    );


    const {
        data: logs,
        error
    } = await supabaseClient
        .from("medication_logs")
        .select(
            `
            *,
            medications (
                name,
                classification
            )
            `
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .gte(
            "taken_at",
            start.toISOString()
        );


    if (error) {

        console.error(error);

        return;
    }


    const ranking = {};


    const classifications = {};


    (logs || []).forEach(
        log => {

            const name =
                log.medications?.name ||
                "不明";


            ranking[name] =
                (ranking[name] || 0) +
                1;


            const classification =
                log.medications?.classification ||
                "その他";


            classifications[
                classification
            ] =
                (
                    classifications[
                        classification
                    ] || 0
                ) + 1;

        }
    );


    renderMedicationRanking(
        ranking
    );


    renderClassificationChart(
        classifications
    );


    renderMedicationChart(
        ranking
    );


    await loadLowStockList();

}


// ============================================================
// ㊿ ランキング
// ============================================================

function renderMedicationRanking(
    ranking
) {

    const container =
        document.getElementById(
            "medication-ranking"
        );


    if (!container) {
        return;
    }


    const sorted =
        Object.entries(
            ranking
        )
        .sort(
            (
                [, a],
                [, b]
            ) =>
                b - a
        );


    if (!sorted.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <p>データがありません。</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        sorted
            .slice(0, 10)
            .map(
                (
                    [name, count],
                    index
                ) =>
                    `
                    <div class="ranking-item">

                        <div class="ranking-number">

                            ${index + 1}

                        </div>


                        <div class="flex-1">

                            <div class="font-bold text-slate-700">

                                ${escapeHtml(
                                    name
                                )}

                            </div>

                        </div>


                        <div class="font-bold text-blue-600">

                            ${count}回

                        </div>

                    </div>
                    `
            )
            .join("");

}


// ============================================================
// 51. Chart
// ============================================================

function renderMedicationChart(
    ranking
) {

    const canvas =
        document.getElementById(
            "medication-chart"
        );


    if (!canvas) {
        return;
    }


    if (medicationChart) {

        medicationChart.destroy();

    }


    const sorted =
        Object.entries(
            ranking
        )
        .sort(
            (
                [, a],
                [, b]
            ) =>
                b - a
        )
        .slice(0, 10);


    medicationChart =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        sorted.map(
                            item =>
                                item[0]
                        ),

                    datasets: [

                        {

                            label:
                                "服用回数",

                            data:
                                sorted.map(
                                    item =>
                                        item[1]
                                )

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display:
                                false

                        }

                    }

                }

            }
        );

}


// ============================================================
// 52. Classification chart
// ============================================================

function renderClassificationChart(
    classifications
) {

    const canvas =
        document.getElementById(
            "classification-chart"
        );


    if (!canvas) {
        return;
    }


    if (
        classificationChart
    ) {

        classificationChart.destroy();

    }


    classificationChart =
        new Chart(
            canvas,
            {

                type:
                    "doughnut",

                data: {

                    labels:
                        Object.keys(
                            classifications
                        ),

                    datasets: [

                        {

                            data:
                                Object.values(
                                    classifications
                                )

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }
        );

}


// ============================================================
// 53. Low stock list
// ============================================================

async function loadLowStockList() {

    const container =
        document.getElementById(
            "low-stock-list"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("medications")
        .select(
            "name, stock, low_stock_threshold, unit"
        )
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(error);

        return;
    }


    const lowStock =
        (data || []).filter(
            medication =>
                Number(
                    medication.stock ?? 0
                ) <=
                Number(
                    medication.low_stock_threshold ?? 5
                )
        );


    if (!lowStock.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                <i class="fa-solid fa-circle-check"></i>
                <p>在庫の少ないおくすりはありません。</p>
            </div>
            `;

        return;
    }


    container.innerHTML =
        lowStock.map(
            medication =>
                `
                <div class="data-row">

                    <div>

                        <div class="data-row-title">

                            ${escapeHtml(
                                medication.name
                            )}

                        </div>

                        <div class="data-row-subtitle">
                            在庫が少なくなっています
                        </div>

                    </div>


                    <div class="text-red-500 font-bold">

                        ${medication.stock}

                        ${escapeHtml(
                            medication.unit ||
                            "錠"
                        )}

                    </div>

                </div>
                `
        ).join("");

}


// ============================================================
// 54. Personal records
// ============================================================

async function loadPersonalRecords() {

    if (!currentUser) {
        return;
    }


    const container =
        document.getElementById(
            "personal-records-container"
        );


    if (!container) {
        return;
    }


    const [
        bodyResult,
        allergyResult,
        diagnosisResult,
        visitResult
    ] =
        await Promise.all([

            supabaseClient
                .from("body_records")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "recorded_at",
                    {
                        ascending: false
                    }
                )
                .limit(5),

            supabaseClient
                .from("allergies")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                ),

            supabaseClient
                .from("diagnoses")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                ),

            supabaseClient
                .from("medical_visits")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "visit_date",
                    {
                        ascending: false
                    }
                )
                .limit(5)

        ]);


    container.innerHTML = `

        <div class="mb-6">

            <h4 class="font-bold text-slate-700 mb-3">
                身長・体重
            </h4>

            ${
                bodyResult.data?.length
                    ? bodyResult.data
                        .map(
                            item =>
                                `
                                <div class="data-row">

                                    <div class="text-sm text-slate-400">

                                        ${formatDate(
                                            item.recorded_at
                                        )}

                                    </div>

                                    <div class="font-bold">

                                        ${
                                            item.height ??
                                            "-"
                                        } cm

                                        /

                                        ${
                                            item.weight ??
                                            "-"
                                        } kg

                                    </div>

                                </div>
                                `
                        )
                        .join("")
                    : `
                        <div class="text-sm text-slate-400">
                            記録がありません。
                        </div>
                    `
            }

        </div>


        <div class="mb-6">

            <h4 class="font-bold text-slate-700 mb-3">
                アレルギー
            </h4>

            ${
                allergyResult.data?.length
                    ? allergyResult.data
                        .map(
                            item =>
                                `
                                <div class="data-row">

                                    <div class="font-bold">

                                        ${escapeHtml(
                                            item.allergy_name
                                        )}

                                    </div>

                                    <div class="text-sm text-slate-400">

                                        ${escapeHtml(
                                            item.reaction ||
                                            ""
                                        )}

                                    </div>

                                </div>
                                `
                        )
                        .join("")
                    : `
                        <div class="text-sm text-slate-400">
                            登録されていません。
                        </div>
                    `
            }

        </div>


        <div class="mb-6">

            <h4 class="font-bold text-slate-700 mb-3">
                病名
            </h4>

            ${
                diagnosisResult.data?.length
                    ? diagnosisResult.data
                        .map(
                            item =>
                                `
                                <div class="data-row">

                                    <div class="font-bold">

                                        ${escapeHtml(
                                            item.disease_name
                                        )}

                                    </div>

                                    <div class="text-sm text-slate-400">

                                        ${escapeHtml(
                                            item.status ||
                                            ""
                                        )}

                                    </div>

                                </div>
                                `
                        )
                        .join("")
                    : `
                        <div class="text-sm text-slate-400">
                            登録されていません。
                        </div>
                    `
            }

        </div>


        <div>

            <h4 class="font-bold text-slate-700 mb-3">
                通院履歴
            </h4>

            ${
                visitResult.data?.length
                    ? visitResult.data
                        .map(
                            item =>
                                `
                                <div class="data-row">

                                    <div>

                                        <div class="font-bold">

                                            ${escapeHtml(
                                                item.hospital_name ||
                                                "医療機関"
                                            )}

                                        </div>

                                        <div class="text-xs text-slate-400 mt-1">

                                            ${formatDate(
                                                item.visit_date
                                            )}

                                        </div>

                                    </div>

                                    <div class="text-sm text-slate-400">

                                        ${escapeHtml(
                                            item.department ||
                                            ""
                                        )}

                                    </div>

                                </div>
                                `
                        )
                        .join("")
                    : `
                        <div class="text-sm text-slate-400">
                            通院履歴がありません。
                        </div>
                    `
            }

        </div>

    `;

}


// ============================================================
// 55. Helper
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function healthMetric(
    label,
    value
) {

    return `
        <div class="health-metric">

            <div class="health-metric-label">
                ${escapeHtml(label)}
            </div>

            <div class="health-metric-value">
                ${escapeHtml(
                    String(value || "-")
                )}
            </div>

        </div>
    `;

}


function formatBloodPressure(
    systolic,
    diastolic
) {

    if (
        systolic === null ||
        systolic === undefined ||
        systolic === "" ||
        diastolic === null ||
        diastolic === undefined ||
        diastolic === ""
    ) {

        return "-";

    }


    return `${systolic}/${diastolic}`;

}


function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);

}


function formatDateTime(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


function showToast(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "toast-container"
        );


    if (!container) {
        return;
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    const icon =
        type === "success"
            ? "fa-circle-check"
            : type === "error"
            ? "fa-circle-xmark"
            : type === "warning"
            ? "fa-triangle-exclamation"
            : "fa-circle-info";


    toast.innerHTML =
        `
        <i class="fa-solid ${icon}"></i>

        <div class="text-sm font-medium text-slate-700">

            ${escapeHtml(
                message
            )}

        </div>
        `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


// ============================================================
// 56. Placeholder modal functions
// ============================================================

function openHealthModal() {

    showToast(
        "体調記録画面は次の実装で追加します。",
        "info"
    );

}


function openMedicationModal() {

    showToast(
        "おくすり登録画面は次の実装で追加します。",
        "info"
    );

}


function openMedicationLogModal() {

    showToast(
        "服薬記録画面は次の実装で追加します。",
        "info"
    );

}


function openReminderModal() {

    showToast(
        "服薬アラーム画面は次の実装で追加します。",
        "info"
    );

}


function openBodyRecordModal() {

    showToast(
        "身体記録画面は次の実装で追加します。",
        "info"
    );

}


function openVisitModal() {

    showToast(
        "通院履歴画面は次の実装で追加します。",
        "info"
    );

}


function openAllergyModal() {

    showToast(
        "アレルギー登録画面は次の実装で追加します。",
        "info"
    );

}


function openDiagnosisModal() {

    showToast(
        "病名登録画面は次の実装で追加します。",
        "info"
    );

}


function openAppointmentModal() {

    showToast(
        "通院予定画面は次の実装で追加します。",
        "info"
    );

}


function editMedication() {

    showToast(
        "編集画面は次の実装で追加します。",
        "info"
    );

}


// ============================================================
// END
// ============================================================
