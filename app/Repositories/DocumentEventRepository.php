<?php

namespace App\Repositories;

use App\Models\DocumentEvent;
use App\Repositories\Interfaces\DocumentEventRepositoryInterface;

class DocumentEventRepository implements DocumentEventRepositoryInterface
{
    public function __construct(
        protected DocumentEvent $model
    ) {}

    /**
     * Create a new document event.
     */
    public function create(array $data): DocumentEvent
    {
        return $this->model->create($data);
    }
}

