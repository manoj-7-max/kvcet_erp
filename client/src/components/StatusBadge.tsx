'use client';

export default function StatusBadge({ status }: { status: string }) {
  let bg = 'bg-neutral-500/20';
  let text = 'text-neutral-400';

  switch (status) {
    case 'Pending':
      bg = 'bg-yellow-500/20';
      text = 'text-yellow-400';
      break;
    case 'Faculty_Approved':
    case 'Under Review':
      bg = 'bg-blue-500/20';
      text = 'text-blue-400';
      break;
    case 'HOD_Approved':
    case 'Resolved':
      bg = 'bg-emerald-500/20';
      text = 'text-emerald-400';
      break;
    case 'Faculty_Rejected':
    case 'HOD_Rejected':
    case 'Rejected':
      bg = 'bg-red-500/20';
      text = 'text-red-400';
      break;
    case 'Closed':
      bg = 'bg-neutral-500/20';
      text = 'text-neutral-400';
      break;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border border-white/5 ${bg} ${text}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
