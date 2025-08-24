import { 
  Message, 
  MessageIntent, 
  TeamInsights, 
  CommunicationPattern, 
  ProductivityTrend,
  TeamMember 
} from '../../types/collaboration';

export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'neutral' | 'negative';
}

export interface CommunicationMetrics {
  totalMessages: number;
  averageResponseTime: number;
  sentimentTrend: number;
  collaborationScore: number;
  engagementLevel: number;
}

export class CommunicationAnalysisService {
  private sentimentKeywords: Map<string, number> = new Map();
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private stopWords: Set<string> = new Set();

  constructor() {
    this.initializeSentimentKeywords();
    this.initializeIntentPatterns();
    this.initializeStopWords();
  }

  private initializeSentimentKeywords(): void {
    const positiveWords = [
      'great', 'excellent', 'awesome', 'good', 'nice', 'perfect', 'amazing',
      'love', 'like', 'happy', 'excited', 'fantastic', 'wonderful', 'brilliant',
      'thanks', 'thank you', 'appreciate', 'helpful', 'useful', 'clear'
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated',
      'confused', 'difficult', 'hard', 'problem', 'issue', 'bug', 'error',
      'wrong', 'broken', 'failed', 'stuck', 'blocked', 'urgent'
    ];

    positiveWords.forEach(word => this.sentimentKeywords.set(word, 1));
    negativeWords.forEach(word => this.sentimentKeywords.set(word, -1));
  }

  private initializeIntentPatterns(): void {
    this.intentPatterns.set('question', [
      /\?$/,
      /^(what|how|when|where|why|who|which|can|could|would|should|is|are|do|does|did)/i,
      /(help|explain|clarify|understand)/i
    ]);

    this.intentPatterns.set('request', [
      /^(please|could you|can you|would you)/i,
      /(need|want|require|request)/i,
      /^(let's|let us)/i
    ]);

    this.intentPatterns.set('information', [
      /^(i think|i believe|i know|i found|i discovered)/i,
      /(here is|here's|this is|fyi|for your information)/i,
      /^(update|status|progress)/i
    ]);

    this.intentPatterns.set('decision', [
      /^(i decide|we should|let's go with|i choose)/i,
      /(approve|reject|accept|decline)/i,
      /(final|decided|conclusion)/i
    ]);

    this.intentPatterns.set('feedback', [
      /^(i like|i don't like|good|bad|excellent|terrible)/i,
      /(feedback|review|opinion|thoughts)/i,
      /(looks good|looks bad|needs work)/i
    ]);
  }

  private initializeStopWords(): void {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ];
    stopWords.forEach(word => this.stopWords.add(word));
  }

  /**
   * Analyze sentiment of a message
   */
  analyzeSentiment(message: string): SentimentAnalysis {
    const words = this.tokenize(message.toLowerCase());
    let sentimentScore = 0;
    let sentimentCount = 0;

    words.forEach(word => {
      const score = this.sentimentKeywords.get(word);
      if (score !== undefined) {
        sentimentScore += score;
        sentimentCount++;
      }
    });

    // Normalize score
    const normalizedScore = sentimentCount > 0 ? sentimentScore / sentimentCount : 0;
    const magnitude = Math.abs(normalizedScore);

    let label: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (normalizedScore > 0.1) label = 'positive';
    else if (normalizedScore < -0.1) label = 'negative';

    return {
      score: Math.max(-1, Math.min(1, normalizedScore)),
      magnitude: Math.min(1, magnitude),
      label
    };
  }

  /**
   * Detect message intent using pattern matching
   */
  detectIntent(message: string): MessageIntent {
    const content = message.toLowerCase();
    let bestMatch: string = 'information';
    let maxMatches = 0;

    this.intentPatterns.forEach((patterns, intent) => {
      let matches = 0;
      patterns.forEach(pattern => {
        if (pattern.test(content)) matches++;
      });
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = intent;
      }
    });

    // Extract entities (simple keyword extraction)
    const entities = this.extractEntities(message);
    
    // Extract potential action items
    const actionItems = this.extractActionItems(message);

    return {
      type: bestMatch as any,
      confidence: maxMatches > 0 ? Math.min(1, maxMatches * 0.3) : 0.1,
      entities,
      actionItems
    };
  }

  private extractEntities(message: string): string[] {
    const entities: string[] = [];
    const words = this.tokenize(message);

    // Simple entity extraction - look for capitalized words and technical terms
    const technicalTerms = [
      'api', 'database', 'frontend', 'backend', 'ui', 'ux', 'bug', 'feature',
      'deployment', 'testing', 'code', 'review', 'merge', 'branch', 'commit'
    ];

    words.forEach(word => {
      // Capitalized words (potential names/places)
      if (word.length > 2 && word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) {
        entities.push(word);
      }
      
      // Technical terms
      if (technicalTerms.includes(word.toLowerCase())) {
        entities.push(word.toLowerCase());
      }
    });

    return [...new Set(entities)]; // Remove duplicates
  }

  private extractActionItems(message: string): string[] {
    const actionItems: string[] = [];
    const actionPatterns = [
      /need to (.+?)(?:\.|$)/gi,
      /should (.+?)(?:\.|$)/gi,
      /will (.+?)(?:\.|$)/gi,
      /todo:?\s*(.+?)(?:\.|$)/gi,
      /action:?\s*(.+?)(?:\.|$)/gi
    ];

    actionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        actionItems.push(match[1].trim());
      }
    });

    return actionItems;
  }

  /**
   * Analyze team communication patterns
   */
  analyzeTeamCommunication(messages: Message[], teamMembers: TeamMember[]): TeamInsights {
    const communicationPatterns = this.identifyCommunicationPatterns(messages);
    const collaborationEfficiency = this.calculateCollaborationEfficiency(messages, teamMembers);
    const expertiseGaps = this.identifyExpertiseGaps(messages, teamMembers);
    const productivityTrends = this.calculateProductivityTrends(messages);

    return {
      communicationPatterns,
      collaborationEfficiency,
      expertiseGaps,
      recommendedConnections: [], // Would be populated by ExpertiseMatchingService
      productivityTrends
    };
  }

  private identifyCommunicationPatterns(messages: Message[]): CommunicationPattern[] {
    const patterns: CommunicationPattern[] = [];
    const userInteractions = new Map<string, Map<string, number>>();
    const timePatterns = new Map<string, number>();

    // Analyze user interactions
    messages.forEach(message => {
      if (!userInteractions.has(message.senderId)) {
        userInteractions.set(message.senderId, new Map());
      }

      // Track response patterns (simplified)
      const hour = message.timestamp.getHours();
      const timeKey = `${hour}:00-${hour + 1}:00`;
      timePatterns.set(timeKey, (timePatterns.get(timeKey) || 0) + 1);
    });

    // Convert to patterns
    timePatterns.forEach((frequency, timeRange) => {
      if (frequency > 5) { // Threshold for significant pattern
        patterns.push({
          pattern: `High activity during ${timeRange}`,
          frequency,
          participants: [], // Would need more complex analysis
          effectiveness: this.calculatePatternEffectiveness(messages, timeRange)
        });
      }
    });

    return patterns;
  }

  private calculatePatternEffectiveness(messages: Message[], timeRange: string): number {
    // Simplified effectiveness calculation based on response times and sentiment
    const relevantMessages = messages.filter(m => {
      const hour = m.timestamp.getHours();
      return timeRange.includes(hour.toString());
    });

    if (relevantMessages.length === 0) return 0;

    let totalSentiment = 0;
    relevantMessages.forEach(message => {
      const sentiment = this.analyzeSentiment(message.content);
      totalSentiment += sentiment.score;
    });

    return Math.max(0, Math.min(1, (totalSentiment / relevantMessages.length + 1) / 2));
  }

  private calculateCollaborationEfficiency(messages: Message[], teamMembers: TeamMember[]): number {
    if (messages.length === 0) return 0;

    // Calculate based on response times, message quality, and participation
    const responseTimeScore = this.calculateResponseTimeScore(messages);
    const participationScore = this.calculateParticipationScore(messages, teamMembers);
    const qualityScore = this.calculateMessageQualityScore(messages);

    return (responseTimeScore + participationScore + qualityScore) / 3;
  }

  private calculateResponseTimeScore(messages: Message[]): number {
    const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < sortedMessages.length; i++) {
      const current = sortedMessages[i];
      const previous = sortedMessages[i - 1];
      
      if (current.senderId !== previous.senderId) {
        const responseTime = current.timestamp.getTime() - previous.timestamp.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    if (responseCount === 0) return 0.5;

    const avgResponseTime = totalResponseTime / responseCount;
    const hours = avgResponseTime / (1000 * 60 * 60);

    // Score based on response time (better score for faster responses)
    if (hours < 1) return 1.0;
    if (hours < 4) return 0.8;
    if (hours < 24) return 0.6;
    if (hours < 72) return 0.4;
    return 0.2;
  }

  private calculateParticipationScore(messages: Message[], teamMembers: TeamMember[]): number {
    const participantCounts = new Map<string, number>();
    
    messages.forEach(message => {
      participantCounts.set(message.senderId, (participantCounts.get(message.senderId) || 0) + 1);
    });

    const activeParticipants = participantCounts.size;
    const totalMembers = teamMembers.length;

    if (totalMembers === 0) return 0;

    const participationRate = activeParticipants / totalMembers;
    
    // Calculate distribution evenness (Gini coefficient approximation)
    const messageCounts = Array.from(participantCounts.values()).sort((a, b) => a - b);
    let gini = 0;
    const n = messageCounts.length;
    
    if (n > 1) {
      for (let i = 0; i < n; i++) {
        gini += (2 * (i + 1) - n - 1) * messageCounts[i];
      }
      gini = gini / (n * messageCounts.reduce((a, b) => a + b, 0));
    }

    const evenness = 1 - Math.abs(gini);
    
    return (participationRate + evenness) / 2;
  }

  private calculateMessageQualityScore(messages: Message[]): number {
    let totalQuality = 0;

    messages.forEach(message => {
      const sentiment = this.analyzeSentiment(message.content);
      const intent = this.detectIntent(message.content);
      
      let quality = 0.5; // Base quality
      
      // Positive sentiment bonus
      if (sentiment.label === 'positive') quality += 0.2;
      else if (sentiment.label === 'negative') quality -= 0.1;
      
      // Clear intent bonus
      if (intent.confidence > 0.7) quality += 0.2;
      
      // Action items bonus
      if (intent.actionItems && intent.actionItems.length > 0) quality += 0.1;
      
      // Length consideration (not too short, not too long)
      const wordCount = this.tokenize(message.content).length;
      if (wordCount >= 5 && wordCount <= 100) quality += 0.1;
      
      totalQuality += Math.max(0, Math.min(1, quality));
    });

    return messages.length > 0 ? totalQuality / messages.length : 0;
  }

  private identifyExpertiseGaps(messages: Message[], teamMembers: TeamMember[]): string[] {
    const mentionedSkills = new Set<string>();
    const teamSkills = new Set<string>();

    // Extract skills mentioned in messages
    messages.forEach(message => {
      const entities = this.extractEntities(message.content);
      entities.forEach(entity => {
        if (this.isTechnicalSkill(entity)) {
          mentionedSkills.add(entity.toLowerCase());
        }
      });
    });

    // Get team skills
    teamMembers.forEach(member => {
      member.skills.forEach(skill => {
        teamSkills.add(skill.name.toLowerCase());
      });
    });

    // Find gaps
    const gaps: string[] = [];
    mentionedSkills.forEach(skill => {
      if (!teamSkills.has(skill)) {
        gaps.push(skill);
      }
    });

    return gaps;
  }

  private isTechnicalSkill(term: string): boolean {
    const technicalTerms = [
      'javascript', 'typescript', 'react', 'node', 'python', 'java', 'c++',
      'database', 'sql', 'api', 'frontend', 'backend', 'devops', 'testing',
      'machine learning', 'ai', 'data science', 'ui', 'ux', 'design'
    ];
    
    return technicalTerms.some(tech => 
      term.toLowerCase().includes(tech) || tech.includes(term.toLowerCase())
    );
  }

  private calculateProductivityTrends(messages: Message[]): ProductivityTrend[] {
    const trends: ProductivityTrend[] = [];
    
    // Analyze message volume trend
    const dailyMessageCounts = this.groupMessagesByDay(messages);
    const volumeTrend = this.calculateTrend(Array.from(dailyMessageCounts.values()));
    
    trends.push({
      metric: 'Communication Volume',
      trend: volumeTrend > 0.1 ? 'increasing' : volumeTrend < -0.1 ? 'decreasing' : 'stable',
      value: volumeTrend,
      timeframe: 'daily'
    });

    // Analyze sentiment trend
    const dailySentiment = new Map<string, number[]>();
    messages.forEach(message => {
      const day = message.timestamp.toDateString();
      const sentiment = this.analyzeSentiment(message.content);
      
      if (!dailySentiment.has(day)) {
        dailySentiment.set(day, []);
      }
      dailySentiment.get(day)!.push(sentiment.score);
    });

    const avgDailySentiment = Array.from(dailySentiment.values()).map(scores => 
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
    
    const sentimentTrend = this.calculateTrend(avgDailySentiment);
    
    trends.push({
      metric: 'Team Sentiment',
      trend: sentimentTrend > 0.05 ? 'increasing' : sentimentTrend < -0.05 ? 'decreasing' : 'stable',
      value: sentimentTrend,
      timeframe: 'daily'
    });

    return trends;
  }

  private groupMessagesByDay(messages: Message[]): Map<string, number> {
    const dailyCounts = new Map<string, number>();
    
    messages.forEach(message => {
      const day = message.timestamp.toDateString();
      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
    });

    return dailyCounts;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0 && !this.stopWords.has(word));
  }

  /**
   * Get communication metrics for a team
   */
  getCommunicationMetrics(messages: Message[], teamMembers: TeamMember[]): CommunicationMetrics {
    const totalMessages = messages.length;
    const averageResponseTime = this.calculateAverageResponseTime(messages);
    const sentimentTrend = this.calculateOverallSentimentTrend(messages);
    const collaborationScore = this.calculateCollaborationEfficiency(messages, teamMembers);
    const engagementLevel = this.calculateEngagementLevel(messages, teamMembers);

    return {
      totalMessages,
      averageResponseTime,
      sentimentTrend,
      collaborationScore,
      engagementLevel
    };
  }

  private calculateAverageResponseTime(messages: Message[]): number {
    const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let totalTime = 0;
    let count = 0;

    for (let i = 1; i < sortedMessages.length; i++) {
      if (sortedMessages[i].senderId !== sortedMessages[i - 1].senderId) {
        totalTime += sortedMessages[i].timestamp.getTime() - sortedMessages[i - 1].timestamp.getTime();
        count++;
      }
    }

    return count > 0 ? totalTime / count / (1000 * 60) : 0; // Return in minutes
  }

  private calculateOverallSentimentTrend(messages: Message[]): number {
    const sentiments = messages.map(m => this.analyzeSentiment(m.content).score);
    return this.calculateTrend(sentiments);
  }

  private calculateEngagementLevel(messages: Message[], teamMembers: TeamMember[]): number {
    const participantCounts = new Map<string, number>();
    
    messages.forEach(message => {
      participantCounts.set(message.senderId, (participantCounts.get(message.senderId) || 0) + 1);
    });

    const activeParticipants = participantCounts.size;
    const totalMembers = teamMembers.length;

    if (totalMembers === 0) return 0;

    const participationRate = activeParticipants / totalMembers;
    const avgMessagesPerParticipant = messages.length / Math.max(1, activeParticipants);

    // Normalize engagement (more messages per participant = higher engagement)
    const messageEngagement = Math.min(1, avgMessagesPerParticipant / 10);

    return (participationRate + messageEngagement) / 2;
  }
}