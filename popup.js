const HRInternEvaluator = {
    // Scoring configuration
    scoringConfig: {
        linkedinActivity: {
            max: 25,
            indicators: {
                postsPerMonth: { threshold: 2, points: 10 },
                engagementLevel: { threshold: 'medium', points: 8 },
                hasAbout: { threshold: true, points: 7 }
            }
        },
        leadership: {
            max: 30,
            indicators: {
                leadershipRoles: { threshold: 1, points: 15 },
                founderOrCEO: { threshold: true, points: 15 },
                projectLead: { threshold: true, points: 10 }
            }
        },
        peopleSkills: {
            max: 30,
            indicators: {
                eventOrganization: { threshold: true, points: 12 },
                teamCoordination: { threshold: true, points: 10 },
                mentorship: { threshold: true, points: 8 }
            }
        },
        proactivity: {
            max: 15,
            indicators: {
                volunteerWork: { threshold: true, points: 8 },
                programInitiation: { threshold: true, points: 7 }
            }
        }
    },

    /**
     * Analyze scraped LinkedIn profile
     */
    analyzeProfile(profileData) {
        console.log('📊 Starting profile analysis...');

        const scores = {
            linkedinActivity: this.scoreLinkedInActivity(profileData),
            leadership: this.scoreLeadership(profileData),
            peopleSkills: this.scorePeopleSkills(profileData),
            proactivity: this.scoreProactivity(profileData)
        };

        const totalScore = Object.values(scores).reduce((sum, score) => sum + score.score, 0);
        const recommendation = totalScore >= 70 ? 'YES' : 'NO';
        const keyFindings = this.extractKeyFindings(profileData, scores);
        const reasoning = this.generateReasoning(profileData, scores, recommendation);

        return {
            scores,
            totalScore,
            recommendation,
            keyFindings,
            reasoning,
            profileName: profileData.personal.name
        };
    },

    /**
     * Score LinkedIn Activity & Engagement (25 points max)
     */
    scoreLinkedInActivity(profileData) {
        let score = 0;
        const indicators = [];

        const { activity, about } = profileData;

        // Post activity scoring
        if (activity.postCount > 0) {
            if (activity.postCount >= 10) {
                score += 10;
                indicators.push('Regular posting activity detected');
            } else if (activity.postCount >= 5) {
                score += 7;
                indicators.push('Moderate posting activity');
            } else {
                score += 3;
                indicators.push('Minimal posting activity');
            }
        }

        // Engagement scoring
        if (activity.engagementLevel === 'high') {
            score += 8;
            indicators.push('High engagement with community');
        } else if (activity.engagementLevel === 'medium') {
            score += 5;
            indicators.push('Moderate engagement');
        }

        // About section
        if (about.hasAbout) {
            score += 7;
            indicators.push('Comprehensive about section');
        }

        return {
            score: Math.min(score, 25),
            indicators,
            maxScore: 25
        };
    },

    /**
     * Score Leadership Experience (30 points max)
     */
    scoreLeadership(profileData) {
        let score = 0;
        const indicators = [];
        const { experience, organizations } = profileData;

        // Count leadership roles
        const leadershipRoles = experience.filter(exp => exp.isLeadership).length;

        if (leadershipRoles >= 3) {
            score += 15;
            indicators.push(`Multiple leadership roles detected (${leadershipRoles})`);
        } else if (leadershipRoles >= 1) {
            score += 10;
            indicators.push(`Leadership experience found (${leadershipRoles} role)`);
        }

        // Organization founding/leading
        if (organizations.hasLeadership) {
            score += 10;
            indicators.push('Evidence of organization/community leadership');
        }

        // Check for founder/CEO/President titles
        const hasFounderOrExecutive = experience.some(exp => {
            const title = exp.title.toLowerCase();
            return title.includes('founder') || title.includes('ceo') ||
                title.includes('president') || title.includes('director');
        });

        if (hasFounderOrExecutive) {
            score += 5;
            indicators.push('Executive or founder experience');
        }

        return {
            score: Math.min(score, 30),
            indicators,
            maxScore: 30
        };
    },

    /**
     * Score People & Communication Skills (30 points max)
     */
    scorePeopleSkills(profileData) {
        let score = 0;
        const indicators = [];
        const { experience, volunteering, recommendations, about } = profileData;

        // Event organization
        const hasEventOrganization = experience.some(exp => {
            const desc = (exp.title + ' ' + exp.description).toLowerCase();
            return desc.includes('event') || desc.includes('organize') ||
                desc.includes('coordinate') || desc.includes('plan');
        });

        if (hasEventOrganization) {
            score += 10;
            indicators.push('Event organization experience');
        }

        // Team coordination
        const hasTeamCoordination = experience.some(exp => {
            const desc = (exp.title + ' ' + exp.description).toLowerCase();
            return desc.includes('team') || desc.includes('lead') ||
                desc.includes('manage') || desc.includes('coordinate');
        });

        if (hasTeamCoordination) {
            score += 10;
            indicators.push('Team coordination experience');
        }

        // Mentorship/people management
        const hasMentorship = experience.some(exp => {
            const desc = (exp.title + ' ' + exp.description).toLowerCase();
            return desc.includes('mentor') || desc.includes('coach') ||
                desc.includes('guide') || desc.includes('lead people');
        });

        if (hasMentorship) {
            score += 8;
            indicators.push('Mentorship or people management');
        }

        // Recommendations (people endorsement)
        if (recommendations.count > 0) {
            score += 2;
            indicators.push(`${recommendations.count} recommendation(s) received`);
        }

        return {
            score: Math.min(score, 30),
            indicators,
            maxScore: 30
        };
    },

    /**
     * Score Proactivity & Initiative (15 points max)
     */
    scoreProactivity(profileData) {
        let score = 0;
        const indicators = [];
        const { volunteering, experience } = profileData;

        // Volunteer work
        if (volunteering.length > 0) {
            score += 8;
            indicators.push(`${volunteering.length} volunteer role(s) found`);
        }

        // Program/project initiation
        const hasInitiatives = experience.some(exp => {
            const desc = (exp.title + ' ' + exp.description).toLowerCase();
            return desc.includes('started') || desc.includes('initiated') ||
                desc.includes('founded') || desc.includes('launched') ||
                desc.includes('created') || desc.includes('built');
        });

        if (hasInitiatives) {
            score += 7;
            indicators.push('Evidence of program/project initiation');
        }

        return {
            score: Math.min(score, 15),
            indicators,
            maxScore: 15
        };
    },

    /**
     * Extract key findings
     */
    extractKeyFindings(profileData, scores) {
        const findings = [];
        const { experience, volunteering, skills, about } = profileData;

        // Find top indicators from highest scoring category
        const maxScore = Object.entries(scores).reduce((max, [_, score]) =>
            score.score > max.score ? score : max, { score: 0 }
        );

        maxScore.indicators?.forEach(indicator => {
            findings.push({
                text: indicator,
                icon: '✓'
            });
        });

        // Additional findings
        if (skills.length > 5) {
            findings.push({
                text: `${skills.length} relevant skills`,
                icon: '🎯'
            });
        }

        if (about.length > 200) {
            findings.push({
                text: 'Comprehensive professional profile',
                icon: '📝'
            });
        }

        return findings;
    },

    /**
     * Generate reasoning for recommendation
     */
    generateReasoning(profileData, scores, recommendation) {
        const { personal } = profileData;
        const totalScore = Object.values(scores).reduce((sum, s) => sum + s.score, 0);

        let reasoning = '';

        if (recommendation === 'YES') {
            reasoning = `${personal.name} demonstrates strong potential for an HR Intern role. `;

            const topScore = Object.entries(scores).reduce((top, [key, score]) =>
                score.score > top.score ? { key, ...score } : top, { score: 0 }
            );

            const scoreNames = {
                linkedinActivity: 'LinkedIn activity',
                leadership: 'leadership experience',
                peopleSkills: 'people skills',
                proactivity: 'proactivity'
            };

            reasoning += `Notable strength in ${scoreNames[topScore.key] || 'key areas'}. `;
            reasoning += 'Shows initiative, communication ability, and people-centric mindset.';
        } else {
            reasoning = `${personal.name} may need more development for this role. `;
            reasoning += `Current profile suggests gaps in leadership visibility or people engagement (Score: ${totalScore}/100). `;
            reasoning += 'Consider gaining more visible leadership roles or community engagement experience.';
        }

        return reasoning;
    }
};

// ============================================
// UI STATE MANAGEMENT
// ============================================

const UIManager = {
    states: {
        INITIAL: 'initial',
        LOADING: 'loading',
        RESULTS: 'results',
        ERROR: 'error'
    },

    currentState: 'initial',

    /**
     * Show loading state
     */
    showLoading() {
        this.setState('loading');
        document.getElementById('initialState').classList.add('hidden');
        document.getElementById('resultsContainer').classList.add('hidden');
        document.getElementById('errorState').classList.add('hidden');
        document.getElementById('loadingState').classList.remove('hidden');
    },

    /**
     * Show results
     */
    showResults(analysisResult) {
        this.setState('results');
        document.getElementById('initialState').classList.add('hidden');
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('errorState').classList.add('hidden');
        document.getElementById('resultsContainer').classList.remove('hidden');

        this.renderRecommendation(analysisResult);
        this.renderScoreBreakdown(analysisResult);
        this.renderKeyFindings(analysisResult);
        this.renderDetailedAnalysis(analysisResult);
    },

    /**
     * Render recommendation card
     */
    renderRecommendation(result) {
        const card = document.getElementById('recommendationCard');
        const icon = document.getElementById('recommendationIcon');
        const text = document.getElementById('recommendationText');
        const score = document.getElementById('recommendationScore');

        const isYes = result.recommendation === 'YES';

        card.classList.remove('yes', 'no');
        card.classList.add(isYes ? 'yes' : 'no');

        icon.textContent = isYes ? '✅' : '❌';
        text.innerHTML = `
      <h2>${result.recommendation}</h2>
      <p>${result.reasoning}</p>
    `;
        score.textContent = `${result.totalScore}/100`;
    },

    /**
     * Render score breakdown
     */
    renderScoreBreakdown(result) {
        const container = document.getElementById('scoreDetails');
        const categories = [
            { key: 'linkedinActivity', label: 'LinkedIn Activity', color: 'primary' },
            { key: 'leadership', label: 'Leadership', color: 'primary' },
            { key: 'peopleSkills', label: 'People Skills', color: 'primary' },
            { key: 'proactivity', label: 'Proactivity', color: 'primary' }
        ];

        container.innerHTML = categories.map(cat => {
            const scoreData = result.scores[cat.key];
            const percentage = (scoreData.score / scoreData.maxScore) * 100;

            return `
        <div class="score-item">
          <div class="score-label">${cat.label}</div>
          <div class="score-bar">
            <div class="score-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="score-value">${scoreData.score}/${scoreData.maxScore}</div>
        </div>
      `;
        }).join('');
    },

    /**
     * Render key findings
     */
    renderKeyFindings(result) {
        const container = document.getElementById('keyFindingsList');

        if (result.keyFindings.length === 0) {
            container.innerHTML = '<p style="opacity: 0.7;">No specific findings highlighted.</p>';
            return;
        }

        container.innerHTML = result.keyFindings.map(finding => `
      <div class="finding-item">
        <div class="finding-icon">${finding.icon}</div>
        <div class="finding-text">${finding.text}</div>
      </div>
    `).join('');
    },

    /**
     * Render detailed analysis
     */
    renderDetailedAnalysis(result) {
        const container = document.getElementById('detailedAnalysis');
        const { scores } = result;

        let html = '';

        Object.entries(scores).forEach(([key, scoreData]) => {
            const labels = {
                linkedinActivity: 'LinkedIn Activity & Engagement',
                leadership: 'Leadership Experience',
                peopleSkills: 'People & Communication Skills',
                proactivity: 'Proactivity & Initiative'
            };

            html += `
        <div class="analysis-section">
          <h4>${labels[key]}</h4>
          <p class="analysis-text"><strong>Score:</strong> ${scoreData.score}/${scoreData.maxScore}</p>
          <p class="analysis-text"><strong>Indicators:</strong></p>
          <ul style="margin: 0; padding-left: 16px; font-size: 12px; opacity: 0.8;">
            ${scoreData.indicators.map(ind => `<li>${ind}</li>`).join('')}
          </ul>
        </div>
      `;
        });

        container.innerHTML = html;
    },

    /**
     * Show error
     */
    showError(message) {
        this.setState('error');
        document.getElementById('initialState').classList.add('hidden');
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('resultsContainer').classList.add('hidden');
        document.getElementById('errorState').classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
    },

    /**
     * Show initial state
     */
    showInitial() {
        this.setState('initial');
        document.getElementById('initialState').classList.remove('hidden');
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('resultsContainer').classList.add('hidden');
        document.getElementById('errorState').classList.add('hidden');
    },

    /**
     * Set internal state
     */
    setState(state) {
        this.currentState = state;
        console.log(`📍 State changed to: ${state}`);
    }
};

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyzeButton');
    const newAnalysisButton = document.getElementById('newAnalysisButton');
    const shareButton = document.getElementById('shareButton');
    const retryButton = document.getElementById('retryButton');

    // Analyze button
    analyzeButton?.addEventListener('click', async () => {
        console.log('🚀 Analyze button clicked');
        UIManager.showLoading();

        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Check if on LinkedIn
            if (!tab.url.includes('linkedin.com')) {
                throw new Error('Please navigate to a LinkedIn profile page first.');
            }

            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeProfile' });

            if (!response.success) {
                throw new Error(response.error || 'Failed to scrape profile data');
            }

            // Analyze the scraped data
            const analysisResult = HRInternEvaluator.analyzeProfile(response.data);
            console.log('📊 Analysis complete:', analysisResult);

            // Store result for sharing
            window.lastAnalysisResult = analysisResult;

            // Show results
            UIManager.showResults(analysisResult);

        } catch (error) {
            console.error('❌ Error:', error);
            UIManager.showError(error.message || 'An error occurred while analyzing the profile.');
        }
    });

    // New analysis button
    newAnalysisButton?.addEventListener('click', () => {
        UIManager.showInitial();
    });

    // Share button
    shareButton?.addEventListener('click', () => {
        if (!window.lastAnalysisResult) return;

        const result = window.lastAnalysisResult;
        const shareText = `
🎯 Scaler HR Intern Candidate Evaluation

Name: ${result.profileName}
Recommendation: ${result.recommendation}
Score: ${result.totalScore}/100

Score Breakdown:
• LinkedIn Activity: ${result.scores.linkedinActivity.score}/${result.scores.linkedinActivity.maxScore}
• Leadership: ${result.scores.leadership.score}/${result.scores.leadership.maxScore}
• People Skills: ${result.scores.peopleSkills.score}/${result.scores.peopleSkills.maxScore}
• Proactivity: ${result.scores.proactivity.score}/${result.scores.proactivity.maxScore}

Reasoning: ${result.reasoning}
    `.trim();

        navigator.clipboard.writeText(shareText).then(() => {
            shareButton.textContent = '✅ Copied!';
            setTimeout(() => {
                shareButton.textContent = '📋 Copy Results';
            }, 2000);
        });
    });

    // Retry button
    retryButton?.addEventListener('click', () => {
        UIManager.showInitial();
    });
});

console.log('✅ Popup script loaded');