import React, { useState, useEffect } from 'react';
import './FlashcardsPage.css';
import { apiCall } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const FlashcardsPage = ({ courseId, fileId, setCurrentPage }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showingAnswer, setShowingAnswer] = useState(false);

  useEffect(() => {
    if (courseId && fileId) {
      loadFlashcards();
    }
  }, [courseId, fileId]);

  const loadFlashcards = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiCall(`/api/courses/${courseId}/files/${fileId}/flashcards`, { method: 'POST' });
      if (response.flashcards && response.flashcards.length > 0) {
        setFlashcards(response.flashcards);
      } else {
        setError('No flashcards generated. The file might not contain suitable content.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowingAnswer(!showingAnswer);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowingAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowingAnswer(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      handleFlip();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isFlipped, flashcards]);

  return (
    <div className="flashcards-page">
      <button onClick={() => setCurrentPage("course-detail")} className="back-button">
        &larr; Back
      </button>

      <div className="flashcards-header">
        <h1>🎴 AI Flashcards</h1>
        <p>Study with AI-generated flashcards for: <strong>{decodeURIComponent(fileId)}</strong></p>
      </div>

      {loading && <LoadingSpinner message="Analyzing document and creating flashcards..." />}
      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {flashcards.length > 0 && !loading && (
        <div className="flashcard-viewer">
          <div className="flashcard-progress">
            Card {currentIndex + 1} of {flashcards.length}
          </div>

          <div
            className={`flashcard ${isFlipped ? 'flipped' : ''}`}
            onClick={handleFlip}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <div className="flashcard-category">
                  {flashcards[currentIndex].category}
                </div>
                <h2>{flashcards[currentIndex].term}</h2>
                <p className="flashcard-hint">Click or press Space to reveal</p>
              </div>
              <div className="flashcard-back">
                <div className="flashcard-category">
                  {flashcards[currentIndex].category}
                </div>
                <h3>{flashcards[currentIndex].term}</h3>
                <p>{flashcards[currentIndex].definition}</p>
              </div>
            </div>
          </div>

          <div className="flashcard-controls">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="nav-btn"
            >
              ← Previous
            </button>
            <button onClick={handleFlip} className="flip-btn">
              {showingAnswer ? '🔄 Show Term' : '🔄 Show Definition'}
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="nav-btn"
            >
              Next →
            </button>
          </div>

          <div className="keyboard-hints">
            <span>Space: Flip</span>
            <span>←→: Navigate</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsPage;
