import { Person } from "./people";
import { useEffect, useState } from "react";
import { apiSearchPeople } from "./api";

export const SearchInputHooks = () => {
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selection, setSelection] = useState<Person | undefined>();
  const [results, setResults] = useState<Person[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [isSearching, setSearching] = useState(false);

  useEffect(() => {
    let ignore = false;
    const handleFetch = () => {
      if (!query.trim().length) return;
      setSearching(true);
      setHighlightedIndex(-1);
      apiSearchPeople(query)
        .then((results) => {
          if (ignore) return;
          setResults(results);
          setHighlightedIndex(0);
          setOpen(true);
        })
        .finally(() => {
          setSearching(false);
        });
    };
    handleFetch();

    return () => {
      ignore = true;
    };
  }, [query]);

  return (
    <div>
      <input
        type="text"
        role="search"
        placeholder="Search..."
        onChange={(event) => {
          setSelection(undefined);
          setQuery(event.target.value);
        }}
        value={query || (selection && selection.fields.name) || ""}
        className={isOpen ? "open" : ""}
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowDown":
              setHighlightedIndex((index) =>
                Math.min(index + 1, results.length - 1),
              );
              break;
            case "ArrowUp":
              setHighlightedIndex((index) => Math.max(index - 1, 0));
              break;
            case "Enter":
              if (highlightedIndex === -1) break;
              setSelection(results[highlightedIndex]);
              setQuery("");
              setOpen(false);
              break;
          }
        }}
      />
      {isOpen && !results.length && (
        <div className="no-results" role="none">
          No Results
        </div>
      )}
      {isSearching && <div className="spinner" role="status" />}
      {isOpen && results.length > 0 && (
        <ul role="menu">
          {results.map((result, index) => (
            <li
              className={index === highlightedIndex ? "highlighted" : ""}
              onClick={() => {
                setSelection(result);
                setQuery("");
                setOpen(false);
              }}
              onMouseMove={() => setHighlightedIndex(index)}
              role="menuitem"
            >
              {result.fields.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
