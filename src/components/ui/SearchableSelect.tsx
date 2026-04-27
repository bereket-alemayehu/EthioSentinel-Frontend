import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string | number;
  label: string;
  code?: string;
  description?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string, id: string | number) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.code?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-12 px-4 bg-light-700/50 dark:bg-white/5 border border-light-400 dark:border-white/10 rounded-xl cursor-pointer hover:bg-light-700 dark:hover:bg-white/10 transition-colors"
      >
        <span className={cn("text-sm", !value && "text-light-500")}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-light-500 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a1b1e] border border-light-400 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center px-3 border-b border-light-400 dark:border-white/10">
            <Search className="w-4 h-4 text-light-500 mr-2" />
            <input
              autoFocus
              className="w-full h-10 bg-transparent text-sm focus:outline-none dark:text-white"
              placeholder="Type to filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    onChange(option.label, option.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-primary-500/10 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-bold dark:text-white">{option.label}</span>
                    {option.code && (
                      <span className="text-[10px] text-primary-500 font-bold uppercase tracking-widest">
                        {option.code}
                      </span>
                    )}
                  </div>
                  {value === option.label && <Check className="w-4 h-4 text-primary-500" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-xs text-light-500 font-bold uppercase tracking-widest">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
