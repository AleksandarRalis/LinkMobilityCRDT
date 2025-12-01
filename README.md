# CollabDocs - Real-time Collaborative Document Editor

A real-time collaborative document editor built with Laravel and React, featuring CRDT-based conflict resolution for seamless multi-user editing.

![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat-square&logo=php)

## ✨ Features

- **Real-time Collaboration** - Multiple users can edit the same document simultaneously
- **CRDT Conflict Resolution** - Uses Yjs for automatic conflict-free merging of changes
- **Version History** - Browse and restore previous versions of documents
- **Document Sharing** - Share documents with other users by email
- **Live Presence** - See who's currently viewing/editing a document
- **JWT Authentication** - Secure authentication with HTTP-only cookies
- **Rich Text Editor** - Full-featured editor with formatting options (Tiptap)

## 🛠 Tech Stack

**Backend:**
- Laravel 12 (PHP 8.2+)
- Laravel Reverb (WebSockets)
- JWT Authentication
- MySQL & Redis

**Frontend:**
- React 19
- Tiptap Editor
- Yjs (CRDT)
- Tailwind CSS 4

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

> **Note:** The `.env` file is intentionally included in the repository for easy setup.

### ⚠️ Port Conflicts

If you encounter errors during container startup due to ports already being in use (e.g., MySQL on 3306, Redis on 6379), you need to stop the local services occupying those ports:

Alternatively, you can modify the port mappings in `docker-compose.yml` to use different host ports.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LinkMobilityCRDT
   ```

2. **Build and start Docker containers**
   ```bash
   ./vendor/bin/sail build
   ./vendor/bin/sail up -d
   ```

3. **Install PHP dependencies**
   ```bash
   ./vendor/bin/sail composer install
   ```

4. **Run database migrations**
   ```bash
   ./vendor/bin/sail php artisan migrate
   ```

5. **Install Node.js dependencies**
   ```bash
   ./vendor/bin/sail npm install
   ```

6. **Start the Vite development server** (in a separate terminal)
   ```bash
   ./vendor/bin/sail npm run dev
   ```

7. **Start the WebSocket server** (in a separate terminal)
   ```bash
   ./vendor/bin/sail php artisan reverb:start
   ```

### Access the Application

- **App:** http://localhost
## 📖 Usage

1. **Register** a new account or **Login** with existing credentials
2. **Create** a new document from the dashboard
3. **Share** documents with other users using their email address
4. **Collaborate** in real-time - changes sync automatically
5. **View history** to see previous versions and restore if needed

## 🏗 Architecture

```
app/
├── Http/
│   ├── Controllers/Api/    # API endpoints
│   └── Requests/           # Form validation
├── Models/                 # Eloquent models
├── Repositories/           # Data access layer
│   └── Interfaces/         # Repository contracts
├── Services/               # Business logic
└── Providers/              # Service providers

resources/js/
├── components/             # React components
├── contexts/               # React context providers
├── hooks/                  # Custom React hooks
├── pages/                  # Page components
├── services/               # API service layer
└── utils/                  # Utility functions
```

## 🔮 Future Improvements

The following improvements were intentionally omitted to keep the codebase simple and avoid over-engineering for a demo project. However, they would be recommended for a production application:

### Backend Architecture

| Improvement | Description | Benefit |
|-------------|-------------|---------|
| **DTOs (Data Transfer Objects)** | Create dedicated DTO classes for data passed between layers (e.g., `CreateDocumentDTO`, `ShareDocumentDTO`) | Type safety, validation at boundaries, cleaner service signatures |
| **API Resources** | Use Laravel's `JsonResource` classes for all API responses | Consistent JSON structure, transformation logic centralized, easier versioning |
| **Enums for Database Columns** | Create PHP 8.1+ Enum for `event_type` column (`DocumentEventType::Update`, `::Snapshot`, `::Restore`) | Type safety, IDE autocompletion, prevents invalid values |
| **Constants/Config Classes** | Move magic numbers to config files or constant classes (e.g., `SNAPSHOT_UPDATE_THRESHOLD`, `SAVE_DEBOUNCE_MS`) | Single source of truth, easier configuration |
| **Action Classes** | Single-responsibility action classes for complex operations (e.g., `ShareDocumentAction`, `RestoreVersionAction`) | Testable, reusable, follows SRP |
| **Laravel Policies** | Use policy classes for authorization instead of inline checks in services | Centralized authorization, cleaner code, reusable rules |
| **Events & Listeners** | Dispatch events for significant actions (e.g., `DocumentShared`, `VersionRestored`) | Decoupling, async processing, audit logging |
| **Query Objects/Scopes** | Extract complex queries into dedicated query classes or Eloquent scopes | Reusable queries, testable, cleaner repositories |

### Testing & Documentation

| Improvement | Description |
|-------------|-------------|
| **Feature Tests** | Comprehensive API endpoint testing with authentication flows |
| **Unit Tests** | Service layer testing with mocked repositories |
| **API Documentation** | OpenAPI/Swagger specification for API endpoints |
| **PHPStan/Larastan** | Static analysis for type safety at level 8+ |

### Infrastructure & Security

| Improvement | Description |
|-------------|-------------|
| **Rate Limiting** | Throttle authentication endpoints to prevent brute force |
| **Request Logging** | Structured logging for debugging and audit trails |
| **Error Tracking** | Integration with Sentry or similar for production monitoring |
| **Caching Layer** | Redis caching for frequently accessed documents |
| **Queue Workers** | Offload heavy operations (snapshots, notifications) to background jobs |

### Frontend

| Improvement | Description |
|-------------|-------------|
| **TypeScript** | Add type safety to React components and hooks |
| **Error Boundaries** | Graceful error handling at component level |

> **Note:** The current implementation follows clean architecture principles (Controllers → Services → Repositories) with dependency injection, which provides a solid foundation for adding these improvements incrementally.
