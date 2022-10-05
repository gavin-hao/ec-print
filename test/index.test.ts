import Printer from '../src/index';
describe('test index ', () => {
  it('echo', () => {
    const printer = new Printer();
    expect(printer).toHaveProperty('connect');
  });
});
