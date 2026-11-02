const PH_MODULE_ID = "pendle-hollow-final-clock";

Hooks.once("ready", () => {
  document.body?.classList.add("ph-root-theme");
  queueMicrotask(() => {
    classifyExistingChatMessages();
    decorateExistingJournalWindows();
  });
});

/**
 * Foundry VTT v14 hook: customize each ChatMessage HTMLElement before insertion.
 */
Hooks.on("renderChatMessageHTML", (message, html) => {
  classifyChatMessage(message, html);
});

/**
 * Foundry VTT v14 ApplicationV2 hook. JournalEntry and JournalEntryPage windows
 * are tagged with Pendle Hollow classes without replacing the system sheet.
 */
Hooks.on("renderApplicationV2", (application, element) => {
  const name = application?.constructor?.name ?? "";
  const documentName = application?.document?.documentName ?? application?.object?.documentName ?? "";

  if (documentName === "JournalEntry" || documentName === "JournalEntryPage" || /Journal.*Sheet/i.test(name)) {
    decorateJournalApplication(application, element);
  }

  if (/ChatLog/i.test(name)) {
    queueMicrotask(classifyExistingChatMessages);
  }
});

function classifyChatMessage(message, html) {
  if (!(html instanceof HTMLElement) || !message) return;

  html.classList.add("ph-chat-card");
  html.classList.remove(
    "ph-chat-roll",
    "ph-chat-ic",
    "ph-chat-ooc",
    "ph-chat-emote",
    "ph-chat-other",
    "ph-chat-whisper",
    "ph-chat-blind"
  );

  const styles = globalThis.CONST?.CHAT_MESSAGE_STYLES ?? { OTHER: 0, OOC: 1, IC: 2, EMOTE: 3 };
  const hasRoll = Boolean(message.isRoll) || (Array.isArray(message.rolls) && message.rolls.length > 0);

  if (hasRoll) html.classList.add("ph-chat-roll");
  else if (message.style === styles.IC) html.classList.add("ph-chat-ic");
  else if (message.style === styles.EMOTE || message.emote) html.classList.add("ph-chat-emote");
  else if (message.style === styles.OOC) html.classList.add("ph-chat-ooc");
  else html.classList.add("ph-chat-other");

  if (Array.isArray(message.whisper) && message.whisper.length > 0) html.classList.add("ph-chat-whisper");
  if (message.blind) html.classList.add("ph-chat-blind");
}

function classifyExistingChatMessages() {
  const entries = document.querySelectorAll('#chat-log [data-message-id], #chat-log .message[data-message-id], #chat-log .chat-message[data-message-id]');
  for (const element of entries) {
    const id = element.dataset?.messageId;
    const message = id ? game.messages?.get(id) : null;
    if (message) classifyChatMessage(message, element);
  }
}

function decorateJournalApplication(application, element) {
  if (element instanceof HTMLElement) element.classList.add("ph-book-content");

  const addClass = () => {
    let frame = null;
    if (application?.element instanceof HTMLElement) frame = application.element;
    else if (element instanceof HTMLElement) frame = element.closest(".application, .window-app");

    frame?.classList.add("ph-book-window");
  };

  addClass();
  requestAnimationFrame(addClass);
}

function decorateExistingJournalWindows() {
  document.querySelectorAll('.application.journal-entry, .window-app.journal-sheet, [data-appid] .journal-entry, [data-appid] .journal-entry-page').forEach(node => {
    const frame = node.closest?.('.application, .window-app');
    frame?.classList.add('ph-book-window');
    if (node instanceof HTMLElement) node.classList.add('ph-book-content');
  });
}
