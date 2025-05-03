import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Card,
  CardContent,
  CardActions,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Box,
  useTheme,
  Chip,
  CircularProgress,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Note as NoteIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchNotes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        logout();
        navigate('/login');
        return;
      }

      console.log('Fetching notes with token:', token.substring(0, 10) + '...');
      const response = await axios.get('http://localhost:3000/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Notes fetched:', response.data);
      if (response.data) {
        setNotes(response.data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.log('Unauthorized access, logging out');
        logout();
        navigate('/login');
      } else {
        console.error('Failed to fetch notes:', error);
      }
    }
  }, [logout, navigate]);

  // Set up axios defaults with token and fetch notes on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      navigate('/login');
      return;
    }
    console.log('Component mounted, fetching notes...');
    fetchNotes();
  }, [fetchNotes, logout, navigate]);

  const handleSavedNotes = async () => {
    try {
      await fetchNotes();
    } catch (error) {
      console.error('Error fetching saved notes:', error);
      alert('Failed to fetch saved notes. Please try again.');
    }
  };

  const generateAISummary = async (content) => {
    try {
      setIsProcessing(true);
      const response = await axios.post('http://localhost:3000/api/ai/summarize', {
        content
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.summary;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return generateSummary(content); // Fallback to basic summary
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAITags = async (content) => {
    try {
      const response = await axios.post('http://localhost:3000/api/ai/tags', {
        content
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.tags;
    } catch (error) {
      console.error('Error generating AI tags:', error);
      return [];
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/login');
        return;
      }

      // Generate AI summary and tags
      const [summaryResponse, tagsResponse] = await Promise.all([
        axios.post('http://localhost:3000/api/ai/summarize', 
          { content: content.trim() },
          { headers: { 'Authorization': `Bearer ${token}` } }
        ),
        axios.post('http://localhost:3000/api/ai/tags',
          { content: content.trim() },
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
      ]);

      const noteData = {
        title: title.trim(),
        content: content.trim(),
        summary: summaryResponse.data.summary,
        tags: tagsResponse.data.tags
      };

      let response;
      if (editingNote) {
        response = await axios.put(
          `http://localhost:3000/api/notes/${editingNote._id}`,
          noteData,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          'http://localhost:3000/api/notes',
          noteData,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
      }

      if (response.data) {
        setOpenDialog(false);
        setTitle('');
        setContent('');
        setEditingNote(null);
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error saving note:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setOpenDialog(true);
  };

  const handleDelete = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/login');
        return;
      }

      await axios.delete(`http://localhost:3000/api/notes/${noteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await fetchNotes();
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:3000/api/notes/search/${encodeURIComponent(searchQuery.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Error searching notes:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  // Add search on Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const generateSummary = (content) => {
    if (!content) return '';
    
    // Remove extra whitespace and newlines
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    
    // Split into sentences
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return '';
    
    // Take the first sentence
    let summary = sentences[0].trim();
    
    // If the first sentence is too long, take first 15 words
    const words = summary.split(' ');
    if (words.length > 15) {
      summary = words.slice(0, 15).join(' ') + '...';
    }
    
    return summary;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // You can add theme switching logic here if using ThemeProvider
  };

  return (
    <div style={{ backgroundColor: darkMode ? '#121212' : '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" color={darkMode ? "default" : "primary"}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Smart Notes
          </Typography>
          <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 2 }}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<NoteIcon />}
            onClick={fetchNotes}
            sx={{ mr: 2 }}
          >
            Refresh Notes
          </Button>
          <IconButton color="inherit" onClick={handleLogout} aria-label="logout">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: darkMode ? 'white' : 'inherit',
                    '& fieldset': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'inherit',
                    },
                    '&:hover fieldset': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'inherit',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: darkMode ? 'primary.main' : 'inherit',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'inherit',
                    opacity: 1,
                  },
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }} />,
                  endAdornment: (
                    <IconButton onClick={handleSearch} edge="end" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'inherit' }}>
                      <SearchIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingNote(null);
                  setTitle('');
                  setContent('');
                  setOpenDialog(true);
                }}
              >
                Add Note
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {notes.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  No notes found. Create your first note!
                </Typography>
              </Paper>
            </Grid>
          ) : (
            notes.map((note) => (
              <Grid item xs={12} sm={6} md={4} key={note._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {note.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {note.content}
                    </Typography>
                    {note.summary && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Summary:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {note.summary}
                        </Typography>
                      </>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {note.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" onClick={() => handleEdit(note)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(note._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Content"
              fullWidth
              multiline
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <NoteIcon />}
            >
              {isProcessing ? 'Processing...' : (editingNote ? 'Update' : 'Save')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default Dashboard; 


