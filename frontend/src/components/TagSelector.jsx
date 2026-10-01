import { useEffect, useRef, useState } from 'react';
import './TagSelector.css';

export default function TagSelector({
  availableTags,
  selectedTags,
  onChange,
  maxTags = 5,
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedIds = new Set(selectedTags.map((tag) => tag.id));

  const filteredTags = availableTags.filter((tag) => {
    const matchesSearch = tag.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    return matchesSearch && !selectedIds.has(tag.id);
  });

  const openDropdown = () => {
    setIsOpen(true);

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const handleAdd = (tag) => {
    if (selectedTags.length >= maxTags) return;

    onChange([...selectedTags, tag]);
    setSearch('');

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const handleRemove = (tagId) => {
    onChange(selectedTags.filter((tag) => tag.id !== tagId));

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
      return;
    }

    if (event.key === 'Enter' && filteredTags.length > 0) {
      event.preventDefault();
      handleAdd(filteredTags[0]);
    }
  };

  return (
    <div className="tag-selector" ref={wrapperRef}>
      <button
        type="button"
        className={`tag-selector-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={openDropdown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="tag-selector-trigger-content">
          {selectedTags.length > 0 ? (
            selectedTags.map((tag) => (
              <span key={tag.id} className="tag-pill">
                <span>{tag.name}</span>

                <span
                  role="button"
                  tabIndex={0}
                  className="tag-pill-remove"
                  aria-label={`Remove ${tag.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(tag.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      handleRemove(tag.id);
                    }
                  }}
                >
                  ×
                </span>
              </span>
            ))
          ) : (
            <span className="tag-selector-placeholder">
              Add tags...
            </span>
          )}
        </span>

        <span className="tag-selector-chevron" aria-hidden="true">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="tag-dropdown" role="listbox">
          <div className="tag-dropdown-search">
            <svg
              className="tag-search-icon"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path
                d="M13 13L17 17"
                strokeLinecap="round"
              />
            </svg>

            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tags..."
              className="tag-dropdown-search-input"
              autoComplete="off"
            />
          </div>

          <div className="tag-dropdown-divider" />

          {selectedTags.length >= maxTags ? (
            <div className="tag-dropdown-message">
              Maximum of {maxTags} tags reached.
            </div>
          ) : filteredTags.length > 0 ? (
            <ul className="tag-options">
              {filteredTags.map((tag) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    className="tag-option"
                    onClick={() => handleAdd(tag)}
                  >
                    <span>{tag.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="tag-dropdown-message">
              No matching tags found.
            </div>
          )}

          <div className="tag-dropdown-footer">
            {selectedTags.length} / {maxTags} selected
          </div>
        </div>
      )}
    </div>
  );
}