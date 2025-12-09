# Recrut-x-tension

Recruit-x-tension is a browser extension project designed to help recruiters quickly extract, organize, and shortlist candidate information from web pages, reducing manual effort in hiring workflows.

## Overview

Recruit-x-tension is a lightweight web extension that streamlines the hiring and shortlisting process for companies by capturing structured candidate data directly from recruitment platforms or LinkedIn-style profiles. The goal is to save recruiter time by simplifying data collection and centralizing key details in an accessible format.

## Features

- **Candidate Data Extraction**: Extracts relevant candidate information from the current tab (such as name, role, contact details, and other profile details, depending on page structure).
- **Intuitive Popup UI**: Provides a simple popup interface for recruiters to view or manage extracted candidate data within the extension.
- **Local Shortlist Storage**: Stores shortlisted candidates locally (via browser storage) to maintain a quick-access shortlist without requiring external tools or databases.

## Tech Stack

- **Extension Architecture**: Manifest-based extension compatible with Chromium browsers (Chrome, Brave, Edge).
- **Frontend**: Standard web technologies (HTML, CSS, JavaScript) for the popup and options UI.
- **Content Scripts**: Background and content scripts to interact with the active tab DOM and facilitate communication with the popup.

## Project Structure

```
Recruit-x-tension/
├── manifest.json          # Extension configuration (permissions, scripts, icons)
├── popup.html             # Recruiter-facing popup UI
├── popup.js               # Popup logic and interactions
├── content.js             # Content script for DOM interaction
├── background.js          # (Optional) Background script for service worker logic
├── assets/                # Icons and static resources
└── README.md              # Documentation
```

### Key Files

- **manifest.json**: Defines extension configuration, required permissions, content and background scripts, popup definition, and icons.
- **popup.html / popup.js**: UI and logic for the recruiter-facing popup where candidates are displayed and managed.
- **content.js**: Injected into recruitment platform pages to extract candidate information from the DOM.
- **assets/**: Directory containing extension icons and other static resources.

## Setup and Installation

### Prerequisites

- A Chromium-based browser (Chrome, Brave, Edge, etc.)
- Basic understanding of browser extensions (optional)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ShubhMehrotra19/Recrut-x-tension.git
   cd Recrut-x-tension
   ```

2. **Open the Extensions Page**:
   - In your browser, navigate to `chrome://extensions` (or your browser's equivalent).
   - Enable **Developer Mode** (toggle in the top right corner).

3. **Load the Extension**:
   - Click the **"Load unpacked"** button.
   - Select the cloned `Recrut-x-tension` folder.
   - The extension will be installed and appear in your extensions list.

4. **Pin the Extension** (Optional):
   - Click the puzzle icon in your browser toolbar.
   - Find "Recruit-x-tension" and click the pin icon to keep it easily accessible.

## Usage

### Basic Workflow

1. **Navigate to a Candidate Profile**: Open a recruitment platform or candidate profile page in your browser.
2. **Open the Extension Popup**: Click the Recruit-x-tension icon in your toolbar.
3. **Extract Candidate Data**: Use the popup controls to automatically extract and display candidate information.
4. **Shortlist Candidates**: Save candidate data to your local shortlist with a single click.
5. **Review Shortlisted Candidates**: Reopen the popup anytime during your hiring process to review previously shortlisted candidates.

## Future Improvements

- **Multi-Platform Support**: Extend support for more platforms (LinkedIn, Indeed, custom ATS tools) with configurable DOM selectors.
- **Data Export**: Export shortlisted candidates to CSV, JSON, or directly integrate with ATS platforms.
- **Candidate Scoring**: Implement a basic scoring or rating system to prioritize candidates in the shortlist.
- **Advanced Filtering**: Add filtering and sorting options (by experience, location, skills, etc.).
- **Bulk Actions**: Support for bulk operations like sending emails or moving candidates between stages.
- **User Preferences**: Allow customization of extracted fields and popup layout.

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Make your changes and commit: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature-name`.
5. Open a Pull Request.

## License

This project is open-source and available under the [MIT License](LICENSE).

## Contact & Support

For questions, suggestions, or issues, please:

- Open an issue on [GitHub Issues](https://github.com/ShubhMehrotra19/Recrut-x-tension/issues).
- Reach out to the project maintainer: [ShubhMehrotra19](https://github.com/ShubhMehrotra19).

---

**Happy recruiting! 🚀**
