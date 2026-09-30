import type { KnownStore } from '@/models/domain';
import { Notice } from './ui';
export default function StoreMap(_props: {
  location?: { latitude: number; longitude: number };
  selected?: string;
  onSelect: (store: KnownStore) => void;
}) {
  return (
    <Notice message="Browse stores below. The interactive map is available in the SAVR mobile app." />
  );
}
