interface City {
  name: string;
  zip: number;
}

interface Person {
  city: {
    name: string;
  zip: number;
};
}
