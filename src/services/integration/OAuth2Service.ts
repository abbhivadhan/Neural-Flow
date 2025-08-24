import { OAuth2Config, OAuth2Token } from '../../types/integration';

export class OAuth2Service {
  private tokens: Map<string, OAuth2Token> = new Map();
  private configs: Map<string, OAuth2Config> = new Map();

  /**
   * Register OAuth2 configuration for a provider
   */
  registerProvider(providerId: string, config: OAuth2Config): void {
    this.configs.set(providerId, config);
  }

  /**
   * Generate authorization URL for OAuth2 flow
   */
  generateAuthUrl(providerId: string, state?: string): string {
    const config = this.configs.get(providerId);
    if (!config) {
      throw new Error(`OAuth2 config not found for provider: ${providerId}`);
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state: state || config.state || this.generateState(),
    });

    // Add PKCE parameters if configured
    if (config.codeChallenge) {
      params.append('code_challenge', config.codeChallenge);
      params.append('code_challenge_method', config.codeChallengeMethod || 'S256');
    }

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    providerId: string, 
    code: string, 
    _state?: string,
    codeVerifier?: string
  ): Promise<OAuth2Token> {
    const config = this.configs.get(providerId);
    if (!config) {
      throw new Error(`OAuth2 config not found for provider: ${providerId}`);
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    });

    // Add PKCE code verifier if provided
    if (codeVerifier) {
      body.append('code_verifier', codeVerifier);
    }

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
      }

      const tokenData = await response.json();
      const token: OAuth2Token = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope || config.scopes.join(' '),
        issuedAt: new Date(),
      };

      // Store token
      this.tokens.set(providerId, token);

      return token;
    } catch (error) {
      console.error(`OAuth2 token exchange failed for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(providerId: string): Promise<OAuth2Token> {
    const config = this.configs.get(providerId);
    const currentToken = this.tokens.get(providerId);

    if (!config || !currentToken?.refreshToken) {
      throw new Error(`Cannot refresh token for provider: ${providerId}`);
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: currentToken.refreshToken,
    });

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${errorData.error_description || response.statusText}`);
      }

      const tokenData = await response.json();
      const newToken: OAuth2Token = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || currentToken.refreshToken,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope || currentToken.scope,
        issuedAt: new Date(),
      };

      // Update stored token
      this.tokens.set(providerId, newToken);

      return newToken;
    } catch (error) {
      console.error(`OAuth2 token refresh failed for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidToken(providerId: string): Promise<string> {
    const token = this.tokens.get(providerId);
    if (!token) {
      throw new Error(`No token found for provider: ${providerId}`);
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      if (token.refreshToken) {
        const refreshedToken = await this.refreshToken(providerId);
        return refreshedToken.accessToken;
      } else {
        throw new Error(`Token expired and no refresh token available for provider: ${providerId}`);
      }
    }

    return token.accessToken;
  }

  /**
   * Revoke access token
   */
  async revokeToken(providerId: string): Promise<void> {
    const config = this.configs.get(providerId);
    const token = this.tokens.get(providerId);

    if (!config || !token) {
      return;
    }

    // Try to revoke token on the provider's end
    try {
      const revokeUrl = config.authorizationUrl.replace('/authorize', '/revoke');
      await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: token.accessToken,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }).toString(),
      });
    } catch (error) {
      console.warn(`Failed to revoke token on provider side for ${providerId}:`, error);
    }

    // Remove token from local storage
    this.tokens.delete(providerId);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: OAuth2Token): boolean {
    const expirationTime = new Date(token.issuedAt.getTime() + (token.expiresIn * 1000));
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return new Date().getTime() > (expirationTime.getTime() - bufferTime);
  }

  /**
   * Get stored token for a provider
   */
  getToken(providerId: string): OAuth2Token | undefined {
    return this.tokens.get(providerId);
  }

  /**
   * Store token manually (for testing or manual token input)
   */
  storeToken(providerId: string, token: OAuth2Token): void {
    this.tokens.set(providerId, token);
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Generate PKCE code challenge
   */
  async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  /**
   * Generate random state parameter
   */
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Base64 URL encode
   */
  private base64URLEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Initialize popular productivity app configurations
   */
  initializePopularProviders(): void {
    // Google Workspace
    this.registerProvider('google', {
      clientId: process.env['VITE_GOOGLE_CLIENT_ID'] || '',
      clientSecret: process.env['VITE_GOOGLE_CLIENT_SECRET'] || '',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      redirectUri: `${window.location.origin}/auth/callback/google`,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
    });

    // Microsoft 365
    this.registerProvider('microsoft', {
      clientId: process.env['VITE_MICROSOFT_CLIENT_ID'] || '',
      clientSecret: process.env['VITE_MICROSOFT_CLIENT_SECRET'] || '',
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      redirectUri: `${window.location.origin}/auth/callback/microsoft`,
      scopes: [
        'https://graph.microsoft.com/Files.ReadWrite',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Mail.Read',
      ],
    });

    // Slack
    this.registerProvider('slack', {
      clientId: process.env['VITE_SLACK_CLIENT_ID'] || '',
      clientSecret: process.env['VITE_SLACK_CLIENT_SECRET'] || '',
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      redirectUri: `${window.location.origin}/auth/callback/slack`,
      scopes: ['channels:read', 'chat:write', 'files:read', 'users:read'],
    });

    // Notion
    this.registerProvider('notion', {
      clientId: process.env['VITE_NOTION_CLIENT_ID'] || '',
      clientSecret: process.env['VITE_NOTION_CLIENT_SECRET'] || '',
      authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      redirectUri: `${window.location.origin}/auth/callback/notion`,
      scopes: ['read', 'update', 'insert'],
    });

    // Trello
    this.registerProvider('trello', {
      clientId: process.env['VITE_TRELLO_CLIENT_ID'] || '',
      clientSecret: process.env['VITE_TRELLO_CLIENT_SECRET'] || '',
      authorizationUrl: 'https://trello.com/1/authorize',
      tokenUrl: 'https://trello.com/1/OAuthGetAccessToken',
      redirectUri: `${window.location.origin}/auth/callback/trello`,
      scopes: ['read', 'write'],
    });
  }
}

export const oauth2Service = new OAuth2Service();