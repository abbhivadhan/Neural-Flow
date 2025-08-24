import { describe, it, expect, beforeEach } from 'vitest';
import { OperationalTransform } from '../OperationalTransform';
import { Operation } from '../../../types/collaboration';

describe('OperationalTransform', () => {
  let ot: OperationalTransform;

  beforeEach(() => {
    ot = new OperationalTransform();
  });

  describe('Insert-Insert Transformation', () => {
    it('should transform concurrent inserts correctly when op1 comes before op2', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 10,
        content: 'World',
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const result = ot.transform(op1, op2);

      expect(result.op1Prime).toEqual(op1); // op1 unchanged
      expect(result.op2Prime.position).toBe(15); // op2 position adjusted by op1 length
    });

    it('should transform concurrent inserts correctly when op2 comes before op1', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 10,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 5,
        content: 'World',
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const result = ot.transform(op1, op2);

      expect(result.op1Prime.position).toBe(15); // op1 position adjusted by op2 length
      expect(result.op2Prime).toEqual(op2); // op2 unchanged
    });

    it('should handle inserts at the same position', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'A',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 5,
        content: 'B',
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const result = ot.transform(op1, op2);

      expect(result.op1Prime).toEqual(op1); // First operation unchanged
      expect(result.op2Prime.position).toBe(6); // Second operation moved after first
    });
  });

  describe('Insert-Delete Transformation', () => {
    it('should transform insert before delete range', () => {
      const insertOp: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const deleteOp: Operation = {
        id: 'op2',
        type: 'delete',
        position: 10,
        length: 5,
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const result = ot.transform(insertOp, deleteOp);

      expect(result.op1Prime).toEqual(insertOp); // Insert unchanged
      expect(result.op2Prime.position).toBe(15); // Delete position adjusted
    });

    it('should transform insert after delete range', () => {
      const insertOp: Operation = {
        id: 'op1',
        type: 'insert',
        position: 20,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const deleteOp: Operation = {
        id: 'op2',
        type: 'delete',
        position: 10,
        length: 5,
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const result = ot.transform(insertOp, deleteOp);

      expect(result.op1Prime.position).toBe(15); // Insert position adjusted
      expect(result.op2Prime).toEqual(deleteOp); // Delete unchanged
    });

    it('should transform insert within delete range', () => {
      const insertOp: Operation = {
        id: 'op1',
        type: 'insert',
        position: 12,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const deleteOp: Operation = {
        id: 'op2',
        type: 'delete',
        position: 10,
        length: 5,
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const result = ot.transform(insertOp, deleteOp);

      expect(result.op1Prime.position).toBe(10); // Insert moved to delete start
      expect(result.op2Prime.length).toBe(10); // Delete length increased
    });
  });

  describe('Delete-Delete Transformation', () => {
    it('should transform non-overlapping deletes', () => {
      const delete1: Operation = {
        id: 'op1',
        type: 'delete',
        position: 5,
        length: 3,
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const delete2: Operation = {
        id: 'op2',
        type: 'delete',
        position: 15,
        length: 4,
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const result = ot.transform(delete1, delete2);

      expect(result.op1Prime).toEqual(delete1); // First delete unchanged
      expect(result.op2Prime.position).toBe(12); // Second delete position adjusted
    });

    it('should merge overlapping deletes', () => {
      const delete1: Operation = {
        id: 'op1',
        type: 'delete',
        position: 5,
        length: 5,
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const delete2: Operation = {
        id: 'op2',
        type: 'delete',
        position: 8,
        length: 4,
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const result = ot.transform(delete1, delete2);

      expect(result.op1Prime.position).toBe(5); // Merged delete starts at min position
      expect(result.op1Prime.length).toBe(7); // Merged delete covers full range
      expect(result.op2Prime.type).toBe('retain'); // Second operation becomes no-op
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts between concurrent operations', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 10,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(Date.now() - 50), // 50ms ago
        sessionId: 'session1'
      };

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 10,
        content: 'World',
        userId: 'user2',
        timestamp: new Date(), // Now
        sessionId: 'session1'
      };

      const results = ot.resolveConflicts([op1, op2]);

      expect(results).toHaveLength(2);
      expect(results[1].transformed).toBe(true); // Second operation was transformed
      expect(results[1].conflicts).toHaveLength(1); // Conflict detected
      expect(results[1].conflicts[0].type).toBe('concurrent_edit');
    });

    it('should detect deletion conflicts with high severity', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'delete',
        position: 10,
        length: 5,
        userId: 'user1',
        timestamp: new Date(Date.now() - 50),
        sessionId: 'session1'
      };

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 12,
        content: 'Hello',
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const results = ot.resolveConflicts([op1, op2]);

      expect(results[1].conflicts).toHaveLength(1);
      expect(results[1].conflicts[0].type).toBe('deletion_conflict');
      expect(results[1].conflicts[0].severity).toBe('high');
    });

    it('should not detect conflicts for operations from same user', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 10,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(Date.now() - 50),
        sessionId: 'session1'
      };

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 10,
        content: 'World',
        userId: 'user1', // Same user
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const results = ot.resolveConflicts([op1, op2]);

      expect(results[1].conflicts).toHaveLength(0); // No conflicts for same user
    });

    it('should not detect conflicts for operations with large time difference', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 10,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(Date.now() - 5000), // 5 seconds ago
        sessionId: 'session1'
      };

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 10,
        content: 'World',
        userId: 'user2',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const results = ot.resolveConflicts([op1, op2]);

      expect(results[1].conflicts).toHaveLength(0); // No conflicts due to time difference
    });
  });

  describe('Operation History', () => {
    it('should add operations to history', () => {
      const op: Operation = {
        id: 'op1',
        type: 'insert',
        position: 10,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      ot.addToHistory(op);
      const history = ot.getHistory();

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(op);
    });

    it('should limit history size', () => {
      // Add more than 1000 operations
      for (let i = 0; i < 1100; i++) {
        const op: Operation = {
          id: `op${i}`,
          type: 'insert',
          position: i,
          content: `content${i}`,
          userId: 'user1',
          timestamp: new Date(),
          sessionId: 'session1'
        };
        ot.addToHistory(op);
      }

      const history = ot.getHistory();
      expect(history.length).toBeLessThanOrEqual(600); // Should be trimmed when over 1000
    });

    it('should clear history', () => {
      const op: Operation = {
        id: 'op1',
        type: 'insert',
        position: 10,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      ot.addToHistory(op);
      expect(ot.getHistory()).toHaveLength(1);

      ot.clearHistory();
      expect(ot.getHistory()).toHaveLength(0);
    });
  });

  describe('Operation Composition', () => {
    it('should compose multiple insert operations', () => {
      const ops: Operation[] = [
        {
          id: 'op1',
          type: 'insert',
          position: 5,
          content: 'Hello',
          userId: 'user1',
          timestamp: new Date(),
          sessionId: 'session1'
        },
        {
          id: 'op2',
          type: 'insert',
          position: 10,
          content: ' World',
          userId: 'user1',
          timestamp: new Date(),
          sessionId: 'session1'
        }
      ];

      const composed = ot.composeOperations(ops);

      expect(composed).toBeTruthy();
      expect(composed?.type).toBe('insert');
      expect(composed?.content).toBe('Hello World');
    });

    it('should return null for empty operation list', () => {
      const composed = ot.composeOperations([]);
      expect(composed).toBeNull();
    });

    it('should return single operation unchanged', () => {
      const op: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        sessionId: 'session1'
      };

      const composed = ot.composeOperations([op]);
      expect(composed).toEqual(op);
    });
  });
});