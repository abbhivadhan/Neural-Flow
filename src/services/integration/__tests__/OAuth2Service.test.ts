import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuth2Service } from '../OAuth2Service';
import { OAuth2Config } from '../../../types/integration';

// Mock fetch
global.fetch = vi.fn();

describe('OAuth2Service', () => {
  let oauth2Service: OAuth2Service;
  let mockConfig: OAuth2Config;

  beforeEach(() => {
    oauth2Service = new OAuth2Service();
    
    mockConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorizationUrl: 'https://example.com/oauth/authorize',
      tokenUrl: 'https://example.com/oauth/token',
      redirectUri: 'https://app.example.com/callback',
      scopes: ['read', 'write'],
    };

    oauth2Service.registerProvider('test-provider', mockConfig);
    
    // Reset fetch mock
    vi.mocked(fetch).mockReset();
  });

  describe('generateAuthUrl', () => {
    it('should generate correct authorization URL', () => {
      const authUrl = oauth2Service.generateAuthUrl('test-provider');
      
     