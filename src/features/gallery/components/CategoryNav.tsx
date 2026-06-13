import { useTranslation } from 'react-i18next';
import type { GalleryFolder } from '../types';

interface CategoryNavProps {
  folders: GalleryFolder[];
  currentPath: string;
  onSelect: (path: string) => void;
}

const normalize = (path: string) => path.replace(/\\/g, '/');

export default function CategoryNav({ folders, currentPath, onSelect }: CategoryNavProps) {
  const { t } = useTranslation('gallery');
  const normalizedCurrent = normalize(currentPath);

  const isActive = (path: string) => normalizedCurrent === normalize(path);

  const isAncestorActive = (folder: GalleryFolder) =>
    normalizedCurrent.startsWith(`${normalize(folder.path)}/`);

  const activeFolder = folders.find((folder) => isActive(folder.path) || isAncestorActive(folder));

  return (
    <nav className="flex flex-col gap-1 text-sm" aria-label={t('categoryNav.ariaLabel')}>
      <p className="flex flex-wrap gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => onSelect('/')}
          className={
            currentPath === '/'
              ? 'text-primary'
              : 'text-foreground/90 transition-colors hover:text-primary'
          }
        >
          {t('categoryNav.all')}
        </button>
        {folders.map((folder) => (
          <button
            key={folder.path}
            type="button"
            onClick={() => onSelect(folder.path)}
            className={
              isActive(folder.path) || isAncestorActive(folder)
                ? 'text-primary'
                : 'text-foreground/90 transition-colors hover:text-primary'
            }
          >
            [{folder.name}]
          </button>
        ))}
      </p>

      {activeFolder && activeFolder.subfolders.length > 0 && (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {activeFolder.subfolders.map((subfolder) => (
            <button
              key={subfolder.path}
              type="button"
              onClick={() => onSelect(subfolder.path)}
              className={
                isActive(subfolder.path)
                  ? 'text-primary'
                  : 'text-muted-foreground transition-colors hover:text-primary'
              }
            >
              [{subfolder.name}]
            </button>
          ))}
        </p>
      )}
    </nav>
  );
}
