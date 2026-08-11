import { APPLICATION_NAME } from './constants';

describe('APPLICATION_NAME', () => {
  it('is the kweather identifier', () => {
    expect(APPLICATION_NAME).toBe('kweather');
  });

  it('is a safe token for use in stack/resource names', () => {
    expect(APPLICATION_NAME).toMatch(/^[a-z0-9-]+$/);
  });
});
