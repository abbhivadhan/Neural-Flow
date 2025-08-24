import { Operation, OperationResult, Conflict, ConflictResolution } from '../../types/collaboration';

export class OperationalTransform {
  private operationHistory: Operation[] = [];
  private pendingOperations: Map<string, Operation> = new Map();

  /**
   * Transform an operation against another operation using operational transformation rules
   */
  transform(op1: Operation, op2: Operation): { op1Prime: Operation; op2Prime: Operation } {
    // Handle different operation type combinations
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      const result = this.transformInsertDelete(op2, op1);
      return { op1Prime: result.op2Prime, op2Prime: result.op1Prime };
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    } else if (op1.type === 'retain' || op2.type === 'retain') {
      return this.transformWithRetain(op1, op2);
    }

    // Default case - no transformation needed
    return { op1Prime: op1, op2Prime: op2 };
  }

  private transformInsertInsert(op1: Operation, op2: Operation): { op1Prime: Operation; op2Prime: Operation } {
    if (op1.position <= op2.position) {
      return {
        op1Prime: op1,
        op2Prime: { ...op2, position: op2.position + (op1.content?.length || 0) }
      };
    } else {
      return {
        op1Prime: { ...op1, position: op1.position + (op2.content?.length || 0) },
        op2Prime: op2
      };
    }
  }

  private transformInsertDelete(op1: Operation, op2: Operation): { op1Prime: Operation; op2Prime: Operation } {
    const insertPos = op1.position;
    const deleteStart = op2.position;
    const deleteEnd = deleteStart + (op2.length || 0);

    if (insertPos <= deleteStart) {
      // Insert before delete range
      return {
        op1Prime: op1,
        op2Prime: { ...op2, position: deleteStart + (op1.content?.length || 0) }
      };
    } else if (insertPos >= deleteEnd) {
      // Insert after delete range
      return {
        op1Prime: { ...op1, position: insertPos - (op2.length || 0) },
        op2Prime: op2
      };
    } else {
      // Insert within delete range - complex case
      return {
        op1Prime: { ...op1, position: deleteStart },
        op2Prime: { ...op2, length: (op2.length || 0) + (op1.content?.length || 0) }
      };
    }
  }

  private transformDeleteDelete(op1: Operation, op2: Operation): { op1Prime: Operation; op2Prime: Operation } {
    const delete1Start = op1.position;
    const delete1End = delete1Start + (op1.length || 0);
    const delete2Start = op2.position;
    const delete2End = delete2Start + (op2.length || 0);

    if (delete1End <= delete2Start) {
      // No overlap, delete1 before delete2
      return {
        op1Prime: op1,
        op2Prime: { ...op2, position: delete2Start - (op1.length || 0) }
      };
    } else if (delete2End <= delete1Start) {
      // No overlap, delete2 before delete1
      return {
        op1Prime: { ...op1, position: delete1Start - (op2.length || 0) },
        op2Prime: op2
      };
    } else {
      // Overlapping deletes - need to merge
      const newStart = Math.min(delete1Start, delete2Start);
      const newEnd = Math.max(delete1End, delete2End);
      const mergedLength = newEnd - newStart;

      return {
        op1Prime: { ...op1, position: newStart, length: mergedLength },
        op2Prime: { ...op2, type: 'retain', position: 0, length: 0 } // No-op
      };
    }
  }

  private transformWithRetain(op1: Operation, op2: Operation): { op1Prime: Operation; op2Prime: Operation } {
    // Retain operations don't change content, so minimal transformation needed
    if (op1.type === 'retain') {
      return { op1Prime: op1, op2Prime: op2 };
    } else {
      return { op1Prime: op1, op2Prime: op2 };
    }
  }

  /**
   * Apply operational transformation to resolve conflicts between concurrent operations
   */
  resolveConflicts(operations: Operation[]): OperationResult[] {
    const results: OperationResult[] = [];
    const conflicts: Conflict[] = [];

    // Sort operations by timestamp
    const sortedOps = [...operations].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 0; i < sortedOps.length; i++) {
      const currentOp = sortedOps[i];
      let transformedOp = currentOp;
      let hasConflicts = false;

      // Transform against all previous operations
      for (let j = 0; j < i; j++) {
        const prevOp = sortedOps[j];
        
        // Check if operations are concurrent (within 100ms)
        const timeDiff = Math.abs(currentOp.timestamp.getTime() - prevOp.timestamp.getTime());
        if (timeDiff < 100 && currentOp.userId !== prevOp.userId) {
          const transformResult = this.transform(transformedOp, prevOp);
          transformedOp = transformResult.op1Prime;
          hasConflicts = true;

          // Detect specific conflict types
          const conflict = this.detectConflict(currentOp, prevOp);
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }

      results.push({
        operation: transformedOp,
        transformed: hasConflicts,
        conflicts: conflicts.filter(c => c.operations.some(op => op.id === currentOp.id))
      });
    }

    return results;
  }

  private detectConflict(op1: Operation, op2: Operation): Conflict | null {
    const timeDiff = Math.abs(op1.timestamp.getTime() - op2.timestamp.getTime());
    
    if (timeDiff < 100 && op1.userId !== op2.userId) {
      // Determine conflict type
      let conflictType: 'concurrent_edit' | 'format_conflict' | 'deletion_conflict' = 'concurrent_edit';
      let severity: 'low' | 'medium' | 'high' = 'low';

      if (op1.type === 'delete' || op2.type === 'delete') {
        conflictType = 'deletion_conflict';
        severity = 'high';
      } else if (op1.attributes || op2.attributes) {
        conflictType = 'format_conflict';
        severity = 'medium';
      }

      // Check for overlapping positions
      const op1Range = { start: op1.position, end: op1.position + (op1.length || op1.content?.length || 0) };
      const op2Range = { start: op2.position, end: op2.position + (op2.length || op2.content?.length || 0) };

      if (this.rangesOverlap(op1Range, op2Range)) {
        severity = severity === 'low' ? 'medium' : 'high';
      }

      return {
        id: `conflict_${op1.id}_${op2.id}`,
        operations: [op1, op2],
        type: conflictType,
        severity,
        resolution: this.generateAutoResolution(op1, op2, conflictType)
      };
    }

    return null;
  }

  private rangesOverlap(range1: { start: number; end: number }, range2: { start: number; end: number }): boolean {
    return range1.start < range2.end && range2.start < range1.end;
  }

  private generateAutoResolution(op1: Operation, op2: Operation, conflictType: string): ConflictResolution {
    let strategy: 'merge' | 'override' | 'manual' | 'ai_resolve' = 'merge';
    let confidence = 0.7;

    switch (conflictType) {
      case 'concurrent_edit':
        if (op1.type === 'insert' && op2.type === 'insert') {
          strategy = 'merge';
          confidence = 0.9;
        } else {
          strategy = 'ai_resolve';
          confidence = 0.6;
        }
        break;
      case 'deletion_conflict':
        strategy = 'manual';
        confidence = 0.3;
        break;
      case 'format_conflict':
        strategy = 'override';
        confidence = 0.8;
        break;
    }

    return {
      strategy,
      confidence,
      chosenOperation: confidence > 0.8 ? (op1.timestamp > op2.timestamp ? op1 : op2) : undefined
    };
  }

  /**
   * Add operation to history for future transformations
   */
  addToHistory(operation: Operation): void {
    this.operationHistory.push(operation);
    
    // Keep history size manageable
    if (this.operationHistory.length > 1000) {
      this.operationHistory = this.operationHistory.slice(-500);
    }
  }

  /**
   * Get operation history for debugging or analysis
   */
  getHistory(): Operation[] {
    return [...this.operationHistory];
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.operationHistory = [];
    this.pendingOperations.clear();
  }

  /**
   * Compose multiple operations into a single operation for efficiency
   */
  composeOperations(operations: Operation[]): Operation | null {
    if (operations.length === 0) return null;
    if (operations.length === 1) return operations[0];

    // Simple composition for insert operations
    const insertOps = operations.filter(op => op.type === 'insert');
    if (insertOps.length === operations.length) {
      const sortedInserts = insertOps.sort((a, b) => a.position - b.position);
      let composedContent = '';
      let currentPos = sortedInserts[0].position;

      for (const op of sortedInserts) {
        composedContent += op.content || '';
      }

      return {
        ...sortedInserts[0],
        content: composedContent,
        id: `composed_${Date.now()}`
      };
    }

    // For complex compositions, return the first operation
    // In a real implementation, this would be more sophisticated
    return operations[0];
  }
}