import { people } from "./people";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiSearchPeople = async (query: string) => {
  await sleep(1000);
  return people.filter((person) =>
    person.fields.name.toLowerCase().includes(query.toLowerCase()),
  );
};
