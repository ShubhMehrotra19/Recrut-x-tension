// popup.js - Enhanced with comprehensive potential analysis

document.addEventListener('DOMContentLoaded', function() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const exportBtn = document.getElementById('exportBtn');
    const statusCard = document.getElementById('statusCard');
    const statusTitle = document.getElementById('statusTitle');
    const statusText = document.getElementById('statusText');
    const loadingSection = document.getElementById('loadingSection');
    const profileInfo = document.getElementById('profileInfo');

    let currentProfileData = null;

    checkLinkedInPage();

    analyzeBtn.addEventListener('click', analyzeProfile);
    exportBtn.addEventListener('click', exportData);

    function checkLinkedInPage() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            if (currentTab && currentTab.url && currentTab.url.includes('linkedin.com/in/')) {
                updateStatus('Ready to Analyze', 'Click the button below to perform deep analysis of this LinkedIn profile.', 'default');
                analyzeBtn.disabled = false;
            } else {
                updateStatus('Not on LinkedIn Profile', 'Please navigate to a LinkedIn profile page (linkedin.com/in/...) to use this extension.', 'error');
                analyzeBtn.disabled = true;
            }
        });
    }

    function updateStatus(title, text, type = 'default') {
        statusTitle.textContent = type === 'error' ? '⚠️ ' + title :
            type === 'success' ? '✅ ' + title :
                '📍 ' + title;
        statusText.textContent = text;

        statusCard.className = 'status-card';
        if (type === 'error') statusCard.classList.add('error');
        if (type === 'success') statusCard.classList.add('success');
    }

    function analyzeProfile() {
        loadingSection.classList.add('active');
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'scrapeProfile'}, function(response) {
                loadingSection.classList.remove('active');
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<span>🔍</span><span>Analyze Profile</span>';

                if (chrome.runtime.lastError) {
                    updateStatus('Error', 'Failed to connect to the page. Please refresh and try again.', 'error');
                    return;
                }

                if (response && response.success) {
                    currentProfileData = response.data;

                    // Perform deep potential analysis
                    const analysis = analyzePotential(response.data);
                    currentProfileData.potentialAnalysis = analysis;

                    displayProfileData(response.data, analysis);
                    updateStatus('Analysis Complete',
                        `Profile analyzed. Potential Score: ${analysis.overallScore}% - ${analysis.verdict}`,
                        'success');
                    exportBtn.style.display = 'flex';
                } else {
                    updateStatus('Analysis Failed', response?.error || 'Unable to extract profile data. Make sure you are logged into LinkedIn.', 'error');
                }
            });
        });
    }

    function analyzePotential(data) {
        const analysis = {
            overallScore: 0,
            scores: {
                learningPotential: 0,
                leadership: 0,
                initiative: 0,
                careerGrowth: 0,
                technicalBreadth: 0,
                communityEngagement: 0
            },
            strengths: [],
            growthIndicators: [],
            concerns: [],
            verdict: '',
            reasoning: []
        };

        // ========== LEARNING POTENTIAL SCORE (0-20) ==========
        let learningScore = 0;

        // Continuous education signals
        if (data.certifications.length > 0) {
            learningScore += Math.min(data.certifications.length * 2, 6);
            analysis.strengths.push(`${data.certifications.length} professional certifications`);
        }

        if (data.courses.length > 0) {
            learningScore += Math.min(data.courses.length, 4);
            analysis.growthIndicators.push(`Completed ${data.courses.length} additional courses`);
        }

        // Diverse skill set
        if (data.skills.length > 15) {
            learningScore += 5;
            analysis.strengths.push(`Broad technical skill set (${data.skills.length} skills)`);
        } else if (data.skills.length > 8) {
            learningScore += 3;
        }

        // Learning signals from about/descriptions
        if (data.potentialIndicators.learningSignals.length > 0) {
            learningScore += Math.min(data.potentialIndicators.learningSignals.length, 5);
            analysis.growthIndicators.push('Growth mindset evident in profile content');
        }

        analysis.scores.learningPotential = Math.min(learningScore, 20);

        // ========== LEADERSHIP SCORE (0-20) ==========
        let leadershipScore = 0;

        // Leadership in roles
        const leadershipRoles = data.experience.filter(e =>
            e.progressionLevel === 'senior' ||
            (e.title && e.title.toLowerCase().match(/lead|manager|head|director|senior/))
        );

        if (leadershipRoles.length > 0) {
            leadershipScore += Math.min(leadershipRoles.length * 4, 8);
            analysis.strengths.push(`${leadershipRoles.length} leadership roles`);
        }

        // Mentoring/team management signals
        const mentorshipSignals = data.potentialIndicators.leadershipSignals.filter(s =>
            s.toLowerCase().includes('mentor') || s.toLowerCase().includes('team') || s.toLowerCase().includes('manage')
        );

        if (mentorshipSignals.length > 0) {
            leadershipScore += Math.min(mentorshipSignals.length * 2, 6);
            analysis.strengths.push('Mentorship and team management experience');
        }

        // Recommendations received
        if (data.recommendations.received.length > 0) {
            leadershipScore += Math.min(data.recommendations.received.length, 6);
            analysis.strengths.push(`${data.recommendations.received.length} recommendations received`);
        }

        analysis.scores.leadership = Math.min(leadershipScore, 20);

        // ========== INITIATIVE & PROACTIVENESS SCORE (0-20) ==========
        let initiativeScore = 0;

        // Projects (especially personal/side projects)
        if (data.projects.length > 0) {
            initiativeScore += Math.min(data.projects.length * 3, 9);
            analysis.strengths.push(`${data.projects.length} independent projects`);
        }

        // Publications, patents, honors
        const achievements = data.publications.length + data.patents.length + data.honors.length;
        if (achievements > 0) {
            initiativeScore += Math.min(achievements * 2, 6);
            analysis.strengths.push(`${achievements} publications/patents/honors`);
        }

        // Initiative signals from descriptions
        if (data.potentialIndicators.initiativeSignals.length > 0) {
            initiativeScore += Math.min(data.potentialIndicators.initiativeSignals.length, 5);
            analysis.growthIndicators.push('Proactive problem-solving evident in work history');
        }

        analysis.scores.initiative = Math.min(initiativeScore, 20);

        // ========== CAREER GROWTH SCORE (0-15) ==========
        let careerScore = 0;

        // Career progression
        if (data.potentialIndicators.careerProgression.length > 0) {
            careerScore += 5;
            analysis.strengths.push('Clear career progression trajectory');
        }

        // Job changes (shows adaptability but not too many)
        const uniqueCompanies = [...new Set(data.experience.map(e => e.company))].length;
        if (uniqueCompanies >= 2 && uniqueCompanies <= 5) {
            careerScore += 5;
            analysis.growthIndicators.push('Healthy job mobility showing adaptability');
        } else if (uniqueCompanies > 5) {
            careerScore += 2;
            analysis.concerns.push('Frequent job changes - may need stability assessment');
        } else if (uniqueCompanies === 1 && data.totalExperienceYears > 5) {
            careerScore += 3;
            analysis.growthIndicators.push('Long tenure showing loyalty');
        }

        // Experience duration in current role
        const currentRole = data.experience.find(e => e.isCurrent);
        if (currentRole && currentRole.durationInMonths > 12) {
            careerScore += 5;
        } else if (currentRole && currentRole.durationInMonths > 6) {
            careerScore += 3;
        }

        analysis.scores.careerGrowth = Math.min(careerScore, 15);

        // ========== TECHNICAL BREADTH SCORE (0-15) ==========
        let technicalScore = 0;

        // Diverse experience across domains
        if (data.potentialIndicators.diverseExperience) {
            technicalScore += 5;
            analysis.strengths.push('Diverse industry/domain experience');
        }

        // Technical skills with endorsements
        const endorsedSkills = data.skills.filter(s => s.endorsements > 5).length;
        if (endorsedSkills > 5) {
            technicalScore += 5;
            analysis.strengths.push(`${endorsedSkills} well-endorsed technical skills`);
        } else if (endorsedSkills > 0) {
            technicalScore += 3;
        }

        // Education quality
        if (data.education.length > 0) {
            technicalScore += 3;
            if (data.education.some(e => e.degree && e.degree.toLowerCase().includes('master'))) {
                technicalScore += 2;
                analysis.strengths.push('Advanced degree (Masters)');
            }
        }

        analysis.scores.technicalBreadth = Math.min(technicalScore, 15);

        // ========== COMMUNITY ENGAGEMENT SCORE (0-10) ==========
        let engagementScore = 0;

        // Volunteer work
        if (data.volunteerExperience.length > 0) {
            engagementScore += 4;
            analysis.strengths.push('Active in volunteer/community work');
        }

        // LinkedIn activity
        if (data.recentActivity.length > 2) {
            engagementScore += 3;
            analysis.growthIndicators.push('Active on LinkedIn - shares knowledge');
        }

        // Languages (shows cultural adaptability)
        if (data.languages.length > 1) {
            engagementScore += 3;
            analysis.strengths.push(`Multilingual (${data.languages.length} languages)`);
        }

        analysis.scores.communityEngagement = Math.min(engagementScore, 10);

        // ========== CALCULATE OVERALL SCORE ==========
        analysis.overallScore = Math.round(
            analysis.scores.learningPotential +
            analysis.scores.leadership +
            analysis.scores.initiative +
            analysis.scores.careerGrowth +
            analysis.scores.technicalBreadth +
            analysis.scores.communityEngagement
        );

        // ========== DETERMINE VERDICT ==========
        if (analysis.overallScore >= 80) {
            analysis.verdict = 'Exceptional Potential';
            analysis.reasoning.push('Outstanding candidate with strong growth trajectory');
        } else if (analysis.overallScore >= 65) {
            analysis.verdict = 'High Potential';
            analysis.reasoning.push('Strong candidate with clear hunger to learn and grow');
        } else if (analysis.overallScore >= 50) {
            analysis.verdict = 'Good Potential';
            analysis.reasoning.push('Solid candidate showing positive indicators');
        } else if (analysis.overallScore >= 35) {
            analysis.verdict = 'Moderate Potential';
            analysis.reasoning.push('Shows some potential but may need more development');
        } else {
            analysis.verdict = 'Limited Data';
            analysis.reasoning.push('Insufficient profile data for comprehensive assessment');
        }

        // Add specific reasoning based on scores
        if (analysis.scores.learningPotential >= 15) {
            analysis.reasoning.push('Strong commitment to continuous learning');
        }
        if (analysis.scores.leadership >= 15) {
            analysis.reasoning.push('Demonstrated leadership capabilities');
        }
        if (analysis.scores.initiative >= 15) {
            analysis.reasoning.push('High initiative and self-motivation');
        }

        // Red flags
        if (data.experience.length === 0) {
            analysis.concerns.push('No work experience listed');
        }
        if (data.skills.length < 5) {
            analysis.concerns.push('Limited skills listed on profile');
        }
        if (!data.about) {
            analysis.concerns.push('No about section - profile may be incomplete');
        }

        return analysis;
    }

    function displayProfileData(data, analysis) {
        profileInfo.style.display = 'block';

        // Clear previous content
        profileInfo.innerHTML = '';

        // Basic info
        addProfileRow('Name', data.name || 'Not found');
        addProfileRow('Current Role', data.currentRole || 'Not specified');
        addProfileRow('Location', data.location || 'Not found');
        addProfileRow('Total Experience', data.totalExperienceYears ?
            `${Math.round(data.totalExperienceYears * 10) / 10} years` : 'Not calculated');

        // Divider
        const divider = document.createElement('div');
        divider.style.borderTop = '2px solid #667eea';
        divider.style.margin = '12px 0';
        profileInfo.appendChild(divider);

        // Potential scores
        addProfileRow('Learning Potential', `${analysis.scores.learningPotential}/20`, 'score');
        addProfileRow('Leadership', `${analysis.scores.leadership}/20`, 'score');
        addProfileRow('Initiative', `${analysis.scores.initiative}/20`, 'score');
        addProfileRow('Career Growth', `${analysis.scores.careerGrowth}/15`, 'score');
        addProfileRow('Technical Breadth', `${analysis.scores.technicalBreadth}/15`, 'score');
        addProfileRow('Community Engagement', `${analysis.scores.communityEngagement}/10`, 'score');

        // Overall score
        const scoreRow = document.createElement('div');
        scoreRow.className = 'profile-row';
        scoreRow.style.borderTop = '2px solid #667eea';
        scoreRow.style.paddingTop = '12px';
        scoreRow.style.fontWeight = '700';
        scoreRow.innerHTML = `
            <span class="profile-label" style="font-size: 15px;">POTENTIAL SCORE:</span>
            <span class="profile-value">
                <span class="score-badge ${getScoreClass(analysis.overallScore)}" style="font-size: 16px;">
                    ${analysis.overallScore}/100
                </span>
            </span>
        `;
        profileInfo.appendChild(scoreRow);

        // Verdict
        const verdictRow = document.createElement('div');
        verdictRow.className = 'profile-row';
        verdictRow.style.borderBottom = 'none';
        verdictRow.innerHTML = `
            <span class="profile-label">Verdict:</span>
            <span class="profile-value" style="font-weight: 600; color: ${getScoreColor(analysis.overallScore)};">
                ${analysis.verdict}
            </span>
        `;
        profileInfo.appendChild(verdictRow);

        // Strengths section
        if (analysis.strengths.length > 0) {
            const strengthsSection = document.createElement('div');
            strengthsSection.style.marginTop = '16px';
            strengthsSection.style.padding = '12px';
            strengthsSection.style.background = '#e8f5e9';
            strengthsSection.style.borderRadius = '8px';
            strengthsSection.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px; color: #2e7d32;">✅ Key Strengths:</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #1b5e20;">
                    ${analysis.strengths.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                </ul>
            `;
            profileInfo.appendChild(strengthsSection);
        }

        // Growth indicators
        if (analysis.growthIndicators.length > 0) {
            const growthSection = document.createElement('div');
            growthSection.style.marginTop = '12px';
            growthSection.style.padding = '12px';
            growthSection.style.background = '#e3f2fd';
            growthSection.style.borderRadius = '8px';
            growthSection.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px; color: #1565c0;">🚀 Growth Indicators:</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #0d47a1;">
                    ${analysis.growthIndicators.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                </ul>
            `;
            profileInfo.appendChild(growthSection);
        }

        // Concerns
        if (analysis.concerns.length > 0) {
            const concernsSection = document.createElement('div');
            concernsSection.style.marginTop = '12px';
            concernsSection.style.padding = '12px';
            concernsSection.style.background = '#fff3e0';
            concernsSection.style.borderRadius = '8px';
            concernsSection.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px; color: #e65100;">⚠️ Considerations:</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #bf360c;">
                    ${analysis.concerns.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                </ul>
            `;
            profileInfo.appendChild(concernsSection);
        }
    }

    function addProfileRow(label, value, type = 'normal') {
        const row = document.createElement('div');
        row.className = 'profile-row';

        if (type === 'score') {
            const scoreValue = parseInt(value.split('/')[0]);
            const maxValue = parseInt(value.split('/')[1]);
            const percentage = (scoreValue / maxValue) * 100;

            row.innerHTML = `
                <span class="profile-label">${label}:</span>
                <span class="profile-value">
                    ${value}
                    <div style="width: 60px; height: 6px; background: #e0e0e0; border-radius: 3px; display: inline-block; margin-left: 8px; vertical-align: middle;">
                        <div style="width: ${percentage}%; height: 100%; background: ${getScoreColor(percentage)}; border-radius: 3px;"></div>
                    </div>
                </span>
            `;
        } else {
            row.innerHTML = `
                <span class="profile-label">${label}:</span>
                <span class="profile-value">${value}</span>
            `;
        }

        profileInfo.appendChild(row);
    }

    function getScoreClass(score) {
        if (score >= 70) return 'score-high';
        if (score >= 50) return 'score-medium';
        return 'score-low';
    }

    function getScoreColor(score) {
        if (score >= 70) return '#2ecc71';
        if (score >= 50) return '#f39c12';
        return '#e74c3c';
    }

    function exportData() {
        if (!currentProfileData) {
            updateStatus('No Data', 'Please analyze a profile first.', 'error');
            return;
        }

        const dataStr = JSON.stringify(currentProfileData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);

        const filename = `${currentProfileData.name?.replace(/\s+/g, '_') || 'profile'}_analysis_${Date.now()}.json`;

        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, function(downloadId) {
            if (chrome.runtime.lastError) {
                updateStatus('Export Failed', 'Unable to export data.', 'error');
            } else {
                updateStatus('Export Successful', `Complete analysis saved as ${filename}`, 'success');
            }
        });
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'profileAnalyzed') {
            currentProfileData = request.data;
            const analysis = analyzePotential(request.data);
            currentProfileData.potentialAnalysis = analysis;
            displayProfileData(request.data, analysis);
        }
    });
});