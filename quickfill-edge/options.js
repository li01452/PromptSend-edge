const PLATFORMS = QUICK_FILL_CONFIG.platforms;
const DEFAULT_SETTINGS = QUICK_FILL_CONFIG.defaultSettings;
const TARGET_OPTIONS = [
    { id: "all", label: "默认（跟随全局设置）" },
    { id: "chatgpt", label: "ChatGPT" },
    { id: "gemini", label: "Gemini" },
    { id: "claude", label: "Claude" },
    { id: "deepseek", label: "DeepSeek" }
];

let prompts = [];
let settings = DEFAULT_SETTINGS;
let currentPromptId = null;
let statusTimer = null;

const elements = {
    list: document.getElementById("prompt-list"),
    editArea: document.getElementById("edit-area"),
    title: document.getElementById("edit-title"),
    content: document.getElementById("edit-content"),
    targetContainer: document.getElementById("target-model-container"),
    shortcut: document.getElementById("edit-shortcut"),
    save: document.getElementById("btn-save"),
    remove: document.getElementById("btn-delete"),
    add: document.getElementById("btn-add-new"),
    status: document.getElementById("status-msg"),
    readonlyHint: document.getElementById("readonly-hint"),
    autoSend: document.getElementById("auto-send"),
    platformSwitches: Object.fromEntries(
        PLATFORMS.map(id => [id, document.getElementById(`enable-${id}`)])
    )
};

initialize();

async function initialize() {
    const data = await chrome.storage.local.get(["prompts", "settings"]);
    prompts = data.prompts || [];
    settings = withSettingDefaults(data.settings);

    renderTargetOptions();
    bindEvents();
    renderGlobalSettings();
    renderList();

    if (prompts.length) {
        selectPrompt(prompts[0].id);
    } else {
        elements.editArea.hidden = true;
    }
}

function withSettingDefaults(saved = {}) {
    return {
        targets: { ...DEFAULT_SETTINGS.targets, ...(saved.targets || {}) },
        autoSend: saved.autoSend === true,
        defaultPromptId: Object.hasOwn(saved, "defaultPromptId")
            ? saved.defaultPromptId
            : DEFAULT_SETTINGS.defaultPromptId,
        shortcuts: { ...DEFAULT_SETTINGS.shortcuts, ...(saved.shortcuts || {}) }
    };
}

function bindEvents() {
    PLATFORMS.forEach(platform => {
        elements.platformSwitches[platform].addEventListener("change", async event => {
            settings.targets[platform] = event.target.checked;
            await saveSettings();
        });
    });

    elements.autoSend.addEventListener("change", async event => {
        settings.autoSend = event.target.checked;
        await saveSettings();
    });

    elements.save.addEventListener("click", saveCurrentPrompt);
    elements.add.addEventListener("click", addPrompt);
    elements.remove.addEventListener("click", removeCurrentPrompt);
}

function renderGlobalSettings() {
    PLATFORMS.forEach(platform => {
        elements.platformSwitches[platform].checked = settings.targets[platform];
    });
    elements.autoSend.checked = settings.autoSend;
}

function renderTargetOptions() {
    const fragment = document.createDocumentFragment();

    TARGET_OPTIONS.forEach(({ id, label: text }) => {
        const label = document.createElement("label");
        label.className = "target-option";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = id;
        input.addEventListener("change", () => handleTargetChange(input));

        label.append(input, document.createTextNode(text));
        fragment.appendChild(label);
    });

    elements.targetContainer.replaceChildren(fragment);
}

function handleTargetChange(changed) {
    const inputs = [...elements.targetContainer.querySelectorAll("input")];
    if (changed.value === "all" && changed.checked) {
        inputs.forEach(input => {
            if (input !== changed) input.checked = false;
        });
    } else if (changed.checked) {
        elements.targetContainer.querySelector("input[value='all']").checked = false;
    }
}

function renderList() {
    const fragment = document.createDocumentFragment();

    prompts.forEach(prompt => {
        const item = document.createElement("div");
        item.className = "prompt-item";
        item.classList.toggle("active", prompt.id === currentPromptId);
        item.addEventListener("click", () => selectPrompt(prompt.id));

        const header = document.createElement("div");
        header.className = "prompt-item-header";

        const title = document.createElement("span");
        title.className = "prompt-title";
        title.textContent = prompt.title;

        const meta = document.createElement("div");
        meta.className = "prompt-item-meta";

        const useCount = document.createElement("span");
        useCount.className = "use-count";
        useCount.textContent = `使用 ${prompt.useCount} 次`;

        const favorite = document.createElement("span");
        favorite.className = "star";
        favorite.classList.toggle("fav", prompt.isFavorite);
        favorite.title = "添加到右键菜单";
        favorite.textContent = "★";
        favorite.addEventListener("click", async event => {
            event.stopPropagation();
            prompt.isFavorite = !prompt.isFavorite;
            if (!await saveState()) {
                prompt.isFavorite = !prompt.isFavorite;
                renderList();
                return;
            }
            renderList();
            chrome.runtime.sendMessage({ type: "UPDATE_MENU" });
        });

        meta.append(useCount, favorite);
        header.append(title, meta);

        const badges = document.createElement("div");
        badges.className = "prompt-badges";
        const shortcut = getPromptShortcut(prompt.id);
        if (shortcut) {
            badges.appendChild(createBadge(
                shortcut === "default" ? "Alt+Q" : shortcut.replace("slot-", "Alt+"),
                shortcut === "default" ? "default" : "shortcut"
            ));
        }
        item.append(header, badges);
        fragment.appendChild(item);
    });

    elements.list.replaceChildren(fragment);
}

function createBadge(text, type) {
    const badge = document.createElement("span");
    badge.className = `badge ${type}`;
    badge.textContent = text;
    return badge;
}

function getPromptShortcut(promptId) {
    if (settings.defaultPromptId === promptId) return "default";
    return Object.entries(settings.shortcuts)
        .find(([, assignedId]) => assignedId === promptId)?.[0] || "";
}

function selectPrompt(promptId) {
    const prompt = prompts.find(item => item.id === promptId);
    if (!prompt) return;

    currentPromptId = promptId;
    elements.editArea.hidden = false;
    elements.title.value = prompt.title;
    elements.content.value = prompt.content;

    const targets = new Set(prompt.targetModels);
    elements.targetContainer.querySelectorAll("input").forEach(input => {
        input.checked = targets.has(input.value);
    });

    elements.title.disabled = prompt.isBuiltIn;
    elements.content.disabled = prompt.isBuiltIn;
    elements.remove.hidden = prompt.isBuiltIn;
    elements.readonlyHint.hidden = !prompt.isBuiltIn;

    renderShortcutOptions(promptId);
    renderList();
}

function renderShortcutOptions(promptId) {
    const occupied = new Set();
    if (settings.defaultPromptId != null && settings.defaultPromptId !== promptId) {
        occupied.add("default");
    }
    Object.entries(settings.shortcuts).forEach(([slot, assignedId]) => {
        if (assignedId != null && assignedId !== promptId) occupied.add(slot);
    });

    [...elements.shortcut.options].forEach(option => {
        option.dataset.baseLabel ||= option.textContent;
        option.disabled = occupied.has(option.value);
        option.textContent = option.dataset.baseLabel +
            (option.disabled ? "（已被占用）" : "");
    });
    elements.shortcut.value = getPromptShortcut(promptId);
}

async function saveCurrentPrompt() {
    const prompt = prompts.find(item => item.id === currentPromptId);
    if (!prompt) return;

    let menuNeedsUpdate = false;
    if (!prompt.isBuiltIn) {
        const title = elements.title.value.trim();
        if (!title) {
            showStatus("标题不能为空");
            return;
        }
        menuNeedsUpdate = prompt.isFavorite && prompt.title !== title;
        prompt.title = title;
        prompt.content = elements.content.value;
    }

    const selectedTargets = [...elements.targetContainer.querySelectorAll("input:checked")]
        .map(input => input.value);
    prompt.targetModels = selectedTargets.length ? selectedTargets : ["all"];

    clearPromptShortcut(prompt.id);
    const selectedShortcut = elements.shortcut.value;
    if (selectedShortcut === "default") {
        settings.defaultPromptId = prompt.id;
    } else if (selectedShortcut.startsWith("slot-")) {
        settings.shortcuts[selectedShortcut] = prompt.id;
    }

    if (!await saveState()) return;
    selectPrompt(prompt.id);
    showStatus("保存成功");
    if (menuNeedsUpdate) chrome.runtime.sendMessage({ type: "UPDATE_MENU" });
}

function clearPromptShortcut(promptId) {
    if (settings.defaultPromptId === promptId) settings.defaultPromptId = null;
    Object.keys(settings.shortcuts).forEach(slot => {
        if (settings.shortcuts[slot] === promptId) settings.shortcuts[slot] = null;
    });
}

async function addPrompt() {
    const prompt = {
        id: Date.now(),
        title: "新提示词",
        content: "",
        isFavorite: false,
        isBuiltIn: false,
        useCount: 0,
        targetModels: ["all"]
    };
    prompts.push(prompt);
    if (!await saveState()) {
        prompts = prompts.filter(item => item !== prompt);
        return;
    }
    selectPrompt(prompt.id);
    elements.title.focus();
    elements.title.select();
}

async function removeCurrentPrompt() {
    const prompt = prompts.find(item => item.id === currentPromptId);
    if (!prompt || prompt.isBuiltIn || !confirm("确定要删除这个提示词吗？")) return;

    const previousPrompts = prompts;
    const previousSettings = structuredClone(settings);
    const wasDefault = settings.defaultPromptId === prompt.id;
    const wasFavorite = prompt.isFavorite;
    clearPromptShortcut(prompt.id);
    prompts = prompts.filter(item => item.id !== prompt.id);
    if (wasDefault && prompts.length) {
        settings.defaultPromptId = prompts[0].id;
    }

    if (!await saveState()) {
        prompts = previousPrompts;
        settings = previousSettings;
        return;
    }
    currentPromptId = prompts[0]?.id ?? null;
    if (currentPromptId == null) {
        elements.editArea.hidden = true;
        renderList();
    } else {
        selectPrompt(currentPromptId);
    }
    if (wasFavorite) chrome.runtime.sendMessage({ type: "UPDATE_MENU" });
}

async function saveState() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: "SAVE_OPTIONS_STATE",
            prompts,
            settings
        });
        if (response?.error) throw new Error(response.error);
        prompts = response.prompts;
        return true;
    } catch (error) {
        console.error("保存设置失败:", error);
        showStatus("保存失败");
        return false;
    }
}

async function saveSettings() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: "SAVE_SETTINGS",
            settings
        });
        if (response?.error) throw new Error(response.error);
        return true;
    } catch (error) {
        console.error("保存全局设置失败:", error);
        showStatus("保存失败");
        return false;
    }
}

function showStatus(message) {
    clearTimeout(statusTimer);
    elements.status.textContent = message;
    statusTimer = setTimeout(() => {
        elements.status.textContent = "";
    }, 2000);
}

// 后台增加使用次数时只同步计数，避免覆盖正在编辑但尚未保存的内容。
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.prompts) return;

    const counts = new Map(
        changes.prompts.newValue.map(prompt => [prompt.id, prompt.useCount])
    );
    let changed = false;
    prompts.forEach(prompt => {
        const nextCount = counts.get(prompt.id);
        if (nextCount !== undefined && nextCount !== prompt.useCount) {
            prompt.useCount = nextCount;
            changed = true;
        }
    });

    if (changed) renderList();
});
