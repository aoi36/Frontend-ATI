// src/pages/CourseDetailPage.jsx

import React, { useState, useEffect } from "react"
import { apiCall } from "../utils/api"
import Card from "../components/Card"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorAlert from "../components/ErrorAlert"
// import "./CourseDetailPage.css" // You'll want to create this CSS file

function CourseDetailPage({ course, setCurrentPage }) {
  const [deadlines, setDeadlines] = useState([])
  const [files, setFiles] = useState([])
  const [aiContent, setAiContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCourseDetails = async () => {
      
      
      // --- [FIX #1] ---
      // Your API sends 'id', not 'course_id'.
      if (!course || !course.course_id) { 
      // --- [END FIX] ---
        setError("No course selected.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true)
        setError(null)
        
        // --- [FIX #2] ---
        // Use course.course_id in all API calls
        const [deadlinesData, filesData, aiContentData] = await Promise.all([
          apiCall(`/api/deadlines/${course.course_id}`),
          apiCall(`/api/course/${course.course_id}/files`),
          apiCall(`/api/course/${course.course_id}/content`)
        ])
        // --- [END FIX] ---

        setDeadlines(deadlinesData || [])
        setFiles(filesData || [])
        setAiContent(aiContentData || [])
        
      } catch (err) {
        setError(err.message || "Failed to load course details")
      } finally {
        setLoading(false)
      }
    }

    fetchCourseDetails()
  // --- [FIX #3] ---
  // Dependency array must also use course.course_id
  }, [course.course_id]) 
  // --- [END FIX] ---

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onDismiss={() => setError(null)} />

  // Helper to render AI content
  const renderAiContent = (item) => {
    try {
      const content = JSON.parse(item.content_json);
      if (item.type === 'summary') {
        return (
          <>
            <strong>Summary:</strong>
            <ul>{content.summary?.map((pt, i) => <li key={i}>{pt}</li>) || <li>N/A</li>}</ul>
            <strong>Key Topics:</strong>
            <ul>{content.key_topics?.map((pt, i) => <li key={i}>{pt}</li>) || <li>N/A</li>}</ul>
          </>
        )
      }
      if (item.type === 'questions') {
        return (
          <div className="questions-list">
            {content.review_questions?.map((q, i) => (
              <div key={i} className="question-item">
                <p><strong>Q{i+1}: {q.question}</strong></p>
                <ul>
                  {q.options.map((opt, oi) => <li key={oi}>{opt}</li>)}
                </ul>
                <p><em>Answer: {q.correct_answer}</em></p>
                <p><em>Explanation: {q.explanation}</em></p>
              </div>
            ))}
          </div>
        )
      }
      if (item.type === 'hint') {
        return (
          <>
            <p><strong>Your Question:</strong> {item.user_question}</p>
            <p><strong>Hint:</strong> {content.hint}</p>
          </>
        )
      }
    } catch (e) { return <p>Error parsing AI content.</p> }
  }

  return (
    <div className="course-detail-page">
      <button onClick={() => setCurrentPage("courses")} className="back-button">
        &larr; Back to All Courses
      </button>

      <h1 className="page-title">{course.name}</h1>
      
      <Card title="Upcoming Deadlines" className="detail-card">
        {deadlines.length > 0 ? (
          <ul>
            {deadlines.map((d) => (
              <li key={d.id} className={d.status === 'Overdue' ? 'overdue' : 'upcoming'}>
                <strong>{d.status}:</strong> {d.time_string}
                {d.parsed_iso_date && <span> (Due: {new Date(d.parsed_iso_date).toLocaleString()})</span>}
                <a href={d.url} target="_blank" rel="noopener noreferrer"> (Link)</a>
              </li>
            ))}
          </ul>
        ) : <p>No deadlines found for this course.</p>}
      </Card>

      <Card title="Scraped Files" className="detail-card">
        {files.length > 0 ? (
          <ul className="file-list">
            {files.map((filename, i) => (
              <li key={i}>
                {/* --- [FIX #4] --- */}
                {/* Use course.course_id here as well */}
                <a href={`${import.meta.env.VITE_API_URL}/api/get_file/${course.course_id}/${encodeURIComponent(filename)}`}
                   target="_blank" 
                   rel="noopener noreferrer"
                   download={filename}
                >
                  {decodeURIComponent(filename)}
                </a>
                {/* --- [END FIX] --- */}
              </li>
            ))}
          </ul>
        ) : <p>No files found for this course.</p>}
      </Card>

      <Card title="Your AI-Generated Content" className="detail-card">
        {aiContent.length > 0 ? (
          <div className="ai-content-list">
            {aiContent.map((item) => (
              <div key={item.id} className="ai-content-item">
                <h4>{item.type.toUpperCase()} for "{item.source_file}"</h4>
                <p><em>(Generated on {new Date(item.created_at).toLocaleString()})</em></p>
                <div className="ai-content-body">
                  {renderAiContent(item)}
                </div>
              </div>
            ))}
          </div>
        ) : <p>No summaries, questions, or hints generated for this course yet.</p>}
      </Card>
    </div>
  )
}

export default CourseDetailPage