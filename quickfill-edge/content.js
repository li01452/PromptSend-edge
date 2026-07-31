const PLATFORM_CONFIGS = {
    chatgpt: {
        editorSelectors: [
            "#prompt-textarea",
            "div[contenteditable='true'][data-placeholder]"
        ],
        sendSelectors: [
            "#composer-submit-button",
            "button[data-testid='send-button']",
            "button[aria-label='Send prompt']",
            "button[aria-label='发送提示词']"
        ]
    },
    gemini: {
        editorSelectors: [
            "rich-textarea .ql-editor",
            ".ql-editor[contenteditable='true']"
        ],
        sendSelectors: [
            "button.send-button",
            "button[aria-label*='Send message']",
            "button[aria-label*='发送消息']"
        ]
    },
    claude: {
        editorSelectors: [
            "div.ProseMirror[contenteditable='true']",
            "div[contenteditable='true'][data-placeholder]"
        ],
        sendSelectors: [
            "button[aria-label='Send message']",
            "button[data-testid='send-button']",
            "button[type='submit']"
        ]
    },
    deepseek: {
        editorSelectors: [
            "textarea#chat-input",
            "textarea[data-testid='chat-input']",
            "textarea"
        ],
        sendSelectors: [
            "div[role='button']:has(.ds-icon svg path[d^='M8.3125'])",
            "button[aria-label*='Send']",
            "button[aria-label*='发送']",
            "button[class*='send']"
        ]
    }
};

const platform = QUICK_FILL_CONFIG.platformByHost[window.location.hostname];
if (PLATFORM_CONFIGS[platform]) claimAndRunTask(platform);

function claimAndRunTask(currentPlatform) {
    chrome.runtime.sendMessage(
        { type: "CLAIM_PENDING_TASK", platform: currentPlatform },
        response => {
            if (chrome.runtime.lastError || !response?.task) return;

            const { prompt, autoSend, sourceTabId } = response.task;
            const report = (status, message) => {
                chrome.runtime.sendMessage({
                    type: "CONTENT_STATUS",
                    status,
                    message,
                    sourceTabId
                });
            };

            runPlatform({
                prompt,
                autoSend,
                report,
                ...PLATFORM_CONFIGS[currentPlatform]
            });
        }
    );
}

function findFirst(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

function isClickable(element) {
    if (!element || element.disabled || element.getAttribute("aria-disabled") === "true") {
        return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function setNativeValue(element, value) {
    const prototype = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter ? setter.call(element, value) : element.value = value;
}

function fillEditor(editor, prompt) {
    editor.focus();

    if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
        setNativeValue(editor, prompt);
        editor.dispatchEvent(new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: prompt
        }));
        editor.dispatchEvent(new Event("change", { bubbles: true }));
        return;
    }

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    const inserted = document.execCommand("insertText", false, prompt);
    if (!inserted) {
        editor.textContent = prompt;
        editor.dispatchEvent(new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: prompt
        }));
    }
}

function waitForEditor(selectors, timeout = 15000) {
    return new Promise(resolve => {
        const deadline = Date.now() + timeout;

        const check = () => {
            const editor = findFirst(selectors);
            if (editor) {
                resolve(editor);
            } else if (Date.now() >= deadline) {
                resolve(null);
            } else {
                setTimeout(check, 250);
            }
        };

        check();
    });
}

function clickFirstClickable(selectors) {
    for (const selector of selectors) {
        for (const element of document.querySelectorAll(selector)) {
            if (isClickable(element)) {
                element.click();
                return true;
            }
        }
    }
    return false;
}

function clickWhenReady(sendSelectors, timeout = 5000) {
    return new Promise(resolve => {
        const deadline = Date.now() + timeout;

        const check = () => {
            try {
                if (clickFirstClickable(sendSelectors)) {
                    resolve(true);
                } else if (Date.now() >= deadline) {
                    resolve(false);
                } else {
                    setTimeout(check, 200);
                }
            } catch (error) {
                console.error("查找发送按钮失败:", error);
                resolve(false);
            }
        };

        check();
    });
}

async function runPlatform({ prompt, autoSend, report, editorSelectors, sendSelectors }) {
    const editor = await waitForEditor(editorSelectors);
    if (!editor) {
        report("editor_not_found", "未找到 AI 页面输入框");
        return;
    }

    try {
        fillEditor(editor, prompt);
    } catch (error) {
        console.error("填入提示词失败:", error);
        report("fill_failed", "提示词填入失败");
        return;
    }

    if (!autoSend) {
        report("filled", "内容已填入");
        return;
    }

    const sent = await clickWhenReady(sendSelectors);
    report(
        sent ? "sent" : "send_not_found",
        sent ? "已自动发送" : "内容已填入，但未找到可用的发送按钮"
    );
}
