import { expect } from 'chai';
import * as QueryUtils from '../src/query';

describe('diffKeys', () => {
  it('handles two empty params', () => {
    expect(QueryUtils.diffKeys({}, {})).to.deep.equal([]);
  });

  it('handles empty first param', () => {
    expect(QueryUtils.diffKeys({}, { a: 1 })).to.deep.equal([]);
  });

  it('handles empty second param', () => {
    expect(QueryUtils.diffKeys({ a: 1 }, {})).to.deep.equal([1]);
  });

  it('returns values in first path but not in second', () => {
    expect(QueryUtils.diffKeys(
      {
        'a/b/c': 1,
        'd/e/f': 2,
        'h/i/j': 3
      },
      {
        'd/e/f': 2,
        'k/l/m': 4
      })
    ).to.deep.equal([1, 3]);
  });
});
