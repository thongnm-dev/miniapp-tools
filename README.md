# Electron Application Form

A modern, responsive application form built with **Electron**, **React**, **TypeScript**, and **Tailwind CSS** that allows users to create, save, and submit job applications with a beautiful user interface.

## Features

- 📝 **Comprehensive Form Fields**: Personal information, education history, work experience, skills, and more
- 💾 **Save/Load Functionality**: Save your progress and load previously saved applications
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS and smooth animations
- ✅ **Form Validation**: Real-time validation with helpful error messages
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🔄 **Dynamic Fields**: Add/remove education and experience entries as needed
- 💻 **Cross-Platform**: Works on Windows, macOS, and Linux
- ⚛️ **React Components**: Modular, reusable components with TypeScript
- 🎯 **Type Safety**: Full TypeScript support for better development experience

## Screenshots

The application features a clean, modern interface with:
- Gradient background
- Card-based layout
- Smooth animations
- Professional typography
- Intuitive form sections

## Installation

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- PostgreSQL database (for file monitoring features)
- AWS account with S3 access (for S3 features)

### Environment Configuration

This application uses environment variables for configuration. Copy the `env.example` file to `.env` and update the values:

```bash
cp env.example .env
```

#### Required Environment Variables

**AWS S3 Configuration:**
- `VITE_AWS_REGION`: AWS region (default: us-east-1)
- `VITE_AWS_ACCESS_KEY_ID`: AWS access key ID
- `VITE_AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `VITE_AWS_S3_BUCKET`: S3 bucket name

**Database Configuration (PostgreSQL):**
- `VITE_DB_HOST`: Database host (default: localhost)
- `VITE_DB_PORT`: Database port (default: 5432)
- `VITE_DB_NAME`: Database name (default: miniapp)
- `VITE_DB_USER`: Database user (default: user)
- `VITE_DB_PASSWORD`: Database password (default: userpassword)

**Example .env file:**
```bash
# AWS S3 Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key
VITE_AWS_S3_BUCKET=your-bucket-name

# Database Configuration
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=miniapp
VITE_DB_USER=user
VITE_DB_PASSWORD=userpassword

# Development Settings
VITE_DEV_MODE=true
```

### Setup

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd electron-application-form
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Run the application**
   ```bash
   npm start
   ```

## Usage

### Running the Application

- **Development mode**: `npm start` (runs both main and renderer processes)
- **Main process only**: `npm run dev:main`
- **Renderer process only**: `npm run dev:renderer`
- **Build for distribution**: `npm run build`
- **Create distributable**: `npm run dist`

### Form Features

1. **Personal Information**
   - Fill in your basic details (name, email, phone, address, etc.)

2. **Education History**
   - Add multiple education entries
   - Include school name, degree, field of study, graduation date, and GPA

3. **Work Experience**
   - Add multiple work experience entries
   - Include company name, job title, dates, and job description
   - Mark current positions with a checkbox

4. **Skills & Additional Information**
   - List your skills (comma-separated)
   - Write a cover letter
   - Add references

### Data Management

- **Save Progress**: Click "Save Data" to save your current form data as a JSON file
- **Load Previous Data**: Click "Load Data" to load a previously saved application
- **Submit Application**: Click "Submit Application" to submit the form (currently logs to console)

## Project Structure

```
electron-application-form/
├── src/
│   ├── main/
│   │   ├── main.ts          # Main Electron process (TypeScript)
│   │   └── preload.ts       # Preload script for IPC communication
│   ├── components/
│   │   ├── PersonalInfo.tsx # Personal information form component
│   │   ├── Education.tsx    # Education history component
│   │   ├── Experience.tsx   # Work experience component
│   │   └── AdditionalInfo.tsx # Additional information component
│   ├── App.tsx              # Main React application component
│   ├── main.tsx             # React entry point
│   ├── index.css            # Tailwind CSS styles
│   └── types.ts             # TypeScript type definitions
├── index.html               # Main HTML file
├── package.json             # Project configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.main.json       # Main process TypeScript config
├── tsconfig.node.json       # Node.js TypeScript config
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── README.md               # This file
```

## Development

### Key Files

- **`src/main/main.ts`**: Handles the main Electron process, window creation, and IPC communication
- **`src/main/preload.ts`**: Preload script for secure IPC communication between main and renderer processes
- **`src/App.tsx`**: Main React application component with form state management
- **`src/components/`**: Reusable React components for different form sections
- **`src/index.css`**: Tailwind CSS styles with custom component classes
- **`src/types.ts`**: TypeScript type definitions for form data

### Customization

You can easily customize the application by:

1. **Modifying form fields**: Edit the React components in `src/components/`
2. **Changing styles**: Update the Tailwind CSS classes in `src/index.css`
3. **Adding functionality**: Extend the React components and add new ones
4. **Updating validation**: Modify validation logic in the React components
5. **Type definitions**: Update types in `src/types.ts` for better type safety

### Building for Distribution

To create distributable packages:

```bash
npm run dist
```

This will create platform-specific packages in the `dist` folder:
- Windows: NSIS installer
- macOS: DMG file
- Linux: AppImage

## Technologies Used

- **Electron**: Cross-platform desktop application framework
- **React 18**: Modern UI library with hooks and functional components
- **TypeScript**: Type-safe JavaScript for better development experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vite**: Fast build tool and development server
- **Node.js**: Backend functionality for file operations

## Browser Support

The application is designed to work with modern browsers and Electron's Chromium engine.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

1. Check the console for error messages
2. Ensure all dependencies are installed correctly
3. Verify Node.js version compatibility
4. Create an issue in the repository

## Future Enhancements

Potential improvements for future versions:

- [ ] Database integration for storing applications
- [ ] PDF export functionality
- [ ] Email submission capability
- [ ] Template system for different application types
- [ ] File upload for resumes and cover letters
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Offline functionality with local storage

---

**Note**: This is a demonstration application. In a production environment, you would want to add proper data validation, security measures, and backend integration for actual form submission. 