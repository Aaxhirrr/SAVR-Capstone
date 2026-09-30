export const colors = {
  background: '#F9F7F3',
  paper: '#FFFFFF',
  green: '#71C978',
  deep: '#194D29',
  text: '#194D29',
  muted: '#547359',
  border: '#E0D6C7',
  pale: '#E4EEDA',
  peach: '#F2D6AF',
  yellow: '#F5AC0D',
  danger: '#A62C28',
  dangerBg: '#FFF0EE',
};
export const money = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(
    amount,
  );
export const dateLabel = (date: string) => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};
