import { MockChangeDetectorRef } from './fixtures';

export function getMockStrategyConfig() {
  return {
    cdRef: new MockChangeDetectorRef()
  };
}
