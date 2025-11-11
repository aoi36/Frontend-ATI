import React, { useState, useEffect } from "react" // Ensure React is imported
import Card from "../components/Card"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorAlert from "../components/ErrorAlert"
import { apiCall } from "../utils/api"
import ReactMarkdown from 'react-markdown';
import "./AIToolsPage.css" // Make sure this CSS file exists

function AIToolsPage() {
  const [activeTab, setActiveTab] = useState("summarize")
  const [file, setFile] = useState(null) // For file uploads (summarize, questions, hint)
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // State for homework grader
  const [answerText, setAnswerText] = useState('');
  const [answerFile, setAnswerFile] = useState(null);
  const [courseFiles, setCourseFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);

  // State for courses and selected course ID
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [loadingCourses, setLoadingCourses] = useState(true)

  // Fetch courses when the component loads
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true)
        const data = await apiCall("/api/courses")
        setCourses(data || [])
      } catch (err) {
        setError(err.message || "Failed to load courses list")
      } finally {
        setLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [])

  // Fetch files when a course is selected for the homework grader
  useEffect(() => {
    if (activeTab === 'homework' && selectedCourseId) {
      const fetchFiles = async () => {
        try {
          setLoadingFiles(true);
          setCourseFiles([]);
          setSelectedFile('');
          const data = await apiCall(`/api/course/${selectedCourseId}/files`);
          setCourseFiles(data || []);
        } catch (err) {
          setError(err.message || 'Failed to load course files.');
        } finally {
          setLoadingFiles(false);
        }
      };
      fetchFiles();
    }
  }, [activeTab, selectedCourseId]);


  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validExtensions = [".txt", ".pdf", ".docx", ".pptx"]
      const fileExtension = "." + selectedFile.name.split(".").pop().toLowerCase()
      if (validExtensions.includes(fileExtension)) {
        setFile(selectedFile); setError(null)
      } else {
        setError("Invalid file type. Please upload: TXT, PDF, DOCX, or PPTX"); setFile(null)
      }
    }
  }

  const handleAnswerFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setAnswerFile(selectedFile);
        setError(null);
    }
  };

  // Centralized submit handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (activeTab !== 'homework' && !file) {
      setError("Please select a file to upload.")
      return
    }
    if (!selectedCourseId) {
      setError("Please select a course")
      return
    }

    let endpoint = ""
    const formData = new FormData()
    let sourceFileName = file?.name;

    if (activeTab === "summarize") {
        endpoint = "/api/summarize_upload";
        formData.append("file", file);
    } else if (activeTab === "questions") {
        endpoint = "/api/generate_questions";
        formData.append("file", file);
    } else if (activeTab === "hint") {
        endpoint = "/api/get_hint";
        formData.append("file", file);
    } else if (activeTab === "homework") {
        endpoint = "/api/homework/grade";
        if (!selectedFile) {
            setError("Please select the homework file from the list.");
            return;
        }
        if (!answerText && !answerFile) {
            setError("Please provide an answer as text or a file.");
            return;
        }
        formData.append('filename', selectedFile);
        sourceFileName = selectedFile;
        if (answerText) formData.append('answer_text', answerText);
        if (answerFile) formData.append('answer_file', answerFile);
    } else return;

    formData.append("course_id", selectedCourseId)

    if (activeTab === "hint") {
      if (!question.trim()) {
        setError("Please enter a question")
        return
      }
      formData.append("question", question)
    }

    // --- Make API Call ---
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      
      const data = await apiCall(endpoint, {
        method: "POST",
        body: formData,
        isFormData: true,
      })

      setResult({ ...data, source_file: sourceFileName });

    } catch (err) {
      setError(err.message || "Failed to process file")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-tools-page">
      <h1 className="page-title">AI Learning Tools</h1>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="tools-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "summarize" ? "active" : ""}`}
            onClick={() => { setActiveTab("summarize"); setResult(null); setFile(null); }}
          >
            Summarizer
          </button>
          <button
            className={`tab ${activeTab === "questions" ? "active" : ""}`}
            onClick={() => { setActiveTab("questions"); setResult(null); setFile(null); }}
          >
            Question Generator
          </button>
          <button
            className={`tab ${activeTab === "hint" ? "active" : ""}`}
            onClick={() => { setActiveTab("hint"); setResult(null); setFile(null); }}
          >
            Homework Hints
          </button>
          <button
            className={`tab ${activeTab === "homework" ? "active" : ""}`}
            onClick={() => { setActiveTab("homework"); setResult(null); setFile(null); }}
          >
            Homework Grader
          </button>
        </div>

        <div className="tools-content">
          <div className="tool-panel">
            <Card>
              <form onSubmit={handleSubmit} className="tool-form">
                
                {/* --- Course Selection Dropdown --- */}
                <div className="form-group">
                  <label className="form-label">1. Select Course</label>
                  {loadingCourses ? (
                    <LoadingSpinner />
                  ) : (
                    <select
                      className="form-input"
                      value={selectedCourseId} // Binds to the state (which holds the ID)
                      onChange={(e) => setSelectedCourseId(e.target.value)} // Updates state with the ID
                      required
                    >
                      <option value="" disabled>-- Select a course --</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.course_id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* --- File Upload Group (for most tabs) --- */}
                {activeTab !== 'homework' && (
                  <div className="form-group">
                    <label className="form-label">2. Upload Document</label>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="file-input"
                        className="file-input"
                        onChange={handleFileChange}
                        accept=".txt,.pdf,.docx,.pptx"
                      />
                      <label htmlFor="file-input" className="file-label">
                        {file ? `📄 ${file.name}` : "📁 Choose File"}
                      </label>
                    </div>
                    <p className="file-hint">Supported: TXT, PDF, DOCX, PPTX</p>
                  </div>
                )}

                {/* --- Homework Grader Inputs --- */}
                {activeTab === 'homework' && (
                    <>
                        <div className="form-group">
                            <label className="form-label">2. Select Homework File</label>
                            {loadingFiles ? <LoadingSpinner /> : (
                                <select
                                    className="form-input"
                                    value={selectedFile}
                                    onChange={(e) => setSelectedFile(e.target.value)}
                                    required
                                    disabled={!selectedCourseId}
                                >
                                    <option value="" disabled>-- Select a file --</option>
                                    {courseFiles.map((fileName) => (
                                        <option key={fileName} value={fileName}>
                                            {decodeURIComponent(fileName)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">3. Your Answer (Text)</label>
                            <textarea
                                className="form-input"
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="Type your answer here..."
                                rows="5"
                                disabled={!!answerFile}
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Or Upload Your Answer (File)</label>
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="answer-file-input"
                                    className="file-input"
                                    onChange={handleAnswerFileChange}
                                    disabled={!!answerText}
                                />
                                <label htmlFor="answer-file-input" className="file-label">
                                  {answerFile ? `📄 ${answerFile.name}` : "📁 Choose Answer File"}
                                </label>
                            </div>
                        </div>
                    </>
                )}

                {/* --- Hint Question Textarea --- */}
                {activeTab === "hint" && (
                  <div className="form-group">
                    <label className="form-label">3. Your Question</label>
                    <textarea
                      className="form-input"
                      placeholder="Enter your homework question or what you're stuck on..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows="4"
                      required
                    />
                  </div>
                )}

                <button type="submit" className="submit-button" disabled={loading || loadingCourses}>
                  {loading ? "Processing..." : 
                   activeTab === "summarize" ? "Summarize" :
                   activeTab === "questions" ? "Generate Questions" :
                   activeTab === "hint" ? "Get Hint" :
                   "Grade Homework"
                  }
                </button>
              </form>
            </Card>
          </div>

          <div className="result-panel">
            {loading ? (
              <LoadingSpinner />
            ) : result ? (
              <Card title={`Result for "${decodeURIComponent(result.source_file)}"`}>
                <div className="result-content">
                  
                  {activeTab === "summarize" && result.summary && (
                    <div className="summary-list">
                      <strong>Summary:</strong>
                      <ul>
                        {result.summary?.map((item, idx) => <li key={idx}>{item}</li>) || <li>No summary.</li>}
                      </ul>
                      <strong>Key Topics:</strong>
                      <ul>
                        {result.key_topics?.map((item, idx) => <li key={idx}>{item}</li>) || <li>No topics.</li>}
                      </ul>
                    </div>
                  )}

                  {activeTab === "hint" && result.hint && (
                    <p className="result-text">{result.hint}</p>
                  )}
                  
                  {activeTab === "questions" && result.review_questions && (
                    <div className="questions-list">
                      {result.review_questions.map((q, idx) => (
                        <div key={idx} className="question-item">
                          <p className="question-text">
                            <strong>Q{idx + 1}:</strong> {q.question}
                          </p>
                          {q.options && (
                            <ul className="options-list">
                              {q.options.map((opt, optIdx) => (
                                <li 
                                  key={optIdx} 
                                  className={opt === q.correct_answer ? 'correct-answer' : ''}
                                >
                                  {opt}
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="explanation-text">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}


                  {activeTab === 'homework' && result.score && (
                    <div className="grading-result">
                        <div className="result-section">
                            <h4>Score</h4>
                            <p>{result.score}</p>
                        </div>
                        <div className="result-section">
                            <h4>Feedback</h4>
                            <ReactMarkdown>{result.feedback}</ReactMarkdown>
                        </div>
                        <div className="result-section">
                            <h4>Explanation</h4>
                            <ReactMarkdown>{result.explanation}</ReactMarkdown>
                        </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="placeholder">
                <p>Results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIToolsPage