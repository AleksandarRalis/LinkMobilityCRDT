<?php

namespace App\Repositories\Interfaces;

use App\Models\DocumentEvent;

interface DocumentEventRepositoryInterface
{
    /**
     * Create a new document event.
     */
    public function create(array $data): DocumentEvent;
}

