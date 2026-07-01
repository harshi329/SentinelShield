interface StatCardProps {
  title: string;
  value: string;
  change: string;
}

const StatCard = ({
  title,
  value,
  change,
}: StatCardProps) => {
  return (
    <div
      className="
      rounded-2xl
      border
      border-slate-200
      dark:border-white/10

      bg-white
      dark:bg-slate-900/50

      p-6
      "
    >
      <p
        className="
        text-sm
        text-slate-500
        dark:text-slate-400
        "
      >
        {title}
      </p>

      <h2
        className="
        mt-3
        text-4xl
        font-bold
        tracking-tight
        text-slate-900
        dark:text-white
        "
      >
        {value}
      </h2>

      <p
        className="
        mt-2
        text-sm
        text-slate-500
        dark:text-slate-400
        "
      >
        {change}
      </p>
    </div>
  );
};

export default StatCard;