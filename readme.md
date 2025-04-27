
## Prerequisites
- **Python 3.8+**: For the backend server.
- **Node.js 18+**: For the frontend development and build process.
- **npm** (or **yarn**): Node package manager, typically included with Node.js.
- **PostgreSQL**: A running instance of the PostgreSQL database server.
- **Git**: For cloning the repository.

## Installation

1.  **Clone the repository**:
    ```bash
    # Replace <your-repository-url> with the actual URL of your repository
    git clone <your-repository-url>
    cd pwa-ai-assistant
    ```

2.  **Backend Setup**:
    ```bash
    cd backend-pwa
    python -m venv venv                     # Create a virtual environment
    source venv/bin/activate                # On Windows use `venv\Scripts\activate`
    pip install -r requirements.txt         # Install Python dependencies
    # Configure backend environment variables (see Environment Variables section)
    # cp .env.example .env
    # python init_db.py                     # Optional: Run script to initialize DB schema if needed
    cd ..
    ```
    *Note: Ensure your PostgreSQL server is running and accessible.*

3.  **Frontend Setup**:
    ```bash
    cd frontend-pwa
    npm install                             # Install Node.js dependencies
    # Configure frontend environment variables (see Environment Variables section)
    # cp .env.example .env
    cd ..
    ```

## Running the Application

1.  **Start the Backend**:
    ```bash
    cd backend-pwa
    source venv/bin/activate                # On Windows use `venv\Scripts\activate`
    # Ensure backend .env file is configured
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    The backend API will typically be available at `http://localhost:8000`.

2.  **Start the Frontend**:
    ```bash
    cd frontend-pwa
    # Ensure frontend .env file is configured
    npm run dev
    ```
    The frontend development server will typically be available at `http://localhost:5173` (or another port specified by Vite).

3.  **Access the Application**:
    Open the frontend URL (e.g., `http://localhost:5173`) in your web browser. As a PWA, you should see an option in your browser to "install" the application for a more native experience.

## Environment Variables

Environment variables are crucial for configuring the application without hardcoding sensitive information. Create `.env` files based on the `.env.example` files provided in the respective `backend-pwa` and `frontend-pwa` directories.

**Backend (`backend-pwa/.env`)**:
Configure necessary variables such as:
- `DATABASE_URL`: Connection string for your PostgreSQL database (e.g., `postgresql://user:password@host:port/dbname`).
- `AI_API_KEY`: API key for the AI service you are integrating.
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID (for backend validation).
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret (keep this secure, **never** commit to Git).
- `SECRET_KEY`: A secret key for signing tokens (e.g., JWT).
- `ALLOWED_ORIGINS`: CORS allowed origins (e.g., your frontend URL `http://localhost:5173`).
*(Check `backend-pwa/app/config.py` or similar for the exact variable names required)*

**Frontend (`frontend-pwa/.env`)**:
Configure necessary variables such as:
- `VITE_API_URL`: The base URL of your running backend API (e.g., `http://localhost:8000`).
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (used by the frontend Google login library).
*(Note: Never put secrets like `GOOGLE_CLIENT_SECRET` in frontend code or environment variables.)*

## API Endpoints

The backend provides several API endpoints. Key examples include:

- **Chat**: `POST /api/v1/chat` - Send user messages and get AI responses.
- **Conversations**: `GET /api/v1/conversations` - Retrieve user's conversation history.
- **Authentication**: `/api/v1/auth/...` - Endpoints related to Google OAuth2 login and user management.
- **Image Processing**: `/api/v1/images/...` - Endpoints for handling image uploads/processing (if implemented).

For a complete and interactive list of endpoints, run the backend server and navigate to `http://localhost:8000/docs` (or `/redoc`) in your browser to view the auto-generated Swagger UI/ReDoc documentation.

## License

This project is licensed under the MIT License. See the `LICENSE` file (if included) for details.
## Prerequisites
- **Python 3.8+**: For the backend server.
- **Node.js 18+**: For the frontend development and build process.
- **npm** (or **yarn**): Node package manager, typically included with Node.js.
- **PostgreSQL**: A running instance of the PostgreSQL database server.
- **Git**: For cloning the repository.

## Installation

1.  **Clone the repository**:
    ```bash
    # Replace <your-repository-url> with the actual URL of your repository
    git clone <your-repository-url>
    cd pwa-ai-assistant
    ```

2.  **Backend Setup**:
    ```bash
    cd backend-pwa
    python -m venv venv                     # Create a virtual environment
    source venv/bin/activate                # On Windows use `venv\Scripts\activate`
    pip install -r requirements.txt         # Install Python dependencies
    # Configure backend environment variables (see Environment Variables section)
    # cp .env.example .env
    # python init_db.py                     # Optional: Run script to initialize DB schema if needed
    cd ..
    ```
    *Note: Ensure your PostgreSQL server is running and accessible.*

3.  **Frontend Setup**:
    ```bash
    cd frontend-pwa
    npm install                             # Install Node.js dependencies
    # Configure frontend environment variables (see Environment Variables section)
    # cp .env.example .env
    cd ..
    ```

## Running the Application

1.  **Start the Backend**:
    ```bash
    cd backend-pwa
    source venv/bin/activate                # On Windows use `venv\Scripts\activate`
    # Ensure backend .env file is configured
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    The backend API will typically be available at `http://localhost:8000`.

2.  **Start the Frontend**:
    ```bash
    cd frontend-pwa
    # Ensure frontend .env file is configured
    npm run dev
    ```
    The frontend development server will typically be available at `http://localhost:5173` (or another port specified by Vite).

3.  **Access the Application**:
    Open the frontend URL (e.g., `http://localhost:5173`) in your web browser. As a PWA, you should see an option in your browser to "install" the application for a more native experience.

## Environment Variables

Environment variables are crucial for configuring the application without hardcoding sensitive information. Create `.env` files based on the `.env.example` files provided in the respective `backend-pwa` and `frontend-pwa` directories.

**Backend (`backend-pwa/.env`)**:
Configure necessary variables such as:
- `DATABASE_URL`: Connection string for your PostgreSQL database (e.g., `postgresql://user:password@host:port/dbname`).
- `AI_API_KEY`: API key for the AI service you are integrating.
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID (for backend validation).
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret (keep this secure, **never** commit to Git).
- `SECRET_KEY`: A secret key for signing tokens (e.g., JWT).
- `ALLOWED_ORIGINS`: CORS allowed origins (e.g., your frontend URL `http://localhost:5173`).
*(Check `backend-pwa/app/config.py` or similar for the exact variable names required)*

**Frontend (`frontend-pwa/.env`)**:
Configure necessary variables such as:
- `VITE_API_URL`: The base URL of your running backend API (e.g., `http://localhost:8000`).
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (used by the frontend Google login library).
*(Note: Never put secrets like `GOOGLE_CLIENT_SECRET` in frontend code or environment variables.)*

## API Endpoints

The backend provides several API endpoints. Key examples include:

- **Chat**: `POST /api/v1/chat` - Send user messages and get AI responses.
- **Conversations**: `GET /api/v1/conversations` - Retrieve user's conversation history.
- **Authentication**: `/api/v1/auth/...` - Endpoints related to Google OAuth2 login and user management.
- **Image Processing**: `/api/v1/images/...` - Endpoints for handling image uploads/processing (if implemented).

For a complete and interactive list of endpoints, run the backend server and navigate to `http://localhost:8000/docs` (or `/redoc`) in your browser to view the auto-generated Swagger UI/ReDoc documentation.

## License

This project is licensed under the MIT License. See the `LICENSE` file (if included) for details.
