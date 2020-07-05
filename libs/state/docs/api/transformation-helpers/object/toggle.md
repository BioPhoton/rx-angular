

# toggle

Toggles a boolean property in the object.

*Example*

```TypeScript
const state = {items: [1,2,3], loading: true};
```


## Signature

```TypeScript
function toggle<T extends object>(object: T, key: OnlyKeysOfSpecificType<T, boolean>): T
```
## Parameters

### object
 ##### typeof: T

### key
 ##### typeof: OnlyKeysOfSpecificType&#60;T, boolean&#62;
