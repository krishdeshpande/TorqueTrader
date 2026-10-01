import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getBlogPost,
  getBlogTags,
  createBlogPost,
  updateBlogPost,
  uploadBlogImage,
  apiBaseUrl,
} from '../api';
import { useAuth } from '../context/AuthContext';
import TiptapEditor from '../components/TiptapEditor';
import TagSelector from '../components/TagSelector';
import './CreateBlogPost.css';

export default function CreateBlogPost() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState({
    type: 'doc',
    content: [],
  });
  const [coverImageKey, setCoverImageKey] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    getBlogTags()
      .then((res) => setTags(res.data))
      .catch(console.error);

    if (isEditing) {
      getBlogPost(id)
        .then((res) => {
          if (user && res.data.author_id !== user.id) {
            return navigate('/blog');
          }

          setTitle(res.data.title);
          setContent(res.data.content);
          setCoverImageKey(res.data.cover_image_key || '');
          setSelectedTags(res.data.tags);
        })
        .catch(() => navigate('/blog'));
    }
  }, [id, isEditing, user, navigate]);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadBlogImage(file);
      setCoverImageKey(res.data.url);
    } catch (err) {
      alert('Failed to upload cover image');
    }
  };

  const handleImageUpload = async (file, editor) => {
    try {
      const res = await uploadBlogImage(file);

      const url = res.data.url.startsWith('http')
        ? res.data.url
        : `${apiBaseUrl}${res.data.url}`;

      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      alert('Failed to upload image');
    }
  };

  const handleSave = async (status) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      alert('Title is required');
      return;
    }

    if (selectedTags.length === 0) {
      alert('At least 1 tag is required');
      return;
    }

    setLoading(true);
    setSavingDraft(status === 'draft');

    const payload = {
      title: trimmedTitle,
      content,
      cover_image_key: coverImageKey,
      tag_ids: selectedTags.map((tag) => tag.id),
      status,
    };

    try {
      if (isEditing) {
        await updateBlogPost(id, payload);
      } else {
        await createBlogPost(payload);
      }

      navigate('/blog');
    } catch (err) {
      alert('Failed to save post');
    } finally {
      setLoading(false);
      setSavingDraft(false);
    }
  };

  if (!user) {
    return (
      <div className="container create-blog-auth-required">
        Please sign in to create a post.
      </div>
    );
  }

  const coverImageUrl = coverImageKey
    ? coverImageKey.startsWith('http')
      ? coverImageKey
      : `${apiBaseUrl}${coverImageKey}`
    : '';

  return (
    <main className="container create-blog-page">
      <header className="create-blog-header">
        <span className="create-blog-eyebrow">COMMUNITY BLOG</span>
        <h1>{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
        <p>
          Share your experience, knowledge, routes, builds, reviews, or stories
          with the TorqueTrader community.
        </p>
      </header>

      <div className="create-blog-form">
        {/* Title */}
        <section className="blog-field blog-title-field">
          <label className="blog-field-label" htmlFor="blog-title">
            TITLE <span className="required-mark">*</span>
          </label>

          <input
            id="blog-title"
            type="text"
            className="blog-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a title..."
            maxLength={255}
          />
        </section>

        {/* Cover Image */}
        <section className="blog-field">
          <div className="blog-field-label-row">
            <label className="blog-field-label">COVER IMAGE</label>
            <span className="blog-field-helper">Optional</span>
          </div>

          {coverImageUrl ? (
            <div className="cover-image-preview">
              <img src={coverImageUrl} alt="Post cover preview" />

              <div className="cover-image-overlay">
                <label className="cover-image-change">
                  Change image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleCoverUpload}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="cover-upload-card">
              <span className="cover-upload-icon">+</span>
              <span className="cover-upload-title">Add cover image</span>
              <span className="cover-upload-hint">
                JPG, PNG or WebP
              </span>

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleCoverUpload}
              />
            </label>
          )}
        </section>

        {/* Tags */}
        <section className="blog-field">
          <div className="blog-field-label-row">
            <div>
              <label className="blog-field-label">TAGS</label>
              <p className="blog-field-helper">
                Add 1-5 tags to help people find your post.
              </p>
            </div>
          </div>

          <TagSelector
            availableTags={tags}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        </section>

        {/* Content */}
        <section className="blog-field blog-content-field">
          <div className="blog-field-label-row">
            <label className="blog-field-label">CONTENT</label>
            <span className="blog-field-helper">Optional</span>
          </div>

          <TiptapEditor
            content={content}
            onUpdate={setContent}
            onImageUpload={handleImageUpload}
          />
        </section>

        {/* Actions */}
        <footer className="create-blog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSave('draft')}
            disabled={loading}
          >
            {savingDraft ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSave('published')}
            disabled={loading}
          >
            {loading && !savingDraft ? 'Publishing...' : 'Publish'}
          </button>
        </footer>
      </div>
    </main>
  );
}