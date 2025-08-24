import { TeamMember, Skill, TeamMemberConnection } from '../../types/collaboration';

export interface ExpertiseQuery {
  skills: string[];
  description?: string;
  urgency: 'low' | 'medium' | 'high';
  projectContext?: string;
}

export interface ExpertiseMatch {
  member: TeamMember;
  score: number;
  matchedSkills: string[];
  reasoning: string;
  availability: boolean;
}

export class ExpertiseMatchingService {
  private skillEmbeddings: Map<string, number[]> = new Map();
  private memberEmbeddings: Map<string, number[]> = new Map();

  constructor() {
    this.initializeSkillEmbeddings();
  }

  /**
   * Initialize skill embeddings with pre-computed vectors
   * In a real implementation, these would be generated using a proper embedding model
   */
  private initializeSkillEmbeddings(): void {
    const skillVectors: Record<string, number[]> = {
      'javascript': [0.8, 0.2, 0.9, 0.1, 0.7, 0.3, 0.8, 0.4],
      'typescript': [0.9, 0.3, 0.8, 0.2, 0.8, 0.4, 0.9, 0.3],
      'react': [0.7, 0.8, 0.6, 0.9, 0.5, 0.7, 0.8, 0.6],
      'node.js': [0.6, 0.4, 0.8, 0.3, 0.9, 0.2, 0.7, 0.5],
      'python': [0.5, 0.7, 0.4, 0.8, 0.6, 0.9, 0.3, 0.7],
      'machine learning': [0.3, 0.9, 0.2, 0.8, 0.4, 0.7, 0.5, 0.9],
      'data science': [0.4, 0.8, 0.3, 0.9, 0.5, 0.8, 0.4, 0.8],
      'ui/ux design': [0.9, 0.1, 0.8, 0.2, 0.7, 0.1, 0.9, 0.2],
      'backend development': [0.2, 0.6, 0.8, 0.4, 0.9, 0.3, 0.6, 0.7],
      'frontend development': [0.8, 0.3, 0.9, 0.2, 0.6, 0.4, 0.8, 0.3],
      'devops': [0.3, 0.5, 0.4, 0.7, 0.8, 0.6, 0.5, 0.8],
      'database design': [0.4, 0.7, 0.3, 0.8, 0.6, 0.9, 0.4, 0.7],
      'api development': [0.6, 0.5, 0.7, 0.4, 0.8, 0.3, 0.7, 0.5],
      'testing': [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.4],
      'project management': [0.2, 0.3, 0.1, 0.4, 0.3, 0.2, 0.4, 0.1],
      'agile': [0.3, 0.2, 0.4, 0.1, 0.5, 0.3, 0.2, 0.4]
    };

    Object.entries(skillVectors).forEach(([skill, vector]) => {
      this.skillEmbeddings.set(skill.toLowerCase(), vector);
    });
  }

  /**
   * Generate embedding vector for a team member based on their skills
   */
  private generateMemberEmbedding(member: TeamMember): number[] {
    const embedding = new Array(8).fill(0);
    let totalWeight = 0;

    member.skills.forEach(skill => {
      const skillEmbedding = this.skillEmbeddings.get(skill.name.toLowerCase());
      if (skillEmbedding) {
        const weight = skill.level / 10; // Normalize skill level
        for (let i = 0; i < embedding.length; i++) {
          embedding[i] += skillEmbedding[i] * weight;
        }
        totalWeight += weight;
      }
    });

    // Normalize the embedding
    if (totalWeight > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= totalWeight;
      }
    }

    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Generate query embedding from skill requirements
   */
  private generateQueryEmbedding(query: ExpertiseQuery): number[] {
    const embedding = new Array(8).fill(0);
    let count = 0;

    query.skills.forEach(skill => {
      const skillEmbedding = this.skillEmbeddings.get(skill.toLowerCase());
      if (skillEmbedding) {
        for (let i = 0; i < embedding.length; i++) {
          embedding[i] += skillEmbedding[i];
        }
        count++;
      }
    });

    // Normalize
    if (count > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= count;
      }
    }

    return embedding;
  }

  /**
   * Find team members with matching expertise
   */
  findExpertise(query: ExpertiseQuery, teamMembers: TeamMember[]): ExpertiseMatch[] {
    const queryEmbedding = this.generateQueryEmbedding(query);
    const matches: ExpertiseMatch[] = [];

    teamMembers.forEach(member => {
      // Generate or retrieve member embedding
      let memberEmbedding = this.memberEmbeddings.get(member.id);
      if (!memberEmbedding) {
        memberEmbedding = this.generateMemberEmbedding(member);
        this.memberEmbeddings.set(member.id, memberEmbedding);
      }

      // Calculate similarity score
      const similarityScore = this.cosineSimilarity(queryEmbedding, memberEmbedding);

      // Find exact skill matches
      const matchedSkills = query.skills.filter(querySkill =>
        member.skills.some(memberSkill => 
          memberSkill.name.toLowerCase().includes(querySkill.toLowerCase()) ||
          querySkill.toLowerCase().includes(memberSkill.name.toLowerCase())
        )
      );

      // Calculate availability bonus
      const availabilityBonus = member.availability === 'available' ? 0.2 : 
                               member.availability === 'busy' ? -0.1 : -0.3;

      // Calculate urgency factor
      const urgencyFactor = query.urgency === 'high' ? 1.2 : 
                           query.urgency === 'medium' ? 1.0 : 0.8;

      // Final score calculation
      let finalScore = (similarityScore + availabilityBonus) * urgencyFactor;

      // Boost score for exact skill matches
      finalScore += matchedSkills.length * 0.1;

      // Generate reasoning
      const reasoning = this.generateReasoning(member, matchedSkills, similarityScore, query);

      matches.push({
        member,
        score: Math.max(0, Math.min(1, finalScore)), // Clamp between 0 and 1
        matchedSkills,
        reasoning,
        availability: member.availability === 'available'
      });
    });

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  private generateReasoning(
    member: TeamMember, 
    matchedSkills: string[], 
    similarityScore: number, 
    query: ExpertiseQuery
  ): string {
    const reasons: string[] = [];

    if (matchedSkills.length > 0) {
      reasons.push(`Direct expertise in: ${matchedSkills.join(', ')}`);
    }

    if (similarityScore > 0.7) {
      reasons.push('High skill similarity to requirements');
    } else if (similarityScore > 0.5) {
      reasons.push('Moderate skill alignment');
    }

    if (member.availability === 'available') {
      reasons.push('Currently available');
    } else if (member.availability === 'busy') {
      reasons.push('Busy but potentially reachable');
    }

    // Check for related skills
    const relatedSkills = this.findRelatedSkills(query.skills, member.skills);
    if (relatedSkills.length > 0) {
      reasons.push(`Related expertise: ${relatedSkills.join(', ')}`);
    }

    return reasons.length > 0 ? reasons.join('; ') : 'General skill match';
  }

  private findRelatedSkills(querySkills: string[], memberSkills: Skill[]): string[] {
    const related: string[] = [];
    const skillRelations: Record<string, string[]> = {
      'javascript': ['typescript', 'react', 'node.js'],
      'typescript': ['javascript', 'react', 'node.js'],
      'react': ['javascript', 'typescript', 'frontend development'],
      'python': ['machine learning', 'data science', 'backend development'],
      'machine learning': ['python', 'data science'],
      'ui/ux design': ['frontend development', 'react'],
      'backend development': ['node.js', 'python', 'api development'],
      'frontend development': ['react', 'javascript', 'ui/ux design']
    };

    querySkills.forEach(querySkill => {
      const relatedSkillNames = skillRelations[querySkill.toLowerCase()] || [];
      memberSkills.forEach(memberSkill => {
        if (relatedSkillNames.includes(memberSkill.name.toLowerCase()) && 
            !related.includes(memberSkill.name)) {
          related.push(memberSkill.name);
        }
      });
    });

    return related;
  }

  /**
   * Suggest team member connections based on complementary skills
   */
  suggestConnections(teamMembers: TeamMember[]): TeamMemberConnection[] {
    const connections: TeamMemberConnection[] = [];

    for (let i = 0; i < teamMembers.length; i++) {
      for (let j = i + 1; j < teamMembers.length; j++) {
        const member1 = teamMembers[i];
        const member2 = teamMembers[j];

        const connection = this.analyzeConnection(member1, member2);
        if (connection.confidence > 0.6) {
          connections.push(connection);
        }
      }
    }

    return connections.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeConnection(member1: TeamMember, member2: TeamMember): TeamMemberConnection {
    const member1Skills = new Set(member1.skills.map(s => s.name.toLowerCase()));
    const member2Skills = new Set(member2.skills.map(s => s.name.toLowerCase()));

    // Find complementary skills
    const complementaryPairs: Record<string, string[]> = {
      'frontend development': ['backend development', 'ui/ux design'],
      'backend development': ['frontend development', 'devops'],
      'ui/ux design': ['frontend development', 'react'],
      'data science': ['machine learning', 'python'],
      'devops': ['backend development', 'database design'],
      'project management': ['agile', 'testing']
    };

    let complementaryScore = 0;
    let reason = '';

    member1Skills.forEach(skill1 => {
      const complementary = complementaryPairs[skill1] || [];
      complementary.forEach(compSkill => {
        if (member2Skills.has(compSkill)) {
          complementaryScore += 0.3;
          reason = `${member1.name} has ${skill1} expertise, ${member2.name} has ${compSkill} skills`;
        }
      });
    });

    // Check for skill gaps that could be filled
    const allSkills = new Set([...member1Skills, ...member2Skills]);
    const skillGapBonus = allSkills.size > (member1Skills.size + member2Skills.size) * 0.7 ? 0.2 : 0;

    const confidence = Math.min(1, complementaryScore + skillGapBonus);
    const potentialBenefit = confidence > 0.8 ? 'High collaboration potential' :
                            confidence > 0.6 ? 'Good skill complementarity' :
                            'Some shared interests';

    return {
      member1: member1.id,
      member2: member2.id,
      reason: reason || 'Complementary skill sets',
      confidence,
      potentialBenefit
    };
  }

  /**
   * Update member embedding when skills change
   */
  updateMemberEmbedding(member: TeamMember): void {
    const embedding = this.generateMemberEmbedding(member);
    this.memberEmbeddings.set(member.id, embedding);
  }

  /**
   * Get skill recommendations for a team member
   */
  getSkillRecommendations(member: TeamMember, teamMembers: TeamMember[]): string[] {
    const memberSkills = new Set(member.skills.map(s => s.name.toLowerCase()));
    const teamSkills = new Map<string, number>();

    // Count skill frequency in team
    teamMembers.forEach(tm => {
      tm.skills.forEach(skill => {
        const skillName = skill.name.toLowerCase();
        teamSkills.set(skillName, (teamSkills.get(skillName) || 0) + 1);
      });
    });

    // Find skills that are common in team but missing for this member
    const recommendations: string[] = [];
    teamSkills.forEach((count, skill) => {
      if (!memberSkills.has(skill) && count >= 2) {
        recommendations.push(skill);
      }
    });

    return recommendations.slice(0, 5); // Top 5 recommendations
  }
}