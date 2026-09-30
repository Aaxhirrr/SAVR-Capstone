import { Screen } from '@/components/savr/ui';
import ChatPanel from '@/features/chat/ChatPanel';
export default function Chat() {
  return (
    <Screen scroll={false}>
      <ChatPanel />
    </Screen>
  );
}
