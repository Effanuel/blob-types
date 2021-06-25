# blob-types

Generate single, already extended interfaces

TODO: add tests, and setup

#### Examples:

```ts
//From:
interface A {
  a: number;
}

interface B extends A {
  b: number;
}

interface C extends B {
  c: number;
}

// -----

//To:
interface A {
  a: number;
}

interface B {
  b: number;
  a: number;
}

interface C {
  c: number;
  b: number;
  a: number;
}
```
