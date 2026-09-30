import type { Conversation, GroceryList, Message } from '../models/domain.ts';
import { ApiError } from './api.ts';

export function listPrompt(
  list: GroceryList,
  text: string,
  messages: Message[],
) {
  const items = list.items
    .slice(0, 12)
    .map(
      (i) =>
        `- ${i.name}${i.quantity ? ` (${i.quantity})` : ''}${i.category ? ` - ${i.category}` : ''}`,
    )
    .join('\n');
  const transcript = messages
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');
  return `Continue this SAVR grocery list conversation as the same thread.\nList name: ${list.name}\nCurrent list items:\n${items || '- No items saved yet'}\n\nRecent conversation context:\n${transcript || 'No previous transcript is available.'}\n\nThe user's new message is:\n${text}\n\nRespond naturally as if continuing the existing list chat. Use the prior list context without restating all of it unless helpful.`;
}
export async function sendConversation(
  send: (
    text: string,
    sessionId?: string,
  ) => Promise<{ sessionId: string; text: string }>,
  conversation: Conversation,
  text: string,
  list?: GroceryList,
) {
  const contextual = () =>
    list ? listPrompt(list, text, conversation.messages) : text;
  try {
    return await send(
      conversation.sessionId ? text : contextual(),
      conversation.sessionId,
    );
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 404 ||
      !conversation.sessionId
    )
      throw error;
    return send(contextual());
  }
}
