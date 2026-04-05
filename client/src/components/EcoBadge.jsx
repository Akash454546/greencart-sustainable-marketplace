export default function EcoBadge({ score }) {
  let bg, text;
  if (score >= 80) {
    bg = 'bg-green-100 text-green-800';
  } else if (score >= 50) {
    bg = 'bg-amber-100 text-amber-800';
  } else {
    bg = 'bg-red-100 text-red-800';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg}`}>
      🍃 {score}
    </span>
  );
}
