import { useState, useRef, useEffect } from "react";

interface LocationResult {
  display: string;
  placeId: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "City, Country",
  error,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&featureType=city`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        const locations: LocationResult[] = data
          .filter((item: any) => item.address?.country)
          .map((item: any) => {
            const city =
              item.address.city ||
              item.address.town ||
              item.address.village ||
              item.address.county ||
              item.name;
            const country = item.address.country;
            return {
              display: `${city}, ${country}`,
              placeId: item.place_id,
            };
          })
          .filter(
            (item: LocationResult, index: number, self: LocationResult[]) =>
              self.findIndex((i) => i.display === item.display) === index,
          );
        setResults(locations);
        setOpen(locations.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    search(val);
  };

  const handleSelect = (location: LocationResult) => {
    setQuery(location.display);
    onChange(location.display);
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={handleInput}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full h-9 rounded-md border px-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-ring/30 ${
          error ? "border-destructive" : "border-input"
        }`}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-surface shadow-md overflow-hidden">
          {results.map((r) => (
            <li
              key={r.placeId}
              onMouseDown={() => handleSelect(r)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent transition"
            >
              {r.display}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
