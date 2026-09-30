import { useCallback, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSession } from '@/state/session';
import { useResource } from '@/hooks/use-resource';
import {
  Button,
  Card,
  Chip,
  Heading,
  Icon,
  Loading,
  Notice,
  Screen,
  s,
} from '@/components/savr/ui';
import { colors, dateLabel, money } from '@/theme/tokens';
import ChatPanel from '@/features/chat/ChatPanel';
import { errorMessage } from '@/services/api';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { service } = useSession();
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => service.list(id, signal),
      [service, id],
    ),
  );
  const [tab, setTab] = useState<'list' | 'chat'>('list');
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [shareError, setShareError] = useState('');
  const list = resource.data;
  if (!list)
    return (
      <Screen>
        <Notice message={resource.error} error />
        {resource.loading ? (
          <Loading />
        ) : (
          <Button title="Try again" onPress={() => void resource.reload()} />
        )}
      </Screen>
    );
  const share = async () => {
    try {
      await Share.share({
        message:
          list.name +
          '\n\n' +
          list.items
            .map((i) => '• ' + i.name + (i.quantity ? ' — ' + i.quantity : ''))
            .join('\n'),
      });
    } catch (e) {
      setShareError(errorMessage(e));
    }
  };
  return (
    <Screen scroll={false}>
      <View style={[s.row, { padding: 16 }]}>
        <Chip
          label="Grocery list"
          selected={tab === 'list'}
          onPress={() => setTab('list')}
        />
        <Chip
          label="Conversation"
          selected={tab === 'chat'}
          onPress={() => setTab('chat')}
        />
      </View>
      <View style={{ flex: 1, display: tab === 'chat' ? 'flex' : 'none' }}>
        <ChatPanel key={list.id} list={list} />
      </View>
      {tab === 'list' && (
        <ScrollView contentContainerStyle={s.content}>
          <Notice message={resource.error || shareError} error />
          <Heading
            title={list.name}
            subtitle={
              dateLabel(list.createdAt) + ' · ' + list.items.length + ' items'
            }
          />
          <Card style={{ borderStyle: 'dashed' }}>
            <Text style={[s.label, { textAlign: 'center', letterSpacing: 3 }]}>
              SAVR · YOUR GROCERY RECEIPT
            </Text>
            {list.items.length === 0 && (
              <Text style={s.body}>
                This list has no items yet. Continue the conversation to plan
                your shop.
              </Text>
            )}
            {list.items.map((item, index) => (
              <Pressable
                key={index}
                accessibilityRole="checkbox"
                aria-checked={checked.has(index)}
                accessibilityState={{ checked: checked.has(index) }}
                accessibilityLabel={item.name}
                onPress={() =>
                  setChecked((old) => {
                    const next = new Set(old);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  })
                }
                style={[
                  s.row,
                  {
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Icon
                  name={
                    checked.has(index) ? 'checkmark-circle' : 'ellipse-outline'
                  }
                />
                <View style={s.flex}>
                  <Text
                    style={[
                      s.body,
                      checked.has(index) && {
                        textDecorationLine: 'line-through',
                        opacity: 0.5,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {!!(item.category || item.meal) && (
                    <Text style={s.subtitle}>
                      {[item.category, item.meal].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
                <Text style={s.label}>{item.quantity}</Text>
              </Pressable>
            ))}
            {list.cheapestStore && (
              <Text style={s.body}>
                Lowest total: {list.cheapestStore}
                {list.cheapestPrice !== undefined
                  ? ' · ' + money(list.cheapestPrice)
                  : ''}
              </Text>
            )}
            {list.priciestStore && (
              <Text style={s.subtitle}>
                Compare: {list.priciestStore}
                {list.priciestPrice !== undefined
                  ? ' · ' + money(list.priciestPrice)
                  : ''}
              </Text>
            )}
            {list.savings !== undefined && (
              <Text style={s.cardTitle}>
                Potential savings {money(list.savings)}
              </Text>
            )}
          </Card>
          <Button
            title="Share grocery list"
            icon="share-outline"
            onPress={() => void share()}
          />
          <Button
            title="Refresh list"
            secondary
            loading={resource.loading}
            onPress={() => void resource.reload()}
          />
        </ScrollView>
      )}
    </Screen>
  );
}
