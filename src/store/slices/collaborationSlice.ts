import { StateCreator } from 'zustand';

export interface CollaboratorPresence {
  userId: string;
  username: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  lastSeen: Date;
  isActive: boolean;
}

export interface CollaborationOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: Date;
  applied: boolean;
}

export interface SharedDocument {
  id: string;
  title: string;
  content: string;
  version: number;
  lastModified: Date;
  collaborators: string[];
  permissions: Record<string, 'read' | 'write' | 'admin'>;
}

export interface CollaborationState {
  isConnected: boolean;
  currentRoom: string | null;
  collaborators: CollaboratorPresence[];
  pendingOperations: CollaborationOperation[];
  sharedDocuments: SharedDocument[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastSync: Date | null;
}

export interface CollaborationActions {
  connect: (roomId: string) => void;
  disconnect: () => void;
  updatePresence: (presence: Partial<CollaboratorPresence>) => void;
  addCollaborator: (collaborator: CollaboratorPresence) => void;
  removeCollaborator: (userId: string) => void;
  addOperation: (operation: Omit<CollaborationOperation, 'id' | 'timestamp' | 'applied'>) => void;
  applyOperation: (operationId: string) => void;
  updateDocument: (documentId: string, updates: Partial<SharedDocument>) => void;
  setConnectionStatus: (status: CollaborationState['connectionStatus']) => void;
  optimisticUpdate: (documentId: string, operation: CollaborationOperation) => void;
  revertOptimisticUpdate: (operationId: string) => void;
}

export interface CollaborationSlice {
  collaboration: CollaborationState;
  connect: CollaborationActions['connect'];
  disconnect: CollaborationActions['disconnect'];
  updatePresence: CollaborationActions['updatePresence'];
  addCollaborator: CollaborationActions['addCollaborator'];
  removeCollaborator: CollaborationActions['removeCollaborator'];
  addOperation: CollaborationActions['addOperation'];
  applyOperation: CollaborationActions['applyOperation'];
  updateDocument: CollaborationActions['updateDocument'];
  setConnectionStatus: CollaborationActions['setConnectionStatus'];
  optimisticUpdate: CollaborationActions['optimisticUpdate'];
  revertOptimisticUpdate: CollaborationActions['revertOptimisticUpdate'];
}

export const collaborationSlice: StateCreator<
  CollaborationSlice,
  [['zustand/immer', never]],
  [],
  CollaborationSlice
> = (set, get) => ({
  collaboration: {
    isConnected: false,
    currentRoom: null,
    collaborators: [],
    pendingOperations: [],
    sharedDocuments: [],
    connectionStatus: 'disconnected',
    lastSync: null,
  },

  connect: (roomId) =>
    set((state) => {
      state.collaboration.currentRoom = roomId;
      state.collaboration.connectionStatus = 'connecting';
      
      // Simulate connection process
      setTimeout(() => {
        set((state) => {
          state.collaboration.isConnected = true;
          state.collaboration.connectionStatus = 'connected';
          state.collaboration.lastSync = new Date();
        });
      }, 1000);
    }),

  disconnect: () =>
    set((state) => {
      state.collaboration.isConnected = false;
      state.collaboration.currentRoom = null;
      state.collaboration.collaborators = [];
      state.collaboration.connectionStatus = 'disconnected';
    }),

  updatePresence: (presence) =>
    set((state) => {
      const currentUserId = 'current-user'; // This would come from auth context
      const existingIndex = state.collaboration.collaborators.findIndex(
        c => c.userId === currentUserId
      );
      
      if (existingIndex !== -1) {
        state.collaboration.collaborators[existingIndex] = {
          ...state.collaboration.collaborators[existingIndex],
          ...presence,
          lastSeen: new Date(),
        };
      }
    }),

  addCollaborator: (collaborator) =>
    set((state) => {
      const existingIndex = state.collaboration.collaborators.findIndex(
        c => c.userId === collaborator.userId
      );
      
      if (existingIndex !== -1) {
        state.collaboration.collaborators[existingIndex] = collaborator;
      } else {
        state.collaboration.collaborators.push(collaborator);
      }
    }),

  removeCollaborator: (userId) =>
    set((state) => {
      state.collaboration.collaborators = state.collaboration.collaborators.filter(
        c => c.userId !== userId
      );
    }),

  addOperation: (operationData) =>
    set((state) => {
      const operation: CollaborationOperation = {
        ...operationData,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        applied: false,
      };
      
      state.collaboration.pendingOperations.push(operation);
    }),

  applyOperation: (operationId) =>
    set((state) => {
      const operationIndex = state.collaboration.pendingOperations.findIndex(
        op => op.id === operationId
      );
      
      if (operationIndex !== -1) {
        state.collaboration.pendingOperations[operationIndex].applied = true;
        
        // Remove applied operations after a delay
        setTimeout(() => {
          set((state) => {
            state.collaboration.pendingOperations = state.collaboration.pendingOperations.filter(
              op => op.id !== operationId
            );
          });
        }, 5000);
      }
    }),

  updateDocument: (documentId, updates) =>
    set((state) => {
      const documentIndex = state.collaboration.sharedDocuments.findIndex(
        doc => doc.id === documentId
      );
      
      if (documentIndex !== -1) {
        state.collaboration.sharedDocuments[documentIndex] = {
          ...state.collaboration.sharedDocuments[documentIndex],
          ...updates,
          lastModified: new Date(),
          version: state.collaboration.sharedDocuments[documentIndex].version + 1,
        };
      }
    }),

  setConnectionStatus: (status) =>
    set((state) => {
      state.collaboration.connectionStatus = status;
      state.collaboration.isConnected = status === 'connected';
    }),

  optimisticUpdate: (documentId, operation) =>
    set((state) => {
      // Apply the operation optimistically
      const documentIndex = state.collaboration.sharedDocuments.findIndex(
        doc => doc.id === documentId
      );
      
      if (documentIndex !== -1) {
        const document = state.collaboration.sharedDocuments[documentIndex];
        
        // Apply operation based on type
        switch (operation.type) {
          case 'insert':
            if (operation.content) {
              const newContent = 
                document.content.slice(0, operation.position) +
                operation.content +
                document.content.slice(operation.position);
              
              state.collaboration.sharedDocuments[documentIndex].content = newContent;
            }
            break;
            
          case 'delete':
            const deleteEnd = operation.position + (operation.content?.length || 1);
            const newContent = 
              document.content.slice(0, operation.position) +
              document.content.slice(deleteEnd);
            
            state.collaboration.sharedDocuments[documentIndex].content = newContent;
            break;
        }
        
        // Mark as pending
        state.collaboration.pendingOperations.push({
          ...operation,
          applied: false,
        });
      }
    }),

  revertOptimisticUpdate: (operationId) =>
    set((state) => {
      // Remove the operation from pending and revert changes
      state.collaboration.pendingOperations = state.collaboration.pendingOperations.filter(
        op => op.id !== operationId
      );
      
      // In a real implementation, you would revert the document changes
      // This is a simplified version
    }),
});