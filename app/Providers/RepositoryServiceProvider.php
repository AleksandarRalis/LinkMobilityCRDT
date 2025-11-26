<?php

namespace App\Providers;

use App\Repositories\DocumentEventRepository;
use App\Repositories\DocumentRepository;
use App\Repositories\DocumentVersionRepository;
use App\Repositories\Interfaces\DocumentEventRepositoryInterface;
use App\Repositories\Interfaces\DocumentRepositoryInterface;
use App\Repositories\Interfaces\DocumentVersionRepositoryInterface;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Repositories\UserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(DocumentRepositoryInterface::class, DocumentRepository::class);
        $this->app->bind(DocumentEventRepositoryInterface::class, DocumentEventRepository::class);
        $this->app->bind(DocumentVersionRepositoryInterface::class, DocumentVersionRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}

