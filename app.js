// ==================================================
// まいへるす
// app.js 完成版
// ==================================================

// ==================================================
// ① Supabase設定
// ==================================================

const SUPABASE_URL =
    "https://ufmcloqjcolpvzhnobgg.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_mxebX3u8pw2XfPGwtzQmyg_aB2fUSWy";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ==================================================
// ② グローバル変数
// ==================================================

let currentUser = null;
let currentProfile = null;

let currentView = "dashboard";

let currentChatFriend = null;

let medications = [];
let medicationLogs = [];
let friends = [];
let friendRequests = [];


// ==================================================
// ③ 画面情報
// ==================================================

const viewInfo = {

    dashboard: {
        title: "ダッシュボード",
        subtitle: "今日の健康状態を確認しましょう"
    },

    medications: {
        title: "お薬",
        subtitle: "現在登録されているお薬を管理します"
    },

    "medication-logs": {
        title: "服薬記録",
        subtitle: "服用したお薬を記録・確認できます"
    },

    health: {
        title: "健康記録",
        subtitle: "日々の体調や生活状態を記録します"
    },

    diagnoses: {
        title: "診断・病歴",
        subtitle: "診断された病気や病歴を管理します"
    },

    visits: {
        title: "診察記録",
        subtitle: "病院・クリニックでの診察記録を管理します"
    },

    appointments: {
        title: "通院予定",
        subtitle: "病院・クリニックの予定を管理します"
    },

    allergies: {
        title: "アレルギー",
        subtitle: "薬・食物などのアレルギー情報を管理します"
    },

    friends: {
        title: "友達",
        subtitle: "友達と健康情報を共有できます"
    },

    messages: {
        title: "メッセージ",
        subtitle: "友達と直接メッセージをやり取りできます"
    },

    notifications: {
        title: "通知",
        subtitle: "友達申請や共有などのお知らせを確認できます"
    },

    settings: {
        title: "設定",
        subtitle: "プロフィールやアプリの設定を管理します"
    }

};


// ==================================================
// ④ DOM読み込み
// ==================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("まいへるすを起動しています...");

    setupAuthEvents();
    setupLogoutEvents();

    await initializeApp();

});


// ==================================================
// ⑤ アプリ初期化
// ==================================================

async function initializeApp() {

    try {

        showLoading();

        const {
            data: {
                session
            },
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error(
                "セッション取得エラー:",
                error
            );
        }

        if (session && session.user) {

            currentUser = session.user;

            await loadUserProfile();

            showApp();

            await loadInitialData();

        } else {

            showAuth();

        }

    } catch (error) {

        console.error(
            "アプリ初期化エラー:",
            error
        );

        showAuth();

    } finally {

        hideLoading();

    }

}


// ==================================================
// ⑥ Supabase Auth状態監視
// ==================================================

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth event:",
            event
        );

        if (session && session.user) {

            currentUser = session.user;

            if (
                event === "SIGNED_IN" ||
                event === "INITIAL_SESSION"
            ) {

                await loadUserProfile();

                showApp();

                await loadInitialData();

            }

        } else {

            currentUser = null;
            currentProfile = null;

            showAuth();

        }

    }
);


// ==================================================
// ⑦ 認証画面イベント
// ==================================================

function setupAuthEvents() {

    const loginForm =
        document.getElementById(
            "login-form-element"
        );

    const registerForm =
        document.getElementById(
            "register-form-element"
        );

    const showRegisterButton =
        document.getElementById(
            "show-register-button"
        );

    const showLoginButton =
        document.getElementById(
            "show-login-button"
        );


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

                document
                    .getElementById("login-form")
                    ?.classList.add("hidden");

                document
                    .getElementById("register-form")
                    ?.classList.remove("hidden");

            }
        );

    }


    if (showLoginButton) {

        showLoginButton.addEventListener(
            "click",
            () => {

                document
                    .getElementById("register-form")
                    ?.classList.add("hidden");

                document
                    .getElementById("login-form")
                    ?.classList.remove("hidden");

            }
        );

    }

}


// ==================================================
// ⑧ ログイン
// ==================================================

async function handleLogin(event) {

    event.preventDefault();

    const email =
        document
            .getElementById("login-email")
            ?.value
            .trim();

    const password =
        document
            .getElementById("login-password")
            ?.value;


    if (!email || !password) {

        showToast(
            "メールアドレスとパスワードを入力してください。",
            "error"
        );

        return;

    }


    try {

        showLoading();

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) {

            console.error(
                "ログインエラー:",
                error
            );

            showToast(
                getAuthErrorMessage(error),
                "error"
            );

            return;

        }


        currentUser =
            data.user;


        await loadUserProfile();

        showApp();

        await loadInitialData();

        showToast(
            "ログインしました。",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "ログイン中にエラーが発生しました。",
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ==================================================
// ⑨ 会員登録
// ==================================================

async function handleRegister(event) {

    event.preventDefault();


    const username =
        document
            .getElementById("register-username")
            ?.value
            .trim();

    const email =
        document
            .getElementById("register-email")
            ?.value
            .trim();

    const password =
        document
            .getElementById("register-password")
            ?.value;

    const passwordConfirm =
        document
            .getElementById(
                "register-password-confirm"
            )
            ?.value;


    if (
        !username ||
        !email ||
        !password ||
        !passwordConfirm
    ) {

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


    try {

        showLoading();


        // ------------------------------------------
        // ユーザーネーム重複確認
        // ------------------------------------------

        const {
            data: existingProfile,
            error: profileCheckError
        } =
            await supabaseClient
                .from("profiles")
                .select("id")
                .eq("username", username)
                .maybeSingle();


        if (profileCheckError) {

            console.error(
                "ユーザーネーム確認エラー:",
                profileCheckError
            );

        }


        if (existingProfile) {

            showToast(
                "そのユーザーネームはすでに使用されています。",
                "error"
            );

            return;

        }


        // ------------------------------------------
        // Supabase Auth登録
        // ------------------------------------------

        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({
                email,
                password
            });


        if (error) {

            console.error(
                "会員登録エラー:",
                error
            );

            showToast(
                getAuthErrorMessage(error),
                "error"
            );

            return;

        }


        // ------------------------------------------
        // セッションが取得できた場合
        // ------------------------------------------

        if (data.user) {

            currentUser =
                data.user;


            // --------------------------------------
            // profiles作成
            // --------------------------------------

            const {
                error: insertProfileError
            } =
                await supabaseClient
                    .from("profiles")
                    .upsert(
                        {
                            id: data.user.id,
                            username: username
                        },
                        {
                            onConflict: "id"
                        }
                    );


            if (insertProfileError) {

                console.error(
                    "プロフィール作成エラー:",
                    insertProfileError
                );

                showToast(
                    "アカウントは作成されましたが、プロフィールの保存に失敗しました。",
                    "error"
                );

                return;

            }

        }


        // ------------------------------------------
        // メール確認が必要な場合
        // ------------------------------------------

        if (!data.session) {

            showToast(
                "会員登録が完了しました。確認メールが届いている場合は、メールを確認してからログインしてください。",
                "success"
            );


            document
                .getElementById("register-form")
                ?.classList.add("hidden");

            document
                .getElementById("login-form")
                ?.classList.remove("hidden");


            const loginEmail =
                document.getElementById(
                    "login-email"
                );

            if (loginEmail) {

                loginEmail.value =
                    email;

            }

        } else {

            await loadUserProfile();

            showApp();

            await loadInitialData();

            showToast(
                "会員登録が完了しました。",
                "success"
            );

        }


    } catch (error) {

        console.error(
            "登録エラー:",
            error
        );

        showToast(
            "会員登録中にエラーが発生しました。",
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ==================================================
// ⑩ Authエラーメッセージ
// ==================================================

function getAuthErrorMessage(error) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    if (
        message.includes("invalid login credentials")
    ) {

        return "メールアドレスまたはパスワードが正しくありません。";

    }


    if (
        message.includes("email not confirmed")
    ) {

        return "メールアドレスの確認が完了していません。確認メールをご確認ください。";

    }


    if (
        message.includes("user already registered")
    ) {

        return "このメールアドレスはすでに登録されています。";

    }


    if (
        message.includes("password should be at least")
    ) {

        return "パスワードが短すぎます。";

    }


    if (
        message.includes("rate limit")
    ) {

        return "メール送信回数の上限に達しています。しばらく時間をおいてください。";

    }


    return (
        error?.message ||
        "認証処理中にエラーが発生しました。"
    );

}


// ==================================================
// ⑪ ユーザープロフィール読み込み
// ==================================================

async function loadUserProfile() {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .maybeSingle();


        if (error) {

            console.error(
                "プロフィール取得エラー:",
                error
            );

            return;

        }


        currentProfile =
            data || null;


        updateUserUI();

    } catch (error) {

        console.error(
            "プロフィール読み込みエラー:",
            error
        );

    }

}


// ==================================================
// ⑫ ユーザーUI更新
// ==================================================

function updateUserUI() {

    if (!currentUser) {
        return;
    }


    const username =
        currentProfile?.username ||
        "ユーザー";


    const email =
        currentUser.email ||
        "-";


    // Sidebar

    setText(
        "sidebar-username",
        username
    );

    setText(
        "sidebar-email",
        email
    );


    // Header

    setText(
        "header-username",
        username
    );


    setAvatar(
        "header-avatar",
        username
    );


    setAvatar(
        "sidebar-avatar",
        username
    );


    setAvatar(
        "settings-avatar",
        username
    );


    // Settings

    setText(
        "settings-email",
        email
    );

    setText(
        "account-email",
        email
    );


    const profileUsername =
        document.getElementById(
            "profile-username"
        );

    if (profileUsername) {

        profileUsername.value =
            currentProfile?.username || "";

    }


    const displayName =
        document.getElementById(
            "profile-display-name"
        );

    if (displayName) {

        displayName.value =
            currentProfile?.display_name || "";

    }


    const gender =
        document.getElementById(
            "profile-gender"
        );

    if (gender) {

        gender.value =
            currentProfile?.gender || "";

    }


    const age =
        document.getElementById(
            "profile-age"
        );

    if (age) {

        age.value =
            currentProfile?.age ?? "";

    }


    const height =
        document.getElementById(
            "profile-height"
        );

    if (height) {

        height.value =
            currentProfile?.height ?? "";

    }


    const weight =
        document.getElementById(
            "profile-weight"
        );

    if (weight) {

        weight.value =
            currentProfile?.weight ?? "";

    }

}


// ==================================================
// ⑬ 初期データ読み込み
// ==================================================

async function loadInitialData() {

    if (!currentUser) {
        return;
    }


    try {

        await Promise.all([

            loadMedications(),

            loadMedicationLogs(),

            loadFriends(),

            loadFriendRequests(),

            loadAppointments(),

            loadNotifications(),

            loadHealthRecords()

        ]);


        updateDashboard();

    } catch (error) {

        console.error(
            "初期データ読み込みエラー:",
            error
        );

    }

}


// ==================================================
// ⑭ アプリ表示
// ==================================================

function showApp() {

    document
        .getElementById("auth-screen")
        ?.classList.add("hidden");


    document
        .getElementById("app")
        ?.classList.remove("hidden");


    document
        .getElementById("app-container")
        ?.classList.remove("hidden");


    showView(
        currentView || "dashboard"
    );

}


// ==================================================
// ⑮ 認証画面表示
// ==================================================

function showAuth() {

    document
        .getElementById("app")
        ?.classList.add("hidden");


    document
        .getElementById("app-container")
        ?.classList.add("hidden");


    document
        .getElementById("auth-screen")
        ?.classList.remove("hidden");

}


// ==================================================
// ⑯ 画面切り替え
// ==================================================

function showView(viewName) {

    const target =
        document.getElementById(
            `view-${viewName}`
        );


    if (!target) {

        console.warn(
            `view-${viewName} が見つかりません`
        );

        return;

    }


    currentView =
        viewName;


    // 全Viewを非表示

    document
        .querySelectorAll(".view-section")
        .forEach(section => {

            section.classList.add("hidden");

        });


    // 対象Viewを表示

    target.classList.remove("hidden");


    // ナビゲーション状態

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

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

        });


    // タイトル

    const info =
        viewInfo[viewName];


    if (info) {

        setText(
            "page-title",
            info.title
        );

        setText(
            "page-subtitle",
            info.subtitle
        );

    }


    // モバイルメニューを閉じる

    closeMobileMenu();


    // Viewごとの更新

    if (viewName === "dashboard") {

        updateDashboard();

    }


    if (viewName === "medications") {

        renderMedications();

    }


    if (viewName === "medication-logs") {

        renderMedicationLogs();

    }


    if (viewName === "friends") {

        renderFriends();

        renderFriendRequests();

    }


    if (viewName === "notifications") {

        renderNotifications();

    }


    if (viewName === "messages") {

        loadMessageFriends();

    }


    if (viewName === "appointments") {

        renderAppointments();

    }


    if (viewName === "health") {

        renderHealthRecords();

    }

}


// ==================================================
// ⑰ モバイルメニュー
// ==================================================

function toggleMobileMenu() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "mobile-overlay"
        ) ||
        document.getElementById(
            "sidebar-overlay"
        );


    sidebar?.classList.toggle(
        "mobile-open"
    );


    overlay?.classList.toggle(
        "hidden"
    );

}


function closeMobileMenu() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "mobile-overlay"
        ) ||
        document.getElementById(
            "sidebar-overlay"
        );


    sidebar?.classList.remove(
        "mobile-open"
    );

    overlay?.classList.add(
        "hidden"
    );

}


// ==================================================
// ⑱ ログアウト
// ==================================================

function setupLogoutEvents() {

    const logoutButton =
        document.getElementById(
            "logout-button"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            handleLogout
        );

    }

}


async function handleLogout() {

    const confirmed =
        confirm(
            "ログアウトしますか？"
        );


    if (!confirmed) {
        return;
    }


    try {

        showLoading();


        const {
            error
        } =
            await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                "ログアウトエラー:",
                error
            );

            showToast(
                "ログアウトに失敗しました。",
                "error"
            );

            return;

        }


        currentUser = null;
        currentProfile = null;

        medications = [];
        medicationLogs = [];
        friends = [];
        friendRequests = [];

        showAuth();

        showToast(
            "ログアウトしました。",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "ログアウト中にエラーが発生しました。",
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ==================================================
// ⑲ お薬読み込み
// ==================================================

async function loadMedications() {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
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

            console.error(
                "お薬取得エラー:",
                error
            );

            medications = [];

            renderMedications();

            return;

        }


        medications =
            data || [];


        renderMedications();

        updateDashboard();

    } catch (error) {

        console.error(
            "お薬読み込みエラー:",
            error
        );

    }

}


// ==================================================
// ⑳ お薬表示
// ==================================================

function renderMedications() {

    const container =
        document.getElementById(
            "medications-list"
        );


    if (!container) {
        return;
    }


    if (!medications.length) {

        container.innerHTML = `

            <div class="content-card sm:col-span-2 xl:col-span-3">

                <div class="empty-state">

                    <i class="fa-solid fa-pills"></i>

                    <p>
                        登録されているお薬はありません
                    </p>

                    <button
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
        medications
            .map(
                medication =>
                    createMedicationCard(
                        medication
                    )
            )
            .join("");

}


// ==================================================
// ㉑ お薬カード
// ==================================================

function createMedicationCard(
    medication
) {

    const name =
        escapeHtml(
            medication.name ||
            "名称未設定"
        );


    const dosage =
        escapeHtml(
            medication.dosage ||
            ""
        );


    const frequency =
        escapeHtml(
            medication.frequency ||
            ""
        );


    const notes =
        escapeHtml(
            medication.notes ||
            ""
        );


    return `

        <div class="content-card">

            <div class="flex items-start justify-between gap-3">

                <div class="flex items-center gap-3">

                    <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

                        <i class="fa-solid fa-pills"></i>

                    </div>

                    <div class="min-w-0">

                        <h3 class="font-extrabold text-slate-900 break-words">

                            ${name}

                        </h3>

                        ${
                            dosage
                                ? `
                                <p class="mt-1 text-xs text-slate-400">
                                    ${dosage}
                                </p>
                                `
                                : ""
                        }

                    </div>

                </div>


                <button
                    type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500"
                    onclick="deleteMedication('${medication.id}')"
                    title="削除"
                >

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>


            ${
                frequency
                    ? `
                    <div class="mt-4 rounded-xl bg-slate-50 p-3">

                        <div class="text-[11px] font-bold text-slate-400">
                            服用方法
                        </div>

                        <div class="mt-1 text-sm text-slate-700">
                            ${frequency}
                        </div>

                    </div>
                    `
                    : ""
            }


            ${
                notes
                    ? `
                    <div class="mt-3">

                        <div class="text-[11px] font-bold text-slate-400">
                            メモ
                        </div>

                        <div class="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                            ${notes}
                        </div>

                    </div>
                    `
                    : ""
            }

        </div>

    `;

}


// ==================================================
// ㉒ お薬登録モーダル
// ==================================================

function openMedicationModal() {

    openModal(`

        <div class="p-6">

            <div class="mb-6 flex items-start justify-between">

                <div>

                    <h2 class="text-xl font-extrabold text-slate-900">
                        お薬を登録
                    </h2>

                    <p class="mt-1 text-xs text-slate-400">
                        現在使用しているお薬を登録します。
                    </p>

                </div>


                <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
                    onclick="closeModal()"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <form
                id="medication-form"
                onsubmit="saveMedication(event)"
            >

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


                <div class="mb-4">

                    <label class="form-label">
                        用量
                    </label>

                    <input
                        id="medication-dosage"
                        type="text"
                        class="input-field"
                        placeholder="例：60mg"
                    >

                </div>


                <div class="mb-4">

                    <label class="form-label">
                        服用方法
                    </label>

                    <input
                        id="medication-frequency"
                        type="text"
                        class="input-field"
                        placeholder="例：1日3回 食後"
                    >

                </div>


                <div class="mb-5">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="medication-notes"
                        class="input-field"
                        rows="4"
                        placeholder="その他のメモ"
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

                        <i class="fa-solid fa-floppy-disk"></i>

                        登録する

                    </button>

                </div>

            </form>

        </div>

    `);

}


// ==================================================
// ㉓ お薬保存
// ==================================================

async function saveMedication(event) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "ログインしてください。",
            "error"
        );

        return;

    }


    const name =
        document
            .getElementById(
                "medication-name"
            )
            ?.value
            .trim();


    const dosage =
        document
            .getElementById(
                "medication-dosage"
            )
            ?.value
            .trim();


    const frequency =
        document
            .getElementById(
                "medication-frequency"
            )
            ?.value
            .trim();


    const notes =
        document
            .getElementById(
                "medication-notes"
            )
            ?.value
            .trim();


    if (!name) {

        showToast(
            "お薬の名前を入力してください。",
            "error"
        );

        return;

    }


    try {

        showLoading();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("medications")
                .insert({
                    user_id:
                        currentUser.id,
                    name,
                    dosage,
                    frequency,
                    notes
                })
                .select()
                .single();


        if (error) {

            console.error(
                "お薬登録エラー:",
                error
            );

            showToast(
                "お薬の登録に失敗しました。",
                "error"
            );

            return;

        }


        medications.unshift(
            data
        );


        renderMedications();

        updateDashboard();

        closeModal();

        showToast(
            "お薬を登録しました。",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "お薬の登録中にエラーが発生しました。",
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ==================================================
// ㉔ お薬削除
// ==================================================

async function deleteMedication(
    medicationId
) {

    if (!currentUser) {
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
        } =
            await supabaseClient
                .from("medications")
                .delete()
                .eq(
                    "id",
                    medicationId
                )
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {

            console.error(
                "お薬削除エラー:",
                error
            );

            showToast(
                "お薬の削除に失敗しました。",
                "error"
            );

            return;

        }


        medications =
            medications.filter(
                medication =>
                    medication.id !==
                    medicationId
            );


        renderMedications();

        updateDashboard();

        showToast(
            "お薬を削除しました。",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "お薬の削除中にエラーが発生しました。",
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ==================================================
// ㉕ 服薬記録読み込み
// ==================================================

async function loadMedicationLogs() {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("medication_logs")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "taken_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "服薬記録取得エラー:",
                error
            );

            medicationLogs = [];

            renderMedicationLogs();

            return;

        }


        medicationLogs =
            data || [];


        renderMedicationLogs();

        updateDashboard();

    } catch (error) {

        console.error(
            "服薬記録読み込みエラー:",
            error
        );

    }

}


// ==================================================
// ㉖ 服薬記録表示
// ==================================================

function renderMedicationLogs() {

    const container =
        document.getElementById(
            "medication-logs-list"
        );


    if (!container) {
        return;
    }


    if (!medicationLogs.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-check-double"></i>

                <p>
                    服薬記録はありません
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        medicationLogs
            .map(
                log =>
                    createMedicationLogItem(
                        log
                    )
            )
            .join("");

}


// ==================================================
// ㉗ 服薬記録アイテム
// ==================================================

function createMedicationLogItem(
    log
) {

    const medication =
        medications.find(
            item =>
                item.id ===
                log.medication_id
        );


    const medicationName =
        medication?.name ||
        log.medication_name ||
        "お薬";


    const date =
        formatDateTime(
            log.taken_at ||
            log.created_at
        );


    return `

        <div class="flex items-center justify-between gap-4 p-4">

            <div class="flex min-w-0 items-center gap-3">

                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                    <i class="fa-solid fa-check"></i>

                </div>

                <div class="min-w-0">

                    <div class="truncate text-sm font-bold text-slate-800">

                        ${escapeHtml(
                            medicationName
                        )}

                    </div>

                    <div class="mt-1 text-xs text-slate-400">

                        ${date}

                    </div>

                </div>

            </div>


            <span class="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">

                服用済み

            </span>

        </div>

    `;

}


// ==================================================
// ㉘ 服薬記録モーダル
// ==================================================

function openMedicationLogModal() {

    if (!medications.length) {

        showToast(
            "先にお薬を登録してください。",
            "error"
        );

        showView(
            "medications"
        );

        return;

    }


    const options =
        medications
            .map(
                medication => `

                    <option
                        value="${medication.id}"
                    >
                        ${escapeHtml(
                            medication.name
                        )}
                    </option>

                `
            )
            .join("");


    openModal(`

        <div class="p-6">

            <div class="mb-6 flex items-start justify-between">

                <div>

                    <h2 class="text-xl font-extrabold text-slate-900">
                        服薬を記録
                    </h2>

                    <p class="mt-1 text-xs text-slate-400">
                        服用したお薬を記録します。
                    </p>

                </div>


                <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
                    onclick="closeModal()"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <form
                onsubmit="saveMedicationLog(event)"
            >

                <div class="mb-4">

                    <label class="form-label">
                        お薬
                    </label>

                    <select
                        id="log-medication-id"
                        class="input-field"
                        required
                    >

                        ${options}

                    </select>

                </div>


                <div class="mb-5">

                    <label class="form-label">
                        服用日時
                    </label>

                    <input
                        id="log-taken-at"
                        type="datetime-local"
                        class="input-field"
                        required
                    >

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


    // 現在日時

    const input =
        document.getElementById(
            "log-taken-at"
        );


    if (input) {

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

}


// ==================================================
// ㉙ 服薬記録保存
// ==================================================

async function saveMedicationLog(
    event
) {

    event.preventDefault();


    if (!currentUser) {
        return;
    }


    const medicationId =
        document
            .getElementById(
                "log-medication-id"
            )
            ?.value;


    const takenAt =
        document
            .getElementById(
                "log-taken-at"
            )
            ?.value;


    if (
        !medicationId ||
        !takenAt
    ) {

        showToast(
            "必要な項目を入力してください。",
            "error"
        );

        return;

    }


    const medication =
        medications.find(
            item =>
                item.id ===
                medicationId
        );


    try {

        showLoading();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("medication_logs")
                .insert({
                    user_id:
                        currentUser.id,
                    medication_id:
                        medicationId,
                    medication_name:
                        medication?.name ||
                        null,
                    taken_at:
                        new Date(
                            takenAt
                        ).toISOString()
                })
                .select()
                .single();


        if (error) {

            console.error(
                "服薬記録保存エラー:",
                error
            );

            showToast(
                "服薬記録の保存に失敗しました。",
                "error"
            );

            return;

        }


        medicationLogs.unshift(
            data
        );


        renderMedicationLogs();

        updateDashboard();

        closeModal();

        showToast(
            "服薬を記録しました。",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "服薬記録中にエラーが発生しました。",
            "error"
        );

    } finally {

        hideLoading();

    }

}


// ==================================================
// ㉚ ダッシュボード更新
// ==================================================

function updateDashboard() {

    if (!currentUser) {
        return;
    }


    // お薬数

    setText(
        "dashboard-medication-count",
        medications.length
    );


    // 今日の服薬数

    const today =
        new Date();


    const todayString =
        today
            .toISOString()
            .slice(
                0,
                10
            );


    const todayLogs =
        medicationLogs.filter(
            log => {

                const date =
                    new Date(
                        log.taken_at ||
                        log.created_at
                    )
                        .toISOString()
                        .slice(
                            0,
                            10
                        );

                return (
                    date ===
                    todayString
                );

            }
        );


    setText(
        "dashboard-taken-count",
        todayLogs.length
    );


    // フレンド数

    setText(
        "dashboard-friend-count",
        friends.length
    );


    // 今日の服薬一覧

    renderDashboardMedicationList();


    // 次回予定

    renderDashboardAppointment();

}


// ==================================================
// ㉛ ダッシュボード服薬一覧
// ==================================================

function renderDashboardMedicationList() {

    const container =
        document.getElementById(
            "dashboard-medication-list"
        );


    if (!container) {
        return;
    }


    if (!medications.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-pills"></i>

                <p>
                    登録されているお薬はありません
                </p>

            </div>

        `;

        return;

    }


    const today =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );


    const todayMedicationIds =
        new Set(
            medicationLogs
                .filter(
                    log =>
                        new Date(
                            log.taken_at ||
                            log.created_at
                        )
                            .toISOString()
                            .slice(
                                0,
                                10
                            ) ===
                        today
                )
                .map(
                    log =>
                        log.medication_id
                )
        );


    container.innerHTML =
        medications
            .slice(
                0,
                5
            )
            .map(
                medication => {

                    const taken =
                        todayMedicationIds.has(
                            medication.id
                        );


                    return `

                        <div class="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">

                            <div class="flex min-w-0 items-center gap-3">

                                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    taken
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-blue-50 text-blue-600"
                                }">

                                    <i class="fa-solid ${
                                        taken
                                            ? "fa-check"
                                            : "fa-pills"
                                    }"></i>

                                </div>

                                <div class="min-w-0">

                                    <div class="truncate text-sm font-bold text-slate-800">

                                        ${escapeHtml(
                                            medication.name ||
                                            "お薬"
                                        )}

                                    </div>

                                    <div class="mt-1 text-xs text-slate-400">

                                        ${escapeHtml(
                                            medication.dosage ||
                                            medication.frequency ||
                                            ""
                                        )}

                                    </div>

                                </div>

                            </div>


                            <span class="shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                taken
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-slate-100 text-slate-500"
                            }">

                                ${
                                    taken
                                        ? "服用済み"
                                        : "未服用"
                                }

                            </span>

                        </div>

                    `;

                }
            )
            .join("");

}


// ==================================================
// ㉜ ダッシュボード次回予定
// ==================================================

function renderDashboardAppointment() {

    const container =
        document.getElementById(
            "dashboard-appointment-list"
        );


    if (!container) {
        return;
    }


    if (
        typeof appointments ===
        "undefined" ||
        !appointments.length
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-calendar-days"></i>

                <p>
                    予定はありません
                </p>

            </div>

        `;

        setText(
            "dashboard-next-appointment",
            "--"
        );

        return;

    }


    const now =
        new Date();


    const upcoming =
        appointments
            .filter(
                appointment =>
                    new Date(
                        appointment.date ||
                        appointment.appointment_date ||
                        appointment.scheduled_at
                    ) >= now
            )
            .sort(
                (a, b) =>
                    new Date(
                        a.date ||
                        a.appointment_date ||
                        a.scheduled_at
                    ) -
                    new Date(
                        b.date ||
                        b.appointment_date ||
                        b.scheduled_at
                    )
            );


    if (!upcoming.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-calendar-days"></i>

                <p>
                    今後の予定はありません
                </p>

            </div>

        `;

        setText(
            "dashboard-next-appointment",
            "--"
        );

        return;

    }


    const next =
        upcoming[0];


    const dateValue =
        next.date ||
        next.appointment_date ||
        next.scheduled_at;


    setText(
        "dashboard-next-appointment",
        formatDate(
            dateValue
        )
    );


    container.innerHTML = `

        <div class="rounded-2xl bg-slate-50 p-4">

            <div class="flex items-start gap-3">

                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                    <i class="fa-solid fa-calendar-check"></i>

                </div>

                <div class="min-w-0">

                    <div class="font-bold text-slate-800">

                        ${escapeHtml(
                            next.hospital_name ||
                            next.title ||
                            next.name ||
                            "通院予定"
                        )}

                    </div>

                    <div class="mt-1 text-xs text-slate-400">

                        ${formatDate(
                            dateValue
                        )}

                    </div>

                </div>

            </div>

        </div>

    `;

}


// ==================================================
// ㉝ モーダル
// ==================================================

function openModal(
    html
) {

    const overlay =
        document.getElementById(
            "modal-overlay"
        );

    const content =
        document.getElementById(
            "modal-content"
        );


    if (!overlay || !content) {
        return;
    }


    content.innerHTML =
        html;


    overlay.classList.remove(
        "hidden"
    );

    overlay.classList.add(
        "flex"
    );

}


function closeModal() {

    const overlay =
        document.getElementById(
            "modal-overlay"
        );

    const content =
        document.getElementById(
            "modal-content"
        );


    overlay?.classList.add(
        "hidden"
    );

    overlay?.classList.remove(
        "flex"
    );


    if (content) {

        content.innerHTML = "";

    }

}


function closeModalOnOverlay(
    event
) {

    if (
        event.target ===
        event.currentTarget
    ) {

        closeModal();

    }

}


// ==================================================
// ㉞ Toast
// ==================================================

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


    const icon =
        type === "success"
            ? "fa-circle-check"
            : type === "error"
                ? "fa-circle-exclamation"
                : "fa-circle-info";


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-xl";


    toast.innerHTML = `

        <i class="fa-solid ${icon}"></i>

        <span>
            ${escapeHtml(message)}
        </span>

    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        4000
    );

}


// ==================================================
// ㉟ Loading
// ==================================================

function showLoading() {

    const loading =
        document.getElementById(
            "global-loading"
        );


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
        document.getElementById(
            "global-loading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );

        loading.classList.remove(
            "flex"
        );

    }


    const appLoading =
        document.getElementById(
            "app-loading"
        );


    if (appLoading) {

        appLoading.classList.add(
            "hidden"
        );

    }

}


// ==================================================
// ㊱ ユーティリティ
// ==================================================

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
            value ??
            "";

    }

}


function setAvatar(
    id,
    username
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    const name =
        String(
            username ||
            "?"
        )
            .trim();


    const first =
        name.charAt(0)
            .toUpperCase();


    element.innerHTML =
        escapeHtml(
            first ||
            "?"
        );

}


function escapeHtml(
    value
) {

    if (
        value ===
        null ||
        value ===
        undefined
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


function formatDate(
    value
) {

    if (!value) {
        return "--";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--";

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


function formatDateTime(
    value
) {

    if (!value) {
        return "--";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--";

    }


    return date.toLocaleString(
        "ja-JP",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ==================================================
// app.js 前半ここまで
// ==================================================
// ============================================================
// まいへるす - app.js
// 完成版
// ============================================================

// ============================================================
// ① Supabase設定
// ============================================================

const SUPABASE_URL =
    "https://ufmcloqjcolpvzhnobgg.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_mxebX3u8pw2XfPGwtzQmyg_aB2fUSWy";

const supabaseClient =
    window.supabase.createClient(
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
let diagnoses = [];
let medicalVisits = [];
let appointments = [];
let allergies = [];
let friends = [];
let friendRequests = [];
let notifications = [];

let selectedChatFriend = null;
let messageSubscription = null;
let notificationSubscription = null;

let currentView = "dashboard";


// ============================================================
// ③ DOM取得
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// ④ 初期化
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        setupAuthEvents();
        setupGlobalEvents();

        const {
            data: {
                session
            }
        } = await supabaseClient.auth.getSession();

        if (session && session.user) {

            currentUser = session.user;

            await initializeApplication();

        } else {

            showAuthScreen();

        }

    } catch (error) {

        console.error("初期化エラー:", error);

        showAuthScreen();

    } finally {

        hideAppLoading();

    }

});


// ============================================================
// ⑤ Authイベント
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
            showRegisterForm
        );

    }

    if (showLoginButton) {

        showLoginButton.addEventListener(
            "click",
            showLoginForm
        );

    }

}


// ============================================================
// ⑥ グローバルイベント
// ============================================================

function setupGlobalEvents() {

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
// ⑦ Loading
// ============================================================

function hideAppLoading() {

    const loading =
        $("app-loading");

    if (!loading) return;

    loading.classList.add("hidden");

}


function showGlobalLoading() {

    const loading =
        $("global-loading");

    if (!loading) return;

    loading.classList.remove("hidden");
    loading.classList.add("flex");

}


function hideGlobalLoading() {

    const loading =
        $("global-loading");

    if (!loading) return;

    loading.classList.add("hidden");
    loading.classList.remove("flex");

}


// ============================================================
// ⑧ Auth画面
// ============================================================

function showAuthScreen() {

    const auth =
        $("auth-screen");

    const app =
        $("app");

    const appContainer =
        $("app-container");

    if (auth) {

        auth.classList.remove("hidden");

    }

    if (app) {

        app.classList.add("hidden");

    }

    if (appContainer) {

        appContainer.classList.add("hidden");

    }

}


function hideAuthScreen() {

    const auth =
        $("auth-screen");

    if (auth) {

        auth.classList.add("hidden");

    }

}


function showRegisterForm() {

    const login =
        $("login-form");

    const register =
        $("register-form");

    if (login) {

        login.classList.add("hidden");

    }

    if (register) {

        register.classList.remove("hidden");

    }

}


function showLoginForm() {

    const login =
        $("login-form");

    const register =
        $("register-form");

    if (register) {

        register.classList.add("hidden");

    }

    if (login) {

        login.classList.remove("hidden");

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

    showGlobalLoading();

    try {

        // ----------------------------------------------------
        // Supabase Auth登録
        // ----------------------------------------------------

        const {
            data,
            error
        } = await supabaseClient.auth.signUp({

            email,
            password

        });

        if (error) {

            throw error;

        }

        // ----------------------------------------------------
        // メール確認が必要な場合
        // ----------------------------------------------------

        if (!data.user) {

            showToast(
                "会員登録を完了できませんでした。",
                "error"
            );

            return;

        }

        // ----------------------------------------------------
        // profiles作成
        // ----------------------------------------------------

        const {
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .upsert({

                id: data.user.id,
                username: username

            }, {

                onConflict: "id"

            });

        if (profileError) {

            console.warn(
                "プロフィール作成エラー:",
                profileError
            );

        }

        showToast(
            "会員登録が完了しました。メール確認が必要な場合は確認してください。",
            "success"
        );

        showLoginForm();

        const loginEmail =
            $("login-email");

        if (loginEmail) {

            loginEmail.value = email;

        }

    } catch (error) {

        console.error(
            "会員登録エラー:",
            error
        );

        showToast(
            error.message ||
            "会員登録に失敗しました。",
            "error"
        );

    } finally {

        hideGlobalLoading();

    }

}


// ============================================================
// ⑩ ログイン
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

    showGlobalLoading();

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({

            email,
            password

        });

        if (error) {

            throw error;

        }

        currentUser =
            data.user;

        await initializeApplication();

        showToast(
            "ログインしました。",
            "success"
        );

    } catch (error) {

        console.error(
            "ログインエラー:",
            error
        );

        showToast(
            error.message ||
            "ログインに失敗しました。",
            "error"
        );

    } finally {

        hideGlobalLoading();

    }

}


// ============================================================
// ⑪ ログアウト
// ============================================================

async function handleLogout() {

    const confirmed =
        confirm(
            "ログアウトしますか？"
        );

    if (!confirmed) return;

    showGlobalLoading();

    try {

        if (messageSubscription) {

            await supabaseClient
                .removeChannel(
                    messageSubscription
                );

            messageSubscription = null;

        }

        if (notificationSubscription) {

            await supabaseClient
                .removeChannel(
                    notificationSubscription
                );

            notificationSubscription = null;

        }

        const {
            error
        } = await supabaseClient.auth.signOut();

        if (error) {

            throw error;

        }

        currentUser = null;
        currentProfile = null;

        medications = [];
        medicationLogs = [];
        healthRecords = [];
        diagnoses = [];
        medicalVisits = [];
        appointments = [];
        allergies = [];
        friends = [];
        friendRequests = [];
        notifications = [];

        showAuthScreen();

        showToast(
            "ログアウトしました。",
            "success"
        );

    } catch (error) {

        console.error(
            "ログアウトエラー:",
            error
        );

        showToast(
            error.message ||
            "ログアウトに失敗しました。",
            "error"
        );

    } finally {

        hideGlobalLoading();

    }

}


// ============================================================
// ⑫ アプリ初期化
// ============================================================

async function initializeApplication() {

    if (!currentUser) {

        showAuthScreen();

        return;

    }

    hideAuthScreen();

    const app =
        $("app");

    const appContainer =
        $("app-container");

    if (app) {

        app.classList.remove("hidden");

    }

    if (appContainer) {

        appContainer.classList.remove("hidden");

    }

    await loadProfile();

    await Promise.allSettled([

        loadMedications(),
        loadMedicationLogs(),
        loadHealthRecords(),
        loadDiagnoses(),
        loadMedicalVisits(),
        loadAppointments(),
        loadAllergies(),
        loadFriends(),
        loadFriendRequests(),
        loadNotifications()

    ]);

    updateUserUI();

    updateDashboard();

    subscribeToRealtime();

    showView(
        currentView || "dashboard"
    );

}


// ============================================================
// ⑬ プロフィール読み込み
// ============================================================

async function loadProfile() {

    if (!currentUser) return;

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

            console.warn(
                "プロフィール読み込みエラー:",
                error
            );

            return;

        }

        currentProfile =
            data || {

                id: currentUser.id,
                username:
                    currentUser.email?.split("@")[0] ||
                    "ユーザー"

            };

    } catch (error) {

        console.error(
            "プロフィール読み込みエラー:",
            error
        );

    }

}


// ============================================================
// ⑭ ユーザーUI更新
// ============================================================

function updateUserUI() {

    if (!currentUser) return;

    const username =
        currentProfile?.username ||
        currentProfile?.display_name ||
        currentUser.email?.split("@")[0] ||
        "ユーザー";

    const email =
        currentUser.email ||
        "-";

    const avatarText =
        getInitial(username);

    const elements = [

        ["sidebar-username", username],
        ["sidebar-email", email],
        ["header-username", username],
        ["settings-email", email],
        ["account-email", email]

    ];

    elements.forEach(
        ([id, value]) => {

            const el = $(id);

            if (el) {

                el.textContent =
                    value;

            }

        }
    );

    [
        "sidebar-avatar",
        "header-avatar",
        "settings-avatar"
    ].forEach(id => {

        const el = $(id);

        if (!el) return;

        el.textContent =
            avatarText;

    });

    const profileUsername =
        $("profile-username");

    if (
        profileUsername &&
        currentProfile
    ) {

        profileUsername.value =
            currentProfile.username || "";

    }

    const displayName =
        $("profile-display-name");

    if (
        displayName &&
        currentProfile
    ) {

        displayName.value =
            currentProfile.display_name || "";

    }

    const gender =
        $("profile-gender");

    if (
        gender &&
        currentProfile
    ) {

        gender.value =
            currentProfile.gender || "";

    }

    const age =
        $("profile-age");

    if (
        age &&
        currentProfile
    ) {

        age.value =
            currentProfile.age ?? "";

    }

    const height =
        $("profile-height");

    if (
        height &&
        currentProfile
    ) {

        height.value =
            currentProfile.height ?? "";

    }

    const weight =
        $("profile-weight");

    if (
        weight &&
        currentProfile
    ) {

        weight.value =
            currentProfile.weight ?? "";

    }

}


// ============================================================
// ⑮ イニシャル
// ============================================================

function getInitial(value) {

    if (!value) return "?";

    return String(value)
        .trim()
        .charAt(0)
        .toUpperCase();

}


// ============================================================
// ⑯ View切り替え
// ============================================================

function showView(viewName) {

    currentView =
        viewName;

    document
        .querySelectorAll(".view-section")
        .forEach(section => {

            section.classList.add(
                "hidden"
            );

        });

    const target =
        $(`view-${viewName}`);

    if (target) {

        target.classList.remove(
            "hidden"
        );

    }

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

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

        });

    updatePageHeader(
        viewName
    );

    closeMobileMenu();

    // 表示時に最新データを読み直す
    refreshViewData(viewName);

}


// ============================================================
// ⑰ Viewごとの更新
// ============================================================

async function refreshViewData(viewName) {

    if (!currentUser) return;

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

        case "diagnoses":

            await loadDiagnoses();

            break;

        case "visits":

            await loadMedicalVisits();

            break;

        case "appointments":

            await loadAppointments();

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

        case "settings":

            await loadProfile();

            updateUserUI();

            break;

    }

}


// ============================================================
// ⑱ ページヘッダー
// ============================================================

function updatePageHeader(viewName) {

    const titles = {

        dashboard: [
            "ホーム",
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
            "薬・食物などのアレルギー情報を管理します"
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

    const data =
        titles[viewName] ||
        titles.dashboard;

    const title =
        $("page-title");

    const subtitle =
        $("page-subtitle");

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
// ⑲ モバイルメニュー
// ============================================================

function toggleMobileMenu() {

    const sidebar =
        $("sidebar");

    const overlay =
        $("sidebar-overlay");

    const mobileOverlay =
        $("mobile-overlay");

    if (sidebar) {

        sidebar.classList.toggle(
            "mobile-open"
        );

    }

    if (overlay) {

        overlay.classList.toggle(
            "hidden"
        );

    }

    if (mobileOverlay) {

        mobileOverlay.classList.toggle(
            "hidden"
        );

    }

}


function closeMobileMenu() {

    const sidebar =
        $("sidebar");

    const overlay =
        $("sidebar-overlay");

    const mobileOverlay =
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

    if (mobileOverlay) {

        mobileOverlay.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// ⑳ お薬読み込み
// ============================================================

async function loadMedications() {

    if (!currentUser) return;

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

            console.warn(
                "お薬読み込みエラー:",
                error
            );

            medications = [];

            renderMedications();

            return;

        }

        medications =
            data || [];

        renderMedications();

        updateDashboard();

    } catch (error) {

        console.error(
            "お薬読み込みエラー:",
            error
        );

    }

}


// ============================================================
// ㉑ お薬表示
// ============================================================

function renderMedications() {

    const container =
        $("medications-list");

    if (!container) return;

    if (!medications.length) {

        container.innerHTML = `

            <div class="content-card sm:col-span-2 xl:col-span-3">

                <div class="empty-state">

                    <i class="fa-solid fa-pills"></i>

                    <p>
                        登録されているお薬はありません。
                    </p>

                    <button
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
            medication =>
                createMedicationCard(
                    medication
                )
        ).join("");

}


// ============================================================
// ㉒ お薬カード
// ============================================================

function createMedicationCard(
    medication
) {

    const name =
        escapeHtml(
            medication.name ||
            "名称未設定"
        );

    const dosage =
        escapeHtml(
            medication.dosage ||
            medication.amount ||
            ""
        );

    const frequency =
        escapeHtml(
            medication.frequency ||
            ""
        );

    const notes =
        escapeHtml(
            medication.notes ||
            ""
        );

    const quantity =
        medication.quantity ??
        medication.stock ??
        "";

    return `

        <div class="content-card">

            <div class="flex items-start justify-between gap-4">

                <div class="flex items-start gap-3">

                    <div
                        class="flex h-12 w-12 shrink-0
                               items-center justify-center
                               rounded-xl bg-blue-50
                               text-blue-600"
                    >
                        <i class="fa-solid fa-pills"></i>
                    </div>

                    <div class="min-w-0">

                        <h3
                            class="font-extrabold
                                   text-slate-900"
                        >
                            ${name}
                        </h3>

                        ${
                            dosage
                                ? `
                                <p class="mt-1 text-sm text-slate-500">
                                    ${dosage}
                                </p>
                                `
                                : ""
                        }

                    </div>

                </div>

                <button
                    type="button"
                    class="icon-button text-red-500"
                    onclick="deleteMedication('${medication.id}')"
                    title="削除"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>

            <div class="mt-5 space-y-2">

                ${
                    frequency
                        ? `
                        <div class="flex items-center gap-2 text-sm">
                            <i class="fa-regular fa-clock text-slate-400"></i>
                            <span class="text-slate-600">
                                ${frequency}
                            </span>
                        </div>
                        `
                        : ""
                }

                ${
                    quantity !== ""
                        ? `
                        <div class="flex items-center gap-2 text-sm">
                            <i class="fa-solid fa-box text-slate-400"></i>
                            <span class="text-slate-600">
                                残量：${escapeHtml(quantity)}
                            </span>
                        </div>
                        `
                        : ""
                }

                ${
                    notes
                        ? `
                        <div class="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                            ${notes}
                        </div>
                        `
                        : ""
                }

            </div>

            <div class="mt-5 flex gap-2">

                <button
                    type="button"
                    class="secondary-button flex-1"
                    onclick="openMedicationLogModal('${medication.id}')"
                >
                    <i class="fa-solid fa-check"></i>
                    服薬記録
                </button>

            </div>

        </div>

    `;

}


// ============================================================
// ㉓ お薬登録モーダル
// ============================================================

function openMedicationModal() {

    openModal(`

        <div class="p-6">

            <div class="mb-6 flex items-center justify-between">

                <div>

                    <h2 class="text-xl font-extrabold text-slate-900">
                        お薬を登録
                    </h2>

                    <p class="mt-1 text-xs text-slate-400">
                        現在使用しているお薬を登録します。
                    </p>

                </div>

                <button
                    type="button"
                    class="icon-button"
                    onclick="closeModal()"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <form
                id="medication-form"
                onsubmit="saveMedication(event)"
            >

                <div class="mb-4">

                    <label class="form-label">
                        お薬の名前
                    </label>

                    <input
                        id="medication-name"
                        type="text"
                        class="input-field"
                        placeholder="例：カロナール"
                        required
                    >

                </div>

                <div class="mb-4">

                    <label class="form-label">
                        用量・規格
                    </label>

                    <input
                        id="medication-dosage"
                        type="text"
                        class="input-field"
                        placeholder="例：200mg"
                    >

                </div>

                <div class="mb-4">

                    <label class="form-label">
                        服用方法・頻度
                    </label>

                    <input
                        id="medication-frequency"
                        type="text"
                        class="input-field"
                        placeholder="例：1日3回 食後"
                    >

                </div>

                <div class="mb-4">

                    <label class="form-label">
                        残量
                    </label>

                    <input
                        id="medication-quantity"
                        type="number"
                        min="0"
                        class="input-field"
                        placeholder="例：30"
                    >

                </div>

                <div class="mb-5">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="medication-notes"
                        class="input-field"
                        rows="3"
                        placeholder="医師からの指示など"
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
                        <i class="fa-solid fa-floppy-disk"></i>
                        登録する
                    </button>

                </div>

            </form>

        </div>

    `);

}


// ============================================================
// ㉔ お薬保存
// ============================================================

async function saveMedication(event) {

    event.preventDefault();

    if (!currentUser) {

        showToast(
            "ログインしてください。",
            "error"
        );

        return;

    }

    const name =
        $("medication-name")?.value.trim();

    const dosage =
        $("medication-dosage")?.value.trim();

    const frequency =
        $("medication-frequency")?.value.trim();

    const quantityValue =
        $("medication-quantity")?.value;

    const notes =
        $("medication-notes")?.value.trim();

    if (!name) {

        showToast(
            "お薬の名前を入力してください。",
            "error"
        );

        return;

    }

    showGlobalLoading();

    try {

        const insertData = {

            user_id: currentUser.id,

            name,

            dosage: dosage || null,

            frequency: frequency || null,

            quantity:
                quantityValue === ""
                    ? null
                    : Number(quantityValue),

            notes: notes || null

        };

        const {
            data,
            error
        } = await supabaseClient
            .from("medications")
            .insert(insertData)
            .select()
            .single();

        if (error) {

            throw error;

        }

        medications.unshift(
            data
        );

        renderMedications();

        updateDashboard();

        closeModal();

        showToast(
            "お薬を登録しました。",
            "success"
        );

    } catch (error) {

        console.error(
            "お薬登録エラー:",
            error
        );

        showToast(
            error.message ||
            "お薬の登録に失敗しました。",
            "error"
        );

    } finally {

        hideGlobalLoading();

    }

}


// ============================================================
// ㉕ お薬削除
// ============================================================

async function deleteMedication(
    medicationId
) {

    if (!medicationId) return;

    const confirmed =
        confirm(
            "このお薬を削除しますか？"
        );

    if (!confirmed) return;

    showGlobalLoading();

    try {

        const {
            error
        } = await supabaseClient
            .from("medications")
            .delete()
            .eq("id", medicationId)
            .eq("user_id", currentUser.id);

        if (error) {

            throw error;

        }

        medications =
            medications.filter(
                medication =>
                    medication.id !==
                    medicationId
            );

        renderMedications();

        updateDashboard();

        showToast(
            "お薬を削除しました。",
            "success"
        );

    } catch (error) {

        console.error(
            "お薬削除エラー:",
            error
        );

        showToast(
            error.message ||
            "お薬の削除に失敗しました。",
            "error"
        );

    } finally {

        hideGlobalLoading();

    }

}


// ============================================================
// ㉖ 服薬記録読み込み
// ============================================================

async function loadMedicationLogs() {

    if (!currentUser) return;

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("medication_logs")
            .select("*")
            .eq("user_id", currentUser.id)
            .order(
                "taken_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.warn(
                "服薬記録読み込みエラー:",
                error
            );

            medicationLogs = [];

            renderMedicationLogs();

            return;

        }

        medicationLogs =
            data || [];

        renderMedicationLogs();

        updateDashboard();

    } catch (error) {

        console.error(
            "服薬記録読み込みエラー:",
            error
        );

    }

}


// ============================================================
// ㉗ 服薬記録表示
// ============================================================

function renderMedicationLogs() {

    const container =
        $("medication-logs-list");

    if (!container) return;

    if (!medicationLogs.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-check-double"></i>

                <p>
                    まだ服薬記録がありません。
                </p>

            </div>

        `;

        return;

    }

    container.innerHTML =
        medicationLogs
            .map(log => {

                const medication =
                    medications.find(
                        item =>
                            item.id ===
                            log.medication_id
                    );

                const medicationName =
                    medication?.name ||
                    log.medication_name ||
                    "お薬";

                const date =
                    formatDateTime(
                        log.taken_at ||
                        log.created_at
                    );

                return `

                    <div
                        class="flex items-center
                               justify-between gap-4
                               p-4"
                    >

                        <div
                            class="flex items-center
                                   gap-3"
                        >

                            <div
                                class="flex h-10 w-10
                                       items-center
                                       justify-center
                                       rounded-xl
                                       bg-emerald-50
                                       text-emerald-600"
                            >
                                <i class="fa-solid fa-check"></i>
                            </div>

                            <div>

                                <div
                                    class="font-bold
                                           text-slate-800"
                                >
                                    ${escapeHtml(
                                        medicationName
                                    )}
                                </div>

                                <div
                                    class="mt-1 text-xs
                                           text-slate-400"
                                >
                                    ${date}
                                </div>

                            </div>

                        </div>

                    </div>

                `;

            })
            .join("");

}


// ============================================================
// ㉘ 服薬記録モーダル
// ============================================================

function openMedicationLogModal(
    medicationId = ""
) {

    const options =
        medications
            .map(
                medication => `

                    <option
                        value="${medication.id}"
                        ${
                            medication.id ===
                            medicationId
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(
                            medication.name ||
                            "名称未設定"
                        )}
                    </option>

                `
            )
            .join("");

    openModal(`

        <div class="p-6">

            <div class="mb-6 flex items-center justify-between">

                <div>

                    <h2 class="text-xl font-extrabold text-slate-900">
                        服薬を記録
                    </h2>

                    <p class="mt-1 text-xs text-slate-400">
                        飲んだお薬を記録します。
                    </p>

                </div>

                <button
                    type="button"
                    class="icon-button"
                    onclick="closeModal()"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            ${
                medications.length
                    ? `

                    <form
                        id="medication-log-form"
                        onsubmit="saveMedicationLog(event)"
                    >

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
                                    お薬を選択してください
                                </option>

                                ${options}

                            </select>

                        </div>

                        <div class="mb-4">

                            <label class="form-label">
                                服用日時
                            </label>

                            <input
                                id="log-taken-at"
                                type="datetime-local"
                                class="input-field"
                                value="${getCurrentDateTimeLocal()}"
                                required
                            >

                        </div>

                        <div class="mb-5">

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

                    `
                    : `

                    <div class="empty-state">

                        <i class="fa-solid fa-pills"></i>

                        <p>
                            先にお薬を登録してください。
                        </p>

                        <button
                            type="button"
                            class="primary-button mt-4"
                            onclick="closeModal(); openMedicationModal();"
                        >
                            お薬を登録
                        </button>

                    </div>

                    `
            }

        </div>

    `);

}


// ============================================================
// ㉙ 服薬記録保存
// ============================================================

async function saveMedicationLog(
    event
) {

    event.preventDefault();

    if (!currentUser) return;

    const medicationId =
        $("log-medication-id")?.value;

    const takenAt =
        $("log-taken-at")?.value;

    const notes =
        $("log-notes")?.value.trim();

    if (!medicationId) {

        showToast(
            "お薬を選択してください。",
            "error"
        );

        return;

    }

    showGlobalLoading();

    try {

        const medication =
            medications.find(
                item =>
                    item.id ===
                    medicationId
            );

        const insertData = {

            user_id: currentUser.id,

            medication_id:
                medicationId,

            taken_at:
                takenAt
                    ? new Date(takenAt).toISOString()
                    : new Date().toISOString(),

            notes:
                notes || null

        };

        const {
            data,
            error
        } = await supabaseClient
            .from("medication_logs")
            .insert(insertData)
            .select()
            .single();

        if (error) {

            throw error;

        }

        medicationLogs.unshift(
            data
        );

        renderMedicationLogs();

        updateDashboard();

        closeModal();

        showToast(
            `${medication?.name || "お薬"}の服薬を記録しました。`,
            "success"
        );

    } catch (error) {

        console.error(
            "服薬記録エラー:",
            error
        );

        showToast(
            error.message ||
            "服薬記録に失敗しました。",
            "error"
        );

    } finally {

        hideGlobalLoading();

    }

}


// ============================================================
// ㉚ ダッシュボード更新
// ============================================================

function updateDashboard() {

    const medicationCount =
        $("dashboard-medication-count");

    if (medicationCount) {

        medicationCount.textContent =
            medications.length;

    }

    const todayLogs =
        getTodayMedicationLogs();

    const takenCount =
        $("dashboard-taken-count");

    if (takenCount) {

        takenCount.textContent =
            todayLogs.length;

    }

    const friendCount =
        $("dashboard-friend-count");

    if (friendCount) {

        friendCount.textContent =
            friends.length;

    }

    updateDashboardMedicationList();

    updateDashboardAppointment();

    updateNextAppointmentSummary();

}


// ============================================================
// ㉛ 今日の服薬
// ============================================================

function getTodayMedicationLogs() {

    const today =
        new Date();

    return medicationLogs.filter(
        log => {

            const date =
                new Date(
                    log.taken_at ||
                    log.created_at
                );

            return (
                date.getFullYear() ===
                    today.getFullYear() &&

                date.getMonth() ===
                    today.getMonth() &&

                date.getDate() ===
                    today.getDate()
            );

        }
    );

}


function updateDashboardMedicationList() {

    const container =
        $("dashboard-medication-list");

    if (!container) return;

    const todayLogs =
        getTodayMedicationLogs();

    if (!todayLogs.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-pills"></i>

                <p>
                    今日の服薬記録はありません
                </p>

            </div>

        `;

        return;

    }

    container.innerHTML =
        todayLogs
            .slice(0, 5)
            .map(log => {

                const medication =
                    medications.find(
                        item =>
                            item.id ===
                            log.medication_id
                    );

                return `

                    <div
                        class="flex items-center
                               gap-3 border-b
                               border-slate-100
                               p-4 last:border-0"
                    >

                        <div
                            class="flex h-10 w-10
                                   items-center
                                   justify-center
                                   rounded-xl
                                   bg-emerald-50
                                   text-emerald-600"
                        >
                            <i class="fa-solid fa-check"></i>
                        </div>

                        <div class="flex-1">

                            <div
                                class="font-bold
                                       text-slate-800"
                            >
                                ${escapeHtml(
                                    medication?.name ||
                                    "お薬"
                                )}
                            </div>

                            <div
                                class="mt-1 text-xs
                                       text-slate-400"
                            >
                                ${formatTime(
                                    log.taken_at ||
                                    log.created_at
                                )}
                            </div>

                        </div>

                        <span
                            class="rounded-full
                                   bg-emerald-50
                                   px-3 py-1
                                   text-xs font-bold
                                   text-emerald-600"
                        >
                            服用済み
                        </span>

                    </div>

                `;

            })
            .join("");

}


// ============================================================
// ㉜ 通院予定表示
// ============================================================

function updateDashboardAppointment() {

    const container =
        $("dashboard-appointment");

    const container2 =
        $("dashboard-appointment-list");

    const upcoming =
        getUpcomingAppointment();

    const html =
        upcoming
            ? `

                <div class="p-4">

                    <div
                        class="flex items-start
                               gap-3"
                    >

                        <div
                            class="flex h-11 w-11
                                   items-center
                                   justify-center
                                   rounded-xl
                                   bg-purple-50
                                   text-purple-600"
                        >
                            <i class="fa-solid fa-calendar-check"></i>
                        </div>

                        <div>

                            <div
                                class="font-bold
                                       text-slate-800"
                            >
                                ${escapeHtml(
                                    upcoming.title ||
                                    upcoming.hospital ||
                                    "通院予定"
                                )}
                            </div>

                            <div
                                class="mt-1 text-xs
                                       text-slate-400"
                            >
                                ${formatDateTime(
                                    upcoming.appointment_date ||
                                    upcoming.date ||
                                    upcoming.scheduled_at
                                )}
                            </div>

                        </div>

                    </div>

                </div>

            `
            : `

                <div class="empty-state">

                    <i class="fa-regular fa-calendar"></i>

                    <p>
                        通院予定はありません
                    </p>

                </div>

            `;

    if (container) {

        container.innerHTML =
            html;

    }

    if (container2) {

        container2.innerHTML =
            html;

    }

}


function getUpcomingAppointment() {

    const now =
        new Date();

    return appointments
        .filter(item => {

            const value =
                item.appointment_date ||
                item.date ||
                item.scheduled_at;

            if (!value) return false;

            return new Date(value) >= now;

        })
        .sort((a, b) => {

            const dateA =
                new Date(
                    a.appointment_date ||
                    a.date ||
                    a.scheduled_at
                );

            const dateB =
                new Date(
                    b.appointment_date ||
                    b.date ||
                    b.scheduled_at
                );

            return dateA - dateB;

        })[0] || null;

}


function updateNextAppointmentSummary() {

    const element =
        $("dashboard-next-appointment");

    if (!element) return;

    const upcoming =
        getUpcomingAppointment();

    if (!upcoming) {

        element.textContent =
            "未登録";

        return;

    }

    const date =
        upcoming.appointment_date ||
        upcoming.date ||
        upcoming.scheduled_at;

    element.textContent =
        formatDate(date);

}


// ============================================================
// ㉝ モーダル
// ============================================================

function openModal(content) {

    const overlay =
        $("modal-overlay");

    const modalContent =
        $("modal-content");

    if (!overlay || !modalContent) {

        console.error(
            "モーダル要素が見つかりません。"
        );

        return;

    }

    modalContent.innerHTML =
        content;

    overlay.classList.remove(
        "hidden"
    );

    overlay.classList.add(
        "flex"
    );

    document.body.classList.add(
        "overflow-hidden"
    );

}


function closeModal() {

    const overlay =
        $("modal-overlay");

    const modalContent =
        $("modal-content");

    if (overlay) {

        overlay.classList.add(
            "hidden"
        );

        overlay.classList.remove(
            "flex"
        );

    }

    if (modalContent) {

        modalContent.innerHTML =
            "";

    }

    document.body.classList.remove(
        "overflow-hidden"
    );

}


function closeModalOnOverlay(
    event
) {

    if (
        event.target ===
        event.currentTarget
    ) {

        closeModal();

    }

}


// ============================================================
// ㉞ Toast
// ============================================================

function showToast(
    message,
    type = "success"
) {

    const container =
        $("toast-container");

    if (!container) {

        alert(message);

        return;

    }

    const toast =
        document.createElement(
            "div"
        );

    const icon =
        type === "error"
            ? "fa-circle-exclamation"
            : type === "warning"
                ? "fa-triangle-exclamation"
                : "fa-circle-check";

    const color =
        type === "error"
            ? "red"
            : type === "warning"
                ? "amber"
                : "emerald";

    toast.className = `
        flex items-center gap-3
        rounded-2xl border
        border-${color}-100
        bg-white px-4 py-3
        shadow-xl
        text-sm font-bold
        text-slate-700
    `;

    toast.innerHTML = `

        <i
            class="fa-solid ${icon}
                   text-${color}-500"
        ></i>

        <span>
            ${escapeHtml(message)}
        </span>

    `;

    container.appendChild(
        toast
    );

    setTimeout(() => {

        toast.style.opacity =
            "0";

        toast.style.transform =
            "translateY(10px)";

        toast.style.transition =
            "all .2s ease";

        setTimeout(() => {

            toast.remove();

        }, 200);

    }, 3000);

}


// ============================================================
// ㉟ Realtime
// ============================================================

function subscribeToRealtime() {

    if (!currentUser) return;

    // --------------------------------------------------------
    // メッセージ
    // --------------------------------------------------------

    if (messageSubscription) {

        supabaseClient.removeChannel(
            messageSubscription
        );

    }

    messageSubscription =
        supabaseClient
            .channel(
                `messages-${currentUser.id}`
            )
            .on(

                "postgres_changes",

                {
                    event: "INSERT",
                    schema: "public",
                    table: "direct_messages"
                },

                async payload => {

                    const message =
                        payload.new;

                    if (
                        message.receiver_id !==
                        currentUser.id
                    ) {

                        return;

                    }

                    if (
                        selectedChatFriend &&
                        message.sender_id ===
                        selectedChatFriend.id
                    ) {

                        await loadChatMessages(
                            selectedChatFriend.id
                        );

                    } else {

                        await updateUnreadMessageBadge();

                    }

                }

            )
            .subscribe();

    // --------------------------------------------------------
    // 通知
    // --------------------------------------------------------

    if (notificationSubscription) {

        supabaseClient.removeChannel(
            notificationSubscription
        );

    }

    notificationSubscription =
        supabaseClient
            .channel(
                `notifications-${currentUser.id}`
            )
            .on(

                "postgres_changes",

                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter:
                        `user_id=eq.${currentUser.id}`
                },

                async () => {

                    await loadNotifications();

                    showToast(
                        "新しい通知があります。",
                        "success"
                    );

                }

            )
            .subscribe();

}


// ============================================================
// ㊱ Utilities
// ============================================================

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatDate(value) {

    if (!value) return "-";

    const date =
        new Date(value);

    if (Number.isNaN(
        date.getTime()
    )) {

        return "-";

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


function formatTime(value) {

    if (!value) return "-";

    const date =
        new Date(value);

    if (Number.isNaN(
        date.getTime()
    )) {

        return "-";

    }

    return date.toLocaleTimeString(
        "ja-JP",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function formatDateTime(value) {

    if (!value) return "-";

    const date =
        new Date(value);

    if (Number.isNaN(
        date.getTime()
    )) {

        return "-";

    }

    return date.toLocaleString(
        "ja-JP",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function getCurrentDateTimeLocal() {

    const now =
        new Date();

    const offset =
        now.getTimezoneOffset();

    const local =
        new Date(
            now.getTime() -
            offset * 60000
        );

    return local
        .toISOString()
        .slice(0, 16);

}


// ============================================================
// ここまで app.js 前半
// ============================================================
// ==================================================
// 服薬記録・健康記録・各種画面 後半
// ==================================================

// --------------------------------------------------
// 共通：現在ユーザー確認
// --------------------------------------------------

async function requireUser() {
    if (!currentUser) {
        const {
            data: { user }
        } = await supabase.auth.getUser();

        if (user) {
            currentUser = user;
            return user;
        }

        showToast("ログインしてください。", "error");
        return null;
    }

    return currentUser;
}


// --------------------------------------------------
// 服薬記録
// --------------------------------------------------

async function loadMedicationLogs() {

    const user = await requireUser();
    if (!user) return;

    const list = document.getElementById("medication-logs-list");
    if (!list) return;

    try {

        const { data, error } = await supabase
            .from("medication_logs")
            .select(`
                *,
                medications (
                    id,
                    name,
                    dosage,
                    unit
                )
            `)
            .eq("user_id", user.id)
            .order("taken_at", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {

            list.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-check-double"></i>
                    <p>服薬記録はありません</p>
                </div>
            `;

            updateDashboardTakenCount([]);
            return;
        }

        list.innerHTML = data.map(log => {

            const medicationName =
                log.medications?.name || "お薬";

            const dosage =
                log.medications?.dosage
                    ? `${log.medications.dosage}${log.medications.unit || ""}`
                    : "";

            const date =
                log.taken_at
                    ? formatDateTime(log.taken_at)
                    : "-";

            return `
                <div class="flex items-center justify-between gap-4 py-4">
                    <div class="flex items-center gap-3 min-w-0">

                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <i class="fa-solid fa-check"></i>
                        </div>

                        <div class="min-w-0">
                            <div class="font-bold text-slate-800 truncate">
                                ${escapeHtml(medicationName)}
                            </div>

                            <div class="text-xs text-slate-400">
                                ${escapeHtml(dosage)}
                            </div>

                            <div class="text-xs text-slate-400 mt-1">
                                ${escapeHtml(date)}
                            </div>
                        </div>

                    </div>

                    <button
                        class="text-red-400 hover:text-red-600"
                        onclick="deleteMedicationLog('${log.id}')"
                        title="削除"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

        }).join("");

        updateDashboardTakenCount(data);

    } catch (error) {

        console.error("服薬記録取得エラー:", error);

        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>服薬記録の取得に失敗しました</p>
            </div>
        `;
    }
}


// --------------------------------------------------
// 服薬記録追加
// --------------------------------------------------

async function saveMedicationLog(event) {

    if (event) event.preventDefault();

    const user = await requireUser();
    if (!user) return;

    const medicationId =
        document.getElementById("log-medication-id")?.value;

    const takenAt =
        document.getElementById("log-taken-at")?.value;

    const note =
        document.getElementById("log-note")?.value || "";

    if (!medicationId) {
        showToast("お薬を選択してください。", "error");
        return;
    }

    try {

        showGlobalLoading(true);

        const { error } = await supabase
            .from("medication_logs")
            .insert({
                user_id: user.id,
                medication_id: medicationId,
                taken_at: takenAt
                    ? new Date(takenAt).toISOString()
                    : new Date().toISOString(),
                note
            });

        if (error) throw error;

        closeModal();
        showToast("服薬を記録しました。", "success");

        await loadMedicationLogs();
        await loadDashboard();

    } catch (error) {

        console.error(error);
        showToast("服薬記録の保存に失敗しました。", "error");

    } finally {

        showGlobalLoading(false);
    }
}


// --------------------------------------------------
// 服薬記録削除
// --------------------------------------------------

async function deleteMedicationLog(id) {

    if (!confirm("この服薬記録を削除しますか？")) return;

    try {

        const { error } = await supabase
            .from("medication_logs")
            .delete()
            .eq("id", id);

        if (error) throw error;

        showToast("服薬記録を削除しました。", "success");

        await loadMedicationLogs();
        await loadDashboard();

    } catch (error) {

        console.error(error);
        showToast("削除に失敗しました。", "error");
    }
}


// --------------------------------------------------
// 服薬記録モーダル
// --------------------------------------------------

async function openMedicationLogModal() {

    const user = await requireUser();
    if (!user) return;

    const { data: medications, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

    if (error) {

        console.error(error);
        showToast("お薬を取得できませんでした。", "error");
        return;
    }

    const options = (medications || []).map(m => `
        <option value="${m.id}">
            ${escapeHtml(m.name)}
        </option>
    `).join("");

    openModal(`
        <div class="p-6">

            <div class="mb-6">
                <h3 class="text-xl font-extrabold text-slate-900">
                    服薬を記録
                </h3>

                <p class="mt-1 text-sm text-slate-400">
                    飲んだお薬を記録します。
                </p>
            </div>

            <form onsubmit="saveMedicationLog(event)">

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
                            お薬を選択してください
                        </option>

                        ${options}
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
                        value="${getDateTimeLocalValue()}"
                        required
                    >

                </div>

                <div class="mb-5">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="log-note"
                        class="input-field"
                        placeholder="体調などのメモ"
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
}


// --------------------------------------------------
// 健康記録
// --------------------------------------------------

async function loadHealthRecords() {

    const user = await requireUser();
    if (!user) return;

    const list =
        document.getElementById("health-records-list");

    if (!list) return;

    try {

        const { data, error } = await supabase
            .from("health_records")
            .select("*")
            .eq("user_id", user.id)
            .order("record_date", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {

            list.innerHTML = `
                <div class="content-card">
                    <div class="empty-state">
                        <i class="fa-solid fa-heart-pulse"></i>
                        <p>健康記録はありません</p>
                    </div>
                </div>
            `;

            return;
        }

        list.innerHTML = data.map(record => `

            <div class="content-card">

                <div class="flex items-start justify-between gap-3">

                    <div>

                        <div class="text-xs text-slate-400">
                            ${escapeHtml(record.record_date || "-")}
                        </div>

                        <h3 class="mt-1 font-extrabold text-slate-900">
                            健康記録
                        </h3>

                    </div>

                    <button
                        class="text-red-400 hover:text-red-600"
                        onclick="deleteHealthRecord('${record.id}')"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

                <div class="mt-4 grid grid-cols-2 gap-3">

                    <div class="rounded-xl bg-slate-50 p-3">
                        <div class="text-xs text-slate-400">
                            体調
                        </div>
                        <div class="mt-1 font-bold">
                            ${escapeHtml(record.condition || "-")}
                        </div>
                    </div>

                    <div class="rounded-xl bg-slate-50 p-3">
                        <div class="text-xs text-slate-400">
                            気分
                        </div>
                        <div class="mt-1 font-bold">
                            ${escapeHtml(record.mood || "-")}
                        </div>
                    </div>

                </div>

                ${
                    record.notes
                    ? `
                        <div class="mt-4 text-sm text-slate-600 whitespace-pre-wrap">
                            ${escapeHtml(record.notes)}
                        </div>
                    `
                    : ""
                }

            </div>

        `).join("");

    } catch (error) {

        console.error("健康記録取得エラー:", error);

        list.innerHTML = `
            <div class="content-card">
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>健康記録を取得できませんでした</p>
                </div>
            </div>
        `;
    }
}


// --------------------------------------------------
// 健康記録保存
// --------------------------------------------------

async function saveHealthRecord(event) {

    if (event) event.preventDefault();

    const user = await requireUser();
    if (!user) return;

    const recordDate =
        document.getElementById("health-record-date")?.value ||
        new Date().toISOString().slice(0, 10);

    const condition =
        document.getElementById("health-condition")?.value || "";

    const mood =
        document.getElementById("health-mood")?.value || "";

    const notes =
        document.getElementById("health-notes")?.value || "";

    try {

        showGlobalLoading(true);

        const { error } = await supabase
            .from("health_records")
            .insert({
                user_id: user.id,
                record_date: recordDate,
                condition,
                mood,
                notes
            });

        if (error) throw error;

        closeModal();

        showToast("健康記録を保存しました。", "success");

        await loadHealthRecords();

    } catch (error) {

        console.error(error);
        showToast("健康記録の保存に失敗しました。", "error");

    } finally {

        showGlobalLoading(false);
    }
}


// --------------------------------------------------
// 健康記録削除
// --------------------------------------------------

async function deleteHealthRecord(id) {

    if (!confirm("この健康記録を削除しますか？")) return;

    try {

        const { error } = await supabase
            .from("health_records")
            .delete()
            .eq("id", id);

        if (error) throw error;

        showToast("削除しました。", "success");

        await loadHealthRecords();

    } catch (error) {

        console.error(error);
        showToast("削除に失敗しました。", "error");
    }
}


// --------------------------------------------------
// 健康記録モーダル
// --------------------------------------------------

function openHealthRecordModal() {

    openModal(`
        <div class="p-6">

            <div class="mb-6">

                <h3 class="text-xl font-extrabold text-slate-900">
                    健康記録
                </h3>

                <p class="mt-1 text-sm text-slate-400">
                    今日の体調を記録します。
                </p>

            </div>

            <form onsubmit="saveHealthRecord(event)">

                <div class="mb-4">

                    <label class="form-label">
                        日付
                    </label>

                    <input
                        id="health-record-date"
                        type="date"
                        class="input-field"
                        value="${getTodayDate()}"
                        required
                    >

                </div>

                <div class="mb-4">

                    <label class="form-label">
                        体調
                    </label>

                    <select
                        id="health-condition"
                        class="input-field"
                    >
                        <option value="">選択してください</option>
                        <option value="とても良い">とても良い</option>
                        <option value="良い">良い</option>
                        <option value="普通">普通</option>
                        <option value="少し悪い">少し悪い</option>
                        <option value="悪い">悪い</option>
                    </select>

                </div>

                <div class="mb-4">

                    <label class="form-label">
                        気分
                    </label>

                    <select
                        id="health-mood"
                        class="input-field"
                    >
                        <option value="">選択してください</option>
                        <option value="とても良い">とても良い</option>
                        <option value="良い">良い</option>
                        <option value="普通">普通</option>
                        <option value="少し悪い">少し悪い</option>
                        <option value="悪い">悪い</option>
                    </select>

                </div>

                <div class="mb-5">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="health-notes"
                        class="input-field"
                        placeholder="今日の体調について"
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
                        保存
                    </button>

                </div>

            </form>

        </div>
    `);
}


// --------------------------------------------------
// 診断・病歴
// --------------------------------------------------

async function loadDiagnoses() {

    const user = await requireUser();
    if (!user) return;

    const list =
        document.getElementById("diagnoses-list");

    if (!list) return;

    try {

        const { data, error } = await supabase
            .from("diagnoses")
            .select("*")
            .eq("user_id", user.id)
            .order("diagnosed_date", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {

            list.innerHTML = `
                <div class="content-card md:col-span-2">
                    <div class="empty-state">
                        <i class="fa-solid fa-stethoscope"></i>
                        <p>診断・病歴はありません</p>
                    </div>
                </div>
            `;

            return;
        }

        list.innerHTML = data.map(item => `

            <div class="content-card">

                <div class="flex justify-between">

                    <div>
                        <div class="text-xs text-slate-400">
                            ${escapeHtml(item.diagnosed_date || "-")}
                        </div>

                        <h3 class="mt-1 text-lg font-extrabold text-slate-900">
                            ${escapeHtml(item.name || "病名未設定")}
                        </h3>
                    </div>

                    <button
                        class="text-red-400 hover:text-red-600"
                        onclick="deleteDiagnosis('${item.id}')"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

                ${
                    item.notes
                    ? `
                        <p class="mt-4 text-sm text-slate-600 whitespace-pre-wrap">
                            ${escapeHtml(item.notes)}
                        </p>
                    `
                    : ""
                }

            </div>

        `).join("");

    } catch (error) {

        console.error(error);

        list.innerHTML = `
            <div class="content-card md:col-span-2">
                <div class="empty-state">
                    <p>診断情報を取得できませんでした</p>
                </div>
            </div>
        `;
    }
}


async function saveDiagnosis(event) {

    if (event) event.preventDefault();

    const user = await requireUser();
    if (!user) return;

    const name =
        document.getElementById("diagnosis-name")?.value?.trim();

    const date =
        document.getElementById("diagnosis-date")?.value || null;

    const notes =
        document.getElementById("diagnosis-notes")?.value || "";

    if (!name) {
        showToast("病名を入力してください。", "error");
        return;
    }

    try {

        const { error } = await supabase
            .from("diagnoses")
            .insert({
                user_id: user.id,
                name,
                diagnosed_date: date,
                notes
            });

        if (error) throw error;

        closeModal();
        showToast("診断を追加しました。", "success");

        await loadDiagnoses();

    } catch (error) {

        console.error(error);
        showToast("診断の保存に失敗しました。", "error");
    }
}


async function deleteDiagnosis(id) {

    if (!confirm("この診断を削除しますか？")) return;

    const { error } = await supabase
        .from("diagnoses")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(error);
        showToast("削除に失敗しました。", "error");
        return;
    }

    showToast("削除しました。", "success");

    await loadDiagnoses();
}


function openDiagnosisModal() {

    openModal(`
        <div class="p-6">

            <h3 class="mb-6 text-xl font-extrabold">
                診断・病歴を追加
            </h3>

            <form onsubmit="saveDiagnosis(event)">

                <div class="mb-4">
                    <label class="form-label">
                        病名・診断名
                    </label>

                    <input
                        id="diagnosis-name"
                        class="input-field"
                        placeholder="例：高血圧"
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

                <div class="mb-5">
                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="diagnosis-notes"
                        class="input-field"
                        placeholder="診断についてのメモ"
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
                        保存
                    </button>

                </div>

            </form>

        </div>
    `);
}


// --------------------------------------------------
// アレルギー
// --------------------------------------------------

async function loadAllergies() {

    const user = await requireUser();
    if (!user) return;

    const list =
        document.getElementById("allergies-list");

    if (!list) return;

    try {

        const { data, error } = await supabase
            .from("allergies")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {

            list.innerHTML = `
                <div class="content-card md:col-span-2">
                    <div class="empty-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>アレルギー情報はありません</p>
                    </div>
                </div>
            `;

            return;
        }

        list.innerHTML = data.map(item => `

            <div class="content-card">

                <div class="flex items-center justify-between">

                    <div class="flex items-center gap-3">

                        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>

                        <div>

                            <div class="font-extrabold text-slate-900">
                                ${escapeHtml(item.name || "未設定")}
                            </div>

                            <div class="text-xs text-slate-400">
                                ${escapeHtml(item.type || "")}
                            </div>

                        </div>

                    </div>

                    <button
                        class="text-red-400"
                        onclick="deleteAllergy('${item.id}')"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

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

        list.innerHTML = `
            <div class="content-card md:col-span-2">
                <div class="empty-state">
                    <p>アレルギー情報を取得できませんでした</p>
                </div>
            </div>
        `;
    }
}


async function saveAllergy(event) {

    if (event) event.preventDefault();

    const user = await requireUser();
    if (!user) return;

    const name =
        document.getElementById("allergy-name")?.value?.trim();

    const type =
        document.getElementById("allergy-type")?.value || "";

    const notes =
        document.getElementById("allergy-notes")?.value || "";

    if (!name) {
        showToast("アレルギー名を入力してください。", "error");
        return;
    }

    try {

        const { error } = await supabase
            .from("allergies")
            .insert({
                user_id: user.id,
                name,
                type,
                notes
            });

        if (error) throw error;

        closeModal();

        showToast("アレルギー情報を追加しました。", "success");

        await loadAllergies();

    } catch (error) {

        console.error(error);
        showToast("保存に失敗しました。", "error");
    }
}


async function deleteAllergy(id) {

    if (!confirm("このアレルギー情報を削除しますか？")) return;

    const { error } = await supabase
        .from("allergies")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(error);
        showToast("削除に失敗しました。", "error");
        return;
    }

    showToast("削除しました。", "success");

    await loadAllergies();
}


function openAllergyModal() {

    openModal(`
        <div class="p-6">

            <h3 class="mb-6 text-xl font-extrabold">
                アレルギーを追加
            </h3>

            <form onsubmit="saveAllergy(event)">

                <div class="mb-4">

                    <label class="form-label">
                        アレルギー
                    </label>

                    <input
                        id="allergy-name"
                        class="input-field"
                        placeholder="例：ペニシリン"
                        required
                    >

                </div>

                <div class="mb-4">

                    <label class="form-label">
                        種類
                    </label>

                    <select
                        id="allergy-type"
                        class="input-field"
                    >
                        <option value="">未設定</option>
                        <option value="薬剤">薬剤</option>
                        <option value="食物">食物</option>
                        <option value="その他">その他</option>
                    </select>

                </div>

                <div class="mb-5">

                    <label class="form-label">
                        メモ
                    </label>

                    <textarea
                        id="allergy-notes"
                        class="input-field"
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
                        保存
                    </button>

                </div>

            </form>

        </div>
    `);
}


// --------------------------------------------------
// 共通ユーティリティ
// --------------------------------------------------

function getTodayDate() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const day =
        String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getDateTimeLocalValue() {

    const now = new Date();

    const offset =
        now.getTimezoneOffset();

    const local =
        new Date(now.getTime() - offset * 60000);

    return local
        .toISOString()
        .slice(0, 16);
}


function formatDateTime(value) {

    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString(
        "ja-JP",
        {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
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


// --------------------------------------------------
// ダッシュボード服薬数
// --------------------------------------------------

function updateDashboardTakenCount(logs) {

    const element =
        document.getElementById("dashboard-taken-count");

    if (!element) return;

    const today =
        getTodayDate();

    const count =
        (logs || []).filter(log => {

            if (!log.taken_at) return false;

            return new Date(log.taken_at)
                .toISOString()
                .slice(0, 10) === today;

        }).length;

    element.textContent = count;
}


// --------------------------------------------------
// モーダル
// --------------------------------------------------

function openModal(content) {

    const overlay =
        document.getElementById("modal-overlay");

    const container =
        document.getElementById("modal-content");

    if (!overlay || !container) return;

    container.innerHTML = content;

    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    document.body.classList.add("overflow-hidden");
}


function closeModal() {

    const overlay =
        document.getElementById("modal-overlay");

    const container =
        document.getElementById("modal-content");

    if (!overlay) return;

    overlay.classList.add("hidden");
    overlay.classList.remove("flex");

    if (container) {
        container.innerHTML = "";
    }

    document.body.classList.remove("overflow-hidden");
}


function closeModalOnOverlay(event) {

    if (event.target === event.currentTarget) {
        closeModal();
    }
}


// --------------------------------------------------
// Toast
// --------------------------------------------------

function showToast(message, type = "info") {

    const container =
        document.getElementById("toast-container");

    if (!container) return;

    const icon =
        type === "success"
            ? "fa-circle-check"
            : type === "error"
                ? "fa-circle-exclamation"
                : "fa-circle-info";

    const toast =
        document.createElement("div");

    toast.className =
        "rounded-2xl bg-white px-4 py-3 shadow-xl border border-slate-200 flex items-center gap-3 text-sm font-semibold text-slate-700";

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all .2s ease";

        setTimeout(() => {
            toast.remove();
        }, 200);

    }, 3000);
}


// --------------------------------------------------
// Global Loading
// --------------------------------------------------

function showGlobalLoading(show) {

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


// --------------------------------------------------
// モバイルメニュー
// --------------------------------------------------

function toggleMobileMenu() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("mobile-overlay") ||
        document.getElementById("sidebar-overlay");

    if (!sidebar) return;

    sidebar.classList.toggle("mobile-open");

    if (overlay) {
        overlay.classList.toggle("hidden");
    }
}


// --------------------------------------------------
// ESCでモーダルを閉じる
// --------------------------------------------------

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeModal();
    }

});


// ==================================================
// 後半ここまで
// ==================================================
