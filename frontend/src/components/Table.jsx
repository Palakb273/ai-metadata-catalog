const sensitivityLevelColors = {
  High: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  Medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  Low: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
}

const dataTypeColors = {
  Numeric: 'bg-blue-100 text-blue-700',
  Categorical: 'bg-purple-100 text-purple-700',
  DateTime: 'bg-orange-100 text-orange-700',
  Boolean: 'bg-cyan-100 text-cyan-700',
  Text: 'bg-surface-100 text-surface-700',
  ID: 'bg-pink-100 text-pink-700',
}

const sensitivityTagColors = {
  PII: 'bg-red-100 text-red-700',
  Financial: 'bg-amber-100 text-amber-700',
  Health: 'bg-rose-100 text-rose-700',
  Internal: 'bg-surface-100 text-surface-700',
  Public: 'bg-emerald-100 text-emerald-700',
}

export default function MetadataTable({ metadata, filterType, filterSensitivity, searchQuery }) {
  if (!metadata || metadata.length === 0) {
    return (
      <div className="text-center py-16 text-surface-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium">No metadata available</p>
        <p className="text-sm mt-1">Upload a schema to get started</p>
      </div>
    )
  }

  // Apply filters
  let filtered = [...metadata]

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (col) =>
        col.column_name.toLowerCase().includes(q) ||
        col.description?.toLowerCase().includes(q)
    )
  }

  if (filterType && filterType !== 'All') {
    filtered = filtered.filter((col) => col.data_type_tag === filterType)
  }

  if (filterSensitivity && filterSensitivity !== 'All') {
    filtered = filtered.filter((col) => col.sensitivity_tag === filterSensitivity)
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white shadow-sm" id="metadata-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 border-b border-surface-200">
            <th className="text-left py-3.5 px-4 font-semibold text-surface-700 whitespace-nowrap">Column Name</th>
            <th className="text-left py-3.5 px-4 font-semibold text-surface-700 min-w-[250px]">Description</th>
            <th className="text-left py-3.5 px-4 font-semibold text-surface-700 whitespace-nowrap">Data Type</th>
            <th className="text-left py-3.5 px-4 font-semibold text-surface-700 whitespace-nowrap">Sensitivity Tag</th>
            <th className="text-left py-3.5 px-4 font-semibold text-surface-700 whitespace-nowrap">Sensitivity Level</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((col, idx) => {
            const levelStyle = sensitivityLevelColors[col.sensitivity_level] || sensitivityLevelColors.Medium
            const typeStyle = dataTypeColors[col.data_type_tag] || dataTypeColors.Text
            const tagStyle = sensitivityTagColors[col.sensitivity_tag] || sensitivityTagColors.Internal

            return (
              <tr
                key={col.column_name + idx}
                className="border-b border-surface-100 hover:bg-primary-50/30 transition-colors duration-150"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <td className="py-3.5 px-4">
                  <span className="font-mono text-sm font-semibold text-surface-800 bg-surface-100 px-2 py-0.5 rounded">
                    {col.column_name}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-surface-600 leading-relaxed">
                  {col.description}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeStyle}`}>
                    {col.data_type_tag}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tagStyle}`}>
                    {col.sensitivity_tag}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${levelStyle.dot}`} />
                    {col.sensitivity_level}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="text-center py-8 text-surface-400">
          <p>No columns match the current filters</p>
        </div>
      )}
    </div>
  )
}
