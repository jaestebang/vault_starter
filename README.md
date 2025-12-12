# Vault Starter

This project is a secure personal vault application, built with Angular, designed to help users safely store and manage sensitive information. It leverages client-side encryption and integrates with Firebase for robust backend services, ensuring data privacy and security.

## Features

*   **User Authentication**: Secure login and registration.
*   **Secure Data Storage**: Encrypted storage of sensitive user data.
*   **Automatic Locking**: Implements auto-lock functionality for enhanced security.
*   **Data Encryption**: Utilizes cryptographic services for data protection.
*   **Firebase Integration**: Leverages Firebase for authentication, database, and possibly other backend services.
*   **Responsive User Interface**: Built with Angular for a dynamic and responsive user experience.

## Technologies Used

*   **Angular**: Frontend framework for building the user interface.
*   **TypeScript**: Primary language for Angular development.
*   **Firebase**: Backend-as-a-Service (BaaS) for authentication, database (Firestore), and possibly hosting.
*   **npm**: Package manager for project dependencies.
*   **HTML/CSS**: For structuring and styling the application.
*   **Cryptography Services**: Custom or integrated services for encryption/decryption.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.

*   [Node.js](https://nodejs.org/en/download/) (which includes npm)
*   [Angular CLI](https://angular.io/cli) (install globally: `npm install -g @angular/cli`)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/jaestebang/vault_starter.git
    cd vault_starter
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up Firebase:
    *   Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
    *   Add a web app to your Firebase project.
    *   Copy your Firebase configuration.
    *   Create `src/environments/environment.ts` (if it doesn't exist) and `src/environments/environment.prod.ts` files, and add your Firebase configuration to them. Example:
        ```typescript
        export const environment = {
          production: false,
          firebaseConfig: {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
          }
        };
        ```
    *   Configure Firestore rules (refer to `firestore.rules`).

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
