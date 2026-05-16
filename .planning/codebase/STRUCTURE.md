# Structure Map

```text
.
├── .agent/              # AI Agent configuration and skills
├── .planning/           # GSD project planning and codebase intelligence
│   └── codebase/        # Structured documentation (current location)
├── backend/             # FastAPI Backend Service
│   ├── main.py          # Primary entry point and API definitions
│   └── requirements.txt # Python dependencies
├── frontend/            # React/Vite Frontend Application
│   ├── src/             # Application source code
│   │   ├── assets/      # Static assets (images, icons)
│   │   ├── components/  # Reusable UI components (Screener modules)
│   │   ├── App.jsx      # Main application layout and routing logic
│   │   ├── index.css    # Global styles and Tailwind imports
│   │   └── main.jsx     # Frontend entry point
│   ├── index.html       # HTML shell
│   ├── package.json     # Node.js dependencies and scripts
│   └── vite.config.js   # Vite build configuration
├── ml_pipeline/         # Machine Learning Engineering
│   ├── data/            # Local data storage (raw/processed)
│   ├── models/          # Trained pipeline artifacts (.joblib)
│   ├── generate_mock_data.py # Synthetic data generation for testing/POC
│   └── train_models.py  # Model training and evaluation logic
├── models/              # Legacy model storage or deployment symlinks
└── render.yaml          # Infrastructure as Code for Render deployment
```
