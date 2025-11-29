interface Stat {
  label: string;
  value: string;
  description?: string;
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-6"
        >
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            {stat.value}
          </div>
          <div className="text-lg font-semibold text-zinc-300 mb-1">
            {stat.label}
          </div>
          {stat.description && (
            <div className="text-sm text-zinc-500 mt-2">{stat.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}

