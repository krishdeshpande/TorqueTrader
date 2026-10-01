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
      Placeholder.configure({
        placeholder: 'Body text (optional)',
      }),
    ],
    content,
    onUpdate: ({ editor: currentEditor }) => {
      onUpdate(currentEditor.getJSON());
    },
  });

  if (!editor) return null;

  const runCommand = (command) => {
    command();
    editor.commands.focus();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL', previousUrl);

    if (url === null) return;

    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url.trim() })
      .run();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      onImageUpload(file, editor);
    }

    event.target.value = '';
  };

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-content">
        <EditorContent editor={editor} />
      </div>

      <div className="tiptap-toolbar" role="toolbar" aria-label="Formatting tools">
        <div className="tiptap-toolbar-group">
          <button
            type="button"
            className={editor.isActive('bold') ? 'is-active' : ''}
            onClick={() =>
              runCommand(() => editor.chain().toggleBold().run())
            }
            aria-label="Bold"
            title="Bold"
          >
            <strong>B</strong>
          </button>

          <button
            type="button"
            className={editor.isActive('italic') ? 'is-active' : ''}
            onClick={() =>
              runCommand(() => editor.chain().toggleItalic().run())
            }
            aria-label="Italic"
            title="Italic"
          >
            <em>I</em>
          </button>
        </div>

        <span className="tiptap-toolbar-divider" />

        <div className="tiptap-toolbar-group">
          <button
            type="button"
            className={
              editor.isActive('heading', { level: 1 }) ? 'is-active' : ''
            }
            onClick={() =>
              runCommand(() =>
                editor.chain().toggleHeading({ level: 1 }).run()
              )
            }
            aria-label="Heading 1"
            title="Heading 1"
          >
            H1
          </button>

          <button
            type="button"
            className={
              editor.isActive('heading', { level: 2 }) ? 'is-active' : ''
            }
            onClick={() =>
              runCommand(() =>
                editor.chain().toggleHeading({ level: 2 }).run()
              )
            }
            aria-label="Heading 2"
            title="Heading 2"
          >
            H2
          </button>

          <button
            type="button"
            className={
              editor.isActive('heading', { level: 3 }) ? 'is-active' : ''
            }
            onClick={() =>
              runCommand(() =>
                editor.chain().toggleHeading({ level: 3 }).run()
              )
            }
            aria-label="Heading 3"
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <span className="tiptap-toolbar-divider" />

        <div className="tiptap-toolbar-group">
          <button
            type="button"
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            onClick={() =>
              runCommand(() => editor.chain().toggleBulletList().run())
            }
            aria-label="Bullet list"
            title="Bullet list"
          >
            <span className="toolbar-icon">☷</span>
          </button>

          <button
            type="button"
            className={editor.isActive('orderedList') ? 'is-active' : ''}
            onClick={() =>
              runCommand(() => editor.chain().toggleOrderedList().run())
            }
            aria-label="Numbered list"
            title="Numbered list"
          >
            <span className="toolbar-numbered-icon">1.</span>
          </button>

          <button
            type="button"
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            onClick={() =>
              runCommand(() => editor.chain().toggleBlockquote().run())
            }
            aria-label="Blockquote"
            title="Blockquote"
          >
            <span className="toolbar-quote-icon">“</span>
          </button>
        </div>

        <span className="tiptap-toolbar-divider" />

        <div className="tiptap-toolbar-group">
          <button
            type="button"
            onClick={() =>
              runCommand(() => editor.chain().setHorizontalRule().run())
            }
            aria-label="Horizontal rule"
            title="Horizontal rule"
          >
            <span className="toolbar-rule-icon">—</span>
          </button>

          <button
            type="button"
            className={editor.isActive('link') ? 'is-active' : ''}
            onClick={setLink}
            aria-label="Add link"
            title="Add link"
          >
            <span className="toolbar-link-icon">↗</span>
          </button>

          <label
            className="tiptap-toolbar-button"
            aria-label="Add image"
            title="Add image"
          >
            <span className="toolbar-image-icon">▧</span>

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}