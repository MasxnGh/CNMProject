export const shuffleOptions = (items) =>
  [...(items ?? [])]
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
