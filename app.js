// ============================================================
// まいへるす - app.js
// 完成版 前半
// ============================================================

// ============================================================
// ① Supabase設定
// ============================================================

// ★ここだけにSupabase設定を書く
const SUPABASE_URL = "https://ufmcloqjcolpvzhnobgg.supabase.co";

const SUPABASE_ANON_KEY =
    "ここに現在使用しているSupabaseのPublishable Keyを入れてください";


// Supabaseクライアント
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ============================================================
// ② グローバル変数
// ============================================================

let currentUser = null;
let currentProfile = null;

let medications = [];
let medicationLogs = [];
let healthRecords = [];
let appointments = [];
let diagnoses = [];
let visits = [];
let allergies = [];
let friends = [];
let friendRequests = [];
let notifications = [];
let sharedMedications = [];

let selectedChatFriend = null;
let messageSubscription = null;


// ============================================================
// ③ DOM取得ヘルパー
// ============================================================

function $(id) {
    return document.getElementById(id);
}


// ============================================================
// ④ HTMLエスケープ
// ============================================================

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


// ============================================================
// ⑤ 初期化
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        setupAuthEvents();
        setupCommonEvents();

        await initializeApp();

    } catch (error) {

        console.error("初期化エラー:", error);

        showToast(
            "アプリの初期化に失敗しました。",
            "error"
        );

        hideLoading();

    }

});


// ============================================================
// ⑥ アプリ初期化
// ============================================================

async function initializeApp() {

    showLoading();

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (data && data.session) {

            currentUser = data.session.user;

            await loadUserProfile();

            showApp();

            await loadAllData();

        } else {

            showAuth();

        }

    } catch (error) {

        console.error(
            "initializeApp error:",
            error
        );

        showAuth();

    } finally {

        hideLoading();

    }


    // 認証状態変更監視
    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "Auth event:",
                event
            );

            if (session) {

                currentUser = session.user;

                await loadUserProfile();

                showApp();

                await loadAllData();

            } else {

                currentUser = null;
                currentProfile = null;

                showAuth();

            }

        }
    );

}


// ============================================================
// ⑦ 認証画面イベント
// ============================================================

function setupAuthEvents() {

    const loginForm =
        $("login-form-element");

    const registerForm =
        $("register-form-element");

    const showRegisterButton =
        $("show-register-button");

    const showLoginButton =
        $("show-login-button");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            handleRegister
        );

    }


    if (showRegisterButton) {

        showRegisterButton.addEventListener(
            "click",
            () => {

                $("login-form")?.classList.add("hidden");

                $("register-form")?.classList.remove("hidden");

            }
        );

    }


    if (showLoginButton) {

        showLoginButton.addEventListener(
            "click",
            () => {

                $("register-form")?.classList.add("hidden");

                $("login-form")?.classList.remove("hidden");

            }
        );

    }

}


// ============================================================
// ⑧ 共通イベント
// ============================================================

function setupCommonEvents() {

    const logoutButton =
        $("logout-button");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            handleLogout
        );

    }


    const mobileMenuButton =
        $("mobile-menu-button");

    if (mobileMenuButton) {

        mobileMenuButton.addEventListener(
            "click",
            toggleMobileMenu
        );

    }


    const sidebarOverlay =
        $("sidebar-overlay");

    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeMobileMenu
        );

    }

}


// ============================================================
// ⑨ 会員登録
// ============================================================

async function handleRegister(event) {

    event.preventDefault();

    const username =
        $("register-username")?.value.trim();

    const email =
        $("register-email")?.value.trim();

    const password =
        $("register-password")?.value;

    const passwordConfirm =
        $("register-password-confirm")?.value;


    if (!username || !email || !password) {

        showToast(
            "すべての項目を入力してください。",
            "error"
        );

        return;

    }


    if (password !== passwordConfirm) {

        showToast(
            "パスワードが一致していません。",
            "error"
        );

        return;

    }


    if (password.length < 6) {

        showToast(
            "パスワードは6文字以上にしてください。",
            "error"
        );

        return;

    }


    showLoading();


    try {

        // まずユーザーネーム重複チェック
        const {
            data: existingProfiles,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("username", username)
            .limit(1);


        if (profileError) {
            throw profileError;
        }


        if (
            existingProfiles &&
            existingProfiles.length > 0
        ) {

            showToast(
                "そのユーザーネームはすでに使用されています。",
                "error"
            );

            return;

        }


        // Supabase Auth登録
        const {
            data,
            error
        } = await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {

                data: {
                    username: username
                }

            }

        });


        if (error) {
            throw error;
        }


        // メール確認が必要な場合
        if (
            data.user &&
            !data.session
        ) {

            showToast(
                "会員登録が完了しました。確認メールを確認してください。",
                "success"
            );

            $("register-form-element")?.reset();

            $("register-form")?.classList.add("hidden");

            $("login-form")?.classList.remove("hidden");

            return;

        }


        // セッションが即時発行された場合
        if (data.user) {

            currentUser = data.user;

            await createProfileIfNeeded(
                data.user,
                username
            );

            await loadUserProfile();

            showApp();

            await loadAllData();

            showToast(
                "会員登録が完了しました。",
                "success"
            );

        }

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        showToast(
            getSupabaseErrorMessage(error),
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ============================================================
// ⑩ プロフィール作成
// ============================================================

async function createProfileIfNeeded(
    user,
    username
) {

    if (!user) {
        return;
    }


    const {
        data: existing,
        error: selectError
    } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();


    if (selectError) {

        console.error(
            "Profile check error:",
            selectError
        );

        return;

    }


    if (existing) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("profiles")
        .insert({

            id: user.id,

            username:
                username ||
                user.user_metadata?.username ||
                user.email?.split("@")[0] ||
                "user"

        });


    if (error) {

        console.error(
            "Profile creation error:",
            error
        );

    }

}


// ============================================================
// ⑪ ログイン
// ============================================================

async function handleLogin(event) {

    event.preventDefault();


    const email =
        $("login-email")?.value.trim();

    const password =
        $("login-password")?.value;


    if (!email || !password) {

        showToast(
            "メールアドレスとパスワードを入力してください。",
            "error"
        );

        return;

    }


    showLoading();


    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {
            throw error;
        }


        currentUser = data.user;


        await createProfileIfNeeded(
            currentUser,
            currentUser.user_metadata?.username
        );


        await loadUserProfile();


        showApp();


        await loadAllData();


        $("login-form-element")?.reset();


        showToast(
            "ログインしました。",
            "success"
        );


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showToast(
            getSupabaseErrorMessage(error),
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ============================================================
// ⑫ ログアウト
// ============================================================

async function handleLogout() {

    try {

        showLoading();

        const {
            error
        } = await supabaseClient.auth.signOut();


        if (error) {
            throw error;
        }


        currentUser = null;
        currentProfile = null;


        showAuth();


        showToast(
            "ログアウトしました。",
            "success"
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showToast(
            "ログアウトに失敗しました。",
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ============================================================
// ⑬ ユーザープロフィール読み込み
// ============================================================

async function loadUserProfile() {

    if (!currentUser) {
        return null;
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
            throw error;
        }


        if (!data) {

            await createProfileIfNeeded(
                currentUser,
                currentUser.user_metadata?.username
            );


            const {
                data: newProfile
            } = await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .maybeSingle();


            currentProfile =
                newProfile || null;

        } else {

            currentProfile = data;

        }


        updateUserUI();


        return currentProfile;


    } catch (error) {

        console.error(
            "loadUserProfile error:",
            error
        );

        return null;

    }

}


// ============================================================
// ⑭ ユーザーUI更新
// ============================================================

function updateUserUI() {

    const username =
        currentProfile?.username ||
        currentUser?.user_metadata?.username ||
        currentUser?.email?.split("@")[0] ||
        "ユーザー";


    const email =
        currentUser?.email ||
        "-";


    const avatarLetter =
        username.charAt(0).toUpperCase();


    // Sidebar
    if ($("sidebar-username")) {

        $("sidebar-username").textContent =
            username;

    }


    if ($("sidebar-email")) {

        $("sidebar-email").textContent =
            email;

    }


    // Header
    if ($("header-username")) {

        $("header-username").textContent =
            username;

    }


    if ($("header-avatar")) {

        $("header-avatar").textContent =
            avatarLetter;

    }


    // Sidebar avatar
    if ($("sidebar-avatar")) {

        $("sidebar-avatar").innerHTML =
            escapeHtml(avatarLetter);

    }


    // Settings
    if ($("settings-avatar")) {

        $("settings-avatar").textContent =
            avatarLetter;

    }


    if ($("settings-email")) {

        $("settings-email").textContent =
            email;

    }


    if ($("account-email")) {

        $("account-email").textContent =
            email;

    }


    if ($("profile-username")) {

        $("profile-username").value =
            currentProfile?.username || "";

    }


    if ($("profile-display-name")) {

        $("profile-display-name").value =
            currentProfile?.display_name || "";

    }


    if ($("profile-gender")) {

        $("profile-gender").value =
            currentProfile?.gender || "";

    }


    if ($("profile-age")) {

        $("profile-age").value =
            currentProfile?.age ?? "";

    }


    if ($("profile-height")) {

        $("profile-height").value =
            currentProfile?.height ?? "";

    }


    if ($("profile-weight")) {

        $("profile-weight").value =
            currentProfile?.weight ?? "";

    }

}


// ============================================================
// ⑮ 表示切り替え
// ============================================================

function showAuth() {

    $("app-loading")?.classList.add("hidden");

    $("app")?.classList.add("hidden");

    $("app-container")?.classList.add("hidden");

    $("auth-screen")?.classList.remove("hidden");


    $("login-form")?.classList.remove("hidden");

    $("register-form")?.classList.add("hidden");

}


function showApp() {

    $("app-loading")?.classList.add("hidden");

    $("auth-screen")?.classList.add("hidden");

    $("app")?.classList.remove("hidden");

    $("app-container")?.classList.remove("hidden");


    // 現在のHTMLでは
    // app と app-container が重複している可能性があるため、
    // 少なくともどちらかが表示されるようにする

}


// ============================================================
// ⑯ View切り替え
// ============================================================

function showView(viewName) {

    const sections =
        document.querySelectorAll(
            ".view-section"
        );


    sections.forEach(section => {

        section.classList.add("hidden");

    });


    const target =
        document.getElementById(
            `view-${viewName}`
        );


    if (target) {

        target.classList.remove("hidden");

    }


    // ナビゲーション
    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove("active");

            if (
                button.dataset.view === viewName
            ) {

                button.classList.add("active");

            }

        });


    updatePageHeader(
        viewName
    );


    closeMobileMenu();


    // 必要な画面の再読み込み
    refreshViewData(viewName);

}


// ============================================================
// ⑰ ページタイトル
// ============================================================

const pageTitles = {

    dashboard: [
        "ダッシュボード",
        "今日の健康状態を確認しましょう"
    ],

    medications: [
        "お薬",
        "現在使用しているお薬を管理します"
    ],

    "medication-logs": [
        "服薬記録",
        "服用したお薬を記録・確認できます"
    ],

    reminders: [
        "服薬リマインダー",
        "お薬を飲む時間を管理します"
    ],

    health: [
        "健康記録",
        "日々の健康状態を記録します"
    ],

    diagnoses: [
        "診断・病歴",
        "診断された病気や病歴を管理します"
    ],

    visits: [
        "診察記録",
        "病院・クリニックでの診察記録を管理します"
    ],

    appointments: [
        "通院予定",
        "病院・クリニックの予定を管理します"
    ],

    allergies: [
        "アレルギー",
        "アレルギー情報を管理します"
    ],

    friends: [
        "友達",
        "友達と健康情報を共有できます"
    ],

    messages: [
        "メッセージ",
        "友達と直接メッセージをやり取りできます"
    ],

    "shared-medications": [
        "共有されたお薬",
        "友達から共有されたお薬を確認できます"
    ],

    notifications: [
        "通知",
        "友達申請や共有などのお知らせ"
    ],

    profile: [
        "プロフィール",
        "あなたのプロフィールを管理します"
    ],

    settings: [
        "設定",
        "プロフィールやアプリの設定を管理します"
    ]

};


function updatePageHeader(
    viewName
) {

    const info =
        pageTitles[viewName] ||
        pageTitles.dashboard;


    if ($("page-title")) {

        $("page-title").textContent =
            info[0];

    }


    if ($("page-subtitle")) {

        $("page-subtitle").textContent =
            info[1];

    }

}


// ============================================================
// ⑱ Mobile Menu
// ============================================================

function toggleMobileMenu() {

    const sidebar =
        $("sidebar");

    const overlay =
        $("sidebar-overlay") ||
        $("mobile-overlay");


    if (!sidebar) {
        return;
    }


    sidebar.classList.toggle(
        "mobile-open"
    );


    if (overlay) {

        overlay.classList.toggle(
            "hidden"
        );

    }

}


function closeMobileMenu() {

    const sidebar =
        $("sidebar");

    const overlay =
        $("sidebar-overlay") ||
        $("mobile-overlay");


    if (sidebar) {

        sidebar.classList.remove(
            "mobile-open"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// ⑲ Loading
// ============================================================

function showLoading() {

    const loading =
        $("global-loading");


    if (loading) {

        loading.classList.remove(
            "hidden"
        );

        loading.classList.add(
            "flex"
        );

    }

}


function hideLoading() {

    const loading =
        $("global-loading");


    if (loading) {

        loading.classList.add(
            "hidden"
        );

        loading.classList.remove(
            "flex"
        );

    }


    $("app-loading")?.classList.add(
        "hidden"
    );

}


// ============================================================
// ⑳ Toast
// ============================================================

function showToast(
    message,
    type = "success"
) {

    const container =
        $("toast-container");


    if (!container) {

        console.log(
            `[${type}]`,
            message
        );

        return;

    }


    const toast =
        document.createElement("div");


    let icon =
        "fa-circle-check";


    if (type === "error") {

        icon =
            "fa-circle-exclamation";

    } else if (type === "warning") {

        icon =
            "fa-triangle-exclamation";

    } else if (type === "info") {

        icon =
            "fa-circle-info";

    }


    toast.className =
        "toast-item";


    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid ${icon}"></i>
        </div>

        <div class="toast-message">
            ${escapeHtml(message)}
        </div>

        <button
            type="button"
            class="toast-close"
            onclick="this.parentElement.remove()"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;


    container.appendChild(
        toast
    );


    setTimeout(() => {

        toast.classList.add(
            "toast-hide"
        );


        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 4000);

}


// ============================================================
// ㉑ Supabaseエラー表示
// ============================================================

function getSupabaseErrorMessage(
    error
) {

    if (!error) {

        return "不明なエラーが発生しました。";

    }


    const message =
        error.message ||
        "";


    if (
        message.includes(
            "Invalid login credentials"
        )
    ) {

        return "メールアドレスまたはパスワードが正しくありません。";

    }


    if (
        message.includes(
            "Email not confirmed"
        )
    ) {

        return "メールアドレスの確認が完了していません。確認メールをご確認ください。";

    }


    if (
        message.includes(
            "User already registered"
        )
    ) {

        return "このメールアドレスはすでに登録されています。";

    }


    if (
        message.includes(
            "rate limit"
        )
    ) {

        return "メール送信回数の上限に達しています。しばらく時間を置いてください。";

    }


    return message ||
        "エラーが発生しました。";

}


// ============================================================
// ㉒ 全データ読み込み
// ============================================================

async function loadAllData() {

    if (!currentUser) {
        return;
    }


    try {

        await Promise.all([

            loadMedications(),

            loadMedicationLogs(),

            loadHealthRecords(),

            loadAppointments(),

            loadDiagnoses(),

            loadVisits(),

            loadAllergies(),

            loadFriends(),

            loadFriendRequests(),

            loadNotifications(),

            loadSharedMedications()

        ]);


        updateDashboard();


    } catch (error) {

        console.error(
            "loadAllData error:",
            error
        );

    }

}


// ============================================================
// ㉓ Viewごとの再読み込み
// ============================================================

async function refreshViewData(
    viewName
) {

    if (!currentUser) {
        return;
    }


    try {

        switch (viewName) {

            case "dashboard":

                updateDashboard();

                break;


            case "medications":

                await loadMedications();

                break;


            case "medication-logs":

                await loadMedicationLogs();

                break;


            case "health":

                await loadHealthRecords();

                break;


            case "appointments":

                await loadAppointments();

                break;


            case "diagnoses":

                await loadDiagnoses();

                break;


            case "visits":

                await loadVisits();

                break;


            case "allergies":

                await loadAllergies();

                break;


            case "friends":

                await loadFriends();

                await loadFriendRequests();

                break;


            case "messages":

                await loadMessageFriends();

                break;


            case "notifications":

                await loadNotifications();

                break;


            case "shared-medications":

                await loadSharedMedications();

                break;


            case "settings":

                await loadUserProfile();

                break;

        }

    } catch (error) {

        console.error(
            `refreshViewData(${viewName}) error:`,
            error
        );

    }

}


// ============================================================
// ㉔ お薬読み込み
// ============================================================

async function loadMedications() {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("medications")
            .select("*")
            .eq("user_id", currentUser.id)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        medications =
            data || [];


        renderMedications();

        updateDashboard();


    } catch (error) {

        console.error(
            "loadMedications error:",
            error
        );

    }

}


// ============================================================
// ㉕ お薬表示
// ============================================================

function renderMedications() {

    const container =
        $("medications-list");


    if (!container) {
        return;
    }


    if (!medications.length) {

        container.innerHTML = `
            <div class="content-card sm:col-span-2 xl:col-span-3">
                <div class="empty-state">
                    <i class="fa-solid fa-pills"></i>
                    <p>登録されているお薬はありません。</p>
                    <button
                        type="button"
                        class="primary-button mt-4"
                        onclick="openMedicationModal()"
                    >
                        <i class="fa-solid fa-plus"></i>
                        お薬を登録
                    </button>
                </div>
            </div>
        `;

        return;

    }


    container.innerHTML =
        medications.map(
            medication => {

                const name =
                    escapeHtml(
                        medication.name ||
                        "名称未設定"
                    );


                const dosage =
                    escapeHtml(
                        medication.dosage ||
                        medication.amount ||
                        "-"
                    );


                const frequency =
                    escapeHtml(
                        medication.frequency ||
                        medication.timing ||
                        "-"
                    );


                return `
                    <div class="content-card medication-card">

                        <div class="flex items-start justify-between gap-4">

                            <div class="flex items-center gap-3">

                                <div class="dashboard-icon bg-blue-50 text-blue-600">
                                    <i class="fa-solid fa-pills"></i>
                                </div>

                                <div>

                                    <h3 class="font-extrabold text-slate-900">
                                        ${name}
                                    </h3>

                                    <p class="mt-1 text-xs text-slate-400">
                                        ${dosage}
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                class="icon-button"
                                onclick="deleteMedication('${medication.id}')"
                                title="削除"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>


                        <div class="mt-5 space-y-2">

                            <div class="info-row">
                                <span>服用回数</span>
                                <strong>${frequency}</strong>
                            </div>

                            ${
                                medication.notes
                                ?
                                `
                                <div class="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                                    ${escapeHtml(medication.notes)}
                                </div>
                                `
                                :
                                ""
                            }

                        </div>

                    </div>
                `;

            }
        ).join("");

}


// ============================================================
// ㉖ お薬削除
// ============================================================

async function deleteMedication(
    medicationId
) {

    if (!medicationId) {
        return;
    }


    const confirmed =
        confirm(
            "このお薬を削除しますか？"
        );


    if (!confirmed) {
        return;
    }


    try {

        showLoading();


        const {
            error
        } = await supabaseClient
            .from("medications")
            .delete()
            .eq("id", medicationId)
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {
            throw error;
        }


        showToast(
            "お薬を削除しました。",
            "success"
        );


        await loadMedications();


    } catch (error) {

        console.error(
            "deleteMedication error:",
            error
        );

        showToast(
            "お薬の削除に失敗しました。",
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ============================================================
// ㉗ ダッシュボード更新
// ============================================================

function updateDashboard() {

    if (!currentUser) {
        return;
    }


    // お薬数
    if ($("dashboard-medication-count")) {

        $("dashboard-medication-count")
            .textContent =
            medications.length;

    }


    // 今日の服薬数
    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const todayLogs =
        medicationLogs.filter(
            log =>
                String(
                    log.taken_at ||
                    log.date ||
                    log.created_at ||
                    ""
                ).startsWith(today)
        );


    if ($("dashboard-taken-count")) {

        $("dashboard-taken-count")
            .textContent =
            todayLogs.length;

    }


    // フレンド数
    if ($("dashboard-friend-count")) {

        $("dashboard-friend-count")
            .textContent =
            friends.length;

    }


    renderDashboardMedications();

    renderDashboardAppointment();

}


// ============================================================
// ㉘ ダッシュボードのお薬
// ============================================================

function renderDashboardMedications() {

    const container =
        $("dashboard-medication-list");


    if (!container) {
        return;
    }


    if (!medications.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-pills"></i>
                <p>登録されているお薬はありません。</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        medications
            .slice(0, 5)
            .map(medication => {

                return `
                    <div class="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0">

                        <div class="flex items-center gap-3">

                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <i class="fa-solid fa-pills"></i>
                            </div>

                            <div>

                                <div class="text-sm font-bold text-slate-800">
                                    ${escapeHtml(
                                        medication.name ||
                                        "名称未設定"
                                    )}
                                </div>

                                <div class="text-xs text-slate-400">
                                    ${escapeHtml(
                                        medication.dosage ||
                                        medication.amount ||
                                        ""
                                    )}
                                </div>

                            </div>

                        </div>

                        <button
                            type="button"
                            class="secondary-button"
                            onclick="openMedicationLogModal('${medication.id}')"
                        >
                            記録
                        </button>

                    </div>
                `;

            })
            .join("");

}


// ============================================================
// ㉙ ダッシュボードの通院予定
// ============================================================

function renderDashboardAppointment() {

    const container =
        $("dashboard-appointment-list") ||
        $("dashboard-appointment");


    if (!container) {
        return;
    }


    if (!appointments.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-days"></i>
                <p>通院予定はありません。</p>
            </div>
        `;

        return;

    }


    const sorted =
        [...appointments]
            .sort(
                (a, b) =>
                    new Date(
                        a.appointment_date ||
                        a.date ||
                        a.scheduled_at ||
                        0
                    ) -
                    new Date(
                        b.appointment_date ||
                        b.date ||
                        b.scheduled_at ||
                        0
                    )
            );


    const appointment =
        sorted[0];


    const date =
        appointment.appointment_date ||
        appointment.date ||
        appointment.scheduled_at;


    if ($("dashboard-next-appointment")) {

        $("dashboard-next-appointment")
            .textContent =
            formatDate(date);

    }


    container.innerHTML = `
        <div class="rounded-2xl bg-slate-50 p-4">

            <div class="flex items-start gap-3">

                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <i class="fa-solid fa-calendar-check"></i>
                </div>

                <div class="min-w-0">

                    <div class="font-bold text-slate-800">
                        ${escapeHtml(
                            appointment.hospital_name ||
                            appointment.hospital ||
                            appointment.facility_name ||
                            "医療機関"
                        )}
                    </div>

                    <div class="mt-1 text-sm text-slate-500">
                        ${formatDate(date)}
                    </div>

                    ${
                        appointment.department
                        ?
                        `
                        <div class="mt-1 text-xs text-slate-400">
                            ${escapeHtml(
                                appointment.department
                            )}
                        </div>
                        `
                        :
                        ""
                    }

                </div>

            </div>

        </div>
    `;

}


// ============================================================
// ㉚ 日付フォーマット
// ============================================================

function formatDate(
    value
) {

    if (!value) {
        return "--";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {

        return escapeHtml(
            String(value)
        );

    }


    return date.toLocaleDateString(
        "ja-JP",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}
// ============================================================
// まいへるす app.js
// 後半
// ============================================================


// ============================================================
// ① 共通ユーティリティ
// ============================================================

function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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


function formatDateTime(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function todayString() {
    const now = new Date();

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}


function showToast(message, type = "success") {

    const container =
        document.getElementById("toast-container");

    if (!container) {
        alert(message);
        return;
    }

    const toast =
        document.createElement("div");

    let icon = "fa-check";
    let color = "bg-emerald-500";

    if (type === "error") {
        icon = "fa-circle-exclamation";
        color = "bg-red-500";
    }

    if (type === "warning") {
        icon = "fa-triangle-exclamation";
        color = "bg-orange-500";
    }

    toast.className =
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg ${color}`;

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}


function setGlobalLoading(show) {

    const loading =
        document.getElementById("global-loading");

    if (!loading) return;

    if (show) {
        loading.classList.remove("hidden");
        loading.classList.add("flex");
    } else {
        loading.classList.add("hidden");
        loading.classList.remove("flex");
    }
}


// ============================================================
// ② モーダル
// ============================================================

function openModal(html) {

    const overlay =
        document.getElementById("modal-overlay");

    const content =
        document.getElementById("modal-content");

    if (!overlay || !content) return;

    content.innerHTML = html;

    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    document.body.classList.add("overflow-hidden");
}


function closeModal() {

    const overlay =
        document.getElementById("modal-overlay");

    const content =
        document.getElementById("modal-content");

    if (!overlay) return;

    overlay.classList.add("hidden");
    overlay.classList.remove("flex");

    if (content) {
        content.innerHTML = "";
    }

    document.body.classList.remove("overflow-hidden");
}


function closeModalOnOverlay(event) {

    if (
        event.target &&
        event.target.id === "modal-overlay"
    ) {
        closeModal();
    }
}


// ============================================================
// ③ お薬登録
// ============================================================

function openMedicationModal() {

    openModal(`
        <div class="p-6">

            <div class="flex items-center justify-between mb-6">

                <div>
                    <h3 class="text-xl font-extrabold text-slate-900">
                        お薬を登録
                    </h3>

                    <p class="mt-1 text-xs text-slate-400">
                        現在使用しているお薬を登録します。
                    </p>
                </div>

                <button
                    type="button"
                    onclick="closeModal()"
                    class="w-10 h-10 rounded-xl hover:bg-slate-100"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <form id="medication-create-form">

                <div class="mb-4">

                    <label class="form-label">
                        お薬の名前
                    </label>

                    <input
                        id="medication-name"
                        type="text"
                        class="input-field"
                        placeholder="例：ロキソニン"
                        required
                    >

                </div>


                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>

                        <label class="form-label">
                            用量
                        </label>

                        <input
                            id="medication-dose"
                            type="text"
                            class="input-field"
                            placeholder="例：60mg"
                        >

                    </div>


                    <div>

                        <label class="form-label">
                            服用回数
                        </label>

                        <input
                            id="medication-frequency"
                            type="text"
                            class="input-field"
                            placeholder="例：1日3回"
                        >

                    </div>

                </div>


                <div class="mt-4">

                    <label class="form-label">
                        服用方法
                    </label>

                    <input
                        id="medication-instruction"
                        type="text"
                        class="input-field"
                        placeholder="例：食後"
                    >

                </div>


                <div class="mt-4">

                    <label class="form-label">
                        開始日
                    </label>

                    <input
                        id="medication-start-date"
                        type="date"
                        class="input-field"
                        value="${todayString()}"
                    >

                </div>


                <div class="mt-4">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="medication-notes"
                        class="input-field"
                        rows="3"
                        placeholder="メモ"
                    ></textarea>

                </div>


                <div class="mt-6 flex justify-end gap-2">

                    <button
                        type="button"
                        class="secondary-button"
                        onclick="closeModal()"
                    >
                        キャンセル
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        <i class="fa-solid fa-floppy-disk"></i>
                        登録する
                    </button>

                </div>

            </form>

        </div>
    `);


    const form =
        document.getElementById("medication-create-form");

    if (!form) return;

    form.addEventListener("submit", async function(event) {

        event.preventDefault();

        if (!currentUser) {
            showToast("ログインしてください。", "error");
            return;
        }

        const name =
            document.getElementById("medication-name").value.trim();

        const dose =
            document.getElementById("medication-dose").value.trim();

        const frequency =
            document.getElementById("medication-frequency").value.trim();

        const instruction =
            document.getElementById("medication-instruction").value.trim();

        const startDate =
            document.getElementById("medication-start-date").value;

        const notes =
            document.getElementById("medication-notes").value.trim();

        if (!name) {
            showToast("お薬の名前を入力してください。", "error");
            return;
        }

        setGlobalLoading(true);

        try {

            const { error } =
                await supabase
                    .from("medications")
                    .insert({
                        user_id: currentUser.id,
                        name: name,
                        dose: dose,
                        frequency: frequency,
                        instruction: instruction,
                        start_date: startDate || null,
                        notes: notes
                    });

            if (error) {
                throw error;
            }

            closeModal();

            showToast("お薬を登録しました。");

            await loadMedications();
            await loadDashboard();

        } catch (error) {

            console.error(error);

            showToast(
                error.message || "お薬の登録に失敗しました。",
                "error"
            );

        } finally {

            setGlobalLoading(false);

        }

    });
}


// ============================================================
// ④ お薬一覧
// ============================================================

async function loadMedications() {

    if (!currentUser) return;

    const container =
        document.getElementById("medications-list");

    if (!container) return;

    try {

        const { data, error } =
            await supabase
                .from("medications")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            container.innerHTML = `
                <div class="content-card sm:col-span-2 xl:col-span-3">
                    <div class="empty-state">
                        <i class="fa-solid fa-pills"></i>
                        <p>登録されているお薬はありません。</p>
                    </div>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.map(medication => {

                return `
                    <div class="content-card">

                        <div class="flex items-start justify-between gap-3">

                            <div class="flex items-center gap-3">

                                <div class="dashboard-icon bg-blue-50 text-blue-600">
                                    <i class="fa-solid fa-pills"></i>
                                </div>

                                <div>

                                    <h3 class="font-extrabold text-slate-900">
                                        ${escapeHtml(medication.name)}
                                    </h3>

                                    ${
                                        medication.dose
                                            ? `<p class="text-xs text-slate-400 mt-1">
                                                ${escapeHtml(medication.dose)}
                                               </p>`
                                            : ""
                                    }

                                </div>

                            </div>

                            <button
                                type="button"
                                class="w-9 h-9 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                                onclick="deleteMedication('${medication.id}')"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>


                        <div class="mt-5 space-y-2 text-sm">

                            ${
                                medication.frequency
                                    ? `
                                    <div class="flex justify-between">
                                        <span class="text-slate-400">
                                            服用回数
                                        </span>
                                        <span class="font-bold text-slate-700">
                                            ${escapeHtml(medication.frequency)}
                                        </span>
                                    </div>
                                    `
                                    : ""
                            }

                            ${
                                medication.instruction
                                    ? `
                                    <div class="flex justify-between">
                                        <span class="text-slate-400">
                                            服用方法
                                        </span>
                                        <span class="font-bold text-slate-700">
                                            ${escapeHtml(medication.instruction)}
                                        </span>
                                    </div>
                                    `
                                    : ""
                            }

                            ${
                                medication.start_date
                                    ? `
                                    <div class="flex justify-between">
                                        <span class="text-slate-400">
                                            開始日
                                        </span>
                                        <span class="font-bold text-slate-700">
                                            ${formatDate(medication.start_date)}
                                        </span>
                                    </div>
                                    `
                                    : ""
                            }

                        </div>


                        ${
                            medication.notes
                                ? `
                                <div class="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                                    ${escapeHtml(medication.notes)}
                                </div>
                                `
                                : ""
                        }

                    </div>
                `;

            }).join("");


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="content-card sm:col-span-2 xl:col-span-3">
                <div class="empty-state">
                    <i class="fa-solid fa-circle-exclamation text-red-400"></i>
                    <p>お薬を読み込めませんでした。</p>
                </div>
            </div>
        `;

    }

}


async function deleteMedication(id) {

    if (!currentUser) return;

    if (!confirm("このお薬を削除しますか？")) {
        return;
    }

    try {

        const { error } =
            await supabase
                .from("medications")
                .delete()
                .eq("id", id)
                .eq("user_id", currentUser.id);

        if (error) {
            throw error;
        }

        showToast("お薬を削除しました。");

        await loadMedications();
        await loadDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            "お薬の削除に失敗しました。",
            "error"
        );

    }

}


// ============================================================
// ⑤ 服薬記録
// ============================================================

async function openMedicationLogModal() {

    if (!currentUser) {
        showToast("ログインしてください。", "error");
        return;
    }

    const { data: medications, error } =
        await supabase
            .from("medications")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("name");

    if (error) {
        console.error(error);
        showToast("お薬を取得できませんでした。", "error");
        return;
    }

    if (!medications || medications.length === 0) {
        showToast("先にお薬を登録してください。", "warning");
        return;
    }

    openModal(`

        <div class="p-6">

            <div class="flex items-center justify-between mb-6">

                <div>
                    <h3 class="text-xl font-extrabold text-slate-900">
                        服薬を記録
                    </h3>

                    <p class="text-xs text-slate-400 mt-1">
                        飲んだお薬を記録します。
                    </p>
                </div>

                <button
                    type="button"
                    onclick="closeModal()"
                    class="w-10 h-10 rounded-xl hover:bg-slate-100"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <form id="medication-log-form">

                <div class="mb-4">

                    <label class="form-label">
                        お薬
                    </label>

                    <select
                        id="log-medication-id"
                        class="input-field"
                        required
                    >

                        <option value="">
                            選択してください
                        </option>

                        ${
                            medications.map(med => `
                                <option value="${med.id}">
                                    ${escapeHtml(med.name)}
                                    ${med.dose ? ` (${escapeHtml(med.dose)})` : ""}
                                </option>
                            `).join("")
                        }

                    </select>

                </div>


                <div class="mb-4">

                    <label class="form-label">
                        服薬日時
                    </label>

                    <input
                        id="log-taken-at"
                        type="datetime-local"
                        class="input-field"
                        required
                    >

                </div>


                <div class="mb-4">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="log-notes"
                        class="input-field"
                        rows="3"
                        placeholder="体調など"
                    ></textarea>

                </div>


                <div class="flex justify-end gap-2">

                    <button
                        type="button"
                        class="secondary-button"
                        onclick="closeModal()"
                    >
                        キャンセル
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        <i class="fa-solid fa-check"></i>
                        記録する
                    </button>

                </div>

            </form>

        </div>
    `);


    const now = new Date();

    const localDateTime =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() * 60000
        )
        .toISOString()
        .slice(0, 16);

    const dateInput =
        document.getElementById("log-taken-at");

    if (dateInput) {
        dateInput.value = localDateTime;
    }


    const form =
        document.getElementById("medication-log-form");

    if (!form) return;

    form.addEventListener("submit", async function(event) {

        event.preventDefault();

        const medicationId =
            document.getElementById("log-medication-id").value;

        const takenAt =
            document.getElementById("log-taken-at").value;

        const notes =
            document.getElementById("log-notes").value.trim();

        if (!medicationId || !takenAt) {
            showToast("必要項目を入力してください。", "error");
            return;
        }

        setGlobalLoading(true);

        try {

            const { error } =
                await supabase
                    .from("medication_logs")
                    .insert({
                        user_id: currentUser.id,
                        medication_id: medicationId,
                        taken_at: new Date(takenAt).toISOString(),
                        notes: notes
                    });

            if (error) {
                throw error;
            }

            closeModal();

            showToast("服薬を記録しました。");

            await loadMedicationLogs();
            await loadDashboard();

        } catch (error) {

            console.error(error);

            showToast(
                error.message || "服薬記録に失敗しました。",
                "error"
            );

        } finally {

            setGlobalLoading(false);

        }

    });

}


async function loadMedicationLogs() {

    if (!currentUser) return;

    const container =
        document.getElementById("medication-logs-list");

    if (!container) return;

    try {

        const { data, error } =
            await supabase
                .from("medication_logs")
                .select(`
                    *,
                    medications (
                        name,
                        dose
                    )
                `)
                .eq("user_id", currentUser.id)
                .order("taken_at", {
                    ascending: false
                });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-check-double"></i>
                    <p>服薬記録はありません。</p>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.map(log => {

                const medicationName =
                    log.medications?.name ||
                    "お薬";

                return `
                    <div class="flex items-center justify-between gap-4 py-4">

                        <div class="flex items-center gap-3">

                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <i class="fa-solid fa-check"></i>
                            </div>

                            <div>

                                <div class="font-bold text-slate-800">
                                    ${escapeHtml(medicationName)}
                                </div>

                                <div class="text-xs text-slate-400">
                                    ${formatDateTime(log.taken_at)}
                                </div>

                            </div>

                        </div>

                        ${
                            log.notes
                                ? `
                                <div class="max-w-xs text-right text-xs text-slate-400">
                                    ${escapeHtml(log.notes)}
                                </div>
                                `
                                : ""
                        }

                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>服薬記録を読み込めませんでした。</p>
            </div>
        `;

    }

}


// ============================================================
// ⑥ 健康記録
// ============================================================

function openHealthRecordModal() {

    openModal(`
        <div class="p-6">

            <div class="flex items-center justify-between mb-6">

                <div>
                    <h3 class="text-xl font-extrabold">
                        健康記録
                    </h3>

                    <p class="text-xs text-slate-400 mt-1">
                        今日の体調を記録します。
                    </p>
                </div>

                <button
                    onclick="closeModal()"
                    class="w-10 h-10 rounded-xl hover:bg-slate-100"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <form id="health-record-form">

                <div class="mb-4">

                    <label class="form-label">
                        記録日
                    </label>

                    <input
                        id="health-record-date"
                        type="date"
                        class="input-field"
                        value="${todayString()}"
                        required
                    >

                </div>


                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>

                        <label class="form-label">
                            体調
                        </label>

                        <select
                            id="health-condition"
                            class="input-field"
                        >
                            <option value="">未設定</option>
                            <option value="good">良い</option>
                            <option value="normal">普通</option>
                            <option value="bad">悪い</option>
                            <option value="very_bad">とても悪い</option>
                        </select>

                    </div>


                    <div>

                        <label class="form-label">
                            気分
                        </label>

                        <select
                            id="health-mood"
                            class="input-field"
                        >
                            <option value="">未設定</option>
                            <option value="good">良い</option>
                            <option value="normal">普通</option>
                            <option value="bad">悪い</option>
                        </select>

                    </div>

                </div>


                <div class="mt-4">

                    <label class="form-label">
                        症状・メモ
                    </label>

                    <textarea
                        id="health-notes"
                        class="input-field"
                        rows="5"
                        placeholder="今日の体調や症状を入力してください"
                    ></textarea>

                </div>


                <div class="mt-6 flex justify-end gap-2">

                    <button
                        type="button"
                        class="secondary-button"
                        onclick="closeModal()"
                    >
                        キャンセル
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        保存
                    </button>

                </div>

            </form>

        </div>
    `);


    const form =
        document.getElementById("health-record-form");

    if (!form) return;

    form.addEventListener("submit", async function(event) {

        event.preventDefault();

        const recordDate =
            document.getElementById("health-record-date").value;

        const condition =
            document.getElementById("health-condition").value;

        const mood =
            document.getElementById("health-mood").value;

        const notes =
            document.getElementById("health-notes").value.trim();

        setGlobalLoading(true);

        try {

            const { error } =
                await supabase
                    .from("health_records")
                    .upsert({
                        user_id: currentUser.id,
                        record_date: recordDate,
                        condition: condition,
                        mood: mood,
                        notes: notes
                    }, {
                        onConflict: "user_id,record_date"
                    });

            if (error) {
                throw error;
            }

            closeModal();

            showToast("健康記録を保存しました。");

            await loadHealthRecords();

        } catch (error) {

            console.error(error);

            showToast(
                error.message || "健康記録の保存に失敗しました。",
                "error"
            );

        } finally {

            setGlobalLoading(false);

        }

    });

}


async function loadHealthRecords() {

    if (!currentUser) return;

    const container =
        document.getElementById("health-records-list");

    if (!container) return;

    try {

        const { data, error } =
            await supabase
                .from("health_records")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("record_date", {
                    ascending: false
                })
                .limit(30);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            container.innerHTML = `
                <div class="content-card lg:col-span-2">
                    <div class="empty-state">
                        <i class="fa-solid fa-heart-pulse"></i>
                        <p>健康記録はありません。</p>
                    </div>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.map(record => `

                <div class="content-card">

                    <div class="flex items-center justify-between mb-4">

                        <div class="font-extrabold text-slate-900">
                            ${formatDate(record.record_date)}
                        </div>

                        <i class="fa-solid fa-heart-pulse text-blue-500"></i>

                    </div>

                    ${
                        record.condition
                            ? `
                            <div class="text-sm mb-2">
                                <span class="text-slate-400">
                                    体調：
                                </span>
                                <span class="font-bold">
                                    ${escapeHtml(record.condition)}
                                </span>
                            </div>
                            `
                            : ""
                    }

                    ${
                        record.mood
                            ? `
                            <div class="text-sm mb-2">
                                <span class="text-slate-400">
                                    気分：
                                </span>
                                <span class="font-bold">
                                    ${escapeHtml(record.mood)}
                                </span>
                            </div>
                            `
                            : ""
                    }

                    ${
                        record.notes
                            ? `
                            <div class="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                                ${escapeHtml(record.notes)}
                            </div>
                            `
                            : ""
                    }

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

    }

}


// ============================================================
// ⑦ 予定
// ============================================================

function openAppointmentModal() {

    openModal(`
        <div class="p-6">

            <div class="flex items-center justify-between mb-6">

                <h3 class="text-xl font-extrabold">
                    通院予定を追加
                </h3>

                <button
                    onclick="closeModal()"
                    class="w-10 h-10 rounded-xl hover:bg-slate-100"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <form id="appointment-form">

                <div class="mb-4">

                    <label class="form-label">
                        医療機関
                    </label>

                    <input
                        id="appointment-hospital"
                        class="input-field"
                        placeholder="例：○○病院"
                        required
                    >

                </div>


                <div class="mb-4">

                    <label class="form-label">
                        診療科
                    </label>

                    <input
                        id="appointment-department"
                        class="input-field"
                        placeholder="例：脳神経内科"
                    >

                </div>


                <div class="grid grid-cols-2 gap-4">

                    <div>

                        <label class="form-label">
                            日付
                        </label>

                        <input
                            id="appointment-date"
                            type="date"
                            class="input-field"
                            required
                        >

                    </div>

                    <div>

                        <label class="form-label">
                            時刻
                        </label>

                        <input
                            id="appointment-time"
                            type="time"
                            class="input-field"
                        >

                    </div>

                </div>


                <div class="mt-4">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="appointment-notes"
                        class="input-field"
                        rows="3"
                    ></textarea>

                </div>


                <div class="mt-6 flex justify-end gap-2">

                    <button
                        type="button"
                        class="secondary-button"
                        onclick="closeModal()"
                    >
                        キャンセル
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        登録する
                    </button>

                </div>

            </form>

        </div>
    `);


    const form =
        document.getElementById("appointment-form");

    if (!form) return;

    form.addEventListener("submit", async function(event) {

        event.preventDefault();

        try {

            const { error } =
                await supabase
                    .from("appointments")
                    .insert({
                        user_id: currentUser.id,
                        hospital_name:
                            document.getElementById("appointment-hospital").value.trim(),
                        department:
                            document.getElementById("appointment-department").value.trim(),
                        appointment_date:
                            document.getElementById("appointment-date").value,
                        appointment_time:
                            document.getElementById("appointment-time").value || null,
                        notes:
                            document.getElementById("appointment-notes").value.trim()
                    });

            if (error) throw error;

            closeModal();

            showToast("通院予定を登録しました。");

            await loadAppointments();
            await loadDashboard();

        } catch (error) {

            console.error(error);

            showToast(
                error.message || "予定の登録に失敗しました。",
                "error"
            );

        }

    });

}


async function loadAppointments() {

    if (!currentUser) return;

    const container =
        document.getElementById("appointments-list");

    if (!container) return;

    try {

        const { data, error } =
            await supabase
                .from("appointments")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("appointment_date", {
                    ascending: true
                });

        if (error) throw error;

        if (!data || data.length === 0) {

            container.innerHTML = `
                <div class="content-card">
                    <div class="empty-state">
                        <i class="fa-solid fa-calendar-days"></i>
                        <p>通院予定はありません。</p>
                    </div>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.map(item => `

                <div class="content-card">

                    <div class="flex items-start justify-between">

                        <div>

                            <h3 class="font-extrabold text-slate-900">
                                ${escapeHtml(item.hospital_name || "医療機関")}
                            </h3>

                            ${
                                item.department
                                    ? `
                                    <p class="text-xs text-slate-400 mt-1">
                                        ${escapeHtml(item.department)}
                                    </p>
                                    `
                                    : ""
                            }

                        </div>

                        <i class="fa-solid fa-calendar-check text-blue-500"></i>

                    </div>


                    <div class="mt-4 text-sm">

                        <span class="font-bold">
                            ${formatDate(item.appointment_date)}
                        </span>

                        ${
                            item.appointment_time
                                ? `
                                <span class="ml-2 text-slate-500">
                                    ${escapeHtml(item.appointment_time)}
                                </span>
                                `
                                : ""
                        }

                    </div>


                    ${
                        item.notes
                            ? `
                            <div class="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                                ${escapeHtml(item.notes)}
                            </div>
                            `
                            : ""
                    }

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

    }

}


// ============================================================
// ⑧ リマインダー
// ============================================================

function openReminderModal() {

    showToast(
        "リマインダー機能はデータベース設定後に利用できます。",
        "warning"
    );

}


// ============================================================
// ⑨ 診断・病歴
// ============================================================

function openDiagnosisModal() {

    openModal(`
        <div class="p-6">

            <div class="flex items-center justify-between mb-6">

                <h3 class="text-xl font-extrabold">
                    診断・病歴を追加
                </h3>

                <button
                    onclick="closeModal()"
                    class="w-10 h-10 rounded-xl hover:bg-slate-100"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <form id="diagnosis-form">

                <div class="mb-4">

                    <label class="form-label">
                        病名・診断名
                    </label>

                    <input
                        id="diagnosis-name"
                        class="input-field"
                        required
                    >

                </div>


                <div class="mb-4">

                    <label class="form-label">
                        診断日
                    </label>

                    <input
                        id="diagnosis-date"
                        type="date"
                        class="input-field"
                    >

                </div>


                <div class="mb-4">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="diagnosis-notes"
                        class="input-field"
                        rows="4"
                    ></textarea>

                </div>


                <div class="flex justify-end">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        保存
                    </button>

                </div>

            </form>

        </div>
    `);


    document
        .getElementById("diagnosis-form")
        ?.addEventListener("submit", async function(event) {

            event.preventDefault();

            try {

                const { error } =
                    await supabase
                        .from("diagnoses")
                        .insert({
                            user_id: currentUser.id,
                            diagnosis_name:
                                document.getElementById("diagnosis-name").value.trim(),
                            diagnosis_date:
                                document.getElementById("diagnosis-date").value || null,
                            notes:
                                document.getElementById("diagnosis-notes").value.trim()
                        });

                if (error) throw error;

                closeModal();

                showToast("診断を登録しました。");

                await loadDiagnoses();

            } catch (error) {

                console.error(error);

                showToast(
                    error.message || "登録に失敗しました。",
                    "error"
                );

            }

        });

}


async function loadDiagnoses() {

    const container =
        document.getElementById("diagnoses-list");

    if (!container || !currentUser) return;

    try {

        const { data, error } =
            await supabase
                .from("diagnoses")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("diagnosis_date", {
                    ascending: false
                });

        if (error) throw error;

        if (!data?.length) {

            container.innerHTML = `
                <div class="content-card md:col-span-2">
                    <div class="empty-state">
                        <i class="fa-solid fa-stethoscope"></i>
                        <p>診断・病歴はありません。</p>
                    </div>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.map(item => `

                <div class="content-card">

                    <div class="flex items-center gap-3">

                        <div class="dashboard-icon bg-purple-50 text-purple-600">
                            <i class="fa-solid fa-stethoscope"></i>
                        </div>

                        <div>

                            <h3 class="font-extrabold">
                                ${escapeHtml(item.diagnosis_name)}
                            </h3>

                            ${
                                item.diagnosis_date
                                    ? `
                                    <p class="text-xs text-slate-400">
                                        ${formatDate(item.diagnosis_date)}
                                    </p>
                                    `
                                    : ""
                            }

                        </div>

                    </div>


                    ${
                        item.notes
                            ? `
                            <p class="mt-4 text-sm text-slate-600">
                                ${escapeHtml(item.notes)}
                            </p>
                            `
                            : ""
                    }

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

    }

}


// ============================================================
// ⑩ アレルギー
// ============================================================

function openAllergyModal() {

    openModal(`
        <div class="p-6">

            <div class="flex items-center justify-between mb-6">

                <h3 class="text-xl font-extrabold">
                    アレルギーを追加
                </h3>

                <button
                    onclick="closeModal()"
                    class="w-10 h-10 rounded-xl hover:bg-slate-100"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>


            <form id="allergy-form">

                <label class="form-label">
                    アレルギー名
                </label>

                <input
                    id="allergy-name"
                    class="input-field mb-4"
                    placeholder="例：ペニシリン"
                    required
                >


                <label class="form-label">
                    種類
                </label>

                <select
                    id="allergy-type"
                    class="input-field mb-4"
                >
                    <option value="drug">薬剤</option>
                    <option value="food">食物</option>
                    <option value="other">その他</option>
                </select>


                <label class="form-label">
                    メモ
                </label>

                <textarea
                    id="allergy-notes"
                    class="input-field mb-5"
                ></textarea>


                <div class="flex justify-end">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        保存
                    </button>

                </div>

            </form>

        </div>
    `);


    document
        .getElementById("allergy-form")
        ?.addEventListener("submit", async function(event) {

            event.preventDefault();

            try {

                const { error } =
                    await supabase
                        .from("allergies")
                        .insert({
                            user_id: currentUser.id,
                            name:
                                document.getElementById("allergy-name").value.trim(),
                            type:
                                document.getElementById("allergy-type").value,
                            notes:
                                document.getElementById("allergy-notes").value.trim()
                        });

                if (error) throw error;

                closeModal();

                showToast("アレルギー情報を保存しました。");

                await loadAllergies();

            } catch (error) {

                console.error(error);

                showToast(
                    error.message || "保存に失敗しました。",
                    "error"
                );

            }

        });

}


async function loadAllergies() {

    const container =
        document.getElementById("allergies-list");

    if (!container || !currentUser) return;

    try {

        const { data, error } =
            await supabase
                .from("allergies")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("created_at", {
                    ascending: false
                });

        if (error) throw error;

        if (!data?.length) {

            container.innerHTML = `
                <div class="content-card md:col-span-2">
                    <div class="empty-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>アレルギー情報はありません。</p>
                    </div>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.map(item => `

                <div class="content-card">

                    <div class="flex items-center gap-3">

                        <div class="dashboard-icon bg-red-50 text-red-500">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>

                        <div>

                            <h3 class="font-extrabold">
                                ${escapeHtml(item.name)}
                            </h3>

                            <p class="text-xs text-slate-400">
                                ${escapeHtml(item.type || "")}
                            </p>

                        </div>

                    </div>


                    ${
                        item.notes
                            ? `
                            <div class="mt-4 text-sm text-slate-600">
                                ${escapeHtml(item.notes)}
                            </div>
                            `
                            : ""
                    }

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

    }

}


// ============================================================
// ⑪ 診察記録
// ============================================================

function openVisitModal() {

    showToast(
        "診察記録フォームを準備中です。",
        "warning"
    );

}


// ============================================================
// ⑫ 友達検索
// ============================================================

async function searchFriends() {

    if (!currentUser) {
        showToast("ログインしてください。", "error");
        return;
    }

    const input =
        document.getElementById("friend-search-input");

    const results =
        document.getElementById("friend-search-results");

    if (!input || !results) return;

    const keyword =
        input.value.trim();

    if (!keyword) {

        results.innerHTML = "";

        return;
    }

    try {

        const { data, error } =
            await supabase
                .from("profiles")
                .select("*")
                .ilike("username", `%${keyword}%`)
                .neq("id", currentUser.id)
                .limit(20);

        if (error) throw error;

        if (!data?.length) {

            results.innerHTML = `
                <div class="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    ユーザーが見つかりませんでした。
                </div>
            `;

            return;
        }

        results.innerHTML =
            data.map(user => `

                <div class="flex items-center justify-between gap-3 border-b border-slate-100 py-3">

                    <div class="flex items-center gap-3">

                        <div class="friend-avatar">
                            ${
                                escapeHtml(
                                    (user.username || "?")
                                    .charAt(0)
                                    .toUpperCase()
                                )
                            }
                        </div>

                        <div>

                            <div class="font-bold text-slate-800">
                                ${escapeHtml(user.username || "ユーザー")}
                            </div>

                            ${
                                user.display_name
                                    ? `
                                    <div class="text-xs text-slate-400">
                                        ${escapeHtml(user.display_name)}
                                    </div>
                                    `
                                    : ""
                            }

                        </div>

                    </div>


                    <button
                        class="primary-button"
                        onclick="sendFriendRequest('${user.id}')"
                    >
                        <i class="fa-solid fa-user-plus"></i>
                        申請
                    </button>

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

        showToast(
            "ユーザー検索に失敗しました。",
            "error"
        );

    }

}


async function sendFriendRequest(receiverId) {

    if (!currentUser) return;

    try {

        const { data: existing, error: checkError } =
            await supabase
                .from("friend_requests")
                .select("id,status")
                .eq("sender_id", currentUser.id)
                .eq("receiver_id", receiverId)
                .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {

            showToast(
                "すでに友達申請を送っています。",
                "warning"
            );

            return;
        }


        const { error } =
            await supabase
                .from("friend_requests")
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: receiverId,
                    status: "pending"
                });

        if (error) throw error;

        showToast("友達申請を送りました。");

    } catch (error) {

        console.error(error);

        showToast(
            error.message || "友達申請に失敗しました。",
            "error"
        );

    }

}


// ============================================================
// ⑬ ログアウト
// ============================================================

async function handleLogout() {

    try {

        const { error } =
            await supabase.auth.signOut();

        if (error) throw error;

        currentUser = null;

        closeModal();

        showToast("ログアウトしました。");

    } catch (error) {

        console.error(error);

        showToast(
            "ログアウトに失敗しました。",
            "error"
        );

    }

}


// 既存HTMLの logout-button にも対応
document
    .getElementById("logout-button")
    ?.addEventListener("click", handleLogout);


// ============================================================
// ⑭ ページ初期化後のデータ読み込み
// ============================================================

async function loadAllApplicationData() {

    if (!currentUser) return;

    try {

        await Promise.allSettled([

            loadMedications(),

            loadMedicationLogs(),

            loadHealthRecords(),

            loadAppointments(),

            loadDiagnoses(),

            loadAllergies(),

            loadDashboard(),

            loadFriends(),

            loadFriendRequests(),

            loadNotifications(),

            loadMessages()

        ]);

    } catch (error) {

        console.error(
            "アプリデータ読み込みエラー:",
            error
        );

    }

}


// ============================================================
// ⑮ 画面切り替え時の追加読み込み
// ============================================================

const originalShowView =
    window.showView;


window.showView = async function(viewName) {

    if (typeof originalShowView === "function") {

        originalShowView(viewName);

    } else {

        document
            .querySelectorAll(".view-section")
            .forEach(section => {
                section.classList.add("hidden");
            });

        const target =
            document.getElementById(
                `view-${viewName}`
            );

        if (target) {
            target.classList.remove("hidden");
        }

    }


    switch (viewName) {

        case "medications":
            await loadMedications();
            break;

        case "medication-logs":
            await loadMedicationLogs();
            break;

        case "health":
            await loadHealthRecords();
            break;

        case "appointments":
            await loadAppointments();
            break;

        case "diagnoses":
            await loadDiagnoses();
            break;

        case "allergies":
            await loadAllergies();
            break;

        case "friends":
            await loadFriends();
            await loadFriendRequests();
            break;

        case "messages":
            await loadMessages();
            break;

        case "notifications":
            await loadNotifications();
            break;

        default:
            break;

    }

};


// ============================================================
// ⑯ 初期認証状態確認
// ============================================================

async function initializeMyHealthApp() {

    try {

        const {
            data: {
                session
            }
        } =
            await supabase.auth.getSession();


        if (session?.user) {

            currentUser =
                session.user;

            if (typeof showMainApp === "function") {

                showMainApp();

            } else {

                document
                    .getElementById("app")
                    ?.classList.remove("hidden");

                document
                    .getElementById("auth-screen")
                    ?.classList.add("hidden");

            }

            await loadAllApplicationData();

        } else {

            if (typeof showAuthScreen === "function") {

                showAuthScreen();

            } else {

                document
                    .getElementById("app")
                    ?.classList.add("hidden");

                document
                    .getElementById("auth-screen")
                    ?.classList.remove("hidden");

            }

        }

    } catch (error) {

        console.error(
            "初期化エラー:",
            error
        );

        showToast(
            "アプリの読み込みに失敗しました。",
            "error"
        );

    } finally {

        const loading =
            document.getElementById("app-loading");

        if (loading) {

            loading.classList.add("hidden");

        }

    }

}


// ============================================================
// ⑰ Supabase Auth 状態監視
// ============================================================

supabase.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth event:",
            event
        );


        if (session?.user) {

            currentUser =
                session.user;

            if (
                event === "SIGNED_IN" ||
                event === "INITIAL_SESSION"
            ) {

                if (
                    typeof showMainApp ===
                    "function"
                ) {
                    showMainApp();
                }

                await loadAllApplicationData();

            }

        } else {

            currentUser = null;

            if (
                typeof showAuthScreen ===
                "function"
            ) {
                showAuthScreen();
            }

        }

    }
);


// ============================================================
// ⑱ DOM Ready
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "まいへるすを初期化しています..."
        );

        await initializeMyHealthApp();

    }
);


// ============================================================
// ⑲ キーボード操作
// ============================================================

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            const overlay =
                document.getElementById(
                    "modal-overlay"
                );

            if (
                overlay &&
                !overlay.classList.contains("hidden")
            ) {

                closeModal();

            }

        }

    }
);


// ============================================================
// END
// ============================================================

console.log(
    "まいへるす app.js 後半 読み込み完了"
);
