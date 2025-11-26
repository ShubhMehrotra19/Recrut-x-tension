const LinkedInScraper = {
    // Selectors for LinkedIn profile elements
    selectors: {
        profileName: '[data-test-id="top-card-profile-name"]',
        profileHeadline: '[data-test-id="top-card-headline"]',
        profileAbout: '[data-test-id="about-details"]',
        experienceSection: '[id="experience"]',
        educationSection: '[id="education"]',
        skillsSection: '[id="skills"]',
        endorsementSection: '[data-test-id="profile-skill-card"]',
        posts: '[data-test-id="feed-item"]',
        activityFeed: '[data-test-id="activity-item"]',
        recommendations: '[data-test-id="recommendation-item"]',
        connections: '[data-test-id="connection-item"]',
        volunteering: '[id="volunteering_see_all"]',
        organizations: '.org-association-item',
        leadershipRoles: '.profile-section-card'
    },

    /**
     * Scrape all profile data from LinkedIn
     */
    scrapeProfile() {
        console.log('🔍 Starting LinkedIn profile scrape...');

        const profileData = {
            personal: this.scrapPersonalInfo(),
            experience: this.scrapeExperience(),
            education: this.scrapeEducation(),
            skills: this.scrapeSkills(),
            activity: this.scrapeActivityAndPosts(),
            volunteering: this.scrapeVolunteering(),
            organizations: this.scrapeOrganizations(),
            about: this.scrapeAbout(),
            recommendations: this.scrapeRecommendations()
        };

        console.log('✅ Profile scrape complete:', profileData);
        return profileData;
    },

    /**
     * Extract personal information from profile
     */
    scrapPersonalInfo() {
        const nameElement = document.querySelector('[data-test-id="top-card-profile-name"]');
        const headlineElement = document.querySelector('[data-test-id="top-card-headline"]');

        return {
            name: nameElement?.textContent?.trim() || 'Unknown',
            headline: headlineElement?.textContent?.trim() || ''
        };
    },

    /**
     * Extract experience/work history
     */
    scrapeExperience() {
        const experiences = [];
        const experienceItems = document.querySelectorAll('[data-test-id="experience-item"]');

        experienceItems.forEach(item => {
            const titleEl = item.querySelector('[data-test-id="title"]');
            const companyEl = item.querySelector('[data-test-id="company-name"]');
            const descEl = item.querySelector('[data-test-id="description"]');

            experiences.push({
                title: titleEl?.textContent?.trim() || '',
                company: companyEl?.textContent?.trim() || '',
                description: descEl?.textContent?.trim() || '',
                isLeadership: this.isLeadershipRole(titleEl?.textContent || '')
            });
        });

        return experiences;
    },

    /**
     * Extract education information
     */
    scrapeEducation() {
        const education = [];
        const educationItems = document.querySelectorAll('[data-test-id="education-item"]');

        educationItems.forEach(item => {
            const schoolEl = item.querySelector('[data-test-id="school-name"]');
            const degreeEl = item.querySelector('[data-test-id="degree-name"]');

            education.push({
                school: schoolEl?.textContent?.trim() || '',
                degree: degreeEl?.textContent?.trim() || ''
            });
        });

        return education;
    },

    /**
     * Extract skills
     */
    scrapeSkills() {
        const skills = [];
        const skillItems = document.querySelectorAll('[data-test-id="skill-item"]');

        skillItems.forEach(item => {
            const skillEl = item.querySelector('[data-test-id="skill-name"]');
            const endorsements = item.querySelector('[data-test-id="endorsement-count"]');

            skills.push({
                name: skillEl?.textContent?.trim() || '',
                endorsements: parseInt(endorsements?.textContent || '0') || 0
            });
        });

        return skills;
    },

    /**
     * Scrape activity and posts
     */
    scrapeActivityAndPosts() {
        const posts = [];

        // Try multiple selectors for posts
        const postSelectors = [
            'div[data-test-id="feed-item"]',
            'div[data-test-id="activity-item"]',
            '[class*="feed-item"]',
            '[class*="post"]'
        ];

        let postElements = [];
        for (const selector of postSelectors) {
            postElements = document.querySelectorAll(selector);
            if (postElements.length > 0) break;
        }

        // Count posts and extract activity data
        const postCount = postElements.length;
        const hasRegularPosts = postCount > 0;

        // Check for engagement indicators
        let engagementCount = 0;
        const likeButtons = document.querySelectorAll('[aria-label*="Like"]');
        const commentButtons = document.querySelectorAll('[aria-label*="Comment"]');
        const shareButtons = document.querySelectorAll('[aria-label*="Share"]');

        engagementCount = likeButtons.length + commentButtons.length + shareButtons.length;

        return {
            postCount,
            hasRegularPosts,
            engagementCount,
            engagementLevel: this.calculateEngagementLevel(engagementCount)
        };
    },

    /**
     * Scrape volunteering information
     */
    scrapeVolunteering() {
        const volunteering = [];
        const volunteeringItems = document.querySelectorAll('[data-test-id="volunteering-item"]');

        volunteeringItems.forEach(item => {
            const roleEl = item.querySelector('[data-test-id="volunteering-role"]');
            const orgEl = item.querySelector('[data-test-id="volunteering-organization"]');

            volunteering.push({
                role: roleEl?.textContent?.trim() || '',
                organization: orgEl?.textContent?.trim() || ''
            });
        });

        return volunteering;
    },

    /**
     * Scrape organizations and memberships
     */
    scrapeOrganizations() {
        const organizations = [];

        // Look for organization mentions in profile text
        const profileText = document.body.textContent;
        const orgKeywords = [
            'founder', 'founded', 'president', 'vice president',
            'treasurer', 'secretary', 'lead', 'head', 'organizer',
            'coordinator', 'manager', 'director', 'chair', 'chair person'
        ];

        let orgCount = 0;
        orgKeywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = profileText.match(regex) || [];
            orgCount += matches.length;
        });

        return {
            count: orgCount,
            hasLeadership: orgCount > 0
        };
    },

    /**
     * Scrape about section
     */
    scrapeAbout() {
        const aboutEl = document.querySelector('[data-test-id="about-details"]');
        const aboutText = aboutEl?.textContent?.trim() || '';

        return {
            text: aboutText,
            length: aboutText.length,
            hasAbout: aboutText.length > 50
        };
    },

    /**
     * Scrape recommendations
     */
    scrapeRecommendations() {
        const recommendationElements = document.querySelectorAll('[data-test-id="recommendation-item"]');
        return {
            count: recommendationElements.length,
            hasRecommendations: recommendationElements.length > 0
        };
    },

    /**
     * Check if a title indicates leadership
     */
    isLeadershipRole(title) {
        const leadershipKeywords = [
            'founder', 'co-founder', 'ceo', 'president', 'vice president',
            'manager', 'director', 'lead', 'head', 'organizer',
            'coordinator', 'captain', 'chair', 'principal'
        ];

        const lowerTitle = title.toLowerCase();
        return leadershipKeywords.some(keyword => lowerTitle.includes(keyword));
    },

    /**
     * Calculate engagement level
     */
    calculateEngagementLevel(engagementCount) {
        if (engagementCount > 50) return 'high';
        if (engagementCount > 20) return 'medium';
        if (engagementCount > 0) return 'low';
        return 'none';
    }
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeProfile') {
        console.log('📨 Received scrape request from popup');

        try {
            const profileData = LinkedInScraper.scrapeProfile();
            sendResponse({
                success: true,
                data: profileData
            });
        } catch (error) {
            console.error('❌ Error scraping profile:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
});

console.log('✅ Content script loaded on LinkedIn profile');