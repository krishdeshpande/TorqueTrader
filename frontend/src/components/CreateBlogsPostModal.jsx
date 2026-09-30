import { useState, useEffect } from 'react';
import { getBlogTags, createBlogPost, uploadBlogImage, apiBaseUrl } from '../api';
import TiptapEditor from './TiptapEditor';
import TagSelector from './TagSelector';
import './CreateBlogPostModal.css';

export default function CreateBlogPostModal({ onClose, onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState({ type: 'doc', content: [] });
  const [coverImageKey, setCoverImageKey] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getBlogTags().then(res => setTags(res.data)).catch(console.error);
  }, []);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadBlogImage(file);
      setCoverImageKey(res.data.url);
    } catch (err) { 
      setErrors({ ...errors, cover: 'Failed to upload cover image' }); 
    }
  };

  const handleImageUpload = async (file, editor) => {
    try {
      const res = await uploadBlogImage(file);
      const url = res.data.url.startsWith('http') ? res.data.url : `${apiBaseUrl}${res.data.url}`;
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) { 
      alert('Failed to upload image'); 
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!content.content || content.content.length === 0) newErrors.content = 'Content is required';
    if (selectedTags.length === 0) newErrors.tags = 'At least 1 tag is required';
    if (selectedTags.length > 5) newErrors.tags = 'Maximum 5 tags allowed';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        content,
        cover_image_key: coverImageKey,
        tag_ids: selectedTags.map(t => t.id),
        status: 'published'
      };
      await createBlogPost(payload);
      onPostCreated();
      onClose();
    } catch (err) { 
      setErrors({ ...errors, submit: 'Failed to publish post' }); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box create-blog-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Create New Post</h2>
            <p className="modal-subtitle">Share your automotive experience with the community</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          <div className="form-group">
            <label className="form-label">Post Title *</label>
            <input
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title..."
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Tags * (1-5 required)</label>
            <TagSelector
              availableTags={tags}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              maxTags={5}
            />
            {errors.tags && <span className="error-text">{errors.tags}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Cover Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="file-input"
            />
            {coverImageKey && (
              <div className="cover-preview-container">
                <img
                  src={coverImageKey.startsWith('http') ? coverImageKey : `${apiBaseUrl}${coverImageKey}`}
                  alt="Cover preview"
                  className="cover-preview"
                />
                <button
                  type="button"
                  className="remove-cover-btn"
                  onClick={() => setCoverImageKey('')}
                >
                  Remove
                </button>
              </div>
            )}
            {errors.cover && <span className="error-text">{errors.cover}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Content *</label>
            <div className={errors.content ? 'editor-error' : ''}>
              <TiptapEditor
                content={content}
                onUpdate={setContent}
                onImageUpload={handleImageUpload}
              />
            </div>
            {errors.content && <span className="error-text">{errors.content}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={loading}
          >
            {loading ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}