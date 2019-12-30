import { Inbox } from './Inbox';
describe('/diag/json', () => {
  it('should be carl', () => {
    const inbox = new Inbox('carl');
    expect(inbox.sayMyName()).toBe('carl');
  });
});
