import { useState, useEffect, useRef } from 'react';
import './TagSelector.css';

export default function TagSelector({ availableTags, selectedTags, onChange, maxTags = 5 }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredTags = availableTags.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) && !selectedTags.find(st => st.id === t.id)
  );

  const handleAdd = (tag) => {
    if (selectedTags.length < maxTags) {
      onChange([...selectedTags, tag]);
      setSearch('');
    }
  };

  const handleRemove = (tagId) => onChange(selectedTags.filter(t => t.id !== tagId));

  return (
    <div className="tag-selector" ref={wrapperRef}>
      <div className="selected-tags">
        {selectedTags.map(tag => (
          <span key={tag.id} className="tag-pill">
            {tag.name}
            <button type="button" onClick={() => handleRemove(tag.id)}>&times;</button>
          </span>
        ))}
        <input 
          type="text" className="tag-search-input"
          placeholder={selectedTags.length >= maxTags ? "Max tags reached" : "Search tags..."}
          value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => setIsOpen(true)}
          disabled={selectedTags.length >= maxTags}
        />
      </div>
      {isOpen && filteredTags.length > 0 && (
        <ul className="tag-dropdown">
          {filteredTags.map(tag => (
            <li key={tag.id} onClick={() => handleAdd(tag)}>{tag.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}