import { FilterChip } from "@/components/ui/FilterChip";
import { cn } from "@/lib/utils";
import { CategoryChips, getRefinementSuggestions } from "@/components/ui/CategoryChips";

interface RefinementChipsProps {
  refinementPath: string[];
  onSetTopCategory: (category: string) => void;
  onAddRefinement: (term: string) => void;
  onPopToIndex: (index: number) => void;
  onReset: () => void;
  className?: string;
}

export function RefinementChips({
  refinementPath,
  onSetTopCategory,
  onAddRefinement,
  onPopToIndex,
  onReset,
  className,
}: RefinementChipsProps) {
  const topCategory = refinementPath[0] || "All";
  const suggestions = getRefinementSuggestions(refinementPath);

  return (
    <div className={cn("space-y-1", className)}>
      {/* Row 1: Top-level categories */}
      <div data-tour="category-pills">
        <CategoryChips
          activeCategory={topCategory}
          onCategoryChange={(cat) => {
            if (cat === "All") {
              onReset();
            } else {
              onSetTopCategory(cat);
            }
          }}
        />
      </div>

      {/* Row 2: Contextual refinement suggestions */}
      {suggestions.length > 0 && (
        <div className="flex overflow-x-auto scrollbar-hide gap-2 py-2 -mx-4 px-4 scroll-smooth">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onAddRefinement(suggestion)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium tracking-wide transition-all duration-200 ease-out shrink-0 bg-white border border-[#E5DFC6] text-[#6B7280] hover:border-[#C7A962] hover:text-[#0a2225] hover:shadow-sm hover:-translate-y-px"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Row 3: Active refinement path breadcrumbs */}
      {refinementPath.length > 1 && (
        <div className="flex flex-wrap gap-1.5 py-2 -mx-4 px-4">
          {refinementPath.slice(1).map((term, i) => (
            <FilterChip
              key={`${term}-${i}`}
              variant="dark"
              removeLabel={`Remove ${term}`}
              onRemove={() => onPopToIndex(i + 1)}
              className="animate-in fade-in slide-in-from-left-2 duration-200"
            >
              {term}
            </FilterChip>
          ))}
          {refinementPath.length > 2 && (
            <button
              onClick={() => onPopToIndex(1)}
              className="px-3 py-1 rounded-full text-sm font-medium text-[#6B7280] hover:text-[#0a2225] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
