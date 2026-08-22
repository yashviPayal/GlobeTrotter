import { Select, type SelectOption } from './Select'

/**
 * The search / filter / sort toolbar the wireframes repeat across six screens.
 *
 * Built once and driven entirely by props, so every list screen gets the same
 * control layout, the same labels and the same keyboard behaviour — and a fix
 * here fixes all of them.
 */

export interface ToolbarFilter {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

interface DataToolbarProps {
  search: {
    value: string
    placeholder: string
    onChange: (value: string) => void
  }
  filters?: ToolbarFilter[]
  sort?: ToolbarFilter
  /** Rendered on the right — usually a result count. */
  meta?: string
}

export function DataToolbar({ search, filters = [], sort, meta }: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="toolbar-search" className="sr-only">
            {search.placeholder}
          </label>
          <input
            id="toolbar-search"
            type="search"
            value={search.value}
            placeholder={search.placeholder}
            onChange={(event) => search.onChange(event.target.value)}
            className="h-10 w-full rounded-control border border-hairline bg-surface px-3 text-sm text-ink placeholder:text-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {filters.map((filter) => (
          <Select
            key={filter.label}
            label={filter.label}
            value={filter.value}
            options={filter.options}
            onChange={(event) => filter.onChange(event.target.value)}
            className="min-w-[10rem]"
          />
        ))}

        {sort && (
          <Select
            label={sort.label}
            value={sort.value}
            options={sort.options}
            onChange={(event) => sort.onChange(event.target.value)}
            className="min-w-[10rem]"
          />
        )}
      </div>

      {meta && <p className="text-sm text-muted">{meta}</p>}
    </div>
  )
}
