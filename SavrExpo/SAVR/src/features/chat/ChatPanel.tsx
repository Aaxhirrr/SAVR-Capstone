import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { GroceryList } from '@/models/domain';
import { useConversation } from '@/hooks/use-conversation';
import { useSession } from '@/state/session';
import {
  Button,
  Chip,
  Confirm,
  Empty,
  IconButton,
  Loading,
  Notice,
  s,
} from '@/components/savr/ui';
import { MessageText } from '@/components/savr/MessageText';
import { colors } from '@/theme/tokens';
import { scanPhoto } from '@/services/scan';
import { errorMessage } from '@/services/api';

export default function ChatPanel({ list }: { list?: GroceryList }) {
  const chat = useConversation(list);
  const { profile } = useSession();
  const [draft, setDraft] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const scroll = useRef<FlatList>(null);
  const scanPending = useRef(false);
  const busy = chat.busy || chat.loading || scanning;
  const send = async (text = draft) => {
    if (busy || !text.trim()) return;
    setDraft('');
    if (!(await chat.send(text))) setDraft(text);
  };
  const scan = async (source: 'camera' | 'library') => {
    if (busy || scanPending.current) return;
    scanPending.current = true;
    setScanning(true);
    setScanError('');
    try {
      const text = await scanPhoto(source);
      if (text) setDraft(text);
    } catch (e) {
      setScanError(errorMessage(e));
    } finally {
      scanPending.current = false;
      setScanning(false);
    }
  };
  return (
    <View style={s.flex}>
      <View style={[s.row, styles.toolbar]}>
        <View style={s.flex}>
          <Text style={s.cardTitle}>
            {list
              ? 'List conversation'
              : 'Hi ' + (profile?.firstName || 'there') + ' 👋'}
          </Text>
          <Text style={s.subtitle}>
            {list ? list.name : 'What are we shopping for today?'}
          </Text>
        </View>
        {!list && (
          <IconButton
            label="Start a new conversation"
            name="create-outline"
            disabled={busy}
            onPress={() => setConfirmReset(true)}
          />
        )}
        <IconButton
          label="Dietary and brand preferences"
          name="options-outline"
          onPress={() => router.push('/profile')}
        />
      </View>
      {chat.loading ? (
        <Loading label="Loading conversation…" />
      ) : (
        <FlatList
          ref={scroll}
          data={chat.conversation.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scroll.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <Empty
              title={
                list
                  ? 'Keep planning this list.'
                  : 'A good meal starts with an idea.'
              }
              detail={
                list
                  ? 'Ask about substitutions, recipes, or your next shopping trip.'
                  : 'Tell me what you need. I can help with meals, groceries, and your weekly shop.'
              }
            >
              {!list && (
                <View style={{ gap: 10, width: '100%' }}>
                  {[
                    'Plan affordable dinners for this week',
                    'Make a grocery list for a family of four',
                    'Help me plan vegetarian lunches',
                  ].map((prompt) => (
                    <Chip
                      key={prompt}
                      label={prompt}
                      onPress={() => setDraft(prompt)}
                    />
                  ))}
                </View>
              )}
            </Empty>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === 'user' ? styles.user : styles.assistant,
              ]}
            >
              <Text style={styles.speaker}>
                {item.role === 'user' ? 'YOU' : 'SAVR'}
              </Text>
              <MessageText text={item.text} />
            </View>
          )}
          ListFooterComponent={
            chat.busy ? <Loading label="SAVR is thinking…" /> : null
          }
        />
      )}
      <View style={styles.composer}>
        <Notice message={chat.error || scanError} error />
        {scanning && <Text style={s.subtitle}>Reading your photo…</Text>}
        <TextInput
          style={styles.draft}
          accessibilityLabel="Message SAVR"
          placeholder="Ask about groceries, meals, or deals…"
          placeholderTextColor={colors.muted}
          multiline
          value={draft}
          onChangeText={setDraft}
          editable={!busy}
        />
        <View style={s.row}>
          <IconButton
            label="Scan a photo with camera"
            name="camera-outline"
            disabled={busy}
            onPress={() => void scan('camera')}
          />
          <IconButton
            label="Scan a saved photo"
            name="image-outline"
            disabled={busy}
            onPress={() => void scan('library')}
          />
          <View style={s.flex} />
          <Button
            title="Send"
            icon="arrow-up"
            disabled={busy || !draft.trim()}
            onPress={() => void send()}
          />
        </View>
      </View>
      <Confirm
        visible={confirmReset}
        title="Start a new chat?"
        detail="This clears the current conversation on this device. Your grocery lists stay saved."
        busy={chat.busy}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          void chat.reset().then(() => {
            setDraft('');
            setConfirmReset(false);
          });
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  toolbar: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  messages: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
  },
  bubble: { padding: 18, borderRadius: 20, gap: 8, maxWidth: '94%' },
  user: {
    backgroundColor: colors.pale,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistant: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  speaker: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
    color: colors.muted,
  },
  composer: {
    padding: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
  },
  draft: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 52,
    maxHeight: 140,
    textAlignVertical: 'top',
  },
});
