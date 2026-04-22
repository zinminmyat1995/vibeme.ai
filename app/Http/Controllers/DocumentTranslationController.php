<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Folder;
use App\Models\DocumentDownload;
use App\Services\TranslationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DocumentTranslationController extends Controller
{
    public function __construct(private TranslationService $translator) {}

    // ── Index ──────────────────────────────
    public function index()
    {
        $user    = auth()->user();
        $folders = Folder::with(['children.children', 'documents'])
            ->visibleTo($user)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->get();

        $documents = Document::with(['user', 'folder'])
            ->visibleTo($user)
            ->whereNull('folder_id')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($d) => $this->formatDocument($d));

        $allDocs = Document::visibleTo($user)->get();

        return Inertia::render('DocumentTranslation', [
            'folders'   => $folders->map(fn($f) => $this->formatFolder($f)),
            'documents' => $documents,
            'hasApi'    => $this->translator->hasApiKey(),
            'languages' => $this->getLanguages(),
            'stats' => [
                'total'       => $allDocs->count(),
                'completed'   => $allDocs->where('status', 'completed')->count(),
                'translating' => $allDocs->where('status', 'translating')->count(),
                'failed'      => $allDocs->where('status', 'failed')->count(),
            ],
        ]);
    }

    // ── Folder CRUD ────────────────────────
    public function storeFolder(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id'   => 'nullable|exists:folders,id',
            'visibility'  => 'required|in:private,branch,all',
            'color'       => 'nullable|string|max:7',
            'icon'        => 'nullable|string',
        ]);

        // Depth check — max 3
        $depth = 1;
        if ($request->parent_id) {
            $parent = Folder::findOrFail($request->parent_id);
            $depth  = $parent->depth + 1;
            if ($depth > 3) {
                return back()->withErrors(['parent_id' => 'Maximum folder depth is 3 levels.']);
            }
        }

        Folder::create([
            'user_id'     => auth()->id(),
            'parent_id'   => $request->parent_id,
            'name'        => $request->name,
            'description' => $request->description,
            'visibility'  => $request->visibility,
            'branch'      => auth()->user()->branch,
            'depth'       => $depth,
            'color'       => $request->color ?? '#7c3aed',
            'icon'        => $request->icon ?? '📁',
        ]);

        return back()->with('success', 'Folder created successfully!');
    }

    public function updateFolder(Request $request, Folder $folder)
    {
        if (!$folder->canEdit(auth()->user())) {
            return back()->withErrors(['error' => 'Permission denied.']);
        }

        $request->validate([
            'name'       => 'required|string|max:255',
            'visibility' => 'required|in:private,branch,all',
            'color'      => 'nullable|string|max:7',
            'icon'       => 'nullable|string',
        ]);

        $folder->update($request->only('name', 'description', 'visibility', 'color', 'icon'));

        return back()->with('success', 'Folder updated successfully!');
    }

    public function destroyFolder(Folder $folder)
    {
        if (!$folder->canDelete(auth()->user())) {
            return back()->withErrors(['error' => 'Permission denied.']);
        }

        // folder ထဲက files တွေ storage ကနေ ဖျက်
        $this->deleteFolderFiles($folder);
        $folder->delete();

        return back()->with('success', 'Folder deleted successfully!');
    }

    // ── Document Upload ────────────────────
    public function upload(Request $request)
    {
        $request->validate([
            'file'             => 'required|file|max:20480|mimes:pdf,docx,doc,txt,png,jpg,jpeg',
            'folder_id'        => 'nullable|exists:folders,id',
            'source_language'  => 'required|in:en,ja,my,km,vi,ko',
            'target_languages' => 'nullable|array',
            'visibility'       => 'required|in:private,branch,all',
            'tags'             => 'nullable|string',
        ]);

        $file      = $request->file('file');
        $slug      = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $ext       = $file->getClientOriginalExtension();
        $fileName  = $slug . '-' . time() . '.' . $ext;
        $path      = $file->storeAs('documents/original', $fileName, 'public');

        $tags = $request->tags
            ? array_map('trim', explode(',', $request->tags))
            : [];

        $document = Document::create([
            'user_id'          => auth()->id(),
            'folder_id'        => $request->folder_id,
            'original_filename'=> $file->getClientOriginalName(),
            'storage_path'     => $path,
            'file_type'        => $ext,
            'file_size'        => $file->getSize(),
            'source_language'  => $request->source_language,
            'target_languages' => $request->target_languages ?? [],
            'visibility'       => $request->visibility,
            'branch'           => auth()->user()->branch,
            'tags'             => $tags,
            'status'           => 'pending',
        ]);

        $targetLanguages = $request->target_languages ?? [];

        if ($this->translator->hasApiKey() && !empty($targetLanguages)) {
            $this->translateDocument($document);
        } else {
            $document->update(['status' => 'completed']);
        }

        return back()->with('success', 'File uploaded successfully!');
    }

    // ── Download ───────────────────────────
    public function download(Document $document, string $language = 'original')
    {
        // API မရှိရင် / original ဆိုရင် → original file
        if ($language === 'original' || !$this->translator->hasApiKey()) {
            $this->logDownload($document, 'original');
            return Storage::disk('public')->download(
                $document->storage_path,
                $document->original_filename
            );
        }

        // Translation ရှိရင် → translated file
        if ($document->hasTranslation($language)) {
            $this->logDownload($document, $language);
            $langs    = $this->getLanguages();
            $langName = $langs[$language] ?? $language;
            $filename = pathinfo($document->original_filename, PATHINFO_FILENAME)
                      . "_{$langName}."
                      . pathinfo($document->storage_path, PATHINFO_EXTENSION);

            return Storage::disk('public')->download(
                $document->translated_paths[$language],
                $filename
            );
        }

        // Translation မရှိသေးရင် → original
        $this->logDownload($document, 'original');
        return Storage::disk('public')->download(
            $document->storage_path,
            $document->original_filename
        );
    }

    // ── Delete Document ────────────────────
    public function destroyDocument(Document $document)
    {
        if (!$document->canDelete(auth()->user())) {
            return back()->withErrors(['error' => 'Permission denied.']);
        }

        // Original file ဖျက်
        Storage::disk('public')->delete($document->storage_path);

        // Translated files ဖျက်
        if ($document->translated_paths) {
            foreach ($document->translated_paths as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        $document->delete();
        return back()->with('success', 'Document deleted successfully!');
    }

    // ── Get Folder Documents ───────────────
    public function folderContents(Folder $folder)
    {
        $user      = auth()->user();
        $subFolders = Folder::with('documents')
            ->visibleTo($user)
            ->where('parent_id', $folder->id)
            ->get()
            ->map(fn($f) => $this->formatFolder($f));

        $documents = Document::with(['user', 'folder'])
            ->visibleTo($user)
            ->where('folder_id', $folder->id)
            ->get()
            ->map(fn($d) => $this->formatDocument($d));

        return response()->json([
            'folder'    => $this->formatFolder($folder),
            'subFolders'=> $subFolders,
            'documents' => $documents,
        ]);
    }

    // ── Private Helpers ────────────────────
private function translateDocument(Document $document): void
{
    // ── Translatable file types သာ translate လုပ် ──
    $translatableTypes = ['txt', 'html', 'htm', 'csv', 'md', 'doc', 'docx'];
    $fileExt = strtolower(pathinfo($document->storage_path, PATHINFO_EXTENSION));

    if (!in_array($fileExt, $translatableTypes)) {
        // Image/binary files → translate မလုပ်
        $document->update(['status' => 'completed']);
        \Log::info("⏭️ Skipped translation (binary file): {$document->original_filename}");
        return;
    }

    $document->update(['status' => 'translating']);

    try {
        $content = Storage::disk('public')->get($document->storage_path);

        // UTF-8 valid check
        if (!mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'auto');
        }

        $translatedPaths = [];
        $totalUsage = ['input_tokens' => 0, 'output_tokens' => 0];

        foreach ($document->target_languages as $lang) {
            [$translated, $usage] = $this->translator->translateWithUsage($content, $lang);

            if ($usage) {
                $totalUsage['input_tokens']  += $usage['input_tokens'];
                $totalUsage['output_tokens'] += $usage['output_tokens'];
                $inputCost  = ($usage['input_tokens']  / 1_000_000) * 15;
                $outputCost = ($usage['output_tokens'] / 1_000_000) * 75;
                \Log::info("📄 Document Translate → {$lang} [{$document->original_filename}]", [
                    'input_tokens'  => $usage['input_tokens'],
                    'output_tokens' => $usage['output_tokens'],
                    'total_tokens'  => $usage['input_tokens'] + $usage['output_tokens'],
                    'cost_usd'      => '$' . number_format($inputCost + $outputCost, 6),
                ]);
            }

            $slug     = Str::slug(pathinfo($document->original_filename, PATHINFO_FILENAME));
            $ext      = pathinfo($document->storage_path, PATHINFO_EXTENSION);
            $fileName = $slug . '-' . $lang . '-' . time() . '.' . $ext;
            $path     = 'documents/translated/' . $fileName;
            Storage::disk('public')->put($path, $translated);
            $translatedPaths[$lang] = $path;
        }

        if ($totalUsage['input_tokens'] > 0) {
            $totalInput  = ($totalUsage['input_tokens']  / 1_000_000) * 15;
            $totalOutput = ($totalUsage['output_tokens'] / 1_000_000) * 75;
            \Log::info("💰 Document Translation TOTAL [{$document->original_filename}]", [
                'total_cost_usd' => '$' . number_format($totalInput + $totalOutput, 6),
            ]);
        }

        $document->update([
            'status'           => 'completed',
            'translated_paths' => $translatedPaths,
        ]);

    } catch (\Exception $e) {
        \Log::error('Translation failed: ' . $e->getMessage());
        $document->update(['status' => 'failed']);
    }
}

    private function deleteFolderFiles(Folder $folder): void
    {
        foreach ($folder->documents as $doc) {
            Storage::disk('public')->delete($doc->storage_path);
            if ($doc->translated_paths) {
                foreach ($doc->translated_paths as $path) {
                    Storage::disk('public')->delete($path);
                }
            }
        }
        foreach ($folder->children as $child) {
            $this->deleteFolderFiles($child);
        }
    }

    private function logDownload(Document $document, string $language): void
    {
        DocumentDownload::create([
            'document_id' => $document->id,
            'user_id'     => auth()->id(),
            'language'    => $language,
            'ip_address'  => request()->ip(),
        ]);
    }

    private function formatFolder(Folder $folder): array
    {
        $user = auth()->user();
        return [
            'id'          => $folder->id,
            'name'        => $folder->name,
            'description' => $folder->description,
            'parent_id'   => $folder->parent_id,
            'visibility'  => $folder->visibility,
            'color'       => $folder->color,
            'icon'        => $folder->icon,
            'depth'       => $folder->depth,
            'canEdit'     => $folder->canEdit($user),
            'canDelete'   => $folder->canDelete($user),
            'children'    => $folder->children->map(fn($f) => $this->formatFolder($f)),
            'documentCount' => $folder->documents->count(),
            'created_at'  => $folder->created_at->format('d M Y'),
        ];
    }

    private function formatDocument(Document $document): array
    {
        $user = auth()->user();
        return [
            'id'                => $document->id,
            'original_filename' => $document->original_filename,
            'file_type'         => $document->file_type,
            'file_size'         => $document->getFileSizeFormatted(),
            'source_language'   => $document->source_language,
            'target_languages'  => $document->target_languages ?? [],
            'translated_paths'  => array_keys($document->translated_paths ?? []),
            'status'            => $document->status,
            'tags'              => $document->tags ?? [],
            'visibility'        => $document->visibility,
            'folder_id'         => $document->folder_id,
            'canEdit'           => $document->canEdit($user),
            'canDelete'         => $document->canDelete($user),
            'uploader'          => $document->user->name ?? '',
            'created_at'        => $document->created_at->format('d M Y'),
        ];
    }

    private function getLanguages(): array
    {
        return [
            'en' => 'English',
            'ja' => 'Japanese',
            'my' => 'Burmese',
            'km' => 'Khmer',
            'vi' => 'Vietnamese',
            'ko' => 'Korean',
        ];
    }
}