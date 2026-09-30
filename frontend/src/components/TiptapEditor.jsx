import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import './TiptapEditor.css';

export default function TiptapEditor({ content, onUpdate, onImageUpload }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write your story...' }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
  });

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>" Quote</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>— HR</button>
        <button 
          type="button" 
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={editor.isActive('link') ? 'is-active' : ''}
        >🔗 Link</button>
        <label className="tiptap-image-btn">
          🖼️ Image
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onImageUpload(e.target.files[0], editor);
              }
            }} 
          />
        </label>
      </div>
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}