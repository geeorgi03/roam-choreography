const STORAGE_KEY = "roam_choreo_app_v4";
const LEGACY_KEYS = ["roam_choreo_app_v3", "roam_choreo_app_v2", "roam_choreo_app_v1"];
const CLOUD_STATE_TABLE = "roam_user_state";
const GROWTH_INVITES_TABLE = "roam_growth_invites";
const GROWTH_WAITLIST_TABLE = "roam_growth_waitlist";
const GROWTH_FEEDBACK_TABLE = "roam_growth_feedback";
const ASSIGNMENT_STATUSES = ["unseen", "in-progress", "ready"];
const SECTION_STATUSES = ["empty", "in-progress", "ready"];
const TAKE_TYPES = ["MINE", "REF"];

const I18N = {
  en: {
    title: "Roam Choreography Workspace",
    language: "Language",
    sessionTitle: "Session Setup",
    createSession: "Create Session",
    noSession: "No active session",
    activeSession: "Active session",
    dancerTitle: "Dancers",
    addDancer: "Add Dancer",
    sectionTitle: "Song Sections",
    addSection: "Add Section",
    assignTitle: "Assign Section to Dancers",
    assign: "Assign",
    referenceTitle: "References",
    saveReference: "Save Reference",
    mediaLabTitle: "Media Lab (Music + Video)",
    mySectionsTitle: "My Sections View",
    takesTitle: "Capture / Takes Log",
    addTake: "Log Take",
    analyticsTitle: "Rehearsal Analytics",
    onboardingTitle: "First Session Onboarding",
    cloudTitle: "Cloud Sync (Supabase)",
    shareTitle: "Invite / Share Pack",
    growthTitle: "Growth Engine"
  },
  "zh-CN": {
    title: "Roam 编舞工作台",
    language: "语言",
    sessionTitle: "排练场次",
    createSession: "创建场次",
    noSession: "当前没有活动场次",
    activeSession: "当前场次",
    dancerTitle: "舞者",
    addDancer: "添加舞者",
    sectionTitle: "段落",
    addSection: "添加段落",
    assignTitle: "给舞者分配段落",
    assign: "分配",
    referenceTitle: "参考素材",
    saveReference: "保存参考",
    mediaLabTitle: "媒体实验室（音乐+视频）",
    mySectionsTitle: "我的段落视图",
    takesTitle: "拍摄/练习记录",
    addTake: "记录拍摄",
    analyticsTitle: "排练数据",
    onboardingTitle: "首次排练引导",
    cloudTitle: "云同步（Supabase）",
    shareTitle: "邀请/分享包",
    growthTitle: "增长引擎"
  },
  ko: {
    title: "Roam 안무 워크스페이스",
    language: "언어",
    sessionTitle: "세션 설정",
    createSession: "세션 생성",
    noSession: "활성 세션 없음",
    activeSession: "활성 세션",
    dancerTitle: "댄서",
    addDancer: "댄서 추가",
    sectionTitle: "구간",
    addSection: "구간 추가",
    assignTitle: "댄서에게 구간 배정",
    assign: "배정",
    referenceTitle: "레퍼런스",
    saveReference: "레퍼런스 저장",
    mediaLabTitle: "미디어 랩 (음악+영상)",
    mySectionsTitle: "내 구간 보기",
    takesTitle: "촬영/테이크 로그",
    addTake: "테이크 기록",
    analyticsTitle: "리허설 분석",
    onboardingTitle: "첫 세션 온보딩",
    cloudTitle: "클라우드 동기화(Supabase)",
    shareTitle: "초대/공유 팩",
    growthTitle: "성장 엔진"
  },
  ja: {
    title: "Roam 振付ワークスペース",
    language: "言語",
    sessionTitle: "セッション設定",
    createSession: "セッション作成",
    noSession: "アクティブなセッションなし",
    activeSession: "アクティブセッション",
    dancerTitle: "ダンサー",
    addDancer: "ダンサー追加",
    sectionTitle: "セクション",
    addSection: "セクション追加",
    assignTitle: "ダンサーへセクション割り当て",
    assign: "割り当て",
    referenceTitle: "リファレンス",
    saveReference: "保存",
    mediaLabTitle: "メディアラボ（音楽+動画）",
    mySectionsTitle: "自分のセクション",
    takesTitle: "撮影/テイクログ",
    addTake: "テイク記録",
    analyticsTitle: "リハーサル分析",
    onboardingTitle: "初回セッション案内",
    cloudTitle: "クラウド同期(Supabase)",
    shareTitle: "招待/共有パック",
    growthTitle: "成長エンジン"
  },
  km: {
    title: "Roam កន្លែងធ្វើការរៀបចំក្បាច់រាំ",
    language: "ភាសា",
    sessionTitle: "ការកំណត់សម័យហាត់",
    createSession: "បង្កើតសម័យ",
    noSession: "មិនមានសម័យកំពុងដំណើរការ",
    activeSession: "សម័យកំពុងដំណើរការ",
    dancerTitle: "អ្នករាំ",
    addDancer: "បន្ថែមអ្នករាំ",
    sectionTitle: "ផ្នែកបទភ្លេង",
    addSection: "បន្ថែមផ្នែក",
    assignTitle: "ចាត់ផ្នែកទៅអ្នករាំ",
    assign: "ចាត់",
    referenceTitle: "ឯកសារយោង",
    saveReference: "រក្សាទុកឯកសារយោង",
    mediaLabTitle: "មន្ទីរប្រព័ន្ធផ្សព្វផ្សាយ (តន្ត្រី+វីដេអូ)",
    mySectionsTitle: "មើលផ្នែករបស់ខ្ញុំ",
    takesTitle: "កំណត់ត្រាការថត/Take",
    addTake: "កត់ត្រា Take",
    analyticsTitle: "វិភាគការហាត់សម",
    onboardingTitle: "ការណែនាំលើកដំបូង",
    cloudTitle: "សមកាលកម្ម Cloud (Supabase)",
    shareTitle: "កញ្ចប់អញ្ជើញ/ចែករំលែក",
    growthTitle: "ម៉ាស៊ីនកំណើន"
  }
};

const state = loadState();
let supabaseClient = null;
let flushInProgress = false;
let autoFlushTimer = null;
const mediaRuntime = {
  musicLoopA: null,
  musicLoopB: null,
  videoLoopA: null,
  videoLoopB: null,
  musicObjectUrl: "",
  tapTimes: [],
  lastDetectedBpm: null,
  loadedVideoUrl: "",
  loadedVideoPlatform: "none",
  // Tracks last second written to reference fields to throttle timeupdate DOM writes
  lastRefSyncSec: -1
};

captureReferralAttributionFromUrl();

const el = getEls();
bindEvents();
renderAll();
setupSyncMonitoring();

  // Mirror sync banner text into compact sidebar badge
  (function() {
    const badge = document.getElementById("syncBannerShort");
    const dot   = document.querySelector(".sync-dot");
    if (!badge || !el.syncBanner) return;
    const obs = new MutationObserver(() => {
      const txt = el.syncBanner.textContent || "";
      badge.textContent = txt.replace(/^Sync status:\s*/i, "").slice(0, 28) || "Checking…";
      if (dot) {
        dot.classList.toggle("online",  el.syncBanner.classList.contains("success"));
        dot.classList.toggle("offline", el.syncBanner.classList.contains("error"));
      }
    });
    obs.observe(el.syncBanner, { childList: true, characterData: true, subtree: true, attributes: true });
  })();
attemptCloudRestoreSession();

function getEls() {
  return {
    language: document.getElementById("language"),
    feedback: document.getElementById("feedback"),
    syncBanner: document.getElementById("syncBanner"),
    title: document.getElementById("title"),
    languageLabel: document.getElementById("languageLabel"),
    sessionTitle: document.getElementById("sessionTitle"),
    createSession: document.getElementById("createSession"),
    sessionName: document.getElementById("sessionName"),
    activeSessionText: document.getElementById("activeSessionText"),
    onboardingTitle: document.getElementById("onboardingTitle"),
    onboardingList: document.getElementById("onboardingList"),
    completeOnboarding: document.getElementById("completeOnboarding"),
    cloudTitle: document.getElementById("cloudTitle"),
    supabaseUrl: document.getElementById("supabaseUrl"),
    supabaseAnonKey: document.getElementById("supabaseAnonKey"),
    authEmail: document.getElementById("authEmail"),
    authPassword: document.getElementById("authPassword"),
    saveCloudConfig: document.getElementById("saveCloudConfig"),
    signUpCloud: document.getElementById("signUpCloud"),
    signInCloud: document.getElementById("signInCloud"),
    pullCloud: document.getElementById("pullCloud"),
    pushCloud: document.getElementById("pushCloud"),
    signOutCloud: document.getElementById("signOutCloud"),
    cloudStatus: document.getElementById("cloudStatus"),
    flushCloudQueue: document.getElementById("flushCloudQueue"),
    downloadOpsSnapshot: document.getElementById("downloadOpsSnapshot"),
    cloudQueueStatus: document.getElementById("cloudQueueStatus"),
    dancerTitle: document.getElementById("dancerTitle"),
    dancerName: document.getElementById("dancerName"),
    dancerRole: document.getElementById("dancerRole"),
    addDancer: document.getElementById("addDancer"),
    dancerList: document.getElementById("dancerList"),
    sectionTitle: document.getElementById("sectionTitle"),
    sectionName: document.getElementById("sectionName"),
    sectionStatus: document.getElementById("sectionStatus"),
    addSection: document.getElementById("addSection"),
    sectionList: document.getElementById("sectionList"),
    assignTitle: document.getElementById("assignTitle"),
    assignSection: document.getElementById("assignSection"),
    assignDancer: document.getElementById("assignDancer"),
    assignStatus: document.getElementById("assignStatus"),
    assignDueDate: document.getElementById("assignDueDate"),
    createAssignment: document.getElementById("createAssignment"),
    assignmentList: document.getElementById("assignmentList"),
    referenceTitle: document.getElementById("referenceTitle"),
    refSection: document.getElementById("refSection"),
    refUrl: document.getElementById("refUrl"),
    refTimestamp: document.getElementById("refTimestamp"),
    addReference: document.getElementById("addReference"),
    referenceList: document.getElementById("referenceList"),
    mediaLabTitle: document.getElementById("mediaLabTitle"),
    musicFile: document.getElementById("musicFile"),
    musicPlayer: document.getElementById("musicPlayer"),
    musicLoopEnabled: document.getElementById("musicLoopEnabled"),
    setMusicLoopA: document.getElementById("setMusicLoopA"),
    setMusicLoopB: document.getElementById("setMusicLoopB"),
    musicSpeed: document.getElementById("musicSpeed"),
    musicSpeedValue: document.getElementById("musicSpeedValue"),
    tapBpm: document.getElementById("tapBpm"),
    analyzeBpm: document.getElementById("analyzeBpm"),
    bpmStatus: document.getElementById("bpmStatus"),
    videoUrlInput: document.getElementById("videoUrlInput"),
    loadVideoUrl: document.getElementById("loadVideoUrl"),
    videoPlayer: document.getElementById("videoPlayer"),
    videoMirrorEnabled: document.getElementById("videoMirrorEnabled"),
    videoLoopEnabled: document.getElementById("videoLoopEnabled"),
    syncVideoToReference: document.getElementById("syncVideoToReference"),
    videoSourceType: document.getElementById("videoSourceType"),
    videoSpeed: document.getElementById("videoSpeed"),
    videoSpeedValue: document.getElementById("videoSpeedValue"),
    setVideoLoopA: document.getElementById("setVideoLoopA"),
    setVideoLoopB: document.getElementById("setVideoLoopB"),
    openVideoExternally: document.getElementById("openVideoExternally"),
    saveVideoTimeToReference: document.getElementById("saveVideoTimeToReference"),
    mediaStatus: document.getElementById("mediaStatus"),
    shareTitle: document.getElementById("shareTitle"),
    shareSection: document.getElementById("shareSection"),
    generateSharePack: document.getElementById("generateSharePack"),
    sharePayload: document.getElementById("sharePayload"),
    copySharePack: document.getElementById("copySharePack"),
    importSharePack: document.getElementById("importSharePack"),
    takesTitle: document.getElementById("takesTitle"),
    takeSection: document.getElementById("takeSection"),
    takeType: document.getElementById("takeType"),
    takeDuration: document.getElementById("takeDuration"),
    takeNotes: document.getElementById("takeNotes"),
    addTake: document.getElementById("addTake"),
    takeList: document.getElementById("takeList"),
    mySectionsTitle: document.getElementById("mySectionsTitle"),
    mySectionsDancer: document.getElementById("mySectionsDancer"),
    mySectionsList: document.getElementById("mySectionsList"),
    analyticsTitle: document.getElementById("analyticsTitle"),
    analyticsGrid: document.getElementById("analyticsGrid"),
    growthTitle: document.getElementById("growthTitle"),
    referralCode: document.getElementById("referralCode"),
    generateReferral: document.getElementById("generateReferral"),
    copyReferralLink: document.getElementById("copyReferralLink"),
    inviteEmail: document.getElementById("inviteEmail"),
    sendInvite: document.getElementById("sendInvite"),
    inviteStatus: document.getElementById("inviteStatus"),
    waitlistName: document.getElementById("waitlistName"),
    waitlistEmail: document.getElementById("waitlistEmail"),
    joinWaitlist: document.getElementById("joinWaitlist"),
    growthFunnel: document.getElementById("growthFunnel"),
    weeklyReport: document.getElementById("weeklyReport"),
    reliabilityReport: document.getElementById("reliabilityReport"),
    feedbackName: document.getElementById("feedbackName"),
    feedbackRole: document.getElementById("feedbackRole"),
    feedbackScore: document.getElementById("feedbackScore"),
    feedbackNotes: document.getElementById("feedbackNotes"),
    submitFeedback: document.getElementById("submitFeedback"),
    feedbackStatus: document.getElementById("feedbackStatus")
  };
}

function bindEvents() {
  el.language.value = state.locale;
  el.supabaseUrl.value = state.cloud.url;
  el.supabaseAnonKey.value = state.cloud.anonKey;

  el.language.addEventListener("change", () => {
    state.locale = el.language.value;
    persist();
    renderText();
    setFeedback("Language updated.", "success");
  });

  el.completeOnboarding.addEventListener("click", () => {
    state.onboarding.completed = true;
    persist();
    renderOnboarding();
    setFeedback("Onboarding marked complete.", "success");
  });

  el.saveCloudConfig.addEventListener("click", saveCloudConfig);
  el.signUpCloud.addEventListener("click", cloudSignUp);
  el.signInCloud.addEventListener("click", cloudSignIn);
  el.signOutCloud.addEventListener("click", cloudSignOut);
  el.pushCloud.addEventListener("click", cloudPushSync);
  el.pullCloud.addEventListener("click", cloudPullSync);
  el.flushCloudQueue.addEventListener("click", flushPendingCloudWrites);
  el.downloadOpsSnapshot.addEventListener("click", downloadOpsSnapshot);

  el.createSession.addEventListener("click", () => {
    const name = el.sessionName.value.trim();
    if (!name) return setFeedback("Session name is required.", "error");
    state.session = { id: uid(), name };
    el.sessionName.value = "";
    state.growth.sessionCreates += 1;
    trackEvent("session_created");
    persist();
    renderAll();
    setFeedback("Session created.", "success");
  });

  el.addDancer.addEventListener("click", () => {
    const name = el.dancerName.value.trim();
    if (!name) return setFeedback("Dancer name is required.", "error");
    state.dancers.push({ id: uid(), name, role: el.dancerRole.value.trim() || "-" });
    trackEvent("dancer_added");
    el.dancerName.value = "";
    el.dancerRole.value = "";
    persist();
    renderAll();
    setFeedback("Dancer added.", "success");
  });

  el.addSection.addEventListener("click", () => {
    const name = el.sectionName.value.trim();
    if (!name) return setFeedback("Section name is required.", "error");
    state.sections.push({ id: uid(), name, status: validSectionStatus(el.sectionStatus.value) });
    trackEvent("section_added");
    el.sectionName.value = "";
    persist();
    renderAll();
    setFeedback("Section added.", "success");
  });

  el.createAssignment.addEventListener("click", () => {
    if (!el.assignSection.value || !el.assignDancer.value) return setFeedback("Choose a section and dancer first.", "error");
    const already = state.assignments.find((item) => item.sectionId === el.assignSection.value && item.dancerId === el.assignDancer.value);
    if (already) return setFeedback("This section is already assigned to that dancer.", "error");

    const status = validAssignmentStatus(el.assignStatus.value);
    const now = new Date().toISOString();
    state.assignments.push({
      id: uid(),
      sectionId: el.assignSection.value,
      dancerId: el.assignDancer.value,
      status,
      dueDate: el.assignDueDate.value || "",
      updatedAt: now,
      history: [{ status, at: now }]
    });
    trackEvent("assignment_created");
    el.assignDueDate.value = "";
    persist();
    renderAll();
    setFeedback("Assignment created.", "success");
  });

  el.addReference.addEventListener("click", () => {
    if (!el.refSection.value) return setFeedback("Choose a section for this reference.", "error");
    const url = el.refUrl.value.trim();
    if (!url) return setFeedback("Reference URL is required.", "error");
    if (!isLikelyUrl(url)) return setFeedback("Reference URL should start with http:// or https://", "error");

    const manualTimestamp = el.refTimestamp.value.trim();
    const parsedSeconds = parseTimestampFromUrl(url);
    const timestamp = manualTimestamp || (parsedSeconds !== null ? formatSeconds(parsedSeconds) : "00:00");

    state.references.push({ id: uid(), sectionId: el.refSection.value, url, timestamp });
    trackEvent("reference_saved");
    el.refUrl.value = "";
    el.refTimestamp.value = "";
    persist();
    renderAll();
    setFeedback(!manualTimestamp && parsedSeconds !== null
      ? `Reference saved with parsed timestamp ${timestamp}.`
      : "Reference saved.", "success");
  });

  el.generateSharePack.addEventListener("click", generateSharePack);
  el.copySharePack.addEventListener("click", copySharePack);
  el.importSharePack.addEventListener("click", importSharePack);
  el.generateReferral.addEventListener("click", generateReferralCode);
  el.copyReferralLink.addEventListener("click", copyReferralLink);
  el.sendInvite.addEventListener("click", sendInvite);
  el.joinWaitlist.addEventListener("click", joinWaitlist);
  el.submitFeedback.addEventListener("click", submitUserFeedback);
  setupMediaLabHandlers();

  el.addTake.addEventListener("click", () => {
    if (!el.takeSection.value) return setFeedback("Choose a section for this take.", "error");
    const durationSec = Number(el.takeDuration.value || 0);
    if (!Number.isFinite(durationSec) || durationSec <= 0) return setFeedback("Take duration must be greater than 0.", "error");
    const takeType = TAKE_TYPES.includes(el.takeType.value) ? el.takeType.value : "MINE";
    state.takes.push({
      id: uid(),
      sectionId: el.takeSection.value,
      type: takeType,
      durationSec: Math.round(durationSec),
      notes: el.takeNotes.value.trim(),
      createdAt: new Date().toISOString()
    });
    trackEvent("take_logged");
    el.takeDuration.value = "";
    el.takeNotes.value = "";
    persist();
    renderAll();
    setFeedback("Take logged.", "success");
  });

  el.mySectionsDancer.addEventListener("change", renderMySections);

  el.dancerList.addEventListener("click", onDancerAction);
  el.sectionList.addEventListener("click", onSectionAction);
  el.assignmentList.addEventListener("click", onAssignmentAction);
  el.assignmentList.addEventListener("change", onAssignmentChange);

  // Enter key submits inline edit; Escape cancels
  function onInlineEditKey(saveAction, cancelAction) {
    return function(event) {
      if (event.key === "Enter") {
        const btn = event.target.closest("li")?.querySelector(`button[data-action="${saveAction}"]`);
        if (btn) btn.click();
      } else if (event.key === "Escape") {
        const btn = event.target.closest("li")?.querySelector(`button[data-action="${cancelAction}"]`);
        if (btn) btn.click();
      }
    };
  }
  el.dancerList.addEventListener("keydown", onInlineEditKey("save-dancer", "cancel-dancer"));
  el.sectionList.addEventListener("keydown", onInlineEditKey("save-section", "cancel-section"));

  // ── Panel navigation ───────────────────────────────────────────────
  const navItems = document.querySelectorAll(".nav-item[data-panel]");
  const panels   = document.querySelectorAll(".panel[data-panel]");
  const sidebar  = document.getElementById("sidebar");
  const toggle   = document.getElementById("sidebarToggle");

  function switchPanel(panelId) {
    navItems.forEach((n) => n.classList.toggle("active", n.dataset.panel === panelId));
    panels.forEach((p)   => p.classList.toggle("active",   p.dataset.panel === panelId));
    try { localStorage.setItem("roam_active_panel", panelId); } catch {}
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      switchPanel(item.dataset.panel);
      if (sidebar && window.innerWidth < 900) sidebar.classList.remove("open");
    });
  });

  if (toggle && sidebar) {
    toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.addEventListener("click", (e) => {
      if (sidebar.classList.contains("open") &&
          !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    });
  }

  // Restore last active panel
  const savedPanel = (() => { try { return localStorage.getItem("roam_active_panel"); } catch { return null; } })();
  if (savedPanel && document.querySelector(`.panel[data-panel="${savedPanel}"]`)) {
    switchPanel(savedPanel);
  }
  el.referenceList.addEventListener("click", onReferenceAction);
  el.takeList.addEventListener("click", onTakeAction);
}

function saveCloudConfig() {
  const url = el.supabaseUrl.value.trim();
  const anonKey = el.supabaseAnonKey.value.trim();
  if (!url || !anonKey) return setFeedback("Supabase URL and key are required.", "error");
  if (!/^https:\/\/.+\.supabase\.co$/i.test(url)) {
    return setFeedback("Supabase URL should look like https://<project>.supabase.co", "error");
  }
  state.cloud.url = url;
  state.cloud.anonKey = anonKey;
  persist();
  initSupabaseClient();
  setFeedback("Cloud config saved.", "success");
  updateCloudStatus();
}

function initSupabaseClient() {
  if (!state.cloud.url || !state.cloud.anonKey) return null;
  if (!window.supabase?.createClient) return null;
  supabaseClient = window.supabase.createClient(state.cloud.url, state.cloud.anonKey);
  return supabaseClient;
}

async function attemptCloudRestoreSession() {
  if (!initSupabaseClient()) return;
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session?.user) {
      state.cloud.user = { id: data.session.user.id, email: data.session.user.email || "" };
      persist();
      updateCloudStatus();
    }
  } catch {
    updateCloudStatus();
  }
}

async function cloudSignUp() {
  if (!supabaseClient && !initSupabaseClient()) return setFeedback("Configure cloud first.", "error");
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;
  if (!email || !password) return setFeedback("Email and password are required.", "error");
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return setFeedback(`Sign up failed: ${error.message}`, "error");
  setFeedback("Sign up request sent. Check email if confirmation is enabled.", "success");
}

async function cloudSignIn() {
  if (!supabaseClient && !initSupabaseClient()) return setFeedback("Configure cloud first.", "error");
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;
  if (!email || !password) return setFeedback("Email and password are required.", "error");
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return setFeedback(`Sign in failed: ${error.message}`, "error");
  state.cloud.user = { id: data.user.id, email: data.user.email || "" };
  persist();
  updateCloudStatus();
  setFeedback("Signed in to cloud.", "success");
}

async function cloudSignOut() {
  if (!supabaseClient && !initSupabaseClient()) return setFeedback("Configure cloud first.", "error");
  const { error } = await supabaseClient.auth.signOut();
  if (error) return setFeedback(`Sign out failed: ${error.message}`, "error");
  state.cloud.user = null;
  persist();
  updateCloudStatus();
  setFeedback("Signed out.", "success");
}

async function cloudPushSync() {
  if (!supabaseClient && !initSupabaseClient()) return setFeedback("Configure cloud first.", "error");
  if (!state.cloud.user?.id) return setFeedback("Sign in before sync.", "error");

  const payload = exportSyncState();
  const { error } = await supabaseClient
    .from(CLOUD_STATE_TABLE)
    .upsert(
      { user_id: state.cloud.user.id, app_state: payload, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select();

  if (error) {
    return setFeedback(`Push sync failed: ${error.message}`, "error");
  }
  setFeedback("Cloud sync pushed.", "success");
}

async function cloudPullSync() {
  if (!supabaseClient && !initSupabaseClient()) return setFeedback("Configure cloud first.", "error");
  if (!state.cloud.user?.id) return setFeedback("Sign in before sync.", "error");

  const { data, error } = await supabaseClient
    .from(CLOUD_STATE_TABLE)
    .select("app_state, updated_at")
    .eq("user_id", state.cloud.user.id)
    .maybeSingle();

  if (error) return setFeedback(`Pull sync failed: ${error.message}`, "error");
  if (!data?.app_state) return setFeedback("No cloud state found for this user yet.", "info");

  // Warn before overwriting any existing local data — unsaved changes will be lost
  const hasLocalData = state.dancers.length > 0 || state.sections.length > 0 || state.takes.length > 0;
  if (hasLocalData) {
    const cloudTime = data.updated_at ? ` (saved ${toLocalTime(data.updated_at)})` : "";
    const confirmed = window.confirm(
      `Pull will replace all local data with your cloud state${cloudTime}. Any local-only changes will be lost. Continue?`
    );
    if (!confirmed) return setFeedback("Pull cancelled.", "info");
  }

  hydrateFromPayload(data.app_state);
  persist();
  renderAll();
  setFeedback("Cloud state pulled.", "success");
}

function updateCloudStatus() {
  if (!state.cloud.url || !state.cloud.anonKey) {
    el.cloudStatus.textContent = "Cloud not configured";
    return;
  }
  if (state.cloud.user?.email) {
    el.cloudStatus.textContent = `Signed in: ${state.cloud.user.email}`;
    return;
  }
  el.cloudStatus.textContent = "Configured, not signed in";
}

function generateSharePack() {
  const sectionId = el.shareSection.value;
  if (!sectionId) return setFeedback("Select a section before generating pack.", "error");
  const section = state.sections.find((item) => item.id === sectionId);
  if (!section) return setFeedback("Selected section is invalid.", "error");

  const sharePayload = {
    v: 1,
    generatedAt: new Date().toISOString(),
    section,
    assignments: state.assignments.filter((item) => item.sectionId === sectionId),
    references: state.references.filter((item) => item.sectionId === sectionId),
    takes: state.takes.filter((item) => item.sectionId === sectionId)
  };

  el.sharePayload.value = toBase64Json(sharePayload);
  state.growth.sharePacksGenerated += 1;
  trackEvent("share_pack_generated");
  persist();
  setFeedback("Share pack generated.", "success");
}

async function copySharePack() {
  const value = el.sharePayload.value.trim();
  if (!value) return setFeedback("No share payload to copy.", "error");
  try {
    await navigator.clipboard.writeText(value);
    setFeedback("Share pack copied.", "success");
  } catch {
    setFeedback("Copy failed. You can manually copy the payload.", "error");
  }
}

function importSharePack() {
  const value = el.sharePayload.value.trim();
  if (!value) return setFeedback("Paste a share payload first.", "error");
  let decoded;
  try {
    decoded = fromBase64Json(value);
  } catch {
    return setFeedback("Invalid payload format.", "error");
  }
  if (!decoded?.section) return setFeedback("Payload missing section data.", "error");

  const newSectionId = uid();
  const section = {
    id: newSectionId,
    name: `${decoded.section.name} (imported)`,
    status: validSectionStatus(decoded.section.status)
  };
  state.sections.push(section);

  const importedAssignments = Array.isArray(decoded.assignments) ? decoded.assignments : [];
  for (const item of importedAssignments) {
    const dancer = state.dancers.find((d) => d.id === item.dancerId);
    if (!dancer && state.dancers.length) {
      item.dancerId = state.dancers[0].id;
    } else if (!dancer) {
      const generatedDancer = { id: uid(), name: "Imported Dancer", role: "-" };
      state.dancers.push(generatedDancer);
      item.dancerId = generatedDancer.id;
    }
    state.assignments.push({
      id: uid(),
      sectionId: newSectionId,
      dancerId: item.dancerId,
      status: validAssignmentStatus(item.status),
      dueDate: item.dueDate || "",
      updatedAt: new Date().toISOString(),
      history: [{ status: validAssignmentStatus(item.status), at: new Date().toISOString() }]
    });
  }

  const importedReferences = Array.isArray(decoded.references) ? decoded.references : [];
  for (const item of importedReferences) {
    state.references.push({
      id: uid(),
      sectionId: newSectionId,
      // Validate protocol to prevent javascript:/data: XSS via href
      url: isSafeUrl(item.url) ? (item.url || "") : "",
      timestamp: item.timestamp || "00:00"
    });
  }

  const importedTakes = Array.isArray(decoded.takes) ? decoded.takes : [];
  for (const item of importedTakes) {
    state.takes.push({
      id: uid(),
      sectionId: newSectionId,
      type: TAKE_TYPES.includes(item.type) ? item.type : "MINE",
      durationSec: Math.max(1, Number(item.durationSec) || 1),
      notes: item.notes || "",
      createdAt: new Date().toISOString()
    });
  }

  persist();
  renderAll();
  trackEvent("share_pack_imported");
  setFeedback("Share pack imported into a new section.", "success");
}

function generateReferralCode() {
  state.growth.referralCode = makeReferralCode();
  persist();
  renderGrowth();
  setFeedback("Referral code generated.", "success");
}

async function copyReferralLink() {
  const code = state.growth.referralCode || makeReferralCode();
  const link = buildReferralLink(code);
  try {
    await navigator.clipboard.writeText(link);
    trackEvent("referral_link_copied");
    persist();
    setFeedback("Referral link copied.", "success");
  } catch {
    setFeedback("Copy failed. You can manually copy the referral code.", "error");
  }
}

function sendInvite() {
  const email = el.inviteEmail.value.trim();
  if (!isLikelyEmail(email)) {
    return setFeedback("Enter a valid invite email.", "error");
  }
  state.growth.invitesSent += 1;
  state.growth.inviteLog.push({
    id: uid(),
    email,
    at: new Date().toISOString(),
    referralCode: state.growth.referralCode
  });
  el.inviteEmail.value = "";
  trackEvent("invite_sent");
  persist();
  renderGrowth();
  setFeedback("Invite recorded.", "success");
  void syncInviteToCloud(email);
}

function joinWaitlist() {
  const name = el.waitlistName.value.trim();
  const email = el.waitlistEmail.value.trim();
  if (!name || !isLikelyEmail(email)) {
    return setFeedback("Waitlist requires a valid name and email.", "error");
  }
  state.growth.waitlist.push({
    id: uid(),
    name,
    email,
    at: new Date().toISOString(),
    referralCode: state.growth.referralCode
  });
  el.waitlistName.value = "";
  el.waitlistEmail.value = "";
  trackEvent("waitlist_joined");
  persist();
  renderGrowth();
  setFeedback("Waitlist lead captured.", "success");
  void syncWaitlistLeadToCloud({ name, email });
}

function submitUserFeedback() {
  const name = el.feedbackName.value.trim();
  const role = el.feedbackRole.value.trim() || "unknown";
  const notes = el.feedbackNotes.value.trim();
  const score = Number(el.feedbackScore.value);

  if (!name) return setFeedback("Feedback name is required.", "error");
  if (!Number.isFinite(score) || score < 1 || score > 10) {
    return setFeedback("Feedback score must be between 1 and 10.", "error");
  }
  if (!notes) return setFeedback("Feedback notes are required.", "error");

  const entry = {
    id: uid(),
    name,
    role,
    score,
    notes,
    at: new Date().toISOString(),
    referralCode: state.growth.attribution.referralCode || state.growth.referralCode || ""
  };
  state.growth.feedbackLog.push(entry);
  el.feedbackName.value = "";
  el.feedbackRole.value = "";
  el.feedbackScore.value = "";
  el.feedbackNotes.value = "";
  trackEvent("user_feedback_submitted");
  persist();
  renderGrowth();
  setFeedback("User feedback captured.", "success");
  void syncFeedbackToCloud(entry);
}

function trackEvent(name) {
  state.growth.events.push({
    id: uid(),
    name,
    at: new Date().toISOString()
  });
  // Keep only the most recent 500 events to prevent localStorage overflow
  if (state.growth.events.length > 500) {
    state.growth.events = state.growth.events.slice(-500);
  }
}

async function syncInviteToCloud(email) {
  if (!supabaseClient || !state.cloud.user?.id) return;
  const payload = {
    owner_user_id: state.cloud.user.id,
    invite_email: email,
    referral_code: state.growth.referralCode || null,
    attribution_referral_code: state.growth.attribution.referralCode || null,
    created_at: new Date().toISOString()
  };
  const { error } = await supabaseClient.from(GROWTH_INVITES_TABLE).insert(payload);
  if (error) {
    queuePendingCloudWrite({ type: "invite", payload });
    trackEvent("invite_cloud_sync_failed");
    persist();
    setFeedback(`Invite stored locally; cloud sync failed: ${error.message}`, "info");
  } else {
    trackEvent("invite_cloud_synced");
    persist();
  }
}

async function syncWaitlistLeadToCloud(lead) {
  // Waitlist is intentionally open to anonymous submissions (lead-capture before sign-in).
  // Ensure your Supabase RLS policy on roam_growth_waitlist allows anon inserts.
  if (!supabaseClient) return;
  const payload = {
    lead_name: lead.name,
    lead_email: lead.email,
    referral_code: state.growth.referralCode || null,
    attribution_referral_code: state.growth.attribution.referralCode || null,
    owner_user_id: state.cloud.user?.id || null,
    created_at: new Date().toISOString()
  };
  const { error } = await supabaseClient.from(GROWTH_WAITLIST_TABLE).insert(payload);
  if (error) {
    queuePendingCloudWrite({ type: "waitlist", payload });
    trackEvent("waitlist_cloud_sync_failed");
    persist();
    setFeedback(`Waitlist stored locally; cloud sync failed: ${error.message}`, "info");
  } else {
    trackEvent("waitlist_cloud_synced");
    persist();
  }
}

async function syncFeedbackToCloud(entry) {
  // Feedback contains personal data; require an authenticated session before syncing to cloud.
  if (!supabaseClient || !state.cloud.user?.id) return;
  const payload = {
    owner_user_id: state.cloud.user?.id || null,
    user_name: entry.name,
    user_role: entry.role,
    score: entry.score,
    notes: entry.notes,
    referral_code: entry.referralCode || null,
    created_at: entry.at
  };
  const { error } = await supabaseClient.from(GROWTH_FEEDBACK_TABLE).insert(payload);
  if (error) {
    queuePendingCloudWrite({ type: "feedback", payload });
    trackEvent("feedback_cloud_sync_failed");
    persist();
    setFeedback(`Feedback stored locally; cloud sync failed: ${error.message}`, "info");
  } else {
    trackEvent("feedback_cloud_synced");
    persist();
  }
}

function queuePendingCloudWrite(entry) {
  state.growth.pendingCloudWrites.push({
    id: uid(),
    ...entry,
    queuedAt: new Date().toISOString()
  });
}

async function flushPendingCloudWrites() {
  if (flushInProgress) return;
  if (!supabaseClient && !initSupabaseClient()) return setFeedback("Configure cloud first.", "error");
  if (!state.cloud.user?.id) return setFeedback("Sign in before flushing cloud queue.", "error");
  if (!state.growth.pendingCloudWrites.length) return setFeedback("No pending cloud writes.", "info");
  flushInProgress = true;
  const remaining = [];
  try {
    for (const item of state.growth.pendingCloudWrites) {
      try {
        if (item.type === "invite") {
          const { error } = await supabaseClient.from(GROWTH_INVITES_TABLE).insert(item.payload);
          if (error) throw error;
        } else if (item.type === "waitlist") {
          const { error } = await supabaseClient.from(GROWTH_WAITLIST_TABLE).insert(item.payload);
          if (error) throw error;
        } else if (item.type === "feedback") {
          const { error } = await supabaseClient.from(GROWTH_FEEDBACK_TABLE).insert(item.payload);
          if (error) throw error;
        }
      } catch {
        remaining.push(item);
      }
    }
    state.growth.pendingCloudWrites = remaining;
  } finally {
    // Always release the lock — prevents a permanent deadlock if an outer error escapes
    flushInProgress = false;
  }
  persist();
  renderCloud();
  setFeedback(
    remaining.length === 0
      ? "Pending cloud writes flushed successfully."
      : `Some writes are still pending (${remaining.length}).`,
    remaining.length === 0 ? "success" : "info"
  );
}

function setupSyncMonitoring() {
  window.addEventListener("online", () => {
    updateSyncBanner();
    if (state.growth.pendingCloudWrites.length > 0) {
      void tryAutoFlushPendingWrites();
    }
  });
  window.addEventListener("offline", updateSyncBanner);
  updateSyncBanner();

  if (autoFlushTimer) clearInterval(autoFlushTimer);
  autoFlushTimer = window.setInterval(() => {
    void tryAutoFlushPendingWrites();
  }, 45000);
}

function updateSyncBanner() {
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  const pending = state.growth.pendingCloudWrites.length;
  const configured = Boolean(state.cloud.url && state.cloud.anonKey);
  const signedIn = Boolean(state.cloud.user?.id);

  let tone = "info";
  let text = "";

  if (!online) {
    tone = "error";
    text = `Sync status: offline. ${pending} pending write(s) will retry when online.`;
  } else if (!configured) {
    text = "Sync status: cloud not configured. Working in local mode.";
  } else if (!signedIn) {
    text = "Sync status: cloud configured, sign in to sync data.";
  } else if (pending > 0) {
    const oldestMinutes = getOldestPendingMinutes();
    const severe = pending >= 5 || oldestMinutes >= 10;
    tone = severe ? "error" : "info";
    text = severe
      ? `Sync alert: ${pending} pending write(s), oldest ${oldestMinutes} min. Immediate review recommended.`
      : `Sync status: online with ${pending} pending write(s). Auto-retry enabled.`;
  } else {
    tone = "success";
    text = "Sync status: online and fully synced.";
  }

  el.syncBanner.className = `feedback ${tone}`;
  el.syncBanner.textContent = text;
}

async function tryAutoFlushPendingWrites() {
  if (!navigator.onLine) return;
  if (flushInProgress) return;
  if (!state.growth.pendingCloudWrites.length) return;
  if (!state.cloud.url || !state.cloud.anonKey || !state.cloud.user?.id) return;
  if (!supabaseClient && !initSupabaseClient()) return;

  flushInProgress = true;
  const remaining = [];
  try {
    for (const item of state.growth.pendingCloudWrites) {
      try {
        if (item.type === "invite") {
          const { error } = await supabaseClient.from(GROWTH_INVITES_TABLE).insert(item.payload);
          if (error) throw error;
        } else if (item.type === "waitlist") {
          const { error } = await supabaseClient.from(GROWTH_WAITLIST_TABLE).insert(item.payload);
          if (error) throw error;
        } else if (item.type === "feedback") {
          const { error } = await supabaseClient.from(GROWTH_FEEDBACK_TABLE).insert(item.payload);
          if (error) throw error;
        }
      } catch {
        remaining.push(item);
      }
    }
    state.growth.pendingCloudWrites = remaining;
  } finally {
    flushInProgress = false;
  }
  persist();
  renderCloud();
}

function getOldestPendingMinutes() {
  if (!state.growth.pendingCloudWrites.length) return 0;
  const oldestTs = state.growth.pendingCloudWrites
    .map((item) => new Date(item.queuedAt || 0).getTime())
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)[0];
  if (!oldestTs) return 0;
  return Math.max(0, Math.floor((Date.now() - oldestTs) / 60000));
}

function downloadOpsSnapshot() {
  const snapshot = {
    generatedAt: new Date().toISOString(),
    session: state.session,
    counts: {
      dancers: state.dancers.length,
      sections: state.sections.length,
      assignments: state.assignments.length,
      references: state.references.length,
      takes: state.takes.length,
      invites: state.growth.inviteLog.length,
      waitlist: state.growth.waitlist.length,
      pendingCloudWrites: state.growth.pendingCloudWrites.length
    },
    growth: {
      referralCode: state.growth.referralCode,
      attribution: state.growth.attribution,
      weekly: getWeeklyGrowthStats()
    }
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `roam-ops-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  setFeedback("Ops snapshot downloaded.", "success");
}

function captureReferralAttributionFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;
    const normalized = ref.trim().toUpperCase();
    if (!normalized) return;
    if (!state.growth?.attribution?.referralCode) {
      if (!state.growth) state.growth = normalizeGrowth(undefined);
      state.growth.attribution = {
        referralCode: normalized,
        firstSeenAt: new Date().toISOString()
      };
      if (!state.growth.events) state.growth.events = [];
      state.growth.events.push({
        id: uid(),
        name: "referral_attribution_captured",
        at: new Date().toISOString(),
        meta: { referralCode: normalized }
      });
      persist();
    }
  } catch {
    // no-op: URL parsing failure should never block app startup
  }
}

function getWeeklyGrowthStats() {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const inLastWeek = (value) => {
    const ts = new Date(value || 0).getTime();
    return Number.isFinite(ts) && ts >= weekAgo;
  };

  const weeklyEvents = state.growth.events.filter((entry) => inLastWeek(entry.at));
  const weeklyInvites = state.growth.inviteLog.filter((entry) => inLastWeek(entry.at));
  const weeklyWaitlist = state.growth.waitlist.filter((entry) => inLastWeek(entry.at));
  const eventNames = new Set(weeklyEvents.map((entry) => entry.name));
  const activationNames = ["session_created", "section_added", "assignment_created", "take_logged"];
  const activationCount = activationNames.filter((name) => eventNames.has(name)).length === activationNames.length ? 1 : 0;
  const inviteToWaitlistRate = weeklyInvites.length
    ? Math.round((weeklyWaitlist.length / weeklyInvites.length) * 100)
    : 0;

  return {
    totalEvents: weeklyEvents.length,
    activations: activationCount,
    invites: weeklyInvites.length,
    waitlist: weeklyWaitlist.length,
    inviteToWaitlistRate
  };
}

function getReliabilityStats() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cloudFailureEvents = state.growth.events.filter((entry) => {
    const at = new Date(entry.at || 0).getTime();
    return at >= weekAgo && String(entry.name || "").includes("cloud_sync_failed");
  });
  const scores = state.growth.feedbackLog.map((entry) => Number(entry.score)).filter((v) => Number.isFinite(v));
  const avgFeedback = scores.length
    ? (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1)
    : "-";

  return {
    pendingWrites: state.growth.pendingCloudWrites.length,
    oldestPendingMinutes: getOldestPendingMinutes(),
    cloudFailuresLast7Days: cloudFailureEvents.length,
    avgFeedbackScore: avgFeedback
  };
}

function setupMediaLabHandlers() {
  el.musicFile.addEventListener("change", () => {
    const file = el.musicFile.files?.[0];
    if (!file) return;
    if (mediaRuntime.musicObjectUrl) {
      URL.revokeObjectURL(mediaRuntime.musicObjectUrl);
      mediaRuntime.musicObjectUrl = "";
    }
    const url = URL.createObjectURL(file);
    mediaRuntime.musicObjectUrl = url;
    el.musicPlayer.src = url;
    el.musicPlayer.playbackRate = 1;
    el.musicSpeed.value = "1";
    el.musicSpeedValue.textContent = "1.00x";
    mediaRuntime.musicLoopA = null;
    mediaRuntime.musicLoopB = null;
    mediaRuntime.tapTimes = [];
    mediaRuntime.lastDetectedBpm = null;
    el.bpmStatus.textContent = "BPM: not measured";
    el.mediaStatus.textContent = `Music loaded: ${file.name}`;
  });

  el.musicSpeed.addEventListener("input", () => {
    const rate = Number(el.musicSpeed.value) || 1;
    el.musicPlayer.playbackRate = rate;
    el.musicSpeedValue.textContent = `${rate.toFixed(2)}x`;
  });

  el.setMusicLoopA.addEventListener("click", () => {
    // el.musicPlayer.src returns the page URL when nothing is loaded — use mediaRuntime instead
    if (!mediaRuntime.musicObjectUrl) return setFeedback("Load a music file first.", "error");
    mediaRuntime.musicLoopA = el.musicPlayer.currentTime;
    setFeedback(`Music loop A set at ${formatSeconds(Math.floor(mediaRuntime.musicLoopA))}.`, "success");
  });

  el.setMusicLoopB.addEventListener("click", () => {
    if (!mediaRuntime.musicObjectUrl) return setFeedback("Load a music file first.", "error");
    mediaRuntime.musicLoopB = el.musicPlayer.currentTime;
    setFeedback(`Music loop B set at ${formatSeconds(Math.floor(mediaRuntime.musicLoopB))}.`, "success");
  });

  el.musicPlayer.addEventListener("timeupdate", () => {
    if (!el.musicLoopEnabled.checked) return;
    if (mediaRuntime.musicLoopA == null || mediaRuntime.musicLoopB == null) return;
    if (mediaRuntime.musicLoopB <= mediaRuntime.musicLoopA) return;
    if (el.musicPlayer.currentTime >= mediaRuntime.musicLoopB) {
      el.musicPlayer.currentTime = mediaRuntime.musicLoopA;
      if (!el.musicPlayer.paused) {
        void el.musicPlayer.play().catch(() => {});
      }
    }
  });

  el.tapBpm.addEventListener("click", () => {
    const now = Date.now();
    mediaRuntime.tapTimes.push(now);
    if (mediaRuntime.tapTimes.length > 8) {
      mediaRuntime.tapTimes.shift();
    }
    if (mediaRuntime.tapTimes.length < 2) {
      el.bpmStatus.textContent = "BPM: tap at least twice";
      return;
    }
    const intervals = [];
    for (let i = 1; i < mediaRuntime.tapTimes.length; i += 1) {
      intervals.push(mediaRuntime.tapTimes[i] - mediaRuntime.tapTimes[i - 1]);
    }
    const avgMs = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    if (avgMs <= 0) return;
    const bpm = Math.round(60000 / avgMs);
    mediaRuntime.lastDetectedBpm = bpm;
    el.bpmStatus.textContent = `BPM (tap): ${bpm}`;
  });

  el.analyzeBpm.addEventListener("click", async () => {
    if (!el.musicFile.files?.[0]) {
      setFeedback("Load a music file before BPM analysis.", "error");
      return;
    }
    const file = el.musicFile.files[0];
    try {
      const bpm = await estimateBpmFromAudioFile(file);
      if (!bpm) {
        el.bpmStatus.textContent = "BPM: unable to detect reliably";
        return;
      }
      mediaRuntime.lastDetectedBpm = bpm;
      el.bpmStatus.textContent = `BPM (analyzed): ${bpm}`;
    } catch {
      el.bpmStatus.textContent = "BPM: analysis failed";
    }
  });

  el.loadVideoUrl.addEventListener("click", () => {
    const url = el.videoUrlInput.value.trim();
    if (!url) return setFeedback("Enter a video URL first.", "error");
    if (!isLikelyUrl(url)) return setFeedback("Video URL must start with http:// or https://", "error");
    const platform = detectVideoPlatform(url);
    mediaRuntime.loadedVideoUrl = url;
    mediaRuntime.loadedVideoPlatform = platform;
    el.videoSourceType.textContent = `Video source: ${platform}`;

    if (el.syncVideoToReference.checked) {
      el.refUrl.value = url;
      if (!el.refTimestamp.value.trim()) {
        const parsed = parseTimestampFromUrl(url);
        if (parsed !== null) {
          el.refTimestamp.value = formatSeconds(parsed);
        }
      }
    }

    if (!isDirectVideoUrl(url)) {
      el.videoPlayer.removeAttribute("src");
      el.videoPlayer.load();
      updateExternalVideoButtonLabel();
      el.mediaStatus.textContent = "Platform link detected. Use Open External at timestamp.";
      return setFeedback("Smart handling enabled: open externally with current/parsed timestamp.", "info");
    }
    el.videoPlayer.src = url;
    el.videoPlayer.playbackRate = 1;
    el.videoSpeed.value = "1";
    el.videoSpeedValue.textContent = "1.00x";
    mediaRuntime.videoLoopA = null;
    mediaRuntime.videoLoopB = null;
    updateExternalVideoButtonLabel();
    el.mediaStatus.textContent = "Video loaded in player.";
    setFeedback("Video loaded. Mirror and A-B loop are now available.", "success");
  });

  el.videoMirrorEnabled.addEventListener("change", () => {
    el.videoPlayer.style.transform = el.videoMirrorEnabled.checked ? "scale(-1, 1)" : "scale(1, 1)";
  });

  el.videoSpeed.addEventListener("input", () => {
    const rate = Number(el.videoSpeed.value) || 1;
    el.videoPlayer.playbackRate = rate;
    el.videoSpeedValue.textContent = `${rate.toFixed(2)}x`;
  });

  el.setVideoLoopA.addEventListener("click", () => {
    // el.videoPlayer.src returns the page URL when nothing is loaded — use mediaRuntime instead
    if (!mediaRuntime.loadedVideoUrl) return setFeedback("Load a video first.", "error");
    mediaRuntime.videoLoopA = el.videoPlayer.currentTime;
    setFeedback(`Video loop A set at ${formatSeconds(Math.floor(mediaRuntime.videoLoopA))}.`, "success");
  });

  el.setVideoLoopB.addEventListener("click", () => {
    if (!mediaRuntime.loadedVideoUrl) return setFeedback("Load a video first.", "error");
    mediaRuntime.videoLoopB = el.videoPlayer.currentTime;
    setFeedback(`Video loop B set at ${formatSeconds(Math.floor(mediaRuntime.videoLoopB))}.`, "success");
  });

  el.videoPlayer.addEventListener("timeupdate", () => {
    // A-B loop — must run every timeupdate for precise boundary detection
    if (el.videoLoopEnabled.checked
        && mediaRuntime.videoLoopA != null
        && mediaRuntime.videoLoopB != null
        && mediaRuntime.videoLoopB > mediaRuntime.videoLoopA
        && el.videoPlayer.currentTime >= mediaRuntime.videoLoopB) {
      el.videoPlayer.currentTime = mediaRuntime.videoLoopA;
      if (!el.videoPlayer.paused) {
        void el.videoPlayer.play().catch(() => {});
      }
    }

    // Throttle reference sync and button label to once per second — timeupdate fires
    // 4-15 Hz and these DOM writes are not needed at higher frequency.
    const currentSec = Math.floor(el.videoPlayer.currentTime || 0);
    if (currentSec !== mediaRuntime.lastRefSyncSec) {
      mediaRuntime.lastRefSyncSec = currentSec;
      if (el.syncVideoToReference.checked && mediaRuntime.loadedVideoUrl) {
        el.refUrl.value = mediaRuntime.loadedVideoUrl;
        el.refTimestamp.value = formatSeconds(currentSec);
      }
      updateExternalVideoButtonLabel();
    }
  });

  el.openVideoExternally.addEventListener("click", () => {
    const url = (mediaRuntime.loadedVideoUrl || el.videoUrlInput.value || "").trim();
    if (!url) return setFeedback("Enter a video URL first.", "error");
    if (!isLikelyUrl(url)) return setFeedback("Video URL must start with http:// or https://", "error");
    const currentTime = Math.max(0, Math.floor(el.videoPlayer.currentTime || 0));
    const parsedTime = parseTimestampFromUrl(url);
    const seconds = currentTime > 0 ? currentTime : (parsedTime ?? 0);
    const externalUrl = appendTimestampToUrl(url, seconds);
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  });

  el.saveVideoTimeToReference.addEventListener("click", () => {
    const source = (mediaRuntime.loadedVideoUrl || el.videoUrlInput.value || "").trim();
    if (!source) return setFeedback("Load or enter a video URL first.", "error");
    const currentTime = Math.max(0, Math.floor(el.videoPlayer.currentTime || 0));
    const parsedTime = parseTimestampFromUrl(source);
    const seconds = currentTime > 0 ? currentTime : (parsedTime ?? 0);
    el.refUrl.value = source;
    el.refTimestamp.value = formatSeconds(seconds);
    setFeedback(`Reference synced at ${formatSeconds(seconds)}.`, "success");
  });

  el.syncVideoToReference.addEventListener("change", () => {
    if (!el.syncVideoToReference.checked) return;
    const source = (mediaRuntime.loadedVideoUrl || el.videoUrlInput.value || "").trim();
    if (source) {
      el.refUrl.value = source;
      const sec = Math.max(0, Math.floor(el.videoPlayer.currentTime || parseTimestampFromUrl(source) || 0));
      el.refTimestamp.value = formatSeconds(sec);
    }
  });
}

async function estimateBpmFromAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    const buffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    if (!channelData.length || sampleRate <= 0) return null;

    const step = Math.max(1, Math.floor(sampleRate * 0.05));
    const energies = [];
    for (let i = 0; i < channelData.length; i += step) {
      let sum = 0;
      for (let j = i; j < i + step && j < channelData.length; j += 1) {
        const value = channelData[j];
        sum += value * value;
      }
      energies.push(Math.sqrt(sum / step));
    }
    if (!energies.length) return null;
    const avgEnergy = energies.reduce((s, v) => s + v, 0) / energies.length;
    const threshold = avgEnergy * 1.35;
    const peakIndices = [];
    for (let i = 1; i < energies.length - 1; i += 1) {
      if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] >= energies[i + 1]) {
        peakIndices.push(i);
      }
    }
    if (peakIndices.length < 2) return null;

    const intervals = [];
    for (let i = 1; i < peakIndices.length; i += 1) {
      const diffWindows = peakIndices[i] - peakIndices[i - 1];
      if (diffWindows <= 0) continue;
      const seconds = diffWindows * 0.05;
      if (seconds > 0.2 && seconds < 2.5) {
        intervals.push(seconds);
      }
    }
    if (!intervals.length) return null;
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    let bpm = Math.round(60 / avgInterval);
    while (bpm < 70) bpm *= 2;
    while (bpm > 190) bpm = Math.round(bpm / 2);
    return bpm;
  } finally {
    void audioCtx.close();
  }
}

function onDancerAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const dancer = state.dancers.find((item) => item.id === button.dataset.id);
  if (!dancer) return;

  if (button.dataset.action === "edit") {
    const li = button.closest("li");
    const info = li.querySelector(".item-info");
    info.innerHTML = `<div class="inline-edit">
      <input class="edit-name" value="${escapeAttr(dancer.name)}" placeholder="Name" aria-label="Dancer name">
      <input class="edit-role" value="${escapeAttr(dancer.role)}" placeholder="Role" aria-label="Role">
      <button class="secondary" data-action="save-dancer" data-id="${escapeAttr(dancer.id)}">Save</button>
      <button class="secondary" data-action="cancel-dancer" data-id="${escapeAttr(dancer.id)}">Cancel</button>
    </div>`;
    info.querySelector(".edit-name").focus();
    return;
  }

  if (button.dataset.action === "save-dancer") {
    const li = button.closest("li");
    const nextName = li.querySelector(".edit-name").value.trim();
    const nextRole = li.querySelector(".edit-role").value.trim();
    if (!nextName) return setFeedback("Dancer name cannot be empty.", "error");
    dancer.name = nextName;
    dancer.role = nextRole || "";
    persist();
    renderAll();
    return setFeedback("Dancer updated.", "success");
  }

  if (button.dataset.action === "cancel-dancer") {
    renderDancers();
    return;
  }

  if (button.dataset.action === "delete") {
    state.dancers = state.dancers.filter((item) => item.id !== dancer.id);
    state.assignments = state.assignments.filter((item) => item.dancerId !== dancer.id);
    persist();
    renderAll();
    setFeedback("Dancer removed.", "success");
  }
}

function onSectionAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const section = state.sections.find((item) => item.id === button.dataset.id);
  if (!section) return;

  if (button.dataset.action === "edit") {
    const li = button.closest("li");
    const info = li.querySelector(".item-info");
    info.innerHTML = `<div class="inline-edit">
      <input class="edit-name" value="${escapeAttr(section.name)}" placeholder="Section name" aria-label="Section name">
      <button class="secondary" data-action="save-section" data-id="${escapeAttr(section.id)}">Save</button>
      <button class="secondary" data-action="cancel-section" data-id="${escapeAttr(section.id)}">Cancel</button>
    </div>`;
    info.querySelector(".edit-name").focus();
    return;
  }

  if (button.dataset.action === "save-section") {
    const li = button.closest("li");
    const nextName = li.querySelector(".edit-name").value.trim();
    if (!nextName) return setFeedback("Section name cannot be empty.", "error");
    section.name = nextName;
    persist();
    renderAll();
    return setFeedback("Section updated.", "success");
  }

  if (button.dataset.action === "cancel-section") {
    renderSections();
    return;
  }

  if (button.dataset.action === "delete") {
    state.sections = state.sections.filter((item) => item.id !== section.id);
    state.assignments = state.assignments.filter((item) => item.sectionId !== section.id);
    state.references = state.references.filter((item) => item.sectionId !== section.id);
    state.takes = state.takes.filter((item) => item.sectionId !== section.id);
    persist();
    renderAll();
    setFeedback("Section removed.", "success");
  }
}

function onAssignmentAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const assignment = state.assignments.find((item) => item.id === button.dataset.id);
  if (!assignment) return;

  if (button.dataset.action === "delete") {
    state.assignments = state.assignments.filter((item) => item.id !== assignment.id);
    persist();
    renderAll();
    return setFeedback("Assignment removed.", "success");
  }
}

function onAssignmentChange(event) {
  // Due date input (type=date) change
  const dateInput = event.target.closest("input[data-action='due']");
  if (dateInput) {
    const assignment = state.assignments.find((item) => item.id === dateInput.dataset.id);
    if (!assignment) return;
    const trimmed = dateInput.value.trim();
    // Browser date inputs already enforce YYYY-MM-DD; guard anyway
    if (trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return setFeedback("Invalid date format.", "error");
    }
    assignment.dueDate = trimmed;
    assignment.updatedAt = new Date().toISOString();
    persist();
    renderAssignments();
    return setFeedback(trimmed ? `Due date set to ${trimmed}.` : "Due date cleared.", "success");
  }

  const select = event.target.closest("select[data-action='status']");
  if (!select) return;
  const assignment = state.assignments.find((item) => item.id === select.dataset.id);
  if (!assignment) return;
  const nextStatus = validAssignmentStatus(select.value);
  if (assignment.status === nextStatus) return;
  assignment.status = nextStatus;
  const now = new Date().toISOString();
  assignment.updatedAt = now;
  assignment.history = Array.isArray(assignment.history) ? assignment.history : [];
  assignment.history.push({ status: nextStatus, at: now });
  persist();
  renderAll();
  setFeedback("Assignment status updated.", "success");
}

function onReferenceAction(event) {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) return;
  state.references = state.references.filter((item) => item.id !== button.dataset.id);
  persist();
  renderAll();
  setFeedback("Reference removed.", "success");
}

function onTakeAction(event) {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) return;
  state.takes = state.takes.filter((item) => item.id !== button.dataset.id);
  persist();
  renderAll();
  setFeedback("Take removed.", "success");
}

function renderAll() {
  renderText(); // renderText() calls renderSession() internally — no duplicate call needed
  renderSelectors();
  renderOnboarding();
  renderCloud();
  renderDancers();
  renderSections();
  renderAssignments();
  renderReferences();
  renderTakeLog();
  renderMySections();
  renderAnalytics();
  renderGrowth();
}

function renderText() {
  const t = I18N[state.locale] || I18N.en;
  el.title.textContent = t.title;
  document.title = t.title;
  el.languageLabel.textContent = t.language;
  el.sessionTitle.textContent = t.sessionTitle;
  el.createSession.textContent = t.createSession;
  el.onboardingTitle.textContent = t.onboardingTitle;
  el.cloudTitle.textContent = t.cloudTitle;
  el.dancerTitle.textContent = t.dancerTitle;
  el.addDancer.textContent = t.addDancer;
  el.sectionTitle.textContent = t.sectionTitle;
  el.addSection.textContent = t.addSection;
  el.assignTitle.textContent = t.assignTitle;
  el.createAssignment.textContent = t.assign;
  el.referenceTitle.textContent = t.referenceTitle;
  el.addReference.textContent = t.saveReference;
  el.mediaLabTitle.textContent = t.mediaLabTitle;
  el.shareTitle.textContent = t.shareTitle;
  el.takesTitle.textContent = t.takesTitle;
  el.addTake.textContent = t.addTake;
  el.mySectionsTitle.textContent = t.mySectionsTitle;
  el.analyticsTitle.textContent = t.analyticsTitle;
  el.growthTitle.textContent = t.growthTitle;
  renderSession();
}

function renderSession() {
  // Update topbar session pill
  const pill = document.getElementById("sessionPill");
  if (pill) {
    if (state.session?.name) {
      pill.textContent = state.session.name;
      pill.classList.add("active");
    } else {
      pill.textContent = "No Session";
      pill.classList.remove("active");
    }
  }
  const t = I18N[state.locale] || I18N.en;
  el.activeSessionText.textContent = state.session ? `${t.activeSession}: ${state.session.name}` : t.noSession;
}

function renderOnboarding() {
  const checklist = [
    { label: "Create first session", done: !!state.session },
    { label: "Add at least one dancer", done: state.dancers.length > 0 },
    { label: "Add at least one section", done: state.sections.length > 0 },
    { label: "Create one assignment", done: state.assignments.length > 0 },
    { label: "Save one reference", done: state.references.length > 0 },
    { label: "Log one take", done: state.takes.length > 0 }
  ];
  const progressDone = checklist.filter((item) => item.done).length;
  el.onboardingList.innerHTML = checklist.map((item) => `
    <li class="item">
      <div class="check">
        <input type="checkbox" disabled ${item.done ? "checked" : ""}>
        <span>${escapeHtml(item.label)}</span>
      </div>
      <div class="meta">${item.done ? "done" : "pending"}</div>
    </li>`).join("");
  el.completeOnboarding.disabled = state.onboarding.completed || progressDone < checklist.length;
}

function renderCloud() {
  updateCloudStatus();
  el.cloudQueueStatus.textContent = `Pending cloud writes: ${state.growth.pendingCloudWrites.length}`;
  updateSyncBanner();
}

function renderDancers() {
  el.dancerList.innerHTML = "";
  if (!state.dancers.length) return renderEmpty(el.dancerList, "No dancers yet.");
  for (const dancer of state.dancers) {
    el.dancerList.insertAdjacentHTML("beforeend", `
      <li class="item" data-id="${escapeAttr(dancer.id)}">
        <div class="item-info"><strong>${escapeHtml(dancer.name)}</strong><div class="meta">${escapeHtml(dancer.role) || "—"}</div></div>
        <div class="item-actions">
          <button class="secondary" data-action="edit" data-id="${escapeAttr(dancer.id)}">Edit</button>
          <button class="danger" data-action="delete" data-id="${escapeAttr(dancer.id)}">Delete</button>
        </div>
      </li>`);
  }
}

function renderSections() {
  el.sectionList.innerHTML = "";
  if (!state.sections.length) return renderEmpty(el.sectionList, "No sections yet.");
  for (const section of state.sections) {
    el.sectionList.insertAdjacentHTML("beforeend", `
      <li class="item" data-id="${escapeAttr(section.id)}">
        <div class="item-info"><strong>${escapeHtml(section.name)}</strong><div class="meta">status: ${escapeHtml(section.status)}</div></div>
        <div class="item-actions">
          <button class="secondary" data-action="edit" data-id="${escapeAttr(section.id)}">Edit</button>
          <button class="danger" data-action="delete" data-id="${escapeAttr(section.id)}">Delete</button>
        </div>
      </li>`);
  }
}

function renderSelectors() {
  fillSelect(el.assignSection, state.sections, "name", "No sections");
  fillSelect(el.refSection, state.sections, "name", "No sections");
  fillSelect(el.shareSection, state.sections, "name", "No sections");
  fillSelect(el.takeSection, state.sections, "name", "No sections");
  fillSelect(el.assignDancer, state.dancers, "name", "No dancers");
  fillSelect(el.mySectionsDancer, state.dancers, "name", "No dancers");
}

function renderAssignments() {
  el.assignmentList.innerHTML = "";
  if (!state.assignments.length) return renderEmpty(el.assignmentList, "No assignments yet.");
  for (const item of state.assignments) {
    const section = state.sections.find((row) => row.id === item.sectionId);
    const dancer = state.dancers.find((row) => row.id === item.dancerId);
    if (!section || !dancer) continue;
    const history = Array.isArray(item.history) && item.history.length
      ? item.history.map((entry) => `${entry.status} (${toLocalTime(entry.at)})`).join(" -> ")
      : "no history";
    el.assignmentList.insertAdjacentHTML("beforeend", `
      <li class="item">
        <div>
          <strong>${escapeHtml(section.name)} -> ${escapeHtml(dancer.name)}</strong>
          <div class="meta">${item.dueDate ? `due ${escapeHtml(item.dueDate)}` : "no due date"} | updated ${toLocalTime(item.updatedAt)}</div>
          <div class="meta">history: ${escapeHtml(history)}</div>
        </div>
        <div class="item-actions">
          <select data-action="status" data-id="${escapeAttr(item.id)}">${buildStatusOptions(ASSIGNMENT_STATUSES, item.status)}</select>
          <input type="date" class="due-date-input" data-action="due" data-id="${escapeAttr(item.id)}" value="${escapeAttr(item.dueDate || '')}" title="Due date">
          <button class="danger" data-action="delete" data-id="${escapeAttr(item.id)}">Delete</button>
        </div>
      </li>`);
  }
}

function renderReferences() {
  el.referenceList.innerHTML = "";
  if (!state.references.length) return renderEmpty(el.referenceList, "No references yet.");
  for (const row of state.references) {
    const section = state.sections.find((item) => item.id === row.sectionId);
    if (!section) continue;
    // Only render a clickable link for safe http(s) URLs; fall back to a muted label
    const linkHtml = isSafeUrl(row.url)
      ? `<a class="muted-link" href="${escapeAttr(row.url)}" target="_blank" rel="noopener noreferrer">Open</a>`
      : `<span class="meta">(no link)</span>`;
    el.referenceList.insertAdjacentHTML("beforeend", `
      <li class="item">
        <div><strong>${escapeHtml(section.name)}</strong><div class="meta">timestamp: ${escapeHtml(row.timestamp)}</div></div>
        <div class="item-actions">
          ${linkHtml}
          <button class="danger" data-action="delete" data-id="${escapeAttr(row.id)}">Delete</button>
        </div>
      </li>`);
  }
}

function renderTakeLog() {
  el.takeList.innerHTML = "";
  if (!state.takes.length) return renderEmpty(el.takeList, "No takes logged yet.");
  const sorted = [...state.takes].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  for (const row of sorted) {
    const section = state.sections.find((item) => item.id === row.sectionId);
    if (!section) continue;
    el.takeList.insertAdjacentHTML("beforeend", `
      <li class="item">
        <div><strong>${escapeHtml(section.name)} · ${escapeHtml(row.type)}</strong><div class="meta">${row.durationSec}s · ${toLocalTime(row.createdAt)}</div><div class="meta">${escapeHtml(row.notes || "-")}</div></div>
        <div class="item-actions"><button class="danger" data-action="delete" data-id="${escapeAttr(row.id)}">Delete</button></div>
      </li>`);
  }
}

function renderMySections() {
  el.mySectionsList.innerHTML = "";
  const dancerId = el.mySectionsDancer.value;
  if (!dancerId) return renderEmpty(el.mySectionsList, "Choose a dancer to view assigned sections.");
  const items = state.assignments.filter((row) => row.dancerId === dancerId);
  if (!items.length) return renderEmpty(el.mySectionsList, "No sections assigned to this dancer.");
  for (const item of items) {
    const section = state.sections.find((row) => row.id === item.sectionId);
    if (!section) continue;
    el.mySectionsList.insertAdjacentHTML("beforeend", `
      <li class="item"><div><strong>${escapeHtml(section.name)}</strong><div class="meta">status: ${escapeHtml(item.status)}</div><div class="meta">${item.dueDate ? `due: ${escapeHtml(item.dueDate)}` : "due: -"}</div></div></li>`);
  }
}

function renderAnalytics() {
  const totalTakes = state.takes.length;
  const totalDuration = state.takes.reduce((sum, row) => sum + (Number(row.durationSec) || 0), 0);
  const readyAssignments = state.assignments.filter((row) => row.status === "ready").length;
  const sectionsWithTakes = new Set(state.takes.map((row) => row.sectionId)).size;
  const checklistDone = [
    !!state.session,
    state.dancers.length > 0,
    state.sections.length > 0,
    state.assignments.length > 0,
    state.references.length > 0,
    state.takes.length > 0
  ].filter(Boolean).length;

  const cards = [
    { label: "Takes Logged", value: totalTakes },
    { label: "Practice Minutes", value: Math.round(totalDuration / 60) },
    { label: "Ready Assignments", value: readyAssignments },
    { label: "Sections Practiced", value: sectionsWithTakes },
    { label: "Onboarding Steps Done", value: `${checklistDone}/6` }
  ];
  el.analyticsGrid.innerHTML = cards.map((card) => `
    <div class="kpi"><div class="kpi-value">${escapeHtml(card.value)}</div><div class="kpi-label">${escapeHtml(card.label)}</div></div>
  `).join("");
}

function renderGrowth() {
  if (!state.growth.referralCode) {
    state.growth.referralCode = makeReferralCode();
    persist(); // ensure the auto-generated code survives a reload
  }
  el.referralCode.value = state.growth.referralCode;
  // Derive from inviteLog.length (single source of truth) to avoid counter drift
  const inviteCount = state.growth.inviteLog.length;
  el.inviteStatus.textContent = inviteCount > 0
    ? `${inviteCount} invite(s) sent`
    : "No invites sent yet";
  el.feedbackStatus.textContent = state.growth.feedbackLog.length > 0
    ? `${state.growth.feedbackLog.length} feedback response(s) captured`
    : "No feedback captured yet.";

  const onboardingDone = [
    !!state.session,
    state.dancers.length > 0,
    state.sections.length > 0,
    state.assignments.length > 0,
    state.references.length > 0,
    state.takes.length > 0
  ].filter(Boolean).length;

  const cards = [
    { label: "Referral Code", value: state.growth.referralCode, hint: "share with choreographers" },
    { label: "Invites Sent", value: state.growth.inviteLog.length, hint: "top funnel outreach" },
    { label: "Waitlist Leads", value: state.growth.waitlist.length, hint: "captured prospects" },
    { label: "Share Packs", value: state.growth.sharePacksGenerated, hint: "collaboration triggers" },
    { label: "Activation", value: `${onboardingDone}/6`, hint: "first-session completion" },
    { label: "Attribution Ref", value: state.growth.attribution.referralCode || "-", hint: "source referral" }
  ];

  el.growthFunnel.innerHTML = cards.map((card) => `
    <div class="kpi">
      <div class="kpi-value">${escapeHtml(card.value)}</div>
      <div class="kpi-label">${escapeHtml(card.label)}</div>
      <small>${escapeHtml(card.hint)}</small>
    </div>
  `).join("");

  const weekly = getWeeklyGrowthStats();
  const weeklyCards = [
    { label: "Weekly Events", value: weekly.totalEvents, hint: "all tracked actions" },
    { label: "Weekly Activations", value: weekly.activations, hint: "session + section + assignment + take" },
    { label: "Weekly Invites", value: weekly.invites, hint: "invite sends this week" },
    { label: "Weekly Waitlist", value: weekly.waitlist, hint: "new leads this week" },
    { label: "Invite->Waitlist", value: `${weekly.inviteToWaitlistRate}%`, hint: "conversion quality" }
  ];
  el.weeklyReport.innerHTML = weeklyCards.map((card) => `
    <div class="kpi">
      <div class="kpi-value">${escapeHtml(card.value)}</div>
      <div class="kpi-label">${escapeHtml(card.label)}</div>
      <small>${escapeHtml(card.hint)}</small>
    </div>
  `).join("");

  const reliability = getReliabilityStats();
  const reliabilityCards = [
    { label: "Pending Writes", value: reliability.pendingWrites, hint: "should trend to 0" },
    { label: "Oldest Pending (min)", value: reliability.oldestPendingMinutes, hint: "retry health" },
    { label: "Cloud Sync Failures (7d)", value: reliability.cloudFailuresLast7Days, hint: "error pressure" },
    { label: "Avg Feedback Score", value: reliability.avgFeedbackScore, hint: "user validation quality" }
  ];
  el.reliabilityReport.innerHTML = reliabilityCards.map((card) => `
    <div class="kpi">
      <div class="kpi-value">${escapeHtml(card.value)}</div>
      <div class="kpi-label">${escapeHtml(card.label)}</div>
      <small>${escapeHtml(card.hint)}</small>
    </div>
  `).join("");
}

function parseTimestampFromUrl(urlString) {
  try {
    const url = new URL(urlString);
    const candidates = [
      url.searchParams.get("t"),
      url.searchParams.get("start"),
      url.searchParams.get("time_continue"),
      url.hash.startsWith("#t=") ? url.hash.slice(3) : null,
      url.hash.startsWith("#start=") ? url.hash.slice(7) : null
    ];
    for (const value of candidates) {
      const seconds = parseTimestampToken(value);
      if (seconds !== null) return seconds;
    }
    return null;
  } catch {
    return null;
  }
}

function parseTimestampToken(token) {
  if (!token) return null;
  const text = String(token).trim().toLowerCase();
  if (!text) return null;
  if (/^\d+$/.test(text)) return Number(text);
  const hms = text.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (hms && (hms[1] || hms[2] || hms[3])) return Number(hms[1] || 0) * 3600 + Number(hms[2] || 0) * 60 + Number(hms[3] || 0);
  if (text.includes(":")) {
    const parts = text.split(":").map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

function formatSeconds(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return hh > 0 ? `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}` : `${pad2(mm)}:${pad2(ss)}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function exportSyncState() {
  return {
    locale: state.locale,
    session: state.session,
    dancers: state.dancers,
    sections: state.sections,
    assignments: state.assignments,
    references: state.references,
    takes: state.takes,
    onboarding: state.onboarding,
    growth: state.growth,
    exportedAt: new Date().toISOString()
  };
}

function hydrateFromPayload(payload) {
  if (!payload || typeof payload !== "object") return;
  state.locale = payload.locale || state.locale;
  state.session = payload.session || null;
  state.dancers = normalizeDancers(payload.dancers);
  state.sections = normalizeSections(payload.sections);
  state.assignments = normalizeAssignments(payload.assignments);
  state.references = normalizeReferences(payload.references);
  state.takes = normalizeTakes(payload.takes);
  state.onboarding = normalizeOnboarding(payload.onboarding);
  state.growth = normalizeGrowth(payload.growth);
}

function toBase64Json(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64Json(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function renderEmpty(target, text) {
  target.innerHTML = `<li class="empty">${escapeHtml(text)}</li>`;
}

function buildStatusOptions(statuses, current) {
  return statuses.map((status) => `<option value="${escapeAttr(status)}"${status === current ? " selected" : ""}>${escapeHtml(status)}</option>`).join("");
}

function fillSelect(select, items, labelField, emptyLabel) {
  const current = select.value;
  select.innerHTML = "";
  if (!items.length) {
    select.innerHTML = `<option value="">${escapeHtml(emptyLabel)}</option>`;
    return;
  }
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item[labelField];
    select.appendChild(option);
  }
  if (current && items.some((item) => item.id === current)) select.value = current;
}

function setFeedback(message, tone = "info") {
  el.feedback.className = `feedback ${tone}`;
  el.feedback.textContent = message;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || loadLegacyStateRaw();
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return {
      locale: parsed.locale || "en",
      session: parsed.session || null,
      dancers: normalizeDancers(parsed.dancers),
      sections: normalizeSections(parsed.sections),
      assignments: normalizeAssignments(parsed.assignments),
      references: normalizeReferences(parsed.references),
      takes: normalizeTakes(parsed.takes),
      onboarding: normalizeOnboarding(parsed.onboarding),
      cloud: normalizeCloud(parsed.cloud),
      growth: normalizeGrowth(parsed.growth)
    };
  } catch {
    return initialState();
  }
}

function loadLegacyStateRaw() {
  for (const key of LEGACY_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

function initialState() {
  return {
    locale: "en",
    session: null,
    dancers: [],
    sections: [],
    assignments: [],
    references: [],
    takes: [],
    onboarding: { completed: false },
    cloud: { url: "", anonKey: "", user: null },
    growth: {
      referralCode: makeReferralCode(),
      invitesSent: 0,
      inviteLog: [],
      waitlist: [],
      feedbackLog: [],
      sharePacksGenerated: 0,
      sessionCreates: 0,
      events: [],
      pendingCloudWrites: [],
      attribution: {
        referralCode: "",
        firstSeenAt: ""
      }
    }
  };
}

function normalizeDancers(rows) {
  if (!Array.isArray(rows)) return [];
  // Whitelist only known fields to prevent prototype pollution from untrusted payloads
  return rows.filter((row) => row != null && typeof row === "object").map((row) => ({
    id: row.id || uid(),
    name: String(row.name || ""),
    role: String(row.role || "")
  }));
}

function normalizeSections(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row != null && typeof row === "object").map((row) => ({ id: row.id || uid(), name: row.name || "Untitled", status: validSectionStatus(row.status) }));
}

function normalizeAssignments(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row != null && typeof row === "object").map((row) => {
    const status = validAssignmentStatus(row.status);
    const updatedAt = row.updatedAt || new Date().toISOString();
    const history = Array.isArray(row.history) && row.history.length
      ? row.history.map((entry) => ({ status: validAssignmentStatus(entry.status), at: entry.at || updatedAt }))
      : [{ status, at: updatedAt }];
    return {
      id: row.id || uid(),
      sectionId: row.sectionId,
      dancerId: row.dancerId,
      status,
      dueDate: row.dueDate || "",
      updatedAt,
      history
    };
  });
}

function normalizeReferences(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row != null && typeof row === "object").map((row) => ({
    id: row.id || uid(),
    sectionId: row.sectionId,
    // Strip any non-http(s) URL (e.g. javascript:, data:) to prevent XSS via href
    url: isSafeUrl(row.url) ? (row.url || "") : "",
    timestamp: row.timestamp || "00:00"
  }));
}

function normalizeTakes(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row != null && typeof row === "object").map((row) => ({
    id: row.id || uid(),
    sectionId: row.sectionId,
    type: TAKE_TYPES.includes(row.type) ? row.type : "MINE",
    durationSec: Math.max(1, Number(row.durationSec) || 1),
    notes: row.notes || "",
    createdAt: row.createdAt || new Date().toISOString()
  }));
}

function normalizeOnboarding(value) {
  return { completed: !!value?.completed };
}

function normalizeCloud(value) {
  return {
    url: value?.url || "",
    anonKey: value?.anonKey || "",
    user: value?.user || null
  };
}

function normalizeGrowth(value) {
  return {
    referralCode: value?.referralCode || makeReferralCode(),
    invitesSent: Number(value?.invitesSent) || 0,
    inviteLog: Array.isArray(value?.inviteLog) ? value.inviteLog : [],
    waitlist: Array.isArray(value?.waitlist) ? value.waitlist : [],
    feedbackLog: Array.isArray(value?.feedbackLog) ? value.feedbackLog : [],
    sharePacksGenerated: Number(value?.sharePacksGenerated) || 0,
    sessionCreates: Number(value?.sessionCreates) || 0,
    events: Array.isArray(value?.events) ? value.events : [],
    pendingCloudWrites: Array.isArray(value?.pendingCloudWrites) ? value.pendingCloudWrites : [],
    attribution: {
      referralCode: value?.attribution?.referralCode || "",
      firstSeenAt: value?.attribution?.firstSeenAt || ""
    }
  };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    if (err && (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22)) {
      // Storage full — aggressively trim event log and retry once
      state.growth.events = state.growth.events.slice(-100);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setFeedback("Storage nearly full — old event log trimmed to save state.", "info");
      } catch {
        setFeedback("Storage full. Export an ops snapshot and clear old data.", "error");
      }
    }
  }
}

function validAssignmentStatus(status) {
  return ASSIGNMENT_STATUSES.includes(status) ? status : "unseen";
}

function validSectionStatus(status) {
  return SECTION_STATUSES.includes(status) ? status : "empty";
}

function uid() {
  // crypto.randomUUID() is collision-free and available in all modern browsers
  return crypto.randomUUID();
}

function makeReferralCode() {
  return `ROAM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function buildReferralLink(code) {
  return `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(code)}`;
}

function appendTimestampToUrl(rawUrl, seconds) {
  // All supported platforms (YouTube, Bilibili) use ?t=<seconds>.
  // XHS/Xiaohongshu does not support URL-based timestamps — users seek manually after opening.
  try {
    const url = new URL(rawUrl);
    url.searchParams.set("t", String(seconds));
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function detectVideoPlatform(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("bilibili.com")) return "bilibili";
    if (host.includes("xiaohongshu.com") || host.includes("xhslink.com")) return "xiaohongshu";
    return "direct-or-other";
  } catch {
    return "unknown";
  }
}

function updateExternalVideoButtonLabel() {
  const source = (mediaRuntime.loadedVideoUrl || el.videoUrlInput.value || "").trim();
  if (!source) {
    el.openVideoExternally.textContent = "Open External";
    return;
  }
  const current = Math.max(0, Math.floor(el.videoPlayer.currentTime || 0));
  const parsed = parseTimestampFromUrl(source);
  const seconds = current > 0 ? current : (parsed ?? 0);
  el.openVideoExternally.textContent = `Open External @ ${formatSeconds(seconds)}`;
}

// Strict URL check — rejects javascript:, data:, and any non-http(s) scheme
// that could execute code when placed in an href attribute.
function isSafeUrl(value) {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function isLikelyUrl(value) {
  return isSafeUrl(value);
}

function isDirectVideoUrl(value) {
  try {
    const url = new URL(value);
    const path = url.pathname.toLowerCase();
    return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".ogg") || path.endsWith(".mov");
  } catch {
    return false;
  }
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toLocalTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
