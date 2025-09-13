'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from './input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export function TagInput({ value, onChange, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue.trim());
    }
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  useEffect(() => {
    if (inputValue && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, filteredSuggestions]);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 rounded-md border border-input p-2">
        {value.map((tag) => (
          <div key={tag} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-sm">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full hover:bg-destructive/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          className="flex-1 border-0 shadow-none focus-visible:ring-0"
        />
      </div>
      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
          <ul className="max-h-60 overflow-auto rounded-md py-1 text-sm">
            {filteredSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className="cursor-pointer px-3 py-2 hover:bg-accent"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
