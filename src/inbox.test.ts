import { Inbox } from './Inbox';
describe("/diag/json", () => {
    it('should be carl', () => {
        let inbox = new Inbox('carl');
      expect(inbox.sayMyName()).toBe('carl');
    });

});