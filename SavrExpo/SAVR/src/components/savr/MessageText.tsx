import { Text, View } from 'react-native';
import { s } from './ui';
export function MessageText({ text }: { text: string }) {
  return (
    <View style={{ gap: 6 }}>
      {text.split('\n').map((line, index) => {
        const heading = /^#{1,4}\s/.test(line);
        const cleaned = line
          .replace(/^#{1,4}\s+/, '')
          .replace(/^[-*]\s+/, '• ');
        return (
          <Text
            selectable
            key={index}
            style={[s.body, heading && { fontWeight: '800', marginTop: 6 }]}
          >
            {cleaned.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <Text key={i} style={{ fontWeight: '700' }}>
                  {part.slice(2, -2)}
                </Text>
              ) : (
                part
              ),
            )}
          </Text>
        );
      })}
    </View>
  );
}
