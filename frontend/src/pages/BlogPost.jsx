import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBlogPost, deleteBlogPost, reportBlogPost, apiBaseUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import './BlogPost.css';

export default function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Image, LinkExt.configure({ openOnClick: true })],
    editable: false,
    content: {},
  });

  useEffect(() => {
    getBlogPost(id).then(res => {
      setPost(res.data);
      if (editor) editor.commands.setContent(res.data.content);
    }).catch(() => navigate('/blog')).finally(() => setLoading(false));
  }, [id, editor]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deleteBlogPost(id);
      navigate('/blog');
    }
  };

  const handleReport = async () => {
    if (reportReason.length < 10) return alert('Please provide a reason (min 10 chars)');
    try {
      await reportBlogPost(id, reportReason);
      alert('Report submitted. Thank you.');
      setShowReport(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to report');
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!post) return null;

  const isAuthor = user && user.id === post.author_id;

  return (
    <div className="container blog-post-page">
      <div className="blog-post-header">
        <h1>{post.title}</h1>
        <div className="blog-post-meta">
          <span>By {post.author.first_name || post.author.email.split('@')[0]}</span>
          <span>•</span>
          <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
        </div>
        <div className="blog-post-tags">
          {post.tags.map(tag => <span key={tag.id} className="badge badge-gray">{tag.name}</span>)}
        </div>
      </div>

      {post.cover_image_key && (
        <img src={post.cover_image_key.startsWith('http') ? post.cover_image_key : `${apiBaseUrl}${post.cover_image_key}`} alt="Cover" className="blog-post-cover" />
      )}

      <div className="tiptap-content">
        <EditorContent editor={editor} />
      </div>

      <div className="blog-post-actions">
        {isAuthor && (
          <>
            <Link to={`/blog/${id}/edit`} className="btn btn-secondary">Edit Post</Link>
            <button onClick={handleDelete} className="btn btn-ghost" style={{color: 'var(--accent)'}}>Delete</button>
          </>
        )}
        {user && !isAuthor && post.status === 'published' && (
          <button onClick={() => setShowReport(true)} className="btn btn-ghost">Report Post</button>
        )}
      </div>

      {showReport && (
        <div className="report-modal" onClick={() => setShowReport(false)}>
          <div className="report-box" onClick={e => e.stopPropagation()}>
            <h3>Report Post</h3>
            <textarea className="input" rows="4" value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Why are you reporting this post?" />
            <div style={{display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end'}}>
              <button className="btn btn-ghost" onClick={() => setShowReport(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReport}>Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}