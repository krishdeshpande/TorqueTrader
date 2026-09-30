import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBlogPost, getBlogTags, createBlogPost, updateBlogPost, uploadBlogImage, apiBaseUrl } from '../api';
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
  const [content, setContent] = useState({ type: 'doc', content: [] });
  const [coverImageKey, setCoverImageKey] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    getBlogTags().then(res => setTags(res.data)).catch(console.error);
    if (isEditing) {
      getBlogPost(id).then(res => {
        if (user && res.data.author_id !== user.id) return navigate('/blog');
        setTitle(res.data.title);
        setContent(res.data.content);
        setCoverImageKey(res.data.cover_image_key || '');
        setSelectedTags(res.data.tags);
      }).catch(() => navigate('/blog'));
    }
  }, [id, isEditing, user, navigate]);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadBlogImage(file);
      setCoverImageKey(res.data.url);
    } catch (err) { alert('Failed to upload cover image'); }
  };

  const handleImageUpload = async (file, editor) => {
    try {
      const res = await uploadBlogImage(file);
      const url = res.data.url.startsWith('http') ? res.data.url : `${apiBaseUrl}${res.data.url}`;
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) { alert('Failed to upload image'); }
  };

  const handleSave = async (status) => {
    if (!title.trim()) return alert('Title is required');
    if (selectedTags.length === 0) return alert('At least 1 tag is required');
    
    setLoading(true);
    setSavingDraft(status === 'draft');
    
    const payload = {
      title, content, cover_image_key: coverImageKey,
      tag_ids: selectedTags.map(t => t.id), status
    };

    try {
      if (isEditing) await updateBlogPost(id, payload);
      else await createBlogPost(payload);
      navigate('/blog');
    } catch (err) { alert('Failed to save post'); } 
    finally { setLoading(false); setSavingDraft(false); }
  };

  if (!user) return <div className="container" style={{padding: '40px 0'}}>Please sign in to create a post.</div>;

  return (
    <div className="container create-blog-page">
      <h1>{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
      
      <div className="form-group">
        <label className="form-label">Title</label>
        <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter a compelling title..." />
      </div>

      <div className="form-group">
        <label className="form-label">Cover Image (Optional)</label>
        <input type="file" accept="image/*" onChange={handleCoverUpload} />
        {coverImageKey && (
          <img src={coverImageKey.startsWith('http') ? coverImageKey : `${apiBaseUrl}${coverImageKey}`} alt="Cover" className="cover-preview" />
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Tags (1 to 5 required)</label>
        <TagSelector availableTags={tags} selectedTags={selectedTags} onChange={setSelectedTags} />
      </div>

      <div className="form-group">
        <label className="form-label">Content</label>
        <TiptapEditor content={content} onUpdate={setContent} onImageUpload={handleImageUpload} />
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={loading}>
          {savingDraft ? 'Saving...' : 'Save Draft'}
        </button>
        <button className="btn btn-primary" onClick={() => handleSave('published')} disabled={loading}>
          {loading && !savingDraft ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}