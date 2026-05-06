const sensitivityLevelColors = {
  High: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
}

const dataTypeColors = {
  Numeric: 'bg-blue-100 text-blue-700',
  Categorical: 'bg-purple-100 text-purple-700',
  DateTime: 'bg-orange-100 text-orange-700',
  Boolean: 'bg-cyan-100 text-cyan-700',
  Text: 'bg-surface-100 text-surface-700',
  ID: 'bg-pink-100 text-pink-700',
}

export default function ColumnCard({ column }) {
  const levelStyle = sensitivityLevelColors[column.sensitivity_level] || sensitivityLevelColors.Medium
  const typeStyle = dataTypeColors[column.data_type_tag] || dataTypeColors.Text

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4 hover:shadow-md hover:border-primary-200 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-mono text-sm font-semibold text-surface-800 bg-surface-100 px-2 py-0.5 rounded">
          {column.column_name}
        </h4>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${levelStyle.dot}`} />
          {column.sensitivity_level}
        </span>
      </div>

      <p className="text-sm text-surface-600 leading-relaxed mb-3">{column.description}</p>

      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle}`}>
          {column.data_type_tag}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-500 font-medium">
          {column.sensitivity_tag}
        </span>
      </div>

      {column.sample_values && column.sample_values.length > 0 && (
        <div className="mt-3 pt-3 border-t border-surface-100">
          <p className="text-xs text-surface-400 mb-1">Sample values:</p>
          <p className="text-xs text-surface-500 font-mono truncate">
            {column.sample_values.slice(0, 3).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
