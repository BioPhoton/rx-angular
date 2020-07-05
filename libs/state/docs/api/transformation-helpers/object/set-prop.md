

# setProp

Accepts an object of type T, key of type K extends keyof T, and value of type T[K].

*Example*

```TypeScript
const cat = {id: 1, type: 'cat', name: 'Fluffy'};
```


## Signature

```TypeScript
function setProp<T extends object, K extends keyof T>(object: T, key: K, value: T[K]): T
```
## Parameters

### object
 ##### typeof: T

### key
 ##### typeof: K

### value
 ##### typeof: T[K]
