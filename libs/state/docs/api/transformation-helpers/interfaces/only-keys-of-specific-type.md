

# OnlyKeysOfSpecificType

Allows to pass only keys which value is of specific type.

*Example*

```TypeScript
interface Creature {
```


## Signature

```TypeScript
type OnlyKeysOfSpecificType<T, S> = {
  [Key in keyof T]: S extends T[Key] ? Key : never;
}[keyof T]
```