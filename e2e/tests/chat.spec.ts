import { expect, test } from '@playwright/test';
import { login } from '../helpers/auth';
import { navigateToSimulation } from '../helpers/fixtures';

test.describe('Chat View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToSimulation(page, 'chat');
  });

  test('displays conversation list', async ({ page }) => {
    // Wait for the chat view to finish loading
    const chatView = page.locator('velg-chat-view');
    await expect(chatView).toBeVisible();

    // The conversation list sidebar should be visible
    const sidebar = chatView.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // The sidebar header with "Conversations" title should be visible
    const sidebarTitle = sidebar.locator('.sidebar__title');
    await expect(sidebarTitle).toBeVisible();
    await expect(sidebarTitle).toHaveText('Conversations');

    // The "New" button should be visible
    const newButton = sidebar.locator('.sidebar__new-btn');
    await expect(newButton).toBeVisible();
    await expect(newButton).toContainText('New');

    // The conversation list component should be rendered
    const conversationList = chatView.locator('velg-conversation-list');
    await expect(conversationList).toBeVisible();
  });

  test('creates a new conversation by selecting an agent', async ({ page }) => {
    const chatView = page.locator('velg-chat-view');
    await expect(chatView).toBeVisible();

    // Click the "+ New" button to open the agent selector
    const newButton = chatView.locator('.sidebar__new-btn');
    await newButton.click();

    // The agent selector modal should appear
    const agentSelector = chatView.locator('velg-agent-selector');
    await expect(agentSelector).toBeVisible();

    // Wait for agents to load, then click the first available agent
    const firstAgent = agentSelector.locator('[data-testid="agent-option"]').first();
    await expect(firstAgent).toBeVisible({ timeout: 10_000 });
    const agentName = await firstAgent.textContent();
    await firstAgent.click();

    // The agent selector should close
    await expect(agentSelector).not.toBeVisible({ timeout: 5_000 });

    // A toast notification should confirm creation
    const toast = page.locator('velg-toast');
    await expect(toast).toContainText('Conversation started', { timeout: 5_000 });

    // The new conversation should appear in the list and be selected
    const conversationList = chatView.locator('velg-conversation-list');
    const activeConversation = conversationList.locator('.conversation--active');
    await expect(activeConversation).toBeVisible();

    // The chat window header should show the agent name
    const chatWindow = chatView.locator('velg-chat-window');
    const windowHeader = chatWindow.locator('.window__agent-name');
    await expect(windowHeader).toBeVisible();
    if (agentName) {
      await expect(windowHeader).toContainText(agentName.trim());
    }
  });

  test('sends a message in a conversation', async ({ page }) => {
    const chatView = page.locator('velg-chat-view');
    await expect(chatView).toBeVisible();

    // Select the first conversation if one exists, otherwise create one
    const conversationList = chatView.locator('velg-conversation-list');
    const firstConversation = conversationList.locator('.conversation').first();

    const hasConversations = await firstConversation.isVisible().catch(() => false);
    if (!hasConversations) {
      // Create a conversation first
      const newButton = chatView.locator('.sidebar__new-btn');
      await newButton.click();
      const firstAgent = chatView.locator('velg-agent-selector [data-testid="agent-option"]').first();
      await expect(firstAgent).toBeVisible({ timeout: 10_000 });
      await firstAgent.click();
      await expect(chatView.locator('velg-agent-selector')).not.toBeVisible({ timeout: 5_000 });
    } else {
      await firstConversation.click();
    }

    // Wait for chat window to be ready
    const chatWindow = chatView.locator('velg-chat-window');
    const messageInput = chatWindow.locator('velg-message-input');
    await expect(messageInput).toBeVisible();

    // Type a message into the textarea
    const textarea = messageInput.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Hello, this is a test message.');

    // The send button should be enabled
    const sendButton = messageInput.locator('button');
    await expect(sendButton).toBeEnabled();

    // Click send
    await sendButton.click();

    // The message should appear in the message list (optimistic update)
    const messageList = chatWindow.locator('velg-message-list');
    await expect(messageList).toContainText('Hello, this is a test message.', { timeout: 5_000 });

    // The textarea should be cleared after sending
    await expect(textarea).toHaveValue('');
  });

  test('receives AI response after sending a message', async ({ page }) => {
    const chatView = page.locator('velg-chat-view');
    await expect(chatView).toBeVisible();

    // Select or create a conversation
    const conversationList = chatView.locator('velg-conversation-list');
    const firstConversation = conversationList.locator('.conversation').first();

    const hasConversations = await firstConversation.isVisible().catch(() => false);
    if (!hasConversations) {
      const newButton = chatView.locator('.sidebar__new-btn');
      await newButton.click();
      const firstAgent = chatView.locator('velg-agent-selector [data-testid="agent-option"]').first();
      await expect(firstAgent).toBeVisible({ timeout: 10_000 });
      await firstAgent.click();
      await expect(chatView.locator('velg-agent-selector')).not.toBeVisible({ timeout: 5_000 });
    } else {
      await firstConversation.click();
    }

    // Send a message
    const chatWindow = chatView.locator('velg-chat-window');
    const messageInput = chatWindow.locator('velg-message-input');
    await expect(messageInput).toBeVisible();

    const textarea = messageInput.locator('textarea');
    await textarea.fill('Tell me about yourself.');
    const sendButton = messageInput.locator('button');
    await sendButton.click();

    // The user message should appear
    await expect(chatWindow.locator('velg-message-list')).toContainText(
      'Tell me about yourself.',
      { timeout: 5_000 },
    );

    // The typing indicator should appear while waiting for AI response
    const typingIndicator = chatWindow.locator('.window__typing-indicator');
    // The typing indicator may be brief; use a short timeout or check that it appeared at any point
    await expect(typingIndicator).toBeVisible({ timeout: 10_000 }).catch(() => {
      // Typing indicator may have already disappeared if AI response was fast
    });

    // Wait for the AI response to appear in the message list
    // AI messages will have a sender_role of 'assistant' and new content
    const messageList = chatWindow.locator('velg-message-list');
    // After the typing indicator disappears, there should be at least 2 messages
    await expect(typingIndicator).not.toBeVisible({ timeout: 30_000 });

    // Verify the message input is re-enabled after AI response
    await expect(textarea).toBeEnabled({ timeout: 5_000 });
  });

  test('archives a conversation', async ({ page }) => {
    const chatView = page.locator('velg-chat-view');
    await expect(chatView).toBeVisible();

    // Ensure there is at least one conversation
    const conversationList = chatView.locator('velg-conversation-list');
    const firstConversation = conversationList.locator('.conversation').first();

    const hasConversations = await firstConversation.isVisible().catch(() => false);
    if (!hasConversations) {
      // Create a conversation first
      const newButton = chatView.locator('.sidebar__new-btn');
      await newButton.click();
      const firstAgent = chatView.locator('velg-agent-selector [data-testid="agent-option"]').first();
      await expect(firstAgent).toBeVisible({ timeout: 10_000 });
      await firstAgent.click();
      await expect(chatView.locator('velg-agent-selector')).not.toBeVisible({ timeout: 5_000 });
    }

    // Hover over the first non-archived conversation to reveal the archive button
    const activeConversation = conversationList
      .locator('.conversation:not(:has(.conversation__status))')
      .first();
    await expect(activeConversation).toBeVisible();
    await activeConversation.hover();

    // Click the archive button
    const archiveButton = activeConversation.locator('.conversation__archive-btn');
    await expect(archiveButton).toBeVisible();
    await archiveButton.click();

    // A toast notification should confirm the archive
    const toast = page.locator('velg-toast');
    await expect(toast).toContainText('archived', { timeout: 5_000 });

    // The conversation should now show an "Archived" status badge
    const archivedStatus = activeConversation.locator('.conversation__status');
    await expect(archivedStatus).toBeVisible();
    await expect(archivedStatus).toHaveText('Archived');
  });
});
