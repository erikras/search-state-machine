import { assign, fromCallback, setup } from "xstate";
import { Person } from "./people";
import { apiSearchPeople } from "./api";

interface Context {
  highlightedIndex: number;
  selection?: Person;
  query: string;
  results: Person[];
}

type Event =
  | { type: "Query Change"; query: string }
  | { type: "Found Results"; results: Person[] }
  | { type: "Set Highlighted Index"; index: number }
  | { type: "Highlight Next" }
  | { type: "Highlight Previous" }
  | { type: "Select" };

export const searchMachine = setup({
  types: {
    context: {} as Context,
    events: {} as Event,
  },
  guards: {
    "have results": (_, params: { results: Person[] }) =>
      params.results.length > 0,
    "have query": (_, params: { query: string }) =>
      Boolean(params.query.trim()),
  },
  actors: {
    keyboard: fromCallback(({ sendBack }) => {
      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            sendBack({ type: "Highlight Next" });
            break;
          case "ArrowUp":
            event.preventDefault();
            sendBack({ type: "Highlight Previous" });
            break;
          case "Enter":
            event.preventDefault();
            sendBack({ type: "Select" });
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }),
    search: fromCallback<Event, { query: string }>(({ sendBack, input }) => {
      if (input.query.trim().length === 0) {
        sendBack({ type: "Found Results", results: [] });
        return;
      }
      apiSearchPeople(input.query).then((results) => {
        sendBack({ type: "Found Results", results });
      });
    }),
  },
  actions: {
    setQuery: assign({
      query: (_, params: { query: string }) => params.query,
    }),
    setResults: assign({
      results: (_, params: { results: Person[] }) => params.results,
    }),
    clearResults: assign({
      results: () => [],
    }),
    clearSelection: assign({
      selection: () => undefined,
    }),
    clearQuery: assign({
      query: () => "",
    }),
    highlightFirst: assign({
      highlightedIndex: () => 0,
    }),
    highlightNext: assign({
      highlightedIndex: (
        _,
        params: { highlightedIndex: number; results: Person[] },
      ) => Math.min(params.highlightedIndex + 1, params.results.length - 1),
    }),
    highlightPrevious: assign({
      highlightedIndex: (_, params: { highlightedIndex: number }) =>
        Math.max(params.highlightedIndex - 1, 0),
    }),
    setHighlightedIndex: assign({
      highlightedIndex: (_, params: { index: number }) => params.index,
    }),
    setSelection: assign({
      query: (_, params: { highlightedIndex: number; results: Person[] }) =>
        params.results[params.highlightedIndex]?.fields.name ?? "",
      selection: (_, params: { highlightedIndex: number; results: Person[] }) =>
        params.results[params.highlightedIndex],
    }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QGUwEMBOBjAFgAgFk1cBLAOzAGIBFAVzAwE88BhHNMmAbQAYBdRKAAOAe1gkALiRFlBIAB6IALACYANCEbKAbAHYAdAA4AnAFZDKwwEYAzLovarAXycbUmXIWI5yVOg2Y2Dm4rASQQUXEpGTlFBCUlfVNdHhsrFVMNLQRtS30bYytjFStDQ3sVRxc3dGx8IlIKfXc68ihKADERWjIIPAAlOFoAGwlYXjDhMUlpWXC43V1jfQyeNbKeJStdFXVNRBslbXzdwqslXSsrU2MlapAWzwafJseX9q6evsHYEbGuUJySIzGLzRCLZardaGTbbXZZRCmNL5Gw3GwqGybJTFQz3N5eRpgZpgYZgLBSTiUAASJCgOGGtJwEjwADkwPIJBMgdNonNQHErDxjDwkrlTDwNlsdntsipdDZ9EoeLkEjCEsVdNo8bUnt5fMTSeS2tTGQy6cyAAoYMAAN2ktHG-G5UVmsUQgs1+glNyOmKl8P2CG2BiUSKuxjV2Ll2o89T1rxJZIp7VQzJpdLNTMgeAAkr12VzwsDeW6g8rEqG0jYbGq4TLENZFcZm7dIxq7q4Hjq44SDUnjahDZynUWea6wUG5YZ9OlxRLa9KEQgbI5FcqVKqsRqtZ38c99QARMAAI26ZCwxvksAkaAkRLQADM7xgABSCtYASkoe-jRKPp56C9OELKYXVBfllBSFZjG0QxTG0LZyjWbRtCXcVTHyJQTAKJEVxrJQbBcTsyBECA4DkH9CWdEE+QURAAFpUMDRivTWNZTCKUxxR2eCYzqAkXiJFkRAGIZRngUcwNogUCJFUwjjKGtYUXQMlQwwVjBXCMtzlHcaljAT9TeNpqJLCdtGVE5rFKeSkUMdElzsBVTEqVIEMua5bj43Ve0HftOFM8cILLT04OuS4-TrRzdESVFNO0bT1V07ye0E-R-zPICoEC8C6OXPI0V0TJA3FWKsJgrCeHOFUOxcIA */
  id: "Search Machine",

  context: {
    query: "",
    highlightedIndex: 0,
    results: [],
  },

  states: {
    "No Results": {},

    Searching: {
      invoke: {
        src: "search",
        input: ({ context }) => context,
      },

      on: {
        "Found Results": [
          {
            target: "Selecting",

            guard: {
              type: "have results",
              params: ({ event }) => event,
            },

            actions: [
              {
                type: "setResults",
                params: ({ event }) => event,
              },
              "highlightFirst",
            ],
          },
          {
            target: "No Results",
            reenter: true,
            actions: "clearResults",
          },
        ],
      },
    },

    Selecting: {
      invoke: {
        src: "keyboard",
      },

      on: {
        "Highlight Next": {
          target: "Selecting",
          actions: {
            type: "highlightNext",
            params: ({ context }) => context,
          },
        },

        "Highlight Previous": {
          target: "Selecting",
          actions: {
            type: "highlightPrevious",
            params: ({ context }) => context,
          },
        },

        "Set Highlighted Index": {
          target: "Selecting",
          actions: {
            type: "setHighlightedIndex",
            params: ({ event }) => event,
          },
        },

        Select: {
          target: "No Results",
          actions: [
            {
              type: "setSelection",
              params: ({ context }) => context,
            },
            { type: "clearQuery" },
          ],
        },
      },
    },

    Debouncing: {
      after: {
        "1000": "Searching",
      },
    },
  },

  initial: "No Results",

  on: {
    "Query Change": [
      {
        target: ".Debouncing",
        actions: [
          {
            type: "setQuery",
            params: ({ event }) => event,
          },
          "clearSelection",
        ],
        guard: {
          type: "have query",
          params: ({ event }) => event,
        },
      },
      {
        target: ".No Results",
        actions: [
          {
            type: "setQuery",
            params: ({ event }) => event,
          },
          "clearSelection",
        ],
      },
    ],
  },
});
