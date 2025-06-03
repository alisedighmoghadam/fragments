const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory');

describe('Memory Index', () => {
  test('listFragments() return a empty array ', async () => {
    const result = await listFragments('123');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  test('writeFragment() write an empty fragment', () => {
    const testFragment = {};
    expect(async () => await writeFragment(testFragment)).rejects.toThrow();
  });

  test('writeFragmentData() write an empty fragment meta data', () => {
    expect(async () => await writeFragmentData()).rejects.toThrow();
  });

  test('writeFragment() and writeFragmentData() write a non empty fragment', async () => {
    const testFragment = {
      id: 'abc',
      ownerId: '123',
    };
    const buffer = 'Hello';
    await writeFragment(testFragment);
    await writeFragmentData('123', 'abc', buffer);
    const result = await readFragment('123', 'abc');
    expect(result).toEqual(testFragment);
  });

  test('deleteFragment() delete a non empty fragment', async () => {
    await deleteFragment('123', 'abc');
    const result = await readFragment('123', 'abc');
    expect(result).toBe(undefined);
  });

  test('deleteFragment() delete non existence fragment', () => {
    expect(async () => {
      await deleteFragment('123', 'abc');
    }).rejects.toThrow();
  });

  test('deleteFragment() delete empty fragment', () => {
    expect(async () => {
      await deleteFragment();
    }).rejects.toThrow();
  });

  test('listFragments() return a non empty array', async () => {
    const testFragment1 = {
      id: 'abc',
      ownerId: '123',
    };
    const testFragment2 = {
      id: 'efg',
      ownerId: '123',
    };
    const buffer = 'hello';
    await writeFragment(testFragment1);
    await writeFragmentData('123', 'abc', buffer);
    await writeFragment(testFragment2);
    await writeFragmentData('123', 'efg', buffer);

    const result = await listFragments('123');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result).toEqual(['abc', 'efg']);
    await deleteFragment('123', 'abc');
    await deleteFragment('123', 'efg');
  });

  test('readFragment() read existence fragment', async () => {
    const testFragment1 = {
      id: 'abc',
      ownerId: '123',
    };

    const buffer1 = 'hello';

    await writeFragment(testFragment1);

    await writeFragmentData('123', 'abc', buffer1);

    const result = await readFragment('123', 'abc');
    expect(result).toEqual({
      id: 'abc',
      ownerId: '123',
    });
    await deleteFragment('123', 'abc');
  });

  test('readFragmentData() read existence fragment data', async () => {
    const testFragment1 = {
      id: 'abc',
      ownerId: '123',
    };

    const buffer1 = 'hello';

    await writeFragment(testFragment1);

    await writeFragmentData('123', 'abc', buffer1);

    const result = await readFragmentData('123', 'abc');
    expect(result).toEqual('hello');
    await deleteFragment('123', 'abc');
  });

  test('readFragment() read non existence fragment ', async () => {
    const result = await readFragment('123', 'abc');
    expect(result).toBe(undefined);
  });

  test('readFragmentData() read non existence fragment data ', async () => {
    const result = await readFragmentData('123', 'abc');
    expect(result).toBe(undefined);
  });

  test('readFragment() no argument ', () => {
    expect(async () => {
      await readFragment();
    }).rejects.toThrow();
  });

  test('readFragmentData() no argument ', () => {
    expect(async () => {
      await readFragmentData();
    }).rejects.toThrow();
  });
});
