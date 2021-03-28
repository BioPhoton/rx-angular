// tslint:disable
import { toDictionary } from '@rx-angular/state';

interface Creature {
  id: number;
  type: string;
  real: boolean;
  breeds: string[];
}


let creatures: Creature[];

const genus = Symbol('genus');

const dictionaryByNumber = {
  1: { id: 1, type: 'cat', real: true, breeds: ['Persian'] },
  2: { id: 2, type: 'dog', real: true, breeds: ['Doberman'] },
  3: { id: 3, type: 'catDog', real: false, breeds: [] }
};

const dictionaryByString = {
  cat: { id: 1, type: 'cat', real: true, breeds: ['Persian'] },
  dog: { id: 2, type: 'dog', real: true, breeds: ['Doberman'] },
  catDog: { id: 3, type: 'catDog', real: false, breeds: [] }
};

const dictionaryBySymbol = {
  felis: { id: 1, type: 'cat', real: true, breeds: ['Persian'], [genus]: 'felis' },
  canis: { id: 2, type: 'dog', real: true, breeds: ['Doberman'], [genus]: 'canis' },
  fake: { id: 3, type: 'catDog', real: false, breeds: [], [genus]: 'fake' }
};

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {
  });
  creatures = [
    { id: 1, type: 'cat', real: true, breeds: ['Persian'] },
    { id: 2, type: 'dog', real: true, breeds: ['Doberman'] },
    { id: 3, type: 'catDog', real: false, breeds: [] }
  ];
});


describe('toDictionary', () => {

  describe('general', () => {
    it('should be defined', () => {
      const fn = toDictionary;

      expect(fn).toBeDefined();
    });
  });

  describe('functionality', () => {
    it('should create dictionary by number', () => {
      const dictionaryResult = toDictionary(creatures, 'id');

      expect(dictionaryResult).toEqual(dictionaryByNumber);
    });

    it('should create dictionary by string', () => {
      const dictionaryResult = toDictionary(creatures, 'type');

      expect(dictionaryResult).toEqual(dictionaryByString);
    });

    it('should create dictionary by symbol', () => {
      const dictionaryResult = toDictionary(Object.values(dictionaryBySymbol), genus);

      expect(dictionaryResult).toEqual(dictionaryBySymbol);
    });
  });

  describe('edge cases', () => {
    it('should work with empty initial array', () => {
      const dictionaryResult = toDictionary([] as any, 'fakeKey' as unknown as never);

      expect(dictionaryResult).toEqual({});
    });

    it('should not call console.warn when key not found and source is empty', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      toDictionary([] as any, 'fakeKey' as unknown as never);

      expect(spy).not.toBeCalled();
    });

    it('should call console.warn when key not found and source not empty', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      toDictionary([{notFake: 1}] as any, 'fakeKey' as unknown as never);

      expect(spy).toBeCalled();
    });

    it('should return empty object if key does not exist', () => {
      expect(toDictionary(creatures, 'fake' as any)).toEqual({});
    });

    it('should return empty object when key value is not string, number or symbol', () => {
      expect(toDictionary(creatures, 'breeds' as any)).toEqual({});
    });

    it('should return empty object when key is not provided', () => {
      expect(toDictionary(creatures, null as any)).toEqual({});
    });

    it('should return empty object when first argument is not array', () => {

      expect(toDictionary('' as any, '' as unknown as never)).toEqual({});

      expect(toDictionary({} as any, '' as unknown as never)).toEqual({});

      expect(toDictionary(1 as any, '' as unknown as never)).toEqual({});

      expect(toDictionary(false as any, '' as unknown as never)).toEqual({});
    });

    it('should return null or undefined when array is not provided', () => {
      const arr: any[] = null as any;
      const arr2: any[] = undefined as any;
      expect(toDictionary(arr, '')).toEqual(null);
      expect(toDictionary(arr2, '')).toEqual(undefined);
    });
  });
});
