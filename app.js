(function () {
  const STORAGE_KEY = "nomichizu.records.v0.1";
  const SETTINGS_KEY = "sakeichizu.displaySettings.v0.4";
  const TAG_SETTINGS_KEY = "sakeichizu.tagSettings.v1.4";
  const EXPORT_VERSION = "1.4";
  const AKITA_CITY = [39.7186, 140.1024];
  const MAX_PHOTOS_PER_SPOT = 3;
  const MAX_PHOTO_EDGE = 1280;
  const JPEG_QUALITY = 0.72;
  const SAKE_TYPES = ["日本酒", "ビール", "焼酎", "ワイン", "ウイスキー", "カクテル", "その他"];
  const DRINK_COUNT_TYPES = ["水", "ビール", "日本酒", "焼酎", "ワイン", "ウイスキー", "ハイボール", "カクテル", "サワー", "ソフトドリンク", "その他"];
  const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
  const DEFAULT_AREAS = ["秋田駅前", "川反", "大町", "山王", "土崎", "能代", "仙台", "東京", "旅行先", "その他"];
  const REGION_TAGS = ["秋田駅前", "川反", "大町", "山王", "土崎", "能代", "仙台", "東京", "旅行先"];
  const DEFAULT_TAGS = [
    "一人飲み", "友人", "職場", "家族", "旅行", "出張", "二次会", "三次会",
    "秋田駅前", "川反", "大町", "山王", "土崎", "能代", "仙台", "東京",
    "日本酒", "ビール", "焼鳥", "ラーメン", "バー", "再訪したい", "接待向き", "記念日"
  ];
  const RATING_RANKS = ["S", "A", "B", "C", "D"];
  const RATING_NUMBER_TO_RANK = { 5: "S", 4: "A", 3: "B", 2: "C", 1: "D" };
  const RATING_RANK_TO_NUMBER = { S: 5, A: 4, B: 3, C: 2, D: 1 };

  const CATEGORY_STYLES = {
    "居酒屋": { color: "#a9442a", short: "居" },
    "日本酒": { color: "#356a48", short: "酒" },
    "焼鳥": { color: "#b66b22", short: "焼" },
    "バー": { color: "#4c4f88", short: "Bar" },
    "ラーメン": { color: "#b63d49", short: "麺" },
    "カフェ": { color: "#7b5b3a", short: "茶" },
    "酒屋": { color: "#2e7590", short: "販" },
    "その他": { color: "#6f6a60", short: "他" }
  };

  const state = {
    sessions: [],
    activeSessionId: null,
    markers: new Map(),
    routeLine: null,
    pendingLatLng: null,
    editingSpotId: null,
    editingPhotos: [],
    editingDrinkCounts: [],
    viewerPhotos: [],
    viewerIndex: 0,
    pinDisplayMode: "active",
    routeVisible: true,
    searchQuery: "",
    spotInputMode: "detail",
    tagCandidates: [],
    mapCandidate: null,
    geocodeRequestId: 0,
    geocodeAbortController: null,
    geocodeCache: new Map()
  };

  const elements = {
    sessionForm: document.querySelector("#sessionForm"),
    sessionDate: document.querySelector("#sessionDate"),
    sessionTitle: document.querySelector("#sessionTitle"),
    companions: document.querySelector("#companions"),
    overallMemo: document.querySelector("#overallMemo"),
    totalCostMemo: document.querySelector("#totalCostMemo"),
    tags: document.querySelector("#tags"),
    tagCheckboxList: document.querySelector("#tagCheckboxList"),
    tagSettingsButton: document.querySelector("#tagSettingsButton"),
    tagSettingsDialog: document.querySelector("#tagSettingsDialog"),
    closeTagSettingsDialog: document.querySelector("#closeTagSettingsDialog"),
    tagSettingsList: document.querySelector("#tagSettingsList"),
    newTagCandidate: document.querySelector("#newTagCandidate"),
    addTagCandidateButton: document.querySelector("#addTagCandidateButton"),
    syncRecordTagsButton: document.querySelector("#syncRecordTagsButton"),
    resetTagCandidatesButton: document.querySelector("#resetTagCandidatesButton"),
    sessionHint: document.querySelector("#sessionHint"),
    newSessionButton: document.querySelector("#newSessionButton"),
    locateButton: document.querySelector("#locateButton"),
    statusMessage: document.querySelector("#statusMessage"),
    recordCount: document.querySelector("#recordCount"),
    listPanel: document.querySelector(".list-panel"),
    sessionList: document.querySelector("#sessionList"),
    activeSessionSummary: document.querySelector("#activeSessionSummary"),
    activeSpotList: document.querySelector("#activeSpotList"),
    summaryStats: document.querySelector("#summaryStats"),
    sakeTypeStats: document.querySelector("#sakeTypeStats"),
    sakeRatingStats: document.querySelector("#sakeRatingStats"),
    drinkCountStats: document.querySelector("#drinkCountStats"),
    storageStats: document.querySelector("#storageStats"),
    dataCheckResults: document.querySelector("#dataCheckResults"),
    monthlyStatsList: document.querySelector("#monthlyStatsList"),
    areaStatsList: document.querySelector("#areaStatsList"),
    photoGalleryList: document.querySelector("#photoGalleryList"),
    brandStatsList: document.querySelector("#brandStatsList"),
    makerStatsList: document.querySelector("#makerStatsList"),
    favoriteList: document.querySelector("#favoriteList"),
    categoryLegend: document.querySelector("#categoryLegend"),
    generateBlogButton: document.querySelector("#generateBlogButton"),
    blogDraft: document.querySelector("#blogDraft"),
    copyBlogButton: document.querySelector("#copyBlogButton"),
    exportJsonButton: document.querySelector("#exportJsonButton"),
    exportLightJsonButton: document.querySelector("#exportLightJsonButton"),
    exportCsvButton: document.querySelector("#exportCsvButton"),
    exportMonthlyCsvButton: document.querySelector("#exportMonthlyCsvButton"),
    exportAreaCsvButton: document.querySelector("#exportAreaCsvButton"),
    importJsonButton: document.querySelector("#importJsonButton"),
    importCsvButton: document.querySelector("#importCsvButton"),
    dataCheckButton: document.querySelector("#dataCheckButton"),
    autoFixDataButton: document.querySelector("#autoFixDataButton"),
    duplicateCheckButton: document.querySelector("#duplicateCheckButton"),
    deleteAllPhotosButton: document.querySelector("#deleteAllPhotosButton"),
    jsonImportFile: document.querySelector("#jsonImportFile"),
    csvImportFile: document.querySelector("#csvImportFile"),
    pinDisplayMode: document.querySelector("#pinDisplayMode"),
    routeToggle: document.querySelector("#routeToggle"),
    recordSearch: document.querySelector("#recordSearch"),
    spotDialog: document.querySelector("#spotDialog"),
    spotDialogTitle: document.querySelector("#spotDialogTitle"),
    spotForm: document.querySelector("#spotForm"),
    closeSpotDialog: document.querySelector("#closeSpotDialog"),
    simpleSpotModeButton: document.querySelector("#simpleSpotModeButton"),
    detailSpotModeButton: document.querySelector("#detailSpotModeButton"),
    areaOptions: document.querySelector("#areaOptions"),
    mergeFromArea: document.querySelector("#mergeFromArea"),
    mergeToArea: document.querySelector("#mergeToArea"),
    mergeAreaButton: document.querySelector("#mergeAreaButton"),
    spotLat: document.querySelector("#spotLat"),
    spotLng: document.querySelector("#spotLng"),
    spotOrder: document.querySelector("#spotOrder"),
    spotCategory: document.querySelector("#spotCategory"),
    spotArea: document.querySelector("#spotArea"),
    spotName: document.querySelector("#spotName"),
    mapCandidatePanel: document.querySelector("#mapCandidatePanel"),
    mapCandidateStatus: document.querySelector("#mapCandidateStatus"),
    mapCandidateName: document.querySelector("#mapCandidateName"),
    mapCandidateAddress: document.querySelector("#mapCandidateAddress"),
    applyCandidateNameButton: document.querySelector("#applyCandidateNameButton"),
    googleMapsLink: document.querySelector("#googleMapsLink"),
    spotAddress: document.querySelector("#spotAddress"),
    drinkCountControls: document.querySelector("#drinkCountControls"),
    drinks: document.querySelector("#drinks"),
    sakeType: document.querySelector("#sakeType"),
    sakeBrand: document.querySelector("#sakeBrand"),
    sakeMaker: document.querySelector("#sakeMaker"),
    sakeTaste: document.querySelector("#sakeTaste"),
    sakeRating: document.querySelector("#sakeRating"),
    drinkAgain: document.querySelector("#drinkAgain"),
    sakeMemo: document.querySelector("#sakeMemo"),
    foods: document.querySelector("#foods"),
    spotCost: document.querySelector("#spotCost"),
    rating: document.querySelector("#rating"),
    revisit: document.querySelector("#revisit"),
    spotMemo: document.querySelector("#spotMemo"),
    photoInput: document.querySelector("#photoInput"),
    photoPreviewList: document.querySelector("#photoPreviewList"),
    photoStorageHint: document.querySelector("#photoStorageHint"),
    photoViewer: document.querySelector("#photoViewer"),
    viewerImage: document.querySelector("#viewerImage"),
    viewerCaption: document.querySelector("#viewerCaption"),
    closePhotoViewer: document.querySelector("#closePhotoViewer"),
    prevPhotoButton: document.querySelector("#prevPhotoButton"),
    nextPhotoButton: document.querySelector("#nextPhotoButton"),
    photoViewerCount: document.querySelector("#photoViewerCount")
  };

  const map = L.map("map", {
    zoomControl: true
  }).setView(AKITA_CITY, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  requestAnimationFrame(() => map.invalidateSize());
  window.addEventListener("load", () => map.invalidateSize());
  window.addEventListener("resize", () => map.invalidateSize());

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function todayText() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isValidPhotoDataUrl(value) {
    return /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i.test(String(value || ""));
  }

  function normalizePhoto(photo) {
    if (typeof photo === "string") {
      return isValidPhotoDataUrl(photo) ? { dataUrl: photo, caption: "" } : null;
    }
    if (!photo || typeof photo !== "object" || !isValidPhotoDataUrl(photo.dataUrl)) {
      return null;
    }
    return {
      dataUrl: String(photo.dataUrl),
      caption: String(photo.caption || "").slice(0, 80)
    };
  }

  function normalizePhotos(photos) {
    return Array.isArray(photos)
      ? photos.map(normalizePhoto).filter(Boolean).slice(0, MAX_PHOTOS_PER_SPOT)
      : [];
  }

  function photoDataUrl(photo) {
    return typeof photo === "string" ? photo : photo?.dataUrl || "";
  }

  function photoCaption(photo) {
    return typeof photo === "string" ? "" : String(photo?.caption || "");
  }

  function photoCaptionsText(photos) {
    const captions = normalizePhotos(photos)
      .map(photoCaption)
      .map((caption) => caption.trim())
      .filter(Boolean);
    return captions.length ? captions.join("、") : "";
  }

  function normalizeDrinkCounts(drinkCounts) {
    if (!Array.isArray(drinkCounts)) {
      return [];
    }
    const totals = new Map();
    drinkCounts.forEach((item) => {
      const type = String(item?.type || "").trim();
      const count = Math.max(0, Math.floor(Number(item?.count) || 0));
      if (!type || count <= 0) {
        return;
      }
      totals.set(type, (totals.get(type) || 0) + count);
    });
    return [...totals.entries()].map(([type, count]) => ({ type, count }));
  }

  function parseDrinkCountsText(value) {
    return normalizeDrinkCounts(
      String(value || "")
        .split(/\s*[/／、,]\s*/)
        .map((part) => {
          const match = part.match(/^(.+?)\s*[:：]\s*(\d+)/);
          return match ? { type: match[1].trim(), count: Number(match[2]) } : null;
        })
        .filter(Boolean)
    );
  }

  function formatDrinkCounts(drinkCounts, fallback = "未記入") {
    const counts = normalizeDrinkCounts(drinkCounts);
    return counts.length
      ? counts.map((item) => `${item.type}${item.count}杯`).join("、")
      : fallback;
  }

  function csvDrinkCounts(drinkCounts) {
    return normalizeDrinkCounts(drinkCounts)
      .map((item) => `${item.type}:${item.count}`)
      .join(" / ");
  }

  function totalDrinkCups(drinkCounts) {
    return normalizeDrinkCounts(drinkCounts).reduce((sum, item) => sum + item.count, 0);
  }

  function spotDrinkText(spot, fallback = "未記入") {
    const structured = formatDrinkCounts(spot.drinkCounts, "");
    const freeText = String(spot.drinks || "").trim();
    if (structured && freeText) {
      return `${structured} / ${freeText}`;
    }
    return structured || freeText || fallback;
  }

  function spotBestDish(spot) {
    return String(spot?.bestDish || spot?.foods || spot?.food || spot?.eatenItems || "").trim();
  }

  function normalizeSpot(spot) {
    return {
      id: typeof spot.id === "string" && spot.id ? spot.id : makeId("spot"),
      order: String(spot.order || ""),
      name: String(spot.name || ""),
      category: String(spot.category || "その他"),
      area: String(spot.area || ""),
      address: String(spot.address || ""),
      mapCandidateName: String(spot.mapCandidateName || ""),
      googleMapsUrl: String(spot.googleMapsUrl || ""),
      lat: Number(spot.lat),
      lng: Number(spot.lng),
      drinks: String(spot.drinks || ""),
      drinkCounts: normalizeDrinkCounts(spot.drinkCounts),
      sakeType: String(spot.sakeType || ""),
      sakeBrand: String(spot.sakeBrand || ""),
      sakeMaker: String(spot.sakeMaker || ""),
      sakeTaste: String(spot.sakeTaste || ""),
      sakeRating: String(spot.sakeRating || ""),
      drinkAgain: spot.drinkAgain === "いいえ" ? "いいえ" : spot.drinkAgain === "はい" ? "はい" : "",
      sakeMemo: String(spot.sakeMemo || ""),
      foods: spotBestDish(spot),
      bestDish: spotBestDish(spot),
      cost: String(spot.cost || ""),
      rating: ratingRank(spot.ratingRank || spot.rating, "B"),
      revisit: spot.revisit === "いいえ" ? "いいえ" : "はい",
      memo: String(spot.memo || ""),
      photos: normalizePhotos(spot.photos),
      createdAt: String(spot.createdAt || new Date().toISOString())
    };
  }

  function normalizeSession(session) {
    return {
      id: typeof session.id === "string" && session.id ? session.id : makeId("session"),
      date: String(session.date || ""),
      title: String(session.title || ""),
      companions: String(session.companions || ""),
      overallMemo: String(session.overallMemo || ""),
      totalCostMemo: String(session.totalCostMemo || session.totalMemo || ""),
      tags: parseTags(session.tags),
      spots: Array.isArray(session.spots)
        ? session.spots.map(normalizeSpot).filter((spot) => Number.isFinite(spot.lat) && Number.isFinite(spot.lng) && spot.name)
        : [],
      createdAt: String(session.createdAt || new Date().toISOString()),
      updatedAt: String(session.updatedAt || new Date().toISOString())
    };
  }

  function validateImportedSessions(value) {
    const rawSessions = Array.isArray(value)
      ? value
      : Array.isArray(value?.sessions)
        ? value.sessions
        : null;

    if (!rawSessions) {
      throw new Error("JSONの形式が違います。さけいちずのエクスポートJSON、または飲み会記録の配列を選んでください。");
    }

    const sessions = rawSessions.map(normalizeSession);
    const invalidSession = sessions.find((session) => !session.title);
    if (invalidSession) {
      throw new Error("飲み会タイトルが空の記録が含まれています。JSONの内容を確認してください。");
    }

    return sessions;
  }

  function loadSessions() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      state.sessions = validateImportedSessions(saved);
    } catch (error) {
      state.sessions = [];
      showStatus("保存データを読み込めませんでした。新しい記録として開始します。", "error");
    }

    state.activeSessionId = state.sessions[0]?.id || null;
  }

  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessions));
      return true;
    } catch (error) {
      if (error?.name === "QuotaExceededError" || error?.code === 22) {
        showStatus("保存容量を超えました。写真を減らすか、通常JSONエクスポートでバックアップしてから写真を削除してください。", "error");
      } else {
        showStatus("保存できませんでした。ブラウザの保存設定を確認してください。", "error");
      }
      return false;
    }
  }

  function loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      state.pinDisplayMode = settings.pinDisplayMode === "all" ? "all" : "active";
      state.routeVisible = typeof settings.routeVisible === "boolean" ? settings.routeVisible : true;
    } catch (error) {
      state.pinDisplayMode = "active";
      state.routeVisible = true;
    }

    elements.pinDisplayMode.value = state.pinDisplayMode;
    elements.routeToggle.checked = state.routeVisible;
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      pinDisplayMode: state.pinDisplayMode === "all" ? "all" : "active",
      routeVisible: Boolean(state.routeVisible)
    }));
  }

  function getActiveSession() {
    return state.sessions.find((session) => session.id === state.activeSessionId) || null;
  }

  function orderNumber(orderText) {
    const match = String(orderText || "").match(/\d+/);
    return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
  }

  function getSortedSpots(session) {
    return [...(session?.spots || [])].sort((a, b) => {
      const orderDiff = orderNumber(a.order) - orderNumber(b.order);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return String(a.createdAt).localeCompare(String(b.createdAt));
    });
  }

  function getSpotRecords() {
    return state.sessions.flatMap((session) => (
      session.spots.map((spot) => ({ session, spot }))
    ));
  }

  function getPhotoSpotRecords() {
    return getSpotRecords()
      .map(({ session, spot }) => ({
        session,
        spot,
        photos: normalizePhotos(spot.photos)
      }))
      .filter(({ photos }) => photos.length);
  }

  function hasSakeLog(spot) {
    return Boolean([spot.sakeBrand, spot.sakeType, spot.sakeMaker].some((value) => String(value || "").trim()));
  }

  function ratingRank(value, fallback = "") {
    const text = String(value ?? "").trim().toUpperCase();
    if (RATING_RANKS.includes(text)) {
      return text;
    }
    const number = Number(text);
    if (Number.isFinite(number) && RATING_NUMBER_TO_RANK[number]) {
      return RATING_NUMBER_TO_RANK[number];
    }
    return fallback;
  }

  function ratingNumber(value) {
    const rank = ratingRank(value);
    return rank ? RATING_RANK_TO_NUMBER[rank] : null;
  }

  function ratingDisplay(value, fallback = "未記入") {
    return ratingRank(value) || fallback;
  }

  function averageRatingText(values) {
    const validValues = values
      .map(ratingNumber)
      .filter((value) => Number.isFinite(value));
    if (!validValues.length) {
      return "未記入";
    }
    const average = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
    const rank = average >= 4.5 ? "S" : average >= 3.5 ? "A" : average >= 2.5 ? "B" : average >= 1.5 ? "C" : "D";
    return `${rank}相当 (${average.toFixed(1)})`;
  }

  function averageText(values) {
    const validValues = values.filter((value) => Number.isFinite(value));
    if (!validValues.length) {
      return "未記入";
    }
    return (validValues.reduce((sum, value) => sum + value, 0) / validValues.length).toFixed(1);
  }

  function normalizeNumberText(value) {
    return String(value || "").replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
  }

  function extractAmount(value) {
    const text = normalizeNumberText(value);
    let total = 0;
    const pattern = /([0-9][0-9,，.]*)\s*(万)?/g;
    let match = pattern.exec(text);
    while (match) {
      const number = Number(match[1].replace(/[，,]/g, ""));
      if (Number.isFinite(number)) {
        total += match[2] ? number * 10000 : number;
      }
      match = pattern.exec(text);
    }
    return Math.round(total);
  }

  function hasAmountText(value) {
    return String(value || "").trim().length > 0;
  }

  function isUnreadableAmount(value) {
    return hasAmountText(value) && extractAmount(value) <= 0;
  }

  function sessionAmount(session) {
    return (session.spots || []).reduce((sum, spot) => sum + extractAmount(spot.cost), 0);
  }

  function googleMapsUrl(lat, lng) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }

  function monthKey(dateText) {
    const text = String(dateText || "");
    return /^\d{4}-\d{2}/.test(text) ? text.slice(0, 7) : "日付未設定";
  }

  function formatYen(value) {
    return `${Math.round(value || 0).toLocaleString("ja-JP")}円`;
  }

  function estimatedBytes(text) {
    return new Blob([String(text || "")]).size;
  }

  function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  function storageSummary() {
    const text = JSON.stringify(state.sessions);
    const photoSpotRecords = getPhotoSpotRecords();
    const photoCount = photoSpotRecords.reduce((sum, { photos }) => sum + photos.length, 0);
    return {
      bytes: estimatedBytes(text),
      photoCount,
      photoSpotCount: photoSpotRecords.length
    };
  }

  function updatePhotoStorageHint() {
    const photoBytes = estimatedBytes(JSON.stringify(state.editingPhotos));
    const totalBytes = estimatedBytes(JSON.stringify(state.sessions));
    elements.photoStorageHint.textContent = `写真 ${state.editingPhotos.length}/${MAX_PHOTOS_PER_SPOT}枚 / 写真サイズ目安 ${formatBytes(photoBytes)} / 全体保存サイズ目安 ${formatBytes(totalBytes)}`;
  }

  function renderPhotoPreview() {
    elements.photoPreviewList.innerHTML = state.editingPhotos.length
      ? state.editingPhotos.map((photo, index) => `
        <div class="photo-preview-item">
          <img class="preview-thumb" src="${photoDataUrl(photo)}" alt="添付写真 ${index + 1}">
          <label>
            キャプション
            <input type="text" value="${escapeHtml(photoCaption(photo))}" maxlength="80" placeholder="例：新政 No.6" data-action="update-photo-caption" data-photo-index="${index}">
          </label>
          <div class="photo-preview-actions">
            <button class="small-button" type="button" data-action="move-photo-up" data-photo-index="${index}" ${index === 0 ? "disabled" : ""}>上へ</button>
            <button class="small-button" type="button" data-action="move-photo-down" data-photo-index="${index}" ${index === state.editingPhotos.length - 1 ? "disabled" : ""}>下へ</button>
            <button class="small-button danger" type="button" data-action="remove-photo" data-photo-index="${index}">削除</button>
          </div>
        </div>
      `).join("")
      : '<p class="empty">写真はまだありません。</p>';
    updatePhotoStorageHint();
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
      image.src = dataUrl;
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("画像ファイルを読み込めませんでした。"));
      reader.readAsDataURL(file);
    });
  }

  async function compressPhoto(file) {
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      throw new Error("対応している写真形式は jpg / jpeg / png / webp です。");
    }

    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    if (!isValidPhotoDataUrl(compressed)) {
      throw new Error("画像の変換に失敗しました。別の写真でお試しください。");
    }
    return { dataUrl: compressed, caption: "" };
  }

  async function handlePhotoFiles(files) {
    const availableSlots = MAX_PHOTOS_PER_SPOT - state.editingPhotos.length;
    if (availableSlots <= 0) {
      showStatus("写真は1スポットにつき3枚までです。", "warning");
      elements.photoInput.value = "";
      return;
    }

    const selectedFiles = [...files];
    const targetFiles = selectedFiles.slice(0, availableSlots);
    if (selectedFiles.length > availableSlots) {
      showStatus("写真は3枚までに制限しました。", "warning");
    }

    try {
      for (const file of targetFiles) {
        const compressed = await compressPhoto(file);
        state.editingPhotos.push(compressed);
      }
      renderPhotoPreview();
      const summary = storageSummary();
      showStatus(
        summary.bytes >= 3 * 1024 * 1024 || summary.photoCount >= 10
          ? "写真を圧縮して追加しました。写真が増えているため、通常JSONでバックアップすることをおすすめします。"
          : "写真を圧縮して追加しました。",
        summary.bytes >= 3 * 1024 * 1024 || summary.photoCount >= 10 ? "warning" : "success"
      );
    } catch (error) {
      showStatus(error.message || "写真の変換に失敗しました。", "error");
    } finally {
      elements.photoInput.value = "";
    }
  }

  function openPhotoViewer(photos, index = 0) {
    const validPhotos = normalizePhotos(photos);
    if (!validPhotos.length) {
      return;
    }
    state.viewerPhotos = validPhotos;
    state.viewerIndex = Math.min(Math.max(index, 0), validPhotos.length - 1);
    renderPhotoViewer();
    elements.photoViewer.showModal();
  }

  function renderPhotoViewer() {
    const photo = state.viewerPhotos[state.viewerIndex];
    const caption = photoCaption(photo);
    elements.viewerImage.src = photoDataUrl(photo);
    elements.viewerCaption.textContent = caption || "キャプションなし";
    elements.photoViewerCount.textContent = `${state.viewerIndex + 1} / ${state.viewerPhotos.length}`;
    elements.prevPhotoButton.disabled = state.viewerPhotos.length <= 1;
    elements.nextPhotoButton.disabled = state.viewerPhotos.length <= 1;
  }

  function movePhotoViewer(delta) {
    if (!state.viewerPhotos.length) {
      return;
    }
    state.viewerIndex = (state.viewerIndex + delta + state.viewerPhotos.length) % state.viewerPhotos.length;
    renderPhotoViewer();
  }

  function categoryStyle(category) {
    return CATEGORY_STYLES[category] || CATEGORY_STYLES["その他"];
  }

  function uniqueText(values, limit = 3) {
    const uniqueValues = [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
    if (!uniqueValues.length) {
      return "未記入";
    }
    const suffix = uniqueValues.length > limit ? ` ほか${uniqueValues.length - limit}件` : "";
    return `${uniqueValues.slice(0, limit).join("、")}${suffix}`;
  }

  function sessionRegionTags(session) {
    const tags = parseTags(session?.tags || []);
    return tags.filter((tag) => REGION_TAGS.includes(tag));
  }

  function areaKeysForRecord(session, spot) {
    const existingArea = String(spot?.area || "").trim();
    if (existingArea) {
      return [existingArea];
    }
    const regionTags = sessionRegionTags(session);
    return regionTags.length ? regionTags : ["エリア未設定"];
  }

  function areaLabelForSpot(session, spot) {
    const existingArea = String(spot?.area || "").trim();
    if (existingArea) {
      return `既存エリア ${existingArea}`;
    }
    const regionTags = sessionRegionTags(session);
    return regionTags.length ? `地域タグ ${regionTags.join("、")}` : "地域未設定";
  }

  function getAreaCandidates() {
    const savedAreas = getSpotRecords()
      .map(({ spot }) => String(spot.area || "").trim())
      .filter(Boolean);
    return [...new Set([...DEFAULT_AREAS, ...REGION_TAGS, ...savedAreas])].sort((a, b) => a.localeCompare(b, "ja"));
  }

  function normalizeTagCandidates(tags) {
    return [...new Set(parseTags(tags))];
  }

  function recordTags() {
    return normalizeTagCandidates(state.sessions.flatMap((session) => parseTags(session.tags)));
  }

  function loadTagSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(TAG_SETTINGS_KEY) || "null");
      if (Array.isArray(saved)) {
        state.tagCandidates = normalizeTagCandidates(saved);
        if (state.tagCandidates.length) {
          return;
        }
      }
    } catch (error) {
      state.tagCandidates = [];
    }
    state.tagCandidates = normalizeTagCandidates([...DEFAULT_TAGS, ...recordTags()]);
    saveTagSettings();
  }

  function saveTagSettings() {
    localStorage.setItem(TAG_SETTINGS_KEY, JSON.stringify(state.tagCandidates));
  }

  function getTagCandidates() {
    return state.tagCandidates.length ? state.tagCandidates : normalizeTagCandidates(DEFAULT_TAGS);
  }

  function addTagsToCandidates(tags) {
    const merged = normalizeTagCandidates([...getTagCandidates(), ...parseTags(tags)]);
    if (merged.length !== state.tagCandidates.length || merged.some((tag, index) => tag !== state.tagCandidates[index])) {
      state.tagCandidates = merged;
      saveTagSettings();
    }
  }

  function selectedTagCheckboxValues() {
    return [...elements.tagCheckboxList.querySelectorAll("input[type='checkbox']:checked")]
      .map((input) => input.value)
      .filter(Boolean);
  }

  function readSessionTagsFromForm() {
    return [...new Set([
      ...selectedTagCheckboxValues(),
      ...parseTags(elements.tags.value)
    ])];
  }

  function renderTagCheckboxes(selectedTags = readSessionTagsFromForm()) {
    const selected = new Set(parseTags(selectedTags));
    elements.tagCheckboxList.innerHTML = getTagCandidates().map((tag) => `
      <label class="tag-checkbox">
        <input type="checkbox" value="${escapeHtml(tag)}" ${selected.has(tag) ? "checked" : ""}>
        <span>${escapeHtml(tag)}</span>
      </label>
    `).join("");
  }

  function setTagFormValues(tags) {
    const normalizedTags = parseTags(tags);
    const candidateSet = new Set(getTagCandidates());
    const checkedTags = normalizedTags.filter((tag) => candidateSet.has(tag));
    const freeTags = normalizedTags.filter((tag) => !candidateSet.has(tag));
    renderTagCheckboxes(checkedTags);
    elements.tags.value = freeTags.join(", ");
  }

  function refreshTagCandidateUi(selectedTags = readSessionTagsFromForm()) {
    renderTagCheckboxes(selectedTags);
    renderTagSettingsList();
  }

  function renderTagSettingsList() {
    const candidates = getTagCandidates();
    elements.tagSettingsList.innerHTML = candidates.length
      ? candidates.map((tag, index) => `
        <div class="tag-setting-item">
          <strong>${escapeHtml(tag)}</strong>
          <div class="tag-setting-actions">
            <button class="small-button" type="button" data-action="move-tag-up" data-tag-index="${index}" ${index === 0 ? "disabled" : ""}>上へ</button>
            <button class="small-button" type="button" data-action="move-tag-down" data-tag-index="${index}" ${index === candidates.length - 1 ? "disabled" : ""}>下へ</button>
            <button class="small-button danger" type="button" data-action="delete-tag-candidate" data-tag-index="${index}">削除</button>
          </div>
        </div>
      `).join("")
      : '<p class="empty">タグ候補がありません。</p>';
  }

  function addTagCandidate() {
    const tag = elements.newTagCandidate.value.trim();
    const normalized = parseTags(tag);
    if (!normalized.length) {
      showStatus("追加するタグを入力してください。", "warning");
      return;
    }
    addTagsToCandidates(normalized);
    elements.newTagCandidate.value = "";
    setTagFormValues(readSessionTagsFromForm());
    renderTagSettingsList();
    showStatus("タグ候補を追加しました。", "success");
  }

  function resetTagCandidates() {
    if (!confirm("タグ候補を初期状態に戻します。過去の飲み会記録についているタグは削除されません。よろしいですか？")) {
      return;
    }
    state.tagCandidates = normalizeTagCandidates(DEFAULT_TAGS);
    saveTagSettings();
    setTagFormValues(readSessionTagsFromForm());
    renderTagSettingsList();
    showStatus("タグ候補を初期状態に戻しました。", "success");
  }

  function syncRecordTagsToCandidates() {
    addTagsToCandidates(recordTags());
    setTagFormValues(readSessionTagsFromForm());
    renderTagSettingsList();
    showStatus("記録中のタグを候補に追加しました。", "success");
  }

  function updateTagCandidateByAction(action, index) {
    const candidates = [...getTagCandidates()];
    if (!Number.isInteger(index) || index < 0 || index >= candidates.length) {
      return;
    }
    if (action === "delete-tag-candidate") {
      const tag = candidates[index];
      if (!confirm(`タグ候補「${tag}」を削除します。過去の飲み会記録についているタグは残ります。よろしいですか？`)) {
        return;
      }
      candidates.splice(index, 1);
    }
    if (action === "move-tag-up" && index > 0) {
      [candidates[index - 1], candidates[index]] = [candidates[index], candidates[index - 1]];
    }
    if (action === "move-tag-down" && index < candidates.length - 1) {
      [candidates[index], candidates[index + 1]] = [candidates[index + 1], candidates[index]];
    }
    state.tagCandidates = normalizeTagCandidates(candidates);
    saveTagSettings();
    setTagFormValues(readSessionTagsFromForm());
    renderTagSettingsList();
  }

  function renderAreaOptions() {
    elements.areaOptions.innerHTML = getAreaCandidates()
      .map((area) => `<option value="${escapeHtml(area)}"></option>`)
      .join("");
  }

  function drinkCountValue(type) {
    return normalizeDrinkCounts(state.editingDrinkCounts).find((item) => item.type === type)?.count || 0;
  }

  function setDrinkCountValue(type, count) {
    const safeCount = Math.max(0, Math.floor(Number(count) || 0));
    const current = new Map(normalizeDrinkCounts(state.editingDrinkCounts).map((item) => [item.type, item.count]));
    if (safeCount > 0) {
      current.set(type, safeCount);
    } else {
      current.delete(type);
    }
    state.editingDrinkCounts = [...current.entries()].map(([itemType, itemCount]) => ({ type: itemType, count: itemCount }));
  }

  function renderDrinkCountControls() {
    elements.drinkCountControls.innerHTML = DRINK_COUNT_TYPES.map((type) => {
      const count = drinkCountValue(type);
      return `
        <div class="drink-count-row ${count > 0 ? "is-active" : ""}">
          <label class="drink-count-check">
            <input type="checkbox" data-action="toggle-drink-count" data-drink-type="${escapeHtml(type)}" ${count > 0 ? "checked" : ""}>
            <span>${escapeHtml(type)}</span>
          </label>
          <div class="drink-stepper">
            <button class="count-button" type="button" data-action="decrement-drink-count" data-drink-type="${escapeHtml(type)}" ${count <= 0 ? "disabled" : ""}>−</button>
            <strong>${count}</strong>
            <button class="count-button" type="button" data-action="increment-drink-count" data-drink-type="${escapeHtml(type)}">＋</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function geocodeCacheKey(latlng) {
    return `${Number(latlng.lat).toFixed(5)},${Number(latlng.lng).toFixed(5)}`;
  }

  function addressText(address) {
    if (!address || typeof address !== "object") {
      return "";
    }
    return [
      address.province || address.state,
      address.city || address.town || address.village || address.county,
      address.suburb || address.neighbourhood || address.quarter,
      address.road || address.pedestrian,
      address.house_number
    ].filter(Boolean).join("");
  }

  function candidateNameFromNominatim(data) {
    const address = data?.address || {};
    return String(
      data?.name ||
      data?.namedetails?.name ||
      address.amenity ||
      address.restaurant ||
      address.pub ||
      address.bar ||
      address.cafe ||
      address.shop ||
      address.tourism ||
      address.building ||
      address.road ||
      ""
    ).trim();
  }

  function candidateFromNominatim(data, latlng) {
    const address = addressText(data?.address) || String(data?.display_name || "").trim();
    const displayName = String(data?.display_name || "").trim();
    const name = candidateNameFromNominatim(data) || displayName.split(",")[0]?.trim() || "";
    return {
      name,
      address,
      googleMapsUrl: googleMapsUrl(latlng.lat, latlng.lng)
    };
  }

  function renderMapCandidate(statusText = "") {
    if (!elements.mapCandidatePanel) {
      return;
    }
    const candidate = state.mapCandidate || {};
    elements.mapCandidatePanel.hidden = false;
    elements.mapCandidateStatus.textContent = statusText || (candidate.name || candidate.address ? "候補を取得しました。必要に応じて修正してください。" : "候補は未取得です。手入力できます。");
    elements.mapCandidateName.textContent = candidate.name || "未取得";
    elements.mapCandidateAddress.textContent = candidate.address || "未取得";
    elements.applyCandidateNameButton.disabled = !candidate.name;
    const url = candidate.googleMapsUrl || googleMapsUrl(elements.spotLat.value || 0, elements.spotLng.value || 0);
    elements.googleMapsLink.href = url;
  }

  function clearMapCandidate() {
    state.mapCandidate = null;
    if (state.geocodeAbortController) {
      state.geocodeAbortController.abort();
      state.geocodeAbortController = null;
    }
    if (elements.mapCandidatePanel) {
      elements.mapCandidatePanel.hidden = true;
      elements.mapCandidateStatus.textContent = "";
      elements.mapCandidateName.textContent = "未取得";
      elements.mapCandidateAddress.textContent = "未取得";
      elements.applyCandidateNameButton.disabled = true;
      elements.googleMapsLink.href = "#";
    }
  }

  async function fetchMapCandidate(latlng) {
    const key = geocodeCacheKey(latlng);
    state.mapCandidate = {
      name: "",
      address: "",
      googleMapsUrl: googleMapsUrl(latlng.lat, latlng.lng)
    };
    renderMapCandidate("地図クリック地点の候補を取得しています。");

    if (state.geocodeCache.has(key)) {
      state.mapCandidate = state.geocodeCache.get(key);
      if (!elements.spotName.value.trim() && state.mapCandidate.name) {
        elements.spotName.value = state.mapCandidate.name;
      }
      if (!elements.spotAddress.value.trim() && state.mapCandidate.address) {
        elements.spotAddress.value = state.mapCandidate.address;
      }
      renderMapCandidate("近い地点の候補を表示しています。");
      return;
    }

    if (state.geocodeAbortController) {
      state.geocodeAbortController.abort();
    }
    const requestId = state.geocodeRequestId + 1;
    state.geocodeRequestId = requestId;
    state.geocodeAbortController = new AbortController();

    try {
      const url = new URL(NOMINATIM_REVERSE_URL);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", latlng.lat);
      url.searchParams.set("lon", latlng.lng);
      url.searchParams.set("zoom", "18");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("namedetails", "1");
      url.searchParams.set("accept-language", "ja");
      const response = await fetch(url.toString(), {
        signal: state.geocodeAbortController.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        throw new Error("候補取得に失敗しました。手入力で登録できます。");
      }
      const data = await response.json();
      if (requestId !== state.geocodeRequestId) {
        return;
      }
      const candidate = candidateFromNominatim(data, latlng);
      state.geocodeCache.set(key, candidate);
      state.mapCandidate = candidate;
      if (!elements.spotName.value.trim() && candidate.name) {
        elements.spotName.value = candidate.name;
      }
      if (!elements.spotAddress.value.trim() && candidate.address) {
        elements.spotAddress.value = candidate.address;
      }
      renderMapCandidate(candidate.name || candidate.address ? "候補を取得しました。候補は不正確な場合があります。" : "候補を取得できませんでした。手入力で登録できます。");
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
      state.mapCandidate = {
        name: "",
        address: "",
        googleMapsUrl: googleMapsUrl(latlng.lat, latlng.lng)
      };
      renderMapCandidate("通信に失敗しました。手入力で登録できます。");
      showStatus("場所候補を取得できませんでした。通信状況を確認し、必要なら手入力してください。", "warning");
    } finally {
      if (requestId === state.geocodeRequestId) {
        state.geocodeAbortController = null;
      }
    }
  }

  function setSearchTerm(term) {
    state.searchQuery = term;
    elements.recordSearch.value = term;
    renderSessions();
    showStatus(`「${term}」で絞り込みました。`);
  }

  function focusSpot(sessionId, spotId) {
    const session = state.sessions.find((item) => item.id === sessionId);
    const spot = session?.spots.find((item) => item.id === spotId);
    if (!session || !spot) {
      showStatus("対象の記録が見つかりません。");
      return;
    }

    state.activeSessionId = sessionId;
    fillSessionForm(session);
    render();
    map.setView([spot.lat, spot.lng], Math.max(map.getZoom(), 16));
    state.markers.get(spotId)?.openPopup();
    showStatus(`「${spot.name}」を表示しました。`);
  }

  function viewSpotPhotos(sessionId, spotId, index = 0) {
    const session = state.sessions.find((item) => item.id === sessionId);
    const spot = session?.spots.find((item) => item.id === spotId);
    openPhotoViewer(spot?.photos || [], index);
  }

  function getSessionsForMarkers() {
    if (state.pinDisplayMode === "all") {
      return state.sessions;
    }

    const activeSession = getActiveSession();
    return activeSession ? [activeSession] : [];
  }

  function sessionMatchesSearch(session) {
    const query = state.searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const searchable = [
      session.title,
      session.companions,
      session.overallMemo,
      session.totalCostMemo,
      ...(session.tags || []),
      ...session.spots.flatMap((spot) => [
        spot.order,
        spot.name,
        spot.category,
        spot.area,
        spot.address,
        spot.mapCandidateName,
        spot.drinks,
        formatDrinkCounts(spot.drinkCounts, ""),
        spot.sakeType,
        spot.sakeBrand,
        spot.sakeMaker,
        spot.sakeTaste,
        spot.sakeMemo,
        spotBestDish(spot),
        spot.cost,
        ratingDisplay(spot.rating, ""),
        spot.revisit,
        spot.memo,
        ...normalizePhotos(spot.photos).map(photoCaption)
      ])
    ].join("\n").toLowerCase();

    return searchable.includes(query);
  }

  function compactDateText(dateText) {
    return String(dateText || todayText()).replaceAll("-", "");
  }

  function setActiveSession(sessionId) {
    state.activeSessionId = sessionId;
    const session = getActiveSession();
    if (session) {
      fillSessionForm(session);
      const firstSpot = getSortedSpots(session)[0];
      if (firstSpot) {
        map.setView([firstSpot.lat, firstSpot.lng], Math.max(map.getZoom(), 15));
      }
    }
    render();
  }

  function fillSessionForm(session) {
    elements.sessionDate.value = session.date || todayText();
    elements.sessionTitle.value = session.title || "";
    elements.companions.value = session.companions || "";
    elements.overallMemo.value = session.overallMemo || "";
    elements.totalCostMemo.value = session.totalCostMemo || "";
    setTagFormValues(session.tags || []);
  }

  function resetSessionForm() {
    state.activeSessionId = null;
    elements.sessionForm.reset();
    elements.sessionDate.value = todayText();
    elements.blogDraft.value = "";
    elements.totalCostMemo.value = "";
    setTagFormValues([]);
    render();
  }

  function parseTags(value) {
    const source = Array.isArray(value) ? value.join(",") : String(value || "");
    return [...new Set(source
      .split(/[,\s、]+/)
      .map((tag) => tag.trim())
      .filter(Boolean))];
  }

  function handleSessionSubmit(event) {
    event.preventDefault();
    const previousSessions = JSON.stringify(state.sessions);
    const previousActiveSessionId = state.activeSessionId;
    const payload = {
      date: elements.sessionDate.value,
      title: elements.sessionTitle.value.trim(),
      companions: elements.companions.value.trim(),
      overallMemo: elements.overallMemo.value.trim(),
      totalCostMemo: elements.totalCostMemo.value.trim(),
      tags: readSessionTagsFromForm()
    };

    if (!payload.title) {
      showStatus("飲み会タイトルを入力してください。");
      return;
    }

    const existing = getActiveSession();
    if (existing) {
      Object.assign(existing, payload, { updatedAt: new Date().toISOString() });
    } else {
      const session = {
        id: makeId("session"),
        ...payload,
        spots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.sessions.unshift(session);
      state.activeSessionId = session.id;
    }

    if (!saveSessions()) {
      state.sessions = JSON.parse(previousSessions);
      state.activeSessionId = previousActiveSessionId;
      render();
      return;
    }
    addTagsToCandidates(payload.tags);
    setTagFormValues(payload.tags);
    renderTagSettingsList();
    render();
    showStatus("飲み会記録を保存しました。地図をクリックしてスポットを追加できます。");
  }

  function shouldUseSimpleSpotMode() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function setSpotInputMode(mode) {
    state.spotInputMode = mode === "simple" ? "simple" : "detail";
    const isSimple = state.spotInputMode === "simple";
    elements.spotDialog.classList.toggle("is-simple", isSimple);
    elements.spotDialog.classList.toggle("is-detail", !isSimple);
    elements.simpleSpotModeButton.setAttribute("aria-pressed", String(isSimple));
    elements.detailSpotModeButton.setAttribute("aria-pressed", String(!isSimple));
  }

  function setResponsiveSpotInputMode() {
    setSpotInputMode(shouldUseSimpleSpotMode() ? "simple" : "detail");
  }

  function openSpotDialog(latlng) {
    const session = getActiveSession();
    if (!session) {
      showStatus("先に飲み会記録を保存してください。");
      return;
    }

    state.pendingLatLng = latlng;
    state.editingSpotId = null;
    state.editingPhotos = [];
    state.editingDrinkCounts = [];
    clearMapCandidate();
    elements.spotDialogTitle.textContent = "スポット追加";
    elements.spotForm.reset();
    elements.spotLat.value = latlng.lat.toFixed(6);
    elements.spotLng.value = latlng.lng.toFixed(6);
    elements.spotOrder.value = `${session.spots.length + 1}軒目`;
    elements.rating.value = "B";
    elements.revisit.value = "はい";
    renderPhotoPreview();
    renderDrinkCountControls();
    fetchMapCandidate(latlng);
    setResponsiveSpotInputMode();
    elements.spotDialog.showModal();
    elements.spotName.focus();
  }

  function openSpotEditDialog(sessionId, spotId) {
    const session = state.sessions.find((item) => item.id === sessionId);
    const spot = session?.spots.find((item) => item.id === spotId);
    if (!session || !spot) {
      showStatus("編集するスポットが見つかりません。");
      return;
    }

    state.activeSessionId = sessionId;
    state.editingSpotId = spotId;
    state.editingPhotos = normalizePhotos(spot.photos);
    state.editingDrinkCounts = normalizeDrinkCounts(spot.drinkCounts);
    state.mapCandidate = {
      name: spot.mapCandidateName || "",
      address: spot.address || "",
      googleMapsUrl: spot.googleMapsUrl || googleMapsUrl(spot.lat, spot.lng)
    };
    fillSessionForm(session);
    elements.spotDialogTitle.textContent = "スポット編集";
    elements.spotForm.reset();
    elements.spotLat.value = spot.lat;
    elements.spotLng.value = spot.lng;
    elements.spotOrder.value = spot.order;
    elements.spotCategory.value = spot.category;
    elements.spotArea.value = spot.area;
    elements.spotName.value = spot.name;
    elements.spotAddress.value = spot.address;
    elements.drinks.value = spot.drinks;
    elements.sakeType.value = spot.sakeType;
    elements.sakeBrand.value = spot.sakeBrand;
    elements.sakeMaker.value = spot.sakeMaker;
    elements.sakeTaste.value = spot.sakeTaste;
    elements.sakeRating.value = spot.sakeRating;
    elements.drinkAgain.value = spot.drinkAgain;
    elements.sakeMemo.value = spot.sakeMemo;
    elements.foods.value = spotBestDish(spot);
    elements.spotCost.value = spot.cost;
    elements.rating.value = ratingRank(spot.rating, "B");
    elements.revisit.value = spot.revisit;
    elements.spotMemo.value = spot.memo;
    renderPhotoPreview();
    renderDrinkCountControls();
    renderMapCandidate(spot.mapCandidateName || spot.address ? "保存済みの候補情報を表示しています。" : "Googleマップで場所を確認できます。");
    render();
    setResponsiveSpotInputMode();
    elements.spotDialog.showModal();
    elements.spotName.focus();
  }

  function readSpotForm() {
    const lat = Number(elements.spotLat.value);
    const lng = Number(elements.spotLng.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      showStatus("緯度と経度を確認してください。");
      return null;
    }

    const spot = {
      order: elements.spotOrder.value.trim(),
      name: elements.spotName.value.trim(),
      category: elements.spotCategory.value,
      area: elements.spotArea.value.trim(),
      address: elements.spotAddress.value.trim(),
      mapCandidateName: String(state.mapCandidate?.name || "").trim(),
      googleMapsUrl: String(state.mapCandidate?.googleMapsUrl || googleMapsUrl(lat, lng)),
      lat,
      lng,
      drinks: elements.drinks.value.trim(),
      drinkCounts: normalizeDrinkCounts(state.editingDrinkCounts),
      sakeType: elements.sakeType.value,
      sakeBrand: elements.sakeBrand.value.trim(),
      sakeMaker: elements.sakeMaker.value.trim(),
      sakeTaste: elements.sakeTaste.value.trim(),
      sakeRating: elements.sakeRating.value,
      drinkAgain: elements.drinkAgain.value,
      sakeMemo: elements.sakeMemo.value.trim(),
      foods: elements.foods.value.trim(),
      bestDish: elements.foods.value.trim(),
      cost: elements.spotCost.value.trim(),
      rating: ratingRank(elements.rating.value, "B"),
      revisit: elements.revisit.value,
      memo: elements.spotMemo.value.trim(),
      photos: normalizePhotos(state.editingPhotos)
    };

    if (!spot.name) {
      showStatus("店名を入力してください。");
      return null;
    }

    return spot;
  }

  function handleSpotSubmit(event) {
    event.preventDefault();
    const session = getActiveSession();
    if (!session) {
      showStatus("スポットを保存する飲み会記録がありません。");
      return;
    }

    const payload = readSpotForm();
    if (!payload) {
      return;
    }

    const previousSessions = JSON.stringify(state.sessions);
    const existingSpot = state.editingSpotId
      ? session.spots.find((spot) => spot.id === state.editingSpotId)
      : null;

    if (existingSpot) {
      Object.assign(existingSpot, payload);
      session.updatedAt = new Date().toISOString();
      showStatus("スポットを更新しました。ルート線も更新しました。");
    } else {
      session.spots.push({
        id: makeId("spot"),
        ...payload,
        createdAt: new Date().toISOString()
      });
      session.updatedAt = new Date().toISOString();
      showStatus("スポットを保存しました。ルート線も更新しました。");
    }

    if (!saveSessions()) {
      state.sessions = JSON.parse(previousSessions);
      return;
    }
    elements.spotDialog.close();
    state.editingSpotId = null;
    render();
    map.setView([payload.lat, payload.lng], Math.max(map.getZoom(), 16));
  }

  function deleteSession(sessionId) {
    const session = state.sessions.find((item) => item.id === sessionId);
    if (!session || !confirm(`「${session.title}」を削除しますか？`)) {
      return;
    }

    state.sessions = state.sessions.filter((item) => item.id !== sessionId);
    state.activeSessionId = state.sessions[0]?.id || null;
    saveSessions();
    if (state.activeSessionId) {
      fillSessionForm(getActiveSession());
    } else {
      resetSessionForm();
    }
    render();
    showStatus("飲み会記録を削除しました。");
  }

  function deleteSpot(sessionId, spotId) {
    const session = state.sessions.find((item) => item.id === sessionId);
    const spot = session?.spots.find((item) => item.id === spotId);
    if (!session || !spot || !confirm(`「${spot.name}」を削除しますか？`)) {
      return;
    }

    session.spots = session.spots.filter((item) => item.id !== spotId);
    session.updatedAt = new Date().toISOString();
    saveSessions();
    render();
    showStatus("スポットを削除しました。ルート線も更新しました。");
  }

  function deleteSpotPhotos(sessionId, spotId) {
    const session = state.sessions.find((item) => item.id === sessionId);
    const spot = session?.spots.find((item) => item.id === spotId);
    if (!session || !spot || !normalizePhotos(spot.photos).length) {
      showStatus("削除する写真がありません。");
      return;
    }
    if (!confirm(`「${spot.name}」の写真だけを削除しますか？スポット情報、酒ログ、メモ、位置情報は残ります。`)) {
      return;
    }

    const previousSessions = JSON.stringify(state.sessions);
    spot.photos = [];
    session.updatedAt = new Date().toISOString();
    if (!saveSessions()) {
      state.sessions = JSON.parse(previousSessions);
      render();
      return;
    }
    render();
    showStatus("このスポットの写真を削除しました。");
  }

  function deleteAllPhotos() {
    const photoSpotCount = getPhotoSpotRecords().length;
    if (!photoSpotCount) {
      showStatus("削除する写真がありません。", "warning");
      return;
    }
    showStatus("写真一括削除の前に、通常JSONエクスポートでバックアップすることをおすすめします。", "warning");
    if (!confirm("すべての写真を削除します。実行前に通常JSONエクスポートで写真付きバックアップを作成することをおすすめします。写真以外の記録は残ります。")) {
      return;
    }

    const previousSessions = JSON.stringify(state.sessions);
    state.sessions.forEach((session) => {
      session.spots.forEach((spot) => {
        spot.photos = [];
      });
      session.updatedAt = new Date().toISOString();
    });
    if (!saveSessions()) {
      state.sessions = JSON.parse(previousSessions);
      render();
      return;
    }
    render();
    showStatus("全スポットの写真を削除しました。写真以外の記録は残っています。", "success");
  }

  function mergeAreas() {
    const fromArea = elements.mergeFromArea.value.trim();
    const toArea = elements.mergeToArea.value.trim();
    if (!fromArea || !toArea) {
      showStatus("統合元エリアと統合先エリアを入力してください。", "warning");
      return;
    }
    if (fromArea === toArea) {
      showStatus("統合元と統合先が同じです。別のエリアを指定してください。", "warning");
      return;
    }

    const targets = getSpotRecords().filter(({ spot }) => String(spot.area || "").trim() === fromArea);
    if (!targets.length) {
      showStatus("統合元エリアに一致するスポットがありません。", "warning");
      return;
    }
    showStatus("エリア統合前に、通常JSONエクスポートでバックアップすることをおすすめします。", "warning");
    if (!confirm(`「${fromArea}」のスポット${targets.length}件を「${toArea}」に統合します。実行前に通常JSONエクスポートでバックアップすることをおすすめします。写真、酒ログ、位置情報は残ります。よろしいですか？`)) {
      return;
    }

    const previousSessions = JSON.stringify(state.sessions);
    targets.forEach(({ session, spot }) => {
      spot.area = toArea;
      session.updatedAt = new Date().toISOString();
    });
    if (!saveSessions()) {
      state.sessions = JSON.parse(previousSessions);
      render();
      return;
    }
    elements.mergeFromArea.value = "";
    elements.mergeToArea.value = toArea;
    if (state.activeSessionId) {
      fillSessionForm(getActiveSession());
    }
    render();
    showStatus(`「${fromArea}」を「${toArea}」に統合しました。`, "success");
  }

  function showStatus(message, type = "info") {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status is-visible ${type}`;
    window.clearTimeout(showStatus.timer);
    showStatus.timer = window.setTimeout(() => {
      elements.statusMessage.classList.remove("is-visible");
    }, 4200);
  }

  function locateUser() {
    if (!navigator.geolocation) {
      showStatus("このブラウザでは現在地取得を利用できません。", "error");
      return;
    }

    showStatus("現在地を取得しています。");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latlng = [position.coords.latitude, position.coords.longitude];
        map.setView(latlng, 16);
        L.circleMarker(latlng, {
          radius: 8,
          color: "#1e6d74",
          weight: 3,
          fillColor: "#48b7c0",
          fillOpacity: 0.7
        }).addTo(map).bindPopup("現在地").openPopup();
        showStatus("現在地を表示しました。", "success");
      },
      () => {
        showStatus("現在地を取得できませんでした。ブラウザの位置情報設定を確認してください。", "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  function clearMarkers() {
    state.markers.forEach((marker) => marker.remove());
    state.markers.clear();
  }

  function clearRoute() {
    if (state.routeLine) {
      state.routeLine.remove();
      state.routeLine = null;
    }
  }

  function categoryIcon(category) {
    const style = categoryStyle(category);
    return L.divIcon({
      className: "",
      html: `<span class="category-marker" style="--pin-color:${style.color}"><span>${escapeHtml(style.short)}</span></span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -28]
    });
  }

  function renderCategoryLegend() {
    elements.categoryLegend.innerHTML = Object.entries(CATEGORY_STYLES).map(([category, style]) => `
      <span class="legend-item">
        <span class="legend-dot" style="--pin-color:${style.color}"></span>
        ${escapeHtml(category)}
      </span>
    `).join("");
  }

  function renderMarkers() {
    clearMarkers();
    getSessionsForMarkers().forEach((session) => {
      session.spots.forEach((spot) => {
        const firstPhoto = normalizePhotos(spot.photos)[0];
        const marker = L.marker([spot.lat, spot.lng], {
          icon: categoryIcon(spot.category)
        }).addTo(map);
        marker.bindPopup(`
          <strong>${escapeHtml(spot.name)}</strong><br>
          ${firstPhoto ? `<button class="photo-open-button" type="button" data-action="view-photos" data-session-id="${session.id}" data-spot-id="${spot.id}" data-photo-index="0"><img class="popup-thumb" src="${photoDataUrl(firstPhoto)}" alt="${escapeHtml(spot.name)}の写真"></button>` : ""}
          ${escapeHtml(spot.order)} / ${escapeHtml(session.title)}<br>
          ${escapeHtml(areaLabelForSpot(session, spot))}<br>
          住所: ${escapeHtml(spot.address || "未記入")}<br>
          飲み物: ${escapeHtml(spotDrinkText(spot))}<br>
          銘柄: ${escapeHtml(spot.sakeBrand || "未記入")}<br>
          おすすめ度: ${escapeHtml(spot.sakeRating || "未記入")}<br>
          評価: ${escapeHtml(ratingDisplay(spot.rating))}<br>
          この店の一品！: ${escapeHtml(spotBestDish(spot) || "未記入")}<br>
          支払額: ${escapeHtml(spot.cost || "未記入")}<br>
          ${escapeHtml(spot.memo || "メモなし")}
          ${spot.googleMapsUrl ? `<br><a href="${escapeHtml(spot.googleMapsUrl)}" target="_blank" rel="noopener">Googleマップで確認</a>` : ""}
        `);
        state.markers.set(spot.id, marker);
      });
    });
  }

  function renderRoute() {
    clearRoute();
    if (!state.routeVisible) {
      return;
    }

    const session = getActiveSession();
    const spots = getSortedSpots(session);
    if (spots.length <= 1) {
      return;
    }

    state.routeLine = L.polyline(
      spots.map((spot) => [spot.lat, spot.lng]),
      {
        color: "#9b3d22",
        weight: 5,
        opacity: 0.82,
        lineCap: "round",
        lineJoin: "round",
        dashArray: "10 8"
      }
    ).addTo(map);
  }

  function renderSummaryStats(records) {
    if (!state.sessions.length) {
      elements.summaryStats.innerHTML = '<p class="empty">まだ記録がありません。</p>';
      elements.sakeTypeStats.innerHTML = "";
      elements.sakeRatingStats.innerHTML = "";
      elements.drinkCountStats.innerHTML = "";
      return;
    }

    const sakeLogCount = records.filter(({ spot }) => hasSakeLog(spot)).length;
    const drinkAgainCount = records.filter(({ spot }) => spot.drinkAgain === "はい").length;
    const revisitCount = records.filter(({ spot }) => spot.revisit === "はい").length;
    const typeCounts = SAKE_TYPES.map((type) => ({
      label: type,
      count: records.filter(({ spot }) => spot.sakeType === type).length
    }));
    const ratingCounts = [1, 2, 3, 4, 5].map((rating) => ({
      label: `${rating}`,
      count: records.filter(({ spot }) => ratingNumber(spot.sakeRating) === rating).length
    }));
    const drinkCupCounts = DRINK_COUNT_TYPES.map((type) => ({
      label: type,
      count: records.reduce((sum, { spot }) => sum + (normalizeDrinkCounts(spot.drinkCounts).find((item) => item.type === type)?.count || 0), 0)
    }));

    elements.summaryStats.innerHTML = [
      ["記録済み飲み会数", state.sessions.length],
      ["登録スポット数", records.length],
      ["酒ログ登録数", sakeLogCount],
      ["もう一度飲みたい", drinkAgainCount],
      ["再訪したいスポット", revisitCount]
    ].map(([label, value]) => `
      <div class="summary-card">
        <strong>${value}</strong>
        <span>${label}</span>
      </div>
    `).join("");

    elements.sakeTypeStats.innerHTML = typeCounts.map((item) => `
      <div class="mini-row"><span>${escapeHtml(item.label)}</span><strong>${item.count}</strong></div>
    `).join("");
    elements.sakeRatingStats.innerHTML = ratingCounts.map((item) => `
      <div class="mini-row"><span>${escapeHtml(item.label)}</span><strong>${item.count}</strong></div>
    `).join("");
    elements.drinkCountStats.innerHTML = drinkCupCounts.some((item) => item.count > 0)
      ? drinkCupCounts.map((item) => `
        <div class="mini-row"><span>${escapeHtml(item.label)}</span><strong>${item.count}杯</strong></div>
      `).join("")
      : '<p class="empty">杯数カウントはまだありません。</p>';
  }

  function renderBrandStats(records) {
    const groups = new Map();
    records.forEach(({ session, spot }) => {
      const brand = spot.sakeBrand.trim();
      if (!brand) {
        return;
      }
      if (!groups.has(brand)) {
        groups.set(brand, {
          brand,
          types: [],
          makers: [],
          ratings: [],
          drinkAgain: 0,
          dates: [],
          shops: []
        });
      }
      const group = groups.get(brand);
      group.types.push(spot.sakeType);
      group.makers.push(spot.sakeMaker);
      const rating = ratingNumber(spot.sakeRating);
      if (rating !== null) group.ratings.push(rating);
      if (spot.drinkAgain === "はい") group.drinkAgain += 1;
      group.dates.push(session.date);
      group.shops.push(spot.name);
    });

    const rows = [...groups.values()].map((group) => ({
      ...group,
      count: group.shops.length,
      average: averageText(group.ratings),
      averageSort: Number(averageText(group.ratings)) || 0,
      lastDate: group.dates.sort().at(-1) || "未記入"
    })).sort((a, b) => b.averageSort - a.averageSort || b.count - a.count || a.brand.localeCompare(b.brand));

    elements.brandStatsList.innerHTML = rows.length
      ? rows.map((row) => `
        <article class="insight-item">
          <h3>${escapeHtml(row.brand)}</h3>
          <p class="meta">種類: ${escapeHtml(uniqueText(row.types, 2))} / 酒蔵: ${escapeHtml(uniqueText(row.makers, 2))}</p>
          <p class="meta">飲んだ回数: ${row.count} / 平均おすすめ度: ${escapeHtml(row.average)} / もう一度: ${row.drinkAgain}</p>
          <p class="meta">最後に飲んだ日付: ${escapeHtml(row.lastDate)} / 店名: ${escapeHtml(uniqueText(row.shops, 3))}</p>
          <button class="link-button" type="button" data-action="search-term" data-term="${escapeHtml(row.brand)}">この銘柄で検索</button>
        </article>
      `).join("")
      : '<p class="empty">該当する記録はありません。</p>';
  }

  function renderMakerStats(records) {
    const groups = new Map();
    records.forEach(({ spot }) => {
      const maker = spot.sakeMaker.trim();
      if (!maker) {
        return;
      }
      if (!groups.has(maker)) {
        groups.set(maker, {
          maker,
          brands: [],
          ratings: [],
          drinkAgain: 0
        });
      }
      const group = groups.get(maker);
      group.brands.push(spot.sakeBrand);
      const rating = ratingNumber(spot.sakeRating);
      if (rating !== null) group.ratings.push(rating);
      if (spot.drinkAgain === "はい") group.drinkAgain += 1;
    });

    const rows = [...groups.values()].map((group) => {
      const brands = [...new Set(group.brands.map((brand) => brand.trim()).filter(Boolean))];
      const average = averageText(group.ratings);
      return {
        ...group,
        brands,
        brandCount: brands.length,
        count: group.brands.length,
        average,
        averageSort: Number(average) || 0
      };
    }).sort((a, b) => b.averageSort - a.averageSort || b.count - a.count || a.maker.localeCompare(b.maker));

    elements.makerStatsList.innerHTML = rows.length
      ? rows.map((row) => `
        <article class="insight-item">
          <h3>${escapeHtml(row.maker)}</h3>
          <p class="meta">登録銘柄数: ${row.brandCount} / 飲んだ回数: ${row.count}</p>
          <p class="meta">平均おすすめ度: ${escapeHtml(row.average)} / もう一度: ${row.drinkAgain}</p>
          <p class="meta">主な銘柄: ${escapeHtml(uniqueText(row.brands, 4))}</p>
          <button class="link-button" type="button" data-action="search-term" data-term="${escapeHtml(row.maker)}">この酒蔵で検索</button>
        </article>
      `).join("")
      : '<p class="empty">該当する記録はありません。</p>';
  }

  function monthlySummaryRows() {
    const groups = new Map();
    state.sessions.forEach((session) => {
      const key = monthKey(session.date);
      if (!groups.has(key)) {
        groups.set(key, {
          month: key,
          sessions: 0,
          spots: 0,
          sakeLogs: 0,
          photos: 0,
          amount: 0,
          drinkCups: 0,
          ratings: [],
          sakeRatings: [],
          drinkAgain: 0,
          revisit: 0
        });
      }
      const group = groups.get(key);
      group.sessions += 1;
      group.spots += session.spots.length;
      group.amount += sessionAmount(session);
      session.spots.forEach((spot) => {
        if (hasSakeLog(spot)) group.sakeLogs += 1;
        group.photos += normalizePhotos(spot.photos).length;
        group.drinkCups += totalDrinkCups(spot.drinkCounts);
        const rating = ratingNumber(spot.rating);
        const sakeRating = ratingNumber(spot.sakeRating);
        if (rating !== null) group.ratings.push(rating);
        if (sakeRating !== null) group.sakeRatings.push(sakeRating);
        if (spot.drinkAgain === "はい") group.drinkAgain += 1;
        if (spot.revisit === "はい") group.revisit += 1;
      });
    });

    return [...groups.values()].sort((a, b) => {
      if (a.month === "日付未設定") return 1;
      if (b.month === "日付未設定") return -1;
      return b.month.localeCompare(a.month);
    });
  }

  function renderMonthlyStats() {
    if (!state.sessions.length) {
      elements.monthlyStatsList.innerHTML = '<p class="empty">まだ記録がありません。</p>';
      return;
    }

    const rows = monthlySummaryRows();

    elements.monthlyStatsList.innerHTML = rows.map((row) => `
      <article class="insight-item">
        <h3>${escapeHtml(row.month)}</h3>
        <p class="meta">飲み会数: ${row.sessions} / スポット数: ${row.spots} / 酒ログ: ${row.sakeLogs} / 写真: ${row.photos}枚</p>
        <p class="meta">支払額合計: ${escapeHtml(formatYen(row.amount))} / 合計杯数: ${row.drinkCups}杯</p>
        <p class="meta">平均評価: ${escapeHtml(averageRatingText(row.ratings))} / 平均おすすめ度: ${escapeHtml(averageText(row.sakeRatings))}</p>
        <p class="meta">もう一度飲みたい: ${row.drinkAgain} / 再訪したい: ${row.revisit}</p>
      </article>
    `).join("");
  }

  function areaSummaryRows(records = getSpotRecords()) {
    const groups = new Map();
    records.forEach(({ session, spot }) => {
      areaKeysForRecord(session, spot).forEach((area) => {
        const searchTerm = area === "エリア未設定" ? "" : area;
        if (!groups.has(area)) {
          groups.set(area, {
            area,
            searchTerm,
            sessions: new Set(),
            spots: 0,
            sakeLogs: 0,
            ratings: [],
            sakeRatings: [],
            drinkAgain: 0,
            revisit: 0
          });
        }
        const group = groups.get(area);
        group.sessions.add(session.id);
        group.spots += 1;
        if (hasSakeLog(spot)) group.sakeLogs += 1;
        const rating = ratingNumber(spot.rating);
        const sakeRating = ratingNumber(spot.sakeRating);
        if (rating !== null) group.ratings.push(rating);
        if (sakeRating !== null) group.sakeRatings.push(sakeRating);
        if (spot.drinkAgain === "はい") group.drinkAgain += 1;
        if (spot.revisit === "はい") group.revisit += 1;
      });
    });

    return [...groups.values()]
      .sort((a, b) => b.spots - a.spots || a.area.localeCompare(b.area));
  }

  function renderAreaStats(records) {
    const rows = areaSummaryRows(records);

    elements.areaStatsList.innerHTML = rows.length
      ? rows.map((row) => `
        <article class="insight-item">
          <h3>${escapeHtml(row.area)}</h3>
          <p class="meta">スポット数: ${row.spots} / 飲み会数: ${row.sessions.size} / 酒ログ: ${row.sakeLogs}</p>
          <p class="meta">平均評価: ${escapeHtml(averageRatingText(row.ratings))} / 平均おすすめ度: ${escapeHtml(averageText(row.sakeRatings))}</p>
          <p class="meta">再訪したい: ${row.revisit} / もう一度飲みたい: ${row.drinkAgain}</p>
          ${row.searchTerm ? `<button class="link-button" type="button" data-action="search-term" data-term="${escapeHtml(row.searchTerm)}">このエリアで検索</button>` : ""}
        </article>
      `).join("")
      : '<p class="empty">該当する記録はありません。</p>';
  }

  function renderFavorites(records) {
    const rows = records.filter(({ spot }) => (
      ratingNumber(spot.rating) >= 4 ||
      spot.revisit === "はい" ||
      ratingNumber(spot.sakeRating) >= 4 ||
      spot.drinkAgain === "はい"
    )).sort((a, b) => String(b.session.date).localeCompare(String(a.session.date)));

    elements.favoriteList.innerHTML = rows.length
      ? rows.map(({ session, spot }) => `
        <article class="insight-item">
          <h3>${escapeHtml(spot.name)}</h3>
          <p class="meta">${escapeHtml(session.date)} / ${escapeHtml(session.title)}</p>
          <p class="meta">銘柄: ${escapeHtml(spot.sakeBrand || "未記入")} / 評価: ${escapeHtml(ratingDisplay(spot.rating))} / おすすめ度: ${escapeHtml(spot.sakeRating || "未記入")}</p>
          <p class="meta">${escapeHtml(spot.memo || spot.sakeMemo || "メモなし")}</p>
          <button class="link-button" type="button" data-action="focus-spot" data-session-id="${session.id}" data-spot-id="${spot.id}">地図で表示</button>
        </article>
      `).join("")
      : '<p class="empty">該当する記録はありません。</p>';
  }

  function renderStorageStats() {
    const summary = storageSummary();
    const shouldWarn = summary.bytes >= 3 * 1024 * 1024 || summary.photoCount >= 10;
    elements.storageStats.innerHTML = `
      <div class="summary-grid">
        <div class="summary-card">
          <strong>${formatBytes(summary.bytes)}</strong>
          <span>保存データ容量</span>
        </div>
        <div class="summary-card">
          <strong>${summary.photoCount}枚</strong>
          <span>写真枚数</span>
        </div>
        <div class="summary-card">
          <strong>${summary.photoSpotCount}件</strong>
          <span>写真付きスポット</span>
        </div>
      </div>
      ${shouldWarn ? '<p class="capacity-warning">写真が増えると保存容量を超える場合があります。定期的にJSONバックアップしてください。</p>' : '<p class="hint">写真を増やす前や整理前にはJSONバックアップをおすすめします。</p>'}
    `;
  }

  function renderPhotoGallery() {
    const rows = getPhotoSpotRecords()
      .sort((a, b) => String(b.session.date).localeCompare(String(a.session.date)));

    elements.photoGalleryList.innerHTML = rows.length
      ? rows.map(({ session, spot, photos }) => {
        const firstPhoto = photos[0];
        const caption = photoCaption(firstPhoto);
        const memo = String(spot.memo || spot.sakeMemo || "メモなし");
        return `
          <article class="photo-gallery-item">
            <button class="photo-open-button" type="button" data-action="view-photos" data-session-id="${session.id}" data-spot-id="${spot.id}" data-photo-index="0">
              <img class="gallery-thumb" src="${photoDataUrl(firstPhoto)}" alt="${escapeHtml(spot.name)}の写真">
            </button>
            <div>
              <h3>${escapeHtml(spot.name)}</h3>
              <p class="meta">${escapeHtml(session.date)} / ${escapeHtml(session.title)}</p>
              <p class="meta">${escapeHtml(areaLabelForSpot(session, spot))} / 銘柄: ${escapeHtml(spot.sakeBrand || "未記入")} / 写真${photos.length}枚</p>
              <p class="meta">${escapeHtml(caption ? `写真メモ: ${caption}` : memo.slice(0, 48))}</p>
              <div class="photo-gallery-actions">
                <button class="link-button" type="button" data-action="focus-spot" data-session-id="${session.id}" data-spot-id="${spot.id}">このスポットへ移動</button>
                <button class="link-button danger" type="button" data-action="delete-spot-photos" data-session-id="${session.id}" data-spot-id="${spot.id}">写真を削除</button>
              </div>
            </div>
          </article>
        `;
      }).join("")
      : '<p class="empty">写真付きの記録はまだありません。</p>';
  }

  function rawStoredSessions() {
    const text = localStorage.getItem(STORAGE_KEY) || "[]";
    const parsed = JSON.parse(text);
    const rawSessions = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.sessions)
        ? parsed.sessions
        : null;
    if (!rawSessions) {
      throw new Error("保存データの形式がさけいちずの記録配列ではありません。");
    }
    return rawSessions;
  }

  function isOldPhotoString(photo) {
    return typeof photo === "string" && isValidPhotoDataUrl(photo);
  }

  function isNewPhotoObject(photo) {
    return Boolean(photo && typeof photo === "object" && isValidPhotoDataUrl(photo.dataUrl));
  }

  function analyzeStoredData() {
    const issues = [];
    let rawSessions = [];
    try {
      rawSessions = rawStoredSessions();
    } catch (error) {
      return {
        fatal: true,
        issues: [{
          level: "error",
          text: error.message || "保存データを読み取れませんでした。",
          autofixable: false
        }]
      };
    }

    let missingSakeFields = 0;
    let missingAreaFields = 0;
    let missingMapFields = 0;
    let missingDrinkCountFields = 0;
    let invalidDrinkCountValues = 0;
    let missingRatingFields = 0;
    let invalidRatingValues = 0;
    const unreadableCosts = [];
    let missingPhotosFields = 0;
    let oldPhotoStrings = 0;
    let invalidPhotoValues = 0;

    rawSessions.forEach((session, sessionIndex) => {
      if (!session || typeof session !== "object") {
        issues.push({
          level: "error",
          text: `${sessionIndex + 1}件目の飲み会記録がオブジェクトではありません。`,
          autofixable: false
        });
        return;
      }
      if (!session.id) {
        issues.push({
          level: "warning",
          text: `${sessionIndex + 1}件目の飲み会にIDがありません。`,
          autofixable: true
        });
      }
      if (!Array.isArray(session.spots)) {
        issues.push({
          level: "warning",
          text: `${session.title || sessionIndex + 1} のスポット一覧が配列ではありません。`,
          autofixable: true
        });
        return;
      }

      session.spots.forEach((spot, spotIndex) => {
        const spotLabel = `${session.title || "無題"} / ${spot?.name || `${spotIndex + 1}件目のスポット`}`;
        if (!spot || typeof spot !== "object") {
          issues.push({
            level: "error",
            text: `${spotLabel} がオブジェクトではありません。`,
            autofixable: false
          });
          return;
        }
        if (!spot.id) {
          issues.push({
            level: "warning",
            text: `${spotLabel} にスポットIDがありません。`,
            autofixable: true
          });
        }
        if (!Number.isFinite(Number(spot.lat)) || !Number.isFinite(Number(spot.lng))) {
          issues.push({
            level: "error",
            text: `${spotLabel} の緯度・経度が数値として扱えません。`,
            autofixable: false
          });
        }
        if (!Array.isArray(spot.photos)) {
          missingPhotosFields += 1;
        } else {
          spot.photos.forEach((photo) => {
            if (isOldPhotoString(photo)) {
              oldPhotoStrings += 1;
            } else if (!isNewPhotoObject(photo)) {
              invalidPhotoValues += 1;
            }
          });
        }
        if (!Object.prototype.hasOwnProperty.call(spot, "area")) {
          missingAreaFields += 1;
        }
        ["address", "mapCandidateName", "googleMapsUrl"].forEach((field) => {
          if (!Object.prototype.hasOwnProperty.call(spot, field)) {
            missingMapFields += 1;
          }
        });
        if (!Object.prototype.hasOwnProperty.call(spot, "drinkCounts")) {
          missingDrinkCountFields += 1;
        } else if (!Array.isArray(spot.drinkCounts)) {
          invalidDrinkCountValues += 1;
        } else {
          spot.drinkCounts.forEach((item) => {
            if (!item || typeof item !== "object" || !String(item.type || "").trim() || Math.floor(Number(item.count) || 0) <= 0) {
              invalidDrinkCountValues += 1;
            }
          });
        }
        if (isUnreadableAmount(spot.cost)) {
          unreadableCosts.push(spotLabel);
        }
        if (!Object.prototype.hasOwnProperty.call(spot, "rating")) {
          missingRatingFields += 1;
        } else if (!ratingRank(spot.rating)) {
          invalidRatingValues += 1;
        }
        ["sakeType", "sakeBrand", "sakeMaker", "sakeTaste", "sakeRating", "drinkAgain", "sakeMemo"].forEach((field) => {
          if (!Object.prototype.hasOwnProperty.call(spot, field)) {
            missingSakeFields += 1;
          }
        });
      });
    });

    if (missingPhotosFields) {
      issues.push({
        level: "warning",
        text: `${missingPhotosFields}件のスポットで photos が配列ではありません。空配列に補完できます。`,
        autofixable: true
      });
    }
    if (oldPhotoStrings) {
      issues.push({
        level: "warning",
        text: `${oldPhotoStrings}枚の写真が旧形式の文字列です。キャプション付き形式に補完できます。`,
        autofixable: true
      });
    }
    if (invalidPhotoValues) {
      issues.push({
        level: "warning",
        text: `${invalidPhotoValues}件の不正な写真データがあります。自動補正では除外します。`,
        autofixable: true
      });
    }
    if (missingAreaFields) {
      issues.push({
        level: "warning",
        text: `${missingAreaFields}件のスポットでエリア項目がありません。空欄で補完できます。`,
        autofixable: true
      });
    }
    if (missingMapFields) {
      issues.push({
        level: "warning",
        text: `住所・地図候補項目の不足が${missingMapFields}項目あります。空欄で補完できます。`,
        autofixable: true
      });
    }
    if (missingDrinkCountFields) {
      issues.push({
        level: "warning",
        text: `${missingDrinkCountFields}件のスポットで飲み物カウントがありません。空配列で補完できます。`,
        autofixable: true
      });
    }
    if (invalidDrinkCountValues) {
      issues.push({
        level: "warning",
        text: `${invalidDrinkCountValues}件の飲み物カウントが不正です。自動補正では有効な杯数だけ残します。`,
        autofixable: true
      });
    }
    if (missingRatingFields) {
      issues.push({
        level: "warning",
        text: `${missingRatingFields}件のスポットで評価項目がありません。Bで補完できます。`,
        autofixable: true
      });
    }
    if (invalidRatingValues) {
      issues.push({
        level: "warning",
        text: `${invalidRatingValues}件のスポット評価が不正です。S/A/B/C/Dまたは旧1〜5評価に補正できます。`,
        autofixable: true
      });
    }
    if (unreadableCosts.length) {
      issues.push({
        level: "warning",
        text: `支払額を読み取れないスポットがあります: ${unreadableCosts.slice(0, 5).join("、")}${unreadableCosts.length > 5 ? ` ほか${unreadableCosts.length - 5}件` : ""}`,
        autofixable: false
      });
    }
    if (missingSakeFields) {
      issues.push({
        level: "warning",
        text: `酒ログ項目の不足が${missingSakeFields}項目あります。空欄で補完できます。`,
        autofixable: true
      });
    }

    return { fatal: false, issues };
  }

  function renderDataCheckResults(title, items, level = "info") {
    const content = items.length
      ? `<ul>${items.map((item) => `<li>${escapeHtml(item.text || item)}</li>`).join("")}</ul>`
      : '<p class="empty">問題は見つかりませんでした。</p>';
    elements.dataCheckResults.innerHTML = `
      <div class="check-card ${level}">
        <h3>${escapeHtml(title)}</h3>
        ${content}
      </div>
    `;
  }

  function runDataCheck() {
    const report = analyzeStoredData();
    if (!report.issues.length) {
      renderDataCheckResults("データチェック結果", [], "success");
      showStatus("データチェックを実行しました。問題は見つかりませんでした。", "success");
      return;
    }
    const hasError = report.issues.some((issue) => issue.level === "error");
    renderDataCheckResults("データチェック結果", report.issues, hasError ? "error" : "warning");
    showStatus("データチェックで確認が必要な項目が見つかりました。", hasError ? "error" : "warning");
  }

  function completedSpotForAutoFix(spot, index) {
    return {
      id: typeof spot.id === "string" && spot.id ? spot.id : makeId("spot"),
      order: String(spot.order || `${index + 1}軒目`),
      name: String(spot.name || "名称未設定"),
      category: String(spot.category || "その他"),
      area: String(spot.area || ""),
      address: String(spot.address || ""),
      mapCandidateName: String(spot.mapCandidateName || ""),
      googleMapsUrl: String(spot.googleMapsUrl || ""),
      lat: Number(spot.lat),
      lng: Number(spot.lng),
      drinks: String(spot.drinks || ""),
      drinkCounts: normalizeDrinkCounts(spot.drinkCounts),
      sakeType: String(spot.sakeType || ""),
      sakeBrand: String(spot.sakeBrand || ""),
      sakeMaker: String(spot.sakeMaker || ""),
      sakeTaste: String(spot.sakeTaste || ""),
      sakeRating: String(spot.sakeRating || ""),
      drinkAgain: String(spot.drinkAgain || ""),
      sakeMemo: String(spot.sakeMemo || ""),
      foods: spotBestDish(spot),
      bestDish: spotBestDish(spot),
      cost: String(spot.cost || ""),
      rating: ratingRank(spot.ratingRank || spot.rating, "B"),
      revisit: String(spot.revisit || "はい"),
      memo: String(spot.memo || ""),
      photos: normalizePhotos(spot.photos),
      createdAt: String(spot.createdAt || new Date().toISOString())
    };
  }

  function autoFixData() {
    const report = analyzeStoredData();
    if (!report.issues.length) {
      renderDataCheckResults("自動補正", [], "success");
      showStatus("自動補正が必要な項目はありません。", "success");
      return;
    }
    const blockingIssues = report.issues.filter((issue) => issue.level === "error" && !issue.autofixable);
    if (blockingIssues.length) {
      renderDataCheckResults("自動補正できない問題", blockingIssues, "error");
      showStatus("緯度経度など自動補正できない問題があります。内容を確認してください。", "error");
      return;
    }
    showStatus("自動補正の前に、通常JSONエクスポートでバックアップすることをおすすめします。", "warning");
    if (!confirm("保存データの不足項目を自動補正します。実行前に通常JSONエクスポートでバックアップすることをおすすめします。続行しますか？")) {
      showStatus("自動補正をキャンセルしました。", "info");
      return;
    }

    const previousSessions = JSON.stringify(state.sessions);
    try {
      const rawSessions = rawStoredSessions();
      const fixedSessions = rawSessions.map((session) => ({
        id: typeof session.id === "string" && session.id ? session.id : makeId("session"),
        date: String(session.date || ""),
        title: String(session.title || "無題の飲み会"),
        companions: String(session.companions || ""),
        overallMemo: String(session.overallMemo || ""),
        totalCostMemo: String(session.totalCostMemo || session.totalMemo || ""),
        tags: Array.isArray(session.tags) ? session.tags.map(String).filter(Boolean) : parseTags(session.tags),
        spots: Array.isArray(session.spots)
          ? session.spots.map(completedSpotForAutoFix)
          : [],
        createdAt: String(session.createdAt || new Date().toISOString()),
        updatedAt: new Date().toISOString()
      }));
      state.sessions = fixedSessions;
      state.activeSessionId = state.sessions[0]?.id || null;
      if (!saveSessions()) {
        state.sessions = JSON.parse(previousSessions);
        render();
        return;
      }
      if (state.activeSessionId) {
        fillSessionForm(getActiveSession());
      } else {
        resetSessionForm();
      }
      render();
      renderDataCheckResults("自動補正", [], "success");
      showStatus("不足項目を自動補正しました。", "success");
    } catch (error) {
      state.sessions = JSON.parse(previousSessions);
      renderDataCheckResults("自動補正エラー", [{ text: error.message || "自動補正できませんでした。" }], "error");
      showStatus(error.message || "自動補正できませんでした。", "error");
    }
  }

  function comparableText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  }

  function spotsAreClose(a, b) {
    return Number.isFinite(Number(a.lat))
      && Number.isFinite(Number(a.lng))
      && Number.isFinite(Number(b.lat))
      && Number.isFinite(Number(b.lng))
      && Math.abs(Number(a.lat) - Number(b.lat)) <= 0.0005
      && Math.abs(Number(a.lng) - Number(b.lng)) <= 0.0005;
  }

  function duplicateReason(a, b) {
    const checks = [];
    if (a.session.date && a.session.date === b.session.date) {
      checks.push("日付一致");
    }
    if (comparableText(a.session.title) && comparableText(a.session.title) === comparableText(b.session.title)) {
      checks.push("飲み会タイトル一致");
    }
    if (comparableText(a.spot.name) && comparableText(a.spot.name) === comparableText(b.spot.name)) {
      checks.push("店名一致");
    }
    if (spotsAreClose(a.spot, b.spot)) {
      checks.push("緯度経度が近い");
    }
    if (comparableText(a.spot.sakeBrand) && comparableText(a.spot.sakeBrand) === comparableText(b.spot.sakeBrand)) {
      checks.push("銘柄一致");
    }
    const strongMatch = checks.includes("日付一致")
      && checks.includes("飲み会タイトル一致")
      && (checks.includes("店名一致") || checks.includes("緯度経度が近い") || checks.includes("銘柄一致"));
    return strongMatch || checks.length >= 3 ? checks : [];
  }

  function runDuplicateCheck() {
    const records = getSpotRecords();
    const candidates = [];
    for (let index = 0; index < records.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < records.length; compareIndex += 1) {
        const reasons = duplicateReason(records[index], records[compareIndex]);
        if (reasons.length) {
          candidates.push({
            first: records[index],
            second: records[compareIndex],
            reasons
          });
        }
      }
    }

    if (!candidates.length) {
      renderDataCheckResults("重複候補チェック", [], "success");
      showStatus("重複候補は見つかりませんでした。", "success");
      return;
    }

    const items = candidates.slice(0, 30).map(({ first, second, reasons }) => ({
      text: `${first.session.date || "日付未設定"} / ${first.session.title} / ${first.spot.name} と ${second.session.date || "日付未設定"} / ${second.session.title} / ${second.spot.name}（${reasons.join("、")}）`
    }));
    elements.dataCheckResults.innerHTML = `
      <div class="check-card warning">
        <h3>重複候補チェック</h3>
        <p class="hint">候補は自動削除しません。内容を確認して、必要に応じて手動で整理してください。</p>
        <ul>${items.map((item) => `<li>${escapeHtml(item.text)}</li>`).join("")}</ul>
        ${candidates.length > 30 ? `<p class="hint">ほか${candidates.length - 30}件の候補があります。</p>` : ""}
      </div>
    `;
    showStatus(`${candidates.length}件の重複候補が見つかりました。`, "warning");
  }

  function renderInsights() {
    const records = getSpotRecords();
    renderStorageStats();
    renderPhotoGallery();
    renderSummaryStats(records);
    renderMonthlyStats();
    renderAreaStats(records);
    renderBrandStats(records);
    renderMakerStats(records);
    renderFavorites(records);
  }

  function renderActiveSessionPanel() {
    const session = getActiveSession();
    if (!session) {
      elements.activeSessionSummary.innerHTML = '<p class="empty">飲み会記録を保存すると、ここに今回の概要が表示されます。</p>';
      elements.activeSpotList.innerHTML = "";
      return;
    }

    const tags = parseTags(session.tags);
    const spots = getSortedSpots(session);
    elements.activeSessionSummary.innerHTML = `
      <div class="active-summary-grid">
        <div><span>日付</span><strong>${escapeHtml(session.date || "未設定")}</strong></div>
        <div><span>タイトル</span><strong>${escapeHtml(session.title || "無題")}</strong></div>
        <div><span>支払額合計</span><strong>${escapeHtml(formatYen(sessionAmount(session)))}</strong></div>
        <div><span>スポット数</span><strong>${spots.length}件</strong></div>
      </div>
      <div class="tag-row">${tags.length ? tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("") : '<span class="tag">タグなし</span>'}</div>
    `;

    elements.activeSpotList.innerHTML = spots.length
      ? `
        <h3>今回のスポット</h3>
        <div class="compact-spot-list">
          ${spots.map((spot) => `
            <article class="compact-spot-item">
              <div>
                <strong>${escapeHtml(spot.order || "")} ${escapeHtml(spot.name)}</strong>
                <p class="meta">${escapeHtml(spot.category)} / ${escapeHtml(areaLabelForSpot(session, spot))}</p>
                <p class="meta">飲み物: ${escapeHtml(spotDrinkText(spot))} / 支払額 ${escapeHtml(spot.cost || "未記入")}</p>
                <p class="meta">銘柄: ${escapeHtml(spot.sakeBrand || "未記入")} / 評価 ${escapeHtml(ratingDisplay(spot.rating))}</p>
                <p class="meta">この店の一品！: ${escapeHtml(spotBestDish(spot) || "未記入")}</p>
              </div>
              <button class="small-button" type="button" data-action="focus-spot" data-session-id="${session.id}" data-spot-id="${spot.id}">地図</button>
            </article>
          `).join("")}
        </div>
      `
      : '<p class="empty">今回のスポットはまだありません。地図をクリックして追加できます。</p>';
  }

  function renderSessions() {
    const visibleSessions = state.sessions.filter(sessionMatchesSearch);
    elements.recordCount.textContent = state.searchQuery
      ? `${visibleSessions.length}/${state.sessions.length}件`
      : `${state.sessions.length}件`;

    if (state.sessions.length === 0) {
      elements.sessionList.innerHTML = '<p class="empty">まだ記録がありません。</p>';
      elements.sessionHint.textContent = "まず飲み会記録を保存してから、地図をクリックしてスポットを追加します。";
      return;
    }

    if (visibleSessions.length === 0) {
      elements.sessionList.innerHTML = '<p class="empty">検索条件に合う記録がありません。</p>';
      const activeSession = getActiveSession();
      elements.sessionHint.textContent = activeSession
        ? `編集中: ${activeSession.title}`
        : "一覧から編集する記録を選ぶか、新規作成してください。";
      return;
    }

    const activeSession = getActiveSession();
    elements.sessionHint.textContent = activeSession
      ? `編集中: ${activeSession.title}`
      : "一覧から編集する記録を選ぶか、新規作成してください。";

    elements.sessionList.innerHTML = visibleSessions.map((session) => {
      const tags = (session.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
      const paymentTotal = sessionAmount(session);
      const spots = session.spots.length
        ? getSortedSpots(session).map((spot) => {
          const photos = normalizePhotos(spot.photos);
          const photoCount = photos.length;
          const photoHtml = photoCount ? `
            <div class="spot-photo-row">
              <button class="photo-open-button" type="button" data-action="view-photos" data-session-id="${session.id}" data-spot-id="${spot.id}" data-photo-index="0">
                <img class="spot-thumb" src="${photoDataUrl(photos[0])}" alt="${escapeHtml(spot.name)}の写真">
              </button>
              <span class="meta">写真${photoCount}枚</span>
            </div>
          ` : "";
          return `
            <article class="spot-item">
            <div class="spot-top">
              <div>
                <strong>${escapeHtml(spot.order)} ${escapeHtml(spot.name)}</strong>
                <div class="meta">${escapeHtml(spot.category)} / ${escapeHtml(areaLabelForSpot(session, spot))} / 評価 ${escapeHtml(ratingDisplay(spot.rating))} / 再訪 ${escapeHtml(spot.revisit)}</div>
                <div class="meta">住所: ${escapeHtml(spot.address || "未記入")}</div>
                <div class="meta">飲み物: ${escapeHtml(spotDrinkText(spot))} / 支払額 ${escapeHtml(spot.cost || "未記入")}</div>
                <div class="meta">酒ログ: ${escapeHtml(spot.sakeType || "種類未記入")} / ${escapeHtml(spot.sakeBrand || "銘柄未記入")} / おすすめ度 ${escapeHtml(spot.sakeRating || "未記入")} / もう一度 ${escapeHtml(spot.drinkAgain || "未記入")}</div>
                <div class="meta">この店の一品！: ${escapeHtml(spotBestDish(spot) || "未記入")}</div>
              </div>
              <div class="spot-actions">
                <button class="small-button" type="button" data-action="edit-spot" data-session-id="${session.id}" data-spot-id="${spot.id}">編集</button>
                <button class="small-button danger" type="button" data-action="delete-spot" data-session-id="${session.id}" data-spot-id="${spot.id}">削除</button>
              </div>
            </div>
            <div class="meta">${escapeHtml(spot.memo || "メモなし")}</div>
            ${photoHtml}
          </article>
          `;
        }).join("")
        : '<p class="empty">スポット未登録</p>';

      return `
        <article class="record ${session.id === state.activeSessionId ? "is-active" : ""}">
          <div class="record-header">
            <div>
              <h3>${escapeHtml(session.title)}</h3>
              <div class="meta">${escapeHtml(session.date)} / ${escapeHtml(session.companions || "同行者なし")}</div>
            </div>
            <button class="small-button danger" type="button" data-action="delete-session" data-session-id="${session.id}">削除</button>
          </div>
          <p class="meta">${escapeHtml(session.overallMemo || "全体メモなし")}</p>
          <p class="meta">支払額合計: ${escapeHtml(formatYen(paymentTotal))}</p>
          <div class="tag-row">${tags || '<span class="tag">タグなし</span>'}</div>
          <button class="small-button" type="button" data-action="select-session" data-session-id="${session.id}">この記録を編集</button>
          <div class="spot-list">${spots}</div>
        </article>
      `;
    }).join("");
  }

  function plain(value, fallback = "未記入") {
    return value ? String(value) : fallback;
  }

  function generateBlogDraft() {
    const session = getActiveSession();
    if (!session) {
      showStatus("ブログ下書きを作成する飲み会記録を選んでください。");
      return;
    }

    const spots = getSortedSpots(session);
    const routeText = spots.length
      ? spots.map((spot) => `${plain(spot.order, "訪問")}「${spot.name}」`).join(" → ")
      : "今回はスポットがまだ登録されていません。";

    const spotSections = spots.length
      ? spots.map((spot, index) => {
        const photos = normalizePhotos(spot.photos);
        const captions = photoCaptionsText(photos);
        return [
          `## ${index + 1}. ${plain(spot.order, `${index + 1}軒目`)}：${spot.name}`,
          `カテゴリ：${plain(spot.category)}`,
          `住所：${plain(spot.address)}`,
          `地図候補名：${plain(spot.mapCandidateName)}`,
          `飲み物カウント：${plain(formatDrinkCounts(spot.drinkCounts, ""))}`,
          `飲んだものメモ：${plain(spot.drinks)}`,
          `写真：${photos.length ? `${photos.length}枚` : "なし"}`,
          captions ? `写真キャプション：${captions}` : "",
          "### 酒ログ",
          `酒の種類：${plain(spot.sakeType)}`,
          `銘柄：${plain(spot.sakeBrand)}`,
          `酒蔵・メーカー：${plain(spot.sakeMaker)}`,
          `味の印象：${plain(spot.sakeTaste)}`,
          `おすすめ度：${plain(spot.sakeRating)} / 5`,
          `もう一度飲みたい：${plain(spot.drinkAgain)}`,
          `酒メモ：${plain(spot.sakeMemo)}`,
          `この店の一品！：${plain(spotBestDish(spot))}`,
          `支払額：${plain(spot.cost)}`,
          `評価：${ratingDisplay(spot.rating)}`,
          `再訪したい：${plain(spot.revisit)}`,
          `メモ：${plain(spot.memo)}`,
          ""
        ].filter((line) => line !== "").join("\n");
      }).join("\n")
      : "## 訪問スポット\nまだスポットが登録されていません。\n";

    elements.blogDraft.value = [
      `# ${session.title}`,
      "",
      `${plain(session.date)}、${plain(session.companions, "同行者なし")}と飲み歩いた記録です。`,
      "その日の空気やお酒の印象を、あとから思い出せるようにまとめます。",
      "",
      "## 基本情報",
      `日付：${plain(session.date)}`,
      `同行者：${plain(session.companions, "同行者なし")}`,
      `支払額合計：${formatYen(sessionAmount(session))}`,
      `タグ：${session.tags.length ? session.tags.join("、") : "タグなし"}`,
      "",
      "## 全体メモ",
      plain(session.overallMemo),
      "",
      "## 訪問した店の流れ",
      routeText,
      "",
      spotSections,
      "## 全体の感想",
      "ここに、この日の飲み歩き全体の感想を書きます。お酒、料理、街の雰囲気、次に行きたい店などを自由に追記してください。",
      ""
    ].join("\n");
    showStatus("ブログ下書きを作成しました。");
  }

  async function copyBlogDraft() {
    if (!elements.blogDraft.value.trim()) {
      showStatus("コピーするブログ下書きがありません。");
      return;
    }

    try {
      await navigator.clipboard.writeText(elements.blogDraft.value);
      showStatus("ブログ下書きをコピーしました。");
    } catch (error) {
      elements.blogDraft.select();
      document.execCommand("copy");
      showStatus("ブログ下書きをコピーしました。");
    }
  }

  function exportJson() {
    const hasPhotos = getSpotRecords().some(({ spot }) => spot.photos?.length);
    if (hasPhotos) {
      alert("写真を含むため、JSONファイルのサイズが大きくなる場合があります。");
    }
    const payload = {
      app: "さけいちず",
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      sessions: state.sessions
    };
    downloadJsonPayload(payload, `nomichizu-${todayText()}.json`);
    showStatus("JSONファイルを書き出しました。", "success");
  }

  function downloadJsonPayload(payload, fileName) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function sessionsWithoutPhotos() {
    return JSON.parse(JSON.stringify(state.sessions)).map((session) => ({
      ...session,
      spots: (session.spots || []).map((spot) => ({
        ...spot,
        photos: []
      }))
    }));
  }

  function exportLightJson() {
    const payload = {
      app: "さけいちず",
      version: EXPORT_VERSION,
      photoMode: "excluded",
      exportedAt: new Date().toISOString(),
      sessions: sessionsWithoutPhotos()
    };
    downloadJsonPayload(payload, `sakeichizu_light_export_${compactDateText(todayText())}.json`);
    showStatus("写真を除外した軽量バックアップを書き出しました。", "success");
  }

  function csvCell(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  function buildCsvRows() {
    const headers = [
      "飲み会ID",
      "日付",
      "月",
      "飲み会タイトル",
      "同行者",
      "全体メモ",
      "総額メモ",
      "支払額合計",
      "タグ",
      "スポット順番",
      "店名",
      "カテゴリ",
      "エリア",
      "住所",
      "地図候補名",
      "Googleマップ確認URL",
      "緯度",
      "経度",
      "飲んだもの",
      "飲み物カウント",
      "合計杯数",
      "酒の種類",
      "銘柄",
      "酒蔵・メーカー",
      "味の印象",
      "おすすめ度",
      "もう一度飲みたい",
      "酒メモ",
      "この店の一品！",
      "支払額",
      "評価",
      "再訪したい",
      "スポットメモ",
      "写真枚数",
      "写真あり",
      "写真キャプション",
      "保存写真サイズ目安"
    ];

    const rows = state.sessions.flatMap((session) => {
      const spots = getSortedSpots(session);
      const exportSpots = spots.length ? spots : [null];
      return exportSpots.map((spot) => [
        session.id,
        session.date,
        monthKey(session.date),
        session.title,
        session.companions,
        session.overallMemo,
        session.totalCostMemo,
        sessionAmount(session),
        (session.tags || []).join("、"),
        spot?.order || "",
        spot?.name || "",
        spot?.category || "",
        spot?.area || "",
        spot?.address || "",
        spot?.mapCandidateName || "",
        spot?.googleMapsUrl || "",
        spot ? spot.lat : "",
        spot ? spot.lng : "",
        spot?.drinks || "",
        spot ? csvDrinkCounts(spot.drinkCounts) : "",
        spot ? totalDrinkCups(spot.drinkCounts) : "",
        spot?.sakeType || "",
        spot?.sakeBrand || "",
        spot?.sakeMaker || "",
        spot?.sakeTaste || "",
        spot?.sakeRating || "",
        spot?.drinkAgain || "",
        spot?.sakeMemo || "",
        spot ? spotBestDish(spot) : "",
        spot?.cost || "",
        spot ? ratingDisplay(spot.rating, "") : "",
        spot?.revisit || "",
        spot?.memo || "",
        spot?.photos?.length || 0,
        spot?.photos?.length ? "はい" : "いいえ",
        spot ? normalizePhotos(spot.photos).map(photoCaption).filter(Boolean).join(" / ") : "",
        spot ? formatBytes(estimatedBytes(JSON.stringify(normalizePhotos(spot.photos)))) : ""
      ]);
    });

    return [headers, ...rows];
  }

  function buildMonthlyCsvRows() {
    return [
      [
        "年月",
        "飲み会数",
        "スポット数",
        "酒ログ登録数",
        "写真枚数",
        "金額概算",
        "合計杯数",
        "平均評価",
        "平均おすすめ度",
        "もう一度飲みたい件数",
        "再訪したい件数"
      ],
      ...monthlySummaryRows().map((row) => [
        row.month,
        row.sessions,
        row.spots,
        row.sakeLogs,
        row.photos,
        row.amount,
        row.drinkCups,
        averageRatingText(row.ratings),
        averageText(row.sakeRatings),
        row.drinkAgain,
        row.revisit
      ])
    ];
  }

  function buildAreaCsvRows() {
    return [
      [
        "エリア",
        "スポット数",
        "飲み会数",
        "酒ログ登録数",
        "平均評価",
        "平均おすすめ度",
        "再訪したい件数",
        "もう一度飲みたい件数"
      ],
      ...areaSummaryRows().map((row) => [
        row.area,
        row.spots,
        row.sessions.size,
        row.sakeLogs,
        averageRatingText(row.ratings),
        averageText(row.sakeRatings),
        row.revisit,
        row.drinkAgain
      ])
    ];
  }

  function downloadCsvRows(rows, fileName) {
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    downloadCsvRows(buildCsvRows(), `nomichizu_export_${compactDateText(todayText())}.csv`);
    showStatus("CSVファイルを書き出しました。", "success");
  }

  function exportMonthlyCsv() {
    downloadCsvRows(buildMonthlyCsvRows(), `sakeichizu_monthly_summary_${compactDateText(todayText())}.csv`);
    showStatus("月別集計CSVを書き出しました。", "success");
  }

  function exportAreaCsv() {
    downloadCsvRows(buildAreaCsvRows(), `sakeichizu_area_summary_${compactDateText(todayText())}.csv`);
    showStatus("エリア別集計CSVを書き出しました。", "success");
  }

  function parseCsv(text) {
    const source = String(text || "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const next = source[index + 1];
      if (inQuotes) {
        if (char === '"' && next === '"') {
          cell += '"';
          index += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          cell += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (char !== "\r") {
        cell += char;
      }
    }

    if (inQuotes) {
      throw new Error("CSVのダブルクォートが閉じられていません。ファイル内容を確認してください。");
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter((item) => item.some((value) => String(value || "").trim()));
  }

  function readCsvValue(record, header) {
    return String(record[header] ?? "").trim();
  }

  function readCsvAnyValue(record, headers) {
    const names = Array.isArray(headers) ? headers : [headers];
    for (const header of names) {
      const value = readCsvValue(record, header);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function parseNumberValue(value) {
    const number = Number(String(value || "").trim());
    return Number.isFinite(number) ? number : null;
  }

  function sessionsFromCsv(text) {
    const rows = parseCsv(text);
    if (rows.length < 2) {
      throw new Error("CSVに取り込むデータ行がありません。");
    }

    const headers = rows[0].map((header) => String(header || "").trim());
    const requiredHeaders = ["飲み会ID", "日付", "飲み会タイトル", "店名", "緯度", "経度"];
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length) {
      throw new Error(`CSVの必要列が不足しています: ${missingHeaders.join("、")}`);
    }

    const sessionMap = new Map();
    rows.slice(1).forEach((row, rowIndex) => {
      const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
      const sourceSessionId = readCsvValue(record, "飲み会ID") || `csv-row-${rowIndex}`;
      const title = readCsvValue(record, "飲み会タイトル");
      if (!title) {
        throw new Error(`${rowIndex + 2}行目の飲み会タイトルが空です。`);
      }

      if (!sessionMap.has(sourceSessionId)) {
        sessionMap.set(sourceSessionId, {
          id: makeId("session"),
          date: readCsvValue(record, "日付"),
          title,
          companions: readCsvValue(record, "同行者"),
          overallMemo: readCsvValue(record, "全体メモ"),
          totalCostMemo: readCsvValue(record, "総額メモ"),
          tags: parseTags(readCsvValue(record, "タグ")),
          spots: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const session = sessionMap.get(sourceSessionId);
      const spotName = readCsvValue(record, "店名");
      if (!spotName) {
        return;
      }

      const lat = parseNumberValue(readCsvValue(record, "緯度"));
      const lng = parseNumberValue(readCsvValue(record, "経度"));
      if (lat === null || lng === null) {
        throw new Error(`${rowIndex + 2}行目の緯度または経度が読み取れません。`);
      }

      session.spots.push({
        id: makeId("spot"),
        order: readCsvValue(record, "スポット順番"),
        name: spotName,
        category: readCsvValue(record, "カテゴリ") || "その他",
        area: readCsvValue(record, "エリア"),
        address: readCsvValue(record, "住所"),
        mapCandidateName: readCsvValue(record, "地図候補名"),
        googleMapsUrl: readCsvValue(record, "Googleマップ確認URL") || googleMapsUrl(lat, lng),
        lat,
        lng,
        drinks: readCsvValue(record, "飲んだもの"),
        drinkCounts: parseDrinkCountsText(readCsvValue(record, "飲み物カウント")),
        sakeType: readCsvValue(record, "酒の種類"),
        sakeBrand: readCsvValue(record, "銘柄"),
        sakeMaker: readCsvValue(record, "酒蔵・メーカー"),
        sakeTaste: readCsvValue(record, "味の印象"),
        sakeRating: readCsvValue(record, "おすすめ度"),
        drinkAgain: readCsvValue(record, "もう一度飲みたい"),
        sakeMemo: readCsvValue(record, "酒メモ"),
        foods: readCsvAnyValue(record, ["この店の一品！", "食べたもの"]),
        bestDish: readCsvAnyValue(record, ["この店の一品！", "食べたもの"]),
        cost: readCsvValue(record, "支払額"),
        rating: ratingRank(readCsvValue(record, "評価"), "B"),
        revisit: readCsvValue(record, "再訪したい") || "はい",
        memo: readCsvValue(record, "スポットメモ"),
        photos: [],
        createdAt: new Date().toISOString()
      });
    });

    const importedSessions = [...sessionMap.values()].map(normalizeSession);
    if (!importedSessions.length) {
      throw new Error("CSVから取り込める飲み会記録がありません。");
    }
    return importedSessions;
  }

  function importCsvFile(file) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const importedSessions = sessionsFromCsv(String(reader.result || ""));
        showStatus("CSVインポート前に、通常JSONエクスポートでバックアップすることをおすすめします。CSVには写真本体は含まれません。", "warning");
        if (!confirm("CSVインポート前に、通常JSONエクスポートでバックアップすることをおすすめします。CSVには写真本体は含まれません。追加インポートを実行しますか？")) {
          showStatus("CSVインポートをキャンセルしました。", "info");
          return;
        }

        const previousSessions = JSON.stringify(state.sessions);
        state.sessions = [...importedSessions, ...state.sessions];
        state.activeSessionId = importedSessions[0]?.id || state.activeSessionId;
        if (!saveSessions()) {
          state.sessions = JSON.parse(previousSessions);
          state.activeSessionId = state.sessions[0]?.id || null;
          render();
          return;
        }
        addTagsToCandidates(recordTags());
        if (state.activeSessionId) {
          fillSessionForm(getActiveSession());
        }
        render();
        showStatus(`CSVから${importedSessions.length}件の飲み会記録を追加しました。写真は空の状態で取り込みました。`, "success");
      } catch (error) {
        showStatus(error.message || "CSVを読み込めませんでした。さけいちずの通常CSV形式か確認してください。", "error");
      } finally {
        elements.csvImportFile.value = "";
      }
    });

    reader.addEventListener("error", () => {
      elements.csvImportFile.value = "";
      showStatus("CSVファイルを読み込めませんでした。", "error");
    });

    reader.readAsText(file);
  }

  function importJsonFile(file) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        let parsed;
        try {
          parsed = JSON.parse(String(reader.result || ""));
        } catch (error) {
          throw new Error("JSONとして読み込めませんでした。ファイルの内容が壊れていないか確認してください。");
        }
        const importedSessions = validateImportedSessions(parsed);
        showStatus("JSONインポート前に、通常JSONエクスポートでバックアップすることをおすすめします。現在のデータは上書きされます。", "warning");
        if (!confirm("現在のデータを読み込んだJSONで上書きします。実行前に通常JSONエクスポートでバックアップすることをおすすめします。よろしいですか？")) {
          showStatus("JSONインポートをキャンセルしました。", "info");
          return;
        }

        const previousSessions = JSON.stringify(state.sessions);
        state.sessions = importedSessions;
        state.activeSessionId = state.sessions[0]?.id || null;
        if (!saveSessions()) {
          state.sessions = JSON.parse(previousSessions);
          state.activeSessionId = state.sessions[0]?.id || null;
          if (state.activeSessionId) {
            fillSessionForm(getActiveSession());
          }
          render();
          return;
        }
        addTagsToCandidates(recordTags());
        if (state.activeSessionId) {
          fillSessionForm(getActiveSession());
        } else {
          resetSessionForm();
        }
        elements.blogDraft.value = "";
        render();
        showStatus("JSONからデータを復元しました。", "success");
      } catch (error) {
        showStatus(error.message || "JSONを読み込めませんでした。ファイルの内容を確認してください。", "error");
      } finally {
        elements.jsonImportFile.value = "";
      }
    });

    reader.addEventListener("error", () => {
      elements.jsonImportFile.value = "";
      showStatus("JSONファイルを読み込めませんでした。", "error");
    });

    reader.readAsText(file);
  }

  function render() {
    renderAreaOptions();
    renderCategoryLegend();
    renderInsights();
    renderActiveSessionPanel();
    renderSessions();
    renderMarkers();
    renderRoute();
    requestAnimationFrame(() => map.invalidateSize());
  }

  elements.sessionForm.addEventListener("submit", handleSessionSubmit);
  elements.newSessionButton.addEventListener("click", resetSessionForm);
  elements.locateButton.addEventListener("click", locateUser);
  elements.generateBlogButton.addEventListener("click", generateBlogDraft);
  elements.copyBlogButton.addEventListener("click", copyBlogDraft);
  elements.exportJsonButton.addEventListener("click", exportJson);
  elements.exportLightJsonButton.addEventListener("click", exportLightJson);
  elements.exportCsvButton.addEventListener("click", exportCsv);
  elements.exportMonthlyCsvButton.addEventListener("click", exportMonthlyCsv);
  elements.exportAreaCsvButton.addEventListener("click", exportAreaCsv);
  elements.importJsonButton.addEventListener("click", () => elements.jsonImportFile.click());
  elements.importCsvButton.addEventListener("click", () => elements.csvImportFile.click());
  elements.dataCheckButton.addEventListener("click", runDataCheck);
  elements.autoFixDataButton.addEventListener("click", autoFixData);
  elements.duplicateCheckButton.addEventListener("click", runDuplicateCheck);
  elements.deleteAllPhotosButton.addEventListener("click", deleteAllPhotos);
  elements.mergeAreaButton.addEventListener("click", mergeAreas);
  elements.tagSettingsButton.addEventListener("click", () => {
    renderTagSettingsList();
    elements.tagSettingsDialog.showModal();
    elements.newTagCandidate.focus();
  });
  elements.closeTagSettingsDialog.addEventListener("click", () => elements.tagSettingsDialog.close());
  elements.addTagCandidateButton.addEventListener("click", addTagCandidate);
  elements.syncRecordTagsButton.addEventListener("click", syncRecordTagsToCandidates);
  elements.resetTagCandidatesButton.addEventListener("click", resetTagCandidates);
  elements.newTagCandidate.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTagCandidate();
    }
  });
  elements.tagSettingsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    updateTagCandidateByAction(button.dataset.action, Number(button.dataset.tagIndex));
  });
  elements.jsonImportFile.addEventListener("change", () => importJsonFile(elements.jsonImportFile.files[0]));
  elements.csvImportFile.addEventListener("change", () => importCsvFile(elements.csvImportFile.files[0]));
  elements.pinDisplayMode.addEventListener("change", () => {
    state.pinDisplayMode = elements.pinDisplayMode.value;
    saveSettings();
    render();
  });
  elements.routeToggle.addEventListener("change", () => {
    state.routeVisible = elements.routeToggle.checked;
    saveSettings();
    render();
  });
  elements.recordSearch.addEventListener("input", () => {
    state.searchQuery = elements.recordSearch.value;
    renderSessions();
  });
  elements.applyCandidateNameButton.addEventListener("click", () => {
    if (state.mapCandidate?.name) {
      elements.spotName.value = state.mapCandidate.name;
      if (!elements.spotAddress.value.trim() && state.mapCandidate.address) {
        elements.spotAddress.value = state.mapCandidate.address;
      }
      showStatus("候補名を店名欄に反映しました。", "success");
    }
  });
  elements.drinkCountControls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const type = button.dataset.drinkType;
    const current = drinkCountValue(type);
    if (button.dataset.action === "increment-drink-count") {
      setDrinkCountValue(type, current + 1);
    }
    if (button.dataset.action === "decrement-drink-count") {
      setDrinkCountValue(type, current - 1);
    }
    renderDrinkCountControls();
  });
  elements.drinkCountControls.addEventListener("change", (event) => {
    const checkbox = event.target.closest("input[data-action='toggle-drink-count']");
    if (!checkbox) {
      return;
    }
    setDrinkCountValue(checkbox.dataset.drinkType, checkbox.checked ? Math.max(1, drinkCountValue(checkbox.dataset.drinkType)) : 0);
    renderDrinkCountControls();
  });
  elements.photoInput.addEventListener("change", () => handlePhotoFiles(elements.photoInput.files));
  elements.photoPreviewList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const index = Number(button.dataset.photoIndex);
    if (button.dataset.action === "remove-photo") {
      state.editingPhotos.splice(index, 1);
    }
    if (button.dataset.action === "move-photo-up" && index > 0) {
      [state.editingPhotos[index - 1], state.editingPhotos[index]] = [state.editingPhotos[index], state.editingPhotos[index - 1]];
    }
    if (button.dataset.action === "move-photo-down" && index < state.editingPhotos.length - 1) {
      [state.editingPhotos[index], state.editingPhotos[index + 1]] = [state.editingPhotos[index + 1], state.editingPhotos[index]];
    }
    renderPhotoPreview();
  });
  elements.photoPreviewList.addEventListener("input", (event) => {
    const input = event.target.closest("input[data-action='update-photo-caption']");
    if (!input) {
      return;
    }
    const index = Number(input.dataset.photoIndex);
    if (state.editingPhotos[index]) {
      state.editingPhotos[index].caption = input.value.slice(0, 80);
      updatePhotoStorageHint();
    }
  });
  elements.closePhotoViewer.addEventListener("click", () => elements.photoViewer.close());
  elements.prevPhotoButton.addEventListener("click", () => movePhotoViewer(-1));
  elements.nextPhotoButton.addEventListener("click", () => movePhotoViewer(1));
  elements.photoViewer.addEventListener("click", (event) => {
    if (event.target === elements.photoViewer) {
      elements.photoViewer.close();
    }
  });
  elements.simpleSpotModeButton.addEventListener("click", () => setSpotInputMode("simple"));
  elements.detailSpotModeButton.addEventListener("click", () => setSpotInputMode("detail"));
  elements.spotForm.addEventListener("submit", handleSpotSubmit);
  elements.closeSpotDialog.addEventListener("click", () => {
    elements.spotDialog.close();
    state.editingSpotId = null;
    clearMapCandidate();
  });
  elements.listPanel.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const sessionId = button.dataset.sessionId;
    if (action === "select-session") {
      setActiveSession(sessionId);
    }
    if (action === "delete-session") {
      deleteSession(sessionId);
    }
    if (action === "delete-spot") {
      deleteSpot(sessionId, button.dataset.spotId);
    }
    if (action === "edit-spot") {
      openSpotEditDialog(sessionId, button.dataset.spotId);
    }
    if (action === "search-term") {
      setSearchTerm(button.dataset.term || "");
    }
    if (action === "focus-spot") {
      focusSpot(sessionId, button.dataset.spotId);
    }
    if (action === "view-photos") {
      viewSpotPhotos(sessionId, button.dataset.spotId, Number(button.dataset.photoIndex || 0));
    }
    if (action === "delete-spot-photos") {
      deleteSpotPhotos(sessionId, button.dataset.spotId);
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".photo-open-button[data-action='view-photos']");
    if (!button || elements.listPanel.contains(button)) {
      return;
    }
    viewSpotPhotos(button.dataset.sessionId, button.dataset.spotId, Number(button.dataset.photoIndex || 0));
  });

  map.on("click", (event) => openSpotDialog(event.latlng));

  loadSessions();
  loadTagSettings();
  loadSettings();
  elements.sessionDate.value = todayText();
  if (state.activeSessionId) {
    fillSessionForm(getActiveSession());
  } else {
    setTagFormValues([]);
  }
  render();
}());
