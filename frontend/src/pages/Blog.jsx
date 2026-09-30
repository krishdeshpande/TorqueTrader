import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getBlogPosts, getBlogTags, apiBaseUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import './Blog.css';

export default function Blog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  const searchQuery = searchParams.get('search') || '';
  const tagQuery = searchParams.get('tag') || '';

  const fetchPosts = () => {
    setLoading(true);
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (tagQuery) params.tag = tagQuery;
    getBlogPosts(params)
      .then(res => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getBlogTags().then(res => setTags(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [searchQuery, tagQuery]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const getExcerpt = (content) => {
    if (!content || !content.content) return '';
    const text = [];
    const extractText = (node) => {
      if (node.type === 'text') text.push(node.text);
      if (node.content) node.content.forEach(extractText);
    };
    content.content.forEach(extractText);
    return text.join(' ').substring(0, 150) + (text.join(' ').length > 150 ? '...' : '');
  };

  return (
    <div className="container blog-page">
      <div className="blog-hero">
        <div className="blog-hero-content">
          <h1 className="blog-hero-title">Community Blog</h1>
          <p className="blog-hero-subtitle">
            Experiences, guides, and discussions from the TorqueTrader community.
            Share your automotive journey and learn from fellow enthusiasts.
          </p>
          {user && (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/blog/create')}
            >
              Create Post
            </button>
          )}
        </div>
      </div>

      <div className="blog-filters-section">
        <div className="blog-filters">
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <input
              type="text"
              className="input search-input"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">Filter by Tag</label>
            <select
              className="input tag-filter"
              value={tagQuery}
              onChange={(e) => updateFilter('tag', e.target.value)}
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.slug}>{tag.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No posts found</h3>
          <p>Be the first to share your automotive story with the community!</p>
          {user && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/blog/create')}
            >
              Create Your First Post
            </button>
          )}
        </div>
      ) : (
        <div className="blog-grid">
          {posts.map(post => (
            <Link to={`/blog/${post.id}`} key={post.id} className="blog-card">
              {post.cover_image_key && (
                <div className="blog-card-image">
                  <img
                    src={post.cover_image_key.startsWith('http') ? post.cover_image_key : `${apiBaseUrl}${post.cover_image_key}`}
                    alt={post.title}
                  />
                </div>
              )}
              <div className="blog-card-content">
                <div className="blog-card-tags">
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag.id} className="badge badge-gray">{tag.name}</span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="badge badge-gray">+{post.tags.length - 3}</span>
                  )}
                </div>
                <h3 className="blog-card-title">{post.title}</h3>
                <p className="blog-card-excerpt">{getExcerpt(post.content)}</p>
                <div className="blog-card-footer">
                  <div className="blog-card-author">
                    <div className="author-avatar">
                      {(post.author.first_name || post.author.email[0]).toUpperCase()}
                    </div>
                    <div className="author-info">
                      <span className="author-name">
                        {post.author.first_name || post.author.email.split('@')[0]}
                      </span>
                      <span className="post-date">
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}