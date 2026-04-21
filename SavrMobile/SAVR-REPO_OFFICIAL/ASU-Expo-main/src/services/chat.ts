import axios from 'axios';
import { API_BASE_URL } from './api';
import { getToken } from './auth';

export type BackendChatMessage = {
  id: string;
  content: string;
  is_user: boolean;
  timestamp: string;
};

export type WelcomeMessageResponse = {
  content: string;
  timestamp: string;
  session_id: string;
};

async function getAuthHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchWelcomeMessage(): Promise<WelcomeMessageResponse> {
  const headers = await getAuthHeaders();
  const response = await axios.post<WelcomeMessageResponse>(
    `${API_BASE_URL}/chat/welcome`,
    {},
    { headers, timeout: 10000 }
  );
  return response.data;
}

export async function fetchChatHistory(
  sessionId: string
): Promise<BackendChatMessage[]> {
  if (!sessionId) return [];
  const headers = await getAuthHeaders();
  const response = await axios.get<BackendChatMessage[]>(
    `${API_BASE_URL}/chat/history/${sessionId}`,
    { headers, timeout: 5000 }
  );
  return response.data;
}

export type SendMessageResponse = {
  session_id?: string;
  sessionId?: string;
  bot_response?: string;
  botResponse?: string;
  chat_response?: string;
  conversation_history?: BackendChatMessage[];
};

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<{ sessionId: string; botResponse: string }> {
  const headers = await getAuthHeaders();
  const response = await axios.post<SendMessageResponse>(
    `${API_BASE_URL}/chat/message`,
    { session_id: sessionId, sessionId, message },
    { headers, timeout: 45000 }
  );
  const data = response.data;
  const session =
    data.session_id ?? data.sessionId ?? sessionId;
  const text =
    data.bot_response ??
    data.botResponse ??
    data.chat_response ??
    '';
  return { sessionId: session, botResponse: text };
}

