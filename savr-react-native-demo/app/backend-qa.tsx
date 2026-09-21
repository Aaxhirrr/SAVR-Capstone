import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';

type Result = { flow: string; endpoint: string; status: number; passed: boolean; detail: string; fingerprint?: string };
const API = 'https://savr.app/api/';
// Stable, non-cryptographic comparison of non-sensitive contract fields only.
function fingerprint(value: unknown) {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
function records(rows: Record<string, unknown>[], fields: string[]) {
  return rows.map(row => Object.fromEntries(fields.map(key => [key, row[key]])))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export default function BackendQA() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState('');

  async function run() {
    if (running || !email.trim() || !password) return;
    setRunning(true); setError(''); setResults([]); setCompleted('');
    const report: Result[] = [];
    let token = '';
    async function request(path: string, init: RequestInit = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(API + path, { ...init, signal: controller.signal,
          headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
        if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
        return { body: await response.json(), status: response.status };
      } finally { clearTimeout(timer); }
    }
    function record(flow: string, endpoint: string, status: number, valid: boolean, detail: string, comparable?: unknown) {
      report.push({ flow, endpoint, status, passed: valid, detail, ...(comparable === undefined ? {} : { fingerprint: fingerprint(comparable) }) });
      setResults([...report]);
      if (!valid) throw new Error(`${flow}: unexpected backend response`);
    }
    try {
      const auth = await request('auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(email.trim())}&password=${encodeURIComponent(password)}` });
      token = auth.body.access_token;
      record('Authentication', 'POST auth/login', auth.status, typeof token === 'string' && token.length > 0, 'Authenticated; token stays in memory');
      setPassword('');
      const chat = await request('chat/sessions');
      record('Chat sessions', 'GET chat/sessions', chat.status, Array.isArray(chat.body), `${chat.body.length} sessions`, records(chat.body, ['id', 'created_at', 'updated_at']));
      const lists = await request('grocery-lists/all');
      record('Grocery lists', 'GET grocery-lists/all', lists.status, Array.isArray(lists.body), `${lists.body.length} lists`, records(lists.body, ['id', 'name', 'items', 'chat_session_id']));
      const flyers = await request('flyers?store_brand=walmart&page=1&page_size=100');
      const deals = flyers.body.items ?? flyers.body.deals;
      record('Flyers', 'GET flyers', flyers.status, Array.isArray(deals), `${deals?.length ?? 0} deals on page 1`, Array.isArray(deals) ? records(deals, ['id', 'product_name', 'price', 'store_brand']) : []);
      const stores = await request('user/selected_stores');
      record('Stores', 'GET user/selected_stores', stores.status, Array.isArray(stores.body), `${stores.body.length} selected stores`, records(stores.body, ['id', 'store_name', 'address', 'postal_code']));
      const profile = await request('auth/profile');
      record('Profile', 'GET auth/profile', profile.status, typeof profile.body.email === 'string', 'Profile and preference contract loaded', {
        dietaryRestrictions: profile.body.dietaryRestrictions, brandPreferences: profile.body.brandPreferences,
      });
      const timestamp = new Date().toISOString();
      setCompleted(timestamp);
      // Only sanitized status/counts/fingerprints; never credentials, tokens, or profile data.
      console.info('SAVR_BACKEND_QA ' + JSON.stringify({ platform: Platform.OS, timestamp, results: report }));
    } catch (err) {
      setError(err instanceof Error && err.name === 'AbortError' ? 'Request timed out. Check your connection and retry.' : err instanceof Error ? err.message : 'Unable to complete checks.');
    } finally { token = ''; setRunning(false); }
  }

  return <><Stack.Screen options={{ title: 'Sprint 7 · Backend QA' }} /><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>SAVR backend checks</Text>
    <Text style={styles.subtitle}>{Platform.OS.toUpperCase()} · Aashir · Sprints 6 & 7</Text>
    <Text style={styles.note}>{completed ? "Live API contract checks · Test environment" : "Six live contract checks. This test screen uses the shared backend; it does not represent the complete Android app migration."}</Text>
    {!!completed && <View style={styles.resultCard}><Text style={styles.flow}>6/6 live checks passed</Text><Text style={styles.note}>{completed}</Text></View>}
    {!completed && <View style={styles.card}>
      <Text style={styles.label}>Test account email</Text>
      <TextInput accessibilityLabel="Test account email" style={styles.input} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} editable={!running} />
      <Text style={styles.label}>Password</Text>
      <TextInput accessibilityLabel="Test account password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} editable={!running} />
      <Pressable accessibilityRole="button" disabled={running || !email.trim() || !password} onPress={run} style={[styles.button, (running || !email.trim() || !password) && styles.disabled]}>
        <Text style={styles.buttonText}>{running ? 'Checking live backend…' : 'Run six checks'}</Text>
      </Pressable>
    </View>}
    {running && <ActivityIndicator color="#116149" />}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {results.map(result => <View key={result.flow} style={styles.resultCard}>
      <Text style={styles.flow}>{result.passed ? 'PASS' : 'FAIL'} · {result.flow}</Text>
      <Text style={styles.endpoint}>{result.endpoint} · HTTP {result.status}</Text>
      <Text style={styles.note}>{result.detail}{result.fingerprint ? ` · ${result.fingerprint}` : ''}</Text>
    </View>)}
    {!!completed && <View>
      <Pressable accessibilityRole="button" onPress={() => { setCompleted(''); setResults([]); }}><Text style={styles.link}>Run again</Text></Pressable></View>}
  </ScrollView></>;
}
const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32, backgroundColor: '#f3f7f4', flexGrow: 1, gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#173c30' }, subtitle: { color: '#116149', fontSize: 15, fontWeight: '600' },
  note: { color: '#4b5c54', fontSize: 12, lineHeight: 17 }, card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  label: { color: '#173c30', fontWeight: '600' }, input: { borderWidth: 1, borderColor: '#9aaea2', borderRadius: 8, padding: 12, color: '#172e24', fontSize: 16 },
  button: { backgroundColor: '#116149', borderRadius: 8, padding: 15, marginTop: 6 }, disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' }, flow: { color: '#116149', fontSize: 15, fontWeight: '700' },
  resultCard: { backgroundColor: '#fff', borderRadius: 12, padding: 10, gap: 4 },
  endpoint: { color: '#253b30', fontSize: 12 }, error: { color: '#a52b28', fontSize: 15 }, link: { color: '#116149', fontWeight: '700', paddingTop: 8 },
});
