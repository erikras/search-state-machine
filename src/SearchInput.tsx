import { useMachine } from "@xstate/react";
import { searchMachine } from "./search.machine";

export const SearchInput = () => {
  const [snapshot, send] = useMachine(searchMachine);
  return (
    <div>
      <input
        type="text"
        role="search"
        placeholder="Search..."
        onChange={(event) =>
          send({ type: "Query Change", query: event.target.value })
        }
        value={
          snapshot.context.selection?.fields.name ?? snapshot.context.query
        }
        className={snapshot.matches("Selecting") ? "open" : ""}
      />
      {snapshot.matches("No Results") && snapshot.context.query && (
        <div className="no-results" role="none">
          No Results
        </div>
      )}
      {snapshot.matches("Searching") && (
        <div className="spinner" role="status" />
      )}
      {snapshot.matches("Selecting") && (
        <ul role="menu">
          {snapshot.context.results.map((result, index) => (
            <li
              key={result.pk}
              className={
                index === snapshot.context.highlightedIndex ? "highlighted" : ""
              }
              onClick={(event) => send({ type: "Select" })}
              onMouseMove={(event) =>
                send({ type: "Set Highlighted Index", index })
              }
              role="menuitem"
            >
              {result.fields.name}
            </li>
          ))}
        </ul>
      )}
      <pre>{JSON.stringify(snapshot.value)}</pre>
    </div>
  );
};
