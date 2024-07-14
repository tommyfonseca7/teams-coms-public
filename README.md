# Team Coms

Team Coms is a web application built with Vite.js and React, utilizing Tailwind CSS, Shadcn/UI, and Material-UI for styling. It integrates with Firebase services including Authentication, Firestore for data storage, and Firebase Storage for managing schedules pdfs and images.

The application was originally developed for a golf company to enhance communication among collaborators. It is designed to facilitate seamless interaction and information sharing within teams.

## Deployment

The application is currently deployed and accessible at [Team Coms Public](https://teams-coms-public.vercel.app/). To fully experience its functionality, you can register an account and explore its features.

## Local Setup

To run the application locally on your machine, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/tommyfonseca7/teams-coms-public.git
   cd teams-coms-public
   ```

2. Create a `.env` file in the root directory of the project and add your Firebase configuration keys. Example `.env` file:

   ```plaintext
   VITE_API_KEY=your_firebase_api_key
   VITE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_PROJECT_ID=your_firebase_project_id
   VITE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_APP_ID=your_firebase_app_id
   VITE_MEASUREMENT_ID=your_firebase_measurement_id
   ```

   Replace `your_firebase_...` values with your actual Firebase project configuration details.

3. Install dependencies and run the development server:

   ```bash
   npm install
   npm run dev
   ```

   This will start the development server. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Features

- **User Authentication:** Secure user registration and login using Firebase Authentication.
- **Data Storage:** Utilizes Firestore to store and manage data efficiently.
- **File Storage:** Firebase Storage integration for storing schedules and images.

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.

