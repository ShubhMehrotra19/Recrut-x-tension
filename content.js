// content.js - Comprehensive LinkedIn profile scraper with deep analysis

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'scrapeProfile') {
        try {
            const profileData = scrapeLinkedInProfile();
            sendResponse({success: true, data: profileData});
        } catch (error) {
            console.error('Scraping error:', error);
            sendResponse({success: false, error: error.message});
        }
    }
    return true;
});

function scrapeLinkedInProfile() {
    const data = {
        url: window.location.href,
        scrapedAt: new Date().toISOString(),

        // Basic Information
        name: null,
        headline: null,
        location: null,
        about: null,
        profilePicture: null,

        // Contact & Connections
        connections: null,
        followers: null,

        // Experience & Work
        experience: [],
        totalExperienceYears: 0,
        currentRole: null,

        // Education
        education: [],

        // Skills & Endorsements
        skills: [],
        topSkills: [],

        // Achievements & Recognition
        certifications: [],
        projects: [],
        publications: [],
        patents: [],
        honors: [],
        volunteerExperience: [],
        courses: [],
        languages: [],

        // Recommendations & Endorsements
        recommendations: {
            received: [],
            given: 0
        },

        // Activity & Engagement
        recentActivity: [],
        posts: [],

        // Potential Indicators (for analysis)
        potentialIndicators: {
            careerProgression: [],
            learningSignals: [],
            leadershipSignals: [],
            initiativeSignals: [],
            diverseExperience: false,
            continuousLearning: false,
            communityEngagement: false
        }
    };

    // ========== BASIC INFORMATION ==========

    // Name
    const nameSelectors = [
        'h1.text-heading-xlarge',
        '.pv-text-details__left-panel h1',
        'h1[class*="inline"]',
        '.ph5 h1'
    ];
    data.name = extractText(nameSelectors);

    // Headline
    const headlineSelectors = [
        '.text-body-medium.break-words',
        '.pv-text-details__left-panel .text-body-medium',
        'div[class*="headline"]'
    ];
    data.headline = extractText(headlineSelectors);

    // Location
    const locationSelectors = [
        '.text-body-small.inline.t-black--light.break-words',
        '.pv-text-details__left-panel .text-body-small'
    ];
    const locationText = extractText(locationSelectors);
    if (locationText && !locationText.includes('Contact info') && !locationText.includes('followers')) {
        data.location = locationText;
    }

    // Profile Picture
    const profileImg = document.querySelector('.pv-top-card-profile-picture__image, img[class*="profile-photo"]');
    if (profileImg) {
        data.profilePicture = profileImg.src;
    }

    // Connections
    const connectionText = document.querySelector('.t-black--light.t-normal span')?.textContent;
    if (connectionText) {
        const match = connectionText.match(/(\d+[\d,]*)\+?\s*connection/i);
        if (match) data.connections = match[1].replace(',', '');
    }

    // ========== ABOUT SECTION (DEEP ANALYSIS) ==========

    const aboutSelectors = [
        '#about ~ .display-flex .inline-show-more-text',
        'section[data-section="about"] .display-flex .inline-show-more-text',
        '.pv-shared-text-with-see-more span[aria-hidden="true"]'
    ];
    data.about = extractText(aboutSelectors);

    // Analyze about section for potential indicators
    if (data.about) {
        const aboutLower = data.about.toLowerCase();

        // Learning signals
        if (aboutLower.match(/learn|grow|develop|curious|eager|passionate|drive|motivated/)) {
            data.potentialIndicators.learningSignals.push('Growth mindset language in about section');
        }

        // Leadership signals
        if (aboutLower.match(/lead|mentor|manage|team|coach|guide|initiative/)) {
            data.potentialIndicators.leadershipSignals.push('Leadership language in about section');
        }

        // Initiative signals
        if (aboutLower.match(/built|created|founded|launched|started|initiated|pioneered/)) {
            data.potentialIndicators.initiativeSignals.push('Initiative-taking language in about section');
        }
    }

    // ========== EXPERIENCE (COMPREHENSIVE) ==========

    const experienceSection = document.querySelector('#experience');
    if (experienceSection) {
        const experienceItems = experienceSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        experienceItems.forEach((item, index) => {
            const exp = {
                title: extractText(['.mr1.t-bold span[aria-hidden="true"]'], item),
                company: extractText(['.t-14.t-normal span[aria-hidden="true"]'], item),
                duration: null,
                location: null,
                description: null,
                skills: [],
                isCurrent: false,
                durationInMonths: 0,
                progressionLevel: null
            };

            // Get all text elements to parse duration and location
            const textElements = item.querySelectorAll('.t-14.t-normal.t-black--light span[aria-hidden="true"]');
            if (textElements.length > 0) {
                exp.duration = textElements[0]?.textContent.trim();
                if (textElements.length > 1) {
                    exp.location = textElements[1]?.textContent.trim();
                }
            }

            // Check if current role
            if (exp.duration?.toLowerCase().includes('present')) {
                exp.isCurrent = true;
                if (index === 0) data.currentRole = exp.title;
            }

            // Calculate duration in months
            if (exp.duration) {
                const yearMatch = exp.duration.match(/(\d+)\s*yr/);
                const monthMatch = exp.duration.match(/(\d+)\s*mo/);

                if (yearMatch) exp.durationInMonths += parseInt(yearMatch[1]) * 12;
                if (monthMatch) exp.durationInMonths += parseInt(monthMatch[1]);

                data.totalExperienceYears += exp.durationInMonths / 12;
            }

            // Get description (look for show more content)
            const descElement = item.querySelector('.inline-show-more-text span[aria-hidden="true"]');
            if (descElement) {
                exp.description = descElement.textContent.trim();

                // Analyze description for signals
                const descLower = exp.description.toLowerCase();

                // Leadership in role
                if (descLower.match(/led team|managed|supervised|coordinated|mentored|trained/)) {
                    data.potentialIndicators.leadershipSignals.push(`Leadership in ${exp.title}`);
                }

                // Initiative/proactiveness
                if (descLower.match(/initiated|proposed|developed|created|implemented|launched|improved|optimized|increased by|reduced by/)) {
                    data.potentialIndicators.initiativeSignals.push(`Proactive contributions in ${exp.title}`);
                }

                // Quantifiable achievements
                const percentMatch = descLower.match(/(\d+)%/g);
                if (percentMatch) {
                    data.potentialIndicators.initiativeSignals.push(`Measurable impact: ${percentMatch.join(', ')} in ${exp.title}`);
                }
            }

            // Skills mentioned in this role
            const skillElements = item.querySelectorAll('[data-field="experience_skill"] span');
            skillElements.forEach(el => {
                const skill = el.textContent.trim();
                if (skill && !skill.includes('·')) exp.skills.push(skill);
            });

            // Determine progression level
            const titleLower = (exp.title || '').toLowerCase();
            if (titleLower.match(/senior|lead|principal|staff|director|head|vp|chief/)) {
                exp.progressionLevel = 'senior';
            } else if (titleLower.match(/mid|intermediate|ii|2/)) {
                exp.progressionLevel = 'mid';
            } else if (titleLower.match(/junior|associate|entry|intern|trainee|i|1/)) {
                exp.progressionLevel = 'junior';
            } else {
                exp.progressionLevel = 'unknown';
            }

            if (exp.title || exp.company) {
                data.experience.push(exp);
            }
        });

        // Analyze career progression
        const levels = ['junior', 'mid', 'senior'];
        const experienceLevels = data.experience.map(e => e.progressionLevel);
        const uniqueLevels = [...new Set(experienceLevels)];

        if (uniqueLevels.length > 1) {
            data.potentialIndicators.careerProgression.push('Career progression visible across roles');
        }

        // Check role diversity
        const companies = [...new Set(data.experience.map(e => e.company))];
        if (companies.length > 2) {
            data.potentialIndicators.diverseExperience = true;
        }
    }

    // ========== EDUCATION ==========

    const educationSection = document.querySelector('#education');
    if (educationSection) {
        const educationItems = educationSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        educationItems.forEach(item => {
            const edu = {
                school: extractText(['.mr1.t-bold span[aria-hidden="true"]'], item),
                degree: extractText(['.t-14.t-normal span[aria-hidden="true"]'], item),
                field: null,
                dates: null,
                grade: null,
                activities: null,
                description: null
            };

            // Parse dates
            const dateElements = item.querySelectorAll('.t-14.t-normal.t-black--light span[aria-hidden="true"]');
            if (dateElements.length > 0) {
                edu.dates = dateElements[0]?.textContent.trim();
            }

            // Get description
            const descElement = item.querySelector('.inline-show-more-text span[aria-hidden="true"]');
            if (descElement) {
                edu.description = descElement.textContent.trim();

                // Check for activities/leadership in education
                const descLower = edu.description.toLowerCase();
                if (descLower.match(/president|lead|founder|organized|captain|head/)) {
                    data.potentialIndicators.leadershipSignals.push(`Leadership during education at ${edu.school}`);
                }
            }

            if (edu.school) {
                data.education.push(edu);
            }
        });
    }

    // ========== SKILLS & ENDORSEMENTS ==========

    const skillsSection = document.querySelector('#skills');
    if (skillsSection) {
        const skillItems = skillsSection.closest('section')?.querySelectorAll('.artdeco-list__item') || [];

        skillItems.forEach(item => {
            const skillName = item.querySelector('.mr1.t-bold span[aria-hidden="true"]')?.textContent.trim();
            const endorsements = item.querySelector('.t-14.t-black--light')?.textContent.match(/(\d+)/)?.[1];

            if (skillName) {
                data.skills.push({
                    name: skillName,
                    endorsements: endorsements ? parseInt(endorsements) : 0
                });
            }
        });

        // Sort by endorsements to get top skills
        data.topSkills = [...data.skills]
            .sort((a, b) => b.endorsements - a.endorsements)
            .slice(0, 5)
            .map(s => s.name);

        // Check for diverse skill set
        if (data.skills.length > 10) {
            data.potentialIndicators.continuousLearning = true;
            data.potentialIndicators.learningSignals.push(`Broad skill set: ${data.skills.length} skills listed`);
        }
    }

    // ========== CERTIFICATIONS ==========

    const certificationsSection = document.querySelector('#licenses_and_certifications');
    if (certificationsSection) {
        const certItems = certificationsSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        certItems.forEach(item => {
            const cert = {
                name: extractText(['.mr1.t-bold span[aria-hidden="true"]'], item),
                issuer: extractText(['.t-14.t-normal span[aria-hidden="true"]'], item),
                issueDate: null,
                expiryDate: null,
                credentialId: null
            };

            const dateText = item.querySelector('.t-14.t-normal.t-black--light span')?.textContent;
            if (dateText) {
                cert.issueDate = dateText.trim();
            }

            if (cert.name) {
                data.certifications.push(cert);
            }
        });

        if (data.certifications.length > 0) {
            data.potentialIndicators.continuousLearning = true;
            data.potentialIndicators.learningSignals.push(`${data.certifications.length} professional certifications obtained`);
        }
    }

    // ========== PROJECTS ==========

    const projectsSection = document.querySelector('#projects');
    if (projectsSection) {
        const projectItems = projectsSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        projectItems.forEach(item => {
            const project = {
                name: extractText(['.mr1.t-bold span[aria-hidden="true"]'], item),
                description: null,
                date: null,
                url: null
            };

            const descElement = item.querySelector('.inline-show-more-text span[aria-hidden="true"]');
            if (descElement) {
                project.description = descElement.textContent.trim();
            }

            if (project.name) {
                data.projects.push(project);
                data.potentialIndicators.initiativeSignals.push(`Personal/side project: ${project.name}`);
            }
        });
    }

    // ========== VOLUNTEER EXPERIENCE ==========

    const volunteerSection = document.querySelector('#volunteering_experience');
    if (volunteerSection) {
        const volunteerItems = volunteerSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        volunteerItems.forEach(item => {
            const volunteer = {
                role: extractText(['.mr1.t-bold span[aria-hidden="true"]'], item),
                organization: extractText(['.t-14.t-normal span[aria-hidden="true"]'], item),
                duration: null,
                cause: null,
                description: null
            };

            if (volunteer.role) {
                data.volunteerExperience.push(volunteer);
                data.potentialIndicators.communityEngagement = true;
                data.potentialIndicators.leadershipSignals.push(`Volunteer work: ${volunteer.role}`);
            }
        });
    }

    // ========== COURSES ==========

    const coursesSection = document.querySelector('#courses');
    if (coursesSection) {
        const courseItems = coursesSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        courseItems.forEach(item => {
            const courseName = extractText(['.mr1.t-bold span[aria-hidden="true"]'], item);
            if (courseName) {
                data.courses.push(courseName);
            }
        });

        if (data.courses.length > 0) {
            data.potentialIndicators.learningSignals.push(`${data.courses.length} additional courses completed`);
        }
    }

    // ========== LANGUAGES ==========

    const languagesSection = document.querySelector('#languages');
    if (languagesSection) {
        const langItems = languagesSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        langItems.forEach(item => {
            const lang = {
                name: extractText(['.mr1.t-bold span[aria-hidden="true"]'], item),
                proficiency: extractText(['.t-14.t-normal.t-black--light span[aria-hidden="true"]'], item)
            };
            if (lang.name) {
                data.languages.push(lang);
            }
        });

        if (data.languages.length > 1) {
            data.potentialIndicators.diverseExperience = true;
        }
    }

    // ========== HONORS & AWARDS ==========

    const honorsSection = document.querySelector('#honors_and_awards');
    if (honorsSection) {
        const honorItems = honorsSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        honorItems.forEach(item => {
            const honor = {
                title: extractText(['.mr1.t-bold span[aria-hidden="true"]'], item),
                issuer: extractText(['.t-14.t-normal span[aria-hidden="true"]'], item),
                date: null,
                description: null
            };
            if (honor.title) {
                data.honors.push(honor);
                data.potentialIndicators.initiativeSignals.push(`Award/Honor: ${honor.title}`);
            }
        });
    }

    // ========== PUBLICATIONS ==========

    const publicationsSection = document.querySelector('#publications');
    if (publicationsSection) {
        const pubItems = publicationsSection.closest('section')?.querySelectorAll('li.artdeco-list__item') || [];

        pubItems.forEach(item => {
            const pub = {
                title: extractText(['.mr1.t-bold span[aria-hidden="true"]'], item),
                publisher: extractText(['.t-14.t-normal span[aria-hidden="true"]'], item),
                date: null,
                description: null,
                url: null
            };
            if (pub.title) {
                data.publications.push(pub);
                data.potentialIndicators.initiativeSignals.push(`Publication: ${pub.title}`);
            }
        });
    }

    // ========== RECOMMENDATIONS ==========

    const recommendationsSection = document.querySelector('#recommendations');
    if (recommendationsSection) {
        const recItems = recommendationsSection.closest('section')?.querySelectorAll('.artdeco-entity-lockup') || [];

        recItems.forEach(item => {
            const rec = {
                from: extractText(['.t-16.t-black span'], item),
                relationship: extractText(['.t-14.t-black--light'], item),
                text: extractText(['.inline-show-more-text span'], item)
            };

            if (rec.from) {
                data.recommendations.received.push(rec);
            }
        });

        if (data.recommendations.received.length > 0) {
            data.potentialIndicators.leadershipSignals.push(`${data.recommendations.received.length} recommendations received`);
        }
    }

    // ========== RECENT ACTIVITY ==========

    const activitySection = document.querySelector('[data-view-name="profile-recent-activity"]');
    if (activitySection) {
        const activityItems = activitySection.querySelectorAll('.profile-creator-shared-feed-update__container') || [];

        activityItems.forEach(item => {
            const activity = {
                type: null,
                content: item.querySelector('.break-words')?.textContent.trim().substring(0, 200),
                date: item.querySelector('time')?.getAttribute('datetime')
            };

            if (activity.content) {
                data.recentActivity.push(activity);
            }
        });

        if (data.recentActivity.length > 3) {
            data.potentialIndicators.communityEngagement = true;
            data.potentialIndicators.learningSignals.push('Active on LinkedIn - shares insights and content');
        }
    }

    return data;
}

// Helper function to extract text from multiple selectors
function extractText(selectors, root = document) {
    for (const selector of selectors) {
        const element = root.querySelector(selector);
        if (element) {
            const text = element.textContent.trim();
            if (text) return text;
        }
    }
    return null;
}

// Auto-detect when on profile page
if (window.location.href.includes('linkedin.com/in/')) {
    console.log('LinkedIn Profile Deep Analyzer: Active');
}