import { Folder, ChevronRight } from 'lucide-react';

interface FolderStructure {
  name: string;
  path: string;
  subfolders: FolderStructure[];
  photoCount: number;
}

interface FolderBrowserProps {
  folders: FolderStructure[];
  currentPath: string;
  onFolderSelect: (path: string) => void;
}

export default function FolderBrowser({
  folders,
  currentPath,
  onFolderSelect,
}: FolderBrowserProps) {
  const breadcrumbs = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean);

  const normalizePath = (path: string): string => path.replace(/\\/g, '/');

  const isPathInFolder = (folderPath: string): boolean => {
    const normalized = normalizePath(currentPath);
    const normalizedFolder = normalizePath(folderPath);
    return normalized === normalizedFolder || normalized.startsWith(normalizedFolder + '/');
  };

  const renderFolder = (folder: FolderStructure, level: number = 0) => {
    const isActive = currentPath === folder.path;
    const isOpen = isPathInFolder(folder.path);

    return (
      <div key={folder.path} className={level > 0 ? 'ml-4' : ''}>
        <button
          onClick={() => onFolderSelect(folder.path)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
            isActive
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'text-foreground hover:bg-white/5'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span className="flex-1">{folder.name}</span>
          <span className="text-xs text-muted-foreground">{folder.photoCount}</span>
        </button>

        {isOpen && folder.subfolders.length > 0 && (
          <div className="mt-2 space-y-1">
            {folder.subfolders.map((subfolder) => renderFolder(subfolder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={() => onFolderSelect('/')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
            currentPath === '/'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'text-foreground hover:bg-white/5'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Все фото</span>
        </button>
      </div>

      <div className="space-y-1">
        {folders.map((folder) => renderFolder(folder))}
      </div>

      {breadcrumbs.length > 0 && (
        <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground flex items-center gap-1">
          <span>Путь:</span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              {crumb}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
